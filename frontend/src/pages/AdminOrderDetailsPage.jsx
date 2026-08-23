import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import adminService from '../services/admin.service';

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await adminService.getAdminOrders();
        const rows = response?.rows || response?.data || [];
        const match = (rows || []).find((entry) => String(entry.id) === String(id));
        if (!mounted) return;
        setOrder(match || null);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load order details.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="page"><Skeleton lines={4} /></div>;
  if (error) return <ErrorState title="Order unavailable" message={error} />;
  if (!order) return <Card title="Order details" subtitle="The selected order was not returned by the backend monitoring API." />;

  return (
    <Card title={`Order #${order.id}`} subtitle="Order metadata returned by the backend.">
      <dl className="detail-list">
        <div><dt>Status</dt><dd>{order.status || '—'}</dd></div>
        <div><dt>Customer</dt><dd>{order.customer_id || '—'}</dd></div>
        <div><dt>Provider</dt><dd>{order.provider_id || '—'}</dd></div>
        <div><dt>Created</dt><dd>{order.created_at || '—'}</dd></div>
      </dl>
    </Card>
  );
}
