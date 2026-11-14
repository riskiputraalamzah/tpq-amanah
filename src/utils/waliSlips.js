// Paper slips with the invitation codes, one per santri, 8 per A4 page (2 x 4), with cut lines.
// The child brings the slip home; the parent opens the site, signs in with WhatsApp and types the code.

export function slipLines({ santriName, classLabel, code, expiresAt, siteUrl }) {
  const until = expiresAt ? new Date(expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const host = String(siteUrl || '').replace(/^https?:\/\//, '')
  return {
    title: 'Pengkinian Data Santri - TPQ Amanah',
    name: santriName,
    classLabel,
    code,
    steps: [
      `1. Buka ${host}/wali`,
      '2. Masuk dengan nomor WhatsApp Bapak/Ibu',
      '3. Masukkan kode di atas, lalu isi data ananda',
    ],
    footer: until ? `Berlaku sampai ${until}. Mohon tidak dibagikan.` : 'Mohon tidak dibagikan.',
  }
}

export function renderSlips({ jsPDF, slips, siteUrl }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const margin = 10
  const cols = 2
  const rows = 4
  const cw = (W - margin * 2) / cols
  const ch = (H - margin * 2) / rows

  slips.forEach((slip, i) => {
    const pos = i % (cols * rows)
    if (i > 0 && pos === 0) doc.addPage()
    const x = margin + (pos % cols) * cw
    const y = margin + Math.floor(pos / cols) * ch
    const s = slipLines({ ...slip, siteUrl })

    // cut line
    doc.setDrawColor(150)
    doc.setLineDashPattern([1.5, 1.5], 0)
    doc.rect(x, y, cw, ch)
    doc.setLineDashPattern([], 0)

    const left = x + 6
    doc.setTextColor(11, 59, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(s.title, left, y + 8)
    doc.setFontSize(13)
    doc.text(doc.splitTextToSize(s.name, cw - 12)[0], left, y + 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(s.classLabel, left, y + 21)

    // the code, large, in a box
    doc.setDrawColor(10, 92, 64)
    doc.setLineWidth(0.6)
    doc.roundedRect(left, y + 25, cw - 12, 15, 2, 2)
    doc.setLineWidth(0.2)
    doc.setFont('courier', 'bold')
    doc.setFontSize(22)
    doc.text(s.code, x + cw / 2, y + 35.5, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(40, 55, 48)
    s.steps.forEach((line, n) => doc.text(line, left, y + 47 + n * 4.6))
    doc.setFontSize(7.5)
    doc.setTextColor(110)
    doc.text(s.footer, left, y + ch - 5)
  })
  return doc
}
