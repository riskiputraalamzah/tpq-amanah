// LPJ Insentif Guru PDF, built in the admin's browser (no server size or time limits).
// Per teacher, in this order: Cover, Daftar Hadir Guru (per month), SPTJM, Daftar Hadir Santri (per month and class),
// Jurnal Mengajar (per month). Every page carries the kop surat; tables that run long continue on pages with the kop.
// The builder takes jsPDF, autoTable and the kop image as arguments, so it also runs in Node for the tests.

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const STATUS_LABEL = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alfa: 'Alpa', alpa: 'Alpa', tidak_hadir: 'Tidak hadir' }
const STUDENT_CODE = { hadir: 'H', izin: 'I', sakit: 'S', alfa: 'A', alpa: 'A' }

const GREEN = [27, 94, 32]
const GREY_TEXT = [110, 110, 110]
const KOP_RATIO = 261 / 1600
const KOP_WIDTH = 180
const KOP_HEIGHT = KOP_WIDTH * KOP_RATIO
const BLANK = '..............................'

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

const SECTIONS = [
  'Daftar Hadir Guru',
  'Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)',
  'Daftar Hadir Santri',
  'Jurnal Mengajar',
]

/* ---------------------------------------------------------------- page helpers */

function pageSize(doc) {
  return { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight() }
}

function drawKop(ctx) {
  const { doc, kop } = ctx
  const { w } = pageSize(doc)
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

/* ---------------------------------------------------------------- 1. Cover */

function coverPage(ctx, d) {
  const { doc } = ctx
  const { w } = pageSize(doc)
  let y = startPage(ctx, 'portrait') + 28
  centered(doc, 'LAPORAN PERTANGGUNGJAWABAN', y, { size: 20, font: 'times' })
  centered(doc, '(LPJ)', (y += 9), { size: 20, font: 'times' })
  centered(doc, 'INSENTIF GURU TAMAN PENDIDIKAN AL-QUR’AN (TPQ)', (y += 12), { size: 14, font: 'times' })
  centered(doc, `Periode ${d.batch.rangeLabel}`, (y += 9), { size: 13, font: 'times', style: 'normal' })

  y += 22
  const rows = [
    ['Nama Guru', d.guru.name],
    ['NIK', d.guru.nik || BLANK],
    ['Jabatan', d.guru.position],
    ['Nama TPQ', d.tpq.name],
    ['NSPQ', d.tpq.nsq],
    ['Alamat TPQ', d.tpq.address || BLANK],
  ]
  const boxX = 30
  const boxW = w - 60
  const valueX = boxX + 42
  doc.setFont('times', 'normal')
  doc.setFontSize(12)
  const wrapped = rows.map(([label, value]) => [label, doc.splitTextToSize(String(value), boxW - 50)])
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

  y += 18
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.text('Isi Laporan:', boxX, y)
  doc.setFont('times', 'normal')
  SECTIONS.forEach((section, index) => {
    doc.text(`${index + 1}.  ${section}`, boxX + 4, (y += 7))
  })

  const { h } = pageSize(doc)
  centered(doc, String(d.tpq.name).toUpperCase(), h - 42, { size: 14, font: 'times' })
  centered(doc, 'SAWOTRATAP – GEDANGAN – SIDOARJO', h - 35, { size: 12, font: 'times', style: 'normal' })
  centered(doc, String(d.batch.endPeriod).slice(0, 4), h - 28, { size: 12, font: 'times', style: 'normal' })
}

/* ---------------------------------------------------------------- 2. Daftar Hadir Guru */

function teacherAttendance(ctx, d) {
  const { doc, autoTable } = ctx
  const docDate = tanggalPanjang(d.batch.docDate)
  for (const month of d.months) {
    let y = startPage(ctx, 'portrait')
    y = titleBlock(ctx, y, 'DAFTAR HADIR GURU', [`Bulan ${month.label}`])
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Nama     : ${d.guru.name}`, 12, y)
    doc.text(`Jabatan  : ${d.guru.position}`, 12, y + 5)
    y += 9

    const meta = []
    const body = []
    for (const day of month.days.filter((x) => x.kind !== 'weekend')) {
      let status = '-'
      let note = ''
      let tone = null
      if (day.kind === 'holiday') {
        note = `Libur: ${day.holidayName || 'Libur'}`
        tone = 'off'
      } else if (day.kind === 'future') {
        note = 'Belum berlangsung'
        tone = 'off'
      } else if (day.attendance) {
        status = STATUS_LABEL[day.attendance.status] || day.attendance.status
        note = day.attendance.notes || ''
        if (day.attendance.status !== 'hadir') tone = 'leave'
      } else if (day.state === 'no_attendance') {
        note = 'Tidak ada absen'
        tone = 'missing'
      } else if (!day.state) {
        note = 'Belum terdaftar'
        tone = 'off'
      }
      meta.push(tone)
      body.push([body.length + 1, hari(day.date), tanggalPanjang(day.date).replace(/^0/, ''), status, note])
    }

    autoTable(doc, {
      ...tableTheme(ctx, y),
      head: [['No', 'Hari', 'Tanggal', 'Kehadiran', 'Keterangan']],
      body,
      columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 22 }, 2: { cellWidth: 38 }, 3: { cellWidth: 26, halign: 'center' } },
      didParseCell: (cell) => {
        if (cell.section !== 'body') return
        const tone = meta[cell.row.index]
        if (tone === 'off') {
          cell.cell.styles.fillColor = [242, 242, 242]
          cell.cell.styles.textColor = GREY_TEXT
        }
        if (tone === 'missing' && cell.column.index === 4) cell.cell.styles.textColor = [198, 40, 40]
      },
    })

    y = doc.lastAutoTable.finalY + 6
    const c = month.counts
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.text(
      `Hari mengajar: ${c.teachingDays}   |   Hadir: ${c.hadir}   |   Izin: ${c.izin}   |   Sakit: ${c.sakit}   |   Alpa/Tidak hadir: ${c.tidakHadir}   |   Tidak ada absen: ${c.noAttendance}`,
      12,
      y,
    )
    signatures(ctx, y + 10, {
      orientation: 'portrait',
      left: { lines: ['', 'Guru,'], name: d.guru.name },
      right: { lines: [`Sidoarjo, ${docDate}`, `Mengetahui, Kepala ${d.tpq.name}`], name: d.tpq.headName },
    })
  }
}

/* ---------------------------------------------------------------- 3. SPTJM */

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
  doc.text(`Sidoarjo, ${tanggalPanjang(d.batch.docDate)}`, signX, y)
  doc.text('Yang membuat pernyataan,', signX, y + lh)
  doc.text(d.guru.name, signX, y + lh + 30)
  doc.text(`NIK. ${d.guru.nik || BLANK}`, signX, y + 2 * lh + 30)
}

/* ---------------------------------------------------------------- 4. Daftar Hadir Santri */

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

/* ---------------------------------------------------------------- 5. Jurnal Mengajar */

function journal(ctx, d) {
  const { doc, autoTable } = ctx
  const docDate = tanggalPanjang(d.batch.docDate)
  for (const month of d.months) {
    let y = startPage(ctx, 'landscape')
    y = titleBlock(ctx, y, 'JURNAL MENGAJAR', [`Bulan ${month.label}   |   Guru: ${d.guru.name}`])
    const body = []
    for (const day of month.days) {
      for (const s of day.sessions || []) {
        const present = s.students.filter((st) => st.status === 'hadir').length
        const notes = [s.substituteFor ? `Badal untuk ${s.substituteFor}.` : '', s.notes].filter(Boolean).join(' ')
        body.push([
          body.length + 1,
          `${hari(s.date)}, ${tanggalPanjang(s.date).replace(/^0/, '')}`,
          s.slot,
          s.level,
          s.meetingNumber || '-',
          s.material || '-',
          notes || '-',
          s.students.length ? `${present}/${s.students.length}` : '-',
        ])
      }
    }
    autoTable(doc, {
      ...tableTheme(ctx, y),
      head: [['No', 'Hari, Tanggal', 'Sesi', 'Kelas', 'Pert.', 'Materi', 'Catatan', 'Hadir']],
      body: body.length
        ? body
        : [[{ content: 'Tidak ada sesi mengajar pada bulan ini', colSpan: 8, styles: { halign: 'center', textColor: GREY_TEXT } }]],
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 24 },
        3: { cellWidth: 22 },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 60 },
        7: { cellWidth: 15, halign: 'center' },
      },
    })
    signatures(ctx, doc.lastAutoTable.finalY + 8, {
      orientation: 'landscape',
      left: { lines: ['', 'Guru,'], name: d.guru.name },
      right: { lines: [`Sidoarjo, ${docDate}`, `Mengetahui, Kepala ${d.tpq.name}`], name: d.tpq.headName },
    })
  }
}

/* ---------------------------------------------------------------- assembly */

function footer(ctx, d, fromPage, toPage) {
  const { doc } = ctx
  const total = toPage - fromPage + 1
  for (let page = fromPage; page <= toPage; page++) {
    doc.setPage(page)
    const { w, h } = pageSize(doc)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GREY_TEXT)
    doc.text(`LPJ Insentif Guru ${d.batch.rangeLabel}  ·  ${d.guru.name}`, 12, h - 7)
    doc.text(`Halaman ${page - fromPage + 1} dari ${total}`, w - 12, h - 7, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
  doc.setPage(toPage)
}

/**
 * documents: teacher documents from GET /lpj/:id/teachers/:guruId/document (one or many teachers).
 * Returns { doc, sections: [{ guruId, name, fromPage, toPage }] }.
 */
export function renderLpj({ jsPDF, autoTable, kop = null, documents, onTeacher }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  doc.setProperties({ title: 'LPJ Insentif Guru', creator: 'TPQ AMANAH' })
  const ctx = { doc, autoTable, kop, firstPageFree: true }
  const sections = []
  documents.forEach((d, index) => {
    if (onTeacher) onTeacher(d, index)
    const fromPage = ctx.firstPageFree ? 1 : doc.getNumberOfPages() + 1
    coverPage(ctx, d)
    teacherAttendance(ctx, d)
    sptjmPage(ctx, d)
    studentAttendance(ctx, d)
    journal(ctx, d)
    const toPage = doc.getNumberOfPages()
    footer(ctx, d, fromPage, toPage)
    sections.push({ guruId: d.guru.id, name: d.guru.name, fromPage, toPage })
  })
  return { doc, sections }
}

export function lpjFilename(batch, guruName = null) {
  const range = batch.startPeriod === batch.endPeriod ? batch.startPeriod : `${batch.startPeriod}_${batch.endPeriod}`
  const who = guruName ? `-${String(guruName).replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '-')}` : '-Semua-Guru'
  return `LPJ-Insentif${who}-${range}.pdf`
}
