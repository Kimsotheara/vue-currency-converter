<template>
  <div class="-mx-1 sm:-mx-2" :class="{ 'ft-light': !dark }">
    <!-- ===== Header ===== -->
    <div class="rounded-t-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-5 pt-5 pb-4">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-2xl shrink-0">
          {{ activeLeague?.emoji }}
        </div>
        <div class="min-w-0">
          <h2 class="text-white text-lg font-bold leading-tight truncate">
            {{ leagueName || activeLeague?.name }}
          </h2>
          <p class="text-slate-400 text-xs font-medium">Live Scores & Results</p>
        </div>
        <button
          @click="toggleTheme"
          class="ml-auto shrink-0 w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center text-white text-base"
          :title="dark ? 'Switch to light' : 'Switch to dark'"
        >
          {{ dark ? '☀️' : '🌙' }}
        </button>
        <button
          @click="fetchScores()"
          :disabled="loading"
          class="shrink-0 w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center text-white disabled:opacity-50"
          title="Refresh"
        >
          <span class="text-base" :class="{ 'animate-spin': loading }">↻</span>
        </button>
      </div>

      <!-- League chips -->
      <div class="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        <button
          v-for="l in leagues"
          :key="l.slug"
          @click="selectLeague(l.slug)"
          :class="[
            'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap',
            l.slug === leagueSlug
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-slate-300 hover:bg-white/20',
          ]"
        >
          <span>{{ l.emoji }}</span>{{ l.short }}
        </button>
      </div>
    </div>

    <!-- ===== Date bar ===== -->
    <div class="bg-slate-800 px-5 py-2.5 flex items-center justify-between border-t border-white/5">
      <button :class="navBtn" @click="shiftDay(-1)" title="Previous day">‹</button>
      <button
        @click="goToday"
        class="flex items-center gap-2 text-sm font-semibold text-white px-3 py-1 rounded-lg hover:bg-white/10 transition"
      >
        <span>📅</span>{{ dateLabel }}
        <span v-if="liveCount" class="inline-flex items-center gap-1 text-red-400 text-xs">
          <span class="live-dot" />{{ liveCount }} live
        </span>
      </button>
      <button :class="navBtn" @click="shiftDay(1)" title="Next day">›</button>
    </div>

    <!-- ===== Body ===== -->
    <div class="ft-body bg-slate-900 rounded-b-2xl px-4 sm:px-5 pt-4 pb-5 min-h-[260px]">
      <!-- Loading -->
      <div v-if="loading && !events.length" class="space-y-3 animate-pulse">
        <div class="h-44 rounded-2xl bg-slate-800/70" />
        <div class="grid sm:grid-cols-2 gap-3">
          <div class="h-20 rounded-xl bg-slate-800/70" />
          <div class="h-20 rounded-xl bg-slate-800/70" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-12">
        <p class="text-4xl mb-3">📡</p>
        <p class="text-slate-300 text-sm mb-4">{{ error }}</p>
        <button
          @click="fetchScores()"
          class="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition"
        >
          Retry
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="!events.length" class="text-center py-12">
        <p class="text-5xl mb-3">⚽</p>
        <p class="text-slate-400 text-sm">No matches for {{ dateLabel.toLowerCase() }} in this league.</p>
        <p class="text-slate-600 text-xs mt-1">Try another day or league above.</p>
      </div>

      <template v-else>
        <!-- ===== Featured match ===== -->
        <div v-if="featured" class="rounded-2xl bg-gradient-to-b from-slate-800 to-slate-800/40 ring-1 ring-white/5 p-5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 truncate">{{ leagueName }} · {{ dateLabel }}</span>
            <span :class="statusClass(featured)" class="font-semibold shrink-0 inline-flex items-center gap-1.5">
              <span v-if="featured.live" class="live-dot" />{{ statusText(featured) }}
            </span>
          </div>

          <div class="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <!-- Home -->
            <div class="flex flex-col items-center text-center gap-2">
              <img v-if="featured.home.logo" :src="featured.home.logo" :alt="featured.home.name"
                   class="w-16 h-16 object-contain" loading="lazy" />
              <span class="text-white font-bold text-sm leading-tight">{{ featured.home.name }}</span>
            </div>
            <!-- Score -->
            <div class="px-2 sm:px-4 text-center">
              <div v-if="featured.state !== 'pre'" class="flex items-end gap-2 sm:gap-3 text-white font-bold tabular-nums">
                <span class="text-5xl" :class="{ 'opacity-50': featured.completed && !featured.home.winner }">{{ featured.home.score }}</span>
                <span class="text-2xl text-slate-500 pb-1">-</span>
                <span class="text-5xl" :class="{ 'opacity-50': featured.completed && !featured.away.winner }">{{ featured.away.score }}</span>
              </div>
              <div v-else class="text-2xl font-bold text-white tabular-nums">{{ kickoff(featured) }}</div>
            </div>
            <!-- Away -->
            <div class="flex flex-col items-center text-center gap-2">
              <img v-if="featured.away.logo" :src="featured.away.logo" :alt="featured.away.name"
                   class="w-16 h-16 object-contain" loading="lazy" />
              <span class="text-white font-bold text-sm leading-tight">{{ featured.away.name }}</span>
            </div>
          </div>

          <!-- Scorers -->
          <div
            v-if="featured.homeScorers.length || featured.awayScorers.length"
            class="mt-5 pt-4 border-t border-white/5 grid grid-cols-[1fr_auto_1fr] gap-3 items-start text-xs"
          >
            <ul class="space-y-1.5 text-left text-slate-300">
              <li v-for="(s, i) in featured.homeScorers" :key="'h'+i">
                ⚽ {{ scorerText(s) }}
                <span v-if="assistFor(s)" class="block text-[10px] text-slate-500">↳ assist {{ assistFor(s) }}</span>
              </li>
            </ul>
            <span class="text-slate-500 pt-0.5">⚽</span>
            <ul class="space-y-1.5 text-right text-slate-300">
              <li v-for="(s, i) in featured.awayScorers" :key="'a'+i">
                {{ scorerText(s) }} ⚽
                <span v-if="assistFor(s)" class="block text-[10px] text-slate-500">{{ assistFor(s) }} assist ↳</span>
              </li>
            </ul>
          </div>

          <!-- Prediction -->
          <div v-if="prediction" class="mt-5 pt-4 border-t border-white/5">
            <div class="flex items-center justify-between text-[11px] mb-2">
              <span class="text-slate-400 font-semibold uppercase tracking-wider">🔮 Prediction</span>
              <span v-if="prediction.provider" class="text-slate-600">via {{ prediction.provider }}</span>
            </div>
            <div class="flex h-2.5 rounded-full overflow-hidden bg-slate-700">
              <div class="bg-emerald-500" :style="{ width: prediction.home + '%' }" />
              <div class="bg-slate-400" :style="{ width: prediction.draw + '%' }" />
              <div class="bg-sky-500" :style="{ width: prediction.away + '%' }" />
            </div>
            <div class="flex justify-between mt-1.5 text-[11px] font-semibold">
              <span class="text-emerald-400">{{ featured.home.short || 'Home' }} {{ prediction.home }}%</span>
              <span class="text-slate-300">Draw {{ prediction.draw }}%</span>
              <span class="text-sky-400">{{ featured.away.short || 'Away' }} {{ prediction.away }}%</span>
            </div>
          </div>

          <p v-if="featured.venue" class="mt-4 text-center text-[11px] text-slate-500 truncate">📍 {{ featured.venue }}</p>

          <button
            @click="openLineup(featured)"
            class="mt-4 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.99] text-white text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            📋 Line-up · Form · H2H
          </button>
        </div>

        <!-- ===== Other matches ===== -->
        <div v-if="others.length" class="mt-4">
          <p class="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 px-1">Other matches</p>
          <div class="grid sm:grid-cols-2 gap-2.5">
            <div
              v-for="m in others"
              :key="m.id"
              class="rounded-xl bg-slate-800/60 hover:bg-slate-800 ring-1 ring-white/5 p-3 transition"
            >
              <div class="flex items-center justify-between mb-1">
                <span :class="statusClass(m)" class="text-[10px] font-semibold inline-flex items-center gap-1">
                  <span v-if="m.live" class="live-dot" />{{ statusText(m) }}
                </span>
              </div>
              <div class="space-y-1.5">
                <div class="flex items-center gap-2" :class="rowDim(m, 'home')">
                  <img v-if="m.home.logo" :src="m.home.logo" class="w-5 h-5 object-contain shrink-0" loading="lazy" />
                  <span class="text-sm text-white truncate flex-1">{{ m.home.name }}</span>
                  <span class="text-sm font-bold text-white tabular-nums w-5 text-right">{{ scoreCell(m, 'home') }}</span>
                </div>
                <div class="flex items-center gap-2" :class="rowDim(m, 'away')">
                  <img v-if="m.away.logo" :src="m.away.logo" class="w-5 h-5 object-contain shrink-0" loading="lazy" />
                  <span class="text-sm text-white truncate flex-1">{{ m.away.name }}</span>
                  <span class="text-sm font-bold text-white tabular-nums w-5 text-right">{{ scoreCell(m, 'away') }}</span>
                </div>
              </div>
              <button
                @click="openLineup(m)"
                class="mt-2.5 w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-[11px] font-semibold transition"
              >
                📋 Details
              </button>
            </div>
          </div>
        </div>

        <p v-if="updatedText" class="mt-4 text-center text-[11px] text-slate-600">
          Updated {{ updatedText }}<span v-if="liveCount"> · auto-refreshing</span>
        </p>
      </template>
    </div>

    <!-- Match details modal: line-up · last 10 · head-to-head -->
    <MatchDetails
      v-if="lineupEvent"
      :dark="dark"
      :event="lineupEvent"
      :state="detailsStateFor(lineupEvent.id)"
      :teams="lineupFor(lineupEvent.id)"
      :form="formFor(lineupEvent.id)"
      :h2h="h2hFor(lineupEvent.id)"
      :assists="assistsFor(lineupEvent.id)"
      :ratingSource="ratingSourceFor(lineupEvent.id)"
      @close="closeLineup"
      @retry="retryLineup"
    />
  </div>
</template>

<script setup>
import { onMounted, watch, computed } from 'vue'
import { useFootballScores } from './useFootballScores'
import MatchDetails from './MatchDetails.vue'

const {
  dark, toggleTheme,
  leagues, leagueSlug, activeLeague, leagueName,
  dateLabel, events, featured, others, liveCount,
  loading, error, updatedText,
  fetchScores, selectLeague, shiftDay, goToday,
  lineupEvent, openLineup, closeLineup, retryLineup,
  lineupFor, detailsStateFor,
  ensurePrediction, predictionFor, assistsFor,
  h2hFor, formFor, ratingSourceFor,
} = useFootballScores()

onMounted(fetchScores)

// Pull the match prediction for whichever game is featured.
watch(featured, (m) => { if (m) ensurePrediction(m) }, { immediate: true })
const prediction = computed(() => (featured.value ? predictionFor(featured.value.id) : null))
const assists = computed(() => (featured.value ? assistsFor(featured.value.id) : null))
const assistFor = (s) => assists.value?.[s.name?.toLowerCase()] || ''

const statusText = (m) => {
  if (m.live) return m.detail || 'LIVE'
  if (m.completed) return m.detail || 'FT'
  return 'Scheduled'
}
const statusClass = (m) =>
  m.live ? 'text-red-400' : m.completed ? 'text-slate-400' : 'text-emerald-400'

const kickoff = (m) =>
  new Date(m.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

const scoreCell = (m, side) => (m.state === 'pre' ? '–' : m[side].score)

const rowDim = (m, side) =>
  m.completed && !m[side].winner && m.home.score !== m.away.score ? 'opacity-55' : ''

const scorerText = (s) => {
  const tag = s.own ? ' (OG)' : s.pen ? ' (P)' : ''
  return `${s.name}${tag} ${s.clock}'`
}

const navBtn =
  'w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white text-xl leading-none flex items-center justify-center transition'
</script>

<style scoped>
.live-dot {
  width: 7px; height: 7px; border-radius: 9999px; background: #f87171;
  display: inline-block; animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* ===== Light theme (header stays dark, body flips) ===== */
.ft-light .ft-body { background: #ffffff; }
.ft-light .ft-body .text-white { color: #0f172a; }
.ft-light .ft-body .text-slate-300 { color: #334155; }
.ft-light .ft-body .text-slate-400 { color: #64748b; }
.ft-light .ft-body .text-slate-500 { color: #94a3b8; }
.ft-light .ft-body .text-slate-600 { color: #94a3b8; }
.ft-light .ft-body .bg-gradient-to-b { background-image: none; background-color: #f8fafc; }
.ft-light .ft-body .bg-slate-800\/70 { background-color: #e2e8f0; }
.ft-light .ft-body .bg-slate-800\/60 { background-color: #f8fafc; }
.ft-light .ft-body .hover\:bg-slate-800:hover { background-color: #f1f5f9; }
.ft-light .ft-body .bg-slate-700 { background-color: #e2e8f0; }
.ft-light .ft-body .bg-white\/10 { background-color: #f1f5f9; }
.ft-light .ft-body .bg-white\/5 { background-color: #f1f5f9; }
.ft-light .ft-body .hover\:bg-white\/20:hover { background-color: #e2e8f0; }
.ft-light .ft-body .hover\:bg-white\/15:hover { background-color: #e2e8f0; }
.ft-light .ft-body .hover\:text-white:hover { color: #0f172a; }
.ft-light .ft-body .border-white\/5 { border-color: #e2e8f0; }
.ft-light .ft-body .ring-white\/5 { --tw-ring-color: #e2e8f0; }
</style>
