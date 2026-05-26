export interface AirdropScore {
  total: number        // 0–1000
  address: string
  fid?: number
  ensName?: string     // ENS ou Basename détecté
  criteria: CriteriaBreakdown
  lastUpdated: string
}

export interface CriteriaBreakdown {
  onchainActivity: CriterionResult    // Txs on Base
  deFiUsage: CriterionResult          // Swaps, LPs
  nftActivity: CriterionResult        // NFT mints/trades sur Base
  builderScore: CriterionResult       // Talent Protocol Builder Score
  farcasterEngagement: CriterionResult // Followers, casts
  walletAge: CriterionResult          // Ancienneté du wallet
  baseNative: CriterionResult         // % activité sur Base vs autres chains
  socialGraph: CriterionResult        // Qualité réseau Farcaster
  consistency: CriterionResult        // Régularité activité mensuelle
  ensOrBasename: CriterionResult      // ENS name ou Basename (.base.eth)
}

export interface CriterionResult {
  label: string
  score: number     // 0–1 (sera multiplié par le poids)
  weight: number    // poids dans le score total
  points: number    // contribution réelle (score * weight * 1000 / totalWeight)
  detail: string    // phrase explicative
  actionUrl?: string  // lien d'action optionnel (ex: renouveler score)
  actionLabel?: string
}

export interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  followerCount: number
  followingCount: number
  castCount: number
  bio: string
  verifiedAddresses: string[]
}

export interface OnchainData {
  txCount: number
  defiTxCount: number
  nftTxCount: number
  uniqueContracts: number
  firstTxTimestamp: number
  baseRatio: number    // 0–1
  activeMonths: number // nb de mois distincts avec activité
  ensName?: string     // ENS ou Basename détecté via Blockscout
  hasBasename: boolean // possède un Basename NFT (.base.eth)
}
