import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import adminService from '../services/admin.service';

export default function AdminProviderDetailsPage() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getProviderById(id);
        if (!mounted) return;
        setProvider(data || null);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load provider details.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="page"><Skeleton lines={5} /></div>;
  if (error) return <ErrorState title="Provider unavailable" message={error} />;
  if (!provider) return <Card title="Provider details" subtitle="No provider data was returned by the backend." />;

  return (
    <Card title={provider.business_name || `Provider ${provider.id}`} subtitle="Operational and compliance metadata from the backend provider APIs.">
      <dl className="detail-list">
        <div><dt>Owner</dt><dd>{provider.full_name || '—'}</dd></div>
        <div><dt>Email</dt><dd>{provider.email || '—'}</dd></div>
        <div><dt>Phone</dt><dd>{provider.phone || '—'}</dd></div>
        <div><dt>KYC status</dt><dd>{provider.kyc_status || '—'}</dd></div>
        <div><dt>Active</dt><dd>{String(provider.is_active ?? '—')}</dd></div>
        <div><dt>Average rating</dt><dd>{provider.average_rating ?? '—'}</dd></div>
      </dl>
    </Card>
  );
}
