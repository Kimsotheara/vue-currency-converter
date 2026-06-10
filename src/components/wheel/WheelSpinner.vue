<template>
  <div class="space-y-5">

    <div class="flex gap-2">
      <input
        v-model="inputName"
        @keyup.enter="addItem"
        type="text"
        placeholder="Enter a name..."
        maxlength="30"
        class="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        @click="addItem"
        class="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-5 rounded-xl transition-colors"
      >
        Add
      </button>
    </div>

    <div v-if="items.length >= 2" class="flex flex-col items-center">
      <div class="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[22px] border-l-transparent border-r-transparent border-t-gray-800" />
      <canvas ref="canvasRef" :width="CANVAS_SIZE" :height="CANVAS_SIZE" class="rounded-full shadow-xl max-w-full h-auto" />
    </div>

    <div v-else class="flex flex-col items-center py-10 gap-2">
      <span class="text-6xl">🎡</span>
      <p class="text-sm text-gray-400">Add at least 2 names to spin.</p>
    </div>

    <button
      v-if="items.length >= 2"
      @click="spin"
      :disabled="spinning"
      :class="[
        'w-full py-3 rounded-xl font-bold text-base transition-all',
        spinning
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-sm',
      ]"
    >
      {{ spinning ? 'Spinning...' : '🎰 SPIN!' }}
    </button>

    <Transition name="pop">
      <div
        v-if="winner"
        class="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 px-5 py-4 text-white shadow-lg text-center"
      >
        <p class="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">🎉 Winner</p>
        <p class="text-2xl font-bold">{{ winner }}</p>
      </div>
    </Transition>

    <div v-if="items.length > 0" class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-gray-500">
          {{ items.length }} participant{{ items.length !== 1 ? 's' : '' }}
        </p>
        <button @click="clearAll" class="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors">
          Clear all
        </button>
      </div>
      <div
        v-for="(item, i) in items"
        :key="i"
        class="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5"
      >
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full shrink-0" :style="{ background: segmentColor(i) }" />
          <span class="text-sm font-medium text-gray-700">{{ item }}</span>
        </div>
        <button @click="removeItem(i)" class="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none">
          ×
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useWheelSpinner } from './useWheelSpinner.js'
import { CANVAS_SIZE, segmentColor } from './wheelDraw.js'

const { canvasRef, items, inputName, spinning, winner, spin, addItem, removeItem, clearAll } = useWheelSpinner()
</script>

<style scoped>
.pop-enter-active { animation: pop 0.35s ease; }
@keyframes pop {
  0%   { transform: scale(0.75); opacity: 0; }
  65%  { transform: scale(1.05); }
  100% { transform: scale(1);    opacity: 1; }
}
</style>
