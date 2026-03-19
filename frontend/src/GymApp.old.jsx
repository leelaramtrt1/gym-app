// ============================================
// GYM MANAGEMENT APP - FRONTEND (REACT)
// Modern UI/UX Refactor
// ============================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';

// API Configuration
const API_URL = 'http://localhost:5000/api';

// Axios Instance with Interceptors
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const GymApp = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser && savedUser !== 'undefined') {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }
    return null;
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr && userStr !== 'undefined') {
      try {
        const user = JSON.parse(userStr);
        if (!user || !user.role) return 'home';
        if (user.role === 'admin') return 'admin-dashboard';
        if (user.role === 'member') return 'member-dashboard';
        return 'dashboard';
      } catch (e) {
        return 'home';
      }
    }
    return 'home';
  });
  const [loading, setLoading] = useState(false);
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

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ============================================
  // COMPONENTS
  // ============================================

  const Sidebar = () => {
    const role = currentUser?.role || 'owner';
    let menuItems = [];

    if (role === 'admin') {
      menuItems = [
        { id: 'admin-dashboard', label: 'Admin Panel', icon: '🛡️' },
        { id: 'add-owner', label: 'Add Owner', icon: '👤+' },
      ];
    } else if (role === 'owner') {
      menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'members', label: 'Members', icon: '👥' },
        { id: 'attendance', label: 'Attendance', icon: '📋' },
        { id: 'fees', label: 'Fees', icon: '💰' },
        { id: 'reports', label: 'Reports', icon: '📈' },
      ];
    } else {
      menuItems = [
        { id: 'member-dashboard', label: 'My Progress', icon: '🎯' },
        { id: 'member-attendance', label: 'Attendance', icon: '📋' },
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
            📲 Download Mobile App
          </button>
        )}
      </div>
    );
  };

  const Layout = ({ children, noSidebar = false }) => (
    <div className="main-wrapper" style={{...layoutStyles.wrapper, marginLeft: noSidebar ? 0 : '260px'}}>
      {!noSidebar && <Sidebar />}
      <main style={{...layoutStyles.main, marginLeft: 0}}>
        <div className="animate-fade-in" style={layoutStyles.content}>
          {children}
        </div>
      </main>
    </div>
  );

  // ============================================
  // HOME PAGE
  // ============================================

  const HomePage = () => {
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
            The all-in-one gym management platform designed for modern fitness centers and their members.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <div className="glass-card" style={{ width: '200px' }}>
              <h3>📈 Analytics</h3>
              <p style={{ fontSize: '0.85rem' }}>Real-time growth tracking</p>
            </div>
            <div className="glass-card" style={{ width: '200px' }}>
              <h3>🔒 Security</h3>
              <p style={{ fontSize: '0.85rem' }}>JWT protected access</p>
            </div>
            <div className="glass-card" style={{ width: '200px' }}>
              <h3>📱 Mobile First</h3>
              <p style={{ fontSize: '0.85rem' }}>Manage on the go</p>
            </div>
          </div>
        </header>

        <section style={{ padding: '80px 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Why Choose <span className="gradient-text">GYM PRO</span>?</h2>
          <div style={dashboardStyles.grid}>
            {[
              { title: 'For Owners', desc: 'Seamlessly track members, attendance, and revenue in one dashboard.', icon: '🏢' },
              { title: 'For Members', desc: 'Dedicated portal to track progress, workout hours, and fees.', icon: '💪' },
              { title: 'Email Alerts', desc: 'Automated verification and reminders for smooth operations.', icon: '📧' }
            ].map((f, i) => (
              <div key={i} className="glass-card animate-fade-in" style={{ padding: '40px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ padding: '40px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: 'var(--text-muted)' }}>© 2024 GYM PRO Management System. All rights reserved.</p>
        </footer>
      </div>
    );
  };

  // ============================================
  // LOGIN PAGE
  // ============================================

  const LoginPage = () => {
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({
      email: '', password: '', name: '', phone: '', gymName: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const { data } = await api.post('/auth/login', formData);
        if (data.success && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setCurrentUser(data.user);
          
          const userRole = data.user.role;
          if (userRole === 'admin') setCurrentPage('admin-dashboard');
          else if (userRole === 'member') setCurrentPage('member-dashboard');
          else setCurrentPage('dashboard');
        } else {
          showToast('❌ Login failed: User data not received.', 'error');
        }
      } catch (err) {
        showToast('❌ Error: ' + (err.response?.data?.message || err.message), 'error');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={loginStyles.container}>
        <div className="glass-card animate-fade-in" style={loginStyles.box}>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>GYM PRO</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Enter your credentials to access the portal</p>
          

          <form onSubmit={handleSubmit} style={loginStyles.form}>
            {mode === 'register' && (
              <>
                <input type="text" placeholder="Your Name" className="input-field" 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                <input type="text" placeholder="Gym Name" className="input-field" 
                  onChange={(e) => setFormData({...formData, gymName: e.target.value})} required />
                <input type="tel" placeholder="Phone" className="input-field" 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              </>
            )}
            <input type="email" placeholder="Email" className="input-field" 
              onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            <input type="password" placeholder="Password" className="input-field" 
              onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Processing...' : 'Secure Login'}
            </button>
          </form>
          
          <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Restricted access. Please contact your system administrator if you cannot log in.
          </p>
          <p onClick={() => setCurrentPage('home')} style={{ marginTop: '1rem', cursor: 'pointer', fontSize: '0.85rem' }}>← Back to Home</p>
        </div>
      </div>
    );
  };

  // ============================================
  // ADMIN COMPONENTS
  // ============================================

  const AdminDashboard = () => {
    const [owners, setOwners] = useState([]);
    useEffect(() => {
      const fetchOwners = async () => {
        try {
          const { data } = await api.get('/admin/owners');
          if (data.success) setOwners(data.owners);
        } catch (err) { console.error(err); }
      };
      fetchOwners();
    }, []);

    const handleDelete = async (id) => {
      if (window.confirm('Are you sure you want to delete this owner?')) {
        try {
          await api.delete(`/admin/owner/${id}`);
          setOwners(owners.filter(o => o._id !== id));
          showToast('Owner deleted successfully!');
        } catch (err) { showToast('Failed to delete', 'error'); }
      }
    };

    return (
      <Layout>
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem' }}>Admin Control Panel 🛡️</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage gym owners and system-wide settings.</p>
        </header>

        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '15px' }}>Gym Name</th>
                <th style={{ padding: '15px' }}>Owner</th>
                <th style={{ padding: '15px' }}>Email</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {owners.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No owners registered yet.</td></tr>
              ) : (
                owners.map(owner => (
                  <tr key={owner._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '15px' }}>{owner.gymName}</td>
                    <td style={{ padding: '15px' }}>{owner.name}</td>
                    <td style={{ padding: '15px' }}>{owner.email}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem',
                        background: owner.isVerified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: owner.isVerified ? '#22c55e' : '#f59e0b',
                        border: `1px solid ${owner.isVerified ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                      }}>
                        {owner.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button onClick={() => handleDelete(owner._id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Layout>
    );
  };

  const AddOwnerPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', gymName: '', password: '' });
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const { data } = await api.post('/auth/register', { ...formData, role: 'owner' });
        if (data.success) {
          showToast('Owner created successfully!');
          setCurrentPage('admin-dashboard');
        }
      } catch (err) { showToast(err.response?.data?.message || 'Error creating owner', 'error'); }
    };

    return (
      <Layout>
         <h1 style={{ marginBottom: '2rem' }}>Add New Gym Owner 👤+</h1>
         <div className="glass-card" style={{ maxWidth: '500px' }}>
           <form onSubmit={handleSubmit} style={loginStyles.form}>
             <input type="text" placeholder="Owner Name" className="input-field" onChange={e => setFormData({...formData, name: e.target.value})} required />
             <input type="text" placeholder="Gym Name" className="input-field" onChange={e => setFormData({...formData, gymName: e.target.value})} required />
             <input type="email" placeholder="Email" className="input-field" onChange={e => setFormData({...formData, email: e.target.value})} required />
             <input type="tel" placeholder="Phone" className="input-field" onChange={e => setFormData({...formData, phone: e.target.value})} required />
             <input type="password" placeholder="Password" className="input-field" onChange={e => setFormData({...formData, password: e.target.value})} required />
             <button type="submit" className="primary-btn">Create Owner Account</button>
           </form>
         </div>
      </Layout>
    );
  };

  // ============================================
  // DASHBOARD PAGE
  // ============================================

  const DashboardPage = () => {
    const [stats, setStats] = useState({
      totalMembers: 0, activeMembers: 0, pendingFees: 0, todayCheckIns: 0
    });
    const [scanConfig, setScanConfig] = useState({ show: false, action: null });

    const handleOwnerScan = async (scannedId) => {
      const action = scanConfig.action;
      setScanConfig({ show: false, action: null });
      try {
        const { data } = await api.post('/attendance/scan', { scannedId, action });
        if (data.success) {
          showToast(data.message, action === 'checkin' ? 'success' : 'info');
          // Refresh stats
          const res = await api.get(`/members/${currentUser.id}`);
          if (res.data.success) {
             setStats(prev => ({ ...prev, activeMembers: res.data.members.filter(m => m.status === 'active').length }));
          }
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Scanning failed', 'error');
      }
    };

    const downloadQR = (action) => {
      const label = action === 'checkin' ? 'Check-in' : 'Check-out';
      const qrData = `${action}:${currentUser.id}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrData}`;
      
      const win = window.open("", "Gym QR Code", "width=600,height=700");
      win.document.write(`
        <div style="text-align:center; padding:50px; background:#0f172a; color:white; height:100vh; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <h1 style="color:#6366f1; margin:0;">${currentUser.gymName}</h1>
          <h2 style="color:#10b981; margin:10px 0 30px;">${label} QR</h2>
          <div style="background:white; padding:20px; border-radius:20px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
            <img src="${qrUrl}" style="width:350px; height:350px;" />
          </div>
          <p style="margin-top:30px; color:#94a3b8; font-size:1.1rem;">Scan this to mark your ${label.toLowerCase()}</p>
          <button onclick="window.print()" style="margin-top:30px; padding:12px 30px; background:#6366f1; color:white; border:none; border-radius:10px; font-weight:600; cursor:pointer;">Download / Print QR</button>
        </div>
      `);
    };

    useEffect(() => {
      const fetchStats = async () => {
        try {
          const { data } = await api.get(`/members/${currentUser.id}`);
          if (data.success) {
            setStats({
              totalMembers: data.members.length,
              activeMembers: data.members.filter(m => m.status === 'active').length,
              pendingFees: data.members.length * 1000, // Static for now
              todayCheckIns: Math.floor(data.members.length * 0.4)
            });
          }
        } catch (err) { console.error(err); }
      };
      fetchStats();
    }, []);

    const statCards = [
      { label: 'Total Members', value: stats.totalMembers, icon: '👥', color: 'var(--primary)' },
      { label: 'Active Now', value: stats.activeMembers, icon: '⚡', color: 'var(--success)' },
      { label: 'Pending Fees', value: `₹${stats.pendingFees}`, icon: '💰', color: 'var(--warning)' },
      { label: 'Today Check-ins', value: stats.todayCheckIns, icon: '✅', color: 'var(--accent)' },
    ];

    const chartData = [
      { name: 'Mon', count: 42 }, { name: 'Tue', count: 58 }, { name: 'Wed', count: 35 },
      { name: 'Thu', count: 65 }, { name: 'Fri', count: 50 }, { name: 'Sat', count: 80 },
      { name: 'Sun', count: 30 }
    ];

    return (
      <Layout>
        {scanConfig.show && <QrScanner onScan={handleOwnerScan} onClose={() => setScanConfig({ show: false, action: null })} />}
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem' }}>Welcome back, <span className="gradient-text">{currentUser.name}</span>! 👋</h1>
            <p style={{ color: 'var(--text-muted)' }}>Here's what's happening today at {currentUser.gymName}.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
             <button className="primary-btn" style={{ width: 'auto', background: 'var(--success)' }} onClick={() => setScanConfig({ show: true, action: 'checkin' })}>
               📥 Check-in Scan
             </button>
             <button className="primary-btn" style={{ width: 'auto', background: 'var(--warning)' }} onClick={() => setScanConfig({ show: true, action: 'checkout' })}>
               📤 Check-out Scan
             </button>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <button className="glass-card" style={{ flex: 1, padding: '15px', cursor: 'pointer', border: '1px solid rgba(16, 185, 129, 0.3)' }} onClick={() => downloadQR('checkin')}>
            🖼️ Download Check-in QR
          </button>
          <button className="glass-card" style={{ flex: 1, padding: '15px', cursor: 'pointer', border: '1px solid rgba(245, 158, 11, 0.3)' }} onClick={() => downloadQR('checkout')}>
            🖼️ Download Check-out QR
          </button>
        </div>

        <div style={dashboardStyles.grid}>
          {statCards.map((card, i) => (
            <div key={i} className="glass-card" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{card.icon}</div>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{card.label}</h3>
              <p style={{ fontSize: '2.2rem', fontWeight: '800', color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem' }} className="glass-card">
          <h2 style={{ marginBottom: '1.5rem' }}>Weekly Attendance Analysis</h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={1}/>
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Layout>
    );
  };

  // ============================================
  // MEMBERS PAGE
  // ============================================

  const MembersPage = () => {
    const [members, setMembers] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newMember, setNewMember] = useState({
      name: '', email: '', phone: '', 
      joiningDate: new Date().toISOString().split('T')[0],
      membershipType: 'monthly', monthlyFees: 1000,
      password: ''
    });

    useEffect(() => {
      fetchMembers();
    }, []);

    const fetchMembers = async () => {
      try {
        const { data } = await api.get(`/members/${currentUser.id}`);
        if (data.success) setMembers(data.members);
      } catch (err) { console.error(err); }
    };

    const handleAddMember = async (e) => {
      e.preventDefault();
      try {
        const { data } = await api.post('/members/add', {
          gymId: currentUser.id,
          ...newMember
        });
        if (data.success) {
          showToast('✅ Member added!');
          setShowAdd(false);
          setNewMember({
            name: '', email: '', phone: '', 
            joiningDate: new Date().toISOString().split('T')[0],
            membershipType: 'monthly', monthlyFees: 1000,
            password: ''
          });
          fetchMembers();
        }
      } catch (err) { showToast('❌ Error: ' + (err.response?.data?.message || err.message), 'error'); }
    };

    const [editMode, setEditMode] = useState(null);
    const [editData, setEditData] = useState({});

    const handleEditClick = (member) => {
      setEditMode(member._id);
      setEditData(member);
    };

    const handleUpdateMember = async (e) => {
      e.preventDefault();
      try {
        const { data } = await api.put(`/members/edit/${editMode}`, editData);
        if (data.success) {
          showToast('Member updated!');
          setEditMode(null);
          fetchMembers();
        }
      } catch (err) { showToast('❌ Update failed: ' + err.message, 'error'); }
    };

    const handleDeleteMember = async (id) => {
      if (window.confirm('Are you sure you want to remove this member?')) {
        try {
          const { data } = await api.delete(`/members/delete/${id}`);
          if (data.success) {
            showToast('Member removed!');
            fetchMembers();
          }
        } catch (err) { showToast('❌ Delete failed: ' + err.message, 'error'); }
      }
    };

    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Gym <span className="gradient-text">Members</span></h1>
          <button className="primary-btn" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? '× Close' : '+ Join Member'}
          </button>
        </div>

        {showAdd && (
          <div className="glass-card animate-fade-in" style={{ marginBottom: '2rem', maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Member</h2>
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Full Name" className="input-field" 
                onChange={e => setNewMember({...newMember, name: e.target.value})} required />
              <input type="email" placeholder="Email Address" className="input-field" 
                onChange={e => setNewMember({...newMember, email: e.target.value})} required />
              <input type="tel" placeholder="Phone Number" className="input-field" 
                onChange={e => setNewMember({...newMember, phone: e.target.value})} required />
              <div style={{ display: 'flex', gap: '10px' }}>
                <select className="input-field" onChange={e => setNewMember({...newMember, membershipType: e.target.value})}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <input type="number" placeholder="Fees (₹)" className="input-field" 
                  onChange={e => setNewMember({...newMember, monthlyFees: e.target.value})} required />
              </div>
              <input type="password" placeholder="Set Member Password" className="input-field" 
                onChange={e => setNewMember({...newMember, password: e.target.value})} required />
              <button type="submit" className="primary-btn">Register Member</button>
            </form>
          </div>
        )}

        <div style={memberStyles.grid}>
          {members.map(member => (
            <div key={member._id} className="glass-card" style={memberStyles.card}>
              <div style={memberStyles.avatar}>{member.name.charAt(0)}</div>
              
              {editMode === member._id ? (
                <form onSubmit={handleUpdateMember} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <input type="text" value={editData.name} className="input-field" style={{ fontSize: '0.8rem' }}
                    onChange={e => setEditData({...editData, name: e.target.value})} />
                   <input type="tel" value={editData.phone} className="input-field" style={{ fontSize: '0.8rem' }}
                    onChange={e => setEditData({...editData, phone: e.target.value})} />
                   <select className="input-field" value={editData.membershipType} style={{ fontSize: '0.8rem' }}
                    onChange={e => setEditData({...editData, membershipType: e.target.value})}>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                   </select>
                   <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                     <button type="submit" className="primary-btn" style={{ fontSize: '0.7rem', padding: '5px' }}>Save</button>
                     <button type="button" onClick={() => setEditMode(null)} className="primary-btn" style={{ fontSize: '0.7rem', padding: '5px', background: 'rgba(255,255,255,0.1)' }}>Cancel</button>
                   </div>
                </form>
              ) : (
                <>
                  <h3 style={{ marginBottom: '0.25rem' }}>{member.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{member.email}</p>
                  <div style={memberStyles.tag}>{member.membershipType.toUpperCase()}</div>
                  
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '8px', width: '100%' }}>
                    <button 
                      onClick={() => handleEditClick(member)}
                      className="primary-btn" 
                      style={{ fontSize: '0.8rem', padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteMember(member._id)}
                      className="primary-btn" 
                      style={{ fontSize: '0.8rem', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </>
              )}

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span style={{ color: member.status === 'active' ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                  ● {member.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  };

  // ============================================
  // ATTENDANCE PAGE
  // ============================================

  const AttendancePage = () => {
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState({});
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    useEffect(() => {
      const fetchData = async () => {
        try {
          const { data } = await api.get(`/members/${currentUser.id}`);
          if (data.success) {
            setMembers(data.members);
            const attendanceMap = {};
            for (let m of data.members) {
              const res = await api.get(`/attendance/monthly/${m._id}/${month}/${year}`);
              attendanceMap[m._id] = res.data.totalDays;
            }
            setStats(attendanceMap);
          }
        } catch (err) { console.error(err); }
      };
      fetchData();
    }, []);

    return (
      <Layout>
        <h1 style={{ marginBottom: '2rem' }}>Attendance <span className="gradient-text">Tracker</span></h1>
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
              <tr>
                <th style={{ padding: '20px' }}>Member</th>
                <th style={{ padding: '20px' }}>Days Present</th>
                <th style={{ padding: '20px' }}>Performance</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m._id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '20px' }}>
                    <div style={{ fontWeight: '600' }}>{m.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.phone}</div>
                  </td>
                  <td style={{ padding: '20px', fontSize: '1.2rem', fontWeight: '700' }}>{stats[m._id] || 0}</td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ 
                      width: '100%', maxWidth: '150px', height: '8px', background: 'rgba(255,255,255,0.1)', 
                      borderRadius: '4px', overflow: 'hidden' 
                    }}>
                      <div style={{ 
                        width: `${((stats[m._id] || 0) / 25) * 100}%`, height: '100%', 
                        background: (stats[m._id] || 0) > 20 ? 'var(--success)' : 'var(--warning)' 
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Layout>
    );
  };

  // ============================================
  // FEES PAGE
  // ============================================

  const FeesPage = () => {
    const [pending, setPending] = useState([]);

    useEffect(() => {
      const fetchFees = async () => {
        try {
          const { data } = await api.get(`/members/${currentUser.id}`);
          if (data.success) {
            const list = [];
            for (let m of data.members) {
              const res = await api.get(`/fees/pending/${m._id}`);
              if (res.data.totalPending > 0) {
                list.push({ ...m, amount: res.data.totalPending });
              }
            }
            setPending(list);
          }
        } catch (err) { console.error(err); }
      };
      fetchFees();
    }, []);

    return (
      <Layout>
        <h1 style={{ marginBottom: '2rem' }}>Fees <span className="gradient-text">Management</span></h1>
        <div style={dashboardStyles.grid}>
          <div className="glass-card">
            <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Total Outstanding</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--warning)' }}>
              ₹{pending.reduce((a, b) => a + b.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Pending Payments</h2>
          {pending.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-muted)' }}>All fees are up to date! ✅</p>
            </div>
          ) : (
            <div style={dashboardStyles.grid}>
              {pending.map(p => (
                <div key={p._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ marginBottom: '4px' }}>{p.name}</h3>
                    <p style={{ color: 'var(--danger)', fontWeight: '700' }}>₹{p.amount.toLocaleString()}</p>
                  </div>
                  <button className="primary-btn" style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}>Collect</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  };

  // ============================================
  // REPORTS PAGE
  // ============================================

  const ReportsPage = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
      const fetchReports = async () => {
        try {
          const { data } = await api.get(`/reports/weekly/${currentUser.id}`);
          if (data.success) setData(data.weeklyData);
        } catch (err) { console.error(err); }
      };
      fetchReports();
    }, []);

    return (
      <Layout>
        <h1 style={{ marginBottom: '2rem' }}>Analytics <span className="gradient-text">& Reports</span></h1>
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem' }}>Member Engagement Report</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {data.map((item, i) => (
              <div key={i} style={{ 
                display: 'flex', justifyContent: 'space-between', padding: '15px', 
                background: 'rgba(255,255,255,0.03)', borderRadius: '12px' 
              }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{item.member}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status: {item.feesStatus}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: '700' }}>{item.daysAttended} Days</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attendance</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  };

  // ============================================
  // VERIFY PAGE
  // ============================================

  const VerifyPage = ({ token }) => {
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
      const verifyEmail = async () => {
        try {
          const { data } = await axios.get(`${API_URL}/auth/verify/${token}`);
          if (data.success) {
            setStatus('success');
            setMessage(data.message);
          }
        } catch (err) {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Verification failed. Link may be expired.');
        }
      };
      verifyEmail();
    }, [token]);

    return (
      <div style={loginStyles.container}>
        <div className="glass-card animate-fade-in" style={loginStyles.box}>
          <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Email Verification</h2>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {status === 'loading' ? '⏳' : status === 'success' ? '✅' : '❌'}
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>{message}</p>
          <button className="primary-btn" onClick={() => (window.location.href = '/')}>
            {status === 'success' ? 'Go to Login' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  };

  // ============================================
  // MEMBER DASHBOARD
  // ============================================

  const MemberDashboard = () => {
    const [stats, setStats] = useState({
      daysAttended: 0, totalHours: 0, feesPaid: false, feesAmount: 0
    });
    const [scanConfig, setScanConfig] = useState({ show: false, action: null });
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    useEffect(() => {
      const fetchMemberStats = async () => {
        try {
          const { data } = await api.get(`/reports/member/${currentUser.id}/${month}/${year}`);
          if (data.success) {
            setStats({
              daysAttended: data.daysAttended,
              totalHours: data.totalHours,
              feesPaid: data.feesPaid,
              feesAmount: data.feesAmount
            });
          }
        } catch (err) { console.error('Failed to fetch stats:', err); }
      };
      fetchMemberStats();
    }, []);

    const memberStatCards = [
      { label: 'Workouts this Month', value: stats.daysAttended, icon: '🔥', color: 'var(--primary)' },
      { label: 'Total Hours', value: `${stats.totalHours}h`, icon: '⏱️', color: 'var(--success)' },
      { label: 'Membership Status', value: stats.feesPaid ? 'Active' : 'Payment Due', icon: '💳', color: stats.feesPaid ? 'var(--success)' : 'var(--warning)' },
      { label: 'Next Payment', value: `₹${stats.feesAmount}`, icon: '💰', color: 'var(--accent)' },
    ];

    const [showScanner, setShowScanner] = useState(false);

    const handleMemberScan = async (scannedData) => {
      const action = scanConfig.action;
      setScanConfig({ show: false, action: null });
      try {
        // Parse if scanned from a composite QR (action:gymId)
        let scannedId = scannedData;
        let forcedAction = action;
        
        if (scannedData.includes(':')) {
           const [qrAction, qrId] = scannedData.split(':');
           scannedId = qrId;
           // If we're using a specific button, that overrides the QR's type, 
           // but usually they should match.
           if (!forcedAction) forcedAction = qrAction;
        }

        const { data } = await api.post('/attendance/scan', { scannedId, action: forcedAction });
        if (data.success) {
          showToast(data.message, data.type === 'checkin' ? 'success' : 'info');
          // Re-fetch stats
          const now = new Date();
          const res = await api.get(`/reports/member/${currentUser.id}/${now.getMonth() + 1}/${now.getFullYear()}`);
          if (res.data.success) {
            setStats(res.data);
          }
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Scanning failed', 'error');
      }
    };

    const showMyQR = () => {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${currentUser.id}`;
      const win = window.open("", "My QR Code", "width=400,height=500");
      win.document.write(`
        <div style="text-align:center; padding:50px; background:#0f172a; color:white; height:100vh; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <h2 style="color:#6366f1;">My Personal QR</h2>
          <p style="margin-bottom:20px; color:#94a3b8;">Show this to the gym owner to scan</p>
          <div style="background:white; padding:15px; border-radius:15px;">
            <img src="${qrUrl}" />
          </div>
          <h3 style="margin-top:20px;">${currentUser.name}</h3>
        </div>
      `);
    };

    return (
      <Layout>
        {scanConfig.show && <QrScanner onScan={handleMemberScan} onClose={() => setScanConfig({ show: false, action: null })} />}
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem' }}>Hello, <span className="gradient-text">{currentUser.name}</span>! 💪</h1>
            <p style={{ color: 'var(--text-muted)' }}>Welcome to <span style={{ color: 'white', fontWeight: '600' }}>{currentUser.gymName}</span>. Track your progress.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="primary-btn" style={{ width: 'auto', padding: '12px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={showMyQR}>
              🆔 My QR
            </button>
            <button className="primary-btn" style={{ width: 'auto', padding: '12px 20px', background: 'var(--success)' }} onClick={() => setScanConfig({ show: true, action: 'checkin' })}>
              📥 Scan In
            </button>
            <button className="primary-btn" style={{ width: 'auto', padding: '12px 20px', background: 'var(--warning)' }} onClick={() => setScanConfig({ show: true, action: 'checkout' })}>
              📤 Scan Out
            </button>
          </div>
        </header>

        <div style={dashboardStyles.grid}>
          {memberStatCards.map((card, i) => (
            <div key={i} className="glass-card" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{card.icon}</div>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{card.label}</h3>
              <p style={{ fontSize: '2.2rem', fontWeight: '800', color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ marginTop: '2rem', padding: '40px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Your Fitness Journey</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            Keep pushing! Every workout counts. Check your attendance and fees in the sidebar menu.
          </p>
        </div>
      </Layout>
    );
  };

  const MemberAttendance = () => {
    const [totalDays, setTotalDays] = useState(0);
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    useEffect(() => {
      const fetchAttendance = async () => {
        try {
          const { data } = await api.get(`/attendance/monthly/${currentUser.id}/${month}/${year}`);
          setTotalDays(data.totalDays || 0);
        } catch (err) { console.error(err); }
      };
      fetchAttendance();
    }, []);

    return (
      <Layout>
        <h1 style={{ marginBottom: '2rem' }}>My <span className="gradient-text">Attendance</span></h1>
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
          <h2 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Attendance for {new Date().toLocaleString('default', { month: 'long' })}</h2>
          <p style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary)' }}>{totalDays} Days</p>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Keep up the good work! Consistency is key. 💪</p>
        </div>
      </Layout>
    );
  };

  const MemberFees = () => {
    const [feeStatus, setFeeStatus] = useState({ amount: 0, status: 'pending' });

    useEffect(() => {
      const fetchFees = async () => {
        try {
          const { data } = await api.get(`/fees/pending/${currentUser.id}`);
          setFeeStatus({ amount: data.totalPending, status: data.totalPending > 0 ? 'pending' : 'paid' });
        } catch (err) { console.error(err); }
      };
      fetchFees();
    }, []);

    return (
      <Layout>
        <h1 style={{ marginBottom: '2rem' }}>My <span className="gradient-text">Fees</span> Status</h1>
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{feeStatus.status === 'paid' ? '✅' : '💰'}</div>
          <h2 style={{ marginBottom: '1rem' }}>{feeStatus.status === 'paid' ? 'Fees Fully Paid' : 'Payment Pending'}</h2>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', color: feeStatus.status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>
            {feeStatus.status === 'paid' ? 'Up to Date' : `₹${feeStatus.amount}`}
          </p>
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
            {feeStatus.status === 'paid' ? 'Thank you for your timely payment!' : 'Please clear your dues at the gym reception.'}
          </p>
        </div>
      </Layout>
    );
  };

  if (currentPage === 'home') return <HomePage />;
  if (currentPage === 'login' || currentPage === 'register') return <LoginPage />;
  
  // Handle /verify/:token simulation
  if (window.location.pathname.startsWith('/verify/')) {
    const token = window.location.pathname.split('/')[2];
    return <VerifyPage token={token} />;
  }

  // PROTECTED ROUTES SAFETY CHECK
  if (!currentUser) {
    setCurrentPage('home');
    return null;
  }

  if (currentPage === 'admin-dashboard') return <AdminDashboard />;
  if (currentPage === 'add-owner') return <AddOwnerPage />;
  if (currentPage === 'dashboard') return <DashboardPage />;
  if (currentPage === 'members') return <MembersPage />;
  if (currentPage === 'attendance') return <AttendancePage />;
  if (currentPage === 'fees') return <FeesPage />;
  if (currentPage === 'reports') return <ReportsPage />;

  // Member Pages
  if (currentPage === 'member-dashboard') return <MemberDashboard />;
  if (currentPage === 'member-attendance') return <MemberAttendance />;
  if (currentPage === 'member-fees') return <MemberFees />;

  return (
    <>
      {notification && <Toast message={notification.message} type={notification.type} />}
      <Layout>
        <div className="glass-card animate-fade-in">
          <h1 className="gradient-text">Coming Soon</h1>
          <p style={{ color: 'var(--text-muted)' }}>The {currentPage} page is currently under construction.</p>
          <button className="primary-btn" style={{ width: 'auto', marginTop: '1rem' }} onClick={() => setCurrentPage('dashboard')}>Back to Dashboard</button>
        </div>
      </Layout>
    </>
  );
};

const Toast = ({ message, type }) => (
  <div style={{
    position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999,
    padding: '16px 24px', borderRadius: '12px', color: 'white', fontWeight: '600',
    background: type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)', animation: 'slideIn 0.3s ease-out'
  }}>
    {message}
  </div>
);

const QrScanner = ({ onScan, onClose }) => {
  useEffect(() => {
    if (!window.Html5Qrcode) return;
    
    const html5QrCode = new window.Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // This will start the camera immediately (asking for browser permission if not already granted)
    html5QrCode.start(
      { facingMode: "environment" }, 
      config, 
      (decodedText) => {
        html5QrCode.stop().then(() => onScan(decodedText)).catch(() => {});
      },
      (errorMessage) => {}
    ).catch(err => {
      console.error("Unable to start scanning", err);
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="gradient-text">Scan Gym's QR</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}>×</button>
        </div>
        <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Align the gym's QR code within the frame</p>
      </div>
    </div>
  );
};

// ============================================
// STYLES
// ============================================

const layoutStyles = {
  wrapper: { display: 'flex', minHeight: '100vh' },
  main: { flex: 1, marginLeft: '260px', padding: '40px' },
  content: { maxWidth: '1200px', margin: '0 auto' }
};

const sidebarStyles = {
  container: {
    width: '260px',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '30px 20px',
    zIndex: 100
  },
  logo: { marginBottom: '40px', textAlign: 'center' },
  nav: { flex: 1 },
  navItem: {
    width: '100%',
    padding: '14px 20px',
    marginBottom: '8px',
    border: 'none',
    borderRadius: '12px',
    textAlign: 'left',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center'
  },
  logout: {
    padding: '14px 20px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center'
  }
};

const loginStyles = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  box: { width: '100%', maxWidth: '440px', textAlign: 'center', padding: '48px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' }
};

const dashboardStyles = {
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
    gap: '24px',
    marginBottom: '24px'
  }
};

const memberStyles = {
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
    gap: '24px' 
  },
  card: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  avatar: {
    width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem',
    boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
  },
  tag: {
    padding: '4px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)',
    fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em'
  }
};

const homeStyles = {
  container: { background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent), radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.1), transparent)', minHeight: '100vh' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 80px', position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)' },
  hero: { padding: '120px 20px 80px', textAlign: 'center' },
  roleToggle: { padding: '8px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid', borderRadius: '30px', color: 'white', cursor: 'pointer', transition: '0.2s' }
};

// Global Input/Button Component helper (simulated)
// Normally these would be separate files, but to keep it simple:
const globalInjectedStyles = `
  .input-field {
    width: 100%;
    padding: 14px 20px;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: white;
    font-family: inherit;
    font-size: 0.95rem;
    transition: border-color 0.2s;
    outline: none;
  }
  .input-field:focus { border-color: var(--primary); }
  
  .primary-btn {
    width: 100%;
    padding: 14px 20px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .primary-btn:hover { background: var(--primary-dark); transform: scale(1.02); }
  .primary-btn:active { transform: scale(0.98); }
  .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @media (max-width: 1024px) {
    .sidebar-container { width: 80px !important; }
    .sidebar-logo h2, .sidebar-nav span:last-child { display: none; }
    .main-wrapper { margin-left: 80px !important; }
  }

  @media (max-width: 640px) {
    .sidebar-container { 
      bottom: 0; 
      top: auto !important; 
      height: auto !important; 
      width: 100% !important; 
      flex-direction: row !important; 
      padding: 10px 10px calc(10px + env(safe-area-inset-bottom)) !important; 
      background: rgba(15, 23, 42, 0.95) !important;
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 -10px 30px rgba(0,0,0,0.5);
      border-radius: 20px 20px 0 0 !important;
    }
    .sidebar-logo { display: none; }
    .sidebar-nav { flex-direction: row !important; display: flex; width: 100%; justify-content: space-around; }
    .sidebar-nav-item { 
      margin-bottom: 0 !important; 
      padding: 8px !important; 
      width: auto !important; 
      flex-direction: column !important;
      align-items: center !important;
      font-size: 0.7rem !important;
      gap: 4px;
    }
    .sidebar-nav-item span:first-child { margin-right: 0 !important; font-size: 1.2rem; }
    .sidebar-logout { display: none; }
    .main-wrapper { margin-left: 0 !important; padding: 20px !important; padding-bottom: 100px !important; }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = globalInjectedStyles;
document.head.appendChild(styleSheet);

export default GymApp;
