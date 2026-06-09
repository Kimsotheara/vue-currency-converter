<template>
  <div class="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">

    <div class="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
        <span class="text-white font-bold text-base truncate">{{ network.ssid }}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="bg-white/25 text-white text-xs font-bold px-2.5 py-1 rounded-full">{{ network.security }}</span>
        <button @click="$emit('remove')" class="text-white/60 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex flex-col items-center bg-gray-50 pt-5 pb-6 px-4 gap-3">
      <div class="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 rounded-full shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
        <span class="text-white font-bold text-sm tracking-wide truncate max-w-48">{{ network.ssid }}</span>
      </div>

      <div class="bg-white rounded-2xl p-3 shadow-sm">
        <img v-if="qrDataUrl" :src="qrDataUrl" :alt="network.ssid" class="w-52 h-52 block" />
        <div v-else class="w-52 h-52 rounded-xl bg-gray-100 animate-pulse" />
      </div>

      <p class="text-xs text-gray-400">Scan to connect instantly</p>
    </div>

    <div class="px-4 pt-3 pb-4 space-y-3">
      <div class="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <div class="min-w-0">
          <p class="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Password</p>
          <p class="font-mono text-gray-700 text-sm truncate">
            {{ showPassword ? network.password : '••••••••••' }}
          </p>
        </div>
        <button type="button" @click="showPassword = !showPassword" class="ml-3 shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
          <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>

      <button
        @click="downloadQR"
        class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download QR
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({ network: Object })
defineEmits(['remove'])

const qrDataUrl = ref(null)
const showPassword = ref(false)

const escapeWifi = (str) => str
  .replace(/\\/g, '\\\\')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,')
  .replace(/"/g, '\\"')

onMounted(async () => {
  const secType = props.network.security === 'None' ? 'nopass' : props.network.security
  const wifiString = `WIFI:T:${secType};S:${escapeWifi(props.network.ssid)};P:${escapeWifi(props.network.password)};;`
  qrDataUrl.value = await QRCode.toDataURL(wifiString, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#1e293b', light: '#ffffff' },
  })
})

const downloadQR = async () => {
  if (!qrDataUrl.value) return

  const qrSize = 300
  const pad = 28
  const pillH = 46
  const pillGap = 16
  const totalW = qrSize + pad * 2
  const totalH = pad + pillH + pillGap + qrSize + 36 + pad

  const canvas = document.createElement('canvas')
  canvas.width = totalW
  canvas.height = totalH
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#f0f9ff'
  ctx.fillRect(0, 0, totalW, totalH)

  const fontSize = 16
  ctx.font = `bold ${fontSize}px Arial, sans-serif`
  const iconSpace = 36
  const pillW = Math.min(totalW - pad * 2, ctx.measureText(props.network.ssid).width + iconSpace + 40)
  const pillX = (totalW - pillW) / 2
  const pillY = pad
  const pillR = pillH / 2

  const grad = ctx.createLinearGradient(pillX, 0, pillX + pillW, 0)
  grad.addColorStop(0, '#2563eb')
  grad.addColorStop(1, '#06b6d4')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(pillX + pillR, pillY)
  ctx.lineTo(pillX + pillW - pillR, pillY)
  ctx.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + pillR)
  ctx.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - pillR, pillY + pillH)
  ctx.lineTo(pillX + pillR, pillY + pillH)
  ctx.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillR)
  ctx.quadraticCurveTo(pillX, pillY, pillX + pillR, pillY)
  ctx.closePath()
  ctx.fill()

  const iconCx = pillX + pillR + 4
  const iconCy = pillY + pillH / 2 - 1
  const iconR = 9
  ctx.strokeStyle = '#ffffff'
  ctx.lineCap = 'round'
  ;[iconR, iconR * 0.64, iconR * 0.30].forEach((r) => {
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(iconCx, iconCy, r, Math.PI * 1.22, Math.PI * 1.78)
    ctx.stroke()
  })
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(iconCx, iconCy + iconR * 0.16, 2.2, 0, Math.PI * 2)
  ctx.fill()

  let label = props.network.ssid
  const maxLabelW = pillW - iconSpace - 24
  while (ctx.measureText(label + '…').width > maxLabelW && label.length > 1) label = label.slice(0, -1)
  if (label !== props.network.ssid) label += '…'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, iconCx + 18, pillY + pillH / 2)

  const qrX = (totalW - qrSize) / 2
  const qrY = pad + pillH + pillGap
  const qp = 10, r = 16
  const bx = qrX - qp, by = qrY - qp, bw = qrSize + qp * 2, bh = qrSize + qp * 2
  ctx.shadowColor = 'rgba(0,0,0,0.08)'
  ctx.shadowBlur = 14
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(bx + r, by)
  ctx.lineTo(bx + bw - r, by)
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r)
  ctx.lineTo(bx + bw, by + bh - r)
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh)
  ctx.lineTo(bx + r, by + bh)
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r)
  ctx.lineTo(bx, by + r)
  ctx.quadraticCurveTo(bx, by, bx + r, by)
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0

  const qrImg = new Image()
  qrImg.src = qrDataUrl.value
  await new Promise(resolve => { qrImg.onload = resolve })
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '13px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Scan to connect instantly', totalW / 2, qrY + qrSize + 18)

  const a = document.createElement('a')
  a.download = `wifi-${props.network.ssid}.png`
  a.href = canvas.toDataURL('image/png')
  a.click()
}
</script>
