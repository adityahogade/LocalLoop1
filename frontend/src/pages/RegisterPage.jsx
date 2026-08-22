import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/apiError';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, role } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });
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
      await register(form);
      navigate('/login');
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
          <p className="eyebrow">Create an account</p>
          <h2>Join ServiceHub and manage your everyday essentials from one place.</h2>
        </div>
      </div>

      <Card title="Register" subtitle="Create a customer account using the backend API">
        <form className="form" onSubmit={handleSubmit} noValidate>
          <Input label="Full name" name="full_name" value={form.full_name} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} required />

          <div className="field field--password">
            <label className="field__label" htmlFor="register-password">Password</label>
            <div className="password-wrap">
              <input
                id="register-password"
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
            {loading ? 'Creating account...' : 'Register'}
          </Button>

          <div className="form__links">
            <Link to="/login">Already have an account? Login</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
