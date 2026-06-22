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
import LoanForm from './LoanForm.vue'
import LoanResult from './LoanResult.vue'
import { useLoanCalculator } from './useLoanCalculator'

const { principal, rate, rateType, term, result, error, calculate, clear } = useLoanCalculator()
</script>
