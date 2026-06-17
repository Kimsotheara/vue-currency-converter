<template>
  <Transition name="fade">
    <div class="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
      <div class="modal-panel bg-slate-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl" :class="{ 'ft-light': !dark }">
        <!-- Header -->
        <div class="px-5 py-4 border-b border-white/10 flex items-center gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-white font-bold text-sm truncate">{{ event.home.name }} vs {{ event.away.name }}</p>
            <p class="text-slate-400 text-xs">Match details</p>
          </div>
          <button @click="$emit('close')" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-lg flex items-center justify-center transition">✕</button>
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
                <div class="flex gap-2 mb-3">
                  <button
                    v-for="(t, i) in teams" :key="i" @click="xi = i"
                    :class="['flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition', xi === i ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10']"
                  >
                    <img v-if="t.logo" :src="t.logo" class="w-5 h-5 object-contain" /><span class="truncate">{{ t.name }}</span>
                  </button>
                </div>
                <p class="text-center text-xs text-slate-400 mb-2">Formation <span class="text-white font-bold">{{ activeXI.formation || '—' }}</span></p>
                <div class="pitch rounded-xl overflow-hidden ring-1 ring-white/10 bg-gradient-to-b from-green-700 to-green-800 relative py-4">
                  <div class="absolute inset-3 border border-white/20 rounded-lg pointer-events-none" />
                  <div class="absolute left-1/2 -translate-x-1/2 top-1/2 w-16 h-16 border border-white/20 rounded-full pointer-events-none" />
                  <div class="relative flex flex-col gap-4 px-2">
                    <div v-for="line in ['GK','DEF','MID','FWD']" :key="line" class="flex justify-center gap-3 sm:gap-5">
                      <div v-for="(p, i) in activeXI.lines[line]" :key="line+i" class="flex flex-col items-center w-16">
                        <div class="w-9 h-9 rounded-full bg-white text-slate-900 font-bold text-sm flex items-center justify-center shadow-md">{{ p.num }}</div>
                        <span class="mt-1 text-[10px] leading-tight text-white text-center font-medium truncate w-full">{{ lastName(p.name) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="activeXI.subs.length" class="mt-4">
                  <p class="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Substitutes</p>
                  <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div v-for="(p, i) in activeXI.subs" :key="'s'+i" class="flex items-center gap-2 text-xs">
                      <span class="w-5 text-right text-slate-500 tabular-nums shrink-0">{{ p.num }}</span>
                      <span class="text-slate-300 truncate">{{ p.name }}</span>
                      <span class="ml-auto text-[10px] text-slate-600 shrink-0">{{ p.pos }}</span>
                    </div>
                  </div>
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
import { ref, computed } from 'vue'

const props = defineProps({
  event: { type: Object, required: true },
  dark:  { type: Boolean, default: true },
  state: { type: String, default: null },  // 'loading' | 'error' | null
  teams: { type: Array, default: null },    // lineup [home, away] or null
  form:  { type: Object, default: null },   // { home:[], away:[] }
  h2h:   { type: Object, default: null },
})
defineEmits(['close', 'retry'])

const tabs = [
  { key: 'lineup', label: 'Line-up' },
  { key: 'form',   label: 'Last 10' },
  { key: 'h2h',    label: 'H2H' },
]
const tab = ref('lineup')
const xi = ref(0)
const activeXI = computed(() => props.teams?.[xi.value])
const hasForm = computed(() => (props.form?.home?.length || props.form?.away?.length))

const resultBg = (r) => (r === 'W' ? 'bg-emerald-500' : r === 'L' ? 'bg-red-500' : 'bg-slate-500')
const lastName = (full = '') => {
  const parts = full.trim().split(' ')
  return parts.length > 1 ? parts[parts.length - 1] : full
}
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

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
