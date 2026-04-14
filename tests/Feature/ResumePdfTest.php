<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResumePdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_with_dashboard_access_can_stream_resume_pdf(): void
    {
        $user = User::factory()->create([
            'name' => 'Raymond B. Ico',
            'email' => 'raymond@example.com',
            'username' => 'raymond',
            'status' => 'active',
            'permissions' => [
                'create' => false,
                'read' => true,
                'update' => false,
                'delete' => false,
            ],
        ]);

        $response = $this->actingAs($user)->get('/resume/pdf');

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type') ?? '');
        $this->assertStringStartsWith('%PDF', $response->getContent() ?: '');
    }
}
