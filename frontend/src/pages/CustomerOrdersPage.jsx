import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import StatusBadge from '../components/ui/StatusBadge';
import orderService from '../services/order.service';

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await orderService.list();
        if (!isMounted) return;
        setOrders(Array.isArray(result) ? result : []);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError?.message || 'Unable to load your orders right now.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOrders();
    return () => { isMounted = false; };
  }, []);

  const summary = useMemo(() => ({
    total: orders.length,
    active: orders.filter((order) => ['pending', 'confirmed', 'in_progress'].includes(String(order.status || '').toLowerCase())).length,
    completed: orders.filter((order) => String(order.status || '').toLowerCase() === 'completed').length,
  }), [orders]);

  if (loading) return <Skeleton lines={5} />;
  if (error) return <ErrorState title="Orders unavailable" message={error} />;
  if (!orders.length) {
    return (
      <EmptyState
        title="No orders yet"
        description="Your placed service requests will appear here once a booking is created."
        action={<Link className="button button--primary" to="/customer/services">Browse services</Link>}
      />
    );
  }

  return (
    <div className="page page--orders">
      <div className="responsive-grid responsive-grid--3">
        <div className="kpi-card">
          <p className="kpi-card__label">Total orders</p>
          <div className="kpi-card__value-row">
            <span className="kpi-card__value">{summary.total}</span>
          </div>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">In progress</p>
          <div className="kpi-card__value-row">
            <span className="kpi-card__value">{summary.active}</span>
          </div>
        </div>
        <div className="kpi-card">
          <p className="kpi-card__label">Completed</p>
          <div className="kpi-card__value-row">
            <span className="kpi-card__value">{summary.completed}</span>
          </div>
        </div>
      </div>

      <Card title="Recent orders" subtitle="Track your service bookings and delivery timing.">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Service</th>
                <th>Status</th>
                <th>Scheduled</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const firstItem = order.items?.[0];
                const serviceName = firstItem?.service?.name || 'Service';
                const providerName = order.provider?.business_name || order.provider_name || 'Provider';
                return (
                  <tr key={order.id}>
                    <td>
                      <strong>#{order.order_number || order.id}</strong>
                      <div>{providerName}</div>
                    </td>
                    <td>{serviceName}</td>
                    <td><StatusBadge status={order.status || 'pending'} /></td>
                    <td>{formatDate(order.scheduled_date)}<br />{order.scheduled_time_slot || '—'}</td>
                    <td>{formatMoney(order.total_amount || order.subtotal)}</td>
                    <td><Link className="button button--secondary" to={`/customer/orders/${order.id}`}>View</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
