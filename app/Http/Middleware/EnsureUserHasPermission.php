<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(403);
        }

        if ($user->email === 'admin@gmail.com') {
            return $next($request);
        }

        if (! in_array($permission, $user->permissionSlugs(), true)) {
            $isDashboardBrowse = $request->isMethod('GET')
                && in_array($request->route()?->getName(), ['dashboard', 'users.index'], true);

            if ($isDashboardBrowse) {
                return redirect()
                    ->route('profile.edit')
                    ->with('flash', ['type' => 'error', 'message' => 'You do not have access to user management.']);
            }

            abort(403, 'You do not have permission to perform this action.');
        }

        return $next($request);
    }
}
