// States for the KBM calendar. Pure, so it can be tested without a browser.
// A day's state depends only on that day (attendance + the KBM already saved), never on a sesi/jilid selection:
//
//   done        KBM saved that day and every one of them is complete (student attendance + journal) -> opens the day
//   incomplete  KBM saved that day, but student attendance or journal is still missing on at least one -> opens the day
//   needs       present (hadir) but no KBM yet -> fill it (same list as the WA night recap)
//   no-att      attendance not filled yet -> the workspace asks to check in first
//   absent      izin / sakit that day -> not selectable
//   off         weekend, holiday, future, or a month the teacher can no longer fill -> not selectable

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const ABSENT_LABEL = { izin: 'izin', sakit: 'sakit', alfa: 'alfa', alpa: 'alfa', tidak_hadir: 'tidak hadir' }

export const normalizeLevel = (value) => {
  const level = String(value ?? '').trim().toLowerCase()
  return ['7', '8', '9', 'marhalah'].includes(level) ? '7' : level
}

export const monthTitle = (period) => {
  const [year, month] = String(period || '').split('-').map(Number)
  return month ? `${MONTHS[month - 1]} ${year}` : ''
}

// "2026-07" + 1 -> "2026-08"; used by the month arrows of the picker.
export const shiftPeriod = (period, delta) => {
  const [year, month] = String(period || '').split('-').map(Number)
  if (!year || !month) return ''
  const index = year * 12 + (month - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

export const longDate = (date) => {
  const [year, month, day] = String(date).split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
  return `${DAYS[weekday]}, ${day} ${MONTHS[month - 1]} ${year}`
}

// A KBM counts as complete when the server says so (shared rule: student attendance filled + journal written).
const isComplete = (session) => session?.complete !== false

export function dayState(day, { minDate, maxDate, canFill = true } = {}) {
  if (!day) return { state: 'off', label: '' }
  if (day.kind === 'weekend') return { state: 'off', label: 'Akhir pekan' }
  if (day.kind === 'holiday') return { state: 'off', label: `Libur: ${day.holidayName || 'Libur'}` }
  if (day.kind === 'future' || (maxDate && day.date > maxDate)) return { state: 'off', label: 'Belum bisa diisi' }
  if (minDate && day.date < minDate) return { state: 'off', label: 'Di luar periode aktif' }

  const sessions = Array.isArray(day.sessions) ? day.sessions : []
  // KBM already saved: always openable (also in a closed or locked month, to view them)
  if (sessions.length > 0) {
    const open = sessions.filter((s) => !isComplete(s)).length
    const count = sessions.length
    if (open === 0) {
      return { state: 'done', label: count > 1 ? `${count} KBM, semua lengkap` : 'KBM lengkap', count }
    }
    return { state: 'incomplete', label: `${count} KBM, ${open} belum lengkap (absen santri / jurnal)`, count }
  }

  const attendance = day.attendance ? String(day.attendance).toLowerCase() : null
  if (attendance && attendance !== 'hadir') {
    return { state: 'absent', label: `Tercatat ${ABSENT_LABEL[attendance] || attendance}` }
  }
  // Month closed for this teacher (outside the active period and not part of an LPJ), or locked by the monthly LPJ.
  if (!canFill) return { state: 'off', label: 'Bulan ini sudah tidak bisa diisi' }
  if (attendance === 'hadir') return { state: 'needs', label: 'Hadir, KBM belum diisi' }
  return { state: 'no-att', label: 'Belum absen kehadiran' }
}

export function buildCalendar(calendar, options = {}) {
  const days = Array.isArray(calendar?.days) ? calendar.days : []
  const firstWeekday = days.length ? days[0].weekday : 1
  const leadingBlanks = (firstWeekday + 6) % 7 // Monday first
  // locked: the month's monthly LPJ is submitted/approved, so nothing can be added (existing KBM still open to view)
  const canFill = calendar?.canFill !== false && !options.locked
  const cells = days.map((day) => {
    const info = dayState(day, { ...options, canFill })
    return {
      ...info,
      date: day.date,
      dayNumber: Number(day.date.slice(8, 10)),
      isToday: day.date === calendar.today,
      isSelected: day.date === options.selectedDate,
      // fill: go and write the KBM of that day; open: show the KBM already saved that day
      selectable: ['needs', 'no-att'].includes(info.state),
      openable: ['done', 'incomplete'].includes(info.state),
      ariaLabel: `${longDate(day.date)}. ${info.label}`,
    }
  })
  // Days the teacher was present but has no KBM yet - the same days the WA night recap lists.
  const needsDates = cells.filter((c) => c.state === 'needs').map((c) => c.date)
  // Days with KBM that still miss student attendance or the journal.
  const incompleteDates = cells.filter((c) => c.state === 'incomplete').map((c) => c.date)
  const period = calendar?.period || ''
  return {
    leadingBlanks,
    cells,
    needsDates,
    incompleteDates,
    title: monthTitle(period),
    period,
    canFill,
    // Month arrows: back to the first recorded month, forward to the current month.
    prevPeriod: period && calendar?.firstPeriod && period > calendar.firstPeriod ? shiftPeriod(period, -1) : '',
    nextPeriod: period && calendar?.today && period < calendar.today.slice(0, 7) ? shiftPeriod(period, 1) : '',
  }
}

export function findDay(calendar, date) {
  return (calendar?.days || []).find((d) => d.date === date) || null
}
