import React from 'react';
import { Mic, ActivitySquare, PersonStanding, ShieldCheck } from 'lucide-react';

export default function Safety() {
  return (
    <div className="safety-screen screen-content">
      <header className="header mb-6">
        <h2 className="title">AI Detection Guard</h2>
        <p className="subtitle">Real-time local anomaly analysis</p>
      </header>

      <div className="overall-risk glass-panel mb-6">
        <div className="risk-header">
          <h3>Overall Risk</h3>
          <span className="risk-badge safe">Low</span>
        </div>
        <div className="risk-score">
          <span className="score">12%</span>
          <ShieldCheck size={32} className="text-green" />
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '12%', background: 'var(--color-green)' }}></div>
        </div>
      </div>

      <div className="ai-modules">
        <ModuleCard 
          icon={Mic} 
          title="Voice Distress" 
          score="8%" 
          status="Listening..." 
          color="var(--color-blue)"
        />
        <ModuleCard 
          icon={PersonStanding} 
          title="Fall Detection" 
          score="4%" 
          status="Stable" 
          color="var(--color-green)"
        />
        <ModuleCard 
          icon={ActivitySquare} 
          title="Motion Analysis" 
          score="15%" 
          status="Normal walking" 
          color="var(--color-blue)"
        />
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
