import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'Customer', key: 'customer_id' },
  { label: 'Provider', key: 'provider_id' },
  { label: 'Service', key: 'service_id' },
  { label: 'Status', key: 'status' },
  { label: 'Details', key: 'actions' },
];

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await adminService.getAdminSubscriptions();
        const data = response?.rows || response?.data || [];
        if (!mounted) return;
        setRows((data || []).map((item) => ({ ...item, actions: <Link to={`/admin/subscriptions/${item.id}`}>View</Link> })));
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load subscriptions.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Subscriptions"
      subtitle="Customer subscription lifecycle and billing monitoring."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No subscriptions"
      emptyMessage="The admin monitoring endpoint returned no subscription records."
    />
  );
}
