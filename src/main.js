import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import { initTheme } from './theme/useTheme'
import { initLocale } from './i18n'

initTheme()
initLocale()

createApp(App).mount('#app')
