import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Lock, Mail, ChevronRight } from 'lucide-react';
import LogoIcon from '../components/LogoIcon';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);
  
  const { login } = useAuth();
  const { addToast } = useSocket();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBtnLoading(true);

    try {
      await login(email, password);
      addToast('Logged in successfully!', 'success');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Incorrect credentials. Please try again.');
      addToast(err.message || 'Incorrect credentials.', 'danger');
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background Decorative Glow Orbs */}
      <div style={styles.ambientGlow1} />
      <div style={styles.ambientGlow2} />

      {/* Centered Glassmorphic Portal Card */}
      <div className="auth-card glass-panel">
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <LogoIcon size={50} />
          </div>
          <h1 style={styles.brandName}>
            <span style={styles.brandWhite}>Rent</span>
            <span style={styles.brandAccent}>Nest</span>
          </h1>
          <p style={styles.subtitle}>Enter your credentials to access your secure rental portal.</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel} htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.inputField}
                className="auth-input"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel} htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.inputField}
                className="auth-input"
              />
            </div>
          </div>

          <button type="submit" disabled={btnLoading} className="btn btn-primary" style={styles.submitBtn}>
            <span>{btnLoading ? 'Signing In...' : 'Sign In'}</span>
            <ChevronRight size={18} />
          </button>
        </form>

        <div style={styles.footer}>
          <span>Don't have an account?</span>
          <Link to="/signup" style={styles.link}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  ambientGlow1: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    top: '15%',
    left: '10%',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
    zIndex: 0,
    pointerEvents: 'none'
  },
  ambientGlow2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    bottom: '10%',
    right: '10%',
    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
    zIndex: 0,
    pointerEvents: 'none'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '32px'
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '76px',
    height: '76px',
    borderRadius: '20px',
    background: 'var(--primary-gradient)',
    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.25)',
    marginBottom: '16px',
    color: '#fff'
  },
  brandName: {
    fontSize: '1.65rem',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    marginBottom: '8px'
  },
  brandWhite: {
    color: 'var(--text-primary)'
  },
  brandAccent: {
    background: 'var(--primary-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  inputLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)'
  },
  inputField: {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
    padding: '12px 16px 12px 48px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    transition: 'var(--transition)'
  },
  submitBtn: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.98rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '10px',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
  },
  errorAlert: {
    backgroundColor: 'var(--danger-bg)',
    color: 'var(--danger)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '600',
    lineHeight: '1.4',
    marginBottom: '20px'
  },
  footer: {
    textAlign: 'center',
    marginTop: '28px',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)'
  },
  link: {
    color: 'var(--primary)',
    fontWeight: '700',
    textDecoration: 'none',
    marginLeft: '6px',
    transition: 'var(--transition)'
  }
};

export default Login;
