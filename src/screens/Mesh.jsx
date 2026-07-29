import React, { useEffect, useState } from 'react';
import { Smartphone, Cloud, Radio, Activity } from 'lucide-react';

export default function Mesh() {
  const [packets, setPackets] = useState([]);

  useEffect(() => {
    // Simulate packets moving through the mesh
    const interval = setInterval(() => {
      setPackets(prev => {
        const newPacket = { id: Date.now(), position: 0 };
        return [...prev.filter(p => p.position < 100), newPacket];
      });
    }, 2000);

    const animation = setInterval(() => {
      setPackets(prev => prev.map(p => ({ ...p, position: p.position + 2 })));
    }, 50);

    return () => {
      clearInterval(interval);
      clearInterval(animation);
    };
  }, []);

  return (
    <div className="mesh-screen screen-content">
      <header className="header mb-6">
        <h2 className="title">BLE Mesh Network</h2>
        <p className="subtitle">Encrypted peer-to-peer relay</p>
      </header>

      <div className="mesh-visualization glass-panel mb-6">
        <div className="mesh-nodes">
          <Node icon={Smartphone} label="You" active />
          <div className="mesh-link">
            {packets.map(p => (
              <div key={p.id} className="packet" style={{ left: `${p.position}%` }}></div>
            ))}
          </div>
          <Node icon={Radio} label="Relay A" active />
          <div className="mesh-link"></div>
          <Node icon={Radio} label="Relay B" />
          <div className="mesh-link"></div>
          <Node icon={Cloud} label="Cloud" active />
        </div>
      </div>

      <div className="network-stats grid-2">
        <div className="glass-panel stat-card">
          <span className="stat-value">3</span>
          <span className="stat-label">Nearby Nodes</span>
        </div>
        <div className="glass-panel stat-card">
          <span className="stat-value text-green">Strong</span>
          <span className="stat-label">Signal</span>
        </div>
        <div className="glass-panel stat-card">
          <span className="stat-value">Encrypted</span>
          <span className="stat-label">Status</span>
        </div>
        <div className="glass-panel stat-card">
          <span className="stat-value">12ms</span>
          <span className="stat-label">Latency</span>
        </div>
      </div>
    </div>
  );
}

function Node({ icon: Icon, label, active }) {
  return (
    <div className={`mesh-node ${active ? 'active' : ''}`}>
      <div className="node-icon-wrapper">
        <Icon size={24} className="node-icon" />
        {active && <div className="ping"></div>}
      </div>
      <span className="node-label">{label}</span>
    </div>
  );
}
