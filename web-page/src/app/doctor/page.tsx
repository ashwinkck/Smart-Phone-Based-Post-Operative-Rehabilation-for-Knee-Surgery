'use client';
import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const mockPatients = [
  { id: 1, name: 'Ashwin K.', surgeryDate: '2026-06-15', status: 'On Track', color: 'var(--neon-blue)' },
  { id: 2, name: 'Sarah M.', surgeryDate: '2026-06-02', status: 'Needs Review', color: 'var(--text-secondary)' },
  { id: 3, name: 'David R.', surgeryDate: '2026-05-20', status: 'Excellent', color: '#ffffff' },
];

export default function DoctorDashboard() {
  const [selectedPatient, setSelectedPatient] = useState(mockPatients[0]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    // Listen for new sessions in real-time
    const q = query(collection(db, 'sessions'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionData);
    });
    return () => unsubscribe();
  }, []);

  const patientSessions = sessions.filter(s => s.patientId === selectedPatient.id);
  const latestSession = patientSessions.length > 0 ? patientSessions[patientSessions.length - 1].maxFlexion : 'No Data Yet';

  return (
    <div className="container" style={{ padding: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.3s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img src="/logo.png" alt="Kineo Logo" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'contain' }} />
          <h2 style={{ margin: 0 }} className="text-gradient">Kineo.</h2>
        </div>
        <div style={{ background: 'var(--bg-panel)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
          Logged in as Dr. Smith
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Patient List Sidebar */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>My Patients</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mockPatients.map((patient) => (
              <div 
                key={patient.id} 
                onClick={() => setSelectedPatient(patient)}
                style={{ 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  background: selectedPatient.id === patient.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: `1px solid ${selectedPatient.id === patient.id ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem', color: selectedPatient.id === patient.id ? '#ffffff' : 'var(--text-secondary)' }}>{patient.name}</span>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: patient.color, marginTop: '4px', boxShadow: `0 0 8px ${patient.color}` }}></span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Surgery: {patient.surgeryDate}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Main View */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>{selectedPatient.name}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Status: <span style={{ color: selectedPatient.color, fontWeight: 600 }}>{selectedPatient.status}</span></p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Latest Session Max Flexion</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--neon-blue)', textShadow: '0 0 10px rgba(0,229,255,0.3)' }}>{latestSession}</div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Sessions</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ffffff' }}>{patientSessions.length}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Flexion progression (up to last 7 sessions)</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '2rem', padding: '1.5rem', justifyContent: 'center' }}>
              {/* Dynamic Bar Chart */}
              {patientSessions.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>Waiting for first session...</p>
              ) : (
                patientSessions.slice(-7).map((s, idx) => {
                  const flexionVal = parseInt(s.maxFlexion) || 0;
                  const height = Math.min(100, Math.max(10, (flexionVal / 180) * 100));
                  return (
                    <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', color: idx === patientSessions.slice(-7).length - 1 ? 'var(--neon-blue)' : 'var(--text-secondary)' }}>
                        {flexionVal}°
                      </div>
                      <div style={{ 
                        width: '40px', 
                        height: `${height}px`, 
                        background: idx === patientSessions.slice(-7).length - 1 ? 'var(--neon-blue)' : 'rgba(255,255,255,0.15)', 
                        borderRadius: '4px',
                        boxShadow: idx === patientSessions.slice(-7).length - 1 ? '0 0 15px rgba(0,229,255,0.4)' : 'none',
                        transition: 'all 0.5s ease-out'
                      }}></div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Interactive Session History List */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '1.5rem', marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Session History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
              {patientSessions.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No history available yet.</p>
              ) : (
                [...patientSessions].reverse().map((session, index) => {
                  const dateStr = session.timestamp?.toDate ? session.timestamp.toDate().toLocaleString() : new Date(session.timestamp?.seconds * 1000).toLocaleString();
                  return (
                    <div key={session.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: index === 0 ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255,255,255,0.03)',
                      padding: '1rem',
                      borderRadius: '8px',
                      borderLeft: index === 0 ? '4px solid var(--neon-blue)' : '4px solid transparent',
                      transition: 'all 0.3s ease'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: index === 0 ? '#ffffff' : 'var(--text-secondary)' }}>
                          Session #{patientSessions.length - index}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                          {dateStr !== 'Invalid Date' ? dateStr : 'Just now'}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: index === 0 ? 'var(--neon-blue)' : '#ffffff' }}>
                        {session.maxFlexion}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
