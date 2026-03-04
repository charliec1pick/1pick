import { useState, useEffect } from 'react'

function parseOddsData(rawGames) {
  const games = []
  const odds = {}

  rawGames.forEach(game => {
    const commenced = new Date(game.commence_time)
    const now = new Date()
    const started = now >= commenced

    games.push({
      id: game.id,
      home: game.home_team,
      away: game.away_team,
      time: commenced.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
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

export function useOdds(activeSport) {
  const [games, setGames] = useState([])
  const [odds, setOdds] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchOdds() {
      setLoading(true)
      setError(null)
      try {
        const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : ''
        const res = await fetch(`${baseUrl}/api/odds?sport=${activeSport}`)
        const data = await res.json()
        if (!Array.isArray(data) || data.length === 0) {
          setGames([])
          setOdds({})
        } else {
          const parsed = parseOddsData(data)
          setGames(parsed.games)
          setOdds(parsed.odds)
        }
      } catch (err) {
        setError('Failed to load odds')
      }
      setLoading(false)
    }
    fetchOdds()
  }, [activeSport])

  return { games, odds, loading, error }
}
