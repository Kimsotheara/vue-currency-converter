<template>
  <div class="space-y-4">

    <!-- Currency toggle -->
    <div class="flex rounded-xl bg-gray-100 p-1">
      <button
        v-for="c in ['USD', 'KHR']"
        :key="c"
        @click="setCurrency(c)"
        :class="[
          'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
          currency === c ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
        ]"
      >{{ c }}</button>
    </div>

    <!-- Gross monthly salary -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Gross Monthly Salary ({{ symbol }})</label>
      <input
        :value="gross ?? ''"
        @input="gross = $event.target.value === '' ? null : Number($event.target.value)"
        type="number" inputmode="decimal" min="0"
        :placeholder="currency === 'KHR' ? 'e.g. 4,000,000' : 'e.g. 1,000'"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      />
    </div>

    <!-- Residency toggle -->
    <div class="flex rounded-xl bg-gray-100 p-1">
      <button
          v-for="r in residencyOptions"
          :key="r.key"
          @click="residency = r.key"
          :class="[
          'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
          residency === r.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
        ]"
      >{{ r.label }}</button>
    </div>

    <!-- Dependents (residents only) -->
    <div v-if="residency === 'resident'">
      <label class="block text-sm font-semibold text-gray-700 mb-1">Dependents (spouse + minor children)</label>
      <div class="flex items-center gap-3">
        <button @click="dependents = Math.max(0, dependents - 1)" class="w-11 h-11 shrink-0 rounded-xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold text-gray-700 active:scale-90 transition">−</button>
        <input
            :value="dependents"
            @input="dependents = Math.max(0, Number($event.target.value) || 0)"
            type="number" inputmode="numeric" min="0"
            class="flex-1 text-center border border-gray-300 rounded-xl px-3 py-2.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <button @click="dependents = dependents + 1" class="w-11 h-11 shrink-0 rounded-xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold text-gray-700 active:scale-90 transition">+</button>
      </div>
      <p class="text-xs text-gray-400 mt-1">{{ fmtKHR(RELIEF_PER_DEPENDENT) }} ៛ relief each, per month</p>
    </div>

    <!-- NSSF -->
    <label class="flex items-center justify-between cursor-pointer select-none">
      <span class="text-sm font-semibold text-gray-700">Deduct NSSF (employee {{ (NSSF_RATE * 100).toFixed(0) }}%)</span>
      <input type="checkbox" v-model="nssf" class="w-5 h-5 accent-emerald-600" />
    </label>

    <button
      @click="clear"
      class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
    >
      Clear
    </button>

    <!-- Result -->
    <div v-if="result" class="rounded-2xl overflow-hidden shadow-md">
      <div class="bg-gradient-to-r from-emerald-600 to-green-500 px-5 py-4 text-white">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">Net Monthly Salary</p>
        <p class="text-4xl font-bold">{{ symbol }}{{ fmt(disp(result.netKHR)) }}</p>
        <p class="text-xs opacity-80 mt-1">Tax {{ symbol }}{{ fmt(disp(result.taxKHR)) }}<span v-if="result.nssfKHR"> · NSSF {{ symbol }}{{ fmt(disp(result.nssfKHR)) }}</span> · effective {{ result.effective.toFixed(1) }}%</p>
      </div>
      <div class="bg-white divide-y divide-gray-100">
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Gross salary</span>
          <span class="text-sm font-semibold text-gray-700">{{ symbol }}{{ fmt(disp(result.grossKHR)) }}</span>
        </div>
        <div v-if="dependents > 0" class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Dependent relief ({{ dependents }})</span>
          <span class="text-sm font-semibold text-gray-500">− {{ symbol }}{{ fmt(disp(result.reliefKHR)) }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Taxable income</span>
          <span class="text-sm font-semibold text-gray-700">{{ symbol }}{{ fmt(disp(result.taxableKHR)) }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3 bg-rose-50">
          <span class="text-sm font-bold text-rose-700">Tax on salary</span>
          <span class="text-base font-bold text-rose-600">{{ symbol }}{{ fmt(disp(result.taxKHR)) }}</span>
        </div>
        <div v-if="result.nssfKHR" class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">NSSF (employee)</span>
          <span class="text-sm font-semibold text-rose-500">− {{ symbol }}{{ fmt(disp(result.nssfKHR)) }}</span>
        </div>
      </div>

      <!-- Bracket breakdown (KHR, as defined by law) -->
      <div class="bg-white border-t border-gray-100 px-5 py-3">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Bracket breakdown (KHR/month)</p>
        <div class="space-y-1.5">
          <div v-for="(b, i) in result.breakdown" :key="i" class="flex justify-between items-center text-xs">
            <span class="text-gray-500">{{ b.label }} · {{ (b.rate * 100).toFixed(0) }}%</span>
            <span class="font-semibold tabular-nums" :class="b.tax > 0 ? 'text-gray-700' : 'text-gray-300'">{{ fmtKHR(b.tax) }} ៛</span>
          </div>
        </div>
      </div>
    </div>

    <p class="text-xs text-gray-400 leading-relaxed">
      Estimate based on Cambodia GDT monthly Tax on Salary. Residents use progressive brackets with dependent relief; non-residents pay a flat {{ (NONRESIDENT_RATE * 100).toFixed(0) }}% final withholding (no relief). Optional NSSF is the employee pension share ({{ (NSSF_RATE * 100).toFixed(0) }}% of wage, capped at {{ fmtKHR(NSSF_CEILING) }} ៛); it doesn't reduce the taxable base. USD figures use the live exchange rate; tax and NSSF are computed in KHR.
    </p>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExchangeRate } from '../common/useExchangeRate'

const { exchangeRate } = useExchangeRate()

// Cambodia monthly Tax on Salary brackets (KHR), GDT Sub-Decree (resident).
const BRACKETS = [
  { upTo: 1_500_000,  rate: 0.00 },
  { upTo: 2_000_000,  rate: 0.05 },
  { upTo: 8_500_000,  rate: 0.10 },
  { upTo: 12_500_000, rate: 0.15 },
  { upTo: Infinity,   rate: 0.20 },
]
const RELIEF_PER_DEPENDENT = 150_000 // KHR per spouse / minor child, per month
const NONRESIDENT_RATE = 0.20 // flat final withholding on non-resident salary
// NSSF pension: employee share, charged on the contributory wage up to a ceiling.
const NSSF_RATE = 0.02
const NSSF_CEILING = 1_200_000 // KHR — max assessed monthly wage

const residencyOptions = [
  { key: 'resident', label: 'Resident' },
  { key: 'nonresident', label: 'Non-resident' },
]

const gross = ref(null)
const dependents = ref(0)
const nssf = ref(true)
const currency = ref('USD')
const residency = ref('resident')

const symbol = computed(() => (currency.value === 'USD' ? '$' : '៛'))

const setCurrency = (c) => {
  if (c === currency.value) return
  if (gross.value !== null) {
    const factor = c === 'KHR' ? exchangeRate.value : 1 / exchangeRate.value
    gross.value = c === 'KHR' ? Math.round(gross.value * factor) : Math.round(gross.value * factor * 100) / 100
  }
  currency.value = c
}

const clear = () => {
  gross.value = null
  dependents.value = 0
  nssf.value = true
  residency.value = 'resident'
}

// Progressive tax over the KHR brackets, with a per-bracket breakdown.
const computeTax = (taxable) => {
  let tax = 0
  let lower = 0
  const breakdown = []
  for (const b of BRACKETS) {
    const portion = Math.max(0, Math.min(taxable, b.upTo) - lower)
    const part = portion * b.rate
    tax += part
    breakdown.push({
      label: b.upTo === Infinity
        ? `Over ${fmtKHR(lower)}`
        : `${fmtKHR(lower)}–${fmtKHR(b.upTo)}`,
      rate: b.rate,
      tax: Math.round(part),
    })
    lower = b.upTo
    if (taxable <= b.upTo) break
  }
  return { tax: Math.round(tax), breakdown }
}

const result = computed(() => {
  if (!gross.value || gross.value <= 0) return null
  const grossKHR = currency.value === 'KHR' ? gross.value : gross.value * exchangeRate.value
  const resident = residency.value === 'resident'
  // Residents: progressive brackets + dependent relief. Non-residents: flat 20%.
  const reliefKHR = resident ? dependents.value * RELIEF_PER_DEPENDENT : 0
  const taxableKHR = Math.max(0, grossKHR - reliefKHR)
  let taxKHR, breakdown
  if (resident) {
    ({ tax: taxKHR, breakdown } = computeTax(taxableKHR))
  } else {
    taxKHR = Math.round(taxableKHR * NONRESIDENT_RATE)
    breakdown = [{ label: 'Flat — non-resident', rate: NONRESIDENT_RATE, tax: taxKHR }]
  }
  const nssfKHR = nssf.value ? Math.round(NSSF_RATE * Math.min(grossKHR, NSSF_CEILING)) : 0
  const netKHR = grossKHR - taxKHR - nssfKHR
  return {
    grossKHR, reliefKHR, taxableKHR, taxKHR, nssfKHR, netKHR, breakdown,
    effective: grossKHR ? (taxKHR / grossKHR) * 100 : 0,
  }
})

// Convert an internal KHR amount to the selected display currency.
const disp = (khr) => (currency.value === 'KHR' ? khr : khr / exchangeRate.value)

const fmt = (v) =>
  currency.value === 'KHR'
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)
    : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

const fmtKHR = (v) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)
</script>
