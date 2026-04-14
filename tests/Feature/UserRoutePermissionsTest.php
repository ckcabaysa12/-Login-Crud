<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRoutePermissionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_redirects_without_read_permission(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'email_verified_at' => now(),
            'permissions' => [
                'create' => false,
                'read' => false,
                'update' => true,
                'delete' => false,
            ],
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertRedirect(route('home'));
    }

    public function test_user_with_read_can_open_dashboard(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'email_verified_at' => now(),
            'role' => 'staff',
            'permissions' => [
                'create' => false,
                'read' => true,
                'update' => false,
                'delete' => false,
            ],
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk();
    }

    public function test_regular_user_cannot_open_dashboard_even_with_read_permission(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'email_verified_at' => now(),
            'role' => 'customer',
            'permissions' => [
                'create' => false,
                'read' => true,
                'update' => false,
                'delete' => false,
            ],
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertRedirect(route('home'));
    }

    public function test_create_user_requires_create_permission(): void
    {
        $reader = User::factory()->create([
            'status' => 'active',
            'email_verified_at' => now(),
            'permissions' => [
                'create' => false,
                'read' => true,
                'update' => false,
                'delete' => false,
            ],
        ]);

        $this->actingAs($reader)
            ->post(route('users.store'), [
                'name' => 'X',
                'email' => 'x@example.com',
                'username' => 'xuser',
                'password' => 'Password1!',
            ])
            ->assertForbidden();
    }

    public function test_master_admin_can_still_create_users(): void
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

        $this->actingAs($admin)
            ->post(route('users.store'), [
                'name' => 'New Person',
                'email' => 'newperm@example.com',
                'username' => 'newpermuser',
                'password' => 'Password1!',
                'location' => 'City',
                'role' => 'customer',
                'status' => 'active',
                'permissions' => ['read'],
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertDatabaseHas('users', ['email' => 'newperm@example.com']);
    }

    public function test_non_master_admin_cannot_update_master_admin(): void
    {
        $master = User::factory()->create([
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

        $staff = User::factory()->create([
            'status' => 'active',
            'permissions' => [
                'create' => false,
                'read' => true,
                'update' => true,
                'delete' => false,
            ],
        ]);

        $this->actingAs($staff)
            ->patch(route('users.update', $master->id), [
                'name' => 'Hacked Name',
                'email' => $master->email,
                'username' => $master->username,
                'password' => '',
                'location' => 'Nowhere',
            ])
            ->assertForbidden();
    }

    public function test_master_admin_create_enforces_role_minimum_permissions(): void
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

        $this->actingAs($admin)
            ->post(route('users.store'), [
                'name' => 'Support Person',
                'email' => 'support.person@example.com',
                'username' => 'support_person',
                'password' => 'Password1!',
                'location' => 'City',
                'role' => 'support',
                'status' => 'active',
                'permissions' => ['read'],
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $created = User::query()->where('email', 'support.person@example.com')->firstOrFail();
        $this->assertSame(
            ['create' => false, 'read' => true, 'update' => true, 'delete' => false],
            $created->permissions
        );
    }
}
