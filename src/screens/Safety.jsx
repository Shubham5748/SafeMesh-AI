import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, ActivitySquare, PersonStanding, ShieldCheck, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Safety({ onSosTrigger }) {
  const [voiceStatus, setVoiceStatus] = useState('Voice standby. Tap below to start.');
  const [voiceScore, setVoiceScore] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [debugError, setDebugError] = useState('');

  const [fallStatus, setFallStatus] = useState('Active - Monitoring');
  const [fallScore, setFallScore] = useState(0);

  const [motionStatus, setMotionStatus] = useState('Still / Normal');
  const [liveMagnitude, setLiveMagnitude] = useState('9.8');
  const [needsIosPermission, setNeedsIosPermission] = useState(false);

  const cooldownRef = useRef(false);
  const fallStateRef = useRef({ phase: 'idle', timeout: null });
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);

  const IMPACT_THRESHOLD = 25;
  const STILLNESS_THRESHOLD_MIN = 8;
  const STILLNESS_THRESHOLD_MAX = 11;
  const STILLNESS_DURATION = 2000;

  const triggerSos = useCallback((reason) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    if (onSosTrigger) onSosTrigger(reason);

    setTimeout(() => {
      cooldownRef.current = false;
      setFallStatus('Active - Monitoring');
      setFallScore(0);
      setVoiceScore(0);
      fallStateRef.current = { phase: 'idle', timeout: null };
    }, 15000);
  }, [onSosTrigger]);

  const handleMotion = useCallback((event) => {
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

    const activity = Math.abs(magnitude - 9.8);
    if (activity > 3) {
      setMotionStatus('Active Movement');
    } else {
      setMotionStatus('Still / Resting');
    }

    const currentState = fallStateRef.current;

    if (currentState.phase === 'idle') {
      if (magnitude > IMPACT_THRESHOLD) {
        fallStateRef.current.phase = 'impact';
        setFallStatus('High Impact Detected! Analyzing...');
        setFallScore(60);
        currentState.timeout = setTimeout(() => {
          fallStateRef.current.phase = 'stillness_check';
        }, 1000);
      }
    } else if (currentState.phase === 'stillness_check') {
      if (magnitude >= STILLNESS_THRESHOLD_MIN && magnitude <= STILLNESS_THRESHOLD_MAX) {
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
  }, [triggerSos]);

  // Audio Level Volume Monitor (Fallback for Web Speech API)
  const startAudioLevelMonitor = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!audioContextRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        // If very loud distress scream (e.g. volume > 75)
        if (avg > 75 && !cooldownRef.current) {
          setVoiceScore(95);
          setVoiceStatus('🚨 High-volume Distress Sound Detected!');
          triggerSos('Acoustic Distress: High volume scream/noise detected');
        }

        requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Audio monitor error:', e);
    }
  };

  // Start continuous Web Speech Recognition
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log('Speech API not available on this browser, using audio level monitor fallback.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      const distressKeywords = [
        'help', 'emergency', 'save me', 'save',
        'bachao', 'bachaao', 'madad', 'madat',
        'stop', 'danger', 'accident', 'fire', 'police'
      ];

      recognition.onstart = () => {
        setIsVoiceActive(true);
        setMicBlocked(false);
        setVoiceStatus('🎙️ Listening... (say "help", "bachao", "emergency")');
      };

      recognition.onresult = (event) => {
        if (cooldownRef.current) return;
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.toLowerCase();
        console.log('Voice heard:', transcript);

        for (const keyword of distressKeywords) {
          if (transcript.includes(keyword)) {
            setVoiceStatus(`🚨 Detected "${keyword}"!`);
            setVoiceScore(100);
            triggerSos(`Voice Distress: heard "${keyword}"`);
            return;
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech error:', event.error);
        if (event.error === 'not-allowed') {
          // If speech is blocked but getUserMedia worked, fallback to audio monitor
          console.log('Speech not-allowed; audio volume monitor is still active');
        }
      };

      recognition.onend = () => {
        if (!cooldownRef.current && micStreamRef.current) {
          try {
            setTimeout(() => {
              if (micStreamRef.current && !cooldownRef.current) {
                recognition.start();
              }
            }, 600);
          } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition setup error:', err);
    }
  };

  // Unified button click handler that directly triggers getUserMedia on explicit user tap
  const activateSensors = async () => {
    setDebugError('');
    setVoiceStatus('Requesting mic permission from browser...');

    // 1. iOS Motion Permission
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          setNeedsIosPermission(false);
          window.addEventListener('devicemotion', handleMotion, true);
        }
      } catch (e) {
        console.error('iOS Motion error:', e);
      }
    }

    // 2. Direct getUserMedia on click
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicBlocked(true);
      setDebugError('navigator.mediaDevices.getUserMedia is undefined. Ensure URL is HTTPS.');
      setVoiceStatus('⚠️ Secure context (HTTPS) required for mic.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setIsVoiceActive(true);
      setMicBlocked(false);
      setVoiceStatus('🎙️ Mic Active & Monitoring Live Audio');

      // Start audio level monitor
      startAudioLevelMonitor(stream);

      // Start keyword recognition
      startSpeechRecognition();
    } catch (err) {
      console.error('Mic access error:', err);
      setMicBlocked(true);
      setVoiceStatus('⚠️ Mic blocked by browser. Check address bar lock icon.');
      setDebugError(`${err.name}: ${err.message}`);
    }
  };

  useEffect(() => {
    // Accelerometer motion
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      setNeedsIosPermission(true);
    } else {
      window.addEventListener('devicemotion', handleMotion, true);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion, true);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (fallStateRef.current.timeout) {
        clearTimeout(fallStateRef.current.timeout);
      }
    };
  }, [handleMotion]);

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
      <header className="header mb-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 className="title">AI Detection Guard</h2>
            <p className="subtitle">Real-time anomaly & distress monitoring</p>
          </div>
          <span style={{
            fontSize: '11px',
            background: isVoiceActive ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)',
            color: isVoiceActive ? '#22c55e' : '#eab308',
            padding: '4px 8px',
            borderRadius: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isVoiceActive ? <CheckCircle2 size={12} /> : null}
            {isVoiceActive ? 'ALL SENSORS LIVE' : 'MOTION ACTIVE'}
          </span>
        </div>
      </header>

      {/* Prominent one-tap activation button */}
      {!isVoiceActive && (
        <div className="glass-panel p-4 mb-4 text-center" style={{ border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.15)' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '15px' }}>🎙️ Turn On Voice & Acoustic Detection</p>
          <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '12px' }}>
            Tap below to grant microphone access for voice distress recognition.
          </p>
          <button
            className="btn btn-primary"
            onClick={activateSensors}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontWeight: 'bold' }}
          >
            <Mic size={18} /> Enable Voice Distress Detection
          </button>
          {debugError && (
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#f87171', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
              <strong>Browser notice:</strong> {debugError}
            </div>
          )}
        </div>
      )}

      {needsIosPermission && (
        <div className="glass-panel text-center p-3 mb-4" style={{ border: '1px solid #3b82f6' }}>
          <p className="text-sm mb-2">iPhone requires permission for accelerometer:</p>
          <button className="btn btn-primary" onClick={activateSensors}>
            Enable Motion Sensors
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
          color={voiceScore > 50 ? "var(--color-red)" : (isVoiceActive ? "var(--color-green)" : "var(--color-yellow)")}
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
