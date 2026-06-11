<template>
  <div class="space-y-4">

    <div v-if="viewProvince" class="flex items-center gap-3">
      <button
        @click="closeDistricts"
        type="button"
        class="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors shrink-0"
      >
        ← Provinces
      </button>
      <p class="text-sm font-bold text-gray-800 truncate">
        🏘️ {{ viewProvince.name }} <span class="text-gray-400 font-normal">{{ viewProvince.km }}</span>
      </p>
    </div>

    <div class="flex items-center gap-2">
      <input
        v-model="search"
        type="text"
        :placeholder="viewProvince ? 'Search district…' : 'Search province… (e.g. Siem Reap / សៀមរាប)'"
        class="flex-1 min-w-0 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <div class="flex bg-gray-100 rounded-full p-0.5 shrink-0">
        <button
          v-for="opt in [{ value: 'name', label: 'A-Z' }, { value: 'temp', label: '🌡️ Hot' }]"
          :key="opt.value"
          type="button"
          @click="sortBy = opt.value"
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150',
            sortBy === opt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div class="flex items-center justify-between gap-2">
      <p class="text-xs text-gray-400">
        <template v-if="updatedText">Updated {{ updatedText }} · Asia/Phnom_Penh</template>
      </p>
      <button
        @click="refresh"
        :disabled="loading"
        class="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:text-gray-300 transition-colors"
      >
        {{ loading ? 'Refreshing…' : '↻ Refresh' }}
      </button>
    </div>

    <div v-if="error" class="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-center justify-between gap-3">
      <p class="text-sm text-red-600">{{ error }}</p>
      <button @click="refresh" class="text-sm font-bold text-red-600 underline shrink-0">Retry</button>
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
      Nothing matches "{{ search }}"
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
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-gray-50 rounded-xl py-2.5">
              <p class="text-[10px] uppercase tracking-wide text-gray-400 font-bold">Feels like</p>
              <p class="text-sm font-bold text-gray-700">{{ Math.round(selected.w.current.apparent_temperature) }}°C</p>
            </div>
            <div class="bg-gray-50 rounded-xl py-2.5">
              <p class="text-[10px] uppercase tracking-wide text-gray-400 font-bold">Humidity</p>
              <p class="text-sm font-bold text-gray-700">{{ selected.w.current.relative_humidity_2m }}%</p>
            </div>
            <div class="bg-gray-50 rounded-xl py-2.5">
              <p class="text-[10px] uppercase tracking-wide text-gray-400 font-bold">Wind</p>
              <p class="text-sm font-bold text-gray-700">{{ Math.round(selected.w.current.wind_speed_10m) }} km/h</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-center">
            <div class="bg-amber-50 border border-amber-100 rounded-xl py-2.5">
              <p class="text-[10px] uppercase tracking-wide text-amber-500 font-bold">🌅 Sunrise</p>
              <p class="text-sm font-bold text-gray-700">{{ sunFor(selected).sunrise }}</p>
            </div>
            <div class="bg-orange-50 border border-orange-100 rounded-xl py-2.5">
              <p class="text-[10px] uppercase tracking-wide text-orange-500 font-bold">🌇 Sunset</p>
              <p class="text-sm font-bold text-gray-700">{{ sunFor(selected).sunset }}</p>
            </div>
          </div>

          <button
            v-if="!viewProvince && districtCount(selected)"
            @click="onViewDistricts"
            type="button"
            class="w-full flex items-center justify-between gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl px-4 py-2.5 transition-colors"
          >
            <span class="text-sm font-semibold text-blue-700">
              🏘️ View Districts <span class="text-blue-400 font-normal">({{ districtCount(selected) }})</span>
            </span>
            <span class="text-blue-400 text-sm">→</span>
          </button>

          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">7-Day Forecast</p>
            <div v-if="daily" class="divide-y divide-gray-100">
              <div
                v-for="(day, d) in daily.time"
                :key="day"
                class="flex items-center gap-3 py-2"
              >
                <p class="w-16 text-sm font-semibold text-gray-700">{{ dayName(day, d) }}</p>
                <span class="text-xl w-8 text-center">{{ weatherInfo(daily.weather_code[d]).emoji }}</span>
                <p class="text-xs text-blue-500 w-12">💧{{ daily.precipitation_probability_max[d] }}{{ daily.precipUnit || '%' }}</p>
                <div class="flex-1 text-right text-sm">
                  <span class="text-gray-400">{{ Math.round(daily.temperature_2m_min[d]) }}°</span>
                  <span class="font-bold text-gray-800 ml-2">{{ Math.round(daily.temperature_2m_max[d]) }}°</span>
                </div>
              </div>
            </div>
            <div v-else-if="dailyStateFor(selected) === 'error'" class="flex items-center justify-between gap-2 py-3">
              <span class="text-xs text-red-500">Could not load the forecast</span>
              <button
                @click="ensureDaily(selected)"
                class="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
              >
                Retry
              </button>
            </div>
            <div v-else class="flex items-center gap-2 text-gray-400 py-3">
              <span class="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span class="text-xs font-semibold">Loading forecast…</span>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-100">
          <button
            @click="selected = null"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
          >
            Close
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

const {
  loading, error, updatedText, hasData,
  viewProvince, openDistricts, closeDistricts, prefetchDistricts,
  dailyFor, dailyStateFor, ensureDaily,
  search, sortBy, rows,
  fetchWeather, refresh,
} = useCambodiaWeather()

const selected = ref(null)
const daily = computed(() => dailyFor(selected.value))
watch(selected, (p) => {
  if (!p) return
  ensureDaily(p)
  if (!viewProvince.value) prefetchDistricts(p)
})

const districtCount = (p) => (districts[p.id] || []).length

const onViewDistricts = () => {
  const province = selected.value
  selected.value = null
  openDistricts(province)
}

const icon = (p) => (p.w ? weatherInfo(p.w.current.weather_code).emoji : '⏳')
const label = (p) => (p.w ? weatherInfo(p.w.current.weather_code).label : 'Loading…')

const dayName = (dateStr, index) => {
  if (index === 0) return 'Today'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
}

onMounted(fetchWeather)
</script>
