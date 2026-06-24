<template>
  <div class="space-y-4">
    <!-- Unit toggle -->
    <div class="flex rounded-xl bg-gray-100 p-1">
      <button
        v-for="u in [['metric', 'Metric (kg/cm)'], ['imperial', 'Imperial (lbs/ft)']]"
        :key="u[0]"
        @click="unit = u[0]"
        :class="[
          'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
          unit === u[0] ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
        ]"
      >{{ u[1] }}</button>
    </div>

    <!-- Weight -->
    <div v-if="showWeight">
      <label class="block text-sm font-semibold text-gray-700 mb-1">Weight ({{ unit === 'metric' ? 'kg' : 'lbs' }})</label>
      <input
        :value="weight ?? ''"
        @input="weight = $event.target.value === '' ? null : Number($event.target.value)"
        type="number" inputmode="decimal" min="0"
        :placeholder="unit === 'metric' ? 'e.g. 70' : 'e.g. 154'"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <!-- Height -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Height</label>
      <input
        v-if="unit === 'metric'"
        :value="heightCm ?? ''"
        @input="heightCm = $event.target.value === '' ? null : Number($event.target.value)"
        type="number" inputmode="decimal" min="0" placeholder="e.g. 175 (cm)"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <div v-else class="flex gap-2">
        <div class="flex-1">
          <input
            :value="heightFt ?? ''"
            @input="heightFt = $event.target.value === '' ? null : Number($event.target.value)"
            type="number" inputmode="numeric" min="0" placeholder="ft"
            class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p class="text-xs text-gray-400 mt-1 text-center">Feet</p>
        </div>
        <div class="flex-1">
          <input
            :value="heightIn ?? ''"
            @input="heightIn = $event.target.value === '' ? null : Number($event.target.value)"
            type="number" inputmode="numeric" min="0" max="11" placeholder="in"
            class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p class="text-xs text-gray-400 mt-1 text-center">Inches</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const unit = defineModel('unit')
const weight = defineModel('weight')
const heightCm = defineModel('heightCm')
const heightFt = defineModel('heightFt')
const heightIn = defineModel('heightIn')
defineProps({ showWeight: { type: Boolean, default: true } })
</script>
