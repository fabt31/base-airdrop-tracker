import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const revalidate = 300

const NEYNAR_BASE = 'https://api.neynar.com/v2'
const WARPCAST_API = 'https://api.warpcast.com/v2'

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get('fid')
  if (!fid || isNaN(Number(fid))) {
    return NextResponse.json({ error: 'FID invalide' }, { status: 400 })
  }

  // 1. Neynar (si clé dispo) — retourne primary ETH + all verified addresses
  const apiKey = process.env.NEYNAR_API_KEY
  if (apiKey) {
    try {
      const res = await fetch(
        `${NEYNAR_BASE}/farcaster/user/bulk?fids=${fid}`,
        {
          headers: { 'x-api-key': apiKey, accept: 'application/json' },
          next: { revalidate: 300 },
        }
      )
      if (res.ok) {
        const data = await res.json()
        const user = data.users?.[0]
        if (user) {
          return NextResponse.json({
            fid: user.fid,
            username: user.username,
            displayName: user.display_name,
            primaryAddress:
              user.verified_addresses?.primary?.eth_address ??
              user.custody_address ??
              null,
            verifiedAddresses: user.verified_addresses?.eth_addresses ?? [],
            custodyAddress: user.custody_address ?? null,
          })
        }
      }
    } catch {
      // fall through
    }
  }

  // 2. Fallback : Warpcast API verifications (pas de clé requise)
  try {
    const [verificationsRes, userRes] = await Promise.all([
      fetch(`${WARPCAST_API}/verifications?fid=${fid}`, {
        next: { revalidate: 300 },
      }),
      fetch(`${WARPCAST_API}/user?fid=${fid}`, {
        next: { revalidate: 300 },
      }),
    ])

    const verifications: string[] = verificationsRes.ok
      ? ((await verificationsRes.json()).result?.verifications ?? [])
      : []

    const warpUser = userRes.ok
      ? (await userRes.json()).result?.user
      : null

    const custodyAddress = warpUser
      ? (warpUser.custodyAddress ?? warpUser.custody_address ?? null)
      : null

    // Adresse primaire = première verified, sinon custody
    const primaryAddress = verifications[0] ?? custodyAddress ?? null

    return NextResponse.json({
      fid: Number(fid),
      username: warpUser?.username ?? null,
      displayName: warpUser?.displayName ?? null,
      primaryAddress,
      verifiedAddresses: verifications,
      custodyAddress,
    })
  } catch {
    return NextResponse.json({
      fid: Number(fid),
      primaryAddress: null,
      verifiedAddresses: [],
      custodyAddress: null,
    })
  }
}
