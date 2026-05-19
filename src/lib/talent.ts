export interface TalentData {
  builderScore: number   // 0–100
  passportId?: number
  nominationsReceived: number
}

// PassportBuilderScore contract on Base (mainnet)
// Source: https://docs.talentprotocol.com/docs/developers/smart-contracts
const BUILDER_SCORE_CONTRACT = '0xBBFeDA7c4d8d9Df752542b03CdD715F790B32D0B'
// keccak256("getScoreByAddress(address)")[0:4] = 0x4c58e077
const GET_SCORE_SELECTOR = '0x4c58e077'
const BASE_RPCS = [
  'https://mainnet.base.org',
  'https://1rpc.io/base',
  'https://base.llamarpc.com',
  'https://base-rpc.publicnode.com',
]

/**
 * Lit le Builder Score directement depuis le smart contract Talent Protocol sur Base.
 * Essaie plusieurs RPCs publics en séquence pour fiabiliser la lecture.
 * Si le score est expiré ou inexistant, retourne 0.
 */
async function getBuilderScoreOnchain(address: string): Promise<number> {
  const padded = address.slice(2).toLowerCase().padStart(64, '0')
  const calldata = `${GET_SCORE_SELECTOR}${padded}`

  const body = JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [{ to: BUILDER_SCORE_CONTRACT, data: calldata }, 'latest'],
    id: 1,
  })

  for (const rpc of BASE_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        next: { revalidate: 3600 },
      })
      if (!res.ok) continue
      const data = await res.json()

      // Si le contrat revert (score expiré, pas de passport), data.error existe
      if (data.error) return 0

      const hex = data.result as string
      if (!hex || hex === '0x') return 0
      const score = parseInt(hex, 16)
      return isNaN(score) ? 0 : Math.min(100, score)
    } catch {
      // essaie le RPC suivant
    }
  }
  return 0
}

export async function getTalentData(address: string): Promise<TalentData> {
  const builderScore = await getBuilderScoreOnchain(address)
  return {
    builderScore,
    nominationsReceived: 0,
  }
}
