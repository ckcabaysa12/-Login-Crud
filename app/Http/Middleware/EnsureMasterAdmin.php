<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMasterAdmin
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user instanceof User || $user->email !== 'admin@gmail.com') {
            if ($request->expectsJson()) {
                abort(403, 'Only the master administrator may perform this action.');
            }

            return redirect()
                ->route('profile.edit')
                ->with('flash', ['type' => 'error', 'message' => 'Only the master administrator may perform this action.']);
        }

        return $next($request);
    }
}
