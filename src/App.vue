<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">

    <div class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div :class="[containerWidth, 'mx-auto flex items-center gap-3 px-4 py-4']">
        <button
          @click="drawerOpen = true"
          class="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
        >
          <span class="w-5 h-0.5 bg-gray-700 rounded-full" />
          <span class="w-5 h-0.5 bg-gray-700 rounded-full" />
          <span class="w-5 h-0.5 bg-gray-700 rounded-full" />
        </button>
        <span class="text-2xl shrink-0">{{ activeTab.icon }}</span>
        <h1 class="text-lg font-bold text-gray-800 truncate min-w-0">{{ activeTab.label }}</h1>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto pt-5 pb-8 px-4">
      <div :class="[containerWidth, 'mx-auto bg-white rounded-2xl shadow-sm p-5 sm:p-8']">
        <keep-alive>
          <CurrencyConverter  v-if="activeTab.key === 'currency'" />
          <VehicleLoanCalculator     v-else-if="activeTab.key === 'vehicleloan'" />
          <WiFiQRGenerator    v-else-if="activeTab.key === 'wifi'" />
          <UnitConverter      v-else-if="activeTab.key === 'unit'" />
          <DiscountCalculator v-else-if="activeTab.key === 'discount'" />
          <BMICalculator      v-else-if="activeTab.key === 'bmi'" />
          <WheelSpinner       v-else-if="activeTab.key === 'wheel'" />
          <LinkQRGenerator    v-else-if="activeTab.key === 'linkqr'" />
          <SavingGoalCalculator v-else-if="activeTab.key === 'savinggoal'" />
          <InvoiceGenerator   v-else-if="activeTab.key === 'invoice'" />
          <InvitationCardGenerator v-else-if="activeTab.key === 'invitation'" />
        </keep-alive>
      </div>
    </div>

    <DrawerMenu
      :open="drawerOpen"
      :tabs="tabs"
      :active="activeTab.key"
      @close="drawerOpen = false"
      @change="activeKey = $event"
    />


  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import DrawerMenu        from './components/DrawerMenu.vue'
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

const tabs = [
  { key: 'currency', label: 'Currency Exchange',   icon: '💱' },
  { key: 'vehicleloan',     label: 'Loan Calculate',       icon: '🏦' },
  { key: 'wifi',     label: 'Wi-Fi QR Generate',   icon: '📶' },
  { key: 'unit',     label: 'Unit Exchange',       icon: '📏' },
  { key: 'discount', label: 'Discount Calculate',   icon: '🏷️' },
  { key: 'bmi',      label: 'BMI Calculate',        icon: '❤️' },
  { key: 'wheel',    label: 'Spin Wheel', icon: '🎡' },
  { key: 'linkqr',   label: 'Link QR Generate',    icon: '🔗' },
  { key: 'savinggoal', label: 'Saving Goal Calculate',       icon: '🎯' },
  { key: 'invoice',  label: 'Quotation / Invoice Generate',  icon: '🧾' },
  { key: 'invitation', label: 'Invitation Card Generate', icon: '💌' },
]

const activeKey = ref('currency')
const drawerOpen = ref(false)
const activeTab = computed(() => tabs.find(t => t.key === activeKey.value))

// Form-heavy tools get a wider canvas on tablet / desktop
const wideTabs = ['invoice', 'invitation']
const containerWidth = computed(() =>
  wideTabs.includes(activeKey.value)
    ? 'w-full max-w-lg md:max-w-3xl lg:max-w-4xl'
    : 'w-full max-w-lg md:max-w-xl',
)
</script>
