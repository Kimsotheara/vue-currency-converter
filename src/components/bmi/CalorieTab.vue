<template>
  <div class="space-y-4">

    <!-- Sex -->
    <div class="flex rounded-xl bg-gray-100 p-1">
      <button v-for="s in [['male','bmi.male'],['female','bmi.female']]" :key="s[0]" @click="sex = s[0]"
        :class="['flex-1 py-2 rounded-lg text-sm font-semibold transition-colors', sex === s[0] ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500']">{{ t(s[1]) }}</button>
    </div>

    <!-- Age -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('bmi.age') }}</label>
      <input :value="age ?? ''" @input="age = $event.target.value === '' ? null : Number($event.target.value)"
        type="number" inputmode="numeric" min="0" placeholder="e.g. 28"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>

    <BodyFields v-model:unit="unit" v-model:weight="weight"
      v-model:heightCm="heightCm" v-model:heightFt="heightFt" v-model:heightIn="heightIn" />

    <!-- Activity -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('bmi.activityLevel') }}</label>
      <select v-model="activity"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        <option v-for="a in activities" :key="a.factor" :value="a.factor">{{ t(a.labelKey) }}</option>
      </select>
    </div>

    <button @click="clear" class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors">{{ t('bmi.clear') }}</button>

    <div v-if="result" class="rounded-2xl overflow-hidden shadow-md">
      <div class="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-white">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">{{ t('bmi.maintenanceCalories') }}</p>
        <p class="text-4xl font-bold">{{ fmt(result.tdee) }} <span class="text-lg font-semibold opacity-90">{{ t('bmi.perDay') }}</span></p>
        <p class="text-xs opacity-80 mt-1">{{ t('bmi.bmrLine', { bmr: fmt(result.bmr), activity }) }}</p>
      </div>
      <div class="bg-white divide-y divide-gray-100">
        <div v-for="g in result.goals" :key="g.labelKey" class="flex justify-between items-center px-5 py-3">
          <span class="text-sm" :class="g.highlight ? 'font-bold text-gray-800' : 'text-gray-500'">{{ t(g.labelKey) }}</span>
          <span class="text-sm font-semibold" :class="g.color">{{ fmt(g.kcal) }} kcal</span>
        </div>
      </div>
    </div>

    <p class="text-xs text-gray-400 leading-relaxed">{{ t('bmi.calorieNote') }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BodyFields from './BodyFields.vue'
import { useBodyMetrics } from './useBodyMetrics'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const { unit, weight, heightCm, heightFt, heightIn, sex, age, activity, weightKg, heightCmVal, resetBody } = useBodyMetrics()

const activities = [
  { factor: 1.2,   labelKey: 'bmi.activities.sedentary' },
  { factor: 1.375, labelKey: 'bmi.activities.light' },
  { factor: 1.55,  labelKey: 'bmi.activities.moderate' },
  { factor: 1.725, labelKey: 'bmi.activities.active' },
  { factor: 1.9,   labelKey: 'bmi.activities.veryActive' },
]

const clear = resetBody

const result = computed(() => {
  if (!weightKg.value || !heightCmVal.value || !age.value || age.value <= 0) return null
  // Mifflin–St Jeor
  const base = 10 * weightKg.value + 6.25 * heightCmVal.value - 5 * age.value
  const bmr = sex.value === 'male' ? base + 5 : base - 161
  const tdee = bmr * activity.value
  return {
    bmr, tdee,
    goals: [
      { labelKey: 'bmi.goals.lose',     kcal: tdee - 500, color: 'text-emerald-600' },
      { labelKey: 'bmi.goals.mildLoss', kcal: tdee - 250, color: 'text-emerald-500' },
      { labelKey: 'bmi.goals.maintain', kcal: tdee, highlight: true, color: 'text-gray-800' },
      { labelKey: 'bmi.goals.mildGain', kcal: tdee + 250, color: 'text-blue-500' },
      { labelKey: 'bmi.goals.gain',     kcal: tdee + 500, color: 'text-blue-600' },
    ],
  }
})

const fmt = (v) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max(0, v))
</script>
