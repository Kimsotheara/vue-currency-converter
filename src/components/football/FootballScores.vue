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
          <p class="text-slate-400 text-xs font-medium">{{ t('football.liveScores') }}</p>
        </div>
        <button
          @click="toggleTheme"
          class="ml-auto shrink-0 w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center text-white text-base"
          :title="dark ? t('football.switchLight') : t('football.switchDark')"
        >
          {{ dark ? '☀️' : '🌙' }}
        </button>
        <button
          @click="refreshCurrent()"
          :disabled="busy"
          class="shrink-0 w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center text-white disabled:opacity-50"
          :title="t('football.refresh')"
        >
          <span class="text-base" :class="{ 'animate-spin': busy }">↻</span>
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
              ? 'bg-emerald-500 text-white'
              : 'bg-white/10 text-slate-300 hover:bg-white/20',
          ]"
        >
          <span>{{ l.emoji }}</span>{{ l.short }}
        </button>
      </div>
    </div>

    <!-- ===== View tabs ===== -->
    <div class="bg-slate-800 px-3 pt-2 flex gap-1 border-t border-white/5">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="setView(tab.id)"
        :class="[
          'flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-t-lg text-xs font-semibold transition border-b-2',
          view === tab.id
            ? 'text-white border-emerald-500 bg-white/5'
            : 'text-slate-400 border-transparent hover:text-slate-200',
        ]"
      >
        <span>{{ tab.emoji }}</span>{{ tab.label }}
      </button>
    </div>

    <!-- ===== Date bar (scores only) ===== -->
    <div v-if="view === 'scores'" class="bg-slate-800 px-5 py-2.5 flex items-center justify-between border-t border-white/5">
      <button :class="navBtn" @click="shiftDay(-1)" :title="t('football.prevDay')">‹</button>
      <button
        @click="goToday"
        class="flex items-center gap-2 text-sm font-semibold text-white px-3 py-1 rounded-lg hover:bg-white/10 transition"
      >
        <span>📅</span>{{ dateLabel }}
        <span v-if="liveCount" class="inline-flex items-center gap-1 text-red-400 text-xs">
          <span class="live-dot" />{{ t('football.liveCount', { n: liveCount }) }}
        </span>
      </button>
      <button :class="navBtn" @click="shiftDay(1)" :title="t('football.nextDay')">›</button>
    </div>

    <!-- ===== Body ===== -->
    <div class="ft-body bg-slate-900 rounded-b-2xl px-4 sm:px-5 pt-4 pb-5 min-h-[260px]">
      <!-- ============ SCORES ============ -->
      <template v-if="view === 'scores'">
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
          {{ t('football.retry') }}
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="!events.length" class="text-center py-12">
        <p class="text-5xl mb-3">⚽</p>
        <p class="text-slate-400 text-sm">{{ t('football.noMatches', { day: dateLabel.toLowerCase() }) }}</p>
        <p class="text-slate-600 text-xs mt-1">{{ t('football.tryAnother') }}</p>
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
                <span v-if="assistFor(s)" class="block text-[10px] text-slate-500">↳ {{ t('football.assist') }} {{ assistFor(s) }}</span>
              </li>
            </ul>
            <span class="text-slate-500 pt-0.5">⚽</span>
            <ul class="space-y-1.5 text-right text-slate-300">
              <li v-for="(s, i) in featured.awayScorers" :key="'a'+i">
                {{ scorerText(s) }} ⚽
                <span v-if="assistFor(s)" class="block text-[10px] text-slate-500">{{ assistFor(s) }} {{ t('football.assist') }} ↳</span>
              </li>
            </ul>
          </div>

          <!-- Match stats (possession / shots on target) -->
          <div v-if="matchStats" class="mt-5 pt-4 border-t border-white/5 space-y-2">
            <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">📊 {{ t('football.stats') }}</div>
            <div v-for="row in statRows" :key="row.label" class="flex items-center text-[11px]">
              <span class="w-10 text-left font-semibold text-emerald-400">{{ row.home }}</span>
              <span class="flex-1 text-center text-slate-400">{{ row.label }}</span>
              <span class="w-10 text-right font-semibold text-sky-400">{{ row.away }}</span>
            </div>
          </div>

          <!-- Prediction -->
          <div v-if="prediction" class="mt-5 pt-4 border-t border-white/5">
            <div class="flex items-center justify-between text-[11px] mb-2">
              <span class="text-slate-400 font-semibold uppercase tracking-wider">🔮 {{ t('football.prediction') }}</span>
              <span v-if="prediction.provider" class="text-slate-600">{{ t('football.via', { provider: prediction.provider }) }}</span>
            </div>
            <div class="flex h-2.5 rounded-full overflow-hidden bg-slate-700">
              <div class="bg-emerald-500" :style="{ width: prediction.home + '%' }" />
              <div class="bg-slate-400" :style="{ width: prediction.draw + '%' }" />
              <div class="bg-sky-500" :style="{ width: prediction.away + '%' }" />
            </div>
            <div class="flex justify-between mt-1.5 text-[11px] font-semibold">
              <span class="text-emerald-400">{{ featured.home.short || t('football.home') }} {{ prediction.home }}%</span>
              <span class="text-slate-300">{{ t('football.draw') }} {{ prediction.draw }}%</span>
              <span class="text-sky-400">{{ featured.away.short || t('football.away') }} {{ prediction.away }}%</span>
            </div>
          </div>

          <p v-if="featured.venue" class="mt-4 text-center text-[11px] text-slate-500 truncate">📍 {{ featured.venue }}</p>

          <button
            @click="openLineup(featured)"
            class="mt-4 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.99] text-white text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            📋 {{ t('football.lineupFormH2h') }}
          </button>
        </div>

        <!-- ===== Other matches ===== -->
        <div v-if="others.length" class="mt-4">
          <p class="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 px-1">{{ t('football.otherMatches') }}</p>
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
                📋 {{ t('football.details') }}
              </button>
            </div>
          </div>
        </div>

        <p v-if="updatedText" class="mt-4 text-center text-[11px] text-slate-600">
          {{ t('football.updated', { time: updatedText }) }}<span v-if="liveCount"> · {{ t('football.autoRefreshing') }}</span>
        </p>
      </template>
      </template>

      <!-- ============ LEAGUE TABLE ============ -->
      <template v-else-if="view === 'table'">
        <div v-if="tableLoading && !table" class="space-y-2 animate-pulse">
          <div v-for="n in 8" :key="n" class="h-9 rounded-lg bg-slate-800/70" />
        </div>
        <div v-else-if="tableError" class="text-center py-12">
          <p class="text-4xl mb-3">📊</p>
          <p class="text-slate-400 text-sm mb-4">{{ tableError }}</p>
          <button @click="refreshCurrent()" class="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition">{{ t('football.retry') }}</button>
        </div>
        <div v-else-if="table">
          <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="text-white text-sm font-bold">📊 {{ t('football.standings') }}</h3>
            <span class="text-slate-500 text-[11px] font-semibold">{{ seasonText(table.season) }}</span>
          </div>

          <div v-for="(g, gi) in table.groups" :key="gi" :class="{ 'mt-5': gi }">
            <p v-if="table.groups.length > 1" class="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1.5 px-1">{{ g.name }}</p>
            <table class="w-full text-xs">
              <thead>
                <tr class="text-slate-500 text-[10px] uppercase tracking-wider">
                  <th class="font-semibold text-left py-1.5 pl-1 w-6">#</th>
                  <th class="font-semibold text-left py-1.5">{{ t('football.team') }}</th>
                  <th class="font-semibold text-center py-1.5 w-7">P</th>
                  <th class="font-semibold text-center py-1.5 w-7 hidden sm:table-cell">W</th>
                  <th class="font-semibold text-center py-1.5 w-7 hidden sm:table-cell">D</th>
                  <th class="font-semibold text-center py-1.5 w-7 hidden sm:table-cell">L</th>
                  <th class="font-semibold text-center py-1.5 w-9 hidden md:table-cell">GF</th>
                  <th class="font-semibold text-center py-1.5 w-9 hidden md:table-cell">GA</th>
                  <th class="font-semibold text-center py-1.5 w-8">GD</th>
                  <th class="font-semibold text-right py-1.5 pr-1 w-9">Pts</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in g.rows" :key="r.team.id" class="border-t border-white/5">
                  <td class="py-1.5 pl-1 relative">
                    <span v-if="r.note" class="absolute left-0 top-1 bottom-1 w-0.5 rounded" :style="{ background: r.note.color }" :title="r.note.text" />
                    <span class="text-slate-400 font-semibold tabular-nums">{{ r.rank }}</span>
                  </td>
                  <td class="py-1.5">
                    <div class="flex items-center gap-2 min-w-0">
                      <img v-if="r.team.logo" :src="r.team.logo" class="w-5 h-5 object-contain shrink-0" loading="lazy" :alt="r.team.name" />
                      <span class="text-white truncate">{{ r.team.name }}</span>
                    </div>
                  </td>
                  <td class="text-center text-slate-300 tabular-nums">{{ r.gp }}</td>
                  <td class="text-center text-slate-300 tabular-nums hidden sm:table-cell">{{ r.w }}</td>
                  <td class="text-center text-slate-300 tabular-nums hidden sm:table-cell">{{ r.d }}</td>
                  <td class="text-center text-slate-300 tabular-nums hidden sm:table-cell">{{ r.l }}</td>
                  <td class="text-center text-slate-300 tabular-nums hidden sm:table-cell">{{ r.gf }}</td>
                  <td class="text-center text-slate-300 tabular-nums hidden sm:table-cell">{{ r.ga }}</td>
                  <td class="text-center tabular-nums" :class="r.gd > 0 ? 'text-emerald-400' : r.gd < 0 ? 'text-red-400' : 'text-slate-400'">{{ r.gd > 0 ? '+' + r.gd : r.gd }}</td>
                  <td class="text-right pr-1 font-bold text-white tabular-nums">{{ r.pts }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Qualification legend -->
          <div v-if="legend.length" class="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-x-4 gap-y-1.5">
            <span v-for="lg in legend" :key="lg.text" class="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
              <span class="w-2.5 h-2.5 rounded-sm shrink-0" :style="{ background: lg.color }" />{{ lg.text }}
            </span>
          </div>
        </div>
      </template>

      <!-- ============ TOP SCORERS ============ -->
      <template v-else-if="view === 'scorers'">
        <div v-if="scorersLoading && !scorers" class="space-y-2 animate-pulse">
          <div v-for="n in 8" :key="n" class="h-12 rounded-xl bg-slate-800/70" />
        </div>
        <div v-else-if="scorersError" class="text-center py-12">
          <p class="text-4xl mb-3">👟</p>
          <p class="text-slate-400 text-sm mb-4">{{ scorersError }}</p>
          <button @click="refreshCurrent()" class="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition">{{ t('football.retry') }}</button>
        </div>
        <div v-else-if="scorers">
          <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="text-white text-sm font-bold">👟 {{ t('football.topScorers') }}</h3>
            <span class="text-slate-500 text-[11px] font-semibold">{{ seasonText(table?.season) }}</span>
          </div>
          <div class="space-y-1.5">
            <div
              v-for="p in scorers"
              :key="p.rank"
              class="flex items-center gap-3 rounded-xl bg-slate-800/60 ring-1 ring-white/5 px-3 py-2"
            >
              <span class="w-5 text-center text-sm font-bold tabular-nums shrink-0"
                    :class="p.rank === 1 ? 'text-amber-400' : p.rank <= 3 ? 'text-slate-300' : 'text-slate-500'">{{ p.rank }}</span>
              <img v-if="p.flag" :src="p.flag" class="w-5 h-4 object-cover rounded-sm shrink-0" loading="lazy" alt="" />
              <div class="min-w-0 flex-1">
                <p class="text-white text-sm font-semibold leading-tight truncate">{{ p.name }}</p>
                <p class="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                  <img v-if="p.team.logo" :src="p.team.logo" class="w-3.5 h-3.5 object-contain" loading="lazy" alt="" />
                  <span class="truncate">{{ p.team.name || p.team.abbr }}</span>
                  <span v-if="p.pos" class="text-slate-600">· {{ p.pos }}</span>
                </p>
              </div>
              <div class="text-right shrink-0 leading-tight">
                <div class="text-emerald-400 font-bold text-lg tabular-nums">{{ p.goals }}</div>
                <div class="text-slate-500 text-[10px]">
                  <span v-if="p.assists">{{ p.assists }} {{ t('football.assistsShort') }}</span>
                  <span v-if="p.assists && p.matches"> · </span>
                  <span v-if="p.matches">{{ p.matches }} {{ t('football.appsShort') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      :stats="statsFor(lineupEvent.id)"
      :assists="assistsFor(lineupEvent.id)"
      :ratingSource="ratingSourceFor(lineupEvent.id)"
      @close="closeLineup"
      @retry="retryLineup"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, computed } from 'vue'
import { useFootballScores } from './useFootballScores'
import MatchDetails from './MatchDetails.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const {
  dark, toggleTheme,
  leagues, leagueSlug, activeLeague, leagueName,
  dateLabel, events, featured, others, liveCount,
  loading, error, updatedText,
  view, setView, refreshCurrent,
  table, scorers, tableLoading, scorersLoading, tableError, scorersError,
  fetchScores, selectLeague, shiftDay, goToday,
  lineupEvent, openLineup, closeLineup, retryLineup,
  lineupFor, detailsStateFor,
  ensurePrediction, predictionFor, statsFor, assistsFor,
  h2hFor, formFor, ratingSourceFor,
} = useFootballScores()

onMounted(fetchScores)

const tabs = computed(() => [
  { id: 'scores', emoji: '⚽', label: t('football.tabScores') },
  { id: 'table', emoji: '📊', label: t('football.tabTable') },
  { id: 'scorers', emoji: '👟', label: t('football.tabScorers') },
])

// Spin/disable the header refresh button while the active view is loading.
const busy = computed(() =>
  view.value === 'table' ? tableLoading.value
    : view.value === 'scorers' ? scorersLoading.value
    : loading.value,
)

// ESPN season year N is the "N–N+1" campaign, e.g. 2025 → "2025-26".
const seasonText = (s) => (s ? `${s}-${String(s + 1).slice(-2)}` : '')

// Distinct qualification markers (Champions League / relegation …) for the legend.
const legend = computed(() => {
  if (!table.value) return []
  const seen = new Map()
  for (const g of table.value.groups)
    for (const r of g.rows)
      if (r.note?.text && !seen.has(r.note.text)) seen.set(r.note.text, r.note.color)
  return [...seen].map(([text, color]) => ({ text, color }))
})

// Make the device/browser Back button (and back-swipe) close the lineup modal
// instead of leaving the app. We push a history entry when the modal opens and
// pop it when it closes, keeping the back stack clean.
const onPopState = () => { if (lineupEvent.value) closeLineup() }
watch(lineupEvent, (open, wasOpen) => {
  if (open && !wasOpen) history.pushState({ ftLineup: true }, '')
  else if (!open && wasOpen && history.state?.ftLineup) history.back()
})
onMounted(() => window.addEventListener('popstate', onPopState))
onUnmounted(() => window.removeEventListener('popstate', onPopState))

// Pull the match prediction for whichever game is featured.
watch(featured, (m) => { if (m) ensurePrediction(m) }, { immediate: true })
const prediction = computed(() => (featured.value ? predictionFor(featured.value.id) : null))
// Possession / shots exist only once a match is live or finished.
const matchStats = computed(() => {
  const m = featured.value
  if (!m || (!m.live && !m.completed)) return null
  return statsFor(m.id)
})
const statRows = computed(() => {
  const s = matchStats.value
  if (!s) return []
  const dash = (v) => (v == null || v === '' ? '–' : v)
  return [
    { label: t('football.possession'), home: dash(s.home?.possession), away: dash(s.away?.possession) },
    { label: t('football.shotsOnTarget'), home: dash(s.home?.shotsOnTarget), away: dash(s.away?.shotsOnTarget) },
  ]
})
const assists = computed(() => (featured.value ? assistsFor(featured.value.id) : null))
const assistFor = (s) => assists.value?.[s.name?.toLowerCase()] || ''

const statusText = (m) => {
  if (m.live) return m.detail || t('football.statusLive')
  if (m.completed) return m.detail || t('football.statusFt')
  return t('football.statusScheduled')
}
const statusClass = (m) =>
  m.live ? 'text-red-400' : m.completed ? 'text-slate-400' : 'text-emerald-400'

const kickoff = (m) =>
  new Date(m.date).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
  })

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
