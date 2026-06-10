import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { calculateFlatRateLoan, calculateReducingBalanceLoan, monthlyRateToAnnual } from '@/utils/loanMath'

export const loanTypes = [
  { value: 'flat', label: 'Flat Rate' },
  { value: 'reducing', label: 'Reducing Balance' },
]

export const rateTypes = [
  { value: 'annual', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
]

export const currencyTypes = [
  { value: 'USD', label: 'USD' },
  { value: 'KHR', label: 'KHR' },
]

const FALLBACK_USD_TO_KHR = 4100

const roundForCurrency = (value, currency) =>
  currency === 'KHR' ? Math.round(value) : Math.round(value * 100) / 100

export function useVehicleLoanCalculator() {
  const vehiclePrice = ref(null)
  const downPayment = ref(null)
  const interestRate = ref(null)
  const termMonths = ref(null)
  const loanType = ref('reducing')
  const rateType = ref('monthly')
  const currency = ref('USD')
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

    currency.value = newCurrency
  }

  const clear = () => {
    vehiclePrice.value = null
    downPayment.value = null
    interestRate.value = null
    termMonths.value = null
    loanType.value = 'reducing'
    rateType.value = 'monthly'
  }

  const error = computed(() => {
    if (!vehiclePrice.value && !termMonths.value) return null
    if (vehiclePrice.value <= 0) return 'Vehicle price must be greater than 0.'
    if (downPayment.value < 0) return 'Down payment cannot be negative.'
    if (downPayment.value > vehiclePrice.value) return 'Down payment cannot exceed vehicle price.'
    if (interestRate.value < 0) return 'Interest rate cannot be negative.'
    if (termMonths.value <= 0) return 'Loan term must be greater than 0.'
    return null
  })

  const result = computed(() => {
    if (!vehiclePrice.value || !termMonths.value || error.value) return null

    const loanAmount = vehiclePrice.value - (downPayment.value || 0)
    const annualRate = rateType.value === 'monthly'
      ? monthlyRateToAnnual(interestRate.value || 0)
      : (interestRate.value || 0)

    const calc = loanType.value === 'flat'
      ? calculateFlatRateLoan(loanAmount, annualRate, termMonths.value)
      : calculateReducingBalanceLoan(loanAmount, annualRate, termMonths.value)

    return { loanAmount, ...calc }
  })

  return {
    vehiclePrice, downPayment, interestRate, termMonths, loanType, rateType,
    currency, setCurrency,
    clear, error, result,
  }
}
