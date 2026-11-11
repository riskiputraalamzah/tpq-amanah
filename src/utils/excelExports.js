// Workbook builders for the Excel exports. Each takes the exceljs library as an argument.
import { COLORS, addTableSheet, createWorkbook, dateStamp, timeStamp } from './excel.js'
import { STATE_META, boardColumns, cellInfo, dayNumber, dayShort, issuesOf, longDate, monthTitle } from './kbmMonitor.js'

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const monthDatesOf = (period) => {
  const [year, month] = String(period).split('-').map(Number)
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return Array.from({ length: last }, (_, i) => `${period}-${String(i + 1).padStart(2, '0')}`)
}
const weekdayOf = (date) => new Date(`${date}T12:00:00Z`).getUTCDay()
const toExcelDate = (date) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
const plainWeekday = (date) => longDate(date).split(',')[0]

/* ------------------------------------------------------------------ Kelola Santri */

export const santriFilename = ({ filtered = false, date = new Date() } = {}) =>
  `Daftar-Santri-${dateStamp(date)}${filtered ? '-filter' : ''}.xlsx`

// rows: [{ nomorInduk, name, level, status }] already filtered and sorted like the table on screen.
export function buildSantriWorkbook(ExcelJS, { rows, exportedAt = new Date() }) {
  const workbook = createWorkbook(ExcelJS, { subject: 'Daftar Santri TPQ AMANAH', createdAt: exportedAt })
  addTableSheet(workbook, 'Daftar Santri', {
    columns: [
      { header: 'No', width: 6, align: 'center' },
      // Nomor induk is an identifier, not a quantity: always text, so Excel never turns it into 4,11E+16.
      { header: 'No. Induk', width: 24, text: true },
      { header: 'Nama', width: 34 },
      { header: 'Jilid / Marhalah', width: 18 },
      { header: 'Status', width: 12, align: 'center' },
    ],
    rows: rows.map((row, index) => [index + 1, row.nomorInduk || 'Belum ada', row.name, row.level, row.status]),
    landscape: false,
  })
  return workbook
}

/* ------------------------------------------------------------------ Monitor KBM */

export const monitorFilename = ({ period, filtered = false } = {}) => `Monitor-KBM-${period}${filtered ? '-filter' : ''}.xlsx`

// Symbols are plain characters every font has; the legend under the board explains them.
const BOARD_SYMBOL = { complete: '✓', incomplete: '½', not_created: '!', no_attendance: '?', leave: '–' }
const BOARD_FILL = { complete: COLORS.ok, incomplete: COLORS.warn, not_created: COLORS.alert, leave: COLORS.muted, holiday: COLORS.off }

const boardCell = (guru, day) => {
  const info = cellInfo(guru, day)
  if (info.state === 'holiday') return { v: '', fill: BOARD_FILL.holiday, align: 'center' }
  if (!BOARD_SYMBOL[info.state]) return { v: '', align: 'center' }
  return { v: BOARD_SYMBOL[info.state], fill: BOARD_FILL[info.state], bold: true, align: 'center' }
}

const issueNote = (item) => {
  if (item.state === 'incomplete') {
    return item.sessions
      .filter((s) => !s.complete)
      .map((s) => `${s.slot} ${s.level}: ${s.missing.join(' & ')} belum diisi`)
      .join('; ')
  }
  if (item.state === 'not_created') return 'Hadir, tapi belum membuat KBM'
  return 'Belum ada absen kehadiran guru'
}

// data: the /kbm-monitor response; gurus: the teachers to export (already filtered like the board on screen).
export function buildKbmMonitorWorkbook(ExcelJS, { data, gurus, filterNote = '', exportedAt = new Date() }) {
  const workbook = createWorkbook(ExcelJS, { subject: `Monitor KBM ${monthTitle(data.period)}`, createdAt: exportedAt })
  const sum = (key) => gurus.reduce((total, g) => total + g.counts[key], 0)
  const counted = gurus.reduce((total, g) => total + g.counted, 0)
  const percent = counted ? Math.round((sum('complete') / counted) * 100) : 0

  addTableSheet(workbook, 'Ringkasan', {
    title: `Monitor KBM - ${monthTitle(data.period)}`,
    lines: [
      `Diekspor ${timeStamp(exportedAt)} | ${gurus.length} guru | ${data.summary.teachingDays} hari mengajar${filterNote ? ` | ${filterNote}` : ''}`,
      `Lengkap ${sum('complete')} dari ${counted} hari (${percent}%) | belum lengkap ${sum('incomplete')} | KBM belum dibuat ${sum('not_created')} | belum absen ${sum('no_attendance')} | izin/sakit ${sum('leave')}`,
      'Lengkap = hadir, KBM dibuat, absen santri terisi, dan jurnal terisi.',
    ],
    columns: [
      { header: 'Guru', width: 28 },
      { header: 'Hari dihitung', width: 12, align: 'center' },
      { header: 'Lengkap', width: 10, align: 'center' },
      { header: 'Belum lengkap', width: 14, align: 'center' },
      { header: 'KBM belum dibuat', width: 17, align: 'center' },
      { header: 'Belum absen', width: 13, align: 'center' },
      { header: 'Izin / sakit', width: 12, align: 'center' },
      { header: '% Lengkap', width: 11, align: 'center', numFmt: '0%' },
      { header: 'KBM terakhir', width: 20, align: 'center' },
    ],
    rows: gurus.map((g) => [
      g.name,
      g.counted,
      g.counts.complete,
      g.counts.incomplete ? { v: g.counts.incomplete, fill: COLORS.warn, align: 'center' } : g.counts.incomplete,
      g.counts.not_created ? { v: g.counts.not_created, fill: COLORS.alert, align: 'center' } : g.counts.not_created,
      g.counts.no_attendance ? { v: g.counts.no_attendance, fill: COLORS.muted, align: 'center' } : g.counts.no_attendance,
      g.counts.leave,
      g.percent === null ? '-' : g.percent / 100,
      g.lastKbm ? longDate(g.lastKbm) : '-',
    ]),
    freezeColumns: 1,
    zebra: false,
  })

  const columns = boardColumns(data.days)
  const board = addTableSheet(workbook, 'Papan', {
    columns: [
      { header: 'Guru', width: 26, align: 'left' },
      ...columns.map((day) => ({ header: `${dayShort(day.date)} ${dayNumber(day.date)}`, width: 6.5, align: 'center' })),
      { header: 'Lengkap', width: 10, align: 'center' },
      { header: 'Perlu', width: 8, align: 'center' },
    ],
    rows: gurus.map((g) => [
      g.name,
      ...columns.map((day) => boardCell(g, day)),
      `${g.counts.complete}/${g.counted}`,
      g.needsAction ? { v: g.needsAction, fill: COLORS.alert, bold: true, align: 'center' } : 0,
    ]),
    freezeColumns: 1,
    zebra: false,
  })
  const legend = [
    ['✓  Lengkap', COLORS.ok],
    ['½  KBM belum lengkap', COLORS.warn],
    ['!  KBM belum dibuat', COLORS.alert],
    ['?  Belum absen', null],
    ['–  Izin / sakit', COLORS.muted],
    ['    Libur', COLORS.off],
  ]
  let row = board.lastDataRow + 2
  board.sheet.getCell(row, 1).value = 'Keterangan'
  board.sheet.getCell(row, 1).font = { bold: true }
  for (const [text, fill] of legend) {
    row += 1
    const cell = board.sheet.getCell(row, 1)
    cell.value = text
    if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
  }

  const followUp = []
  for (const g of gurus) {
    for (const item of issuesOf(g).reverse()) {
      followUp.push([g.name, toExcelDate(item.date), plainWeekday(item.date), STATE_META[item.state].label, issueNote(item)])
    }
  }
  addTableSheet(workbook, 'Perlu Tindak Lanjut', {
    columns: [
      { header: 'Guru', width: 26 },
      { header: 'Tanggal', width: 13, align: 'center', numFmt: 'dd/mm/yyyy' },
      { header: 'Hari', width: 11, align: 'center' },
      { header: 'Status', width: 20 },
      { header: 'Keterangan', width: 70, wrap: true },
    ],
    rows: followUp.length ? followUp : [['-', '-', '-', 'Semua lengkap', 'Tidak ada yang perlu ditindaklanjuti']],
    freezeColumns: 1,
  })

  return workbook
}

/* ------------------------------------------------------------------ Rekap Absensi Guru */

export const attendanceFilename = ({ period } = {}) => `Rekap-Absensi-Guru-${period}.xlsx`

const ATTENDANCE_CODES = {
  hadir: { code: 'H', fill: COLORS.ok },
  izin: { code: 'I', fill: COLORS.info },
  sakit: { code: 'S', fill: COLORS.warn },
  alfa: { code: 'A', fill: COLORS.danger },
  alpa: { code: 'A', fill: COLORS.danger },
  tidak_hadir: { code: 'TH', fill: COLORS.danger },
}

// teachers: [{ id, name, hadirCount, tidakHadirCount }]  records: [{ guruId, date: 'YYYY-MM-DD', status }]
// holidays: [{ date: 'YYYY-MM-DD', name }]   (national + custom, as shown on the page)
export function buildAttendanceWorkbook(ExcelJS, { period, teachers, records, holidays = [], dailyRate = 10000, exportedAt = new Date() }) {
  const [year, month] = period.split('-').map(Number)
  const monthLabel = `${MONTHS[month - 1]} ${year}`
  const dates = monthDatesOf(period)
  const holidayByDate = new Map(holidays.map((h) => [h.date, h.name]))
  const isWeekend = (date) => [0, 6].includes(weekdayOf(date))
  const effectiveDays = dates.filter((d) => !isWeekend(d) && !holidayByDate.has(d)).length
  const workbook = createWorkbook(ExcelJS, { subject: `Rekap Absensi Guru ${monthLabel}`, createdAt: exportedAt })

  const totalHadir = teachers.reduce((total, t) => total + t.hadirCount, 0)
  const rekap = addTableSheet(workbook, 'Rekap', {
    title: 'LAPORAN ABSENSI GURU - TPQ AMANAH',
    lines: [`Periode: ${monthLabel}`, `Diekspor ${timeStamp(exportedAt)}`],
    columns: [
      { header: 'No', width: 6, align: 'center' },
      { header: 'Nama Guru', width: 32 },
      { header: 'Hadir', width: 10, align: 'center' },
      { header: 'Izin / Tidak Hadir', width: 18, align: 'center' },
      { header: 'Gaji', width: 18, align: 'right', numFmt: '"Rp" #,##0' },
    ],
    rows: teachers.map((t, index) => [index + 1, t.name, t.hadirCount, t.tidakHadirCount, t.hadirCount * dailyRate]),
    filter: false,
    landscape: false,
  })

  const sheet = rekap.sheet
  let row = rekap.lastDataRow + 2
  const put = (label, value, numFmt) => {
    sheet.getCell(row, 2).value = label
    sheet.getCell(row, 2).font = { bold: true }
    const cell = sheet.getCell(row, 3)
    cell.value = value
    cell.alignment = { horizontal: 'left' }
    if (numFmt) cell.numFmt = numFmt
    row += 1
  }
  put('Total kehadiran', totalHadir)
  put('Total gaji', totalHadir * dailyRate, '"Rp" #,##0')
  put('Total hari efektif', `${effectiveDays} hari`)
  put('Potensi gaji maksimal per guru', effectiveDays * dailyRate, '"Rp" #,##0')
  if (holidayByDate.size > 0) {
    row += 1
    sheet.getCell(row, 2).value = 'Hari libur bulan ini'
    sheet.getCell(row, 2).font = { bold: true }
    row += 1
    for (const [date, name] of [...holidayByDate.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      sheet.getCell(row, 2).value = `${longDate(date)}`
      sheet.getCell(row, 3).value = name
      row += 1
    }
  }

  // One record per teacher per day; "hadir" wins when there are several.
  const byTeacherDay = new Map()
  for (const record of records) {
    const key = `${record.guruId}|${record.date}`
    const status = String(record.status || '').toLowerCase()
    if (!byTeacherDay.has(key) || status === 'hadir') byTeacherDay.set(key, status)
  }
  const cellFor = (teacher, date) => {
    if (isWeekend(date) || holidayByDate.has(date)) return { v: '', fill: COLORS.off, align: 'center' }
    const status = byTeacherDay.get(`${teacher.id}|${date}`)
    const code = status && (ATTENDANCE_CODES[status] || { code: status.slice(0, 2).toUpperCase(), fill: COLORS.muted })
    return code ? { v: code.code, fill: code.fill, bold: true, align: 'center' } : { v: '', align: 'center' }
  }
  const grid = addTableSheet(workbook, 'Per Tanggal', {
    columns: [
      { header: 'Guru', width: 26 },
      ...dates.map((d) => ({ header: `${dayShort(d)} ${Number(d.slice(8, 10))}`, width: 6.5, align: 'center' })),
      { header: 'Hadir', width: 8, align: 'center' },
      { header: 'Tidak hadir', width: 11, align: 'center' },
    ],
    rows: teachers.map((t) => [t.name, ...dates.map((d) => cellFor(t, d)), t.hadirCount, t.tidakHadirCount]),
    freezeColumns: 1,
    zebra: false,
  })
  const legend = [
    ['H  Hadir', COLORS.ok],
    ['I  Izin', COLORS.info],
    ['S  Sakit', COLORS.warn],
    ['A / TH  Alpa / tidak hadir', COLORS.danger],
    ['    Akhir pekan / libur', COLORS.off],
  ]
  let legendRow = grid.lastDataRow + 2
  grid.sheet.getCell(legendRow, 1).value = 'Keterangan'
  grid.sheet.getCell(legendRow, 1).font = { bold: true }
  for (const [text, fill] of legend) {
    legendRow += 1
    const cell = grid.sheet.getCell(legendRow, 1)
    cell.value = text
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
  }

  return workbook
}
