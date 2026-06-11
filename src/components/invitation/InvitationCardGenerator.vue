<template>
  <div class="space-y-5">

    <!-- Event details -->
    <div>
      <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Event Details</p>
      <div class="grid gap-3 md:grid-cols-2">
        <input v-model="eventTitle" type="text" placeholder="Event Title (e.g. Wedding Ceremony)"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2" />
        <input v-model="hostName" type="text" placeholder="Host Name (optional)"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <input v-model="contact" type="text" placeholder="Contact (phone / Telegram, optional)"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        <div class="flex gap-2 md:col-span-2">
          <div class="flex-1 min-w-0">
            <label class="block text-sm font-semibold text-gray-700 mb-1">Date</label>
            <input v-model="eventDate" type="date"
              class="w-full min-w-0 appearance-none bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div class="flex-1 min-w-0">
            <label class="block text-sm font-semibold text-gray-700 mb-1">Time</label>
            <input v-model="eventTime" type="time"
              class="w-full min-w-0 appearance-none bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <p v-if="timeText" class="text-xs text-gray-400 mt-1">On card: {{ timeText }}</p>
          </div>
        </div>
        <input v-model="place" type="text" placeholder="Place / Venue"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2" />
        <textarea v-model="message" rows="2" placeholder="Message (optional, e.g. Please join us to celebrate...)"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none md:col-span-2"></textarea>
      </div>
    </div>

    <!-- Photo -->
    <div class="flex items-center gap-3">
      <div v-if="photo" class="relative shrink-0">
        <img :src="photo" alt="Event photo"
          class="h-14 w-14 rounded-full object-cover border border-gray-200 bg-white" />
        <button
          @click="removePhoto"
          type="button"
          title="Remove photo"
          class="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs shadow"
        >
          ✕
        </button>
      </div>
      <label
        class="cursor-pointer border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
      >
        {{ photo ? 'Change Photo' : '+ Upload Photo (optional)' }}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="hidden"
          @change="setPhotoFile($event.target.files[0]); $event.target.value = ''"
        />
      </label>
    </div>

    <!-- Template picker: category tabs, 8 designs each -->
    <div>
      <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Card Template</p>
      <div class="flex bg-gray-100 rounded-full p-1 w-full mb-2">
        <button
          v-for="category in templateCategories"
          :key="category"
          type="button"
          @click="activeCategory = category"
          :class="[
            'flex-1 px-2 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150',
            activeCategory === category ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          {{ category }}
        </button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          v-for="tpl in templatesByCategory(activeCategory)"
          :key="tpl.id"
          type="button"
          @click="templateId = tpl.id"
          :class="[
            'rounded-xl p-1.5 text-left transition-all',
            templateId === tpl.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50',
          ]"
        >
          <div
            class="h-20 flex flex-col items-center justify-center gap-1 border border-black/5"
            :style="{ background: tpl.bg, borderRadius: tpl.arch ? '36px 36px 8px 8px' : '8px' }"
          >
            <span
              class="flex items-center justify-center rounded-full"
              :style="{ width: '28px', height: '28px', background: tpl.badgeBg, border: `1px solid ${tpl.frame}`, fontSize: '14px', color: tpl.accent, lineHeight: 1 }"
            >
              {{ tpl.badge }}
            </span>
            <span :style="{ color: tpl.title, fontFamily: tpl.script ? scriptFont : tpl.font, fontWeight: tpl.script ? 400 : 700, fontSize: tpl.script ? '15px' : '13px' }">Invite</span>
          </div>
          <p :class="['text-xs font-semibold mt-1 text-center', templateId === tpl.id ? 'text-blue-700' : 'text-gray-600']">
            {{ tpl.name }}
          </p>
        </button>
      </div>
    </div>

    <!-- Khmer Moul heading font -->
    <button
      type="button"
      @click="useKhmerMoul = !useKhmerMoul"
      class="w-full flex items-center justify-between gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors text-left"
    >
      <div>
        <p class="text-sm font-semibold text-gray-700">Khmer Moul font (អក្សរមូល)</p>
        <p class="text-xs text-gray-400">Use the Moul heading script for the event title and guest names</p>
      </div>
      <span
        :class="[
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
          useKhmerMoul ? 'bg-blue-600' : 'bg-gray-300',
        ]"
      >
        <span
          :class="[
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            useKhmerMoul ? 'left-[22px]' : 'left-0.5',
          ]"
        />
      </span>
    </button>

    <!-- Guest names -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">Guest Names</label>
      <textarea v-model="namesInput" rows="2"
        placeholder="Separate names with commas — e.g. Theara, Lina, Youna, Kak, Vita, Vanna, Sinmeas"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"></textarea>
      <p v-if="parsedNames.length" class="text-xs text-gray-400 mt-1">
        {{ parsedNames.length }} guest{{ parsedNames.length > 1 ? 's' : '' }} — one card each
      </p>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        @click="onGenerate"
        :disabled="!parsedNames.length"
        class="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        Generate Cards
      </button>
      <button
        @click="onClear"
        class="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        Clear
      </button>
    </div>

    <!-- Generated cards -->
    <div v-if="guests.length" class="space-y-3">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <p class="text-sm font-semibold text-gray-700">
          {{ guests.length }} card{{ guests.length > 1 ? 's' : '' }} generated
        </p>
        <button
          @click="onDownloadAll"
          :disabled="downloading"
          class="bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {{ downloading ? 'Downloading…' : '⬇ Download All' }}
        </button>
      </div>

      <div class="grid gap-5 justify-items-center sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="(guest, index) in guests" :key="`${guest}-${index}`" class="space-y-2">
          <div :ref="el => { cardEls[index] = el?.firstElementChild }" class="shadow-lg rounded-[18px]">
            <InvitationCard
              :template="template"
              :guest="guest"
              :event-title="eventTitle"
              :host-name="hostName"
              :contact="contact"
              :date-text="dateText"
              :time-text="timeText"
              :place="place"
              :message="message"
              :photo="photo"
              :title-font="titleFont"
            />
          </div>
          <button
            @click="onDownloadOne(index)"
            :disabled="downloading"
            class="w-full bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 text-sm font-semibold py-2 rounded-xl transition-colors"
          >
            ⬇ Download {{ guest }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onBeforeUpdate } from 'vue'
import { templates, templateCategories, scriptFont } from './templates'
import { useInvitationCards } from './useInvitationCards'
import InvitationCard from './InvitationCard.vue'

const {
  eventTitle, hostName, contact, eventDate, eventTime, place, message,
  photo, setPhotoFile, removePhoto,
  templateId, template,
  useKhmerMoul, titleFont,
  namesInput, parsedNames, guests, generate,
  dateText, timeText,
  clear, downloadCard, downloadAll,
} = useInvitationCards()

const templatesByCategory = (category) => templates.filter(t => t.category === category)
const activeCategory = ref(templateCategories[0])

const cardEls = ref([])
onBeforeUpdate(() => { cardEls.value = [] })

const downloading = ref(false)

const onGenerate = () => generate()
const onClear = () => { clear(); cardEls.value = [] }

const onDownloadOne = async (index) => {
  const el = cardEls.value[index]
  if (!el) return
  downloading.value = true
  try {
    await downloadCard(el, guests.value[index])
  } finally {
    downloading.value = false
  }
}

const onDownloadAll = async () => {
  downloading.value = true
  try {
    await downloadAll(cardEls.value, guests.value)
  } finally {
    downloading.value = false
  }
}
</script>
