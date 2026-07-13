import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import styles from './Auth.module.css';

function GoogleLogo() {
  return (
    <svg className={styles.googleIcon} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

export default function Login() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setAuth }             = useAuthStore();
  const navigate                = useNavigate();

  useEffect(() => {
    document.title = 'Login - Saferest AI';
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      setAuth(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length > 0) {
        setError(data.errors.map(e => e.message).join('. '));
      } else {
        setError(data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // useGoogleLogin provides an OAuth2 access_token; we forward it to our backend
  // which calls Google's userinfo endpoint to verify and get the profile.
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setGoogleLoading(true);
      try {
        const res = await api.post('/auth/google', { access_token: tokenResponse.access_token });
        setAuth(res.data.user, res.data.accessToken);
        navigate('/dashboard');
      } catch (err) {
        const data = err.response?.data;
        setError(data?.message || 'Google sign-in failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError('Google sign-in was cancelled or failed. Please try again.'),
  });

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Saferest Logo" className={styles.logoImage} />
        </div>

        <div className={styles.logoRow}>
          <span className={styles.logoText}>Saferest<strong>.ai</strong></span>
        </div>

        <div className={styles.titleBlock}>
          <h2>Welcome back</h2>
          <p>Sign in to your security dashboard.</p>
        </div>

        {/* Google Sign-In Button */}
        <button
          id="google-signin-btn"
          type="button"
          className={styles.googleBtn}
          onClick={() => loginWithGoogle()}
          disabled={googleLoading || loading}
        >
          <GoogleLogo />
          {googleLoading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className={styles.dividerRow} style={{ margin: '20px 0' }}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or sign in with email</span>
          <span className={styles.dividerLine} />
        </div>

        <form onSubmit={handleSubmit} className={styles.form} style={{ gap: '18px', marginTop: 0 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <div className={styles.inputWrap}>
              <FiMail className={styles.inputIcon} size={16} />
              <input
                id="login-email"
                className={`form-input ${styles.inputPadded}`}
                type="email"
                name="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className={styles.inputWrap}>
              <FiLock className={styles.inputIcon} size={16} />
              <input
                id="login-password"
                className={`form-input ${styles.inputPadded}`}
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="form-error">
              <FiAlertCircle size={14} /> {error}
            </p>
          )}

          <button
            id="login-submit-btn"
            className={`btn btn-primary ${styles.submitBtn}`}
            type="submit"
            disabled={loading || googleLoading}
          >
            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Don't have an account? <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
