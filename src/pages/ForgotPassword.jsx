import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BRAND = {
  iconBg: 'linear-gradient(135deg,#008060,#006e52)',
  gradient: 'linear-gradient(160deg, #004c3f 0%, #008060 55%, #00a878 100%)',
  purple: '#008060',
};

function OtpInput({ value, onChange }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const digits = (value + '      ').slice(0, 6).split('');

  const handle = (i, e) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    const joined = next.join('').trim();
    onChange(joined);
    if (v && i < 5) refs[i + 1].current?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i].trim() && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    if (pasted.length > 0) refs[Math.min(pasted.length - 1, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {refs.map((ref, i) => (
        <input
          key={i}
          ref={ref}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onChange={e => handle(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
          style={{
            width: 50, height: 56, textAlign: 'center',
            fontSize: 22, fontWeight: 700, color: '#0f172a',
            border: '2px solid #e5e7eb', borderRadius: 12,
            outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = BRAND.purple; e.target.style.boxShadow = '0 0 0 3px rgba(0,128,96,0.15)'; }}
          onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
        />
      ))}
    </div>
  );
}

function PwInput({ value, onChange, placeholder, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%', padding: '13px 44px 13px 14px',
          border: '1.5px solid #e5e7eb', borderRadius: 10,
          fontSize: 14, fontFamily: 'inherit', color: '#0f172a',
          outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = BRAND.purple; e.target.style.boxShadow = '0 0 0 3px rgba(0,128,96,0.15)'; }}
        onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
      />
      <button type="button" onClick={() => setShow(v => !v)}
        style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: 0 }}>
        {show ? '🙈' : '👁'}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', autoFocus, prefix }) {
  return (
    <div style={{ position: 'relative' }}>
      {prefix && (
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af', fontWeight: 500, pointerEvents: 'none' }}>
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%', padding: `13px 14px 13px ${prefix ? '46px' : '14px'}`,
          border: '1.5px solid #e5e7eb', borderRadius: 10,
          fontSize: 14, fontFamily: 'inherit', color: '#0f172a',
          outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = BRAND.purple; e.target.style.boxShadow = '0 0 0 3px rgba(0,128,96,0.15)'; }}
        onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

function Alert({ type, children }) {
  const styles = {
    error:   { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: '⚠️' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', icon: '✅' },
    info:    { bg: '#effaf6', border: '#a7f3d0', color: '#008060', icon: 'ℹ️' },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 22, display: 'flex', alignItems: 'flex-start', gap: 10, color: s.color, fontSize: 13, lineHeight: 1.5 }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{s.icon}</span>
      <span>{children}</span>
    </div>
  );
}

function SubmitBtn({ loading, label, loadingLabel }) {
  return (
    <button type="submit" disabled={loading}
      style={{
        width: '100%', padding: '14px',
        background: loading ? '#a7f3d0' : `linear-gradient(135deg, ${BRAND.purple}, #006e52)`,
        color: 'white', border: 'none', borderRadius: 10,
        fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 4px 12px rgba(0,128,96,0.35)', marginTop: 4,
      }}>
      {loading ? (
        <>
          <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
          {loadingLabel}
        </>
      ) : label}
    </button>
  );
}

/* ─── Step 1: Enter phone ──────────────────────────────────────────────── */
function StepPhone({ onNext }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 10) { setError('Enter a valid 10-digit phone number.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post('/api/auth/forgot-password', { phone: phone.trim() });
      if (data.data?.devOtp) setDevOtp(data.data.devOtp);
      onNext(phone.trim());
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not send OTP. Check the phone number.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error   && <Alert type="error">{error}</Alert>}
      {devOtp  && (
        <Alert type="info">
          <strong>Dev mode OTP:</strong> <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, letterSpacing: 4 }}>{devOtp}</span>
          <br /><span style={{ fontSize: 12, opacity: 0.8 }}>In production this will be sent via SMS.</span>
        </Alert>
      )}
      <Field label="Registered Phone Number">
        <TextInput value={phone} onChange={setPhone} placeholder="9999999999" prefix="+91" autoFocus />
      </Field>
      <SubmitBtn loading={loading} label="Send OTP" loadingLabel="Sending…" />
    </form>
  );
}

/* ─── Step 2: Verify OTP ───────────────────────────────────────────────── */
function StepOtp({ phone, onNext, onBack }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [devOtp, setDevOtp] = useState('');

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const resend = async () => {
    setResending(true); setError(''); setDevOtp('');
    try {
      const { data } = await axios.post('/api/auth/forgot-password', { phone });
      if (data.data?.devOtp) setDevOtp(data.data.devOtp);
      setCountdown(60); setOtp('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend OTP.');
    }
    setResending(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    setLoading(true); setError('');
    try {
      await axios.post('/api/auth/verify-otp', { phone, otp });
      onNext(otp);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid or expired OTP.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error  && <Alert type="error">{error}</Alert>}
      {devOtp && (
        <Alert type="info">
          <strong>Dev mode OTP:</strong> <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, letterSpacing: 4 }}>{devOtp}</span>
        </Alert>
      )}
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <p style={{ fontSize: 13, color: '#697386', marginBottom: 20 }}>
          We sent a 6-digit OTP to <strong style={{ color: '#0f172a' }}>+91 {phone}</strong>
        </p>
        <OtpInput value={otp} onChange={setOtp} />
        <div style={{ marginTop: 16, fontSize: 13, color: '#697386' }}>
          {countdown > 0 ? (
            <span>Resend OTP in <strong style={{ color: '#0f172a' }}>{countdown}s</strong></span>
          ) : (
            <button type="button" onClick={resend} disabled={resending}
              style={{ background: 'none', border: 'none', color: BRAND.purple, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              {resending ? 'Resending…' : 'Resend OTP'}
            </button>
          )}
        </div>
      </div>
      <SubmitBtn loading={loading} label="Verify OTP" loadingLabel="Verifying…" />
      <button type="button" onClick={onBack}
        style={{ background: 'none', border: 'none', color: '#697386', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
        ← Back
      </button>
    </form>
  );
}

/* ─── Step 3: Reset password ───────────────────────────────────────────── */
function StepReset({ phone, otp, onDone }) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (pw !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await axios.post('/api/auth/reset-password', { phone, otp, newPassword: pw });
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not reset password.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && <Alert type="error">{error}</Alert>}
      <Field label="New Password">
        <PwInput value={pw} onChange={setPw} placeholder="Minimum 8 characters" autoFocus />
      </Field>
      <Field label="Confirm Password">
        <PwInput value={confirm} onChange={setConfirm} placeholder="Re-enter new password" />
      </Field>
      <SubmitBtn loading={loading} label="Reset Password" loadingLabel="Resetting…" />
    </form>
  );
}

/* ─── Success screen ───────────────────────────────────────────────────── */
function StepSuccess() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate('/login', { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Password Reset!</h3>
      <p style={{ fontSize: 14, color: '#697386', lineHeight: 1.6 }}>
        Your password has been updated successfully.<br />
        Redirecting to login in 3 seconds…
      </p>
      <Link to="/login"
        style={{ display: 'inline-block', marginTop: 20, fontSize: 13, color: BRAND.purple, fontWeight: 600, textDecoration: 'none' }}>
        Go to Login →
      </Link>
    </div>
  );
}

/* ─── Step indicator ───────────────────────────────────────────────────── */
function Steps({ current }) {
  const steps = ['Phone', 'OTP', 'Password'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 0 }}>
      {steps.map((s, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? 14 : 12, fontWeight: 700,
                background: done ? '#16a34a' : active ? BRAND.purple : '#e5e7eb',
                color: (done || active) ? 'white' : '#9ca3af',
                transition: 'all 0.2s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? BRAND.purple : done ? '#16a34a' : '#9ca3af', whiteSpace: 'nowrap' }}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#16a34a' : '#e5e7eb', margin: '0 6px', marginBottom: 18, transition: 'background 0.2s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────── */
export default function ForgotPassword() {
  const [step,  setStep]  = useState(0);   // 0=phone, 1=otp, 2=reset, 3=success
  const [phone, setPhone] = useState('');
  const [otp,   setOtp]   = useState('');

  const titles = [
    { h: 'Forgot Password?', p: 'Enter your registered phone number to receive an OTP.' },
    { h: 'Enter OTP',        p: 'Check your phone for the 6-digit verification code.' },
    { h: 'New Password',     p: 'Choose a strong password for your account.' },
    { h: 'All Done!',        p: '' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
        padding: '60px 64px', background: BRAND.gradient, minHeight: '100vh',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 56 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: BRAND.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 8px 24px rgba(0,128,96,0.4)' }}>
            🏆
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>Loyalty Sarkar</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600, marginTop: 2 }}>Admin Panel</div>
          </div>
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.5px', marginBottom: 16, maxWidth: 380 }}>
          Secure account<br />recovery
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 340, marginBottom: 48 }}>
          Reset your password in three simple steps using your registered phone number.
        </p>

        {[
          { icon: '📱', text: 'Verify with your phone number' },
          { icon: '🔢', text: '6-digit OTP for verification' },
          { icon: '🔐', text: 'Set a new secure password' },
        ].map(f => (
          <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{f.icon}</div>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div style={{ width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 56px', background: 'white' }}>
        {step < 3 && <Steps current={step} />}

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 6 }}>
            {titles[step].h}
          </h2>
          {titles[step].p && <p style={{ fontSize: 14, color: '#697386' }}>{titles[step].p}</p>}
        </div>

        {step === 0 && <StepPhone onNext={p => { setPhone(p); setStep(1); }} />}
        {step === 1 && <StepOtp   phone={phone} onNext={o => { setOtp(o); setStep(2); }} onBack={() => setStep(0)} />}
        {step === 2 && <StepReset phone={phone} otp={otp} onDone={() => setStep(3)} />}
        {step === 3 && <StepSuccess />}

        {step < 3 && (
          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: 13, color: '#697386', textDecoration: 'none', fontWeight: 500 }}>
              ← Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
