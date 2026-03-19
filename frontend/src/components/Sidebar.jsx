import React from 'react';

const Sidebar = ({ currentUser, currentPage, setCurrentPage, sidebarStyles, deferredPrompt, handleInstallClick, setCurrentUser }) => {
  let menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'member-attendance', label: 'Attendance', icon: '✅' },
    { id: 'member-management', label: 'Manage', icon: '⚙️' },
  ];

  if (currentUser?.role === 'member') {
    menuItems = [
      { id: 'member-dashboard', label: 'My Progress', icon: '🔥' },
      { id: 'member-attendance-view', label: 'My Attendance', icon: '📅' },
      { id: 'member-fees', label: 'Fees Due', icon: '💰' },
    ];
  }

  return (
    <div className="glass sidebar-container" style={sidebarStyles.container}>
      <div className="sidebar-logo" style={sidebarStyles.logo}>
        <h2 className="gradient-text">🏋️ GYM PRO</h2>
      </div>
      <nav className="sidebar-nav" style={sidebarStyles.nav}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className="sidebar-nav-item"
            style={{
              ...sidebarStyles.navItem,
              background: currentPage === item.id ? 'var(--primary)' : 'transparent',
              color: currentPage === item.id ? 'white' : 'var(--text-muted)',
            }}
          >
            <span style={{ marginRight: '12px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <button 
        onClick={() => {
          localStorage.clear();
          setCurrentUser(null);
          setCurrentPage('home');
        }} 
        className="sidebar-logout"
        style={sidebarStyles.logout}
      >
        <span>Logout 👋</span>
      </button>
      {deferredPrompt && (
        <button 
          onClick={handleInstallClick}
          className="primary-btn"
          style={{ marginTop: '10px', background: 'var(--success)', fontSize: '0.85rem' }}
        >
          📲 Download App
        </button>
      )}
    </div>
  );
};

export default Sidebar;
