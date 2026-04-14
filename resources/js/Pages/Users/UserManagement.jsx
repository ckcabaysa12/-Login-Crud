import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import UserModal from './Modal';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
            setError(null);
        } catch {
            setError('Could not load users.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAddUser = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h1>User Management</h1>
            <button type="button" onClick={handleAddUser}>Add User</button>
            <ul>
                {users.map((user) => (
                    <li key={user.id}>
                        {user.name} — {user.email}
                        <button type="button" onClick={() => handleEditUser(user)}>Edit</button>
                    </li>
                ))}
            </ul>
            {isModalOpen && (
                <UserModal user={selectedUser} onClose={handleCloseModal} />
            )}
        </div>
    );
};

export default UserManagement;
