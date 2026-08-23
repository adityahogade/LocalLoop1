import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Document', key: 'document' },
  { label: 'Type', key: 'type' },
  { label: 'Submitted', key: 'submitted' },
  { label: 'Status', key: 'status' },
];

const rows = [
  { id: 1, document: 'PAN', type: 'Identity', submitted: '12 Jun 2026', status: 'Approved' },
  { id: 2, document: 'GST', type: 'Tax', submitted: '15 Jun 2026', status: 'Review' },
  { id: 3, document: 'Bank proof', type: 'Compliance', submitted: '18 Jun 2026', status: 'Pending' },
];

const stats = [
  { label: 'Verified docs', value: '4', hint: 'on file', trend: '+2' },
  { label: 'Review queue', value: '1', hint: 'document needs attention', trend: '-1' },
  { label: 'Completion', value: '92%', hint: 'profile verification', trend: '+4%' },
];

export default function ProviderKycPage() {
  return (
    <ProviderModulePage
      title="KYC"
      subtitle="Document review and provider compliance status."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="KYC not started"
      emptyMessage="Submit compliance documents to complete provider verification."
    />
  );
}
