<template>
  <div class="space-y-4">

    <!-- Mode tabs -->
    <div class="flex bg-gray-100 rounded-full p-1 w-full">
      <button
        v-for="opt in modes"
        :key="opt.value"
        type="button"
        @click="mode = opt.value"
        :class="[
          'flex-1 px-2 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-150',
          mode === opt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
        ]"
      >
        {{ t(opt.labelKey) }}
      </button>
    </div>

    <!-- ───────── Calculate ───────── -->
    <template v-if="mode === 'calc'">
      <!-- Currency toggle -->
      <div class="flex justify-end">
        <div class="flex bg-gray-100 rounded-full p-0.5">
          <button
            v-for="opt in currencyTypes"
            :key="opt.value"
            type="button"
            @click="setCurrency(opt.value)"
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
        <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('loan.totalPrice') }} ({{ currency }})</label>
        <CurrencyNumberInput
          v-model="vehiclePrice"
          :currency="currency"
          :placeholder="currency === 'KHR' ? 'e.g. 12,000,000' : 'e.g. 3,000.00'"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('loan.downPayment') }} ({{ currency }})</label>
        <CurrencyNumberInput
          v-model="downPayment"
          :currency="currency"
          :placeholder="currency === 'KHR' ? 'e.g. 2,000,000' : 'e.g. 500.00'"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <div class="flex flex-wrap items-center justify-between gap-1 mb-1">
          <label class="block text-sm font-semibold text-gray-700">
            {{ rateType === 'monthly' ? t('loan.interestRateMonthly') : t('loan.interestRateYearly') }}
          </label>
          <div class="flex bg-gray-100 rounded-full p-0.5">
            <button
              v-for="opt in rateTypes"
              :key="opt.value"
              type="button"
              @click="rateType = opt.value"
              :class="[
                'px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-150',
                rateType === opt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
              ]"
            >
              {{ t(opt.labelKey) }}
            </button>
          </div>
        </div>
        <input
          :value="interestRate ?? ''"
          @input="interestRate = $event.target.value === '' ? null : Number($event.target.value)"
          type="number"
          :placeholder="rateType === 'monthly' ? 'e.g. 1.5' : 'e.g. 18'"
          min="0"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p v-if="rateType === 'monthly' && interestRate" class="text-xs text-gray-400 mt-1">
          {{ t('loan.perYearApprox', { pct: (interestRate * 12).toFixed(2) }) }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('loan.loanTerm') }}</label>
        <input
          :value="termMonths ?? ''"
          @input="termMonths = $event.target.value === '' ? null : Number($event.target.value)"
          type="number"
          placeholder="e.g. 18"
          min="1"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Loan type toggle -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('loan.loanType') }}</label>
        <div class="flex bg-gray-100 rounded-full p-1 w-full">
          <button
            v-for="opt in loanTypes"
            :key="opt.value"
            type="button"
            @click="loanType = opt.value"
            :class="[
              'flex-1 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150',
              loanType === opt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            {{ t(opt.labelKey) }}
          </button>
        </div>
      </div>

      <button
        @click="clear"
        class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        {{ t('loan.clear') }}
      </button>

      <div v-if="result" class="rounded-2xl overflow-hidden shadow-md">
        <div class="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-white">
          <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">{{ t('loan.monthlyPayment') }}</p>
          <p class="text-4xl font-bold">{{ fmt(result.monthly, currency) }}</p>
        </div>

        <div class="bg-white divide-y divide-gray-100">
          <div class="flex justify-between items-center px-5 py-3">
            <span class="text-sm text-gray-500">{{ t('loan.loanAmount') }}</span>
            <span class="text-sm font-semibold text-gray-700">{{ fmt(result.loanAmount, currency) }}</span>
          </div>
          <div class="flex justify-between items-center px-5 py-3">
            <span class="text-sm text-gray-500">{{ t('loan.totalInterest') }}</span>
            <span class="text-sm font-semibold text-red-500">{{ fmt(result.totalInterest, currency) }}</span>
          </div>
          <div class="flex justify-between items-center px-5 py-3 bg-green-50">
            <span class="text-sm font-bold text-green-700">{{ t('loan.totalRepayment') }}</span>
            <span class="text-base font-bold text-green-600">{{ fmt(result.totalRepayment, currency) }}</span>
          </div>
        </div>
      </div>

      <!-- Extra payment -->
      <div v-if="result" class="rounded-2xl border border-gray-100 p-4 space-y-3">
        <label class="block text-sm font-semibold text-gray-700">
          {{ t('loan.extraPayment', { cur: currency }) }}
        </label>
        <CurrencyNumberInput
          v-model="extraPayment"
          :currency="currency"
          :placeholder="currency === 'KHR' ? 'e.g. 400,000' : 'e.g. 100.00'"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div v-if="extraSavings?.unsupported" class="text-xs text-gray-500">
          {{ t('loan.extraFlatNote') }}
        </div>

        <div v-else-if="extraSavings" class="grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-blue-50 px-4 py-3">
            <p class="text-xs text-blue-500 font-semibold uppercase tracking-wide">{{ t('loan.newFinish') }}</p>
            <p class="text-lg font-bold text-blue-700">{{ finishLabel }}</p>
            <p class="text-xs text-blue-500 mt-0.5">{{ t('loan.monthsSooner', { n: extraSavings.monthsSaved }) }}</p>
          </div>
          <div class="rounded-xl bg-green-50 px-4 py-3">
            <p class="text-xs text-green-600 font-semibold uppercase tracking-wide">{{ t('loan.interestSaved') }}</p>
            <p class="text-lg font-bold text-green-700">{{ fmt(extraSavings.interestSaved, currency) }}</p>
            <p class="text-xs text-green-600 mt-0.5">{{ t('loan.overLoan') }}</p>
          </div>
        </div>
      </div>

      <!-- Amortization -->
      <div v-if="activeSchedule" class="rounded-2xl border border-gray-100 overflow-hidden">
        <button
          type="button"
          @click="showSchedule = !showSchedule"
          class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span class="text-sm font-semibold text-gray-700">
            {{ t('loan.amortization', { n: activeSchedule.months }) }}
          </span>
          <span class="text-gray-400 text-lg leading-none">{{ showSchedule ? '−' : '+' }}</span>
        </button>

        <div v-if="showSchedule">
          <div class="max-h-72 overflow-y-auto">
            <table class="w-full text-xs">
              <thead class="sticky top-0 bg-white shadow-sm">
                <tr class="text-gray-500 uppercase tracking-wide">
                  <th class="px-2 py-2 text-left font-semibold">{{ t('loan.thMonth') }}</th>
                  <th class="px-2 py-2 text-right font-semibold">{{ t('loan.thPrincipal') }}</th>
                  <th class="px-2 py-2 text-right font-semibold">{{ t('loan.thInterest') }}</th>
                  <th class="px-2 py-2 text-right font-semibold">{{ t('loan.thRemaining') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="r in activeSchedule.rows" :key="r.month">
                  <td class="px-2 py-1.5 text-gray-600">{{ r.month }}</td>
                  <td class="px-2 py-1.5 text-right text-gray-700">{{ fmt(r.principal, currency) }}</td>
                  <td class="px-2 py-1.5 text-right text-red-500">{{ fmt(r.interest, currency) }}</td>
                  <td class="px-2 py-1.5 text-right font-medium text-gray-800">{{ fmt(r.balance, currency) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="p-3 border-t border-gray-100">
            <button
              @click="exportPdf"
              class="w-full bg-gray-800 hover:bg-gray-900 active:bg-black text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              {{ t('loan.exportPdf') }}
            </button>
          </div>
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-500 font-medium">{{ error }}</p>
    </template>

    <!-- ───────── Compare ───────── -->
    <LoanCompare v-else-if="mode === 'compare'" />

    <!-- ───────── Affordability ───────── -->
    <LoanAffordability v-else-if="mode === 'afford'" />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatByCurrency } from '@/utils/format'
import { useI18n } from '@/i18n'
import CurrencyNumberInput from '../common/CurrencyNumberInput.vue'
import LoanCompare from './LoanCompare.vue'
import LoanAffordability from './LoanAffordability.vue'
import { useVehicleLoanCalculator, loanTypes, rateTypes, currencyTypes } from './useVehicleLoanCalculator'

const { t } = useI18n()

const {
  vehiclePrice, downPayment, interestRate, termMonths, loanType, rateType,
  currency, setCurrency, extraPayment,
  clear, error, result, amortization, extraSavings,
} = useVehicleLoanCalculator()

const fmt = formatByCurrency

const modes = [
  { value: 'calc', labelKey: 'loan.modes.calc' },
  { value: 'compare', labelKey: 'loan.modes.compare' },
  { value: 'afford', labelKey: 'loan.modes.afford' },
]
const mode = ref('calc')
const showSchedule = ref(false)

// When the borrower overpays, show the shortened (with-extra) schedule.
const activeSchedule = computed(() =>
  extraSavings.value && !extraSavings.value.unsupported ? extraSavings.value.schedule : amortization.value,
)

const finishLabel = computed(() => {
  if (!extraSavings.value || extraSavings.value.unsupported) return ''
  return extraSavings.value.finishDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
})

const exportPdf = async () => {
  if (!activeSchedule.value) return
  const { exportAmortizationPdf } = await import('@/utils/loanPdf')
  const summary = [
    { label: 'Loan amount', value: result.value.loanAmount },
    { label: 'Monthly payment', value: result.value.monthly },
    { label: 'Total interest', value: activeSchedule.value.totalInterest },
    { label: 'Term', text: `${activeSchedule.value.months} months` },
  ]
  exportAmortizationPdf({ rows: activeSchedule.value.rows, currency: currency.value, summary })
}
</script>
