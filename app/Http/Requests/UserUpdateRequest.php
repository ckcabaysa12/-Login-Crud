<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends FormRequest
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
        /** @var User $target */
        $target = $this->route('user');

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($target->id),
            ],
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'username')->ignore($target->id),
            ],
            'password' => ['nullable', 'string', 'min:8'],
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
        if ($key !== null) {
            return parent::validated($key, $default);
        }

        $data = parent::validated();

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
