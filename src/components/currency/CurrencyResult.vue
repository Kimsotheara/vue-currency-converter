<template>
  <div class="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 p-5 text-white shadow-lg">
    <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
      <span class="text-xl sm:text-2xl font-bold">{{ fmt(amount) }} {{ fromCurrency?.code }}</span>
      <span class="text-xl sm:text-2xl opacity-75">=</span>
      <span class="text-xl sm:text-2xl font-bold">{{ fmt(result) }} {{ toCurrency?.code }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  amount: Number,
  fromCurrency: Object,
  toCurrency: Object,
  result: Number,
})

const fmt = (v) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(v)
</script>
