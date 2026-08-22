import RolePlaceholderPage from './RolePlaceholderPage';

export default function AdminDashboardPage() {
  return (
    <RolePlaceholderPage
      title="Admin dashboard foundation"
      subtitle="This view is reserved for enterprise controls, tables, and reporting later on."
      stats={[
        { label: 'Active users', value: '8,420', hint: 'last 30 days', trend: '+6.4%' },
        { label: 'Open reviews', value: '149', hint: 'requires response', trend: '+24' },
        { label: 'KYC pending', value: '23', hint: 'needs review', trend: '-8' },
      ]}
    />
  );
}
