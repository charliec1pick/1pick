import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Leaderboard({ session, activeSport }) {
  const [myPools, setMyPools] = useState([])
  const [activePool, setActivePool] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('week')
  const [selectedSession, setSelectedSession] = useState(null)
  const [totalSessions, setTotalSessions] = useState(1)

  useEffect(() => { loadMyPools() }, [activeSport])
  useEffect(() => { if (activePool) loadLeaderboard(activePool.id) }, [view, selectedSession])

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
      const pool = deduped[0].friend_pools
      setActivePool(pool)
      const currentPeriod = pool.current_period || 1
      setTotalSessions(currentPeriod)
      setSelectedSession(currentPeriod)
      await loadLeaderboard(deduped[0].friend_pool_id, currentPeriod)
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

      if (view === 'season') {
        const userEntries = allEntries.filter(e => e.user_id === entry.user_id)
        for (const e of userEntries) {
          const { data: p } = await supabase.from('picks').select('*').eq('pool_entry_id', e.id)
          if (p) allPicks = [...allPicks, ...p]
        }
      } else {
        const periodEntry = allEntries.find(e =>
          e.user_id === entry.user_id && e.period === viewPeriod
        )
        if (periodEntry) {
          const { data: p } = await supabase.from('picks').select('*').eq('pool_entry_id', periodEntry.id)
          allPicks = p || []
        }
      }

      const wins = allPicks.filter(p => p.result === 'win').length
      const losses = allPicks.filter(p => p.result === 'loss').length
      const netUnits = parseFloat(allPicks.reduce((sum, p) => {
        if (p.result === 'win' || p.result === 'loss') return sum + (p.payout_units || 0)
        return sum
      }, 0).toFixed(1))

      return {
        ...entry,
        wins, losses, netUnits,
        totalPicks: allPicks.length,
        isYou: entry.user_id === session.user.id
      }
    }))

    entriesWithPicks.sort((a, b) => b.netUnits - a.netUnits)
    setEntries(entriesWithPicks)
    setLoading(false)
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
                  const p = entry.friend_pools.current_period || 1
                  setTotalSessions(p)
                  setSelectedSession(p)
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
            <div style={s.cardSub}>Results update as games finish</div>
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
              {sessionOptions.map(n => (
                <option key={n} value={n}>
                  {n === (activePool?.current_period || 1) ? `Session ${n} (Current)` : `Session ${n}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={s.colHeaders}>
          <div>Rank</div>
          <div>Player</div>
          <div>W–L</div>
          <div>Net Units</div>
          <div>Picks</div>
        </div>

        {entries.length === 0 ? (
          <div style={{padding:'32px',textAlign:'center',color:'#888580',fontSize:'0.85rem'}}>
            No picks submitted yet — be the first!
          </div>
        ) : entries.map((entry, i) => (
          <div key={entry.id} style={{...s.row, ...(entry.isYou ? s.rowYou : {})}}>
            <div style={{...s.rank, ...(i===0?{color:'#C9A84C',fontSize:'1.25rem'}:i===1?{color:'#aaa',fontSize:'1.1rem'}:i===2?{color:'#cd7f32'}:{})}}>
              {i < 3 ? ranks[i] : i + 1}
            </div>
            <div style={s.player}>
              <div style={{...s.avatar, background: avatarColors[i % avatarColors.length]}}>
                {entry.profiles?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={s.playerName}>
                  {entry.profiles?.username || 'Unknown'}
                  {entry.isYou && <span style={s.youTag}>You</span>}
                </div>
              </div>
            </div>
            <div style={s.record}>{entry.wins}–{entry.losses}</div>
            <div style={{...s.netUnits, color: entry.netUnits > 0 ? '#1a7a4a' : entry.netUnits < 0 ? '#c0392b' : '#888580'}}>
              {entry.netUnits > 0 ? '+' : ''}{entry.netUnits}
            </div>
            <div style={s.picksCount}>
              {entry.totalPicks}/6
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  viewToggle:{display:'flex',gap:'4px',padding:'10px 16px',borderBottom:'1px solid #e2dfd8',background:'#f9f8f6',alignItems:'center',flexWrap:'wrap'},
  toggleBtn:{padding:'6px 16px',borderRadius:'7px',border:'1.5px solid #e2dfd8',background:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer',color:'#888580'},
  toggleActive:{background:'#4B2E83',borderColor:'#4B2E83',color:'#fff'},
  sessionSelect:{marginLeft:'auto',padding:'5px 10px',borderRadius:'7px',border:'1.5px solid #e2dfd8',background:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.72rem',color:'#4B2E83',cursor:'pointer',outline:'none'},
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
  playerName:{fontWeight:600,fontSize:'0.86rem'},
  youTag:{fontSize:'0.56rem',fontFamily:"'Barlow Condensed',sans-serif",background:'#4B2E83',color:'#fff',padding:'1px 6px',borderRadius:'4px',marginLeft:'5px'},
  record:{fontSize:'0.78rem',color:'#888580',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600},
  netUnits:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.92rem'},
  picksCount:{fontSize:'0.78rem',color:'#888580',fontFamily:"'Barlow Condensed',sans-serif"},
}