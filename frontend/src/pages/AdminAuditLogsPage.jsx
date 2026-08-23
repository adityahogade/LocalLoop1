import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'ID', key: 'id' },
  { label: 'Action', key: 'action' },
  { label: 'Actor', key: 'actor' },
  { label: 'Timestamp', key: 'created_at' },
];

export default function AdminAuditLogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await adminService.getAuditLogs();
        const data = response?.rows || response?.data || response || [];
        if (!mounted) return;
        setRows(data || []);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load audit logs.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Audit logs"
      subtitle="Platform activity and admin actions captured by the backend audit trail."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No audit logs"
      emptyMessage="The backend returned no audit records for this time range."
    />
  );
}
