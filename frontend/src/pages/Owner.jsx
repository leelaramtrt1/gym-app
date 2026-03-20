import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { QrScanner } from '../components/Shared';

export const DashboardPage = ({ currentUser, showToast, Layout, dashboardStyles }) => {
  const [stats, setStats] = useState({ totalMembers: 0, activeMembers: 0, pendingFees: 0, todayCheckIns: 0 });
  const [scanConfig, setScanConfig] = useState({ show: false, action: null });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get(`/members/${currentUser.id}`);
        if (data.success) {
          setStats({
            totalMembers: data.members.length,
            activeMembers: data.members.filter(m => m.status === 'active').length,
            pendingFees: data.members.length * 1000,
            todayCheckIns: Math.floor(data.members.length * 0.4)
          });
        }
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, [currentUser.id]);

  const handleOwnerScan = async (scannedId) => {
    const action = scanConfig.action;
    setScanConfig({ show: false, action: null });
    try {
      const { data } = await api.post('/attendance/scan', { scannedId, action });
      if (data.success) {
        showToast(data.message, action === 'checkin' ? 'success' : 'info');
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
    win.document.write(`<div style="text-align:center; padding:50px; background:#0f172a; color:white; height:100vh; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <h1 style="color:#6366f1; margin:0;">${currentUser.gymName}</h1>
      <h2 style="color:#10b981; margin:10px 0 30px;">${label} QR</h2>
      <div style="background:white; padding:20px; border-radius:20px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <img src="${qrUrl}" style="width:350px; height:350px;" />
      </div>
      <button onclick="window.print()" style="margin-top:30px; padding:12px 30px; background:#6366f1; color:white; border:none; border-radius:10px; font-weight:600; cursor:pointer;">Print QR</button>
    </div>`);
  };

  const statCards = [
    { label: 'Total Members', value: stats.totalMembers, icon: '👥', color: 'var(--primary)' },
    { label: 'Active Now', value: stats.activeMembers, icon: '⚡', color: 'var(--success)' },
    { label: 'Pending Fees', value: `₹${stats.pendingFees}`, icon: '💰', color: 'var(--warning)' },
    { label: 'Today Check-ins', value: stats.todayCheckIns, icon: '✅', color: 'var(--accent)' },
  ];

  return (
    <Layout>
      {scanConfig.show && <QrScanner onScan={handleOwnerScan} onClose={() => setScanConfig({ show: false, action: null })} />}
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Welcome, <span className="gradient-text">{currentUser.name}</span>!</h1>
          <p style={{ color: 'var(--text-muted)' }}>{currentUser.gymName} Dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
           <button className="primary-btn" style={{ width: 'auto', background: 'var(--success)' }} onClick={() => setScanConfig({ show: true, action: 'checkin' })}>📥 Check-in Scan</button>
           <button className="primary-btn" style={{ width: 'auto', background: 'var(--warning)' }} onClick={() => setScanConfig({ show: true, action: 'checkout' })}>📤 Check-out Scan</button>
        </div>
      </header>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <button className="glass-card" style={{ flex: 1, padding: '15px', cursor: 'pointer' }} onClick={() => downloadQR('checkin')}>🖼️ Check-in QR</button>
        <button className="glass-card" style={{ flex: 1, padding: '15px', cursor: 'pointer' }} onClick={() => downloadQR('checkout')}>🖼️ Check-out QR</button>
      </div>
      <div style={dashboardStyles.grid}>
        {statCards.map((card, i) => (
          <div key={i} className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{card.icon}</div>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{card.label}</h3>
            <p style={{ fontSize: '2.2rem', fontWeight: '800', color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export const MemberManagement = ({ currentUser, showToast, Layout }) => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberStats, setMemberStats] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data } = await api.get(`/members/${currentUser.id}`);
        if (data.success) setMembers(data.members);
      } catch (err) { console.error(err); }
    };
    fetchMembers();
  }, [currentUser.id]);

  const handleViewAttendance = async (member) => {
    setSelectedMember(member);
    try {
      const now = new Date();
      const { data } = await api.get(`/reports/member/${member._id}/${now.getMonth() + 1}/${now.getFullYear()}`);
      if (data.success) setMemberStats(data);
    } catch (err) { showToast('Failed to fetch attendance', 'error'); }
  };

  const removeMember = async (id) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      const { data } = await api.delete(`/members/${id}`);
      if (data.success) {
        showToast('Member removed');
        setMembers(members.filter(m => m._id !== id));
      }
    } catch (err) { showToast('Delete failed', 'error'); }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Member <span className="gradient-text">Management</span></h1><p>View and manage your gym members</p></div>
        <input 
          type="text" placeholder="Search members..." className="input-field" 
          style={{ maxWidth: '300px', marginBottom: 0 }}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </header>

      {selectedMember ? (
        <div className="glass-card animate-fade-in">
          <button className="primary-btn" style={{ background: 'rgba(255,255,255,0.05)', marginBottom: '1.5rem' }} onClick={() => setSelectedMember(null)}>← Back to List</button>
          <h2>{selectedMember.name}'s Attendance</h2>
          {memberStats && (
            <div style={{ marginTop: '1rem' }}>
               <div style={{ display: 'flex', gap: '20px', marginBottom: '1.5rem' }}>
                  <div className="glass" style={{ padding: '15px 25px', borderRadius: '15px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Workouts: </span>
                    <span style={{ fontWeight: '800' }}>{memberStats.daysAttended}</span>
                  </div>
                  <div className="glass" style={{ padding: '15px 25px', borderRadius: '15px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Hours: </span>
                    <span style={{ fontWeight: '800' }}>{memberStats.totalHours}h</span>
                  </div>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const isAttended = memberStats.attendedDays?.includes(day);
                    return (
                      <div key={day} style={{ 
                        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isAttended ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                        borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {isAttended ? '✅' : <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.1)' }}>{day}</span>}
                      </div>
                    );
                  })}
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '15px' }}>Name</th>
                  <th style={{ padding: '15px' }}>Email</th>
                  <th style={{ padding: '15px' }}>Status</th>
                  <th style={{ padding: '15px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(m => (
                  <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '15px' }}>{m.name}</td>
                    <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{m.email}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', background: m.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: m.status === 'active' ? 'var(--success)' : 'var(--warning)' }}>
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                      <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleViewAttendance(m)}>📅 Stats</button>
                      <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} onClick={() => removeMember(m._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};
