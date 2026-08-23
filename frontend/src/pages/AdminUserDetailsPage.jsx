import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import adminService from '../services/admin.service';

export default function AdminUserDetailsPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await adminService.getUserById(id);
        if (!mounted) return;
        setUser(data || null);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || 'Unable to load user details.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="page"><Skeleton lines={5} /></div>;
  if (error) return <ErrorState title="User not available" message={error} />;
  if (!user) return <Card title="User details" subtitle="No user record was returned by the backend." />;

  return (
    <Card title={`User ${user.full_name || user.id}`} subtitle="Account metadata and status returned by the backend.">
      <dl className="detail-list">
        <div><dt>Email</dt><dd>{user.email || '—'}</dd></div>
        <div><dt>Phone</dt><dd>{user.phone || '—'}</dd></div>
        <div><dt>Role</dt><dd>{user.role || user.role_id || '—'}</dd></div>
        <div><dt>Status</dt><dd>{user.status || '—'}</dd></div>
        <div><dt>Preferred language</dt><dd>{user.preferred_language || '—'}</dd></div>
        <div><dt>Created</dt><dd>{user.created_at || '—'}</dd></div>
      </dl>
    </Card>
  );
}
