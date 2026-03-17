<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckIfActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();

            // 1. BYPASS FOR ADMIN
            // This ensures you can always access the dashboard to manage users.
            if ($user->role === 'admin') {
                return $next($request);
            }

            // 2. USE THE 'STATUS' COLUMN
            // We check if status is NOT 'active' instead of using 'is_active'.
            $isActive = ($user->status === 'active');

            if (!$isActive) {
                // Allow only the waiting page, logout, or form submissions
                if ($request->routeIs('waiting.approval') || $request->is('logout') || $request->method() === 'POST') {
                    return $next($request);
                }

                return redirect()->route('waiting.approval');
            }

            // Case B: User IS active but trying to visit the waiting page
            if ($isActive && $request->routeIs('waiting.approval')) {
                return redirect()->route('dashboard');
            }
        }

        return $next($request);
    }
}