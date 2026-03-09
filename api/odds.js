import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Update this list as sports seasons change
const ACTIVE_SPORTS = ['cbb', 'nba']

const sportMap = {
  cbb: 'basketball_ncaab',
  nba: 'basketball_nba',
  nfl: 'americanfootball_nfl',
  cfb: 'americanfootball_ncaaf',
  mlb: 'baseball_mlb',
  nhl: 'icehockey_nhl',
}

export default async function handler(req, res) {
  const { sport } = req.query
  const sportKey = sportMap[sport]
  if (!sportKey) return res.status(400).json({ error: 'Invalid sport' })

  // Block calls for inactive sports — return cached data or empty
  if (!ACTIVE_SPORTS.includes(sport)) {
    const { data: cached } = await supabase
      .from('odds_cache')
      .select('data')
      .eq('sport', sport)
      .single()
    return res.status(200).json(cached?.data || [])
  }

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
    )
    const data = await response.json()

    await supabase.from('odds_cache').upsert({
      sport,
      data,
      fetched_at: new Date().toISOString()
    }, { onConflict: 'sport' })

    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch odds' })
  }
}