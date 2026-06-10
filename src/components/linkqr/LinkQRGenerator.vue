<template>
  <div class="space-y-5">

    <div class="flex rounded-xl border border-gray-200 overflow-hidden w-fit">
      <button
        @click="inputMode = 'link'"
        :class="['px-5 py-2.5 text-sm font-semibold transition-colors duration-150',
          inputMode === 'link' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50']"
      >
        🔗 Link
      </button>
      <div class="w-px bg-gray-200" />
      <button
        @click="inputMode = 'text'"
        :class="['px-5 py-2.5 text-sm font-semibold transition-colors duration-150',
          inputMode === 'text' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50']"
      >
        📝 Text
      </button>
    </div>

    <div v-if="inputMode === 'link'">
      <label class="block text-sm font-semibold text-gray-700 mb-1">Paste your link</label>
      <input
        v-model="url"
        type="url"
        placeholder="https://instagram.com/username"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <div v-if="platform && url.trim()" class="flex items-center gap-2 mt-2">
        <span class="text-lg">{{ platform.icon }}</span>
        <span class="text-sm font-semibold text-gray-700">{{ platform.name }}</span>
        <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">detected</span>
      </div>
    </div>

    <div v-else>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Enter your text</label>
      <textarea
        v-model="textContent"
        placeholder="Type any text, message, or content..."
        rows="4"
        maxlength="500"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
      <p class="text-xs text-gray-400 mt-1 text-right">{{ textContent.length }} / 500</p>
    </div>

    <div class="flex flex-col items-center">
      <div v-if="generating" class="w-72 max-w-full h-80 rounded-2xl bg-gray-100 animate-pulse" />
      <img v-else-if="qrDataUrl" :src="qrDataUrl" class="w-72 max-w-full rounded-2xl shadow-xl" alt="QR Preview" />
      <div v-else class="w-72 max-w-full h-80 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-300">
        <span class="text-5xl">{{ inputMode === 'link' ? '🔗' : '📝' }}</span>
        <p class="text-xs">{{ inputMode === 'link' ? 'Paste a link above' : 'Enter text above' }}</p>
      </div>
    </div>

    <div class="rounded-2xl border border-gray-200 overflow-hidden">

      <div class="flex border-b border-gray-200">
        <button
          v-for="tab in ['Templates', 'Colors', 'Text']"
          :key="tab"
          @click="activeTab = tab"
          :class="[
            'flex-1 py-2.5 text-sm font-semibold transition-colors',
            activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 -mb-px bg-white' : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          {{ tab }}
        </button>
      </div>

      <div v-if="activeTab === 'Templates'" class="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          v-for="t in TEMPLATES"
          :key="t.id"
          @click="template = t.id"
          :class="['rounded-xl overflow-hidden transition-all', template === t.id ? 'ring-2 ring-blue-500 ring-offset-1' : 'opacity-80 hover:opacity-100']"
        >
          <div :class="['h-16 flex items-center justify-center', THUMBNAIL[t.id].bg]">
            <div class="grid grid-cols-3 gap-0.5 w-8 h-8 p-0.5 rounded" :class="THUMBNAIL[t.id].qr">
              <span v-for="i in 9" :key="i" class="rounded-sm" :class="THUMBNAIL[t.id].dot" />
            </div>
          </div>
          <p class="text-xs text-center py-1.5 font-medium text-gray-600 bg-white">{{ t.label }}</p>
        </button>
      </div>

      <div v-if="activeTab === 'Colors'" class="p-4 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-700">Background</p>
            <p class="text-xs text-gray-400 mt-0.5">Card / gradient color</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-gray-500">{{ bgColor }}</span>
            <label class="relative cursor-pointer">
              <div class="w-10 h-10 rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
                <div class="w-full h-full" :style="{ background: bgColor }" />
              </div>
              <input type="color" v-model="bgColor" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </label>
          </div>
        </div>
        <div class="h-px bg-gray-100" />
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-700">QR Color</p>
            <p class="text-xs text-gray-400 mt-0.5">Modules / dots color</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-gray-500">{{ qrColor }}</span>
            <label class="relative cursor-pointer">
              <div class="w-10 h-10 rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
                <div class="w-full h-full" :style="{ background: qrColor }" />
              </div>
              <input type="color" v-model="qrColor" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </label>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'Text'" class="p-4 space-y-3">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Title</label>
          <input
            v-model="titleText"
            type="text"
            :placeholder="inputMode === 'link' ? 'e.g. Follow me on Instagram' : 'e.g. Scan to read'"
            maxlength="40"
            class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
          <input
            v-model="subtitleText"
            type="text"
            :placeholder="inputMode === 'link' ? 'e.g. @username' : 'e.g. My message'"
            maxlength="60"
            class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

    </div>

    <p v-if="error" class="text-sm text-red-500 font-medium">{{ error }}</p>

    <button
      @click="download"
      :disabled="!qrDataUrl"
      class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-3 rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download QR
    </button>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLinkQR } from './useLinkQR.js'

const {
  inputMode, url, textContent,
  template, bgColor, qrColor, titleText, subtitleText,
  qrDataUrl, generating, error, platform,
  download, TEMPLATES,
} = useLinkQR()

const activeTab = ref('Templates')

const THUMBNAIL = {
  gradient: { bg: 'bg-gradient-to-br from-blue-500 to-cyan-400', qr: 'bg-white/25',    dot: 'bg-white'    },
  frame:    { bg: 'bg-white border border-gray-200',              qr: 'bg-transparent', dot: 'bg-blue-500' },
  dark:     { bg: 'bg-gray-900',                                  qr: 'bg-transparent', dot: 'bg-cyan-400' },
  minimal:  { bg: 'bg-gray-50',                                   qr: 'bg-transparent', dot: 'bg-gray-800' },
}
</script>
