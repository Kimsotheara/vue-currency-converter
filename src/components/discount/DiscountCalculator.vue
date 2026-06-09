<template>
  <div class="space-y-4">

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Original Price ($)</label>
      <input
        :value="price ?? ''"
        @input="price = $event.target.value === '' ? null : Number($event.target.value)"
        type="number"
        placeholder="e.g. 100"
        min="0"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Discount (%)</label>
      <input
        :value="discount ?? ''"
        @input="discount = $event.target.value === '' ? null : Number($event.target.value)"
        type="number"
        placeholder="e.g. 20"
        min="0"
        max="100"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <button
      @click="clear"
      class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
    >
      Clear
    </button>

    <div v-if="result" class="rounded-2xl overflow-hidden shadow-md">

      <div class="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-white">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">Final Price</p>
        <p class="text-4xl font-bold">${{ fmt(result.finalPrice) }}</p>
      </div>

      <div class="bg-white divide-y divide-gray-100">
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Original Price</span>
          <span class="text-sm font-semibold text-gray-700">${{ fmt(price) }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Discount ({{ discount }}%)</span>
          <span class="text-sm font-semibold text-red-500">− ${{ fmt(result.saved) }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3 bg-green-50">
          <span class="text-sm font-bold text-green-700">You Save</span>
          <span class="text-base font-bold text-green-600">${{ fmt(result.saved) }}</span>
        </div>
      </div>

    </div>

    <p v-if="error" class="text-sm text-red-500 font-medium">{{ error }}</p>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const price = ref(null)
const discount = ref(null)

const clear = () => {
  price.value = null
  discount.value = null
}

const error = computed(() => {
  if (!price.value && !discount.value) return null
  if (price.value <= 0) return 'Price must be greater than 0.'
  if (discount.value < 0 || discount.value > 100) return 'Discount must be between 0 and 100.'
  return null
})

const result = computed(() => {
  if (!price.value || discount.value === null || error.value) return null
  const saved = price.value * discount.value / 100
  return { saved, finalPrice: price.value - saved }
})

const fmt = (v) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
</script>
