// Small helpers for the comments under a gallery moment.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

// "baru saja" · "5 menit lalu" · "3 jam lalu" · "kemarin" · "4 hari lalu" · "12 Nov 2026"
export function commentTimeAgo(iso, nowMs = Date.now()) {
  const at = new Date(iso).getTime()
  if (!Number.isFinite(at)) return ''
  const diff = Math.max(0, nowMs - at)
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'baru saja'
  if (min < 60) return `${min} menit lalu`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'kemarin'
  if (days < 7) return `${days} hari lalu`
  const d = new Date(at + 7 * 3600 * 1000) // WIB
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

// the first letter of the name for the round avatar ("Ustadz Riski" -> "R": titles skipped)
export function commentInitial(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  const titles = /^(ustadz|ustadzah|ust\.?|bapak|pak|ibu|bu|bunda|ayah|admin|wali)$/i
  const word = words.find((w) => !titles.test(w)) || words[0] || '?'
  return word.charAt(0).toUpperCase()
}
