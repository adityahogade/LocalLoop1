import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Period', key: 'period' },
  { label: 'Gross', key: 'gross' },
  { label: 'Net', key: 'net' },
  { label: 'Fees', key: 'fees' },
];

const rows = [
  { id: 1, period: 'This week', gross: '₹18,450', net: '₹15,340', fees: '₹3,110' },
  { id: 2, period: 'This month', gross: '₹64,880', net: '₹55,240', fees: '₹9,640' },
  { id: 3, period: 'Quarter to date', gross: '₹182,600', net: '₹154,300', fees: '₹28,300' },
];

const stats = [
  { label: 'Gross revenue', value: '₹64,880', hint: 'current month', trend: '+15%' },
  { label: 'Net payout', value: '₹55,240', hint: 'after fees', trend: '+9%' },
  { label: 'Outstanding', value: '₹7,340', hint: 'pending settlement', trend: '-3%' },
];

export default function ProviderAccountingPage() {
  return (
    <ProviderModulePage
      title="Accounting"
      subtitle="Revenue summaries, fees, and payout health."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No accounting data"
      emptyMessage="Revenue reports will populate once service activity is recorded."
    />
  );
}
