import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Field', key: 'field' },
  { label: 'Value', key: 'value' },
];

const rows = [
  { id: 1, field: 'Business name', value: 'Northside Home Care' },
  { id: 2, field: 'Service category', value: 'Home services' },
  { id: 3, field: 'Verification', value: 'Approved' },
  { id: 4, field: 'Coverage area', value: 'Downtown + East side' },
];

const stats = [
  { label: 'Profile completion', value: '92%', hint: 'updated this month', trend: '+8%' },
  { label: 'Average rating', value: '4.8 ★', hint: 'from customer reviews', trend: '+0.2' },
  { label: 'Response time', value: '34 min', hint: 'within SLA', trend: '-7 min' },
];

export default function ProviderProfilePage() {
  return (
    <ProviderModulePage
      title="Provider profile"
      subtitle="Core provider identity, operating profile, and service readiness."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="Profile not configured"
      emptyMessage="Add your profile details to begin receiving service requests."
    />
  );
}
