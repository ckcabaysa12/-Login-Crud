<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserDashboardPaginationTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_ten_users_per_page(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@gmail.com',
            'username' => 'admin',
            'status' => 'active',
            'role' => 'admin',
            'permissions' => [
                'create' => true,
                'read' => true,
                'update' => true,
                'delete' => true,
            ],
        ]);

        User::factory()->count(25)->create([
            'status' => 'active',
            'permissions' => [
                'create' => false,
                'read' => true,
                'update' => false,
                'delete' => false,
            ],
        ]);

        $this->actingAs($admin);

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn ($assert) => $assert
                ->component('Dashboard')
                ->has('users.data', 10)
                ->where('users.per_page', 10)
                ->where('users.total', 26)
                ->where('users.current_page', 1)
                ->where('stats.total', 26)
                ->where('stats.active', 26));

        $this->get(route('dashboard', ['page' => 2]))
            ->assertOk()
            ->assertInertia(fn ($assert) => $assert
                ->has('users.data', 10)
                ->where('users.current_page', 2));

        $this->get(route('dashboard', ['page' => 3]))
            ->assertOk()
            ->assertInertia(fn ($assert) => $assert
                ->has('users.data', 6)
                ->where('users.current_page', 3));
    }
}
