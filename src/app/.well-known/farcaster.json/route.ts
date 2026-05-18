import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL ?? 'https://base-airdrop-tracker.vercel.app'

  return NextResponse.json({
    accountAssociation: {
      header: 'eyJmaWQiOjQ5NTgyMiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxNjQ2QmZlM2ZGYzdBOEY5MzFjMmY2ZkY5NGVhZEVhMzEzMTU0RTEifQ',
      payload: 'eyJkb21haW4iOiJiYXNlLWFpcmRyb3AtdHJhY2tlci52ZXJjZWwuYXBwIn0',
      signature: '9fLRdAn59z8XgAmGZkK2hVOGn2oyJS5YeEu0n5n8TK47bdrnhLWyREvpxFg10UAETPzcAlhYfuZT5CTAMgzLhRs=',
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
