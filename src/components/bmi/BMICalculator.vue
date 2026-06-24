<template>
  <div>
    <!-- Tab bar (horizontally scrollable) -->
    <div class="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 tabs-scroll">
      <button
        v-for="t in tabs"
        :key="t.key"
        @click="tab = t.key"
        :class="[
          'shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap',
          tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        ]"
      >{{ t.label }}</button>
    </div>

    <keep-alive>
      <component :is="current" />
    </keep-alive>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BmiTab from './BmiTab.vue'
import CalorieTab from './CalorieTab.vue'
import IdealWeightTab from './IdealWeightTab.vue'

const tabs = [
  { key: 'bmi',     label: 'BMI',          comp: BmiTab },
  { key: 'calorie', label: 'Calories',     comp: CalorieTab },
  { key: 'ideal',   label: 'Ideal Weight', comp: IdealWeightTab },
]
const tab = ref('bmi')
const current = computed(() => tabs.find((t) => t.key === tab.value).comp)
</script>

<style scoped>
.tabs-scroll { scrollbar-width: none; }
.tabs-scroll::-webkit-scrollbar { display: none; }
</style>
