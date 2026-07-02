'use client';
import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const mockPatients = [
  { id: 1, name: 'Ashwin K.', surgeryDate: '2026-06-15', status: 'On Track', color: 'var(--neon-green)' },
  { id: 2, name: 'Sarah M.', surgeryDate: '2026-06-02', status: 'Needs Review', color: 'var(--neon-pink)' },
  { id: 3, name: 'David R.', surgeryDate: '2026-05-20', status: 'Excellent', color: 'var(--neon-green)' },
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
        <h2>Doctor Dashboard</h2>
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
                  background: selectedPatient.id === patient.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: `1px solid ${selectedPatient.id === patient.id ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{patient.name}</span>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: patient.color, marginTop: '4px' }}></span>
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
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Latest Session Max Flexion</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--neon-green)' }}>{latestSession}</div>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Sessions</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{patientSessions.length}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column' }}>
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
                      <div style={{ fontSize: '0.8rem', color: idx === patientSessions.slice(-7).length - 1 ? 'var(--neon-green)' : 'var(--text-secondary)' }}>
                        {flexionVal}°
                      </div>
                      <div style={{ 
                        width: '40px', 
                        height: `${height}px`, 
                        background: idx === patientSessions.slice(-7).length - 1 ? 'var(--neon-green)' : 'rgba(255,255,255,0.2)', 
                        borderRadius: '4px',
                        boxShadow: idx === patientSessions.slice(-7).length - 1 ? '0 0 15px rgba(0,255,170,0.3)' : 'none',
                        transition: 'all 0.5s ease-out'
                      }}></div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Interactive Session History List */}
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '1.5rem', marginTop: '1rem' }}>
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
                      background: index === 0 ? 'rgba(0, 255, 170, 0.1)' : 'rgba(255,255,255,0.05)',
                      padding: '1rem',
                      borderRadius: '8px',
                      borderLeft: index === 0 ? '4px solid var(--neon-green)' : '4px solid transparent',
                      transition: 'all 0.3s ease'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: index === 0 ? '#FFF' : 'var(--text-secondary)' }}>
                          Session #{patientSessions.length - index}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                          {dateStr !== 'Invalid Date' ? dateStr : 'Just now'}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: index === 0 ? 'var(--neon-green)' : '#FFF' }}>
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
