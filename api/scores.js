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

function determineWinner(game) {
  if (!game.scores) return null
  if (!game.completed) return null
  const home = game.scores.find(s => s.name === game.home_team)
  const away = game.scores.find(s => s.name === game.away_team)
  if (!home || !away) return null
  const homeScore = parseFloat(home.score)
  const awayScore = parseFloat(away.score)
  if (isNaN(homeScore) || isNaN(awayScore)) return null
  if (homeScore === 0 && awayScore === 0) return null
  if (homeScore > awayScore) return game.home_team
  if (awayScore > homeScore) return game.away_team
  return 'draw'
}

function checkPickResult(pick, game, winner) {
  if (!winner || winner === 'draw') return 'pending'

  if (pick.category === 'ml-fav' || pick.category === 'ml-dog') {
    const won = pick.team === winner
    if (!won) return 'loss'
    return 'win'
  }

  if (pick.category === 'tot-ov' || pick.category === 'tot-un') {
    const match = pick.team.match(/(\d+\.?\d*)/)
    if (!match) return 'pending'
    const total = parseFloat(match[1])
    const homeScore = parseFloat(game.scores.find(s => s.name === game.home_team)?.score || 0)
    const awayScore = parseFloat(game.scores.find(s => s.name === game.away_team)?.score || 0)
    const combined = homeScore + awayScore
    if (combined === total) return 'pending'
    if (pick.category === 'tot-ov') return combined > total ? 'win' : 'loss'
    if (pick.category === 'tot-un') return combined < total ? 'win' : 'loss'
  }

  if (pick.category === 'sp-fav' || pick.category === 'sp-dog') {
    const match = pick.team.match(/([+-]?\d+\.?\d*)$/)
    if (!match) return 'pending'
    const spread = parseFloat(match[1])
    const homeScore = parseFloat(game.scores.find(s => s.name === game.home_team)?.score || 0)
    const awayScore = parseFloat(game.scores.find(s => s.name === game.away_team)?.score || 0)
    const teamName = pick.team.replace(/[+-]?\d+\.?\d*$/, '').trim()
    const isHome = game.home_team.includes(teamName) || teamName.includes(game.home_team.split(' ').pop())
    const teamScore = isHome ? homeScore : awayScore
    const oppScore = isHome ? awayScore : homeScore
    const margin = (teamScore + spread) - oppScore
    if (margin === 0) return 'pending'
    return margin > 0 ? 'win' : 'loss'
  }

  return 'pending'
}

export default async function handler(req, res) {
  const sports = ['cbb', 'nba'] //update as seasons change
  let totalUpdated = 0

  for (const sport of sports) {
    const sportKey = sportMap[sport]
    try {
      const response = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${process.env.ODDS_API_KEY}&daysFrom=2`
      )
      const games = await response.json()
      if (!Array.isArray(games)) continue

      const completedGames = games.filter(g => g.completed)

      for (const game of completedGames) {
        const winner = determineWinner(game)
        if (!winner) continue

        const { data: picks } = await supabase
          .from('picks')
          .select('*')
          .eq('game_id', game.id)
          .eq('result', 'pending')

        if (!picks || picks.length === 0) continue

        for (const pick of picks) {
  const result = checkPickResult(pick, game, winner)
  if (result !== 'pending') {
    let payoutUnits = 0
    if (result === 'win') {
      const odds = parseFloat(pick.locked_odds)
      if (odds < 0) {
        payoutUnits = parseFloat((pick.units / (Math.abs(odds) / 100)).toFixed(1))
      } else {
        payoutUnits = parseFloat((pick.units * (odds / 100)).toFixed(1))
      }
    } else {
      payoutUnits = -pick.units
    }
    await supabase
      .from('picks')
      .update({ result, payout_units: payoutUnits, updated_at: new Date().toISOString() })
      .eq('id', pick.id)
    totalUpdated++
  }
}
      }
    } catch (err) {
      console.error(`Error processing ${sport}:`, err)
    }
  }

  res.status(200).json({ updated: totalUpdated })
}