import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/apiError';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(form);
      const nextRole = String(result?.user?.role || role || '').toLowerCase();
      const target = nextRole === 'provider' ? '/provider' : nextRole === 'admin' ? '/admin' : '/customer';
      navigate(target, { replace: true });
    } catch (apiError) {
      setError(getErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    const defaultRoute = role === 'provider' ? '/provider' : role === 'admin' ? '/admin' : '/customer';
    return <Navigate to={defaultRoute} replace />;
  }

  return (
    <div className="page page--auth auth-layout">
      <div className="auth-visual" aria-hidden="true">
        <div className="auth-visual__card">
          <p className="eyebrow">Trusted everyday services</p>
          <h2>ServiceHub keeps your home, work, and care routines moving.</h2>
        </div>
      </div>

      <Card title="Welcome back" subtitle="Sign in to your ServiceHub account">
        <form className="form" onSubmit={handleSubmit} noValidate>
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />

          <div className="field field--password">
            <label className="field__label" htmlFor="password">Password</label>
            <div className="password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="field__input"
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error ? <p className="form__error" aria-live="polite">{error}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </Button>

          <div className="form__links">
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/register">Create account</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
