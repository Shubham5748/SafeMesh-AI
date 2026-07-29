import React from 'react';
import { Phone, Heart, Shield, Plus } from 'lucide-react';

export default function EmergencyContacts() {
  const contacts = [
    { name: 'Sarah Chen', relation: 'Sister', phone: '+1 555-0100', priority: 'High', type: 'Family' },
    { name: 'David Smith', relation: 'Partner', phone: '+1 555-0192', priority: 'High', type: 'Family' },
    { name: '911 Emergency', relation: 'Police', phone: '911', priority: 'Critical', type: 'Official' },
  ];

  return (
    <div className="contacts-screen screen-content">
      <header className="header mb-6">
        <div>
          <h2 className="title">SOS Contacts</h2>
          <p className="subtitle">Notified instantly on emergency</p>
        </div>
        <button className="add-contact-btn">
          <Plus size={24} className="text-white" />
        </button>
      </header>

      <div className="contacts-list">
        {contacts.map((contact, idx) => (
          <div key={idx} className="glass-panel contact-card mb-4">
            <div className="contact-avatar">
              {contact.type === 'Official' ? <Shield size={24} /> : <Heart size={24} />}
            </div>
            <div className="contact-info">
              <span className="contact-name">{contact.name}</span>
              <span className="contact-relation">{contact.relation} • {contact.phone}</span>
            </div>
            <div className={`priority-badge ${contact.priority === 'Critical' ? 'bg-red' : 'bg-blue'}`}>
              {contact.priority}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
