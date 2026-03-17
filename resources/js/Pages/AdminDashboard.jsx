import React, { useState } from 'react';

function AdminDashboard(){
    return(
        <div style={{display: 'flex' , minHeight: '100vh'}} >
            {/* Sidebar (Dark Grey) */}
            <aside style={{width: '250px' , backgroundColor: '#1a202c', color: 'white', padding: '20px' }}>
                <h2>Admin Panel</h2>
                <nav>
                    <p>Dashboard</p>
                    <p>Users</p>
                    <p>Settings</p>
                </nav>
            </aside>

            <main style={{ flex: 1, backgroundColor: '#f4f7f6', padding: '20px'}}>
                <h1>Overview</h1>
                <p>Welcome to the admin section.</p>
            </main>
        </div>
    );
}
export default AdminDashboard;