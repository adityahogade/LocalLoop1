import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import StatusBadge from '../components/ui/StatusBadge';
import Toast from '../components/ui/Toast';
import subscriptionService from '../services/subscription.service';

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function CustomerSubscriptionDetailsPage() {
  const { id } = useParams();
  const [subscription, setSubscription] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', tone: 'success' });
  const [confirmAction, setConfirmAction] = useState(null);

  const loadSubscription = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await subscriptionService.getById(id);
      setSubscription(result);
      try {
        const calendarResult = await subscriptionService.calendar(id);
        setCalendar(calendarResult || null);
      } catch (_calendarError) {
        setCalendar(null);
      }
    } catch (loadError) {
      if (loadError?.status === 404) {
        setError('SUBSCRIPTION_NOT_FOUND');
        return;
      }
      if (loadError?.status === 403) {
        setError('FORBIDDEN');
        return;
      }
      setError(loadError?.message || 'Unable to load this subscription.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!isMounted) return;
      await loadSubscription();
    };

    run();
    return () => { isMounted = false; };
  }, [id]);

  const showToast = (message, tone = 'success') => {
    setToast({ open: true, message, tone });
    window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 2500);
  };

  const actionMap = useMemo(() => ({
    pause: { label: 'Pause', method: () => subscriptionService.pause(id) },
    resume: { label: 'Resume', method: () => subscriptionService.resume(id) },
    cancel: { label: 'Cancel', method: () => subscriptionService.cancel(id) },
    renew: { label: 'Renew', method: () => subscriptionService.renew(id) },
    skip: { label: 'Skip delivery', method: () => subscriptionService.skip(id, { skip_date: new Date().toISOString().slice(0, 10), reason: 'Skipped from customer app' }) },
  }), [id]);

  const executeAction = async (key, customLabel) => {
    const action = actionMap[key];
    if (!action) return;
    setCalendarLoading(true);
    try {
      await action.method();
      showToast(customLabel || `${action.label} successful`, 'success');
      await loadSubscription();
    } catch (actionError) {
      showToast(actionError?.message || `Unable to ${action.label.toLowerCase()} this subscription.`, 'danger');
    } finally {
      setCalendarLoading(false);
      setConfirmAction(null);
    }
  };

  if (loading) return <Skeleton lines={6} />;
  if (error === 'SUBSCRIPTION_NOT_FOUND') {
    return <EmptyState title="Subscription not found" description="This recurring plan could not be located for your account." />;
  }
  if (error === 'FORBIDDEN') {
    return <ErrorState title="Access denied" message="This subscription does not belong to your account." />;
  }
  if (error) return <ErrorState title="Subscription unavailable" message={error} />;
  if (!subscription) return <EmptyState title="No subscription data" description="There is no subscription information available." />;

  const status = String(subscription.status || 'active').toLowerCase();
  const canPause = status === 'active';
  const canResume = status === 'paused' || status === 'vacation';
  const canCancel = !['cancelled', 'expired'].includes(status);
  const canRenew = ['active', 'expired', 'cancelled'].includes(status);
  const canSkip = ['active', 'paused', 'vacation'].includes(status);

  return (
    <div className="page page--subscription-details">
      <Toast open={toast.open} message={toast.message} tone={toast.tone} />
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title || 'Confirm action'}
        message={confirmAction?.message || 'Please confirm this action.'}
        onConfirm={() => executeAction(confirmAction?.action, confirmAction?.label)}
        onCancel={() => setConfirmAction(null)}
        confirmLabel={confirmAction?.confirmLabel || 'Confirm'}
      />

      <div className="page-header">
        <div>
          <h1 className="page-header__title">{subscription.service?.name || 'Subscription details'}</h1>
          <p className="page-header__subtitle">Provider: {subscription.provider?.business_name || 'Service provider'}</p>
        </div>
        <div className="page-header__actions">
          <StatusBadge status={subscription.status || 'active'} />
          <Link className="button button--secondary" to="/customer/subscriptions">Back to subscriptions</Link>
        </div>
      </div>

      <div className="responsive-grid responsive-grid--2">
        <Card title="Subscription overview" subtitle="Recurring service information.">
          <div className="summary-grid">
            <div className="detail-panel">
              <h4>Plan</h4>
              <p>{subscription.servicePlan?.frequency || 'Plan'} · {formatMoney(subscription.servicePlan?.price)}</p>
            </div>
            <div className="detail-panel">
              <h4>Quantity</h4>
              <p>{subscription.quantity}</p>
            </div>
            <div className="detail-panel">
              <h4>Start date</h4>
              <p>{formatDate(subscription.start_date)}</p>
            </div>
            <div className="detail-panel">
              <h4>Next billing</h4>
              <p>{formatDate(subscription.next_billing_date)}</p>
            </div>
            <div className="detail-panel">
              <h4>Delivery slot</h4>
              <p>{subscription.delivery_time_slot || '—'}</p>
            </div>
            <div className="detail-panel">
              <h4>Address</h4>
              <p>{subscription.address?.label ? `${subscription.address.label} · ` : ''}{subscription.address?.area || 'Address'}</p>
            </div>
          </div>
        </Card>

        <Card title="Lifecycle actions" subtitle="Available subscription actions for this plan.">
          <div className="button-group button-group--stacked">
            {canPause ? <Button variant="secondary" onClick={() => setConfirmAction({ action: 'pause', title: 'Pause subscription', message: 'Pause this subscription?', confirmLabel: 'Pause', label: 'Paused' })}>Pause</Button> : null}
            {canResume ? <Button variant="secondary" onClick={() => executeAction('resume', 'Subscription resumed')}>Resume</Button> : null}
            {canSkip ? <Button variant="secondary" onClick={() => setConfirmAction({ action: 'skip', title: 'Skip delivery', message: 'Skip the next scheduled delivery for this subscription?', confirmLabel: 'Skip', label: 'Skipped' })}>Skip delivery</Button> : null}
            {canRenew ? <Button variant="primary" onClick={() => setConfirmAction({ action: 'renew', title: 'Renew subscription', message: 'Create a renewal billing period for this subscription?', confirmLabel: 'Renew', label: 'Renewal created' })}>Renew</Button> : null}
            {canCancel ? <Button variant="danger" onClick={() => setConfirmAction({ action: 'cancel', title: 'Cancel subscription', message: 'Cancel this subscription? This action cannot be undone.', confirmLabel: 'Cancel', label: 'Subscription cancelled' })}>Cancel</Button> : null}
          </div>
        </Card>
      </div>

      {calendar ? (
        <Card title="Delivery calendar" subtitle="Scheduled subscription deliveries.">
          {calendar.deliveries?.length ? (
            <div className="entity-list">
              {calendar.deliveries.map((delivery) => (
                <div key={`${delivery.date}-${delivery.status}`} className="entity-row">
                  <div>
                    <strong>{formatDate(delivery.date)}</strong>
                    <div className="muted">{delivery.status}</div>
                  </div>
                  <StatusBadge status={delivery.status || 'neutral'} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No deliveries" description="There are no deliveries scheduled for this subscription right now." />
          )}
        </Card>
      ) : null}
    </div>
  );
}
