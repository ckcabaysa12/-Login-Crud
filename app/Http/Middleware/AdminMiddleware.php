<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. If not logged in, go to login
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 2. MASTER ADMIN OVERRIDE
        // The Master Admin should always pass, regardless of status or role string
        if ($user->email === 'admin@gmail.com') {
            return $next($request);
        }

        // 3. Check for standard Admin access
        // They must have the 'admin' role AND be active
        if ($user->role === 'admin' && $user->status === 'active') {
            return $next($request);
        }

        // 4. If they are logged in but NOT active, send to waiting page
        // Use 'status' instead of 'is_active' if that's what your DB uses (based on your Dashboard.jsx)
        if ($user->status !== 'active') {
            return redirect()->route('waiting.approval');
        }

        // 5. If they are active but NOT an admin, stop them with 403
        // Aborting is safer than redirecting during a PATCH/DELETE request
        abort(403, 'Unauthorized access.');
    }
}