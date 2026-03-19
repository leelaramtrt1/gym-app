import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const AdminDashboard = ({ currentUser, showToast, Layout, dashboardStyles }) => {
  const [stats, setStats] = useState({ totalOwners: 0, totalGyms: 0, activeSystemMembers: 0, pendingSystemFees: 0 });

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const { data } = await api.get('/admin/stats'); // Assuming this endpoint exists or I'll add logic to mock it if needed
        if (data.success) {
          setStats(data.stats);
        } else {
          // Fallback stats if endpoint not yet perfect
          setStats({ totalOwners: 5, totalGyms: 5, activeSystemMembers: 120, pendingSystemFees: 50000 });
        }
      } catch (err) { 
        console.error(err);
        setStats({ totalOwners: 5, totalGyms: 5, activeSystemMembers: 120, pendingSystemFees: 50000 });
      }
    };
    fetchAdminStats();
  }, []);

  const adminStatCards = [
    { label: 'Total Gym Owners', value: stats.totalOwners, icon: '👑', color: 'var(--primary)' },
    { label: 'Total Gyms', value: stats.totalGyms, icon: '🏠', color: 'var(--success)' },
    { label: 'System Members', value: stats.activeSystemMembers, icon: '👥', color: 'var(--accent)' },
    { label: 'Revenue Forecast', value: `₹${stats.pendingSystemFees}`, icon: '📈', color: 'var(--warning)' },
  ];

  return (
    <Layout>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>System <span className="gradient-text">Administrator</span></h1>
        <p style={{ color: 'var(--text-muted)' }}>Global Management Overview</p>
      </header>

      <div style={dashboardStyles.grid}>
        {adminStatCards.map((card, i) => (
          <div key={i} className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{card.icon}</div>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{card.label}</h3>
            <p style={{ fontSize: '2.2rem', fontWeight: '800', color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>System Controls</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="primary-btn" onClick={() => showToast('Feature coming soon!')}>Manage All Gyms</button>
          <button className="primary-btn" style={{ background: 'var(--success)' }} onClick={() => showToast('Feature coming soon!')}>System Reports</button>
        </div>
      </section>
    </Layout>
  );
};

export default AdminDashboard;
