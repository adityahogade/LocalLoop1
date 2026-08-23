import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import ResponsiveGrid from '../components/layout/ResponsiveGrid';

export default function RolePlaceholderPage({ title, subtitle, stats = [] }) {
  return (
    <div className="page page--dashboard">
      <ResponsiveGrid columns={3}>
        {stats.map((stat) => (
          <KpiCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} trend={stat.trend} />
        ))}
      </ResponsiveGrid>

      <Card title={title} subtitle={subtitle}>
        <p>This area is intentionally left as a shell placeholder for the later feature work.</p>
        <p>The shared layout, responsive navigation, and design system are now in place.</p>
      </Card>
    </div>
  );
}
