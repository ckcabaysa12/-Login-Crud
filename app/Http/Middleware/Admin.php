<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Admin
{
    /**
     * Handle an incoming request.
     *
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        // Check if user is authenticated and is admin
        if (! $user || ($user->email !== 'admin@gmail.com' && $user->role !== 'admin')) {
            // Return 403 Forbidden instead of 404
            abort(403, 'Admin access required.');
        }

        return $next($request);
    }
}
