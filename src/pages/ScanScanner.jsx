// LOCAL ONLY — remove this page before deploying to server
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCANNER_ID = 'qr-scanner-viewport';

export default function ScanScanner() {
  const scannerRef   = useRef(null);
  const [status, setStatus]     = useState('idle');   // idle | starting | scanning | detected | error
  const [result, setResult]     = useState('');
  const [cameras, setCameras]   = useState([]);
  const [camId, setCamId]       = useState(null);
  const [errMsg, setErrMsg]     = useState('');

  // Load available cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          setCamId(devices[0].id);
        } else {
          setErrMsg('No camera found on this device.');
          setStatus('error');
        }
      })
      .catch(() => {
        setErrMsg('Could not access cameras. Make sure you have allowed camera permission in your browser.');
        setStatus('error');
      });
  }, []);

  const startScanner = async (selectedCamId) => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
    }

    setStatus('starting');
    setResult('');

    const qr = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = qr;

    try {
      await qr.start(
        selectedCamId,
        { fps: 12, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
        (decodedText) => {
          setResult(decodedText);
          setStatus('detected');
          // Stop scanning after first successful read
          qr.stop().catch(() => {});
        },
        () => {} // ignore per-frame errors (normal while scanning)
      );
      setStatus('scanning');
    } catch (err) {
      setErrMsg(err?.message || 'Failed to start camera.');
      setStatus('error');
    }
  };

  const handleReset = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setResult('');
    setStatus('idle');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const isRegisterUrl = result && result.includes('/register');
  const isHttpUrl     = result && /^https?:\/\//i.test(result);

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Scan Scanner</h1>
          <p className="page-subtitle">Use your laptop camera to scan a QR code.</p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#fff3cd', color: '#856404', border: '1px solid #ffc107',
          borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600,
        }}>
          🚧 Local Only
        </span>
      </div>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>

        {/* Camera selector + start button */}
        {status === 'idle' && (
          <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cameras.length > 1 && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Camera</label>
                <select
                  className="form-input"
                  value={camId || ''}
                  onChange={e => setCamId(e.target.value)}
                >
                  {cameras.map(c => (
                    <option key={c.id} value={c.id}>{c.label || c.id}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}
              disabled={!camId}
              onClick={() => startScanner(camId)}
            >
              📷 Start Camera Scanner
            </button>
          </div>
        )}

        {/* Scanner viewport — always in DOM when scanning so html5-qrcode can attach to it */}
        <div
          className="card"
          style={{ display: status === 'detected' || status === 'idle' || status === 'error' ? 'none' : 'block', overflow: 'hidden', borderRadius: '12px' }}
        >
          <div style={{ position: 'relative' }}>
            {/* html5-qrcode renders the video element inside this div */}
            <div id={SCANNER_ID} style={{ width: '100%' }} />

            {/* Scanning overlay label */}
            {status === 'scanning' && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.55)', padding: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <PulsingDot />
                <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>
                  Scanning for QR code…
                </span>
              </div>
            )}

            {status === 'starting' && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontSize: '14px' }}>Starting camera…</span>
              </div>
            )}
          </div>
        </div>

        {/* Stop / change camera while scanning */}
        {status === 'scanning' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn" style={{ background: '#eef0fb', color: 'var(--primary)', fontWeight: 600 }} onClick={handleReset}>
              ✕ Stop Scanner
            </button>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            <div>
              <strong>Camera Error</strong><br />
              {errMsg}
              <br />
              <button
                style={{ marginTop: '8px', background: 'none', border: 'none', color: 'var(--error-text)', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '12px' }}
                onClick={() => { setStatus('idle'); setErrMsg(''); }}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Detected result */}
        {status === 'detected' && result && (
          <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>QR Code Detected!</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Scan successful</div>
              </div>
            </div>

            {/* Decoded value */}
            <div style={{ background: '#f8f9fb', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Decoded Value
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {result}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {isRegisterUrl && (
                <a
                  href={result}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                >
                  📋 Open Registration Form ↗
                </a>
              )}
              {isHttpUrl && !isRegisterUrl && (
                <a
                  href={result}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                >
                  Open URL ↗
                </a>
              )}
              <button
                className="btn"
                style={{ background: '#eef0fb', color: 'var(--primary)', fontWeight: 600 }}
                onClick={() => { handleReset().then(() => startScanner(camId)); }}
              >
                🔄 Scan Again
              </button>
            </div>
          </div>
        )}

        {/* Info note */}
        <div style={{
          background: 'var(--warning-bg)', border: '1px solid var(--warning-border)',
          borderRadius: '8px', padding: '12px 14px',
          fontSize: '12px', color: 'var(--warning-text)', lineHeight: 1.5,
        }}>
          <strong>ℹ️ Local testing only.</strong> This page uses your laptop's built-in camera to scan QR codes.
          Allow camera permission in your browser when prompted. This page will be removed before deployment.
        </div>

      </div>
    </div>
  );
}

function PulsingDot() {
  return (
    <span style={{
      display: 'inline-block',
      width: '8px', height: '8px',
      background: '#4ade80',
      borderRadius: '50%',
      animation: 'pulse-dot 1.2s ease-in-out infinite',
    }} />
  );
}
