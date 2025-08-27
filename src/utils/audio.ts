export const playSound = (type = 'chime') => {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    if (type === 'chime') {
      osc.frequency.value = 659.25 // E5
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    } else if (type === 'birthday') {
      // Happy birthday melody
      const notes = [659.25, 659.25, 739.99, 659.25, 880, 783.99]
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.frequency.value = freq
        g.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.2)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * 0.2) + 0.15)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(ctx.currentTime + i * 0.2)
        o.stop(ctx.currentTime + (i * 0.2) + 0.2)
      })
      return
    }

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch (error) {
    console.warn('Audio context failed:', error)
  }
}
