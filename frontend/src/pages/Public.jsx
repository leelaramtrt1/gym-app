import React, { useState } from 'react';
import api from '../utils/api';

export const HomePage = ({ setCurrentPage, homeStyles, dashboardStyles, deferredPrompt, handleInstallClick }) => {
  return (
    <div style={homeStyles.container}>
      <nav style={homeStyles.nav}>
        <h2 className="gradient-text" style={{ fontSize: '1.5rem' }}>🏋️ GYM PRO</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {deferredPrompt && (
            <button className="primary-btn" style={{ width: 'auto', background: 'var(--success)' }} onClick={handleInstallClick}>
              📲 Download App
            </button>
          )}
          <button className="primary-btn" style={{ width: 'auto' }} onClick={() => setCurrentPage('login')}>Login</button>
        </div>
      </nav>
      
      <header style={homeStyles.hero}>
        <h1 className="animate-fade-in" style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '1.5rem' }}>
          Transform Your <span className="gradient-text">Fitness</span> Journey
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          The all-in-one gym management platform designed for modern fitness centers.
        </p>
      </header>
    </div>
  );
};

export const LoginPage = ({ setCurrentUser, setCurrentPage, loginStyles, showToast }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', formData);
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setCurrentPage(data.user.role === 'admin' ? 'admin-dashboard' : data.user.role === 'member' ? 'member-dashboard' : 'dashboard');
        showToast('Login successful!');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Login failed', 'error');
    }
  };

  return (
    <div style={loginStyles.container}>
      <div className="glass-card animate-fade-in" style={loginStyles.box}>
        <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome Back</h2>
        <form onSubmit={handleLogin} style={loginStyles.form}>
          <input type="email" placeholder="Email" className="input-field" onChange={e => setFormData({...formData, email: e.target.value})} required />
          <input type="password" placeholder="Password" className="input-field" onChange={e => setFormData({...formData, password: e.target.value})} required />
          <button type="submit" className="primary-btn">Login</button>
        </form>
        <button className="primary-btn" style={{ background: 'none', color: 'var(--text-muted)', marginTop: '1rem' }} onClick={() => setCurrentPage('home')}>Back to Home</button>
      </div>
    </div>
  );
};
