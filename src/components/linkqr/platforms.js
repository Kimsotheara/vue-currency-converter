const PLATFORMS = [
  {
    match: ['instagram.com'],
    name: 'Instagram',
    icon: '📷',
    gradient: ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'],
  },
  {
    match: ['twitter.com', 'x.com'],
    name: 'X (Twitter)',
    icon: '🐦',
    gradient: ['#1DA1F2', '#0d8bd9'],
  },
  {
    match: ['facebook.com'],
    name: 'Facebook',
    icon: '📘',
    gradient: ['#1877F2', '#0d65d9'],
  },
  {
    match: ['youtube.com', 'youtu.be'],
    name: 'YouTube',
    icon: '▶️',
    gradient: ['#FF0000', '#cc0000'],
  },
  {
    match: ['github.com'],
    name: 'GitHub',
    icon: '🐙',
    gradient: ['#24292E', '#40464e'],
  },
  {
    match: ['linkedin.com'],
    name: 'LinkedIn',
    icon: '💼',
    gradient: ['#0A66C2', '#0856a8'],
  },
  {
    match: ['t.me', 'telegram.me', 'telegram.org'],
    name: 'Telegram',
    icon: '✈️',
    gradient: ['#0088cc', '#006aaa'],
  },
  {
    match: ['tiktok.com'],
    name: 'TikTok',
    icon: '🎵',
    gradient: ['#010101', '#2c2c2c'],
  },
  {
    match: ['wa.me', 'whatsapp.com'],
    name: 'WhatsApp',
    icon: '💬',
    gradient: ['#25D366', '#128C7E'],
  },
]

const DEFAULT = {
  name: 'Link',
  icon: '🔗',
  gradient: ['#2563eb', '#06b6d4'],
}

export const detectPlatform = (url) => {
  const u = url.toLowerCase()
  return PLATFORMS.find(p => p.match.some(m => u.includes(m))) ?? DEFAULT
}

export const displayUrl = (url) => {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    const path = u.pathname === '/' ? '' : u.pathname
    return u.hostname + path
  } catch {
    return url
  }
}
