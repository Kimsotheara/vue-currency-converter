<template>
  <div class="space-y-4">
    <CurrencyForm
      v-model:fromCurrency="fromCurrency"
      v-model:toCurrency="toCurrency"
      v-model:amount="amount"
      :currencyOptions="currencyOptions"
      @convert="convertCurrency"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import CurrencyForm from './CurrencyForm.vue'
import CurrencyResult from './CurrencyResult.vue'

const currencies = ref({})
const rates = ref({})
const fromCurrency = ref(null)
const toCurrency = ref(null)
const amount = ref(1)
const result = ref(null)
const error = ref(null)

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

const convertCurrency = () => {
  if (!rates.value || !fromCurrency.value || !toCurrency.value) return
  const rateFrom = 1 / rates.value[fromCurrency.value.code]
  const rateTo = rates.value[toCurrency.value.code]
  result.value = amount.value * rateFrom * rateTo
}

const switchCurrencies = () => {
  const temp = fromCurrency.value
  fromCurrency.value = toCurrency.value
  toCurrency.value = temp
}

const clear = () => {
  amount.value = 1
  result.value = null
  setDefaultCurrencies()
}

const setDefaultCurrencies = () => {
  fromCurrency.value = currencyOptions.value.find(c => c.code === 'USD') ?? null
  toCurrency.value = currencyOptions.value.find(c => c.code === 'KHR') ?? null
}
</script>
