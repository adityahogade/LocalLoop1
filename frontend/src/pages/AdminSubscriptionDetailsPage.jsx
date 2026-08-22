import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import adminService from '../services/admin.service';

export default function AdminSubscriptionDetailsPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await adminService.getAdminSubscriptions();
        const rows = response?.rows || response?.data || [];
        const match = (rows || []).find((entry) => String(entry.id) === String(id));
        if (!mounted) return;
        setItem(match || null);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load subscription details.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="page"><Skeleton lines={4} /></div>;
  if (error) return <ErrorState title="Subscription unavailable" message={error} />;
  if (!item) return <Card title="Subscription details" subtitle="The selected subscription was not returned by the backend." />;

  return (
    <Card title={`Subscription #${item.id}`} subtitle="Lifecycle metadata from the backend monitoring API.">
      <dl className="detail-list">
        <div><dt>Status</dt><dd>{item.status || '—'}</dd></div>
        <div><dt>Customer</dt><dd>{item.customer_id || '—'}</dd></div>
        <div><dt>Provider</dt><dd>{item.provider_id || '—'}</dd></div>
        <div><dt>Service</dt><dd>{item.service_id || '—'}</dd></div>
      </dl>
    </Card>
  );
}
