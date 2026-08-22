import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CustomerLayout from '../layouts/CustomerLayout';
import ProviderLayout from '../layouts/ProviderLayout';
import AdminLayout from '../layouts/AdminLayout';
import RoleGuard from '../routes/RoleGuard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';

describe('shared ui system and layouts', () => {
  it('renders an accessible button and input', () => {
    render(
      <>
        <Button aria-label="Continue action">Continue</Button>
        <Input label="Email" name="email" aria-label="Email" defaultValue="user@example.com" />
      </>
    );

    expect(screen.getByRole('button', { name: /continue action/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue('user@example.com');
  });

  it('opens and closes a modal using the dialog API', () => {
    const onClose = vi.fn();

    const { rerender } = render(<Modal open title="Settings" onClose={onClose}><p>Modal content</p></Modal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    rerender(<Modal open={false} title="Settings" onClose={onClose}><p>Modal content</p></Modal>);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
  });

  it('renders the status badge in a readable format', () => {
    render(<StatusBadge status="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders the customer layout shell and navigation', () => {
    render(
      <MemoryRouter initialEntries={['/customer']}>
        <Routes>
          <Route path="/customer/*" element={<CustomerLayout />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Customer workspace')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
  });

  it('renders the provider layout shell and navigation', () => {
    render(
      <MemoryRouter initialEntries={['/provider']}>
        <Routes>
          <Route path="/provider/*" element={<ProviderLayout />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Provider workspace')).toBeInTheDocument();
    expect(screen.getByText('Accounting')).toBeInTheDocument();
    expect(screen.getByText('Settlements')).toBeInTheDocument();
  });

  it('renders the admin layout shell and navigation', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin workspace')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('enforces route access based on the authenticated role', () => {
    render(
      <AuthContext.Provider value={{ isReady: true, isAuthenticated: true, role: 'customer' }}>
        <MemoryRouter initialEntries={['/provider']}>
          <Routes>
            <Route path="/provider" element={<RoleGuard allowedRoles={['provider']}><div>Provider page</div></RoleGuard>} />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
