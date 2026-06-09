import { ref, onMounted, watch, nextTick } from 'vue'
import { draw } from './wheelDraw.js'
import { playTick, playCelebration } from './wheelAudio.js'

export const useWheelSpinner = () => {
  const canvasRef = ref(null)
  const items     = ref(['Alice', 'Bob', 'Charlie', 'David', 'Eve'])
  const inputName = ref('')
  const angle     = ref(0)
  const spinning  = ref(false)
  const winner    = ref(null)

  const redraw = () => draw(canvasRef.value, items.value, angle.value)

  const spin = () => {
    if (spinning.value || items.value.length < 2) return

    winner.value   = null
    spinning.value = true

    let velocity    = Math.random() * 10 + 20
    const slice     = (2 * Math.PI) / items.value.length
    let prevSegment = Math.floor(angle.value / slice)

    const frame = () => {
      velocity    *= 0.97
      angle.value += velocity * (Math.PI / 180)
      redraw()

      // Play tick each time wheel crosses a segment boundary
      const currSegment = Math.floor(angle.value / slice)
      if (currSegment !== prevSegment) {
        playTick()
        prevSegment = currSegment
      }

      if (velocity > 0.2) {
        requestAnimationFrame(frame)
      } else {
        spinning.value = false
        pickWinner()
        playCelebration()
      }
    }

    requestAnimationFrame(frame)
  }

  const pickWinner = () => {
    const n      = items.value.length
    const slice  = (2 * Math.PI) / n
    // Find which segment is under the pointer at the top (−π/2)
    const offset = ((-Math.PI / 2 - angle.value) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    winner.value = items.value[Math.floor(offset / slice) % n]
  }

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

  onMounted(redraw)
  watch(items, async () => { await nextTick(); redraw() }, { deep: true })

  return { canvasRef, items, inputName, spinning, winner, spin, addItem, removeItem, clearAll }
}
