// Vercel serverless proxy for API-Football.
// Forwards /api/football/<anything> -> https://v3.football.api-sports.io/<anything>,
// injecting the secret key server-side. Set APIFOOTBALL_KEY in your Vercel project's
// Environment Variables. Mirrors the dev proxy in vite.config.js so the client calls
// the same /api/football/... path in both dev and production.
export default async function handler(req, res) {
  const key = process.env.APIFOOTBALL_KEY
  if (!key) return res.status(500).json({ error: 'APIFOOTBALL_KEY is not configured' })

  const upstream = 'https://v3.football.api-sports.io' + req.url.replace(/^\/api\/football/, '')
  try {
    const r = await fetch(upstream, { headers: { 'x-apisports-key': key } })
    const body = await r.text()
    res.status(r.status)
    res.setHeader('content-type', r.headers.get('content-type') || 'application/json')
    // Cache successful lookups at the edge for a day to conserve the daily quota.
    if (r.ok) res.setHeader('cache-control', 's-maxage=86400, stale-while-revalidate')
    return res.send(body)
  } catch {
    return res.status(502).json({ error: 'Upstream request failed' })
  }
}
