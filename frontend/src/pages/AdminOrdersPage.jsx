import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'Order', key: 'id' },
  { label: 'Status', key: 'status' },
  { label: 'Customer', key: 'customer_id' },
  { label: 'Provider', key: 'provider_id' },
  { label: 'Details', key: 'actions' },
];

export default function AdminOrdersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await adminService.getAdminOrders();
        const data = response?.rows || response?.data || [];
        if (!mounted) return;
        setRows((data || []).map((item) => ({ ...item, actions: <Link to={`/admin/orders/${item.id}`}>View</Link> })));
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load orders.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Orders"
      subtitle="Admin monitoring view for order lifecycle and status."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No orders"
      emptyMessage="The admin monitoring endpoint returned no orders."
    />
  );
}
