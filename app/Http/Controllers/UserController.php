<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display the dashboard with a list of users.
     * Permission: Master Admin sees everyone. Others see based on 'read' toggle.
     */
    public function index()
    {
        // Debug: Log the request method and URI
        \Illuminate\Support\Facades\Log::info('Dashboard accessed', [
            'method' => request()->method(),
            'uri' => request()->path(),
            'ajax' => request()->ajax(),
            'inertia' => request()->header('X-Inertia'),
        ]);
        
        $user = Auth::user();
        
        // Safety check: if somehow reached without auth, redirect to login
        if (!$user) {
            return redirect()->route('login');
        }

        $isMasterAdmin = ($user->email === 'admin@gmail.com');
        $isAdmin = ($user->role === 'admin' || $isMasterAdmin);

        // Logic: Check if user has 'read' permission toggle checked
        $permissions = $user->permissions ?? [];
        $hasReadPermission = isset($permissions['read']) && (bool)$permissions['read'] === true;
        
        // Master Admin or users with 'read' checkbox can see the list
        $canReadAll = $isMasterAdmin || $hasReadPermission;

        $users = $canReadAll 
            ? User::all() 
            : User::where('id', $user->id)->get();

        $mappedUsers = $users->map(function ($u) {
            $permissions = is_string($u->permissions) ? json_decode($u->permissions, true) : ($u->permissions ?? []);
            $canDelete = isset($permissions['delete']) && (bool)$permissions['delete'];
            
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'username' => $u->username,
                'status' => $u->status,
                'role' => $u->role,
                'joined_date' => $u->created_at ? $u->created_at->format('M d, Y') : 'N/A',
                'permissions' => $permissions,
                'can_delete' => $canDelete,
            ];
        });

        // Route to appropriate view based on user role
        if ($isMasterAdmin || $isAdmin) {
            // Admin users get the Dashboard with user management
            return Inertia::render('Dashboard', [
                // --- FORCED AUTH BRIDGE ---
                // This fixes "Session Lost" by passing user directly if middleware fails
                'auth' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'permissions' => is_string($user->permissions) ? json_decode($user->permissions, true) : ($user->permissions ?? ['read' => false, 'create' => false, 'update' => false, 'delete' => false]),
                    ],
                ],
                'users' => $mappedUsers,
                'isMasterAdmin' => $isMasterAdmin,
                'canReadAll' => $canReadAll, 
            ]);
        } else {
            // Staff (Customer) users get the Customer Home view
            return Inertia::render('Customer/Home', [
                'auth' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'permissions' => is_string($user->permissions) ? json_decode($user->permissions, true) : ($user->permissions ?? ['read' => false, 'create' => false, 'update' => false, 'delete' => false]),
                    ],
                ],
                'users' => $mappedUsers,
                'isMasterAdmin' => $isMasterAdmin,
                'canReadAll' => $canReadAll, 
            ]);
        }
    }

    /**
     * Display the user management interface (Admin only).
     */
    public function usersManagement()
    {
        $user = Auth::user();
        
        if (!$user || $user->email !== 'admin@gmail.com') {
            abort(403, 'Unauthorized.');
        }

        $users = User::all()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'username' => $u->username,
                'status' => $u->status,
                'role' => $u->role,
                'joined_date' => $u->created_at ? $u->created_at->format('M d, Y') : 'N/A',
                'permissions' => is_string($u->permissions) ? json_decode($u->permissions, true) : ($u->permissions ?? [
                    'read' => false, 
                    'create' => false, 
                    'update' => false, 
                    'delete' => false
                ]),
            ];
        });

        return Inertia::render('UsersManagement', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'permissions' => is_string($user->permissions) ? json_decode($user->permissions, true) : ($user->permissions ?? ['read' => false, 'create' => false, 'update' => false, 'delete' => false]),
                ],
            ],
            'users' => $users,
            'isMasterAdmin' => true,
        ]);
    }

    /**
     * Store a new user (usually for Admin adding staff/customers manually).
     */
    public function store(Request $request)
    {
        $authenticatedUser = Auth::user();
        
        if (!$authenticatedUser || $authenticatedUser->email !== 'admin@gmail.com') {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
            'permissions' => 'required|array', 
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'status' => 'active', 
            'permissions' => $validated['permissions'], 
        ]);

        return redirect()->back()->with('message', 'User created successfully!');
    }

    /**
     * SAVE Action: General profile updates or Admin editing a user.
     */
    public function update(Request $request, User $user)
    {
        $authenticatedUser = Auth::user();
        $isMasterAdmin = ($authenticatedUser->email === 'admin@gmail.com');

        $allowedPermissions = ['create', 'read', 'update', 'delete'];
        $targetIsProtected = ($user->email === 'admin@gmail.com' || $user->id === 1);

        // Individual permission toggle support (permission/value only)
        if ($request->has('permission') && $request->has('value')) {
            if (!$isMasterAdmin) {
                abort(403, 'Unauthorized.');
            }

            $request->validate([
                'permission' => 'required|string|in:create,read,update,delete',
                'value' => 'required', // may be 1/0 from frontend
            ]);

            if ($targetIsProtected) {
                return redirect()->back()->with('message', 'Permissions unchanged.');
            }

            $permission = $request->input('permission');
            $isChecked = filter_var($request->input('value'), FILTER_VALIDATE_BOOLEAN);

            $currentPermissions = $user->permissions ?? [];
            if (is_string($currentPermissions)) {
                $currentPermissions = json_decode($currentPermissions, true) ?? [];
            }

            // Normalize current permissions into an array of enabled permission keys
            $normalized = [];
            if (is_array($currentPermissions)) {
                $keys = array_keys($currentPermissions);
                $isAssoc = $keys !== range(0, count($currentPermissions) - 1);

                if ($isAssoc) {
                    foreach ($allowedPermissions as $key) {
                        if (!empty($currentPermissions[$key])) {
                            $normalized[] = $key;
                        }
                    }
                } else {
                    foreach ($currentPermissions as $p) {
                        if (in_array($p, $allowedPermissions, true)) {
                            $normalized[] = $p;
                        }
                    }
                }
            }

            if ($isChecked) {
                if (!in_array($permission, $normalized, true)) {
                    $normalized[] = $permission;
                }
            } else {
                $normalized = array_values(array_diff($normalized, [$permission]));
            }

            $user->permissions = array_values($normalized);
            $user->save();

            return redirect()->back()->with('message', 'User permissions updated successfully.');
        }

        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$user->id,
            'username' => 'required|string|max:255|unique:users,username,'.$user->id,
        ];

        // Only Master Admin can change roles/permissions
        if ($isMasterAdmin) {
            $rules['role'] = 'required|string';
            $rules['permissions'] = 'required|array';
        }

        $validated = $request->validate($rules);

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->username = $validated['username'];

        if ($isMasterAdmin) {
            $user->role = $validated['role'];
            if (!$targetIsProtected) {
                $rawPermissions = isset($validated['permissions']) ? $validated['permissions'] : [];

                $normalizedPermissions = [];
                if (is_array($rawPermissions)) {
                    $keys = array_keys($rawPermissions);
                    $isAssoc = $keys !== range(0, count($rawPermissions) - 1);

                    if ($isAssoc) {
                        foreach ($allowedPermissions as $key) {
                            if (!empty($rawPermissions[$key])) {
                                $normalizedPermissions[] = $key;
                            }
                        }
                    } else {
                        foreach ($rawPermissions as $p) {
                            if (in_array($p, $allowedPermissions, true)) {
                                $normalizedPermissions[] = $p;
                            }
                        }
                    }
                }

                $user->permissions = array_values($normalizedPermissions);
            }
        }

        $user->save();

        // If permissions were updated, reload to refresh the UI
        if ($isMasterAdmin && isset($validated['permissions'])) {
            return redirect()->back()->with('message', 'User updated successfully.');
        }

        return redirect()->back()->with('message', 'User updated successfully.');
    }

    /**
     * APPROVE Action
     */
    public function approve(Request $request, User $user)
    {
        $authenticatedUser = Auth::user();
        
        if (!$authenticatedUser || $authenticatedUser->email !== 'admin@gmail.com') {
            abort(403, 'Unauthorized.');
        }

        $user->update([
            'status' => 'active',
            'role' => $request->role,
            'permissions' => $request->permissions,
        ]);

        return back()->with('message', 'User approved successfully!');
    }

    /**
     * DELETE Action
     */
    public function destroy(User $user)
    {
        $authenticatedUser = Auth::user();
        
        // Master Admin can always delete
        if ($authenticatedUser->email === 'admin@gmail.com') {
            if ($user->email === 'admin@gmail.com') {
                return redirect()->back()->withErrors(['error' => 'Cannot delete master admin.']);
            }
            $user->delete();
            return redirect()->route('dashboard')->with('message', 'User deleted successfully.');
        }

        // Check if authenticated user has delete permission
        $permissions = $authenticatedUser->permissions ?? [];
        if (is_string($permissions)) {
            $permissions = json_decode($permissions, true) ?? [];
        }
        
        if (!isset($permissions['delete']) || !$permissions['delete']) {
            abort(403, 'You do not have permission to delete users.');
        }

        if ($user->email === 'admin@gmail.com') {
            return redirect()->back()->withErrors(['error' => 'Cannot delete master admin.']);
        }

        $user->delete();
        
        // For Inertia.js, it's better to redirect to a specific route after DELETE
        // This ensures a fresh GET request to load the updated state
        return redirect()->route('dashboard')->with('message', 'User deleted successfully.');
    }

    /**
     * UPDATE PERMISSIONS: Handle individual permission changes from frontend
     */
    public function updatePermissions(Request $request, User $user)
    {
        // Safety Guard: do not change Master Admin permissions
        if ($user->id === 1 || $user->email === 'admin@gmail.com') {
            return back();
        }

        $request->validate([
            'permissions' => 'required|array',
        ]);

        $user->update([
            'permissions' => $request->permissions,
        ]);

        return back();
    }
}