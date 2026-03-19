import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { QrScanner } from '../components/Shared';

export const MemberDashboard = ({ currentUser, showToast, Layout, dashboardStyles }) => {
  const [stats, setStats] = useState({ daysAttended: 0, totalHours: 0, feesPaid: false, feesAmount: 0 });
  const [scanConfig, setScanConfig] = useState({ show: false, action: null });

  useEffect(() => {
    const fetchMemberStats = async () => {
      try {
        const now = new Date();
        const { data } = await api.get(`/reports/member/${currentUser.id}/${now.getMonth() + 1}/${now.getFullYear()}`);
        if (data.success) setStats(data);
      } catch (err) { console.error('Failed to fetch stats:', err); }
    };
    fetchMemberStats();
  }, []);

  const handleMemberScan = async (scannedData) => {
    const action = scanConfig.action;
    setScanConfig({ show: false, action: null });
    try {
      let scannedId = scannedData;
      let forcedAction = action;
      if (scannedData.includes(':')) {
         const [qrAction, qrId] = scannedData.split(':');
         scannedId = qrId;
         if (!forcedAction) forcedAction = qrAction;
      }
      const { data } = await api.post('/attendance/scan', { scannedId, action: forcedAction });
      if (data.success) showToast(data.message, data.type === 'checkin' ? 'success' : 'info');
    } catch (err) { showToast(err.response?.data?.message || 'Scanning failed', 'error'); }
  };

  const showMyQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${currentUser.id}`;
    const win = window.open("", "My QR Code", "width=400,height=500");
    win.document.write(`<div style="text-align:center; padding:50px; background:#0f172a; color:white; height:100vh; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <h2 style="color:#6366f1;">My Personal QR</h2>
      <div style="background:white; padding:15px; border-radius:15px; margin:20px 0;"><img src="${qrUrl}" /></div>
      <h3>${currentUser.name}</h3>
    </div>`);
  };

  const memberStatCards = [
    { label: 'Workouts', value: stats.daysAttended, icon: '🔥', color: 'var(--primary)' },
    { label: 'Total Hours', value: `${stats.totalHours}h`, icon: '⏱️', color: 'var(--success)' },
    { label: 'Status', value: stats.feesPaid ? 'Active' : 'Due', icon: '💳', color: stats.feesPaid ? 'var(--success)' : 'var(--warning)' },
    { label: 'Fees', value: `₹${stats.feesAmount}`, icon: '💰', color: 'var(--accent)' },
  ];

  const AttendanceGrid = () => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const today = new Date().getDate();
    const attended = stats.attendedDays || [];

    return (
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📅 Attendance History <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({new Date().toLocaleString('default', { month: 'long' })})</span>
        </h2>
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' 
        }}>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const isAttended = attended.includes(day);
            const isPast = day < today;
            const isToday = day === today;

            return (
              <div key={day} style={{
                aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: isAttended ? 'rgba(16, 185, 129, 0.1)' : isPast ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: '12px', border: isToday ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                position: 'relative'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', position: 'absolute', top: '5px', left: '5px' }}>{day}</span>
                <span style={{ fontSize: '1.2rem' }}>
                  {isAttended ? '✅' : isPast ? '❌' : '⏺️'}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>✅ Present</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>❌ Absent</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>⏺️ Upcoming</span>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      {scanConfig.show && <QrScanner onScan={handleMemberScan} onClose={() => setScanConfig({ show: false, action: null })} />}
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>Hello, <span className="gradient-text">{currentUser.name}</span>!</h1><p>{currentUser.gymName}</p></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="primary-btn" style={{ width: 'auto', background: 'rgba(255,255,255,0.05)' }} onClick={showMyQR}>🆔 My QR</button>
          <button className="primary-btn" style={{ width: 'auto', background: 'var(--success)' }} onClick={() => setScanConfig({ show: true, action: 'checkin' })}>📥 Scan In</button>
          <button className="primary-btn" style={{ width: 'auto', background: 'var(--warning)' }} onClick={() => setScanConfig({ show: true, action: 'checkout' })}>📤 Scan Out</button>
        </div>
      </header>
      <div style={dashboardStyles.grid}>
        {memberStatCards.map((card, i) => (
          <div key={i} className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{card.icon}</div>
            <h3 style={{ color: 'var(--text-muted)' }}>{card.label}</h3>
            <p style={{ fontSize: '2.2rem', fontWeight: '800', color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>
      <AttendanceGrid />
    </Layout>
  );
};
