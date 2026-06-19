import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TIER_LABELS = { silver: '🥈 Silver', gold: '🥇 Gold', platinum: '💎 Platinum' };

export default function Register() {
  const [searchParams] = useSearchParams();

  const [referralCode, setReferralCode] = useState('');
  const [referralFromUrl, setReferralFromUrl] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthdayDate: '',
    anniversaryDate: '',
    address: '',
  });
  const [errors, setErrors]   = useState({});
  const [status, setStatus]   = useState('idle'); // idle | loading | success | error
  const [result, setResult]   = useState(null);
  const [apiError, setApiError] = useState('');

  // Silent interest capture — fires once when firstName+lastName+phone+(birthday or anniversary) are all filled
  const capturedRef   = useRef(false);
  const captureTimer  = useRef(null);

  useEffect(() => {
    if (status === 'success' || status === 'loading') return;
    if (capturedRef.current) return;

    const digits        = form.phone.replace(/\D/g, '');
    const hasRequired   = form.firstName.trim() && form.lastName.trim() && digits.length === 10;
    const hasDate       = form.birthdayDate || form.anniversaryDate;

    if (!hasRequired || !hasDate) return;

    clearTimeout(captureTimer.current);
    captureTimer.current = setTimeout(async () => {
      if (capturedRef.current) return;
      try {
        await axios.post(`${API}/api/interested-customers/capture`, {
          firstName:       form.firstName,
          lastName:        form.lastName,
          email:           form.email,
          phone:           form.phone,
          birthdayDate:    form.birthdayDate,
          anniversaryDate: form.anniversaryDate,
        });
        capturedRef.current = true;
      } catch (_) {
        // Silent — never affect user experience
      }
    }, 1500);

    return () => clearTimeout(captureTimer.current);
  }, [form, status]);

  // Auto-fill referral code from ?ref= URL param
  useEffect(() => {
    const ref = searchParams.get('ref') || '';
    if (ref) {
      setReferralCode('ref' + ref);
      setReferralFromUrl(true);
    }
  }, []);

  const set = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim())  errs.lastName  = 'Last name is required';
    if (!form.phone.trim())     errs.phone     = 'Mobile number is required';
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(form.phone.trim()))
      errs.phone = 'Enter a valid mobile number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus('loading');
    setApiError('');

    try {
      // Strip the "ref" prefix to get the referrer's phone number
      const whomReferNumber = referralCode
        ? referralCode.replace(/^ref/i, '').trim()
        : '';

      if (whomReferNumber) {
        // ── Referral flow — use existing referral API ──────────────
        const { data } = await axios.post(`${API}/api/referral/submit`, {
          firstName:       form.firstName,
          lastName:        form.lastName,
          email:           form.email,
          phoneNumber:     form.phone,
          dateOfBirth:     form.birthdayDate,
          anniversaryDate: form.anniversaryDate,
          whomReferNumber,
        });
        setResult({ isReferral: true, couponCode: data.data?.couponCode, tierBenefits: data.data?.tierBenefits, firstName: form.firstName });
      } else {
        // ── Normal registration flow ───────────────────────────────
        const { data } = await axios.post('/api/customers/register', {
          ...form,
        });
        setResult({ isReferral: false, ...data.data });
      }

      setStatus('success');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Something went wrong. Please try again.';
      setApiError(msg);
      setStatus('error');
    }
  };

  // ── Success screen ──────────────────────────────────────────────────
  if (status === 'success' && result) {
    if (result.isReferral) {
      return (
        <div className="register-page">
          <div className="register-container">
            <div className="register-header">
              <div className="register-logo">
                <div className="logo-icon">🏆</div>
                <div className="logo-name">Loyalty Sarkar</div>
              </div>
            </div>
            <div className="register-card">
              <div className="success-screen">
                <div className="success-icon">🎉</div>
                <h2>Welcome to Loyalty Sarkar!</h2>
                <p>
                  Hi <strong>{result.firstName}</strong>! You've been successfully enrolled
                  via referral and your friend has received their reward.
                </p>
                <div className="tier-pill tier-pill-silver">
                  {TIER_LABELS.silver} Member
                </div>
                {result.tierBenefits && (
                  <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: 16, textAlign: 'left', marginTop: 4 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--primary)' }}>Your Benefits</p>
                    {result.tierBenefits.reward && (
                      <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
                        🎁 <strong>{result.tierBenefits.reward}</strong> reward on every purchase
                      </p>
                    )}
                    {result.tierBenefits.additionReward?.map((b, i) => (
                      <p key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>✓ {b}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const tier = result.currentTier || 'silver';
    return (
      <div className="register-page">
        <div className="register-container">
          <div className="register-header">
            <div className="register-logo">
              <div className="logo-icon">🏆</div>
              <div className="logo-name">Loyalty Sarkar</div>
            </div>
          </div>
          <div className="register-card">
            <div className="success-screen">
              <div className="success-icon">🎉</div>
              <h2>You're in!</h2>
              <p>
                Welcome, <strong>{result.firstName}</strong>! You've been successfully
                enrolled in our loyalty program.
              </p>
              <div className={`tier-pill tier-pill-${tier}`}>
                {TIER_LABELS[tier]} Member
              </div>
              {result.tierBenefits && (
                <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: 16, textAlign: 'left', marginTop: 4 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--primary)' }}>Your Benefits</p>
                  {result.tierBenefits.reward && (
                    <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
                      🎁 <strong>{result.tierBenefits.reward}</strong> reward on every purchase
                    </p>
                  )}
                  {result.tierBenefits.additionReward?.map((b, i) => (
                    <p key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>✓ {b}</p>
                  ))}
                </div>
              )}
              <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                Your tier and benefits are saved to your Shopify account. Keep shopping to unlock higher tiers!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────
  return (
    <div className="register-page">
      <div className="register-container">

        <div className="register-header">
          <div className="register-logo">
            <div className="logo-icon">🏆</div>
            <div className="logo-name">Loyalty Sarkar</div>
          </div>
          <h1>Join Our Loyalty Program</h1>
          <p>Fill in your details below to enroll and start earning rewards.</p>
        </div>

        <div className="register-card">

          {status === 'error' && (
            <div className="alert alert-error">
              <span className="alert-icon">❌</span>
              <div>{apiError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Personal Details */}
            <div className="form-section-title">Personal Details</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  className={`form-input${errors.firstName ? ' error-input' : ''}`}
                  type="text"
                  placeholder="Rahul"
                  value={form.firstName}
                  onChange={set('firstName')}
                  autoComplete="given-name"
                />
                {errors.firstName && <span className="field-error">⚠ {errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  className={`form-input${errors.lastName ? ' error-input' : ''}`}
                  type="text"
                  placeholder="Sharma"
                  value={form.lastName}
                  onChange={set('lastName')}
                  autoComplete="family-name"
                />
                {errors.lastName && <span className="field-error">⚠ {errors.lastName}</span>}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="optional">(optional)</span>
              </label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                inputMode="email"
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                className={`form-input${errors.phone ? ' error-input' : ''}`}
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={set('phone')}
                autoComplete="tel"
                inputMode="tel"
              />
              {errors.phone && <span className="field-error">⚠ {errors.phone}</span>}
              <div className="phone-warning">
                <span className="warn-icon">⚠️</span>
                <p>
                  <strong>Important:</strong> Please enter the same mobile number you
                  used when placing your order on our store. This is how we link
                  your purchase history to your loyalty account.
                </p>
              </div>
            </div>

            <div className="form-divider" />
            <div className="form-section-title">Important Dates</div>

            {/* Birthday + Anniversary */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Birthday</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.birthdayDate}
                  onChange={set('birthdayDate')}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Anniversary <span className="optional">(optional)</span>
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={form.anniversaryDate}
                  onChange={set('anniversaryDate')}
                />
              </div>
            </div>

            <div className="form-divider" />
            <div className="form-section-title">Address</div>

            {/* Address */}
            <div className="form-group">
              <label className="form-label">
                Address <span className="optional">(optional)</span>
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="House No, Street, City, State, PIN"
                value={form.address}
                onChange={set('address')}
                autoComplete="street-address"
              />
            </div>

            <div className="form-divider" />
            <div className="form-section-title">Referral</div>

            {/* Referral Code */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Referral Code <span className="optional">(optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type="text"
                  inputMode="text"
                  placeholder="e.g. ref8822334455"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value)}
                  readOnly={referralFromUrl}
                  style={referralFromUrl ? {
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    border: '1.5px solid #008060',
                    paddingRight: 36,
                  } : {}}
                />
                {referralFromUrl && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>
                    ✅
                  </span>
                )}
              </div>
              {referralFromUrl ? (
                <p style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4 }}>
                  Referral code applied automatically.
                </p>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  If a friend referred you, enter their referral code here.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <span className="spinner" style={{ borderTopColor: 'white' }} />
                  &nbsp; Registering…
                </>
              ) : (
                '🏆 Join Now'
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
