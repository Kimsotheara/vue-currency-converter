import { reactive, computed } from 'vue'

export const THEMES = [
  { value: 'light', labelKey: 'settings.themes.light', icon: '☀️', dark: false, swatch: '#f8fafc' },
  { value: 'dark', labelKey: 'settings.themes.dark', icon: '🌙', dark: true, swatch: '#1e293b' },
  { value: 'amoled', labelKey: 'settings.themes.amoled', icon: '⬛', dark: true, swatch: '#000000' },
  { value: 'blue', labelKey: 'settings.themes.blue', icon: '🔵', dark: true, swatch: '#13233f' },
  { value: 'green', labelKey: 'settings.themes.green', icon: '🟢', dark: true, swatch: '#0f2a1d' },
]

const STORAGE_KEY = 'app-theme'
const state = reactive({ theme: 'light' })

function applyTheme() {
  const def = THEMES.find((t) => t.value === state.theme) || THEMES[0]
  const root = document.documentElement
  root.classList.toggle('dark', def.dark)
  root.setAttribute('data-theme', state.theme)
}

export function setTheme(value) {
  if (!THEMES.some((t) => t.value === value)) return
  state.theme = value
  try { localStorage.setItem(STORAGE_KEY, value) } catch {}
  applyTheme()
}

export function initTheme() {
  let saved = null
  try { saved = localStorage.getItem(STORAGE_KEY) } catch {}

  if (saved && THEMES.some((t) => t.value === saved)) state.theme = saved
  applyTheme()
}

export function useTheme() {
  return {
    theme: computed(() => state.theme),
    isDark: computed(() => THEMES.find((t) => t.value === state.theme)?.dark ?? false),
    themes: THEMES,
    setTheme,
  }
}
