<template>
  <div class="space-y-6">
    <WiFiForm @add="addNetwork" />

    <div v-if="networks.length > 0" class="space-y-4">
      <div class="flex items-center gap-2">
        <div class="flex-1 h-px bg-gray-200"></div>
        <span class="text-xs text-gray-400 font-semibold uppercase tracking-widest">Generated</span>
        <div class="flex-1 h-px bg-gray-200"></div>
      </div>
      <WiFiCard
        v-for="network in networks"
        :key="network.id"
        :network="network"
        @remove="removeNetwork(network.id)"
      />
    </div>

    <div v-else class="text-center py-10">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
      <p class="text-sm text-gray-400">Fill in the form above to generate your first QR code.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import WiFiForm from './WiFiForm.vue'
import WiFiCard from './WiFiCard.vue'

const networks = ref([])

const addNetwork = (entry) => {
  networks.value.unshift({ ...entry, id: Date.now() })
}

const removeNetwork = (id) => {
  networks.value = networks.value.filter(n => n.id !== id)
}
</script>
