import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import KpiCard from '../components/ui/KpiCard';
import ResponsiveGrid from '../components/layout/ResponsiveGrid';
import Table from '../components/ui/Table';

export default function ProviderModulePage({
  title,
  subtitle,
  stats = [],
  columns = [],
  rows = [],
  emptyTitle = 'No records yet',
  emptyMessage = 'There is nothing to show for this workspace yet.',
}) {
  return (
    <div className="page page--provider-module">
      {stats.length ? (
        <ResponsiveGrid columns={Math.min(stats.length, 3)}>
          {stats.map((stat) => (
            <KpiCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} trend={stat.trend} />
          ))}
        </ResponsiveGrid>
      ) : null}

      <Card title={title} subtitle={subtitle}>
        {rows.length ? <Table columns={columns} rows={rows} /> : <EmptyState title={emptyTitle} description={emptyMessage} />}
      </Card>
    </div>
  );
}
