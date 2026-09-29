import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X, Check, MapPin, Phone, MessageSquare } from 'lucide-react';

export default function EmergencyOverlay({ reason, onCancel }) {
  const [countdown, setCountdown] = useState(10);
  const [status, setStatus] = useState('counting'); // 'counting' | 'dispatching' | 'delivered' | 'error'
  const [dispatchResult, setDispatchResult] = useState(null);
  const hasDispatched = useRef(false);

  useEffect(() => {
    if (status !== 'counting') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      if (!hasDispatched.current) {
        handleDispatch();
      }
    }
  }, [countdown, status]);

  const handleDispatch = async () => {
    if (hasDispatched.current) return;
    hasDispatched.current = true;
    setStatus('dispatching');

    let location = null;
    try {
      location = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          err => reject(err),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      });
    } catch (e) {
      console.warn('Location unavailable', e);
    }

    const contactsStr = localStorage.getItem('sos_contacts');
    let contacts = [];
    if (contactsStr) {
      try {
        contacts = JSON.parse(contactsStr);
      } catch (e) {}
    }

    if (contacts.length === 0) {
      // In a real app we might still notify 112/911, but rules say NO automatic 112/911.
      setDispatchResult({
        error: 'No emergency contacts configured. Please add contacts in Profile > Contacts.'
      });
      setStatus('error');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts,
          reason,
          userName: 'SafeMesh User', // We don't have global user state easily accessible here
          location
        })
      });

      const data = await response.json();
      if (response.ok) {
        setDispatchResult(data);
        setStatus('delivered');
      } else {
        setDispatchResult({ error: data.error || 'Server error' });
        setStatus('error');
      }
    } catch (err) {
      setDispatchResult({ error: 'Failed to connect to backend server' });
      setStatus('error');
    }
  };

  return (
    <div className="emergency-overlay">
      <div className="emergency-content">
        {status === 'counting' && (
          <>
            <div className="warning-pulse">
              <ShieldAlert size={80} className="text-red" />
            </div>
            <h2 className="emergency-title text-red">EMERGENCY DETECTED</h2>
            {reason && <p className="emergency-reason" style={{color: '#ff4d4d', fontWeight: 'bold'}}>{reason}</p>}
            <p className="emergency-subtitle">Dispatching in...</p>
            <div className="countdown-number">{countdown}</div>
            
            <div className="emergency-actions">
              <button className="btn btn-outline" onClick={onCancel}>
                <X size={20} /> Cancel SOS
              </button>
              <button className="btn btn-danger" onClick={handleDispatch}>
                Send Now
              </button>
            </div>
          </>
        )}

        {status === 'dispatching' && (
          <>
            <div className="broadcast-animation">
              <div className="ring r1"></div>
              <div className="ring r2"></div>
              <div className="ring r3"></div>
              <ShieldAlert size={64} className="text-blue" />
            </div>
            <h2 className="emergency-title text-blue mt-4">Dispatching SOS...</h2>
            <p className="emergency-subtitle">Contacting servers and sending alerts...</p>
          </>
        )}

        {status === 'delivered' && dispatchResult && (
          <>
            <div className="success-circle">
              <Check size={48} className="text-green" />
            </div>
            <h2 className="emergency-title text-green mt-4">SOS Dispatched</h2>
            {dispatchResult.simulated && (
              <p className="text-yellow" style={{fontSize: '0.9em', marginBottom: '10px'}}>[Simulation Mode - No actual calls made]</p>
            )}
            
            <div className="dispatch-stats" style={{textAlign: 'left', background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '10px', marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <MessageSquare size={20} />
                <span>SMS: {dispatchResult.smsSent} Sent</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Phone size={20} />
                <span>Calls: {dispatchResult.callsSent} Initiated</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <MapPin size={20} />
                <span>Location: {dispatchResult.location ? 'Attached' : 'Unavailable'}</span>
              </div>
            </div>

            <button className="btn btn-primary mt-6" onClick={onCancel}>
              Return to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="warning-pulse">
              <ShieldAlert size={80} className="text-red" />
            </div>
            <h2 className="emergency-title text-red mt-4">Dispatch Failed</h2>
            <p className="emergency-subtitle">{dispatchResult?.error}</p>
            <button className="btn btn-primary mt-6" onClick={onCancel}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
