import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, router, useForm } from '@inertiajs/react'
import { useState, useEffect } from 'react'

// Chevron Icon Component
const ChevronIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
)

export default function Dashboard({ auth, users: usersProp = [], isMasterAdmin }) {

    // New test data for sorting verification
    const users = [
        {
            id: 1,
            name: 'Master Admin',
            email: 'admin@gmail.com',
            username: 'admin',
            role: 'admin',
            status: 'active',
            permissions: ['create', 'read', 'update', 'delete'],
            location: 'Lipa City, Batangas',
            joinedDate: 'March 15, 2026'
        },
        {
            id: 2,
            name: 'Maria Santos',
            email: 'maria@test.com',
            username: 'mariasantos',
            role: 'staff',
            status: 'active',
            permissions: ['create', 'read', 'update'],
            location: 'Lipa City, Batangas',
            joinedDate: 'February 10, 2026'
        },
        {
            id: 3,
            name: 'Juan Dela Cruz',
            email: 'juan@test.com',
            username: 'juandelacruz',
            role: 'customer',
            status: 'active',
            permissions: ['read'],
            location: 'Lipa City, Batangas',
            joinedDate: 'January 05, 2026'
        },
        {
            id: 4,
            name: 'Elena Reyes',
            email: 'elena@test.com',
            username: 'elenareyes',
            role: 'customer',
            status: 'active',
            permissions: ['read'],
            location: 'Lipa City, Batangas',
            joinedDate: 'March 01, 2026'
        },
        {
            id: 5,
            name: 'Ricardo Gomez',
            email: 'ricardo@test.com',
            username: 'ricardogomez',
            role: 'staff',
            status: 'active',
            permissions: ['create', 'read', 'update'],
            location: 'Lipa City, Batangas',
            joinedDate: 'December 20, 2025'
        },
        {
            id: 6,
            name: 'Test Customer',
            email: 'ccc@test.com',
            username: 'ccctest',
            role: 'customer',
            status: 'active',
            permissions: ['read'],
            location: 'Lipa City, Batangas',
            joinedDate: 'March 17, 2026'
        }
    ];

    const currentUser = auth?.user || null
    const [modal, setModal] = useState(null)
    const [selectedUser, setSelectedUser] = useState(null)
    const [openMenuId, setOpenMenuId] = useState(null) // Track which user's menu is open
    const [searchTerm, setSearchTerm] = useState('') // Search term for filtering
    const [selectedRole, setSelectedRole] = useState('All') // Role filter state
    const [roleMenuOpen, setRoleMenuOpen] = useState(false) // Role dropdown toggle state
    const [sortOrder, setSortOrder] = useState('newest') // 'newest' or 'oldest' for Joined Date
    const [dateSortMenuOpen, setDateSortMenuOpen] = useState(false) // Date sort dropdown toggle state
    const [selectedUserIds, setSelectedUserIds] = useState([]) // Track selected user IDs

    // Role Management State
    const [selectedRoleIds, setSelectedRoleIds] = useState([]) // Track selected role IDs
    const [roles] = useState([
        { id: 1, name: 'Admin', description: 'Full system access', permissions: 'create, read, update, delete' },
        { id: 2, name: 'Staff', description: 'Limited administrative access', permissions: 'create, read, update' },
        { id: 3, name: 'Customer', description: 'Basic user access', permissions: 'read, update' },
    ])

    const { data, setData, post, patch, delete: destroy, processing, reset, clearErrors } = useForm({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'customer',
        permissions: [], // Use array structure to match backend
    })

    // Strict visibility logic constants
    const authUser = auth?.user || {};
    const authPermissions = Array.isArray(authUser.permissions) ? authUser.permissions : [];
    
    // Master Admin identity check - hardcoded override
    const isAdminIdentity = auth?.user?.email === 'admin@gmail.com';

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
        } else {
            reset()
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

        // Safety guard: Master Admin's permissions must be immutable
        if (user.email === 'admin@gmail.com' || user.id === 1) {
            return
        }

        const currentPermissions = (() => {
            if (Array.isArray(user.permissions)) return user.permissions
            if (user.permissions && typeof user.permissions === 'object') {
                return Object.keys(user.permissions).filter((key) => user.permissions[key])
            }
            return []
        })()
        
        // Show confirmation for critical permissions
        if (['delete', 'update'].includes(permission) && !isChecked) {
            if (!confirm(`Are you sure you want to remove the ${permission} permission?`)) {
                return
            }
        }
        
        const updatedPermissions = (() => {
            if (isChecked) {
                if (currentPermissions.includes(permission)) return currentPermissions
                return [...currentPermissions, permission]
            }
            return currentPermissions.filter((p) => p !== permission)
        })()

        // Send to backend
        router.patch(route('users.updatePermissions', userId), {
            permissions: updatedPermissions
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Force a page reload to get fresh data
                router.reload({ only: ['users'], preserveScroll: true })
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
        router.patch(route('users.updatePermissions', selectedUser.id), {
            permissions: (() => {
                const current = Array.isArray(data.permissions) ? data.permissions : []
                if (checked) {
                    return current.includes(name) ? current : [...current, name]
                }
                return current.filter((p) => p !== name)
            })()
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Force a page reload to get fresh data
                router.reload({ only: ['users'], preserveScroll: true })
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
        // 1. Define strict role strings
        const isMaster = user.email === 'admin@gmail.com';
        const userRole = isMaster ? 'admin' : user.role?.toLowerCase().trim();
        const activeFilter = selectedRole?.toLowerCase().trim();

        // 2. Search match (Name or Email)
        const matchesSearch = searchTerm === '' || (
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.location && user.location.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // 3. Strict Role match
        const matchesRole = activeFilter === 'all' || userRole === activeFilter;

        return matchesRole && matchesSearch;
    });

    // Sort users by Joined Date
    const finalDisplayUsers = [...filteredUsers].sort((a, b) => {
        const dateA = new Date(a.joinedDate || 'March 15, 2026');
        const dateB = new Date(b.joinedDate || 'March 15, 2026');
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Checkbox selection handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedUserIds(finalDisplayUsers.map(u => u.id));
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleSelectUser = (id) => {
        setSelectedUserIds(prev => 
            prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
        );
    };

    // Role selection handlers
    const handleSelectAllRoles = (e) => {
        if (e.target.checked) {
            setSelectedRoleIds(roles.map(r => r.id));
        } else {
            setSelectedRoleIds([]);
        }
    };

    const handleSelectRole = (id) => {
        setSelectedRoleIds(prev => 
            prev.includes(id) ? prev.filter(roleId => roleId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        // Filter out the Master Admin by email even if they are selected
        const usersToDelete = selectedUserIds.filter(id => {
            const user = users.find(u => u.id === id);
            return user && user.email !== 'admin@gmail.com';
        });

        if (usersToDelete.length === 0) {
            alert('Cannot delete Master Admin user.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${usersToDelete.length} users?`)) {
            setUsers(prev => prev.filter(user => !usersToDelete.includes(user.id)));
            setSelectedUserIds([]); // This will make the Delete button disappear automatically
            
            // Show success feedback
            setTimeout(() => {
                alert('Users deleted successfully.');
            }, 100);
        }
    };

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

    return (
        <>
            <AuthenticatedLayout
                user={currentUser}
                header={<h2 className="text-xl font-semibold text-gray-800">User Management</h2>}
            >
                <Head title="Admin Dashboard" />

            <div className="py-12">
                <div className="max-w-full w-full mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header - Fixed Layout: Left (Search) | Center (Filters) | Right (Actions) */}
                    <div className="flex items-center justify-between w-full mb-6 px-2 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        {/* Left: Search Bar */}
                        <div className="flex-1 max-w-md">
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search items..." 
                                className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Center: Filters */}
                        <div className="flex items-center gap-3">
                            {/* Permissions Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRoleMenuOpen(prev => !prev);
                                    }}
                                    className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white h-10 min-w-[140px]"
                                >
                                    <span className="text-sm">
                                        {selectedRole === 'All' ? 'Permissions: All' : `Permissions: ${selectedRole}`}
                                    </span>
                                    <ChevronIcon className="w-4 h-4 text-gray-400 ml-2" />
                                </button>
                                {roleMenuOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-40 bg-white shadow-lg rounded-md z-20 ring-1 ring-black ring-opacity-5">
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
                            
                            {/* Date Sort Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setDateSortMenuOpen(!dateSortMenuOpen)}
                                    className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white h-10 min-w-[140px]"
                                >
                                    <span className="text-sm">Joined: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
                                    <ChevronIcon className="w-4 h-4 text-gray-400 ml-2" />
                                </button>
                                {dateSortMenuOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-32 bg-white shadow-lg rounded-md z-20 ring-1 ring-black ring-opacity-5">
                                        <div className="py-1">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSortOrder('newest');
                                                    setDateSortMenuOpen(false);
                                                }} 
                                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            >
                                                Newest First
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSortOrder('oldest');
                                                    setDateSortMenuOpen(false);
                                                }} 
                                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            >
                                                Oldest First
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button className="h-10 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md font-medium hover:bg-gray-200 transition-colors flex items-center">
                                Export
                            </button>
                            {canCreate && (
                                <button
                                    onClick={() => openModal('create')}
                                    className="h-10 px-5 py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700 transition-colors flex items-center"
                                >
                                    + New User
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table Container - Improved spacing and consistency */}
                    {canRead ? (<>                    
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {/* Checkbox Column - Master Admin Only */}
                                        {isMasterAdmin && (
                                            <th className="px-6 py-4 text-left">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                    onChange={handleSelectAll}
                                                    checked={selectedUserIds.length === finalDisplayUsers.length && finalDisplayUsers.length > 0}
                                                />
                                            </th>
                                        )}

                                        {selectedUserIds.length > 0 ? (
                                            /* Contextual Action Bar - Improved styling */
                                            <th colSpan={isMasterAdmin ? 9 : 6} className="px-6 py-4 bg-indigo-50 border-l border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-indigo-700 font-semibold text-sm">{selectedUserIds.length} Selected</span>
                                                        <div className="h-4 w-px bg-gray-300"></div>
                                                        <button 
                                                            onClick={handleBulkDelete} 
                                                            className="text-red-600 font-semibold text-sm hover:text-red-800 transition-colors flex items-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete Selected
                                                        </button>
                                                    </div>
                                                    <button 
                                                        onClick={() => setSelectedUserIds([])} 
                                                        className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
                                                    >
                                                        Clear selection
                                                    </button>
                                                </div>
                                            </th>
                                        ) : (
                                            /* Standard Headers - Improved typography and spacing */
                                            <>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Full Name</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email Address</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    <button 
                                                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                                        className="flex items-center gap-2 hover:text-gray-700 focus:outline-none transition-colors"
                                                    >
                                                        <span>Joined Date</span>
                                                        {sortOrder === 'asc' ? (
                                                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 001.414 1.414l4-4a1 1 0 000-1.414l-4-4a1 1 0 00-1.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </th>
                                                {isMasterAdmin && (
                                                    <>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Permissions</th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role Management</th>
                                                    </>
                                                )}
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {finalDisplayUsers.map((user) => {
                                    const userPermissions = (() => {
                                        if (Array.isArray(user.permissions)) return user.permissions
                                        if (user.permissions && typeof user.permissions === 'object') {
                                            return Object.keys(user.permissions).filter((key) => user.permissions[key])
                                        }
                                        return []
                                    })()

                                    const isProtectedUser = user.email === 'admin@gmail.com' || user.id === 1
                                    
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            {/* Checkbox Column - Master Admin Only */}
                                            {isMasterAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                        onChange={() => handleSelectUser(user.id)}
                                                        checked={selectedUserIds.includes(user.id)}
                                                    />
                                                </td>
                                            )}
                                            
                                            {/* Full Name with Avatar */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-indigo-600 font-semibold text-sm">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                </div>
                                            </td>
                                            
                                            {/* Email Address */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{user.email}</div>
                                            </td>
                                            
                                            {/* Location */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{user.location}</div>
                                            </td>
                                            
                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {/* Status Dot */}
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${
                                                        user.status === 'active' ? 'bg-green-400' : 
                                                        user.status === 'pending' ? 'bg-yellow-400' : 'bg-gray-400'
                                                    }`}></div>
                                                    <span className={`text-sm font-medium ${
                                                        user.status === 'active' ? 'text-green-800' : 
                                                        user.status === 'pending' ? 'text-yellow-800' : 'text-gray-800'
                                                    }`}>
                                                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Joined Date */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{user.joinedDate}</div>
                                            </td>
                                            
                                            {/* Permissions - Master Admin Only */}
                                            {isMasterAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-wrap gap-1">
                                                        {userPermissions.map((perm, index) => (
                                                            <span 
                                                                key={index}
                                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeStyle(user.role)}`}
                                                            >
                                                                {perm}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            )}

                                            {/* Role Management - Live Permissions Toggle (Master Admin Only) */}
                                            {isMasterAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-wrap gap-2">
                                                        {['create', 'read', 'update', 'delete'].map((perm) => (
                                                            <label key={perm} className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                                    checked={userPermissions.includes(perm)}
                                                                    disabled={isProtectedUser}
                                                                    onChange={(e) => handlePermissionToggle(user.id, perm, e.target.checked)}
                                                                />
                                                                <span className="text-xs capitalize text-gray-700">{perm}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </td>
                                            )}
                                            
                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenMenuId(openMenuId === user.id ? null : user.id);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
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

                    </>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
                            <div className="text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No access to user data</h3>
                                <p className="mt-1 text-sm text-gray-500">You don't have permission to view user information.</p>
                            </div>
                        </div>
                    )}

            {/* Modal - Fixed positioning and structure */}
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
                                        <select value={data.role} onChange={handleRoleChange} className="w-full rounded-lg border-gray-300 focus:ring-indigo-500">
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

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-6 py-2 text-gray-500 font-bold hover:text-gray-700 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
                    </div> {/* Closes max-w-7xl */}
                </div> {/* Closes py-12 */}
            </AuthenticatedLayout>
        </>
        );
    }