import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, useAnimationControls } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import AuthShell from './AuthShell';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabase';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import SetupNotice from './SetupNotice';

export default function Login() {
  useDocumentMeta({ title: 'Admin sign in', noindex: true });
  const { session, isAdmin, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const shake = useAnimationControls();

  if (!isSupabaseConfigured) return <SetupNotice />;
  if (!loading && session && isAdmin) return <Navigate to={location.state?.from || '/admin'} replace />;

  const onKey = (e) => setCaps(Boolean(e.getModifierState?.('CapsLock')));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Incorrect email or password.' : err.message);
      shake.start({ x: [0, -10, 9, -6, 4, 0], transition: { duration: 0.45 } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <motion.form onSubmit={onSubmit} animate={shake} noValidate={false}>
        <div className="login__card-head">
          <span className="login__badge"><ShieldCheck aria-hidden="true" /> Secure sign-in</span>
          <h2>Welcome back</h2>
          <p>Sign in to the TITAN MOTORS dashboard.</p>
        </div>

        <div className="lfield">
          <label htmlFor="login-email">Email</label>
          <div className="lfield__box">
            <Mail aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="you@company.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="lfield">
          <label htmlFor="login-password">Password</label>
          <div className="lfield__box">
            <Lock aria-hidden="true" />
            <input
              id="login-password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={onKey}
              onKeyDown={onKey}
              aria-describedby={caps ? 'caps-warning' : undefined}
            />
            <button type="button" className="lfield__eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
              {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
          {caps && <span id="caps-warning" className="lfield__hint">Caps Lock is on</span>}
        </div>

        {error && (
          <motion.p className="login__error" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <AlertCircle aria-hidden="true" /> {error}
          </motion.p>
        )}

        <button type="submit" className="login__submit" disabled={busy}>
          {busy ? <span className="login__spinner" aria-hidden="true" /> : null}
          <span>{busy ? 'Signing in…' : 'Sign in'}</span>
          {!busy && <ArrowRight aria-hidden="true" />}
        </button>

        <p className="login__note">Access is limited to authorised TITAN MOTORS staff. Contact the account owner if you need access.</p>
      </motion.form>
    </AuthShell>
  );
}
