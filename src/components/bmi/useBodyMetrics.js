import { ref, computed } from 'vue'

const unit = ref('metric')
const weight = ref(null)
const heightCm = ref(null)
const heightFt = ref(null)
const heightIn = ref(null)
const sex = ref('male')
const age = ref(null)
const activity = ref(1.55)
const frame = ref('medium')

const weightKg = computed(() => {
  if (!weight.value || weight.value <= 0) return null
  return unit.value === 'metric' ? weight.value : weight.value * 0.453592
})

const heightCmVal = computed(() => {
  if (unit.value === 'metric') return heightCm.value > 0 ? heightCm.value : null
  if (!heightFt.value || heightFt.value <= 0) return null
  return (heightFt.value * 12 + (heightIn.value || 0)) * 2.54
})

const heightM = computed(() => (heightCmVal.value ? heightCmVal.value / 100 : null))

const resetBody = () => {
  unit.value = 'metric'
  weight.value = null
  heightCm.value = null
  heightFt.value = null
  heightIn.value = null
  sex.value = 'male'
  age.value = null
  activity.value = 1.55
  frame.value = 'medium'
}

export function useBodyMetrics() {
  return {
    unit, weight, heightCm, heightFt, heightIn, sex, age, activity, frame,
    weightKg, heightCmVal, heightM, resetBody,
  }
}
