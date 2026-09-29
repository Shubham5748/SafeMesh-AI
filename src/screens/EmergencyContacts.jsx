import React, { useState, useEffect } from 'react';
import { Phone, Heart, Plus, Trash2 } from 'lucide-react';

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('sos_contacts');
    if (saved) {
      try {
        setContacts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse contacts', e);
      }
    }
  }, []);

  const saveContacts = (newContacts) => {
    setContacts(newContacts);
    localStorage.setItem('sos_contacts', JSON.stringify(newContacts));
  };

  const addContact = (e) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const newContact = {
      id: Date.now().toString(),
      name: newName,
      phone: newPhone,
      relation: newRelation || 'Contact'
    };

    saveContacts([...contacts, newContact]);
    setNewName('');
    setNewPhone('');
    setNewRelation('');
    setShowAddForm(false);
  };

  const removeContact = (id) => {
    saveContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="contacts-screen screen-content">
      <header className="header mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="title">SOS Contacts</h2>
          <p className="subtitle">Notified instantly on emergency</p>
        </div>
        <button className="add-contact-btn btn-primary" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={24} className="text-white" />
        </button>
      </header>

      {showAddForm && (
        <form onSubmit={addContact} className="glass-panel mb-6" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ color: 'white' }}>Add Contact</h3>
          <input 
            type="text" 
            placeholder="Name (e.g. Mom)" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            required
            style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid #fff3' }}
          />
          <input 
            type="tel" 
            placeholder="Phone (e.g. +1234567890)" 
            value={newPhone} 
            onChange={(e) => setNewPhone(e.target.value)} 
            required
            style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid #fff3' }}
          />
          <input 
            type="text" 
            placeholder="Relation (Optional)" 
            value={newRelation} 
            onChange={(e) => setNewRelation(e.target.value)} 
            style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid #fff3' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
            <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)} style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      )}

      {contacts.length === 0 ? (
        <div className="glass-panel text-center p-6">
          <p>No contacts added yet.</p>
          <p className="text-sm mt-2" style={{ color: '#aaa' }}>Please add real emergency contacts to use the SOS feature.</p>
        </div>
      ) : (
        <div className="contacts-list">
          {contacts.map((contact) => (
            <div key={contact.id} className="glass-panel contact-card mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="contact-avatar">
                  <Heart size={24} />
                </div>
                <div className="contact-info" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="contact-name" style={{ color: 'white', fontWeight: 'bold' }}>{contact.name}</span>
                  <span className="contact-relation" style={{ color: '#ccc', fontSize: '0.9em' }}>{contact.relation} • {contact.phone}</span>
                </div>
              </div>
              <button onClick={() => removeContact(contact.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
