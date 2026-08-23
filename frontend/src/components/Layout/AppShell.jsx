import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <Link to="/">ServiceHub</Link>
        </div>

        <nav className="topbar__nav" aria-label="Main navigation">
          <Link to="/">Home</Link>
          {!isAuthenticated && <Link to="/login">Login</Link>}
          {!isAuthenticated && <Link to="/register">Register</Link>}
          {isAuthenticated && <Link to="/customer">Dashboard</Link>}
        </nav>

        <div className="topbar__actions">
          {isAuthenticated ? (
            <>
              <span className="user-pill">{user?.role || 'Member'}</span>
              <button type="button" className="button button--secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="button button--primary">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="page-shell">{children}</main>
    </div>
  );
}
