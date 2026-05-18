import { ImageResponse } from 'next/og'

export const runtime = 'edge'

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
          justifyContent: 'center',
          background: '#0052FF',
        }}
      >
        {/* White "B" circle */}
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 72,
          fontWeight: 900,
          color: '#0052FF',
          marginBottom: 24,
        }}>B</div>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'white',
          fontFamily: 'sans-serif',
          letterSpacing: '-0.5px',
        }}>Base Airdrop Tracker</div>
      </div>
    ),
    { width: 400, height: 400 }
  )
}
