import { Head, Link, router } from '@inertiajs/react';

export default function WaitingForApproval({ auth }) {
    const logout = () => {
        router.post(route('logout'));
    };

    // FIX: Instead of reloading the current page, try to visit the dashboard.
    // The middleware will handle the redirection logic.
    const refreshStatus = () => {
        router.get(route('dashboard'));
    };

    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100">
            <Head title="Pending Approval" />

            <div className="w-full sm:max-w-md mt-6 px-6 py-8 bg-white shadow-md overflow-hidden sm:rounded-lg text-center">
                <div className="mb-6">
                    <span className="text-5xl">⏳</span>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending</h2>
                
                <p className="text-gray-600 mb-6">
                    Hi <span className="font-semibold">{auth?.user?.name}</span>, your account is currently <strong>waiting for admin approval</strong>. 
                    Please check back later or contact your supervisor.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={refreshStatus}
                        className="w-full inline-flex justify-center items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 transition"
                    >
                        Refresh Status
                    </button>

                    <button
                        onClick={logout}
                        className="text-sm text-gray-600 underline hover:text-gray-900"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}