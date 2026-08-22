import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'ID', key: 'id' },
  { label: 'Category', key: 'category' },
  { label: 'Subject', key: 'subject' },
  { label: 'Status', key: 'status' },
];

export default function AdminSupportPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await adminService.getSupportTickets();
        const data = response?.rows || response?.data || response || [];
        if (!mounted) return;
        setRows(data || []);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load support tickets.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Support"
      subtitle="Customer and provider support tickets routed through the platform admin APIs."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No support tickets"
      emptyMessage="No support ticket records were returned by the backend."
    />
  );
}
