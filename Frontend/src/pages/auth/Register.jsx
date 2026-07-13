import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
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

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Register - Saferest AI';
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      setAuth(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && data.errors.length > 0) {
        setError(data.errors.map(e => e.message).join('. '));
      } else {
        setError(data?.message || 'Registration failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
        setError(data?.message || 'Google sign-up failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError('Google sign-up was cancelled or failed. Please try again.'),
  });

  const loginAsTestAccount = async () => {
    setError('');
    setTestLoading(true);
    try {
      const res = await api.post('/auth/test-account');
      setAuth(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError('Test login failed. Please ensure the backend is running.');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Saferest Logo" className={styles.logoImage} />
        </div>
        <div className={styles.logoRow}>
          <span className={styles.logoText}>Saferest<strong>.ai</strong></span>
        </div>
        <div className={styles.titleBlock}>
          <h2>Create your account</h2>
          <p>Start scanning for vulnerabilities in minutes.</p>
        </div>

        {/* Test Account Button */}
        <button
          id="test-account-btn"
          type="button"
          className={styles.googleBtn}
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#000',
            border: 'none',
            fontWeight: '900',
            fontSize: '1rem',
            fontFamily: "'Cairo', sans-serif",
            letterSpacing: '0.02em',
            marginBottom: '10px',
            boxShadow: '0 0 16px rgba(245,158,11,0.35)'
          }}
          onClick={loginAsTestAccount}
          disabled={googleLoading || loading || testLoading}
        >
          {testLoading ? 'Loading…' : 'حساب مفتوح للتجريب'}
        </button>

        {/* Google Sign-Up Button */}
        <button
          id="google-signup-btn"
          type="button"
          className={styles.googleBtn}
          onClick={() => loginWithGoogle()}
          disabled={googleLoading || loading || testLoading}
        >
          <GoogleLogo />
          {googleLoading ? 'Signing up…' : 'Sign up with Google'}
        </button>

        {/* Divider */}
        <div className={styles.dividerRow} style={{ margin: '20px 0' }}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or sign up with email</span>
          <span className={styles.dividerLine} />
        </div>

        <form onSubmit={handleSubmit} className={styles.form} style={{ gap: '18px', marginTop: 0 }}>
          {[
            { name: 'name',            label: 'Full name',      icon: FiUser, type: 'text',     placeholder: 'John Smith' },
            { name: 'email',           label: 'Email address',  icon: FiMail, type: 'email',    placeholder: 'you@company.com' },
            { name: 'password',        label: 'Password',       icon: FiLock, type: 'password', placeholder: '••••••••' },
            { name: 'confirmPassword', label: 'Confirm password',icon: FiLock, type: 'password', placeholder: '••••••••' },
          ].map(({ name, label, icon: Icon, type, placeholder }) => {
            const isPassword = name === 'password';
            const isConfirmPassword = name === 'confirmPassword';
            const isPasswordField = isPassword || isConfirmPassword;
            let currentType = type;
            if (isPassword) currentType = showPass ? 'text' : 'password';
            if (isConfirmPassword) currentType = showConfirmPass ? 'text' : 'password';

            return (
              <div className="form-group" key={name}>
                <label className="form-label" htmlFor={`reg-${name}`}>{label}</label>
                <div className={styles.inputWrap}>
                  <Icon className={styles.inputIcon} size={16} />
                  <input
                    id={`reg-${name}`}
                    className={`form-input ${styles.inputPadded}`}
                    type={currentType}
                    name={name}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleChange}
                    required
                    autoComplete={name}
                  />
                  {isPasswordField && (
                    <button 
                      type="button" 
                      className={styles.eyeBtn} 
                      onClick={() => isPassword ? setShowPass(!showPass) : setShowConfirmPass(!showConfirmPass)}
                    >
                      {(isPassword ? showPass : showConfirmPass) ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {error && (
            <p className="form-error">
               <FiAlertCircle size={14} /> {error}
            </p>
          )}
          <button
            id="register-submit-btn"
            className={`btn btn-primary ${styles.submitBtn}`}
            type="submit"
            disabled={loading || googleLoading}
          >
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create Free Account'}
          </button>
        </form>
        <p className={styles.switchLink}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
