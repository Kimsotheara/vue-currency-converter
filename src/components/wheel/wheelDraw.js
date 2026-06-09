export const CANVAS_SIZE = 300

export const COLORS = [
  '#FF6B6B', '#FF8E53', '#FFC93C', '#6BCB77',
  '#4D96FF', '#C77DFF', '#FF85A1', '#06D6A0',
  '#FFD166', '#EF476F', '#118AB2', '#A29BFE',
]

export const segmentColor = (i) => COLORS[i % COLORS.length]

const truncate = (ctx, text, maxWidth) => {
  let t = text
  while (ctx.measureText(t + '…').width > maxWidth && t.length > 1) t = t.slice(0, -1)
  return t === text ? text : t.slice(0, -1) + '…'
}

export const draw = (canvas, items, angle) => {
  if (!canvas || items.length === 0) return

  const ctx    = canvas.getContext('2d')
  const cx     = CANVAS_SIZE / 2
  const cy     = CANVAS_SIZE / 2
  const radius = cx - 4
  const n      = items.length
  const slice  = (2 * Math.PI) / n

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  items.forEach((name, i) => {
    const startAngle = angle + i * slice
    const endAngle   = startAngle + slice

    // Draw segment
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle   = segmentColor(i)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth   = 2
    ctx.stroke()

    // Draw label
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
