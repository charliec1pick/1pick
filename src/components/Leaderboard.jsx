import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useOdds } from '../useOdds'
import UserProfileModal from './UserProfileModal'

const PICK_CATS = [
  { id: 'ml-fav', label: 'ML Fav', color: '#4B2E83' },
  { id: 'ml-dog', label: 'ML Dog', color: '#C9A84C' },
  { id: 'sp-fav', label: 'Spread Fav', color: '#4B2E83' },
  { id: 'sp-dog', label: 'Spread Dog', color: '#C9A84C' },
  { id: 'tot-ov', label: 'Over', color: '#1a7a4a' },
  { id: 'tot-un', label: 'Under', color: '#6b47b8' },
]

export default function Leaderboard({ session, activeSport, preselectedPoolId, onPoolChange }) {
  const [myPools, setMyPools] = useState([])
  const [activePool, setActivePool] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('week')
  const [selectedSession, setSelectedSession] = useState(null)
  const [totalSessions, setTotalSessions] = useState(1)
  const [expandedEntry, setExpandedEntry] = useState(null)
  const [viewingProfile, setViewingProfile] = useState(null)
  const [expandedPicks, setExpandedPicks] = useState({})
  const [loadingPicks, setLoadingPicks] = useState(false)

  const { games } = useOdds(activeSport)
  const [liveScores, setLiveScores] = useState({}) // keyed by "away_team|home_team"

  // ─── TEAM NAME MAP: Odds API → ESPN ──────────────────────────────────────
  const TEAM_NAME_MAP = {
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
    "Los Angeles Clippers": "LA Clippers",
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
    "Oakland Athletics": "Athletics",
    "Montréal Canadiens": "Montreal Canadiens",
    "St Louis Blues": "St. Louis Blues",
    "Utah Hockey Club": "Utah Mammoth",
  }

  function toESPN(name) { return TEAM_NAME_MAP[name] || name }

  function teamsMatch(a, b) {
    if (a === b) return true
    const na = (a || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
    const nb = (b || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
    return na === nb
  }

  useEffect(() => { loadMyPools() }, [activeSport])
  useEffect(() => { if (activePool) loadLeaderboard(activePool.id) }, [view, selectedSession])

  // Poll scores_cache every 60s
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
    map[`${row.away_team}|${row.home_team}`] = row
  }
  setLiveScores(map)
}

  function getLiveScore(pick) {
    if (!pick?.away_team || !pick?.home_team) return null
    const pickDate = pick.commence_time ? new Date(pick.commence_time).toISOString().split('T')[0] : null
    // Translate Odds API names to ESPN
    const away = toESPN(pick.away_team)
    const home = toESPN(pick.home_team)

    // Try exact key with translated names
    const exact = liveScores[`${away}|${home}`] || liveScores[`${pick.away_team}|${pick.home_team}`]
    if (exact && (!pickDate || !exact.game_date || pickDate === exact.game_date)) {
      return exact
    }

    // Fallback with date constraint
    for (const row of Object.values(liveScores)) {
      const sameDate = !pickDate || !row.game_date || pickDate === row.game_date
      if (sameDate && teamsMatch(away, row.away_team) && teamsMatch(home, row.home_team)) {
        return row
      }
    }
    return null
  }

  async function loadMyPools() {
    setLoading(true)
    const { data } = await supabase
      .from('pool_entries')
      .select('*, friend_pools(*)')
      .eq('user_id', session.user.id)

    const filtered = data?.filter(e => {
      const pool = e.friend_pools
      if (!pool) return false
      if (pool.sport !== activeSport) return false
      return e.period === (pool.current_period || 1)
    }) || []

    const seen = new Set()
    const deduped = filtered.filter(e => {
      if (seen.has(e.friend_pool_id)) return false
      seen.add(e.friend_pool_id)
      return true
    })

    setMyPools(deduped)
    if (deduped.length > 0) {
      let selected = deduped[0]
      if (preselectedPoolId) {
        const match = deduped.find(e => e.friend_pool_id === preselectedPoolId)
        if (match) selected = match
      }
      const pool = selected.friend_pools
      setActivePool(pool)
      onPoolChange?.(pool.id)
      const currentPeriod = pool.current_period || 1
      setTotalSessions(currentPeriod)
      setSelectedSession(currentPeriod)
      await loadLeaderboard(selected.friend_pool_id, currentPeriod)
    }
    setLoading(false)
  }

  async function loadLeaderboard(poolId, periodOverride) {
    setLoading(true)

    const { data: pool } = await supabase
      .from('friend_pools')
      .select('*')
      .eq('id', poolId)
      .single()

    const { data: allEntries } = await supabase
      .from('pool_entries')
      .select('*, profiles(*)')
      .eq('friend_pool_id', poolId)

    if (!allEntries) { setEntries([]); setLoading(false); return }

    const currentPeriod = pool?.current_period || 1
    const viewPeriod = periodOverride ?? selectedSession ?? currentPeriod
    setTotalSessions(currentPeriod)

    const users = [...new Map(allEntries.map(e => [e.user_id, e])).values()]

    const entriesWithPicks = await Promise.all(users.map(async entry => {
      let allPicks = []

      // Determine if this user opted in for the viewed period
      const periodEntry = allEntries.find(e =>
        e.user_id === entry.user_id && e.period === viewPeriod
      )
      const isOptedIn = periodEntry?.opted_in || false

      if (view === 'season') {
        const userEntries = allEntries.filter(e => e.user_id === entry.user_id)
        for (const e of userEntries) {
          const { data: p } = await supabase.from('picks').select('*').eq('pool_entry_id', e.id)
          if (p) allPicks = [...allPicks, ...p]
        }
      } else {
        if (periodEntry) {
          const { data: p } = await supabase.from('picks').select('*').eq('pool_entry_id', periodEntry.id)
          allPicks = p || []
        }
      }

      const wins = allPicks.filter(p => p.result === 'win' && p.category !== 'unallocated-penalty').length
      const losses = allPicks.filter(p => p.result === 'loss' && p.category !== 'unallocated-penalty').length

      // Net units from actual picks only (exclude penalty)
      const pickNetUnits = parseFloat(allPicks
        .filter(p => p.category !== 'unallocated-penalty')
        .reduce((sum, p) => {
          if (p.result === 'win' || p.result === 'loss') return sum + (p.payout_units || 0)
          return sum
        }, 0).toFixed(1))

      const penaltyPick = allPicks.find(p => p.category === 'unallocated-penalty')
      const penalty = penaltyPick ? penaltyPick.payout_units : 0

      // Total net units = pick performance + penalty (penalty is already negative)
      const netUnits = parseFloat((pickNetUnits + penalty).toFixed(1))

      // Store picks on entry for dropdown
      const sessionPicks = allPicks.filter(p => p.category !== 'unallocated-penalty')

      return {
        ...entry,
        wins, losses, netUnits,
        totalPicks: sessionPicks.length,
        penalty,
        sessionPicks,
        isYou: entry.user_id === session.user.id,
        isOptedIn
      }
    }))

    entriesWithPicks.sort((a, b) => b.netUnits - a.netUnits)
    setEntries(entriesWithPicks)
    setLoading(false)
  }

  function toggleExpand(entryId) {
    setExpandedEntry(prev => prev === entryId ? null : entryId)
  }

  const ranks = ['🥇', '🥈', '🥉']
  const avatarColors = ['#4B2E83', '#e05c00', '#0055a5', '#2e8b57', '#c9082a', '#C9A84C', '#6b47b8', '#1565c0']

  if (loading) return <div style={s.empty}>Loading...</div>

  if (myPools.length === 0) return (
    <div style={s.empty}>
      <div style={{fontSize:'1.5rem',marginBottom:'12px'}}>📊</div>
      <strong>No pools entered yet</strong>
      <div style={{marginTop:'6px',fontSize:'0.85rem'}}>Join a pool to see the leaderboard.</div>
    </div>
  )

  const sessionOptions = Array.from({length: totalSessions}, (_, i) => i + 1)

  return (
    <div>
      {myPools.length > 1 && (
        <div style={s.poolSelector}>
          <div style={s.poolSelectorLabel}>Pool</div>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
            {myPools.map(entry => (
              <div key={entry.id}
                style={{...s.poolChip, ...(activePool?.id===entry.friend_pool_id ? s.poolChipActive : {})}}
                onClick={() => {
                  setActivePool(entry.friend_pools)
                  onPoolChange?.(entry.friend_pool_id)
                  const p = entry.friend_pools.current_period || 1
                  setTotalSessions(p)
                  setSelectedSession(p)
                  setExpandedEntry(null)
                  loadLeaderboard(entry.friend_pool_id, p)
                }}>
                {entry.friend_pools.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={s.card}>
        <div style={s.cardHeader}>
          <div>
            <div style={s.cardTitle}>{activePool?.name} Leaderboard</div>
            <div style={s.cardSub}>Tap a player to see their locked picks</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={s.poolCode}>Code: <strong>{activePool?.invite_code}</strong></div>
            <div style={s.playerCount}>{entries.length} players</div>
          </div>
        </div>

        <div style={s.viewToggle}>
          <button style={{...s.toggleBtn, ...(view==='week' ? s.toggleActive : {})}} onClick={() => setView('week')}>Session</button>
          <button style={{...s.toggleBtn, ...(view==='season' ? s.toggleActive : {})}} onClick={() => setView('season')}>All Season</button>
          {view === 'week' && totalSessions > 1 && (
            <select
              style={s.sessionSelect}
              value={selectedSession}
              onChange={e => setSelectedSession(parseInt(e.target.value))}>
              {sessionOptions.map(n => {
                const sessionNames = activePool?.session_names || {}
                const name = sessionNames[n]
                const label = name ? `${name}` : `Session ${n}`
                return (
                  <option key={n} value={n}>
                    {n === (activePool?.current_period || 1) ? `${label} (Current)` : label}
                  </option>
                )
              })}
            </select>
          )}
        </div>

        {view !== 'season' && (
          <div style={s.penaltyNote}>
            ⚠️ Unused units are deducted at session end — use all 100
          </div>
        )}

        <div style={s.colHeaders}>
          <div>Rank</div>
          <div>Player</div>
          <div>W–L</div>
          <div>Net Units</div>
          <div>Picks</div>
        </div>

        {(() => {
          // In season view, show everyone together. In session view, split by opt-in.
          const activeEntries = view === 'season' ? entries : entries.filter(e => e.isOptedIn)
          const inactiveEntries = view === 'season' ? [] : entries.filter(e => !e.isOptedIn)

          const renderRow = (entry, i, isInactive) => {
            const isExpanded = expandedEntry === entry.id
            const picks = entry.sessionPicks || []

            return (
            <div key={entry.id}>
              {/* Main row */}
              <div
                style={{...s.row, ...(entry.isYou ? s.rowYou : {}), ...(isInactive ? {opacity: 0.5} : {}), cursor: view !== 'season' && !isInactive ? 'pointer' : 'default', userSelect:'none'}}
                onClick={() => view !== 'season' && !isInactive && toggleExpand(entry.id)}>
                <div style={{...s.rank, ...(isInactive ? {} : i===0?{color:'#C9A84C',fontSize:'1.25rem'}:i===1?{color:'#aaa',fontSize:'1.1rem'}:i===2?{color:'#cd7f32'}:{})}}>
                  {isInactive ? '—' : i < 3 ? ranks[i] : i + 1}
                </div>
                <div style={s.player}>
                  {entry.profiles?.avatar_url ? (
                    <img src={entry.profiles.avatar_url} alt="avatar" style={{...s.avatar, objectFit:'cover', background:'none'}} />
                  ) : (
                    <div style={{...s.avatar, background: isInactive ? '#bbb' : avatarColors[i % avatarColors.length]}}>
                      {entry.profiles?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <div style={s.playerName}>
                      {entry.profiles?.username || 'Unknown'}
                      {entry.isYou && <span style={s.youTag}>You</span>}
                      {isInactive && <span style={s.inactiveTag}>Inactive</span>}
                    </div>
                  </div>
                </div>
                <div style={s.record}>{isInactive ? '—' : `${entry.wins}–${entry.losses}`}</div>
                <div style={{...s.netUnits, color: isInactive ? '#888580' : entry.netUnits > 0 ? '#1a7a4a' : entry.netUnits < 0 ? '#c0392b' : '#888580'}}>
                  {isInactive ? '—' : `${entry.netUnits > 0 ? '+' : ''}${entry.netUnits}`}
                </div>
                <div style={{...s.picksCount, display:'flex', alignItems:'center', gap:'4px'}}>
                  {isInactive ? '—' : view === 'season' ? `${entry.totalPicks}/${totalSessions * 6}` : `${entry.totalPicks}/6`}
                  {!isInactive && view !== 'season' && <span style={{fontSize:'0.6rem', color:'#aaa'}}>{isExpanded ? '▲' : '▼'}</span>}
                </div>
              </div>

              {/* Penalty row */}
              {!isInactive && entry.penalty < 0 && view !== 'season' && (
                <div style={s.penaltyRow}>
                  <div style={{gridColumn:'1/3',display:'flex',alignItems:'center',gap:'6px'}}>
                    <span style={s.penaltyIcon}>⚠️</span>
                    <span style={s.penaltyText}>Unallocated unit penalty</span>
                  </div>
                  <div />
                  <div style={s.penaltyAmount}>{entry.penalty}</div>
                  <div style={s.penaltyUnused}>{Math.abs(entry.penalty)} unused</div>
                </div>
              )}

              {/* Picks dropdown */}
              {isExpanded && !isInactive && (
                <div style={s.picksDropdown}>
                  <div style={s.picksDropdownTitle}>
                    <span style={{cursor:'pointer', textDecoration:'underline', textDecorationStyle:'dotted'}} onClick={() => setViewingProfile(entry.user_id)}>
                      {entry.profiles?.username}'s Picks 👤
                    </span>
                    <span style={s.picksDropdownHint}>🔒 Locked picks visible · Unlocked picks hidden</span>
                  </div>
                  <div style={s.picksDropdownGrid}>
                    {PICK_CATS.map(cat => {
                      const pick = picks.find(p => p.category === cat.id)
                      const game = pick ? games.find(g => g.id === pick.game_id) : null
                      const liveScore = pick ? getLiveScore(pick) : null
                      const isLive = liveScore?.status === 'in'
                      const isFinal = liveScore?.status === 'post'
                      const isLocked = pick && (
                        isLive || isFinal ||
                        !game ||
                        (pick.commence_time ? Date.now() >= new Date(pick.commence_time).getTime()
                          : game?.commence_time ? Date.now() >= new Date(game.commence_time).getTime()
                          : false)
                      )
                      const resultColor = pick?.result === 'win' ? '#1a7a4a' : pick?.result === 'loss' ? '#c0392b' : '#888580'

                      return (
                        <div key={cat.id} style={{
                          ...s.pickChip,
                          borderColor: isLive ? '#e05c00' : pick?.result === 'win' ? '#1a7a4a' : pick?.result === 'loss' ? '#c0392b' : '#e2dfd8'
                        }}>
                          <div style={{...s.pickChipCat, background: isLive ? '#e05c00' : cat.color}}>
                            <span>{cat.label}</span>
                            {isLive && <span style={{marginLeft:'6px',fontSize:'0.55rem',letterSpacing:'1px'}}>🔴 LIVE</span>}
                            {isFinal && !pick?.result && <span style={{marginLeft:'6px',fontSize:'0.55rem'}}>Final</span>}
                          </div>
                          <div style={{
                            ...s.pickChipBody,
                            filter: pick && !isLocked ? 'blur(4px)' : 'none',
                            userSelect: pick && !isLocked ? 'none' : 'auto'
                          }}>
                            {pick ? (
                              <>
                                <div style={s.pickChipTeam}>{pick.team}</div>
                                <div style={s.pickChipMeta}>
                                  {pick.away_team && pick.home_team ? `${pick.away_team} @ ${pick.home_team}` : ''}
                                </div>

                                {/* Live / Final score */}
                                {liveScore && (isLive || isFinal) && (
                                  <div style={s.chipScoreBox}>
                                    <div style={s.chipScoreRow}>
                                      <span style={s.chipScoreTeam}>{liveScore.away_team.split(' ').pop()}</span>
                                      <span style={s.chipScoreNum}>{liveScore.away_score}</span>
                                    </div>
                                    <div style={s.chipScoreRow}>
                                      <span style={s.chipScoreTeam}>{liveScore.home_team.split(' ').pop()}</span>
                                      <span style={s.chipScoreNum}>{liveScore.home_score}</span>
                                    </div>
                                    <div style={s.chipScoreStatus}>
                                      {isLive ? `${liveScore.clock} · ${liveScore.period}` : `Final${liveScore.period === 'OT' ? ' (OT)' : ''}`}
                                    </div>
                                  </div>
                                )}

                                <div style={{display:'flex', alignItems:'center', gap:'6px', marginTop:'4px', flexWrap:'wrap'}}>
                                  <span style={s.pickChipOdds}>{pick.locked_odds}</span>
                                  <span style={s.pickChipUnits}>{pick.units}u</span>
                                  {pick.result && pick.result !== 'pending' && (
                                    <span style={{...s.pickChipResult, color: resultColor}}>
                                      {pick.result === 'win' ? `✅ +${pick.payout_units}` : `❌ ${pick.payout_units}`}
                                    </span>
                                  )}
                                  {pick.result === 'pending' && (isLive || isFinal) && (
                                    <span style={{...s.pickChipResult, color: '#888580'}}>⏳</span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div style={s.pickChipEmpty}>No pick</div>
                            )}
                          </div>
                          {pick && !isLocked && (
                            <div style={s.pickChipLockMsg}>🔓 Not locked yet</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
          }

          return (
            <>
              {activeEntries.length === 0 && inactiveEntries.length === 0 ? (
                <div style={{padding:'32px',textAlign:'center',color:'#888580',fontSize:'0.85rem'}}>
                  No picks submitted yet — be the first!
                </div>
              ) : (
                <>
                  {activeEntries.length === 0 && view !== 'season' && (
                    <div style={{padding:'24px',textAlign:'center',color:'#888580',fontSize:'0.82rem'}}>
                      No one has opted in yet — be the first!
                    </div>
                  )}
                  {activeEntries.map((entry, i) => renderRow(entry, i, false))}
                  {inactiveEntries.length > 0 && (
                    <>
                      <div style={s.inactiveDivider}>
                        <span style={s.inactiveDividerText}>Inactive This Session</span>
                      </div>
                      {inactiveEntries.map((entry, i) => renderRow(entry, i, true))}
                    </>
                  )}
                </>
              )}
            </>
          )
        })()}
      </div>
    {viewingProfile && (
        <UserProfileModal userId={viewingProfile} onClose={() => setViewingProfile(null)} />
      )}
    </div>
  )
}

const s = {
  viewToggle:{display:'flex',gap:'4px',padding:'10px 16px',borderBottom:'1px solid #e2dfd8',background:'#f9f8f6',alignItems:'center',flexWrap:'wrap'},
  toggleBtn:{padding:'6px 16px',borderRadius:'7px',border:'1.5px solid #e2dfd8',background:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer',color:'#888580'},
  toggleActive:{background:'#4B2E83',borderColor:'#4B2E83',color:'#fff'},
  sessionSelect:{marginLeft:'auto',padding:'5px 10px',borderRadius:'7px',border:'1.5px solid #e2dfd8',background:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.72rem',color:'#4B2E83',cursor:'pointer',outline:'none'},
  penaltyNote:{padding:'8px 16px',background:'#fff8ed',borderBottom:'1px solid #f0e0b0',fontSize:'0.68rem',fontFamily:"'Barlow Condensed',sans-serif",color:'#b8860b',letterSpacing:'0.5px'},
  empty:{textAlign:'center',padding:'60px 20px',color:'#888580',background:'#fff',border:'2px dashed #e2dfd8',borderRadius:'12px'},
  poolSelector:{background:'#fff',border:'1px solid #e2dfd8',borderRadius:'10px',padding:'12px 16px',marginBottom:'20px',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'},
  poolSelectorLabel:{fontSize:'0.66rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',color:'#888580',whiteSpace:'nowrap'},
  poolChip:{padding:'5px 14px',borderRadius:'20px',fontSize:'0.7rem',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,cursor:'pointer',border:'1.5px solid #e2dfd8',color:'#888580',background:'#f9f8f6'},
  poolChipActive:{background:'#4B2E83',borderColor:'#4B2E83',color:'#fff'},
  card:{background:'#fff',border:'1px solid #e2dfd8',borderRadius:'14px',overflow:'hidden'},
  cardHeader:{padding:'16px 20px',borderBottom:'1px solid #e2dfd8',display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'8px'},
  cardTitle:{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.05rem'},
  cardSub:{fontSize:'0.7rem',color:'#888580',marginTop:'2px'},
  poolCode:{fontSize:'0.72rem',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,color:'#4B2E83'},
  playerCount:{fontSize:'0.7rem',color:'#888580',marginTop:'2px'},
  colHeaders:{display:'grid',gridTemplateColumns:'44px 1fr 70px 90px 60px',padding:'7px 16px',background:'#f9f8f6',fontSize:'0.6rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',color:'#888580'},
  row:{display:'grid',gridTemplateColumns:'44px 1fr 70px 90px 60px',padding:'12px 16px',borderTop:'1px solid #e2dfd8',alignItems:'center'},
  rowYou:{background:'#f0eaf9'},
  rank:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'1rem',color:'#888580'},
  player:{display:'flex',alignItems:'center',gap:'8px'},
  avatar:{width:'30px',height:'30px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.68rem',fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",color:'#fff',flexShrink:0},
  playerName:{fontWeight:600,fontSize:'0.86rem',display:'flex',alignItems:'center',flexWrap:'wrap',gap:'4px'},
  youTag:{fontSize:'0.56rem',fontFamily:"'Barlow Condensed',sans-serif",background:'#4B2E83',color:'#fff',padding:'1px 6px',borderRadius:'4px'},
  inactiveTag:{fontSize:'0.56rem',fontFamily:"'Barlow Condensed',sans-serif",background:'#e2dfd8',color:'#888580',padding:'1px 6px',borderRadius:'4px'},
  inactiveDivider:{padding:'10px 16px',borderTop:'1px solid #e2dfd8',background:'#f9f8f6',display:'flex',alignItems:'center',justifyContent:'center'},
  inactiveDividerText:{fontSize:'0.62rem',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,textTransform:'uppercase',letterSpacing:'2px',color:'#aaa'},
  record:{fontSize:'0.78rem',color:'#888580',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600},
  netUnits:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.92rem'},
  picksCount:{fontSize:'0.78rem',color:'#888580',fontFamily:"'Barlow Condensed',sans-serif"},
  penaltyRow:{display:'grid',gridTemplateColumns:'44px 1fr 70px 90px 60px',padding:'6px 16px 8px',background:'#fff5f5',borderTop:'1px dashed #f5c6c6',alignItems:'center'},
  penaltyIcon:{fontSize:'0.75rem'},
  penaltyText:{fontSize:'0.68rem',fontFamily:"'Barlow Condensed',sans-serif",color:'#c0392b',textTransform:'uppercase',letterSpacing:'0.5px'},
  penaltyAmount:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.88rem',color:'#c0392b'},
  penaltyUnused:{fontSize:'0.68rem',color:'#c0392b',fontFamily:"'Barlow Condensed',sans-serif"},
  picksDropdown:{background:'#f9f8f6',borderTop:'1px solid #e2dfd8',padding:'14px 16px'},
  picksDropdownTitle:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'1.5px',color:'#4B2E83',marginBottom:'10px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'4px'},
  picksDropdownHint:{fontSize:'0.62rem',color:'#888580',fontWeight:400,textTransform:'none',letterSpacing:'0'},
  picksDropdownGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'8px'},
  pickChip:{background:'#fff',border:'1.5px solid #e2dfd8',borderRadius:'10px',overflow:'hidden'},
  pickChipCat:{padding:'4px 10px',fontSize:'0.58rem',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,textTransform:'uppercase',letterSpacing:'1.5px',color:'#fff'},
  pickChipBody:{padding:'8px 10px',minHeight:'52px',position:'relative'},
  pickChipTeam:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.82rem'},
  pickChipMeta:{fontSize:'0.65rem',color:'#888580',marginTop:'1px'},
  pickChipOdds:{display:'inline-block',background:'#fdf8ed',color:'#C9A84C',border:'1px solid #C9A84C',borderRadius:'4px',padding:'1px 6px',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.65rem'},
  pickChipUnits:{fontSize:'0.65rem',color:'#888580',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600},
  pickChipResult:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.7rem'},
  pickChipEmpty:{fontSize:'0.75rem',color:'#ccc',fontStyle:'italic'},
  pickChipLockMsg:{padding:'3px 10px',background:'#f0f0f0',fontSize:'0.6rem',color:'#aaa',fontFamily:"'Barlow Condensed',sans-serif",textAlign:'center'},
  chipScoreBox:{background:'#f9f8f6',border:'1px solid #e2dfd8',borderRadius:'6px',padding:'5px 8px',margin:'5px 0 3px',fontSize:'0.72rem'},
  chipScoreRow:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1px'},
  chipScoreTeam:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,fontSize:'0.68rem',color:'#333'},
  chipScoreNum:{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:'0.9rem',color:'#1a1a1a',marginLeft:'6px'},
  chipScoreStatus:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.58rem',textTransform:'uppercase',letterSpacing:'1px',color:'#e05c00',fontWeight:700,marginTop:'3px',textAlign:'center'},
}