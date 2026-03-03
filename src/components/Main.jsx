import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Topbar from './Topbar'
import Lobby from './Lobby'
import Picks from './Picks'
import Leaderboard from './Leaderboard'
import Profile from './Profile'

const SPORTS = [
  {id:'nfl', label:'NFL', color:'#C9A84C'},
  {id:'cfb', label:'CFB', color:'#e05c00'},
  {id:'cbb', label:'CBB', color:'#0055a5'},
  {id:'nba', label:'NBA', color:'#c9082a'},
  {id:'mlb', label:'MLB', color:'#002d72'},
  {id:'nhl', label:'NHL', color:'#000099'},
]

const TABS = ['Lobby', 'My Picks', 'Leaderboard', 'Profile']

export default function Main({ session }) {
  const [profile, setProfile] = useState(null)
  const [activeSport, setActiveSport] = useState('nfl')
  const [activeTab, setActiveTab] = useState('Lobby')

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(data)
    }
    loadProfile()
  }, [session])

  const activeSportData = SPORTS.find(s => s.id === activeSport)

  return (
    <div style={{position:'relative',zIndex:1}}>
      <Topbar profile={profile} weekLabel={`${activeSportData.label} · Week 14`} />

      {/* Sport Bar */}
      <div style={s.sportBar}>
        {SPORTS.map(sport => (
          <button key={sport.id} onClick={() => setActiveSport(sport.id)}
            style={{...s.sportBtn, ...(activeSport===sport.id ? {...s.sportBtnActive, '--sport-color':sport.color} : {})}}>
            {sport.label}
            {activeSport===sport.id && <div style={{...s.sportUnderline, background:sport.color}} />}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.appWrap}>
        <div style={s.tabs}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{...s.tab, ...(activeTab===tab ? s.tabActive : {})}}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{padding:'0'}}>
          {activeTab === 'Lobby' && <Lobby session={session} profile={profile} activeSport={activeSport} />}
          {activeTab === 'My Picks' && <Picks session={session} activeSport={activeSport} />}
          {activeTab === 'Leaderboard' && <Leaderboard session={session} activeSport={activeSport} />}
          {activeTab === 'Profile' && <Profile session={session} profile={profile} setProfile={setProfile} />}
        </div>
      </div>
    </div>
  )
}

const s = {
  sportBar:{background:'#1a1a1a',padding:'0 24px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',overflowX:'auto',scrollbarWidth:'none'},
  sportBtn:{padding:'0 16px',height:'42px',border:'none',background:'none',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:'0.78rem',textTransform:'uppercase',letterSpacing:'1.5px',color:'rgba(255,255,255,0.35)',cursor:'pointer',position:'relative',whiteSpace:'nowrap',flexShrink:0},
  sportBtnActive:{color:'#fff'},
  sportUnderline:{position:'absolute',bottom:0,left:'16px',right:'16px',height:'3px',borderRadius:'2px 2px 0 0'},
  appWrap:{maxWidth:'960px',margin:'0 auto',padding:'24px 16px 80px'},
  tabs:{display:'flex',gap:'4px',marginBottom:'24px',background:'#fff',border:'1px solid #e2dfd8',borderRadius:'10px',padding:'4px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'},
  tab:{flex:1,padding:'9px 8px',borderRadius:'7px',fontSize:'0.7rem',fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',fontWeight:700,cursor:'pointer',color:'#888580',border:'none',background:'none',textAlign:'center'},
  tabActive:{background:'#4B2E83',color:'#fff',boxShadow:'0 2px 8px rgba(75,46,131,0.3)'},
  placeholder:{textAlign:'center',padding:'60px 20px',color:'#888580',fontSize:'1rem'},
}