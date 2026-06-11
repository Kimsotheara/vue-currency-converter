<template>
  <!-- Inline styles only: html2canvas captures this node 1:1 for the PNG download -->
  <div
    :style="{
      width: '340px',
      height: '540px',
      background: t.bg,
      padding: '12px',
      boxSizing: 'border-box',
      borderRadius: '18px',
      overflow: 'hidden',
    }"
  >
    <!-- t.arch: arched top frame, Greetings Island style -->
    <div
      :style="{
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        border: `1.5px solid ${t.frame}`,
        borderRadius: t.arch ? '150px 150px 10px 10px' : '10px',
        padding: t.arch ? '40px 20px 18px' : '26px 20px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        color: t.text,
        fontFamily: t.font,
      }"
    >
      <!-- Modern badge: occasion emoji in a soft tinted circle -->
      <div
        :style="{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: t.badgeBg,
          border: `1.5px solid ${t.frame}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          color: t.accent,
          lineHeight: 1,
        }"
      >
        {{ t.badge }}
      </div>

      <p :style="{ color: t.eyebrow, fontSize: '11px', letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase', margin: '14px 0 0' }">
        {{ t.eyebrowText || "You're Invited" }}
      </p>

      <!-- Khmer Moul glyphs are tall — extra line-height keeps them from clipping -->
      <h3 :style="{ color: t.title, fontFamily: headingFont, fontSize: headingSize, fontWeight: isScript ? 400 : 700, lineHeight: titleFont ? 1.8 : (isScript ? 1.35 : 1.25), margin: '8px 0 0', wordBreak: 'break-word' }">
        {{ eventTitle || 'Our Special Event' }}
      </h3>

      <img
        v-if="photo"
        :src="photo"
        alt="Event photo"
        :style="{ width: '92px', height: '92px', borderRadius: '50%', border: `3px solid ${t.accent}`, marginTop: '14px', display: 'block' }"
      />

      <div :style="{ width: '64px', height: '2px', background: t.accent, marginTop: '16px', borderRadius: '2px' }" />

      <p :style="{ color: t.muted, fontSize: '13px', margin: '14px 0 0' }">Dear</p>
      <p :style="{ color: t.guest, fontFamily: headingFont, fontSize: guestSize, fontWeight: isScript ? 400 : 700, lineHeight: titleFont ? 1.8 : (isScript ? 1.35 : 1.3), margin: '2px 0 0', wordBreak: 'break-word' }">
        {{ guest }}
      </p>

      <p
        v-if="message"
        :style="{ color: t.muted, fontSize: '12.5px', lineHeight: 1.55, margin: '10px 0 0', whiteSpace: 'pre-line', wordBreak: 'break-word' }"
      >
        {{ message }}
      </p>

      <div :style="{ marginTop: 'auto', width: '100%', fontSize: '13px', paddingTop: '12px' }">
        <p v-if="dateText" :style="{ fontWeight: 600, margin: 0 }">
          {{ dateText }}<span v-if="timeText"> · {{ timeText }}</span>
        </p>
        <p v-if="place" :style="{ color: t.muted, margin: '4px 0 0', wordBreak: 'break-word' }">
          {{ place }}
        </p>
        <p
          v-if="hostName"
          :style="{ color: t.eyebrow, fontSize: '10.5px', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 700, margin: '12px 0 0' }"
        >
          Hosted by {{ hostName }}
        </p>
        <p v-if="contact" :style="{ color: t.muted, fontSize: '12px', margin: hostName ? '4px 0 0' : '12px 0 0' }">
          ☎ {{ contact }}
        </p>
      </div>

      <div :style="{ color: t.accent, fontSize: '17px', marginTop: '10px' }">
        {{ t.ornamentBottom }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { scriptFont } from './templates'

const props = defineProps({
  template: { type: Object, required: true },
  guest: String,
  eventTitle: String,
  hostName: String,
  contact: String,
  dateText: String,
  timeText: String,
  place: String,
  message: String,
  photo: String,
  titleFont: String,
})

const t = computed(() => props.template)

// Heading font priority: explicit override (Khmer Moul) > template script > template font.
// Calligraphy needs a bigger size at regular weight to stay legible.
const isScript = computed(() => !props.titleFont && !!t.value.script)
const headingFont = computed(() => props.titleFont || (isScript.value ? scriptFont : t.value.font))
const headingSize = computed(() => (props.titleFont ? '23px' : isScript.value ? '36px' : '27px'))
const guestSize = computed(() => (props.titleFont ? '21px' : isScript.value ? '31px' : '25px'))
</script>
