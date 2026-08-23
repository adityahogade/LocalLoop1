import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import catalogService from '../services/catalog.service';

export default function ProviderDetailsPage() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const providers = await catalogService.getProviders();
        const match = providers.find((item) => String(item.id) === String(id));

        if (!isMounted) return;
        if (!match) {
          setError('Provider not found.');
          return;
        }

        setProvider(match);
      } catch (loadError) {
        if (isMounted) setError(loadError?.message || 'Unable to load provider information.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) return <Skeleton lines={5} />;
  if (error) {
    if (error === 'Provider not found.') return <EmptyState title="Provider not found" description="This provider is not available in the public catalog right now." />;
    return <ErrorState title="Provider unavailable" message={error} />;
  }

  if (!provider) return <EmptyState title="No provider data" description="No public provider data is available." />;

  return (
    <div className="page page--provider-details">
      <Card title={provider.business_name} subtitle={provider.business_description || 'Local service provider'}>
        <div className="provider-profile">
          <div className="provider-profile__logo">{provider.business_name?.charAt(0) || 'P'}</div>
          <div>
            <p><strong>Average rating:</strong> {provider.average_rating ? `${provider.average_rating} ★` : 'Not rated'}</p>
            <p><strong>Public profile:</strong> {provider.business_description || 'No public description available.'}</p>
          </div>
        </div>
      </Card>

      <Card title="Services by this provider" subtitle="Available services from the public catalog.">
        {provider.services?.length ? (
          <div className="service-grid">
            {provider.services.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-card__meta">
                  <span>{service.type || 'one_time'}</span>
                  <span>{service.unit || 'service'}</span>
                </div>
                <h3>{service.name}</h3>
                <p>{service.type ? `Service type: ${service.type}` : 'Service listing'}</p>
                <div className="service-card__footer">
                  <strong>₹{Number(service.base_price || 0).toFixed(2)}</strong>
                  <Link to={`/customer/services/${service.id}`}>View</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No public services" description="This provider has not published any public services yet." />
        )}
      </Card>
    </div>
  );
}
