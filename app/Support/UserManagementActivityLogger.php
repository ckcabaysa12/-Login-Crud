<?php

namespace App\Support;

use App\Models\User;
use App\Models\UserManagementActivity;
use Illuminate\Http\Request;

class UserManagementActivityLogger
{
    /**
     * @param  array<string, mixed>  $properties
     */
    public static function log(
        User $actor,
        string $action,
        ?int $subjectId = null,
        array $properties = [],
        ?Request $request = null,
    ): void {
        $req = $request ?? request();

        UserManagementActivity::query()->create([
            'actor_id' => $actor->id,
            'subject_id' => $subjectId,
            'action' => $action,
            'properties' => $properties === [] ? null : $properties,
            'ip_address' => $req->ip(),
            'user_agent' => $req->userAgent(),
        ]);
    }
}
