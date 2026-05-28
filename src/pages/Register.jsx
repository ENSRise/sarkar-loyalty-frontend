import { useState } from 'react';
import axios from 'axios';

const TIER_LABELS = { silver: '🥈 Silver', gold: '🥇 Gold', platinum: '💎 Platinum' };

export default function Register() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthdayDate: '',
    anniversaryDate: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState('');

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
      const { data } = await axios.post('/api/customers/register', form);
      setResult(data.data);
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

  // ── Success screen ──────────────────────────────────────────
  if (status === 'success' && result) {
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
                <div
                  style={{
                    background: 'var(--primary-light)',
                    borderRadius: '10px',
                    padding: '16px',
                    textAlign: 'left',
                    marginTop: '4px',
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: 'var(--primary)' }}>
                    Your Benefits
                  </p>
                  {result.tierBenefits.reward && (
                    <p style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '6px' }}>
                      🎁 <strong>{result.tierBenefits.reward}</strong> reward on every purchase
                    </p>
                  )}
                  {result.tierBenefits.additionReward?.map((b, i) => (
                    <p key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      ✓ {b}
                    </p>
                  ))}
                </div>
              )}

              <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Your tier and benefits are saved to your Shopify account.
                Keep shopping to unlock higher tiers!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────
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

            {/* Name */}
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
            <div className="form-group" style={{ marginBottom: 0 }}>
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
