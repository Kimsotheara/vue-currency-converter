import { ref } from 'vue'

// Player face photos. Tries API-Football first (real headshots, via the dev proxy
// in vite.config.js so the key stays server-side); falls back to TheSportsDB
// cutouts (keyless, CORS-enabled). Found URLs are cached in localStorage so a
// player is fetched at most once ever — vital for API-Football's 100/day free tier.
const LS_KEY = 'ft-player-photos'
const TSDB = 'https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p='
const APIF = '/api/football/players/profiles?search='

const loadCache = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} } catch { return {} }
}
// nameLower -> url (found) | '' (looked up, none) | undefined (not fetched)
const cache = ref(loadCache())
const inFlight = new Set()
let apifDown = false // once the proxy/key is shown missing, stop trying it this session

const persist = () => {
  try {
    const found = Object.fromEntries(Object.entries(cache.value).filter(([, v]) => v))
    localStorage.setItem(LS_KEY, JSON.stringify(found))
  } catch { /* ignore quota / private-mode errors */ }
}

const norm = (s = '') =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
const lastNameOf = (n = '') => n.trim().split(/\s+/).slice(-1)[0] || n

// Returns: url | '' (no match) | null (provider unavailable — try the next one)
const fromApiFootball = async (name) => {
  if (apifDown) return null
  const ln = lastNameOf(name)
  if (ln.length < 3) return null
  let res
  try {
    res = await fetch(APIF + encodeURIComponent(ln), { signal: AbortSignal.timeout(8000) })
  } catch { return null }
  // 401/403 = no/invalid key; 404 = no proxy (static build). Stop trying this session.
  if ([401, 403, 404, 499].includes(res.status)) { apifDown = true; return null }
  if (!res.ok) return null
  const list = (await res.json()).response || []
  if (!list.length) return ''
  const target = norm(name)
  const hit =
    list.find((r) => norm(r.player?.name) === target) ||
    list.find((r) => norm(`${r.player?.firstname} ${r.player?.lastname}`) === target) ||
    list[0]
  return hit?.player?.photo || ''
}

const fromTSDB = async (name) => {
  const res = await fetch(TSDB + encodeURIComponent(name), { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return ''
  const list = (await res.json()).player || []
  const p = list.find((x) => x.strSport === 'Soccer') || list[0]
  return p ? p.strCutout || p.strThumb || '' : ''
}

const fetchOne = async (name) => {
  const key = name.toLowerCase()
  if (cache.value[key] !== undefined || inFlight.has(key)) return
  inFlight.add(key)
  try {
    let url = await fromApiFootball(name) // null => provider unavailable, fall through
    if (url === null) url = await fromTSDB(name)
    cache.value = { ...cache.value, [key]: url || '' }
    if (url) persist()
  } catch {
    // leave undefined so it can be retried on a later open
  } finally {
    inFlight.delete(key)
  }
}

// Fetch the given names with limited concurrency (gentle on the free APIs).
const ensurePhotos = async (names) => {
  const todo = [...new Set(names.filter(Boolean))].filter(
    (n) => cache.value[n.toLowerCase()] === undefined && !inFlight.has(n.toLowerCase()),
  )
  let i = 0
  const worker = async () => {
    while (i < todo.length) await fetchOne(todo[i++])
  }
  await Promise.all(Array.from({ length: Math.min(5, todo.length) }, worker))
}

export function usePlayerPhotos() {
  const photoFor = (name) => (name ? cache.value[name.toLowerCase()] : '')
  return { photoFor, ensurePhotos }
}
