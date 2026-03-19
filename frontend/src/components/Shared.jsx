import React, { useEffect } from 'react';

export const Toast = ({ message, type }) => (
  <div style={{
    position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999,
    padding: '16px 24px', borderRadius: '12px', color: 'white', fontWeight: '600',
    background: type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)', animation: 'slideIn 0.3s ease-out'
  }}>
    {message}
  </div>
);

export const QrScanner = ({ onScan, onClose }) => {
  const [error, setError] = React.useState(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = React.useState(false);

  const startScanner = async () => {
    if (!window.Html5Qrcode) return;
    setError(null);
    setShowPermissionPrompt(false);
    const html5QrCode = new window.Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    try {
      await html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
          html5QrCode.stop().then(() => onScan(decodedText)).catch(() => {});
        }
      );
    } catch (err) {
      console.error("Scanner error:", err);
      if (err.name === 'NotAllowedError' || err.toString().includes('Permission denied')) {
        setShowPermissionPrompt(true);
      } else {
        setError("Unable to access camera. Please ensure you have a camera connected.");
      }
    }

    return html5QrCode;
  };

  useEffect(() => {
    let scanner = null;
    startScanner().then(s => { scanner = s; });

    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(15px)'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', position: 'relative', border: '1px solid rgba(255,255,255,0.2)' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}>✕</button>
        
        <h2 className="gradient-text" style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>Scan QR Code</h2>
        
        <div id="reader" style={{ width: '100%', borderRadius: '20px', overflow: 'hidden', minHeight: '320px', background: '#000', boxShadow: 'inset 0 0 50px rgba(0,0,0,1)' }}></div>
        
        {showPermissionPrompt && (
          <div className="animate-fade-in" style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.9)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', zIndex: 5 }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📸</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>Camera Access Required</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>We need your camera to scan QR codes. Please click below and allow access in the browser popup.</p>
            <button className="primary-btn pulse" style={{ background: 'var(--success)', padding: '16px 32px', fontSize: '1.1rem' }} onClick={startScanner}>
              Allow Camera Access
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
            <button className="primary-btn" onClick={startScanner}>🔄 Retry Scanner</button>
          </div>
        )}

        {!showPermissionPrompt && !error && (
          <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Align QR code within the frame</p>
        )}
      </div>
    </div>
  );
};
