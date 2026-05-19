import { FarcasterUser } from './types'

// Neynar (utilisé si clé disponible, plus complet)
const NEYNAR_BASE = 'https://api.neynar.com/v2'

/**
 * Résout l'adresse ETH → profil Farcaster via web3.bio.
 * API publique, sans clé, accessible server-side.
 * Couvre custody + verified + primary addresses.
 */
async function getFarcasterFromWeb3Bio(address: string): Promise<FarcasterUser | null> {
  try {
    const res = await fetch(
      `https://api.web3.bio/profile/${address.toLowerCase()}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 300 } }
    )
    if (!res.ok) return null
    const profiles: any[] = await res.json()
    if (!Array.isArray(profiles)) return null

    const fc = profiles.find((p: any) => p.platform === 'farcaster')
    if (!fc) return null

    return {
      fid: fc.social?.uid ?? 0,
      username: fc.identity ?? '',
      displayName: fc.displayName ?? '',
      pfpUrl: fc.avatar ?? '',
      followerCount: fc.social?.follower ?? 0,
      followingCount: fc.social?.following ?? 0,
      castCount: 0,
      bio: fc.description ?? '',
      verifiedAddresses: [address],
    }
  } catch {
    return null
  }
}

export async function getFarcasterUser(address: string, knownFid?: number): Promise<FarcasterUser | null> {
  try {
    // 1. Neynar (si clé dispo) — lookup direct par adresse, le plus complet
    const apiKey = process.env.NEYNAR_API_KEY
    if (apiKey) {
      const res = await fetch(
        `${NEYNAR_BASE}/farcaster/user/bulk-by-address?addresses=${address}`,
        { headers: { 'x-api-key': apiKey, 'accept': 'application/json' }, next: { revalidate: 300 } }
      )
      if (res.ok) {
        const data = await res.json()
        const user = data[address.toLowerCase()]?.[0]
        if (user) return mapNeynarUser(user)
      }
    }

    // 2. web3.bio — API publique, pas de clé, couvre verified + custody + primary
    //    Retourne FID, username, followers/following directement
    const web3BioUser = await getFarcasterFromWeb3Bio(address)
    if (web3BioUser) return web3BioUser

    // 3. Fallback : si FID fourni depuis sdk.context, lookup Neynar demo
    if (knownFid) {
      try {
        const res = await fetch(
          `${NEYNAR_BASE}/farcaster/user/bulk?fids=${knownFid}`,
          { headers: { 'x-api-key': 'NEYNAR_API_DOCS', 'accept': 'application/json' }, next: { revalidate: 300 } }
        )
        if (res.ok) {
          const data = await res.json()
          const user = data.users?.[0]
          if (user) return mapNeynarUser(user)
        }
      } catch { /* ignoré */ }
    }

    return null
  } catch {
    return null
  }
}

function mapNeynarUser(user: any): FarcasterUser {
  return {
    fid: user.fid,
    username: user.username,
    displayName: user.display_name,
    pfpUrl: user.pfp_url,
    followerCount: user.follower_count ?? 0,
    followingCount: user.following_count ?? 0,
    castCount: user.cast_count ?? 0,
    bio: user.profile?.bio?.text ?? '',
    verifiedAddresses: user.verified_addresses?.eth_addresses ?? [],
  }
}
