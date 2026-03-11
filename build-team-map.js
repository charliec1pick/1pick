/**
 * TEAM NAME MAPPER — HISTORICAL EDITION
 * 
 * Pulls every team name from the Odds API HISTORICAL endpoint
 * and ESPN teams/scoreboard endpoints, then builds a complete mapping.
 * 
 * Uses historical snapshots from peak-season dates for each sport
 * so we get every team even for out-of-season sports.
 * 
 * Usage:
 *   node build-team-map.js YOUR_ODDS_API_KEY
 * 
 * Cost: Each historical snapshot = 3 credits (3 markets × 1 region)
 *       ~35 snapshots total ≈ 105 credits
 * 
 * Output:
 *   - team_name_map.json — clean production mapping
 *   - team_name_map_full.json — full map with confidence scores
 *   - team_name_map.js — JS constant for scores.js
 *   - team_name_map.sql — SQL for Supabase table
 */

const ODDS_API_KEY = process.argv[2]
if (!ODDS_API_KEY) {
  console.error('Usage: node build-team-map.js YOUR_ODDS_API_KEY')
  process.exit(1)
}

const SPORTS = [
  {
    id: 'nfl',
    oddsKey: 'americanfootball_nfl',
    espnSport: 'football',
    espnLeague: 'nfl',
    espnTeamsLimit: 40,
    historicalDates: [
      '2024-09-08T18:00:00Z',
      '2024-10-06T18:00:00Z',
      '2024-11-10T18:00:00Z',
      '2024-12-08T18:00:00Z',
    ],
  },
  {
    id: 'cfb',
    oddsKey: 'americanfootball_ncaaf',
    espnSport: 'football',
    espnLeague: 'college-football',
    espnTeamsLimit: 1000,
    espnGroups: '80',
    historicalDates: [
      '2024-08-31T18:00:00Z',
      '2024-09-14T18:00:00Z',
      '2024-09-28T18:00:00Z',
      '2024-10-12T18:00:00Z',
      '2024-10-26T18:00:00Z',
      '2024-11-09T18:00:00Z',
      '2024-11-23T18:00:00Z',
    ],
  },
  {
    id: 'nba',
    oddsKey: 'basketball_nba',
    espnSport: 'basketball',
    espnLeague: 'nba',
    espnTeamsLimit: 40,
    historicalDates: [
      '2024-10-22T23:00:00Z',
      '2024-12-01T18:00:00Z',
      '2025-01-15T23:00:00Z',
      '2025-03-01T23:00:00Z',
    ],
  },
  {
    id: 'cbb',
    oddsKey: 'basketball_ncaab',
    espnSport: 'basketball',
    espnLeague: 'mens-college-basketball',
    espnTeamsLimit: 1000,
    espnGroups: '50',
    historicalDates: [
      '2024-11-12T23:00:00Z',
      '2024-12-07T18:00:00Z',
      '2025-01-11T18:00:00Z',
      '2025-01-25T18:00:00Z',
      '2025-02-08T18:00:00Z',
      '2025-02-22T18:00:00Z',
      '2025-03-08T18:00:00Z',
    ],
  },
  {
    id: 'mlb',
    oddsKey: 'baseball_mlb',
    espnSport: 'baseball',
    espnLeague: 'mlb',
    espnTeamsLimit: 40,
    historicalDates: [
      '2024-04-01T18:00:00Z',
      '2024-06-01T18:00:00Z',
      '2024-08-01T18:00:00Z',
      '2024-09-15T18:00:00Z',
    ],
  },
  {
    id: 'nhl',
    oddsKey: 'icehockey_nhl',
    espnSport: 'hockey',
    espnLeague: 'nhl',
    espnTeamsLimit: 40,
    historicalDates: [
      '2024-10-10T23:00:00Z',
      '2024-12-01T23:00:00Z',
      '2025-01-15T23:00:00Z',
      '2025-03-01T23:00:00Z',
    ],
  },
]

// --- Matching utilities ---

function normalize(name) {
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

function expanded(name) {
  return expandAbbreviations(normalize(name))
}

function schoolName(expandedName) {
  const parts = expandedName.split(' ')
  return parts.length >= 2 ? parts.slice(0, -1).join(' ') : expandedName
}

function matchScore(oddsName, espnName) {
  const na = normalize(oddsName)
  const nb = normalize(espnName)
  if (na === nb) return 100

  const ea = expanded(oddsName)
  const eb = expanded(espnName)
  if (ea === eb) return 95

  if (ea.includes(eb) || eb.includes(ea)) return 85

  const sa = schoolName(ea)
  const sb = schoolName(eb)
  if (sa === sb) return 80
  if (sa.includes(sb) || sb.includes(sa)) return 70

  const mascotA = ea.split(' ').pop()
  const mascotB = eb.split(' ').pop()
  if (mascotA === mascotB && mascotA.length > 3) return 30

  return 0
}

// --- API fetchers ---

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchOddsTeamsHistorical(sport) {
  const teams = new Set()
  let creditsRemaining = '?'

  for (const date of sport.historicalDates) {
    const url = `https://api.the-odds-api.com/v4/historical/sports/${sport.oddsKey}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&date=${date}`
    try {
      const res = await fetch(url)
      creditsRemaining = res.headers.get('x-requests-remaining') || creditsRemaining

      if (!res.ok) {
        const body = await res.text()
        console.error(`  ⚠️  ${date.split('T')[0]}: ${res.status} — ${body.slice(0, 120)}`)
        continue
      }

      const json = await res.json()
      const data = json.data || []

      for (const event of data) {
        if (event.home_team) teams.add(event.home_team)
        if (event.away_team) teams.add(event.away_team)
      }

      console.log(`  📅 ${date.split('T')[0]}: ${data.length} games → ${teams.size} teams total (${creditsRemaining} credits left)`)
    } catch (err) {
      console.error(`  ❌ ${date.split('T')[0]}: ${err.message}`)
    }

    await delay(500)
  }

  return [...teams].sort()
}

async function fetchESPNTeams(sport) {
  const teams = new Set()

  // Teams endpoint
  const teamsUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport.espnSport}/${sport.espnLeague}/teams?limit=${sport.espnTeamsLimit}`
  try {
    const res = await fetch(teamsUrl)
    if (res.ok) {
      const data = await res.json()
      const sportTeams = data.sports?.[0]?.leagues?.[0]?.teams || []
      for (const t of sportTeams) {
        if (t.team?.displayName) teams.add(t.team.displayName)
      }
    }
  } catch (err) {
    console.error(`  ESPN teams failed for ${sport.id}:`, err.message)
  }

  // For college: also pull scoreboards to catch all teams
  if (sport.id === 'cbb' || sport.id === 'cfb') {
    const scoreDates = []
    if (sport.id === 'cbb') {
      for (let d = 0; d < 14; d++) {
        const dt = new Date(); dt.setDate(dt.getDate() - d)
        scoreDates.push(dt.toISOString().split('T')[0].replace(/-/g, ''))
      }
    } else {
      scoreDates.push('20240907','20240921','20241005','20241019','20241102','20241116','20241130')
    }

    for (const dateStr of scoreDates) {
      const groupsParam = sport.espnGroups ? `&groups=${sport.espnGroups}` : ''
      const sbUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport.espnSport}/${sport.espnLeague}/scoreboard?dates=${dateStr}&limit=200${groupsParam}`
      try {
        const res = await fetch(sbUrl)
        if (res.ok) {
          const data = await res.json()
          for (const event of (data.events || [])) {
            const comp = event.competitions?.[0]
            if (!comp) continue
            for (const c of (comp.competitors || [])) {
              if (c.team?.displayName) teams.add(c.team.displayName)
            }
          }
        }
      } catch (err) { /* skip */ }
      await delay(200)
    }
  }

  return [...teams].sort()
}

// --- Main ---

async function main() {
  console.log('🏈 Team Name Mapper — Historical Edition')
  console.log('='.repeat(60))
  console.log(`API Key: ${ODDS_API_KEY.slice(0, 8)}...`)
  console.log('')

  const fullMap = {}
  const allUnmatched = []

  for (const sport of SPORTS) {
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`📊 ${sport.id.toUpperCase()} — ${sport.historicalDates.length} snapshots`)
    console.log(`${'─'.repeat(60)}`)

    const oddsTeams = await fetchOddsTeamsHistorical(sport)
    console.log(`  ✅ Odds API: ${oddsTeams.length} unique teams`)

    const espnTeams = await fetchESPNTeams(sport)
    console.log(`  ✅ ESPN: ${espnTeams.length} unique teams`)

    if (oddsTeams.length === 0) {
      console.log(`  ⚠️  No teams found — check if historical data exists for these dates`)
      continue
    }

    const sportMap = {}
    const unmatchedOdds = []
    const usedESPN = new Set()

    for (const oddsName of oddsTeams) {
      let bestMatch = null
      let bestScore = 0

      for (const espnName of espnTeams) {
        const score = matchScore(oddsName, espnName)
        if (score > bestScore) {
          bestScore = score
          bestMatch = espnName
        }
      }

      if (bestScore >= 70) {
        sportMap[oddsName] = { espn: bestMatch, confidence: bestScore, needsReview: bestScore < 80 }
        usedESPN.add(bestMatch)
      } else if (bestScore >= 30) {
        sportMap[oddsName] = { espn: bestMatch, confidence: bestScore, needsReview: true }
        usedESPN.add(bestMatch)
        unmatchedOdds.push({ oddsName, bestGuess: bestMatch, score: bestScore })
      } else {
        sportMap[oddsName] = { espn: null, confidence: 0, needsReview: true }
        unmatchedOdds.push({ oddsName, bestGuess: bestMatch, score: bestScore })
      }
    }

    fullMap[sport.id] = sportMap

    // Summary
    const exact = Object.values(sportMap).filter(v => v.confidence === 100).length
    const abbrev = Object.values(sportMap).filter(v => v.confidence >= 80 && v.confidence < 100).length
    const fuzzy = Object.values(sportMap).filter(v => v.confidence >= 70 && v.confidence < 80).length
    const flagged = Object.values(sportMap).filter(v => v.needsReview).length

    console.log(`\n  Exact: ${exact} | Abbreviation: ${abbrev} | Fuzzy: ${fuzzy} | ⚠️ Review: ${flagged}`)

    // Show all differences
    const diffs = Object.entries(sportMap).filter(([k, v]) => v.espn && k !== v.espn && v.confidence >= 70)
    if (diffs.length > 0) {
      console.log(`\n  🔄 Name differences (${diffs.length}):`)
      for (const [o, m] of diffs) {
        console.log(`     "${o}" → "${m.espn}" (${m.confidence})${m.needsReview ? ' ⚠️' : ''}`)
      }
    }

    if (unmatchedOdds.length > 0) {
      console.log(`\n  ❌ UNMATCHED (${unmatchedOdds.length}):`)
      for (const u of unmatchedOdds) {
        console.log(`     "${u.oddsName}" → guess: "${u.bestGuess}" (${u.score})`)
      }
      allUnmatched.push(...unmatchedOdds.map(u => ({ sport: sport.id, ...u })))
    }
  }

  // --- Output files ---
  const fs = await import('fs')
  const cleanMap = {}
  let totalMappings = 0, diffMappings = 0

  for (const [sid, sm] of Object.entries(fullMap)) {
    cleanMap[sid] = {}
    for (const [o, m] of Object.entries(sm)) {
      if (m.espn && m.confidence >= 70) {
        cleanMap[sid][o] = m.espn
        totalMappings++
        if (o !== m.espn) diffMappings++
      }
    }
  }

  fs.writeFileSync('team_name_map_full.json', JSON.stringify(fullMap, null, 2))
  fs.writeFileSync('team_name_map.json', JSON.stringify(cleanMap, null, 2))

  // JS file
  const js = [
    '// Auto-generated: Odds API → ESPN team name mapping',
    '// ' + new Date().toISOString(),
    '// ' + totalMappings + ' total, ' + diffMappings + ' differ',
    '', 'const TEAM_NAME_MAP = {',
  ]
  for (const [sid, sm] of Object.entries(cleanMap)) {
    const d = Object.entries(sm).filter(([k, v]) => k !== v)
    if (d.length) {
      js.push(`  // ${sid.toUpperCase()}`)
      for (const [o, e] of d) js.push(`  ${JSON.stringify(o)}: ${JSON.stringify(e)},`)
    }
  }
  js.push('}', '', 'function toESPN(name) { return TEAM_NAME_MAP[name] || name }')
  fs.writeFileSync('team_name_map.js', js.join('\n'))

  // SQL file
  const sql = [
    '-- Auto-generated: Odds API → ESPN team name mapping',
    'CREATE TABLE IF NOT EXISTS team_name_map (odds_api_name TEXT PRIMARY KEY, espn_name TEXT NOT NULL, sport TEXT NOT NULL);',
    'TRUNCATE team_name_map;', '',
  ]
  for (const [sid, sm] of Object.entries(cleanMap)) {
    for (const [o, e] of Object.entries(sm)) {
      sql.push(`INSERT INTO team_name_map VALUES ('${o.replace(/'/g, "''")}', '${e.replace(/'/g, "''")}', '${sid}');`)
    }
  }
  fs.writeFileSync('team_name_map.sql', sql.join('\n'))

  console.log(`\n${'='.repeat(60)}`)
  console.log(`DONE — ${totalMappings} mappings, ${diffMappings} differ, ${allUnmatched.length} need review`)
  console.log(`Files: team_name_map.json, team_name_map_full.json, team_name_map.js, team_name_map.sql`)
  if (allUnmatched.length > 0) {
    console.log(`\n⚠️  REVIEW NEEDED:`)
    for (const u of allUnmatched) console.log(`  [${u.sport}] "${u.oddsName}" → "${u.bestGuess}" (${u.score})`)
  }
}

main().catch(console.error)
