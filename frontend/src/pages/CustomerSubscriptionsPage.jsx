import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import StatusBadge from '../components/ui/StatusBadge';
import subscriptionService from '../services/subscription.service';

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function CustomerSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSubscriptions = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await subscriptionService.list();
        if (!isMounted) return;
        setSubscriptions(Array.isArray(result) ? result : []);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError?.message || 'Unable to load your subscriptions.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSubscriptions();
    return () => { isMounted = false; };
  }, []);

  const summary = useMemo(() => { 
    const counts = { active: 0, paused: 0, vacation: 0, cancelled: 0, expired: 0 };
    subscriptions.forEach((subscription) => {
      const status = String(subscription.status || '').toLowerCase();
      if (status in counts) counts[status] += 1;
    });
    return counts;
  }, [subscriptions]);

  if (loading) return <Skeleton lines={5} />;
  if (error) return <ErrorState title="Subscriptions unavailable" message={error} />;
  if (!subscriptions.length) {
    return (
      <EmptyState
        title="No subscriptions yet"
        description="Your recurring service subscriptions will appear here once you create one."
        action={<Link className="button button--primary" to="/customer/services">Browse services</Link>}
      />
    );
  }

  return (
    <div className="page page--subscriptions">
      <div className="responsive-grid responsive-grid--5">
        <div className="kpi-card">
          <p className="kpi-card__label">Active</p>
          <div className="kpi-card__value-row"><span className="kpi-card__value">{summary.active}</span></div>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Paused</p>
          <div className="kpi-card__value-row"><span className="kpi-card__value">{summary.paused}</span></div>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Vacation</p>
          <div className="kpi-card__value-row"><span className="kpi-card__value">{summary.vacation}</span></div>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Cancelled</p>
          <div className="kpi-card__value-row"><span className="kpi-card__value">{summary.cancelled}</span></div>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Expired</p>
          <div className="kpi-card__value-row"><span className="kpi-card__value">{summary.expired}</span></div>
        </div>
      </div>

      <Card title="Subscriptions" subtitle="Recurring service subscriptions and billing periods.">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Provider</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Next billing</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>{subscription.service?.name || 'Service'}</td>
                  <td>{subscription.provider?.business_name || 'Provider'}</td>
                  <td>{subscription.servicePlan?.frequency || 'Plan'} · {formatMoney(subscription.servicePlan?.price)}</td>
                  <td><StatusBadge status={subscription.status || 'active'} /></td>
                  <td>{formatDate(subscription.next_billing_date)}</td>
                  <td><Link className="button button--secondary" to={`/customer/subscriptions/${subscription.id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
