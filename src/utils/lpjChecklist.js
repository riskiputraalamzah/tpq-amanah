// Teacher's LPJ checklist (dashboard card): gaps grouped per month, each with a link straight to that month.
// Pure, so it can be tested without a browser.

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// ["2026-07-13", "2026-07-14", "2026-08-03"] -> [{ period: "2026-07", label: "Juli", count: 2, first: "2026-07-13" }, ...]
// The year is added to the label only when the dates span more than one year.
export function groupByMonth(dates = []) {
  const sorted = [...new Set(dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort()
  const years = new Set(sorted.map((d) => d.slice(0, 4)))
  const groups = new Map()
  for (const date of sorted) {
    const period = date.slice(0, 7)
    if (!groups.has(period)) {
      const [year, month] = period.split('-').map(Number)
      groups.set(period, { period, label: years.size > 1 ? `${MONTHS[month - 1]} ${year}` : MONTHS[month - 1], count: 0, first: date })
    }
    groups.get(period).count += 1
  }
  return [...groups.values()]
}

// Days with KBM to create or complete (one entry per day, even with two jilid on it).
export function kbmGapDates(gaps) {
  if (!gaps) return []
  return [...new Set([...(gaps.missingKbm || []), ...(gaps.incompleteKbm || []).map((i) => i.date)])].sort()
}

export const kbmLink = (date) => `/dashboard/kbm?date=${date}`
export const attendanceLink = (period) => `/dashboard/attendance?month=${period}`
