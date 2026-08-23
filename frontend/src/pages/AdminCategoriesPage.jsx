import { useEffect, useState } from 'react';
import adminService from '../services/admin.service';
import AdminModulePage from './AdminModulePage';

const columns = [
  { label: 'ID', key: 'id' },
  { label: 'Name', key: 'name' },
  { label: 'Slug', key: 'slug' },
  { label: 'Status', key: 'is_active' },
];

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getCategories();
        if (!mounted) return;
        setRows((data || []).map((item) => ({ ...item, is_active: item.is_active ? 'active' : 'inactive' })));
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load categories.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminModulePage
      title="Categories"
      subtitle="Catalog categories managed in the admin platform APIs."
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyTitle="No categories"
      emptyMessage="The backend currently has no categories available."
    />
  );
}
