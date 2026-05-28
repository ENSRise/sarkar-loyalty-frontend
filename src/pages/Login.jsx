import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function UnderlineInput({ label, type = 'text', value, onChange, placeholder, autoFocus, prefix, rightEl, maxLength }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 26 }}>
      <label style={{
        display: 'block', fontSize: 10, fontWeight: 800,
        color: focused ? '#000000' : '#9ca3af',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 9,
        transition: 'color 0.2s',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600, marginRight: 6, flexShrink: 0 }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={maxLength}
          style={{
            flex: 1, border: 'none',
            borderBottom: `2px solid ${focused ? '#000000' : '#e5e7eb'}`,
            padding: '10px 32px 10px 0', fontSize: 15,
            fontFamily: 'inherit', color: '#000000',
            background: 'transparent', outline: 'none',
            transition: 'border-color 0.2s', width: '100%',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightEl && (
          <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
            {rightEl}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone.trim() || !password) {
      setError('Please enter your phone number and password.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', { phone: phone.trim(), password });
      login(data.data.token, data.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ── Left — pure black ──────────────────────────────────── */}
      <div style={{
        flex: '0 0 45%',
        background: '#000000',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 56px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Glow blob */}
        <div style={{
          position: 'absolute', top: -120, right: -100,
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,128,96,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Brand */}
        <div style={{ marginBottom: 44, position: 'relative', zIndex: 1 }}>
          <img
            src="https://www.sarkar.store/cdn/shop/files/SARKAR_BLACK_Cropped.png?v=1769150438&width=500"
            alt="Sarkar"
            style={{
              height: 64, width: 'auto', display: 'block',
              filter: 'brightness(0) invert(1)',
              marginBottom: 18,
            }}
          />
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 5,
            color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 14,
          }}>
            LOYALTY PROGRAM
          </div>
          <div style={{
            width: 52, height: 3,
            background: 'linear-gradient(90deg, #008060, #00a878)',
            borderRadius: 2,
          }} />
        </div>

        <p style={{
          fontSize: 14, color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.9, maxWidth: 300, marginBottom: 52,
          position: 'relative', zIndex: 1,
        }}>
          Manage your loyalty program, track customer tiers, and analyse performance — all in one place.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13, position: 'relative', zIndex: 1 }}>
          {[
            { icon: '📊', text: 'Real-time dashboard & analytics' },
            { icon: '👥', text: 'Customer tier management' },
            { icon: '🧾', text: 'Transaction tracking & exports' },
            { icon: '🎁', text: 'Referral program management' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>
                {f.icon}
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom mark */}
        <div style={{
          position: 'absolute', bottom: 28, left: 56,
          fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: 1,
        }}>
          ADMIN ACCESS ONLY
        </div>
      </div>

      {/* ── Right — pure white ─────────────────────────────────── */}
      <div style={{
        flex: 1, background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        borderLeft: '1px solid #f0f0f0',
      }}>
        <div style={{ width: '100%', maxWidth: 380, padding: '0 48px' }}>

          {/* Heading */}
          <div style={{ marginBottom: 38 }}>
            <div style={{ marginBottom: 24 }}>
              <img
                src="https://www.sarkar.store/cdn/shop/files/SARKAR_BLACK_Cropped.png?v=1769150438&width=500"
                alt="Sarkar"
                style={{ height: 32, width: 'auto', display: 'block', filter: 'brightness(0)' }}
              />
            </div>

            <h2 style={{
              fontSize: 30, fontWeight: 800, color: '#000000',
              letterSpacing: '-0.8px', marginBottom: 6, lineHeight: 1.1,
            }}>
              Sign In
            </h2>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>
              Enter your credentials to access the panel
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '11px 14px', marginBottom: 22,
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#dc2626', fontSize: 13,
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <UnderlineInput
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="9999999999"
              prefix="+91"
              maxLength={10}
              autoFocus
            />

            <UnderlineInput
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              rightEl={
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: 0, display: 'flex' }}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              }
            />

            <div style={{ textAlign: 'right', marginTop: -14, marginBottom: 30 }}>
              <Link to="/forgot-password" style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#d1d5db' : '#000000',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', letterSpacing: 0.5,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1a1a1a'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#000000'; }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />
                  Signing in…
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: '#d1d5db', letterSpacing: 0.3 }}>
            Loyalty Sarkar © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
