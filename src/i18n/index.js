import { reactive, computed } from 'vue'
import en from './locales/en'
import km from './locales/km'
import zh from './locales/zh'
import th from './locales/th'
import vi from './locales/vi'

const messages = { en, km, zh, th, vi }

export const LOCALES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'km', label: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
]

const STORAGE_KEY = 'app-locale'
const state = reactive({ locale: 'en' })

function lookup(obj, path) {
  return path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj)
}

// Reads `state.locale` on every call, so any template using t() re-renders when
// the language changes. Falls back to English, then to the raw key.
export function t(key, params) {
  let str = lookup(messages[state.locale], key)
  if (str == null) str = lookup(messages.en, key)
  if (str == null) return key
  if (params) {
    str = str.replace(/\{(\w+)\}/g, (m, name) => (name in params ? params[name] : m))
  }
  return str
}

export function setLocale(code) {
  if (!messages[code]) return
  state.locale = code
  try { localStorage.setItem(STORAGE_KEY, code) } catch {}
  document.documentElement.setAttribute('lang', code)
}

export function initLocale() {
  let saved = null
  try { saved = localStorage.getItem(STORAGE_KEY) } catch {}
  if (saved && messages[saved]) state.locale = saved
  document.documentElement.setAttribute('lang', state.locale)
}

export function useI18n() {
  return {
    t,
    locale: computed(() => state.locale),
    locales: LOCALES,
    setLocale,
  }
}
