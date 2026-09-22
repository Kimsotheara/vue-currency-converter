import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { downloadBlob } from '@/utils/download'

// jsPDF's built-in fonts can't render the Khmer riel glyph (៛), so the PDF
// formats amounts with a plain currency code instead of the on-screen symbol.
const pdfAmount = (value, currency) => {
  if (currency === 'KHR') {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))} KHR`
  }
  return `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`
}

// `summary` is a list of { label, value } where value is a raw number that
// gets formatted PDF-safely, or { label, text } for already-formatted text.
export function exportAmortizationPdf({ rows, currency = 'USD', summary = [] }) {
  const doc = new jsPDF('p', 'mm', 'a4')

  doc.setFontSize(16)
  doc.text('Loan Amortization Schedule', 14, 18)

  doc.setFontSize(10)
  doc.setTextColor(110)
  let y = 26
  for (const item of summary) {
    const value = item.text ?? pdfAmount(item.value, currency)
    doc.text(`${item.label}: ${value}`, 14, y)
    y += 5
  }
  doc.setTextColor(0)

  autoTable(doc, {
    startY: y + 2,
    head: [['Month', 'Payment', 'Principal', 'Interest', 'Remaining']],
    body: rows.map((r) => [
      r.month,
      pdfAmount(r.payment, currency),
      pdfAmount(r.principal, currency),
      pdfAmount(r.interest, currency),
      pdfAmount(r.balance, currency),
    ]),
    styles: { fontSize: 8, cellPadding: 1.6 },
    headStyles: { fillColor: [37, 99, 235], halign: 'center' },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  })

  downloadBlob(doc.output('blob'), 'loan-amortization.pdf')
}
