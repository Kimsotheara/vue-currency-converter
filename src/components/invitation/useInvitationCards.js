import { ref, computed } from 'vue'
import { downloadDataUrl } from '@/utils/download'
import { templates, khmerMoulFont } from './templates'

export function useInvitationCards() {
  const eventTitle = ref('')
  const hostName = ref('')
  const contact = ref('')
  const eventDate = ref('')
  const eventTime = ref('')
  const place = ref('')
  const message = ref('')
  const templateId = ref(templates[0].id)
  const namesInput = ref('')
  const guests = ref([])

  const template = computed(() => templates.find(t => t.id === templateId.value) || templates[0])

  // Khmer Moul heading script for the title and guest names
  const useKhmerMoul = ref(false)
  const titleFont = computed(() => (useKhmerMoul.value ? khmerMoulFont : ''))

  // Circular cover-crop (like the invoice logo) so the photo renders round
  // in the PNG download too — html2canvas can't always honor border-radius masks.
  const photo = ref(null)
  const setPhotoFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const size = 320
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        photo.value = canvas.toDataURL('image/png')
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }
  const removePhoto = () => { photo.value = null }

  const dateText = computed(() => {
    if (!eventDate.value) return ''
    const d = new Date(`${eventDate.value}T00:00:00`)
    return d.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  })

  const timeText = computed(() => {
    if (!eventTime.value) return ''
    const [h, m] = eventTime.value.split(':').map(Number)
    const hr = h % 12 || 12
    return `${hr}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
  })

  // "Theara,Lina, Youna" → ['Theara', 'Lina', 'Youna'] — commas or newlines both work
  const parsedNames = computed(() =>
    namesInput.value.split(/[,\n]+/).map(s => s.trim()).filter(Boolean),
  )

  const generate = () => {
    guests.value = parsedNames.value
  }

  const clear = () => {
    eventTitle.value = ''
    hostName.value = ''
    contact.value = ''
    eventDate.value = ''
    eventTime.value = ''
    place.value = ''
    message.value = ''
    photo.value = null
    templateId.value = templates[0].id
    useKhmerMoul.value = false
    namesInput.value = ''
    guests.value = []
  }

  const safeFileName = (name) =>
    (name || 'Guest').replace(/[\\/:*?"<>|]/g, '').trim().replace(/\s+/g, '-')

  const captureCard = async (el) => {
    const html2canvas = (await import('html2canvas')).default
    await document.fonts.ready
    const canvas = await html2canvas(el, { scale: 3, backgroundColor: null })
    return canvas.toDataURL('image/png')
  }

  const downloadCard = async (el, guestName) => {
    downloadDataUrl(await captureCard(el), `Invitation-${safeFileName(guestName)}.png`)
  }

  // One file per guest; small gaps keep browsers from blocking the burst of downloads
  const downloadAll = async (els, names) => {
    for (let i = 0; i < els.length; i++) {
      if (!els[i]) continue
      await downloadCard(els[i], names[i])
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return {
    eventTitle, hostName, contact, eventDate, eventTime, place, message,
    photo, setPhotoFile, removePhoto,
    templateId, template,
    useKhmerMoul, titleFont,
    namesInput, parsedNames, guests, generate,
    dateText, timeText,
    clear, downloadCard, downloadAll,
  }
}
