<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
        @click.self="$emit('close')"
      >
        <Transition name="sheet" appear>
          <div
            v-if="open"
            class="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto"
            style="padding-bottom: max(1.25rem, env(safe-area-inset-bottom))"
          >
            <!-- Header -->
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-bold text-gray-800">{{ t('settings.title') }}</h2>
              <button
                @click="$emit('close')"
                class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-90 transition"
                :aria-label="t('common.close')"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Theme -->
            <section class="mb-4">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                {{ t('settings.appearance') }}
              </h3>
              <div class="grid grid-cols-3 gap-2.5">
                <button
                  v-for="opt in themes"
                  :key="opt.value"
                  type="button"
                  @click="setTheme(opt.value)"
                  :class="[
                    'flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition',
                    theme === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                >
                  <span
                    class="w-8 h-8 rounded-full shrink-0 ring-1 ring-black/10 flex items-center justify-center text-sm"
                    :style="{ backgroundColor: opt.swatch }"
                  >{{ opt.icon }}</span>
                  <span class="text-sm font-semibold text-gray-700 leading-tight">
                    {{ t(opt.labelKey) }}
                  </span>
                </button>
              </div>
            </section>

            <!-- Language -->
            <section>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                {{ t('settings.language') }}
              </h3>
              <div class="grid grid-cols-3 gap-2.5">
                <button
                  v-for="opt in locales"
                  :key="opt.code"
                  type="button"
                  @click="setLocale(opt.code)"
                  :class="[
                    'flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition',
                    locale === opt.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ]"
                >
                  <span class="text-2xl leading-none">{{ opt.flag }}</span>
                  <span class="text-sm font-semibold text-gray-700">{{ opt.label }}</span>
                </button>
              </div>
            </section>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { X } from 'lucide-vue-next'
import { useTheme } from '@/theme/useTheme'
import { useI18n } from '@/i18n'

defineProps({ open: { type: Boolean, default: false } })
defineEmits(['close'])

const { t, locale, locales, setLocale } = useI18n()
const { theme, themes, setTheme } = useTheme()
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.sheet-enter-active { transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
.sheet-leave-active { transition: transform 0.2s ease; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }
@media (min-width: 640px) {
  .sheet-enter-from, .sheet-leave-to { transform: translateY(16px) scale(0.98); }
}
</style>
