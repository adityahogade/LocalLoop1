import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'Scope', key: 'scope' },
  { label: 'Rate', key: 'commission_percent' },
  { label: 'Effective from', key: 'effective_from' },
  { label: 'Status', key: 'effective_to' },
];

export default function AdminCommissionRulesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getCommissionRules();
        if (!mounted) return;
        setRows((data || []).map((item) => ({ ...item, effective_to: item.effective_to || 'active' })));
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load commission rules.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Commission rules"
      subtitle="Pricing and commission policy rules currently configured in the backend."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No commission rules"
      emptyMessage="The backend returned no commission rules for this platform instance."
    />
  );
}
