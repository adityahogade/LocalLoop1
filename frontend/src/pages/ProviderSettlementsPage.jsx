import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Settlement', key: 'settlement' },
  { label: 'Period', key: 'period' },
  { label: 'Amount', key: 'amount' },
  { label: 'Status', key: 'status' },
];

const rows = [
  { id: 1, settlement: 'SET-304', period: 'May 2026', amount: '₹18,250', status: 'Processed' },
  { id: 2, settlement: 'SET-305', period: 'June 2026', amount: '₹22,100', status: 'Scheduled' },
  { id: 3, settlement: 'SET-306', period: 'July 2026', amount: '₹19,760', status: 'Pending' },
];

const stats = [
  { label: 'Settled', value: '₹18,250', hint: 'last payout', trend: '+7%' },
  { label: 'Scheduled', value: '₹22,100', hint: 'next transfer', trend: '+10%' },
  { label: 'Pending', value: '₹19,760', hint: 'awaiting release', trend: '-2%' },
];

export default function ProviderSettlementsPage() {
  return (
    <ProviderModulePage
      title="Settlements"
      subtitle="Payout tracking and settlement status across service periods."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No settlements"
      emptyMessage="Bank transfers and settlement summaries will show here after service payouts are generated."
    />
  );
}
