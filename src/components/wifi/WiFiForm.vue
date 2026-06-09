<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Network Name (SSID)</label>
      <input
        v-model="ssid"
        type="text"
        placeholder="e.g. Wifi Name"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Password</label>
      <div class="relative">
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Enter Wi-Fi password"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-11 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          @click="showPassword = !showPassword"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2">Security Type</label>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="opt in securityTypes"
          :key="opt.value"
          type="button"
          @click="security = opt.value"
          :class="[
            'flex flex-col items-center gap-0.5 py-3 rounded-xl border-2 text-center transition-all duration-150',
            security === opt.value
              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
          ]"
        >
          <span class="text-sm font-bold">{{ opt.label }}</span>
          <span class="text-xs opacity-60">{{ opt.hint }}</span>
        </button>
      </div>
      <p class="text-xs text-gray-400 mt-2 leading-relaxed">{{ selectedHint }}</p>
    </div>

    <p v-if="error" class="text-sm text-red-500 font-medium">{{ error }}</p>

    <button
      @click="submit"
      class="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition-all shadow-sm"
    >
      Generate QR Code
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['add'])

const ssid = ref('')
const password = ref('')
const security = ref('WPA')
const showPassword = ref(false)
const error = ref(null)

const securityTypes = [
  { value: 'WPA', label: 'WPA/WPA2', hint: 'Most common' },
  { value: 'WEP', label: 'WEP', hint: 'Older routers' },
  { value: 'None', label: 'None', hint: 'No password' },
]

const selectedHint = computed(() => {
  if (security.value === 'WPA')  return '✅ Used by almost all modern routers. Try this if unsure.'
  if (security.value === 'WEP')  return '⚠️ Only use if your router label specifically says WEP.'
  if (security.value === 'None') return '🔓 Open network — no password needed to connect.'
  return ''
})

const submit = () => {
  error.value = null
  if (!ssid.value.trim()) {
    error.value = 'Network name is required.'
    return
  }
  if (security.value !== 'None' && !password.value) {
    error.value = 'Password is required for secured networks.'
    return
  }
  emit('add', { ssid: ssid.value.trim(), password: password.value, security: security.value })
}
</script>
