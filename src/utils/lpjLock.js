// Monthly LPJ lock, as the backend applies it (checkLjpLock): a month whose monthly LPJ is submitted or approved
// cannot change any more - no new KBM, no deletion, no student attendance or journal edits. Admin can reopen it.
// Pure, so it can be tested without a browser.

const LOCKED = ['submitted', 'approved']
const STATUS_TEXT = { submitted: 'Menunggu Persetujuan', approved: 'Disetujui' }

// The report that decides the month: a locked one if there is any, else the first.
export function pickMonthReport(list) {
  const reports = Array.isArray(list) ? list : []
  return reports.find((r) => LOCKED.includes(r?.status)) || reports[0] || null
}

export const isLockedStatus = (status) => LOCKED.includes(status)

export function lockMessage(status) {
  if (!isLockedStatus(status)) return ''
  return `LPJ bulanan periode ini berstatus ${STATUS_TEXT[status]}, jadi data KBM bulan ini terkunci dan hanya bisa dilihat. Hubungi admin bila perlu dikoreksi.`
}

// "YYYY-MM" in WIB of a session date as the API returns it (Firestore timestamp JSON, ISO string or Date).
export function sessionPeriod(date) {
  if (!date) return ''
  let d
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date.slice(0, 7)
    d = new Date(date)
  } else if (date._seconds !== undefined || date.seconds !== undefined) {
    d = new Date(Number(date._seconds ?? date.seconds) * 1000)
  } else {
    d = new Date(date)
  }
  if (Number.isNaN(d.getTime())) return ''
  return new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 7)
}
