import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import adminService from '../services/admin.service';

export default function AdminSettlementDetailsPage() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getSettlementDetails(id);
        if (!mounted) return;
        setRecord(data || null);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load settlement details.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="p-6">Loading settlement details...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!record) return <div className="p-6">Settlement not found.</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Settlement #{record.id || id}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(record).map(([key, value]) => (
          <div key={key} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">{key}</div>
            <div className="mt-2 text-sm text-slate-800">{String(value ?? '—')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
