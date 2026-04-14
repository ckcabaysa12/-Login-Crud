<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $actor = $this->user();
        $isMaster = $actor && $actor->email === 'admin@gmail.com';

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8'],
            'location' => ['nullable', 'string', 'max:255'],
        ];

        if ($isMaster) {
            $rules['role'] = ['required', 'string', Rule::in(User::assignableRoles())];
            $rules['status'] = ['required', 'string', Rule::in(['pending', 'active', 'inactive'])];
            $rules['permissions'] = ['nullable', 'array'];
            $rules['permissions.*'] = ['string', Rule::in(['create', 'read', 'update', 'delete'])];
        }

        return $rules;
    }

    /**
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);

        if ($key !== null) {
            return $data;
        }

        if (isset($data['permissions']) && is_array($data['permissions'])) {
            $flags = ['create' => false, 'read' => false, 'update' => false, 'delete' => false];
            foreach ($data['permissions'] as $slug) {
                if (isset($flags[$slug])) {
                    $flags[$slug] = true;
                }
            }
            $data['permissions'] = $flags;
        }

        return $data;
    }
}
