<template>
  <div :class="['fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br', gradient]">
    <div class="splash-logo bg-[#ffffff] rounded-[28px] p-3 shadow-2xl flex items-center justify-center w-[120px] h-[120px]">
      <span v-if="icon" class="text-6xl">{{ icon }}</span>
      <img v-else :src="logo" alt="Toolkit" class="w-24 h-24 rounded-2xl object-contain" />
    </div>
    <h1 class="mt-6 text-white text-2xl font-extrabold tracking-wide text-center px-6">{{ title }}</h1>
<!--    <p v-if="subtitle" class="mt-1 text-white/70 text-sm">{{ subtitle }}</p>-->
    <div class="mt-9 flex gap-2">
      <span class="dot" /><span class="dot" /><span class="dot" />
    </div>
  </div>
</template>

<script setup>
import logo from '../assets/template-icon-vector.jpg'

defineProps({
  title: { type: String, default: 'Multiple Toolkit' },
  // subtitle: { type: String, default: '@theara.dev' },
  icon: { type: String, default: '' }, // emoji; when empty, shows the app logo
  gradient: { type: String, default: 'from-purple-600 via-indigo-600 to-purple-700' },
})
</script>

<style scoped>
.splash-logo { animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes pop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.dot {
  width: 9px; height: 9px; border-radius: 9999px; background: rgba(255, 255, 255, 0.85);
  animation: bounce 1s infinite ease-in-out;
}
.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes bounce {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-7px); opacity: 1; }
}
</style>
