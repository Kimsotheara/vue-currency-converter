<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col transition-colors">

    <!-- Home launcher -->
    <HomeScreen
      v-if="!activeKey"
      :tabs="tabs"
      :is-dark="isDark"
      @select="activeKey = $event"
      @toggle-theme="isDark = !isDark"
    />

    <!-- Tool view -->
    <template v-else>
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div :class="[containerWidth, 'mx-auto flex items-center gap-3 px-4 py-4']">
          <button
            @click="activeKey = null"
            class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-gray-700 dark:text-gray-200">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span class="text-2xl shrink-0">{{ activeTab.icon }}</span>
          <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100 truncate min-w-0">{{ activeTab.label }}</h1>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto pt-5 pb-8 px-4">
        <div :class="[containerWidth, 'mx-auto bg-white rounded-2xl shadow-sm p-5 sm:p-8']">
          <keep-alive>
            <InternetSpeedTest v-if="activeTab.key === 'speedtest'" />
            <CurrencyConverter v-else-if="activeTab.key === 'currency'" />
            <VehicleLoanCalculator v-else-if="activeTab.key === 'vehicleloan'" />
            <WiFiQRGenerator v-else-if="activeTab.key === 'wifi'" />
            <UnitConverter v-else-if="activeTab.key === 'unit'" />
            <DiscountCalculator v-else-if="activeTab.key === 'discount'" />
            <BMICalculator v-else-if="activeTab.key === 'bmi'" />
            <WheelSpinner v-else-if="activeTab.key === 'wheel'" />
            <LinkQRGenerator v-else-if="activeTab.key === 'linkqr'" />
            <SavingGoalCalculator v-else-if="activeTab.key === 'savinggoal'" />
            <InvoiceGenerator v-else-if="activeTab.key === 'invoice'" />
            <InvitationCardGenerator v-else-if="activeTab.key === 'invitation'" />
            <CambodiaWeather v-else-if="activeTab.key === 'weather'" />
            <FootballScores v-else-if="activeTab.key === 'football'" />
          </keep-alive>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import HomeScreen        from './components/HomeScreen.vue'
import CurrencyConverter from './components/currency/CurrencyConverter.vue'
import VehicleLoanCalculator from './components/vehicleloan/VehicleLoanCalculator.vue'
import WiFiQRGenerator   from './components/wifi/WiFiQRGenerator.vue'
import UnitConverter     from './components/unit/UnitConverter.vue'
import DiscountCalculator from './components/discount/DiscountCalculator.vue'
import BMICalculator     from './components/bmi/BMICalculator.vue'
import WheelSpinner      from './components/wheel/WheelSpinner.vue'
import LinkQRGenerator   from './components/linkqr/LinkQRGenerator.vue'
import SavingGoalCalculator from './components/savinggoal/SavingGoalCalculator.vue'
const InvoiceGenerator = defineAsyncComponent(() => import('./components/invoice/InvoiceGenerator.vue'))
const InvitationCardGenerator = defineAsyncComponent(() => import('./components/invitation/InvitationCardGenerator.vue'))
const CambodiaWeather = defineAsyncComponent(() => import('./components/weather/CambodiaWeather.vue'))
const FootballScores = defineAsyncComponent(() => import('./components/football/FootballScores.vue'))
const InternetSpeedTest = defineAsyncComponent(() => import('./components/internetspeed/InternetSpeedTest.vue'))

const tabs = [
  { key: 'speedtest',  label: 'Internet Speed Test',         short: 'Speed Test',  icon: '🚀', color: 'from-blue-500 to-blue-600' },
  { key: 'currency',   label: 'Currency Exchange',           short: 'Currency',    icon: '💱', color: 'from-emerald-400 to-green-500' },
  { key: 'vehicleloan',label: 'Loan Calculate',              short: 'Loan',        icon: '🏦', color: 'from-orange-400 to-amber-500' },
  { key: 'wifi',       label: 'Wi-Fi QR Generate',           short: 'Wi-Fi QR',    icon: '📶', color: 'from-violet-500 to-purple-600' },
  { key: 'unit',       label: 'Unit Exchange',               short: 'Units',       icon: '📏', color: 'from-teal-400 to-teal-500' },
  { key: 'discount',   label: 'Discount Calculate',          short: 'Discount',    icon: '🏷️', color: 'from-pink-500 to-rose-500' },
  { key: 'bmi',        label: 'BMI Calculate',               short: 'BMI',         icon: '❤️', color: 'from-red-500 to-red-600' },
  { key: 'wheel',      label: 'Spin Wheel',                  short: 'Spin Wheel',  icon: '🎡', color: 'from-purple-500 to-fuchsia-500' },
  { key: 'linkqr',     label: 'Link QR Generate',            short: 'Link QR',     icon: '🔗', color: 'from-cyan-400 to-sky-500' },
  { key: 'savinggoal', label: 'Saving Goal Calculate',       short: 'Saving Goal', icon: '🎯', color: 'from-green-400 to-emerald-500' },
  { key: 'invoice',    label: 'Quotation / Invoice Generate',short: 'Invoice',     icon: '🧾', color: 'from-gray-400 to-gray-500' },
  { key: 'invitation', label: 'Invitation Card Generate',    short: 'Invitation',  icon: '💌', color: 'from-pink-400 to-rose-400' },
  { key: 'weather',    label: 'Cambodia Weather',            short: 'Weather',     icon: '⛅', color: 'from-sky-400 to-blue-500' },
  { key: 'football',   label: 'Football Live Scores',        short: 'Live Scores', icon: '⚽', color: 'from-emerald-400 to-green-500' },
]

const activeKey = ref(null)
const activeTab = computed(() => tabs.find(t => t.key === activeKey.value))

// Theme: persisted, falls back to OS preference
const stored = localStorage.getItem('theme')
const isDark = ref(
  stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches,
)
watch(
  isDark,
  (dark) => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  },
  { immediate: true },
)

// Form-heavy tools get a wider canvas on tablet / desktop
const wideTabs = ['invoice', 'invitation', 'weather', 'football']
const containerWidth = computed(() =>
  wideTabs.includes(activeKey.value)
    ? 'w-full max-w-lg md:max-w-3xl lg:max-w-4xl'
    : 'w-full max-w-lg md:max-w-xl',
)
</script>
