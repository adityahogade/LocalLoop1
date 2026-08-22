import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Plan', key: 'name' },
  { label: 'Service', key: 'service' },
  { label: 'Price', key: 'price' },
  { label: 'Duration', key: 'duration' },
  { label: 'Status', key: 'status' },
];

const rows = [
  { id: 1, name: 'Starter', service: 'Home Cleaning', price: '₹499', duration: '2 hrs', status: 'Published' },
  { id: 2, name: 'Classic', service: 'Home Cleaning', price: '₹799', duration: '4 hrs', status: 'Published' },
  { id: 3, name: 'Premium', service: 'AC Servicing', price: '₹1,299', duration: '1 visit', status: 'Review' },
];

const stats = [
  { label: 'Published plans', value: '12', hint: 'matching active offers', trend: '+1' },
  { label: 'Avg. plan price', value: '₹899', hint: 'for current catalog', trend: '+4%' },
  { label: 'Needs review', value: '3', hint: 'pricing or details', trend: '-1' },
];

export default function ProviderServicePlansPage() {
  return (
    <ProviderModulePage
      title="Service plans"
      subtitle="Pricing tiers and service bundles for your catalog."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No pricing plans"
      emptyMessage="Set up plans to support one-time and recurring delivery offers."
    />
  );
}
