import { OnchainData } from './types'

const BLOCKSCOUT_BASE = 'https://base.blockscout.com/api/v2'

// Adresses de contrats DeFi connus sur Base
const DEFI_CONTRACTS = new Set([
  '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24', // Uniswap V3
  '0x2626664c2603336e57b271c5c0b26f421741e481', // Uniswap V3 Router
  '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad', // Uniswap Universal Router
  '0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43', // Aerodrome
  '0x420dd381b31aef6683db6b902084cb0ffece40da', // Aerodrome Router
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', // SushiSwap
  '0x8c1a3cf8f83074169fe5d7ad50b978e1cdca51a9', // Morpho
])

async function blockscoutFetch(path: string) {
  const res = await fetch(`${BLOCKSCOUT_BASE}${path}`, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error('Blockscout error')
  return res.json()
}

// Récupère toutes les pages de transactions (max 500 tx pour les perfs)
async function getAllTransactions(address: string): Promise<any[]> {
  const items: any[] = []
  let url = `/addresses/${address}/transactions`
  let pages = 0
  while (url && pages < 10) {
    const data = await blockscoutFetch(url)
    if (data.items) items.push(...data.items)
    url = data.next_page_params
      ? `/addresses/${address}/transactions?block_number=${data.next_page_params.block_number}&index=${data.next_page_params.index}&items_count=${data.next_page_params.items_count}`
      : ''
    pages++
  }
  return items
}

export async function getOnchainData(address: string): Promise<OnchainData> {
  try {
    const [txItems, tokenTransfers] = await Promise.allSettled([
      getAllTransactions(address),
      blockscoutFetch(`/addresses/${address}/token-transfers?type=ERC-20,ERC-721,ERC-1155`),
    ])

    const txList: any[] = txItems.status === 'fulfilled' ? txItems.value : []
    const transfers: any[] = tokenTransfers.status === 'fulfilled'
      ? (tokenTransfers.value.items ?? [])
      : []

    const now = Date.now() / 1000

    if (txList.length === 0) {
      return emptyOnchain()
    }

    // Première transaction (la plus ancienne = dernière dans la liste paginée)
    const sortedByTime = [...txList].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    const firstTxTimestamp = sortedByTime[0]
      ? new Date(sortedByTime[0].timestamp).getTime() / 1000
      : now

    // DeFi = appel à un contrat DeFi connu OU transfert ERC-20
    const erc20Transfers = transfers.filter((t: any) => t.token?.type === 'ERC-20')
    const defiTxCount = txList.filter(tx =>
      DEFI_CONTRACTS.has(tx.to?.hash?.toLowerCase())
    ).length + erc20Transfers.length

    // NFT = transferts ERC-721 / ERC-1155
    const nftTxCount = transfers.filter((t: any) =>
      t.token?.type === 'ERC-721' || t.token?.type === 'ERC-1155'
    ).length

    // Mois distincts avec activité
    const months = new Set(
      txList.map(tx => {
        const d = new Date(tx.timestamp)
        return `${d.getFullYear()}-${d.getMonth()}`
      })
    )

    return {
      txCount: txList.length,
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
