import QRCode from 'qrcode'
import { displayUrl } from './platforms.js'

export const TEMPLATES = [
  { id: 'gradient', label: 'Gradient', defaults: { bgColor: '#2563eb', qrColor: '#ffffff' } },
  { id: 'frame',    label: 'Frame',    defaults: { bgColor: '#ffffff', qrColor: '#2563eb' } },
  { id: 'dark',     label: 'Dark',     defaults: { bgColor: '#0f172a', qrColor: '#22d3ee' } },
  { id: 'minimal',  label: 'Minimal',  defaults: { bgColor: '#ffffff', qrColor: '#1e293b' } },
]

const W = 400
const H = 520

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const darken = (hex, amount = 0.3) => {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (n >> 16) - Math.round(255 * amount))
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount))
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amount))
  return `rgb(${r},${g},${b})`
}

const makeQR = async (url, dark, light, size = 310) => {
  const c = document.createElement('canvas')
  await QRCode.toCanvas(c, url, {
    width: size, margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark, light },
  })
  return c
}

const drawGradient = async (ctx, url, { bgColor, qrColor, name, sub, icon, platform }) => {
  const stops = platform?.gradient?.length ? platform.gradient : [bgColor, darken(bgColor)]
  const grad  = ctx.createLinearGradient(0, 0, W, H)
  stops.forEach((c, i) => grad.addColorStop(i / Math.max(stops.length - 1, 1), c))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  for (let row = 0; row < H; row += 28)
    for (let col = 0; col < W; col += 28) {
      ctx.beginPath(); ctx.arc(col, row, 1.5, 0, Math.PI * 2); ctx.fill()
    }

  const QS = 310, QX = (W - QS) / 2, QY = 50
  ctx.drawImage(await makeQR(url, '#ffffff', '#00000000', QS), QX, QY)

  const cx = W / 2, cy = QY + QS / 2
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill()
  ctx.font = '34px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(icon, cx, cy + 2)

  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 5
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px Arial, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(name, W / 2, QY + QS + 40)
  ctx.globalAlpha = 0.72; ctx.shadowBlur = 0; ctx.font = '13px Arial'
  ctx.fillText(sub, W / 2, QY + QS + 64)
  ctx.globalAlpha = 1
}

const drawFrame = async (ctx, url, { bgColor, qrColor, name, sub, icon }) => {
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = qrColor
  ctx.fillRect(0, 0, W, 68)

  ctx.font = '26px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText(icon, 18, 34)
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 15px Arial, sans-serif'
  ctx.fillText(name, 56, 34)

  const QS = 280, QX = (W - QS) / 2, QY = 90
  ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 16
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, QX - 12, QY - 12, QS + 24, QS + 24, 16)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.drawImage(await makeQR(url, qrColor, '#ffffff', QS), QX, QY)

  ctx.fillStyle = '#6b7280'; ctx.font = '13px Arial'
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(sub, W / 2, QY + QS + 36)

  ctx.fillStyle = qrColor
  roundRect(ctx, 0, H - 6, W, 6, 0)
  ctx.fill()
}

const drawDark = async (ctx, url, { bgColor, qrColor, name, sub, icon }) => {
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, W, H)

  const QS = 310, QX = (W - QS) / 2, QY = 50
  const cx = W / 2, cy = QY + QS / 2
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, QS * 0.75)
  glow.addColorStop(0, `${qrColor}28`)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.drawImage(await makeQR(url, qrColor, '#00000000', QS), QX, QY)

  ctx.fillStyle = qrColor
  ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill()
  ctx.font = '32px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(icon, cx, cy + 2)

  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px Arial, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(name, W / 2, QY + QS + 40)
  ctx.fillStyle = qrColor; ctx.font = '13px Arial'
  ctx.fillText(sub, W / 2, QY + QS + 64)
}

const drawMinimal = async (ctx, url, { bgColor, qrColor, name, sub, icon }) => {
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, W, H)

  const QS = 290, QX = (W - QS) / 2, QY = 40
  ctx.drawImage(await makeQR(url, qrColor, bgColor, QS), QX, QY)

  ctx.fillStyle = qrColor
  roundRect(ctx, QX + 20, QY + QS + 14, QS - 40, 3, 2)
  ctx.fill()

  ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(icon, W / 2, QY + QS + 52)

  ctx.fillStyle = '#1e293b'; ctx.font = 'bold 16px Arial, sans-serif'
  ctx.fillText(name, W / 2, QY + QS + 82)
  ctx.fillStyle = '#9ca3af'; ctx.font = '12px Arial'
  ctx.fillText(sub, W / 2, QY + QS + 102)
}

export const drawQRCard = async ({ url, template, bgColor, qrColor, title, subtitle, platform }) => {
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  roundRect(ctx, 0, 0, W, H, 28); ctx.clip()

  const opts = {
    bgColor, qrColor, platform,
    name : title    || platform?.name || 'My Link',
    sub  : subtitle || displayUrl(url),
    icon : platform?.icon ?? '🔗',
  }

  if (template === 'gradient') await drawGradient(ctx, url, opts)
  if (template === 'frame')    await drawFrame(ctx, url, opts)
  if (template === 'dark')     await drawDark(ctx, url, opts)
  if (template === 'minimal')  await drawMinimal(ctx, url, opts)

  return canvas.toDataURL('image/png')
}
