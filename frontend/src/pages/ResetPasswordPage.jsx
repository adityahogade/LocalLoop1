import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import authService from '../services/auth.service';
import { getErrorMessage } from '../utils/apiError';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing. Please request a new password reset link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({ token, password });
      setSuccess('Your password has been reset successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (apiError) {
      setError(getErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--auth">
      <Card title="Reset password" subtitle="Choose a new password for your ServiceHub account">
        <form className="form" onSubmit={handleSubmit}>
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          {error ? <p className="form__error" aria-live="polite">{error}</p> : null}
          {success ? <p className="form__success" aria-live="polite">{success}</p> : null}

          <Button type="submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset password'}
          </Button>

          <div className="form__links">
            <Link to="/login">Back to login</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
