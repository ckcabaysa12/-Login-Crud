<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Database\Seeders\UserSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // We call the UserSeeder first to set up your Master Admin and test users
        $this->call([
            UserSeeder::class,
            // RealisticUsersSeeder::class, // optional: php artisan db:seed --class=RealisticUsersSeeder
        ]);

        /* * Note: I removed the default User::factory() block here.
         * Since your UserSeeder already creates admin@gmail.com and john@example.com,
         * you don't need the extra 'test@example.com' user unless you specifically want it.
         */
    }
}