import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppShell from '../components/Layout/AppShell';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import RoleGuard from '../routes/RoleGuard';
import authService from '../services/auth.service';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../services/auth.service', () => ({
  default: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

describe('authentication and role routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockReset();
  });

  it('logs in successfully and routes by backend role', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue({ user: { role: 'customer' } });

    render(
      <AuthContext.Provider value={{ login, isAuthenticated: false, role: null }}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'Password123' });
      expect(mockNavigate).toHaveBeenCalledWith('/customer', { replace: true });
    });
  });

  it('shows a validation error when the backend rejects invalid input', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue({
      response: { data: { error: { message: 'Email and password are required' } } },
    });

    render(
      <AuthContext.Provider value={{ login, isAuthenticated: false, role: null }}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await user.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Email and password are required')).toBeInTheDocument();
    });
  });

  it('shows wrong credentials feedback', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue({
      response: { data: { error: { message: 'Invalid email or password' } } },
    });

    render(
      <AuthContext.Provider value={{ login, isAuthenticated: false, role: null }}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPass123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('blocks access when a route is protected and the user is not authenticated', () => {
    render(
      <AuthContext.Provider value={{ isReady: true, isAuthenticated: false, role: null }}>
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

  it('redirects when the authenticated role does not match the route', () => {
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

  it('calls logout and clears auth state via the app shell', async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthContext.Provider value={{ isAuthenticated: true, user: { role: 'customer' }, logout }}>
        <MemoryRouter>
          <AppShell>
            <div>Child content</div>
          </AppShell>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await user.click(screen.getByRole('button', { name: /logout/i }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
    });
  });

  it('clears expired sessions during restoration', async () => {
    localStorage.setItem('servicehub.accessToken', 'expired-token');
    authService.getCurrentUser.mockRejectedValue(new Error('Expired session'));

    render(
      <AuthProvider>
        <div>App child</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authService.getCurrentUser).toHaveBeenCalled();
      expect(localStorage.getItem('servicehub.accessToken')).toBeNull();
    });
  });

  it('shows a loading state while auth is being restored', () => {
    render(
      <AuthContext.Provider value={{ isReady: false, isAuthenticated: false, role: null }}>
        <MemoryRouter>
          <RoleGuard allowedRoles={['customer']}>
            <div>Customer page</div>
          </RoleGuard>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
