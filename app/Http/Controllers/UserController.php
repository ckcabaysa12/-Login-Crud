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
            // Handle permissions as array and convert to JSON for storage
            $user->permissions = isset($validated['permissions']) ? $validated['permissions'] : [];
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
        // Validate the incoming request
        $request->validate([
            'permission' => 'required|string',
            'value' => 'present', // 'present' ensures field exists even if it's false/0
        ]);

        $permission = $request->input('permission');
        // Cast to boolean explicitly to handle the 1/0 from frontend
        $isChecked = filter_var($request->value, FILTER_VALIDATE_BOOLEAN);

        // Ensure permissions is cast as an array
        $currentPermissions = $user->permissions ?? [];
        
        if (is_string($currentPermissions)) {
            $currentPermissions = json_decode($currentPermissions, true) ?? [];
        }

        if ($isChecked) {
            // Add permission if it's not already there
            if (!in_array($permission, $currentPermissions)) {
                $currentPermissions[] = $permission;
            }
        } else {
            // Remove permission
            $currentPermissions = array_diff($currentPermissions, [$permission]);
        }

        // Update user and reset array keys
        $user->update([
            'permissions' => array_values($currentPermissions)
        ]);

        return back();
    }
}