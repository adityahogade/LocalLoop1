import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Delivery', key: 'delivery' },
  { label: 'Assigned', key: 'assigned' },
  { label: 'Window', key: 'window' },
  { label: 'Status', key: 'status' },
];

const rows = [
  { id: 1, delivery: 'DL-151', assigned: 'Crew A', window: 'Today · 10:00–12:00', status: 'Out for delivery' },
  { id: 2, delivery: 'DL-152', assigned: 'Crew B', window: 'Today · 15:00–17:00', status: 'Scheduled' },
  { id: 3, delivery: 'DL-153', assigned: 'Crew C', window: 'Tomorrow · 09:00–11:00', status: 'Delayed' },
];

const stats = [
  { label: 'Active deliveries', value: '6', hint: 'in the field', trend: '+1' },
  { label: 'On-time rate', value: '96%', hint: 'for this month', trend: '+2%' },
  { label: 'Delayed jobs', value: '2', hint: 'require attention', trend: '-1' },
];

export default function ProviderDeliveriesPage() {
  return (
    <ProviderModulePage
      title="Deliveries"
      subtitle="Service execution and on-site delivery tracking."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No delivery jobs"
      emptyMessage="Delivery assignments will show up after orders are accepted."
    />
  );
}
