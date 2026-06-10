<template>
  <div class="space-y-4">

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
      <label class="block text-sm font-semibold text-gray-700 mb-1">Total Price ({{ currency }})</label>
      <CurrencyNumberInput
        v-model="vehiclePrice"
        :currency="currency"
        :placeholder="currency === 'KHR' ? 'e.g. 12,000,000' : 'e.g. 3,000.00'"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Down Payment ({{ currency }})</label>
      <CurrencyNumberInput
        v-model="downPayment"
        :currency="currency"
        :placeholder="currency === 'KHR' ? 'e.g. 2,000,000' : 'e.g. 500.00'"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <div class="flex items-center justify-between mb-1">
        <label class="block text-sm font-semibold text-gray-700">
          Interest Rate (% {{ rateType === 'monthly' ? 'per month' : 'per year' }})
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
            {{ opt.label }}
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
        ≈ {{ (interestRate * 12).toFixed(2) }}% per year
      </p>
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Loan Term (Months)</label>
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
      <label class="block text-sm font-semibold text-gray-700 mb-1">Loan Type</label>
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
          {{ opt.label }}
        </button>
      </div>
    </div>

    <button
      @click="clear"
      class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
    >
      Clear
    </button>

    <div v-if="result" class="rounded-2xl overflow-hidden shadow-md">

      <div class="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-white">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">Monthly Payment</p>
        <p class="text-4xl font-bold">{{ fmt(result.monthly, currency) }}</p>
      </div>

      <div class="bg-white divide-y divide-gray-100">
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Loan Amount</span>
          <span class="text-sm font-semibold text-gray-700">{{ fmt(result.loanAmount, currency) }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Total Interest</span>
          <span class="text-sm font-semibold text-red-500">{{ fmt(result.totalInterest, currency) }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3 bg-green-50">
          <span class="text-sm font-bold text-green-700">Total Repayment</span>
          <span class="text-base font-bold text-green-600">{{ fmt(result.totalRepayment, currency) }}</span>
        </div>
      </div>

    </div>

    <p v-if="error" class="text-sm text-red-500 font-medium">{{ error }}</p>

  </div>
</template>

<script setup>
import { formatByCurrency } from '@/utils/format'
import CurrencyNumberInput from '../common/CurrencyNumberInput.vue'
import { useVehicleLoanCalculator, loanTypes, rateTypes, currencyTypes } from './useVehicleLoanCalculator'

const {
  vehiclePrice, downPayment, interestRate, termMonths, loanType, rateType,
  currency, setCurrency,
  clear, error, result,
} = useVehicleLoanCalculator()

const fmt = formatByCurrency
</script>
