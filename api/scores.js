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
    // Use proper expanded matching instead of nickname-only check
    const isHome = teamsMatchSingle(teamName, homeTeam)
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

// --- Team matching: date-aware + abbreviation-expanded, NO nickname-only fallback ---

// Expand common abbreviations so "Kansas St" and "Kansas State" normalize the same
function expandAbbreviations(str) {
  return str
    .replace(/\bst\b/g, 'state')
    .replace(/\buniv\b/g, 'university')
    .replace(/\bintl?\b/g, 'international')
    .replace(/\bmt\b/g, 'mount')
    .replace(/\bft\b/g, 'fort')
    // Directional: "N" → "northern", "S" → "southern", etc.
    // Must come after other replacements to avoid conflicts
    .replace(/\bn\b/g, 'northern')
    .replace(/\bs\b/g, 'southern')
    .replace(/\be\b/g, 'eastern')
    .replace(/\bw\b/g, 'western')
    .replace(/\bmiss\b/g, 'mississippi')
}

function normalizeTeam(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

// Expanded normalization for fuzzy comparison — applies abbreviation expansion
function expandedNormalize(name) {
  return expandAbbreviations(normalizeTeam(name))
}

function teamsMatchSingle(a, b) {
  // 1. Exact normalized match
  const na = normalizeTeam(a)
  const nb = normalizeTeam(b)
  if (na === nb) return true

  // 2. Expanded abbreviation match
  const ea = expandedNormalize(a)
  const eb = expandedNormalize(b)
  if (ea === eb) return true

  // 3. Substring match (one contains the other) — catches partial name differences
  if (ea.includes(eb) || eb.includes(ea)) return true

  // 4. School name match — strip the last word (mascot) and compare the school portion.
  //    Handles "Florida International Golden Panthers" vs "Florida International Panthers"
  //    where the mascot word differs but the school is the same.
  const partsA = ea.split(' ')
  const partsB = eb.split(' ')
  if (partsA.length >= 2 && partsB.length >= 2) {
    const schoolA = partsA.slice(0, -1).join(' ')
    const schoolB = partsB.slice(0, -1).join(' ')
    if (schoolA === schoolB) return true
    if (schoolA.includes(schoolB) || schoolB.includes(schoolA)) return true
  }

  // NO nickname-only fallback — this is what caused cross-game contamination
  return false
}

// Extract the UTC game date from a pick's commence_time as YYYY-MM-DD
function pickGameDate(pick) {
  if (!pick.commence_time) return null
  // Both ESPN (scores_cache.game_date) and Odds API (commence_time) use UTC,
  // so splitting at 'T' gives a consistent date for exact matching.
  return new Date(pick.commence_time).toISOString().split('T')[0]
}

function teamsMatch(pick, scoreRow) {
  // Date gate: require exact date match (both are UTC-based YYYY-MM-DD).
  // If either date is missing, skip the date filter to avoid breaking old picks
  // that were saved without commence_time.
  const pDate = pickGameDate(pick)
  const sDate = scoreRow.game_date
  if (pDate && sDate && pDate !== sDate) return false

  return (
    teamsMatchSingle(pick.home_team, scoreRow.home_team) &&
    teamsMatchSingle(pick.away_team, scoreRow.away_team)
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