import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link } from '@inertiajs/react'

export default function Home({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold text-gray-800">Home</h2>}
        >
            <Head title="Home" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm">
                        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {auth.user?.name}!</h1>
                        <p className="mt-3 text-gray-600">
                            This is your home page. Your account is active and ready to use.
                        </p>
                        <p className="mt-1 text-gray-600">
                            Use this space for regular user features while admin/staff continue using user management.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href={route('profile.edit')}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                Edit profile
                            </Link>
                            <Link
                                href={route('account.status')}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                                View account status
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
