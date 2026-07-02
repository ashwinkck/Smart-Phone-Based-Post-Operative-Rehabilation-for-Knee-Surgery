'use client';
import { useState } from 'react';

const mockPatients = [
  { id: 1, name: 'Ashwin K.', surgeryDate: '2026-06-15', status: 'On Track', lastSession: '146° Flexion', color: 'var(--neon-green)' },
  { id: 2, name: 'Sarah M.', surgeryDate: '2026-06-02', status: 'Needs Review', lastSession: '85° Flexion', color: 'var(--neon-pink)' },
  { id: 3, name: 'David R.', surgeryDate: '2026-05-20', status: 'Excellent', lastSession: '160° Flexion', color: 'var(--neon-green)' },
];

export default function DoctorDashboard() {
  const [selectedPatient, setSelectedPatient] = useState(mockPatients[0]);

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
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--neon-green)' }}>{selectedPatient.lastSession}</div>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Sessions</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>14</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-glass)', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '2rem', padding: '1rem' }}>
              {/* Mock Bar Chart */}
              <div style={{ width: '40px', height: '60%', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}></div>
              <div style={{ width: '40px', height: '70%', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}></div>
              <div style={{ width: '40px', height: '85%', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}></div>
              <div style={{ width: '40px', height: '90%', background: 'var(--neon-green)', borderRadius: '4px', boxShadow: '0 0 15px rgba(0,255,170,0.3)' }}></div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Flexion progression over the last 4 days</p>
          </div>

        </div>
      </div>
    </div>
  );
}
