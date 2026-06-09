export const categories = [
  {
    key: 'length',
    label: 'Length',
    icon: '📏',
    units: [
      { key: 'mm',   label: 'Millimeter',  factor: 0.001 },
      { key: 'cm',   label: 'Centimeter',  factor: 0.01 },
      { key: 'm',    label: 'Meter',       factor: 1 },
      { key: 'km',   label: 'Kilometer',   factor: 1000 },
      { key: 'in',   label: 'Inch',        factor: 0.0254 },
      { key: 'ft',   label: 'Foot',        factor: 0.3048 },
      { key: 'yd',   label: 'Yard',        factor: 0.9144 },
      { key: 'mi',   label: 'Mile',        factor: 1609.344 },
    ],
  },
  {
    key: 'weight',
    label: 'Weight',
    icon: '⚖️',
    units: [
      { key: 'mg',  label: 'Milligram', factor: 0.000001 },
      { key: 'g',   label: 'Gram',      factor: 0.001 },
      { key: 'kg',  label: 'Kilogram',  factor: 1 },
      { key: 'ton', label: 'Tonne',     factor: 1000 },
      { key: 'oz',  label: 'Ounce',     factor: 0.028349523 },
      { key: 'lb',  label: 'Pound',     factor: 0.453592 },
    ],
  },
  {
    key: 'temperature',
    label: 'Temperature',
    icon: '🌡️',
    units: [
      { key: 'c', label: 'Celsius' },
      { key: 'f', label: 'Fahrenheit' },
      { key: 'k', label: 'Kelvin' },
    ],
  },
  {
    key: 'volume',
    label: 'Volume',
    icon: '🧪',
    units: [
      { key: 'ml',  label: 'Milliliter', factor: 0.001 },
      { key: 'l',   label: 'Liter',      factor: 1 },
      { key: 'cup', label: 'Cup',        factor: 0.236588 },
      { key: 'pt',  label: 'Pint',       factor: 0.473176 },
      { key: 'gal', label: 'Gallon',     factor: 3.785411 },
    ],
  },
  {
    key: 'time',
    label: 'Time',
    icon: '⏱️',
    units: [
      { key: 's',   label: 'Second', factor: 1 },
      { key: 'min', label: 'Minute', factor: 60 },
      { key: 'h',   label: 'Hour',   factor: 3600 },
      { key: 'd',   label: 'Day',    factor: 86400 },
      { key: 'wk',  label: 'Week',   factor: 604800 },
      { key: 'mo',  label: 'Month',  factor: 2628000 },
      { key: 'yr',  label: 'Year',   factor: 31536000 },
    ],
  },
  {
    key: 'data',
    label: 'Data',
    icon: '🖥️',
    units: [
      { key: 'b',  label: 'Byte',     factor: 1 },
      { key: 'kb', label: 'Kilobyte', factor: 1024 },
      { key: 'mb', label: 'Megabyte', factor: 1048576 },
      { key: 'gb', label: 'Gigabyte', factor: 1073741824 },
      { key: 'tb', label: 'Terabyte', factor: 1099511627776 },
    ],
  },
]

export const convert = (value, fromKey, toKey, categoryKey) => {
  if (value === null || value === '') return null

  if (categoryKey === 'temperature') {
    let celsius
    if (fromKey === 'c') celsius = value
    else if (fromKey === 'f') celsius = (value - 32) * 5 / 9
    else celsius = value - 273.15

    if (toKey === 'c') return celsius
    if (toKey === 'f') return celsius * 9 / 5 + 32
    return celsius + 273.15
  }

  const cat = categories.find(c => c.key === categoryKey)
  const from = cat.units.find(u => u.key === fromKey)
  const to = cat.units.find(u => u.key === toKey)
  return (value * from.factor) / to.factor
}
