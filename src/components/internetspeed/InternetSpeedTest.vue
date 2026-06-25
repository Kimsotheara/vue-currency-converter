<template>
  <div class="space-y-6">

    <!-- Gauge -->
    <div class="flex flex-col items-center">
      <div class="relative w-64 h-40">
        <svg viewBox="0 0 200 120" class="w-full h-full">
          <!-- Track -->
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="#e5e7eb"
            stroke-width="14"
            stroke-linecap="round"
          />
          <!-- Progress -->
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            :stroke="phaseColor"
            stroke-width="14"
            stroke-linecap="round"
            :stroke-dasharray="arcLength"
            :stroke-dashoffset="arcLength - arcLength * gaugeFraction"
            class="transition-all duration-300 ease-out"
          />
        </svg>

        <!-- Center readout -->
        <div class="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p class="text-4xl font-bold text-gray-800 tabular-nums leading-none">
            {{ displayValue }}
          </p>
          <p class="text-sm font-semibold text-gray-400 mt-1">{{ displayUnit }}</p>
        </div>
      </div>

      <p class="text-sm font-semibold mt-2" :style="{ color: phaseColor }">
        {{ phaseLabel }}
      </p>
    </div>

    <!-- Action button -->
    <button
      @click="running ? null : start()"
      :disabled="running"
      :class="[
        'w-full font-semibold py-3 rounded-xl transition-colors',
        running
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white',
      ]"
    >
      {{ running ? t('speedtest.testing') : (phase === 'done' ? t('speedtest.testAgain') : t('speedtest.startTest')) }}
    </button>

    <!-- Results grid -->
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="metric in metrics"
        :key="metric.key"
        :class="[
          'rounded-2xl p-4 border transition-colors',
          phase === metric.activePhase && running
            ? 'border-blue-300 bg-blue-50'
            : 'border-gray-200 bg-gray-50',
        ]"
      >
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">{{ metric.icon }}</span>
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">{{ metric.label }}</span>
        </div>
        <p class="text-2xl font-bold text-gray-800 tabular-nums">
          {{ metric.value == null ? '—' : metric.value }}
          <span v-if="metric.value != null" class="text-sm font-semibold text-gray-400">{{ metric.unit }}</span>
        </p>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-500 font-medium text-center">{{ error }}</p>

    <p class="text-xs text-gray-400 text-center leading-relaxed">
      {{ t('speedtest.disclaimer') }}
    </p>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSpeedTest } from './useSpeedTest.js'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const {
  phase, error, liveSpeed, running,
  ping, jitter, download, upload,
  start,
} = useSpeedTest()

const metrics = computed(() => [
  { key: 'ping',     label: t('speedtest.ping'),     icon: '📡', unit: 'ms',   value: ping.value,     activePhase: 'ping' },
  { key: 'jitter',   label: t('speedtest.jitter'),   icon: '〰️', unit: 'ms',   value: jitter.value,   activePhase: 'ping' },
  { key: 'download', label: t('speedtest.download'), icon: '⬇️', unit: 'Mbps', value: download.value, activePhase: 'download' },
  { key: 'upload',   label: t('speedtest.upload'),   icon: '⬆️', unit: 'Mbps', value: upload.value,   activePhase: 'upload' },
])

const isPingPhase = computed(() => phase.value === 'ping')

const displayValue = computed(() => {
  if (phase.value === 'idle') return '0'
  if (phase.value === 'done') return download.value ?? '0'
  return liveSpeed.value
})

const displayUnit = computed(() => (isPingPhase.value ? 'ms' : 'Mbps'))

const phaseLabel = computed(() => ({
  idle: t('speedtest.phaseIdle'),
  ping: t('speedtest.phasePing'),
  download: t('speedtest.phaseDownload'),
  upload: t('speedtest.phaseUpload'),
  done: t('speedtest.phaseDone'),
}[phase.value]))

const phaseColor = computed(() => ({
  idle: '#9ca3af',
  ping: '#8b5cf6',
  download: '#2563eb',
  upload: '#059669',
  done: '#2563eb',
}[phase.value]))

// Half-circle arc length for r = 80  ->  π * r
const arcLength = Math.PI * 80

// Map the live value onto the gauge with a log scale so both slow and fast
// connections read sensibly. Ping uses a smaller (inverted-feel) scale.
const gaugeFraction = computed(() => {
  if (phase.value === 'idle') return 0
  if (phase.value === 'done') return clampLog(download.value, 1000)
  if (isPingPhase.value) return Math.min(1, liveSpeed.value / 300)
  return clampLog(liveSpeed.value, 1000)
})

function clampLog(value, max) {
  if (!value || value <= 0) return 0
  return Math.min(1, Math.log10(value + 1) / Math.log10(max + 1))
}
</script>
