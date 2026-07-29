import React, { useState } from 'react';
import { Shield, Fingerprint, Mail, Lock } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'forgot'

  return (
    <div className="auth-screen screen-content">
      <div className="auth-header">
        <Shield size={64} className="text-blue glow-blue" />
        <h1 className="title mt-4">SafeMesh AI</h1>
        <p className="subtitle">Secure decentralized safety.</p>
      </div>

      <div className="glass-panel auth-card mt-6">
        <h3 className="auth-title mb-4">
          {view === 'login' && 'Welcome Back'}
          {view === 'signup' && 'Create Account'}
          {view === 'forgot' && 'Reset Password'}
        </h3>

        <div className="auth-form">
          <div className="input-group">
            <Mail size={20} className="input-icon text-muted" />
            <input type="email" placeholder="Email Address" className="auth-input" />
          </div>
          
          {view !== 'forgot' && (
            <div className="input-group mt-4">
              <Lock size={20} className="input-icon text-muted" />
              <input type="password" placeholder="Password" className="auth-input" />
            </div>
          )}

          <button className="btn btn-primary auth-btn mt-6" onClick={onLogin}>
            {view === 'login' && 'Sign In'}
            {view === 'signup' && 'Sign Up'}
            {view === 'forgot' && 'Send Reset Link'}
          </button>
        </div>

        {view === 'login' && (
          <>
            <div className="divider"><span>OR</span></div>
            <button className="btn btn-outline auth-btn google-btn mb-4" onClick={onLogin}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" width={20} />
              Continue with Google
            </button>
            <div className="biometric-login" onClick={onLogin}>
              <Fingerprint size={48} className="text-green glow-green" />
              <span className="text-muted mt-2">Biometric Login</span>
            </div>
          </>
        )}

        <div className="auth-footer mt-6">
          {view === 'login' ? (
            <>
              <span className="text-muted">Don't have an account? </span>
              <button className="link-btn text-blue" onClick={() => setView('signup')}>Sign up</button>
            </>
          ) : (
            <>
              <span className="text-muted">Already have an account? </span>
              <button className="link-btn text-blue" onClick={() => setView('login')}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
