/**
 * Dumps every ESPN team displayName for all 6 sports.
 * Run: node dump-espn-names.js
 * Output: espn_names.txt
 */

const SPORTS = [
  { id: 'nfl', sport: 'football', league: 'nfl', limit: 40 },
  { id: 'cfb', sport: 'football', league: 'college-football', limit: 1000 },
  { id: 'nba', sport: 'basketball', league: 'nba', limit: 40 },
  { id: 'cbb', sport: 'basketball', league: 'mens-college-basketball', limit: 1000 },
  { id: 'mlb', sport: 'baseball', league: 'mlb', limit: 40 },
  { id: 'nhl', sport: 'hockey', league: 'nhl', limit: 40 },
]

async function main() {
  const fs = await import('fs')
  const lines = []

  for (const s of SPORTS) {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${s.sport}/${s.league}/teams?limit=${s.limit}`
    console.log(`Fetching ${s.id.toUpperCase()}...`)
    try {
      const res = await fetch(url)
      const data = await res.json()
      const teams = data.sports?.[0]?.leagues?.[0]?.teams || []
      const names = teams.map(t => t.team?.displayName).filter(Boolean).sort()
      lines.push(`\n=== ${s.id.toUpperCase()} (${names.length} teams) ===`)
      for (const n of names) lines.push(n)
      console.log(`  ${names.length} teams`)
    } catch (err) {
      console.error(`  Error: ${err.message}`)
    }
  }

  fs.writeFileSync('espn_names.txt', lines.join('\n'))
  console.log('\nDone — saved to espn_names.txt')
  console.log('Paste the contents back to me and I\'ll verify every mapping.')
}

main()
