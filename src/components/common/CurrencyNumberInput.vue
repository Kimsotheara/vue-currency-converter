<template>
  <input
    type="text"
    inputmode="decimal"
    :value="display"
    @input="onInput"
    @blur="onBlur"
  />
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: null },
  currency: { type: String, default: 'USD' },
})
const emit = defineEmits(['update:modelValue'])

const decimals = () => (props.currency === 'KHR' ? 0 : 2)

const formatValue = (v) => {
  if (v === null || v === undefined || v === '') return ''
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals() }).format(v)
}

const formatLive = (cleaned) => {
  if (cleaned === '') return ''
  const [intPart, decPart] = cleaned.split('.')
  const formattedInt = new Intl.NumberFormat('en-US').format(Number(intPart || 0))
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
}

const display = ref(formatValue(props.modelValue))

watch(() => [props.modelValue, props.currency], () => {
  display.value = formatValue(props.modelValue)
})

const onInput = (e) => {
  let cleaned = e.target.value.replace(/,/g, '')
  if (props.currency === 'KHR') cleaned = cleaned.replace(/\./g, '')
  cleaned = cleaned.replace(/[^\d.]/g, '')

  const parts = cleaned.split('.')
  if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('')

  display.value = formatLive(cleaned)
  emit('update:modelValue', cleaned === '' || cleaned === '.' ? null : Number(cleaned))
}

const onBlur = () => {
  display.value = formatValue(props.modelValue)
}
</script>
