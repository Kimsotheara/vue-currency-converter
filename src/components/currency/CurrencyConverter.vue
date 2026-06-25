<template>
  <div class="space-y-4">

    <!-- Tabs: Convert · Salary Tax -->
    <div class="flex rounded-xl bg-gray-100 p-1">
      <button
        v-for="tb in tabs"
        :key="tb.key"
        @click="tab = tb.key"
        :class="[
          'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
          tab === tb.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
        ]"
      >{{ t(tb.labelKey) }}</button>
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
import { useI18n } from '@/i18n'
import CurrencyForm from './CurrencyForm.vue'
import CurrencyResult from './CurrencyResult.vue'
import SalaryTaxCalculator from './SalaryTaxCalculator.vue'

const { t } = useI18n()

const tabs = [
  { key: 'convert', labelKey: 'currency.convert' },
  { key: 'salarytax', labelKey: 'currency.salaryTax' },
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
    error.value = t('currency.loadError')
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
