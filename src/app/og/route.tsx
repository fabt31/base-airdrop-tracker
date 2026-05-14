import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const score = searchParams.get('score') ?? '---'
  const address = searchParams.get('address') ?? ''
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A0A0A 0%, #001133 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Base logo */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#0052FF', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 32, color: 'white', fontWeight: 'bold',
          marginBottom: 16,
        }}>B</div>

        <p style={{ color: '#6b7280', fontSize: 18, margin: '0 0 8px' }}>Base Airdrop Tracker</p>

        <div style={{
          fontSize: 96, fontWeight: 900, color: 'white',
          lineHeight: 1,
        }}>{score}</div>
        <div style={{ color: '#6b7280', fontSize: 24 }}>/ 1000</div>

        {short && (
          <div style={{
            marginTop: 24, background: '#1f2937',
            borderRadius: 12, padding: '8px 20px',
            color: '#9ca3af', fontSize: 16, fontFamily: 'monospace',
          }}>{short}</div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
