import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const SPORT_LABELS = {
  nfl: 'NFL', cfb: 'CFB', cbb: 'CBB', nba: 'NBA', mlb: 'MLB', nhl: 'NHL',
}

// Only active sports — update this as seasons change
const ACTIVE_SPORTS = ['cbb', 'nba']

// Module-level client cache so switching tabs doesn't re-query Supabase
const clientCache = {}

function parseOddsData(rawGames, sportId) {
  const games = []
  const odds = {}

  rawGames.forEach(game => {
    const commenced = new Date(game.commence_time)
    const started = Date.now() >= new Date(game.commence_time).getTime()

    games.push({
      id: game.id,
      home: game.home_team,
      away: game.away_team,
      sport: sportId,
      sportLabel: SPORT_LABELS[sportId] || sportId.toUpperCase(),
      time: commenced.toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit'
      }),
      started,
      commence_time: game.commence_time,
    })

    const gameOdds = {}
    const bookmaker = game.bookmakers?.[0]
    if (!bookmaker) return

    bookmaker.markets.forEach(market => {
      if (market.key === 'h2h') {
        const sorted = [...market.outcomes].sort((a, b) => a.price - b.price)
        const fav = sorted[0]
        const dog = sorted[sorted.length - 1]
        gameOdds['ml-fav'] = { team: fav.name, odds: fav.price > 0 ? `+${fav.price}` : `${fav.price}` }
        gameOdds['ml-dog'] = { team: dog.name, odds: dog.price > 0 ? `+${dog.price}` : `${dog.price}` }
      }
      if (market.key === 'spreads') {
        const sorted = [...market.outcomes].sort((a, b) => a.point - b.point)
        const fav = sorted[0]
        const dog = sorted[sorted.length - 1]
        gameOdds['sp-fav'] = { team: `${fav.name} ${fav.point}`, odds: fav.price > 0 ? `+${fav.price}` : `${fav.price}` }
        gameOdds['sp-dog'] = { team: `${dog.name} +${dog.point}`, odds: dog.price > 0 ? `+${dog.price}` : `${dog.price}` }
      }
      if (market.key === 'totals') {
        const over = market.outcomes.find(o => o.name === 'Over')
        const under = market.outcomes.find(o => o.name === 'Under')
        if (over) gameOdds['tot-ov'] = { team: `Over ${over.point}`, odds: over.price > 0 ? `+${over.price}` : `${over.price}` }
        if (under) gameOdds['tot-un'] = { team: `Under ${under.point}`, odds: under.price > 0 ? `+${under.price}` : `${under.price}` }
      }
    })

    odds[game.id] = gameOdds
  })

  return { games, odds }
}

async function fetchFromCache(sport) {
  // Return client-side cache if available (persists for the session)
  if (clientCache[sport]) return clientCache[sport]

  const { data, error } = await supabase
    .from('odds_cache')
    .select('data')
    .eq('sport', sport)
    .single()

  if (error || !data?.data) return null

  const parsed = parseOddsData(data.data, sport)
  clientCache[sport] = parsed
  return parsed
}

export function useOdds(activeSport) {
  const [games, setGames] = useState([])
  const [odds, setOdds] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadOdds() {
      setLoading(true)
      setError(null)

      try {
        if (activeSport === 'multi') {
          // Only fetch active sports, not all 6
          const results = await Promise.all(
            ACTIVE_SPORTS.map(sport => fetchFromCache(sport))
          )

          const allGames = []
          const allOdds = {}

          results.forEach(result => {
            if (result) {
              allGames.push(...result.games)
              Object.assign(allOdds, result.odds)
            }
          })

          allGames.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time))
          setGames(allGames)
          setOdds(allOdds)
        } else {
          // Inactive sport — don't even query
          if (!ACTIVE_SPORTS.includes(activeSport)) {
            setGames([])
            setOdds({})
            setLoading(false)
            return
          }

          const result = await fetchFromCache(activeSport)
          if (!result) {
            setGames([])
            setOdds({})
          } else {
            setGames(result.games)
            setOdds(result.odds)
          }
        }
      } catch (err) {
        setError('Failed to load odds')
      }

      setLoading(false)
    }

    loadOdds()
  }, [activeSport])

  return { games, odds, loading, error }
}