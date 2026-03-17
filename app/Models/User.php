<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'username',
        'role',
        'status',
        'permissions',
        'last_active_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'permissions' => 'array', // Updated to array for better nested object support
        'last_active_at' => 'datetime',
    ];

    /**
     * Default values for attributes.
     */
    protected $attributes = [
        'username' => '',
        'role' => 'customer',
        'status' => 'pending', // Set default status to pending for new registrations
        'permissions' => '{"read":false,"create":false,"update":false,"delete":false}',
    ];

    /**
     * Accessor for is_active.
     * This bridges your 'status' column and the boolean check used in middlewares.
     */
    public function getIsActiveAttribute(): bool
    {
        // The Master Admin is always considered active
        if ($this->email === 'admin@gmail.com') {
            return true;
        }

        // Admins are active by default, others depend on status
        if ($this->role === 'admin') {
            return true;
        }

        return $this->status === 'active';
    }
}