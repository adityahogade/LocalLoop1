import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'Name', key: 'full_name' },
  { label: 'Email', key: 'email' },
  { label: 'Role', key: 'role' },
  { label: 'Status', key: 'status' },
  { label: 'Created', key: 'created_at' },
];

export default function AdminUsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getUsers();
        if (!mounted) return;
        setRows(data || []);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load users.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Users"
      subtitle="User accounts and access state managed by the backend."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No users found"
      emptyMessage="The backend returned no user accounts for this environment."
    />
  );
}
