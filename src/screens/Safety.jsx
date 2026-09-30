import React, { useState, useEffect, useRef } from 'react';
import { Mic, ActivitySquare, PersonStanding, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

export default function Safety({ onSosTrigger }) {
  const [voiceStatus, setVoiceStatus] = useState('Listening...');
  const [voiceScore, setVoiceScore] = useState(0);
  
  const [fallStatus, setFallStatus] = useState('Active - Monitoring');
  const [fallScore, setFallScore] = useState(0);

  const [motionStatus, setMotionStatus] = useState('Still / Normal');
  const [liveMagnitude, setLiveMagnitude] = useState('9.8');
  const [needsIosPermission, setNeedsIosPermission] = useState(false);
  
  const cooldownRef = useRef(false);
  const fallStateRef = useRef({ phase: 'idle', timeout: null });
  const recognitionRef = useRef(null);

  const IMPACT_THRESHOLD = 25; // m/s^2 magnitude (approx 2.5g)
  const STILLNESS_THRESHOLD_MIN = 8;
  const STILLNESS_THRESHOLD_MAX = 11;
  const STILLNESS_DURATION = 2000; // 2 seconds of stillness after impact

  const triggerSos = (reason) => {
    if (cooldownRef.current) return;
    
    cooldownRef.current = true;
    if (onSosTrigger) onSosTrigger(reason);

    // 15 seconds cooldown
    setTimeout(() => {
      cooldownRef.current = false;
      setFallStatus('Active - Monitoring');
      setFallScore(0);
      setVoiceStatus('Listening...');
      setVoiceScore(0);
      fallStateRef.current = { phase: 'idle', timeout: null };
    }, 15000);
  };

  const handleMotion = (event) => {
    if (cooldownRef.current) return;

    let ax = 0, ay = 0, az = 0;
    if (event.accelerationIncludingGravity) {
      ax = event.accelerationIncludingGravity.x || 0;
      ay = event.accelerationIncludingGravity.y || 0;
      az = event.accelerationIncludingGravity.z || 0;
    } else if (event.acceleration) {
      ax = event.acceleration.x || 0;
      ay = event.acceleration.y || 0;
      az = event.acceleration.z || 0;
    }

    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    if (!isNaN(magnitude) && magnitude > 0) {
      setLiveMagnitude(magnitude.toFixed(1));
    }

    // Dynamic motion feedback
    const activity = Math.abs(magnitude - 9.8);
    if (activity > 3) {
      setMotionStatus('Active Movement');
    } else {
      setMotionStatus('Still / Resting');
    }

    const currentState = fallStateRef.current;

    if (currentState.phase === 'idle') {
      if (magnitude > IMPACT_THRESHOLD) {
        // High impact detected!
        fallStateRef.current.phase = 'impact';
        setFallStatus('High Impact Detected! Analyzing...');
        setFallScore(60);
        
        // Wait 1 second then check for stillness
        currentState.timeout = setTimeout(() => {
          fallStateRef.current.phase = 'stillness_check';
        }, 1000);
      }
    } else if (currentState.phase === 'stillness_check') {
      if (magnitude >= STILLNESS_THRESHOLD_MIN && magnitude <= STILLNESS_THRESHOLD_MAX) {
        // Stillness maintained
        fallStateRef.current.phase = 'confirming';
        setFallScore(85);
        currentState.timeout = setTimeout(() => {
          if (fallStateRef.current.phase === 'confirming') {
            setFallStatus('Possible Fall Detected!');
            setFallScore(100);
            triggerSos('Possible Fall Detected (High impact + stillness)');
          }
        }, STILLNESS_DURATION);
      } else {
        // Movement resumed, cancel fall
        clearTimeout(currentState.timeout);
        fallStateRef.current.phase = 'idle';
        setFallStatus('Active - Monitoring (Recovered)');
        setFallScore(10);
      }
    } else if (currentState.phase === 'confirming') {
      if (magnitude < STILLNESS_THRESHOLD_MIN || magnitude > STILLNESS_THRESHOLD_MAX) {
        clearTimeout(currentState.timeout);
        fallStateRef.current.phase = 'idle';
        setFallStatus('Active - Monitoring (Recovered)');
        setFallScore(5);
      }
    }
  };

  const setupVoiceDetection = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('Speech API not supported in this browser');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      const distressKeywords = ['help', 'emergency', 'save me', 'bachao', 'bachaao', 'madad', 'stop'];

      recognition.onstart = () => {
        setVoiceStatus('Listening (help, bachao, emergency)...');
      };

      recognition.onresult = (event) => {
        if (cooldownRef.current) return;

        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.toLowerCase();

        for (const keyword of distressKeywords) {
          if (transcript.includes(keyword)) {
            setVoiceStatus(`Detected "${keyword}"!`);
            setVoiceScore(100);
            triggerSos(`Voice Distress: heard "${keyword}"`);
            return;
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceStatus('Mic Permission Blocked');
        } else if (event.error === 'no-speech') {
          // Normal silence, keep listening
        } else {
          setVoiceStatus(`Mic: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (!cooldownRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition start failed:', err);
    }
  };

  const requestIosMotion = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          setNeedsIosPermission(false);
          window.addEventListener('devicemotion', handleMotion, true);
        } else {
          alert('Motion sensor permission is required for fall detection.');
        }
      } catch (e) {
        console.error('iOS Motion Permission error:', e);
      }
    }
  };

  useEffect(() => {
    // Check if iOS motion permission is needed
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      setNeedsIosPermission(true);
    } else {
      window.addEventListener('devicemotion', handleMotion, true);
    }

    setupVoiceDetection();

    return () => {
      window.removeEventListener('devicemotion', handleMotion, true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (fallStateRef.current.timeout) {
        clearTimeout(fallStateRef.current.timeout);
      }
    };
  }, []);

  const overallScore = Math.max(voiceScore, fallScore);
  let overallBadge = 'Normal';
  let overallColor = 'var(--color-green)';
  let OverallIcon = ShieldCheck;

  if (overallScore > 75) {
    overallBadge = 'CRITICAL';
    overallColor = 'var(--color-red)';
    OverallIcon = ShieldAlert;
  } else if (overallScore > 40) {
    overallBadge = 'ELEVATED';
    overallColor = 'var(--color-yellow)';
  }

  return (
    <div className="safety-screen screen-content">
      <header className="header mb-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="title">AI Detection Guard</h2>
            <p className="subtitle">Real-time anomaly & distress monitoring</p>
          </div>
          <span style={{ fontSize: '11px', background: 'rgba(34,197,94,0.2)', color: '#22c55e', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
            ● LIVE SENSORS
          </span>
        </div>
      </header>

      {needsIosPermission && (
        <div className="glass-panel text-center p-4 mb-4" style={{ border: '1px solid #3b82f6' }}>
          <p className="text-sm mb-3">iPhone requires permission to access the motion accelerometer:</p>
          <button className="btn btn-primary" onClick={requestIosMotion}>
            Enable iPhone Motion Sensors
          </button>
        </div>
      )}

      <div className="overall-risk glass-panel mb-6">
        <div className="risk-header">
          <h3>Overall Risk</h3>
          <span className="risk-badge" style={{ backgroundColor: overallColor }}>{overallBadge}</span>
        </div>
        <div className="risk-score">
          <span className="score" style={{ color: overallColor }}>{overallScore}%</span>
          <OverallIcon size={32} style={{ color: overallColor }} />
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.max(overallScore, 10)}%`, background: overallColor }}></div>
        </div>
      </div>

      <div className="ai-modules">
        <ModuleCard 
          icon={PersonStanding} 
          title="Fall Detection" 
          score={`${fallScore}%`} 
          status={fallStatus} 
          color={fallScore > 50 ? "var(--color-red)" : "var(--color-green)"}
        />
        <ModuleCard 
          icon={ActivitySquare} 
          title="Motion Analysis" 
          score={`${liveMagnitude} m/s²`} 
          status={motionStatus} 
          color="var(--color-blue)"
        />
        <ModuleCard 
          icon={Mic} 
          title="Voice Distress" 
          score={`${voiceScore}%`} 
          status={voiceStatus} 
          color={voiceScore > 50 ? "var(--color-red)" : "var(--color-blue)"}
        />
      </div>

      <div style={{ marginTop: '16px' }}>
        <button 
          className="btn btn-outline" 
          style={{ width: '100%', fontSize: '14px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={() => {
            setFallStatus('Possible Fall Detected!');
            setFallScore(100);
            triggerSos('Possible Fall Detected (Test Fall Event)');
          }}
        >
          <Sparkles size={18} /> Test Fall Impact Event
        </button>
      </div>
    </div>
  );
}

function ModuleCard({ icon: Icon, title, score, status, color }) {
  return (
    <div className="glass-panel ai-module-card mb-4">
      <div className="module-icon" style={{ backgroundColor: `${color}20`, color: color }}>
        <Icon size={24} />
      </div>
      <div className="module-info">
        <span className="module-title">{title}</span>
        <span className="module-status">{status}</span>
      </div>
      <div className="module-score" style={{ color: color }}>
        {score}
      </div>
    </div>
  );
}
