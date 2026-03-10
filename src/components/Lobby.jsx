import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Lobby({ session, profile, activeSport }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [myPools, setMyPools] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [poolName, setPoolName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [sessionStart, setSessionStart] = useState('')
  const [sessionEnd, setSessionEnd] = useState('')
  const [newSessionStart, setNewSessionStart] = useState('')
  const [newSessionEnd, setNewSessionEnd] = useState('')
  const [newSessionName, setNewSessionName] = useState('')
  const [firstSessionName, setFirstSessionName] = useState('')
  const [editingPoolName, setEditingPoolName] = useState(null) // pool id being edited
  const [editPoolNameVal, setEditPoolNameVal] = useState('')
  const [savingPoolName, setSavingPoolName] = useState(false)
  const [editingSessionName, setEditingSessionName] = useState(null) // pool id being edited
  const [editSessionNameVal, setEditSessionNameVal] = useState('')
  const [savingSessionName, setSavingSessionName] = useState(false)

  useEffect(() => { loadMyPools() }, [activeSport])

  async function loadMyPools() {
  setLoading(true)
  const { data: allEntries } = await supabase
    .from('pool_entries')
    .select('*, friend_pools(*)')
    .eq('user_id', session.user.id)

  if (allEntries) {
    const currentEntries = allEntries.filter(entry => {
      const pool = entry.friend_pools
      if (!pool) return false
      if (pool.sport !== activeSport) return false
      return entry.period === (pool.current_period || 1)
    })
    setMyPools(currentEntries)
  } else {
    setMyPools([])
  }
  setLoading(false)
}

  function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  async function createPool() {
    setCreating(true)
    setError('')
    if (!poolName.trim()) { setError('Give your pool a name'); setCreating(false); return }
    const code = generateCode()
    const sessionNames = firstSessionName.trim() ? { 1: firstSessionName.trim() } : {}
    const { data: pool, error: poolError } = await supabase
      .from('friend_pools')
      .insert({
        name: poolName.trim(),
        invite_code: code,
        commissioner_id: session.user.id,
        sport: activeSport,
        current_period: 1,
        session_start: sessionStart || null,
        session_end: sessionEnd || null,
        session_names: sessionNames,
      })
      .select()
      .single()
    if (poolError) { setError(poolError.message); setCreating(false); return }
    await supabase.from('pool_entries').insert({
      user_id: session.user.id,
      friend_pool_id: pool.id,
      period: 1,
      opted_in: true
    })
    setPoolName('')
    setFirstSessionName('')
    setSessionStart('')
    setSessionEnd('')
    setShowCreate(false)
    setCreating(false)
    loadMyPools()
  }

  async function joinPool() {
    setJoining(true)
    setError('')
    const { data: pool } = await supabase
      .from('friend_pools')
      .select('*')
      .eq('invite_code', joinCode.trim().toUpperCase())
      .single()
    if (!pool) { setError('Pool not found — check your code'); setJoining(false); return }
    if (pool.sport !== activeSport) {
      const label = pool.sport === 'multi' ? 'Multi-Sport' : pool.sport.toUpperCase()
      const tabLabel = pool.sport === 'multi' ? 'Multi' : pool.sport.toUpperCase()
      setError(`This is a ${label} pool — switch to the ${tabLabel} tab to join`)
      setJoining(false)
      return
    }
    const currentPeriod = pool.current_period || 1
    const { error: entryError } = await supabase
      .from('pool_entries')
      .insert({ user_id: session.user.id, friend_pool_id: pool.id, period: currentPeriod, opted_in: true })
    if (entryError) { setError('You may already be in this pool'); setJoining(false); return }
    setJoinCode('')
    setShowJoin(false)
    setJoining(false)
    loadMyPools()
  }

async function deletePool(poolId) {
  setDeleting(true)
  
  const { data: entries, error: entriesError } = await supabase
    .from('pool_entries')
    .select('id')
    .eq('friend_pool_id', poolId)

  console.log('entries to delete:', entries, entriesError)

  if (entries && entries.length > 0) {
    const entryIds = entries.map(e => e.id)
    const { error: picksError } = await supabase.from('picks').delete().in('pool_entry_id', entryIds)
    console.log('picks delete error:', picksError)
  }

  const { error: entriesDeleteError } = await supabase.from('pool_entries').delete().eq('friend_pool_id', poolId)
  console.log('entries delete error:', entriesDeleteError)

  const { error: poolDeleteError } = await supabase.from('friend_pools').delete().eq('id', poolId)
  console.log('pool delete error:', poolDeleteError)

  setShowDeleteConfirm(null)
  setDeleting(false)
  setTimeout(() => loadMyPools(), 300)
}

  async function resetPool(poolId) {
    setResetting(true)
    const { data: pool } = await supabase
      .from('friend_pools')
      .select('current_period')
      .eq('id', poolId)
      .single()

    const currentPeriod = pool?.current_period || 1
    const newPeriod = currentPeriod + 1

    // Only get entries for the CURRENT period — not all periods
    const { data: currentEntries } = await supabase
      .from('pool_entries')
      .select('id, user_id, opted_in')
      .eq('friend_pool_id', poolId)
      .eq('period', currentPeriod)

    if (currentEntries) {
      // Apply penalty only to OPTED-IN users
      for (const entry of currentEntries) {
        if (!entry.opted_in) continue // skip inactive users — no penalty

        const { data: userPicks } = await supabase
          .from('picks')
          .select('units, category')
          .eq('pool_entry_id', entry.id)

        const allocatedUnits = (userPicks || [])
          .filter(p => p.category !== 'unallocated-penalty')
          .reduce((sum, p) => sum + (p.units || 0), 0)

        if (allocatedUnits < 100) {
          const penalty = allocatedUnits - 100
          await supabase.from('picks').insert({
            user_id: entry.user_id,
            pool_entry_id: entry.id,
            category: 'unallocated-penalty',
            result: 'loss',
            payout_units: penalty,
            units: 0,
            game_id: 'penalty',
            team: 'Unallocated Penalty',
            locked_odds: '0'
          })
        }
      }

      // Create new period entries for ALL users — everyone starts as not opted in
      const { data: allEntries } = await supabase
        .from('pool_entries')
        .select('user_id')
        .eq('friend_pool_id', poolId)

      // Deduplicate users
      const uniqueUsers = [...new Set(allEntries?.map(e => e.user_id) || [])]

      for (const userId of uniqueUsers) {
        await supabase.from('pool_entries').insert({
          user_id: userId,
          friend_pool_id: poolId,
          period: newPeriod,
          opted_in: false,
          joined_at: new Date().toISOString()
        })
      }

      // Fetch current session_names to append the new one
      const { data: poolData } = await supabase
        .from('friend_pools')
        .select('session_names')
        .eq('id', poolId)
        .single()

      const sessionNames = poolData?.session_names || {}
      if (newSessionName.trim()) {
        sessionNames[newPeriod] = newSessionName.trim()
      }

      await supabase
        .from('friend_pools')
        .update({
          current_period: newPeriod,
          session_start: newSessionStart || null,
          session_end: newSessionEnd || null,
          session_names: sessionNames,
        })
        .eq('id', poolId)
    }

    setShowResetConfirm(null)
    setNewSessionStart('')
    setNewSessionEnd('')
    setNewSessionName('')
    setResetting(false)
    loadMyPools()
  }

  async function savePoolName(poolId) {
    if (!editPoolNameVal.trim() || savingPoolName) return
    setSavingPoolName(true)
    await supabase.from('friend_pools').update({ name: editPoolNameVal.trim() }).eq('id', poolId)
    setEditingPoolName(null)
    setEditPoolNameVal('')
    setSavingPoolName(false)
    loadMyPools()
  }

  async function saveSessionName(poolId, period, sessionNames) {
    if (savingSessionName) return
    setSavingSessionName(true)
    const updated = { ...sessionNames }
    if (editSessionNameVal.trim()) {
      updated[period] = editSessionNameVal.trim()
    } else {
      delete updated[period]
    }
    await supabase.from('friend_pools').update({ session_names: updated }).eq('id', poolId)
    setEditingSessionName(null)
    setEditSessionNameVal('')
    setSavingSessionName(false)
    loadMyPools()
  }

  return (
    <div>
      <div style={s.hero}>
        <div style={s.heroLabel}>Friend Pools</div>
        <div style={s.heroTitle}>Play Against <em style={{fontStyle:'normal',color:'#C9A84C'}}>Your Crew</em></div>
        {activeSport === 'multi' ? (
          <>
            <div style={s.multiBadge}>🌐 Multi-Sport Pool — Pick from any sport</div>
            <div style={s.heroSub}>All 6 pick categories, but your games can come from NFL, CFB, NBA, CBB, MLB, or NHL — all in one pool.</div>
          </>
        ) : (
          <div style={s.heroSub}>Create a private pool and invite friends with a code. Same picks, same rules — bragging rights on the line.</div>
        )}
        <div style={s.heroButtons}>
          <button style={s.btnCreate} onClick={() => { setShowCreate(true); setShowJoin(false); setError('') }}>+ Create Pool</button>
          <button style={s.btnJoin} onClick={() => { setShowJoin(true); setShowCreate(false); setError('') }}>Enter Code</button>
        </div>
      </div>

      {showCreate && (
        <div style={s.formCard}>
          <div style={s.formTitle}>Create a Pool</div>
          <div style={s.field}>
            <label style={s.label}>Pool Name</label>
            <input style={s.input} type="text" placeholder="e.g. Friday Night Crew"
              value={poolName} onChange={e => setPoolName(e.target.value)} />
          </div>
          <div style={s.field}>
            <label style={s.label}>First Session Name <span style={s.optional}>(optional)</span></label>
            <input style={s.input} type="text" placeholder="e.g. Round of 64"
              value={firstSessionName} onChange={e => setFirstSessionName(e.target.value)} />
          </div>
          <div style={s.dateRow}>
            <div style={{flex:1}}>
              <label style={s.label}>Session Start <span style={s.optional}>(optional)</span></label>
              <input style={s.input} type="date" value={sessionStart} onChange={e => setSessionStart(e.target.value)} />
            </div>
            <div style={{flex:1}}>
              <label style={s.label}>Session End <span style={s.optional}>(optional)</span></label>
              <input style={s.input} type="date" value={sessionEnd} onChange={e => setSessionEnd(e.target.value)} />
            </div>
          </div>
          <div style={s.dateHint}>If set, only games within this window will appear in pick selection.</div>
          {error && <div style={s.error}>{error}</div>}
          <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
            <button style={s.btnCancel} onClick={() => setShowCreate(false)}>Cancel</button>
            <button style={s.btnConfirm} onClick={createPool} disabled={creating}>
              {creating ? 'Creating...' : 'Create Pool →'}
            </button>
          </div>
        </div>
      )}

      {showJoin && (
        <div style={s.formCard}>
          <div style={s.formTitle}>Join a Pool</div>
          <div style={s.field}>
            <label style={s.label}>Invite Code</label>
            <input style={s.input} type="text" placeholder="e.g. FNC7K2"
              value={joinCode} onChange={e => setJoinCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && joinPool()} />
          </div>
          {error && <div style={s.error}>{error}</div>}
          <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
            <button style={s.btnCancel} onClick={() => setShowJoin(false)}>Cancel</button>
            <button style={s.btnConfirm} onClick={joinPool} disabled={joining}>
              {joining ? 'Joining...' : 'Join Pool →'}
            </button>
          </div>
        </div>
      )}

      <div style={s.sectionTitle}><span>Your Pools</span></div>
      {!loading && myPools.some(e => e.friend_pools.commissioner_id === session.user.id) && (
        <div style={s.commishCard}>
          <div style={s.commishHeader}>
            <span style={s.commishCrown}>👑</span>
            <span style={s.commishTitle}>Commissioner Guide</span>
          </div>
          <div style={s.commishBody}>
            <div style={s.commishRow}>
              <div style={s.commishStep}>1</div>
              <div style={s.commishText}><strong>You control the sessions.</strong> When you're ready to start a new round of picks, hit "New Session." Everyone's picks reset and a fresh session begins.</div>
            </div>
            <div style={s.commishRow}>
              <div style={s.commishStep}>2</div>
              <div style={s.commishText}><strong>Give everyone a heads up.</strong> Let your pool know before ending a session so they have time to finalize picks and check results.</div>
            </div>
            <div style={s.commishRow}>
              <div style={s.commishStep}>3</div>
              <div style={s.commishText}><strong>Season stats carry over.</strong> All-time records, net units, and past session results are always preserved — only current picks reset.</div>
            </div>
            <div style={s.commishRow}>
              <div style={s.commishStep}>4</div>
              <div style={s.commishText}><strong>Unallocated unit penalty.</strong> Any unused units out of 100 are deducted at session end. Remind your pool to use all their units.</div>
            </div>
            <div style={s.commishRow}>
              <div style={s.commishStep}>5</div>
              <div style={s.commishText}><strong>Session window.</strong> Set a date range to restrict picks to specific games — useful for tournament rounds like March Madness Round of 64.</div>
            </div>
          </div>
        </div>
      )}

      {loading ? <div style={s.empty}>Loading...</div> :
       myPools.length === 0 ? <div style={s.empty}>No pools yet — create one or enter a code above.</div> :
       myPools.map(entry => (
        <div key={entry.id}>
          <div style={s.poolCard}>
            <div style={s.poolIcon}>👥</div>
            <div style={s.poolInfo}>
              {/* Editable pool name for commissioners */}
              {editingPoolName === entry.friend_pools.id ? (
                <div style={{display:'flex',gap:'6px',alignItems:'center',marginBottom:'4px'}}>
                  <input style={{...s.input, padding:'5px 10px', fontSize:'0.88rem', fontWeight:700}} type="text"
                    value={editPoolNameVal} onChange={e => setEditPoolNameVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && savePoolName(entry.friend_pools.id)} autoFocus />
                  <button style={s.inlineSaveBtn} onClick={() => savePoolName(entry.friend_pools.id)} disabled={savingPoolName}>✓</button>
                  <button style={s.inlineCancelBtn} onClick={() => setEditingPoolName(null)}>✕</button>
                </div>
              ) : (
                <div style={{...s.poolName, display:'flex', alignItems:'center', gap:'6px'}}>
                  {entry.friend_pools.name}
                  {entry.friend_pools.commissioner_id === session.user.id && (
                    <span style={s.editIcon} onClick={() => { setEditingPoolName(entry.friend_pools.id); setEditPoolNameVal(entry.friend_pools.name) }}>✎</span>
                  )}
                </div>
              )}
              <div style={s.poolMeta}>
                Code: <strong>{entry.friend_pools.invite_code}</strong> · {entry.friend_pools.sport === 'multi' ? '🌐 Multi-Sport' : entry.friend_pools.sport.toUpperCase()} · Session {entry.friend_pools.current_period || 1}
                {(() => {
                  const names = entry.friend_pools.session_names || {}
                  const currentPeriod = entry.friend_pools.current_period || 1
                  const currentName = names[currentPeriod]

                  if (editingSessionName === entry.friend_pools.id) {
                    return (
                      <span style={{display:'inline-flex',gap:'4px',alignItems:'center',marginLeft:'6px'}}>
                        · 📋 <input style={{...s.input, padding:'3px 8px', fontSize:'0.72rem', width:'120px', display:'inline'}} type="text"
                          placeholder="Session name" value={editSessionNameVal}
                          onChange={e => setEditSessionNameVal(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveSessionName(entry.friend_pools.id, currentPeriod, names)} autoFocus />
                        <button style={s.inlineSaveBtn} onClick={() => saveSessionName(entry.friend_pools.id, currentPeriod, names)} disabled={savingSessionName}>✓</button>
                        <button style={s.inlineCancelBtn} onClick={() => setEditingSessionName(null)}>✕</button>
                      </span>
                    )
                  }
                  return (
                    <span>
                      {currentName ? <span> · 📋 {currentName}</span> : null}
                      {entry.friend_pools.commissioner_id === session.user.id && (
                        <span style={s.editIcon} onClick={() => { setEditingSessionName(entry.friend_pools.id); setEditSessionNameVal(currentName || '') }}>
                          {currentName ? ' ✎' : ' + name session'}
                        </span>
                      )}
                    </span>
                  )
                })()}
                {entry.friend_pools.session_start && entry.friend_pools.session_end && (
                  <span> · 📅 {entry.friend_pools.session_start} → {entry.friend_pools.session_end}</span>
                )}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'6px'}}>
              <div style={s.poolBadge}>
                {entry.friend_pools.commissioner_id === session.user.id ? '👑 Commissioner' : '✓ Joined'}
              </div>
              {entry.friend_pools.commissioner_id === session.user.id && (
                <button style={s.resetBtn} onClick={() => { setShowResetConfirm(entry.friend_pools.id); setNewSessionStart(''); setNewSessionEnd(''); setNewSessionName('') }}>
                  New Session
                </button>
              )}
              {entry.friend_pools.commissioner_id === session.user.id && (
                <div style={{borderTop:'1px solid #e2dfd8', width:'100%', margin:'4px 0'}} />
              )}
              {entry.friend_pools.commissioner_id === session.user.id && (
                <button style={s.deleteBtn} onClick={() => setShowDeleteConfirm(entry.friend_pools.id)}>
                  Delete Pool
                </button>
              )}
            </div>
          </div>
          {showResetConfirm === entry.friend_pools.id && (
            <div style={s.confirmCard}>
              <div style={s.confirmTitle}>⚠️ New Session?</div>
              <div style={s.confirmText}>This will clear all picks for everyone in <strong>{entry.friend_pools.name}</strong> and start a new session. Season standings will be preserved. This cannot be undone.</div>
              <div style={s.field}>
                <label style={{...s.label, color:'#c0392b'}}>Session Name <span style={s.optional}>(optional)</span></label>
                <input style={s.input} type="text" placeholder="e.g. Round of 32"
                  value={newSessionName} onChange={e => setNewSessionName(e.target.value)} />
              </div>
              <div style={s.dateRow}>
                <div style={{flex:1}}>
                  <label style={{...s.label, color:'#c0392b'}}>New Session Start <span style={s.optional}>(optional)</span></label>
                  <input style={s.input} type="date" value={newSessionStart} onChange={e => setNewSessionStart(e.target.value)} />
                </div>
                <div style={{flex:1}}>
                  <label style={{...s.label, color:'#c0392b'}}>New Session End <span style={s.optional}>(optional)</span></label>
                  <input style={s.input} type="date" value={newSessionEnd} onChange={e => setNewSessionEnd(e.target.value)} />
                </div>
              </div>
              <div style={s.dateHint}>Leave blank to allow all upcoming games.</div>
              <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
                <button style={s.btnCancel} onClick={() => setShowResetConfirm(null)}>Cancel</button>
                <button style={s.btnConfirm} onClick={() => resetPool(entry.friend_pools.id)} disabled={resetting}>
                  {resetting ? 'Resetting...' : 'Yes, New Session →'}
                </button>
              </div>
            </div>
          )}
          {showDeleteConfirm === entry.friend_pools.id && (
            <div style={s.confirmCard}>
              <div style={s.confirmTitle}>🗑️ Delete Pool?</div>
              <div style={s.confirmText}>
                This will <strong>permanently delete</strong> <strong>{entry.friend_pools.name}</strong> including all picks and session history for every player. This cannot be undone.
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
                <button style={s.btnCancel} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                <button style={{...s.btnConfirm, background:'#c0392b'}} onClick={() => deletePool(entry.friend_pools.id)} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Yes, Delete Forever →'}
                </button>
              </div>
            </div>
          )}
        </div>
       ))
      }
    </div>
  )
}

const s = {
  hero:{background:'#1a1a1a',borderRadius:'16px',padding:'26px',marginBottom:'24px',position:'relative',overflow:'hidden'},
  heroLabel:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.62rem',textTransform:'uppercase',letterSpacing:'3px',color:'rgba(255,255,255,0.35)',marginBottom:'6px'},
  heroTitle:{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:'1.5rem',color:'#fff',marginBottom:'5px'},
  heroSub:{fontSize:'0.82rem',color:'rgba(255,255,255,0.5)',lineHeight:1.5,maxWidth:'420px',marginBottom:'18px'},
  heroButtons:{display:'flex',gap:'10px'},
  btnCreate:{padding:'10px 22px',background:'#4B2E83',border:'none',borderRadius:'9px',color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'},
  btnJoin:{padding:'10px 22px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'9px',color:'rgba(255,255,255,0.8)',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'},
  formCard:{background:'#fff',border:'1px solid #e2dfd8',borderRadius:'14px',padding:'22px',marginBottom:'20px'},
  formTitle:{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.1rem',marginBottom:'16px'},
  field:{marginBottom:'12px'},
  dateRow:{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'8px'},
  dateHint:{fontSize:'0.7rem',color:'#888580',marginBottom:'12px'},
  optional:{color:'#aaa',fontWeight:400,fontSize:'0.6rem'},
  label:{display:'block',fontSize:'0.66rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',color:'#888580',marginBottom:'5px'},
  input:{width:'100%',border:'1.5px solid #e2dfd8',borderRadius:'9px',padding:'10px 14px',fontFamily:"'Barlow',sans-serif",fontSize:'0.9rem',outline:'none',boxSizing:'border-box'},
  error:{background:'rgba(192,57,43,0.08)',border:'1px solid rgba(192,57,43,0.3)',borderRadius:'8px',padding:'10px 14px',color:'#c0392b',fontSize:'0.82rem'},
  btnCancel:{padding:'10px 18px',background:'#f9f8f6',border:'1.5px solid #e2dfd8',borderRadius:'9px',color:'#888580',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.85rem',cursor:'pointer'},
  btnConfirm:{flex:1,padding:'10px',background:'#4B2E83',border:'none',borderRadius:'9px',color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'},
  sectionTitle:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.68rem',fontWeight:700,letterSpacing:'3px',color:'#888580',textTransform:'uppercase',marginBottom:'14px',display:'flex',alignItems:'center',gap:'10px'},
  empty:{textAlign:'center',padding:'40px 20px',color:'#888580',fontSize:'0.9rem',background:'#fff',border:'2px dashed #e2dfd8',borderRadius:'12px'},
  poolCard:{background:'#fff',border:'1.5px solid #e2dfd8',borderRadius:'13px',padding:'16px',display:'flex',alignItems:'center',gap:'14px',marginBottom:'10px'},
  poolIcon:{width:'42px',height:'42px',borderRadius:'10px',background:'#2e8b57',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0},
  poolInfo:{flex:1},
  poolName:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.95rem',marginBottom:'2px'},
  poolMeta:{fontSize:'0.72rem',color:'#888580'},
  poolBadge:{fontSize:'0.72rem',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,color:'#4B2E83',whiteSpace:'nowrap'},
  resetBtn:{padding:'4px 10px',background:'rgba(192,57,43,0.08)',border:'1px solid rgba(192,57,43,0.3)',borderRadius:'6px',color:'#c0392b',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'},
  confirmCard:{background:'#fff8f8',border:'1.5px solid rgba(192,57,43,0.3)',borderRadius:'12px',padding:'16px',marginBottom:'10px'},
  confirmTitle:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.95rem',color:'#c0392b',marginBottom:'6px'},
  confirmText:{fontSize:'0.8rem',color:'#555',lineHeight:1.5,marginBottom:'14px'},
  commishCard:{background:'#fdf8ed',border:'1.5px solid #e8d48b',borderRadius:'13px',padding:'18px',marginBottom:'20px'},
  commishHeader:{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'},
  commishCrown:{fontSize:'1.1rem'},
  commishTitle:{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'1.5px',color:'#b8860b'},
  commishBody:{display:'flex',flexDirection:'column',gap:'12px'},
  commishRow:{display:'flex',alignItems:'flex-start',gap:'12px'},
  commishStep:{width:'22px',height:'22px',borderRadius:'50%',background:'#C9A84C',color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.72rem',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'1px'},
  commishText:{fontSize:'0.8rem',color:'#7a6a2a',lineHeight:1.5},
  deleteBtn:{padding:'4px 10px',background:'rgba(192,57,43,0.05)',border:'1px solid rgba(192,57,43,0.2)',borderRadius:'6px',color:'#c0392b',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'},
  multiBadge:{display:'inline-block',background:'rgba(107,71,184,0.12)',border:'1px solid rgba(107,71,184,0.3)',borderRadius:'20px',padding:'5px 14px',fontSize:'0.72rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',color:'#a07ee0',marginBottom:'10px'},
  editIcon:{fontSize:'0.68rem',color:'#4B2E83',cursor:'pointer',opacity:0.6,fontStyle:'normal',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600},
  inlineSaveBtn:{width:'24px',height:'24px',borderRadius:'6px',border:'1.5px solid #1a7a4a',background:'#eaf7ef',color:'#1a7a4a',fontSize:'0.75rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontWeight:700},
  inlineCancelBtn:{width:'24px',height:'24px',borderRadius:'6px',border:'1.5px solid #e2dfd8',background:'#f9f8f6',color:'#888580',fontSize:'0.75rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontWeight:700},
}