<template>
  <!-- Overlay -->
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 bg-black/40 z-50"
      @click="$emit('close')"
    />
  </Transition>

  <!-- Drawer -->
  <Transition name="slide">
    <div
      v-if="open"
      class="fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white z-50 flex flex-col shadow-2xl"
    >
      <!-- Drawer header -->
      <div class="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-6">
<!--        <p class="text-white text-xs font-semibold uppercase tracking-widest opacity-75 mb-1">Menu</p>-->
        <h2 class="text-white text-xl font-bold">Multiple Toolkit</h2>
      </div>

      <!-- Tool list -->
      <nav class="flex-1 overflow-y-auto py-3">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="select(tab.key)"
          :class="[
            'w-full flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 text-left',
            active === tab.key
              ? 'bg-blue-50 border-r-4 border-blue-600'
              : 'hover:bg-gray-50',
          ]"
        >
          <span class="text-2xl w-8 text-center">{{ tab.icon }}</span>
          <span :class="['text-sm font-semibold', active === tab.key ? 'text-blue-700' : 'text-gray-700']">
            {{ tab.label }}
          </span>
        </button>
      </nav>

      <!-- Drawer footer -->

      <div class="px-5 py-4 border-t border-gray-100">
        <p class="text-xs text-gray-400 text-center">@theara.dev</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({ open: Boolean, tabs: Array, active: String })
const emit = defineEmits(['close', 'change'])

const select = (key) => {
  emit('change', key)
  emit('close')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: transform 0.25s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }
</style>
