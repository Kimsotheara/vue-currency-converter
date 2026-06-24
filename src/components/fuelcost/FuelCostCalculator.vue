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

    <!-- Distance -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Distance (km)</label>
      <input
        :value="distance ?? ''"
        @input="distance = $event.target.value === '' ? null : Number($event.target.value)"
        type="number" inputmode="decimal" min="0" placeholder="e.g. 120"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <!-- Fuel efficiency -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Fuel Efficiency (km per litre)</label>
      <input
        :value="efficiency ?? ''"
        @input="efficiency = $event.target.value === '' ? null : Number($event.target.value)"
        type="number" inputmode="decimal" min="0" placeholder="e.g. 15"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <!-- Fuel price -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Fuel Price ({{ symbol }} / litre)</label>
      <input
        :value="price ?? ''"
        @input="price = $event.target.value === '' ? null : Number($event.target.value)"
        type="number" inputmode="decimal" min="0"
        :placeholder="currency === 'KHR' ? 'e.g. 4,200' : 'e.g. 1.05'"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <!-- People -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Split Between</label>
      <div class="flex items-center gap-3">
        <button @click="people = Math.max(1, people - 1)" class="w-11 h-11 shrink-0 rounded-xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold text-gray-700 active:scale-90 transition">−</button>
        <input
          :value="people"
          @input="people = Math.max(1, Number($event.target.value) || 1)"
          type="number" inputmode="numeric" min="1"
          class="flex-1 text-center border border-gray-300 rounded-xl px-3 py-2.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button @click="people = people + 1" class="w-11 h-11 shrink-0 rounded-xl bg-gray-100 hover:bg-gray-200 text-2xl font-bold text-gray-700 active:scale-90 transition">+</button>
      </div>
    </div>

    <!-- Round trip -->
    <label class="flex items-center justify-between cursor-pointer select-none">
      <span class="text-sm font-semibold text-gray-700">Round trip (return journey)</span>
      <input type="checkbox" v-model="roundTrip" class="w-5 h-5 accent-blue-600" />
    </label>

    <button
      @click="clear"
      class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
    >
      Clear
    </button>

    <!-- Result -->
    <div v-if="result" class="rounded-2xl overflow-hidden shadow-md">
      <div class="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 text-white">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">Total Fuel Cost</p>
        <p class="text-4xl font-bold">{{ symbol }}{{ fmt(result.cost) }}</p>
        <p class="text-xs opacity-80 mt-1">{{ fmtKm(result.km) }} km · {{ fmtL(result.litres) }} L</p>
      </div>
      <div class="bg-white divide-y divide-gray-100">
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Fuel needed</span>
          <span class="text-sm font-semibold text-gray-700">{{ fmtL(result.litres) }} litres</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">Cost per km</span>
          <span class="text-sm font-semibold text-gray-700">{{ symbol }}{{ fmt(result.perKm) }}</span>
        </div>
        <div v-if="people > 1" class="flex justify-between items-center px-5 py-3 bg-amber-50">
          <span class="text-sm font-bold text-amber-700">Per person ({{ people }})</span>
          <span class="text-base font-bold text-amber-600">{{ symbol }}{{ fmt(result.perPerson) }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">≈ in {{ currency === 'USD' ? 'KHR' : 'USD' }}</span>
          <span class="text-sm font-semibold text-gray-500">{{ altSymbol }}{{ fmtAlt(result.cost) }} total</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExchangeRate } from '../common/useExchangeRate'

const { exchangeRate } = useExchangeRate()

const distance = ref(null)
const efficiency = ref(null)
const price = ref(null)
const people = ref(1)
const roundTrip = ref(false)
const currency = ref('USD')

const symbol = computed(() => (currency.value === 'USD' ? '$' : '៛'))
const altSymbol = computed(() => (currency.value === 'USD' ? '៛' : '$'))

const setCurrency = (c) => {
  if (c === currency.value) return
  if (price.value !== null) {
    const factor = c === 'KHR' ? exchangeRate.value : 1 / exchangeRate.value
    price.value = c === 'KHR' ? Math.round(price.value * factor) : Math.round(price.value * factor * 100) / 100
  }
  currency.value = c
}

const clear = () => {
  distance.value = null
  efficiency.value = null
  price.value = null
  people.value = 1
  roundTrip.value = false
}

const result = computed(() => {
  if (!distance.value || !efficiency.value || price.value == null) return null
  if (distance.value <= 0 || efficiency.value <= 0 || price.value < 0) return null
  const km = roundTrip.value ? distance.value * 2 : distance.value
  const litres = km / efficiency.value
  const cost = litres * price.value
  return {
    km, litres, cost,
    perKm: cost / km,
    perPerson: cost / people.value,
  }
})

const fmt = (v) =>
  currency.value === 'KHR'
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)
    : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

const fmtL = (v) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(v)
const fmtKm = (v) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)

const fmtAlt = (v) => {
  const factor = currency.value === 'USD' ? exchangeRate.value : 1 / exchangeRate.value
  const x = v * factor
  return currency.value === 'USD'
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(x)
    : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x)
}
</script>
