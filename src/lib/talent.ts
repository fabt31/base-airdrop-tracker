export interface TalentData {
  builderScore: number   // 0–100
  passportId?: number
  nominationsReceived: number
}

export async function getTalentData(address: string): Promise<TalentData> {
  const apiKey = process.env.TALENT_API_KEY
  if (!apiKey) return { builderScore: 0, nominationsReceived: 0 }

  try {
    const res = await fetch(
      `https://api.talentprotocol.com/api/v2/passports/${address}`,
      {
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) return { builderScore: 0, nominationsReceived: 0 }
    const data = await res.json()
    const passport = data.passport

    return {
      builderScore: passport?.score ?? 0,
      passportId: passport?.passport_id,
      nominationsReceived: passport?.nominations_received ?? 0,
    }
  } catch {
    return { builderScore: 0, nominationsReceived: 0 }
  }
}
