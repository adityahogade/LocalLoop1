import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Day', key: 'day' },
  { label: 'Window', key: 'window' },
  { label: 'Capacity', key: 'capacity' },
  { label: 'Status', key: 'status' },
];

const rows = [
  { id: 1, day: 'Monday', window: '09:00–18:00', capacity: '6 slots', status: 'Available' },
  { id: 2, day: 'Tuesday', window: '10:00–17:00', capacity: '4 slots', status: 'Updating' },
  { id: 3, day: 'Wednesday', window: '11:00–19:00', capacity: '5 slots', status: 'Available' },
];

const stats = [
  { label: 'Open slots', value: '29', hint: 'this week', trend: '+4' },
  { label: 'Booked today', value: '11', hint: 'confirmed requests', trend: '+3' },
  { label: 'Utilization', value: '43%', hint: 'capacity used', trend: '+6%' },
];

export default function ProviderAvailabilityPage() {
  return (
    <ProviderModulePage
      title="Availability"
      subtitle="Open windows and scheduling capacity for incoming bookings."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No availability"
      emptyMessage="Add working hours to ensure customer bookings can be accepted."
    />
  );
}
