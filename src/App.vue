<template>
  <!-- Splash on first load, and a short one when opening a feature -->
  <Transition name="splash">
    <SplashScreen v-if="showSplash" />
    <SplashScreen
      v-else-if="opening"
      :title="opening.label"
      subtitle=""
      :icon="opening.icon"
      :gradient="opening.bg"
    />
  </Transition>

  <div class="min-h-screen flex flex-col" :class="activeKey ? 'bg-gray-100 dark:bg-slate-900' : 'bg-gradient-to-b from-indigo-50 via-purple-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-800'">

    <!-- Header -->
    <div class="bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
      <div :class="[containerWidth, 'mx-auto flex items-center gap-3 px-4 py-4']">
        <button
          v-if="activeKey"
          @click="activeKey = null"
          class="shrink-0 active:scale-90 transition-transform"
          aria-label="Back to home"
          title="Home"
        >
          <img :src="logo" alt="Home" class="w-9 h-9 rounded-xl" />
        </button>
        <template v-if="activeTab">
          <button
            @click="activeKey = null"
            class="text-lg font-bold text-gray-800 truncate min-w-0 text-left hover:text-purple-600 transition-colors"
            title="Back to home"
          >
            {{ activeTab.label }}
          </button>
        </template>
        <template v-else>
          <button
            @click="refreshApp"
            class="flex items-center gap-3 min-w-0 group"
            title="Refresh app"
          >
            <img :src="logo" alt="" class="w-9 h-9 rounded-xl shrink-0 group-active:scale-90 transition-transform" />
            <h1 class="text-lg font-bold text-gray-800 truncate min-w-0 group-hover:text-purple-600 transition-colors">Multiple Toolkit</h1>
          </button>
        </template>

        <button
          @click="toggleTheme"
          class="ml-auto shrink-0 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-xl"
          :title="dark ? 'Switch to light' : 'Switch to dark'"
        >
          {{ dark ? '☀️' : '🌙' }}
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto pt-6 pb-10 px-4">
      <!-- Home: app grid -->
      <div v-if="!activeKey" class="w-full max-w-lg md:max-w-2xl mx-auto">
        <HomeGrid :tabs="tabs" @select="openFeature" />
        <p class="mt-10 text-center text-xs text-gray-400">@theara.dev</p>
      </div>

      <!-- Feature -->
      <div v-else :class="[containerWidth, 'mx-auto bg-white rounded-2xl shadow-sm p-5 sm:p-8']">
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
import logo from './assets/template-icon-vector.jpg'
import SplashScreen     from './components/SplashScreen.vue'
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

const showSplash = ref(true)
const opening = ref(null)   // tab being opened (shows its splash briefly)
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
  setTimeout(() => { showSplash.value = false }, 1000)
})

const refreshApp = () => window.location.reload()

// Flash a short splash for the chosen feature, then reveal it.
const openFeature = (key) => {
  opening.value = tabs.find(t => t.key === key) || null
  setTimeout(() => {
    activeKey.value = key
    opening.value = null
  }, 600)
}

// Form-heavy tools get a wider canvas on tablet / desktop
const wideTabs = ['invoice', 'invitation', 'weather', 'football']
const containerWidth = computed(() =>
  wideTabs.includes(activeKey.value)
    ? 'w-full max-w-lg md:max-w-3xl lg:max-w-4xl'
    : 'w-full max-w-lg md:max-w-xl',
)
</script>

<style scoped>
.splash-enter-active, .splash-leave-active { transition: opacity 0.4s ease; }
.splash-enter-from, .splash-leave-to { opacity: 0; }
</style>
