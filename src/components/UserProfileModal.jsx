import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const PICK_CATS = [
  { id: 'ml-fav', label: 'ML Favorite', color: '#4B2E83' },
  { id: 'ml-dog', label: 'ML Underdog', color: '#C9A84C' },
  { id: 'sp-fav', label: 'Spread Fav',  color: '#4B2E83' },
  { id: 'sp-dog', label: 'Spread Dog',  color: '#C9A84C' },
  { id: 'tot-ov', label: 'Total Over',  color: '#1a7a4a' },
  { id: 'tot-un', label: 'Total Under', color: '#6b47b8' },
]

export default function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null)
  const [allPicks, setAllPicks] = useState([])
  const [stats, setStats] = useState({ wins: 0, losses: 0, netUnits: 0, poolsEntered: 0 })
  const [catStats, setCatStats] = useState([])
  const [selectedSport, setSelectedSport] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadProfile() }, [userId])
  useEffect(() => { if (profile) loadStats() }, [selectedSport, profile])

  async function loadProfile() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function loadStats() {
    const { data: picks } = await supabase
      .from('picks')
      .select('*, pool_entries(friend_pools(sport))')
      .eq('user_id', userId)

    if (!picks) return

    const filteredPicks = selectedSport === 'all'
      ? picks.filter(p => p.category !== 'unallocated-penalty')
      : picks.filter(p => p.category !== 'unallocated-penalty' && p.pool_entries?.friend_pools?.sport === selectedSport)

    const wins = filteredPicks.filter(p => p.result === 'win').length
    const losses = filteredPicks.filter(p => p.result === 'loss').length
    const netUnits = parseFloat(picks
      .filter(p => selectedSport === 'all' ? true : p.pool_entries?.friend_pools?.sport === selectedSport)
      .reduce((sum, p) => {
        if (p.result === 'win' || p.result === 'loss') return sum + (p.payout_units || 0)
        return sum
      }, 0).toFixed(1))

    const { data: entries } = await supabase
      .from('pool_entries')
      .select('id, friend_pool_id, friend_pools(sport)')
      .eq('user_id', userId)

    const uniquePools = new Set(
      (selectedSport === 'all'
        ? entries
        : entries?.filter(e => e.friend_pools?.sport === selectedSport)
      )?.map(e => e.friend_pool_id)
    )

    setStats({ wins, losses, netUnits, poolsEntered: uniquePools.size })
    setAllPicks(filteredPicks)

    const cats = PICK_CATS.map(cat => {
      const catPicks = filteredPicks.filter(p => p.category === cat.id)
      const catWins = catPicks.filter(p => p.result === 'win').length
      const catLosses = catPicks.filter(p => p.result === 'loss').length
      const catNet = parseFloat(catPicks.reduce((sum, p) => {
        if (p.result === 'win' || p.result === 'loss') return sum + (p.payout_units || 0)
        return sum
      }, 0).toFixed(1))
      return { ...cat, wins: catWins, losses: catLosses, netUnits: catNet, total: catPicks.length }
    })
    setCatStats(cats)
  }

  const winPct = stats.wins + stats.losses > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.drawer} onClick={e => e.stopPropagation()}>
        <div style={s.handle} />
        <div style={s.scrollArea}>
          {loading ? (
            <div style={{textAlign:'center',padding:'40px',color:'#888580'}}>Loading...</div>
          ) : (
            <>
              {/* Header */}
              <div style={s.header}>
                <button style={s.closeBtn} onClick={onClose}>✕</button>
                <div style={s.headerTop}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" style={{...s.avatar, objectFit:'cover'}} />
                  ) : (
                    <div style={s.avatar}>{profile?.username?.[0]?.toUpperCase() || '?'}</div>
                  )}
                  <div style={{flex:1}}>
                    <div style={s.username}>{profile?.username}</div>
                    <div style={s.handleText}>@{profile?.username?.toLowerCase()} · Member since {new Date(profile?.created_at).getFullYear()}</div>
                  </div>
                </div>
                <div style={s.metaRow}>
                  <div style={s.metaItem}><div style={s.metaVal}>{stats.poolsEntered}</div><div style={s.metaLbl}>Pools</div></div>
                  <div style={s.metaItem}><div style={s.metaVal}>{stats.wins}–{stats.losses}</div><div style={s.metaLbl}>Record</div></div>
                  <div style={s.metaItem}><div style={{...s.metaVal, color: stats.netUnits >= 0 ? '#e8c96a' : '#ff6b6b'}}>{stats.netUnits >= 0 ? '+' : ''}{stats.netUnits}</div><div style={s.metaLbl}>Net Units</div></div>
                  <div style={s.metaItem}><div style={s.metaVal}>{winPct}%</div><div style={s.metaLbl}>Win Rate</div></div>
                </div>
              </div>

              {/* Sport filter */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',margin:'18px 0 10px',flexWrap:'wrap',gap:'8px'}}>
                <div style={s.sectionTitle}>All-Time Stats</div>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {['all','nfl','cbb','nba','cfb','mlb','nhl'].map(sport => (
                    <button key={sport}
                      style={{...s.sportBtn, ...(selectedSport === sport ? s.sportBtnActive : {})}}
                      onClick={() => setSelectedSport(sport)}>
                      {sport === 'all' ? 'All' : sport.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stat cards */}
              <div style={s.statsGrid}>
                <div style={s.statCard}>
                  <div style={s.statLabel}>Total Picks</div>
                  <div style={s.statVal}>{allPicks.length}</div>
                  <div style={s.statSub}>Across all pools</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>Win Rate</div>
                  <div style={s.statVal}>{winPct}%</div>
                  <div style={s.statSub}>{stats.wins}W – {stats.losses}L</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>Net Units</div>
                  <div style={{...s.statVal, color: stats.netUnits >= 0 ? '#1a7a4a' : '#c0392b'}}>{stats.netUnits >= 0 ? '+' : ''}{stats.netUnits}</div>
                  <div style={s.statSub}>All-time</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>Pools Entered</div>
                  <div style={s.statVal}>{stats.poolsEntered}</div>
                  <div style={s.statSub}>Total joined</div>
                </div>
              </div>

              {/* Category breakdown */}
              <div style={s.sectionTitle}>Record by Category</div>
              <div style={s.catTable}>
                <div style={s.catColHeaders}>
                  <div>Category</div><div>W–L</div><div>Net Units</div><div>Picks</div>
                </div>
                {catStats.map(cat => (
                  <div key={cat.id} style={s.catRow}>
                    <div><span style={{...s.catTag, background: cat.color}}>{cat.label}</span></div>
                    <div style={s.catRecord}>{cat.wins}–{cat.losses}</div>
                    <div style={{...s.catNet, color: cat.netUnits > 0 ? '#1a7a4a' : cat.netUnits < 0 ? '#c0392b' : '#888580'}}>
                      {cat.netUnits > 0 ? '+' : ''}{cat.netUnits}
                    </div>
                    <div style={s.catTotal}>{cat.total}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center'},
  drawer:{background:'#f9f8f6',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:'600px',maxHeight:'88vh',display:'flex',flexDirection:'column'},
  handle:{width:'40px',height:'4px',borderRadius:'2px',background:'#e2dfd8',margin:'12px auto 0'},
  scrollArea:{overflowY:'auto',padding:'0 20px 40px'},
  closeBtn:{position:'absolute',top:'16px',right:'16px',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',width:'32px',height:'32px',cursor:'pointer',color:'#fff',fontSize:'1rem'},
  header:{background:'linear-gradient(135deg,#4B2E83 0%,#2d1a5a 100%)',borderRadius:'14px',padding:'22px',marginTop:'14px',marginBottom:'4px',position:'relative'},
  headerTop:{display:'flex',alignItems:'flex-start',gap:'14px',marginBottom:'16px'},
  avatar:{width:'52px',height:'52px',borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'2px solid rgba(255,255,255,0.28)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'1.2rem',color:'#fff',flexShrink:0},
  username:{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:'1.3rem',color:'#fff',marginBottom:'2px'},
  handleText:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.72rem',color:'rgba(255,255,255,0.45)',letterSpacing:'1px'},
  metaRow:{display:'flex',gap:'16px',flexWrap:'wrap'},
  metaItem:{textAlign:'center'},
  metaVal:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'1.05rem',color:'#fff'},
  metaLbl:{fontSize:'0.52rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',color:'rgba(255,255,255,0.38)',marginTop:'1px'},
  sectionTitle:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.68rem',fontWeight:700,letterSpacing:'3px',color:'#888580',textTransform:'uppercase',marginBottom:'10px'},
  statsGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:'8px',marginBottom:'18px'},
  statCard:{background:'#fff',border:'1px solid #e2dfd8',borderRadius:'10px',padding:'12px'},
  statLabel:{fontSize:'0.58rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',color:'#888580',marginBottom:'4px'},
  statVal:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'1.2rem'},
  statSub:{fontSize:'0.65rem',color:'#888580',marginTop:'2px'},
  catTable:{background:'#fff',border:'1px solid #e2dfd8',borderRadius:'12px',overflow:'hidden',marginBottom:'16px'},
  catColHeaders:{display:'grid',gridTemplateColumns:'1.4fr 70px 90px 60px',padding:'7px 14px',background:'#f9f8f6',fontSize:'0.58rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1px',color:'#888580'},
  catRow:{display:'grid',gridTemplateColumns:'1.4fr 70px 90px 60px',padding:'9px 14px',borderTop:'1px solid #e2dfd8',alignItems:'center'},
  catTag:{display:'inline-block',padding:'2px 7px',borderRadius:'5px',fontSize:'0.6rem',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'#fff'},
  catRecord:{fontSize:'0.75rem',color:'#888580',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600},
  catNet:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.85rem'},
  catTotal:{fontSize:'0.75rem',color:'#888580'},
  sportBtn:{padding:'3px 9px',borderRadius:'6px',border:'1.5px solid #e2dfd8',background:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.62rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer',color:'#888580'},
  sportBtnActive:{background:'#4B2E83',borderColor:'#4B2E83',color:'#fff'},
}