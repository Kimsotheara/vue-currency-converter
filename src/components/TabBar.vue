<template>
  <div class="flex border-b border-gray-200">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      @click="$emit('change', tab.key)"
      :class="[
        'px-5 py-2.5 text-sm font-semibold transition-colors duration-200 border-b-2 -mb-px',
        active === tab.key
          ? 'text-blue-600 border-blue-600'
          : 'text-gray-500 border-transparent hover:text-blue-500',
      ]"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({ tabs: Array, active: String })
defineEmits(['change'])
</script>
