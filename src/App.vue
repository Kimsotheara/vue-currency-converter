<template>
  <div class="h-dvh flex flex-col" :class="activeKey ? 'bg-gray-100 dark:bg-slate-900' : 'bg-gradient-to-b from-indigo-50 via-purple-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-800'">

    <!-- App bar -->
    <header
      class="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/70 dark:border-slate-800 shadow-sm shadow-black/[0.03]"
      style="padding-top: env(safe-area-inset-top)"
    >
      <div :class="[containerWidth, 'mx-auto h-14 flex items-center gap-2 px-2 sm:px-3 select-none']">

        <!-- Feature view: back button · centered title · action -->
        <template v-if="activeTab">
          <button
            @click="activeKey = null"
            class="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-90 transition"
            aria-label="Back to home"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 class="flex-1 min-w-0 text-center text-base font-semibold text-gray-800 dark:text-slate-100 truncate px-1">
            {{ activeTab.label }}
          </h1>
        </template>

        <!-- Home view: brand -->
        <template v-else>
          <button
            @click="refreshApp"
            class="flex-1 min-w-0 flex items-center gap-3 group text-left"
            title="Refresh app"
          >
            <span class="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-purple-500/20 group-active:scale-90 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
              </svg>
            </span>
            <span class="min-w-0 leading-tight">
              <span class="block text-[11px] text-gray-400 dark:text-slate-500 font-medium">Welcome back</span>
              <span class="block text-lg font-bold text-gray-800 dark:text-slate-100 truncate group-hover:text-purple-600 transition-colors">Toolkit</span>
            </span>
          </button>
        </template>

        <!-- Theme toggle (consistent on both views) -->
        <button
          @click="toggleTheme"
          class="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-90 transition"
          :aria-label="dark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <svg v-if="!dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <circle cx="12" cy="12" r="4.5" />
            <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Home: scrollable app grid with a pinned footer -->
    <template v-if="!activeKey">
      <div class="flex-1 overflow-y-auto px-4 pt-6 pb-4">
        <div class="w-full max-w-lg md:max-w-2xl mx-auto">
          <HomeGrid :tabs="tabs" @select="openFeature" />
        </div>
      </div>
      <footer class="shrink-0 py-3 text-center text-xs text-gray-400 border-t border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur">
        @theara.dev
      </footer>
    </template>

    <!-- Feature -->
    <div v-else class="flex-1 overflow-y-auto pt-6 pb-10 px-4">
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
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent, onMounted } from 'vue'
import HomeGrid         from './components/HomeGrid.vue'
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
  { key: 'speedtest',   label: 'Internet Speed Test',          short: 'Speed Test',  icon: '🚀', bg: 'from-sky-400 to-blue-500' },
  { key: 'currency',    label: 'Currency Exchange',            short: 'Currency',    icon: '💱', bg: 'from-emerald-400 to-green-500' },
  { key: 'vehicleloan', label: 'Loan Calculate',               short: 'Loan',        icon: '🏦', bg: 'from-amber-400 to-orange-500' },
  { key: 'wifi',        label: 'Wi-Fi QR Generate',            short: 'Wi-Fi QR',    icon: '📶', bg: 'from-indigo-400 to-blue-500' },
  { key: 'unit',        label: 'Unit Exchange',                short: 'Units',       icon: '📏', bg: 'from-teal-400 to-cyan-500' },
  { key: 'discount',    label: 'Discount Calculate',           short: 'Discount',    icon: '🏷️', bg: 'from-pink-400 to-rose-500' },
  { key: 'bmi',         label: 'BMI Calculate',                short: 'BMI',         icon: '❤️', bg: 'from-red-400 to-rose-500' },
  { key: 'wheel',       label: 'Spin Wheel',                   short: 'Spin Wheel',  icon: '🎡', bg: 'from-fuchsia-400 to-purple-500' },
  { key: 'linkqr',      label: 'Link QR Generate',             short: 'Link QR',     icon: '🔗', bg: 'from-cyan-400 to-sky-500' },
  { key: 'savinggoal',  label: 'Saving Goal Calculate',        short: 'Saving Goal', icon: '🎯', bg: 'from-lime-400 to-green-500' },
  { key: 'invoice',     label: 'Quotation / Invoice Generate', short: 'Invoice',     icon: '🧾', bg: 'from-slate-400 to-gray-500' },
  { key: 'invitation',  label: 'Invitation Card Generate',     short: 'Invitation',  icon: '💌', bg: 'from-rose-400 to-pink-500' },
  { key: 'weather',     label: 'Cambodia Weather',             short: 'Weather',     icon: '⛅', bg: 'from-sky-400 to-indigo-400' },
  { key: 'football',    label: 'Football Live Scores',         short: 'Live Scores', icon: '⚽', bg: 'from-green-500 to-emerald-600' },
]

const activeKey = ref(null) // null = home grid
const activeTab = computed(() => tabs.find(t => t.key === activeKey.value) || null)

// Dark / light theme (class-based, persisted)
const dark = ref(false)
const applyTheme = () => document.documentElement.classList.toggle('dark', dark.value)
const toggleTheme = () => {
  dark.value = !dark.value
  try { localStorage.setItem('app-theme', dark.value ? 'dark' : 'light') } catch {}
  applyTheme()
}

onMounted(() => {
  try { dark.value = localStorage.getItem('app-theme') === 'dark' } catch {}
  applyTheme()
})

const refreshApp = () => window.location.reload()

const openFeature = (key) => { activeKey.value = key }

// Form-heavy tools get a wider canvas on tablet / desktop
const wideTabs = ['invoice', 'invitation', 'weather', 'football']
const containerWidth = computed(() =>
  wideTabs.includes(activeKey.value)
    ? 'w-full max-w-lg md:max-w-3xl lg:max-w-4xl'
    : 'w-full max-w-lg md:max-w-xl',
)
</script>
