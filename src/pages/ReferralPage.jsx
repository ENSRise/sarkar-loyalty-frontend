import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function ReferralPage() {
  const [phone, setPhone] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    const link = `${window.location.origin}/referral-join?ref=${encodeURIComponent(phone.trim())}`;
    setReferralLink(link);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Referral Link Generator</h1>
        <p className="page-subtitle">
          Enter a customer's phone number to generate their personal referral link and QR code.
        </p>
      </div>

      <div style={{ maxWidth: 560 }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <input
            type="tel"
            placeholder="Customer phone number (e.g. 9876543210)"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '10px 22px', whiteSpace: 'nowrap' }}
          >
            Generate
          </button>
        </form>

        {referralLink && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Referral Link
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  readOnly
                  value={referralLink}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, background: 'white', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
                />
                <button
                  onClick={handleCopy}
                  style={{ padding: '9px 18px', borderRadius: 8, background: copied ? '#16a34a' : 'var(--text-primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap', transition: 'background 0.2s', fontFamily: 'inherit' }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                QR Code
              </div>
              <div style={{ background: 'white', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
                <QRCodeSVG value={referralLink} size={180} level="H" fgColor="#1a1a1a" />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Share this QR code or link — friends who scan it will be taken to your referral sign-up page.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
