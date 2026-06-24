<template>
  <div class="space-y-4">

    <!-- Sex -->
    <div class="flex rounded-xl bg-gray-100 p-1">
      <button v-for="s in [['male','Male'],['female','Female']]" :key="s[0]" @click="sex = s[0]"
        :class="['flex-1 py-2 rounded-lg text-sm font-semibold transition-colors', sex === s[0] ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500']">{{ s[1] }}</button>
    </div>

    <!-- Age -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Age (years)</label>
      <input :value="age ?? ''" @input="age = $event.target.value === '' ? null : Number($event.target.value)"
        type="number" inputmode="numeric" min="0" placeholder="e.g. 28"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>

    <BodyFields v-model:unit="unit" v-model:weight="weight"
      v-model:heightCm="heightCm" v-model:heightFt="heightFt" v-model:heightIn="heightIn" />

    <!-- Activity -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Activity level</label>
      <select v-model="activity"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        <option v-for="a in activities" :key="a.factor" :value="a.factor">{{ a.label }}</option>
      </select>
    </div>

    <button @click="clear" class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors">Clear</button>

    <div v-if="result" class="rounded-2xl overflow-hidden shadow-md">
      <div class="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-white">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">Maintenance Calories</p>
        <p class="text-4xl font-bold">{{ fmt(result.tdee) }} <span class="text-lg font-semibold opacity-90">kcal/day</span></p>
        <p class="text-xs opacity-80 mt-1">BMR {{ fmt(result.bmr) }} kcal · ×{{ activity }} activity</p>
      </div>
      <div class="bg-white divide-y divide-gray-100">
        <div v-for="g in result.goals" :key="g.label" class="flex justify-between items-center px-5 py-3">
          <span class="text-sm" :class="g.highlight ? 'font-bold text-gray-800' : 'text-gray-500'">{{ g.label }}</span>
          <span class="text-sm font-semibold" :class="g.color">{{ fmt(g.kcal) }} kcal</span>
        </div>
      </div>
    </div>

    <p class="text-xs text-gray-400 leading-relaxed">Uses the Mifflin–St Jeor equation. Weight goals assume ~0.5 kg/week (≈500 kcal/day) and ~0.25 kg/week (≈250 kcal/day). Estimates only.</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BodyFields from './BodyFields.vue'
import { useBodyMetrics } from './useBodyMetrics'

const { unit, weight, heightCm, heightFt, heightIn, sex, age, activity, weightKg, heightCmVal, resetBody } = useBodyMetrics()

const activities = [
  { factor: 1.2,   label: 'Sedentary — little/no exercise' },
  { factor: 1.375, label: 'Light — 1–3 days/week' },
  { factor: 1.55,  label: 'Moderate — 3–5 days/week' },
  { factor: 1.725, label: 'Active — 6–7 days/week' },
  { factor: 1.9,   label: 'Very active — hard daily / physical job' },
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
      { label: 'Lose weight (−0.5 kg/wk)',  kcal: tdee - 500, color: 'text-emerald-600' },
      { label: 'Mild loss (−0.25 kg/wk)',   kcal: tdee - 250, color: 'text-emerald-500' },
      { label: 'Maintain weight',           kcal: tdee, highlight: true, color: 'text-gray-800' },
      { label: 'Mild gain (+0.25 kg/wk)',   kcal: tdee + 250, color: 'text-blue-500' },
      { label: 'Gain weight (+0.5 kg/wk)',  kcal: tdee + 500, color: 'text-blue-600' },
    ],
  }
})

const fmt = (v) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max(0, v))
</script>
