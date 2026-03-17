<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. MASTER ADMIN
        User::create([
            'name' => 'Master Admin',
            'email' => 'admin@gmail.com',
            'username' => 'admin',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
            'permissions' => [
                'create' => true, 'read' => true, 'update' => true, 'delete' => true,
            ],
        ]);

        // 2. TEST USER
        User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'username' => 'johndoe',
            'password' => Hash::make('password'),
            'role' => 'customer',
            'status' => 'pending',
            'permissions' => [
                'create' => false, 'read' => true, 'update' => false, 'delete' => false,
            ],
        ]);

        // 3. Optional: Approved Staff
        User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'username' => 'janesmith',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'status' => 'active',
            'permissions' => [
                'create' => false, 'read' => true, 'update' => true, 'delete' => false,
            ],
        ]);
    }
}