import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, usePage } from '@inertiajs/react'

function StatusBadge({ status }) {
    const normalized = String(status || '').toLowerCase()
    const styles = {
        active: 'bg-green-100 text-green-800',
        pending: 'bg-amber-100 text-amber-800',
        inactive: 'bg-slate-100 text-slate-700',
    }
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[normalized] ?? styles.inactive}`}>
            {normalized ? normalized[0].toUpperCase() + normalized.slice(1) : 'Unknown'}
        </span>
    )
}

export default function AccountStatus() {
    const { auth } = usePage().props
    const user = auth?.user
    const lastLoginAt = user?.last_login_at
        ? new Date(user.last_login_at).toLocaleString()
        : 'No login activity recorded yet'

    return (
        <AuthenticatedLayout
            user={user}
            header={<h2 className="text-xl font-semibold text-gray-800">Account Status</h2>}
        >
            <Head title="Account Status" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                        <p className="text-sm text-gray-500">Current account overview</p>
                        <h1 className="mt-1 text-2xl font-bold text-gray-900">{user?.name}</h1>

                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Username</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">{user?.username || '-'}</p>
                            </div>
                            <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">{user?.email || '-'}</p>
                            </div>
                            <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Role</p>
                                <p className="mt-1 text-sm font-medium capitalize text-gray-900">{user?.role || '-'}</p>
                            </div>
                            <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                                <div className="mt-1"><StatusBadge status={user?.status} /></div>
                            </div>
                            <div className="rounded-md border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Last login</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">{lastLoginAt}</p>
                                <p className="mt-1 text-xs text-gray-500">IP: {user?.last_login_ip || '-'}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link href={route('profile.edit')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                                Edit profile
                            </Link>
                            <Link href={route('home')} className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                                Back to home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
