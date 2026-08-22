import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import KpiCard from '../components/ui/KpiCard';
import ResponsiveGrid from '../components/layout/ResponsiveGrid';
import Skeleton from '../components/ui/Skeleton';
import Table from '../components/ui/Table';

export default function AdminModulePage({
  title,
  subtitle,
  stats = [],
  columns = [],
  rows = [],
  loading = false,
  error = '',
  emptyTitle = 'No records found',
  emptyMessage = 'There are no records to display for this section yet.',
  children,
}) {
  if (loading) {
    return <div className="page"><Skeleton lines={5} /></div>;
  }

  if (error) {
    return <ErrorState title="Unable to load admin data" message={error} />;
  }

  return (
    <div className="page page--admin-module">
      {stats.length ? (
        <ResponsiveGrid columns={Math.min(stats.length, 3)}>
          {stats.map((stat) => (
            <KpiCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} trend={stat.trend} />
          ))}
        </ResponsiveGrid>
      ) : null}

      <Card title={title} subtitle={subtitle}>
        {children || (rows.length ? <Table columns={columns} rows={rows} /> : <EmptyState title={emptyTitle} description={emptyMessage} />)}
      </Card>
    </div>
  );
}
