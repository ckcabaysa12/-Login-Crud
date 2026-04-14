<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        $name = fake()->name();

        return [
            'name' => $name,
            'email' => fake()->unique()->safeEmail(),
            'username' => fake()->unique()->userName().Str::random(4),
            'email_verified_at' => now(),
            'password' => static::$password ??= 'password',
            'role' => 'customer',
            'status' => 'active',
            'permissions' => [
                'create' => false,
                'read' => true,
                'update' => false,
                'delete' => false,
            ],
            'location' => fake()->city(),
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
