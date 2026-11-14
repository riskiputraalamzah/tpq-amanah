// Pendaftaran santri baru (replaces the Google Form): the steps, their fields, the choices and the same checks the
// backend makes (backend/src/utils/registration_form.js), so mistakes show while typing instead of after sending.
// NIK and KK are not asked here: they are asked in "Data ananda" once the child is accepted.

export const OPTIONS = {
  pernahTpq: [
    { value: 'baru', label: 'Baru pertama kali', sub: 'Ananda belum pernah mengaji di TPQ lain' },
    { value: 'pernah', label: 'Pernah di TPQ lain', sub: 'Pindah dari TPQ / tempat mengaji lain' },
  ],
  sesi: [
    { value: 'sore', label: 'Sesi Sore', sub: "15:30 - 17:00 · ba'da Ashar", note: 'Cocok untuk usia dini, TK, dan SD kelas 1-4' },
    { value: 'malam', label: 'Sesi Malam', sub: "18:00 - 19:30 · ba'da Maghrib", note: 'Cocok untuk anak yang sekolah seharian dan kelas lanjutan' },
  ],
  jenisKelamin: [
    { value: 'L', label: 'Laki-laki' },
    { value: 'P', label: 'Perempuan' },
  ],
  statusOrtu: [
    { value: 'hidup', label: 'Masih hidup' },
    { value: 'meninggal', label: 'Sudah meninggal' },
    { value: 'tidak_diketahui', label: 'Tidak diketahui' },
  ],
  waliSiapa: [
    { value: 'ayah', label: 'Ayah kandung' },
    { value: 'ibu', label: 'Ibu kandung' },
    { value: 'lain', label: 'Orang lain' },
  ],
  tinggal: [
    { value: 'ayah_ibu', label: 'Ayah & ibu' },
    { value: 'ayah', label: 'Ayah saja' },
    { value: 'ibu', label: 'Ibu saja' },
    { value: 'wali', label: 'Wali / orang tua asuh' },
    { value: 'lain', label: 'Lainnya' },
  ],
  pemilik: [
    { value: 'ayah', label: 'Ayah' },
    { value: 'ibu', label: 'Ibu' },
    { value: 'wali', label: 'Wali' },
    { value: 'lain', label: 'Lainnya' },
  ],
  pembiaya: [
    { value: 'orang_tua', label: 'Orang tua' },
    { value: 'wali', label: 'Wali / orang tua asuh' },
    { value: 'sendiri', label: 'Tanggungan sendiri' },
    { value: 'lain', label: 'Lainnya' },
  ],
  kebutuhanKhusus: [
    { value: 'tidak', label: 'Tidak ada' },
    { value: 'lamban', label: 'Lamban belajar' },
    { value: 'kesulitan', label: 'Kesulitan belajar spesifik' },
    { value: 'komunikasi', label: 'Gangguan komunikasi' },
    { value: 'berbakat', label: 'Berbakat / kecerdasan luar biasa' },
    { value: 'lain', label: 'Lainnya' },
  ],
  disabilitas: [
    { value: 'tidak', label: 'Tidak ada' },
    { value: 'netra', label: 'Tuna netra (penglihatan)' },
    { value: 'rungu', label: 'Tuna rungu (pendengaran)' },
    { value: 'daksa', label: 'Tuna daksa (gerak tubuh)' },
    { value: 'grahita', label: 'Tuna grahita (intelektual)' },
    { value: 'laras', label: 'Tuna laras (emosi & perilaku)' },
    { value: 'wicara', label: 'Tuna wicara (bicara)' },
    { value: 'lain', label: 'Lainnya' },
  ],
}

// type: text | date | digits | phone | textarea | chips (options) | cards (big choices) | select
// when: shown (and checked) only for that answer
export const STEPS = [
  {
    key: 'ananda',
    title: 'Data ananda',
    short: 'Ananda',
    hint: 'Tulis sesuai akta kelahiran.',
    fields: [
      { path: 'santri.namaLengkap', label: 'Nama lengkap ananda', required: true, max: 120, min: 3, placeholder: 'Contoh: Muhammad Rizky Ramadhan', help: 'Nama lengkap, bukan nama panggilan.' },
      { path: 'santri.namaPanggilan', label: 'Nama panggilan', max: 40, placeholder: 'Contoh: Rizky' },
      { path: 'santri.jenisKelamin', label: 'Jenis kelamin', type: 'chips', options: 'jenisKelamin', required: true },
      { path: 'santri.tempatLahir', label: 'Tempat lahir', required: true, max: 80, placeholder: 'Contoh: Sidoarjo', half: true },
      { path: 'santri.tanggalLahir', label: 'Tanggal lahir', type: 'date', required: true, half: true },
      { path: 'santri.sekolah', label: 'Sekolah / TK sekarang', max: 120, placeholder: 'Contoh: SDN Sawotratap 1', help: 'Kosongkan bila belum sekolah.' },
      { path: 'santri.kelasSekolah', label: 'Kelas', max: 20, placeholder: 'Contoh: 2 atau TK B' },
    ],
  },
  {
    key: 'mengaji',
    title: 'Mengaji & sesi',
    short: 'Mengaji',
    hint: 'Untuk menentukan jilid yang pas. Tidak ada tes yang menggugurkan.',
    fields: [
      { path: 'riwayat.pernahTpq', label: 'Sebelumnya, apakah ananda pernah mengaji di TPQ lain?', type: 'cards', options: 'pernahTpq', required: true },
      { path: 'riwayat.tpqLama', label: 'Nama TPQ sebelumnya', required: true, max: 200, when: { path: 'riwayat.pernahTpq', is: 'pernah' }, placeholder: 'Contoh: TPQ Al-Ikhlas', help: 'Bila lebih dari satu, pisahkan dengan koma.' },
      { path: 'riwayat.terakhir', label: 'Terakhir belajar sampai', max: 80, when: { path: 'riwayat.pernahTpq', is: 'pernah' }, placeholder: 'Contoh: Jilid 3, Iqro 4, atau Al-Qur\'an' },
      { path: 'riwayat.alasanPindah', label: 'Alasan pindah (bila berkenan)', type: 'textarea', max: 500, when: { path: 'riwayat.pernahTpq', is: 'pernah' } },
      { path: 'riwayat.sesi', label: 'Pilihan sesi mengaji', type: 'cards', options: 'sesi', required: true, recommend: true },
    ],
  },
  {
    key: 'ortu',
    title: 'Orang tua & wali',
    short: 'Orang tua',
    hint: 'Nama sesuai Kartu Keluarga.',
    fields: [
      { path: 'ayah.nama', label: 'Nama lengkap ayah kandung', required: true, max: 120 },
      { path: 'ayah.status', label: 'Status ayah', type: 'chips', options: 'statusOrtu', required: true },
      { path: 'ibu.nama', label: 'Nama lengkap ibu kandung', required: true, max: 120 },
      { path: 'ibu.status', label: 'Status ibu', type: 'chips', options: 'statusOrtu', required: true },
      { path: 'wali.siapa', label: 'Siapa wali ananda?', type: 'chips', options: 'waliSiapa', required: true, help: 'Yang bertanggung jawab atas ananda di TPQ.' },
      { path: 'wali.nama', label: 'Nama wali', required: true, max: 120, when: { path: 'wali.siapa', is: 'lain' } },
      { path: 'wali.hubungan', label: 'Hubungan dengan ananda', required: true, max: 40, when: { path: 'wali.siapa', is: 'lain' }, placeholder: 'Contoh: Kakek, Paman' },
      { path: 'tinggal.dengan', label: 'Saat ini ananda tinggal serumah dengan', type: 'chips', options: 'tinggal', required: true },
      { path: 'tinggal.lain', label: 'Tinggal dengan siapa', required: true, max: 80, when: { path: 'tinggal.dengan', is: 'lain' } },
    ],
  },
  {
    key: 'alamat',
    title: 'Alamat & kontak',
    short: 'Alamat',
    hint: 'Alamat tempat ananda tinggal sekarang.',
    fields: [
      { path: 'alamat.jalan', label: 'Jalan / dusun / nomor rumah', required: true, max: 160, autocomplete: 'street-address', placeholder: 'Contoh: Jl. Mawar No. 3' },
      { path: 'alamat.rt', label: 'RT', type: 'digits', max: 4, half: true },
      { path: 'alamat.rw', label: 'RW', type: 'digits', max: 4, half: true },
      { path: 'alamat.desa', label: 'Desa / kelurahan', required: true, max: 80 },
      { path: 'alamat.kecamatan', label: 'Kecamatan', required: true, max: 80, half: true },
      { path: 'alamat.kabupaten', label: 'Kabupaten / kota', required: true, max: 80, half: true },
      { path: 'kontak.pemilik', label: 'Nomor WhatsApp yang dipakai masuk ini milik', type: 'chips', options: 'pemilik', required: true, showPhone: true },
      { path: 'kontak.pemilikLain', label: 'Milik siapa', required: true, max: 60, when: { path: 'kontak.pemilik', is: 'lain' } },
      { path: 'kontak.waCadangan', label: 'Nomor WA lain (opsional)', type: 'phone', help: 'Misalnya nomor ayah/ibu yang satunya, bila nomor utama sulit dihubungi.' },
    ],
  },
  {
    key: 'tambahan',
    title: 'Info tambahan',
    short: 'Tambahan',
    hint: 'Semua opsional. Membantu ustadz/ustadzah mengenal ananda.',
    optional: true,
    fields: [
      { path: 'tambahan.anakKe', label: 'Anak ke', type: 'digits', max: 2, half: true },
      { path: 'tambahan.jumlahSaudara', label: 'Jumlah saudara', type: 'digits', max: 2, half: true },
      { path: 'tambahan.citaCita', label: 'Cita-cita ananda', max: 80, placeholder: 'Contoh: Dokter, Hafidz Qur\'an' },
      { path: 'tambahan.pembiaya', label: 'Yang membiayai sekolah', type: 'select', options: 'pembiaya' },
      { path: 'tambahan.pembiayaLain', label: 'Dibiayai oleh', max: 60, when: { path: 'tambahan.pembiaya', is: 'lain' } },
      { path: 'tambahan.kebutuhanKhusus', label: 'Kebutuhan khusus', type: 'select', options: 'kebutuhanKhusus' },
      { path: 'tambahan.kebutuhanKhususLain', label: 'Kebutuhan khusus lainnya', max: 120, when: { path: 'tambahan.kebutuhanKhusus', is: 'lain' } },
      { path: 'tambahan.disabilitas', label: 'Disabilitas', type: 'select', options: 'disabilitas' },
      { path: 'tambahan.disabilitasLain', label: 'Disabilitas lainnya', max: 120, when: { path: 'tambahan.disabilitas', is: 'lain' } },
      { path: 'tambahan.catatan', label: 'Catatan untuk ustadz/ustadzah', type: 'textarea', max: 500, placeholder: 'Alergi, kebiasaan, atau hal lain yang perlu diketahui' },
    ],
  },
]

// The TPQ's conditions and fees (from the Google Form's Syarat & Ketentuan). Update here when they change.
export const FEES = [
  { label: 'Daftar ulang', amount: 'Rp35.000', note: 'sekali' },
  { label: 'Buku Prestasi', amount: 'Rp5.000', note: 'program/materi' },
  { label: 'Buku Tartil', amount: 'Rp13.000', note: 'program/materi' },
  { label: 'SPP', amount: 'Rp20.000', note: 'per bulan' },
]
export const TERMS = [
  'Orang tua/wali mendukung dan membimbing ananda mengikuti kegiatan mengaji sesuai jadwal, Senin sampai Jumat.',
  'Santri menaati tata tertib, menjaga sikap dan sopan santun, serta menghormati ustadz/ustadzah dan sesama santri.',
  'Orang tua/wali memenuhi kewajiban administrasi sesuai rincian biaya di atas.',
]
export const AGREEMENTS = [
  { key: 'syarat', label: 'Saya sudah membaca, memahami, dan menyetujui syarat & ketentuan pendaftaran TPQ Amanah.' },
  { key: 'data', label: 'Saya setuju data ini disimpan TPQ Amanah untuk administrasi santri, pelaporan ke lembaga terkait, dan kabar kegiatan lewat WhatsApp. Data tidak dibagikan untuk keperluan lain.' },
  { key: 'benar', label: 'Saya sudah memeriksa kembali, dan data di atas benar.' },
]

export const REG_STATUS = {
  draft: { label: 'Belum dikirim', tone: 'warn' },
  submitted: { label: 'Terkirim', tone: 'info' },
  contacted: { label: 'Sudah dihubungi', tone: 'info' },
  scheduled: { label: 'Jadwal penempatan', tone: 'warn' },
  accepting: { label: 'Sedang diproses', tone: 'info' },
  accepted: { label: 'Diterima', tone: 'ok' },
  cancelled: { label: 'Dibatalkan', tone: 'danger' },
}

export const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
export function setPath(obj, path, value) {
  const keys = path.split('.')
  let o = obj
  keys.slice(0, -1).forEach((k) => {
    if (!o[k] || typeof o[k] !== 'object') o[k] = {}
    o = o[k]
  })
  o[keys[keys.length - 1]] = value
}

export const isShown = (field, data) => !field.when || getPath(data, field.when.path) === field.when.is
export const optionLabel = (group, value) => OPTIONS[group]?.find((o) => o.value === value)?.label || ''

const wibToday = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)

export function ageOn(birth, day = wibToday()) {
  const re = /^\d{4}-\d{2}-\d{2}$/
  if (!re.test(String(birth || '')) || !re.test(day)) return null
  const [by, bm, bd] = birth.split('-').map(Number)
  const [y, m, d] = day.split('-').map(Number)
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0)
}

// Sesi Sore for young children (up to about SD kelas 4), Malam for older ones, as the FAQ on the landing page says
export function recommendedSesi(birth) {
  const age = ageOn(birth)
  if (age === null) return ''
  return age <= 9 ? 'sore' : 'malam'
}

export function normalizePhone(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`
  else if (digits.startsWith('8')) digits = `62${digits}`
  return digits
}

export function fieldError(field, rawValue, data = {}) {
  if (!isShown(field, data)) return ''
  const value = String(rawValue ?? '').trim()
  if (!value) return field.required ? `${field.label.replace(/\?$/, '')} wajib diisi` : ''
  if (field.max && value.length > field.max) return `Terlalu panjang (maks. ${field.max} karakter)`
  if (field.min && value.length < field.min) return 'Terlalu pendek'
  if (field.type === 'digits' && !/^\d+$/.test(value)) return 'Hanya angka'
  if (field.type === 'phone' && !/^62\d{8,13}$/.test(normalizePhone(value))) return 'Nomor tidak valid (contoh: 0812xxxxxxx)'
  if (field.type === 'date') {
    const age = ageOn(value)
    if (age === null) return 'Tanggal tidak valid'
    if (value > wibToday()) return 'Tanggal tidak boleh di masa depan'
    if (age < 2 || age > 20) return `Periksa lagi tahun lahirnya (usia ananda ${age} tahun)`
  }
  return ''
}

export function stepErrors(step, data) {
  const errors = {}
  for (const f of step.fields) {
    const e = fieldError(f, getPath(data, f.path), data)
    if (e) errors[f.path] = e
  }
  return errors
}

export const stepOfPath = (path) => STEPS.findIndex((s) => s.fields.some((f) => f.path === path))

export function emptyForm() {
  const data = {}
  for (const s of STEPS) for (const f of s.fields) setPath(data, f.path, '')
  data.persetujuan = { syarat: false, data: false, benar: false }
  return data
}

export function mergeForm(server = {}) {
  const data = emptyForm()
  for (const s of STEPS) {
    for (const f of s.fields) {
      const v = getPath(server, f.path)
      if (v !== undefined && v !== null) setPath(data, f.path, String(v))
    }
  }
  const agree = server.persetujuan || {}
  data.persetujuan = { syarat: agree.syarat === true, data: agree.data === true, benar: agree.benar === true }
  return data
}

// What the review shows for one answer
export function shownValue(field, data) {
  const v = getPath(data, field.path)
  if (!v) return ''
  if (field.options) return optionLabel(field.options, v)
  if (field.type === 'date') return longDate(v)
  if (field.type === 'phone') return displayPhone(normalizePhone(v))
  return v
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export function longDate(iso, { weekday = false } = {}) {
  const [y, m, d] = String(iso || '').split('-').map(Number)
  if (!y || !m || !d) return ''
  const day = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${weekday ? `${day}, ` : ''}${d} ${MONTHS[m - 1]} ${y}`
}

export function displayPhone(phone) {
  const local = String(phone || '').replace(/^62/, '0')
  return local.replace(/(\d{4})(\d{4})(\d+)/, '$1 $2 $3')
}

export const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : '')
export const sesiName = (s) => (s === 'malam' ? 'Sesi Malam (18:00)' : s === 'sore' ? 'Sesi Sore (15:30)' : '')
