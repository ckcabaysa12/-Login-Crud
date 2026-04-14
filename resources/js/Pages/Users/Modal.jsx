import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserModal = ({ user, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        status: 'pending',
        role: 'customer',
        permissions: ['read'],
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name ?? '',
                email: user.email ?? '',
                username: user.username ?? '',
                password: '',
                status: user.status ?? 'pending',
                role: user.role ?? 'customer',
                permissions: Array.isArray(user.permissions) ? user.permissions : ['read'],
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (user && !payload.password) {
                delete payload.password;
            }

            if (user) {
                await axios.patch(`/users/${user.id}`, payload);
            } else {
                await axios.post('/users', payload);
            }
            onClose();
        } catch (err) {
            console.error('Failed to save user', err);
        }
    };

    return (
        <div>
            <h1>{user ? 'Edit User' : 'Add User'}</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                <input
                    type="password"
                    name="password"
                    placeholder={user ? 'Leave blank to keep current' : 'Password'}
                    value={formData.password}
                    onChange={handleChange}
                    required={!user}
                />
                <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select name="role" value={formData.role} onChange={handleChange}>
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit">{user ? 'Update User' : 'Add User'}</button>
            </form>
        </div>
    );
};

export default UserModal;
