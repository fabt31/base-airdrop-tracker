import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL ?? 'https://base-airdrop-tracker.vercel.app'

  return NextResponse.json({
    accountAssociation: {
      // À remplir via Warpcast Developer Portal après déploiement
      header: '',
      payload: '',
      signature: '',
    },
    frame: {
      version: '1',
      name: 'Base Airdrop Tracker',
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/og`,
      buttonTitle: 'Checker mon score',
      splashImageUrl: `${appUrl}/og`,
      splashBackgroundColor: '#0052FF',
    },
  })
}
