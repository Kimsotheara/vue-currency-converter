<template>
  <div class="space-y-4">

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Goal Amount ($)</label>
      <input
        :value="goalAmount ?? ''"
        @input="goalAmount = $event.target.value === '' ? null : Number($event.target.value)"
        type="number"
        placeholder="e.g. 10000"
        min="0"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Current Savings ($)</label>
      <input
        :value="currentSavings ?? ''"
        @input="currentSavings = $event.target.value === '' ? null : Number($event.target.value)"
        type="number"
        placeholder="e.g. 2000"
        min="0"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Target (Months)</label>
      <input
        :value="months ?? ''"
        @input="months = $event.target.value === '' ? null : Number($event.target.value)"
        type="number"
        placeholder="e.g. 24"
        min="1"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

<!--    <div>-->
<!--      <label class="block text-sm font-semibold text-gray-700 mb-1">Expected Interest Rate (% per year, optional)</label>-->
<!--      <input-->
<!--        :value="interestRate ?? ''"-->
<!--        @input="interestRate = $event.target.value === '' ? null : Number($event.target.value)"-->
<!--        type="number"-->
<!--        placeholder="e.g. 5"-->
<!--        min="0"-->
<!--        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"-->
<!--      />-->
<!--    </div>-->

    <button
      @click="clear"
      class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
    >
      Clear
    </button>

    <div v-if="result" class="rounded-2xl overflow-hidden shadow-md">

      <div class="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-white">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">Monthly Savings Required</p>
        <p class="text-4xl font-bold">${{ fmt(result.monthly) }}</p>
      </div>

      <!-- Progress bar -->
      <div class="bg-white px-5 py-4">
        <div class="flex justify-between text-xs text-gray-500 font-semibold mb-1">
          <span>Saved: ${{ fmt(currentSavings || 0) }}</span>
          <span>Goal: ${{ fmt(goalAmount) }}</span>
        </div>
        <div class="relative h-3 rounded-full overflow-hidden bg-gray-100">
          <div
            class="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all"
            :style="{ width: result.progress + '%' }"
          />
        </div>
        <p class="text-xs text-gray-400 mt-1 text-right">{{ result.progress.toFixed(1) }}% complete</p>
      </div>

      <div class="bg-white divide-y divide-gray-100">
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Remaining Goal</span>
          <span class="text-sm font-semibold text-gray-700">${{ fmt(result.remaining) }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Weekly Savings Required</span>
          <span class="text-sm font-semibold text-gray-700">${{ fmt(result.weekly) }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Daily Savings Required</span>
          <span class="text-sm font-semibold text-gray-700">${{ fmt(result.daily) }}</span>
        </div>
      </div>

    </div>

    <p v-if="error" class="text-sm text-red-500 font-medium">{{ error }}</p>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const goalAmount = ref(null)
const currentSavings = ref(null)
const months = ref(null)
// const interestRate = ref(null)

const clear = () => {
  goalAmount.value = null
  currentSavings.value = null
  months.value = null
}

const error = computed(() => {
  if (!goalAmount.value && !months.value) return null
  if (goalAmount.value <= 0) return 'Goal amount must be greater than 0.'
  if (months.value <= 0) return 'Months must be greater than 0.'
  if (currentSavings.value < 0) return 'Current savings cannot be negative.'
  // if (interestRate.value < 0) return 'Interest rate cannot be negative.'
  return null
})

const result = computed(() => {
  if (!goalAmount.value || !months.value || error.value) return null

  const saved = currentSavings.value || 0
  let remaining = goalAmount.value - saved

  // Apply expected interest growth on current savings (monthly compounding)
  // if (interestRate.value) {
  //   const monthlyRate = interestRate.value / 100 / 12
  //   const futureValueOfSavings = saved * Math.pow(1 + monthlyRate, months.value)
  //   remaining = goalAmount.value - futureValueOfSavings
  // }

  remaining = Math.max(0, remaining)

  const monthly = remaining / months.value
  const weekly = monthly / (52 / 12)
  const daily = monthly / 30

  const progress = Math.min(100, (saved / goalAmount.value) * 100)

  return { remaining, monthly, weekly, daily, progress }
})

const fmt = (v) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
</script>
