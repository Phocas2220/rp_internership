import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserManagement.css'; // Import the CSS file

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch users from backend
    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data);
        } catch (err) {
            setError('Failed to load users');
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Promote user to instructor
    const promoteUser = async (id) => {
        try {
            await axios.patch(`/api/users/${id}/update-role`, { role: 'lecturer' });
            fetchUsers();
        } catch (err) {
            alert('Failed to promote user');
            console.error(err);
        }
    };

    // Toggle user active/disable
    const toggleActive = async (id) => {
        try {
            await axios.patch(`/api/users/${id}/toggle-active`);
            fetchUsers();
        } catch (err) {
            alert('Failed to update user status');
            console.error(err);
        }
    };

    // Update User Role
    const updateUserRole = async (id, newRole) => {
        try {
            await axios.patch(`/api/users/${id}/update-role`, { role: newRole });
            fetchUsers(); // Refresh the list
        } catch (err) {
            alert(`Failed to change role to ${newRole}`);
            console.error(err);
        }
    };

    // Delete user
    const deleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`/api/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user');
            console.error(err);
        }
    };

    if (loading) return <p>Loading users...</p>;
    if (error) return <p className="text-red-600">{error}</p>;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            {users.length === 0 && <p>No users found.</p>}

            {/* Added 'user-management-table' class here */}
            <table className="user-management-table min-w-full">
                <thead>
                    <tr>
                        {/* Replaced Tailwind classes with 'user-management-table' class for headers */}
                        <th className="user-management-table">Username</th>
                        <th className="user-management-table">Email</th>
                        <th className="user-management-table">Role</th>
                        <th className="user-management-table">Active</th>
                        <th className="user-management-table">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(({ id, username, email, role, active }) => (
                        <tr key={id} className={active ? '' : 'inactive-user'}> {/* Using CSS class for inactive user */}
                            {/* Replaced Tailwind classes with 'user-management-table' class for data cells */}
                            <td className="user-management-table">{username}</td>
                            <td className="user-management-table">{email}</td>
                            <td className="user-management-table">
                                {role === 'administrator' ? (
                                    <span className="font-bold text-purple-700">{role}</span>
                                ) : (
                                    <select
                                        value={role}
                                        onChange={(e) => updateUserRole(id, e.target.value)}
                                        className="border rounded p-1"
                                    >
                                        <option value="learner">learner</option>
                                        <option value="lecturer">lecturer</option>
                                        <option value="administrator">administrator</option>
                                    </select>
                                )}
                            </td>
                            <td className="user-management-table">{active ? 'Yes' : 'No'}</td>
                            <td className="user-management-table space-x-2">
                               <button
                                    onClick={() => toggleActive(id)}
                                    className={`btn btn-sm ${active ? 'btn-warning' : 'btn-success'}`}
                                    title={active ? 'Disable User' : 'Enable User'}
                                >
                                    {active ? 'Disable' : 'Enable'}
                                </button>
                                
                                <button
                                    onClick={() => deleteUser(id)}
                                    className="btn btn-sm btn-danger"
                                    title="Delete User"
                                >
                                    Delete
                                </button>
                                
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagement;