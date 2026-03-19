import React, { useState, useEffect } from 'react';
import api from './utils/api';
import { Toast } from './components/Shared';
import Sidebar from './components/Sidebar';
import { HomePage, LoginPage } from './pages/Public';
import { DashboardPage, MemberManagement } from './pages/Owner';
import { MemberDashboard } from './pages/Member';
import AdminDashboard from './pages/Admin';

const App = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch { return null; }
  });

  const [currentPage, setCurrentPage] = useState('home');
  const [notification, setNotification] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const Layout = ({ children }) => (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: 'white' }}>
      <Sidebar 
        currentUser={currentUser} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        sidebarStyles={sidebarStyles}
        deferredPrompt={deferredPrompt}
        handleInstallClick={handleInstallClick}
        setCurrentUser={setCurrentUser}
      />
      <main className="main-wrapper" style={{ flex: 1, padding: '40px', marginLeft: '280px' }}>
        {children}
      </main>
    </div>
  );

  // Auto-route based on role if logged in
  useEffect(() => {
    if (currentUser && currentPage === 'home') {
      setCurrentPage(currentUser.role === 'member' ? 'member-dashboard' : 'dashboard');
    }
  }, [currentUser]);

  const renderPage = () => {
    const commonProps = { currentUser, showToast, Layout, dashboardStyles };
    
    switch (currentPage) {
      case 'home': return <HomePage setCurrentPage={setCurrentPage} homeStyles={homeStyles} dashboardStyles={dashboardStyles} deferredPrompt={deferredPrompt} handleInstallClick={handleInstallClick} />;
      case 'login': return <LoginPage setCurrentUser={setCurrentUser} setCurrentPage={setCurrentPage} loginStyles={loginStyles} showToast={showToast} />;
      case 'member-dashboard': return <MemberDashboard {...commonProps} />;
      case 'dashboard': return <DashboardPage {...commonProps} />;
      case 'members':
      case 'member-management': return <MemberManagement {...commonProps} setCurrentPage={setCurrentPage} />;
      case 'admin-dashboard': return <AdminDashboard {...commonProps} />;
      case 'admin-dashboard': return <AdminDashboard {...commonProps} />;
      // Fallback for other pages
      default: return <div style={{ padding: '100px', textAlign: 'center' }}><h2>Coming Soon: {currentPage}</h2><button onClick={() => setCurrentPage('home')}>Go Home</button></div>;
    }
  };

  return (
    <>
      {notification && <Toast {...notification} />}
      {renderPage()}
    </>
  );
};

// --- STYLES (Extracted from GymApp.jsx) ---
const sidebarStyles = {
  container: { width: '280px', height: '100vh', position: 'fixed', left: 0, top: 0, padding: '30px', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)', zIndex: 100 },
  logo: { marginBottom: '40px', textAlign: 'center' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  navItem: { padding: '14px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '600', transition: '0.2s' },
  logout: { padding: '14px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', cursor: 'pointer', marginTop: '20px' }
};

const homeStyles = {
  container: { background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent), #0f172a', minHeight: '100vh' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 80px' },
  hero: { padding: '120px 20px 80px', textAlign: 'center' }
};

const loginStyles = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  box: { width: '100%', maxWidth: '440px', textAlign: 'center', padding: '48px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' }
};

const dashboardStyles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '24px' }
};

// Inject CSS
const globalCSS = `
  :root { --primary: #6366f1; --accent: #a855f7; --success: #10b981; --warning: #f59e0b; --text-muted: #94a3b8; }
  .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); }
  .glass-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); padding: 24px; border-radius: 20px; transition: 0.3s; }
  .gradient-text { background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; }
  .primary-btn { padding: 12px 24px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; transition: 0.3s; color: white; background: var(--primary); }
  .pulse { animation: pulse-animation 2s infinite; }
  @keyframes pulse-animation {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
  .input-field { width: 100%; padding: 14px; background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; margin-bottom: 10px; }
  
  @media (max-width: 640px) {
    .sidebar-container { bottom: 0; top: auto !important; height: auto !important; width: 100% !important; flex-direction: row !important; padding: 10px !important; border-top: 1px solid rgba(255,255,255,0.1); }
    .sidebar-logo, .sidebar-logout { display: none; }
    .sidebar-nav { flex-direction: row !important; width: 100%; justify-content: space-around; }
    .sidebar-nav-item { flex-direction: column; font-size: 0.7rem; padding: 5px !important; }
    .main-wrapper { margin-left: 0 !important; padding: 20px !important; padding-bottom: 90px !important; }
  }
`;

const styleEl = document.createElement("style");
styleEl.innerHTML = globalCSS;
document.head.appendChild(styleEl);

export default App;
