// Waktu yang mudah dibaca, selalu dalam WIB (Asia/Jakarta).
//   timeAgo:      "barusan", "2 menit lalu", "3 jam lalu" (masih hari ini), lalu "19 Nov, 14.30" / "19 Nov 2025, 14.30"
//   dateTimeText: "19 Desember 2026 pukul 14.30 WIB" (batas waktu, mis. kode berlaku sampai)
// Menerima Date, string ISO, angka (ms), Firestore Timestamp ({ _seconds } / { seconds } / toDate()).

const TZ = 'Asia/Jakarta'

export function toDate(v) {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  if (typeof v?.toDate === 'function') return v.toDate()
  if (typeof v === 'object' && (v._seconds !== undefined || v.seconds !== undefined)) {
    return new Date(Number(v._seconds ?? v.seconds) * 1000)
  }
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export const timeOf = (v) => toDate(v)?.getTime() || 0

const dayKey = (d) => d.toLocaleDateString('en-CA', { timeZone: TZ }) // YYYY-MM-DD in WIB
const yearOf = (d) => dayKey(d).slice(0, 4)
export const clockText = (v) => {
  const d = toDate(v)
  return d ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }).replace(':', '.') : ''
}

// "19 Nov, 14.30" (tahun disebut bila beda dengan tahun ini)
export function shortDateTime(v, now = new Date()) {
  const d = toDate(v)
  if (!d) return ''
  const opts = { day: 'numeric', month: 'short', timeZone: TZ }
  if (yearOf(d) !== yearOf(now)) opts.year = 'numeric'
  return `${d.toLocaleDateString('id-ID', opts)}, ${clockText(d)}`
}

export function timeAgo(v, now = new Date()) {
  const d = toDate(v)
  if (!d) return ''
  const diff = now.getTime() - d.getTime()
  // in the future (a clock a little ahead): no "x lalu"
  if (diff < -60 * 1000) return shortDateTime(d, now)
  if (diff < 60 * 1000) return 'barusan'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} menit lalu`
  if (dayKey(d) === dayKey(now)) return `${Math.floor(minutes / 60)} jam lalu`
  return shortDateTime(d, now)
}

// "19 Desember 2026 pukul 14.30 WIB"
export function dateTimeText(v) {
  const d = toDate(v)
  if (!d) return ''
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ })
  return `${date} pukul ${clockText(d)} WIB`
}

// full date and time for a tooltip: "Kamis, 19 November 2026 pukul 14.30 WIB"
export function fullDateTime(v) {
  const d = toDate(v)
  if (!d) return ''
  const date = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ })
  return `${date} pukul ${clockText(d)} WIB`
}
