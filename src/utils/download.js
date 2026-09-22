

const supportsDownloadAttr = 'download' in document.createElement('a')

function triggerDownload(href, filename) {
  if (!supportsDownloadAttr) {
    window.open(href, '_blank', 'noopener')
    return
  }
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => a.remove(), 1000)
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)

  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export function downloadDataUrl(dataUrl, filename) {

  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/data:([^;]+)/)?.[1] || 'application/octet-stream'
  const bytes = atob(base64)
  const buf = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)
  downloadBlob(new Blob([buf], { type: mime }), filename)
}
