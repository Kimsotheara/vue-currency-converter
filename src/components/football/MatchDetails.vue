<template>
  <Transition name="fade">
    <div class="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
      <div class="modal-panel bg-slate-900 w-full sm:max-w-2xl lg:max-w-3xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl" :class="{ 'ft-light': !dark }">
        <!-- Mobile drag handle / dismiss affordance -->
        <button class="sm:hidden w-full pt-2.5 pb-1 flex justify-center shrink-0" aria-label="Close" @click="$emit('close')">
          <span class="w-10 h-1.5 rounded-full bg-white/25" />
        </button>
        <!-- Result header (always shown) -->
        <div class="px-5 pt-3 pb-4 border-b border-white/10">
          <div class="flex items-center">
            <p class="flex-1 text-xs font-semibold inline-flex items-center gap-1.5"
               :class="event.live ? 'text-red-400' : 'text-slate-400'">
              <span v-if="event.live" class="w-1.5 h-1.5 rounded-full bg-red-400" />{{ statusText }}
            </p>
            <button
              @click="$emit('close')"
              class="shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-90"
              aria-label="Close match details"
            >
              <X class="w-5 h-5" :stroke-width="2.4" />
            </button>
          </div>

          <div class="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div class="flex flex-col items-center gap-1.5 text-center">
              <img v-if="event.home.logo" :src="event.home.logo" class="w-12 h-12 object-contain" />
              <span class="text-white text-xs font-bold leading-tight">{{ event.home.name }}</span>
            </div>
            <div class="px-1 text-center">
              <div v-if="event.state !== 'pre'" class="text-3xl font-bold text-white tabular-nums whitespace-nowrap">
                {{ event.home.score }} <span class="text-slate-500">-</span> {{ event.away.score }}
              </div>
              <div v-else class="text-[11px] font-semibold text-slate-400 leading-tight">{{ kickoff }}</div>
            </div>
            <div class="flex flex-col items-center gap-1.5 text-center">
              <img v-if="event.away.logo" :src="event.away.logo" class="w-12 h-12 object-contain" />
              <span class="text-white text-xs font-bold leading-tight">{{ event.away.name }}</span>
            </div>
          </div>

          <div v-if="event.homeScorers.length || event.awayScorers.length"
               class="mt-3 grid grid-cols-[1fr_auto_1fr] gap-2 items-start text-[11px] text-slate-400">
            <ul class="space-y-0.5 text-left">
              <li v-for="(s, i) in event.homeScorers" :key="'h'+i">
                ⚽ {{ scorerText(s) }}<span v-if="assistFor(s)" class="text-slate-500"> · {{ assistFor(s) }}</span>
              </li>
            </ul>
            <span class="text-slate-600">⚽</span>
            <ul class="space-y-0.5 text-right">
              <li v-for="(s, i) in event.awayScorers" :key="'a'+i">
                {{ scorerText(s) }} ⚽<span v-if="assistFor(s)" class="text-slate-500"> · {{ assistFor(s) }}</span>
              </li>
            </ul>
          </div>

          <!-- Match stats: possession / shots on target -->
          <div v-if="statRows.length" class="mt-3 pt-3 border-t border-white/5 space-y-1.5">
            <div v-for="row in statRows" :key="row.label" class="flex items-center text-[11px]">
              <span class="w-12 text-left font-semibold text-white tabular-nums">{{ row.home }}</span>
              <span class="flex-1 text-center text-slate-400">{{ row.label }}</span>
              <span class="w-12 text-right font-semibold text-white tabular-nums">{{ row.away }}</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex px-3 pt-3 gap-2">
          <button
            v-for="t in tabs"
            :key="t.key"
            @click="tab = t.key"
            :class="[
              'flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition',
              tab === t.key ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20',
            ]"
          >{{ t.label }}</button>
        </div>

        <div class="overflow-y-auto px-3 pb-5 pt-3">
          <!-- Loading -->
          <div v-if="state === 'loading'" class="py-16 text-center">
            <span class="inline-block text-3xl animate-spin">↻</span>
            <p class="text-slate-400 text-sm mt-3">Loading match details…</p>
          </div>

          <!-- Error -->
          <div v-else-if="state === 'error'" class="py-14 px-6 text-center">
            <p class="text-4xl mb-3">📡</p>
            <p class="text-slate-300 text-sm">Couldn't load match details.</p>
            <button @click="$emit('retry', event)" class="mt-4 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition">Retry</button>
          </div>

          <template v-else>
            <!-- ===== LINE-UP ===== -->
            <template v-if="tab === 'lineup'">
              <div v-if="!teams" class="py-12 px-6 text-center">
                <p class="text-4xl mb-3">📋</p>
                <p class="text-slate-200 text-sm font-semibold">Line-ups not announced yet</p>
                <p class="text-slate-500 text-xs mt-1.5">Official XIs are usually confirmed about an hour before kick-off.</p>
                <button @click="$emit('retry', event)" class="mt-5 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition">Check again</button>
              </div>
              <template v-else>
                <!-- Combined pitch: away (top) vs home (bottom), FotMob-style -->
                <div class="pitch rounded-xl overflow-hidden ring-1 ring-white/10 relative">
                  <div class="absolute inset-0 pitch-grass" />
                  <!-- markings -->
                  <div class="absolute inset-2 border border-white/20 rounded pointer-events-none" />
                  <div class="absolute left-2 right-2 top-1/2 border-t border-white/20 pointer-events-none" />
                  <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border border-white/20 rounded-full pointer-events-none" />
                  <div class="absolute top-2 left-1/2 -translate-x-1/2 w-1/2 h-10 border-x border-b border-white/20 pointer-events-none" />
                  <div class="absolute top-2 left-1/2 -translate-x-1/2 w-1/4 h-4 border-x border-b border-white/20 pointer-events-none" />
                  <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-10 border-x border-t border-white/20 pointer-events-none" />
                  <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/4 h-4 border-x border-t border-white/20 pointer-events-none" />

                  <!-- team headers on the grass -->
                  <div class="absolute top-2.5 left-3 right-3 flex items-center justify-between z-10">
                    <span class="flex items-center gap-1.5 min-w-0">
                      <img v-if="away.logo" :src="away.logo" class="w-4 h-4 object-contain" />
                      <span class="text-white text-xs font-bold truncate drop-shadow">{{ away.name }}</span>
                    </span>
                    <span class="text-white text-[11px] font-bold bg-black/40 rounded-full px-2 py-0.5 shrink-0">{{ away.formation }}</span>
                  </div>
                  <div class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between z-10">
                    <span class="flex items-center gap-1.5 min-w-0">
                      <img v-if="home.logo" :src="home.logo" class="w-4 h-4 object-contain" />
                      <span class="text-white text-xs font-bold truncate drop-shadow">{{ home.name }}</span>
                    </span>
                    <span class="text-white text-[11px] font-bold bg-black/40 rounded-full px-2 py-0.5 shrink-0">{{ home.formation }}</span>
                  </div>

                  <!-- rows -->
                  <div class="relative flex flex-col gap-9 sm:gap-11 px-2 pt-14 pb-14">
                    <template v-for="(row, ri) in pitchRows" :key="ri">
                      <div v-if="row.half" class="h-2" />
                      <div v-else class="flex justify-center gap-3 sm:gap-5">
                        <div v-for="(p, i) in row.players" :key="ri+'-'+i" class="flex flex-col items-center w-[4.5rem] sm:w-24">
                          <div class="relative">
                            <img v-if="photoFor(p.name)" :src="photoFor(p.name)" :class="['w-14 h-16 sm:w-16 sm:h-20 rounded-lg object-cover object-top bg-white/15 ring-1 shadow-md', row.side === 'home' ? 'ring-sky-300/50' : 'ring-rose-300/50']" loading="lazy" />
                            <img v-else-if="p.shirt" :src="p.shirt" class="w-14 h-16 sm:w-16 sm:h-20 object-contain drop-shadow" loading="lazy" />
                            <div v-else :class="['w-14 h-16 sm:w-16 sm:h-20 rounded-lg text-white font-bold text-xl flex items-center justify-center shadow-md', row.side === 'home' ? 'bg-sky-500/80' : 'bg-rose-500/80']">{{ p.num }}</div>
                            <!-- sub arrow (top-left) -->
                            <span v-if="subArrow(p)" :class="['absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow leading-none', subArrow(p) === 'out' ? 'bg-red-600' : 'bg-emerald-600']">{{ subArrow(p) === 'out' ? '↓' : '↑' }}</span>
                            <!-- card (top-right) -->
                            <span v-if="cardIcon(p)" class="absolute -top-2 -right-1.5 text-xs leading-none">{{ cardIcon(p) }}</span>
                            <!-- goal / assist (bottom-right) -->
                            <span v-if="goalIcon(p)" class="absolute bottom-1 -right-2 text-xs leading-none drop-shadow">{{ goalIcon(p) }}</span>
                            <!-- rating pill (bottom-center) -->
                            <span v-if="event.completed && p.rating" :class="['absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold rounded-md px-1.5 py-0.5 leading-none shadow', ratingBg(p.rating)]">{{ p.rating.toFixed(1) }}</span>
                          </div>
                          <span class="mt-3.5 text-[10px] sm:text-xs leading-tight text-white text-center font-medium truncate w-full drop-shadow">{{ playerLabel(p) }}</span>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- Bench: both teams -->
                <div class="mt-4 grid sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div v-for="(t, ti) in teams" :key="'sub'+ti">
                    <p class="text-slate-400 text-xs font-bold mb-2 flex items-center gap-1.5">
                      <img v-if="t.logo" :src="t.logo" class="w-4 h-4 object-contain" />{{ t.name }} · Bench
                    </p>
                    <div class="space-y-2">
                      <div v-for="(p, i) in t.subs" :key="'s'+ti+i" class="flex items-center gap-2.5">
                        <div class="relative shrink-0">
                          <img v-if="photoFor(p.name)" :src="photoFor(p.name)" class="w-8 h-8 rounded-full object-cover object-top bg-white/10" loading="lazy" />
                          <img v-else-if="p.shirt" :src="p.shirt" class="w-7 h-7 object-contain" loading="lazy" />
                          <span v-else class="w-8 h-8 rounded-full bg-white/10 text-slate-400 text-[10px] font-bold flex items-center justify-center">{{ p.num }}</span>
                          <span v-if="event.completed && p.rating" :class="['absolute -bottom-1 -left-1 text-white text-[8px] font-bold rounded px-0.5 leading-3', ratingBg(p.rating)]">{{ p.rating.toFixed(1) }}</span>
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="text-white text-xs font-semibold truncate flex items-center gap-1">
                            {{ p.name }}<span v-if="eventIcon(p)" class="text-[10px]">{{ eventIcon(p) }}</span>
                          </p>
                          <p class="text-slate-500 text-[10px] truncate">{{ p.posName || p.pos }} · #{{ p.num }}</p>
                        </div>
                        <span v-if="event.completed && p.events.subIn" class="text-emerald-400 text-xs shrink-0" title="Came on">▲</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Legend + meta -->
                <div class="mt-5 pt-4 border-t border-white/5">
                  <p v-if="event.completed" class="text-slate-500 text-[11px] mb-2">Player ratings (0–10)
                    <span v-if="ratingSource === 'API-Football'">via API-Football</span>
                    <span v-else>estimated from match data</span>
                  </p>
                  <div class="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
                    <span>⚽ Goal</span><span>🅰 Assist</span><span>🟨 Yellow</span><span>🟥 Red</span>
                    <span class="text-emerald-400">▲ Sub in</span>
                  </div>
                  <p v-if="event.venue" class="text-slate-600 text-[10px] mt-2">📍 {{ event.venue }}</p>
                </div>
              </template>
            </template>

            <!-- ===== FORM (last 10) ===== -->
            <template v-else-if="tab === 'form'">
              <div v-if="!hasForm" class="py-12 text-center text-slate-500 text-sm">No recent results available.</div>
              <div v-else class="space-y-5">
                <div v-for="(side, key) in { home: form.home, away: form.away }" :key="key">
                  <div class="flex items-center gap-2 mb-2">
                    <img v-if="event[key].logo" :src="event[key].logo" class="w-5 h-5 object-contain" />
                    <span class="text-white font-bold text-sm">{{ event[key].name }}</span>
                    <span class="ml-auto flex gap-1">
                      <span v-for="(g, i) in side.slice(0, 10)" :key="i" :class="['w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white', resultBg(g.result)]" :title="g.score">{{ g.result }}</span>
                    </span>
                  </div>
                  <div class="rounded-xl bg-slate-800/50 ring-1 ring-white/5 divide-y divide-white/5">
                    <div v-for="(g, i) in side" :key="i" class="flex items-center gap-2.5 px-3 py-2 text-xs">
                      <span :class="['w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white shrink-0', resultBg(g.result)]">{{ g.result }}</span>
                      <span class="text-slate-500 w-7 shrink-0">{{ g.home ? 'H' : 'A' }}</span>
                      <img v-if="g.logo" :src="g.logo" class="w-4 h-4 object-contain shrink-0" />
                      <span class="text-slate-200 truncate flex-1">{{ g.oppName || g.opp }}</span>
                      <span class="text-[10px] text-slate-600 shrink-0">{{ g.league }}</span>
                      <span class="text-white font-bold tabular-nums shrink-0">{{ g.score }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- ===== HEAD TO HEAD ===== -->
            <template v-else>
              <div v-if="!h2h" class="py-12 text-center text-slate-500 text-sm">No recent meetings between these teams.</div>
              <div v-else>
                <p class="text-slate-400 text-xs mb-3">Recent meetings — from <span class="text-white font-semibold">{{ h2h.subject }}</span>'s view</p>
                <div class="rounded-xl bg-slate-800/50 ring-1 ring-white/5 divide-y divide-white/5">
                  <div v-for="(g, i) in h2h.games" :key="i" class="flex items-center gap-2.5 px-3 py-2.5 text-xs">
                    <span :class="['w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white shrink-0', resultBg(g.result)]">{{ g.result }}</span>
                    <span class="text-slate-500 w-12 shrink-0">{{ fmtDate(g.date) }}</span>
                    <span class="text-slate-500 shrink-0">{{ g.home ? 'vs' : '@' }}</span>
                    <img v-if="g.logo" :src="g.logo" class="w-4 h-4 object-contain shrink-0" />
                    <span class="text-slate-200 truncate flex-1">{{ g.opp }}</span>
                    <span class="text-[10px] text-slate-600 shrink-0">{{ g.league }}</span>
                    <span class="text-white font-bold tabular-nums shrink-0">{{ g.score }}</span>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import { usePlayerPhotos } from './playerPhotos'

const props = defineProps({
  event:   { type: Object, required: true },
  dark:    { type: Boolean, default: true },
  state:   { type: String, default: null },  // 'loading' | 'error' | null
  teams:   { type: Array, default: null },    // lineup [home, away] or null
  form:    { type: Object, default: null },   // { home:[], away:[] }
  h2h:     { type: Object, default: null },
  stats:   { type: Object, default: null },   // { home:{possession,shotsOnTarget}, away:{...} }
  assists: { type: Object, default: null },   // { scorerNameLower: assistName }
  ratingSource: { type: String, default: null }, // 'API-Football' when real ratings loaded
})
const emit = defineEmits(['close', 'retry'])

// Close on Escape (desktop) — pairs with the back-button/back-gesture handling
// and the on-screen close button.
const onKeydown = (e) => { if (e.key === 'Escape') emit('close') }
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

const tabs = [
  { key: 'lineup', label: 'Line-up' },
  { key: 'form',   label: 'Last 10' },
  { key: 'h2h',    label: 'H2H' },
]
const tab = ref('lineup')
const home = computed(() => props.teams?.[0] || null)
const away = computed(() => props.teams?.[1] || null)

// Match stats (possession / shots on target) — only available once a match is
// live or finished. Shown in the header across every tab.
const statRows = computed(() => {
  const s = props.stats
  if (!s || (!props.event.live && !props.event.completed)) return []
  const dash = (v) => (v == null || v === '' ? '–' : v)
  return [
    { label: 'Possession', home: dash(s.home?.possession), away: dash(s.away?.possession) },
    { label: 'Shots on target', home: dash(s.home?.shotsOnTarget), away: dash(s.away?.shotsOnTarget) },
  ]
})

// Both teams on one pitch (Google-style): away attacks down from the top,
// home attacks up from the bottom, so the two front lines meet in the middle.
const pitchRows = computed(() => {
  if (!home.value || !away.value) return []
  const rows = []
  for (const l of ['GK', 'DEF', 'MID', 'FWD']) rows.push({ side: 'away', players: away.value.lines[l] })
  rows.push({ half: true })
  for (const l of ['FWD', 'MID', 'DEF', 'GK']) rows.push({ side: 'home', players: home.value.lines[l] })
  return rows
})

// Fetch face photos for everyone in the line-up (starters first, then subs).
const { photoFor, ensurePhotos } = usePlayerPhotos()
watch(
  () => props.teams,
  (teams) => {
    if (!teams) return
    const names = teams.flatMap((t) => [...t.starters, ...t.subs]).map((p) => p.name)
    ensurePhotos(names)
  },
  { immediate: true },
)
const hasForm = computed(() => (props.form?.home?.length || props.form?.away?.length))

const statusText = computed(() => {
  const e = props.event
  if (e.live) return e.detail || 'LIVE'
  if (e.completed) return e.detail || 'FT'
  return 'Scheduled'
})
const kickoff = computed(() =>
  new Date(props.event.date).toLocaleString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  }),
)
const scorerText = (s) => {
  const tag = s.own ? ' (OG)' : s.pen ? ' (P)' : ''
  return `${s.name}${tag} ${s.clock}'`
}
const assistFor = (s) => props.assists?.[s.name?.toLowerCase()] || ''

const resultBg = (r) => (r === 'W' ? 'bg-emerald-500' : r === 'L' ? 'bg-red-500' : 'bg-slate-500')
const ratingBg = (n) =>
  n >= 7.5 ? 'bg-emerald-600' : n >= 6.5 ? 'bg-green-600' : n >= 5 ? 'bg-amber-500' : 'bg-red-600'
// Status / event markers shown around a player photo.
const subArrow = (p) => (p.events?.subOut ? 'out' : p.events?.subIn ? 'in' : '')
const cardIcon = (p) => (p.events?.red ? '🟥' : p.events?.yellow ? '🟨' : '')
const goalIcon = (p) => (p.events?.goals ? '⚽' : p.events?.ownGoals ? '🥅' : p.events?.assists ? '👟' : '')
const lastName = (full = '') => {
  const parts = full.trim().split(' ')
  return parts.length > 1 ? parts[parts.length - 1] : full
}
const playerLabel = (p) => {
  const short = p.shortName || (() => {
    const t = (p.name || '').trim().split(/\s+/)
    return t.length > 1 ? `${t[0][0]}. ${t[t.length - 1]}` : p.name
  })()
  return p.num ? `${p.num} ${short}` : short
}
// One representative event icon per player (goal > red > yellow > assist > own goal).
const eventIcon = (p) => {
  const e = p.events || {}
  if (e.goals) return '⚽'
  if (e.red) return '🟥'
  if (e.yellow) return '🟨'
  if (e.assists) return '🅰'
  if (e.ownGoals) return '🥅'
  return ''
}
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Striped grass like the reference */
.pitch-grass {
  background-color: #166534;
  background-image: repeating-linear-gradient(
    to bottom,
    #15803d 0,
    #15803d 9.09%,
    #166534 9.09%,
    #166534 18.18%
  );
}

/* ===== Light theme (pitch keeps its dark/green look) ===== */
.modal-panel.ft-light { background: #ffffff; }
.ft-light .text-white { color: #0f172a; }
.ft-light .pitch .text-white { color: #ffffff; } /* keep player names white on the pitch */
.ft-light .text-slate-300 { color: #334155; }
.ft-light .text-slate-400 { color: #64748b; }
.ft-light .text-slate-500 { color: #94a3b8; }
.ft-light .text-slate-600 { color: #94a3b8; }
.ft-light .bg-slate-800\/50 { background-color: #f8fafc; }
.ft-light .bg-white\/10 { background-color: #f1f5f9; }
.ft-light .bg-white\/5 { background-color: #f1f5f9; }
.ft-light .bg-white\/20 { background-color: #e2e8f0; }
.ft-light .hover\:bg-white\/20:hover { background-color: #e2e8f0; }
.ft-light .hover\:bg-white\/10:hover { background-color: #f1f5f9; }
.ft-light .border-white\/10 { border-color: #e2e8f0; }
.ft-light .divide-white\/5 > :not([hidden]) ~ :not([hidden]) { border-color: #eef2f6; }
.ft-light .ring-white\/5 { --tw-ring-color: #e2e8f0; }
</style>
