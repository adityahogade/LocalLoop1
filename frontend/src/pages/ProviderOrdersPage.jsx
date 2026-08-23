import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Order', key: 'order' },
  { label: 'Customer', key: 'customer' },
  { label: 'Service', key: 'service' },
  { label: 'Amount', key: 'amount' },
  { label: 'Status', key: 'status' },
];

const rows = [
  { id: 1, order: '#1042', customer: 'Asha K.', service: 'Home Cleaning', amount: '₹799', status: 'Accepted' },
  { id: 2, order: '#1046', customer: 'Ravi S.', service: 'AC Servicing', amount: '₹1,299', status: 'In progress' },
  { id: 3, order: '#1051', customer: 'Meena P.', service: 'Deep Cleaning', amount: '₹1,499', status: 'Awaiting review' },
];

const stats = [
  { label: 'Open orders', value: '14', hint: 'customer requests', trend: '+2' },
  { label: 'Completed today', value: '9', hint: 'deliveries closed', trend: '+3' },
  { label: 'Revenue', value: '₹18,450', hint: 'gross this week', trend: '+12%' },
];

export default function ProviderOrdersPage() {
  return (
    <ProviderModulePage
      title="Orders"
      subtitle="Customer jobs, status tracking, and service fulfillment."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No orders yet"
      emptyMessage="When customers book work, the latest orders will appear here."
    />
  );
}
