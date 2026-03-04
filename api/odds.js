export default async function handler(req, res) {
  const { sport } = req.query
  
  const sportMap = {
    cbb: 'basketball_ncaab',
    nba: 'basketball_nba',
    nfl: 'americanfootball_nfl',
    cfb: 'americanfootball_ncaaf',
    mlb: 'baseball_mlb',
    nhl: 'icehockey_nhl',
  }

  const sportKey = sportMap[sport]
  if (!sportKey) return res.status(400).json({ error: 'Invalid sport' })

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
    )
    const data = await response.json()
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch odds' })
  }
}