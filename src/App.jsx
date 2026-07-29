import React, { useState, useEffect } from 'react';
import './index.css';
import './screens.css';
import { Home as HomeIcon, Shield, Share2, Clock, User } from 'lucide-react';

import Auth from './screens/Auth';
import Home from './screens/Home';
import Safety from './screens/Safety';
import Mesh from './screens/Mesh';
import History from './screens/History';
import Profile from './screens/Profile';
import LiveMap from './screens/LiveMap';
import EmergencyContacts from './screens/EmergencyContacts';
import EmergencyOverlay from './components/EmergencyOverlay';

function Navigation({ currentTab, setCurrentTab }) {
  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'safety', icon: Shield, label: 'Safety' },
    { id: 'mesh', icon: Share2, label: 'Mesh' },
    { id: 'history', icon: Clock, label: 'History' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="bottom-nav glass-panel">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setCurrentTab(tab.id)}
          >
            <Icon size={24} className="nav-icon" />
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <Shield size={80} className="splash-logo glow-blue" />
        <h1 className="splash-title">SafeMesh AI</h1>
        <p className="splash-tagline">Your Safety Never Goes Offline.</p>
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [showEmergency, setShowEmergency] = useState(false);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <main className="main-content" style={{ paddingBottom: 0 }}>
          <Auth onLogin={() => setIsAuthenticated(true)} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <main className="main-content">
        {currentTab === 'home' && (
          <Home 
            onSosTrigger={() => setShowEmergency(true)} 
            onOpenMap={() => setCurrentTab('map')}
          />
        )}
        {currentTab === 'safety' && <Safety />}
        {currentTab === 'mesh' && <Mesh />}
        {currentTab === 'history' && <History />}
        {currentTab === 'profile' && <Profile onOpenContacts={() => setCurrentTab('contacts')} />}
        {currentTab === 'map' && <LiveMap />}
        {currentTab === 'contacts' && <EmergencyContacts />}
      </main>
      
      {/* Show navigation only if on main tabs */}
      {['home', 'safety', 'mesh', 'history', 'profile'].includes(currentTab) && (
        <Navigation currentTab={currentTab} setCurrentTab={setCurrentTab} />
      )}

      {/* Floating back buttons for sub-screens */}
      {['map', 'contacts'].includes(currentTab) && (
        <button 
          onClick={() => setCurrentTab(currentTab === 'map' ? 'home' : 'profile')}
          style={{ position: 'absolute', top: 24, left: 24, zIndex: 50, background: 'rgba(0,0,0,0.5)', border: '1px solid #fff3', color: '#fff', padding: '8px 16px', borderRadius: 20, cursor: 'pointer' }}
        >
          &larr; Back
        </button>
      )}

      {showEmergency && (
        <EmergencyOverlay 
          onCancel={() => setShowEmergency(false)} 
          onBroadcast={() => {
            console.log('SOS Broadcasted');
          }}
        />
      )}
    </div>
  );
}
