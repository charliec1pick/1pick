import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function determineWinner(homeTeam, awayTeam, homeScore, awayScore) {
  if (homeScore === awayScore) return 'draw'
  return homeScore > awayScore ? homeTeam : awayTeam
}

function checkPickResult(pick, homeTeam, awayTeam, homeScore, awayScore) {
  const winner = determineWinner(homeTeam, awayTeam, homeScore, awayScore)

  if (pick.category === 'ml-fav' || pick.category === 'ml-dog') {
    if (winner === 'draw') return 'pending'
    return pick.team === winner ? 'win' : 'loss'
  }

  if (pick.category === 'tot-ov' || pick.category === 'tot-un') {
    const match = pick.team.match(/(\d+\.?\d*)/)
    if (!match) return 'pending'
    const total = parseFloat(match[1])
    const combined = homeScore + awayScore
    if (combined === total) return 'pending' // exact push
    if (pick.category === 'tot-ov') return combined > total ? 'win' : 'loss'
    if (pick.category === 'tot-un') return combined < total ? 'win' : 'loss'
  }

  if (pick.category === 'sp-fav' || pick.category === 'sp-dog') {
    const match = pick.team.match(/([+-]?\d+\.?\d*)$/)
    if (!match) return 'pending'
    const spread = parseFloat(match[1])
    const teamName = pick.team.replace(/[+-]?\d+\.?\d*$/, '').trim()
    const isHome =
      homeTeam.includes(teamName) ||
      teamName.includes(homeTeam.split(' ').pop())
    const teamScore = isHome ? homeScore : awayScore
    const oppScore = isHome ? awayScore : homeScore
    const margin = teamScore + spread - oppScore
    if (margin === 0) return 'pending' // exact push
    return margin > 0 ? 'win' : 'loss'
  }

  return 'pending'
}

function calcPayout(units, lockedOdds, result) {
  if (result !== 'win') return -units
  const odds = parseFloat(lockedOdds)
  if (odds < 0) return parseFloat((units / (Math.abs(odds) / 100)).toFixed(1))
  return parseFloat((units * (odds / 100)).toFixed(1))
}

// Match a pick's home_team/away_team to a scores_cache row
// ESPN team names should match since odds_cache also stores displayName-style names
function teamsMatch(pick, scoreRow) {
  const normalize = s => s?.toLowerCase().trim()
  return (
    normalize(pick.home_team) === normalize(scoreRow.home_team) &&
    normalize(pick.away_team) === normalize(scoreRow.away_team)
  )
}

export default async function handler(req, res) {
  // Fetch all completed games from scores_cache
  const { data: completedGames, error: scoresError } = await supabase
    .from('scores_cache')
    .select('*')
    .eq('status', 'post')

  if (scoresError || !completedGames?.length) {
    return res.status(200).json({ updated: 0, message: 'No completed games found' })
  }

  // Fetch all pending picks that have home_team/away_team stored
  const { data: pendingPicks, error: picksError } = await supabase
    .from('picks')
    .select('*')
    .eq('result', 'pending')
    .neq('category', 'unallocated-penalty')

  if (picksError || !pendingPicks?.length) {
    return res.status(200).json({ updated: 0, message: 'No pending picks found' })
  }

  let totalUpdated = 0

  for (const pick of pendingPicks) {
    // Try to match by game_id first (Odds API ID stored in scores_cache if we ever add it)
    // Fall back to team name matching
    const scoreRow = completedGames.find(g => teamsMatch(pick, g))
    if (!scoreRow) continue

    const result = checkPickResult(
      pick,
      scoreRow.home_team,
      scoreRow.away_team,
      scoreRow.home_score,
      scoreRow.away_score
    )

    if (result !== 'pending') {
      const payoutUnits = calcPayout(pick.units, pick.locked_odds, result)
      await supabase
        .from('picks')
        .update({
          result,
          payout_units: payoutUnits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pick.id)
      totalUpdated++
    }
  }

  res.status(200).json({ updated: totalUpdated })
}