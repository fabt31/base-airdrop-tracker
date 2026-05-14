'use client'

import { AirdropScore, CriterionResult } from '@/lib/types'

const CIRCUMFERENCE = 2 * Math.PI * 80  // r=80 → ~502

function ScoreRing({ score }: { score: number }) {
  const pct = score / 1000
  const offset = CIRCUMFERENCE * (1 - pct)
  const color = score >= 700 ? '#22c55e' : score >= 400 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mb-6">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 200 200">
        {/* Track */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="#1f2937" strokeWidth="16" />
        {/* Progress */}
        <circle
          cx="100" cy="100" r="80"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.2s ease-out',
          }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-4xl font-bold text-white">{score}</div>
        <div className="text-gray-400 text-xs">/ 1000</div>
      </div>
    </div>
  )
}

function CriterionBar({ c }: { c: CriterionResult }) {
  const pct = Math.round(c.score * 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{c.label}</span>
        <span className="text-white font-semibold">+{c.points} pts</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-[#0052FF] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-gray-500 text-xs mt-1">{c.detail}</p>
    </div>
  )
}

function scoreLabel(s: number) {
  if (s >= 800) return { label: '🔥 Whale', color: 'text-green-400' }
  if (s >= 600) return { label: '⚡ Power User', color: 'text-blue-400' }
  if (s >= 400) return { label: '🌱 Actif', color: 'text-yellow-400' }
  if (s >= 200) return { label: '🐣 Débutant', color: 'text-orange-400' }
  return { label: '💤 Inactif', color: 'text-red-400' }
}

export default function ScoreView({ score }: { score: AirdropScore }) {
  const { label, color } = scoreLabel(score.total)
  const shareText = `Mon score Base Airdrop Tracker : ${score.total}/1000 ${label}\n\nChecke le tien 👇`
  const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`

  return (
    <div className="w-full max-w-md">
      {/* Score ring */}
      <div className="flex flex-col items-center bg-gray-900 rounded-2xl p-6 mb-4">
        <ScoreRing score={score.total} />
        <span className={`text-lg font-bold mb-1 ${color}`}>{label}</span>
        <span className="text-gray-500 text-xs font-mono">
          {score.address.slice(0, 6)}…{score.address.slice(-4)}
          {score.fid ? ` · FID #${score.fid}` : ''}
        </span>
      </div>

      {/* Criteria breakdown */}
      <div className="bg-gray-900 rounded-2xl p-6 mb-4">
        <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Détail des critères</h2>
        {Object.values(score.criteria).map((c, i) => (
          <CriterionBar key={i} c={c} />
        ))}
      </div>

      {/* Share button */}
      <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        Partager sur Farcaster
      </a>

      <p className="text-gray-600 text-xs text-center mt-3">
        Mis à jour le {new Date(score.lastUpdated).toLocaleString('fr-FR')}
      </p>
    </div>
  )
}
