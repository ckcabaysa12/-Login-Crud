import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, router, useForm } from '@inertiajs/react'
import { useState, useEffect } from 'react'

// Chevron Icon Component
const ChevronIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
)

export default function Dashboard({ auth, users = [], isMasterAdmin }) {

    const currentUser = auth?.user || null
    const [modal, setModal] = useState(null)
    const [selectedUser, setSelectedUser] = useState(null)
    const [openMenuId, setOpenMenuId] = useState(null) // Track which user's menu is open
    const [searchTerm, setSearchTerm] = useState('') // Search term for filtering
    const [selectedRole, setSelectedRole] = useState('All') // Role filter state
    const [roleMenuOpen, setRoleMenuOpen] = useState(false) // Role dropdown toggle state

    const { data, setData, post, patch, delete: destroy, processing, reset, clearErrors } = useForm({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'customer',
        permissions: [], // Use array structure to match backend
    })

    // Strict visibility logic constants
    const authUser = auth.user;
    const authPermissions = Array.isArray(authUser.permissions) ? authUser.permissions : [];
    
    // Master Admin identity check - hardcoded override
    const isAdminIdentity = auth.user.email === 'admin@gmail.com';

    // The Gatekeeper: Can this person manage others?
    const canManagePermissions = isAdminIdentity || authPermissions.includes('update');

    // Functional Permission Gates with Master Admin override
    const canCreate = isAdminIdentity || authPermissions.includes('create');
    const canRead   = isAdminIdentity || authPermissions.includes('read');
    const canUpdate = isAdminIdentity || authPermissions.includes('update');
    const canDelete = isAdminIdentity || authPermissions.includes('delete');

    // Display role with Master Admin override
    const displayRole = isAdminIdentity ? 'admin' : authUser.role;
    
    // Full access check for UI elements
    const hasFullAccess = isAdminIdentity || authUser.role === 'admin';

    // Role badge styling function
    const getBadgeStyle = (role) => {
        switch(role?.toLowerCase()) {
            case 'admin': return 'bg-purple-100 text-purple-700';
            case 'staff': return 'bg-blue-100 text-blue-700';
            case 'customer': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // Role-to-permission mapping for automatic synchronization
    const ROLE_MAPPING = {
        admin: ['create', 'read', 'update', 'delete'],
        staff: ['create', 'read'],
        customer: ['update'], // Only update permission for customers
    };

    // Helper function to determine role for display (same logic as filter)
    const getRoleToMatch = (user) => {
        return user.email === 'admin@gmail.com' ? 'admin' : user.role.toLowerCase();
    };

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

    // ESC key listener for modal closing
    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === 'Escape' && modal) {
                closeModal()
            }
            if (e.key === 'Escape' && openMenuId) {
                setOpenMenuId(null)
            }
        }

        document.addEventListener('keydown', handleEscKey)
        return () => document.removeEventListener('keydown', handleEscKey)
    }, [modal, openMenuId])

    // Click outside to close menu
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (openMenuId && !e.target.closest('.dropdown-menu')) {
                setOpenMenuId(null)
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [openMenuId])

    // Click outside to close role menu
    useEffect(() => {
        const handleClickOutsideRoleMenu = (e) => {
            if (roleMenuOpen && !e.target.closest('.role-dropdown')) {
                setRoleMenuOpen(false)
            }
        }

        document.addEventListener('click', handleClickOutsideRoleMenu)
        return () => document.removeEventListener('click', handleClickOutsideRoleMenu)
    }, [roleMenuOpen])

    const toggleMenu = (userId) => {
        setOpenMenuId(openMenuId === userId ? null : userId)
    }

    const closeMenu = () => {
        setOpenMenuId(null)
    }

    /* ------------------------------------------
        HELPERS
    -------------------------------------------*/
    
    const handleRoleChange = (e) => {
        const newRole = e.target.value;

        // Update both role and permissions simultaneously
        setData(prevData => ({
            ...prevData,
            role: newRole,
            permissions: ROLE_MAPPING[newRole] || []
        }));
    };

    const openModal = (type, user = null) => {
        setSelectedUser(user)
        if (user) {
            // Master Admin gets all permissions regardless of database
            const isAdminUser = user.email === 'admin@gmail.com';
            const userRole = isAdminUser ? 'admin' : (user.role || 'customer');
            const userPermissions = isAdminUser ? ['create', 'read', 'update', 'delete'] : 
                                          (Array.isArray(user.permissions) ? user.permissions : []);

            setData({
                name: user.name || '',
                email: user.email || '',
                username: user.username || '',
                password: '',
                role: userRole,
                permissions: userPermissions,
            })
        }
        setModal(type)
    }

    const closeModal = () => {
        setModal(null)
        setSelectedUser(null)
        reset()
        clearErrors()
        // Reset body overflow to prevent stuck backgrounds
        document.body.style.overflow = 'unset'
    }

    const handlePermissionToggle = (userId, permission, isChecked) => {
        // Get current user permissions
        const user = users.find(u => u.id === userId)
        if (!user) return
        
        const currentPermissions = Array.isArray(user.permissions) ? user.permissions : Object.values(user.permissions || {})
        
        // Show confirmation for critical permissions
        if (['delete', 'update'].includes(permission) && !isChecked) {
            if (!confirm(`Are you sure you want to remove the ${permission} permission?`)) {
                return
            }
        }
        
        // Send to backend
        router.patch(route('users.update-permissions', userId), {
            permission: permission,
            value: isChecked ? 1 : 0
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Force a page reload to get fresh data
                router.reload({ only: ['users'] })
            },
            onError: (error) => {
                console.error('Permission update failed:', error)
            }
        })
    }

    const handlePermissionChange = (e) => {
        const { name, checked } = e.target
        const permissionName = name.charAt(0).toUpperCase() + name.slice(1)
        
        // Show confirmation for critical permissions
        if (['delete', 'update'].includes(name) && !checked) {
            if (!confirm(`Are you sure you want to ${permissionName} this permission?`)) {
                return
            }
        }
        
        setData('permissions', {
            ...data.permissions,
            [name]: checked
        })
        
        // Communicate with backend - use Inertia patch for real-time updates
        router.patch(route('users.update-permissions', selectedUser.id), {
            permission: name,
            value: checked
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Force a page reload to get fresh data
                router.reload({ only: ['users'] })
            },
            onError: (error) => {
                console.error('Permission update failed:', error)
            }
        })
    }

    /* ------------------------------------------
        REAL-TIME SEARCH FILTERING
    -------------------------------------------*/
    const filteredUsers = users.filter((user) => {
        // 1. Force the role to lowercase and trim spaces
        const actualRole = user.role?.toLowerCase().trim();
        const targetFilter = selectedRole?.toLowerCase().trim();

        // 2. Identify the Master Admin (Always passes 'admin' and 'all' filters)
        const isMasterAdmin = user.email === 'admin@gmail.com';

        // 3. Define the role match
        let roleMatches = false;
        if (targetFilter === 'all') {
            roleMatches = true;
        } else if (targetFilter === 'admin') {
            roleMatches = (isMasterAdmin || actualRole === 'admin');
        } else if (targetFilter === 'staff') {
            roleMatches = (!isMasterAdmin && actualRole === 'staff');
        } else if (targetFilter === 'customer') {
            roleMatches = (!isMasterAdmin && actualRole === 'customer');
        }

        // 4. Define the search match
        const matchesSearch = searchTerm === '' || (
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.location && user.location.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return roleMatches && matchesSearch;
    });

    /* ------------------------------------------
        CRUD ACTIONS
    -------------------------------------------*/
    const submitCreate = (e) => {
        e.preventDefault()
        post(route('users.store'), { onSuccess: closeModal })
    }

    const submitUpdate = (e) => {
        e.preventDefault()
        const url = route('users.update', selectedUser.id)
        patch(url, { preserveScroll: true, onSuccess: closeModal })
    }

    const submitApprove = (e) => {
        e.preventDefault()
        const url = route('users.approve', selectedUser.id)
        patch(url, { preserveScroll: true, onSuccess: closeModal })
    }

    const confirmDelete = (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        const url = route('users.destroy', selectedUser.id)
        
        destroy(url, {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                router.visit(route('dashboard'));
            }
        })
    }

    const getRoleLabel = (user) => {
        if (user.email === 'admin@gmail.com') return 'Admin'
        if (user.role === 'admin') return 'Staff'
        if (user.role === 'staff') return 'Customer'
        return 'Other'
    }

    return (
        <AuthenticatedLayout
            user={currentUser}
            header={<h2 className="text-xl font-semibold text-gray-800">User Management</h2>}
        >
            <Head title="Admin Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    
                    {/* Top Control Bar */}
                    <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        {/* Left: Search Bar */}
                        <div className="flex-1 max-w-md">
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search items..." 
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        
                        {/* Middle: Filter Dropdowns */}
                        <div className="flex items-center space-x-4">
                            <div className="relative role-dropdown">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRoleMenuOpen(prev => !prev);
                                    }}
                                    className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                >
                                    <span>
                                        Permissions: {selectedRole === 'All' ? 'All' : selectedRole}
                                    </span>
                                    <ChevronIcon className="w-4 h-4 text-gray-400 ml-2" />
                                </button>
                                {/* Dropdown Menu */}
                                {roleMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded-md z-20 ring-1 ring-black ring-opacity-5">
                                        <div className="py-1">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRole('all');
                                                    setRoleMenuOpen(false);
                                                }} 
                                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            >
                                                All
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRole('admin');
                                                    setRoleMenuOpen(false);
                                                }} 
                                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            >
                                                Admin
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRole('staff');
                                                    setRoleMenuOpen(false);
                                                }} 
                                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            >
                                                Staff
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRole('customer');
                                                    setRoleMenuOpen(false);
                                                }} 
                                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            >
                                                Customer
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <button className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                                    <span>Joined Date</span>
                                    <ChevronIcon className="w-4 h-4 text-gray-400 ml-2" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Right: Action Buttons */}
                        <div className="flex items-center space-x-3">
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md font-bold hover:bg-gray-200 transition">
                                Export
                            </button>
                            {canCreate && (
                                <button
                                    onClick={() => openModal('create')}
                                    className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-md font-bold hover:bg-indigo-700 transition"
                                >
                                    + New User
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table Container */}
                    {canRead ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {/* Checkbox Column - Master Admin Only */}
                                        {isMasterAdmin && (
                                            <th className="px-6 py-4 text-left text-xs uppercase text-gray-500 font-bold tracking-wider">
                                                <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                            </th>
                                        )}
                                        <th className="px-6 py-4 text-left text-xs uppercase text-gray-500 font-bold tracking-wider">Full Name</th>
                                        <th className="px-6 py-4 text-left text-xs uppercase text-gray-500 font-bold tracking-wider">Email Address</th>
                                        <th className="px-6 py-4 text-left text-xs uppercase text-gray-500 font-bold tracking-wider">Location</th>
                                        <th className="px-6 py-4 text-left text-xs uppercase text-gray-500 font-bold tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs uppercase text-gray-500 font-bold tracking-wider">Joined Date</th>
                                        {isMasterAdmin && (
                                            <th className="px-6 py-4 text-left text-xs uppercase text-gray-500 font-bold tracking-wider">Permissions</th>
                                        )}
                                        <th className="px-6 py-4 text-right text-xs uppercase text-gray-500 font-bold tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredUsers.map((user) => {
                                    // Sanitize permissions data to always be an array
                                    const userPermissions = Array.isArray(user.permissions) ? user.permissions : Object.values(user.permissions || {});
                                    
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50 transition">
                                            {/* Checkbox Column - Master Admin Only */}
                                            {isMasterAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                                </td>
                                            )}
                                            
                                            {/* Full Name with Avatar */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-indigo-600 font-bold text-sm">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                                                </div>
                                            </td>
                                            
                                            {/* Email Address */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{user.email}</div>
                                            </td>
                                            
                                            {/* Location */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">Lipa City, Batangas</div>
                                            </td>
                                            
                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {/* Status Dot */}
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                                        user.email === 'admin@gmail.com' || (user.status || 'active') === 'active' 
                                                            ? 'bg-green-500' 
                                                            : 'bg-red-500'
                                                    }`}></div>
                                                    {/* Status Badge */}
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                                        user.email === 'admin@gmail.com' || (user.status || 'active') === 'active' 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {(user.email === 'admin@gmail.com' || (user.status || 'active') === 'active') ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Joined Date */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">March 15, 2026</div>
                                            </td>
                                            
                                            {/* Permissions Column - Master Admin Only */}
                                            {isMasterAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 text-xs rounded-full font-bold ${
                                                        // Strictly follow user.role from database
                                                        user.role?.toLowerCase().trim() === 'admin'
                                                            ? 'bg-purple-100 text-purple-700'  // Admin = Purple
                                                            : user.role?.toLowerCase().trim() === 'staff'
                                                            ? 'bg-blue-100 text-blue-700'       // Staff = Blue
                                                            : 'bg-gray-100 text-gray-700'         // Customer = Gray
                                                    }`}>
                                                        {/* Strictly follow user.role from database */}
                                                        {user.role?.toLowerCase().trim() === 'admin' ? 'Admin' : 
                                                         user.role?.toLowerCase().trim() === 'staff' ? 'Staff' : 
                                                         user.role?.toLowerCase().trim() === 'customer' ? 'Customer' : 'Unknown'}
                                                    </span>
                                                </td>
                                            )}
                                            {/* Actions Column */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="dropdown-menu relative inline-block text-left">
                                                    {/* Ellipsis Button */}
                                                    <button 
                                                        onClick={() => toggleMenu(user.id)}
                                                        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                                                        </svg>
                                                    </button>
                                                    
                                                    {/* Dropdown Menu */}
                                                    {openMenuId === user.id && (
                                                        <div className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded-md z-10 ring-1 ring-black ring-opacity-5">
                                                            <div className="py-1">
                                                                {user.status !== 'active' ? (
                                                                    isMasterAdmin && (
                                                                        <>
                                                                            <button 
                                                                                onClick={() => { openModal('approve', user); closeMenu(); }} 
                                                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                            >
                                                                                Approve
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => { openModal('delete', user); closeMenu(); }} 
                                                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                                            >
                                                                                Deny
                                                                            </button>
                                                                        </>
                                                                    )
                                                                ) : (
                                                                    <>
                                                                        {canUpdate && (
                                                                            <button 
                                                                                onClick={() => { openModal('edit', user); closeMenu(); }} 
                                                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                        )}
                                                                        {canDelete && (
                                                                            <button 
                                                                                onClick={() => { openModal('delete', user); closeMenu(); }} 
                                                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        {/* Footer Pagination */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-4 px-6 py-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-700">Show</span>
                                    <div className="relative">
                                        <select className="appearance-none -webkit-appearance-none -moz-appearance-none px-3 py-1 pr-8 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white" style={{ WebkitAppearance: 'none', MozAppearance: 'none', msAppearance: 'none' }}>
                                            <option>10</option>
                                            <option>25</option>
                                            <option>50</option>
                                            <option>100</option>
                                        </select>
                                    </div>
                                    <span className="text-sm text-gray-700">rows</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50" disabled>
                                        Previous
                                    </button>
                                    <button className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md">1</button>
                                    <button className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md">2</button>
                                    <button className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md">3</button>
                                    <button className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md">...</button>
                                    <button className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md">10</button>
                                    <button className="px-3 py-1 text-sm text-gray-700 hover:text-gray-700">
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
                            <p className="text-gray-600 text-lg">You do not have permission to view this data.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50" onClick={closeModal}>
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-900 mb-6 p-6 pb-0">
                            {modal === 'create' && 'Add New Account'}
                            {modal === 'edit' && `Update Profile: ${selectedUser?.name}`}
                            {modal === 'approve' && `Approve User: ${selectedUser?.name}`}
                            {modal === 'delete' && (selectedUser?.status === 'pending' ? 'Reject Application?' : 'Permanently Delete?') }
                        </h3>

                        {modal === 'delete' ? (
                            <div className="p-6 space-y-6 text-center">
                                <p className="text-gray-600 leading-relaxed">
                                    Are you sure you want to {selectedUser?.status === 'pending' ? 'deny access for' : 'remove'} <b>{selectedUser?.name}</b>? This action cannot be undone.
                                </p>
                                <div className="flex justify-center space-x-4 pt-4">
                                    <button onClick={closeModal} className="px-6 py-2 text-gray-500 font-bold hover:text-gray-700 transition">Cancel</button>
                                    <button onClick={confirmDelete} className="bg-red-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition">
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={modal === 'create' ? submitCreate : (modal === 'approve' ? submitApprove : submitUpdate)} className="p-6 space-y-4">
                                {modal !== 'approve' && (
                                    <div className="space-y-4">
                                        <input type="text" placeholder="Full Name" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" required />
                                        <input type="email" placeholder="Email Address" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" required />
                                        <input type="text" placeholder="Username" value={data.username} onChange={e => setData('username', e.target.value)} className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" required />
                                        <input type="password" placeholder="Password (leave blank to keep current)" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                )}
                                
                                {isMasterAdmin && (
                                    <div className="pt-4 space-y-4">
                                        <label className="block text-sm font-bold text-gray-700">Assign Role</label>
                                        <select value={data.role} onChange={e => handleRoleChange(e.target.value)} className="w-full rounded-lg border-gray-300 focus:ring-indigo-500">
                                            <option value="staff">Customer</option>
                                            <option value="admin">Staff</option>
                                            <option value="customer">Other</option>
                                        </select>
                                        
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">Permissions</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['create', 'read', 'update', 'delete'].map((perm) => (
                                                    <label key={perm} className="flex items-center gap-2">
                                                        <input 
                                                            type="checkbox"
                                                            // Ensure strict boolean to avoid "uncontrolled" warning
                                                            checked={!!(data.permissions && data.permissions.includes(perm))}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                const updated = checked 
                                                                    ? [...data.permissions, perm] 
                                                                    : data.permissions.filter(p => p !== perm);
                                                                setData('permissions', updated);
                                                            }}
                                                        />
                                                        <span className="capitalize">{perm}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100 mt-6">
                                    <button type="button" onClick={closeModal} className="text-gray-500 font-bold hover:text-gray-700">Cancel</button>
                                    <button type="submit" disabled={processing} className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition disabled:opacity-50">
                                        {modal === 'approve' ? 'Approve Now' : 'Save User'}
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