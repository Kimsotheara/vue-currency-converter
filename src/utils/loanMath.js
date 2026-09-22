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

// Builds a month-by-month repayment schedule.
// For reducing-balance loans an optional `extraPayment` is added to every
// instalment, which pays the principal down faster and ends the loan early.
// Flat-rate interest is fixed up front, so extra payments don't change it.
export function buildAmortizationSchedule(
  principal,
  annualRatePercent,
  months,
  { loanType = 'reducing', extraPayment = 0 } = {},
) {
  const rows = []

  if (loanType === 'flat') {
    const { monthly, totalInterest } = calculateFlatRateLoan(principal, annualRatePercent, months)
    const principalPart = principal / months
    const interestPart = totalInterest / months
    let balance = principal
    for (let m = 1; m <= months; m++) {
      balance = Math.max(0, balance - principalPart)
      rows.push({ month: m, payment: monthly, principal: principalPart, interest: interestPart, balance })
    }
    return { rows, totalInterest, months, monthly }
  }

  const monthlyRate = annualRateToMonthly(annualRatePercent) / 100
  const baseEmi = calculateEMI(principal, annualRateToMonthly(annualRatePercent), months)
  const extra = Math.max(0, extraPayment || 0)

  let balance = principal
  let totalInterest = 0
  let m = 0
  const safetyCap = months + 1200 // guard against pathological inputs

  while (balance > 0.005 && m < safetyCap) {
    m++
    const interest = balance * monthlyRate
    let principalPart = baseEmi - interest + extra
    if (principalPart > balance) principalPart = balance
    const payment = interest + principalPart
    balance = Math.max(0, balance - principalPart)
    totalInterest += interest
    rows.push({ month: m, payment, principal: principalPart, interest, balance })
  }

  return { rows, totalInterest, months: m, monthly: baseEmi + extra }
}

// Largest principal whose reducing-balance instalment fits a given monthly
// budget. Inverse of the EMI formula.
export function affordableLoanAmount(monthlyPayment, annualRatePercent, months) {
  if (monthlyPayment <= 0 || months <= 0) return 0
  const r = annualRateToMonthly(annualRatePercent) / 100
  if (r === 0) return monthlyPayment * months
  const factor = Math.pow(1 + r, months)
  return (monthlyPayment * (factor - 1)) / (r * factor)
}
