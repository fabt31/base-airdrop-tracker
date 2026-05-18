import { FarcasterUser } from './types'

// API publique Warpcast — gratuite, sans clé
const WARPCAST_API = 'https://api.warpcast.com/v2'
// Farcaster IdRegistry sur Optimism Mainnet
// Source: https://docs.farcaster.xyz/reference/contracts/reference/id-registry
const FARCASTER_ID_REGISTRY = '0x00000000Fc6c5F01Fc30151999387Bb99A9f489b'
const OP_RPC = 'https://mainnet.optimism.io'
// Neynar (utilisé si clé disponible, plus complet)
const NEYNAR_BASE = 'https://api.neynar.com/v2'

// keccak256("idOf(address)")[0:4] = 0xd94fe832
const ID_OF_SELECTOR = '0xd94fe832'

/**
 * Résout l'adresse ETH → FID Farcaster via le contrat IdRegistry sur Optimism.
 * Retourne 0 si l'adresse n'est pas custody d'un FID.
 */
async function getFidByAddress(address: string): Promise<number> {
  try {
    const padded = address.slice(2).toLowerCase().padStart(64, '0')
    const calldata = `${ID_OF_SELECTOR}${padded}`

    const res = await fetch(OP_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: FARCASTER_ID_REGISTRY, data: calldata }, 'latest'],
        id: 1,
      }),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return 0
    const data = await res.json()
    if (data.error) return 0
    return parseInt(data.result ?? '0x0', 16)
  } catch {
    return 0
  }
}

export async function getFarcasterUser(address: string): Promise<FarcasterUser | null> {
  try {
    // 1. Si clé Neynar disponible, lookup direct par adresse (plus complet, vérifie custody + verified)
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

    // 2. Fallback gratuit : IdRegistry on-chain (Optimism) → FID → Warpcast
    // Note : uniquement les adresses custody. Les adresses "verified" ne sont pas indexées on-chain.
    const fid = await getFidByAddress(address)
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
      castCount: 0, // Non exposé par l'API Warpcast publique
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
