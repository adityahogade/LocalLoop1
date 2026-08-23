import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import catalogService from '../services/catalog.service';
import { t } from '../lib/i18n';

export default function CustomerHomePage() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [categoryData, serviceData, providerData] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getServices({ limit: 4 }),
          catalogService.getProviders(),
        ]);

        if (!isMounted) return;

        setCategories(categoryData || []);
        setFeatured(serviceData.items || []);
        setProviders(providerData || []);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError?.message || 'Unable to load marketplace content.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="page"><Skeleton lines={5} /></div>;
  }

  if (error) {
    return <ErrorState title="Marketplace unavailable" message={error} />;
  }

  return (
    <div className="page page--customer-home">
      <section className="hero">
        <p className="eyebrow">ServiceHub</p>
        <h1>{t('customerHomeTitle')}</h1>
        <p className="hero__copy">{t('customerHomeCopy')}</p>
        <div className="hero__actions">
          <Link className="button button--primary" to="/customer/services">{t('browseServices')}</Link>
          <Link className="button button--secondary" to="/customer/categories">{t('browseCategories')}</Link>
        </div>
      </section>

      <div className="grid grid--2">
        <Card title={t('categories')} subtitle={t('marketplaceCategories')}>
          {categories.length ? (
            <div className="chip-grid">
              {categories.slice(0, 6).map((category) => (
                <Link key={category.id} className="chip" to={`/customer/services?category_id=${category.id}`}>
                  {category.name}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title={t('noCategories')} description={t('noCategoriesMessage')} />
          )}
        </Card>

        <Card title={t('popularProviders')} subtitle={t('providerOverview')}>
          {providers.length ? (
            <ul className="list">
              {providers.slice(0, 4).map((provider) => (
                <li key={provider.id}>
                  <Link to={`/customer/providers/${provider.id}`}>{provider.business_name}</Link>
                  {provider.average_rating ? ` · ${provider.average_rating} ★` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t('noProviders')} description={t('noProviderMessage')} />
          )}
        </Card>
      </div>

      <Card title={t('featuredServices')} subtitle={t('featuredServicesCopy')}>
        {featured.length ? (
          <div className="service-grid">
            {featured.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-card__meta">
                  <span>{service.category?.name || service.category_name || 'Service'}</span>
                  <span>{service.type || 'one_time'}</span>
                </div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="service-card__footer">
                  <strong>₹{Number(service.base_price || 0).toFixed(2)}</strong>
                  <Link to={`/customer/services/${service.id}`}>{t('viewDetails')}</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t('noServices')} description={t('noServicesMessage')} />
        )}
      </Card>
    </div>
  );
}
