# Utility Tools

A multi-tool web app built with **Vue 3** + **Vite** + **Tailwind CSS v4**.

## Features

| Tool | Description |
|---|---|
| 💱 **Currency Exchange** | Live exchange rates, swap currencies, supports 150+ currencies |
| 🏦 **Loan Calculate** | Vehicle/personal loan calculator — Flat Rate or Reducing Balance (EMI), Monthly/Yearly rate toggle, USD/KHR currency toggle with live exchange-rate conversion and formatted number inputs |
| 📶 **Wi-Fi QR Generate** | Generate scannable QR codes for Wi-Fi networks (WPA/WEP/Open). Download as PNG with network name label |
| 📏 **Unit Exchange** | Convert Length, Weight, Temperature, Volume, Time, and Data Size |
| 🏷️ **Discount Calculate** | Enter original price + discount % to get final price and savings |
| ❤️ **BMI Calculate** | Body mass index with Metric/Imperial support, visual scale bar, and category indicator |
| 🎡 **Spin Wheel** | Random name picker — add participants, spin the wheel, get a winner with sound effects |
| 🔗 **Link QR Generate** | Paste a link or type text → styled QR card with 4 templates, color picker, and custom title/subtitle. Auto-detects platform (Instagram, Telegram, YouTube, etc.) |
| 🎯 **Saving Goal Calculate** | Enter a goal amount, current savings, and target months to get required monthly/weekly/daily savings, with a progress bar |
| 🧾 **Quotation / Invoice Generate** | Build quotations or invoices with company/customer info, line items (qty, unit price, per-item discount), deposit (invoice only), payment status, and notes. Live totals, in-app preview, and download as PDF or editable Excel — full Khmer text support |

## Tech Stack

- [Vue 3](https://vuejs.org/) — Composition API
- [Vite](https://vitejs.dev/) — dev server & build
- [Tailwind CSS v4](https://tailwindcss.com/) — via `@tailwindcss/vite`
- [vue-multiselect](https://vue-multiselect.js.org/) — searchable dropdowns
- [qrcode](https://www.npmjs.com/package/qrcode) — QR code generation
- [axios](https://axios-http.com/) — exchange rate API calls
- [jspdf](https://www.npmjs.com/package/jspdf) + [html2canvas](https://www.npmjs.com/package/html2canvas) — invoice/quotation PDF export
- [exceljs](https://www.npmjs.com/package/exceljs) — invoice/quotation Excel export (lazy-loaded)
- Web Audio API — sound effects for the spin wheel


## Project Setup

```sh
npm install
```

### Development

```sh
npm run dev
```

### Production Build

```sh
npm run build
```

## Notes

- All tool state is preserved when switching tools (`<keep-alive>`)
- Navigation uses a slide-in drawer — scales to any number of tools
- Fully responsive: phone-first layout that widens on tablet/laptop/desktop; the invoice tool gets a wider two-column form on larger screens
- Pinch/double-tap zoom and iOS input auto-zoom are disabled for an app-like feel on mobile
- Wi-Fi QR uses `errorCorrectionLevel: H` for reliable scanning
- Link QR supports two input modes: **Link** (URL + platform detection) and **Text** (any plain text)
- Link QR supports 4 card templates: Gradient, Frame, Dark, Minimal
- Spin Wheel sounds are generated via Web Audio API (no audio files needed)
- Exchange rates sourced from [exchangerate-api.com](https://www.exchangerate-api.com/)
- Currency names sourced from [openexchangerates.org](https://openexchangerates.org/)
- Loan Calculate: USD/KHR toggle converts Total Price & Down Payment using the live USD→KHR rate (falls back to 4,100 if the rate API is unavailable); KHR amounts are formatted with no decimals
- Quotation / Invoice: switching the document type swaps the number prefix (QT-/INV-); invoices add due date, payment status, and a deposit that is subtracted from the amount due (never below $0)
- Invoice PDF is rendered from HTML via html2canvas, so Khmer (and other complex scripts) display correctly — jsPDF's text engine can't shape Khmer. Noto Sans Khmer is loaded from Google Fonts for consistent rendering
- Invoice Excel export is formula-driven (line totals, subtotal, deposit, amount due), so the downloaded file recalculates when edited
- File downloads use a shared cross-browser helper (`src/utils/download.js`) — anchor attached to the DOM, delayed blob URL revoke, and a new-tab fallback for in-app webviews (Facebook/Telegram)
