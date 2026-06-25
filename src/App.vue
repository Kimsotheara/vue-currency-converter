<template>
  <div class="h-dvh flex flex-col" :class="activeKey ? 'bg-gray-100 dark:bg-slate-900' : 'bg-gradient-to-b from-indigo-50 via-purple-50 to-white dark:bg-slate-900 dark:bg-none'">

    <!-- App bar -->
    <header
      class="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/5 shadow-[0_1px_12px_-4px_rgba(0,0,0,0.08)]"
      style="padding-top: env(safe-area-inset-top)"
    >
      <div :class="[containerWidth, 'mx-auto h-16 flex items-center gap-2 px-3 sm:px-4 select-none']">

        <!-- Feature view: back button · centered title · action -->
        <template v-if="activeTab">
          <button
            @click="activeKey = null"
            class="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-gray-700 dark:text-slate-200 bg-gray-100/70 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-200/80 dark:hover:bg-white/10 active:scale-90 transition"
            aria-label="Back to home"
          >
            <ChevronLeft class="w-5 h-5" :stroke-width="2.4" />
          </button>
          <h1 class="flex-1 min-w-0 text-center text-[17px] font-bold text-gray-800 dark:text-slate-100 truncate px-1 tracking-tight">
            {{ t(`tools.${activeTab.key}.name`) }}
          </h1>
        </template>

        <!-- Home view: brand -->
        <template v-else>
          <button
            @click="refreshApp"
            class="flex-1 min-w-0 flex items-center gap-3 group text-left"
            :title="t('home.refresh')"
          >
            <span class="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 group-active:scale-90 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
              </svg>
            </span>
            <span class="min-w-0 leading-tight">
              <span class="block text-sm text-gray-400 dark:text-slate-500 font-medium">{{ t('home.welcome') }}</span>
              <span class="block text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white truncate">{{ t('home.brand') }}</span>
            </span>
          </button>
        </template>

        <!-- Settings: theme + language (consistent on both views) -->
        <button
          @click="settingsOpen = true"
          class="shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md active:scale-90 transition group"
          :aria-label="t('settings.title')"
        >
          <Settings class="w-5 h-5 text-gray-500 dark:text-slate-300 transition-transform duration-300 group-hover:rotate-45" />
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
          <FuelCostCalculator v-else-if="activeTab.key === 'fuelcost'" />
        </keep-alive>
      </div>
    </div>

    <SettingsSheet :open="settingsOpen" @close="settingsOpen = false" />
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import { ChevronLeft, Settings } from 'lucide-vue-next'
import { useI18n } from './i18n'
import SettingsSheet from './components/common/SettingsSheet.vue'
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
import FuelCostCalculator from './components/fuelcost/FuelCostCalculator.vue'
const InvoiceGenerator = defineAsyncComponent(() => import('./components/invoice/InvoiceGenerator.vue'))
const InvitationCardGenerator = defineAsyncComponent(() => import('./components/invitation/InvitationCardGenerator.vue'))
const CambodiaWeather = defineAsyncComponent(() => import('./components/weather/CambodiaWeather.vue'))
const FootballScores = defineAsyncComponent(() => import('./components/football/FootballScores.vue'))
const InternetSpeedTest = defineAsyncComponent(() => import('./components/internetspeed/InternetSpeedTest.vue'))

const tabs = [
  { key: 'speedtest',   label: 'Internet Speed Test',          short: 'Speed Test',  icon: '🚀', bg: 'from-sky-400 to-blue-500',      glow: 'shadow-blue-500/40' },
  { key: 'currency',    label: 'Currency Exchange',            short: 'Currency',    icon: '💱', bg: 'from-emerald-400 to-green-500',  glow: 'shadow-emerald-500/40' },
  { key: 'vehicleloan', label: 'Loan Calculate',               short: 'Loan',        icon: '🏦', bg: 'from-amber-400 to-orange-500',   glow: 'shadow-orange-500/40' },
  { key: 'wifi',        label: 'Wi-Fi QR Generate',            short: 'Wi-Fi QR',    icon: '📶', bg: 'from-indigo-400 to-blue-500',    glow: 'shadow-indigo-500/40' },
  { key: 'unit',        label: 'Unit Exchange',                short: 'Units',       icon: '📏', bg: 'from-teal-400 to-cyan-500',      glow: 'shadow-teal-500/40' },
  { key: 'discount',    label: 'Discount Calculate',           short: 'Discount',    icon: '🏷️', bg: 'from-pink-400 to-rose-500',      glow: 'shadow-pink-500/40' },
  { key: 'bmi',         label: 'Health & Body',                short: 'Health',      icon: '❤️', bg: 'from-red-400 to-rose-500',       glow: 'shadow-red-500/40' },
  { key: 'wheel',       label: 'Spin Wheel',                   short: 'Spin Wheel',  icon: '🎡', bg: 'from-fuchsia-400 to-purple-500', glow: 'shadow-purple-500/40' },
  { key: 'linkqr',      label: 'Link QR Generate',             short: 'Link QR',     icon: '🔗', bg: 'from-cyan-400 to-sky-500',       glow: 'shadow-sky-500/40' },
  { key: 'savinggoal',  label: 'Saving Goal Calculate',        short: 'Saving Goal', icon: '🎯', bg: 'from-lime-400 to-green-500',     glow: 'shadow-green-500/40' },
  { key: 'invoice',     label: 'Quotation / Invoice Generate', short: 'Invoice',     icon: '🧾', bg: 'from-slate-400 to-gray-500',     glow: 'shadow-gray-500/40' },
  { key: 'invitation',  label: 'Invitation Card Generate',     short: 'Invitation',  icon: '💌', bg: 'from-rose-400 to-pink-500',      glow: 'shadow-pink-500/40' },
  { key: 'weather',     label: 'Cambodia Weather',             short: 'Weather',     icon: '⛅', bg: 'from-sky-400 to-indigo-400',     glow: 'shadow-sky-500/40' },
  { key: 'football',    label: 'Football Live Scores',         short: 'Live Scores', icon: '⚽', bg: 'from-green-500 to-emerald-600',   glow: 'shadow-emerald-500/40' },
  { key: 'fuelcost',    label: 'Fuel / Trip Cost',             short: 'Fuel Cost',   icon: '⛽', bg: 'from-amber-400 to-orange-500',   glow: 'shadow-amber-500/40' },
]

const { t } = useI18n()

const activeKey = ref(null) // null = home grid
const activeTab = computed(() => tabs.find(t => t.key === activeKey.value) || null)

const settingsOpen = ref(false)

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
