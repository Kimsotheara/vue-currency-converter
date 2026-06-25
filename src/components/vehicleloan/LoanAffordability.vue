<template>
  <div class="space-y-4">
    <p class="text-sm text-gray-500">
      {{ t('loan.afford.intro') }}
    </p>

    <!-- Currency -->
    <div class="flex justify-end">
      <div class="flex bg-gray-100 rounded-full p-0.5">
        <button
          v-for="opt in currencyTypes"
          :key="opt.value"
          type="button"
          @click="currency = opt.value"
          :class="[
            'px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-150',
            currency === opt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('loan.afford.salary', { cur: currency }) }}</label>
      <CurrencyNumberInput
        v-model="salary"
        :currency="currency"
        :placeholder="currency === 'KHR' ? 'e.g. 4,000,000' : 'e.g. 1,000.00'"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('loan.afford.expenses', { cur: currency }) }}</label>
      <CurrencyNumberInput
        v-model="expenses"
        :currency="currency"
        :placeholder="currency === 'KHR' ? 'e.g. 2,400,000' : 'e.g. 600.00'"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('loan.afford.interestYear') }}</label>
        <input
          :value="annualRate ?? ''"
          @input="annualRate = $event.target.value === '' ? null : Number($event.target.value)"
          type="number"
          min="0"
          placeholder="e.g. 16"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('loan.afford.term') }}</label>
        <input
          :value="termMonths ?? ''"
          @input="termMonths = $event.target.value === '' ? null : Number($event.target.value)"
          type="number"
          min="1"
          placeholder="e.g. 24"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>

    <div>
      <div class="flex justify-between items-center mb-1">
        <label class="text-sm font-semibold text-gray-700">{{ t('loan.afford.share') }}</label>
        <span class="text-sm font-bold text-blue-600">{{ safetyRatio }}%</span>
      </div>
      <input v-model.number="safetyRatio" type="range" min="20" max="100" step="5" class="w-full accent-blue-600" />
      <p class="text-xs text-gray-400 mt-1">{{ t('loan.afford.shareHint') }}</p>
    </div>

    <!-- Result -->
    <div v-if="result" class="rounded-2xl overflow-hidden shadow-md">
      <div class="bg-gradient-to-r from-emerald-600 to-green-500 px-5 py-4 text-white">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">{{ t('loan.afford.safeLoan') }}</p>
        <p class="text-4xl font-bold">{{ fmt(result.safeLoan, currency) }}</p>
      </div>
      <div class="bg-white divide-y divide-gray-100">
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">{{ t('loan.afford.spareIncome') }}</span>
          <span class="text-sm font-semibold text-gray-700">{{ fmt(result.disposable, currency) }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">{{ t('loan.afford.affordableRepayment') }}</span>
          <span class="text-sm font-semibold text-gray-700">{{ fmt(result.safeMonthly, currency) }}</span>
        </div>
      </div>
    </div>

    <p v-if="overspending" class="text-sm text-red-500 font-medium">
      {{ t('loan.afford.overspending') }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatByCurrency } from '@/utils/format'
import { affordableLoanAmount } from '@/utils/loanMath'
import { useI18n } from '@/i18n'
import CurrencyNumberInput from '../common/CurrencyNumberInput.vue'
import { currencyTypes } from './useVehicleLoanCalculator'

const { t } = useI18n()
const fmt = formatByCurrency

const salary = ref(null)
const expenses = ref(null)
const annualRate = ref(16)
const termMonths = ref(24)
const safetyRatio = ref(60)
const currency = ref('USD')

const disposable = computed(() => (salary.value || 0) - (expenses.value || 0))

const overspending = computed(() => salary.value > 0 && disposable.value <= 0)

const result = computed(() => {
  if (!salary.value || disposable.value <= 0 || !termMonths.value || termMonths.value <= 0) return null
  const safeMonthly = disposable.value * (safetyRatio.value / 100)
  const safeLoan = affordableLoanAmount(safeMonthly, annualRate.value || 0, termMonths.value)
  return { disposable: disposable.value, safeMonthly, safeLoan }
})
</script>
