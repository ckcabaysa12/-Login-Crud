<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserCanAccessUserManagement
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(403);
        }

        if (! $user->canAccessUserManagement()) {
            if ($request->expectsJson()) {
                abort(403, 'You do not have access to user management.');
            }

            return redirect()->route('home');
        }

        return $next($request);
    }
}
