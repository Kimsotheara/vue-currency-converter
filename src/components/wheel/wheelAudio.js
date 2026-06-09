let audioCtx = null

const getAudioCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export const playTick = () => {
  const ctx  = getAudioCtx()
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type            = 'square'
  osc.frequency.value = 480

  gain.gain.setValueAtTime(0.12, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.04)
}

export const playCelebration = () => {
  const ctx = getAudioCtx()

  // Ascending C major arpeggio: C4 → E4 → G4 → C5
  const notes = [
    { freq: 523,  delay: 0.00, duration: 0.25 },
    { freq: 659,  delay: 0.15, duration: 0.25 },
    { freq: 784,  delay: 0.30, duration: 0.25 },
    { freq: 1047, delay: 0.45, duration: 0.55 },
  ]

  notes.forEach(({ freq, delay, duration }) => {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type            = 'sine'
    osc.frequency.value = freq

    const start = ctx.currentTime + delay
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

    osc.start(start)
    osc.stop(start + duration + 0.05)
  })
}
