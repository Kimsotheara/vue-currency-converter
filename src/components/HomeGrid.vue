<template>
  <div class="grid grid-cols-4 sm:grid-cols-5 gap-x-3 gap-y-6">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      @click="$emit('select', tab.key)"
      class="flex flex-col items-center gap-1.5 group focus:outline-none"
    >
      <span
        :class="['w-16 h-16 rounded-[20px] flex items-center justify-center text-3xl shadow-lg shadow-black/10 bg-gradient-to-br transition-transform duration-150 group-active:scale-90', tab.bg]"
      >
        {{ tab.icon }}
      </span>
      <span class="text-[11px] font-medium text-gray-700 text-center leading-tight w-full truncate px-0.5">
        {{ tab.short || tab.label }}
      </span>
    </button>
  </div>
</template>

<script setup>
defineProps({ tabs: { type: Array, required: true } })
defineEmits(['select'])
</script>
