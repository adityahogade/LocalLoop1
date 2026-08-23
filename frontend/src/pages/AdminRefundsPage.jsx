import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'ID', key: 'id' },
  { label: 'Order', key: 'order_id' },
  { label: 'Amount', key: 'amount' },
  { label: 'Status', key: 'status' },
];

export default function AdminRefundsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getRefunds();
        if (!mounted) return;
        setRows(data || []);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Refund list unavailable.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Refunds"
      subtitle="Customer refund records managed through backend administrative actions."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="Refund list unavailable"
      emptyMessage="The current backend contract exposes refund actions but not a dedicated admin refund listing endpoint."
    />
  );
}
