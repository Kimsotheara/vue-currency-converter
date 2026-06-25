import { ref, computed, onUnmounted } from 'vue'
import { leagues } from './leagues'
import { useI18n } from '@/i18n'

const API = 'https://site.api.espn.com/apis/site/v2/sports/soccer'
const POLL_MS = 30_000 // refresh cadence while a match is live

const fetchJson = async (url, ms = 9000) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const TZ = 'Asia/Ho_Chi_Minh' // Hanoi (UTC+7) — group/display matches in this zone

const ymd = (d) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}${m}${day}`
}

// YYYYMMDD for the calendar day a date falls on in Hanoi time.
const hanoiYmd = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ }).replace(/-/g, '')

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const team = (c) => ({
  id: c?.team?.id,
  name: c?.team?.displayName || c?.team?.name || 'TBD',
  short: c?.team?.shortDisplayName || c?.team?.abbreviation || '',
  logo: c?.team?.logo || '',
  score: c?.score ?? '',
  winner: !!c?.winner,
})

const normalize = (ev) => {
  const c = ev.competitions?.[0] || {}
  const comps = c.competitors || []
  const home = comps.find((t) => t.homeAway === 'home') || comps[0]
  const away = comps.find((t) => t.homeAway === 'away') || comps[1]
  const st = ev.status?.type || {}

  const scorers = (c.details || [])
    .filter((d) => d.scoringPlay)
    .map((d) => ({
      side: d.team?.id === home?.team?.id ? 'home' : 'away',
      name: d.athletesInvolved?.[0]?.displayName || 'Goal',
      clock: (d.clock?.displayValue || '').replace(/'$/, ''),
      own: /own goal/i.test(d.type?.text || ''),
      pen: /penalty/i.test(d.type?.text || ''),
    }))

  return {
    id: ev.id,
    date: ev.date,
    state: st.state,                       // 'pre' | 'in' | 'post'
    live: st.state === 'in',
    completed: st.state === 'post',
    detail: st.shortDetail || st.detail || '',
    home: team(home),
    away: team(away),
    homeScorers: scorers.filter((s) => s.side === 'home'),
    awayScorers: scorers.filter((s) => s.side === 'away'),
    venue: c.venue?.fullName || '',
    round: ev.season?.slug || c.notes?.[0]?.headline || '',
  }
}

// Group a position abbreviation (e.g. 'CD-L', 'AM-R', 'RB') into a pitch line.
const groupOf = (abbr = '') => {
  const a = abbr.toUpperCase().replace(/-.*$/, '') // 'CD-L' -> 'CD'
  if (a === 'G' || a === 'GK') return 'GK'
  if (['LWB', 'RWB', 'LB', 'RB', 'CB', 'CD', 'D', 'SW', 'RCB', 'LCB'].includes(a)) return 'DEF'
  if (['F', 'ST', 'CF', 'LW', 'RW', 'SS', 'W'].includes(a)) return 'FWD'
  return 'MID'
}

const parseStats = (stats) => Object.fromEntries((stats || []).map((x) => [x.name, x.value || 0]))

// ESPN gives no official rating, so derive an estimate from per-player match stats.
// `played` (starter, or a sub who came on) decides whether to show a rating at all —
// so every participant gets one even when ESPN's per-player stats are sparse.
const computeRating = (s, played) => {
  if (!played) return null
  const v = (k) => s[k] || 0 // missing stats default to 0 (never NaN)
  let r = 6.5
  r += v('totalGoals') * 1.2
  r += v('goalAssists') * 0.8
  r += v('shotsOnTarget') * 0.12
  r += v('saves') * 0.18
  r += v('foulsSuffered') * 0.03
  r -= v('goalsConceded') * 0.25
  r -= v('foulsCommitted') * 0.05
  r -= v('yellowCards') * 0.4
  r -= v('redCards') * 1.5
  r -= v('ownGoals') * 1.2
  return Math.round(Math.max(4, Math.min(10, r)) * 10) / 10
}

const mapPlayer = (p, played) => {
  const s = parseStats(p.stats)
  return {
    num: p.jersey || '',
    name: p.athlete?.displayName || '',
    shortName: p.athlete?.shortName || '', // e.g. "R. Schmid"
    pos: p.position?.abbreviation || '',
    posName: p.position?.displayName || p.position?.name || '',
    group: groupOf(p.position?.abbreviation),
    shirt: p.athlete?.jerseyImages?.[0]?.href || '', // ESPN kit image (number on shirt)
    rating: computeRating(s, played),
    events: {
      goals: s.totalGoals || 0,
      assists: s.goalAssists || 0,
      yellow: s.yellowCards || 0,
      red: s.redCards || 0,
      ownGoals: s.ownGoals || 0,
      subIn: p.subbedIn === true,
      subOut: p.subbedOut === true,
    },
  }
}

const buildLines = (starters) => ({
  GK: starters.filter((p) => p.group === 'GK'),
  DEF: starters.filter((p) => p.group === 'DEF'),
  MID: starters.filter((p) => p.group === 'MID'),
  FWD: starters.filter((p) => p.group === 'FWD'),
})

const normalizeLineup = (t) => {
  const roster = t.roster || []
  const starters = roster.filter((p) => p.starter).map((p) => mapPlayer(p, true))
  return {
    name: t.team?.displayName || '',
    logo: t.team?.logo || '',
    homeAway: t.homeAway,
    formation: t.formation || '',
    starters,
    // subs are rated only if they actually came on
    subs: roster.filter((p) => !p.starter).map((p) => mapPlayer(p, p.subbedIn === true)),
    lines: buildLines(starters),
  }
}

// Normalize a name for cross-source matching (accent-insensitive, lowercased).
const normName = (s = '') =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

// Real player ratings from API-Football (via the proxy). Maps the ESPN match to
// an API-Football fixture by date + team names, then reads each player's rating.
// Returns { normalizedName: rating } or null (no key / no match / unavailable).
let afDown = false
const fetchAfRatings = async (event) => {
  if (afDown) return null
  const d = new Date(event.date)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const get = async (path) => {
    let res
    try { res = await fetch(`/api/football${path}`, { signal: AbortSignal.timeout(9000) }) }
    catch { return null }
    if ([401, 403, 404, 499].includes(res.status)) { afDown = true; return null }
    return res.ok ? res.json() : null
  }
  const fixturesData = await get(`/fixtures?date=${date}`)
  if (!fixturesData) return null
  const h = normName(event.home.name), a = normName(event.away.name)
  const hit = (af, espn) => { const x = normName(af); return !!x && (x === espn || x.includes(espn) || espn.includes(x)) }
  const fx = (fixturesData.response || []).find(
    (f) => hit(f.teams?.home?.name, h) && hit(f.teams?.away?.name, a),
  )
  if (!fx) return null
  const playersData = await get(`/fixtures/players?fixture=${fx.fixture.id}`)
  if (!playersData) return null
  const map = {}
  for (const t of playersData.response || [])
    for (const p of t.players || []) {
      const r = p.statistics?.[0]?.games?.rating
      if (r) map[normName(p.player?.name)] = Math.round(Number(r) * 10) / 10
    }
  return Object.keys(map).length ? map : null
}

// Turn bookmaker money-lines into normalized win/draw/win percentages.
// Implied prob: +odds -> 100/(o+100); -odds -> |o|/(|o|+100). Normalize to strip the vig.
const computePrediction = (data) => {
  const book = data.pickcenter?.[0] || data.odds?.[0]
  if (!book) return null
  const ml = (o) => {
    const v = o?.moneyLine ?? o?.moneyline
    return typeof v === 'number' ? v : null
  }
  const h = ml(book.homeTeamOdds), a = ml(book.awayTeamOdds), d = ml(book.drawOdds)
  if (h == null || a == null) return null
  const imp = (m) => (m == null ? 0 : m > 0 ? 100 / (m + 100) : -m / (-m + 100))
  const home = imp(h), away = imp(a), draw = imp(d)
  const sum = home + away + draw
  if (!sum) return null
  const hp = Math.round((home / sum) * 100)
  const dp = Math.round((draw / sum) * 100)
  return { home: hp, draw: dp, away: 100 - hp - dp, provider: book.provider?.name || '' }
}

const scoreNum = (s) =>
  s == null ? null : typeof s === 'object' ? Number(s.displayValue ?? s.value) : Number(s)

// A team's last 10 completed results (newest first) from its season schedule.
const mapForm = (data, teamId) => {
  const done = (data.events || [])
    .filter((e) => e.competitions?.[0]?.status?.type?.completed)
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first
  return done.slice(0, 10).map((e) => {
    const c = e.competitions[0]
    const me = c.competitors.find((t) => t.team?.id === teamId) || c.competitors[0]
    const opp = c.competitors.find((t) => t !== me)
    const my = scoreNum(me?.score), os = scoreNum(opp?.score)
    return {
      date: e.date,
      home: me?.homeAway === 'home',
      score: `${my}-${os}`,
      result: me?.winner ? 'W' : my === os ? 'D' : 'L',
      opp: opp?.team?.abbreviation || opp?.team?.shortDisplayName || '',
      oppName: opp?.team?.displayName || '',
      logo: opp?.team?.logos?.[0]?.href || opp?.team?.logo || '',
      league: c.leagueAbbreviation || '',
    }
  })
}

// Pull "scorer -> assist" pairs out of the natural-language key-event texts,
// e.g. "Goal! … Patrick Dorgu (Manchester United) header … Assisted by Bruno Fernandes …"
const parseAssists = (data) => {
  const out = {}
  for (const k of data.keyEvents || []) {
    const text = k.text || ''
    if (!/Goal!/i.test(text)) continue
    const scorer = text.match(/Goal!.*?\.\s*([^(]+?)\s*\(/)
    const assist = text.match(/Assisted by ([^.,]+?)(?:\s+(?:with|following|after)\b|[.,]|$)/i)
    if (scorer && assist) out[scorer[1].trim().toLowerCase()] = assist[1].trim()
  }
  return out
}

// Recent head-to-head meetings (from the home team's perspective).
const mapH2H = (data) => {
  const block = (data.headToHeadGames || [])[0]
  if (!block?.events?.length) return null
  return {
    subject: block.team?.displayName || '',
    games: block.events.map((e) => ({
      date: e.gameDate,
      score: e.score || `${e.homeTeamScore}-${e.awayTeamScore}`,
      result: e.gameResult || '',
      home: e.atVs !== '@',
      opp: e.opponent?.displayName || e.opponent?.abbreviation || '',
      logo: e.opponentLogo || e.opponent?.logo || '',
      league: e.leagueAbbreviation || e.leagueName || '',
    })),
  }
}

// Team-level match stats (possession %, shots on target) from the boxscore.
// Only present once a match is live/finished; returns null otherwise.
const mapMatchStats = (data, homeId, awayId) => {
  const teams = data.boxscore?.teams || []
  if (!teams.length) return null
  const pick = (id) => teams.find((t) => t.team?.id === id) || null
  const stat = (t, names) => {
    const s = (t?.statistics || []).find((x) => names.includes(x.name))
    return s?.displayValue ?? null
  }
  const read = (id) => {
    const t = pick(id)
    if (!t) return null
    return {
      possession: stat(t, ['possessionPct']),
      shotsOnTarget: stat(t, ['shotsOnTarget', 'onTargetScoringAtt']),
    }
  }
  const home = read(homeId), away = read(awayId)
  if (!home && !away) return null
  // Hide if neither stat has any data on either side.
  const has = (s) => s && (s.possession != null || s.shotsOnTarget != null)
  if (!has(home) && !has(away)) return null
  return { home, away }
}

const STANDINGS_API = 'https://site.api.espn.com/apis/v2/sports/soccer'
const CORE_API = 'https://sports.core.api.espn.com/v2/sports/soccer/leagues'

const statVal = (e, name) => {
  const s = (e.stats || []).find((x) => x.name === name)
  if (!s) return 0
  return s.value != null ? s.value : Number(s.displayValue) || 0
}

const mapStanding = (e) => ({
  rank: statVal(e, 'rank'),
  team: {
    id: e.team?.id,
    name: e.team?.shortDisplayName || e.team?.displayName || '',
    abbr: e.team?.abbreviation || '',
    logo: e.team?.logos?.[0]?.href || '',
  },
  gp: statVal(e, 'gamesPlayed'),
  w: statVal(e, 'wins'),
  d: statVal(e, 'ties'),
  l: statVal(e, 'losses'),
  gf: statVal(e, 'pointsFor'),
  ga: statVal(e, 'pointsAgainst'),
  gd: statVal(e, 'pointDifferential'),
  pts: statVal(e, 'points'),
  // qualification marker (Champions League / relegation …) — ESPN supplies colour + text
  note: e.note ? { color: e.note.color, text: e.note.description } : null,
})

// Standings tables for a league. ESPN's season year N is the "N–N+1" campaign;
// during the off-season the current table is all zeros, so fall back to the most
// recent completed season. Returns { season, groups:[{ name, rows }] } — most
// leagues have one group; cups (World Cup) have several.
const fetchStandings = async (slug) => {
  const base = `${STANDINGS_API}/${slug}/standings`
  const read = (data) => {
    const kids = data.children?.length ? data.children : [{ standings: data.standings }]
    const groups = kids
      .map((c) => ({ name: c.name || '', entries: c.standings?.entries || [] }))
      .filter((g) => g.entries.length)
    const season = kids[0]?.standings?.season ?? data.season?.year
    return { season, groups }
  }
  let { season, groups } = read(await fetchJson(base))
  const empty =
    groups.length && groups.every((g) => g.entries.every((e) => statVal(e, 'gamesPlayed') === 0))
  if (empty && season) {
    const prev = read(await fetchJson(`${base}?season=${season - 1}`))
    if (prev.groups.length) ({ season, groups } = prev)
  }
  return {
    season,
    groups: groups.map((g) => ({
      name: g.name,
      rows: g.entries.map(mapStanding).sort((a, b) => a.rank - b.rank),
    })),
  }
}

// Top scorers (and assists/appearances) for a season. The leaders feed gives goals
// plus `$ref`s for each athlete/team; resolve athlete names in parallel and reuse the
// standings team map for crests so no per-team request is needed.
const fetchScorers = async (slug, season, teamMap = {}) => {
  const data = await fetchJson(`${CORE_API}/${slug}/seasons/${season}/types/1/leaders`)
  const cat = (data.categories || []).find((c) => c.name === 'goalsLeaders')
  if (!cat?.leaders?.length) return []
  const top = cat.leaders.slice(0, 20)
  const athletes = await Promise.all(
    top.map((l) =>
      l.athlete?.$ref
        ? fetchJson(l.athlete.$ref.replace(/^http:/, 'https:')).catch(() => null)
        : null,
    ),
  )
  return top.map((l, i) => {
    const a = athletes[i] || {}
    const tid = l.team?.$ref?.match(/teams\/(\d+)/)?.[1]
    const tm = teamMap[tid]
    const short = l.shortDisplayValue || '' // e.g. "M: 38, G: 22: A: 1"
    return {
      rank: i + 1,
      goals: l.value || 0,
      assists: Number(short.match(/A:\s*(\d+)/)?.[1] ?? 0),
      matches: Number(short.match(/M:\s*(\d+)/)?.[1] ?? 0),
      name: a.displayName || a.fullName || '—',
      pos: a.position?.abbreviation || '',
      flag: a.flag?.href || '',
      team: {
        name: tm?.name || '',
        abbr: tm?.abbr || '',
        logo: tm?.logo || (tid ? `https://a.espncdn.com/i/teamlogos/soccer/500/${tid}.png` : ''),
      },
    }
  })
}

export function useFootballScores() {
  const { t } = useI18n()
  const dark = ref((() => {
    try { return localStorage.getItem('ft-theme') !== 'light' } catch { return true }
  })())
  const toggleTheme = () => {
    dark.value = !dark.value
    try { localStorage.setItem('ft-theme', dark.value ? 'dark' : 'light') } catch {}
  }

  const leagueSlug = ref(leagues[0].slug) // default: FIFA World Cup
  const date = ref(new Date())
  const events = ref([])
  const leagueName = ref('')
  const loading = ref(false)
  const error = ref('')
  const updatedAt = ref(null)

  const summaryCache = ref({})  // eventId -> { lineup: [home,away]|null, prediction }
  const summaryStatus = ref({}) // eventId -> 'loading' | 'error'
  const lineupEvent = ref(null) // the event whose lineup modal is open

  // ----- Table / Top-scorers views (per-league, fetched on demand & cached) -----
  const view = ref('scores') // 'scores' | 'table' | 'scorers'
  const tableCache = {}       // slug -> { season, groups, teamMap }
  const scorerCache = {}      // slug -> rows[]
  const table = ref(null)
  const scorers = ref(null)
  const tableLoading = ref(false)
  const scorersLoading = ref(false)
  const tableError = ref('')
  const scorersError = ref('')

  let timer = null
  let reqId = 0

  const activeLeague = computed(() => leagues.find((l) => l.slug === leagueSlug.value))

  const fetchScores = async ({ silent = false } = {}) => {
    const mine = ++reqId
    if (!silent) {
      loading.value = true
      error.value = ''
    }
    try {
      // ESPN groups games by its own (US) timezone, so a single date can miss
      // matches that fall on the selected day in Hanoi. Fetch a ±1-day window
      // and keep only the games whose Hanoi calendar day matches the selection.
      const prev = new Date(date.value); prev.setDate(prev.getDate() - 1)
      const next = new Date(date.value); next.setDate(next.getDate() + 1)
      const url = `${API}/${leagueSlug.value}/scoreboard?dates=${ymd(prev)}-${ymd(next)}`
      const data = await fetchJson(url)
      if (mine !== reqId) return // a newer request superseded this one
      leagueName.value = data.leagues?.[0]?.name || activeLeague.value?.name || ''
      const wanted = hanoiYmd(date.value)
      events.value = (data.events || [])
        .filter((e) => hanoiYmd(e.date) === wanted)
        .map(normalize)
      updatedAt.value = new Date()
      schedulePoll()
    } catch {
      if (mine === reqId && !silent)
        error.value = t('football.errorSlow')
    } finally {
      if (mine === reqId && !silent) loading.value = false
    }
  }

  const schedulePoll = () => {
    clearInterval(timer)
    // only keep polling while something is actually live
    if (events.value.some((e) => e.live)) {
      timer = setInterval(() => fetchScores({ silent: true }), POLL_MS)
    }
  }

  const ensureSummary = async (event) => {
    const id = event.id
    if (summaryCache.value[id] || summaryStatus.value[id] === 'loading') return
    summaryStatus.value = { ...summaryStatus.value, [id]: 'loading' }
    try {
      const base = `${API}/${leagueSlug.value}`
      const sched = (teamId) =>
        teamId ? fetchJson(`${base}/teams/${teamId}/schedule`).catch(() => null) : null
      const [data, homeSched, awaySched] = await Promise.all([
        fetchJson(`${base}/summary?event=${id}`),
        sched(event.home?.id),
        sched(event.away?.id),
      ])
      const rosters = (data.rosters || [])
        .map(normalizeLineup)
        .sort((a) => (a.homeAway === 'home' ? -1 : 1)) // home first
      // Lineups go live only once an XI is officially confirmed.
      const lineup = rosters.some((r) => r.starters.length) ? rosters : null
      summaryCache.value = {
        ...summaryCache.value,
        [id]: {
          lineup,
          prediction: computePrediction(data),
          stats: mapMatchStats(data, event.home?.id, event.away?.id),
          assists: parseAssists(data),
          h2h: mapH2H(data),
          form: {
            home: homeSched ? mapForm(homeSched, event.home?.id) : [],
            away: awaySched ? mapForm(awaySched, event.away?.id) : [],
          },
        },
      }
      const { [id]: _, ...rest } = summaryStatus.value
      summaryStatus.value = rest
      if (event.completed) enrichRatings(event) // fire-and-forget; updates when ready
    } catch {
      summaryStatus.value = { ...summaryStatus.value, [id]: 'error' }
    }
  }

  // Overlay real API-Football ratings onto the line-up once they arrive.
  const enrichRatings = async (event) => {
    const map = await fetchAfRatings(event)
    if (!map) return
    const entry = summaryCache.value[event.id]
    if (!entry?.lineup) return
    const apply = (p) => {
      const r = map[normName(p.name)]
      return r != null ? { ...p, rating: r, realRating: true } : p
    }
    const lineup = entry.lineup.map((team) => {
      const starters = team.starters.map(apply)
      return { ...team, starters, subs: team.subs.map(apply), lines: buildLines(starters) }
    })
    summaryCache.value = {
      ...summaryCache.value,
      [event.id]: { ...entry, lineup, ratingSource: 'API-Football' },
    }
  }

  const ratingSourceFor = (id) => summaryCache.value[id]?.ratingSource || null

  const ensurePrediction = (event) => { if (event) ensureSummary(event) }
  const predictionFor = (id) => summaryCache.value[id]?.prediction || null
  const statsFor = (id) => summaryCache.value[id]?.stats || null
  const assistsFor = (id) => summaryCache.value[id]?.assists || null
  const h2hFor = (id) => summaryCache.value[id]?.h2h || null
  const formFor = (id) => summaryCache.value[id]?.form || null

  const openLineup = (event) => {
    lineupEvent.value = event
    ensureSummary(event)
  }
  const closeLineup = () => { lineupEvent.value = null }
  const retryLineup = (event) => {
    const { [event.id]: _c, ...c } = summaryCache.value
    const { [event.id]: _s, ...s } = summaryStatus.value
    summaryCache.value = c
    summaryStatus.value = s
    ensureSummary(event)
  }
  const lineupFor = (id) => summaryCache.value[id]?.lineup || null
  const detailsStateFor = (id) => summaryStatus.value[id] || null   // 'loading' | 'error' | null

  const ensureTable = async (slug = leagueSlug.value) => {
    if (tableCache[slug]) { table.value = tableCache[slug]; return tableCache[slug] }
    tableLoading.value = true
    tableError.value = ''
    try {
      const { season, groups } = await fetchStandings(slug)
      if (!groups.length) throw new Error('no standings')
      const teamMap = {}
      for (const g of groups)
        for (const r of g.rows)
          teamMap[r.team.id] = { name: r.team.name, abbr: r.team.abbr, logo: r.team.logo }
      const result = { season, groups, teamMap }
      tableCache[slug] = result
      if (slug === leagueSlug.value) table.value = result // ignore if league switched mid-fetch
      return result
    } catch {
      if (slug === leagueSlug.value) tableError.value = t('football.noStandings')
      return null
    } finally {
      if (slug === leagueSlug.value) tableLoading.value = false
    }
  }

  const ensureScorers = async (slug = leagueSlug.value) => {
    if (scorerCache[slug]) { scorers.value = scorerCache[slug]; return }
    scorersLoading.value = true
    scorersError.value = ''
    try {
      const tbl = await ensureTable(slug)          // reuse season + team crests
      if (!tbl?.season) throw new Error('no season')
      const rows = await fetchScorers(slug, tbl.season, tbl.teamMap)
      if (!rows.length) throw new Error('no scorers')
      scorerCache[slug] = rows
      if (slug === leagueSlug.value) scorers.value = rows
    } catch {
      if (slug === leagueSlug.value) scorersError.value = t('football.noScorers')
    } finally {
      if (slug === leagueSlug.value) scorersLoading.value = false
    }
  }

  const setView = (v) => {
    if (v === view.value) return
    view.value = v
    if (v === 'table') ensureTable()
    else if (v === 'scorers') ensureScorers()
  }

  // Header refresh button — re-fetch whatever the current view shows.
  const refreshCurrent = () => {
    if (view.value === 'table') { delete tableCache[leagueSlug.value]; table.value = null; ensureTable() }
    else if (view.value === 'scorers') { delete scorerCache[leagueSlug.value]; scorers.value = null; ensureScorers() }
    else fetchScores()
  }

  const selectLeague = (slug) => {
    if (slug === leagueSlug.value) return
    leagueSlug.value = slug
    fetchScores()
    // Swap in the new league's data for whichever view is open.
    table.value = tableCache[slug] || null
    scorers.value = scorerCache[slug] || null
    if (view.value === 'table') ensureTable()
    else if (view.value === 'scorers') ensureScorers()
  }

  const shiftDay = (delta) => {
    const d = new Date(date.value)
    d.setDate(d.getDate() + delta)
    date.value = d
    fetchScores()
  }

  const goToday = () => {
    if (sameDay(date.value, new Date())) return
    date.value = new Date()
    fetchScores()
  }

  // Featured: a live match first, then the first scheduled game, else the latest.
  const featured = computed(() => {
    const live = events.value.find((e) => e.live)
    if (live) return live
    const upcoming = events.value.find((e) => e.state === 'pre')
    return upcoming || events.value[0] || null
  })

  const others = computed(() =>
    events.value.filter((e) => e.id !== featured.value?.id),
  )

  const liveCount = computed(() => events.value.filter((e) => e.live).length)

  const isToday = computed(() => sameDay(date.value, new Date()))

  const dateLabel = computed(() => {
    const d = date.value
    const today = new Date()
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    if (sameDay(d, today)) return t('football.today')
    if (sameDay(d, tomorrow)) return t('football.tomorrow')
    if (sameDay(d, yesterday)) return t('football.yesterday')
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  })

  const updatedText = computed(() =>
    updatedAt.value
      ? updatedAt.value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '',
  )

  onUnmounted(() => clearInterval(timer))

  return {
    dark, toggleTheme,
    leagues, leagueSlug, activeLeague, leagueName,
    date, dateLabel, isToday,
    events, featured, others, liveCount,
    loading, error, updatedText,
    view, setView, refreshCurrent,
    table, scorers, tableLoading, scorersLoading, tableError, scorersError,
    fetchScores, selectLeague, shiftDay, goToday,
    lineupEvent, openLineup, closeLineup, retryLineup,
    lineupFor, detailsStateFor,
    ensurePrediction, predictionFor, statsFor, assistsFor,
    h2hFor, formFor, ratingSourceFor,
  }
}
