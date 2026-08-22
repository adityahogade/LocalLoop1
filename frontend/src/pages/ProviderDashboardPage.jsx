import RolePlaceholderPage from './RolePlaceholderPage';

export default function ProviderDashboardPage() {
  return (
    <RolePlaceholderPage
      title="Provider dashboard foundation"
      subtitle="This workspace is ready for future operational modules."
      stats={[
        { label: 'Today\'s income', value: '$1,240', hint: 'vs yesterday', trend: '+12%' },
        { label: 'Today\'s deliveries', value: '18', hint: 'completed today', trend: '+3' },
        { label: 'Open tasks', value: '9', hint: 'need attention', trend: '-2' },
      ]}
    />
  );
}
