import { FarcasterUser } from './types'

// Registre public des FIDs Farcaster — gratuit, sans clé
const FNAMES_API = 'https://fnames.farcaster.xyz'
// API publique Warpcast — gratuite, sans clé
const WARPCAST_API = 'https://api.warpcast.com/v2'
// Neynar (fallback si clé disponible)
const NEYNAR_BASE = 'https://api.neynar.com/v2'

export async function getFarcasterUser(address: string): Promise<FarcasterUser | null> {
  try {
    // 1. Si une clé Neynar est dispo, on l'utilise (plus complète)
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

    // 2. Fallback gratuit : fnames.farcaster.xyz → Warpcast
    const fnamesRes = await fetch(
      `${FNAMES_API}/transfers?to=${address}`,
      { next: { revalidate: 300 } }
    )
    if (!fnamesRes.ok) return null
    const fnamesData = await fnamesRes.json()

    // IMPORTANT: l'API fnames ignore le filtre si l'adresse n'existe pas et retourne
    // tous les transfers. On vérifie que le transfer appartient bien à notre adresse.
    const addrLower = address.toLowerCase()
    const matchedTransfer = (fnamesData.transfers ?? []).find(
      (t: any) => t.owner?.toLowerCase() === addrLower
    )
    const fid = matchedTransfer?.to
    if (!fid) return null

    const warpRes = await fetch(
      `${WARPCAST_API}/user?fid=${fid}`,
      { next: { revalidate: 300 } }
    )
    if (!warpRes.ok) return null
    const warpData = await warpRes.json()
    const user = warpData.result?.user
    if (!user) return null

    return {
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfp?.url ?? '',
      followerCount: user.followerCount ?? 0,
      followingCount: user.followingCount ?? 0,
      castCount: user.activeOnFcNetwork ? 1 : 0,
      bio: user.profile?.bio?.text ?? '',
      verifiedAddresses: [address],
    }
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
