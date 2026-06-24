/**
 * Maps each tool's tab `key` to its icon (a Lucide component).
 *
 * To change an icon:
 *   1. Find one at https://lucide.dev
 *   2. Add its name to the import below
 *   3. Assign it to the tool key here
 * No SVG path editing or `v-html` needed — HomeGrid renders these as components.
 */
import {
  Gauge,
  ArrowRightLeft,
  Landmark,
  Wifi,
  Ruler,
  Tag,
  HeartPulse,
  Disc3,
  QrCode,
  PiggyBank,
  ReceiptText,
  Mail,
  CloudSun,
  Goal,
  Fuel,
} from 'lucide-vue-next'

export const toolIcons = {
  speedtest: Gauge,
  currency: ArrowRightLeft,
  vehicleloan: Landmark,
  wifi: Wifi,
  unit: Ruler,
  discount: Tag,
  bmi: HeartPulse,
  wheel: Disc3,
  linkqr: QrCode,
  savinggoal: PiggyBank,
  invoice: ReceiptText,
  invitation: Mail,
  weather: CloudSun,
  football: Goal,
  fuelcost: Fuel,
}

/**
 * Returns the icon component for a tool key, or `null` if none is defined.
 * @param {string} key - the tool's tab key
 */
export function getToolIcon(key) {
  return toolIcons[key] ?? null
}
