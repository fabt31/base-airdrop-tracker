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
    // Clé frame : compatibilité Warpcast
    frame: {
      version: '1',
      name: 'Base Airdrop Tracker',
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/og`,
      buttonTitle: 'Checker mon score',
      splashImageUrl: `${appUrl}/splash`,
      splashBackgroundColor: '#0052FF',
    },
    // Clé miniapp : champs étendus pour la Base app
    miniapp: {
      version: '1',
      name: 'Base Airdrop Tracker',
      subtitle: 'Score d\'éligibilité airdrop Base',
      description: 'Checke ton score d\'éligibilité à un éventuel airdrop Base en 10 critères : activité on-chain, DeFi, NFT, ancienneté wallet, Farcaster, Talent Protocol Builder Score, Basename et plus.',
      tagline: 'Ton score d\'éligibilité airdrop Base en 10 critères',
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      splashImageUrl: `${appUrl}/splash`,
      splashBackgroundColor: '#0052FF',
      heroImageUrl: `${appUrl}/og`,
      screenshotUrls: [`${appUrl}/screenshot`],
      primaryCategory: 'finance',
      tags: ['base', 'airdrop', 'defi', 'farcaster', 'score', 'onchain'],
      ogTitle: 'Base Airdrop Tracker',
      ogDescription: 'Calcule ton score d\'éligibilité airdrop Base en 10 critères on-chain',
      ogImageUrl: `${appUrl}/og`,
    },
  })
}
