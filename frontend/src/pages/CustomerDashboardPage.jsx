import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import ResponsiveGrid from '../components/layout/ResponsiveGrid';
import { useAuth } from '../context/AuthContext';

export default function CustomerDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page page--dashboard">
      <ResponsiveGrid columns={3}>
        <KpiCard label="Upcoming services" value="4" hint="next 7 days" trend="+2" />
        <KpiCard label="My subscriptions" value="2" hint="active plans" trend="Healthy" />
        <KpiCard label="Wallet balance" value="₹1,240" hint="available" trend="+₹160" />
      </ResponsiveGrid>

      <Card title="Customer dashboard" subtitle="Phase 3 layout foundation shell">
        <p>
          You are signed in as <strong>{user?.role || 'customer'}</strong>.
        </p>
        <p>This workspace is intentionally left as a responsive layout shell for later marketplace features.</p>
      </Card>
    </div>
  );
}
