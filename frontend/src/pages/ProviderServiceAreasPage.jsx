import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Area', key: 'area' },
  { label: 'Radius', key: 'radius' },
  { label: 'Availability', key: 'availability' },
  { label: 'Coverage', key: 'coverage' },
];

const rows = [
  { id: 1, area: 'Downtown', radius: '8 km', availability: 'High', coverage: 'Residential + commercial' },
  { id: 2, area: 'East side', radius: '10 km', availability: 'Medium', coverage: 'Residential' },
  { id: 3, area: 'North Market', radius: '5 km', availability: 'Low', coverage: 'Commercial' },
];

const stats = [
  { label: 'Service areas', value: '9', hint: 'operating zones', trend: '+2' },
  { label: 'Avg. response', value: '31 min', hint: 'within target area', trend: '-4 min' },
  { label: 'Coverage health', value: '86%', hint: 'zones with active coverage', trend: '+5%' },
];

export default function ProviderServiceAreasPage() {
  return (
    <ProviderModulePage
      title="Service areas"
      subtitle="Coverage zones and service reach for active bookings."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No service areas"
      emptyMessage="Define your local coverage zones before taking new bookings."
    />
  );
}
