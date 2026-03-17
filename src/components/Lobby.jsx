import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const SPORT_CONFIG = {
  nfl: { label: 'NFL', emoji: '🏈', color: '#C9A84C' },
  cfb: { label: 'CFB', emoji: '🏈', color: '#e05c00' },
  cbb: { label: 'CBB', emoji: '🏀', color: '#0055a5' },
  nba: { label: 'NBA', emoji: '🏀', color: '#c9082a' },
  mlb: { label: 'MLB', emoji: '⚾', color: '#002d72' },
  nhl: { label: 'NHL', emoji: '🏒', color: '#000099' },
  multi: { label: 'Multi', emoji: '🌐', color: '#6b47b8' },
}
const SPORT_ORDER = ['cbb', 'nba', 'nhl', 'nfl', 'cfb', 'mlb', 'multi']

export default function Lobby({ session, profile, onNavigateToPool }) {
  const [allPools, setAllPools] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [poolName, setPoolName] = useState('')
  const [poolSport, setPoolSport] = useState('cbb')
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [sessionStart, setSessionStart] = useState('')
  const [sessionEnd, setSessionEnd] = useState('')
  const [firstSessionName, setFirstSessionName] = useState('')
  const [collapsedSports, setCollapsedSports] = useState({})
  const [showResetConfirm, setShowResetConfirm] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newSessionStart, setNewSessionStart] = useState('')
  const [newSessionEnd, setNewSessionEnd] = useState('')
  const [newSessionName, setNewSessionName] = useState('')
  const [editingPoolName, setEditingPoolName] = useState(null)
  const [editPoolNameVal, setEditPoolNameVal] = useState('')
  const [savingPoolName, setSavingPoolName] = useState(false)
  const [editingSessionName, setEditingSessionName] = useState(null)
  const [editSessionNameVal, setEditSessionNameVal] = useState('')
  const [savingSessionName, setSavingSessionName] = useState(false)

  useEffect(() => { loadAllPools() }, [])

  async function loadAllPools() {
    setLoading(true)
    const { data } = await supabase.from('pool_entries').select('*, friend_pools(*)').eq('user_id', session.user.id)
    if (data) {
      const current = data.filter(e => e.friend_pools && e.period === (e.friend_pools.current_period || 1))
      setAllPools(current)
    } else { setAllPools([]) }
    setLoading(false)
  }

  function getPoolsBySport() {
    const g = {}
    for (const e of allPools) {
      const sp = e.friend_pools?.sport
      if (!sp) continue
      if (!g[sp]) g[sp] = []
      g[sp].push(e)
    }
    return g
  }

  function toggleSport(sp) { setCollapsedSports(p => ({...p, [sp]: !p[sp]})) }
  function genCode() { return Math.random().toString(36).substring(2,8).toUpperCase() }

  async function createPool() {
    setCreating(true); setError('')
    if (!poolName.trim()) { setError('Give your pool a name'); setCreating(false); return }
    const code = genCode()
    const sn = firstSessionName.trim() ? {1: firstSessionName.trim()} : {}
    const { data: pool, error: pe } = await supabase.from('friend_pools').insert({
      name: poolName.trim(), invite_code: code, commissioner_id: session.user.id,
      sport: poolSport, current_period: 1, session_start: sessionStart||null, session_end: sessionEnd||null, session_names: sn
    }).select().single()
    if (pe) { setError(pe.message); setCreating(false); return }
    await supabase.from('pool_entries').insert({ user_id: session.user.id, friend_pool_id: pool.id, period: 1, opted_in: true })
    setPoolName(''); setPoolSport('cbb'); setFirstSessionName(''); setSessionStart(''); setSessionEnd('')
    setShowCreate(false); setCreating(false); loadAllPools()
  }

  async function joinPool() {
    setJoining(true); setError('')
    const { data: pool } = await supabase.from('friend_pools').select('*').eq('invite_code', joinCode.trim().toUpperCase()).single()
    if (!pool) { setError('Pool not found — double check the code'); setJoining(false); return }
    const cp = pool.current_period || 1
    const { error: ee } = await supabase.from('pool_entries').insert({ user_id: session.user.id, friend_pool_id: pool.id, period: cp, opted_in: true })
    if (ee) { setError('You may already be in this pool'); setJoining(false); return }
    setJoinCode(''); setShowJoin(false); setJoining(false); loadAllPools()
  }

  async function deletePool(pid) {
    setDeleting(true)
    const { data: entries } = await supabase.from('pool_entries').select('id').eq('friend_pool_id', pid)
    if (entries?.length) await supabase.from('picks').delete().in('pool_entry_id', entries.map(e=>e.id))
    await supabase.from('pool_entries').delete().eq('friend_pool_id', pid)
    await supabase.from('friend_pools').delete().eq('id', pid)
    setShowDeleteConfirm(null); setDeleting(false); setTimeout(loadAllPools, 300)
  }

  async function resetPool(pid) {
    setResetting(true)
    const { data: pool } = await supabase.from('friend_pools').select('current_period, session_names').eq('id', pid).single()
    const cp = pool?.current_period||1, np = cp+1
    const { data: ce } = await supabase.from('pool_entries').select('id, user_id, opted_in').eq('friend_pool_id', pid).eq('period', cp)
    if (ce) {
      for (const e of ce) {
        if (!e.opted_in) continue
        const { data: up } = await supabase.from('picks').select('units, category').eq('pool_entry_id', e.id)
        const au = (up||[]).filter(p=>p.category!=='unallocated-penalty').reduce((s,p)=>s+(p.units||0),0)
        if (au<100) await supabase.from('picks').insert({user_id:e.user_id,pool_entry_id:e.id,category:'unallocated-penalty',result:'loss',payout_units:au-100,units:0,game_id:'penalty',team:'Unallocated Penalty',locked_odds:'0'})
      }
      const { data: ae } = await supabase.from('pool_entries').select('user_id').eq('friend_pool_id', pid)
      for (const uid of [...new Set(ae?.map(e=>e.user_id)||[])]) {
        await supabase.from('pool_entries').insert({user_id:uid,friend_pool_id:pid,period:np,opted_in:false,joined_at:new Date().toISOString()})
      }
      const sn = pool?.session_names||{}; if (newSessionName.trim()) sn[np]=newSessionName.trim()
      await supabase.from('friend_pools').update({current_period:np,session_start:newSessionStart||null,session_end:newSessionEnd||null,session_names:sn}).eq('id',pid)
    }
    setShowResetConfirm(null); setNewSessionStart(''); setNewSessionEnd(''); setNewSessionName(''); setResetting(false); loadAllPools()
  }

  async function savePoolName(pid) {
    if (!editPoolNameVal.trim()||savingPoolName) return
    setSavingPoolName(true)
    await supabase.from('friend_pools').update({name:editPoolNameVal.trim()}).eq('id',pid)
    setEditingPoolName(null); setSavingPoolName(false); loadAllPools()
  }

  async function saveSessionName(pid, period, sn) {
    if (savingSessionName) return; setSavingSessionName(true)
    const u = {...sn}; editSessionNameVal.trim() ? u[period]=editSessionNameVal.trim() : delete u[period]
    await supabase.from('friend_pools').update({session_names:u}).eq('id',pid)
    setEditingSessionName(null); setSavingSessionName(false); loadAllPools()
  }

  const poolsBySport = getPoolsBySport()
  const activeSports = SPORT_ORDER.filter(s => poolsBySport[s]?.length)

  return (
    <div>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={{flex:1}}>
            <div style={s.heroLabel}>Your Pools</div>
            <div style={s.heroTitle}>Play Against <em style={{fontStyle:'normal',color:'#C9A84C'}}>Your Crew</em></div>
            <div style={s.heroSub}>Create a private pool and invite friends with a code. Pick winners across any sport — bragging rights on the line.</div>
          </div>
          <div style={s.heroButtons}>
            <button style={s.btnCreate} onClick={()=>{setShowCreate(true);setShowJoin(false);setError('')}}>+ Create Pool</button>
            <button style={s.btnJoin} onClick={()=>{setShowJoin(true);setShowCreate(false);setError('')}}>Enter Code</button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div style={s.howItWorks}>
        <div style={s.howTitle}>How It Works</div>
        <div style={s.howGrid}>
          <div style={s.howItem}><div style={s.howIcon}>🎯</div><div style={s.howText}><strong>6 picks per session</strong> — ML Favorite, ML Underdog, Spread Fav, Spread Dog, Over, Under</div></div>
          <div style={s.howItem}><div style={s.howIcon}>💰</div><div style={s.howText}><strong>Allocate all 100 units</strong> across your picks. Unused units are penalized at session end</div></div>
          <div style={s.howItem}><div style={s.howIcon}>🔒</div><div style={s.howText}><strong>Picks auto-save</strong> and lock at game time. Change anytime before tip-off or kickoff</div></div>
          <div style={s.howItem}><div style={s.howIcon}>📊</div><div style={s.howText}><strong>Payouts use real odds</strong> locked at pick time. Underdogs pay more — just like a real sportsbook</div></div>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div style={s.formCard}>
          <div style={s.formTitle}>Create a Pool</div>
          <div style={s.field}><label style={s.label}>Pool Name</label><input style={s.input} type="text" placeholder="e.g. Friday Night Crew" value={poolName} onChange={e=>setPoolName(e.target.value)} /></div>
          <div style={s.field}><label style={s.label}>Sport</label>
            <select style={s.input} value={poolSport} onChange={e=>setPoolSport(e.target.value)}>
              {SPORT_ORDER.map(id=>(<option key={id} value={id}>{SPORT_CONFIG[id].emoji} {SPORT_CONFIG[id].label}</option>))}
            </select>
          </div>
          <div style={s.field}><label style={s.label}>First Session Name <span style={s.optional}>(optional)</span></label><input style={s.input} type="text" placeholder="e.g. Round of 64" value={firstSessionName} onChange={e=>setFirstSessionName(e.target.value)} /></div>
          <div style={s.dateRow}>
            <div style={{flex:1,minWidth:'250px'}}><label style={s.label}>Session Start <span style={s.optional}>(optional)</span></label><input style={s.input} type="date" value={sessionStart} onChange={e=>setSessionStart(e.target.value)} /></div>
            <div style={{flex:1,minWidth:'250px'}}><label style={s.label}>Session End <span style={s.optional}>(optional)</span></label><input style={s.input} type="date" value={sessionEnd} onChange={e=>setSessionEnd(e.target.value)} /></div>
          </div>
          <div style={s.dateHint}>If set, only games within this window will appear in pick selection.</div>
          {error && <div style={s.error}>{error}</div>}
          <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
            <button style={s.btnCancel} onClick={()=>setShowCreate(false)}>Cancel</button>
            <button style={s.btnConfirm} onClick={createPool} disabled={creating}>{creating?'Creating...':'Create Pool →'}</button>
          </div>
        </div>
      )}

      {/* Join Form */}
      {showJoin && (
        <div style={s.formCard}>
          <div style={s.formTitle}>Join a Pool</div>
          <div style={s.formHint}>Enter an invite code — works for any sport. We'll add you to the right pool automatically.</div>
          <div style={s.field}><label style={s.label}>Invite Code</label><input style={s.input} type="text" placeholder="e.g. FNC7K2" value={joinCode} onChange={e=>setJoinCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&joinPool()} /></div>
          {error && <div style={s.error}>{error}</div>}
          <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
            <button style={s.btnCancel} onClick={()=>setShowJoin(false)}>Cancel</button>
            <button style={s.btnConfirm} onClick={joinPool} disabled={joining}>{joining?'Joining...':'Join Pool →'}</button>
          </div>
        </div>
      )}

      {/* Pool List */}
      {loading ? <div style={s.empty}>Loading...</div> :
       allPools.length===0 ? (
        <div style={s.emptyState}>
          <div style={{fontSize:'2rem',marginBottom:'12px'}}>👥</div>
          <div style={s.emptyTitle}>No pools yet</div>
          <div style={s.emptySub}>Create a pool and invite your friends, or enter a code someone sent you.</div>
        </div>
       ) : (
        <div style={s.poolList}>
          {activeSports.map(sid => {
            const cfg = SPORT_CONFIG[sid], pools = poolsBySport[sid], collapsed = collapsedSports[sid]
            return (
              <div key={sid} style={s.sportSection}>
                <div style={{...s.sportHeader, borderLeftColor:cfg.color}} onClick={()=>toggleSport(sid)}>
                  <div style={s.sportHeaderLeft}>
                    <span style={s.sportEmoji}>{cfg.emoji}</span>
                    <span style={s.sportLabel}>{cfg.label}</span>
                    <span style={s.sportCount}>{pools.length} pool{pools.length!==1?'s':''}</span>
                  </div>
                  <span style={{...s.chevron, transform:collapsed?'rotate(-90deg)':'rotate(0deg)'}}>▾</span>
                </div>
                {!collapsed && pools.map(entry => {
                  const pool=entry.friend_pools, isCom=pool.commissioner_id===session.user.id
                  const sn=pool.session_names||{}, csn=sn[pool.current_period||1]
                  return (
                    <div key={entry.id}>
                      <div style={s.poolCard} onClick={()=>onNavigateToPool(pool.sport,pool.id)}>
                        <div style={{...s.poolDot,background:cfg.color}} />
                        <div style={s.poolInfo}>
                          {editingPoolName===pool.id ? (
                            <div style={{display:'flex',gap:'6px',alignItems:'center',marginBottom:'2px'}} onClick={e=>e.stopPropagation()}>
                              <input style={{...s.input,padding:'4px 8px',fontSize:'0.85rem',fontWeight:700,flex:1}} value={editPoolNameVal} onChange={e=>setEditPoolNameVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&savePoolName(pool.id)} autoFocus />
                              <button style={s.inlineSave} onClick={()=>savePoolName(pool.id)}>✓</button>
                              <button style={s.inlineCancel} onClick={()=>setEditingPoolName(null)}>✕</button>
                            </div>
                          ) : (
                            <div style={s.poolName}>{pool.name}{isCom && <span style={s.editIcon} onClick={e=>{e.stopPropagation();setEditingPoolName(pool.id);setEditPoolNameVal(pool.name)}}>✎</span>}</div>
                          )}
                          <div style={s.poolMeta}>
                            Code: <strong>{pool.invite_code}</strong> · Session {pool.current_period||1}
                            {editingSessionName===pool.id ? (
                              <span style={{display:'inline-flex',gap:'4px',alignItems:'center',marginLeft:'6px'}} onClick={e=>e.stopPropagation()}>
                                · <input style={{...s.input,padding:'2px 6px',fontSize:'0.7rem',width:'100px',display:'inline'}} placeholder="Session name" value={editSessionNameVal} onChange={e=>setEditSessionNameVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveSessionName(pool.id,pool.current_period||1,sn)} autoFocus />
                                <button style={s.inlineSave} onClick={()=>saveSessionName(pool.id,pool.current_period||1,sn)}>✓</button>
                                <button style={s.inlineCancel} onClick={()=>setEditingSessionName(null)}>✕</button>
                              </span>
                            ) : csn ? (
                              <span> · 📋 {csn}{isCom && <span style={s.editIcon} onClick={e=>{e.stopPropagation();setEditingSessionName(pool.id);setEditSessionNameVal(csn)}}> ✎</span>}</span>
                            ) : isCom ? <span style={s.editIcon} onClick={e=>{e.stopPropagation();setEditingSessionName(pool.id);setEditSessionNameVal('')}}> + name session</span> : null}
                            {pool.session_start&&pool.session_end && <span> · 📅 {pool.session_start} → {pool.session_end}</span>}
                          </div>
                        </div>
                        <div style={s.poolRight} onClick={e=>e.stopPropagation()}>
                          <div style={s.poolBadge}>{isCom?'👑':'✓'}</div>
                          {isCom && (
                            <div style={s.comActions}>
                              <button style={s.actBtn} onClick={()=>{setShowResetConfirm(pool.id);setNewSessionStart('');setNewSessionEnd('');setNewSessionName('')}}>New Session</button>
                              <button style={{...s.actBtn,...s.delBtn}} onClick={()=>setShowDeleteConfirm(pool.id)}>Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                      {showResetConfirm===pool.id && (
                        <div style={s.confirmCard}>
                          <div style={s.confirmTitle}>⚠️ New Session?</div>
                          <div style={s.confirmText}>This will clear all picks for everyone in <strong>{pool.name}</strong> and start a new session. Season standings preserved.</div>
                          <div style={s.field}><label style={{...s.label,color:'#c0392b'}}>Session Name <span style={s.optional}>(optional)</span></label><input style={s.input} type="text" placeholder="e.g. Round of 32" value={newSessionName} onChange={e=>setNewSessionName(e.target.value)} /></div>
                          <div style={s.dateRow}>
                            <div style={{flex:1,minWidth:'250px'}}><label style={{...s.label,color:'#c0392b'}}>Start <span style={s.optional}>(opt)</span></label><input style={s.input} type="date" value={newSessionStart} onChange={e=>setNewSessionStart(e.target.value)} /></div>
                            <div style={{flex:1,minWidth:'250px'}}><label style={{...s.label,color:'#c0392b'}}>End <span style={s.optional}>(opt)</span></label><input style={s.input} type="date" value={newSessionEnd} onChange={e=>setNewSessionEnd(e.target.value)} /></div>
                          </div>
                          <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
                            <button style={s.btnCancel} onClick={()=>setShowResetConfirm(null)}>Cancel</button>
                            <button style={s.btnConfirm} onClick={()=>resetPool(pool.id)} disabled={resetting}>{resetting?'Resetting...':'Yes, New Session →'}</button>
                          </div>
                        </div>
                      )}
                      {showDeleteConfirm===pool.id && (
                        <div style={s.confirmCard}>
                          <div style={s.confirmTitle}>🗑️ Delete Pool?</div>
                          <div style={s.confirmText}>This will <strong>permanently delete</strong> <strong>{pool.name}</strong> including all picks and history. Cannot be undone.</div>
                          <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
                            <button style={s.btnCancel} onClick={()=>setShowDeleteConfirm(null)}>Cancel</button>
                            <button style={{...s.btnConfirm,background:'#c0392b'}} onClick={()=>deletePool(pool.id)} disabled={deleting}>{deleting?'Deleting...':'Yes, Delete Forever →'}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
       )}
    </div>
  )
}

const s = {
  hero:{background:'#1a1a1a',borderRadius:'16px',padding:'28px',marginBottom:'20px'},
  heroInner:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'16px'},
  heroLabel:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.62rem',textTransform:'uppercase',letterSpacing:'3px',color:'rgba(255,255,255,0.35)',marginBottom:'6px'},
  heroTitle:{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:'1.5rem',color:'#fff',marginBottom:'5px'},
  heroSub:{fontSize:'0.82rem',color:'rgba(255,255,255,0.5)',lineHeight:1.5,maxWidth:'420px'},
  heroButtons:{display:'flex',gap:'10px',flexShrink:0},
  btnCreate:{padding:'10px 22px',background:'#4B2E83',border:'none',borderRadius:'9px',color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'},
  btnJoin:{padding:'10px 22px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'9px',color:'rgba(255,255,255,0.8)',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'},
  howItWorks:{background:'#fff',border:'1px solid #e2dfd8',borderRadius:'14px',padding:'18px 20px',marginBottom:'20px'},
  howTitle:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'3px',color:'#C9A84C',marginBottom:'14px'},
  howGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'12px'},
  howItem:{display:'flex',gap:'10px',alignItems:'flex-start'},
  howIcon:{fontSize:'1.1rem',flexShrink:0,marginTop:'1px'},
  howText:{fontSize:'0.76rem',color:'#555',lineHeight:1.5},
  formCard:{background:'#fff',border:'1px solid #e2dfd8',borderRadius:'14px',padding:'22px',marginBottom:'20px'},
  formTitle:{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.1rem',marginBottom:'16px'},
  formHint:{fontSize:'0.78rem',color:'#888580',marginBottom:'14px',lineHeight:1.5},
  field:{marginBottom:'12px'},
  dateRow:{display:'flex',gap:'10px',marginBottom:'8px',flexWrap:'wrap'},
  dateHint:{fontSize:'0.7rem',color:'#888580',marginBottom:'6px'},
  optional:{color:'#aaa',fontWeight:400,fontSize:'0.6rem'},
  label:{display:'block',fontSize:'0.66rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',color:'#888580',marginBottom:'5px'},
  input:{width:'100%',border:'1.5px solid #e2dfd8',borderRadius:'9px',padding:'10px 14px',fontFamily:"'Barlow',sans-serif",fontSize:'0.9rem',outline:'none',boxSizing:'border-box'},
  error:{background:'rgba(192,57,43,0.08)',border:'1px solid rgba(192,57,43,0.3)',borderRadius:'8px',padding:'10px 14px',color:'#c0392b',fontSize:'0.82rem',marginTop:'8px'},
  btnCancel:{padding:'10px 18px',background:'#f9f8f6',border:'1.5px solid #e2dfd8',borderRadius:'9px',color:'#888580',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.85rem',cursor:'pointer'},
  btnConfirm:{flex:1,padding:'10px',background:'#4B2E83',border:'none',borderRadius:'9px',color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'},
  empty:{textAlign:'center',padding:'40px 20px',color:'#888580',fontSize:'0.9rem'},
  emptyState:{textAlign:'center',padding:'48px 24px',background:'#fff',border:'2px dashed #e2dfd8',borderRadius:'16px'},
  emptyTitle:{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.15rem',marginBottom:'6px'},
  emptySub:{fontSize:'0.82rem',color:'#888580',lineHeight:1.5,maxWidth:'340px',margin:'0 auto'},
  poolList:{display:'flex',flexDirection:'column',gap:'8px'},
  sportSection:{marginBottom:'4px'},
  sportHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'#fff',border:'1px solid #e2dfd8',borderLeft:'4px solid #4B2E83',borderRadius:'10px',cursor:'pointer',userSelect:'none'},
  sportHeaderLeft:{display:'flex',alignItems:'center',gap:'10px'},
  sportEmoji:{fontSize:'1.1rem'},
  sportLabel:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.9rem',textTransform:'uppercase',letterSpacing:'1.5px'},
  sportCount:{fontSize:'0.68rem',fontFamily:"'Barlow Condensed',sans-serif",color:'#888580'},
  chevron:{fontSize:'1rem',color:'#888580',transition:'transform 0.2s ease'},
  poolCard:{background:'#fff',border:'1px solid #e2dfd8',borderRadius:'10px',padding:'14px 16px',marginTop:'4px',marginLeft:'20px',display:'flex',alignItems:'center',gap:'12px',cursor:'pointer'},
  poolDot:{width:'8px',height:'8px',borderRadius:'50%',flexShrink:0},
  poolInfo:{flex:1,minWidth:0},
  poolName:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.92rem',marginBottom:'2px',display:'flex',alignItems:'center',gap:'6px'},
  poolMeta:{fontSize:'0.7rem',color:'#888580',lineHeight:1.4},
  poolRight:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'6px',flexShrink:0},
  poolBadge:{fontSize:'0.9rem'},
  comActions:{display:'flex',gap:'4px'},
  actBtn:{padding:'3px 8px',background:'#f9f8f6',border:'1px solid #e2dfd8',borderRadius:'5px',color:'#888580',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.6rem',textTransform:'uppercase',letterSpacing:'0.5px',cursor:'pointer'},
  delBtn:{color:'#c0392b',borderColor:'rgba(192,57,43,0.2)'},
  confirmCard:{background:'#fff8f8',border:'1.5px solid rgba(192,57,43,0.3)',borderRadius:'12px',padding:'16px',marginTop:'4px',marginLeft:'20px'},
  confirmTitle:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.95rem',color:'#c0392b',marginBottom:'6px'},
  confirmText:{fontSize:'0.8rem',color:'#555',lineHeight:1.5,marginBottom:'14px'},
  editIcon:{fontSize:'0.68rem',color:'#4B2E83',cursor:'pointer',opacity:0.6,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600},
  inlineSave:{width:'22px',height:'22px',borderRadius:'5px',border:'1.5px solid #1a7a4a',background:'#eaf7ef',color:'#1a7a4a',fontSize:'0.7rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontWeight:700},
  inlineCancel:{width:'22px',height:'22px',borderRadius:'5px',border:'1.5px solid #e2dfd8',background:'#f9f8f6',color:'#888580',fontSize:'0.7rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontWeight:700},
}