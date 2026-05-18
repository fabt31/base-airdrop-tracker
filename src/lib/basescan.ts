import { OnchainData } from './types'

const BLOCKSCOUT_BASE = 'https://base.blockscout.com/api/v2'
const BLOCKSCOUT_V1 = 'https://base.blockscout.com/api'

// Contrats DeFi connus sur Base (swaps, LP, lending)
const DEFI_CONTRACTS = new Set([
  '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24', // Uniswap V3 Pool
  '0x2626664c2603336e57b271c5c0b26f421741e481', // Uniswap V3 Router
  '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad', // Uniswap Universal Router
  '0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43', // Aerodrome
  '0x420dd381b31aef6683db6b902084cb0ffece40da', // Aerodrome Router
  '0x940181a94a35a4569e4529a3cdfb74e38fd98631', // Aerodrome V2
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', // SushiSwap
  '0x8c1a3cf8f83074169fe5d7ad50b978e1cdca51a9', // Morpho
  '0x6ff5693b99212da76ad316178a184ab56d299b43', // BaseSwap
  '0x9c4ec768c28520b50860ea7a15bd7213a9ff58bf', // AAVE v3 Pool (Base)
  '0x18cd499e3d7ed42feba981ac9236a278e4cdc2ee', // Compound Base
  '0x327df1e6de05895d2ab08513aadd9313fe505d86', // Extra Finance
])

async function blockscoutFetch(path: string) {
  const res = await fetch(`${BLOCKSCOUT_BASE}${path}`, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`Blockscout error ${res.status}`)
  return res.json()
}

// Vrai count total via /counters (1 seul appel, pas de pagination)
async function getTxCount(address: string): Promise<number> {
  try {
    const data = await blockscoutFetch(`/addresses/${address}/counters`)
    return parseInt(data.transactions_count ?? '0', 10)
  } catch {
    return 0
  }
}

// Timestamp de la 1ère transaction réelle (API v1 sort=asc)
async function getFirstTxTimestamp(address: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${BLOCKSCOUT_V1}?module=account&action=txlist&address=${address}&page=1&offset=1&sort=asc`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const ts = data.result?.[0]?.timeStamp
    return ts ? parseInt(ts, 10) : null
  } catch {
    return null
  }
}

// Récupère 2 pages de txs récentes pour détecter les appels DeFi
// (limité à 2 pages = 100 txs pour les perfs — DeFi = appels directs à contrats connus)
async function getRecentTransactions(address: string): Promise<any[]> {
  const items: any[] = []
  let url = `/addresses/${address}/transactions`
  let pages = 0
  while (url && pages < 2) {
    try {
      const data = await blockscoutFetch(url)
      if (data.items) items.push(...data.items)
      url = data.next_page_params
        ? `/addresses/${address}/transactions?block_number=${data.next_page_params.block_number}&index=${data.next_page_params.index}&items_count=${data.next_page_params.items_count}`
        : ''
      pages++
    } catch {
      break
    }
  }
  return items
}

// Récupère 3 pages de token-transfers pour NFT + mois d'activité
async function getTokenTransfers(address: string): Promise<any[]> {
  const items: any[] = []
  let url = `/addresses/${address}/token-transfers?type=ERC-20,ERC-721,ERC-1155`
  let pages = 0
  while (url && pages < 3) {
    try {
      const data = await blockscoutFetch(url)
      if (data.items) items.push(...data.items)
      url = data.next_page_params
        ? `/addresses/${address}/token-transfers?type=ERC-20,ERC-721,ERC-1155&block_number=${data.next_page_params.block_number}&index=${data.next_page_params.index}&items_count=${data.next_page_params.items_count}`
        : ''
      pages++
    } catch {
      break
    }
  }
  return items
}

export async function getOnchainData(address: string): Promise<OnchainData> {
  try {
    // Tous les appels en parallèle pour minimiser la latence
    const [txCountResult, firstTsResult, txItemsResult, transfersResult] = await Promise.allSettled([
      getTxCount(address),
      getFirstTxTimestamp(address),
      getRecentTransactions(address),
      getTokenTransfers(address),
    ])

    const txCount = txCountResult.status === 'fulfilled' ? txCountResult.value : 0
    const firstTxTimestamp = firstTsResult.status === 'fulfilled' && firstTsResult.value !== null
      ? firstTsResult.value
      : Date.now() / 1000

    const txList: any[] = txItemsResult.status === 'fulfilled' ? txItemsResult.value : []
    const transfers: any[] = transfersResult.status === 'fulfilled' ? transfersResult.value : []

    if (txCount === 0 && txList.length === 0) {
      return emptyOnchain()
    }

    // DeFi = appels directs à des contrats DeFi connus UNIQUEMENT
    // (on exclut les ERC-20 transfers simples qui ne sont pas du DeFi)
    const defiTxCount = txList.filter(tx =>
      DEFI_CONTRACTS.has(tx.to?.hash?.toLowerCase())
    ).length

    // NFT = transferts ERC-721 / ERC-1155 (depuis token-transfers, plus fiable)
    const nftTxCount = transfers.filter((t: any) =>
      t.token?.type === 'ERC-721' || t.token?.type === 'ERC-1155'
    ).length

    // Mois actifs : on collecte depuis les deux sources (txs + token transfers)
    const monthSet = new Set<string>()
    for (const tx of txList) {
      const d = new Date(tx.timestamp)
      monthSet.add(`${d.getFullYear()}-${d.getMonth()}`)
    }
    for (const t of transfers) {
      const d = new Date(t.timestamp)
      monthSet.add(`${d.getFullYear()}-${d.getMonth()}`)
    }

    // Estimation intelligente de l'activité mensuelle :
    // Si le wallet fait en moyenne ≥ 2 txs/mois sur sa durée de vie,
    // on considère qu'il était actif chaque mois (capped à 12 pour le score max)
    const now = Date.now() / 1000
    const walletAgeMonths = Math.max(1, (now - firstTxTimestamp) / (30 * 24 * 3600))
    const txsPerMonth = txCount / walletAgeMonths
    const activeMonths = txsPerMonth >= 2
      ? Math.min(Math.floor(walletAgeMonths), 12)
      : Math.min(monthSet.size, 12)

    return {
      txCount,
      defiTxCount,
      nftTxCount,
      uniqueContracts: new Set(txList.map(tx => tx.to?.hash?.toLowerCase()).filter(Boolean)).size,
      firstTxTimestamp,
      baseRatio: 1.0,
      activeMonths,
    }
  } catch {
    return emptyOnchain()
  }
}

function emptyOnchain(): OnchainData {
  return {
    txCount: 0,
    defiTxCount: 0,
    nftTxCount: 0,
    uniqueContracts: 0,
    firstTxTimestamp: Date.now() / 1000,
    baseRatio: 0,
    activeMonths: 0,
  }
}
