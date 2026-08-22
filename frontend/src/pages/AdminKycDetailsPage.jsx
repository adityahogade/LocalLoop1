import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import adminService from '../services/admin.service';

export default function AdminKycDetailsPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getPendingKyc();
        if (!mounted) return;
        const match = (data || []).find((entry) => String(entry.id) === String(id));
        setItem(match || null);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load KYC details.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="page"><Skeleton lines={4} /></div>;
  if (error) return <ErrorState title="KYC details unavailable" message={error} />;
  if (!item) return <Card title="KYC review" subtitle="The selected KYC record was not returned by the backend." />;

  return (
    <Card title={`KYC entry ${item.id}`} subtitle="Review result and submitted metadata from the backend.">
      <dl className="detail-list">
        <div><dt>Provider</dt><dd>{item.provider_name || item.provider?.business_name || '—'}</dd></div>
        <div><dt>Status</dt><dd>{item.status || item.kyc_status || 'pending'}</dd></div>
        <div><dt>Submitted</dt><dd>{item.created_at || '—'}</dd></div>
        <div><dt>Rejection reason</dt><dd>{item.rejection_reason || item.kyc_rejection_reason || '—'}</dd></div>
      </dl>
    </Card>
  );
}
