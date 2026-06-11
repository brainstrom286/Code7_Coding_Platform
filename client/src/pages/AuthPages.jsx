import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { getUser, setAuth } from '../lib/auth';

function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2>{title}</h2>
          <p className="subtitle">{subtitle}</p>
        </div>
        {children}
        <div className="auth-footer">{footer}</div>
      </div>
    </div>
  );
}

export function StudentLoginPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'student') navigate('/student/dashboard', { replace: true });
  }, [navigate, user]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await apiFetch('/auth/login', { method: 'POST', body: form });
      if (data.role !== 'student') throw new Error('Not a student account');
      setAuth(data);
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Student Login"
      subtitle="Access your placement tests"
      footer={
        <>
          Don't have an account? <Link to="/student/register">Register here</Link>
          <br /><br />
          <Link to="/">Back to Home</Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="********" required />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? 'Logging in...' : 'Login'}
        </button>
        <p className={`error-msg ${error ? '' : 'hidden'}`}>{error}</p>
      </form>
    </AuthCard>
  );
}

export function StudentRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', enrollment: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch('/auth/register', { method: 'POST', body: form });
      setSuccess('Registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/student/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Create Account"
      subtitle="Register to take placement tests"
      footer={
        <>
          Already registered? <Link to="/student/login">Login here</Link>
          <br /><br />
          <Link to="/">Back to Home</Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" required />
        </div>
        <div className="form-group">
          <label>Enrollment Number</label>
          <input type="text" value={form.enrollment} onChange={e => setForm(f => ({ ...f, enrollment: e.target.value }))} placeholder="e.g. 21CS001" required />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" minLength={6} required />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? 'Creating...' : 'Create Account'}
        </button>
        <p className={`error-msg ${error ? '' : 'hidden'}`}>{error}</p>
        <p className={`success-msg ${success ? '' : 'hidden'}`}>{success}</p>
      </form>
    </AuthCard>
  );
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin/dashboard', { replace: true });
  }, [navigate, user]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await apiFetch('/auth/login', { method: 'POST', body: form });
      if (data.role !== 'admin') throw new Error('Not an admin account');
      setAuth(data);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Admin Login"
      subtitle="Manage tests and view results"
      footer={<Link to="/">Back to Home</Link>}
    >
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Enter email address" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Enter password" required />
        </div>
        <button type="submit" className="btn btn-secondary w-full" disabled={busy}>
          {busy ? 'Logging in...' : 'Login as Admin'}
        </button>
        <p className={`error-msg ${error ? '' : 'hidden'}`}>{error}</p>
      </form>
    </AuthCard>
  );
}
