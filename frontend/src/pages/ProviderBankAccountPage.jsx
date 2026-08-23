import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Bank', key: 'bank' },
  { label: 'Account', key: 'account' },
  { label: 'IFSC', key: 'ifsc' },
  { label: 'Status', key: 'status' },
];

const rows = [
  { id: 1, bank: 'HDFC Bank', account: '**** 3486', ifsc: 'HDFC0001234', status: 'Primary' },
  { id: 2, bank: 'ICICI Bank', account: '**** 7018', ifsc: 'ICIC0004567', status: 'Secondary' },
];

const stats = [
  { label: 'Primary account', value: 'Verified', hint: 'ready for payouts', trend: '+1' },
  { label: 'Bank match', value: '100%', hint: 'consistent with profile', trend: '0%' },
  { label: 'Last update', value: '2 days ago', hint: 'account details refreshed', trend: '+1' },
];

export default function ProviderBankAccountPage() {
  return (
    <ProviderModulePage
      title="Bank account"
      subtitle="Payout details and routing information for provider settlements."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No bank account"
      emptyMessage="Add a verified bank account to enable payout transfers."
    />
  );
}
