<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    /**
     * @return array<string, array<string, bool>>
     */
    public static function rolePermissionTemplates(): array
    {
        return [
            'admin' => ['create' => true, 'read' => true, 'update' => true, 'delete' => true],
            'manager' => ['create' => true, 'read' => true, 'update' => true, 'delete' => false],
            'staff' => ['create' => true, 'read' => true, 'update' => false, 'delete' => false],
            'support' => ['create' => false, 'read' => true, 'update' => true, 'delete' => false],
            'viewer' => ['create' => false, 'read' => true, 'update' => false, 'delete' => false],
            'customer' => ['create' => false, 'read' => true, 'update' => false, 'delete' => false],
        ];
    }

    /**
     * Roles that may be assigned when creating or updating users (stored on users.role).
     *
     * @return list<string>
     */
    public static function assignableRoles(): array
    {
        return ['admin', 'staff', 'customer', 'manager', 'viewer', 'support'];
    }

    /**
     * @return array<string, bool>
     */
    public static function defaultPermissionsForRole(?string $role): array
    {
        return self::rolePermissionTemplates()[$role ?? 'customer']
            ?? self::rolePermissionTemplates()['customer'];
    }

    /**
     * Normalize list/flags into canonical booleans, optionally enforcing role minimums.
     *
     * @param  mixed  $permissions
     * @return array<string, bool>
     */
    public static function normalizePermissionFlags(
        $permissions,
        ?string $role = null,
        bool $enforceRoleMinimums = true
    ): array {
        $flags = ['create' => false, 'read' => false, 'update' => false, 'delete' => false];

        if (is_array($permissions)) {
            if (array_is_list($permissions)) {
                foreach ($permissions as $slug) {
                    if (is_string($slug) && array_key_exists($slug, $flags)) {
                        $flags[$slug] = true;
                    }
                }
            } else {
                foreach ($flags as $slug => $_) {
                    $value = $permissions[$slug] ?? false;
                    $flags[$slug] = $value === true || $value === 1 || $value === '1';
                }
            }
        }

        if ($enforceRoleMinimums) {
            foreach (self::defaultPermissionsForRole($role) as $slug => $mustHave) {
                if ($mustHave) {
                    $flags[$slug] = true;
                }
            }
        }

        return $flags;
    }

    protected $fillable = [
        'name',
        'email',
        'last_login_at',
        'last_login_ip',
        'username',
        'password',
        'role',
        'status',
        'permissions',
        'location',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'permissions' => 'array',
        ];
    }

    /**
     * Permission flags as stored (associative) → list of enabled slugs for the UI (e.g. create, read).
     *
     * @return list<string>
     */
    public function permissionSlugs(): array
    {
        $perms = $this->permissions;
        if (! is_array($perms)) {
            return [];
        }
        if (array_is_list($perms)) {
            return array_values(array_filter($perms, fn ($p) => is_string($p) && $p !== ''));
        }

        return array_keys(array_filter($perms, fn ($v) => $v === true || $v === 1 || $v === '1'));
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    public function isMasterAdmin(): bool
    {
        return $this->email === 'admin@gmail.com';
    }

    public function canAccessUserManagement(): bool
    {
        if ($this->isMasterAdmin()) {
            return true;
        }

        return in_array($this->role, ['admin', 'staff', 'manager'], true);
    }
}
