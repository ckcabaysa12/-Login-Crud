<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Inserts a batch of realistic-looking (but fictional) people for local/staging demos.
 *
 * Login password for every seeded user here: "password"
 *
 * Run: php artisan db:seed --class=RealisticUsersSeeder
 */
class RealisticUsersSeeder extends Seeder
{
    public function run(): void
    {
        $faker = fake();
        $count = max(1, min(50, (int) env('REALISTIC_USER_SEED_COUNT', 20)));

        $roleProfiles = [
            'staff' => [
                'permissions' => ['create' => true, 'read' => true, 'update' => false, 'delete' => false],
            ],
            'customer' => [
                'permissions' => ['create' => false, 'read' => true, 'update' => false, 'delete' => false],
            ],
            'manager' => [
                'permissions' => ['create' => true, 'read' => true, 'update' => true, 'delete' => false],
            ],
            'viewer' => [
                'permissions' => ['create' => false, 'read' => true, 'update' => false, 'delete' => false],
            ],
            'support' => [
                'permissions' => ['create' => false, 'read' => true, 'update' => true, 'delete' => false],
            ],
        ];

        $roles = array_keys($roleProfiles);

        for ($i = 0; $i < $count; $i++) {
            $first = $faker->firstName();
            $last = $faker->lastName();
            $name = "{$first} {$last}";
            $slug = Str::slug("{$first}-{$last}");
            $domain = $faker->randomElement(['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'proton.me']);

            $username = Str::limit($slug.'_'.$faker->numberBetween(1000, 999999), 32, '');
            while (User::query()->where('username', $username)->exists()) {
                $username = Str::limit($slug.'_'.$faker->numberBetween(1000000, 9999999), 32, '');
            }

            $email = Str::limit($slug, 24, '').'.'.$faker->numberBetween(100, 999999).'@'.$domain;
            while (User::query()->where('email', $email)->exists()) {
                $email = Str::limit($slug, 20, '').'.'.$faker->numberBetween(100000, 99999999).'@'.$domain;
            }

            $role = $roles[$i % count($roles)];
            $profile = $roleProfiles[$role];

            $status = $faker->randomElement(['active', 'active', 'active', 'pending']);

            User::query()->create([
                'name' => $name,
                'email' => $email,
                'username' => $username,
                'password' => 'password',
                'role' => $role,
                'status' => $status,
                'email_verified_at' => $status === 'active' ? $faker->dateTimeBetween('-2 years', 'now') : null,
                'permissions' => $profile['permissions'],
                'location' => $faker->city().', '.$faker->stateAbbr(),
            ]);
        }
    }
}
