import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'ID', key: 'id' },
  { label: 'Provider', key: 'provider_id' },
  { label: 'Total', key: 'total_amount' },
  { label: 'Status', key: 'status' },
];

export default function AdminSettlementsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await adminService.getSettlements();
        const data = response?.rows || response?.data || response || [];
        if (!mounted) return;
        setRows(data || []);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load settlements.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Settlements"
      subtitle="Platform payout and settlement reconciliation data from the admin APIs."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No settlements"
      emptyMessage="No settlement records were returned by the backend."
    />
  );
}
