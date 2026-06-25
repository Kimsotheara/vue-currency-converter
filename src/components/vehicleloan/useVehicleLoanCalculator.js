import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import {
  calculateFlatRateLoan,
  calculateReducingBalanceLoan,
  monthlyRateToAnnual,
  buildAmortizationSchedule,
} from '@/utils/loanMath'
import { useI18n } from '@/i18n'

export const loanTypes = [
  { value: 'flat', labelKey: 'loan.flatRate' },
  { value: 'reducing', labelKey: 'loan.reducingBalance' },
]

export const rateTypes = [
  { value: 'annual', labelKey: 'loan.yearly' },
  { value: 'monthly', labelKey: 'loan.monthly' },
]

export const currencyTypes = [
  { value: 'USD', label: 'USD' },
  { value: 'KHR', label: 'KHR' },
]

const FALLBACK_USD_TO_KHR = 4100

const roundForCurrency = (value, currency) =>
  currency === 'KHR' ? Math.round(value) : Math.round(value * 100) / 100

export function useVehicleLoanCalculator() {
  const { t } = useI18n()
  const vehiclePrice = ref(null)
  const downPayment = ref(null)
  const interestRate = ref(null)
  const termMonths = ref(null)
  const loanType = ref('reducing')
  const rateType = ref('monthly')
  const currency = ref('USD')
  const extraPayment = ref(null)
  const exchangeRate = ref(FALLBACK_USD_TO_KHR) // KHR per 1 USD

  onMounted(async () => {
    try {
      const { data } = await axios.get('https://api.exchangerate-api.com/v4/latest/USD')
      if (data?.rates?.KHR) exchangeRate.value = data.rates.KHR
    } catch {
      // keep fallback rate
    }
  })

  const setCurrency = (newCurrency) => {
    if (newCurrency === currency.value) return
    const factor = newCurrency === 'KHR' ? exchangeRate.value : 1 / exchangeRate.value

    if (vehiclePrice.value !== null) vehiclePrice.value = roundForCurrency(vehiclePrice.value * factor, newCurrency)
    if (downPayment.value !== null) downPayment.value = roundForCurrency(downPayment.value * factor, newCurrency)
    if (extraPayment.value !== null) extraPayment.value = roundForCurrency(extraPayment.value * factor, newCurrency)

    currency.value = newCurrency
  }

  const clear = () => {
    vehiclePrice.value = null
    downPayment.value = null
    interestRate.value = null
    termMonths.value = null
    loanType.value = 'reducing'
    rateType.value = 'monthly'
    extraPayment.value = null
  }

  const error = computed(() => {
    if (!vehiclePrice.value && !termMonths.value) return null
    if (vehiclePrice.value <= 0) return t('loan.errors.price')
    if (downPayment.value < 0) return t('loan.errors.downNeg')
    if (downPayment.value > vehiclePrice.value) return t('loan.errors.downExceed')
    if (interestRate.value < 0) return t('loan.errors.rateNeg')
    if (termMonths.value <= 0) return t('loan.errors.term')
    return null
  })

  const annualRate = computed(() =>
    rateType.value === 'monthly'
      ? monthlyRateToAnnual(interestRate.value || 0)
      : (interestRate.value || 0),
  )

  const result = computed(() => {
    if (!vehiclePrice.value || !termMonths.value || error.value) return null

    const loanAmount = vehiclePrice.value - (downPayment.value || 0)

    const calc = loanType.value === 'flat'
      ? calculateFlatRateLoan(loanAmount, annualRate.value, termMonths.value)
      : calculateReducingBalanceLoan(loanAmount, annualRate.value, termMonths.value)

    return { loanAmount, ...calc }
  })

  // Full repayment table for the current loan (no extra payment).
  const amortization = computed(() => {
    if (!result.value) return null
    return buildAmortizationSchedule(result.value.loanAmount, annualRate.value, termMonths.value, {
      loanType: loanType.value,
    })
  })

  // What happens if the borrower overpays every month. Only reducing-balance
  // loans save interest — flat-rate interest is locked in up front.
  const extraSavings = computed(() => {
    if (!result.value || !extraPayment.value || extraPayment.value <= 0) return null
    if (loanType.value === 'flat') return { unsupported: true }

    const base = amortization.value
    const withExtra = buildAmortizationSchedule(result.value.loanAmount, annualRate.value, termMonths.value, {
      loanType: 'reducing',
      extraPayment: extraPayment.value,
    })

    const monthsSaved = base.months - withExtra.months
    const interestSaved = base.totalInterest - withExtra.totalInterest
    const now = new Date()
    const finishDate = new Date(now.getFullYear(), now.getMonth() + withExtra.months, 1)

    return {
      unsupported: false,
      newMonths: withExtra.months,
      monthsSaved,
      interestSaved,
      finishDate,
      schedule: withExtra,
    }
  })

  return {
    vehiclePrice, downPayment, interestRate, termMonths, loanType, rateType,
    currency, setCurrency, extraPayment,
    clear, error, result, amortization, extraSavings,
  }
}
