import { ref, computed, onUnmounted } from 'vue'
import { leagues } from './leagues'

const API = 'https://site.api.espn.com/apis/site/v2/sports/soccer'
const POLL_MS = 30_000 // refresh cadence while a match is live

const fetchJson = async (url, ms = 9000) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const ymd = (d) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}${m}${day}`
}

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

const mapPlayer = (p) => ({
  num: p.jersey || '',
  name: p.athlete?.displayName || '',
  pos: p.position?.abbreviation || '',
  group: groupOf(p.position?.abbreviation),
})

const normalizeLineup = (t) => {
  const roster = t.roster || []
  const starters = roster.filter((p) => p.starter).map(mapPlayer)
  return {
    name: t.team?.displayName || '',
    logo: t.team?.logo || '',
    homeAway: t.homeAway,
    formation: t.formation || '',
    starters,
    subs: roster.filter((p) => !p.starter).map(mapPlayer),
    lines: {
      GK: starters.filter((p) => p.group === 'GK'),
      DEF: starters.filter((p) => p.group === 'DEF'),
      MID: starters.filter((p) => p.group === 'MID'),
      FWD: starters.filter((p) => p.group === 'FWD'),
    },
  }
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

export function useFootballScores() {
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
      const url = `${API}/${leagueSlug.value}/scoreboard?dates=${ymd(date.value)}`
      const data = await fetchJson(url)
      if (mine !== reqId) return // a newer request superseded this one
      leagueName.value = data.leagues?.[0]?.name || activeLeague.value?.name || ''
      events.value = (data.events || []).map(normalize)
      updatedAt.value = new Date()
      schedulePoll()
    } catch {
      if (mine === reqId && !silent)
        error.value = 'Score service is slow or unreachable — tap Retry'
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
          h2h: mapH2H(data),
          form: {
            home: homeSched ? mapForm(homeSched, event.home?.id) : [],
            away: awaySched ? mapForm(awaySched, event.away?.id) : [],
          },
        },
      }
      const { [id]: _, ...rest } = summaryStatus.value
      summaryStatus.value = rest
    } catch {
      summaryStatus.value = { ...summaryStatus.value, [id]: 'error' }
    }
  }

  const ensurePrediction = (event) => { if (event) ensureSummary(event) }
  const predictionFor = (id) => summaryCache.value[id]?.prediction || null
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

  const selectLeague = (slug) => {
    if (slug === leagueSlug.value) return
    leagueSlug.value = slug
    fetchScores()
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
    if (sameDay(d, today)) return 'Today'
    if (sameDay(d, tomorrow)) return 'Tomorrow'
    if (sameDay(d, yesterday)) return 'Yesterday'
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
    fetchScores, selectLeague, shiftDay, goToday,
    lineupEvent, openLineup, closeLineup, retryLineup,
    lineupFor, detailsStateFor,
    ensurePrediction, predictionFor,
    h2hFor, formFor,
  }
}
