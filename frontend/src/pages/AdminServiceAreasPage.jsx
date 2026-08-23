import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'Provider', key: 'provider_name' },
  { label: 'City', key: 'city' },
  { label: 'State', key: 'state' },
  { label: 'Status', key: 'status' },
];

export default function AdminServiceAreasPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getServiceAreas();
        if (!mounted) return;
        setRows((data || []).map((item) => ({
          ...item,
          provider_name: item.provider?.business_name || item.provider_name || '—',
          status: item.status || (item.is_active ? 'active' : 'inactive'),
        })));
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load service areas.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Service areas"
      subtitle="Coverage and service locality records managed via admin APIs."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No service areas"
      emptyMessage="The backend has no service-area records to show."
    />
  );
}
