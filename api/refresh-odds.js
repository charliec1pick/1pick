import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const sportMap = {
  cbb: 'basketball_ncaab',
  nba: 'basketball_nba',
  nfl: 'americanfootball_nfl',
  cfb: 'americanfootball_ncaaf',
  mlb: 'baseball_mlb',
  nhl: 'icehockey_nhl',
}

export default async function handler(req, res) {
  const sports = ['cbb', 'nba', 'nfl', 'cfb', 'mlb', 'nhl']
  let refreshed = []

  for (const sport of sports) {
    const sportKey = sportMap[sport]
    try {
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
      )
      const data = await response.json()
      if (!Array.isArray(data)) continue

      await supabase.from('odds_cache').upsert({
        sport,
        data,
        fetched_at: new Date().toISOString()
      }, { onConflict: 'sport' })

      refreshed.push(sport)
    } catch (err) {
      console.error(`Error refreshing ${sport}:`, err)
    }
  }

  res.status(200).json({ refreshed })
}