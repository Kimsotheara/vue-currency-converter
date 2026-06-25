<template>
  <div class="space-y-4">

    <!-- Sex -->
    <div class="flex rounded-xl bg-gray-100 p-1">
      <button v-for="s in [['male','bmi.male'],['female','bmi.female']]" :key="s[0]" @click="sex = s[0]"
        :class="['flex-1 py-2 rounded-lg text-sm font-semibold transition-colors', sex === s[0] ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500']">{{ t(s[1]) }}</button>
    </div>

    <!-- Shared height (weight not needed here) -->
    <BodyFields :show-weight="false" v-model:unit="unit"
      v-model:heightCm="heightCm" v-model:heightFt="heightFt" v-model:heightIn="heightIn" />

    <!-- Frame -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('bmi.bodyFrame') }}</label>
      <div class="flex rounded-xl bg-gray-100 p-1">
        <button v-for="f in frames" :key="f.key" @click="frame = f.key"
          :class="['flex-1 py-2 rounded-lg text-sm font-semibold transition-colors', frame === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500']">{{ t(`bmi.frames.${f.key}`) }}</button>
      </div>
    </div>

    <button @click="clear" class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors">{{ t('bmi.clear') }}</button>

    <div v-if="result" class="rounded-2xl overflow-hidden shadow-md">
      <div class="bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-4 text-white">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">{{ t('bmi.healthyRange') }}</p>
        <p class="text-4xl font-bold">{{ result.low }}–{{ result.high }} <span class="text-lg font-semibold opacity-90">kg</span></p>
        <p class="text-xs opacity-80 mt-1">{{ t('bmi.rangeLbNote', { lowLb: result.lowLb, highLb: result.highLb }) }}</p>
      </div>
      <div class="bg-white divide-y divide-gray-100">
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">{{ t('bmi.targetFrame', { frame: frameLabel }) }}</span>
          <span class="text-sm font-bold text-emerald-600">{{ result.target }} kg</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">{{ t('bmi.devineFormula') }}</span>
          <span class="text-sm font-semibold text-gray-700">{{ result.devine }} kg</span>
        </div>
      </div>
    </div>

    <p class="text-xs text-gray-400 leading-relaxed">{{ t('bmi.idealNote') }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BodyFields from './BodyFields.vue'
import { useBodyMetrics } from './useBodyMetrics'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const { unit, heightCm, heightFt, heightIn, sex, frame, heightCmVal, resetBody } = useBodyMetrics()

const frames = [
  { key: 'small' },
  { key: 'medium' },
  { key: 'large' },
]
const frameLabel = computed(() => t(`bmi.frames.${frame.value}`))

const clear = resetBody

const r1 = (v) => Math.round(v * 10) / 10
const toLb = (kg) => Math.round(kg / 0.453592)

const result = computed(() => {
  const cm = heightCmVal.value
  if (!cm) return null
  const m2 = (cm / 100) ** 2
  const low = 18.5 * m2
  const high = 24.9 * m2

  // Devine ideal weight, adjusted by frame.
  const inchesOver5ft = Math.max(0, cm / 2.54 - 60)
  const devine = (sex.value === 'male' ? 50 : 45.5) + 2.3 * inchesOver5ft
  const frameFactor = frame.value === 'small' ? 0.9 : frame.value === 'large' ? 1.1 : 1
  const target = devine * frameFactor

  return {
    low: r1(low), high: r1(high),
    lowLb: toLb(low), highLb: toLb(high),
    devine: r1(devine), target: r1(target),
  }
})
</script>
