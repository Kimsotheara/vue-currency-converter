# Utility Tools

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
| 🎡 **Spin Wheel** | Random name picker — add participants, spin the wheel, get a winner |

## Tech Stack

- [Vue 3](https://vuejs.org/) — Composition API
- [Vite](https://vitejs.dev/) — dev server & build
- [Tailwind CSS v4](https://tailwindcss.com/) — via `@tailwindcss/vite`
- [vue-multiselect](https://vue-multiselect.js.org/) — searchable dropdowns
- [qrcode](https://www.npmjs.com/package/qrcode) — QR code generation
- [axios](https://axios-http.com/) — exchange rate API calls

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
- Wi-Fi QR codes use `errorCorrectionLevel: H` for reliable scanning
- Exchange rates sourced from [exchangerate-api.com](https://www.exchangerate-api.com/)
- Currency names sourced from [openexchangerates.org](https://openexchangerates.org/)
