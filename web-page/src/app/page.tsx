export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="container flex-center" style={{ minHeight: '80vh', flexDirection: 'column', textAlign: 'center', gap: '2rem' }}>
        <div style={{ padding: '0.5rem 1rem', background: 'rgba(0,255,170,0.1)', border: '1px solid var(--neon-green)', borderRadius: '100px', color: 'var(--neon-green)', fontWeight: 600, fontSize: '0.9rem' }}>
          Introducing Kineo v1.0
        </div>
        
        <h1 style={{ maxWidth: '800px' }}>
          The Future of Clinical <br/>
          <span className="text-gradient">Knee Rehabilitation</span>
        </h1>
        
        <p style={{ maxWidth: '600px', fontSize: '1.2rem', margin: '0 auto' }}>
          Real-time AI pose estimation that transforms your smartphone into a clinical-grade goniometer. Track post-operative knee flexion accurately and effortlessly.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <a href="/kineo.apk" download className="btn-primary">
            Download for Android
          </a>
          <a href="/doctor" className="btn-secondary">
            Doctor Portal
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="container" style={{ padding: '5rem 0' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '4rem' }}>Clinical-Grade Tracking, <br/>On Your Device</h2>
        
        <div className="grid-2">
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--neon-green)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Zero Latency AI</h3>
            <p>
              Powered by an optimized YOLOv8 neural network running directly on your smartphone's GPU. No cloud processing, no delays, complete privacy.
            </p>
          </div>
          
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--neon-pink)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Clinical Flexion Protocol</h3>
            <p>
              Automatically calculates internal and clinical knee angles. Instantly differentiate between a straight leg (0°) and full flexion with advanced stabilization algorithms.
            </p>
          </div>
          
          <div className="glass-panel" style={{ borderLeft: '4px solid #fff' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Physician Syncing</h3>
            <p>
              Kineo seamlessly integrates with the Doctor Portal, allowing orthopedic surgeons to monitor daily rehabilitation progress remotely.
            </p>
          </div>

          <div className="glass-panel" style={{ borderLeft: '4px solid var(--neon-green)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Hardware Required</h3>
            <p>
              Ditch the expensive wearables and manual goniometers. All you need is the Kineo Android app and a clear view of your leg.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
