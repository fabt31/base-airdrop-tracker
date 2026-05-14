import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const appUrl = process.env.NEXT_PUBLIC_URL ?? 'https://base-airdrop-tracker.vercel.app'

export const metadata: Metadata = {
  title: 'Base Airdrop Tracker',
  description: 'Calcule ton score d\'éligibilité aux airdrops Base L2',
  other: {
    'fc:frame': JSON.stringify({
      version: 'next',
      imageUrl: `${appUrl}/og`,
      button: {
        title: 'Checker mon score',
        action: {
          type: 'launch_frame',
          name: 'Base Airdrop Tracker',
          url: appUrl,
          splashImageUrl: `${appUrl}/og`,
          splashBackgroundColor: '#0052FF',
        },
      },
    }),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
