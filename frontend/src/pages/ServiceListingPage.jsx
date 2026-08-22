import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Pagination from '../components/ui/Pagination';
import SearchInput from '../components/ui/SearchInput';
import Skeleton from '../components/ui/Skeleton';
import catalogService from '../services/catalog.service';

export default function ServiceListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1, limit: 12 });
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeCategory = searchParams.get('category_id') || '';
  const currentPage = Number(searchParams.get('page') || 1);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const result = await catalogService.getCategories();
        if (isMounted) setCategories(result || []);
      } catch (_loadError) {
        if (isMounted) setCategories([]);
      }
    };

    loadCategories();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      setLoading(true);
      setError('');

      try {
        const params = {
          page: currentPage,
          limit: 12,
        };

        if (searchText) params.search = searchText;
        if (activeCategory) params.category_id = Number(activeCategory);

        const result = await catalogService.getServices(params);
        if (!isMounted) return;

        setServices(result.items || []);
        setPagination({ ...result.pagination, page: currentPage, limit: 12 });
      } catch (loadError) {
        if (isMounted) setError(loadError?.message || 'Unable to load services.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadServices();
    return () => { isMounted = false; };
  }, [activeCategory, currentPage, searchText]);

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'All categories' },
      ...categories.map((category) => ({ value: String(category.id), label: category.name })),
    ],
    [categories]
  );

  const applyFilters = (nextSearch, nextCategory, nextPage = 1) => {
    const params = new URLSearchParams();
    if (nextSearch) params.set('search', nextSearch);
    if (nextCategory) params.set('category_id', nextCategory);
    if (nextPage > 1) params.set('page', String(nextPage));
    setSearchParams(params);
  };

  const handleSearchChange = (event) => {
    const nextValue = event.target.value;
    setSearchText(nextValue);
    applyFilters(nextValue, activeCategory, 1);
  };

  const handleCategoryChange = (event) => {
    const nextCategory = event.target.value;
    setSearchText(searchText);
    applyFilters(searchText, nextCategory, 1);
  };

  if (loading) return <Skeleton lines={6} />;
  if (error) return <ErrorState title="Services unavailable" message={error} />;

  return (
    <div className="page page--services">
      <Card title="Service marketplace" subtitle="Search and compare services from trusted local providers.">
        <div className="filter-bar">
          <SearchInput value={searchText} onChange={handleSearchChange} placeholder="Search services" />
          <label className="field field--compact">
            <span className="field__label">Category</span>
            <select className="field__input" value={activeCategory} onChange={handleCategoryChange}>
              {categoryOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {services.length ? (
        <>
          <div className="service-grid">
            {services.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-card__meta">
                  <span>{service.category?.name || 'Category'}</span>
                  <span>{service.type || 'one_time'}</span>
                </div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="service-card__provider">
                  <strong>{service.provider?.business_name || 'ServiceHub provider'}</strong>
                  {service.provider?.average_rating ? <span> · {service.provider.average_rating} ★</span> : null}
                </div>
                <div className="service-card__footer">
                  <strong>₹{Number(service.base_price || 0).toFixed(2)}</strong>
                  <Link to={`/customer/services/${service.id}`}>View details</Link>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={pagination.page || 1}
            totalPages={pagination.pages || 1}
            onPageChange={(nextPage) => applyFilters(searchText, activeCategory, nextPage)}
          />
        </>
      ) : (
        <EmptyState title="No services found" description="Try a different search or clear the category filter." />
      )}
    </div>
  );
}
