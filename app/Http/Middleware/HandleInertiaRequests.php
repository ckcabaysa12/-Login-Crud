<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $permissionSlugs = $user ? $user->permissionSlugs() : [];

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'role' => $user->role,
                    'status' => $user->status,
                    'location' => $user->location,
                    'permissions' => $permissionSlugs,
                    'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                    'created_at' => $user->created_at?->toIso8601String(),
                    'last_login_at' => $user->last_login_at?->toIso8601String(),
                    'last_login_ip' => $user->last_login_ip,
                ] : null,
            ],
            'isMasterAdmin' => $user?->isMasterAdmin() ?? false,
            'canViewUserManagement' => $user?->canAccessUserManagement() ?? false,
            'flash' => $request->session()->pull('flash'),
        ];
    }
}
