<template>
  <div class="space-y-4">

    <div v-if="viewProvince" class="flex items-center gap-3">
      <button
        @click="closeDistricts"
        type="button"
        class="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors shrink-0"
      >
        ← {{ t('weather.provinces') }}
      </button>
      <p class="text-sm font-bold text-gray-800 truncate">
        🏘️ {{ viewProvince.name }} <span class="text-gray-400 font-normal">{{ viewProvince.km }}</span>
      </p>
    </div>

    <div class="flex items-center gap-2">
      <input
        v-model="search"
        type="text"
        :placeholder="viewProvince ? t('weather.searchDistrict') : t('weather.searchProvince')"
        class="flex-1 min-w-0 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <div class="flex bg-gray-100 rounded-full p-0.5 shrink-0">
        <button
          v-for="opt in [{ value: 'name', labelKey: 'weather.sortAZ' }, { value: 'temp', labelKey: 'weather.sortHot' }]"
          :key="opt.value"
          type="button"
          @click="sortBy = opt.value"
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150',
            sortBy === opt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          {{ t(opt.labelKey) }}
        </button>
      </div>
    </div>

    <div class="flex items-center justify-between gap-2">
      <p class="text-xs text-gray-400">
        <template v-if="updatedText">{{ t('weather.updated', { time: updatedText }) }}</template>
      </p>
      <button
        @click="refresh"
        :disabled="loading"
        class="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:text-gray-300 transition-colors"
      >
        {{ loading ? t('weather.refreshing') : t('weather.refresh') }}
      </button>
    </div>

    <div v-if="error" class="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-center justify-between gap-3">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button @click="refresh" class="text-sm font-bold text-red-600 underline shrink-0">{{ t('weather.retry') }}</button>
    </div>

    <div v-if="loading && !hasData" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <div v-for="n in 8" :key="n" class="bg-gray-100 rounded-2xl h-32 animate-pulse" />
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <button
        v-for="p in rows"
        :key="p.id"
        type="button"
        @click="selected = p"
        class="bg-gradient-to-br from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 border border-sky-100 rounded-2xl p-3 text-left transition-colors"
      >
        <div class="flex items-start justify-between gap-1">
          <div class="min-w-0">
            <p class="text-sm font-bold text-gray-800 truncate">
              <span v-if="p.krong" title="Municipality (Krong)">🏙️</span> {{ p.name }}
            </p>
            <p class="text-xs text-gray-400 truncate">{{ p.km }}</p>
          </div>
          <span class="text-2xl shrink-0">{{ icon(p) }}</span>
        </div>
        <p class="text-2xl font-bold text-blue-700 mt-2">
          {{ p.w ? Math.round(p.w.current.temperature_2m) + '°' : '—' }}
        </p>
        <p class="text-[11px] text-gray-500 truncate">{{ label(p) }}</p>
        <p v-if="p.w" class="text-[11px] text-gray-400 mt-0.5">
          💧 {{ p.w.current.relative_humidity_2m }}% · 💨 {{ Math.round(p.w.current.wind_speed_10m) }} km/h
        </p>
        <p class="text-[11px] text-amber-500 mt-0.5">
          🌅 {{ sunFor(p).sunrise }} · 🌇 {{ sunFor(p).sunset }}
        </p>
      </button>
    </div>

    <p v-if="!loading && !rows.length" class="text-sm text-gray-400 text-center py-6">
      {{ t('weather.nothingMatches', { q: search }) }}
    </p>

    <div
      v-if="selected"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      @click.self="selected = null"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-5 text-white rounded-t-2xl">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p v-if="viewProvince" class="text-xs opacity-75">{{ viewProvince.name }} ›</p>
              <h2 class="text-xl font-bold">{{ selected.krong ? '🏙️ ' : '' }}{{ selected.name }}</h2>
              <p class="text-sm opacity-80">{{ selected.km }}</p>
            </div>
            <span class="text-4xl">{{ icon(selected) }}</span>
          </div>
          <div v-if="selected.w" class="mt-3 flex items-end gap-3">
            <p class="text-5xl font-bold">{{ Math.round(selected.w.current.temperature_2m) }}°C</p>
            <p class="text-sm opacity-80 pb-1.5">{{ label(selected) }}</p>
          </div>
        </div>

        <div v-if="selected.w" class="p-5 space-y-4">
          <!-- Sub-tabs -->
          <div class="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto no-scrollbar">
            <button
              v-for="tb in detailTabs"
              :key="tb.id"
              type="button"
              @click="detailTab = tb.id"
              :class="[
                'flex-1 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors',
                detailTab === tb.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              ]"
            >
              {{ tb.emoji }} {{ tb.label }}
            </button>
          </div>

          <!-- ===== OVERVIEW ===== -->
          <div v-show="detailTab === 'overview'" class="space-y-4">
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-gray-50 rounded-xl py-2.5">
                <p class="text-[10px] uppercase tracking-wide text-gray-400 font-bold">{{ t('weather.feelsLike') }}</p>
                <p class="text-sm font-bold text-gray-700">{{ Math.round(selected.w.current.apparent_temperature) }}°C</p>
              </div>
              <div class="bg-gray-50 rounded-xl py-2.5">
                <p class="text-[10px] uppercase tracking-wide text-gray-400 font-bold">{{ t('weather.humidity') }}</p>
                <p class="text-sm font-bold text-gray-700">{{ selected.w.current.relative_humidity_2m }}%</p>
              </div>
              <div class="bg-gray-50 rounded-xl py-2.5">
                <p class="text-[10px] uppercase tracking-wide text-gray-400 font-bold">{{ t('weather.wind') }}</p>
                <p class="text-sm font-bold text-gray-700">{{ Math.round(selected.w.current.wind_speed_10m) }} km/h</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-center">
              <div class="bg-amber-50 border border-amber-100 rounded-xl py-2.5">
                <p class="text-[10px] uppercase tracking-wide text-amber-500 font-bold">🌅 {{ t('weather.sunrise') }}</p>
                <p class="text-sm font-bold text-gray-700">{{ sunFor(selected).sunrise }}</p>
              </div>
              <div class="bg-orange-50 border border-orange-100 rounded-xl py-2.5">
                <p class="text-[10px] uppercase tracking-wide text-orange-500 font-bold">🌇 {{ t('weather.sunset') }}</p>
                <p class="text-sm font-bold text-gray-700">{{ sunFor(selected).sunset }}</p>
              </div>
            </div>

            <!-- Weather alerts -->
            <div v-if="advisories.length" class="space-y-1.5">
              <p class="text-xs font-bold uppercase tracking-widest text-gray-400">⚠️ {{ t('weather.alerts') }}</p>
              <div
                v-for="al in advisories"
                :key="al.key"
                :class="['flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold',
                  al.level === 'warn' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700']"
              >
                <span class="text-base">{{ al.icon }}</span>{{ t('weather.' + al.key, al.params) }}
              </div>
            </div>

            <!-- Travel suggestion (best / worst day) -->
            <div v-if="travel && daily">
              <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">🧭 {{ t('weather.travelSuggestion') }}</p>
              <div class="grid grid-cols-2 gap-2">
                <div class="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p class="text-[10px] uppercase font-bold text-green-600">😎 {{ t('weather.bestDay') }}</p>
                  <p class="text-sm font-bold text-gray-800">{{ dayName(daily.time[travel.best], travel.best) }}</p>
                  <p class="text-[11px] text-gray-500">{{ weatherInfo(daily.weather_code[travel.best]).emoji }} {{ Math.round(daily.temperature_2m_max[travel.best]) }}° · 💧{{ daily.precipitation_probability_max[travel.best] }}%</p>
                </div>
                <div class="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p class="text-[10px] uppercase font-bold text-red-600">🌧️ {{ t('weather.worstDay') }}</p>
                  <p class="text-sm font-bold text-gray-800">{{ dayName(daily.time[travel.worst], travel.worst) }}</p>
                  <p class="text-[11px] text-gray-500">{{ weatherInfo(daily.weather_code[travel.worst]).emoji }} {{ Math.round(daily.temperature_2m_max[travel.worst]) }}° · 💧{{ daily.precipitation_probability_max[travel.worst] }}%</p>
                </div>
              </div>
            </div>

            <button
              v-if="!viewProvince && districtCount(selected)"
              @click="onViewDistricts"
              type="button"
              class="w-full flex items-center justify-between gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl px-4 py-2.5 transition-colors"
            >
              <span class="text-sm font-semibold text-blue-700">
                🏘️ {{ t('weather.viewDistricts') }} <span class="text-blue-400 font-normal">({{ districtCount(selected) }})</span>
              </span>
              <span class="text-blue-400 text-sm">→</span>
            </button>

            <!-- 7-day forecast -->
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{{ t('weather.forecast7') }}</p>
              <div v-if="daily" class="divide-y divide-gray-100">
                <div v-for="(day, d) in daily.time" :key="day" class="flex items-center gap-3 py-2">
                  <p class="w-16 text-sm font-semibold text-gray-700">{{ dayName(day, d) }}</p>
                  <span class="text-xl w-8 text-center">{{ weatherInfo(daily.weather_code[d]).emoji }}</span>
                  <p class="text-xs text-blue-500 w-12">💧{{ daily.precipitation_probability_max[d] }}{{ daily.precipUnit || '%' }}</p>
                  <div class="flex-1 text-right text-sm">
                    <span class="text-gray-400">{{ Math.round(daily.temperature_2m_min[d]) }}°</span>
                    <span class="font-bold text-gray-800 ml-2">{{ Math.round(daily.temperature_2m_max[d]) }}°</span>
                  </div>
                </div>
              </div>
              <div v-else-if="detailsState === 'error'" class="flex items-center justify-between gap-2 py-3">
                <span class="text-xs text-red-500">{{ t('weather.forecastError') }}</span>
                <button @click="ensureDetails(selected)" class="text-xs font-bold text-blue-600 hover:text-blue-800 underline">{{ t('weather.retry') }}</button>
              </div>
              <div v-else class="flex items-center gap-2 text-gray-400 py-3">
                <span class="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span class="text-xs font-semibold">{{ t('weather.loadingForecast') }}</span>
              </div>
            </div>
          </div>

          <!-- ===== HOURLY (48h) ===== -->
          <div v-show="detailTab === 'hourly'">
            <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">⏱️ {{ t('weather.hourly48') }}</p>
            <div v-if="hourly.length" class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <div v-for="(h, i) in hourly" :key="h.time" class="shrink-0 w-[58px] bg-gray-50 rounded-xl py-2 text-center">
                <p class="text-[10px] font-bold text-gray-500">{{ hourLabel(h.time, i) }}</p>
                <span class="text-lg">{{ weatherInfo(h.code).emoji }}</span>
                <p class="text-sm font-bold text-gray-800">{{ Math.round(h.temp) }}°</p>
                <p class="text-[10px] text-blue-500">💧{{ h.precip }}%</p>
                <p class="text-[10px] text-gray-400">💨{{ Math.round(h.wind) }}</p>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400 text-center py-6">{{ t('weather.hourlyNa') }}</p>
          </div>

          <!-- ===== AIR & UV ===== -->
          <div v-show="detailTab === 'air'" class="space-y-3">
            <div v-if="airNow && airNow.aqi != null" :class="['rounded-2xl border p-4', aqiBand(airNow.aqi).bg]">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-[10px] uppercase font-bold text-gray-400">{{ t('weather.aqi') }} · US</p>
                  <p :class="['text-3xl font-bold leading-tight', aqiBand(airNow.aqi).cls]">{{ airNow.aqi }}</p>
                  <p :class="['text-xs font-semibold', aqiBand(airNow.aqi).cls]">{{ t('weather.' + aqiBand(airNow.aqi).key) }}</p>
                </div>
                <span class="text-4xl">{{ aqiFace(airNow.aqi) }}</span>
              </div>
              <div class="grid grid-cols-3 gap-2 mt-3 text-center">
                <div class="bg-white/60 rounded-lg py-1.5"><p class="text-[10px] text-gray-400 font-bold">PM2.5</p><p class="text-xs font-bold text-gray-700">{{ round1(airNow.pm25) }}</p></div>
                <div class="bg-white/60 rounded-lg py-1.5"><p class="text-[10px] text-gray-400 font-bold">PM10</p><p class="text-xs font-bold text-gray-700">{{ round1(airNow.pm10) }}</p></div>
                <div class="bg-white/60 rounded-lg py-1.5"><p class="text-[10px] text-gray-400 font-bold">O₃</p><p class="text-xs font-bold text-gray-700">{{ round1(airNow.ozone) }}</p></div>
              </div>
            </div>

            <div v-if="uvVal != null" class="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-[10px] uppercase font-bold text-gray-400">{{ t('weather.uvIndex') }}</p>
                  <p :class="['text-3xl font-bold leading-tight', uvBand(uvVal).cls]">{{ Math.round(uvVal) }}</p>
                  <p :class="['text-xs font-semibold', uvBand(uvVal).cls]">{{ t('weather.' + uvBand(uvVal).key) }}</p>
                </div>
                <span class="text-4xl">🌞</span>
              </div>
              <div class="mt-3 h-2 rounded-full relative" style="background: linear-gradient(to right, #4ade80, #facc15, #fb923c, #ef4444, #a855f7)">
                <span class="absolute -top-1 w-1.5 h-4 bg-gray-800 rounded-full -ml-0.5" :style="{ left: Math.min(100, (uvVal / 12) * 100) + '%' }" />
              </div>
            </div>

            <div v-if="!airNow || airNow.aqi == null" class="text-xs text-gray-400 text-center py-4">{{ t('weather.airNa') }}</div>
            <p class="text-[11px] text-gray-400 text-center">{{ t('weather.airSource') }}</p>
          </div>

          <!-- ===== RAIN RADAR ===== -->
          <div v-show="detailTab === 'radar'">
            <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">🛰️ {{ t('weather.rainRadar') }}</p>
            <div class="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
              <iframe
                v-if="detailTab === 'radar'"
                :src="radarSrc"
                class="w-full h-72"
                loading="lazy"
                referrerpolicy="no-referrer"
                title="Rain radar"
              />
            </div>
            <p class="text-[11px] text-gray-400 text-center mt-2">{{ t('weather.radarHint') }}</p>
          </div>

          <!-- ===== AGRICULTURE MODE ===== -->
          <div v-show="detailTab === 'farm'">
            <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">🌾 {{ t('weather.agriculture') }}</p>
            <div v-if="agri" class="space-y-3">
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-blue-50 rounded-xl py-3">
                  <p class="text-[10px] uppercase font-bold text-gray-400">💧 {{ t('weather.humidity') }}</p>
                  <p class="text-base font-bold text-gray-800">{{ agri.humidity }}%</p>
                </div>
                <div class="bg-sky-50 rounded-xl py-3">
                  <p class="text-[10px] uppercase font-bold text-gray-400">🌧️ {{ t('weather.rainChance') }}</p>
                  <p class="text-base font-bold text-gray-800">{{ agri.rainP }}%</p>
                </div>
                <div class="bg-teal-50 rounded-xl py-3">
                  <p class="text-[10px] uppercase font-bold text-gray-400">💨 {{ t('weather.wind') }}</p>
                  <p class="text-base font-bold text-gray-800">{{ agri.wind }}</p>
                </div>
              </div>

              <div class="bg-gray-50 rounded-xl p-3">
                <p class="text-xs font-bold text-gray-600 mb-0.5">🌧️ {{ t('weather.farmRainOutlook') }}</p>
                <p class="text-sm text-gray-700">{{ t('weather.farmRain3', { mm: agri.rainSum3 }) }}</p>
              </div>

              <div :class="['rounded-xl p-3 flex items-start gap-2', agri.sprayOk ? 'bg-green-50' : 'bg-amber-50']">
                <span class="text-base">{{ agri.sprayOk ? '✅' : '⚠️' }}</span>
                <p class="text-sm" :class="agri.sprayOk ? 'text-green-700' : 'text-amber-700'">
                  {{ agri.sprayOk ? t('weather.farmSprayGood') : t('weather.farmSprayBad') }}
                </p>
              </div>
              <div :class="['rounded-xl p-3 flex items-start gap-2', agri.needIrrigation ? 'bg-amber-50' : 'bg-blue-50']">
                <span class="text-base">{{ agri.needIrrigation ? '🚿' : '🌧️' }}</span>
                <p class="text-sm" :class="agri.needIrrigation ? 'text-amber-700' : 'text-blue-700'">
                  {{ agri.needIrrigation ? t('weather.farmIrrigate') : t('weather.farmNoIrrigate') }}
                </p>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400 text-center py-6">{{ t('weather.farmNa') }}</p>
          </div>
        </div>

        <div class="p-4 border-t border-gray-100">
          <button
            @click="selected = null"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
          >
            {{ t('weather.close') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { weatherInfo } from './provinces'
import { districts } from './districts'
import { sunFor } from './sun'
import { useCambodiaWeather } from './useCambodiaWeather'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const {
  loading, error, updatedText, hasData,
  viewProvince, openDistricts, closeDistricts, prefetchDistricts,
  detailsFor, detailsStateFor, ensureDetails,
  search, sortBy, rows,
  fetchWeather, refresh,
} = useCambodiaWeather()

const selected = ref(null)
const detailTab = ref('overview')

const details = computed(() => detailsFor(selected.value))
const detailsState = computed(() => detailsStateFor(selected.value))
const daily = computed(() => details.value?.daily || null)
const hourly = computed(() => details.value?.hourly || [])
const airNow = computed(() => details.value?.airNow || null)
const advisories = computed(() => details.value?.advisories || [])
const travel = computed(() => details.value?.travel || null)
const agri = computed(() => details.value?.agri || null)
const uvVal = computed(() => airNow.value?.uv ?? daily.value?.uv_index_max?.[0] ?? null)

const detailTabs = computed(() => [
  { id: 'overview', emoji: '📋', label: t('weather.tabOverview') },
  { id: 'hourly', emoji: '⏱️', label: t('weather.tabHourly') },
  { id: 'air', emoji: '🌫️', label: t('weather.tabAirUv') },
  { id: 'radar', emoji: '🛰️', label: t('weather.tabRadar') },
  { id: 'farm', emoji: '🌾', label: t('weather.tabFarm') },
])

watch(selected, (p) => {
  if (!p) return
  detailTab.value = 'overview'
  ensureDetails(p)
  if (!viewProvince.value) prefetchDistricts(p)
})

const districtCount = (p) => (districts[p.id] || []).length

const round1 = (v) => (v == null ? '—' : Math.round(v * 10) / 10)

// US AQI bands → colour + i18n key.
const aqiBand = (v) => {
  if (v <= 50) return { key: 'aqiGood', cls: 'text-green-600', bg: 'bg-green-50 border-green-100' }
  if (v <= 100) return { key: 'aqiModerate', cls: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' }
  if (v <= 150) return { key: 'aqiSensitive', cls: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' }
  if (v <= 200) return { key: 'aqiUnhealthy', cls: 'text-red-600', bg: 'bg-red-50 border-red-100' }
  if (v <= 300) return { key: 'aqiVeryUnhealthy', cls: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' }
  return { key: 'aqiHazardous', cls: 'text-rose-800', bg: 'bg-rose-50 border-rose-200' }
}
const aqiFace = (v) => (v <= 50 ? '😀' : v <= 100 ? '🙂' : v <= 150 ? '😐' : v <= 200 ? '😷' : '☠️')

const uvBand = (v) => {
  if (v < 3) return { key: 'uvLow', cls: 'text-green-600' }
  if (v < 6) return { key: 'uvModerate', cls: 'text-yellow-600' }
  if (v < 8) return { key: 'uvHigh', cls: 'text-orange-600' }
  if (v < 11) return { key: 'uvVeryHigh', cls: 'text-red-600' }
  return { key: 'uvExtreme', cls: 'text-purple-600' }
}

const radarSrc = computed(() => {
  const p = selected.value
  if (!p) return ''
  return `https://embed.windy.com/embed2.html?lat=${p.lat}&lon=${p.lon}` +
    `&detailLat=${p.lat}&detailLon=${p.lon}&zoom=8&level=surface&overlay=rain` +
    '&menu=&message=&marker=true&calendar=&pressure=&type=map&location=coordinates' +
    '&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1'
})

const hourLabel = (timeStr, i) => {
  if (i === 0) return t('weather.now')
  return timeStr.slice(11, 16) // 'HH:MM' — already Phnom Penh local time from the API
}

const onViewDistricts = () => {
  const province = selected.value
  selected.value = null
  openDistricts(province)
}

const icon = (p) => (p.w ? weatherInfo(p.w.current.weather_code).emoji : '⏳')
const label = (p) => (p.w ? t(`weather.codes.${weatherInfo(p.w.current.weather_code).key}`) : t('weather.loading'))

const dayName = (dateStr, index) => {
  if (index === 0) return t('weather.today')
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
}

onMounted(fetchWeather)
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
