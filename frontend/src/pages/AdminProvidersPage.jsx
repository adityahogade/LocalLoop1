import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'Business', key: 'business_name' },
  { label: 'Owner', key: 'full_name' },
  { label: 'KYC', key: 'kyc_status' },
  { label: 'Status', key: 'is_active' },
  { label: 'Rating', key: 'average_rating' },
];

export default function AdminProvidersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getProviders();
        if (!mounted) return;
        setRows(data || []);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load providers.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Providers"
      subtitle="Provider profiles, KYC state and account readiness."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No providers found"
      emptyMessage="The backend returned no provider profiles for this environment."
    />
  );
}
