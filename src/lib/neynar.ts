import { FarcasterUser } from './types'

const NEYNAR_BASE = 'https://api.neynar.com/v2'

export async function getFarcasterUser(addressOrFid: string): Promise<FarcasterUser | null> {
  const apiKey = process.env.NEYNAR_API_KEY
  if (!apiKey) return null

  try {
    // Cherche par adresse ETH d'abord
    const isAddress = addressOrFid.startsWith('0x')
    const url = isAddress
      ? `${NEYNAR_BASE}/farcaster/user/bulk-by-address?addresses=${addressOrFid}`
      : `${NEYNAR_BASE}/farcaster/user/bulk?fids=${addressOrFid}`

    const res = await fetch(url, {
      headers: { 'x-api-key': apiKey, 'accept': 'application/json' },
      next: { revalidate: 300 },
    })

    if (!res.ok) return null
    const data = await res.json()

    let user: any = null
    if (isAddress) {
      const users = data[addressOrFid.toLowerCase()]
      user = users?.[0]
    } else {
      user = data.users?.[0]
    }

    if (!user) return null

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
  } catch {
    return null
  }
}
