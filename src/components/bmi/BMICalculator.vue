<template>
  <div class="space-y-4">

    <!-- Unit toggle -->
    <div class="flex rounded-xl border border-gray-300 overflow-hidden w-fit">
      <button
        v-for="opt in units"
        :key="opt.value"
        type="button"
        @click="unit = opt.value"
        :class="[
          'px-5 py-2 text-sm font-semibold transition-colors duration-150',
          unit === opt.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50',
        ]"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Weight -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">
        Weight ({{ unit === 'metric' ? 'kg' : 'lbs' }})
      </label>
      <input
        v-model.number="weight"
        type="number"
        :placeholder="unit === 'metric' ? 'e.g. 70' : 'e.g. 154'"
        min="0"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <!-- Height -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Height</label>
      <div v-if="unit === 'metric'">
        <input
          v-model.number="heightCm"
          type="number"
          placeholder="e.g. 175"
          min="0"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div v-else class="flex gap-2">
        <div class="flex-1">
          <input
            v-model.number="heightFt"
            type="number"
            placeholder="ft"
            min="0"
            class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p class="text-xs text-gray-400 mt-1 text-center">Feet</p>
        </div>
        <div class="flex-1">
          <input
            v-model.number="heightIn"
            type="number"
            placeholder="in"
            min="0"
            max="11"
            class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p class="text-xs text-gray-400 mt-1 text-center">Inches</p>
        </div>
      </div>
    </div>

    <button
      @click="clear"
      class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
    >
      Clear
    </button>

    <div v-if="bmi" class="rounded-2xl overflow-hidden shadow-md">

      <div :class="['px-5 py-4 text-white', categoryStyle.bg]">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">Your BMI</p>
        <div class="flex items-end gap-3">
          <p class="text-4xl font-bold">{{ bmi }}</p>
          <p class="text-lg font-semibold opacity-90 mb-0.5">{{ categoryStyle.label }}</p>
        </div>
      </div>

      <!-- BMI scale bar -->
      <div class="bg-white px-5 py-4">
        <div class="relative h-3 rounded-full overflow-hidden mb-2"
          style="background: linear-gradient(to right, #60a5fa 0%, #34d399 25%, #fbbf24 58%, #f87171 100%)">
          <div
            class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-700 rounded-full shadow"
            :style="{ left: indicatorPos + '%' }"
          />
        </div>
        <div class="flex justify-between text-xs text-gray-400 font-medium">
          <span>Underweight</span>
          <span>Normal</span>
          <span>Overweight</span>
          <span>Obese</span>
        </div>
      </div>

      <!-- Range reference -->
      <div class="bg-gray-50 divide-y divide-gray-100">
        <div
          v-for="range in ranges"
          :key="range.label"
          :class="['flex justify-between items-center px-5 py-2.5', range.label === categoryStyle.label ? 'bg-blue-50' : '']"
        >
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="range.dot"></span>
            <span class="text-sm" :class="range.label === categoryStyle.label ? 'font-bold text-blue-700' : 'text-gray-500'">
              {{ range.label }}
            </span>
          </div>
          <span class="text-sm text-gray-400">{{ range.range }}</span>
        </div>
      </div>

    </div>

    <p v-if="error" class="text-sm text-red-500 font-medium">{{ error }}</p>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const unit = ref('metric')
const weight = ref(null)
const heightCm = ref(null)
const heightFt = ref(null)
const heightIn = ref(null)

const clear = () => {
  weight.value = null
  heightCm.value = null
  heightFt.value = null
  heightIn.value = null
}

const units = [
  { value: 'metric', label: 'Metric (kg/cm)' },
  { value: 'imperial', label: 'Imperial (lbs/ft)' },
]

const ranges = [
  { label: 'Underweight', range: '< 18.5',     dot: 'bg-blue-400' },
  { label: 'Normal',      range: '18.5 – 24.9', dot: 'bg-green-400' },
  { label: 'Overweight',  range: '25 – 29.9',   dot: 'bg-yellow-400' },
  { label: 'Obese',       range: '≥ 30',         dot: 'bg-red-400' },
]

const error = computed(() => {
  if (!weight.value && !heightCm.value && !heightFt.value) return null
  if (weight.value <= 0) return 'Weight must be greater than 0.'
  if (unit.value === 'metric' && heightCm.value <= 0) return 'Height must be greater than 0.'
  if (unit.value === 'imperial' && !heightFt.value) return 'Please enter height in feet.'
  return null
})

const bmi = computed(() => {
  if (!weight.value || error.value) return null

  let weightKg = unit.value === 'metric' ? weight.value : weight.value * 0.453592
  let heightM

  if (unit.value === 'metric') {
    if (!heightCm.value) return null
    heightM = heightCm.value / 100
  } else {
    if (!heightFt.value) return null
    const totalIn = (heightFt.value * 12) + (heightIn.value || 0)
    heightM = totalIn * 0.0254
  }

  if (heightM <= 0) return null
  return (weightKg / (heightM * heightM)).toFixed(1)
})

const categoryStyle = computed(() => {
  const v = parseFloat(bmi.value)
  if (v < 18.5) return { label: 'Underweight', bg: 'bg-blue-500' }
  if (v < 25)   return { label: 'Normal',      bg: 'bg-green-500' }
  if (v < 30)   return { label: 'Overweight',  bg: 'bg-yellow-500' }
  return               { label: 'Obese',        bg: 'bg-red-500' }
})

const indicatorPos = computed(() => {
  const v = parseFloat(bmi.value)
  const min = 10, max = 40
  return Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))
})
</script>
