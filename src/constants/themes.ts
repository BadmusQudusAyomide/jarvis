import type { ThemeName, ThemeConfig } from '../types'

export const themes: Record<ThemeName, ThemeConfig> = {
  cyber: {
    bg: 'from-slate-900 via-purple-900 to-slate-900',
    primary: 'from-purple-500 to-pink-500',
    accent: 'purple-400',
    card: 'bg-black/40 border-purple-500/20',
    glow: 'shadow-purple-500/20'
  },
  minimal: {
    bg: 'from-gray-50 to-white',
    primary: 'from-blue-500 to-cyan-500',
    accent: 'blue-500',
    card: 'bg-white/80 border-gray-200',
    glow: 'shadow-blue-500/20'
  },
  matrix: {
    bg: 'from-black via-green-950 to-black',
    primary: 'from-green-400 to-emerald-400',
    accent: 'green-400',
    card: 'bg-black/60 border-green-500/30',
    glow: 'shadow-green-500/30'
  }
}
