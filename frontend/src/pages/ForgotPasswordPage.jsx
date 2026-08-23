import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import authService from '../services/auth.service';
import { getErrorMessage } from '../utils/apiError';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    try {
      await authService.forgotPassword(email);
      setStatus('If an account exists for that email, a reset link will be sent.');
    } catch (apiError) {
      setError(getErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--auth">
      <Card title="Forgot password" subtitle="Request a reset link for your ServiceHub account">
        <form className="form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          {error ? <p className="form__error" aria-live="polite">{error}</p> : null}
          {status ? <p className="form__success" aria-live="polite">{status}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>

          <div className="form__links">
            <Link to="/login">Back to login</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
