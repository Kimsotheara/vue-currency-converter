<template>
  <div class="space-y-4">
    <LoanForm
      v-model:principal="principal"
      v-model:rate="rate"
      v-model:rateType="rateType"
      v-model:term="term"
      @calculate="calculate"
      @clear="clear"
    />
    <LoanResult v-if="result" :result="result" />
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import LoanForm from './LoanForm.vue'
import LoanResult from './LoanResult.vue'

const principal = ref(null)
const rate = ref(null)
const rateType = ref('monthly')
const term = ref(null)
const result = ref(null)
const error = ref(null)

watch(rateType, (newType, oldType) => {
  if (rate.value === null) return
  if (newType === 'yearly' && oldType === 'monthly') {
    rate.value = parseFloat((rate.value * 12).toFixed(4))
  } else if (newType === 'monthly' && oldType === 'yearly') {
    rate.value = parseFloat((rate.value / 12).toFixed(4))
  }
})

const calculate = () => {
  error.value = null
  result.value = null

  if (!principal.value || rate.value === null || !term.value) {
    error.value = 'Please fill in all fields.'
    return
  }
  if (principal.value <= 0 || rate.value < 0 || term.value < 1) {
    error.value = 'Please enter valid positive values.'
    return
  }

  const monthlyRate = rateType.value === 'monthly' ? rate.value : rate.value / 12
  const annualRate = monthlyRate * 12
  const r = monthlyRate / 100
  const n = term.value

  const monthly =
    r === 0
      ? principal.value / n
      : (principal.value * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)

  const total = monthly * n

  result.value = {
    monthly,
    total,
    interest: total - principal.value,
    monthlyRate,
    annualRate,
    effectiveAnnual: (Math.pow(1 + r, 12) - 1) * 100,
  }
}

const clear = () => {
  principal.value = null
  rate.value = null
  rateType.value = 'monthly'
  term.value = null
  result.value = null
  error.value = null
}
</script>
