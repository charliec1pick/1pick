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

export default function Profile({ session, profile, setProfile }) {
  const [allPicks, setAllPicks] = useState([])
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({ wins: 0, losses: 0, netUnits: 0, poolsEntered: 0 })
  const [catStats, setCatStats] = useState([])
  const [selectedSport, setSelectedSport] = useState('all')

  useEffect(() => { loadStats() }, [profile])
  useEffect(() => { loadStats() }, [selectedSport])

async function loadStats() {
    const { data: picks } = await supabase
      .from('picks')
      .select('*, pool_entries(friend_pools(sport))')
      .eq('user_id', session.user.id)

    if (!picks) return

    const filteredPicks = selectedSport === 'all' 
      ? picks 
      : picks.filter(p => p.pool_entries?.friend_pools?.sport === selectedSport)

    const wins = filteredPicks.filter(p => p.result === 'win').length
    const losses = filteredPicks.filter(p => p.result === 'loss').length
    const netUnits = parseFloat(filteredPicks.reduce((sum, p) => {
      if (p.result === 'win' || p.result === 'loss') return sum + (p.payout_units || 0)
      return sum
    }, 0).toFixed(1))

    const { data: entries } = await supabase
      .from('pool_entries')
      .select('id, friend_pool_id, friend_pools(sport)')
      .eq('user_id', session.user.id)

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

  async function saveProfile() {
    setSaving(true)
    if (!username.trim()) { setSaving(false); return }

    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', session.user.id)

    if (!error) {
      setProfile({ ...profile, username: username.trim() })
      setEditing(false)
    }
    setSaving(false)
  }

  const winPct = stats.wins + stats.losses > 0
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0

  return (
    <div>
      {/* Profile Header */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div style={s.avatar}>
            {profile?.username?.[0]?.toUpperCase() || '?'}
          </div>
          {!editing ? (
            <div style={{flex:1}}>
              <div style={s.username}>{profile?.username}</div>
              <div style={s.handle}>@{profile?.username?.toLowerCase()} · Member since {new Date(profile?.created_at).getFullYear()}</div>
              <button style={s.editBtn} onClick={() => { setEditing(true); setUsername(profile?.username || '') }}>
                ✎ Edit Profile
              </button>
            </div>
          ) : (
            <div style={{flex:1}}>
              <div style={s.editLabel}>Username</div>
              <input style={s.editInput} type="text" value={username} onChange={e => setUsername(e.target.value)} />
              <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
                <button style={s.saveBtn} onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button style={s.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        <div style={s.metaRow}>
          <div style={s.metaItem}><div style={s.metaVal}>{stats.poolsEntered}</div><div style={s.metaLbl}>Pools Entered</div></div>
          <div style={s.metaItem}><div style={s.metaVal}>{stats.wins}–{stats.losses}</div><div style={s.metaLbl}>All-Time Record</div></div>
          <div style={s.metaItem}><div style={{...s.metaVal, color: stats.netUnits >= 0 ? '#e8c96a' : '#ff6b6b'}}>{stats.netUnits >= 0 ? '+' : ''}{stats.netUnits}</div><div style={s.metaLbl}>Net Units</div></div>
          <div style={s.metaItem}><div style={s.metaVal}>{winPct}%</div><div style={s.metaLbl}>Win Rate</div></div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
        <div style={s.sectionTitle}><span>All-Time Stats</span></div>
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
      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Total Picks Made</div>
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
          <div style={s.statSub}>Total pools joined</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={s.sectionTitle}><span>Record by Category</span></div>
      <div style={s.catTable}>
        <div style={s.catHeader}>
          <div style={s.catHeaderInner}>
            <div style={s.catTitleText}>Category Breakdown</div>
            <div style={s.catSubText}>All-time performance</div>
          </div>
        </div>
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

      {/* Sign Out */}
      <div style={{textAlign:'center',marginTop:'32px'}}>
        <button style={s.signOutBtn} onClick={() => supabase.auth.signOut({ scope: 'local' })}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

const s = {
  header:{background:'linear-gradient(135deg,#4B2E83 0%,#2d1a5a 100%)',borderRadius:'18px',padding:'26px',marginBottom:'22px',boxShadow:'0 4px 20px rgba(75,46,131,0.3)'},
  headerTop:{display:'flex',alignItems:'flex-start',gap:'18px',flexWrap:'wrap',marginBottom:'18px'},
  avatar:{width:'62px',height:'62px',borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'2px solid rgba(255,255,255,0.28)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'1.3rem',color:'#fff',flexShrink:0},
  username:{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:'1.45rem',color:'#fff',marginBottom:'2px'},
  handle:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.75rem',color:'rgba(255,255,255,0.45)',letterSpacing:'1px',marginBottom:'10px'},
  editBtn:{background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.22)',borderRadius:'7px',padding:'7px 14px',color:'rgba(255,255,255,0.75)',fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.75rem',fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',cursor:'pointer'},
  editLabel:{fontSize:'0.6rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',color:'rgba(255,255,255,0.45)',marginBottom:'4px'},
  editInput:{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:'8px',padding:'8px 12px',color:'#fff',fontFamily:"'Barlow',sans-serif",fontSize:'0.9rem',outline:'none',width:'200px'},
  saveBtn:{padding:'7px 14px',background:'#C9A84C',border:'none',borderRadius:'7px',color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.75rem',fontWeight:700,cursor:'pointer'},
  cancelBtn:{padding:'7px 14px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'7px',color:'rgba(255,255,255,0.7)',fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.75rem',fontWeight:700,cursor:'pointer'},
  metaRow:{display:'flex',gap:'18px',flexWrap:'wrap'},
  metaItem:{textAlign:'center'},
  metaVal:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'1.1rem',color:'#fff'},
  metaLbl:{fontSize:'0.55rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',color:'rgba(255,255,255,0.38)',marginTop:'1px'},
  sectionTitle:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.68rem',fontWeight:700,letterSpacing:'3px',color:'#888580',textTransform:'uppercase',marginBottom:'14px',display:'flex',alignItems:'center',gap:'10px'},
  statsGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:'10px',marginBottom:'22px'},
  statCard:{background:'#fff',border:'1px solid #e2dfd8',borderRadius:'11px',padding:'14px'},
  statLabel:{fontSize:'0.6rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',color:'#888580',marginBottom:'5px'},
  statVal:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'1.3rem'},
  statSub:{fontSize:'0.7rem',color:'#888580',marginTop:'2px'},
  catTable:{background:'#fff',border:'1px solid #e2dfd8',borderRadius:'12px',overflow:'hidden',marginBottom:'22px'},
  catHeader:{padding:'12px 16px',borderBottom:'1px solid #e2dfd8'},
  catHeaderInner:{display:'flex',justifyContent:'space-between',alignItems:'center'},
  catTitleText:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.88rem'},
  catSubText:{fontSize:'0.68rem',color:'#888580'},
  catColHeaders:{display:'grid',gridTemplateColumns:'1.4fr 70px 90px 60px',padding:'7px 16px',background:'#f9f8f6',fontSize:'0.6rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1px',color:'#888580'},
  catRow:{display:'grid',gridTemplateColumns:'1.4fr 70px 90px 60px',padding:'10px 16px',borderTop:'1px solid #e2dfd8',alignItems:'center'},
  catTag:{display:'inline-block',padding:'2px 8px',borderRadius:'5px',fontSize:'0.63rem',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'#fff'},
  catRecord:{fontSize:'0.78rem',color:'#888580',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600},
  catNet:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.88rem'},
  catTotal:{fontSize:'0.78rem',color:'#888580'},
  signOutBtn:{padding:'10px 28px',background:'#f9f8f6',border:'1.5px solid #e2dfd8',borderRadius:'9px',color:'#888580',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'},
  sportBtn:{padding:'4px 10px',borderRadius:'6px',border:'1.5px solid #e2dfd8',background:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer',color:'#888580'},
  sportBtnActive:{background:'#4B2E83',borderColor:'#4B2E83',color:'#fff'},
}