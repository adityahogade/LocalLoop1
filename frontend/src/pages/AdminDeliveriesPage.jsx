import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'ID', key: 'id' },
  { label: 'Status', key: 'status' },
  { label: 'Subscription', key: 'subscription_id' },
  { label: 'Provider', key: 'provider_id' },
];

export default function AdminDeliveriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await adminService.getAdminDeliveries();
        const data = response?.rows || response?.data || [];
        if (!mounted) return;
        setRows(data || []);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load deliveries.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Deliveries"
      subtitle="Delivery monitoring and fulfillment status from backend APIs."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No delivery records"
      emptyMessage="The admin delivery monitoring endpoint returned no records."
    />
  );
}
