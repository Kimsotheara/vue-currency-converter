
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

export function getToolIcon(key) {
  return toolIcons[key] ?? null
}
