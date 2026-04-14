import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, usePage } from '@inertiajs/react'
import DeleteUserForm from './Partials/DeleteUserForm'
import UpdatePasswordForm from './Partials/UpdatePasswordForm'
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm'

export default function Edit({ mustVerifyEmail, status }) {
    const page = usePage()
    const flash = page.props.flash
    const canViewUserManagement = page.props.canViewUserManagement

    return (
        <AuthenticatedLayout
            user={page.props.auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Profile</h2>}
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {flash?.message && (
                        <div
                            role="alert"
                            className={`rounded-lg border px-4 py-3 text-sm ${
                                flash.type === 'error'
                                    ? 'border-red-200 bg-red-50 text-red-800'
                                    : 'border-green-200 bg-green-50 text-green-800'
                            }`}
                        >
                            {flash.message}
                        </div>
                    )}

                    {canViewUserManagement && (
                        <div className="px-4 sm:px-0">
                            <Link
                                href={route('dashboard')}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                ← Back to user management
                            </Link>
                        </div>
                    )}

                    <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
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
    )
}
