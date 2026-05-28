import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function JoinLoyalty() {
  const [copied, setCopied] = useState(false);
  const registerUrl = `${window.location.origin}/register`;

  const handleCopy = () => {
    navigator.clipboard.writeText(registerUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Join Loyalty Program</h1>
        <p className="page-subtitle">
          Display this QR code in-store. Customers scan it with their phone to register instantly.
        </p>
      </div>

      <div className="qr-wrapper">

        {/* QR code card */}
        <div className="qr-card">
          <div className="qr-label">
            <h2>🏆 Loyalty Sarkar</h2>
            <p>Scan with your phone camera to join our loyalty program and unlock exclusive rewards.</p>
          </div>

          <div className="qr-frame">
            <QRCodeSVG
              value={registerUrl}
              size={220}
              level="H"
              includeMargin={false}
              fgColor="#1a1a1a"
            />
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Point your phone camera at the QR code above
          </p>
        </div>

        {/* Shareable link */}
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Or share this link
          </p>
          <div className="link-box">
            <span>{registerUrl}</span>
            <button className="btn-copy" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="qr-steps">
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            How it works
          </p>
          <div className="qr-step">
            <div className="qr-step-num">1</div>
            <div className="qr-step-text">
              <strong>Customer scans the QR code</strong> — opens a registration form on their phone instantly. No app download needed.
            </div>
          </div>
          <div className="qr-step">
            <div className="qr-step-num">2</div>
            <div className="qr-step-text">
              <strong>They fill in their details</strong> — including the mobile number they used when placing orders on your Shopify store.
            </div>
          </div>
          <div className="qr-step">
            <div className="qr-step-num">3</div>
            <div className="qr-step-text">
              <strong>They're enrolled automatically</strong> — existing Shopify customers are linked; new customers are created and enrolled as Silver members.
            </div>
          </div>
          <div className="qr-step">
            <div className="qr-step-num">4</div>
            <div className="qr-step-text">
              <strong>Tier benefits apply immediately</strong> — their loyalty tier and rewards are synced back to their Shopify customer profile.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
