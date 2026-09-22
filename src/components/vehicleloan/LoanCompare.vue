<template>
  <div class="space-y-4">
    <p class="text-sm text-gray-500">
      {{ t('loan.compare.intro') }}
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
      <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('loan.compare.loanAmount', { cur: currency }) }}</label>
      <CurrencyNumberInput
        v-model="loanAmount"
        :currency="currency"
        :placeholder="currency === 'KHR' ? 'e.g. 40,000,000' : 'e.g. 10,000.00'"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('loan.compare.term') }}</label>
        <input
          :value="termMonths ?? ''"
          @input="termMonths = $event.target.value === '' ? null : Number($event.target.value)"
          type="number"
          placeholder="e.g. 24"
          min="1"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('loan.compare.rateUnit') }}</label>
        <div class="flex bg-gray-100 rounded-full p-0.5 h-[42px] items-center">
          <button
            v-for="opt in rateTypes"
            :key="opt.value"
            type="button"
            @click="rateType = opt.value"
            :class="[
              'flex-1 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150',
              rateType === opt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            {{ t(opt.labelKey) }}
          </button>
        </div>
      </div>
    </div>

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

    <!-- Editable bank rates -->
    <div class="space-y-2">
      <p class="text-sm font-semibold text-gray-700">
        {{ rateType === 'monthly' ? t('loan.compare.rateMonthly') : t('loan.compare.rateYearly') }}
      </p>
      <div v-for="bank in banks" :key="bank.name" class="flex items-center gap-3">
        <span class="w-24 text-sm font-medium text-gray-600">{{ bank.name }}</span>
        <input
          v-model.number="bank.rate"
          type="number"
          min="0"
          step="0.1"
          class="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>

    <!-- Results -->
    <div v-if="rows.length" class="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th class="px-3 py-2 text-left font-semibold">{{ t('loan.compare.bank') }}</th>
            <th class="px-3 py-2 text-right font-semibold">{{ t('loan.compare.monthly') }}</th>
            <th class="px-3 py-2 text-right font-semibold">{{ t('loan.compare.totalInterest') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="row in rows"
            :key="row.name"
            :class="row.name === cheapest ? 'bg-green-50' : 'bg-white'"
          >
            <td class="px-3 py-2.5 font-medium text-gray-700">
              {{ row.name }}
              <span v-if="row.name === cheapest" class="ml-1 text-[10px] font-bold text-green-600 uppercase">{{ t('loan.compare.best') }}</span>
            </td>
            <td class="px-3 py-2.5 text-right font-semibold text-gray-800">{{ fmt(row.monthly, currency) }}</td>
            <td class="px-3 py-2.5 text-right font-semibold text-red-500">{{ fmt(row.totalInterest, currency) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="text-sm text-gray-400">{{ t('loan.compare.empty') }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatByCurrency } from '@/utils/format'
import { calculateFlatRateLoan, calculateReducingBalanceLoan, monthlyRateToAnnual } from '@/utils/loanMath'
import { useI18n } from '@/i18n'
import CurrencyNumberInput from '../common/CurrencyNumberInput.vue'
import { loanTypes, rateTypes, currencyTypes } from './useVehicleLoanCalculator'

const { t } = useI18n()
const fmt = formatByCurrency

const loanAmount = ref(null)
const termMonths = ref(null)
const loanType = ref('reducing')
const rateType = ref('annual')
const currency = ref('USD')

// Editable estimates — borrowers should confirm against each bank's live offer.
const banks = ref([
  { name: 'ABA', rate: 16 },
  { name: 'ACLEDA', rate: 15 },
  { name: 'Wing', rate: 24 },
  { name: 'Canadia', rate: 17 },
])

const rows = computed(() => {
  if (!loanAmount.value || !termMonths.value || termMonths.value <= 0) return []
  return banks.value
    .filter((b) => b.rate != null && b.rate >= 0)
    .map((b) => {
      const annual = rateType.value === 'monthly' ? monthlyRateToAnnual(b.rate) : b.rate
      const calc = loanType.value === 'flat'
        ? calculateFlatRateLoan(loanAmount.value, annual, termMonths.value)
        : calculateReducingBalanceLoan(loanAmount.value, annual, termMonths.value)
      return { name: b.name, ...calc }
    })
})

const cheapest = computed(() => {
  if (!rows.value.length) return null
  return rows.value.reduce((min, r) => (r.totalInterest < min.totalInterest ? r : min)).name
})
</script>
