import { OnchainData } from './types'

const BLOCKSCOUT_BASE = 'https://base.blockscout.com/api/v2'
const BLOCKSCOUT_V1 = 'https://base.blockscout.com/api'

// Adresses de contrats DeFi connus sur Base
const DEFI_CONTRACTS = new Set([
  '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24', // Uniswap V3
  '0x2626664c2603336e57b271c5c0b26f421741e481', // Uniswap V3 Router
  '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad', // Uniswap Universal Router
  '0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43', // Aerodrome
  '0x420dd381b31aef6683db6b902084cb0ffece40da', // Aerodrome Router
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', // SushiSwap
  '0x8c1a3cf8f83074169fe5d7ad50b978e1cdca51a9', // Morpho
  '0x940181a94a35a4569e4529a3cdfb74e38fd98631', // Aerodrome V2
  '0x6ff5693b99212da76ad316178a184ab56d299b43', // Base Swap
])

async function blockscoutFetch(path: string) {
  const res = await fetch(`${BLOCKSCOUT_BASE}${path}`, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`Blockscout error ${res.status}`)
  return res.json()
}

// Vrai count total de transactions via l'endpoint /counters
async function getTxCount(address: string): Promise<number> {
  try {
    const data = await blockscoutFetch(`/addresses/${address}/counters`)
    return parseInt(data.transactions_count ?? '0', 10)
  } catch {
    return 0
  }
}

// Timestamp de la 1ère transaction (via l'API v1 qui supporte sort=asc)
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

// Récupère les N dernières pages de transactions pour analyser DeFi/NFT/régularité
async function getRecentTransactions(address: string, maxPages = 6): Promise<any[]> {
  const items: any[] = []
  let url = `/addresses/${address}/transactions`
  let pages = 0
  while (url && pages < maxPages) {
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

export async function getOnchainData(address: string): Promise<OnchainData> {
  try {
    const [txCountResult, firstTsResult, txItemsResult, tokenTransfersResult] = await Promise.allSettled([
      getTxCount(address),
      getFirstTxTimestamp(address),
      getRecentTransactions(address),
      blockscoutFetch(`/addresses/${address}/token-transfers?type=ERC-20,ERC-721,ERC-1155`),
    ])

    const txCount = txCountResult.status === 'fulfilled' ? txCountResult.value : 0
    const firstTxTimestamp = firstTsResult.status === 'fulfilled' && firstTsResult.value !== null
      ? firstTsResult.value
      : Date.now() / 1000

    const txList: any[] = txItemsResult.status === 'fulfilled' ? txItemsResult.value : []
    const transfers: any[] = tokenTransfersResult.status === 'fulfilled'
      ? (tokenTransfersResult.value.items ?? [])
      : []

    if (txCount === 0 && txList.length === 0) {
      return emptyOnchain()
    }

    // DeFi = appel à un contrat DeFi connu OU transfert ERC-20
    const erc20Transfers = transfers.filter((t: any) => t.token?.type === 'ERC-20')
    const defiTxCount = txList.filter(tx =>
      DEFI_CONTRACTS.has(tx.to?.hash?.toLowerCase())
    ).length + erc20Transfers.length

    // NFT = transferts ERC-721 / ERC-1155
    const nftTxCount = transfers.filter((t: any) =>
      t.token?.type === 'ERC-721' || t.token?.type === 'ERC-1155'
    ).length

    // Mois distincts avec activité (sur l'échantillon récent)
    const months = new Set(
      txList.map(tx => {
        const d = new Date(tx.timestamp)
        return `${d.getFullYear()}-${d.getMonth()}`
      })
    )

    // Ancienneté en mois depuis la 1ère tx réelle
    const now = Date.now() / 1000
    const walletAgeMonths = (now - firstTxTimestamp) / (30 * 24 * 3600)
    // Active months = au moins 1 par mois depuis la création (capped à l'échantillon)
    const activeMonths = Math.max(months.size, Math.min(Math.floor(walletAgeMonths), months.size))

    return {
      txCount,
      defiTxCount,
      nftTxCount,
      uniqueContracts: new Set(txList.map(tx => tx.to?.hash?.toLowerCase()).filter(Boolean)).size,
      firstTxTimestamp,
      baseRatio: 1.0,
      activeMonths: months.size,
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
