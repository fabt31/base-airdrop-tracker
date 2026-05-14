# Base Airdrop Tracker 🔵

Mini-app Farcaster qui calcule ton score d'éligibilité aux airdrops Base L2 sur 9 critères pondérés (0–1000 pts).

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **APIs** : Basescan · Neynar · Talent Protocol
- **Farcaster Mini App** (fc:frame + manifest)

## Score — 9 critères

| Critère | Poids | Source |
|---------|-------|--------|
| Activité on-chain | 1.5 | Basescan |
| Usage DeFi | 1.5 | Basescan |
| NFT sur Base | 0.75 | Basescan |
| Builder Score | 1.0 | Talent Protocol |
| Engagement Farcaster | 1.0 | Neynar |
| Ancienneté wallet | 0.75 | Basescan |
| Base natif | 1.0 | Basescan |
| Réseau social | 0.75 | Neynar |
| Régularité | 0.75 | Basescan |

## Installation locale

### 1. Prérequis

- [Node.js 20+](https://nodejs.org)
- [npm](https://npmjs.com)

### 2. Cloner et installer

```bash
git clone https://github.com/fabt31/base-airdrop-tracker.git
cd base-airdrop-tracker
npm install
```

### 3. Configurer les clés API (toutes gratuites)

```bash
cp .env.example .env.local
```

Édite `.env.local` avec tes clés :

| Variable | Où la récupérer |
|----------|----------------|
| `NEYNAR_API_KEY` | [neynar.com](https://neynar.com) → Sign up → API Keys |
| `BASESCAN_API_KEY` | [basescan.org/myapikey](https://basescan.org/myapikey) → Register |
| `TALENT_API_KEY` | [talentprotocol.com/developers](https://talentprotocol.com/developers) |
| `NEXT_PUBLIC_URL` | `http://localhost:3000` en local |

### 4. Lancer en local

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) et teste avec ton adresse Base.

## Déploiement Vercel

### 1. Pousser sur GitHub

```bash
git add .
git commit -m "feat: initial base-airdrop-tracker"
git push origin main
```

### 2. Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com) → New Project
2. Importe `fabt31/base-airdrop-tracker`
3. Ajoute les variables d'environnement (les 4 du `.env.example`)
4. Remplace `NEXT_PUBLIC_URL` par ton URL Vercel (ex: `https://base-airdrop-tracker.vercel.app`)
5. Clique **Deploy**

### 3. Signer le manifest Farcaster (pour publier sur Warpcast)

1. Va sur [warpcast.com/~/developers/mini-apps](https://warpcast.com/~/developers/mini-apps)
2. Clique **Add mini app**
3. Rentre ton URL Vercel
4. Signe le manifest avec ton compte Farcaster
5. Copie `header`, `payload`, `signature` dans `src/app/.well-known/farcaster.json/route.ts`
6. Redéploie sur Vercel

## Assets statiques

Ajoute ces fichiers dans `/public/` :
- `icon.png` — icône 200×200px de l'app (logo Base ou custom)

## Licence

MIT
