export function monthlyRateToAnnual(monthlyRate) {
  return monthlyRate * 12
}

export function annualRateToMonthly(annualRate) {
  return annualRate / 12
}

export function calculateEMI(principal, monthlyRatePercent, months) {
  const r = monthlyRatePercent / 100
  if (r === 0) return principal / months
  const factor = Math.pow(1 + r, months)
  return (principal * r * factor) / (factor - 1)
}

export function calculateFlatRateLoan(principal, annualRatePercent, months) {
  const years = months / 12
  const totalInterest = principal * (annualRatePercent / 100) * years
  const totalRepayment = principal + totalInterest
  return { monthly: totalRepayment / months, totalInterest, totalRepayment }
}

export function calculateReducingBalanceLoan(principal, annualRatePercent, months) {
  const monthlyRate = annualRateToMonthly(annualRatePercent)
  const monthly = calculateEMI(principal, monthlyRate, months)
  const totalRepayment = monthly * months
  return { monthly, totalInterest: totalRepayment - principal, totalRepayment }
}
