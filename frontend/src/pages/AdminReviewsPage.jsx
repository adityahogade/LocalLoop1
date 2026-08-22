import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'ID', key: 'id' },
  { label: 'Review', key: 'comment' },
  { label: 'Rating', key: 'rating' },
  { label: 'Status', key: 'status' },
];

export default function AdminReviewsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getReviews();
        if (!mounted) return;
        setRows(data || []);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Review list unavailable.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Reviews"
      subtitle="Moderated feedback and service ratings visible to administrators."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="Review list unavailable"
      emptyMessage="The current backend contract exposes per-provider review retrieval and moderation actions, but not a dedicated admin review list endpoint."
    />
  );
}
