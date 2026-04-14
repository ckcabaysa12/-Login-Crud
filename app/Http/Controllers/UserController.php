<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Models\User;
use App\Models\UserManagementActivity;
use App\Support\UserManagementActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private const USERS_PER_PAGE = 10;

    private function isMasterAdmin(?User $user): bool
    {
        return $user && $user->email === 'admin@gmail.com';
    }

    private function canReadUsers(User $actor): bool
    {
        return $actor->canAccessUserManagement() && (
            $this->isMasterAdmin($actor) || in_array('read', $actor->permissionSlugs(), true)
        );
    }

    private function canCreateUsers(User $actor): bool
    {
        return $this->isMasterAdmin($actor) || in_array('create', $actor->permissionSlugs(), true);
    }

    private function canUpdateUsers(User $actor): bool
    {
        return $this->isMasterAdmin($actor) || in_array('update', $actor->permissionSlugs(), true);
    }

    private function canDeleteUsers(User $actor): bool
    {
        return $this->isMasterAdmin($actor) || in_array('delete', $actor->permissionSlugs(), true);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUser(User $user, User $actor): array
    {
        $perms = $user->permissionSlugs();
        $targetIsMaster = $this->isMasterAdmin($user);

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'role' => $user->role,
            'status' => $user->status,
            'permissions' => $perms,
            'location' => $user->location ?? '',
            'joinedDate' => $user->created_at?->format('F j, Y') ?? '',
            'can_update' => $this->isMasterAdmin($actor)
                || ($this->canUpdateUsers($actor) && ! $targetIsMaster),
            'can_delete' => $this->isMasterAdmin($actor)
                || ($this->canDeleteUsers($actor) && ! $targetIsMaster),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeActivity(UserManagementActivity $row): array
    {
        $actor = $row->actor;
        $subject = $row->subject;

        return [
            'id' => $row->id,
            'action' => $row->action,
            'properties' => $row->properties ?? [],
            'ip_address' => $row->ip_address,
            'created_at' => $row->created_at?->toIso8601String(),
            'created_at_display' => $row->created_at?->format('M j, Y g:i A') ?? '',
            'actor' => $actor ? [
                'id' => $actor->id,
                'name' => $actor->name,
                'email' => $actor->email,
            ] : null,
            'subject' => $subject ? [
                'id' => $subject->id,
                'name' => $subject->name,
                'email' => $subject->email,
            ] : null,
        ];
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<User>
     */
    private function dashboardUsersQuery(Request $request): \Illuminate\Database\Eloquent\Builder
    {
        $query = User::query();

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $safe = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function ($q) use ($safe) {
                $q->where('name', 'like', $safe)
                    ->orWhere('email', 'like', $safe)
                    ->orWhere('username', 'like', $safe)
                    ->orWhere('location', 'like', $safe);
            });
        }

        $allowedRoles = ['all', 'admin', 'staff', 'customer', 'manager', 'viewer', 'support'];
        $role = strtolower(trim((string) $request->input('role', 'all')));
        if (! in_array($role, $allowedRoles, true)) {
            $role = 'all';
        }

        if ($role !== 'all') {
            if ($role === 'admin') {
                $query->where(function ($q) {
                    $q->where('email', 'admin@gmail.com')
                        ->orWhereRaw('LOWER(role) = ?', ['admin']);
                });
            } else {
                $query->where('email', '!=', 'admin@gmail.com')
                    ->whereRaw('LOWER(role) = ?', [$role]);
            }
        }

        $sort = $request->input('sort', 'newest') === 'oldest' ? 'asc' : 'desc';
        $query->orderBy('id', $sort);

        return $query;
    }

    public function dashboard(Request $request): Response|RedirectResponse
    {
        $actor = $request->user();
        if (! $this->canReadUsers($actor)) {
            return redirect()->route('profile.edit');
        }

        $search = trim((string) $request->input('search', ''));
        $allowedRoles = ['all', 'admin', 'staff', 'customer', 'manager', 'viewer', 'support'];
        $role = strtolower(trim((string) $request->input('role', 'all')));
        if (! in_array($role, $allowedRoles, true)) {
            $role = 'all';
        }

        $sort = $request->input('sort', 'newest') === 'oldest' ? 'oldest' : 'newest';

        $users = $this->dashboardUsersQuery($request)
            ->paginate(self::USERS_PER_PAGE)
            ->withQueryString()
            ->through(fn (User $u) => $this->serializeUser($u, $actor));

        $activityRows = UserManagementActivity::query()
            ->with(['actor', 'subject'])
            ->latest()
            ->limit(75)
            ->get()
            ->map(fn (UserManagementActivity $a) => $this->serializeActivity($a));

        $stats = [
            'total' => User::query()->count(),
            'active' => User::query()->where('status', 'active')->count(),
            'pending' => User::query()->where('status', 'pending')->count(),
            'inactive' => User::query()->where('status', 'inactive')->count(),
        ];

        return Inertia::render('Dashboard', [
            'users' => $users,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'role' => $role,
                'sort' => $sort,
            ],
            'activityLog' => $activityRows->values()->all(),
        ]);
    }

    public function apiIndex(Request $request): JsonResponse
    {
        $actor = $request->user();
        if (! $actor || ! $this->canReadUsers($actor)) {
            abort(403);
        }

        $users = User::query()->orderByDesc('id')->get()->map(fn (User $u) => $this->serializeUser($u, $actor));

        return response()->json($users->values()->all());
    }

    public function apiShow(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        if (! $actor || ! $this->canReadUsers($actor)) {
            abort(403);
        }

        return response()->json($this->serializeUser($user, $actor));
    }

    public function store(UserStoreRequest $request): RedirectResponse
    {
        $actor = $request->user();
        if (! $this->canCreateUsers($actor)) {
            abort(403);
        }

        $data = $request->validated();
        if (! $this->isMasterAdmin($actor)) {
            unset($data['role'], $data['permissions'], $data['status']);
            $data['status'] = 'pending';
            $data['role'] = 'customer';
            $data['permissions'] = User::defaultPermissionsForRole('customer');
        } else {
            $data['permissions'] = User::normalizePermissionFlags(
                $data['permissions'] ?? null,
                $data['role'] ?? 'customer'
            );
        }

        $created = User::create($data);

        UserManagementActivityLogger::log(
            $actor,
            'user_created',
            $created->id,
            [
                'name' => $created->name,
                'email' => $created->email,
            ],
            $request,
        );

        return redirect()->back();
    }

    public function update(UserUpdateRequest $request, User $user): RedirectResponse
    {
        $actor = $request->user();

        if ($this->isMasterAdmin($user) && ! $this->isMasterAdmin($actor)) {
            abort(403);
        }

        if (! $this->isMasterAdmin($actor) && ! $this->canUpdateUsers($actor)) {
            abort(403);
        }

        $data = $request->validated();
        if ($data['password'] === null || $data['password'] === '') {
            unset($data['password']);
        }

        if (! $this->isMasterAdmin($actor)) {
            unset($data['role'], $data['permissions'], $data['status']);
        } else {
            $data['permissions'] = User::normalizePermissionFlags(
                $data['permissions'] ?? null,
                $data['role'] ?? $user->role
            );
        }

        $user->update($data);
        $user->refresh();

        $updatedFields = collect($data)
            ->except(['password'])
            ->keys()
            ->values()
            ->all();

        UserManagementActivityLogger::log(
            $actor,
            'user_updated',
            $user->id,
            [
                'updated_fields' => $updatedFields,
                'target_email' => $user->email,
            ],
            $request,
        );

        return redirect()->back();
    }

    public function approve(Request $request, User $user): RedirectResponse
    {
        $actor = $request->user();
        if (! $this->isMasterAdmin($actor)) {
            abort(403);
        }

        $user->forceFill([
            'status' => 'active',
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        UserManagementActivityLogger::log(
            $actor,
            'user_approved',
            $user->id,
            [
                'email' => $user->email,
            ],
            $request,
        );

        return redirect()->back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $actor = $request->user();

        if ($this->isMasterAdmin($user)) {
            abort(403, 'Cannot delete the master admin account.');
        }

        if (! $this->isMasterAdmin($actor) && ! $this->canDeleteUsers($actor)) {
            abort(403);
        }

        if ($user->id === $actor->id) {
            abort(403);
        }

        UserManagementActivityLogger::log(
            $actor,
            'user_deleted',
            $user->id,
            [
                'name' => $user->name,
                'email' => $user->email,
            ],
            $request,
        );

        $user->delete();

        return redirect()->back();
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $actor = $request->user();
        if (! $this->isMasterAdmin($actor) && ! $this->canDeleteUsers($actor)) {
            abort(403);
        }

        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:users,id'],
        ])['ids'];

        $targets = User::query()
            ->whereIn('id', $ids)
            ->where('email', '!=', 'admin@gmail.com')
            ->where('id', '!=', $actor->id)
            ->get();

        User::query()
            ->whereIn('id', $targets->pluck('id'))
            ->delete();

        if ($targets->isNotEmpty()) {
            UserManagementActivityLogger::log(
                $actor,
                'users_bulk_deleted',
                null,
                [
                    'count' => $targets->count(),
                    'user_ids' => $targets->pluck('id')->values()->all(),
                    'emails' => $targets->pluck('email')->values()->all(),
                ],
                $request,
            );
        }

        return redirect()->back();
    }
}
