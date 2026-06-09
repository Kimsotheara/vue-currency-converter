# Finance & Utility Tools

A multi-tool web app built with **Vue 3** + **Vite** + **Tailwind CSS v4**.

## Features

| Tool | Description |
|---|---|
| 💱 **Currency Converter** | Live exchange rates, swap currencies, supports 150+ currencies |
| 🏦 **Loan Calculator** | Monthly payment, total interest, nominal & effective annual rate. Supports monthly/yearly rate input with auto-convert |
| 📶 **Wi-Fi QR Generator** | Generate scannable QR codes for Wi-Fi networks. Supports WPA/WEP/Open. Download as PNG with network name label |
| 📏 **Unit Converter** | Convert Length, Weight, Temperature, Volume, Time, and Data Size |
| 🏷️ **Discount Calculator** | Enter original price + discount % to get final price and savings |
| ❤️ **BMI Calculator** | Body mass index with Metric/Imperial support, visual scale bar, and category indicator |

## Tech Stack

- [Vue 3](https://vuejs.org/) — Composition API
- [Vite](https://vitejs.dev/) — dev server & build
- [Tailwind CSS v4](https://tailwindcss.com/) — via `@tailwindcss/vite`
- [vue-multiselect](https://vue-multiselect.js.org/) — searchable dropdowns
- [qrcode](https://www.npmjs.com/package/qrcode) — QR code generation
- [axios](https://axios-http.com/) — exchange rate API calls

## Project Structure

```
src/
├── assets/
│   └── main.css                  # Tailwind + vue-multiselect overrides
├── components/
│   ├── TabBar.vue                # Scrollable tab navigation
│   ├── currency/
│   │   ├── CurrencyConverter.vue # State & logic
│   │   ├── CurrencyForm.vue      # From/To selects + amount
│   │   └── CurrencyResult.vue    # Result display
│   ├── loan/
│   │   ├── LoanCalculator.vue    # State & logic
│   │   ├── LoanForm.vue          # Inputs + rate type toggle
│   │   └── LoanResult.vue        # Result display
│   ├── wifi/
│   │   ├── WiFiQRGenerator.vue   # Network list management
│   │   ├── WiFiForm.vue          # SSID, password, security inputs
│   │   └── WiFiCard.vue          # QR code card + download
│   ├── unit/
│   │   ├── UnitConverter.vue     # Unit converter UI & logic
│   │   └── units.js              # Unit definitions & convert()
│   ├── discount/
│   │   └── DiscountCalculator.vue
│   └── bmi/
│       └── BMICalculator.vue
└── App.vue                       # Tab routing with <keep-alive>
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

- All tab state is preserved when switching tabs (`<keep-alive>`)
- Wi-Fi QR codes use `errorCorrectionLevel: H` for reliable scanning
- Exchange rates sourced from [exchangerate-api.com](https://www.exchangerate-api.com/)
- Currency names sourced from [openexchangerates.org](https://openexchangerates.org/)
