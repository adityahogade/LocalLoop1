import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'Service', key: 'name' },
  { label: 'Provider', key: 'provider_name' },
  { label: 'Status', key: 'is_active' },
  { label: 'Created', key: 'created_at' },
];

export default function AdminServiceModerationPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getServices();
        if (!mounted) return;
        setRows((data || []).map((item) => ({
          ...item,
          provider_name: item.provider?.business_name || item.provider_name || '—',
          is_active: item.is_active ? 'active' : 'inactive',
        })));
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load service moderation list.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Service moderation"
      subtitle="Backend-managed approval and activation state for the service catalog."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No services"
      emptyMessage="No services were returned by the backend moderation endpoint."
    />
  );
}
