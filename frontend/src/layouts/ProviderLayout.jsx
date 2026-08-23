import { NavLink, Outlet } from 'react-router-dom';
import ContentContainer from '../components/layout/ContentContainer';
import DashboardShell from '../components/layout/DashboardShell';
import PageHeader from '../components/ui/PageHeader';

const navItems = [
  { label: 'Dashboard', to: '/provider' },
  { label: 'Profile', to: '/provider/profile' },
  { label: 'Services', to: '/provider/services' },
  { label: 'Plans', to: '/provider/plans' },
  { label: 'Service Areas', to: '/provider/service-areas' },
  { label: 'Availability', to: '/provider/availability' },
  { label: 'Orders', to: '/provider/orders' },
  { label: 'Deliveries', to: '/provider/deliveries' },
  { label: 'Expenses', to: '/provider/expenses' },
  { label: 'Accounting', to: '/provider/accounting' },
  { label: 'Analytics', to: '/provider/analytics' },
  { label: 'Settlements', to: '/provider/settlements' },
  { label: 'KYC', to: '/provider/kyc' },
  { label: 'Bank Account', to: '/provider/bank-account' },
  { label: 'Support', to: '/provider/support' },
];

export default function ProviderLayout() {
  return (
    <DashboardShell title="Provider workspace" subtitle="Operations dashboard foundation for service delivery workflows.">
      <ContentContainer>
        <div className="layout-shell layout-shell--provider">
          <aside className="layout-sidebar">
            <div className="layout-sidebar__brand">Provider Console</div>
            <nav className="layout-nav" aria-label="Provider navigation">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `layout-nav__link ${isActive ? 'layout-nav__link--active' : ''}`.trim()}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="layout-main">
            <PageHeader title="Operations overview" subtitle="Today’s priorities are surfaced for fast access." />
            <Outlet />
          </main>
        </div>
      </ContentContainer>
    </DashboardShell>
  );
}
