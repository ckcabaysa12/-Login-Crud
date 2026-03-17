<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
{
    Gate::define('create-users', function (User $user) {
        return $user->permissions['create'] ?? false;
    });

    Gate::define('delete-users', function (User $user) {
        return $user->permissions['delete'] ?? false;
    });
    Schema::defaultStringLength(191);
}
}
