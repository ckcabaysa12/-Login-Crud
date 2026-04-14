import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, router, useForm, usePage } from '@inertiajs/react'
import { useState, useEffect, useCallback, useRef } from 'react'

// Chevron Icon Component
const ChevronIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
)

const ACTIVITY_LABELS = {
    user_created: 'Created user',
    user_updated: 'Updated user',
    user_approved: 'Approved user',
    user_deleted: 'Deleted user',
    users_bulk_deleted: 'Bulk deleted users',
    user_self_registered: 'Registered (awaiting approval)',
    user_logged_in: 'User logged in',
}

/** Inertia may expose list props as objects; partial reloads must still render. */
function coerceListProp(raw) {
    if (raw == null) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'object') return Object.values(raw)
    return []
}

/** Checkbox state for the modal — mirrors backend permissionSlugs(). */
function permissionsFromUserRecord(user) {
    if (!user) return []
    if (user.email === 'admin@gmail.com') {
        return ['create', 'read', 'update', 'delete']
    }
    const p = user.permissions
    if (Array.isArray(p)) {
        return p.filter((x) => typeof x === 'string' && x !== '')
    }
    if (p && typeof p === 'object') {
        return Object.entries(p)
            .filter(([, v]) => v === true || v === 1 || v === '1')
            .map(([k]) => k)
    }
    return []
}

/** When the role dropdown changes, pre-fill permission checkboxes (admin can still edit). */
const ROLE_TEMPLATE_PERMISSIONS = {
    admin: ['create', 'read', 'update', 'delete'],
    staff: ['create', 'read'],
    customer: [],
    manager: ['create', 'read', 'update'],
    viewer: ['read'],
    support: ['read', 'update'],
}

const ROLE_FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'admin', label: 'Admin' },
    { value: 'staff', label: 'Staff' },
    { value: 'customer', label: 'Customer' },
    { value: 'manager', label: 'Manager' },
    { value: 'viewer', label: 'Viewer' },
    { value: 'support', label: 'Support' },
]

/** Laravel paginator from Inertia, or legacy plain array. */
function normalizeUsersPaginator(raw) {
    if (raw && Array.isArray(raw.data)) {
        return raw
    }
    if (Array.isArray(raw)) {
        return {
            data: raw,
            meta: {
                current_page: 1,
                last_page: 1,
                from: raw.length ? 1 : 0,
                to: raw.length,
                total: raw.length,
            },
            links: [],
        }
    }
    return {
        data: [],
        meta: { current_page: 1, last_page: 1, from: 0, to: 0, total: 0 },
        links: [],
    }
}

/** Laravel pagination labels often include HTML entities (&laquo;) and optional tags. */
function decodePaginationLabel(html) {
    if (typeof html !== 'string') return ''
    if (typeof document === 'undefined') {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&laquo;/gi, '«')
            .replace(/&raquo;/gi, '»')
            .replace(/&lsaquo;/gi, '‹')
            .replace(/&rsaquo;/gi, '›')
            .replace(/&nbsp;/g, ' ')
            .replace(/&#0*38;/g, '&')
            .replace(/&amp;/gi, '&')
            .replace(/&quot;/gi, '"')
            .trim()
    }
    const t = document.createElement('textarea')
    t.innerHTML = html
    return t.value.trim()
}

export default function Dashboard({ auth, users: usersRaw, filters: filtersProp = {}, stats: statsProp = {}, activityLog: activityLogProp = [], isMasterAdmin }) {

    const currentUser = auth?.user || null
    const [modal, setModal] = useState(null)
    const [selectedUser, setSelectedUser] = useState(null)
    const [openMenuId, setOpenMenuId] = useState(null)
    const [roleMenuOpen, setRoleMenuOpen] = useState(false)
    const [dateSortMenuOpen, setDateSortMenuOpen] = useState(false)
    const [selectedUserIds, setSelectedUserIds] = useState([])

    const { data, setData, post, patch, delete: destroy, processing, reset, clearErrors, errors: formErrors } = useForm({
        name: '',
        email: '',
        username: '',
        location: '',
        password: '',
        role: 'customer',
        status: 'pending',
        permissions: [],
    })

    const { props: pageProps } = usePage()
    const activityLog = coerceListProp(pageProps.activityLog ?? activityLogProp)
    const filters = pageProps.filters ?? filtersProp ?? {}
    const stats = pageProps.stats ?? statsProp ?? {}
    const usersPaginator = normalizeUsersPaginator(pageProps.users ?? usersRaw)
    const pagedUsers = usersPaginator.data ?? []
    const pg = usersPaginator
    const meta = pg.meta ?? {}
    const usersMeta = {
        current_page: meta.current_page ?? pg.current_page ?? 1,
        last_page: meta.last_page ?? pg.last_page ?? 1,
        from: meta.from ?? pg.from ?? 0,
        to: meta.to ?? pg.to ?? 0,
        total: meta.total ?? pg.total ?? 0,
    }
    const rawLinks = pg.links
    const paginationLinks = Array.isArray(rawLinks)
        ? rawLinks
        : (rawLinks && typeof rawLinks === 'object' ? Object.values(rawLinks) : [])

    const selectedRole = filters.role ?? 'all'
    const sortOrder = filters.sort === 'oldest' ? 'oldest' : 'newest'

    const [searchTerm, setSearchTerm] = useState(() => filters.search ?? '')
    useEffect(() => {
        setSearchTerm(filters.search ?? '')
    }, [filters.search])

    const visitDashboard = (overrides = {}) => {
        router.get(
            route('dashboard'),
            {
                search: overrides.search !== undefined ? overrides.search : searchTerm,
                role: overrides.role !== undefined ? overrides.role : selectedRole,
                sort: overrides.sort !== undefined ? overrides.sort : sortOrder,
                page: overrides.page !== undefined ? overrides.page : 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['users', 'filters', 'activityLog'],
            },
        )
    }

    const searchDebounceSkip = useRef(true)
    useEffect(() => {
        if (searchDebounceSkip.current) {
            searchDebounceSkip.current = false
            return
        }
        const id = setTimeout(() => {
            visitDashboard({ page: 1 })
        }, 400)
        return () => clearTimeout(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only debounce search text
    }, [searchTerm])

    const refreshUsersAndActivity = useCallback(() => {
        router.reload({ only: ['users', 'activityLog', 'filters'], preserveScroll: true })
    }, [])

    useEffect(() => {
        const interval = setInterval(refreshUsersAndActivity, 5000)

        return () => clearInterval(interval)
    }, [refreshUsersAndActivity])

    const authPermissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : []

    const isAdminIdentity = currentUser?.email === 'admin@gmail.com'

    const canCreate = isAdminIdentity || authPermissions.includes('create');
    const canRead   = isAdminIdentity || authPermissions.includes('read');
    const canUpdate = isAdminIdentity || authPermissions.includes('update');
    const canDelete = isAdminIdentity || authPermissions.includes('delete');

    const getBadgeStyle = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'bg-purple-100 text-purple-700';
            case 'staff': return 'bg-blue-100 text-blue-700';
            case 'manager': return 'bg-indigo-100 text-indigo-800';
            case 'support': return 'bg-teal-100 text-teal-800';
            case 'viewer': return 'bg-slate-100 text-slate-700';
            case 'customer': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

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

    const closeMenu = () => {
        setOpenMenuId(null)
    }

    /* ------------------------------------------
        HELPERS
    -------------------------------------------*/
    
    const handleRoleChange = (e) => {
        const newRole = e.target.value
        setData('role', newRole)
        setData('permissions', ROLE_TEMPLATE_PERMISSIONS[newRole] ?? [])
    }

    const openModal = (type, user = null) => {
        setSelectedUser(user)
        clearErrors()

        if (type === 'create' || !user) {
            reset()
            setModal('create')
            return
        }

        const userRole = user.email === 'admin@gmail.com' ? 'admin' : (user.role || 'customer')

        setData('name', user.name ?? '')
        setData('email', user.email ?? '')
        setData('username', user.username ?? '')
        setData('location', user.location ?? '')
        setData('password', '')
        setData('role', userRole)
        setData('status', user.status ?? 'pending')
        setData('permissions', permissionsFromUserRecord(user))
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

    const confirmDelete = () => {
        if (!selectedUser) return

        // Prevent deletion of Master Admin
        if (selectedUser.email === 'admin@gmail.com') {
            alert('Cannot delete Master Admin user.')
            return
        }

        destroy(route('users.destroy', selectedUser.id), {
            onSuccess: () => {
                closeModal()
                refreshUsersAndActivity()
            },
        })
    }

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedUserIds(pagedUsers.map((u) => u.id))
        } else {
            setSelectedUserIds([])
        }
    }

    const handleSelectUser = (id) => {
        setSelectedUserIds(prev => 
            prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        const usersToDelete = selectedUserIds.filter((id) => {
            const user = pagedUsers.find((u) => u.id === id)
            return user && user.email !== 'admin@gmail.com'
        })

        if (usersToDelete.length === 0) {
            alert('No deletable users selected (Master Admin is protected).')
            return
        }

        if (!window.confirm(`Delete ${usersToDelete.length} user(s)? This cannot be undone.`)) {
            return
        }

        router.post(route('users.bulk-destroy'), { ids: usersToDelete }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedUserIds([])
                refreshUsersAndActivity()
            },
        })
    }

    /* ------------------------------------------
        CRUD ACTIONS
    -------------------------------------------*/
    const submitCreate = (e) => {
        e.preventDefault()
        post(route('users.store'), {
            onSuccess: () => {
                closeModal()
                refreshUsersAndActivity()
            },
        })
    }

    const submitUpdate = (e) => {
        e.preventDefault()
        patch(route('users.update', selectedUser.id), {
            onSuccess: () => {
                closeModal()
                refreshUsersAndActivity()
            },
            onError: (errors) => {
                console.error('Update errors:', errors)
                // Display errors to user
                Object.keys(errors).forEach(key => {
                    const errorElement = document.querySelector(`[name="${key}"]`)
                    if (errorElement) {
                        errorElement.classList.add('border-red-500')
                        // You can add error message display here
                    }
                })
            }
        })
    }

    const submitApprove = (e) => {
        e.preventDefault()
        patch(route('users.approve', selectedUser.id), {
            onSuccess: () => {
                closeModal()
                refreshUsersAndActivity()
            },
        })
    }

    const activitySummary = (entry) => {
        const label = ACTIVITY_LABELS[entry.action] || entry.action
        const target =
            entry.subject?.email ||
            entry.properties?.target_email ||
            entry.properties?.email ||
            (Array.isArray(entry.properties?.emails) && entry.properties.emails.length
                ? `${entry.properties.emails.length} account(s)`
                : null)
        return target ? `${label}: ${target}` : label
    }

    const canManageRow = (user) => (
        (user.status !== 'active' && isMasterAdmin)
        || (user.status === 'active' && (
            (canUpdate && user.can_update) || (canDelete && user.can_delete)
        ))
    )

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded shadow text-center">
                    <h1 className="text-red-600 font-bold text-xl">Session lost</h1>
                    <a
                        href="/login"
                        className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded font-bold"
                    >
                        Go to login
                    </a>
                </div>
            </div>
        )
    }

    return (
        <>
            <AuthenticatedLayout
                user={currentUser}
                header={<h2 className="text-xl font-semibold text-gray-800">User Management</h2>}
            >
                <Head title="Admin Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {formErrors && Object.keys(formErrors).length > 0 && (
                        <div
                            role="alert"
                            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                        >
                            <p className="font-semibold">Could not save user</p>
                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                {Object.entries(formErrors).map(([key, message]) => (
                                    <li key={key}>{Array.isArray(message) ? message.join(' ') : message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {canRead && (
                        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <div className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Total users</p>
                                <p className="mt-1 text-xl font-semibold text-gray-900">{stats.total ?? 0}</p>
                            </div>
                            <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 shadow-sm">
                                <p className="text-xs uppercase tracking-wide text-green-700">Active</p>
                                <p className="mt-1 text-xl font-semibold text-green-900">{stats.active ?? 0}</p>
                            </div>
                            <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 shadow-sm">
                                <p className="text-xs uppercase tracking-wide text-amber-700">Pending</p>
                                <p className="mt-1 text-xl font-semibold text-amber-900">{stats.pending ?? 0}</p>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 shadow-sm">
                                <p className="text-xs uppercase tracking-wide text-slate-700">Inactive</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">{stats.inactive ?? 0}</p>
                            </div>
                        </div>
                    )}

                    {/* Toolbar: search (left) | filters (center) | actions (right) on large screens */}
                    <div className="mb-6 w-full rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_1fr_auto] lg:items-center lg:gap-6">
                        {/* Search */}
                        <div className="min-w-0 w-full">
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search users…" 
                                className="w-full h-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3 min-w-0">
                            <div className="relative role-dropdown">
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRoleMenuOpen(prev => !prev);
                                    }}
                                    className="flex items-center justify-between w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white h-10 min-w-[180px]"
                                >
                                    <span className="text-sm">
                                        Role: {ROLE_FILTER_OPTIONS.find((r) => r.value === selectedRole)?.label ?? 'All'}
                                    </span>
                                    <ChevronIcon className="w-4 h-4 text-gray-400 ml-2" />
                                </button>
                                {roleMenuOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white shadow-lg rounded-md z-20 ring-1 ring-black ring-opacity-5">
                                        <div className="py-1 max-h-64 overflow-y-auto">
                                            {ROLE_FILTER_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        visitDashboard({ role: opt.value, page: 1 })
                                                        setRoleMenuOpen(false)
                                                    }}
                                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Date Sort Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setDateSortMenuOpen(!dateSortMenuOpen)}
                                    className="flex items-center justify-between w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white h-10 min-w-[140px]"
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
                                                    visitDashboard({ sort: 'newest', page: 1 });
                                                    setDateSortMenuOpen(false);
                                                }} 
                                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                            >
                                                Newest First
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    visitDashboard({ sort: 'oldest', page: 1 });
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

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:self-center">
                            <a
                                href={route('resume.pdf')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-10 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md font-medium hover:bg-gray-200 transition-colors inline-flex items-center justify-center shrink-0"
                            >
                                Export PDF
                            </a>
                            {canCreate && (
                                <button
                                    onClick={() => openModal('create')}
                                    className="h-10 px-5 py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700 transition-colors inline-flex items-center justify-center shrink-0"
                                >
                                    + New User
                                </button>
                            )}
                        </div>
                        </div>
                    </div>

                    {/* Table Container - Improved spacing and consistency */}
                    {canRead ? (
                        <>
                        <div className="space-y-3 lg:hidden">
                            {pagedUsers.map((user) => {
                                const userPermissions = Array.isArray(user.permissions) ? user.permissions : Object.values(user.permissions || {})
                                const canManageThisRow = canManageRow(user)

                                return (
                                    <div key={user.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>
                                            {canManageThisRow && (
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        aria-label="Open row actions"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setOpenMenuId(openMenuId === user.id ? null : user.id)
                                                        }}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                        </svg>
                                                    </button>
                                                    {openMenuId === user.id && (
                                                        <div className="dropdown-menu absolute right-0 top-full z-50 mt-1 w-36 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
                                                            {user.status !== 'active' ? (
                                                                isMasterAdmin && (
                                                                    <>
                                                                        <button onClick={() => { openModal('approve', user); closeMenu(); }} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Approve</button>
                                                                        <button onClick={() => { openModal('delete', user); closeMenu(); }} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100">Deny</button>
                                                                    </>
                                                                )
                                                            ) : (
                                                                <>
                                                                    {canUpdate && user.can_update && (
                                                                        <button onClick={() => { openModal('edit', user); closeMenu(); }} className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Edit</button>
                                                                    )}
                                                                    {canDelete && user.can_delete && (
                                                                        <button onClick={() => { openModal('delete', user); closeMenu(); }} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100">Delete</button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                            <p><span className="font-medium text-gray-800">Role:</span> {user.role}</p>
                                            <p><span className="font-medium text-gray-800">Status:</span> {user.status}</p>
                                            <p className="col-span-2"><span className="font-medium text-gray-800">Location:</span> {user.location || '-'}</p>
                                            <p className="col-span-2"><span className="font-medium text-gray-800">Joined:</span> {user.joinedDate}</p>
                                            {isMasterAdmin && (
                                                <p className="col-span-2 truncate"><span className="font-medium text-gray-800">Permissions:</span> {userPermissions.join(', ') || '-'}</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="hidden rounded-lg border border-gray-100 bg-white shadow-sm overflow-visible lg:block">
                            <table className="w-full table-auto divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {/* Checkbox Column - Master Admin Only */}
                                        {isMasterAdmin && (
                                            <th className="w-10 px-3 py-4 text-left">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                    onChange={handleSelectAll}
                                                    checked={selectedUserIds.length === pagedUsers.length && pagedUsers.length > 0}
                                                />
                                            </th>
                                        )}
                                        {selectedUserIds.length > 0 ? (
                                            <>
                                                {/* Contextual Action Bar - Improved styling */}
                                                <th colSpan="7" className="px-6 py-4 bg-indigo-50 border-l border-gray-200">
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
                                            </>
                                        ) : (
                                            <>
                                                {/* Standard Headers - Improved typography and spacing */}
                                                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Full Name</th>
                                                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email Address</th>
                                                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Joined Date
                                                </th>
                                                {isMasterAdmin && (
                                                    <th className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Permissions</th>
                                                )}
                                                <th className="w-16 px-3 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {pagedUsers.map((user) => {
                                        // Sanitize permissions data to always be an array
                                        const userPermissions = Array.isArray(user.permissions) ? user.permissions : Object.values(user.permissions || {});
                                     
                                        const canManageThisRow = canManageRow(user)

                                        return (
                                            <tr key={user.id} className="transition-colors hover:bg-gray-50">
                                                {/* Checkbox Column - Master Admin Only */}
                                                {isMasterAdmin && (
                                                    <td className="w-10 px-3 py-4 whitespace-nowrap">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                            onChange={() => handleSelectUser(user.id)}
                                                            checked={selectedUserIds.includes(user.id)}
                                                        />
                                                    </td>
                                                )}
                                                
                                                {/* Full Name with Avatar */}
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                                            <span className="text-indigo-600 font-semibold text-sm">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="max-w-[170px] truncate text-sm font-medium text-gray-900">{user.name}</div>
                                                    </div>
                                                </td>
                                                
                                                {/* Email Address */}
                                                <td className="px-3 py-4">
                                                    <div className="max-w-[220px] truncate text-sm text-gray-600">{user.email}</div>
                                                </td>
                                                
                                                {/* Location */}
                                                <td className="px-3 py-4">
                                                    <div className="max-w-[160px] truncate text-sm text-gray-600">{user.location}</div>
                                                </td>
                                                
                                                {/* Status */}
                                                <td className="px-3 py-4 whitespace-nowrap">
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
                                                <td className="px-3 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600">{user.joinedDate}</div>
                                                </td>
                                                
                                                {/* Permissions - Master Admin Only */}
                                                {isMasterAdmin && (
                                                    <td className="px-3 py-4">
                                                        <div className="max-w-[180px] truncate text-xs text-gray-700">{userPermissions.join(', ')}</div>
                                                    </td>
                                                )}
                                                
                                                {/* Actions */}
                                                <td className="whitespace-nowrap px-3 py-4 text-right align-middle">
                                                    {canManageThisRow && (
                                                        <div className="relative flex justify-end">
                                                            <button 
                                                                type="button"
                                                                aria-label="Open row actions"
                                                                aria-expanded={openMenuId === user.id}
                                                                aria-haspopup="menu"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(openMenuId === user.id ? null : user.id);
                                                                }}
                                                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                                            >
                                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                                </svg>
                                                            </button>
                                                            
                                                            {/* Dropdown Menu */}
                                                            {openMenuId === user.id && (
                                                                <div className="dropdown-menu absolute right-0 top-full z-50 mt-1 w-36 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
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
                                                                                {canUpdate && user.can_update && (
                                                                                    <button 
                                                                                        onClick={() => { openModal('edit', user); closeMenu(); }} 
                                                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                                    >
                                                                                        Edit
                                                                                    </button>
                                                                                )}
                                                                                {canDelete && user.can_delete && (
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
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <p className="text-sm text-gray-600">
                                {usersMeta.total === 0 ? (
                                    'No users match the current filters.'
                                ) : (
                                    <>
                                        Showing{' '}
                                        <span className="font-medium text-gray-900">{usersMeta.from ?? 0}</span>
                                        –
                                        <span className="font-medium text-gray-900">{usersMeta.to ?? 0}</span>
                                        {' '}of <span className="font-medium text-gray-900">{usersMeta.total}</span>
                                        {' '}users
                                        {filters.search || selectedRole !== 'all' ? ' (filtered)' : ''}
                                        {' · '}
                                        Page <span className="font-medium text-gray-900">{usersMeta.current_page}</span>
                                        {' '}of <span className="font-medium text-gray-900">{usersMeta.last_page}</span>
                                    </>
                                )}
                            </p>
                            {paginationLinks.length > 0 && usersMeta.last_page > 1 && (
                                <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="Pagination">
                                    {paginationLinks.map((link, idx) => (
                                        link.url ? (
                                            <Link
                                                key={idx}
                                                href={link.url}
                                                preserveScroll
                                                only={['users', 'filters', 'activityLog']}
                                                className={`min-w-[2.25rem] rounded-md px-2 py-1.5 text-center text-sm font-medium ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {decodePaginationLabel(link.label)}
                                            </Link>
                                        ) : (
                                            <span
                                                key={idx}
                                                className="min-w-[2.25rem] cursor-default rounded-md px-2 py-1.5 text-center text-sm text-gray-400"
                                            >
                                                {decodePaginationLabel(link.label)}
                                            </span>
                                        )
                                    ))}
                                </nav>
                            )}
                        </div>
                        </>
                    ) : null}

                    {canRead && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-6">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Activity log</h3>
                                <p className="text-xs text-gray-500 mt-1">Recent user management actions (newest first).</p>
                            </div>
                            {activityLog.length === 0 ? (
                                <p className="px-6 py-6 text-sm text-gray-500">No activity recorded yet.</p>
                            ) : (
                                <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                                    {activityLog.map((entry) => (
                                        <li key={entry.id} className="px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                            <div>
                                                <p className="text-sm text-gray-900">{activitySummary(entry)}</p>
                                                <p className="text-xs text-gray-500">
                                                    {entry.actor ? (
                                                        <>
                                                            By <span className="font-medium text-gray-700">{entry.actor.name}</span>
                                                            {entry.actor.email ? ` (${entry.actor.email})` : ''}
                                                        </>
                                                    ) : (
                                                        'System'
                                                    )}
                                                    {entry.ip_address ? ` · ${entry.ip_address}` : ''}
                                                </p>
                                            </div>
                                            <time className="text-xs text-gray-500 whitespace-nowrap sm:text-right" dateTime={entry.created_at}>
                                                {entry.created_at_display}
                                            </time>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {!canRead ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
                            <div className="text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No access to user data</h3>
                                <p className="mt-1 text-sm text-gray-500">You don't have permission to view user information.</p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Modal: flex column + scroll body so all fields fit on small viewports */}
            {modal && (
                <div
                    className="fixed inset-0 z-50 flex justify-center bg-black/50 p-2 sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="user-modal-title"
                    onClick={closeModal}
                >
                    <div
                        className="flex max-h-[min(100dvh,100vh)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
                            <h3 id="user-modal-title" className="text-lg font-bold leading-snug text-gray-900 sm:text-xl">
                                {modal === 'create' && 'Add new account'}
                                {modal === 'edit' && `Edit user: ${selectedUser?.name}`}
                                {modal === 'approve' && `Approve user: ${selectedUser?.name}`}
                                {modal === 'delete' && (selectedUser?.status === 'pending' ? 'Reject application?' : 'Delete user?')}
                            </h3>
                        </div>

                        {modal === 'delete' ? (
                            <>
                                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
                                    <p className="text-center text-sm leading-relaxed text-gray-600 sm:text-base">
                                        Are you sure you want to {selectedUser?.status === 'pending' ? 'deny access for' : 'remove'}{' '}
                                        <span className="font-semibold text-gray-900">{selectedUser?.name}</span>? This cannot be undone.
                                    </p>
                                </div>
                                <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-6">
                                    <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={confirmDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                                        Confirm
                                    </button>
                                </div>
                            </>
                        ) : (
                            <form
                                autoComplete="off"
                                onSubmit={modal === 'create' ? submitCreate : (modal === 'approve' ? submitApprove : submitUpdate)}
                                className="flex min-h-0 flex-1 flex-col overflow-hidden"
                            >
                                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
                                {modal !== 'approve' && (
                                    <div className="space-y-3 sm:space-y-4">
                                        <input
                                            type="text"
                                            name="manage_user_full_name"
                                            placeholder="Full Name"
                                            autoComplete="off"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 text-base focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            required
                                        />
                                        <input
                                            type="email"
                                            name="manage_user_email"
                                            placeholder="Email Address"
                                            autoComplete="off"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 text-base focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            required
                                        />
                                        <input
                                            type="text"
                                            name="manage_user_username"
                                            placeholder="Username"
                                            autoComplete="off"
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 text-base focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            required
                                        />
                                        <input
                                            type="text"
                                            name="manage_user_location"
                                            placeholder="Location"
                                            autoComplete="off"
                                            value={data.location || ''}
                                            onChange={(e) => setData('location', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 text-base focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        <input
                                            type="password"
                                            name="manage_user_password"
                                            placeholder={modal === 'create' ? 'Password (required)' : 'Password (leave blank to keep current)'}
                                            autoComplete="new-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 text-base focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            required={modal === 'create'}
                                        />
                                    </div>
                                )}
                                
                                {isMasterAdmin && modal !== 'approve' && (
                                    <div className="space-y-4 border-t border-gray-100 pt-4">
                                        <label className="block text-sm font-bold text-gray-700">Role</label>
                                        <select
                                            value={data.role}
                                            onChange={handleRoleChange}
                                            className="w-full rounded-lg border-gray-300 text-base focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                            <option value="admin">Administrator</option>
                                            <option value="staff">Staff</option>
                                            <option value="customer">Customer</option>
                                            <option value="manager">Manager</option>
                                            <option value="viewer">Viewer</option>
                                            <option value="support">Support</option>
                                        </select>

                                        {modal !== 'approve' && (
                                            <>
                                                <label className="block text-sm font-bold text-gray-700">Account status</label>
                                                <select
                                                    value={data.status}
                                                    onChange={(e) => setData('status', e.target.value)}
                                                    className="w-full rounded-lg border-gray-300 text-base focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </>
                                        )}
                                        
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Permissions</p>
                                            <p className="mb-3 text-xs text-gray-600">Checked abilities match what this user can do in the app (enforced on the server).</p>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                                                {['create', 'read', 'update', 'delete'].map((perm) => (
                                                    <label key={perm} className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-2 py-2 ring-1 ring-gray-200">
                                                        <input 
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={!!(data.permissions && data.permissions.includes(perm))}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                const updated = checked 
                                                                    ? [...data.permissions, perm] 
                                                                    : data.permissions.filter(p => p !== perm);
                                                                setData('permissions', updated);
                                                            }}
                                                        />
                                                        <span className="text-sm capitalize text-gray-800">{perm}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {modal === 'approve' && (
                                    <p className="text-sm text-gray-600">
                                        This will mark the account as active and verified for login.
                                    </p>
                                )}
                                </div>

                                <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-6">
                                    <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={processing} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50">
                                        {modal === 'approve' ? 'Approve now' : 'Save user'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
        </>
    )
}
