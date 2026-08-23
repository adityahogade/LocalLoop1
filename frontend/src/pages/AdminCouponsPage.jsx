import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'Code', key: 'code' },
  { label: 'Discount', key: 'discount' },
  { label: 'Expiry', key: 'expires_at' },
  { label: 'Status', key: 'status' },
];

export default function AdminCouponsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getCoupons();
        if (!mounted) return;
        setRows(data || []);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load coupons.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Coupons"
      subtitle="Discount campaigns and promotional rules exposed by the admin API."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No coupons"
      emptyMessage="The backend did not return any active or archived coupons."
    />
  );
}
