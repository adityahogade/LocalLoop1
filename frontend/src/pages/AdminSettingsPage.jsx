import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'Key', key: 'key' },
  { label: 'Value', key: 'value' },
  { label: 'Updated', key: 'updated_at' },
  { label: 'Status', key: 'status' },
];

export default function AdminSettingsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await adminService.getPlatformSettings();
        const data = response?.rows || response?.data || response || [];
        if (!mounted) return;
        setRows(data || []);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load platform settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Platform settings"
      subtitle="System configuration values surfaced by the platform admin API."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No settings"
      emptyMessage="The backend did not return any platform settings."
    />
  );
}
