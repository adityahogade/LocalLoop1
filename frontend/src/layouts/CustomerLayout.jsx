import { NavLink, Outlet } from 'react-router-dom';
import ContentContainer from '../components/layout/ContentContainer';
import DashboardShell from '../components/layout/DashboardShell';
import PageHeader from '../components/ui/PageHeader';

const navItems = [
  { label: 'Home', to: '/customer' },
  { label: 'Categories', to: '/customer/categories' },
  { label: 'Services', to: '/customer/services' },
  { label: 'Book service', to: '/customer/booking' },
  { label: 'Orders', to: '/customer/orders' },
  { label: 'Subscriptions', to: '/customer/subscriptions' },
  { label: 'Wallet', to: '/customer/wallet' },
  { label: 'Profile', to: '/customer/profile' },
];

export default function CustomerLayout() {
  return (
    <DashboardShell title="Customer workspace" subtitle="Service discovery and account overview.">
      <ContentContainer>
        <div className="layout-shell layout-shell--customer">
          <aside className="layout-sidebar">
            <div className="layout-sidebar__brand">ServiceHub</div>
            <nav className="layout-nav" aria-label="Customer navigation">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `layout-nav__link ${isActive ? 'layout-nav__link--active' : ''}`.trim()}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="layout-main">
            <PageHeader title="Welcome back" subtitle="Explore local services and start a booking from the marketplace." />
            <Outlet />
          </main>
        </div>
      </ContentContainer>
    </DashboardShell>
  );
}
