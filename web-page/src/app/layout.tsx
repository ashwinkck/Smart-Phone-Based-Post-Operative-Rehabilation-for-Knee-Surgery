import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kineo | Next-Generation Clinical Knee Tracking',
  description: 'Real-time AI pose estimation for post-operative rehabilitation. Track knee flexion directly on-device with zero cloud processing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="glass-nav">
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Kineo<span style={{ color: 'var(--neon-pink)' }}>.</span>
          </Link>
          <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link href="/" style={{ fontWeight: 600 }}>Home</Link>
            <Link href="/doctor" style={{ fontWeight: 600 }}>Doctor Portal</Link>
            <a href="/kineo.apk" download className="btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}>
              Download App
            </a>
          </div>
        </nav>
        <main style={{ paddingTop: '80px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
