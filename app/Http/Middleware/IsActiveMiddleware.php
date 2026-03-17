<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class IsActiveMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            // 1. Let the Master Admin bypass EVERYTHING
            if ($user->email === 'admin@gmail.com') {
                return $next($request);
            }

            // 2. Check if the user is active
            if ($user->status !== 'active') {
                
                // Allow them to visit the waiting page, logout, or manage their own profile
                if ($request->routeIs('waiting.approval', 'logout', 'profile.*')) {
                    return $next($request);
                }

                // If it's an AJAX/Inertia request (like a PATCH or DELETE from your dashboard)
                // it is better to return a 403 or 401 than a redirect to prevent Method collisions.
                if ($request->expectsJson() || $request->header('X-Inertia')) {
                    abort(403, 'Your account is pending approval.');
                }

                return redirect()->route('waiting.approval');
            }
        }

        return $next($request);
    }
}