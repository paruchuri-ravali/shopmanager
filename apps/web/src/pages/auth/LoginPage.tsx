import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authApi.login(email, password);
      setAuth(result.accessToken, result.user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <form onSubmit={submit} className="card card-pad auth-card form-grid">
        <div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-copy">Sign in to manage products, sales, and customers.</p>
        </div>

        <label className="field">
          <span className="field-label">Email</span>
          <input placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <input placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error ? <div className="badge badge-danger">{error}</div> : null}

        <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
        <button type="button" className="button-secondary" onClick={() => navigate('/register')}>Create account</button>
      </form>
    </div>
  );
}
