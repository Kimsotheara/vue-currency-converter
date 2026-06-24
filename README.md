# Utility Tools

A multi-tool web app built with **Vue 3** + **Vite** + **Tailwind CSS v4**.

## Features

| Tool | Description |
|---|---|
| 🚀 **Internet Speed Test** | Measure your connection — download & upload speed (Mbps), ping, and jitter — using Cloudflare's speed endpoints. No API key required |
| 💱 **Currency Exchange** | Live exchange rates, swap currencies, supports 150+ currencies. **Salary Tax** tab: Cambodia monthly Tax on Salary — resident (progressive GDT brackets + dependent relief) or non-resident/foreigner (flat 20% withholding), optional NSSF employee deduction, net pay, effective rate, and a per-bracket breakdown, with USD/KHR toggle |
| 🏦 **Loan Calculate** | Vehicle/personal loan calculator — Flat Rate or Reducing Balance (EMI), Monthly/Yearly rate toggle, USD/KHR currency toggle with live exchange-rate conversion and formatted number inputs |
| 📶 **Wi-Fi QR Generate** | Generate scannable QR codes for Wi-Fi networks (WPA/WEP/Open). Download as PNG with network name label |
| 📏 **Unit Exchange** | Convert Length, Weight, Temperature, Volume, Time, and Data Size |
| 🏷️ **Discount Calculate** | Enter original price + discount % to get final price and savings |
| ❤️ **Health & Body** | Tabbed health suite sharing one set of inputs (type once, every tab reuses it): **BMI** (visual scale + category), **Calories/TDEE** (Mifflin–St Jeor BMR with activity level and weight-goal targets), and **Ideal Weight** (healthy BMI range + frame-adjusted target). Metric/Imperial support |
| 🎡 **Spin Wheel** | Random name picker — add participants, spin the wheel, get a winner with sound effects |
| 🔗 **Link QR Generate** | Paste a link or type text → styled QR card with 4 templates, color picker, and custom title/subtitle. Auto-detects platform (Instagram, Telegram, YouTube, etc.) |
| 🎯 **Saving Goal Calculate** | Enter a goal amount, current savings, and target months to get required monthly/weekly/daily savings, with a progress bar |
| 🧾 **Quotation / Invoice Generate** | Build quotations or invoices with company/customer info, line items (qty, unit price, optional item image), document-level discount ($ or %), deposit (invoice only), payment status, and notes. Live totals, in-app preview, and download as PDF or editable Excel — full Khmer text support |
| 💌 **Invitation Card Generate** | Personalized event invitation cards — event details (title, host, contact, date/time, place, message, optional photo), 32 templates across 4 occasions (Wedding, Birthday, Ceremony, Party & More), and a comma-separated guest list that generates one card per guest. Download each card as a high-res PNG named after the guest. Khmer Moul (អក្សរមូល) heading font toggle |
| ⛅ **Cambodia Weather** | Live weather for all 25 provinces with English + Khmer names — current temperature, condition, humidity, wind, and locally computed sunrise/sunset per location. Tap a province for feels-like details, a 7-day forecast, and a drill-down into its districts (~200 districts with their own live weather). Search, A-Z / hottest sort, no API key required |
| ⚽ **Football Scores** | Live scores, fixtures, and results across major leagues with day-by-day navigation. Featured-match card shows kickoff time, prediction (bookmaker odds), and match stats (possession, shots on target). Tap any match for details — line-ups on a pitch, player ratings, last-10 form, and head-to-head. All times and day grouping are pinned to Hanoi (UTC+7) |
| ⛽ **Fuel / Trip Cost** | Estimate trip fuel cost from distance, fuel efficiency (km/L), and price per litre. Round-trip toggle, split between passengers, and cost-per-km breakdown. USD/KHR toggle with live exchange rate |

## Tech Stack

- [Vue 3](https://vuejs.org/) — Composition API
- [Vite](https://vitejs.dev/) — dev server & build
- [Tailwind CSS v4](https://tailwindcss.com/) — via `@tailwindcss/vite`
- [vue-multiselect](https://vue-multiselect.js.org/) — searchable dropdowns
- [qrcode](https://www.npmjs.com/package/qrcode) — QR code generation
- [axios](https://axios-http.com/) — exchange rate API calls
- [Cloudflare Speed Test](https://speed.cloudflare.com/) — download/upload/ping/jitter measurement (no key required)
- [Open-Meteo](https://open-meteo.com/) + [MET Norway](https://api.met.no/) — free no-key weather APIs (primary + automatic fallback)
- [ESPN Soccer API](https://site.api.espn.com/apis/site/v2/sports/soccer) — live scores, fixtures, line-ups, and match stats (no key required)
- [jspdf](https://www.npmjs.com/package/jspdf) + [html2canvas](https://www.npmjs.com/package/html2canvas) — invoice/quotation PDF export and invitation card PNG capture
- [exceljs](https://www.npmjs.com/package/exceljs) — invoice/quotation Excel export (lazy-loaded)
- Google Fonts — Noto Sans Khmer (body text), Moul / Khmer OS Muol Light fallback (Khmer headings), Great Vibes (invitation calligraphy)
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
 