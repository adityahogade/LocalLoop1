import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'Provider', key: 'provider_name' },
  { label: 'Status', key: 'status' },
  { label: 'Submitted', key: 'created_at' },
  { label: 'Action', key: 'actions' },
];

export default function AdminKycPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getPendingKyc();
        if (!mounted) return;
        const normalized = (data || []).map((item) => ({
          ...item,
          provider_name: item.provider?.business_name || item.provider_name || item.provider_id || '—',
          status: item.status || item.kyc_status || 'pending',
          actions: <Link to={`/admin/kyc/${item.id}`}>Review</Link>,
        }));
        setRows(normalized);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load KYC queue.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="KYC review"
      subtitle="Pending review items from the backend KYC workflow."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No KYC items"
      emptyMessage="The backend reported no pending KYC submissions."
    />
  );
}
