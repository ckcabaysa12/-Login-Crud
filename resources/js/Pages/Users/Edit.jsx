import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Edit({ auth, user }) {
    // 1. SAFETY GUARD: If 'user' is undefined, don't run the code below.
    // This prevents the "Cannot read properties of undefined (reading 'name')" error.
    if (!user) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="py-12 text-center text-gray-500">Loading user data...</div>
            </AuthenticatedLayout>
        );
    }

    const { data, setData, patch, processing, errors } = useForm({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        role: user.role || 'customer',
        can_create: !!user.can_create,
        can_update: !!user.can_update,
        can_delete: !!user.can_delete,
    });

    const submit = (e) => {
        e.preventDefault();
        const updateUrl = typeof route !== 'undefined' 
            ? route('users.update', user.id) 
            : `/users/${user.id}`;
        patch(updateUrl);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Edit User: {user.name}</h2>}
        >
            <Head title={`Edit ${user.name}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-8">
                        <form onSubmit={submit} className="space-y-6">
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {errors.username && <div className="text-red-500 text-xs mt-1">{errors.username}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">User Role</label>
                                <select
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="customer">Customer</option>
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-4">Functional Permissions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {['can_create', 'can_update', 'can_delete'].map((perm) => (
                                        <label key={perm} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data[perm]}
                                                onChange={(e) => setData(perm, e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700 capitalize">
                                                {perm.replace('_', ' ')}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
                                <Link
                                    href={route('dashboard')}
                                    className="text-sm text-gray-600 hover:text-gray-900 font-semibold"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all disabled:opacity-50"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}