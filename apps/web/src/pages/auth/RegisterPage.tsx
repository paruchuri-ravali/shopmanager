import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import formatError from '../../lib/formatError';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', shopName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        shopName: form.shopName.trim()
      });
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <form onSubmit={submit} className="card card-pad auth-card form-grid">
        <div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-copy">Set up a new store workspace in a minute.</p>
        </div>

        <label className="field">
          <span className="field-label">Name</span>
          <input placeholder="Ravi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>

        <label className="field">
          <span className="field-label">Email</span>
          <input placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <input placeholder="Minimum 8 characters" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>

        <label className="field">
          <span className="field-label">Shop name</span>
          <input placeholder="Ravi Kirana" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
        </label>

        {error ? <div className="badge badge-danger" style={{ whiteSpace: 'pre-line' }}>{error}</div> : null}

        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        <button type="button" className="button-secondary" onClick={() => navigate('/login')}>Back to login</button>
      </form>
    </div>
  );
}
