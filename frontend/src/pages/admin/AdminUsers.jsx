import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { FiUser, FiPlus, FiTrash2, FiEdit2, FiSlash } from 'react-icons/fi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(2); // default customer
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers();
      if (res?.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditUserId(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRoleId(2);
    setModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditUserId(u.id);
    setFullName(u.full_name);
    setEmail(u.email);
    setPhone(u.phone);
    setPassword('');
    setRoleId(u.role_id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editUserId) {
        // Edit User
        const payload = {
          full_name: fullName,
          email,
          phone,
        };
        await adminApi.updateUser(editUserId, payload);
        alert('User details updated successfully!');
      } else {
        // Create User
        const payload = {
          role_id: Number(roleId),
          full_name: fullName,
          email,
          phone,
          password,
        };
        await adminApi.createUser(payload);
        alert('User created successfully!');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to save user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    if (!window.confirm(`Change user status to ${nextStatus}?`)) return;
    try {
      const res = await adminApi.updateUserStatus(id, nextStatus);
      if (res?.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user account permanently?')) return;
    try {
      await adminApi.deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  if (loading && users.length === 0) return <Skeleton type="table" count={5} />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Users Registry</h2>
          <p className="text-xs text-gray-500 mt-1">Manage system administrators, customers, and provider users accounts.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center"
        >
          <FiPlus className="w-4 h-4 mr-1" />
          Add Account
        </button>
      </div>

      {users.length === 0 ? (
        <EmptyState title="No users registered" description="Manage accounts registered on the ServiceHub platform." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Full Name</th>
                  <th className="px-6 py-3">Email Address</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center font-bold text-gray-800">
                      <FiUser className="w-4 h-4 mr-2 text-slate-400" />
                      {u.full_name}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">{u.email}</td>
                    <td className="px-6 py-4">{u.phone}</td>
                    <td className="px-6 py-4 capitalize font-semibold">
                      {u.role_id === 1 ? 'Admin' : u.role_id === 3 ? 'Provider' : 'Customer'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 text-xs font-bold">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`p-1 ${
                          u.status === 'suspended'
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-red-500 hover:text-red-600'
                        }`}
                        title={u.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                      >
                        <FiSlash className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 text-gray-500 hover:text-blue-600"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1 text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              {editUserId ? 'Edit Account Details' : 'Create User Account'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              {!editUserId && (
                <div>
                  <label className="block text-gray-500 mb-2">Account Role</label>
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                  >
                    <option value={2}>Customer</option>
                    <option value={3}>Service Provider</option>
                    <option value={1}>System Administrator</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-gray-500 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                />
              </div>

              {!editUserId && (
                <div>
                  <label className="block text-gray-500 mb-2">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 text-xs font-semibold"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
