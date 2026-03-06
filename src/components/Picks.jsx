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

export default function Picks({ session, activeSport }) {
  const [myPools, setMyPools] = useState([])
  const [activePoolEntry, setActivePoolEntry] = useState(null)
  const [picks, setPicks] = useState({})
  const [units, setUnits] = useState({ 'ml-fav': 15, 'ml-dog': 15, 'sp-fav': 15, 'sp-dog': 15, 'tot-ov': 15, 'tot-un': 15 })
  const [openModal, setOpenModal] = useState(null)
  const [loading, setLoading] = useState(true)

  const totalUnits = units['ml-fav'] + units['ml-dog'] + units['sp-fav'] + units['sp-dog'] + units['tot-ov'] + units['tot-un']
  const remaining = 100 - totalUnits

  useEffect(() => { loadMyPools() }, [activeSport])

  async function loadMyPools() {
    setLoading(true)
    const { data } = await supabase.from('pool_entries').select('*, friend_pools(*)').eq('user_id', session.user.id)
    const filtered = data?.filter(e => e.friend_pools?.sport === activeSport) || []
    setMyPools(filtered)
    if (filtered.length > 0) {
      setActivePoolEntry(filtered[0])
      await loadPicks(filtered[0].id)
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
          homeTeam: p.home_team, awayTeam: p.away_team
        }
        unitMap[p.category] = p.units
      })
      setPicks(pickMap)
      setUnits(unitMap)
    }
  }

  async function savePick(catId, gameId, team, lockedOdds, homeTeam, awayTeam) {
    if (!activePoolEntry) return
    const game = games.find(g => g.id === gameId)
    if (game?.started) return
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
  }

async function increment(catId) {
    const pick = picks[catId]
    const game = pick ? games.find(g => g.id === pick.gameId) : null
    const locked = game?.started || false
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
    const pick = picks[catId]
    const game = pick ? games.find(g => g.id === pick.gameId) : null
    const locked = game?.started || false
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
    const pick = picks[catId]
    const game = pick ? games.find(g => g.id === pick.gameId) : null
    const locked = game?.started || false
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

  return (
    <div>
      {myPools.length > 1 && (
        <div style={s.poolSelector}>
          <div style={s.poolSelectorLabel}>Pool</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {myPools.map(entry => (
              <div key={entry.id} style={{ ...s.poolChip, ...(activePoolEntry?.id === entry.id ? s.poolChipActive : {}) }}
                onClick={() => { setActivePoolEntry(entry); loadPicks(entry.id) }}>
                {entry.friend_pools.name}
              </div>
            ))}
          </div>
        </div>
      )}

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

      <div style={s.sectionTitle}><span>This Week's Picks — Tap to select</span></div>
      <div style={s.picksGrid}>
        {PICK_CATS.map(cat => {
          const pick = picks[cat.id]
          const game = pick ? games.find(g => g.id === pick.gameId) : null
          const locked = game?.started || false
          const catUnits = units[cat.id]
          const canIncrease = !locked && totalUnits < 100 && catUnits < 40

          return (
            <div key={cat.id}
              style={{ ...s.pickCard, borderColor: pick ? cat.color : '#e2dfd8', opacity: locked ? 0.75 : 1 }}
              onClick={() => !locked && setOpenModal(cat.id)}>
              <div style={{ ...s.pickCardTop, background: cat.color }}>
                <div style={s.pickTypeLabel}>{cat.label}</div>
                <div style={s.pickLockBadge}>{locked ? '🔒 Locked' : 'Open'}</div>
              </div>
              <div style={s.pickCardBody}>
  {pick ? (
    <>
      <div style={s.pickTeam}>{pick.team}</div>
      <div style={s.pickMeta}>
        {game ? `${game.away} @ ${game.home}` : pick.awayTeam && pick.homeTeam ? `${pick.awayTeam} @ ${pick.homeTeam}` : ''}
      </div>
      <span style={s.oddsChip}>{pick.lockedOdds}</span>
    </>
  ) : (
    <div style={s.pickEmpty}>Tap to choose a game →</div>
  )}
</div>
              <div style={s.pickCardFooter} onClick={e => e.stopPropagation()}>
                <button
                  style={{ ...s.unitBtn, opacity: locked ? 0.4 : 1 }}
                  onClick={() => !locked && decrement(cat.id)}>−</button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <input
                    style={{ ...s.unitDisplay, color: cat.color, border: '1.5px solid #e2dfd8', borderRadius: '8px', padding: '3px 8px', width: '100%', textAlign: 'center', outline: 'none' }}
                    type="number"
                    min="1"
                    max="40"
                    value={catUnits}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => { e.stopPropagation(); if (['ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault() }}
                    onChange={e => { e.stopPropagation(); !locked && setUnitVal(cat.id, e.target.value) }}
                 />
                  <div style={s.unitLabel}>units</div>
                </div>
                <button
                   style={{ ...s.unitBtn, opacity: (canIncrease) ? 1 : 0.4 }}
                   onClick={() => increment(cat.id)}>+</button>
              </div>
            </div>
          )
        })}
      </div>

      {openModal && (
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
            <div style={{ padding: '14px 16px 24px' }}>
              {games.map(game => {
                const gameOdds = odds[game.id]?.[openModal]
                if (!gameOdds) return null
                const isSelected = picks[openModal]?.gameId === game.id
                return (
                  <div key={game.id}
                    style={{ ...s.modalGame, borderColor: isSelected ? PICK_CATS.find(c => c.id === openModal)?.color : '#e2dfd8', background: isSelected ? '#f0eaf9' : '#fff', opacity: game.started ? 0.45 : 1, cursor: game.started ? 'not-allowed' : 'pointer' }}
                    onClick={() => !game.started && savePick(openModal, game.id, gameOdds.team, gameOdds.odds, game.home, game.away)}>
                    <div style={s.modalGameHeader}>
                      <span>{game.away} @ {game.home}</span>
                      <span style={{ color: game.started ? '#c0392b' : '#888580' }}>{game.started ? '🔒 In Progress' : game.time}</span>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={s.modalPickName}>{gameOdds.team}</div>
                      <div style={s.modalPickOdds}>Odds: <strong style={{ color: PICK_CATS.find(c => c.id === openModal)?.color }}>{gameOdds.odds}</strong></div>
                    </div>
                  </div>
                )
              })}
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
  modalGame: { border: '1.5px solid #e2dfd8', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden' },
  modalGameHeader: { padding: '7px 14px', background: '#f9f8f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', fontFamily: "'Barlow Condensed',sans-serif", textTransform: 'uppercase', letterSpacing: '1px', color: '#888580' },
  modalPickName: { fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: '0.88rem' },
  modalPickOdds: { fontSize: '0.72rem', color: '#888580', marginTop: '2px' },
}