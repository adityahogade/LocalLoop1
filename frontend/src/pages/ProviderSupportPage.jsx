import ProviderModulePage from './ProviderModulePage';

const columns = [
  { label: 'Ticket', key: 'ticket' },
  { label: 'Subject', key: 'subject' },
  { label: 'Priority', key: 'priority' },
  { label: 'Status', key: 'status' },
];

const rows = [
  { id: 1, ticket: '#SUP-104', subject: 'Payout delay query', priority: 'High', status: 'Open' },
  { id: 2, ticket: '#SUP-118', subject: 'Availability sync issue', priority: 'Medium', status: 'In progress' },
  { id: 3, ticket: '#SUP-119', subject: 'Profile verification follow-up', priority: 'Low', status: 'Resolved' },
];

const stats = [
  { label: 'Open tickets', value: '4', hint: 'awaiting action', trend: '-1' },
  { label: 'Avg. resolution', value: '18 hrs', hint: 'support SLA', trend: '-2 hrs' },
  { label: 'Satisfaction', value: '4.7/5', hint: 'recent feedback', trend: '+0.2' },
];

export default function ProviderSupportPage() {
  return (
    <ProviderModulePage
      title="Support"
      subtitle="Customer and platform support tickets and case follow-up."
      stats={stats}
      columns={columns}
      rows={rows}
      emptyTitle="No support tickets"
      emptyMessage="Support issues and account questions will be tracked here when they arrive."
    />
  );
}
