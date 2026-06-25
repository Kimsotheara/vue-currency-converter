import { ref, computed } from 'vue'
import { provinces } from './provinces'
import { districts } from './districts'
import { useI18n } from '@/i18n'

const API = 'https://api.open-meteo.com/v1/forecast'
const AIR_API = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const MET_API = 'https://api.met.no/weatherapi/locationforecast/2.0/compact'

const currentUrl = (locations) =>
  `${API}?latitude=${locations.map(p => p.lat).join(',')}` +
  `&longitude=${locations.map(p => p.lon).join(',')}` +
  '&current=weather_code,temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m' +
  '&timezone=Asia%2FPhnom_Penh'

// One rich call backing the detail modal: 48h hourly + 7-day daily (with UV,
// rain totals & wind), plus the current UV index.
const detailsUrl = (p) =>
  `${API}?latitude=${p.lat}&longitude=${p.lon}` +
  '&current=uv_index' +
  '&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,relative_humidity_2m,uv_index' +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,' +
  'uv_index_max,precipitation_sum,wind_speed_10m_max' +
  '&forecast_days=7&forecast_hours=48&timezone=Asia%2FPhnom_Penh'

const airUrl = (p) =>
  `${AIR_API}?latitude=${p.lat}&longitude=${p.lon}` +
  '&current=us_aqi,pm2_5,pm10,ozone,uv_index&timezone=Asia%2FPhnom_Penh'

const fetchWithTimeout = (url, ms = 8000) =>
  fetch(url, { signal: AbortSignal.timeout(ms) })

let primaryDownUntil = 0
const primaryHealthy = () => Date.now() >= primaryDownUntil
const markPrimaryDown = () => { primaryDownUntil = Date.now() + 5 * 60 * 1000 }
const markPrimaryUp = () => { primaryDownUntil = 0 }

const fetchCurrent = async (locations) => {
  const res = await fetchWithTimeout(currentUrl(locations))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const arr = Array.isArray(data) ? data : [data]
  return arr.map(d => ({ current: d.current }))
}

const symbolToCode = (symbol) => {
  const s = (symbol || '').replace(/_(day|night|polartwilight)$/, '')
  const map = {
    clearsky: 0, fair: 1, partlycloudy: 2, cloudy: 3, fog: 45,
    lightrain: 61, lightrainshowers: 80, rain: 63, rainshowers: 81,
    heavyrain: 65, heavyrainshowers: 82,
    lightrainandthunder: 95, rainandthunder: 95, heavyrainandthunder: 95,
    lightrainshowersandthunder: 95, rainshowersandthunder: 95,
    heavyrainshowersandthunder: 95,
    lightsleet: 61, sleet: 63, heavysleet: 65, sleetshowers: 81,
    lightsnow: 71, snow: 71, heavysnow: 75, snowshowers: 85,
  }
  return map[s] ?? 2
}

const metFetchOne = async (p) => {
  const res = await fetchWithTimeout(`${MET_API}?lat=${p.lat}&lon=${p.lon}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()).properties.timeseries
}

const metCurrent = (ts) => {
  const d = ts[0].data
  const det = d.instant.details
  const symbol = d.next_1_hours?.summary?.symbol_code || d.next_6_hours?.summary?.symbol_code
  return {
    weather_code: symbolToCode(symbol),
    temperature_2m: det.air_temperature,
    relative_humidity_2m: Math.round(det.relative_humidity),
    apparent_temperature: det.air_temperature,
    wind_speed_10m: det.wind_speed * 3.6,
  }
}

const metDaily = (ts) => {
  const days = {}
  for (const e of ts) {
    const local = new Date(new Date(e.time).getTime() + 7 * 3600 * 1000)
    const day = local.toISOString().slice(0, 10)
    const bucket = (days[day] ||= { temps: [], codes: [], precip: 0 })
    bucket.temps.push(e.data.instant.details.air_temperature)
    const sym = e.data.next_6_hours?.summary?.symbol_code || e.data.next_1_hours?.summary?.symbol_code
    if (sym) bucket.codes.push({ hour: local.getUTCHours(), code: symbolToCode(sym) })
    bucket.precip += e.data.next_1_hours?.details?.precipitation_amount ?? 0
  }
  const time = Object.keys(days).sort().slice(0, 7)
  return {
    time,
    weather_code: time.map(d => {
      const cs = days[d].codes
      const mid = cs.find(c => c.hour >= 11 && c.hour <= 14) || cs[Math.floor(cs.length / 2)]
      return mid ? mid.code : 2
    }),
    temperature_2m_max: time.map(d => Math.max(...days[d].temps)),
    temperature_2m_min: time.map(d => Math.min(...days[d].temps)),
    precipitation_probability_max: time.map(d => Math.round(days[d].precip)),
    precipUnit: 'mm',
  }
}

const mapHourly = (h) =>
  (h?.time || []).map((time, i) => ({
    time,
    temp: h.temperature_2m[i],
    precip: h.precipitation_probability[i] ?? 0,
    code: h.weather_code[i],
    wind: h.wind_speed_10m[i],
    humidity: h.relative_humidity_2m[i],
    uv: h.uv_index[i],
  }))

// Best/worst day to travel over the 7-day window. Penalise rain chance, fierce
// heat, very high UV and storms; lowest score wins.
const deriveTravel = (daily) => {
  const score = (i) => {
    let s = daily.precipitation_probability_max?.[i] ?? 0
    const tmax = daily.temperature_2m_max?.[i] ?? 30
    const uv = daily.uv_index_max?.[i] ?? 0
    if (tmax > 34) s += (tmax - 34) * 4
    if (uv >= 9) s += 8
    if ([95, 96, 99].includes(daily.weather_code?.[i])) s += 25
    return s
  }
  const scores = (daily.time || []).map((_, i) => score(i))
  if (!scores.length) return null
  const min = Math.min(...scores), max = Math.max(...scores)
  const best = scores.indexOf(min), worst = scores.indexOf(max)
  return best === worst ? null : { best, worst }
}

// Local advisories synthesised from today's forecast (no public alert feed
// covers Cambodia). Returns [{ level, icon, key, params }].
const deriveAdvisories = (daily, airNow) => {
  const a = []
  const tmax = daily.temperature_2m_max?.[0]
  const rainP = daily.precipitation_probability_max?.[0] ?? 0
  const rainSum = daily.precipitation_sum?.[0] ?? 0
  const uv = daily.uv_index_max?.[0] ?? 0
  const wind = daily.wind_speed_10m_max?.[0] ?? 0
  if ([95, 96, 99].includes(daily.weather_code?.[0])) a.push({ level: 'warn', icon: '⛈️', key: 'alertThunder' })
  if (rainSum >= 20 || rainP >= 85) a.push({ level: 'warn', icon: '🌧️', key: 'alertHeavyRain' })
  if (tmax >= 36) a.push({ level: 'warn', icon: '🔥', key: 'alertHeat', params: { t: Math.round(tmax) } })
  if (uv >= 8) a.push({ level: 'info', icon: '🧴', key: 'alertHighUv', params: { uv: Math.round(uv) } })
  if (wind >= 40) a.push({ level: 'info', icon: '💨', key: 'alertWind', params: { w: Math.round(wind) } })
  if (airNow && airNow.aqi >= 101) a.push({ level: 'info', icon: '😷', key: 'alertAir', params: { aqi: airNow.aqi } })
  return a
}

// Farming-focused read-out (Agriculture mode) — daytime humidity/wind averages,
// 3-day rain total, and simple spray/irrigation calls. Useful for Cambodia.
const deriveAgri = (daily, hourly) => {
  const day = hourly.filter((h) => {
    const hr = new Date(h.time).getHours()
    return hr >= 6 && hr <= 18
  })
  const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0)
  const rainSum3 = (daily.precipitation_sum || []).slice(0, 3).reduce((s, v) => s + (v || 0), 0)
  const humidity = Math.round(avg(day.map((h) => h.humidity)))
  const wind = Math.round(avg(day.map((h) => h.wind)))
  const rainP = daily.precipitation_probability_max?.[0] ?? 0
  return {
    rainSum3: Math.round(rainSum3),
    humidity,
    wind,
    rainP,
    sprayOk: wind < 15 && rainP < 40,   // calm & dry enough to spray
    needIrrigation: rainSum3 < 5,        // little rain coming — irrigate
  }
}

const keyOf = (p) => `${p.lat},${p.lon}`

export function useCambodiaWeather() {
  const { t } = useI18n()
  const weather = ref([])
  const districtWeather = ref({})
  const detailsCache = ref({})
  const detailsStatus = ref({})

  const loading = ref(false)
  const error = ref('')
  const updatedAt = ref(null)
  const viewProvince = ref(null)
  const search = ref('')
  const sortBy = ref('name')

  const inFlight = new Set()

  const loadCurrent = async (locations, paint) => {
    if (primaryHealthy()) {
      try {
        paint(await fetchCurrent(locations))
        markPrimaryUp()
        return
      } catch {
        markPrimaryDown()
      }
    }
    const partial = new Array(locations.length).fill(undefined)
    paint([...partial])
    let okCount = 0
    await Promise.all(locations.map(async (p, i) => {
      try {
        partial[i] = { current: metCurrent(await metFetchOne(p)) }
        okCount++
        paint([...partial])
      } catch {}
    }))
    if (!okCount) throw new Error('all providers failed')
  }

  const fetchWeather = async () => {
    if (inFlight.has('provinces')) return
    inFlight.add('provinces')
    loading.value = true
    error.value = ''
    try {
      await loadCurrent(provinces, (arr) => { weather.value = arr })
      updatedAt.value = new Date()
    } catch {
      error.value = t('weather.error')
    } finally {
      inFlight.delete('provinces')
      loading.value = false
    }
  }

  const fetchDistrictWeather = async (province, { silent = false } = {}) => {
    const list = districts[province.id] || []
    if (!list.length || inFlight.has(province.id)) return
    inFlight.add(province.id)
    if (!silent) {
      loading.value = true
      error.value = ''
    }
    try {
      await loadCurrent(list, (arr) => {
        districtWeather.value = { ...districtWeather.value, [province.id]: arr }
      })
      updatedAt.value = new Date()
    } catch {
      if (!silent) error.value = t('weather.error')
    } finally {
      inFlight.delete(province.id)
      if (!silent) loading.value = false
    }
  }

  const prefetchDistricts = (province) => {
    if (province && districts[province.id] && !districtWeather.value[province.id]) {
      fetchDistrictWeather(province, { silent: true })
    }
  }

  // Rich detail bundle for the modal: 7-day + 48h hourly + air quality, plus the
  // derived advisories / travel pick / agriculture read-out. Forecast falls back
  // to met.no (daily only) if Open-Meteo is down; air quality is best-effort.
  const ensureDetails = async (p) => {
    const k = keyOf(p)
    if (detailsCache.value[k] || detailsStatus.value[k] === 'loading') return
    detailsStatus.value = { ...detailsStatus.value, [k]: 'loading' }
    try {
      const getJson = (url) =>
        fetchWithTimeout(url).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      const [fRes, aRes] = await Promise.allSettled([getJson(detailsUrl(p)), getJson(airUrl(p))])

      let daily, hourly = []
      if (fRes.status === 'fulfilled') {
        daily = fRes.value.daily
        hourly = mapHourly(fRes.value.hourly)
        markPrimaryUp()
      } else {
        markPrimaryDown()
        daily = metDaily(await metFetchOne(p)) // last resort: 7-day only, no hourly/UV
      }

      let airNow = null
      if (aRes.status === 'fulfilled') {
        const c = aRes.value.current || {}
        airNow = {
          aqi: c.us_aqi != null ? Math.round(c.us_aqi) : null,
          pm25: c.pm2_5, pm10: c.pm10, ozone: c.ozone, uv: c.uv_index,
        }
      }

      const details = {
        daily,
        hourly,
        airNow,
        advisories: deriveAdvisories(daily, airNow),
        travel: deriveTravel(daily),
        agri: hourly.length ? deriveAgri(daily, hourly) : null,
      }
      detailsCache.value = { ...detailsCache.value, [k]: details }
      const { [k]: _, ...rest } = detailsStatus.value
      detailsStatus.value = rest
    } catch {
      detailsStatus.value = { ...detailsStatus.value, [k]: 'error' }
    }
  }
  const detailsFor = (p) => (p ? detailsCache.value[keyOf(p)] : null)
  const detailsStateFor = (p) => (p ? detailsStatus.value[keyOf(p)] : null)

  const openDistricts = (province) => {
    viewProvince.value = province
    search.value = ''
    if (!districtWeather.value[province.id]) fetchDistrictWeather(province)
  }
  const closeDistricts = () => {
    viewProvince.value = null
    search.value = ''
  }

  const refresh = () => {
    if (viewProvince.value) fetchDistrictWeather(viewProvince.value)
    else fetchWeather()
  }

  const rows = computed(() => {
    const base = viewProvince.value
      ? (districts[viewProvince.value.id] || []).map((p, index) => ({
          ...p, index, w: districtWeather.value[viewProvince.value.id]?.[index],
        }))
      : provinces.map((p, index) => ({ ...p, index, w: weather.value[index] }))

    const q = search.value.trim().toLowerCase()
    let list = base
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) || p.km.includes(search.value.trim()))
    }
    if (sortBy.value === 'temp') {
      list = [...list].sort((a, b) =>
        (b.w?.current?.temperature_2m ?? -99) - (a.w?.current?.temperature_2m ?? -99))
    }
    return list
  })

  const hasData = computed(() =>
    viewProvince.value
      ? !!districtWeather.value[viewProvince.value.id]
      : weather.value.length > 0)

  const updatedText = computed(() => {
    if (!updatedAt.value) return ''
    return updatedAt.value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  })

  return {
    loading, error, updatedText, hasData,
    viewProvince, openDistricts, closeDistricts, prefetchDistricts,
    detailsFor, detailsStateFor, ensureDetails,
    search, sortBy, rows,
    fetchWeather, refresh,
  }
}
