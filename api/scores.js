import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ─── COMPLETE TEAM NAME MAP: Odds API → ESPN ─────────────────────────────────
// Manually verified — March 2026
// Only contains entries where names DIFFER. If not in map, names are identical.

const TEAM_NAME_MAP = {
  // CFB
  "Appalachian State Mountaineers": "App State Mountaineers",
  "Citadel Bulldogs": "The Citadel Bulldogs",
  "Grambling State Tigers": "Grambling Tigers",
  "Hawaii Rainbow Warriors": "Hawai'i Rainbow Warriors",
  "Houston Baptist Huskies": "Houston Christian Huskies",
  "Louisiana Ragin Cajuns": "Louisiana Ragin' Cajuns",
  "Nicholls State Colonels": "Nicholls Colonels",
  "Sam Houston State Bearkats": "Sam Houston Bearkats",
  "San Jose State Spartans": "San José State Spartans",
  "Southern Mississippi Golden Eagles": "Southern Miss Golden Eagles",
  "Texas A&M-Commerce Lions": "East Texas A&M Lions",
  // NBA
  "Los Angeles Clippers": "LA Clippers",
  // CBB
  "Alabama St Hornets": "Alabama State Hornets",
  "Albany Great Danes": "UAlbany Great Danes",
  "Alcorn St Braves": "Alcorn State Braves",
  "American Eagles": "American University Eagles",
  "Appalachian St Mountaineers": "App State Mountaineers",
  "Arizona St Sun Devils": "Arizona State Sun Devils",
  "Arkansas St Red Wolves": "Arkansas State Red Wolves",
  "Arkansas-Little Rock Trojans": "Little Rock Trojans",
  "Army Knights": "Army Black Knights",
  "Boston Univ. Terriers": "Boston University Terriers",
  "CSU Bakersfield Roadrunners": "Cal State Bakersfield Roadrunners",
  "CSU Fullerton Titans": "Cal State Fullerton Titans",
  "CSU Northridge Matadors": "Cal State Northridge Matadors",
  "Cal Baptist Lancers": "California Baptist Lancers",
  "Central Connecticut St Blue Devils": "Central Connecticut Blue Devils",
  "Chicago St Cougars": "Chicago State Cougars",
  "Cleveland St Vikings": "Cleveland State Vikings",
  "Colorado St Rams": "Colorado State Rams",
  "Coppin St Eagles": "Coppin State Eagles",
  "Delaware St Hornets": "Delaware State Hornets",
  "East Tennessee St Buccaneers": "East Tennessee State Buccaneers",
  "Florida Int'l Golden Panthers": "Florida International Panthers",
  "Florida St Seminoles": "Florida State Seminoles",
  "Fort Wayne Mastodons": "Purdue Fort Wayne Mastodons",
  "Fresno St Bulldogs": "Fresno State Bulldogs",
  "GW Revolutionaries": "George Washington Revolutionaries",
  "Gardner-Webb Bulldogs": "Gardner-Webb Runnin' Bulldogs",
  "Georgia St Panthers": "Georgia State Panthers",
  "Grambling St Tigers": "Grambling Tigers",
  "Grand Canyon Antelopes": "Grand Canyon Lopes",
  "IUPUI Jaguars": "IU Indianapolis Jaguars",
  "Illinois St Redbirds": "Illinois State Redbirds",
  "Indiana St Sycamores": "Indiana State Sycamores",
  "Jackson St Tigers": "Jackson State Tigers",
  "Jacksonville St Gamecocks": "Jacksonville State Gamecocks",
  "Kansas St Wildcats": "Kansas State Wildcats",
  "Kennesaw St Owls": "Kennesaw State Owls",
  "LIU Sharks": "Long Island University Sharks",
  "Long Beach St 49ers": "Long Beach State Beach",
  "Loyola (Chi) Ramblers": "Loyola Chicago Ramblers",
  "Loyola (MD) Greyhounds": "Loyola Maryland Greyhounds",
  "Michigan St Spartans": "Michigan State Spartans",
  "Miss Valley St Delta Devils": "Mississippi Valley State Delta Devils",
  "Mississippi St Bulldogs": "Mississippi State Bulldogs",
  "Missouri St Bears": "Missouri State Bears",
  "Montana St Bobcats": "Montana State Bobcats",
  "Morehead St Eagles": "Morehead State Eagles",
  "Morgan St Bears": "Morgan State Bears",
  "Mt. St. Mary's Mountaineers": "Mount St. Mary's Mountaineers",
  "Murray St Racers": "Murray State Racers",
  "N Colorado Bears": "Northern Colorado Bears",
  "New Mexico St Aggies": "New Mexico State Aggies",
  "Nicholls St Colonels": "Nicholls Colonels",
  "Norfolk St Spartans": "Norfolk State Spartans",
  "North Dakota St Bison": "North Dakota State Bison",
  "Northwestern St Demons": "Northwestern State Demons",
  "Oklahoma St Cowboys": "Oklahoma State Cowboys",
  "Oregon St Beavers": "Oregon State Beavers",
  "Portland St Vikings": "Portland State Vikings",
  "Prairie View Panthers": "Prairie View A&M Panthers",
  "SE Missouri St Redhawks": "Southeast Missouri State Redhawks",
  "SIU-Edwardsville Cougars": "SIU Edwardsville Cougars",
  "Sacramento St Hornets": "Sacramento State Hornets",
  "Sam Houston St Bearkats": "Sam Houston Bearkats",
  "San Diego St Aztecs": "San Diego State Aztecs",
  "San José St Spartans": "San José State Spartans",
  "Seattle Redhawks": "Seattle U Redhawks",
  "South Carolina St Bulldogs": "South Carolina State Bulldogs",
  "South Dakota St Jackrabbits": "South Dakota State Jackrabbits",
  "St. Francis (PA) Red Flash": "Saint Francis Red Flash",
  "St. Thomas (MN) Tommies": "St. Thomas-Minnesota Tommies",
  "Tenn-Martin Skyhawks": "UT Martin Skyhawks",
  "Tennessee St Tigers": "Tennessee State Tigers",
  "Texas A&M-CC Islanders": "Texas A&M-Corpus Christi Islanders",
  "UMKC Kangaroos": "Kansas City Roos",
  "UT-Arlington Mavericks": "UT Arlington Mavericks",
  "Washington St Cougars": "Washington State Cougars",
  "Wichita St Shockers": "Wichita State Shockers",
  "Wright St Raiders": "Wright State Raiders",
  "Youngstown St Penguins": "Youngstown State Penguins",
  // MLB
  "Oakland Athletics": "Athletics",
  // NHL
  "Montréal Canadiens": "Montreal Canadiens",
  "St Louis Blues": "St. Louis Blues",
  "Utah Hockey Club": "Utah Mammoth",
}

function toESPN(name) {
  return TEAM_NAME_MAP[name] || name
}

// ─── Result checking ─────────────────────────────────────────────────────────

function determineWinner(homeTeam, awayTeam, homeScore, awayScore) {
  if (homeScore === awayScore) return 'draw'
  return homeScore > awayScore ? homeTeam : awayTeam
}

function checkPickResult(pick, homeTeam, awayTeam, homeScore, awayScore) {
  const winner = determineWinner(homeTeam, awayTeam, homeScore, awayScore)
  const pickTeamESPN = toESPN(pick.team)

  if (pick.category === 'ml-fav' || pick.category === 'ml-dog') {
    if (winner === 'draw') return 'pending'
    if (pickTeamESPN === winner) return 'win'
    if (teamsMatchSingle(pickTeamESPN, winner)) return 'win'
    return 'loss'
  }

  if (pick.category === 'tot-ov' || pick.category === 'tot-un') {
    const match = pick.team.match(/(\d+\.?\d*)/)
    if (!match) return 'pending'
    const total = parseFloat(match[1])
    const combined = homeScore + awayScore
    if (combined === total) return 'pending'
    if (pick.category === 'tot-ov') return combined > total ? 'win' : 'loss'
    if (pick.category === 'tot-un') return combined < total ? 'win' : 'loss'
  }

  if (pick.category === 'sp-fav' || pick.category === 'sp-dog') {
    const match = pick.team.match(/([+-]?\d+\.?\d*)$/)
    if (!match) return 'pending'
    const spread = parseFloat(match[1])
    const teamName = toESPN(pick.team.replace(/[+-]?\d+\.?\d*$/, '').trim())
    const isHome = teamName === homeTeam || teamsMatchSingle(teamName, homeTeam)
    const teamScore = isHome ? homeScore : awayScore
    const oppScore = isHome ? awayScore : homeScore
    const margin = teamScore + spread - oppScore
    if (margin === 0) return 'pending'
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

// ─── Fuzzy matching (safety net only — map handles 99% of cases) ─────────────

function normalizeTeam(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

function expandAbbreviations(str) {
  return str
    .replace(/\bst\b/g, 'state')
    .replace(/\buniv\b/g, 'university')
    .replace(/\bintl?\b/g, 'international')
    .replace(/\bmt\b/g, 'mount')
    .replace(/\bft\b/g, 'fort')
    .replace(/\bn\b/g, 'northern')
    .replace(/\bs\b/g, 'southern')
    .replace(/\be\b/g, 'eastern')
    .replace(/\bw\b/g, 'western')
    .replace(/\bmiss\b/g, 'mississippi')
}

function expandedNormalize(name) {
  return expandAbbreviations(normalizeTeam(name))
}

function teamsMatchSingle(a, b) {
  const na = normalizeTeam(a)
  const nb = normalizeTeam(b)
  if (na === nb) return true
  const ea = expandedNormalize(a)
  const eb = expandedNormalize(b)
  if (ea === eb) return true
  // NO substring or school-name matching — those caused false positives
  // The map handles all known differences. This only catches abbreviation expansions.
  return false
}

function pickGameDate(pick) {
  if (!pick.commence_time) return null
  return new Date(pick.commence_time).toISOString().split('T')[0]
}

function datesWithinOneDay(d1, d2) {
  if (!d1 || !d2) return true // if either is missing, skip date filter
  const a = new Date(d1)
  const b = new Date(d2)
  const diffMs = Math.abs(a - b)
  return diffMs <= 86400000 // 24 hours in ms
}

function teamsMatch(pick, scoreRow) {
  const pDate = pickGameDate(pick)
  const sDate = scoreRow.game_date
  if (!datesWithinOneDay(pDate, sDate)) return false

  // Translate Odds API names to ESPN names via the map
  const pickHome = toESPN(pick.home_team)
  const pickAway = toESPN(pick.away_team)

  // Direct match first (hits ~99% with the map)
  if (pickHome === scoreRow.home_team && pickAway === scoreRow.away_team) return true

  // Fuzzy fallback for any team not yet in the map
  return (
    teamsMatchSingle(pickHome, scoreRow.home_team) &&
    teamsMatchSingle(pickAway, scoreRow.away_team)
  )
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const { data: completedGames, error: scoresError } = await supabase
    .from('scores_cache')
    .select('*')
    .eq('status', 'post')

  if (scoresError || !completedGames?.length) {
    return res.status(200).json({ updated: 0, message: 'No completed games found' })
  }

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