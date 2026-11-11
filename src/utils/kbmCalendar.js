// States for the KBM date picker. Pure, so it can be tested without a browser.
//
//   filled   KBM for the chosen sesi + jilid already exists -> opens that KBM instead of selecting the date
//   needs    present (hadir) but no KBM at all that day -> should be filled (same list as the WA night recap)
//   partial  some KBM that day, but not this sesi + jilid (e.g. a second jilid in the same sesi) -> selectable
//   no-att   attendance not filled yet -> selectable, the form asks to check in first
//   absent   izin / sakit that day -> not selectable
//   off      weekend, holiday, future, or a month the teacher can no longer fill -> not selectable

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

export function dayState(day, { slotId, classId, minDate, maxDate, canFill = true } = {}) {
  if (!day) return { state: 'off', label: '' }
  if (day.kind === 'weekend') return { state: 'off', label: 'Akhir pekan' }
  if (day.kind === 'holiday') return { state: 'off', label: `Libur: ${day.holidayName || 'Libur'}` }
  if (day.kind === 'future' || (maxDate && day.date > maxDate)) return { state: 'off', label: 'Belum bisa diisi' }
  if (minDate && day.date < minDate) return { state: 'off', label: 'Di luar periode aktif' }

  const attendance = day.attendance ? String(day.attendance).toLowerCase() : null
  if (attendance && attendance !== 'hadir') {
    return { state: 'absent', label: `Tercatat ${ABSENT_LABEL[attendance] || attendance}` }
  }

  const sessions = Array.isArray(day.sessions) ? day.sessions : []
  if (slotId && classId) {
    const level = normalizeLevel(classId)
    const match = sessions.find((s) => s.sessionSlotId === slotId && normalizeLevel(s.levelId) === level)
    if (match) return { state: 'filled', label: 'KBM sesi & jilid ini sudah diisi', sessionId: match.id }
  }
  // Month closed for this teacher (outside the active period and not part of an LPJ): existing KBM can still be opened above.
  if (!canFill) return { state: 'off', label: 'Bulan ini sudah tidak bisa diisi' }
  if (sessions.length > 0) {
    return { state: 'partial', label: `Sudah ada ${sessions.length} KBM lain di tanggal ini`, count: sessions.length }
  }
  if (attendance === 'hadir') return { state: 'needs', label: 'Hadir, KBM belum diisi' }
  return { state: 'no-att', label: 'Belum absen kehadiran' }
}

export function buildCalendar(calendar, options = {}) {
  const days = Array.isArray(calendar?.days) ? calendar.days : []
  const firstWeekday = days.length ? days[0].weekday : 1
  const leadingBlanks = (firstWeekday + 6) % 7 // Monday first
  const canFill = calendar?.canFill !== false
  const cells = days.map((day) => {
    const info = dayState(day, { ...options, canFill })
    return {
      ...info,
      date: day.date,
      dayNumber: Number(day.date.slice(8, 10)),
      isToday: day.date === calendar.today,
      isSelected: day.date === options.selectedDate,
      selectable: ['needs', 'partial', 'no-att'].includes(info.state),
      openable: info.state === 'filled',
      ariaLabel: `${longDate(day.date)}. ${info.label}`,
    }
  })
  // Days the teacher was present but has no KBM yet - the same days the WA night recap lists.
  const needsDates = cells.filter((c) => c.state === 'needs').map((c) => c.date)
  const period = calendar?.period || ''
  return {
    leadingBlanks,
    cells,
    needsDates,
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
