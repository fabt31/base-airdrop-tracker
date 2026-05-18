import { AirdropScore, CriteriaBreakdown, CriterionResult, OnchainData, FarcasterUser } from './types'
import { TalentData } from './talent'

// Poids de chaque critère (total = 9.5)
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
  ensOrBasename: 0.5,
}
const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0) // 9.5

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
    // Points individuels pour l'affichage (arrondis)
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
    // 1. Activité on-chain générale (max 500 txs = 1.0)
    onchainActivity: criterion(
      'Activité on-chain',
      normalize(onchain.txCount, 500),
      WEIGHTS.onchainActivity,
      `${onchain.txCount} transactions sur Base`
    ),

    // 2. Usage DeFi — appels directs aux protocoles connus (max 50 = 1.0)
    deFiUsage: criterion(
      'Usage DeFi',
      normalize(onchain.defiTxCount, 50),
      WEIGHTS.deFiUsage,
      `${onchain.defiTxCount} interactions DeFi (Uniswap, Aerodrome…)`
    ),

    // 3. NFT (max 20 = 1.0)
    nftActivity: criterion(
      'NFT',
      normalize(onchain.nftTxCount, 20),
      WEIGHTS.nftActivity,
      `${onchain.nftTxCount} transactions NFT sur Base`
    ),

    // 4. Builder Score Talent Protocol on-chain (0–100 → 0–1)
    builderScore: criterion(
      'Builder Score',
      normalize(talent.builderScore, 100),
      WEIGHTS.builderScore,
      talent.builderScore > 0
        ? `Score ${talent.builderScore}/100 sur Talent Protocol`
        : 'Aucun score Talent Protocol actif'
    ),

    // 5. Engagement Farcaster (max 1000 followers = 1.0)
    farcasterEngagement: criterion(
      'Farcaster',
      farcaster ? normalize(farcaster.followerCount, 1000) : 0,
      WEIGHTS.farcasterEngagement,
      farcaster
        ? `@${farcaster.username} · ${farcaster.followerCount} followers`
        : 'Pas de compte Farcaster détecté'
    ),

    // 6. Ancienneté wallet (max 24 mois = 2 ans = 1.0)
    walletAge: criterion(
      'Ancienneté wallet',
      normalize(walletAgeMonths, 24),
      WEIGHTS.walletAge,
      `${Math.round(walletAgeMonths)} mois d'activité sur Base`
    ),

    // 7. Base-native (1.0 si wallet actif sur Base, 0 si vide)
    baseNative: criterion(
      'Base natif',
      onchain.baseRatio,
      WEIGHTS.baseNative,
      onchain.txCount > 0 ? '100% de l\'activité sur Base' : 'Aucune activité sur Base'
    ),

    // 8. Réseau social Farcaster (ratio followers/following, max 5:1 = 1.0)
    socialGraph: criterion(
      'Réseau social',
      farcaster && farcaster.followingCount > 0
        ? normalize(farcaster.followerCount / farcaster.followingCount, 5)
        : 0,
      WEIGHTS.socialGraph,
      farcaster && farcaster.followingCount > 0
        ? `Ratio ${(farcaster.followerCount / farcaster.followingCount).toFixed(1)} followers/following`
        : 'N/A'
    ),

    // 9. Régularité (mois actifs estimés, max 12 = 1.0)
    consistency: criterion(
      'Régularité',
      normalize(onchain.activeMonths, 12),
      WEIGHTS.consistency,
      `Actif ${onchain.activeMonths} mois distincts`
    ),

    // 10. ENS ou Basename (binaire : 1 si détecté)
    ensOrBasename: criterion(
      'ENS / Basename',
      (onchain.ensName || onchain.hasBasename) ? 1 : 0,
      WEIGHTS.ensOrBasename,
      onchain.hasBasename
        ? 'Possède un Basename (.base.eth)'
        : onchain.ensName
          ? `ENS détecté : ${onchain.ensName}`
          : 'Aucun ENS ni Basename détecté'
    ),
  }

  // Calcul du total depuis les scores bruts (évite les erreurs d'arrondi cumulées)
  // Formule : moyenne pondérée × 1000, arrondie une seule fois
  const weightedSum = Object.entries(criteria).reduce((sum, [key, c]) => {
    return sum + c.score * WEIGHTS[key as keyof typeof WEIGHTS]
  }, 0)
  const total = Math.round((weightedSum / TOTAL_WEIGHT) * 1000)

  return {
    total: Math.min(1000, total),
    address,
    fid: farcaster?.fid,
    ensName: onchain.ensName ?? undefined,
    criteria,
    lastUpdated: new Date().toISOString(),
  }
}
