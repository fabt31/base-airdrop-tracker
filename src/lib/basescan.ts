import { OnchainData } from './types'

const BASE_API = 'https://api.basescan.org/api'

// Adresses de contrats DeFi connus sur Base
const DEFI_CONTRACTS = new Set([
  '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24', // Uniswap V3
  '0x2626664c2603336e57b271c5c0b26f421741e481', // Uniswap V3 Router
  '0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43', // Aerodrome
  '0x420dd381b31aef6683db6b902084cb0ffece40da', // Aerodrome Router
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', // SushiSwap
  '0x8c1a3cf8f83074169fe5d7ad50b978e1cdca51a9', // Morpho
])

async function basescanFetch(params: Record<string, string>) {
  const apiKey = process.env.BASESCAN_API_KEY ?? 'YourApiKeyToken'
  const url = new URL(BASE_API)
  Object.entries({ ...params, apikey: apiKey }).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (!res.ok) throw new Error('Basescan error')
  return res.json()
}

export async function getOnchainData(address: string): Promise<OnchainData> {
  try {
    const [txRes, tokenRes] = await Promise.allSettled([
      basescanFetch({ module: 'account', action: 'txlist', address, startblock: '0', endblock: '99999999', sort: 'asc' }),
      basescanFetch({ module: 'account', action: 'tokentx', address, startblock: '0', endblock: '99999999', sort: 'asc' }),
    ])

    const txList: any[] = txRes.status === 'fulfilled' ? txRes.value.result ?? [] : []
    const tokenTxList: any[] = tokenRes.status === 'fulfilled' ? tokenRes.value.result ?? [] : []

    if (!Array.isArray(txList)) {
      return emptyOnchain()
    }

    const now = Date.now() / 1000
    const firstTx = txList[0]
    const firstTxTimestamp = firstTx ? parseInt(firstTx.timeStamp) : now

    // DeFi = appel à un contrat DeFi connu OU transfert de token ERC-20
    const defiTxCount = txList.filter(tx =>
      DEFI_CONTRACTS.has(tx.to?.toLowerCase())
    ).length + tokenTxList.length

    // NFT = transferts ERC-721 / ERC-1155 (tokenRes avec tokenID)
    const nftTxCount = tokenTxList.filter(tx => tx.tokenID !== undefined).length

    // Mois distincts avec activité
    const months = new Set(
      txList.map(tx => {
        const d = new Date(parseInt(tx.timeStamp) * 1000)
        return `${d.getFullYear()}-${d.getMonth()}`
      })
    )

    // Ratio Base : supposé 1.0 car on lit seulement Basescan
    const baseRatio = 1.0

    return {
      txCount: txList.length,
      defiTxCount,
      nftTxCount,
      uniqueContracts: new Set(txList.map(tx => tx.to?.toLowerCase()).filter(Boolean)).size,
      firstTxTimestamp,
      baseRatio,
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
