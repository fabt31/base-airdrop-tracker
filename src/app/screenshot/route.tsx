import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Portrait 9:16 screenshot pour Base app store listing
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#0A0A0A',
          fontFamily: 'sans-serif',
          padding: '60px 48px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#0052FF', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: 'white', fontWeight: 'bold',
          }}>B</div>
          <span style={{ color: 'white', fontSize: 28, fontWeight: 700 }}>Base Airdrop Tracker</span>
        </div>

        {/* Score ring mockup */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#111827', borderRadius: 24,
          padding: '48px 64px', marginBottom: 32, width: '100%',
        }}>
          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            border: '14px solid #0052FF',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <span style={{ color: 'white', fontSize: 52, fontWeight: 900, lineHeight: 1 }}>742</span>
            <span style={{ color: '#6b7280', fontSize: 18 }}>/ 1000</span>
          </div>
          <span style={{ color: '#3b82f6', fontSize: 22, fontWeight: 700 }}>⚡ Power User</span>
        </div>

        {/* Criteria bars mockup */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: '#111827', borderRadius: 24,
          padding: '32px', width: '100%', gap: 20,
        }}>
          {[
            { label: 'Activité on-chain', pct: 85 },
            { label: 'Usage DeFi', pct: 60 },
            { label: 'Farcaster', pct: 70 },
            { label: 'Builder Score', pct: 45 },
            { label: 'ENS / Basename', pct: 100 },
          ].map(({ label, pct }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#d1d5db', fontSize: 18 }}>{label}</span>
                <span style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>
                  +{Math.round(pct * 0.8)} pts
                </span>
              </div>
              <div style={{
                width: '100%', height: 8, background: '#1f2937', borderRadius: 99,
                display: 'flex',
              }}>
                <div style={{
                  width: `${pct}%`, height: 8,
                  background: '#0052FF', borderRadius: 99,
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 'auto', paddingTop: 32,
          color: '#4b5563', fontSize: 16, textAlign: 'center',
        }}>
          base-airdrop-tracker.vercel.app
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
