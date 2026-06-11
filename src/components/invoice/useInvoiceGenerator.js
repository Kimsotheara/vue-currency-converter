import { ref, computed } from 'vue'
import jsPDF from 'jspdf'
import { formatCurrency } from '@/utils/format'
import { downloadBlob } from '@/utils/download'

export const docTypes = [
  { value: 'quotation', label: 'Quotation' },
  { value: 'invoice', label: 'Invoice' },
]

export const paymentStatuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
]

const todayInputValue = () => new Date().toISOString().slice(0, 10)

const addDays = (dateStr, days) => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// image: { dataUrl, width, height } | null — optional product photo per line
const blankItem = () => ({ description: '', qty: 1, unitPrice: 0, image: null })

export function useInvoiceGenerator() {
  const docType = ref('quotation')

  const companyName = ref('')
  const companyAddress = ref('')
  const companyPhone = ref('')
  // { dataUrl, width, height } — downscaled PNG so PDF/Excel stay small
  const logo = ref(null)
  const customerLogo = ref(null)

  // Crops the image to a circle (cover-fit, transparent corners) so the logo
  // renders round everywhere — including PDF and Excel, which can't mask images.
  const readLogoInto = (targetRef, file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const size = 240
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
        targetRef.value = { dataUrl: canvas.toDataURL('image/png'), width: size, height: size }
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const setLogoFile = (file) => readLogoInto(logo, file)
  const removeLogo = () => { logo.value = null }
  const setCustomerLogoFile = (file) => readLogoInto(customerLogo, file)
  const removeCustomerLogo = () => { customerLogo.value = null }

  // Square cover-crop, downscaled so PDF/Excel stay small
  const setItemImage = (item, file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const size = 400
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        item.image = { dataUrl: canvas.toDataURL('image/png'), width: size, height: size }
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }
  const removeItemImage = (item) => { item.image = null }

  const customerName = ref('')
  const customerAddress = ref('')
  const customerPhone = ref('')

  const docNumber = ref('QT-20260001')
  const docDate = ref(todayInputValue())
  const dueDate = ref(addDays(todayInputValue(), 30))
  const paymentStatus = ref('unpaid')
  const deposit = ref(null)

  // Document-level discount (applies to quotation and invoice alike)
  const discountType = ref('amount') // 'amount' | 'percent'
  const discountValue = ref(null)

  const notes = ref('')

  const items = ref([blankItem()])

  const addItem = () => items.value.push(blankItem())
  const removeItem = (index) => {
    if (items.value.length > 1) items.value.splice(index, 1)
  }

  const lineTotal = (item) => (item.qty || 0) * (item.unitPrice || 0)

  const subtotal = computed(() => items.value.reduce((sum, item) => sum + lineTotal(item), 0))

  // Never discount more than the subtotal; percent is capped at 100
  const discountAmount = computed(() => {
    const v = discountValue.value || 0
    if (v <= 0 || subtotal.value <= 0) return 0
    if (discountType.value === 'percent') {
      return subtotal.value * Math.min(v, 100) / 100
    }
    return Math.min(v, subtotal.value)
  })

  const discountLabel = computed(() =>
    discountType.value === 'percent' && (discountValue.value || 0) > 0
      ? `Discount (${Math.min(discountValue.value, 100)}%)`
      : 'Discount',
  )

  const afterDiscount = computed(() => subtotal.value - discountAmount.value)
  // Deposit only applies to invoices; never let the amount due go negative
  const depositApplied = computed(() =>
    docType.value === 'invoice' ? Math.min(deposit.value || 0, afterDiscount.value) : 0,
  )
  const grandTotal = computed(() => afterDiscount.value - depositApplied.value)

  const setDocType = (type) => {
    docType.value = type
    const prefix = type === 'invoice' ? 'INV' : 'QT'
    docNumber.value = docNumber.value.replace(/^(QT|INV)/, prefix)
  }

  const clear = () => {
    logo.value = null
    customerLogo.value = null
    companyName.value = ''
    companyAddress.value = ''
    companyPhone.value = ''
    customerName.value = ''
    customerAddress.value = ''
    customerPhone.value = ''
    docNumber.value = docType.value === 'invoice' ? 'INV-20260001' : 'QT-20260001'
    docDate.value = todayInputValue()
    dueDate.value = addDays(todayInputValue(), 30)
    paymentStatus.value = 'unpaid'
    deposit.value = null
    discountType.value = 'amount'
    discountValue.value = null
    notes.value = ''
    items.value = [blankItem()]
  }

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Khmer (and other complex scripts) can't be shaped by jsPDF's text engine,
  // so the document is rendered as HTML by the browser and captured to the PDF.
  const buildDocumentHtml = () => {
    const title = docType.value === 'invoice' ? 'INVOICE' : 'QUOTATION'
    const fontStack = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Noto Sans Khmer', 'Khmer OS', sans-serif`
    const status = paymentStatuses.find(s => s.value === paymentStatus.value)?.label || ''

    const rows = items.value.map((item, i) => `
      <tr>
        <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:center;color:#6b7280;">${i + 1}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            ${item.image ? `<img src="${item.image.dataUrl}" style="width:80px;height:80px;border-radius:8px;flex-shrink:0;display:block;" />` : ''}
            <span>${esc(item.description)}</span>
          </div>
        </td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:right;">${item.qty || 0}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:right;">$${formatCurrency(item.unitPrice || 0)}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:right;">$${formatCurrency(lineTotal(item))}</td>
      </tr>`).join('')

    const totalRow = (label, value, style = '') => `
      <tr>
        <td style="padding:3px 8px;text-align:right;font-weight:600;">${label}</td>
        <td style="padding:3px 8px;text-align:right;min-width:110px;${style}">${value}</td>
      </tr>`

    return `
      <div style="font-family:${fontStack};color:#1f2937;font-size:13px;width:794px;padding:40px;box-sizing:border-box;background:#ffffff;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:24px;font-weight:700;">${title}</div>
            <div style="color:#6b7280;">#${esc(docNumber.value)}</div>
          </div>
          <div style="text-align:right;">
            ${logo.value ? `<img src="${logo.value.dataUrl}" style="height:56px;width:56px;border-radius:50%;display:block;margin-left:auto;margin-bottom:6px;" />` : ''}
            <div style="font-weight:700;font-size:15px;">${esc(companyName.value)}</div>
            <div style="color:#6b7280;font-size:12px;">${esc(companyAddress.value)}</div>
            <div style="color:#6b7280;font-size:12px;">${esc(companyPhone.value)}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:28px;">
          <div>
            <div style="font-weight:700;text-transform:uppercase;font-size:11px;color:#9ca3af;letter-spacing:1px;">Bill To</div>
            ${customerLogo.value ? `<img src="${customerLogo.value.dataUrl}" style="height:48px;width:48px;border-radius:50%;display:block;margin:6px 0;" />` : ''}
            <div style="font-weight:600;margin-top:2px;">${esc(customerName.value)}</div>
            <div style="color:#6b7280;font-size:12px;">${esc(customerAddress.value)}</div>
            <div style="color:#6b7280;font-size:12px;">${esc(customerPhone.value)}</div>
          </div>
          <div style="text-align:right;font-size:12px;">
            <div><span style="color:#9ca3af;">${docType.value === 'invoice' ? 'Issue Date:' : 'Quotation Date:'}</span> <b>${formatDate(docDate.value)}</b></div>
            ${docType.value === 'invoice' ? `
              <div><span style="color:#9ca3af;">Due Date:</span> <b>${formatDate(dueDate.value)}</b></div>
              <div><span style="color:#9ca3af;">Status:</span> <b>${esc(status)}</b></div>` : ''}
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-top:24px;font-size:12px;">
          <thead>
            <tr style="background:#2563eb;color:#ffffff;">
              <th style="border:1px solid #2563eb;padding:7px 8px;text-align:center;width:36px;">No</th>
              <th style="border:1px solid #2563eb;padding:7px 8px;text-align:left;">Description</th>
              <th style="border:1px solid #2563eb;padding:7px 8px;text-align:right;">Qty</th>
              <th style="border:1px solid #2563eb;padding:7px 8px;text-align:right;">Unit Price</th>
              <th style="border:1px solid #2563eb;padding:7px 8px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-top:14px;">
          <div style="flex:1;min-width:0;">
            ${notes.value ? `
              <div style="font-weight:700;text-transform:uppercase;font-size:11px;color:#9ca3af;letter-spacing:1px;">Notes</div>
              <div style="font-size:12px;color:#4b5563;white-space:pre-line;margin-top:4px;word-break:break-word;">${esc(notes.value)}</div>` : ''}
          </div>
          <table style="border-collapse:collapse;font-size:13px;flex-shrink:0;">
            ${totalRow('Subtotal:', `$${formatCurrency(subtotal.value)}`)}
            ${discountAmount.value > 0
              ? totalRow(`${discountLabel.value}:`, `-$${formatCurrency(discountAmount.value)}`, 'color:#ef4444;')
              : ''}
            ${depositApplied.value > 0
              ? totalRow('Deposit:', `-$${formatCurrency(depositApplied.value)}`, 'color:#16a34a;')
              : ''}
            ${totalRow(
              docType.value === 'invoice' ? 'Amount Due:' : 'Grand Total:',
              `$${formatCurrency(grandTotal.value)}`,
              'font-weight:700;font-size:16px;color:#2563eb;',
            )}
          </table>
        </div>
      </div>`
  }

  const downloadPdf = async () => {
    const html2canvas = (await import('html2canvas')).default
    const title = docType.value === 'invoice' ? 'INVOICE' : 'QUOTATION'

    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;left:-10000px;top:0;'
    host.innerHTML = buildDocumentHtml()
    document.body.appendChild(host)

    try {
      await document.fonts.ready
      const canvas = await html2canvas(host.firstElementChild, { scale: 2, backgroundColor: '#ffffff' })

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageW = 210
      const pageH = 297
      const imgW = pageW
      const imgH = (canvas.height * imgW) / canvas.width
      const imgData = canvas.toDataURL('image/png')

      let position = 0
      let heightLeft = imgH
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH)
      heightLeft -= pageH
      while (heightLeft > 0) {
        position -= pageH
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH)
        heightLeft -= pageH
      }

      pdf.save(`${docNumber.value || title}.pdf`)
    } finally {
      host.remove()
    }
  }

  const downloadExcel = async () => {
    const ExcelJS = (await import('exceljs')).default
    const title = docType.value === 'invoice' ? 'INVOICE' : 'QUOTATION'
    const currencyFmt = '"$"#,##0.00'

    // The Image column only exists when at least one item has a photo
    const hasImages = items.value.some(it => it.image)
    const C = hasImages
      ? { img: 'B', desc: 'C', qty: 'D', price: 'E', total: 'F' }
      : { desc: 'B', qty: 'C', price: 'D', total: 'E' }
    const labelCol = C.price
    const lastCol = C.total

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet(title)
    ws.columns = hasImages
      ? [{ width: 6 }, { width: 13 }, { width: 36 }, { width: 8 }, { width: 14 }, { width: 14 }]
      : [{ width: 6 }, { width: 40 }, { width: 8 }, { width: 14 }, { width: 14 }]

    // Header — when a logo exists it gets its own tall row so nothing overlaps
    if (logo.value) {
      const imageId = wb.addImage({ base64: logo.value.dataUrl, extension: 'png' })
      ws.getRow(1).height = 42
      // Right-aligned: 52px logo tucked into the last column
      ws.addImage(imageId, {
        tl: { col: (hasImages ? 5 : 4) + 0.45, row: 0.05 },
        ext: { width: 52, height: 52 },
      })
    }

    ws.getCell('A1').value = title
    ws.getCell('A1').font = { bold: true, size: 16 }
    ws.getCell('A1').alignment = { vertical: 'middle' }
    ws.getCell('A2').value = `#${docNumber.value}`
    ws.getCell('A2').font = { color: { argb: 'FF6B7280' } }

    // Company text starts below the logo row when present
    const compRow = logo.value ? 2 : 1
    ws.getCell(`${lastCol}${compRow}`).value = companyName.value
    ws.getCell(`${lastCol}${compRow}`).font = { bold: true }
    ws.getCell(`${lastCol}${compRow + 1}`).value = companyAddress.value
    ws.getCell(`${lastCol}${compRow + 2}`).value = companyPhone.value
    for (let i = 0; i < 3; i++) {
      ws.getCell(`${lastCol}${compRow + i}`).alignment = { horizontal: 'right' }
    }

    // Bill to & dates — one blank row after the company block
    const billRow = compRow + 4
    ws.getCell(`A${billRow}`).value = 'Bill To:'
    ws.getCell(`A${billRow}`).font = { bold: true }
    ws.getCell(`A${billRow}`).alignment = { vertical: 'middle' }
    if (customerLogo.value) {
      const imageId = wb.addImage({ base64: customerLogo.value.dataUrl, extension: 'png' })
      ws.getRow(billRow).height = 42
      // Sits right after the "Bill To:" label, at the start of column B
      ws.addImage(imageId, {
        tl: { col: 1.02, row: billRow - 1 + 0.05 },
        ext: { width: 52, height: 52 },
      })
    }
    ws.getCell(`A${billRow + 1}`).value = customerName.value
    ws.getCell(`A${billRow + 2}`).value = customerAddress.value
    ws.getCell(`A${billRow + 3}`).value = customerPhone.value

    ws.getCell(`${labelCol}${billRow}`).value = docType.value === 'invoice' ? 'Issue Date:' : 'Quotation Date:'
    ws.getCell(`${labelCol}${billRow}`).font = { bold: true }
    ws.getCell(`${lastCol}${billRow}`).value = formatDate(docDate.value)
    if (docType.value === 'invoice') {
      ws.getCell(`${labelCol}${billRow + 1}`).value = 'Due Date:'
      ws.getCell(`${labelCol}${billRow + 1}`).font = { bold: true }
      ws.getCell(`${lastCol}${billRow + 1}`).value = formatDate(dueDate.value)
      ws.getCell(`${labelCol}${billRow + 2}`).value = 'Status:'
      ws.getCell(`${labelCol}${billRow + 2}`).font = { bold: true }
      ws.getCell(`${lastCol}${billRow + 2}`).value = paymentStatuses.find(s => s.value === paymentStatus.value)?.label || ''
    }
    for (let i = 0; i < 3; i++) {
      ws.getCell(`${lastCol}${billRow + i}`).alignment = { horizontal: 'right', vertical: 'middle' }
    }

    // Items table — one blank row after the bill-to block
    const headerRowNum = billRow + 5
    const headerRow = ws.getRow(headerRowNum)
    headerRow.values = hasImages
      ? ['No', 'Image', 'Description', 'Qty', 'Unit Price', 'Total']
      : ['No', 'Description', 'Qty', 'Unit Price', 'Total']
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
    })

    const firstItemRow = headerRowNum + 1
    items.value.forEach((item, i) => {
      const r = firstItemRow + i
      ws.getCell(`A${r}`).value = i + 1
      ws.getCell(`A${r}`).alignment = { horizontal: 'center', vertical: 'middle' }
      ws.getCell(`${C.desc}${r}`).value = item.description || ''
      ws.getCell(`${C.desc}${r}`).alignment = { vertical: 'middle' }
      ws.getCell(`${C.qty}${r}`).value = item.qty || 0
      ws.getCell(`${C.qty}${r}`).alignment = { vertical: 'middle' }
      ws.getCell(`${C.price}${r}`).value = item.unitPrice || 0
      ws.getCell(`${C.price}${r}`).numFmt = currencyFmt
      ws.getCell(`${C.price}${r}`).alignment = { vertical: 'middle' }
      ws.getCell(`${C.total}${r}`).value = { formula: `${C.qty}${r}*${C.price}${r}` }
      ws.getCell(`${C.total}${r}`).numFmt = currencyFmt
      ws.getCell(`${C.total}${r}`).alignment = { vertical: 'middle' }
      if (hasImages) {
        ws.getRow(r).height = 66
        if (item.image) {
          const imageId = wb.addImage({ base64: item.image.dataUrl, extension: 'png' })
          ws.addImage(imageId, {
            tl: { col: 1.05, row: r - 1 + 0.04 },
            ext: { width: 82, height: 82 },
          })
        }
      }
    })
    const lastItemRow = firstItemRow + items.value.length - 1

    // Totals (formulas so the file stays editable)
    const subtotalRow = lastItemRow + 2
    const setTotal = (r, label, value, opts = {}) => {
      ws.getCell(`${labelCol}${r}`).value = label
      ws.getCell(`${labelCol}${r}`).font = { bold: true }
      const cell = ws.getCell(`${lastCol}${r}`)
      cell.value = value
      if (opts.currency !== false) cell.numFmt = currencyFmt
      if (opts.font) cell.font = opts.font
    }
    setTotal(subtotalRow, 'Subtotal:', { formula: `SUM(${C.total}${firstItemRow}:${C.total}${lastItemRow})` })

    let nextRow = subtotalRow + 1
    let discountRow = 0
    if (discountAmount.value > 0) {
      discountRow = nextRow
      const value = discountType.value === 'percent'
        ? { formula: `-${lastCol}${subtotalRow}*${Math.min(discountValue.value || 0, 100)}/100` }
        : -discountAmount.value
      setTotal(discountRow, `${discountLabel.value}:`, value, {
        font: { color: { argb: 'FFEF4444' } },
      })
      nextRow++
    }

    let depositRow = 0
    if (docType.value === 'invoice') {
      depositRow = nextRow
      setTotal(depositRow, 'Deposit:', deposit.value || 0, {
        font: { color: { argb: 'FF16A34A' } },
      })
      nextRow++
    }

    const grandRow = nextRow
    const grandFormula = `MAX(0,${lastCol}${subtotalRow}` +
      (discountRow ? `+${lastCol}${discountRow}` : '') +
      (depositRow ? `-${lastCol}${depositRow}` : '') + ')'
    setTotal(
      grandRow,
      docType.value === 'invoice' ? 'Amount Due:' : 'Grand Total:',
      { formula: grandFormula },
      { font: { bold: true, size: 12 } },
    )

    // Notes sit under the table on the left, level with the totals
    if (notes.value) {
      ws.getCell(`A${subtotalRow}`).value = 'Notes:'
      ws.getCell(`A${subtotalRow}`).font = { bold: true }
      const noteCell = ws.getCell(`A${subtotalRow + 1}`)
      noteCell.value = notes.value
      noteCell.alignment = { wrapText: true, vertical: 'top' }
      ws.mergeCells(`A${subtotalRow + 1}:C${subtotalRow + 4}`)
    }

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    downloadBlob(blob, `${docNumber.value || title}.xlsx`)
  }

  return {
    docType, setDocType,
    companyName, companyAddress, companyPhone,
    customerName, customerAddress, customerPhone,
    docNumber, docDate, dueDate, paymentStatus, deposit,
    logo, setLogoFile, removeLogo,
    customerLogo, setCustomerLogoFile, removeCustomerLogo,
    notes,
    items, addItem, removeItem, lineTotal,
    setItemImage, removeItemImage,
    discountType, discountValue, discountAmount, discountLabel,
    subtotal, depositApplied, grandTotal,
    clear, downloadPdf, downloadExcel,
  }
}
