import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import catalogService from '../services/catalog.service';

export default function CustomerCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const result = await catalogService.getCategories();
        if (isMounted) setCategories(result || []);
      } catch (loadError) {
        if (isMounted) setError(loadError?.message || 'Unable to load categories.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <Skeleton lines={4} />;
  if (error) return <ErrorState title="Categories unavailable" message={error} />;

  return (
    <div className="page page--categories">
      <Card title="Browse categories" subtitle="Explore the available service categories on ServiceHub.">
        {categories.length ? (
          <div className="category-grid">
            {categories.map((category) => (
              <Link key={category.id} className="category-card" to={`/customer/services?category_id=${category.id}`}>
                <div className="category-card__icon">{category.name.charAt(0)}</div>
                <h3>{category.name}</h3>
                {category.slug ? <small>{category.slug}</small> : null}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No categories" description="There are no published categories right now." />
        )}
      </Card>
    </div>
  );
}
