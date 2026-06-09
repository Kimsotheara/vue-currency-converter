<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Loan Amount ($)</label>
      <input
        type="number"
        :value="principal"
        @input="$emit('update:principal', toNum($event))"
        placeholder="e.g. 3000"
        min="0"
        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Interest Rate (%)</label>
      <div class="flex gap-2">
        <input
          type="number"
          :value="rate"
          @input="$emit('update:rate', toNum($event))"
          :placeholder="rateType === 'monthly' ? 'e.g. 2.05' : 'e.g. 24.6'"
          min="0"
          step="0.01"
          class="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div class="flex rounded-lg border border-gray-300 overflow-hidden shrink-0">
          <button
            type="button"
            @click="$emit('update:rateType', 'monthly')"
            :class="[
              'px-3 py-2 text-sm font-semibold transition-colors duration-150',
              rateType === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50',
            ]"
          >
            Monthly
          </button>
          <div class="w-px bg-gray-300"></div>
          <button
            type="button"
            @click="$emit('update:rateType', 'yearly')"
            :class="[
              'px-3 py-2 text-sm font-semibold transition-colors duration-150',
              rateType === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50',
            ]"
          >
            Yearly
          </button>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-1">
        {{ rateType === 'monthly' ? 'Annual rate = monthly rate × 12' : 'Monthly rate = yearly rate ÷ 12' }}
      </p>
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Loan Term (months)</label>
      <input
        type="number"
        :value="term"
        @input="$emit('update:term', toNum($event))"
        placeholder="e.g. 18"
        min="1"
        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div class="flex gap-2 pt-1">
      <button
        @click="$emit('calculate')"
        class="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm sm:text-base"
      >
        Calculate
      </button>
      <button
        @click="$emit('clear')"
        class="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm sm:text-base"
      >
        Clear
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  principal: Number,
  rate: Number,
  rateType: String,
  term: Number,
})
defineEmits(['update:principal', 'update:rate', 'update:rateType', 'update:term', 'calculate', 'clear'])

const toNum = (e) => (e.target.value === '' ? null : Number(e.target.value))
</script>
