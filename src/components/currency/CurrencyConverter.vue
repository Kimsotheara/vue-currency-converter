<template>
  <div class="space-y-4">

    <!-- Tabs: Convert · Salary Tax -->
    <div class="flex rounded-xl bg-gray-100 p-1">
      <button
        v-for="t in tabs"
        :key="t.key"
        @click="tab = t.key"
        :class="[
          'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
          tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
        ]"
      >{{ t.label }}</button>
    </div>

    <template v-if="tab === 'convert'">
      <CurrencyForm
        v-model:fromCurrency="fromCurrency"
        v-model:toCurrency="toCurrency"
        v-model:amount="amount"
        :currencyOptions="currencyOptions"
        @switch="switchCurrencies"
        @clear="clear"
      />
      <CurrencyResult
        v-if="result !== null"
        :amount="amount"
        :fromCurrency="fromCurrency"
        :toCurrency="toCurrency"
        :result="result"
      />
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    </template>

    <SalaryTaxCalculator v-else />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import CurrencyForm from './CurrencyForm.vue'
import CurrencyResult from './CurrencyResult.vue'
import SalaryTaxCalculator from './SalaryTaxCalculator.vue'

const tabs = [
  { key: 'convert', label: 'Convert' },
  { key: 'salarytax', label: 'Salary Tax' },
]
const tab = ref('convert')

const currencies = ref({})
const rates = ref({})
const fromCurrency = ref(null)
const toCurrency = ref(null)
const amount = ref(1)
const error = ref(null)

// Result updates live as the amount or selected currencies change.
const result = computed(() => {
  if (
    amount.value === null || amount.value === '' ||
    !rates.value || !fromCurrency.value || !toCurrency.value
  ) return null
  const rateFrom = 1 / rates.value[fromCurrency.value.code]
  const rateTo = rates.value[toCurrency.value.code]
  if (!isFinite(rateFrom) || rateTo === undefined) return null
  return amount.value * rateFrom * rateTo
})

const currencyOptions = computed(() =>
  Object.entries(currencies.value)
    .map(([code, desc]) => ({ code, label: `${desc} (${code})` }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

onMounted(async () => {
  try {
    const [currencyRes, ratesRes] = await Promise.all([
      axios.get('https://openexchangerates.org/api/currencies.json'),
      axios.get('https://api.exchangerate-api.com/v4/latest/USD'),
    ])
    currencies.value = currencyRes.data
    rates.value = ratesRes.data.rates
    setDefaultCurrencies()
  } catch {
    error.value = 'Failed to load currencies or rates.'
  }
})

const switchCurrencies = () => {
  const temp = fromCurrency.value
  fromCurrency.value = toCurrency.value
  toCurrency.value = temp
}

const clear = () => {
  amount.value = 1
  setDefaultCurrencies()
}

const setDefaultCurrencies = () => {
  fromCurrency.value = currencyOptions.value.find(c => c.code === 'USD') ?? null
  toCurrency.value = currencyOptions.value.find(c => c.code === 'KHR') ?? null
}
</script>
