import { ref, onMounted } from 'vue'
import axios from 'axios'

// Shared USD→KHR rate helper. Mirrors the loan tool: fetch the live rate once,
// fall back to a sane default when the API is unavailable.
const FALLBACK_USD_TO_KHR = 4100

export function useExchangeRate() {
  const exchangeRate = ref(FALLBACK_USD_TO_KHR) // KHR per 1 USD

  onMounted(async () => {
    try {
      const { data } = await axios.get('https://api.exchangerate-api.com/v4/latest/USD')
      if (data?.rates?.KHR) exchangeRate.value = data.rates.KHR
    } catch {
      // keep fallback rate
    }
  })

  return { exchangeRate }
}
