<template>
  <div>

    <!-- FROM Currency -->
    <label>From Currency:</label>
    <Multiselect
      v-model="fromCurrency"
      :options="currencyOptions"
      label="label"
      track-by="code"
      placeholder="Select From Currency"
    />

    <!-- TO Currency -->
    <label>To Currency:</label>
    <Multiselect
      v-model="toCurrency"
      :options="currencyOptions"
      label="label"
      track-by="code"
      placeholder="Select To Currency"
    />

    <!-- Amount -->
    <label>Amount:</label>
    <input type="number" v-model.number="amount" @keyup.enter="convertCurrency"/>

    <div>
      <button class="switch" @click="switchCurrencies">⇄ Switch</button>
      <button class="convert" @click="convertCurrency">Convert</button>
      <button class="clear" @click="clear">Clear</button>
    </div>

    <div v-if="result !== null" class="result-box">
        <span class="amount">{{ formatNumber(amount) }} {{ fromCurrency.code }}</span>
        <span class="equals">=</span>
        <span class="converted">{{ formatNumber(result) }} {{ toCurrency.code }}</span>
    </div>


    <div v-if="error" class="error">{{ error }}</div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

const currencies = ref({})
const rates = ref({})
const fromCurrency = ref(null)
const toCurrency = ref(null)
const amount = ref(1)
const result = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    // Load currency names
    const currencyResponse = await axios.get('https://openexchangerates.org/api/currencies.json')
    currencies.value = currencyResponse.data

    // Load exchange rates
    const ratesResponse = await axios.get('https://api.exchangerate-api.com/v4/latest/USD')
    rates.value = ratesResponse.data.rates

    // Set default selected currencies
    const defaultList = Object.entries(currencies.value).map(([code, desc]) => ({
      code,
      label: `${desc} (${code})`
    })).sort((a, b) => a.label.localeCompare(b.label))

    currencyOptions.value = buildCurrencyOptions()

    setDefaultCurrencies()

  } catch (err) {
    error.value = 'Failed to load currencies or rates.'
  }
})

const currencyOptions = computed(() => {
  return Object.entries(currencies.value).map(([code, desc]) => ({
    code,
    label: `${desc} (${code})`
  })).sort((a, b) => a.label.localeCompare(b.label))
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
  setDefaultCurrencies()
  result.value = null
  
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value)
}

const buildCurrencyOptions = () => {
  return Object.entries(currencies.value).map(([code, desc]) => ({
    code,
    label: `${desc} (${code})`
  })).sort((a, b) => a.label.localeCompare(b.label))
}

const setDefaultCurrencies = () => {
  fromCurrency.value = currencyOptions.value.find(c => c.code === 'USD')
  toCurrency.value = currencyOptions.value.find(c => c.code === 'KHR')
}

</script>
