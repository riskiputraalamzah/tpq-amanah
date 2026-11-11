// LPJ Insentif Guru PDF, built in the admin's browser (no server size or time limits).
//
// Whole TPQ ("lembaga", the default), following the numbering of the official list of attachments:
//   Cover LPJ
//   1. SPTJM                  - one per receiving teacher, with a box for the 10.000 materai
//   2. Daftar Hadir Santri    - per teacher, per month and class (badal included)
//   3. Daftar Hadir Guru      - ONE recap for the TPQ: all receiving teachers x days, per month
//   4. Jurnal Mengajar        - per teacher: a cover plus the first 3 sheets from the start of the period,
//                               laid out like the paper "Buku Jurnal & Berita Acara"
// One teacher ("guru"): their cover, SPTJM, Daftar Hadir Santri and Jurnal Mengajar.
//
// Every page carries the kop surat; tables that run long continue on pages with the kop.
// The builder takes jsPDF, autoTable and the kop image as arguments, so it also runs in Node for the tests.

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const STUDENT_CODE = { hadir: 'H', izin: 'I', sakit: 'S', alfa: 'A', alpa: 'A' }
const TEACHER_CODE = { hadir: 'H', izin: 'I', sakit: 'S', alfa: 'A', alpa: 'A', tidak_hadir: 'A' }

const GREEN = [27, 94, 32]
const GREY_TEXT = [110, 110, 110]
const GREY_FILL = [235, 235, 235]
const KOP_RATIO = 261 / 1600
const KOP_WIDTH = 180
const KOP_HEIGHT = KOP_WIDTH * KOP_RATIO
const BLANK = '..............................'

// The paper journal sent with the LPJ is its cover plus the first three sheets.
export const JOURNAL_SHEETS = 3

const parts = (date) => {
  const [y, m, d] = String(date).split('-').map(Number)
  return { y, m, d, weekday: new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() }
}

// "10 Oktober 2026" (two-digit day, like the official SPTJM)
export function tanggalPanjang(date) {
  if (!date) return BLANK
  const p = parts(date)
  if (!p.m) return BLANK
  return `${String(p.d).padStart(2, '0')} ${MONTHS[p.m - 1]} ${p.y}`
}

const hari = (date) => DAYS[parts(date).weekday]

const SECTIONS = {
  lembaga: [
    'Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) tiap guru penerima',
    'Daftar Hadir Santri tiap guru penerima',
    'Daftar Hadir Guru',
    'Jurnal Mengajar tiap guru penerima',
  ],
  guru: ['Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)', 'Daftar Hadir Santri', 'Jurnal Mengajar'],
}

/* ---------------------------------------------------------------- page helpers */

function pageSize(doc) {
  return { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() }
}

// Every page goes through here (new pages and table continuation pages), so it also records the footer label.
function drawKop(ctx) {
  const { doc, kop } = ctx
  const { w } = pageSize(doc)
  ctx.pageLabels[doc.getCurrentPageInfo().pageNumber] = ctx.label
  const x = (w - KOP_WIDTH) / 2
  const y = 8
  if (kop) {
    doc.addImage(kop, 'JPEG', x, y, KOP_WIDTH, KOP_HEIGHT, 'kop-surat', 'FAST')
  } else {
    doc.setFont('times', 'bold')
    doc.setFontSize(14)
    doc.text('TAMAN PENDIDIKAN AL-QUR’AN "AMANAH"', w / 2, y + 12, { align: 'center' })
    doc.setLineWidth(0.6)
    doc.line(x, y + KOP_HEIGHT - 2, x + KOP_WIDTH, y + KOP_HEIGHT - 2)
  }
  return y + KOP_HEIGHT + 6
}

// The very first page of the PDF already exists (portrait), so the first cover uses it.
function startPage(ctx, orientation = 'portrait') {
  if (ctx.firstPageFree && orientation === 'portrait') {
    ctx.firstPageFree = false
  } else {
    ctx.doc.addPage('a4', orientation)
    ctx.firstPageFree = false
  }
  return drawKop(ctx)
}

function ensureSpace(ctx, y, needed, orientation) {
  const { h } = pageSize(ctx.doc)
  return y + needed > h - 13 ? startPage(ctx, orientation) : y
}

function centered(doc, text, y, { size = 12, style = 'bold', font = 'helvetica' } = {}) {
  doc.setFont(font, style)
  doc.setFontSize(size)
  doc.text(text, pageSize(doc).w / 2, y, { align: 'center' })
}

function titleBlock(ctx, y, title, lines) {
  const { doc } = ctx
  centered(doc, title, y, { size: 13 })
  let next = y + 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  for (const line of lines) {
    doc.text(line, pageSize(doc).w / 2, next, { align: 'center' })
    next += 5
  }
  return next + 2
}

const tableTheme = (ctx, topY) => ({
  theme: 'grid',
  startY: topY,
  margin: { top: 8 + KOP_HEIGHT + 8, left: 12, right: 12, bottom: 16 },
  styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.6, lineColor: [200, 200, 200], lineWidth: 0.2, textColor: [33, 33, 33], valign: 'middle' },
  headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', halign: 'center' },
  // autoTable keeps the orientation for continuation pages; they get the kop too
  didDrawPage: (data) => {
    if (data.pageNumber > 1) drawKop(ctx)
  },
})

function signatures(ctx, y, { orientation, left, right }) {
  const { doc } = ctx
  const { w } = pageSize(doc)
  y = ensureSpace(ctx, y, 36, orientation)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const colLeft = 25
  const colRight = w - 85
  const block = (x, lines, name, sub) => {
    let yy = y
    for (const line of lines) {
      doc.text(line, x, yy)
      yy += 5
    }
    yy += 18
    doc.setFont('helvetica', 'bold')
    doc.text(name || BLANK, x, yy)
    doc.setFont('helvetica', 'normal')
    if (sub) doc.text(sub, x, yy + 5)
  }
  if (left) block(colLeft, left.lines, left.name, left.sub)
  if (right) block(colRight, right.lines, right.name, right.sub)
  return y + 36
}

// Label/value rows in a rounded green box (covers). Returns the y below the box.
function infoBox(doc, y, rows, { boxX = 30, labelW = 46 } = {}) {
  const { w } = pageSize(doc)
  const boxW = w - 2 * boxX
  const valueX = boxX + labelW
  doc.setFont('times', 'normal')
  doc.setFontSize(12)
  const wrapped = rows.map(([label, value]) => [label, doc.splitTextToSize(String(value), boxW - labelW - 8)])
  const boxH = wrapped.reduce((total, [, lines]) => total + lines.length * 5.5 + 2, 0) + 10
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.5)
  doc.roundedRect(boxX, y - 7, boxW, boxH, 3, 3)
  for (const [label, lines] of wrapped) {
    doc.setFont('times', 'normal')
    doc.text(label, boxX + 8, y)
    doc.text(':', valueX - 4, y)
    doc.setFont('times', 'bold')
    doc.text(lines, valueX, y)
    y += lines.length * 5.5 + 2
  }
  doc.setDrawColor(0, 0, 0)
  return y - 7 + 10
}

function coverFooter(doc, d) {
  const { h } = pageSize(doc)
  centered(doc, String(d.tpq.name).toUpperCase(), h - 42, { size: 14, font: 'times' })
  centered(doc, 'SAWOTRATAP – GEDANGAN – SIDOARJO', h - 35, { size: 12, font: 'times', style: 'normal' })
  centered(doc, String(d.batch.endPeriod).slice(0, 4), h - 28, { size: 12, font: 'times', style: 'normal' })
}

function contentsList(doc, y, items, x = 30) {
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.text('Isi Laporan:', x, y)
  doc.setFont('times', 'normal')
  items.forEach((item, index) => {
    doc.text(`${index + 1}.  ${item}`, x + 4, (y += 7))
  })
  return y
}

/* ---------------------------------------------------------------- Cover */

function coverTitle(doc, y, d) {
  centered(doc, 'LAPORAN PERTANGGUNGJAWABAN', y, { size: 20, font: 'times' })
  centered(doc, '(LPJ)', (y += 9), { size: 20, font: 'times' })
  centered(doc, 'INSENTIF GURU TAMAN PENDIDIKAN AL-QUR’AN (TPQ)', (y += 12), { size: 14, font: 'times' })
  centered(doc, `Periode ${d.batch.rangeLabel}`, (y += 9), { size: 13, font: 'times', style: 'normal' })
  return y
}

// Whole TPQ: institution data, the receiving teachers and the contents.
function institutionCover(ctx, documents) {
  const { doc } = ctx
  const d = documents[0]
  let y = coverTitle(doc, startPage(ctx, 'portrait') + 22, d) + 20
  y = infoBox(doc, y, [
    ['Nama TPQ', d.tpq.name],
    ['NSPQ', d.tpq.nsq],
    ['Alamat TPQ', d.tpq.address || BLANK],
    ['Kepala TPQ', d.tpq.headName || BLANK],
  ])

  y += 10
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.text(`Guru Penerima Insentif (${documents.length} orang):`, 30, y)
  doc.setFont('times', 'normal')
  // Two columns when the list is long, so it never runs into the contents or the footer.
  const perColumn = documents.length > 6 ? Math.ceil(documents.length / 2) : documents.length
  const colX = [34, pageSize(doc).w / 2 + 4]
  documents.forEach((x, index) => {
    const col = Math.floor(index / perColumn)
    const row = index % perColumn
    doc.text(doc.splitTextToSize(`${index + 1}.  ${x.guru.name}`, col ? 70 : pageSize(doc).w / 2 - 38)[0], colX[col], y + 6.5 * (row + 1))
  })
  y += 6.5 * perColumn

  contentsList(doc, y + 12, SECTIONS.lembaga)
  coverFooter(doc, d)
}

// One teacher: their own data.
function teacherCover(ctx, d) {
  const { doc } = ctx
  let y = coverTitle(doc, startPage(ctx, 'portrait') + 28, d) + 22
  y = infoBox(doc, y, [
    ['Nama Guru', d.guru.name],
    ['NIK', d.guru.nik || BLANK],
    ['Jabatan', d.guru.position],
    ['Nama TPQ', d.tpq.name],
    ['NSPQ', d.tpq.nsq],
    ['Alamat TPQ', d.tpq.address || BLANK],
  ])
  contentsList(doc, y + 12, SECTIONS.guru)
  coverFooter(doc, d)
}

/* ---------------------------------------------------------------- 1. SPTJM */

const SPTJM_STATEMENTS = [
  'Saya merupakan Guru/Pengajar Taman Pendidikan Al-Qur’an (TPQ) yang masih aktif melaksanakan kegiatan pembelajaran pada TPQ sebagaimana tersebut di atas.',
  'Data dan dokumen yang saya sampaikan sebagai persyaratan untuk memperoleh Insentif Guru TPQ dari Pemerintah Kabupaten Sidoarjo adalah benar, lengkap, dan dapat dipertanggungjawabkan.',
  'Apabila di kemudian hari terdapat ketidaksesuaian atau ketidakbenaran data dan/atau dokumen yang saya sampaikan, saya bersedia bertanggung jawab sepenuhnya dan menerima segala konsekuensi sesuai dengan ketentuan peraturan perundang-undangan.',
  'Apabila terdapat kelebihan pembayaran atau kekeliruan dalam pencairan insentif yang disebabkan oleh kesalahan data yang saya sampaikan, saya bersedia mengembalikan kelebihan pembayaran tersebut sesuai dengan ketentuan yang berlaku.',
  'Insentif yang saya terima akan digunakan sebagaimana mestinya dan sesuai dengan tujuan pemberian insentif Guru TPQ.',
]
const SPTJM_CLOSING =
  'Demikian Surat Pernyataan Tanggung Jawab Mutlak ini saya buat dengan sebenar-benarnya, penuh kesadaran dan tanpa paksaan dari pihak manapun, untuk dipergunakan sebagaimana mestinya.'

function justified(doc, text, x, y, width, lineHeight) {
  const lines = doc.splitTextToSize(text, width)
  lines.forEach((line, index) => {
    const last = index === lines.length - 1
    doc.text(line, x, y + index * lineHeight, last ? undefined : { align: 'justify', maxWidth: width })
  })
  return y + lines.length * lineHeight
}

// Dashed box where the 10.000 materai is stuck before signing across it.
function materaiBox(doc, x, y) {
  const w = 30
  const h = 19
  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([1.5, 1.2], 0)
  doc.rect(x, y, w, h)
  doc.setLineDashPattern([], 0)
  doc.setDrawColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GREY_TEXT)
  doc.text('Materai', x + w / 2, y + h / 2 - 1, { align: 'center' })
  doc.text('10.000', x + w / 2, y + h / 2 + 3, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

function sptjmPage(ctx, d) {
  const { doc } = ctx
  const { w } = pageSize(doc)
  const left = 25
  const width = w - left - 20
  const lh = 5.6
  let y = startPage(ctx, 'portrait') + 2
  centered(doc, 'SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)', y, { size: 12, font: 'times' })
  centered(doc, 'PENERIMA INSENTIF GURU TAMAN PENDIDIKAN AL-QUR’AN (TPQ)', (y += 5.5), { size: 12, font: 'times' })

  doc.setFont('times', 'normal')
  doc.setFontSize(12)
  y += 11
  doc.text('Yang bertanda tangan di bawah ini:', left, y)
  y += 8
  const birth = d.guru.birthPlace || d.guru.birthDate ? `${d.guru.birthPlace || BLANK}, ${tanggalPanjang(d.guru.birthDate)}` : BLANK
  const identity = [
    ['Nama', d.guru.name],
    ['NIK', d.guru.nik || BLANK],
    ['Tempat/ Tanggal Lahir', birth],
    ['Alamat', d.guru.address || BLANK],
    ['Nama TPQ', d.tpq.name],
    ['Alamat TPQ', d.tpq.address || BLANK],
    ['Jabatan', d.guru.position],
  ]
  const valueX = left + 50
  for (const [label, value] of identity) {
    const lines = doc.splitTextToSize(String(value), w - valueX - 20)
    doc.text(label, left, y)
    doc.text(':', valueX - 3, y)
    doc.text(lines, valueX, y)
    y += lines.length * lh
  }

  y += 6
  doc.text('Dengan ini menyatakan dengan sebenar-benarnya bahwa:', left, y)
  y += 7
  SPTJM_STATEMENTS.forEach((statement, index) => {
    doc.text(`${index + 1}.`, left + 3, y)
    y = justified(doc, statement, left + 10, y, width - 10, lh) + 0.6
  })
  y += 5
  y = justified(doc, SPTJM_CLOSING, left, y, width, lh)

  y += 12
  const signX = w - 85
  doc.setFont('times', 'normal')
  doc.setFontSize(12)
  doc.text(`Sidoarjo, ${tanggalPanjang(d.batch.docDate)}`, signX, y)
  doc.text('Yang membuat pernyataan,', signX, y + lh)
  materaiBox(doc, signX, y + lh + 4)
  doc.setFont('times', 'normal')
  doc.setFontSize(12)
  doc.text(d.guru.name, signX, y + lh + 32)
  doc.text(`NIK. ${d.guru.nik || BLANK}`, signX, y + 2 * lh + 32)
}

/* ---------------------------------------------------------------- 2. Daftar Hadir Santri */

// Students x sessions for one class in one month. Exported for the tests.
export function studentMatrix(month) {
  const groups = new Map()
  for (const day of month.days) {
    for (const session of day.sessions || []) {
      if (!session.students?.length) continue
      const key = `${session.levelKey}|${session.level}`
      if (!groups.has(key)) groups.set(key, { level: session.level, levelKey: session.levelKey, sessions: [] })
      groups.get(key).sessions.push(session)
    }
  }
  return [...groups.values()]
    .sort((a, b) => String(a.levelKey).localeCompare(String(b.levelKey), 'id', { numeric: true }))
    .map((group) => {
      const sessions = group.sessions.sort((a, b) => a.date.localeCompare(b.date) || a.slotId.localeCompare(b.slotId))
      const sameDay = new Map()
      sessions.forEach((s) => sameDay.set(s.date, (sameDay.get(s.date) || 0) + 1))
      const columns = sessions.map((s) => {
        const p = parts(s.date)
        const slotMark = sameDay.get(s.date) > 1 ? (String(s.slotId).includes('2') ? ' M' : ' S') : ''
        return `${DAYS_SHORT[p.weekday]}\n${p.d}${slotMark}`
      })
      const students = new Map()
      sessions.forEach((s, col) => {
        for (const st of s.students) {
          const id = st.santriId || st.name
          if (!students.has(id)) students.set(id, { name: st.name, codes: Array(sessions.length).fill('') })
          students.get(id).name = st.name || students.get(id).name
          students.get(id).codes[col] = STUDENT_CODE[st.status] || '-'
        }
      })
      const rows = [...students.values()]
        .sort((a, b) => a.name.localeCompare(b.name, 'id'))
        .map((st) => {
          const count = (code) => st.codes.filter((c) => c === code).length
          return { name: st.name, codes: st.codes, totals: [count('H'), count('I'), count('S'), count('A')] }
        })
      return { level: group.level, columns, rows }
    })
}

function studentAttendance(ctx, d) {
  const { doc, autoTable } = ctx
  for (const month of d.months) {
    const groups = studentMatrix(month)
    if (groups.length === 0) {
      const y = startPage(ctx, 'landscape')
      titleBlock(ctx, y, 'DAFTAR HADIR SANTRI', [`Bulan ${month.label}   |   Guru: ${d.guru.name}`, 'Tidak ada sesi mengajar dengan absensi santri pada bulan ini.'])
      continue
    }
    for (const group of groups) {
      let y = startPage(ctx, 'landscape')
      y = titleBlock(ctx, y, 'DAFTAR HADIR SANTRI', [`Bulan ${month.label}   |   Kelas: ${group.level}   |   Guru: ${d.guru.name}`])
      const dateCols = group.columns.length
      const free = pageSize(doc).w - 24 - 9 - 48 - 4 * 8
      const colW = Math.max(5.5, Math.min(12, free / Math.max(dateCols, 1)))
      const columnStyles = { 0: { cellWidth: 9, halign: 'center' }, 1: { cellWidth: 48, halign: 'left' } }
      for (let i = 0; i < dateCols; i++) columnStyles[i + 2] = { cellWidth: colW, halign: 'center' }
      for (let i = 0; i < 4; i++) columnStyles[dateCols + 2 + i] = { cellWidth: 8, halign: 'center', fontStyle: 'bold' }
      autoTable(doc, {
        ...tableTheme(ctx, y),
        styles: { ...tableTheme(ctx, y).styles, fontSize: dateCols > 22 ? 7 : 8, cellPadding: 1, halign: 'center' },
        headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 7 },
        // As wide as its columns, so a class with only a few sessions stays compact.
        tableWidth: 'wrap',
        head: [['No', 'Nama Santri', ...group.columns, 'H', 'I', 'S', 'A']],
        body: group.rows.map((row, index) => [index + 1, row.name, ...row.codes, ...row.totals]),
        columnStyles,
        didParseCell: (cell) => {
          if (cell.section !== 'body' || cell.column.index < 2 || cell.column.index >= dateCols + 2) return
          if (cell.cell.raw === 'A') cell.cell.styles.textColor = [198, 40, 40]
          if (cell.cell.raw === 'I' || cell.cell.raw === 'S') cell.cell.styles.textColor = [180, 110, 0]
        },
      })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.text('Keterangan: H = Hadir, I = Izin, S = Sakit, A = Alpa', 12, doc.lastAutoTable.finalY + 5)
    }
  }
}

/* ---------------------------------------------------------------- 3. Daftar Hadir Guru (lembaga) */

// All receiving teachers x days of one month. Exported for the tests.
// Columns are every date of the month; Saturdays/Sundays, holidays and days not yet held are greyed out.
export function teacherMatrix(documents, monthIndex) {
  const base = documents[0].months[monthIndex]
  const columns = base.days.map((day) => {
    const p = parts(day.date)
    // the date only: weekday names do not fit 31 columns, and Saturdays/Sundays are already greyed out
    return { date: day.date, label: String(p.d), off: day.kind !== 'active', holidayName: day.kind === 'holiday' ? day.holidayName || 'Libur' : null }
  })
  const rows = documents
    .map((d) => {
      const days = new Map(d.months[monthIndex].days.map((day) => [day.date, day]))
      const codes = columns.map((col) => {
        const day = days.get(col.date)
        if (col.off || !day?.attendance) return ''
        return TEACHER_CODE[day.attendance.status] || ''
      })
      const count = (code) => codes.filter((c) => c === code).length
      return { name: d.guru.name, codes, totals: [count('H'), count('I'), count('S'), count('A')] }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))
  return { label: base.label, columns, rows }
}

function institutionAttendance(ctx, documents) {
  const { doc, autoTable } = ctx
  const d = documents[0]
  const docDate = tanggalPanjang(d.batch.docDate)
  d.months.forEach((_, monthIndex) => {
    const { label, columns, rows } = teacherMatrix(documents, monthIndex)
    let y = startPage(ctx, 'landscape')
    y = titleBlock(ctx, y, 'DAFTAR HADIR GURU', [`Bulan ${label}   |   ${d.tpq.name}`])
    const nameW = 46
    const totalsW = 4 * 8
    const colW = Math.min(7, (pageSize(doc).w - 24 - 8 - nameW - totalsW) / columns.length)
    const columnStyles = { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: nameW, halign: 'left' } }
    columns.forEach((_, i) => (columnStyles[i + 2] = { cellWidth: colW, halign: 'center' }))
    for (let i = 0; i < 4; i++) columnStyles[columns.length + 2 + i] = { cellWidth: 8, halign: 'center', fontStyle: 'bold' }
    autoTable(doc, {
      ...tableTheme(ctx, y),
      styles: { ...tableTheme(ctx, y).styles, fontSize: 8, cellPadding: 1, halign: 'center', minCellHeight: 7 },
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 6.5 },
      tableWidth: 'wrap',
      head: [['No', 'Nama Guru', ...columns.map((c) => c.label), 'H', 'I', 'S', 'A']],
      body: rows.map((row, index) => [index + 1, row.name, ...row.codes, ...row.totals]),
      columnStyles,
      didParseCell: (cell) => {
        const col = columns[cell.column.index - 2]
        if (!col) return
        if (col.off) cell.cell.styles.fillColor = cell.section === 'head' ? [120, 144, 122] : GREY_FILL
        if (cell.section === 'body' && cell.cell.raw === 'A') cell.cell.styles.textColor = [198, 40, 40]
        if (cell.section === 'body' && (cell.cell.raw === 'I' || cell.cell.raw === 'S')) cell.cell.styles.textColor = [180, 110, 0]
      },
    })

    y = doc.lastAutoTable.finalY + 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.text('Keterangan: H = Hadir, I = Izin, S = Sakit, A = Alpa. Kolom abu-abu: Sabtu/Minggu, hari libur, atau hari yang belum berlangsung.', 12, y)
    const holidays = columns.filter((c) => c.holidayName).map((c) => `${parts(c.date).d} ${MONTHS_SHORT[parts(c.date).m - 1]} (${c.holidayName})`)
    if (holidays.length) doc.text(doc.splitTextToSize(`Hari libur: ${holidays.join(', ')}`, pageSize(doc).w - 24), 12, (y += 4.5))
    signatures(ctx, y + 9, {
      orientation: 'landscape',
      right: { lines: [`Sidoarjo, ${docDate}`, `Mengetahui, Kepala ${d.tpq.name}`], name: d.tpq.headName },
    })
  })
}

/* ---------------------------------------------------------------- 4. Jurnal Mengajar */

// Rows of the journal from the start of the period, in date order, like the paper "Buku Jurnal & Berita Acara".
// The day number and date are printed on the first row of each day only. Exported for the tests.
export function journalRows(d, limit = 60) {
  const rows = []
  let dayNo = 0
  for (const month of d.months) {
    for (const day of month.days) {
      const sessions = day.sessions || []
      if (!sessions.length) continue
      dayNo += 1
      sessions.forEach((s, index) => {
        const p = parts(s.date)
        const present = s.students.filter((st) => st.status === 'hadir').length
        const total = s.students.length
        rows.push({
          no: index === 0 ? String(dayNo) : '',
          date: index === 0 ? `${hari(s.date)},\n${p.d} ${MONTHS_SHORT[p.m - 1]} ${p.y}` : '',
          slot: String(s.slot || '').replace(/^Sesi\s+/i, ''),
          level: s.substituteFor ? `${s.level}\n(badal)` : s.level,
          total: total ? String(total) : '',
          present: total ? String(present) : '',
          absent: total ? String(total - present) : '',
          material: s.material || '-',
          supporting: s.supporting || s.notes || '',
        })
      })
      if (rows.length >= limit) return rows
    }
  }
  return rows
}

// Classes the teacher taught in the period (own classes first; badal only if that is all there is).
function taughtLevels(d) {
  const own = new Map()
  const badal = new Map()
  for (const month of d.months) {
    for (const day of month.days) {
      for (const s of day.sessions || []) {
        if (!s.students?.length) continue
        ;(s.substituteFor ? badal : own).set(s.levelKey, s.level)
      }
    }
  }
  const list = own.size ? own : badal
  return [...list.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'id', { numeric: true })).map(([, level]) => level)
}

function journalCover(ctx, d) {
  const { doc } = ctx
  let y = startPage(ctx, 'portrait') + 34
  centered(doc, 'BUKU JURNAL MENGAJAR', y, { size: 20, font: 'times' })
  centered(doc, '& BERITA ACARA', (y += 9), { size: 20, font: 'times' })
  centered(doc, 'TAMAN PENDIDIKAN AL-QUR’AN (TPQ)', (y += 12), { size: 14, font: 'times' })
  centered(doc, `Periode ${d.batch.rangeLabel}`, (y += 9), { size: 13, font: 'times', style: 'normal' })
  const levels = taughtLevels(d)
  infoBox(doc, y + 24, [
    ['Nama Ustadz/ah', d.guru.name],
    ['Kelas', levels.length ? levels.join(', ') : '-'],
    ['Nama TPQ', d.tpq.name],
    ['NSPQ', d.tpq.nsq],
  ])
  coverFooter(doc, d)
}

function journalSheets(ctx, d) {
  const { doc, autoTable } = ctx
  const docDate = tanggalPanjang(d.batch.docDate)
  const rows = journalRows(d)
  const firstPage = doc.getNumberOfPages() + 1
  const header = (y) =>
    titleBlock(ctx, y, 'BUKU JURNAL & BERITA ACARA', [`Ustadz/ah: ${d.guru.name}   |   Periode ${d.batch.rangeLabel}`])

  // Signatures at the foot of every sheet, like the paper book.
  const footerSignatures = () => {
    const { w, h } = pageSize(doc)
    const y = h - 38
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.text('Mengetahui,', 25, y)
    doc.text(`Kepala ${d.tpq.name}`, 25, y + 4.5)
    doc.text(`Sidoarjo, ${docDate}`, w - 85, y)
    doc.text('Ustadz/ah,', w - 85, y + 4.5)
    doc.setFont('helvetica', 'bold')
    doc.text(d.tpq.headName || BLANK, 25, y + 24)
    doc.text(d.guru.name, w - 85, y + 24)
  }

  const y = header(startPage(ctx, 'landscape'))
  const theme = tableTheme(ctx, y)
  autoTable(doc, {
    ...theme,
    // continuation sheets repeat the title, so the table starts at the same height on every sheet
    margin: { ...theme.margin, top: y, bottom: 44 },
    styles: { ...theme.styles, fontSize: 8, cellPadding: 1.3, minCellHeight: 9, valign: 'middle', lineColor: [150, 150, 150] },
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 8 },
    head: [
      [
        { content: 'No', rowSpan: 2 },
        { content: 'Hari/Tgl', rowSpan: 2 },
        { content: 'Gel', rowSpan: 2 },
        { content: 'Kelas', rowSpan: 2 },
        { content: 'Santri', colSpan: 3 },
        { content: 'Materi Inti', rowSpan: 2 },
        { content: 'Materi Penunjang', rowSpan: 2 },
        { content: 'Tanda Tangan', rowSpan: 2 },
      ],
      ['Jml', 'Masuk', 'Absen'],
    ],
    body: rows.length
      ? rows.map((r) => [r.no, r.date, r.slot, r.level, r.total, r.present, r.absent, r.material, r.supporting, ''])
      : [[{ content: 'Tidak ada sesi mengajar pada periode ini', colSpan: 10, styles: { halign: 'center', textColor: GREY_TEXT } }]],
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 11, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 'auto' },
      8: { cellWidth: 62 },
      9: { cellWidth: 30 },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) header(drawKop(ctx))
      footerSignatures()
    },
  })

  // Only the first sheets go into the LPJ.
  for (let page = doc.getNumberOfPages(); page >= firstPage + JOURNAL_SHEETS; page--) doc.deletePage(page)
}

function journal(ctx, d) {
  journalCover(ctx, d)
  journalSheets(ctx, d)
}

/* ---------------------------------------------------------------- assembly */

function footer(ctx, d) {
  const { doc } = ctx
  const total = doc.getNumberOfPages()
  for (let page = 1; page <= total; page++) {
    doc.setPage(page)
    const { w, h } = pageSize(doc)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GREY_TEXT)
    const label = ctx.pageLabels[page]
    doc.text(`LPJ Insentif Guru ${d.batch.rangeLabel}${label ? `  ·  ${label}` : ''}`, 12, h - 7)
    doc.text(`Halaman ${page} dari ${total}`, w - 12, h - 7, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
  doc.setPage(total)
}

/**
 * documents: teacher documents from GET /lpj/:id/teachers/:guruId/document.
 * scope 'lembaga' (default): the whole TPQ in the order of the official list; 'guru': one teacher's own part.
 * Returns { doc, sections: [{ key, title, guruId?, fromPage, toPage }] }.
 */
export function renderLpj({ jsPDF, autoTable, kop = null, documents, scope = 'lembaga' }) {
  if (!documents?.length) throw new Error('Tidak ada data guru untuk LPJ')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  doc.setProperties({ title: 'LPJ Insentif Guru', creator: 'TPQ AMANAH' })
  const ctx = { doc, autoTable, kop, firstPageFree: true, pageLabels: {}, label: '' }
  const sections = []
  const part = (key, title, guruId, draw) => {
    ctx.label = title
    const fromPage = ctx.firstPageFree ? 1 : doc.getNumberOfPages() + 1
    draw()
    sections.push({ key, title, ...(guruId ? { guruId } : {}), fromPage, toPage: doc.getNumberOfPages() })
  }

  if (scope === 'guru') {
    const d = documents[0]
    part('cover', 'Cover', d.guru.id, () => teacherCover(ctx, d))
    part('sptjm', `SPTJM · ${d.guru.name}`, d.guru.id, () => sptjmPage(ctx, d))
    part('santri', `Daftar Hadir Santri · ${d.guru.name}`, d.guru.id, () => studentAttendance(ctx, d))
    part('jurnal', `Jurnal Mengajar · ${d.guru.name}`, d.guru.id, () => journal(ctx, d))
  } else {
    const ordered = [...documents].sort((a, b) => a.guru.name.localeCompare(b.guru.name, 'id'))
    part('cover', 'Cover', null, () => institutionCover(ctx, ordered))
    for (const d of ordered) part('sptjm', `SPTJM · ${d.guru.name}`, d.guru.id, () => sptjmPage(ctx, d))
    for (const d of ordered) part('santri', `Daftar Hadir Santri · ${d.guru.name}`, d.guru.id, () => studentAttendance(ctx, d))
    part('guru', 'Daftar Hadir Guru', null, () => institutionAttendance(ctx, ordered))
    for (const d of ordered) part('jurnal', `Jurnal Mengajar · ${d.guru.name}`, d.guru.id, () => journal(ctx, d))
  }
  footer(ctx, documents[0])
  return { doc, sections }
}

export function lpjFilename(batch, guruName = null) {
  const range = batch.startPeriod === batch.endPeriod ? batch.startPeriod : `${batch.startPeriod}_${batch.endPeriod}`
  const who = guruName ? `-${String(guruName).replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '-')}` : '-Lembaga'
  return `LPJ-Insentif${who}-${range}.pdf`
}
