<template>
  <div class="space-y-5">

    <div class="flex flex-wrap gap-2">
      <button
        v-for="cat in categories"
        :key="cat.key"
        @click="selectCategory(cat.key)"
        :class="[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150',
          activeCategory === cat.key
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
        ]"
      >
        <span>{{ cat.icon }}</span>
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <div class="flex items-start gap-3">
      <div class="flex-1 space-y-1.5">
        <label class="block text-sm font-semibold text-gray-700">From</label>
        <Multiselect
          v-model="fromUnit"
          :options="currentUnits"
          label="label"
          track-by="key"
          :allow-empty="false"
          placeholder=""
        />
        <input
          v-model.number="inputValue"
          type="number"
          placeholder="Enter value"
          class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        @click="swap"
        class="mt-8 shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-gray-500 transition-colors text-lg"
      >
        ⇄
      </button>

      <div class="flex-1 space-y-1.5">
        <label class="block text-sm font-semibold text-gray-700">To</label>
        <Multiselect
          v-model="toUnit"
          :options="currentUnits"
          label="label"
          track-by="key"
          :allow-empty="false"
          placeholder=""
        />
        <input
          :value="resultDisplay"
          readonly
          placeholder="Result"
          class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-base bg-gray-50 text-gray-500 cursor-default"
        />
      </div>
    </div>

    <div v-if="result !== null" class="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-white shadow-lg">
      <p class="text-sm opacity-80 mb-1">Result</p>
      <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span class="text-lg font-medium opacity-90">{{ formatNumber(inputValue) }} {{ fromUnit?.label }}</span>
        <span class="opacity-60">=</span>
        <span class="text-2xl font-bold">{{ formatNumber(result) }} {{ toUnit?.label }}</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'
import { categories, convert } from './units.js'

const activeCategory = ref('length')
const inputValue = ref(null)
const fromUnit = ref(null)
const toUnit = ref(null)

const currentCategory = computed(() => categories.find(c => c.key === activeCategory.value))
const currentUnits = computed(() => currentCategory.value.units)

const setDefaultUnits = () => {
  fromUnit.value = currentUnits.value[0]
  toUnit.value = currentUnits.value[1]
}

setDefaultUnits()

const result = computed(() => {
  if (!fromUnit.value || !toUnit.value) return null
  if (inputValue.value === null || inputValue.value === '') return null
  return convert(inputValue.value, fromUnit.value.key, toUnit.value.key, activeCategory.value)
})

const resultDisplay = computed(() => result.value !== null ? formatNumber(result.value) : '')

const selectCategory = (key) => {
  activeCategory.value = key
  inputValue.value = null
}

const swap = () => {
  [fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value]
}

watch(activeCategory, setDefaultUnits)

const formatNumber = (v) => {
  if (v === null || v === undefined) return ''
  const abs = Math.abs(v)
  const decimals = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(v)
}
</script>
