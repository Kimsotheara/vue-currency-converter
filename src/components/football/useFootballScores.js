import { ref, computed, onUnmounted } from 'vue'
import { leagues } from './leagues'
import { useI18n } from '@/i18n'

const API = 'https://site.api.espn.com/apis/site/v2/sports/soccer'
const POLL_MS = 30_000
const TABLE_POLL_MS = 45_000

const fetchJson = async (url, ms = 9000) => {

  const res = await fetch(url, { signal: AbortSignal.timeout(ms), cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const TZ = 'Asia/Ho_Chi_Minh'

const ymd = (d) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}${m}${day}`
}

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
    state: st.state,
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

const groupOf = (abbr = '') => {
  const a = abbr.toUpperCase().replace(/-.*$/, '')
  if (a === 'G' || a === 'GK') return 'GK'
  if (['LWB', 'RWB', 'LB', 'RB', 'CB', 'CD', 'D', 'SW', 'RCB', 'LCB'].includes(a)) return 'DEF'
  if (['F', 'ST', 'CF', 'LW', 'RW', 'SS', 'W'].includes(a)) return 'FWD'
  return 'MID'
}

const parseStats = (stats) => Object.fromEntries((stats || []).map((x) => [x.name, x.value || 0]))

const computeRating = (s, played) => {
  if (!played) return null
  const v = (k) => s[k] || 0
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
    shortName: p.athlete?.shortName || '',
    pos: p.position?.abbreviation || '',
    posName: p.position?.displayName || p.position?.name || '',
    group: groupOf(p.position?.abbreviation),
    shirt: p.athlete?.jerseyImages?.[0]?.href || '',
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

    subs: roster.filter((p) => !p.starter).map((p) => mapPlayer(p, p.subbedIn === true)),
    lines: buildLines(starters),
  }
}

const normName = (s = '') =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

let afDown = false
const fetchAfRatings = async (event) => {
  if (afDown) return null
  const d = new Date(event.date)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const get = async (path) => {
    let res
    try { res = await fetch(`/api/football${path}`, { signal: AbortSignal.timeout(9000), cache: 'no-store' }) }
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

const mapForm = (data, teamId) => {
  const done = (data.events || [])
    .filter((e) => e.competitions?.[0]?.status?.type?.completed)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
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

  note: e.note ? { color: e.note.color, text: e.note.description } : null,
})

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

const athleteCache = {}

const fetchLeaders = async (slug, season, teamMap = {}) => {
  const leadersUrl = (t) => `${CORE_API}/${slug}/seasons/${season}/types/${t}/leaders`
  const catsOf = async (t) => (await fetchJson(leadersUrl(t)).catch(() => null))?.categories || []
  const pick = (cats, name) => (cats.find((c) => c.name === name)?.leaders || []).slice(0, 20)

  let cats = await catsOf(0)
  let goalsTop = pick(cats, 'goalsLeaders')
  let assistsTop = pick(cats, 'assistsLeaders')
  if (!goalsTop.length && !assistsTop.length) {
    cats = await catsOf(1)
    goalsTop = pick(cats, 'goalsLeaders')
    assistsTop = pick(cats, 'assistsLeaders')
  }
  if (!goalsTop.length && !assistsTop.length) return { goals: [], assists: [] }

  const refs = [...new Set([...goalsTop, ...assistsTop].map((l) => l.athlete?.$ref).filter(Boolean))]
  await Promise.all(
    refs.map(async (ref) => {
      if (ref in athleteCache) return
      athleteCache[ref] = await fetchJson(ref.replace(/^http:/, 'https:')).catch(() => null)
    }),
  )

  const num = (short, k) => Number(short.match(new RegExp(`${k}:\\s*(\\d+)`))?.[1] ?? 0)
  const build = (list) =>
    list.map((l, i) => {
      const a = athleteCache[l.athlete?.$ref] || {}
      const tid = l.team?.$ref?.match(/teams\/(\d+)/)?.[1]
      const tm = teamMap[tid]
      const short = l.shortDisplayValue || ''
      return {
        rank: i + 1,
        goals: num(short, 'G'),
        assists: num(short, 'A'),
        matches: num(short, 'M'),
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

  return { goals: build(goalsTop), assists: build(assistsTop) }
}

const buildTableResult = ({ season, groups }) => {
  const teamMap = {}
  for (const g of groups)
    for (const r of g.rows)
      teamMap[r.team.id] = { name: r.team.name, abbr: r.team.abbr, logo: r.team.logo }
  return { season, groups, teamMap }
}

const fetchLiveCount = async (slug) => {
  try {
    const now = new Date()
    const from = new Date(now); from.setDate(from.getDate() - 1)
    const to = new Date(now); to.setDate(to.getDate() + 1)
    const data = await fetchJson(`${API}/${slug}/scoreboard?dates=${ymd(from)}-${ymd(to)}`)
    return (data.events || []).filter((e) => e.status?.type?.state === 'in').length
  } catch {
    return 0
  }
}

const bracketStagesCache = {}

const fetchBracket = async (slug) => {
  let stages = bracketStagesCache[slug]
  if (!stages) {
    const board = await fetchJson(`${API}/${slug}/scoreboard`)
    const entries = board.leagues?.[0]?.calendar?.[0]?.entries || []
    stages = entries

      .filter((e) => !/group|league/i.test(e.label))
      .map((e) => ({ label: e.label, start: new Date(e.startDate), end: new Date(e.endDate) }))
    if (!stages.length) return null
    bracketStagesCache[slug] = stages
  }
  const data = await fetchJson(
    `${API}/${slug}/scoreboard?dates=${ymd(stages[0].start)}-${ymd(stages[stages.length - 1].end)}`,
  )

  const stageIndex = (t) => {
    for (let i = stages.length - 1; i >= 0; i--)
      if (t >= stages[i].start && t < stages[i].end) return i
    return -1
  }
  const rounds = stages.map((s) => ({ label: s.label, matches: [] }))
  for (const ev of data.events || []) {
    const i = stageIndex(new Date(ev.date))
    if (i >= 0) rounds[i].matches.push(normalize(ev))
  }
  const filled = rounds.filter((r) => r.matches.length)
  for (const r of filled) r.matches = collapseTies(r.matches)
  return filled.length ? filled : null
}

const collapseTies = (matches) => {
  const groups = new Map()
  for (const m of matches) {
    const ids = [m.home.id, m.away.id].filter(Boolean).sort()
    const key = ids.length === 2 ? ids.join('-') : m.id
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(m)
  }
  const ties = []
  for (const legs of groups.values()) {
    legs.sort((a, b) => new Date(a.date) - new Date(b.date))
    const first = legs[0]
    const A = first.home, B = first.away
    let aG = 0, bG = 0, anyLive = false, allDone = true, anyScore = false
    for (const leg of legs) {
      anyLive = anyLive || leg.live
      allDone = allDone && leg.completed
      if (leg.state !== 'pre') anyScore = true
      const aHome = leg.home.id === A.id
      aG += (Number(aHome ? leg.home.score : leg.away.score) || 0)
      bG += (Number(aHome ? leg.away.score : leg.home.score) || 0)
    }
    let aWin = false, bWin = false
    if (allDone) {
      if (aG > bG) aWin = true
      else if (bG > aG) bWin = true
      else {
        const last = legs[legs.length - 1]
        const aHome = last.home.id === A.id
        aWin = aHome ? !!last.home.winner : !!last.away.winner
        bWin = aHome ? !!last.away.winner : !!last.home.winner
      }
    }
    ties.push({
      id: legs.map((l) => l.id).join('-'),
      date: first.date,
      state: anyLive ? 'in' : allDone ? 'post' : anyScore ? 'in' : 'pre',
      live: anyLive,
      completed: allDone,
      home: { ...A, score: anyScore ? aG : '', winner: aWin },
      away: { ...B, score: anyScore ? bG : '', winner: bWin },
    })
  }
  return ties.sort((a, b) => new Date(a.date) - new Date(b.date))
}

const koSummaryCache = {}

const fetchKnockoutStats = async (slug, rounds, teamMap = {}) => {
  const done = (rounds || []).flatMap((r) => r.matches).filter((m) => m.completed)
  const acc = {}
  await Promise.all(
    done.map(async (m) => {
      let players = koSummaryCache[m.id]
      if (!players) {
        try {
          const data = await fetchJson(`${API}/${slug}/summary?event=${m.id}`)
          players = []
          for (const tm of data.rosters || []) {
            const teamId = tm.team?.id
            for (const p of tm.roster || []) {
              if (p.starter !== true && p.subbedIn !== true) continue
              const s = parseStats(p.stats)
              players.push({ name: p.athlete?.displayName || '', goals: s.totalGoals || 0, assists: s.goalAssists || 0, teamId })
            }
          }
          koSummaryCache[m.id] = players
        } catch { players = [] }
      }
      for (const p of players) {
        const key = normName(p.name)
        if (!key) continue
        if (!acc[key])
          acc[key] = {
            name: p.name, goals: 0, assists: 0, apps: 0,
            team: teamMap[p.teamId] || {
              name: '', abbr: '',
              logo: p.teamId ? `https://a.espncdn.com/i/teamlogos/soccer/500/${p.teamId}.png` : '',
            },
          }
        acc[key].goals += p.goals
        acc[key].assists += p.assists
        acc[key].apps += 1
      }
    }),
  )
  return acc
}

const mergeKnockout = (base, ko) => {
  const byName = new Map()
  const seed = (p) => { const k = normName(p.name); if (k && !byName.has(k)) byName.set(k, { ...p }) }
  base.goals.forEach(seed)
  base.assists.forEach(seed)
  for (const kp of Object.values(ko)) {
    const k = normName(kp.name)
    const cur = byName.get(k)
    if (cur) { cur.goals += kp.goals; cur.assists += kp.assists; cur.matches = (cur.matches || 0) + kp.apps }
    else byName.set(k, { name: kp.name, goals: kp.goals, assists: kp.assists, matches: kp.apps, flag: '', pos: '', team: kp.team })
  }
  const all = [...byName.values()]
  const ranked = (key, tie) =>
    all
      .filter((p) => p[key] > 0)
      .sort((a, b) => b[key] - a[key] || b[tie] - a[tie])
      .slice(0, 20)
      .map((p, i) => ({ ...p, rank: i + 1 }))
  return { goals: ranked('goals', 'assists'), assists: ranked('assists', 'goals') }
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

  const leagueSlug = ref(leagues.find((l) => l.slug === 'eng.1')?.slug || leagues[0].slug)
  const date = ref(new Date())
  const events = ref([])
  const leagueName = ref('')
  const loading = ref(false)
  const error = ref('')
  const updatedAt = ref(null)

  const summaryCache = ref({})
  const summaryStatus = ref({})
  const lineupEvent = ref(null)

  const view = ref('table')
  const tableCache = {}
  const scorerCache = {}
  const table = ref(null)
  const scorers = ref(null)
  const tableLoading = ref(false)
  const scorersLoading = ref(false)
  const tableError = ref('')
  const scorersError = ref('')
  const tableLiveCount = ref(0)
  const tableUpdatedAt = ref(null)
  const scorersLiveCount = ref(0)
  const scorersUpdatedAt = ref(null)
  const bracket = ref(null)
  const bracketLoading = ref(false)
  const bracketCache = {}

  let timer = null
  let tableTimer = null
  let scorersTimer = null
  let reqId = 0

  const activeLeague = computed(() => leagues.find((l) => l.slug === leagueSlug.value))

  const fetchScores = async ({ silent = false } = {}) => {
    const mine = ++reqId
    if (!silent) {
      loading.value = true
      error.value = ''
    }
    try {

      const prev = new Date(date.value); prev.setDate(prev.getDate() - 1)
      const next = new Date(date.value); next.setDate(next.getDate() + 1)
      const url = `${API}/${leagueSlug.value}/scoreboard?dates=${ymd(prev)}-${ymd(next)}`
      const data = await fetchJson(url)
      if (mine !== reqId) return
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
        .sort((a) => (a.homeAway === 'home' ? -1 : 1))

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
      if (event.completed) enrichRatings(event)
    } catch {
      summaryStatus.value = { ...summaryStatus.value, [id]: 'error' }
    }
  }

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
  const detailsStateFor = (id) => summaryStatus.value[id] || null

  const ensureTable = async (slug = leagueSlug.value) => {
    if (tableCache[slug]) { table.value = tableCache[slug]; return tableCache[slug] }
    tableLoading.value = true
    tableError.value = ''
    try {
      const { season, groups } = await fetchStandings(slug)
      if (!groups.length) throw new Error('no standings')
      const result = buildTableResult({ season, groups })
      tableCache[slug] = result
      if (slug === leagueSlug.value) {
        table.value = result
        tableUpdatedAt.value = new Date()
      }
      return result
    } catch {
      if (slug === leagueSlug.value) tableError.value = t('football.noStandings')
      return null
    } finally {
      if (slug === leagueSlug.value) tableLoading.value = false
    }
  }

  const buildScorers = async (slug) => {
    const tbl = await ensureTable(slug)
    if (!tbl?.season) throw new Error('no season')
    let data = await fetchLeaders(slug, tbl.season, tbl.teamMap)
    if (isCup(slug)) {
      const rounds = bracketCache[slug] || (await fetchBracket(slug))
      data = mergeKnockout(data, await fetchKnockoutStats(slug, rounds, tbl.teamMap))
    }
    return data
  }

  const ensureScorers = async (slug = leagueSlug.value) => {
    if (scorerCache[slug]) { scorers.value = scorerCache[slug]; return }
    scorersLoading.value = true
    scorersError.value = ''
    try {
      const data = await buildScorers(slug)
      if (!data.goals.length && !data.assists.length) throw new Error('no leaders')
      scorerCache[slug] = data
      if (slug === leagueSlug.value) { scorers.value = data; scorersUpdatedAt.value = new Date() }
    } catch {
      if (slug === leagueSlug.value) scorersError.value = t('football.noScorers')
    } finally {
      if (slug === leagueSlug.value) scorersLoading.value = false
    }
  }

  const refreshScorersLive = async () => {
    const slug = leagueSlug.value
    if (view.value !== 'scorers') return
    const live = await fetchLiveCount(slug)
    if (slug !== leagueSlug.value || view.value !== 'scorers') return
    scorersLiveCount.value = live
    if (!live) return
    try {
      delete scorerCache[slug]
      const data = await buildScorers(slug)
      if ((data.goals.length || data.assists.length) && slug === leagueSlug.value && view.value === 'scorers') {
        scorerCache[slug] = data
        scorers.value = data
        scorersUpdatedAt.value = new Date()
      }
    } catch {  }
  }

  const startScorersPolling = () => {
    clearInterval(scorersTimer)
    refreshScorersLive()
    scorersTimer = setInterval(refreshScorersLive, TABLE_POLL_MS)
  }
  const stopScorersPolling = () => {
    clearInterval(scorersTimer)
    scorersLiveCount.value = 0
  }

  const isCup = (slug) => !!leagues.find((l) => l.slug === slug)?.cup

  const ensureBracket = async (slug = leagueSlug.value) => {
    if (!isCup(slug)) { bracket.value = null; return }
    if (bracketCache[slug]) { bracket.value = bracketCache[slug]; return }
    bracketLoading.value = true
    try {
      const rounds = await fetchBracket(slug)
      bracketCache[slug] = rounds
      if (slug === leagueSlug.value) bracket.value = rounds
    } catch {
      if (slug === leagueSlug.value) bracket.value = null
    } finally {
      if (slug === leagueSlug.value) bracketLoading.value = false
    }
  }

  const stale = (slug) => slug !== leagueSlug.value || view.value !== 'table'

  const refreshTableLive = async () => {
    const slug = leagueSlug.value
    if (view.value !== 'table') return
    const liveCount = await fetchLiveCount(slug)
    if (stale(slug)) return
    tableLiveCount.value = liveCount
    if (!liveCount) return
    try {
      const { season, groups } = await fetchStandings(slug)
      if (!stale(slug) && groups.length) {
        const result = buildTableResult({ season, groups })
        tableCache[slug] = result
        table.value = result
        tableUpdatedAt.value = new Date()
      }
    } catch {  }
    if (isCup(slug)) { delete bracketCache[slug]; ensureBracket(slug) }
  }

  const startTablePolling = () => {
    clearInterval(tableTimer)
    refreshTableLive()
    tableTimer = setInterval(refreshTableLive, TABLE_POLL_MS)
  }
  const stopTablePolling = () => {
    clearInterval(tableTimer)
    tableLiveCount.value = 0
  }

  const setView = (v) => {
    if (v === view.value) return
    view.value = v
    stopTablePolling()
    stopScorersPolling()
    if (v === 'table') { ensureTable(); ensureBracket(); startTablePolling() }
    else if (v === 'scorers') { ensureScorers(); startScorersPolling() }
  }

  const refreshCurrent = () => {
    const slug = leagueSlug.value
    if (view.value === 'table') {
      delete tableCache[slug]; table.value = null
      delete bracketCache[slug]; bracket.value = null
      ensureTable(); ensureBracket(); refreshTableLive()
    } else if (view.value === 'scorers') {
      delete scorerCache[slug]; scorers.value = null; ensureScorers()
    } else fetchScores()
  }

  const selectLeague = (slug) => {
    if (slug === leagueSlug.value) return
    leagueSlug.value = slug
    fetchScores()

    table.value = tableCache[slug] || null
    scorers.value = scorerCache[slug] || null
    bracket.value = bracketCache[slug] || null
    stopTablePolling()
    stopScorersPolling()
    if (view.value === 'table') { ensureTable(); ensureBracket(); startTablePolling() }
    else if (view.value === 'scorers') { ensureScorers(); startScorersPolling() }
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

  const clockText = (d) =>
    d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''
  const updatedText = computed(() => clockText(updatedAt.value))
  const tableUpdatedText = computed(() => clockText(tableUpdatedAt.value))
  const scorersUpdatedText = computed(() => clockText(scorersUpdatedAt.value))

  if (view.value === 'table') { ensureTable(); ensureBracket(); startTablePolling() }
  else if (view.value === 'scorers') { ensureScorers(); startScorersPolling() }

  onUnmounted(() => { clearInterval(timer); clearInterval(tableTimer); clearInterval(scorersTimer) })

  return {
    dark, toggleTheme,
    leagues, leagueSlug, activeLeague, leagueName,
    date, dateLabel, isToday,
    events, featured, others, liveCount,
    loading, error, updatedText,
    view, setView, refreshCurrent,
    table, scorers, tableLoading, scorersLoading, tableError, scorersError,
    tableLiveCount, tableUpdatedText,
    scorersLiveCount, scorersUpdatedText,
    bracket, bracketLoading,
    fetchScores, selectLeague, shiftDay, goToday,
    lineupEvent, openLineup, closeLineup, retryLineup,
    lineupFor, detailsStateFor,
    ensurePrediction, predictionFor, statsFor, assistsFor,
    h2hFor, formFor, ratingSourceFor,
  }
}
