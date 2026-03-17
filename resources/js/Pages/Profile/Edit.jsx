import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ auth, user, isMasterAdmin }) {
    // Original useForm structure updated to match JSON permissions structure
    const { data, setData, patch, processing, errors } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || '',
        permissions: {
            read: user?.permissions?.read || false,
            create: user?.permissions?.create || false,
            update: user?.permissions?.update || false,
            delete: user?.permissions?.delete || false,
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('users.update', user.id));
    };

    // Helper to handle nested permission changes
    const handlePermissionChange = (key, value) => {
        setData('permissions', {
            ...data.permissions,
            [key]: value,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Edit User</h2>}
        >
            <Head title="Edit User" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
                            <div>
                                <label className="block font-medium text-sm text-gray-700">Name</label>
                                <input 
                                    type="text"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
                            </div>

                            <div>
                                <label className="block font-medium text-sm text-gray-700">Email</label>
                                <input 
                                    type="email"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
                            </div>

                            {/* MASTER ADMIN ONLY: Role and Permissions Section */}
                            {isMasterAdmin && (
                                <>
                                    <hr className="my-6 border-gray-200" />
                                    
                                    <div>
                                        <label className="block font-medium text-sm text-gray-700">Role</label>
                                        <select
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                            value={data.role}
                                            onChange={(e) => setData('role', e.target.value)}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="staff">Staff</option>
                                            <option value="customer">Customer</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-medium text-sm text-gray-700 mb-2">Permissions</label>
                                        <div className="space-y-2">
                                            {Object.keys(data.permissions).map((key) => (
                                                <div key={key} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`perm-${key}`}
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                        checked={data.permissions[key]}
                                                        onChange={(e) => handlePermissionChange(key, e.target.checked)}
                                                    />
                                                    <label htmlFor={`perm-${key}`} className="ml-2 text-sm text-gray-600 capitalize">
                                                        {key}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex items-center gap-4">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-gray-800 text-white rounded-md font-semibold text-xs uppercase"
                                    disabled={processing}
                                >
                                    Save Changes
                                </button>
                                <Link href={route('dashboard')} className="text-sm text-gray-600 underline">Cancel</Link>
                            </div>
                        </form>
                    </div>

                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}