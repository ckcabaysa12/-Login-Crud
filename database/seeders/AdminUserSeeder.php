<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
{
    \App\Models\User::updateOrCreate(
        ['email' => 'admin@gmail.com'], // Checks if this email exists
        [
            'name' => 'Master Admin',
            'password' => bcrypt('password123'), // Set your desired password
            'role' => 'admin',
            'is_active' => true,
            'permissions' => [
                'create' => true,
                'read' => true,
                'delete' => true,
                'update' => true,
            ],
        ]
    );
}
}
