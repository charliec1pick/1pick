import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useOdds } from '../useOdds'

const PICK_CATS = [
  { id: 'ml-fav', label: 'ML Favorite', color: '#4B2E83' },
  { id: 'ml-dog', label: 'ML Underdog', color: '#C9A84C' },
  { id: 'sp-fav', label: 'Spread Fav',  color: '#4B2E83' },
  { id: 'sp-dog', label: 'Spread Dog',  color: '#C9A84C' },
  { id: 'tot-ov', label: 'Total Over',  color: '#1a7a4a' },
  { id: 'tot-un', label: 'Total Under', color: '#6b47b8' },
]

const TOP_25 = [
  { rank: 1,  name: 'Duke Blue Devils' },
  { rank: 2,  name: 'Arizona Wildcats' },
  { rank: 3,  name: 'Michigan Wolverines' },
  { rank: 4,  name: 'UConn Huskies' },
  { rank: 5,  name: 'Florida Gators' },
  { rank: 6,  name: 'Iowa State Cyclones' },
  { rank: 7,  name: 'Houston Cougars' },
  { rank: 8,  name: 'Michigan State Spartans' },
  { rank: 9,  name: 'Nebraska Cornhuskers' },
  { rank: 10, name: 'Texas Tech Red Raiders' },
  { rank: 11, name: 'Illinois Fighting Illini' },
  { rank: 12, name: 'Gonzaga Bulldogs' },
  { rank: 13, name: 'Virginia Cavaliers' },
  { rank: 14, name: 'Kansas Jayhawks' },
  { rank: 15, name: 'Purdue Boilermakers' },
  { rank: 16, name: 'Alabama Crimson Tide' },
  { rank: 17, name: 'North Carolina Tar Heels' },
  { rank: 18, name: "St. John's Red Storm" },
  { rank: 19, name: 'Miami (OH) RedHawks' },
  { rank: 20, name: 'Arkansas Razorbacks' },
  { rank: 21, name: "Saint Mary's Gaels" },
  { rank: 22, name: 'Miami Hurricanes' },
  { rank: 23, name: 'Tennessee Volunteers' },
  { rank: 24, name: 'Vanderbilt Commodores' },
  { rank: 25, name: 'Saint Louis Billikens' },
]

const CONFERENCES = {
  'ACC': ['Boston College Eagles','California Golden Bears','Clemson Tigers','Duke Blue Devils','Florida State Seminoles','Georgia Tech Yellow Jackets','Louisville Cardinals','Miami Hurricanes','NC State Wolfpack','North Carolina Tar Heels','Notre Dame Fighting Irish','Pittsburgh Panthers','SMU Mustangs','Stanford Cardinal','Syracuse Orange','Virginia Cavaliers','Virginia Tech Hokies','Wake Forest Demon Deacons'],
  
  'Big Ten': ['Illinois Fighting Illini','Indiana Hoosiers','Iowa Hawkeyes','Maryland Terrapins','Michigan Wolverines','Michigan State Spartans','Minnesota Golden Gophers','Nebraska Cornhuskers','Northwestern Wildcats','Ohio State Buckeyes','Oregon Ducks','Penn State Nittany Lions','Purdue Boilermakers','Rutgers Scarlet Knights','UCLA Bruins','USC Trojans','Washington Huskies','Wisconsin Badgers'],
  
  'Big 12': ['Arizona Wildcats','Arizona State Sun Devils','Baylor Bears','BYU Cougars','Cincinnati Bearcats','Colorado Buffaloes','Houston Cougars','Iowa State Cyclones','Kansas Jayhawks','Kansas State Wildcats','Oklahoma State Cowboys','TCU Horned Frogs','Texas Tech Red Raiders','UCF Knights','Utah Utes','West Virginia Mountaineers'],
  
  'SEC': ['Alabama Crimson Tide','Arkansas Razorbacks','Auburn Tigers','Florida Gators','Georgia Bulldogs','Kentucky Wildcats','LSU Tigers','Mississippi State Bulldogs','Missouri Tigers','Oklahoma Sooners','Ole Miss Rebels','South Carolina Gamecocks','Tennessee Volunteers','Texas A&M Aggies','Texas Longhorns','Vanderbilt Commodores'],
  
  'Big East': ['Butler Bulldogs','Creighton Bluejays','DePaul Blue Demons','Georgetown Hoyas','Marquette Golden Eagles','Providence Friars','Seton Hall Pirates',"St. John's Red Storm",'UConn Huskies','Villanova Wildcats','Xavier Musketeers'],
  
  'American': ['Charlotte 49ers','East Carolina Pirates','Florida Atlantic Owls','Memphis Tigers','North Texas Mean Green','Rice Owls','South Florida Bulls','Temple Owls','Tulane Green Wave','Tulsa Golden Hurricane','UAB Blazers','UTSA Roadrunners','Wichita State Shockers'],
  
  'Mountain West': ['Air Force Falcons','Boise State Broncos','Colorado State Rams','Fresno State Bulldogs','Grand Canyon Antelopes','Nevada Wolf Pack','New Mexico Lobos','San Diego State Aztecs','UNLV Rebels','Utah State Aggies','Wyoming Cowboys'],
  
  'A-10': ['Davidson Wildcats','Dayton Flyers','Duquesne Dukes','Fordham Rams','George Mason Patriots','George Washington Revolutionaries','La Salle Explorers','Loyola Chicago Ramblers','Rhode Island Rams','Richmond Spiders',"Saint Joseph's Hawks",'Saint Louis Billikens','St. Bonaventure Bonnies','VCU Rams'],
  
  'Sun Belt': ['App State Mountaineers','Arkansas State Red Wolves','Coastal Carolina Chanticleers','Georgia Southern Eagles','Georgia State Panthers','James Madison Dukes',"Louisiana Ragin' Cajuns",'Marshall Thundering Herd','Old Dominion Monarchs','South Alabama Jaguars','Southern Miss Golden Eagles','Texas State Bobcats','Troy Trojans'],
  
  'MAC': ['Akron Zips','Ball State Cardinals','Bowling Green Falcons','Buffalo Bulls','Central Michigan Chippewas','Eastern Michigan Eagles','Kent State Golden Flashes','Miami (OH) RedHawks','Northern Illinois Huskies','Ohio Bobcats','Toledo Rockets','UMass Minutemen','Western Michigan Broncos'],
  
  'CUSA': ['Delaware Fightin Blue Hens','Florida International Panthers','Jacksonville State Gamecocks','Liberty Flames','Louisiana Tech Bulldogs','Middle Tennessee Blue Raiders','Missouri State Bears','New Mexico State Aggies','Sam Houston Bearkats','UTEP Miners','Western Kentucky Hilltoppers'],
  
  'MVC': ['Bradley Braves','Drake Bulldogs','Evansville Purple Aces','Illinois State Redbirds','Indiana State Sycamores','Missouri State Bears','Murray State Racers','Northern Iowa Panthers','Southern Illinois Salukis','Belmont Bruins'],
  
  'WCC': ['Gonzaga Bulldogs','Loyola Marymount Lions','Oregon State Beavers','Pacific Tigers','Pepperdine Waves','Portland Pilots','San Diego Toreros','San Francisco Dons','Santa Clara Broncos',"Saint Mary's Gaels",'Seattle Redhawks','Washington State Cougars'],
  
  'Horizon': ['Cleveland State Vikings','Detroit Mercy Titans','Green Bay Phoenix','Illinois Chicago Flames','Milwaukee Panthers','Northern Illinois Huskies','Northern Kentucky Norse','Oakland Golden Grizzlies','Purdue Fort Wayne Mastodons','Wright State Raiders','Youngstown State Penguins'],
  
  'Ivy League': ['Brown Bears','Columbia Lions','Cornell Big Red','Dartmouth Big Green','Harvard Crimson','Pennsylvania Quakers','Princeton Tigers','Yale Bulldogs'],
  
  'Patriot': ['Army Black Knights','Boston University Terriers','Bucknell Bison','Colgate Raiders','Holy Cross Crusaders','Lafayette Leopards','Lehigh Mountain Hawks','Loyola Maryland Greyhounds','Navy Midshipmen'],
  
  'SoCon': ['Chattanooga Mocs','ETSU Buccaneers','Furman Paladins','Mercer Bears','Samford Bulldogs','The Citadel Bulldogs','UNC Greensboro Spartans','VMI Keydets','Western Carolina Catamounts','Wofford Terriers'],
  
  'CAA': ['Campbell Fighting Camels','Charleston Cougars','Delaware Fightin Blue Hens','Drexel Dragons','Elon Phoenix','Hampton Pirates','Hofstra Pride','Monmouth Hawks','Northeastern Huskies','Stony Brook Seawolves','Towson Tigers','UNC Wilmington Seahawks','William & Mary Tribe'],
  
  'SWAC': ['Alabama A&M Bulldogs','Alabama State Hornets','Alcorn State Braves','Arkansas-Pine Bluff Golden Lions','Bethune-Cookman Wildcats','Florida A&M Rattlers','Grambling Tigers','Jackson State Tigers','Mississippi Valley State Delta Devils','Prairie View Panthers','Southern Jaguars','Texas Southern Tigers'],
  
  'MEAC': ['Coppin State Eagles','Delaware State Hornets','Howard Bison','Maryland Eastern Shore Hawks','Morgan State Bears','Norfolk State Spartans','North Carolina A&T Aggies','North Carolina Central Eagles','South Carolina State Bulldogs'],
  
  'OVC': ['Eastern Illinois Panthers','Lindenwood Lions','Little Rock Trojans','Morehead State Eagles','SIU Edwardsville Cougars','Southeast Missouri State Redhawks','Tennessee State Tigers','UT Martin Skyhawks'],
  
  'WAC': ['Abilene Christian Wildcats','Chicago State Cougars','Grand Canyon Antelopes','Sam Houston Bearkats','Southern Utah Thunderbirds','Tarleton State Texans','Texas Rio Grande Valley Vaqueros','Utah Tech Trailblazers','Utah Valley Wolverines'],
  
  'Big South': ['Campbell Fighting Camels','Charleston Southern Buccaneers','Gardner-Webb Runnin Bulldogs','High Point Panthers','Longwood Lancers','Presbyterian Blue Hose','Radford Highlanders','UNC Asheville Bulldogs','Winthrop Eagles'],
  
  'NEC': ['Bryant Bulldogs','Central Connecticut Blue Devils','Fairleigh Dickinson Knights','LIU Sharks','Merrimack Warriors',"Mount St. Mary's Mountaineers",'New Haven Nighthawks','Sacred Heart Pioneers','Saint Francis Red Flash','Wagner Seahawks'],
  
  'MAAC': ['Canisius Golden Griffins','Fairfield Stags','Iona Gaels','Manhattan Jaspers','Marist Red Foxes','Niagara Purple Eagles','Quinnipiac Bobcats','Rider Broncs','Sacred Heart Pioneers','Siena Saints',"Saint Peter's Peacocks"],
  
  'Big West': ['Cal Poly Mustangs','Cal State Fullerton Titans','Hawaii Rainbow Warriors','Long Beach State Beach','UC Davis Aggies','UC Irvine Anteaters','UC Riverside Highlanders','UC San Diego Tritons','UC Santa Barbara Gauchos'],
  
  'Summit': ['Denver Pioneers','Kansas City Roos','North Dakota Fighting Hawks','North Dakota State Bison','Omaha Mavericks','Oral Roberts Golden Eagles','South Dakota Coyotes','South Dakota State Jackrabbits'],
  
  'America East': ['Binghamton Bearcats','Bryant Bulldogs','Maine Black Bears','New Hampshire Wildcats','NJIT Highlanders','UAlbany Great Danes','UMBC Retrievers','UMass Lowell River Hawks','Vermont Catamounts'],
  
  'Big Sky': ['Eastern Washington Eagles','Idaho State Bengals','Idaho Vandals','Montana Grizzlies','Montana State Bobcats','Northern Arizona Lumberjacks','Northern Colorado Bears','Portland State Vikings','Sacramento State Hornets','Weber State Wildcats'],
  
  'ASUN': ['Austin Peay Governors','Bellarmine Knights','Central Arkansas Bears','Eastern Kentucky Colonels','Florida Gulf Coast Eagles','Jacksonville Dolphins','Lipscomb Bisons','North Alabama Lions','North Florida Ospreys','Queens University Royals','Stetson Hatters','West Georgia Wolves'],
}
export default function Picks({ session, activeSport }) {
  const [myPools, setMyPools] = useState([])
  const [allPoolEntries, setAllPoolEntries] = useState([])
  const [activePoolEntry, setActivePoolEntry] = useState(null)
  const [picks, setPicks] = useState({})
  const [units, setUnits] = useState({ 'ml-fav': 15, 'ml-dog': 15, 'sp-fav': 15, 'sp-dog': 15, 'tot-ov': 15, 'tot-un': 15 })
  const [openModal, setOpenModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [totalSessions, setTotalSessions] = useState(1)
  const [viewingPastSession, setViewingPastSession] = useState(false)
  const [saving, setSaving] = useState(false)
  const [gameFilter, setGameFilter] = useState('all')
  const [gameSearch, setGameSearch] = useState('')
  const [liveScores, setLiveScores] = useState({}) // keyed by "away_team|home_team"

  const totalUnits = units['ml-fav'] + units['ml-dog'] + units['sp-fav'] + units['sp-dog'] + units['tot-ov'] + units['tot-un']
  const remaining = 100 - totalUnits

  useEffect(() => { loadMyPools() }, [activeSport])

  // Poll scores_cache every 60s for live score updates
  useEffect(() => {
    fetchLiveScores()
    const interval = setInterval(fetchLiveScores, 60_000)
    return () => clearInterval(interval)
  }, [activeSport])

  async function fetchLiveScores() {
    const sportsToQuery = activeSport === 'multi'
      ? ['nba', 'cbb', 'nfl', 'cfb', 'mlb', 'nhl']
      : [activeSport]

    const { data } = await supabase
      .from('scores_cache')
      .select('*')
      .in('sport', sportsToQuery)

    if (!data) return
    const map = {}
    for (const row of data) {
      const key = `${row.away_team}|${row.home_team}`
      map[key] = row
    }
    setLiveScores(map)
  }

  function getLiveScore(pick) {
    if (!pick?.awayTeam || !pick?.homeTeam) return null
    const key = `${pick.awayTeam}|${pick.homeTeam}`
    return liveScores[key] || null
  }

  async function loadMyPools() {
    setLoading(true)
    setPicks({})
    setUnits({ 'ml-fav': 15, 'ml-dog': 15, 'sp-fav': 15, 'sp-dog': 15, 'tot-ov': 15, 'tot-un': 15 })

    const { data: allEntries } = await supabase
      .from('pool_entries')
      .select('*, friend_pools(*)')
      .eq('user_id', session.user.id)

    if (allEntries) {
      setAllPoolEntries(allEntries)
      const currentEntries = allEntries.filter(entry => {
        const pool = entry.friend_pools
        if (!pool) return false
        if (pool.sport !== activeSport) return false
        return entry.period === (pool.current_period || 1)
      })
      setMyPools(currentEntries)
      if (currentEntries.length > 0) {
        const pool = currentEntries[0].friend_pools
        const currentPeriod = pool.current_period || 1
        setTotalSessions(currentPeriod)
        setSelectedSession(currentPeriod)
        setViewingPastSession(false)
        setActivePoolEntry(currentEntries[0])
        await loadPicks(currentEntries[0].id)
      }
    } else {
      setMyPools([])
    }
    setLoading(false)
  }

  async function loadPicks(poolEntryId) {
    const { data } = await supabase.from('picks').select('*').eq('pool_entry_id', poolEntryId)
    if (data && data.length > 0) {
      const pickMap = {}
      const unitMap = { 'ml-fav': 15, 'ml-dog': 15, 'sp-fav': 15, 'sp-dog': 15, 'tot-ov': 15, 'tot-un': 15 }
      data.forEach(p => {
        pickMap[p.category] = {
          gameId: p.game_id, team: p.team, lockedOdds: p.locked_odds,
          homeTeam: p.home_team, awayTeam: p.away_team,
          result: p.result, payoutUnits: p.payout_units, units: p.units
        }
        unitMap[p.category] = p.units
      })
      setPicks(pickMap)
      setUnits(unitMap)
    } else {
      setPicks({})
      setUnits({ 'ml-fav': 15, 'ml-dog': 15, 'sp-fav': 15, 'sp-dog': 15, 'tot-ov': 15, 'tot-un': 15 })
    }
  }

  async function handleSessionChange(sessionNum) {
    if (!activePoolEntry) return
    setSelectedSession(sessionNum)
    const currentPeriod = activePoolEntry.friend_pools.current_period || 1
    const isPast = sessionNum < currentPeriod
    setViewingPastSession(isPast)
    const poolEntry = allPoolEntries.find(e =>
      e.friend_pool_id === activePoolEntry.friend_pool_id && e.period === sessionNum
    )
    if (poolEntry) {
      await loadPicks(poolEntry.id)
    } else {
      setPicks({})
      setUnits({ 'ml-fav': 15, 'ml-dog': 15, 'sp-fav': 15, 'sp-dog': 15, 'tot-ov': 15, 'tot-un': 15 })
    }
  }

  async function savePick(catId, gameId, team, lockedOdds, homeTeam, awayTeam) {
    if (!activePoolEntry) return
    if (viewingPastSession) return
    if (saving) return
    const game = games.find(g => g.id === gameId)
    if (game?.started) return
    setSaving(true)
    const { data: existingData } = await supabase.from('picks').select('id').eq('pool_entry_id', activePoolEntry.id).eq('category', catId)
    const existing = existingData?.[0] || null
    if (existing) {
      await supabase.from('picks').update({
        game_id: gameId, team, locked_odds: lockedOdds,
        home_team: homeTeam, away_team: awayTeam,
        units: units[catId], updated_at: new Date().toISOString()
      }).eq('id', existing.id)
    } else {
      await supabase.from('picks').insert({
        user_id: session.user.id,
        pool_entry_id: activePoolEntry.id,
        category: catId, game_id: gameId,
        team, locked_odds: lockedOdds,
        home_team: homeTeam, away_team: awayTeam,
        units: units[catId]
      })
    }
    setPicks(prev => ({ ...prev, [catId]: { gameId, team, lockedOdds, homeTeam, awayTeam } }))
    setOpenModal(null)
    setSaving(false)
  }

  async function increment(catId) {
    if (viewingPastSession) return
    const pick = picks[catId]
    const game = pick ? games.find(g => g.id === pick.gameId) : null
    const locked = !game && !!pick ? true : game?.started || false
    if (locked) return
    const current = units[catId]
    if (totalUnits >= 100) return
    if (current >= 40) return
    const newVal = current + 1
    setUnits(prev => ({ ...prev, [catId]: newVal }))
    if (pick && activePoolEntry) {
      const { data: existingData } = await supabase.from('picks').select('id').eq('pool_entry_id', activePoolEntry.id).eq('category', catId)
      const existing = existingData?.[0] || null
      if (existing) await supabase.from('picks').update({ units: newVal, updated_at: new Date().toISOString() }).eq('id', existing.id)
    }
  }

  async function decrement(catId) {
    if (viewingPastSession) return
    const pick = picks[catId]
    const game = pick ? games.find(g => g.id === pick.gameId) : null
    const locked = !game && !!pick ? true : game?.started || false
    if (locked) return
    const current = units[catId]
    if (current <= 1) return
    const newVal = current - 1
    setUnits(prev => ({ ...prev, [catId]: newVal }))
    if (pick && activePoolEntry) {
      const { data: existingData } = await supabase.from('picks').select('id').eq('pool_entry_id', activePoolEntry.id).eq('category', catId)
      const existing = existingData?.[0] || null
      if (existing) await supabase.from('picks').update({ units: newVal, updated_at: new Date().toISOString() }).eq('id', existing.id)
    }
  }

  async function setUnitVal(catId, val) {
    if (viewingPastSession) return
    const pick = picks[catId]
    const game = pick ? games.find(g => g.id === pick.gameId) : null
    const locked = !game && !!pick ? true : game?.started || false
    if (locked) return
    const newVal = Math.max(1, Math.min(40, parseInt(val) || 1))
    const otherTotal = totalUnits - units[catId]
    const capped = Math.min(newVal, 100 - otherTotal)
    setUnits(prev => ({ ...prev, [catId]: capped }))
    if (pick && activePoolEntry) {
      const { data: existingData } = await supabase.from('picks').select('id').eq('pool_entry_id', activePoolEntry.id).eq('category', catId)
      const existing = existingData?.[0] || null
      if (existing) await supabase.from('picks').update({ units: capped, updated_at: new Date().toISOString() }).eq('id', existing.id)
    }
  }

  function filterGames(gameList) {
    let filtered = gameList
    // Date window filter
    const pool = activePoolEntry?.friend_pools
    if (pool?.session_start && pool?.session_end) {
      filtered = filtered.filter(g => {
        const gameDate = g.commence_time.split('T')[0]
        return gameDate >= pool.session_start && gameDate <= pool.session_end
      })
    }
    // Conference / Top 25 filter
if (gameFilter === 'top25') {
  filtered = filtered.filter(g =>
    TOP_25.some(t => g.home === t.name || g.away === t.name)
  )
} else if (gameFilter !== 'all' && CONFERENCES[gameFilter]) {
  const teams = CONFERENCES[gameFilter]
  filtered = filtered.filter(g =>
    teams.some(t => g.home === t || g.away === t)
  )
}
    // Search filter
    if (gameSearch.trim()) {
      const q = gameSearch.toLowerCase()
      filtered = filtered.filter(g =>
        g.home?.toLowerCase().includes(q) || g.away?.toLowerCase().includes(q)
      )
    }
    return filtered
  }

  const { games, odds, loading: oddsLoading, error: oddsError } = useOdds(activeSport)

  if (loading || oddsLoading) return <div style={s.empty}>Loading...</div>
  if (oddsError) return <div style={s.empty}>⚠️ {oddsError}</div>
  if (myPools.length === 0) return (
    <div style={s.empty}>
      <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>🎯</div>
      <strong>No pools entered yet</strong>
      <div style={{ marginTop: '6px', fontSize: '0.85rem' }}>Go to Lobby to join or create a pool first.</div>
    </div>
  )

  const sessionOptions = Array.from({ length: totalSessions }, (_, i) => i + 1)
  const currentPeriod = activePoolEntry?.friend_pools?.current_period || 1

  return (
    <div>
      {myPools.length > 1 && (
        <div style={s.poolSelector}>
          <div style={s.poolSelectorLabel}>Pool</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {myPools.map(entry => (
              <div key={entry.id} style={{ ...s.poolChip, ...(activePoolEntry?.friend_pool_id === entry.friend_pool_id ? s.poolChipActive : {}) }}
                onClick={() => {
                  setPicks({})
                  setUnits({ 'ml-fav': 15, 'ml-dog': 15, 'sp-fav': 15, 'sp-dog': 15, 'tot-ov': 15, 'tot-un': 15 })
                  setActivePoolEntry(entry)
                  const p = entry.friend_pools.current_period || 1
                  setTotalSessions(p)
                  setSelectedSession(p)
                  setViewingPastSession(false)
                  loadPicks(entry.id)
                }}>
                {entry.friend_pools.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={s.sessionBar}>
        <div style={s.sessionLabel}>Session</div>
        <select style={s.sessionSelect} value={selectedSession || currentPeriod}
          onChange={e => handleSessionChange(parseInt(e.target.value))}>
          {sessionOptions.map(n => (
            <option key={n} value={n}>
              {n === currentPeriod ? `Session ${n} (Current)` : `Session ${n}`}
            </option>
          ))}
        </select>
        {viewingPastSession && <div style={s.pastBadge}>📖 Read Only</div>}
      </div>

      {!viewingPastSession && (
        <div style={s.unitsPanel}>
          <div style={s.unitsLeft}>
            <div style={s.unitsLabel}>Left</div>
            <div style={{ ...s.unitsNumber, color: remaining < 0 ? '#c0392b' : '#4B2E83' }}>{remaining}</div>
          </div>
          <div style={s.unitsDivider} />
          <div style={{ flex: 1 }}>
            <div style={s.unitsLabel}>Units Allocated — {totalUnits}/100</div>
            <div style={s.unitsTrack}>
              <div style={{ ...s.unitsFill, width: Math.min(totalUnits, 100) + '%', background: remaining < 0 ? '#c0392b' : 'linear-gradient(90deg,#4B2E83,#C9A84C)' }} />
            </div>
            <div style={s.unitsSub}>
              {remaining > 0 ? `${remaining} units left to allocate` : remaining === 0 ? '✅ All 100 units allocated' : '⚠️ Over budget'}
            </div>
          </div>
        </div>
      )}

      <div style={s.sectionTitle}>
        <span>{viewingPastSession ? `Session ${selectedSession} Results` : "This Session's Picks — Tap to select"}</span>
      </div>

      <div style={s.picksGrid}>
        {PICK_CATS.map(cat => {
          const pick = picks[cat.id]
          const game = pick ? games.find(g => g.id === pick.gameId) : null
          const locked = viewingPastSession || (!game && !!pick) || game?.started || false
          const catUnits = units[cat.id]
          const canIncrease = !locked && totalUnits < 100 && catUnits < (cat.id === 'ml-dog' ? 10 : 40)
          const result = pick?.result
          const resultColor = result === 'win' ? '#1a7a4a' : result === 'loss' ? '#c0392b' : '#888580'
          const resultLabel = result === 'win' ? '✅ Win' : result === 'loss' ? '❌ Loss' : result === 'pending' ? '⏳ Pending' : null
          const liveScore = pick ? getLiveScore(pick) : null
          const isLive = liveScore?.status === 'in'
          const isFinal = liveScore?.status === 'post'

          return (
            <div key={cat.id}
              style={{ ...s.pickCard, borderColor: pick ? (result === 'win' ? '#1a7a4a' : result === 'loss' ? '#c0392b' : isLive ? '#e05c00' : cat.color) : '#e2dfd8', opacity: locked && !viewingPastSession ? 0.75 : 1 }}
              onClick={() => { if (!locked) { setGameFilter('all'); setGameSearch(''); setOpenModal(cat.id) } }}>
              <div style={{ ...s.pickCardTop, background: isLive ? '#e05c00' : cat.color }}>
                <div style={s.pickTypeLabel}>{cat.label}</div>
                <div style={s.pickLockBadge}>
                  {isLive ? `🔴 LIVE · ${liveScore.period}` : viewingPastSession ? (resultLabel || '—') : locked ? '🔒 Locked' : 'Open'}
                </div>
              </div>
              <div style={s.pickCardBody}>
                {pick ? (
                  <>
                    <div style={s.pickTeam}>{pick.team}</div>
                    <div style={s.pickMeta}>
                      {game ? `${game.away} @ ${game.home}` : pick.awayTeam && pick.homeTeam ? `${pick.awayTeam} @ ${pick.homeTeam}` : ''}
                    </div>

                    {/* Live / Final score display */}
                    {liveScore && (isLive || isFinal) && (
                      <div style={s.liveScoreBox}>
                        <div style={s.liveScoreRow}>
                          <span style={s.liveTeamName}>{liveScore.away_team}</span>
                          <span style={s.liveScoreNum}>{liveScore.away_score}</span>
                        </div>
                        <div style={s.liveScoreRow}>
                          <span style={s.liveTeamName}>{liveScore.home_team}</span>
                          <span style={s.liveScoreNum}>{liveScore.home_score}</span>
                        </div>
                        <div style={s.liveStatusLine}>
                          {isLive
                            ? `${liveScore.clock} · ${liveScore.period}`
                            : `Final${liveScore.period === 'OT' ? ' (OT)' : ''}`}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      <span style={s.oddsChip}>{pick.lockedOdds}</span>
                      {(viewingPastSession || isFinal) && result && result !== 'pending' && (
                        <div style={{ ...s.payoutChip, color: resultColor }}>
                          {result === 'win' ? `+${pick.payoutUnits}` : pick.payoutUnits} units
                        </div>
                      )}
                      {result === 'pending' && (isLive || isFinal) && (
                        <div style={{ ...s.payoutChip, color: '#888580' }}>⏳ Pending</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={s.pickEmpty}>{viewingPastSession ? 'No pick made' : 'Tap to choose a game →'}</div>
                )}
              </div>
              {!viewingPastSession && (
                <div style={s.pickCardFooter} onClick={e => e.stopPropagation()}>
                  <button style={{ ...s.unitBtn, opacity: locked ? 0.4 : 1 }} onClick={() => !locked && decrement(cat.id)}>−</button>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <input
                      style={{ ...s.unitDisplay, color: cat.color, border: '1.5px solid #e2dfd8', borderRadius: '8px', padding: '3px 8px', width: '100%', textAlign: 'center', outline: 'none' }}
                      type="number" min="1" max={cat.id === 'ml-dog' ? 10 : 40} value={catUnits}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => { e.stopPropagation(); if (['ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault() }}
                      onChange={e => { e.stopPropagation(); !locked && setUnitVal(cat.id, e.target.value) }}
                    />
                    <div style={s.unitLabel}>units</div>
                  </div>
                  <button style={{ ...s.unitBtn, opacity: canIncrease ? 1 : 0.4 }} onClick={() => increment(cat.id)}>+</button>
                </div>
              )}
              {viewingPastSession && (
                <div style={{ ...s.pickCardFooter, justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#888580', fontFamily: "'Barlow Condensed',sans-serif" }}>
                    {pick ? `${pick.units || catUnits} units wagered` : '—'}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!viewingPastSession && openModal && (
        <div style={s.modalOverlay} onClick={() => setOpenModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <div style={{ ...s.modalTag, background: PICK_CATS.find(c => c.id === openModal)?.color }}>
                  {PICK_CATS.find(c => c.id === openModal)?.label}
                </div>
                <div style={s.modalTitle}>Select Your Pick</div>
                <div style={s.modalHint}>Odds freeze when you pick. Change anytime before game starts.</div>
              </div>
              <button style={s.modalClose} onClick={() => setOpenModal(null)}>✕</button>
            </div>

            {/* Filter bar */}
            <div style={s.filterBar}>
              <select
                style={s.filterSelect}
                value={gameFilter}
                onChange={e => setGameFilter(e.target.value)}>
                <option value="all">All Games</option>
                <option value="top25">⭐ Top 25</option>
                <optgroup label="Conferences">
                  {Object.keys(CONFERENCES).map(conf => (
                    <option key={conf} value={conf}>{conf}</option>
                  ))}
                </optgroup>
              </select>
              <input
                style={s.filterSearch}
                type="text"
                placeholder="Search team..."
                value={gameSearch}
                onChange={e => setGameSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>

            <div style={{ padding: '14px 16px 24px' }}>
              {(() => {
                const filtered = filterGames(games).filter(game => odds[game.id]?.[openModal])
                if (filtered.length === 0) return (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#888580', fontSize: '0.85rem' }}>
                    No games match your filter
                  </div>
                )
                return filtered.map(game => {
                  const gameOdds = odds[game.id]?.[openModal]
                  if (!gameOdds) return null
                  const isSelected = picks[openModal]?.gameId === game.id
                  return (
                    <div key={game.id}
                      style={{ ...s.modalGame, borderColor: isSelected ? PICK_CATS.find(c => c.id === openModal)?.color : '#e2dfd8', background: isSelected ? '#f0eaf9' : '#fff', opacity: game.started ? 0.45 : saving ? 0.6 : 1, cursor: game.started ? 'not-allowed' : saving ? 'wait' : 'pointer' }}
                      onClick={() => !game.started && savePick(openModal, game.id, gameOdds.team, gameOdds.odds, game.home, game.away)}>
                      <div style={s.modalGameHeader}>
                        <span>
                          {(() => {
                            const awayRank = TOP_25.find(t => game.away?.includes(t.name))
                            const homeRank = TOP_25.find(t => game.home?.includes(t.name))
                            return (
                              <>
                                {awayRank && <span style={s.rankBadge}>#{awayRank.rank}</span>}{game.away} @ {homeRank && <span style={s.rankBadge}>#{homeRank.rank}</span>}{game.home}
                              </>
                            )
                          })()}
                        </span>
                        <span style={{ color: game.started ? '#c0392b' : '#888580' }}>{game.started ? '🔒 In Progress' : game.time}</span>
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <div style={s.modalPickName}>{gameOdds.team}</div>
                        <div style={s.modalPickOdds}>Odds: <strong style={{ color: PICK_CATS.find(c => c.id === openModal)?.color }}>{gameOdds.odds}</strong></div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  empty: { textAlign: 'center', padding: '60px 20px', color: '#888580', background: '#fff', border: '2px dashed #e2dfd8', borderRadius: '12px' },
  poolSelector: { background: '#fff', border: '1px solid #e2dfd8', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  poolSelectorLabel: { fontSize: '0.66rem', fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888580', whiteSpace: 'nowrap' },
  poolChip: { padding: '5px 14px', borderRadius: '20px', fontSize: '0.7rem', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, cursor: 'pointer', border: '1.5px solid #e2dfd8', color: '#888580', background: '#f9f8f6' },
  poolChipActive: { background: '#4B2E83', borderColor: '#4B2E83', color: '#fff' },
  sessionBar: { background: '#fff', border: '1px solid #e2dfd8', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
  sessionLabel: { fontSize: '0.66rem', fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888580', whiteSpace: 'nowrap' },
  sessionSelect: { padding: '5px 10px', borderRadius: '7px', border: '1.5px solid #e2dfd8', background: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: '0.72rem', color: '#4B2E83', cursor: 'pointer', outline: 'none' },
  pastBadge: { marginLeft: 'auto', fontSize: '0.66rem', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, color: '#888580', background: '#f9f8f6', border: '1px solid #e2dfd8', borderRadius: '6px', padding: '3px 10px' },
  unitsPanel: { background: '#fff', border: '1px solid #e2dfd8', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' },
  unitsLeft: { textAlign: 'center', minWidth: '56px' },
  unitsLabel: { fontSize: '0.58rem', fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888580' },
  unitsNumber: { fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: '2rem', lineHeight: 1 },
  unitsDivider: { width: '1px', height: '40px', background: '#e2dfd8' },
  unitsTrack: { background: '#e2dfd8', borderRadius: '4px', height: '7px', margin: '6px 0' },
  unitsFill: { height: '100%', borderRadius: '4px', transition: 'width 0.3s' },
  unitsSub: { fontSize: '0.7rem', color: '#888580' },
  sectionTitle: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '3px', color: '#888580', textTransform: 'uppercase', marginBottom: '14px' },
  picksGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '14px', marginBottom: '20px' },
  pickCard: { background: '#fff', border: '1.5px solid #e2dfd8', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer' },
  pickCardTop: { padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  pickTypeLabel: { fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.9)' },
  pickLockBadge: { fontSize: '0.62rem', background: 'rgba(0,0,0,0.22)', color: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: '10px', fontFamily: "'Barlow Condensed',sans-serif" },
  pickCardBody: { padding: '12px 14px', minHeight: '64px' },
  pickEmpty: { fontSize: '0.8rem', color: '#888580', fontStyle: 'italic' },
  pickTeam: { fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', marginBottom: '2px' },
  pickMeta: { fontSize: '0.7rem', color: '#888580' },
  oddsChip: { display: 'inline-block', background: '#fdf8ed', color: '#C9A84C', border: '1px solid #C9A84C', borderRadius: '6px', padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: '0.75rem', marginTop: '4px' },
  payoutChip: { display: 'inline-block', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: '0.75rem', marginTop: '4px', marginLeft: '6px' },
  pickCardFooter: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderTop: '1px solid #e2dfd8', background: '#f9f8f6' },
  unitBtn: { width: '28px', height: '28px', borderRadius: '7px', border: '1.5px solid #e2dfd8', background: '#fff', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  unitDisplay: { fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.4rem', lineHeight: 1 },
  unitLabel: { fontSize: '0.56rem', fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888580', textAlign: 'center', marginTop: '2px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  modalBox: { background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '600px', maxHeight: '82vh', overflowY: 'auto' },
  modalHeader: { padding: '20px 20px 14px', borderBottom: '1px solid #e2dfd8', position: 'sticky', top: 0, background: '#fff', zIndex: 1 },
  modalTag: { display: 'inline-block', padding: '3px 10px', borderRadius: '6px', fontSize: '0.63rem', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fff', marginBottom: '5px' },
  modalTitle: { fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.15rem', marginBottom: '2px' },
  modalHint: { fontSize: '0.73rem', color: '#888580' },
  modalClose: { position: 'absolute', top: '16px', right: '16px', background: '#f9f8f6', border: '1px solid #e2dfd8', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', color: '#888580' },
  filterBar: { padding: '10px 16px', borderBottom: '1px solid #e2dfd8', background: '#f9f8f6', display: 'flex', gap: '8px', alignItems: 'center', position: 'sticky', top: '93px', zIndex: 1 },
  filterSelect: { padding: '6px 10px', borderRadius: '7px', border: '1.5px solid #e2dfd8', background: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: '0.72rem', color: '#4B2E83', cursor: 'pointer', outline: 'none', flexShrink: 0 },
  filterSearch: { flex: 1, padding: '6px 12px', borderRadius: '7px', border: '1.5px solid #e2dfd8', background: '#fff', fontFamily: "'Barlow',sans-serif", fontSize: '0.82rem', outline: 'none', color: '#333' },
  modalGame: { border: '1.5px solid #e2dfd8', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden' },
  modalGameHeader: { padding: '7px 14px', background: '#f9f8f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', color: '#888580' },
  modalPickName: { fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: '0.88rem' },
  modalPickOdds: { fontSize: '0.72rem', color: '#888580', marginTop: '2px' },
  rankBadge: { display:'inline-block', background:'#4B2E83', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'0.58rem', padding:'1px 5px', borderRadius:'4px', marginRight:'4px', verticalAlign:'middle' },
  liveScoreBox: { background: '#f9f8f6', border: '1px solid #e2dfd8', borderRadius: '8px', padding: '7px 10px', margin: '6px 0 4px', fontSize: '0.78rem' },
  liveScoreRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' },
  liveTeamName: { fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: '0.73rem', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' },
  liveScoreNum: { fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: '1rem', color: '#1a1a1a', marginLeft: '8px' },
  liveStatusLine: { fontFamily: "'Barlow Condensed',sans-serif", fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '1.2px', color: '#e05c00', fontWeight: 700, marginTop: '4px', textAlign: 'center' },
}