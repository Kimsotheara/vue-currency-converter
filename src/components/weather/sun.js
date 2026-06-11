const sunTimes = (lat, lon, date = new Date()) => {
  const J2000 = 2451545
  const Jdate = date.getTime() / 86400000 + 2440587.5
  const n = Math.round(Jdate - J2000 + lon / 360)
  const Jstar = n - lon / 360
  const M = ((357.5291 + 0.98560028 * Jstar) % 360 + 360) % 360
  const Mr = M * Math.PI / 180
  const C = 1.9148 * Math.sin(Mr) + 0.02 * Math.sin(2 * Mr) + 0.0003 * Math.sin(3 * Mr)
  const L = ((M + C + 180 + 102.9372) % 360 + 360) % 360
  const Lr = L * Math.PI / 180
  const Jtransit = J2000 + Jstar + 0.0053 * Math.sin(Mr) - 0.0069 * Math.sin(2 * Lr)
  const sinDec = Math.sin(Lr) * Math.sin(23.4397 * Math.PI / 180)
  const cosDec = Math.cos(Math.asin(sinDec))
  const latR = lat * Math.PI / 180
  const cosH = (Math.sin(-0.833 * Math.PI / 180) - Math.sin(latR) * sinDec) /
    (Math.cos(latR) * cosDec)
  if (cosH < -1 || cosH > 1) return null
  const H = Math.acos(cosH) * 180 / Math.PI / 360
  const toDate = (jd) => new Date((jd - 2440587.5) * 86400000)
  return { sunrise: toDate(Jtransit - H), sunset: toDate(Jtransit + H) }
}

const fmtTime = (d) =>
  d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Phnom_Penh' })

export const sunFor = (p) => {
  const s = sunTimes(p.lat, p.lon)
  return s ? { sunrise: fmtTime(s.sunrise), sunset: fmtTime(s.sunset) } : null
}
