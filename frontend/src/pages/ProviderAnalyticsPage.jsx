import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Metric', key: 'metric' },
  { label: 'Current', key: 'current' },
  { label: 'Trend', key: 'trend' },
  { label: 'Target', key: 'target' },
];

const rows = [
  { id: 1, metric: 'Bookings', current: '254', trend: '+18%', target: '220' },
  { id: 2, metric: 'Conversion rate', current: '31%', trend: '+6%', target: '25%' },
  { id: 3, metric: 'Repeat customers', current: '41%', trend: '+9%', target: '35%' },
];

const stats = [
  { label: 'Bookings', value: '254', hint: 'this month', trend: '+18%' },
  { label: 'Conversion', value: '31%', hint: 'from views to completed jobs', trend: '+6%' },
  { label: 'Customer retention', value: '41%', hint: 'returning users', trend: '+9%' },
];

export default function ProviderAnalyticsPage() {
  return (
    <ProviderModulePage
      title="Analytics"
      subtitle="Operational performance, booking quality, and repeat customer insights."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No analytics yet"
      emptyMessage="Engagement and conversion metrics will appear after the first bookings are completed."
    />
  );
}
