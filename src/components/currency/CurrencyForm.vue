<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">From Currency</label>
      <Multiselect
        :modelValue="fromCurrency"
        @update:modelValue="$emit('update:fromCurrency', $event)"
        :options="currencyOptions"
        label="label"
        track-by="code"
        placeholder="Select currency"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">To Currency</label>
      <Multiselect
        :modelValue="toCurrency"
        @update:modelValue="$emit('update:toCurrency', $event)"
        :options="currencyOptions"
        label="label"
        track-by="code"
        placeholder="Select currency"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Amount</label>
      <input
        type="number"
        inputmode="decimal"
        :value="amount"
        @input="$emit('update:amount', toNum($event))"
        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div class="flex flex-wrap gap-2 pt-1">
      <button
        @click="$emit('switch')"
        class="flex-1 min-w-24 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm sm:text-base"
      >
        ⇄ Switch
      </button>
      <button
        @click="$emit('clear')"
        class="flex-1 min-w-24 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm sm:text-base"
      >
        Clear
      </button>
    </div>
  </div>
</template>

<script setup>
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

defineProps({
  fromCurrency: Object,
  toCurrency: Object,
  amount: Number,
  currencyOptions: Array,
})
defineEmits(['update:fromCurrency', 'update:toCurrency', 'update:amount', 'switch', 'clear'])

const toNum = (e) => (e.target.value === '' ? null : Number(e.target.value))
</script>
