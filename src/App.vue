<template>
  <div class="min-h-screen bg-gray-100 px-4 py-8 sm:py-12">
    <div class="max-w-lg mx-auto bg-white rounded-2xl shadow-md">
      <div class="px-5 pt-6 pb-0 sm:px-8 rounded-t-2xl overflow-hidden">
        <h1 class="text-2xl font-bold text-gray-800 mb-5">Multiple Tools</h1>
        <TabBar :tabs="tabs" :active="activeTab" @change="activeTab = $event" />
      </div>
      <div class="px-5 py-6 sm:px-8">
        <keep-alive>
          <CurrencyConverter v-if="activeTab === 'currency'" />
          <LoanCalculator v-else-if="activeTab === 'loan'" />
          <WiFiQRGenerator v-else-if="activeTab === 'wifi'" />
          <UnitConverter v-else-if="activeTab === 'unit'" />
          <DiscountCalculator v-else-if="activeTab === 'discount'" />
          <BMICalculator v-else-if="activeTab === 'bmi'" />
        </keep-alive>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TabBar from './components/TabBar.vue'
import CurrencyConverter from './components/currency/CurrencyConverter.vue'
import LoanCalculator from './components/loan/LoanCalculator.vue'
import WiFiQRGenerator from './components/wifi/WiFiQRGenerator.vue'
import UnitConverter from './components/unit/UnitConverter.vue'
import DiscountCalculator from './components/discount/DiscountCalculator.vue'
import BMICalculator from './components/bmi/BMICalculator.vue'

const tabs = [
  { key: 'currency', label: 'Currency' },
  { key: 'loan', label: 'Loan' },
  { key: 'wifi', label: 'Wi-Fi QR' },
  { key: 'unit', label: 'Unit' },
  { key: 'discount', label: 'Discount' },
  { key: 'bmi', label: 'BMI' },
]
const activeTab = ref('currency')
</script>
