import React, { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export default function EmergencyOverlay({ onCancel, onBroadcast }) {
  const [countdown, setCountdown] = useState(10);
  const [status, setStatus] = useState('counting'); // 'counting' | 'broadcasting' | 'delivered'

  useEffect(() => {
    if (status !== 'counting') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setStatus('broadcasting');
      // Simulate broadcast delay
      setTimeout(() => {
        setStatus('delivered');
        if (onBroadcast) onBroadcast();
      }, 3000);
    }
  }, [countdown, status, onBroadcast]);

  return (
    <div className="emergency-overlay">
      <div className="emergency-content">
        {status === 'counting' && (
          <>
            <div className="warning-pulse">
              <ShieldAlert size={80} className="text-red" />
            </div>
            <h2 className="emergency-title text-red">EMERGENCY DETECTED</h2>
            <p className="emergency-subtitle">Broadcasting in...</p>
            <div className="countdown-number">{countdown}</div>
            
            <div className="emergency-actions">
              <button className="btn btn-outline" onClick={onCancel}>
                <X size={20} /> Cancel SOS
              </button>
              <button className="btn btn-danger" onClick={() => setCountdown(0)}>
                Confirm Now
              </button>
            </div>
          </>
        )}

        {status === 'broadcasting' && (
          <>
            <div className="broadcast-animation">
              <div className="ring r1"></div>
              <div className="ring r2"></div>
              <div className="ring r3"></div>
              <ShieldAlert size={64} className="text-blue" />
            </div>
            <h2 className="emergency-title text-blue mt-4">Broadcasting...</h2>
            <p className="emergency-subtitle">Routing via BLE Mesh</p>
          </>
        )}

        {status === 'delivered' && (
          <>
            <div className="success-circle">
              <Check size={48} className="text-green" />
            </div>
            <h2 className="emergency-title text-green mt-4">SOS Delivered</h2>
            <p className="emergency-subtitle">Emergency contacts notified.</p>
            <button className="btn btn-primary mt-6" onClick={onCancel}>
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Check({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
