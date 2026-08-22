import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Service', key: 'name' },
  { label: 'Category', key: 'category' },
  { label: 'Type', key: 'type' },
  { label: 'Status', key: 'status' },
  { label: 'Updated', key: 'updated' },
];

const rows = [
  { id: 1, name: 'Home Cleaning', category: 'Housekeeping', type: 'One-time', status: 'Active', updated: 'Today' },
  { id: 2, name: 'Deep Cleaning', category: 'Housekeeping', type: 'Subscription', status: 'Draft', updated: '2 days ago' },
  { id: 3, name: 'AC Servicing', category: 'Maintenance', type: 'One-time', status: 'Active', updated: '3 days ago' },
];

const stats = [
  { label: 'Active services', value: '18', hint: 'live in catalog', trend: '+2' },
  { label: 'Draft items', value: '4', hint: 'needing review', trend: '-1' },
  { label: 'Avg. conversion', value: '31%', hint: 'visibility to booking', trend: '+6%' },
];

export default function ProviderServicesPage() {
  return (
    <ProviderModulePage
      title="Service catalog"
      subtitle="Available service offerings and configuration status."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No services listed"
      emptyMessage="Create your first service to begin serving customer requests."
    />
  );
}
