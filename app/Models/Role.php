<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'role_user');
    }

    public function getPermissionsAttribute()
    {
        // Define permissions for each role
        $permissions = [];

        switch ($this->slug) {
            case 'admin':
                $permissions = ['can_delete', 'can_edit', 'can_add'];
                break;
            case 'team_lead':
                $permissions = ['can_create', 'can_delete'];
                break;
            case 'agent':
                $permissions = ['can_edit'];
                break;
        }

        return $permissions;
    }
}
