<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserManagementActivity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_user_writes_activity_log(): void
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

        $this->actingAs($admin);

        $this->post(route('users.store'), [
            'name' => 'New Person',
            'email' => 'new@example.com',
            'username' => 'newperson',
            'password' => 'Password1!',
            'location' => 'Test City',
            'role' => 'customer',
            'status' => 'active',
            'permissions' => ['read'],
        ])->assertSessionHasNoErrors()->assertRedirect();

        $created = User::query()->where('email', 'new@example.com')->first();
        $this->assertNotNull($created);

        $this->assertDatabaseHas('user_management_activities', [
            'actor_id' => $admin->id,
            'subject_id' => $created->id,
            'action' => 'user_created',
        ]);
    }

    public function test_dashboard_includes_activity_log_for_readers(): void
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

        $subject = User::factory()->create(['email' => 'subject@example.com']);

        UserManagementActivity::query()->create([
            'actor_id' => $admin->id,
            'subject_id' => $subject->id,
            'action' => 'user_updated',
            'properties' => ['target_email' => $subject->email],
        ]);

        $this->actingAs($admin);

        $page = $this->get(route('dashboard'));
        $page->assertOk();
        $page->assertInertia(fn ($assert) => $assert
            ->component('Dashboard')
            ->has('activityLog', 1)
            ->where('activityLog.0.action', 'user_updated'));
    }
}
