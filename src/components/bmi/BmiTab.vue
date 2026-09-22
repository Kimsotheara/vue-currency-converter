<template>
  <div class="space-y-4">
    <BodyFields v-model:unit="unit" v-model:weight="weight"
      v-model:heightCm="heightCm" v-model:heightFt="heightFt" v-model:heightIn="heightIn" />

    <button @click="clear" class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors">{{ t('bmi.clear') }}</button>

    <div v-if="bmi" class="rounded-2xl overflow-hidden shadow-md">
      <div :class="['px-5 py-4 text-white', categoryStyle.bg]">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">{{ t('bmi.yourBmi') }}</p>
        <div class="flex items-end gap-3">
          <p class="text-4xl font-bold">{{ bmi }}</p>
          <p class="text-lg font-semibold opacity-90 mb-0.5">{{ t(`bmi.categories.${categoryStyle.key}`) }}</p>
        </div>
      </div>

      <div class="bg-white px-5 py-4">
        <div class="relative h-3 rounded-full overflow-hidden mb-2"
          style="background: linear-gradient(to right, #60a5fa 0%, #34d399 25%, #fbbf24 58%, #f87171 100%)">
          <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-700 rounded-full shadow"
            :style="{ left: indicatorPos + '%' }" />
        </div>
        <div class="flex justify-between text-xs text-gray-400 font-medium">
          <span>{{ t('bmi.categories.under') }}</span><span>{{ t('bmi.categories.normal') }}</span><span>{{ t('bmi.categories.over') }}</span><span>{{ t('bmi.categories.obese') }}</span>
        </div>
      </div>

      <div class="bg-gray-50 divide-y divide-gray-100">
        <div v-for="range in ranges" :key="range.key"
          :class="['flex justify-between items-center px-5 py-2.5', range.key === categoryStyle.key ? 'bg-blue-50' : '']">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="range.dot"></span>
            <span class="text-sm" :class="range.key === categoryStyle.key ? 'font-bold text-blue-700' : 'text-gray-500'">{{ t(`bmi.categories.${range.key}`) }}</span>
          </div>
          <span class="text-sm text-gray-400">{{ range.range }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BodyFields from './BodyFields.vue'
import { useBodyMetrics } from './useBodyMetrics'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const { unit, weight, heightCm, heightFt, heightIn, weightKg, heightM, resetBody } = useBodyMetrics()

const clear = resetBody

const ranges = [
  { key: 'under',  range: '< 18.5',      dot: 'bg-blue-400' },
  { key: 'normal', range: '18.5 – 24.9', dot: 'bg-green-400' },
  { key: 'over',   range: '25 – 29.9',   dot: 'bg-yellow-400' },
  { key: 'obese',  range: '≥ 30',        dot: 'bg-red-400' },
]

const bmi = computed(() => {
  if (!weightKg.value || !heightM.value) return null
  return (weightKg.value / (heightM.value * heightM.value)).toFixed(1)
})

const categoryStyle = computed(() => {
  const v = parseFloat(bmi.value)
  if (v < 18.5) return { key: 'under',  bg: 'bg-blue-500' }
  if (v < 25)   return { key: 'normal', bg: 'bg-green-500' }
  if (v < 30)   return { key: 'over',   bg: 'bg-yellow-500' }
  return          { key: 'obese',  bg: 'bg-red-500' }
})

const indicatorPos = computed(() => {
  const v = parseFloat(bmi.value)
  const min = 10, max = 40
  return Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))
})
</script>
