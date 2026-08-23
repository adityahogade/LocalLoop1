import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import catalogService from '../services/catalog.service';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await catalogService.getServiceById(id);
        if (!isMounted) return;
        setService(result);
      } catch (loadError) {
        if (isMounted) {
          const message = loadError?.response?.status === 404 ? 'Service not found.' : loadError?.message || 'Unable to load this service.';
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) return <Skeleton lines={6} />;
  if (error) {
    if (error === 'Service not found.') return <EmptyState title="Service not found" description="The selected service is no longer available." />;
    return <ErrorState title="Service unavailable" message={error} />;
  }

  if (!service) return <EmptyState title="No service data" description="There is no service information available." />;

  const plans = service.plans || [];

  return (
    <div className="page page--service-details">
      <Card title={service.name} subtitle={service.category?.name || 'Service'}>
        <div className="service-detail__header">
          <div>
            <p className="eyebrow">{service.type || 'one_time'}</p>
            <h2>{service.name}</h2>
          </div>
          <strong className="service-detail__price">₹{Number(service.base_price || 0).toFixed(2)}</strong>
        </div>

        <p>{service.description}</p>

        <div className="details-grid">
          <div>
            <p><strong>Provider:</strong> {service.provider?.business_name || 'ServiceHub provider'}</p>
            <p><strong>Unit:</strong> {service.unit || 'service'}</p>
            <p><strong>Category:</strong> {service.category?.name || 'Service category'}</p>
          </div>
          <div>
            <p><strong>Rating:</strong> {service.provider?.average_rating ? `${service.provider.average_rating} ★` : 'Not rated'}</p>
            <p><strong>Type:</strong> {service.type || 'one_time'}</p>
            <p><strong>Base price:</strong> ₹{Number(service.base_price || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="action-row">
          <Link className="button button--primary" to={`/customer/booking?serviceId=${service.id}`}>Book service</Link>
          {service.provider?.id ? <Link className="button button--secondary" to={`/customer/providers/${service.provider.id}`}>View provider</Link> : null}
        </div>
      </Card>

      <Card title="Service plans" subtitle="Available pricing plans for this service.">
        {plans.length ? (
          <div className="plan-grid">
            {plans.map((plan) => (
              <div key={plan.id} className="plan-card">
                <h3>{plan.frequency}</h3>
                <strong>₹{Number(plan.price || 0).toFixed(2)}</strong>
                {plan.min_quantity ? <p>Minimum quantity: {plan.min_quantity}</p> : null}
                {plan.billing_cycle_days ? <p>Billing cycle: {plan.billing_cycle_days} days</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No plans available" description="This service does not currently expose any public pricing plans." />
        )}
      </Card>
    </div>
  );
}
