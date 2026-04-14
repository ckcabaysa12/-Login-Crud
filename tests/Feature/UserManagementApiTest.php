<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_master_admin_can_list_and_show_users_as_json(): void
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

        $other = User::factory()->create(['username' => 'otheruser']);

        $this->actingAs($admin);

        $list = $this->getJson('/api/users');
        $list->assertOk();
        $list->assertJsonFragment(['email' => $other->email]);

        $show = $this->getJson('/api/users/'.$other->id);
        $show->assertOk();
        $show->assertJsonPath('email', $other->email);
        $show->assertJsonPath('name', $other->name);
    }

    public function test_user_without_read_permission_cannot_access_api_users(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'permissions' => [
                'create' => false,
                'read' => false,
                'update' => false,
                'delete' => false,
            ],
        ]);

        $this->actingAs($user);

        $this->getJson('/api/users')->assertForbidden();
    }
}
