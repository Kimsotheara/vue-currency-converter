import { ref, computed } from 'vue'
import { useI18n } from '@/i18n'

const DOWN_URL = 'https://speed.cloudflare.com/__down'
const UP_URL = 'https://speed.cloudflare.com/__up'

export function useSpeedTest() {
  const { t } = useI18n()
  const phase = ref('idle')
  const error = ref('')

  const liveSpeed = ref(0)

  const ping = ref(null)
  const jitter = ref(null)
  const download = ref(null)
  const upload = ref(null)

  const running = computed(() => phase.value !== 'idle' && phase.value !== 'done')

  const reset = () => {
    phase.value = 'idle'
    error.value = ''
    liveSpeed.value = 0
    ping.value = null
    jitter.value = null
    download.value = null
    upload.value = null
  }

  async function measurePing(samples = 6) {
    const times = []

    for (let i = 0; i <= samples; i++) {
      const start = performance.now()
      await fetch(`${DOWN_URL}?bytes=0&_=${start}`, { cache: 'no-store' })
      const elapsed = performance.now() - start
      if (i > 0) {
        times.push(elapsed)
        liveSpeed.value = Math.round(elapsed)
      }
    }
    times.sort((a, b) => a - b)
    const median = times[Math.floor(times.length / 2)]

    let diff = 0
    for (let i = 1; i < times.length; i++) diff += Math.abs(times[i] - times[i - 1])
    ping.value = Math.round(median)
    jitter.value = Math.round(diff / Math.max(1, times.length - 1))
  }

  const toMbps = (bytes, seconds) => (bytes * 8) / seconds / 1_000_000

  async function measureDownload(bytes = 25_000_000) {
    const start = performance.now()
    const res = await fetch(`${DOWN_URL}?bytes=${bytes}&_=${start}`, { cache: 'no-store' })
    if (!res.body) {

      await res.arrayBuffer()
      const seconds = (performance.now() - start) / 1000
      download.value = +toMbps(bytes, seconds).toFixed(1)
      return
    }
    const reader = res.body.getReader()
    let received = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.length
      const seconds = (performance.now() - start) / 1000
      if (seconds > 0) liveSpeed.value = +toMbps(received, seconds).toFixed(1)
    }
    const seconds = (performance.now() - start) / 1000
    download.value = +toMbps(received, seconds).toFixed(1)
  }

  async function measureUpload(bytes = 10_000_000) {
    const payload = new Uint8Array(bytes)
    const start = performance.now()
    await fetch(UP_URL, { method: 'POST', body: payload, cache: 'no-store' })
    const seconds = (performance.now() - start) / 1000
    upload.value = +toMbps(bytes, seconds).toFixed(1)
    liveSpeed.value = upload.value
  }

  async function start() {
    reset()
    error.value = ''
    try {
      phase.value = 'ping'
      liveSpeed.value = 0
      await measurePing()

      phase.value = 'download'
      liveSpeed.value = 0
      await measureDownload()

      phase.value = 'upload'
      liveSpeed.value = 0
      await measureUpload()

      phase.value = 'done'
    } catch {
      error.value = t('speedtest.error')
      phase.value = 'idle'
    }
  }

  return {
    phase, error, liveSpeed, running,
    ping, jitter, download, upload,
    start, reset,
  }
}
