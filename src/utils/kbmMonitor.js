// Display helpers for the admin KBM monitor. Pure, so they can be tested without a browser.

export const STATE_META = {
  complete: { label: 'Lengkap', symbol: '✓', tone: 'ok' },
  incomplete: { label: 'KBM belum lengkap', symbol: '◐', tone: 'warn' },
  not_created: { label: 'KBM belum dibuat', symbol: '!', tone: 'alert' },
  no_attendance: { label: 'Belum absen', symbol: '?', tone: 'muted' },
  leave: { label: 'Izin / sakit', symbol: '–', tone: 'leave' },
  before_join: { label: 'Belum terdaftar', symbol: '', tone: 'none' },
}

export const ISSUE_STATES = ['incomplete', 'not_created', 'no_attendance']

const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const DAY_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const parts = (date) => {
  const [y, m, d] = String(date).split('-').map(Number)
  return { y, m, d, weekday: new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() }
}

export const dayShort = (date) => DAY_SHORT[parts(date).weekday]
export const dayNumber = (date) => parts(date).d
export const longDate = (date) => {
  const p = parts(date)
  return `${DAY_LONG[p.weekday]}, ${p.d} ${MONTHS[p.m - 1]}`
}
export const monthTitle = (period) => {
  const [y, m] = String(period || '').split('-').map(Number)
  return m ? `${MONTHS[m - 1]} ${y}` : ''
}

// Weekday columns for the board (weekends are never teaching days, so they are left out to save width).
export const boardColumns = (days = []) => days.filter((d) => d.kind !== 'weekend')

export function cellInfo(guru, day) {
  if (day.kind === 'holiday') return { state: 'holiday', label: `Libur: ${day.holidayName || 'Libur'}`, symbol: '', tone: 'off' }
  if (day.kind === 'future') return { state: 'future', label: 'Belum terjadi', symbol: '', tone: 'off' }
  const cell = guru.cells?.[day.date]
  if (!cell) return { state: 'none', label: '', symbol: '', tone: 'none' }
  const meta = STATE_META[cell.state] || STATE_META.before_join
  let label = meta.label
  if (cell.state === 'incomplete') {
    const missing = [...new Set(cell.sessions.filter((s) => !s.complete).flatMap((s) => s.missing))]
    if (missing.length) label = `KBM belum lengkap (${missing.join(', ')} belum diisi)`
  }
  if (cell.state === 'leave' && cell.attendance) label = `Tercatat ${cell.attendance.replace('_', ' ')}`
  return { state: cell.state, label, symbol: meta.symbol, tone: meta.tone }
}

// Days that need follow-up, newest first.
export function issuesOf(guru) {
  return Object.entries(guru.cells || {})
    .filter(([, cell]) => ISSUE_STATES.includes(cell.state))
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, cell]) => ({ date, ...cell }))
}

export function filterGurus(gurus = [], { search = '', onlyIssues = false } = {}) {
  const q = search.trim().toLowerCase()
  return gurus.filter((g) => (!q || g.name.toLowerCase().includes(q)) && (!onlyIssues || g.needsAction > 0))
}

export function issueChips(counts = {}) {
  return [
    { key: 'incomplete', tone: 'warn', text: `${counts.incomplete} belum lengkap` },
    { key: 'not_created', tone: 'alert', text: `${counts.not_created} KBM belum dibuat` },
    { key: 'no_attendance', tone: 'muted', text: `${counts.no_attendance} belum absen` },
  ].filter((chip) => counts[chip.key] > 0)
}
