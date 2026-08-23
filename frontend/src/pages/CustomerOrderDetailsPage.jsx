import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

const toTimeline = (status) => {
  const current = String(status || 'pending').toLowerCase();
  const states = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  return states.map((state) => ({
    label: state === 'in_progress' ? 'In progress' : state.charAt(0).toUpperCase() + state.slice(1),
    active: current === state,
    passed: states.indexOf(current) > states.indexOf(state),
  }));
};

export default function CustomerOrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await orderService.getById(id);
        if (!isMounted) return;
        setOrder(result);
      } catch (loadError) {
        if (!isMounted) return;
        if (loadError?.status === 404) {
          setError('ORDER_NOT_FOUND');
          return;
        }
        if (loadError?.status === 403) {
          setError('FORBIDDEN');
          return;
        }
        setError(loadError?.message || 'Unable to load this order.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOrder();
    return () => { isMounted = false; };
  }, [id]);

  const timeline = useMemo(() => toTimeline(order?.status), [order]);

  if (loading) return <Skeleton lines={6} />;
  if (error === 'ORDER_NOT_FOUND') {
    return <EmptyState title="Order not found" description="The requested order could not be located for this account." />;
  }
  if (error === 'FORBIDDEN') {
    return <ErrorState title="Access denied" message="This order does not belong to your account." />;
  }
  if (error) return <ErrorState title="Order unavailable" message={error} />;
  if (!order) return <EmptyState title="No order data" description="There is no order information available for this request." />;

  const address = order.address || {};
  const itemLines = order.items || [];

  return (
    <div className="page page--order-details">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Order #{order.order_number || order.id}</h1>
          <p className="page-header__subtitle">Placed {formatDate(order.created_at)}</p>
        </div>
        <div className="page-header__actions">
          <StatusBadge status={order.status || 'pending'} />
          <Link className="button button--secondary" to="/customer/orders">Back to orders</Link>
        </div>
      </div>

      <Card title="Order summary" subtitle="Service and booking details.">
        <div className="summary-grid">
          <div className="detail-panel">
            <h4>Provider</h4>
            <p>{order.provider?.business_name || 'Service provider'}</p>
          </div>
          <div className="detail-panel">
            <h4>Service date</h4>
            <p>{formatDate(order.scheduled_date)}</p>
          </div>
          <div className="detail-panel">
            <h4>Time slot</h4>
            <p>{order.scheduled_time_slot || '—'}</p>
          </div>
          <div className="detail-panel">
            <h4>Amount</h4>
            <p>{formatMoney(order.total_amount || order.subtotal)}</p>
          </div>
        </div>
      </Card>

      <div className="responsive-grid responsive-grid--2">
        <Card title="Service details" subtitle="Line items on this order.">
          {itemLines.length ? (
            <div className="entity-list">
              {itemLines.map((item) => (
                <div key={item.id || `${order.id}-${item.service_id}`} className="entity-row">
                  <div>
                    <strong>{item.service?.name || 'Service item'}</strong>
                    <div className="muted">Qty: {item.quantity || 1}</div>
                  </div>
                  <strong>{formatMoney(item.line_total || item.unit_price)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No items were returned for this order.</p>
          )}
        </Card>

        <Card title="Delivery details" subtitle="Address and service instructions.">
          <div className="detail-stack">
            <div>
              <strong>Address</strong>
              <p>{address.label ? `${address.label} · ` : ''}{address.area || 'Address'}{address.city ? `, ${address.city}` : ''}{address.state ? `, ${address.state}` : ''}{address.pincode ? `, ${address.pincode}` : ''}</p>
            </div>
            <div>
              <strong>Notes</strong>
              <p>{order.booking_details_json?.notes || order.notes || 'No service notes were provided.'}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Status timeline" subtitle="Current lifecycle for this order.">
        <div className="status-timeline">
          {timeline.map((step) => (
            <div key={step.label} className={`status-step ${step.active ? 'status-step--active' : ''} ${step.passed ? 'status-step--passed' : ''}`}>
              <span className="status-step__dot" />
              <div>
                <strong>{step.label}</strong>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
