import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ReferralJoin() {
  const [searchParams] = useSearchParams();
  const whomReferNumber = searchParams.get('ref') || '';

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    anniversaryDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await axios.post(`${API}/api/referral/submit`, {
        ...form,
        whomReferNumber,
      });
      setResult({ success: true, message: data.message || 'Successfully joined!', couponCode: data.data?.couponCode });
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!whomReferNumber) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16, textAlign: 'center' }}>🔗</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8, textAlign: 'center' }}>Invalid Referral Link</h2>
          <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>
            This referral link is missing required information. Please ask your friend for a valid referral link.
          </p>
        </div>
      </div>
    );
  }

  if (result?.success) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 52, marginBottom: 16, textAlign: 'center' }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#16a34a', marginBottom: 8, textAlign: 'center' }}>
            Welcome to Loyalty Sarkar!
          </h2>
          <p style={{ color: '#475569', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
            {result.message}
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>
              You've been enrolled as a Silver member!
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              Your profile has been set up and your referrer has received their reward.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🏆</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Join Loyalty Sarkar</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            You've been invited! Fill in your details below to join.
          </p>
        </div>

        {result && !result.success && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="First name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Last name" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Phone Number *</label>
            <input name="phoneNumber" type="tel" value={form.phoneNumber} onChange={handleChange} required placeholder="10-digit mobile number" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Anniversary Date</label>
              <input name="anniversaryDate" type="date" value={form.anniversaryDate} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 8, padding: '13px', borderRadius: 10, background: loading ? '#a7f3d0' : '#008060', color: 'white', border: 'none', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', fontFamily: 'inherit' }}
          >
            {loading ? 'Joining...' : 'Join Loyalty Program'}
          </button>
        </form>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #004c3f 0%, #008060 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const cardStyle = {
  background: 'white',
  borderRadius: 16,
  padding: '36px 32px',
  width: '100%',
  maxWidth: 480,
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 5,
};

const inputStyle = {
  width: '100%',
  padding: '10px 13px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};
