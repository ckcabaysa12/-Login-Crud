import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, router, useForm } from '@inertiajs/react'
import { useState, useEffect } from 'react'

export default function UsersManagement({ auth, users = [], isMasterAdmin }) {

    const currentUser = auth?.user || null

    const [modal, setModal] = useState(null)
    const [selectedUser, setSelectedUser] = useState(null)

    const { data, setData, post, patch, delete: destroy, processing, reset, clearErrors } = useForm({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'customer',
        permissions: {
            create: false,
            read: true,
            update: false,
            delete: false,
        },
    })

    /* ------------------------------------------
       AUTO REFRESH USERS
    -------------------------------------------*/

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['users'],
                preserveScroll: true,
            })
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    /* ------------------------------------------
       PERMISSION CHECKS
    -------------------------------------------*/

    const canCreate = isMasterAdmin || (currentUser?.permissions?.create || false)
    const canUpdate = isMasterAdmin || (currentUser?.permissions?.update || false)
    const canDelete = isMasterAdmin || (currentUser?.permissions?.delete || false)
    const canReadOthers = isMasterAdmin || (currentUser?.permissions?.read || false)

    /* ------------------------------------------
       HELPERS
    -------------------------------------------*/

    const parsePermissions = (perms) => {
        if (!perms) {
            return { create: false, read: true, update: false, delete: false }
        }
        if (typeof perms === 'string') {
            try {
                return JSON.parse(perms)
            } catch {
                return { create: false, read: true, update: false, delete: false }
            }
        }
        return perms
    }

    // Enhanced permission checking helpers
    const hasEditPermission = (user) => user.permissions?.includes('update') || isMasterAdmin
    const hasDeletePermission = (user) => user.permissions?.includes('delete') || isMasterAdmin
    const hasCreatePermission = (user) => user.permissions?.includes('create') || isMasterAdmin

    const openModal = (type, user = null) => {
        setSelectedUser(user)
        if (user) {
            setData({
                name: user.name || '',
                email: user.email || '',
                username: user.username || '',
                password: '',
                role: user.role || 'customer',
                permissions: parsePermissions(user.permissions),
            })
        }
        setModal(type)
    }

    const closeModal = () => {
        setModal(null)
        setSelectedUser(null)
        reset()
        clearErrors()
    }

    const handlePermissionChange = (e) => {
        const { name, checked } = e.target
        setData('permissions', {
            ...data.permissions,
            [name]: checked,
        })
    }

    /* ------------------------------------------
       CRUD ACTIONS
    -------------------------------------------*/

    const submitCreate = (e) => {
        e.preventDefault()
        post(route('users.store'), {
            onSuccess: closeModal,
        })
    }

    const submitUpdate = (e) => {
        e.preventDefault()
        const updateUrl = typeof route !== 'undefined' 
            ? route('users.update', selectedUser.id) 
            : `/users/${selectedUser.id}`;
        patch(updateUrl, {
            preserveScroll: true,
            onSuccess: closeModal,
        })
    }

    const submitApprove = (e) => {
        e.preventDefault()
        const approveUrl = typeof route !== 'undefined' 
            ? route('users.approve', selectedUser.id) 
            : `/users/${selectedUser.id}/approve`;
        patch(approveUrl, {
            preserveScroll: true,
            onSuccess: closeModal,
        })
    }

    const confirmDelete = (e) => {
        e.preventDefault();

        // Check if we have a user selected to avoid "id of undefined" errors
        if (!selectedUser) {
            console.error("No user selected for deletion");
            return;
        }

        // Logic: Use named route if ziggy is working, 
        // otherwise fallback to manual URL string.
        const deleteUrl = typeof route !== 'undefined' 
            ? route('users.destroy', selectedUser.id) 
            : `/users/${selectedUser.id}`;

        destroy(deleteUrl, {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                // For DELETE operations, redirect to dashboard to refresh state
                window.location.href = route('dashboard');
            },
            onError: (err) => console.error("Delete failed:", err)
        })
    }

    /* ------------------------------------------
       ROLE LABEL
    -------------------------------------------*/

    const getRoleLabel = (user) => {
        if (user.email === 'admin@gmail.com') return 'Master Admin'
        if (user.role === 'admin') return 'Staff'
        if (user.role === 'staff') return 'Customer'
        return 'Other'
    }

    /* ------------------------------------------
       UI RENDER
    -------------------------------------------*/

    if (!currentUser && !isMasterAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded shadow text-center">
                    <h1 className="text-red-600 font-bold text-xl">Session Lost</h1>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded font-bold"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <AuthenticatedLayout
            user={currentUser}
            header={<h2 className="text-xl font-semibold text-gray-800">User Management</h2>}
        >
            <Head title="Users Management" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex justify-between mb-6 bg-white p-4 rounded shadow">
                        <h3 className="font-bold text-lg">User Control Panel</h3>
                        {canCreate && (
                            <button
                                onClick={() => openModal('create')}
                                className="px-4 py-2 bg-indigo-600 text-white text-xs rounded font-bold hover:bg-indigo-700"
                            >
                                + Create New User
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">User</th>
                                    <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Status</th>
                                    <th className="px-6 py-3 text-left text-xs uppercase text-gray-500 font-bold">Role</th>
                                    <th className="px-6 py-3 text-right text-xs uppercase text-gray-500 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm">
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-gray-500 text-xs">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                                                user.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800 animate-pulse'
                                            }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {getRoleLabel(user)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm">
                                            <div className="flex justify-end space-x-3">
                                                {user.status !== 'active' ? (
                                                    isMasterAdmin && (
                                                        <>
                                                            <button
                                                                onClick={() => openModal('approve', user)}
                                                                className="text-green-600 font-bold hover:underline"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => openModal('delete', user)}
                                                                className="text-red-600 font-bold hover:underline"
                                                            >
                                                                Deny
                                                            </button>
                                                        </>
                                                    )
                                                ) : (
                                                    <>
                                                        {(currentUser.id === user.id || isMasterAdmin || user.can_update) && (
                                                            <button
                                                                onClick={() => openModal('edit', user)}
                                                                className="text-indigo-600 font-bold hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                        {currentUser.id !== user.id &&
                                                         user.email !== 'admin@gmail.com' &&
                                                         (isMasterAdmin || user.can_delete) && (
                                                            <button
                                                                onClick={() => openModal('delete', user)}
                                                                className="text-red-600 font-bold hover:underline"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {modal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 shadow-2xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">
                            {modal === 'create' && 'Create New User'}
                            {modal === 'edit' && `Edit User: ${selectedUser?.name}`}
                            {modal === 'approve' && `Approve Access: ${selectedUser?.name}`}
                            {modal === 'delete' && (selectedUser?.status === 'pending' ? 'Deny Access?' : 'Delete Account?')}
                        </h3>

                        {modal === 'delete' ? (
                            <div className="space-y-4 text-center">
                                <p className="text-gray-600">
                                    Are you sure you want to {selectedUser?.status === 'pending' ? 'deny' : 'permanently delete'} <b>{selectedUser?.name}</b>?
                                </p>
                                <div className="flex justify-center space-x-3 pt-4 border-t">
                                    <button onClick={closeModal} className="text-gray-600 font-bold">Cancel</button>
                                    <button onClick={confirmDelete} className="bg-red-600 text-white px-6 py-2 rounded font-bold">
                                        {selectedUser?.status === 'pending' ? 'Confirm Deny' : 'Delete Now'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={modal === 'create' ? submitCreate : (modal === 'approve' ? submitApprove : submitUpdate)} className="space-y-4">
                                {modal !== 'approve' && (
                                    <>
                                        <input type="text" placeholder="Name" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full rounded border-gray-300" required />
                                        <input type="email" placeholder="Email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full rounded border-gray-300" required />
                                        <input type="text" placeholder="Username" value={data.username} onChange={e => setData('username', e.target.value)} className="w-full rounded border-gray-300" required />
                                        <input type="password" placeholder="Password" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full rounded border-gray-300" required={modal === 'create'} />
                                    </>
                                )}
                                
                                {isMasterAdmin && (
                                    <>
                                        <select value={data.role} onChange={e => setData('role', e.target.value)} className="w-full rounded border-gray-300">
                                            <option value="customer">Other</option>
                                            <option value="staff">Customer</option>
                                            <option value="admin">Staff</option>
                                        </select>
                                        <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded border">
                                            {['read', 'create', 'update', 'delete'].map((perm) => (
                                                <label key={perm} className="flex items-center space-x-2 cursor-pointer">
                                                    <input type="checkbox" checked={data.permissions[perm]} onChange={handlePermissionChange} name={perm} className="rounded text-indigo-600" />
                                                    <span className="text-sm capitalize">{perm}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end space-x-3 pt-4 border-t">
                                    <button type="button" onClick={closeModal} className="text-gray-600 font-bold">Cancel</button>
                                    <button type="submit" disabled={processing} className="bg-indigo-600 text-white px-6 py-2 rounded font-bold">
                                        {modal === 'approve' ? 'Approve Now' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    )
}
