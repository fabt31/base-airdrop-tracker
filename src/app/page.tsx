'use client'

import { useState, useEffect } from 'react'
import { AirdropScore } from '@/lib/types'
import ScoreView from '@/components/ScoreView'
import sdk from '@farcaster/frame-sdk'

const HISTORY_KEY = 'bat_history'
const MAX_HISTORY = 5

function loadHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveToHistory(addr: string) {
  const current = loadHistory()
  const next = [addr, ...current.filter(a => a !== addr)].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

export default function Home() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState<AirdropScore | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [fcUser, setFcUser] = useState<{ username?: string; displayName?: string } | null>(null)
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    setHistory(loadHistory())

    // Signal à Warpcast que l'app est prête (cache l'écran de splash)
    sdk.actions.ready().catch(() => {
      // Hors contexte Farcaster (navigateur normal), l'appel échoue silencieusement
    })

    // Auto-détection : lit le FID depuis le contexte Warpcast
    async function detectFarcasterUser() {
      try {
        setDetecting(true)
        const ctx = await sdk.context
        const fid = ctx?.user?.fid
        if (!fid) return

        // Récupère l'adresse ETH primaire liée à ce FID
        const res = await fetch(`/api/farcaster-user?fid=${fid}`)
        if (!res.ok) return
        const data = await res.json()

        if (data.primaryAddress) {
          setAddress(data.primaryAddress)
          setFcUser({ username: data.username, displayName: data.displayName })
          // Lance automatiquement le calcul du score
          triggerCheck(data.primaryAddress)
        }
      } catch {
        // Hors Warpcast ou erreur réseau — mode manuel
      } finally {
        setDetecting(false)
      }
    }

    detectFarcasterUser()
  }, [])

  async function triggerCheck(addr: string) {
    if (!addr) return
    setLoading(true)
    setError(null)
    setScore(null)

    try {
      const res = await fetch(`/api/score?address=${addr}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erreur inconnue')
        return
      }
      const data: AirdropScore = await res.json()
      setScore(data)
      saveToHistory(addr)
      setHistory(loadHistory())
    } catch {
      setError('Impossible de contacter l\'API')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheck(e: React.FormEvent, overrideAddr?: string) {
    e.preventDefault()
    const addr = overrideAddr ?? address.trim()
    if (!addr) return
    setAddress(addr)
    await triggerCheck(addr)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 pt-12 pb-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#0052FF] flex items-center justify-center text-white font-bold text-sm">B</div>
          <h1 className="text-2xl font-bold text-white">Base Airdrop Tracker</h1>
        </div>
        {fcUser ? (
          <p className="text-gray-400 text-sm">
            Connecté en tant que{' '}
            <span className="text-white font-medium">
              {fcUser.displayName ?? fcUser.username ?? 'utilisateur Farcaster'}
            </span>
          </p>
        ) : (
          <p className="text-gray-400 text-sm">Calcule ton score d&apos;éligibilité en 9 critères</p>
        )}
      </div>

      {/* Loader détection automatique */}
      {detecting && (
        <div className="w-full max-w-md mb-4 text-center text-gray-500 text-sm animate-pulse">
          Détection de ton compte Farcaster…
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleCheck} className="w-full max-w-md mb-2">
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

      {/* History */}
      {history.length > 0 && !score && (
        <div className="w-full max-w-md mb-6">
          <p className="text-gray-600 text-xs mb-2">Récents :</p>
          <div className="flex flex-wrap gap-2">
            {history.map(addr => (
              <button
                key={addr}
                onClick={e => handleCheck(e as any, addr)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-mono px-3 py-1.5 rounded-lg transition-colors"
              >
                {addr.slice(0, 6)}…{addr.slice(-4)}
              </button>
            ))}
          </div>
        </div>
      )}

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
