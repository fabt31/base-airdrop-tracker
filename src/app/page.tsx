'use client'

import { useState } from 'react'
import { AirdropScore } from '@/lib/types'
import ScoreView from '@/components/ScoreView'

export default function Home() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState<AirdropScore | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    if (!address) return
    setLoading(true)
    setError(null)
    setScore(null)

    try {
      const res = await fetch(`/api/score?address=${address.trim()}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erreur inconnue')
        return
      }
      const data: AirdropScore = await res.json()
      setScore(data)
    } catch {
      setError('Impossible de contacter l\'API')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 pt-12 pb-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#0052FF] flex items-center justify-center text-white font-bold text-sm">B</div>
          <h1 className="text-2xl font-bold text-white">Base Airdrop Tracker</h1>
        </div>
        <p className="text-gray-400 text-sm">Calcule ton score d&apos;éligibilité en 9 critères</p>
      </div>

      {/* Input */}
      <form onSubmit={handleCheck} className="w-full max-w-md mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="0x... adresse Ethereum"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#0052FF] text-sm font-mono"
          />
          <button
            type="submit"
            disabled={loading || !address}
            className="bg-[#0052FF] hover:bg-blue-500 disabled:opacity-40 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? '...' : 'Checker'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="w-full max-w-md bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Score */}
      {score && <ScoreView score={score} />}

      {/* Footer */}
      <p className="mt-auto pt-8 text-gray-600 text-xs text-center">
        Données : Blockscout · Farcaster · Talent Protocol on-chain · Calcul non-officiel
      </p>
    </main>
  )
}
