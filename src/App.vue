<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">

    <!-- Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-lg mx-auto flex items-center gap-3 px-4 py-4">
        <button
          @click="drawerOpen = true"
          class="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
        >
          <span class="w-5 h-0.5 bg-gray-700 rounded-full"></span>
          <span class="w-5 h-0.5 bg-gray-700 rounded-full"></span>
          <span class="w-5 h-0.5 bg-gray-700 rounded-full"></span>
        </button>
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ activeTab.icon }}</span>
          <h1 class="text-lg font-bold text-gray-800">{{ activeTab.label }}</h1>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto pt-5 pb-8 px-4">
      <div class="max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-5 sm:p-8">
        <keep-alive>
          <CurrencyConverter v-if="activeTab.key === 'currency'" />
          <LoanCalculator v-else-if="activeTab.key === 'loan'" />
          <WiFiQRGenerator v-else-if="activeTab.key === 'wifi'" />
          <UnitConverter v-else-if="activeTab.key === 'unit'" />
          <DiscountCalculator v-else-if="activeTab.key === 'discount'" />
          <BMICalculator v-else-if="activeTab.key === 'bmi'" />
        </keep-alive>
      </div>
    </div>

    <!-- Drawer -->
    <DrawerMenu
      :open="drawerOpen"
      :tabs="tabs"
      :active="activeTab.key"
      @close="drawerOpen = false"
      @change="setTab"
    />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DrawerMenu from './components/DrawerMenu.vue'
import CurrencyConverter from './components/currency/CurrencyConverter.vue'
import LoanCalculator from './components/loan/LoanCalculator.vue'
import WiFiQRGenerator from './components/wifi/WiFiQRGenerator.vue'
import UnitConverter from './components/unit/UnitConverter.vue'
import DiscountCalculator from './components/discount/DiscountCalculator.vue'
import BMICalculator from './components/bmi/BMICalculator.vue'

const tabs = [
  { key: 'currency', label: 'Currency',  icon: '💱' },
  { key: 'loan',     label: 'Loan',      icon: '🏦' },
  { key: 'wifi',     label: 'Wi-Fi QR',  icon: '📶' },
  { key: 'unit',     label: 'Unit',      icon: '📏' },
  { key: 'discount', label: 'Discount',  icon: '🏷️' },
  { key: 'bmi',      label: 'BMI',       icon: '❤️' },
]

const activeKey = ref('currency')
const drawerOpen = ref(false)

const activeTab = computed(() => tabs.find(t => t.key === activeKey.value))
const setTab = (key) => { activeKey.value = key }
</script>
