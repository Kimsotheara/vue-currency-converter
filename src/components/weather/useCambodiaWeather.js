import { ref, computed } from 'vue'
import { provinces } from './provinces'
import { districts } from './districts'
import { useI18n } from '@/i18n'

const API = 'https://api.open-meteo.com/v1/forecast'
const MET_API = 'https://api.met.no/weatherapi/locationforecast/2.0/compact'

const currentUrl = (locations) =>
  `${API}?latitude=${locations.map(p => p.lat).join(',')}` +
  `&longitude=${locations.map(p => p.lon).join(',')}` +
  '&current=weather_code,temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m' +
  '&timezone=Asia%2FPhnom_Penh'

const dailyUrl = (p) =>
  `${API}?latitude=${p.lat}&longitude=${p.lon}` +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
  '&forecast_days=7&timezone=Asia%2FPhnom_Penh'

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

const keyOf = (p) => `${p.lat},${p.lon}`

export function useCambodiaWeather() {
  const { t } = useI18n()
  const weather = ref([])
  const districtWeather = ref({})
  const dailyCache = ref({})
  const dailyStatus = ref({})

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

  const ensureDaily = async (p) => {
    const k = keyOf(p)
    if (dailyCache.value[k] || dailyStatus.value[k] === 'loading') return
    dailyStatus.value = { ...dailyStatus.value, [k]: 'loading' }
    try {
      let daily
      if (primaryHealthy()) {
        try {
          const res = await fetchWithTimeout(dailyUrl(p))
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          daily = (await res.json()).daily
          markPrimaryUp()
        } catch {
          markPrimaryDown()
        }
      }
      if (!daily) daily = metDaily(await metFetchOne(p))
      dailyCache.value = { ...dailyCache.value, [k]: daily }
      const { [k]: _, ...rest } = dailyStatus.value
      dailyStatus.value = rest
    } catch {
      dailyStatus.value = { ...dailyStatus.value, [k]: 'error' }
    }
  }
  const dailyFor = (p) => (p ? dailyCache.value[keyOf(p)] : null)
  const dailyStateFor = (p) => (p ? dailyStatus.value[keyOf(p)] : null)

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
    dailyFor, dailyStateFor, ensureDaily,
    search, sortBy, rows,
    fetchWeather, refresh,
  }
}
