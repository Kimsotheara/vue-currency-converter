import { ref, computed, watch } from 'vue'
import { detectPlatform } from './platforms.js'
import { drawQRCard, TEMPLATES } from './qrCardDraw.js'

const TEXT_PLATFORM = { name: 'Text', icon: '📝', gradient: ['#6366f1', '#8b5cf6'] }

export const useLinkQR = () => {
  const inputMode    = ref('link')
  const url          = ref('')
  const textContent  = ref('')
  const template     = ref('gradient')
  const bgColor      = ref('#2563eb')
  const qrColor      = ref('#ffffff')
  const titleText    = ref('')
  const subtitleText = ref('')
  const qrDataUrl    = ref(null)
  const generating   = ref(false)
  const error        = ref(null)

  const platform = computed(() =>
    inputMode.value === 'link' && url.value.trim() ? detectPlatform(url.value) : null
  )

  const activePlatform = computed(() =>
    inputMode.value === 'text' ? TEXT_PLATFORM : platform.value
  )

  const generate = async () => {
    const content = inputMode.value === 'link'
      ? (url.value.trim() ? (url.value.startsWith('http') ? url.value : `https://${url.value}`) : '')
      : textContent.value.trim()

    if (!content) { qrDataUrl.value = null; return }

    generating.value = true
    error.value = null

    try {
      qrDataUrl.value = await drawQRCard({
        url      : content,
        template : template.value,
        bgColor  : bgColor.value,
        qrColor  : qrColor.value,
        title    : titleText.value,
        subtitle : subtitleText.value,
        platform : activePlatform.value,
      })
    } catch {
      error.value = 'Could not generate QR. Please check your input.'
    } finally {
      generating.value = false
    }
  }

  let debounce = null
  const debouncedGenerate = () => {
    clearTimeout(debounce)
    debounce = setTimeout(generate, 400)
  }

  watch(url, debouncedGenerate)
  watch(textContent, debouncedGenerate)
  watch([template, bgColor, qrColor, titleText, subtitleText], generate)

  watch(inputMode, () => {
    qrDataUrl.value  = null
    error.value      = null
    titleText.value  = ''
    subtitleText.value = ''
  })

  watch(template, (id) => {
    const t = TEMPLATES.find(t => t.id === id)
    if (!t) return
    qrColor.value = t.defaults.qrColor
    bgColor.value = (id === 'gradient' && activePlatform.value)
      ? activePlatform.value.gradient[0]
      : t.defaults.bgColor
  })

  watch(platform, (p) => {
    if (p && template.value === 'gradient') bgColor.value = p.gradient[0]
  })

  const download = () => {
    if (!qrDataUrl.value) return
    const name = inputMode.value === 'text' ? 'text' : (platform.value?.name.toLowerCase() ?? 'link')
    const a = document.createElement('a')
    a.download = `qr-${name}.png`
    a.href = qrDataUrl.value
    a.click()
  }

  return {
    inputMode, url, textContent,
    template, bgColor, qrColor, titleText, subtitleText,
    qrDataUrl, generating, error, platform,
    download, TEMPLATES,
  }
}
