import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function History() {
  const events = [
    { id: 'EMG-9021', date: 'Oct 24, 2023', time: '14:32', status: 'Delivered', type: 'Fall Detected' },
    { id: 'EMG-8810', date: 'Sep 12, 2023', time: '09:15', status: 'Cancelled', type: 'Manual SOS' },
    { id: 'EMG-8104', date: 'Aug 05, 2023', time: '22:45', status: 'Delivered', type: 'Voice Distress' },
  ];

  return (
    <div className="history-screen screen-content">
      <header className="header mb-6">
        <h2 className="title">Emergency History</h2>
        <p className="subtitle">Past events and resolutions</p>
      </header>

      <div className="timeline">
        {events.map((event, idx) => (
          <div key={event.id} className="timeline-item">
            <div className="timeline-connector">
              <div className="timeline-dot"></div>
              {idx !== events.length - 1 && <div className="timeline-line"></div>}
            </div>
            <div className="glass-panel history-card mb-4">
              <div className="history-header">
                <span className="history-id">{event.id}</span>
                <span className="history-type">{event.type}</span>
              </div>
              <div className="history-details">
                <span className="history-datetime">{event.date} • {event.time}</span>
                <StatusBadge status={event.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  let Icon = Clock;
  let colorClass = 'text-blue';

  if (status === 'Delivered') {
    Icon = CheckCircle2;
    colorClass = 'text-green';
  } else if (status === 'Cancelled') {
    Icon = XCircle;
    colorClass = 'text-muted';
  }

  return (
    <div className={`status-badge ${colorClass}`}>
      <Icon size={16} />
      <span>{status}</span>
    </div>
  );
}
