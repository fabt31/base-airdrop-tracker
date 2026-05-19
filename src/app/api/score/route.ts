import { NextRequest, NextResponse } from 'next/server'
import { getOnchainData } from '@/lib/basescan'
import { getFarcasterUser } from '@/lib/neynar'
import { getTalentData } from '@/lib/talent'
import { computeScore } from '@/lib/score'

export const runtime = 'nodejs'
export const revalidate = 300  // cache 5 min

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  const fidParam = req.nextUrl.searchParams.get('fid')
  const fid = fidParam ? parseInt(fidParam, 10) : undefined

  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json(
      { error: 'Adresse Ethereum invalide' },
      { status: 400 }
    )
  }

  try {
    const [onchain, farcaster, talent] = await Promise.all([
      getOnchainData(address),
      getFarcasterUser(address, fid),
      getTalentData(address),
    ])

    const score = computeScore(address, onchain, farcaster, talent)
    return NextResponse.json(score)
  } catch (err) {
    console.error('[/api/score]', err)
    return NextResponse.json(
      { error: 'Erreur lors du calcul du score' },
      { status: 500 }
    )
  }
}
