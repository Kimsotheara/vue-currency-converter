<template>
  <div class="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 p-5 text-white shadow-lg space-y-4">
    <div>
      <p class="text-xs font-bold uppercase tracking-widest opacity-70 mb-3">Payment Summary</p>
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-sm sm:text-base opacity-90">Monthly Payment</span>
          <span class="text-lg sm:text-xl font-bold">${{ fmt(result.monthly) }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm sm:text-base opacity-90">Total Payment</span>
          <span class="text-lg sm:text-xl font-bold">${{ fmt(result.total) }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm sm:text-base opacity-90">Total Interest</span>
          <span class="text-lg sm:text-xl font-bold">${{ fmt(result.interest) }}</span>
        </div>
      </div>
    </div>

    <div class="border-t border-white/30 pt-4">
      <p class="text-xs font-bold uppercase tracking-widest opacity-70 mb-3">Rate Breakdown</p>
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-sm sm:text-base opacity-90">Monthly Rate</span>
          <span class="text-lg sm:text-xl font-bold">{{ result.monthlyRate.toFixed(4) }}%</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm sm:text-base opacity-90">Nominal Annual Rate</span>
          <span class="text-lg sm:text-xl font-bold">{{ result.annualRate.toFixed(4) }}%</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm sm:text-base opacity-90">Effective Annual Rate</span>
          <span class="text-lg sm:text-xl font-bold">{{ result.effectiveAnnual.toFixed(4) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency } from '@/utils/format'

defineProps({ result: Object })
const fmt = formatCurrency
</script>
