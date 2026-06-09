# Utility Tools

A multi-tool web app built with **Vue 3** + **Vite** + **Tailwind CSS v4**.

## Features

| Tool | Description |
|---|---|
| 💱 **Currency Exchange** | Live exchange rates, swap currencies, supports 150+ currencies |
| 🏦 **Loan Calculate** | Monthly payment, total interest, nominal & effective annual rate. Monthly/yearly rate input with auto-convert |
| 📶 **Wi-Fi QR Generate** | Generate scannable QR codes for Wi-Fi networks (WPA/WEP/Open). Download as PNG with network name label |
| 📏 **Unit Exchange** | Convert Length, Weight, Temperature, Volume, Time, and Data Size |
| 🏷️ **Discount Calculate** | Enter original price + discount % to get final price and savings |
| ❤️ **BMI Calculate** | Body mass index with Metric/Imperial support, visual scale bar, and category indicator |
| 🎡 **Spin Wheel** | Random name picker — add participants, spin the wheel, get a winner with sound effects |
| 🔗 **Link QR Generate** | Paste a link or type text → styled QR card with 4 templates, color picker, and custom title/subtitle. Auto-detects platform (Instagram, Telegram, YouTube, etc.) |

## Tech Stack

- [Vue 3](https://vuejs.org/) — Composition API
- [Vite](https://vitejs.dev/) — dev server & build
- [Tailwind CSS v4](https://tailwindcss.com/) — via `@tailwindcss/vite`
- [vue-multiselect](https://vue-multiselect.js.org/) — searchable dropdowns
- [qrcode](https://www.npmjs.com/package/qrcode) — QR code generation
- [axios](https://axios-http.com/) — exchange rate API calls
- Web Audio API — sound effects for the spin wheel

## Project Structure

```
src/
├── assets/
│   └── main.css                      # Tailwind + vue-multiselect overrides
├── components/
│   ├── DrawerMenu.vue                # Slide-in hamburger navigation drawer
│   ├── currency/
│   │   ├── CurrencyConverter.vue     # State & logic
│   │   ├── CurrencyForm.vue          # From/To selects + amount input
│   │   └── CurrencyResult.vue        # Result display
│   ├── loan/
│   │   ├── LoanCalculator.vue        # State & logic
│   │   ├── LoanForm.vue              # Inputs + rate type toggle
│   │   └── LoanResult.vue            # Result display
│   ├── wifi/
│   │   ├── WiFiQRGenerator.vue       # Network list management
│   │   ├── WiFiForm.vue              # SSID, password, security inputs
│   │   └── WiFiCard.vue              # QR code card + download
│   ├── unit/
│   │   ├── UnitConverter.vue         # Unit converter UI & logic
│   │   └── units.js                  # Unit definitions & convert()
│   ├── discount/
│   │   └── DiscountCalculator.vue
│   ├── bmi/
│   │   └── BMICalculator.vue
│   ├── wheel/
│   │   ├── WheelSpinner.vue          # Template (UI only)
│   │   ├── useWheelSpinner.js        # Composable — state, spin, list logic
│   │   ├── wheelDraw.js              # Canvas drawing functions
│   │   └── wheelAudio.js             # Web Audio — tick & celebration sounds
│   └── linkqr/
│       ├── LinkQRGenerator.vue       # UI — mode toggle, preview, customisation tabs
│       ├── useLinkQR.js              # Composable — reactive state & generation logic
│       ├── qrCardDraw.js             # Canvas drawing for 4 templates
│       └── platforms.js              # Platform detection & gradient presets
└── App.vue                           # Hamburger drawer + keep-alive routing
```

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
- Wi-Fi QR uses `errorCorrectionLevel: H` for reliable scanning
- Link QR supports two input modes: **Link** (URL + platform detection) and **Text** (any plain text)
- Link QR supports 4 card templates: Gradient, Frame, Dark, Minimal
- Spin Wheel sounds are generated via Web Audio API (no audio files needed)
- Exchange rates sourced from [exchangerate-api.com](https://www.exchangerate-api.com/)
- Currency names sourced from [openexchangerates.org](https://openexchangerates.org/)
