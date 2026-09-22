import { ref, onMounted } from 'vue'
import axios from 'axios'

const FALLBACK_USD_TO_KHR = 4100

export function useExchangeRate() {
  const exchangeRate = ref(FALLBACK_USD_TO_KHR)

  onMounted(async () => {
    try {
      const { data } = await axios.get('https://api.exchangerate-api.com/v4/latest/USD')
      if (data?.rates?.KHR) exchangeRate.value = data.rates.KHR
    } catch {}
  })

  return { exchangeRate }
}
