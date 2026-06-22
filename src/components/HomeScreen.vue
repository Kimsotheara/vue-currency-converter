<template>
  <div class="w-full max-w-lg mx-auto px-4 pt-6 pb-10">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-400 dark:text-gray-500 font-medium">Welcome back</p>
          <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100 -mt-0.5">Toolkit</h1>
        </div>
      </div>
      <button
        @click="$emit('toggle-theme')"
        class="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition-colors"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <svg v-if="!isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </button>
    </div>

    <!-- Search -->
    <div class="relative mb-5">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
           class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        v-model="query"
        type="text"
        placeholder="Search tools"
        class="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm pl-11 pr-4 py-3.5 text-sm text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/40"
      />
    </div>

    <!-- Featured card -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-5 mb-7 shadow-md">
      <p class="text-[11px] font-semibold uppercase tracking-widest text-white/70 mb-1">Featured</p>
      <h2 class="text-white text-lg font-bold leading-tight">{{ tabs.length }} tools, one place</h2>
      <p class="text-white/80 text-sm mt-1">Everything you need for daily quick tasks.</p>
      <div class="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
      <div class="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/10" />
    </div>

    <!-- All Tools -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">All Tools</h3>
      <button class="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700" @click="query = ''">See all</button>
    </div>

    <div class="grid grid-cols-3 gap-x-3 gap-y-5">
      <button
        v-for="tab in filteredTabs"
        :key="tab.key"
        @click="$emit('select', tab.key)"
        class="flex flex-col items-center gap-2 group"
      >
        <div
          :class="['w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br transition-transform group-active:scale-95 group-hover:-translate-y-0.5', tab.color]"
        >
          <span class="w-7 h-7" v-html="icons[tab.key]" />
        </div>
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300 text-center leading-tight">{{ tab.short }}</span>
      </button>
    </div>

    <p v-if="!filteredTabs.length" class="text-center text-sm text-gray-400 dark:text-gray-500 py-10">No tools match “{{ query }}”.</p>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ tabs: Array, isDark: Boolean })
defineEmits(['select', 'toggle-theme'])

const query = ref('')
const filteredTabs = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.tabs
  return props.tabs.filter(t =>
    t.short.toLowerCase().includes(q) || t.label.toLowerCase().includes(q),
  )
})

const svg = (inner) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">${inner}</svg>`

const icons = {
  speedtest: svg('<path d="M12 12l3-3"/><path d="M3.5 18a9 9 0 1 1 17 0"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>'),
  currency: svg('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  vehicleloan: svg('<path d="M3 21h18"/><path d="M4 10h16"/><path d="M5 6l7-3 7 3"/><path d="M5 10v11"/><path d="M19 10v11"/><path d="M9 14v4"/><path d="M15 14v4"/>'),
  wifi: svg('<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>'),
  unit: svg('<rect x="2" y="7" width="20" height="10" rx="1.5"/><line x1="7" y1="7" x2="7" y2="11"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="17" y1="7" x2="17" y2="11"/>'),
  discount: svg('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'),
  bmi: svg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
  wheel: svg('<circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/><line x1="18.4" y1="5.6" x2="5.6" y2="18.4"/>'),
  linkqr: svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  savinggoal: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>'),
  invoice: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>'),
  invitation: svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>'),
  weather: svg('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>'),
  football: svg('<circle cx="12" cy="12" r="9"/><polygon points="12 7 15.2 9.3 14 13.1 10 13.1 8.8 9.3"/><line x1="12" y1="3" x2="12" y2="7"/><line x1="15.2" y1="9.3" x2="20.5" y2="8"/><line x1="14" y1="13.1" x2="17.5" y2="17.5"/><line x1="10" y1="13.1" x2="6.5" y2="17.5"/><line x1="8.8" y1="9.3" x2="3.5" y2="8"/>'),
}
</script>
