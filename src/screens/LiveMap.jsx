import React from 'react';
import { MapPin, Navigation, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function LiveMap() {
  return (
    <div className="livemap-screen screen-content p-0">
      <div className="map-placeholder">
        <div className="map-grid"></div>
        <div className="map-overlay"></div>
        
        {/* User Location */}
        <div className="map-marker user-marker" style={{ top: '50%', left: '50%' }}>
          <div className="marker-pulse"></div>
          <Navigation size={24} className="text-blue" />
        </div>

        {/* Police Station */}
        <div className="map-marker safe-marker" style={{ top: '30%', left: '70%' }}>
          <ShieldCheck size={20} className="text-green" />
          <span className="marker-label text-green">Police</span>
        </div>

        {/* Danger Zone */}
        <div className="danger-zone" style={{ top: '60%', left: '30%' }}>
          <AlertTriangle size={24} className="text-red mb-1" />
          <span>High Risk Area</span>
        </div>

        <div className="glass-panel map-hud">
          <h3 className="hud-title">Safe Route Active</h3>
          <p className="hud-subtitle">ETA to Safe Zone: 4 mins</p>
          <div className="progress-bar mt-2">
            <div className="progress-fill" style={{ width: '40%', background: 'var(--color-green)' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
