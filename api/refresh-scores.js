import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ESPN sport path map
const espnMap = {
  nba: 'basketball/nba',
  cbb: 'basketball/mens-college-basketball',
  nfl: 'americanfootball/nfl',
  cfb: 'americanfootball/college-football',
  mlb: 'baseball/mlb',
  nhl: 'hockey/nhl',
}

// Manually set which sports are currently in season
const ACTIVE_SPORTS = ['cbb', 'nba'] // update as seasons change

function getPeriodLabel(sport, period) {
  if (['nba', 'cbb'].includes(sport)) return `Q${period}`
  if (['nfl', 'cfb'].includes(sport)) {
    if (period === 5) return 'OT'
    return `Q${period}`
  }
  if (sport === 'mlb') return `Inn ${period}`
  if (sport === 'nhl') return `P${period}`
  return `${period}`
}

export default async function handler(req, res) {
  // Only run between 10am - 1am ET (14:00 - 06:00 UTC)
  const hour = new Date().getUTCHours()
  const isGameTime = hour >= 14 || hour < 6
  if (!isGameTime) {
    return res.status(200).json({ skipped: true, reason: 'outside game hours' })
  }

  let totalUpserted = 0
  const errors = []

  for (const sport of ACTIVE_SPORTS) {
    const path = espnMap[sport]
    if (!path) continue

    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`
      const response = await fetch(url)
      const data = await response.json()
      const events = data?.events || []

      for (const event of events) {
        const comp = event.competitions?.[0]
        if (!comp) continue

        const status = comp.status?.type
        const homeTeam = comp.competitors?.find(c => c.homeAway === 'home')
        const awayTeam = comp.competitors?.find(c => c.homeAway === 'away')
        if (!homeTeam || !awayTeam) continue

        const gameDate = event.date?.split('T')[0]
        const period = comp.status?.period || 0
        const clock = comp.status?.displayClock || ''

        const row = {
          sport,
          espn_id: event.id,
          home_team: homeTeam.team.displayName,
          away_team: awayTeam.team.displayName,
          home_score: parseInt(homeTeam.score || 0),
          away_score: parseInt(awayTeam.score || 0),
          status: status?.state || 'pre',
          status_detail: status?.shortDetail || '',
          clock,
          period: period > 0 ? getPeriodLabel(sport, period) : '',
          game_date: gameDate,
          last_updated: new Date().toISOString(),
        }

        await supabase
          .from('scores_cache')
          .upsert(row, { onConflict: 'espn_id' })

        totalUpserted++
      }
    } catch (err) {
      console.error(`Error fetching ESPN scores for ${sport}:`, err)
      errors.push(sport)
    }
  }

  res.status(200).json({ upserted: totalUpserted, errors })
}