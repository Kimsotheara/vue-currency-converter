<template>
  <div class="space-y-5">

    <!-- Add name input -->
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

    <!-- Wheel canvas + pointer -->
    <div v-if="items.length >= 2" class="flex flex-col items-center">
      <div class="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[22px] border-l-transparent border-r-transparent border-t-gray-800" />
      <canvas ref="canvasRef" :width="CANVAS_SIZE" :height="CANVAS_SIZE" class="rounded-full shadow-xl" />
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center py-10 gap-2">
      <span class="text-6xl">🎡</span>
      <p class="text-sm text-gray-400">Add at least 2 names to spin.</p>
    </div>

    <!-- Spin button -->
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

    <!-- Winner banner -->
    <Transition name="pop">
      <div
        v-if="winner"
        class="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 px-5 py-4 text-white shadow-lg text-center"
      >
        <p class="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">🎉 Winner</p>
        <p class="text-2xl font-bold">{{ winner }}</p>
      </div>
    </Transition>

    <!-- Participants list -->
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
import { ref, onMounted, watch, nextTick } from 'vue'

// ─── Constants ────────────────────────────────────────────────
const CANVAS_SIZE = 300
const COLORS = [
  '#FF6B6B', '#FF8E53', '#FFC93C', '#6BCB77',
  '#4D96FF', '#C77DFF', '#FF85A1', '#06D6A0',
  '#FFD166', '#EF476F', '#118AB2', '#A29BFE',
]

// ─── State ────────────────────────────────────────────────────
const canvasRef   = ref(null)
const items       = ref(['Alice', 'Bob', 'Charlie', 'David', 'Eve'])
const inputName   = ref('')
const angle       = ref(0)   // current rotation in radians
const spinning    = ref(false)
const winner      = ref(null)

// ─── Helpers ──────────────────────────────────────────────────
const segmentColor = (i) => COLORS[i % COLORS.length]

const truncate = (ctx, text, maxWidth) => {
  let t = text
  while (ctx.measureText(t + '…').width > maxWidth && t.length > 1) t = t.slice(0, -1)
  return t === text ? text : t.slice(0, -1) + '…'
}

// ─── Drawing ──────────────────────────────────────────────────
const draw = () => {
  const canvas = canvasRef.value
  if (!canvas || items.value.length === 0) return

  const ctx    = canvas.getContext('2d')
  const cx     = CANVAS_SIZE / 2
  const cy     = CANVAS_SIZE / 2
  const radius = cx - 4
  const n      = items.value.length
  const slice  = (2 * Math.PI) / n

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  items.value.forEach((name, i) => {
    const startAngle = angle.value + i * slice
    const endAngle   = startAngle + slice

    // Segment
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle   = segmentColor(i)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth   = 2
    ctx.stroke()

    // Label
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(startAngle + slice / 2)
    ctx.textAlign   = 'right'
    ctx.fillStyle   = '#ffffff'
    ctx.font        = `bold ${n > 8 ? 11 : 13}px Arial, sans-serif`
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur  = 3
    ctx.fillText(truncate(ctx, name, radius * 0.72), radius - 12, 5)
    ctx.restore()
  })

  // Center pin
  ctx.beginPath()
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
  ctx.fillStyle   = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth   = 2
  ctx.stroke()
}

// ─── Spin logic ───────────────────────────────────────────────
const spin = () => {
  if (spinning.value || items.value.length < 2) return

  winner.value  = null
  spinning.value = true
  let velocity  = Math.random() * 10 + 20  // degrees per frame

  const tick = () => {
    velocity      *= 0.97
    angle.value   += velocity * (Math.PI / 180)
    draw()

    if (velocity > 0.2) {
      requestAnimationFrame(tick)
    } else {
      spinning.value = false
      pickWinner()
    }
  }

  requestAnimationFrame(tick)
}

const pickWinner = () => {
  const n        = items.value.length
  const slice    = (2 * Math.PI) / n
  // Pointer is at the top (−π/2); find which segment is under it
  const offset   = ((-Math.PI / 2 - angle.value) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  winner.value   = items.value[Math.floor(offset / slice) % n]
}

// ─── List management ──────────────────────────────────────────
const addItem = () => {
  const name = inputName.value.trim()
  if (!name) return
  items.value.push(name)
  inputName.value = ''
  winner.value    = null
}

const removeItem = (i) => {
  items.value.splice(i, 1)
  winner.value = null
}

const clearAll = () => {
  items.value  = []
  winner.value = null
  angle.value  = 0
}

// ─── Lifecycle ────────────────────────────────────────────────
onMounted(draw)
watch(items, async () => { await nextTick(); draw() }, { deep: true })
</script>

<style scoped>
.pop-enter-active { animation: pop 0.35s ease; }
@keyframes pop {
  0%   { transform: scale(0.75); opacity: 0; }
  65%  { transform: scale(1.05); }
  100% { transform: scale(1);    opacity: 1; }
}
</style>
