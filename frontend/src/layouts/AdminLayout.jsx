import { NavLink, Outlet } from 'react-router-dom';
import ContentContainer from '../components/layout/ContentContainer';
import DashboardShell from '../components/layout/DashboardShell';
import PageHeader from '../components/ui/PageHeader';

const navItems = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Providers', to: '/admin/providers' },
  { label: 'KYC', to: '/admin/kyc' },
  { label: 'Categories', to: '/admin/categories' },
  { label: 'Services', to: '/admin/services' },
  { label: 'Service Areas', to: '/admin/service-areas' },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Subscriptions', to: '/admin/subscriptions' },
  { label: 'Deliveries', to: '/admin/deliveries' },
  { label: 'Coupons', to: '/admin/coupons' },
  { label: 'Commission Rules', to: '/admin/commission-rules' },
  { label: 'Settlements', to: '/admin/settlements' },
  { label: 'Refunds', to: '/admin/refunds' },
  { label: 'Reviews', to: '/admin/reviews' },
  { label: 'Support', to: '/admin/support' },
  { label: 'Reports', to: '/admin/reports' },
  { label: 'Audit Logs', to: '/admin/audit-logs' },
  { label: 'Settings', to: '/admin/settings' },
];

export default function AdminLayout() {
  return (
    <DashboardShell title="Admin workspace" subtitle="Enterprise control center foundation for operations, compliance, and reporting.">
      <ContentContainer>
        <div className="layout-shell layout-shell--admin">
          <aside className="layout-sidebar">
            <div className="layout-sidebar__brand">Admin Console</div>
            <nav className="layout-nav" aria-label="Admin navigation">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `layout-nav__link ${isActive ? 'layout-nav__link--active' : ''}`.trim()}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="layout-main">
            <PageHeader title="Operations overview" subtitle="Tables, filters, and policy controls are prepared for future admin workflows." />
            <Outlet />
          </main>
        </div>
      </ContentContainer>
    </DashboardShell>
  );
}
