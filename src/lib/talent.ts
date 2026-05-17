export interface TalentData {
  builderScore: number   // 0–100
  passportId?: number
  nominationsReceived: number
}

export async function getTalentData(address: string): Promise<TalentData> {
  const apiKey = process.env.TALENT_API_KEY
  if (!apiKey) return { builderScore: 0, nominationsReceived: 0 }

  try {
    // Talent Protocol API v3 — endpoint par wallet address
    const res = await fetch(
      `https://api.talentprotocol.com/api/v3/passports/${address}`,
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        next: { revalidate: 3600 },
        redirect: 'manual',   // ne pas suivre les redirects vers la page login
      }
    )

    // 410 = deprecated, 302 = redirect vers login (clé invalide ou endpoint changé)
    if (!res.ok || res.status === 302) return { builderScore: 0, nominationsReceived: 0 }

    const data = await res.json()
    // Tenter les deux formats connus (v2 "passport" et v3 "profile")
    const passport = data.passport ?? data.profile ?? data
    const score = passport?.score ?? passport?.builder_score ?? passport?.passport_score ?? 0

    return {
      builderScore: typeof score === 'number' ? score : 0,
      passportId: passport?.passport_id ?? passport?.id,
      nominationsReceived: passport?.nominations_received ?? 0,
    }
  } catch {
    return { builderScore: 0, nominationsReceived: 0 }
  }
}
