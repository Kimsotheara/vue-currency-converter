<script setup>
import { ref, computed } from 'vue'
import { Search } from 'lucide-vue-next'
import { getToolIcon } from './toolIcons'

const props = defineProps({
  tabs: { type: Array, required: true },
})
defineEmits(['select'])

const search = ref('')

const visibleTabs = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.tabs
  return props.tabs.filter((tab) =>
    `${tab.short} ${tab.label}`.toLowerCase().includes(q),
  )
})
</script>

<template>
  <div>
    <!-- Search -->
    <label class="relative block mb-5">
      <Search class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
      <input
        v-model="search"
        type="text"
        placeholder="Search tools"
        class="w-full bg-white rounded-2xl shadow-sm pl-11 pr-4 py-3.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200"
      />
    </label>

    <!-- Featured banner -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-5 mb-7 shadow-md">
      <p class="text-[11px] font-semibold uppercase tracking-widest text-white/70 mb-1">Featured</p>
      <h2 class="text-white text-lg font-bold leading-tight">{{ tabs.length }} tools, one place</h2>
      <p class="text-white/80 text-sm mt-1">Everything you need for daily quick tasks.</p>
      <div class="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
      <div class="absolute right-0 bottom-2 w-16 h-16 rounded-full bg-white/10" />
    </div>

    <!-- Section heading -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-bold text-gray-800">All Tools</h3>
      <button class="text-sm font-semibold text-purple-600 hover:text-purple-700" @click="search = ''">
        See all
      </button>
    </div>

    <!-- Tool grid -->
    <div class="grid grid-cols-3 sm:grid-cols-4 gap-x-3 gap-y-6">
      <button
        v-for="tab in visibleTabs"
        :key="tab.key"
        class="flex flex-col items-center gap-2 group focus:outline-none"
        @click="$emit('select', tab.key)"
      >
        <span
          class="w-16 h-16 rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-black/10 bg-gradient-to-br transition-transform duration-150 group-active:scale-90 group-hover:-translate-y-0.5"
          :class="tab.bg"
        >
          <component :is="getToolIcon(tab.key)" class="w-7 h-7" :stroke-width="2" />
        </span>
        <span class="text-[11px] font-medium text-gray-700 text-center leading-tight px-0.5">
          {{ tab.short || tab.label }}
        </span>
      </button>
    </div>

    <!-- Empty state -->
    <p v-if="!visibleTabs.length" class="text-center text-sm text-gray-400 py-10">
      No tools match “{{ search }}”.
    </p>
  </div>
</template>
