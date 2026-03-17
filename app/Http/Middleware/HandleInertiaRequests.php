<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
  // app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    $user = $request->user();

    return [
        ...parent::share($request),
        'auth' => [
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                // Ensure permissions are always an object/array, never a string
                'permissions' => is_string($user->permissions) 
                    ? json_decode($user->permissions, true) 
                    : $user->permissions,
            ] : null,
        ],
        // Forced boolean check
        'isMasterAdmin' => $user ? ($user->email === 'admin@gmail.com') : false,
    ];
}
}
