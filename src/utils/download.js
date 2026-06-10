// Cross-browser file download helpers.
//
// Chrome forgives a lot; other browsers don't:
// - Firefox needs the <a> to be attached to the document before click()
// - Safari may cancel the download if the blob URL is revoked synchronously
// - In-app webviews (Facebook, Telegram, ...) ignore the download attribute,
//   so we fall back to opening the file in a new tab

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
  // Give the browser time to start the download before releasing the URL
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export function downloadDataUrl(dataUrl, filename) {
  // Long data: URLs are unreliable as anchor targets in Safari; converting to
  // a blob first keeps the URL short and downloads working everywhere.
  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/data:([^;]+)/)?.[1] || 'application/octet-stream'
  const bytes = atob(base64)
  const buf = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)
  downloadBlob(new Blob([buf], { type: mime }), filename)
}
