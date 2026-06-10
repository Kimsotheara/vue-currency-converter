export const formatCurrency = (v) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

export const formatByCurrency = (v, currency = 'USD') => {
  if (currency === 'KHR') {
    return `៛${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(v))}`
  }
  return `$${formatCurrency(v)}`
}
