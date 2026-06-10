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

const blankItem = () => ({ description: '', qty: 1, unitPrice: 0, discount: 0 })

export function useInvoiceGenerator() {
  const docType = ref('quotation')

  const companyName = ref('')
  const companyAddress = ref('')
  const companyPhone = ref('')

  const customerName = ref('')
  const customerAddress = ref('')
  const customerPhone = ref('')

  const docNumber = ref('QT-20260001')
  const docDate = ref(todayInputValue())
  const dueDate = ref(addDays(todayInputValue(), 30))
  const paymentStatus = ref('unpaid')
  const deposit = ref(null)

  const notes = ref('')

  const items = ref([blankItem()])

  const addItem = () => items.value.push(blankItem())
  const removeItem = (index) => {
    if (items.value.length > 1) items.value.splice(index, 1)
  }

  const lineTotal = (item) =>
    Math.max(0, (item.qty || 0) * (item.unitPrice || 0) - (item.discount || 0))

  const lineDiscount = (item) =>
    Math.min((item.qty || 0) * (item.unitPrice || 0), item.discount || 0)

  const subtotal = computed(() => items.value.reduce((sum, item) => sum + lineTotal(item), 0))
  const totalDiscount = computed(() => items.value.reduce((sum, item) => sum + lineDiscount(item), 0))
  // Deposit only applies to invoices; never let the amount due go negative
  const depositApplied = computed(() =>
    docType.value === 'invoice' ? Math.min(deposit.value || 0, subtotal.value) : 0,
  )
  const grandTotal = computed(() => subtotal.value - depositApplied.value)

  const setDocType = (type) => {
    docType.value = type
    const prefix = type === 'invoice' ? 'INV' : 'QT'
    docNumber.value = docNumber.value.replace(/^(QT|INV)/, prefix)
  }

  const clear = () => {
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

    const rows = items.value.map(item => `
      <tr>
        <td style="border:1px solid #d1d5db;padding:6px 8px;">${esc(item.description)}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:right;">${item.qty || 0}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:right;">$${formatCurrency(item.unitPrice || 0)}</td>
        <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:right;color:#ef4444;">-$${formatCurrency(item.discount || 0)}</td>
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
            <div style="font-weight:700;font-size:15px;">${esc(companyName.value)}</div>
            <div style="color:#6b7280;font-size:12px;">${esc(companyAddress.value)}</div>
            <div style="color:#6b7280;font-size:12px;">${esc(companyPhone.value)}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:28px;">
          <div>
            <div style="font-weight:700;text-transform:uppercase;font-size:11px;color:#9ca3af;letter-spacing:1px;">Bill To</div>
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
              <th style="border:1px solid #2563eb;padding:7px 8px;text-align:left;">Description</th>
              <th style="border:1px solid #2563eb;padding:7px 8px;text-align:right;">Qty</th>
              <th style="border:1px solid #2563eb;padding:7px 8px;text-align:right;">Unit Price</th>
              <th style="border:1px solid #2563eb;padding:7px 8px;text-align:right;">Discount</th>
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
            ${totalRow('Total Discount:', `-$${formatCurrency(totalDiscount.value)}`, 'color:#ef4444;')}
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

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet(title)
    ws.columns = [
      { width: 40 }, { width: 8 }, { width: 14 }, { width: 14 }, { width: 14 },
    ]

    // Header
    ws.getCell('A1').value = title
    ws.getCell('A1').font = { bold: true, size: 16 }
    ws.getCell('A2').value = `#${docNumber.value}`
    ws.getCell('A2').font = { color: { argb: 'FF6B7280' } }

    ws.getCell('E1').value = companyName.value
    ws.getCell('E1').font = { bold: true }
    ws.getCell('E2').value = companyAddress.value
    ws.getCell('E3').value = companyPhone.value
    ;['E1', 'E2', 'E3'].forEach(ref => { ws.getCell(ref).alignment = { horizontal: 'right' } })

    // Bill to & dates
    ws.getCell('A4').value = 'Bill To:'
    ws.getCell('A4').font = { bold: true }
    ws.getCell('A5').value = customerName.value
    ws.getCell('A6').value = customerAddress.value
    ws.getCell('A7').value = customerPhone.value

    ws.getCell('D4').value = docType.value === 'invoice' ? 'Issue Date:' : 'Quotation Date:'
    ws.getCell('D4').font = { bold: true }
    ws.getCell('E4').value = formatDate(docDate.value)
    if (docType.value === 'invoice') {
      ws.getCell('D5').value = 'Due Date:'
      ws.getCell('D5').font = { bold: true }
      ws.getCell('E5').value = formatDate(dueDate.value)
      ws.getCell('D6').value = 'Status:'
      ws.getCell('D6').font = { bold: true }
      ws.getCell('E6').value = paymentStatuses.find(s => s.value === paymentStatus.value)?.label || ''
    }
    ;['E4', 'E5', 'E6'].forEach(ref => { ws.getCell(ref).alignment = { horizontal: 'right' } })

    // Items table
    const headerRowNum = 9
    const headerRow = ws.getRow(headerRowNum)
    headerRow.values = ['Description', 'Qty', 'Unit Price', 'Discount', 'Total']
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
    })

    const firstItemRow = headerRowNum + 1
    items.value.forEach((item, i) => {
      const r = firstItemRow + i
      const row = ws.getRow(r)
      row.values = [
        item.description || '',
        item.qty || 0,
        item.unitPrice || 0,
        item.discount || 0,
        { formula: `MAX(0,B${r}*C${r}-D${r})` },
      ]
      row.getCell(3).numFmt = currencyFmt
      row.getCell(4).numFmt = currencyFmt
      row.getCell(5).numFmt = currencyFmt
    })
    const lastItemRow = firstItemRow + items.value.length - 1

    // Totals (formulas so the file stays editable)
    const subtotalRow = lastItemRow + 2
    const setTotal = (r, label, value, opts = {}) => {
      ws.getCell(`D${r}`).value = label
      ws.getCell(`D${r}`).font = { bold: true }
      const cell = ws.getCell(`E${r}`)
      cell.value = value
      if (opts.currency !== false) cell.numFmt = currencyFmt
      if (opts.font) cell.font = opts.font
    }
    setTotal(subtotalRow, 'Subtotal:', { formula: `SUM(E${firstItemRow}:E${lastItemRow})` })
    setTotal(subtotalRow + 1, 'Total Discount:', { formula: `-SUM(D${firstItemRow}:D${lastItemRow})` }, {
      font: { color: { argb: 'FFEF4444' } },
    })

    let grandRow = subtotalRow + 2
    let grandFormula = `E${subtotalRow}`
    if (docType.value === 'invoice') {
      setTotal(subtotalRow + 2, 'Deposit:', deposit.value || 0, {
        font: { color: { argb: 'FF16A34A' } },
      })
      grandRow = subtotalRow + 3
      grandFormula = `MAX(0,E${subtotalRow}-E${subtotalRow + 2})`
    }
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
      ws.mergeCells(`A${subtotalRow + 1}:B${subtotalRow + 4}`)
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
    notes,
    items, addItem, removeItem, lineTotal,
    subtotal, totalDiscount, depositApplied, grandTotal,
    clear, downloadPdf, downloadExcel,
  }
}
