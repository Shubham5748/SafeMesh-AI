import React, { useState, useEffect, useRef } from 'react';
import { Mic, ActivitySquare, PersonStanding, ShieldCheck, ShieldAlert, Play } from 'lucide-react';

export default function Safety({ onSosTrigger }) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Idle');
  const [voiceScore, setVoiceScore] = useState(0);
  
  const [fallStatus, setFallStatus] = useState('Stable');
  const [fallScore, setFallScore] = useState(0);

  const [motionStatus, setMotionStatus] = useState('Idle');
  
  const cooldownRef = useRef(false);
  const fallStateRef = useRef({ phase: 'idle', timeout: null }); // phases: idle -> impact -> stillness -> fall!
  const recognitionRef = useRef(null);

  const IMPACT_THRESHOLD = 25; // m/s^2 magnitude
  const STILLNESS_THRESHOLD_MIN = 8;
  const STILLNESS_THRESHOLD_MAX = 11;
  const STILLNESS_DURATION = 2000; // 2 seconds of stillness

  const startMonitoring = async () => {
    // Request device motion permission if needed (iOS 13+)
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          alert('Motion permission denied. Fall detection will not work.');
          return;
        }
      } catch (err) {
        console.warn('Error requesting motion permission:', err);
      }
    }

    setIsMonitoring(true);
    setupMotionDetection();
    setupVoiceDetection();
  };

  const triggerSos = (reason) => {
    if (cooldownRef.current) return;
    
    cooldownRef.current = true;
    if (onSosTrigger) onSosTrigger(reason);

    // 15 seconds cooldown
    setTimeout(() => {
      cooldownRef.current = false;
      setFallStatus('Stable');
      setFallScore(0);
      setVoiceStatus('Listening...');
      setVoiceScore(0);
      fallStateRef.current = { phase: 'idle', timeout: null };
    }, 15000);
  };

  const setupMotionDetection = () => {
    window.addEventListener('devicemotion', handleMotion, true);
  };

  const handleMotion = (event) => {
    if (cooldownRef.current) return;

    let ax = 0, ay = 0, az = 0;
    if (event.accelerationIncludingGravity) {
      ax = event.accelerationIncludingGravity.x || 0;
      ay = event.accelerationIncludingGravity.y || 0;
      az = event.accelerationIncludingGravity.z || 0;
    } else if (event.acceleration) {
      // Fallback
      ax = event.acceleration.x || 0;
      ay = event.acceleration.y || 0;
      az = event.acceleration.z || 0;
    }

    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

    // Calculate dynamic fall score based on motion
    // Normal gravity is ~9.8.
    const activity = Math.abs(magnitude - 9.8);
    
    if (activity > 2) {
      setMotionStatus('Active Movement');
    } else {
      setMotionStatus('Normal/Still');
    }

    const currentState = fallStateRef.current;

    if (currentState.phase === 'idle') {
      if (magnitude > IMPACT_THRESHOLD) {
        // High impact detected!
        fallStateRef.current.phase = 'impact';
        setFallStatus('High Impact Detected! Analyzing...');
        setFallScore(60);
        
        // Wait briefly then check for stillness
        currentState.timeout = setTimeout(() => {
          fallStateRef.current.phase = 'stillness_check';
        }, 1000); // 1 second after impact, look for stillness
      }
    } else if (currentState.phase === 'stillness_check') {
      if (magnitude >= STILLNESS_THRESHOLD_MIN && magnitude <= STILLNESS_THRESHOLD_MAX) {
        // Stillness maintained
        fallStateRef.current.phase = 'confirming';
        setFallScore(80);
        currentState.timeout = setTimeout(() => {
          if (fallStateRef.current.phase === 'confirming') {
            setFallStatus('Possible Fall Detected!');
            setFallScore(100);
            triggerSos('Possible Fall Detected');
          }
        }, STILLNESS_DURATION);
      } else {
        // Too much movement, cancel fall
        clearTimeout(currentState.timeout);
        fallStateRef.current.phase = 'idle';
        setFallStatus('Stable (Movement recovered)');
        setFallScore(10);
      }
    } else if (currentState.phase === 'confirming') {
      if (magnitude < STILLNESS_THRESHOLD_MIN || magnitude > STILLNESS_THRESHOLD_MAX) {
        // Movement resumed
        clearTimeout(currentState.timeout);
        fallStateRef.current.phase = 'idle';
        setFallStatus('Stable (Recovered)');
        setFallScore(5);
      }
    }
  };

  const setupVoiceDetection = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('Not Supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const distressKeywords = ['help', 'emergency', 'save me', 'bachao', 'bachaao', 'madad', 'stop'];

    recognition.onstart = () => {
      setVoiceStatus('Listening...');
    };

    recognition.onresult = (event) => {
      if (cooldownRef.current) return;

      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.toLowerCase();

      for (const keyword of distressKeywords) {
        if (transcript.includes(keyword)) {
          setVoiceStatus('Distress Phrase Detected!');
          setVoiceScore(100);
          triggerSos(`Voice Distress: heard "${keyword}"`);
          return;
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error', event.error);
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        setVoiceStatus('Microphone Error');
      }
    };

    recognition.onend = () => {
      // Auto-restart if we are still monitoring
      if (isMonitoring && !cooldownRef.current) {
        try {
          recognition.start();
        } catch(e) {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion, true);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (fallStateRef.current.timeout) {
        clearTimeout(fallStateRef.current.timeout);
      }
    };
  }, [isMonitoring]);

  const overallScore = Math.max(voiceScore, fallScore);
  let overallBadge = 'Low';
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
        <h2 className="title">AI Detection Guard</h2>
        <p className="subtitle">Real-time local anomaly analysis</p>
      </header>

      {!isMonitoring ? (
        <div className="glass-panel text-center p-6 mb-6">
          <p className="mb-4">Sensors are currently inactive.</p>
          <button className="btn btn-primary" onClick={startMonitoring} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <Play size={20} /> Start Monitoring
          </button>
        </div>
      ) : (
        <>
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
              <div className="progress-fill" style={{ width: `${overallScore}%`, background: overallColor }}></div>
            </div>
          </div>

          <div className="ai-modules">
            <ModuleCard 
              icon={Mic} 
              title="Voice Distress" 
              score={`${voiceScore}%`} 
              status={voiceStatus} 
              color={voiceScore > 50 ? "var(--color-red)" : "var(--color-blue)"}
            />
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
              score="-" 
              status={motionStatus} 
              color="var(--color-blue)"
            />
          </div>
        </>
      )}
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
