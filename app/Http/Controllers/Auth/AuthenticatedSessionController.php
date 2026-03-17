<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // 1. Verify credentials
        $request->authenticate();

        // 2. Proceed with session regeneration
        $request->session()->regenerate();

        // 3. Capture the user
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 4. Role-based and Status-based Redirection
        
        // Always allow the Master Admin through to the dashboard
        if ($user->email === 'admin@gmail.com') {
            return redirect()->intended(route('dashboard'));
        }

        // If the account is NOT active, redirect to the waiting room instead of logging them out
        // We use 'status' to match your Middleware and Dashboard logic
        if ($user->status !== 'active') {
            return redirect()->route('waiting.approval');
        }

        // 5. Active User Redirections
        if ($user->role === 'admin') {
            return redirect()->intended(route('dashboard')); 
        } 
        
        if ($user->role === 'staff') {
            // Ensure this route exists in your web.php or redirect to dashboard
            return redirect()->intended('/staff-dashboard');
        }

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}