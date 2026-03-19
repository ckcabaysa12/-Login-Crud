<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

// 1. Root Route - Handled with a clean redirect
Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return Inertia::render('Welcome');
});

// 2. Universal Auth Routes (Accessible to everyone logged in)
Route::middleware('auth')->group(function () {
    
    // The "Waiting Room" for users who aren't active yet
    Route::get('/waiting-approval', function () {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // If they are actually active or the Master Admin, send them to the dashboard
        if ($user->status === 'active' || $user->email === 'admin@gmail.com') {
            return redirect()->route('dashboard');
        }
        
        return Inertia::render('Auth/WaitingForApproval');
    })->name('waiting.approval');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    
    // Profile routes: Accessible even if status is 'pending'
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// 3. Restricted Routes (Only for Active accounts OR the Master Admin)
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Main Dashboard
    Route::middleware('is_active')->group(function () {
        Route::get('/dashboard', [UserController::class, 'index'])->name('dashboard');
    });

    // Admin & Master Admin Operations
    Route::middleware(['admin', 'is_active'])->group(function () {
        
        // User Management CRUD
        Route::get('/users-management', [UserController::class, 'usersManagement'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        
        // Explicitly ensuring the {user} parameter is captured correctly for Inertia
        Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::patch('/users/{user}/approve', [UserController::class, 'approve'])->name('users.approve');
        Route::patch('/users/{user}/permissions', [UserController::class, 'updatePermissions'])->name('users.updatePermissions');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
});

require __DIR__.'/auth.php';