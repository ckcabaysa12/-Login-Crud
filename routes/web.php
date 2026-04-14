<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ResumePdfController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if ($user->status !== 'active' && $user->email !== 'admin@gmail.com') {
            return redirect()->route('waiting.approval');
        }

        return $user->canAccessUserManagement()
            ? redirect()->route('dashboard')
            : redirect()->route('home');
    }

    return redirect()->route('login');
});

Route::middleware('auth')->group(function () {
    Route::get('/waiting-approval', function () {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($user->status === 'active' || $user->email === 'admin@gmail.com') {
            return $user->canAccessUserManagement()
                ? redirect()->route('dashboard')
                : redirect()->route('home');
        }

        return Inertia::render('Auth/WaitingForApproval');
    })->name('waiting.approval');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'is_active', 'user_management_access', 'permission:read'])->group(function () {
    Route::get('/dashboard', [UserController::class, 'dashboard'])->name('dashboard');
    Route::get('/users-management', [UserController::class, 'dashboard'])->name('users.index');

    Route::get('/api/users', [UserController::class, 'apiIndex'])->name('api.users.index');
    Route::get('/api/users/{user}', [UserController::class, 'apiShow'])->name('api.users.show');
});

Route::middleware(['auth', 'verified', 'is_active', 'permission:create'])->group(function () {
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
});

Route::middleware(['auth', 'verified', 'is_active', 'permission:update'])->group(function () {
    Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
});

Route::middleware(['auth', 'verified', 'is_active', 'master_admin'])->group(function () {
    Route::patch('/users/{user}/approve', [UserController::class, 'approve'])->name('users.approve');
});

Route::middleware(['auth', 'verified', 'is_active', 'permission:delete'])->group(function () {
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::post('/users-bulk', [UserController::class, 'bulkDestroy'])->name('users.bulk-destroy');
});

Route::middleware(['auth', 'verified', 'is_active'])->group(function () {
    Route::get('/home', fn () => Inertia::render('Home'))->name('home');
    Route::get('/account-status', fn () => Inertia::render('AccountStatus'))->name('account.status');
    Route::get('/resume/pdf', ResumePdfController::class)->name('resume.pdf');
});

require __DIR__.'/auth.php';
