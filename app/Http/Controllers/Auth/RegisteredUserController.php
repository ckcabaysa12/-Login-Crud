<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\UserManagementActivityLogger;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $base = Str::slug(Str::before($request->email, '@')) ?: 'user';
        $username = $base;
        $suffix = 0;
        while (User::where('username', $username)->exists()) {
            $username = $base.(++$suffix);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'username' => $username,
            'password' => $request->password,
            'role' => 'customer',
            'status' => 'pending',
            'permissions' => [
                'create' => false,
                'read' => true,
                'update' => false,
                'delete' => false,
            ],
            'email_verified_at' => now(),
        ]);

        event(new Registered($user));

        UserManagementActivityLogger::log(
            $user,
            'user_self_registered',
            $user->id,
            [
                'name' => $user->name,
                'email' => $user->email,
            ],
            $request,
        );

        Auth::login($user);

        return redirect()->route('waiting.approval');
    }
}
