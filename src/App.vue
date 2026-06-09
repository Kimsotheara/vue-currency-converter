<template>
  <div class="min-h-screen bg-gray-100 px-4 py-8 sm:py-12">
    <div class="max-w-lg mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
      <div class="px-5 pt-6 pb-0 sm:px-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-5">Calculation Tools</h1>
        <TabBar :tabs="tabs" :active="activeTab" @change="activeTab = $event" />
      </div>
      <div class="px-5 py-6 sm:px-8">
        <CurrencyConverter v-if="activeTab === 'currency'" />
        <LoanCalculator v-else-if="activeTab === 'loan'" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TabBar from './components/TabBar.vue'
import CurrencyConverter from './components/currency/CurrencyConverter.vue'
import LoanCalculator from './components/loan/LoanCalculator.vue'

const tabs = [
  { key: 'currency', label: 'Currency' },
  { key: 'loan', label: 'Loan' },
]
const activeTab = ref('currency')
</script>
