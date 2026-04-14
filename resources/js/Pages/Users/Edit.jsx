import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditUser = ({ userId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        status: 'active',
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`/api/users/${userId}`);
                const u = response.data;
                setFormData({
                    name: u.name ?? '',
                    email: u.email ?? '',
                    username: u.username ?? '',
                    password: '',
                    status: u.status ?? 'active',
                });
                setError(null);
            } catch {
                setError('User not found');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

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
            if (!payload.password) {
                delete payload.password;
            }
            await axios.patch(`/users/${userId}`, payload);
            onClose();
        } catch {
            setError('Failed to update user');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h1>Edit User</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                <input
                    type="password"
                    name="password"
                    placeholder="Leave blank to keep current"
                    value={formData.password}
                    onChange={handleChange}
                />
                <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <button type="submit">Update User</button>
            </form>
        </div>
    );
};

export default EditUser;
