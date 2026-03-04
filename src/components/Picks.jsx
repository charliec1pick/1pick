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

const GAMES = {
  nfl: [
    { id: 'g1', home: 'Buffalo Bills', away: 'Kansas City Chiefs', time: 'Sun 1:00 PM', started: true },
    { id: 'g2', home: 'Pittsburgh Steelers', away: 'Houston Texans', time: 'Sun 1:00 PM', started: true },
    { id: 'g3', home: 'Dallas Cowboys', away: 'Philadelphia Eagles', time: 'Sun 1:00 PM', started: false },
    { id: 'g4', home: 'LA Chargers', away: 'Denver Broncos', time: 'Sun 4:25 PM', started: false },
    { id: 'g5', home: 'Seattle Seahawks', away: 'San Francisco 49ers', time: 'Sun 4:25 PM', started: false },
    { id: 'g6', home: 'Washington Commanders', away: 'New York Giants', time: 'Sun 8:20 PM', started: false },
    { id: 'g7', home: 'Baltimore Ravens', away: 'LA Rams', time: 'Sun 8:20 PM', started: false },
    { id: 'g8', home: 'Miami Dolphins', away: 'New England Patriots', time: 'Mon 8:15 PM', started: false },
  ],
  cfb: [
    { id: 'g1', home: 'Georgia Bulldogs', away: 'Notre Dame', time: 'Sat 12:00 PM', started: false },
    { id: 'g2', home: 'Alabama', away: 'Michigan Wolverines', time: 'Sat 12:00 PM', started: false },
    { id: 'g3', home: 'Ohio State', away: 'Texas Longhorns', time: 'Sat 4:00 PM', started: false },
    { id: 'g4', home: 'Penn State', away: 'Oregon Ducks', time: 'Sat 4:00 PM', started: false },
    { id: 'g5', home: 'Clemson Tigers', away: 'LSU Tigers', time: 'Sat 8:00 PM', started: false },
    { id: 'g6', home: 'Florida State', away: 'Oklahoma Sooners', time: 'Sat 8:00 PM', started: false },
  ],
  cbb: [
    { id: 'g1', home: 'Duke Blue Devils', away: 'UNC Tar Heels', time: 'Sat 12:00 PM', started: false },
    { id: 'g2', home: 'Kansas Jayhawks', away: 'Kentucky Wildcats', time: 'Sat 2:00 PM', started: false },
    { id: 'g3', home: 'Gonzaga Bulldogs', away: 'UCLA Bruins', time: 'Sat 4:00 PM', started: false },
    { id: 'g4', home: 'Michigan State', away: 'Indiana Hoosiers', time: 'Sat 4:00 PM', started: false },
    { id: 'g5', home: 'Marquette', away: 'Villanova Wildcats', time: 'Sat 6:00 PM', started: false },
    { id: 'g6', home: 'Houston Cougars', away: 'Memphis Tigers', time: 'Sat 8:00 PM', started: false },
  ],
  nba: [
    { id: 'g1', home: 'Boston Celtics', away: 'Golden State Warriors', time: 'Tue 7:30 PM', started: false },
    { id: 'g2', home: 'LA Lakers', away: 'Milwaukee Bucks', time: 'Tue 10:00 PM', started: false },
    { id: 'g3', home: 'Denver Nuggets', away: 'Miami Heat', time: 'Wed 7:00 PM', started: false },
    { id: 'g4', home: 'Phoenix Suns', away: 'Dallas Mavericks', time: 'Wed 9:00 PM', started: false },
    { id: 'g5', home: 'Philadelphia 76ers', away: 'New York Knicks', time: 'Thu 7:30 PM', started: false },
    { id: 'g6', home: 'OKC Thunder', away: 'Minnesota Timberwolves', time: 'Thu 9:30 PM', started: false },
  ],
  mlb: [
    { id: 'g1', home: 'New York Yankees', away: 'Houston Astros', time: 'Sat 1:05 PM', started: false },
    { id: 'g2', home: 'Los Angeles Dodgers', away: 'Atlanta Braves', time: 'Sat 4:08 PM', started: false },
    { id: 'g3', home: 'Philadelphia Phillies', away: 'San Diego Padres', time: 'Sat 7:08 PM', started: false },
    { id: 'g4', home: 'Cleveland Guardians', away: 'Detroit Tigers', time: 'Sat 7:08 PM', started: false },
    { id: 'g5', home: 'Baltimore Orioles', away: 'Kansas City Royals', time: 'Sun 1:05 PM', started: false },
    { id: 'g6', home: 'Milwaukee Brewers', away: 'Arizona Diamondbacks', time: 'Sun 4:08 PM', started: false },
  ],
  nhl: [
    { id: 'g1', home: 'Boston Bruins', away: 'Tampa Bay Lightning', time: 'Fri 7:00 PM', started: false },
    { id: 'g2', home: 'Colorado Avalanche', away: 'Vegas Golden Knights', time: 'Fri 9:30 PM', started: false },
    { id: 'g3', home: 'New York Rangers', away: 'Pittsburgh Penguins', time: 'Sat 7:00 PM', started: false },
    { id: 'g4', home: 'Toronto Maple Leafs', away: 'Montreal Canadiens', time: 'Sat 7:00 PM', started: false },
    { id: 'g5', home: 'Edmonton Oilers', away: 'Calgary Flames', time: 'Sat 10:00 PM', started: false },
    { id: 'g6', home: 'Carolina Hurricanes', away: 'Florida Panthers', time: 'Sun 5:00 PM', started: false },
  ],
}

const ODDS = {
  nfl: {
    g1: { 'ml-fav': { team: 'Buffalo Bills', odds: '-165' }, 'ml-dog': { team: 'Kansas City Chiefs', odds: '+140' }, 'sp-fav': { team: 'Bills -3', odds: '-110' }, 'sp-dog': { team: 'Chiefs +3', odds: '-110' }, 'tot-ov': { team: 'Over 47.5', odds: '-110' }, 'tot-un': { team: 'Under 47.5', odds: '-110' } },
    g2: { 'ml-fav': { team: 'Pittsburgh Steelers', odds: '-125' }, 'ml-dog': { team: 'Houston Texans', odds: '+105' }, 'sp-fav': { team: 'Steelers -2.5', odds: '-110' }, 'sp-dog': { team: 'Texans +2.5', odds: '-110' }, 'tot-ov': { team: 'Over 41.5', odds: '-110' }, 'tot-un': { team: 'Under 41.5', odds: '-110' } },
    g3: { 'ml-fav': { team: 'Philadelphia Eagles', odds: '-280' }, 'ml-dog': { team: 'Dallas Cowboys', odds: '+230' }, 'sp-fav': { team: 'Eagles -6.5', odds: '-110' }, 'sp-dog': { team: 'Cowboys +6.5', odds: '-110' }, 'tot-ov': { team: 'Over 44.5', odds: '-108' }, 'tot-un': { team: 'Under 44.5', odds: '-112' } },
    g4: { 'ml-fav': { team: 'LA Chargers', odds: '-155' }, 'ml-dog': { team: 'Denver Broncos', odds: '+130' }, 'sp-fav': { team: 'Chargers -3.5', odds: '-110' }, 'sp-dog': { team: 'Broncos +3.5', odds: '-110' }, 'tot-ov': { team: 'Over 37.5', odds: '-110' }, 'tot-un': { team: 'Under 37.5', odds: '-110' } },
    g5: { 'ml-fav': { team: 'San Francisco 49ers', odds: '-190' }, 'ml-dog': { team: 'Seattle Seahawks', odds: '+160' }, 'sp-fav': { team: '49ers -4.5', odds: '-110' }, 'sp-dog': { team: 'Seahawks +4.5', odds: '-110' }, 'tot-ov': { team: 'Over 46.5', odds: '-112' }, 'tot-un': { team: 'Under 46.5', odds: '-108' } },
    g6: { 'ml-fav': { team: 'Washington Commanders', odds: '-145' }, 'ml-dog': { team: 'New York Giants', odds: '+122' }, 'sp-fav': { team: 'Washington -3', odds: '-110' }, 'sp-dog': { team: 'Giants +3', odds: '-110' }, 'tot-ov': { team: 'Over 38.5', odds: '-110' }, 'tot-un': { team: 'Under 38.5', odds: '-110' } },
    g7: { 'ml-fav': { team: 'Baltimore Ravens', odds: '-220' }, 'ml-dog': { team: 'LA Rams', odds: '+182' }, 'sp-fav': { team: 'Ravens -5', odds: '-110' }, 'sp-dog': { team: 'Rams +5', odds: '-110' }, 'tot-ov': { team: 'Over 48.5', odds: '-110' }, 'tot-un': { team: 'Under 48.5', odds: '-110' } },
    g8: { 'ml-fav': { team: 'Miami Dolphins', odds: '-135' }, 'ml-dog': { team: 'New England Patriots', odds: '+114' }, 'sp-fav': { team: 'Dolphins -2.5', odds: '-110' }, 'sp-dog': { team: 'Patriots +2.5', odds: '-110' }, 'tot-ov': { team: 'Over 39.5', odds: '-115' }, 'tot-un': { team: 'Under 39.5', odds: '-105' } },
  },
  cfb: {
    g1: { 'ml-fav': { team: 'Georgia Bulldogs', odds: '-200' }, 'ml-dog': { team: 'Notre Dame', odds: '+170' }, 'sp-fav': { team: 'Georgia -4.5', odds: '-110' }, 'sp-dog': { team: 'Notre Dame +4.5', odds: '-110' }, 'tot-ov': { team: 'Over 52.5', odds: '-110' }, 'tot-un': { team: 'Under 52.5', odds: '-110' } },
    g2: { 'ml-fav': { team: 'Alabama', odds: '-175' }, 'ml-dog': { team: 'Michigan', odds: '+148' }, 'sp-fav': { team: 'Alabama -3.5', odds: '-110' }, 'sp-dog': { team: 'Michigan +3.5', odds: '-110' }, 'tot-ov': { team: 'Over 49.5', odds: '-110' }, 'tot-un': { team: 'Under 49.5', odds: '-110' } },
    g3: { 'ml-fav': { team: 'Ohio State', odds: '-140' }, 'ml-dog': { team: 'Texas', odds: '+118' }, 'sp-fav': { team: 'Ohio State -3', odds: '-110' }, 'sp-dog': { team: 'Texas +3', odds: '-110' }, 'tot-ov': { team: 'Over 55.5', odds: '-108' }, 'tot-un': { team: 'Under 55.5', odds: '-112' } },
    g4: { 'ml-fav': { team: 'Oregon', odds: '-165' }, 'ml-dog': { team: 'Penn State', odds: '+140' }, 'sp-fav': { team: 'Oregon -3.5', odds: '-110' }, 'sp-dog': { team: 'Penn State +3.5', odds: '-110' }, 'tot-ov': { team: 'Over 47.5', odds: '-110' }, 'tot-un': { team: 'Under 47.5', odds: '-110' } },
    g5: { 'ml-fav': { team: 'LSU Tigers', odds: '-125' }, 'ml-dog': { team: 'Clemson', odds: '+105' }, 'sp-fav': { team: 'LSU -2.5', odds: '-110' }, 'sp-dog': { team: 'Clemson +2.5', odds: '-110' }, 'tot-ov': { team: 'Over 51.5', odds: '-110' }, 'tot-un': { team: 'Under 51.5', odds: '-110' } },
    g6: { 'ml-fav': { team: 'Oklahoma', odds: '-145' }, 'ml-dog': { team: 'Florida State', odds: '+122' }, 'sp-fav': { team: 'Oklahoma -3', odds: '-110' }, 'sp-dog': { team: 'Florida State +3', odds: '-110' }, 'tot-ov': { team: 'Over 53.5', odds: '-110' }, 'tot-un': { team: 'Under 53.5', odds: '-110' } },
  },
  cbb: {
    g1: { 'ml-fav': { team: 'Duke Blue Devils', odds: '-180' }, 'ml-dog': { team: 'UNC Tar Heels', odds: '+152' }, 'sp-fav': { team: 'Duke -4.5', odds: '-110' }, 'sp-dog': { team: 'UNC +4.5', odds: '-110' }, 'tot-ov': { team: 'Over 148.5', odds: '-110' }, 'tot-un': { team: 'Under 148.5', odds: '-110' } },
    g2: { 'ml-fav': { team: 'Kansas', odds: '-155' }, 'ml-dog': { team: 'Kentucky', odds: '+130' }, 'sp-fav': { team: 'Kansas -3.5', odds: '-110' }, 'sp-dog': { team: 'Kentucky +3.5', odds: '-110' }, 'tot-ov': { team: 'Over 152.5', odds: '-110' }, 'tot-un': { team: 'Under 152.5', odds: '-110' } },
    g3: { 'ml-fav': { team: 'Gonzaga', odds: '-200' }, 'ml-dog': { team: 'UCLA', odds: '+168' }, 'sp-fav': { team: 'Gonzaga -5', odds: '-110' }, 'sp-dog': { team: 'UCLA +5', odds: '-110' }, 'tot-ov': { team: 'Over 155.5', odds: '-108' }, 'tot-un': { team: 'Under 155.5', odds: '-112' } },
    g4: { 'ml-fav': { team: 'Michigan State', odds: '-130' }, 'ml-dog': { team: 'Indiana', odds: '+110' }, 'sp-fav': { team: 'Michigan State -2.5', odds: '-110' }, 'sp-dog': { team: 'Indiana +2.5', odds: '-110' }, 'tot-ov': { team: 'Over 144.5', odds: '-110' }, 'tot-un': { team: 'Under 144.5', odds: '-110' } },
    g5: { 'ml-fav': { team: 'Marquette', odds: '-145' }, 'ml-dog': { team: 'Villanova', odds: '+122' }, 'sp-fav': { team: 'Marquette -3', odds: '-110' }, 'sp-dog': { team: 'Villanova +3', odds: '-110' }, 'tot-ov': { team: 'Over 146.5', odds: '-110' }, 'tot-un': { team: 'Under 146.5', odds: '-110' } },
    g6: { 'ml-fav': { team: 'Houston', odds: '-160' }, 'ml-dog': { team: 'Memphis', odds: '+135' }, 'sp-fav': { team: 'Houston -3.5', odds: '-110' }, 'sp-dog': { team: 'Memphis +3.5', odds: '-110' }, 'tot-ov': { team: 'Over 138.5', odds: '-110' }, 'tot-un': { team: 'Under 138.5', odds: '-110' } },
  },
  nba: {
    g1: { 'ml-fav': { team: 'Boston Celtics', odds: '-175' }, 'ml-dog': { team: 'Golden State', odds: '+148' }, 'sp-fav': { team: 'Celtics -4', odds: '-110' }, 'sp-dog': { team: 'Warriors +4', odds: '-110' }, 'tot-ov': { team: 'Over 224.5', odds: '-110' }, 'tot-un': { team: 'Under 224.5', odds: '-110' } },
    g2: { 'ml-fav': { team: 'Milwaukee Bucks', odds: '-130' }, 'ml-dog': { team: 'LA Lakers', odds: '+110' }, 'sp-fav': { team: 'Bucks -2.5', odds: '-110' }, 'sp-dog': { team: 'Lakers +2.5', odds: '-110' }, 'tot-ov': { team: 'Over 228.5', odds: '-110' }, 'tot-un': { team: 'Under 228.5', odds: '-110' } },
    g3: { 'ml-fav': { team: 'Denver Nuggets', odds: '-165' }, 'ml-dog': { team: 'Miami Heat', odds: '+140' }, 'sp-fav': { team: 'Nuggets -3.5', odds: '-110' }, 'sp-dog': { team: 'Heat +3.5', odds: '-110' }, 'tot-ov': { team: 'Over 220.5', odds: '-110' }, 'tot-un': { team: 'Under 220.5', odds: '-110' } },
    g4: { 'ml-fav': { team: 'Dallas Mavericks', odds: '-140' }, 'ml-dog': { team: 'Phoenix Suns', odds: '+118' }, 'sp-fav': { team: 'Mavericks -3', odds: '-110' }, 'sp-dog': { team: 'Suns +3', odds: '-110' }, 'tot-ov': { team: 'Over 232.5', odds: '-108' }, 'tot-un': { team: 'Under 232.5', odds: '-112' } },
    g5: { 'ml-fav': { team: 'New York Knicks', odds: '-120' }, 'ml-dog': { team: 'Philadelphia 76ers', odds: '+100' }, 'sp-fav': { team: 'Knicks -2', odds: '-110' }, 'sp-dog': { team: '76ers +2', odds: '-110' }, 'tot-ov': { team: 'Over 218.5', odds: '-110' }, 'tot-un': { team: 'Under 218.5', odds: '-110' } },
    g6: { 'ml-fav': { team: 'OKC Thunder', odds: '-190' }, 'ml-dog': { team: 'Minnesota', odds: '+160' }, 'sp-fav': { team: 'OKC -4.5', odds: '-110' }, 'sp-dog': { team: 'Wolves +4.5', odds: '-110' }, 'tot-ov': { team: 'Over 222.5', odds: '-110' }, 'tot-un': { team: 'Under 222.5', odds: '-110' } },
  },
  mlb: {
    g1: { 'ml-fav': { team: 'New York Yankees', odds: '-145' }, 'ml-dog': { team: 'Houston Astros', odds: '+122' }, 'sp-fav': { team: 'Yankees -1.5', odds: '+115' }, 'sp-dog': { team: 'Astros +1.5', odds: '-135' }, 'tot-ov': { team: 'Over 8.5', odds: '-110' }, 'tot-un': { team: 'Under 8.5', odds: '-110' } },
    g2: { 'ml-fav': { team: 'Los Angeles Dodgers', odds: '-170' }, 'ml-dog': { team: 'Atlanta Braves', odds: '+144' }, 'sp-fav': { team: 'Dodgers -1.5', odds: '+105' }, 'sp-dog': { team: 'Braves +1.5', odds: '-125' }, 'tot-ov': { team: 'Over 9.0', odds: '-110' }, 'tot-un': { team: 'Under 9.0', odds: '-110' } },
    g3: { 'ml-fav': { team: 'San Diego Padres', odds: '-130' }, 'ml-dog': { team: 'Philadelphia Phillies', odds: '+110' }, 'sp-fav': { team: 'Padres -1.5', odds: '+120' }, 'sp-dog': { team: 'Phillies +1.5', odds: '-140' }, 'tot-ov': { team: 'Over 8.0', odds: '-110' }, 'tot-un': { team: 'Under 8.0', odds: '-110' } },
    g4: { 'ml-fav': { team: 'Cleveland Guardians', odds: '-125' }, 'ml-dog': { team: 'Detroit Tigers', odds: '+105' }, 'sp-fav': { team: 'Guardians -1.5', odds: '+125' }, 'sp-dog': { team: 'Tigers +1.5', odds: '-145' }, 'tot-ov': { team: 'Over 7.5', odds: '-112' }, 'tot-un': { team: 'Under 7.5', odds: '-108' } },
    g5: { 'ml-fav': { team: 'Baltimore Orioles', odds: '-140' }, 'ml-dog': { team: 'Kansas City Royals', odds: '+118' }, 'sp-fav': { team: 'Orioles -1.5', odds: '+110' }, 'sp-dog': { team: 'Royals +1.5', odds: '-130' }, 'tot-ov': { team: 'Over 8.5', odds: '-110' }, 'tot-un': { team: 'Under 8.5', odds: '-110' } },
    g6: { 'ml-fav': { team: 'Arizona Diamondbacks', odds: '-155' }, 'ml-dog': { team: 'Milwaukee Brewers', odds: '+130' }, 'sp-fav': { team: 'Arizona -1.5', odds: '+100' }, 'sp-dog': { team: 'Milwaukee +1.5', odds: '-120' }, 'tot-ov': { team: 'Over 9.0', odds: '-110' }, 'tot-un': { team: 'Under 9.0', odds: '-110' } },
  },
  nhl: {
    g1: { 'ml-fav': { team: 'Boston Bruins', odds: '-155' }, 'ml-dog': { team: 'Tampa Bay Lightning', odds: '+130' }, 'sp-fav': { team: 'Bruins -1.5', odds: '+130' }, 'sp-dog': { team: 'Lightning +1.5', odds: '-155' }, 'tot-ov': { team: 'Over 6.5', odds: '-115' }, 'tot-un': { team: 'Under 6.5', odds: '-105' } },
    g2: { 'ml-fav': { team: 'Colorado Avalanche', odds: '-130' }, 'ml-dog': { team: 'Vegas Golden Knights', odds: '+110' }, 'sp-fav': { team: 'Avs -1.5', odds: '+150' }, 'sp-dog': { team: 'Vegas +1.5', odds: '-175' }, 'tot-ov': { team: 'Over 6.0', odds: '-110' }, 'tot-un': { team: 'Under 6.0', odds: '-110' } },
    g3: { 'ml-fav': { team: 'New York Rangers', odds: '-170' }, 'ml-dog': { team: 'Pittsburgh Penguins', odds: '+144' }, 'sp-fav': { team: 'Rangers -1.5', odds: '+115' }, 'sp-dog': { team: 'Penguins +1.5', odds: '-135' }, 'tot-ov': { team: 'Over 6.5', odds: '-110' }, 'tot-un': { team: 'Under 6.5', odds: '-110' } },
    g4: { 'ml-fav': { team: 'Toronto Maple Leafs', odds: '-145' }, 'ml-dog': { team: 'Montreal Canadiens', odds: '+122' }, 'sp-fav': { team: 'Toronto -1.5', odds: '+125' }, 'sp-dog': { team: 'Montreal +1.5', odds: '-148' }, 'tot-ov': { team: 'Over 6.0', odds: '-108' }, 'tot-un': { team: 'Under 6.0', odds: '-112' } },
    g5: { 'ml-fav': { team: 'Edmonton Oilers', odds: '-120' }, 'ml-dog': { team: 'Calgary Flames', odds: '+100' }, 'sp-fav': { team: 'Edmonton -1.5', odds: '+155' }, 'sp-dog': { team: 'Calgary +1.5', odds: '-180' }, 'tot-ov': { team: 'Over 6.5', odds: '-110' }, 'tot-un': { team: 'Under 6.5', odds: '-110' } },
    g6: { 'ml-fav': { team: 'Florida Panthers', odds: '-160' }, 'ml-dog': { team: 'Carolina Hurricanes', odds: '+135' }, 'sp-fav': { team: 'Florida -1.5', odds: '+110' }, 'sp-dog': { team: 'Carolina +1.5', odds: '-130' }, 'tot-ov': { team: 'Over 6.0', odds: '-110' }, 'tot-un': { team: 'Under 6.0', odds: '-110' } },
  },
}

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
        pickMap[p.category] = { gameId: p.game_id, team: p.team, lockedOdds: p.locked_odds }
        unitMap[p.category] = p.units
      })
      setPicks(pickMap)
      setUnits(unitMap)
    }
  }

  async function savePick(catId, gameId, team, lockedOdds) {
    if (!activePoolEntry) return
    const { data: existingData } = await supabase.from('picks').select('id').eq('pool_entry_id', activePoolEntry.id).eq('category', catId)
    const existing = existingData?.[0] || null
    if (existing) {
      await supabase.from('picks').update({ game_id: gameId, team, locked_odds: lockedOdds, units: units[catId], updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('picks').insert({ user_id: session.user.id, pool_entry_id: activePoolEntry.id, category: catId, game_id: gameId, team, locked_odds: lockedOdds, units: units[catId] })
    }
    setPicks(prev => ({ ...prev, [catId]: { gameId, team, lockedOdds } }))
    setOpenModal(null)
  }

  function increment(catId) {
    const current = units[catId]
    if (totalUnits >= 100) return
    if (current >= 40) return
    setUnits(prev => ({ ...prev, [catId]: prev[catId] + 1 }))
  }

  function decrement(catId) {
    const current = units[catId]
    if (current <= 1) return
    setUnits(prev => ({ ...prev, [catId]: prev[catId] - 1 }))
  }

  function setUnitVal(catId, val) {
    const newVal = Math.max(1, Math.min(40, parseInt(val) || 1))
    const otherTotal = totalUnits - units[catId]
    const capped = Math.min(newVal, 100 - otherTotal)
    setUnits(prev => ({ ...prev, [catId]: capped }))
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
          const canIncrease = !locked && totalUnits < 100 && catUnits < 70

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
                    <div style={s.pickMeta}>{game ? `${game.away} @ ${game.home}` : ''}</div>
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
                    max="70"
                    value={catUnits}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => { e.stopPropagation(); if (['ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault() }}
                    onChange={e => { e.stopPropagation(); !locked && setUnitVal(cat.id, e.target.value) }}
                 />
                  <div style={s.unitLabel}>units</div>
                </div>
                <button
                  style={{ ...s.unitBtn, opacity: canIncrease ? 1 : 0.4 }}
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
                    onClick={() => !game.started && savePick(openModal, game.id, gameOdds.team, gameOdds.odds)}>
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