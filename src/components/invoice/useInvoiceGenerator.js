import { ref, computed } from 'vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from '@/utils/format'

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

const blankItem = () => ({ description: '', qty: 1, unitPrice: 0, discount: 0, remark: '' })

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

  const taxRate = ref(0)
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
  const taxAmount = computed(() => subtotal.value * ((taxRate.value || 0) / 100))
  const grandTotal = computed(() => subtotal.value + taxAmount.value)

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
    taxRate.value = 0
    notes.value = ''
    items.value = [blankItem()]
  }

  const downloadPdf = () => {
    const doc = new jsPDF()
    const title = docType.value === 'invoice' ? 'INVOICE' : 'QUOTATION'

    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text(title, 14, 18)

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`#${docNumber.value}`, 14, 25)

    // Company info (top right)
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text(companyName.value || '', 196, 15, { align: 'right' })
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    if (companyAddress.value) doc.text(companyAddress.value, 196, 21, { align: 'right' })
    if (companyPhone.value) doc.text(companyPhone.value, 196, 26, { align: 'right' })

    // Customer & dates
    let y = 38
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('Bill To:', 14, y)
    doc.setFont(undefined, 'normal')
    doc.text(customerName.value || '', 14, y + 5)
    if (customerAddress.value) doc.text(customerAddress.value, 14, y + 10)
    if (customerPhone.value) doc.text(customerPhone.value, 14, y + 15)

    doc.setFont(undefined, 'bold')
    doc.text(docType.value === 'invoice' ? 'Issue Date:' : 'Quotation Date:', 140, y)
    doc.setFont(undefined, 'normal')
    doc.text(formatDate(docDate.value), 196, y, { align: 'right' })

    if (docType.value === 'invoice') {
      doc.setFont(undefined, 'bold')
      doc.text('Due Date:', 140, y + 5)
      doc.setFont(undefined, 'normal')
      doc.text(formatDate(dueDate.value), 196, y + 5, { align: 'right' })

      doc.setFont(undefined, 'bold')
      doc.text('Status:', 140, y + 10)
      doc.setFont(undefined, 'normal')
      const status = paymentStatuses.find(s => s.value === paymentStatus.value)?.label || ''
      doc.text(status, 196, y + 10, { align: 'right' })
    }

    // Items table
    autoTable(doc, {
      startY: y + 23,
      head: [['Description', 'Qty', 'Unit Price', 'Discount', 'Remark', 'Total']],
      body: items.value.map(item => [
        item.description || '',
        String(item.qty || 0),
        `$${formatCurrency(item.unitPrice || 0)}`,
        `$${formatCurrency(item.discount || 0)}`,
        item.remark || '',
        `$${formatCurrency(lineTotal(item))}`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 },
      columnStyles: { 4: { cellWidth: 35 } },
    })

    let finalY = doc.lastAutoTable.finalY + 8

    const totalsX = 140
    doc.setFontSize(10)
    doc.text('Subtotal:', totalsX, finalY)
    doc.text(`$${formatCurrency(subtotal.value)}`, 196, finalY, { align: 'right' })

    finalY += 6
    doc.text('Total Discount:', totalsX, finalY)
    doc.text(`-$${formatCurrency(totalDiscount.value)}`, 196, finalY, { align: 'right' })

    finalY += 6
    doc.text(`Tax (${taxRate.value || 0}%):`, totalsX, finalY)
    doc.text(`$${formatCurrency(taxAmount.value)}`, 196, finalY, { align: 'right' })

    finalY += 7
    doc.setFont(undefined, 'bold')
    doc.setFontSize(12)
    doc.text(docType.value === 'invoice' ? 'Amount Due:' : 'Grand Total:', totalsX, finalY)
    doc.text(`$${formatCurrency(grandTotal.value)}`, 196, finalY, { align: 'right' })

    if (notes.value) {
      finalY += 14
      doc.setFont(undefined, 'bold')
      doc.setFontSize(10)
      doc.text('Notes:', 14, finalY)
      doc.setFont(undefined, 'normal')
      const lines = doc.splitTextToSize(notes.value, 182)
      doc.text(lines, 14, finalY + 5)
    }

    doc.save(`${docNumber.value || title}.pdf`)
  }

  const downloadExcel = async () => {
    const ExcelJS = (await import('exceljs')).default
    const title = docType.value === 'invoice' ? 'INVOICE' : 'QUOTATION'
    const currencyFmt = '"$"#,##0.00'

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet(title)
    ws.columns = [
      { width: 32 }, { width: 8 }, { width: 14 }, { width: 14 }, { width: 32 }, { width: 14 },
    ]

    // Header
    ws.getCell('A1').value = title
    ws.getCell('A1').font = { bold: true, size: 16 }
    ws.getCell('A2').value = `#${docNumber.value}`
    ws.getCell('A2').font = { color: { argb: 'FF6B7280' } }

    ws.getCell('F1').value = companyName.value
    ws.getCell('F1').font = { bold: true }
    ws.getCell('F2').value = companyAddress.value
    ws.getCell('F3').value = companyPhone.value
    ;['F1', 'F2', 'F3'].forEach(ref => { ws.getCell(ref).alignment = { horizontal: 'right' } })

    // Bill to & dates
    ws.getCell('A4').value = 'Bill To:'
    ws.getCell('A4').font = { bold: true }
    ws.getCell('A5').value = customerName.value
    ws.getCell('A6').value = customerAddress.value
    ws.getCell('A7').value = customerPhone.value

    ws.getCell('E4').value = docType.value === 'invoice' ? 'Issue Date:' : 'Quotation Date:'
    ws.getCell('E4').font = { bold: true }
    ws.getCell('F4').value = formatDate(docDate.value)
    if (docType.value === 'invoice') {
      ws.getCell('E5').value = 'Due Date:'
      ws.getCell('E5').font = { bold: true }
      ws.getCell('F5').value = formatDate(dueDate.value)
      ws.getCell('E6').value = 'Status:'
      ws.getCell('E6').font = { bold: true }
      ws.getCell('F6').value = paymentStatuses.find(s => s.value === paymentStatus.value)?.label || ''
    }
    ;['F4', 'F5', 'F6'].forEach(ref => { ws.getCell(ref).alignment = { horizontal: 'right' } })

    // Items table
    const headerRowNum = 9
    const headerRow = ws.getRow(headerRowNum)
    headerRow.values = ['Description', 'Qty', 'Unit Price', 'Discount', 'Remark', 'Total']
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
        item.remark || '',
        { formula: `MAX(0,B${r}*C${r}-D${r})` },
      ]
      row.getCell(3).numFmt = currencyFmt
      row.getCell(4).numFmt = currencyFmt
      row.getCell(6).numFmt = currencyFmt
      row.getCell(5).alignment = { wrapText: true }
    })
    const lastItemRow = firstItemRow + items.value.length - 1

    // Totals (formulas so the file stays editable)
    const subtotalRow = lastItemRow + 2
    const setTotal = (r, label, value, opts = {}) => {
      ws.getCell(`E${r}`).value = label
      ws.getCell(`E${r}`).font = { bold: true }
      const cell = ws.getCell(`F${r}`)
      cell.value = value
      if (opts.currency !== false) cell.numFmt = currencyFmt
      if (opts.font) cell.font = opts.font
    }
    setTotal(subtotalRow, 'Subtotal:', { formula: `SUM(F${firstItemRow}:F${lastItemRow})` })
    setTotal(subtotalRow + 1, 'Total Discount:', { formula: `-SUM(D${firstItemRow}:D${lastItemRow})` }, {
      font: { color: { argb: 'FFEF4444' } },
    })
    setTotal(subtotalRow + 2, 'Tax Rate (%):', taxRate.value || 0, { currency: false })
    setTotal(subtotalRow + 3, 'Tax Amount:', { formula: `F${subtotalRow}*F${subtotalRow + 2}/100` })
    setTotal(
      subtotalRow + 4,
      docType.value === 'invoice' ? 'Amount Due:' : 'Grand Total:',
      { formula: `F${subtotalRow}+F${subtotalRow + 3}` },
      { font: { bold: true, size: 12 } },
    )

    if (notes.value) {
      const notesRow = subtotalRow + 6
      ws.getCell(`A${notesRow}`).value = 'Notes:'
      ws.getCell(`A${notesRow}`).font = { bold: true }
      ws.getCell(`A${notesRow + 1}`).value = notes.value
      ws.getCell(`A${notesRow + 1}`).alignment = { wrapText: true }
    }

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${docNumber.value || title}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  }

  return {
    docType, setDocType,
    companyName, companyAddress, companyPhone,
    customerName, customerAddress, customerPhone,
    docNumber, docDate, dueDate, paymentStatus,
    taxRate, notes,
    items, addItem, removeItem, lineTotal,
    subtotal, totalDiscount, taxAmount, grandTotal,
    clear, downloadPdf, downloadExcel,
  }
}
