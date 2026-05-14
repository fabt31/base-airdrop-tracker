import { AirdropScore, CriteriaBreakdown, CriterionResult, OnchainData, FarcasterUser } from './types'
import { TalentData } from './talent'

// Poids de chaque critère (total = 9.0)
const WEIGHTS = {
  onchainActivity: 1.5,
  deFiUsage: 1.5,
  nftActivity: 0.75,
  builderScore: 1.0,
  farcasterEngagement: 1.0,
  walletAge: 0.75,
  baseNative: 1.0,
  socialGraph: 0.75,
  consistency: 0.75,
}
const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)

function criterion(
  label: string,
  score: number,
  weight: number,
  detail: string
): CriterionResult {
  const clamp = Math.min(1, Math.max(0, score))
  return {
    label,
    score: clamp,
    weight,
    points: Math.round((clamp * weight / TOTAL_WEIGHT) * 1000),
    detail,
  }
}

function normalize(value: number, max: number): number {
  return Math.min(1, value / max)
}

export function computeScore(
  address: string,
  onchain: OnchainData,
  farcaster: FarcasterUser | null,
  talent: TalentData
): AirdropScore {
  const now = Date.now() / 1000
  const walletAgeSeconds = now - onchain.firstTxTimestamp
  const walletAgeMonths = walletAgeSeconds / (30 * 24 * 3600)

  const criteria: CriteriaBreakdown = {
    // 1. Activité on-chain générale (max 500 txs = score 1.0)
    onchainActivity: criterion(
      'Activité on-chain',
      normalize(onchain.txCount, 500),
      WEIGHTS.onchainActivity,
      `${onchain.txCount} transactions sur Base`
    ),

    // 2. Usage DeFi (max 100 interactions = 1.0)
    deFiUsage: criterion(
      'Usage DeFi',
      normalize(onchain.defiTxCount, 100),
      WEIGHTS.deFiUsage,
      `${onchain.defiTxCount} interactions DeFi (swaps, LPs...)`
    ),

    // 3. NFT (max 50 txs = 1.0)
    nftActivity: criterion(
      'NFT',
      normalize(onchain.nftTxCount, 50),
      WEIGHTS.nftActivity,
      `${onchain.nftTxCount} transactions NFT sur Base`
    ),

    // 4. Builder Score Talent Protocol (0–100 → 0–1)
    builderScore: criterion(
      'Builder Score',
      normalize(talent.builderScore, 100),
      WEIGHTS.builderScore,
      `Score ${talent.builderScore}/100 sur Talent Protocol`
    ),

    // 5. Engagement Farcaster (max 1000 followers = 1.0)
    farcasterEngagement: criterion(
      'Farcaster',
      farcaster ? normalize(farcaster.followerCount, 1000) : 0,
      WEIGHTS.farcasterEngagement,
      farcaster
        ? `${farcaster.followerCount} followers · ${farcaster.castCount} casts`
        : 'Pas de compte Farcaster détecté'
    ),

    // 6. Ancienneté wallet (max 24 mois = 1.0)
    walletAge: criterion(
      'Ancienneté wallet',
      normalize(walletAgeMonths, 24),
      WEIGHTS.walletAge,
      `${Math.round(walletAgeMonths)} mois d'activité sur Base`
    ),

    // 7. Base-native (ratio activité Base, déjà 1.0 car Basescan)
    baseNative: criterion(
      'Base natif',
      onchain.baseRatio,
      WEIGHTS.baseNative,
      `${Math.round(onchain.baseRatio * 100)}% de l'activité sur Base`
    ),

    // 8. Réseau social (qualité : ratio followers/following, max 5 = 1.0)
    socialGraph: criterion(
      'Réseau social',
      farcaster && farcaster.followingCount > 0
        ? normalize(farcaster.followerCount / farcaster.followingCount, 5)
        : 0,
      WEIGHTS.socialGraph,
      farcaster
        ? `Ratio ${(farcaster.followerCount / Math.max(1, farcaster.followingCount)).toFixed(1)} (followers/following)`
        : 'N/A'
    ),

    // 9. Régularité (mois actifs, max 12 = 1.0)
    consistency: criterion(
      'Régularité',
      normalize(onchain.activeMonths, 12),
      WEIGHTS.consistency,
      `Actif ${onchain.activeMonths} mois distincts`
    ),
  }

  const total = Object.values(criteria).reduce((sum, c) => sum + c.points, 0)

  return {
    total: Math.min(1000, total),
    address,
    fid: farcaster?.fid,
    criteria,
    lastUpdated: new Date().toISOString(),
  }
}
