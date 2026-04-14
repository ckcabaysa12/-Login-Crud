<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. MASTER ADMIN
        User::create([
            'name' => 'Master Admin',
            'email' => 'admin@gmail.com',
            'username' => 'admin',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
            'permissions' => [
                'create' => true, 'read' => true, 'update' => true, 'delete' => true,
            ],
        ]);

        // 2. TEST USER
        User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'username' => 'johndoe',
            'password' => 'password',
            'role' => 'customer',
            'status' => 'pending',
            'email_verified_at' => now(),
            'permissions' => [
                'create' => false, 'read' => true, 'update' => false, 'delete' => false,
            ],
        ]);

        // 3. Optional: Approved Staff
        User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'username' => 'janesmith',
            'password' => 'password',
            'role' => 'staff',
            'status' => 'active',
            'email_verified_at' => now(),
            'permissions' => [
                'create' => false, 'read' => true, 'update' => true, 'delete' => false,
            ],
        ]);

        // 4. Test Customer User
        User::create([
            'name' => 'Test Customer',
            'email' => 'ccc@test.com',
            'username' => 'ccctest',
            'password' => Hash::make('password'),
            'role' => 'customer',
            'status' => 'active',
            'permissions' => [
                'create' => false, 'read' => true, 'update' => false, 'delete' => false,
            ],
        ]);
    }
}
