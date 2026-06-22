import { ref, watch } from 'vue'
import { calculateEMI, monthlyRateToAnnual, annualRateToMonthly } from '@/utils/loanMath'

export function useLoanCalculator() {
  const principal = ref(null)
  const rate = ref(null)
  const rateType = ref('monthly')
  const term = ref(null)
  const result = ref(null)
  const error = ref(null)

  watch(rateType, (newType, oldType) => {
    if (rate.value === null) return
    if (newType === 'yearly' && oldType === 'monthly') {
      rate.value = parseFloat(monthlyRateToAnnual(rate.value).toFixed(4))
    } else if (newType === 'monthly' && oldType === 'yearly') {
      rate.value = parseFloat(annualRateToMonthly(rate.value).toFixed(4))
    }
  })

  const calculate = () => {
    error.value = null
    result.value = null

    if (!principal.value || rate.value === null || !term.value) {
      error.value = 'Please fill in all fields.'
      return
    }
    if (principal.value <= 0 || rate.value < 0 || term.value < 1) {
      error.value = 'Please enter valid positive values.'
      return
    }

    const monthlyRate = rateType.value === 'monthly' ? rate.value : annualRateToMonthly(rate.value)
    const annualRate = monthlyRateToAnnual(monthlyRate)
    const monthly = calculateEMI(principal.value, monthlyRate, term.value)
    const total = monthly * term.value

    result.value = {
      monthly,
      total,
      interest: total - principal.value,
      monthlyRate,
      annualRate,
      effectiveAnnual: (Math.pow(1 + monthlyRate / 100, 12) - 1) * 100,
    }
  }

  const clear = () => {
    principal.value = null
    rate.value = null
    rateType.value = 'monthly'
    term.value = null
    result.value = null
    error.value = null
  }

  return { principal, rate, rateType, term, result, error, calculate, clear }
}
