// The "pengkinian data santri" form for the wali portal: the steps, their fields and the same checks the backend
// makes (backend/src/utils/santri_profile.js), so mistakes show while typing instead of after sending.

export const RELATIONS = [
  { value: 'ayah', label: 'Ayah' },
  { value: 'ibu', label: 'Ibu' },
  { value: 'wali', label: 'Wali' },
]

export const STATUS = {
  empty: { label: 'Belum diisi', tone: 'idle' },
  draft: { label: 'Belum selesai', tone: 'warn' },
  submitted: { label: 'Menunggu dicek admin', tone: 'info' },
  needs_fix: { label: 'Perlu diperbaiki', tone: 'danger' },
  verified: { label: 'Terverifikasi', tone: 'ok' },
}

// type: text | date | gender | digits16 | digits | phone | textarea
export const STEPS = [
  {
    key: 'anak',
    title: 'Data anak',
    hint: 'Sesuai akta kelahiran / KK.',
    fields: [
      { path: 'santri.namaLengkap', label: 'Nama lengkap', required: true, max: 120, autocomplete: 'name' },
      { path: 'santri.namaPanggilan', label: 'Nama panggilan', max: 40 },
      { path: 'santri.jenisKelamin', label: 'Jenis kelamin', type: 'gender', required: true },
      { path: 'santri.tempatLahir', label: 'Tempat lahir', required: true, max: 80, placeholder: 'Contoh: Sidoarjo' },
      { path: 'santri.tanggalLahir', label: 'Tanggal lahir', type: 'date', required: true },
      { path: 'santri.nik', label: 'NIK anak', type: 'digits16', required: true, help: '16 angka, ada di Kartu Keluarga.' },
      { path: 'santri.sekolah', label: 'Sekolah formal', max: 120, placeholder: 'Contoh: SDN Sawotratap 1' },
      { path: 'santri.kelasSekolah', label: 'Kelas di sekolah', max: 20, placeholder: 'Contoh: 4' },
    ],
  },
  {
    key: 'alamat',
    title: 'Alamat tinggal',
    hint: 'Alamat tempat anak tinggal sekarang.',
    fields: [
      { path: 'alamat.jalan', label: 'Jalan / dusun / nomor rumah', required: true, max: 160, autocomplete: 'street-address' },
      { path: 'alamat.rt', label: 'RT', type: 'digits', max: 4, half: true },
      { path: 'alamat.rw', label: 'RW', type: 'digits', max: 4, half: true },
      { path: 'alamat.desa', label: 'Desa / kelurahan', required: true, max: 80, placeholder: 'Contoh: Sawotratap' },
      { path: 'alamat.kecamatan', label: 'Kecamatan', required: true, max: 80, placeholder: 'Contoh: Gedangan' },
      { path: 'alamat.kabupaten', label: 'Kabupaten / kota', required: true, max: 80, placeholder: 'Contoh: Sidoarjo' },
      { path: 'alamat.kodePos', label: 'Kode pos', type: 'digits', max: 5 },
    ],
  },
  {
    key: 'keluarga',
    title: 'Orang tua',
    hint: 'Nama sesuai Kartu Keluarga.',
    fields: [
      { path: 'keluarga.noKK', label: 'Nomor Kartu Keluarga (KK)', type: 'digits16', required: true, help: '16 angka di bagian atas KK.' },
      { path: 'ayah.nama', label: 'Nama ayah kandung', required: true, max: 120 },
      { path: 'ayah.pekerjaan', label: 'Pekerjaan ayah', max: 80 },
      { path: 'ayah.hp', label: 'No. HP ayah', type: 'phone' },
      { path: 'ibu.nama', label: 'Nama ibu kandung', required: true, max: 120 },
      { path: 'ibu.pekerjaan', label: 'Pekerjaan ibu', max: 80 },
      { path: 'ibu.hp', label: 'No. HP ibu', type: 'phone' },
    ],
  },
  {
    key: 'lainnya',
    title: 'Wali & lainnya',
    hint: 'Isi data wali hanya bila anak tidak tinggal dengan ayah/ibu.',
    fields: [
      { path: 'wali.nama', label: 'Nama wali (bila ada)', max: 120 },
      { path: 'wali.hubungan', label: 'Hubungan dengan anak', max: 40, placeholder: 'Contoh: Kakek, Paman' },
      { path: 'wali.hp', label: 'No. HP wali', type: 'phone' },
      { path: 'kontak.waCadangan', label: 'No. WA cadangan', type: 'phone', help: 'Bila nomor utama tidak bisa dihubungi.' },
      { path: 'kesehatan.catatan', label: 'Catatan kesehatan (opsional)', type: 'textarea', max: 500, placeholder: 'Alergi, kondisi khusus, atau hal yang perlu diketahui ustadz/ustadzah' },
    ],
  },
]

export const IDENTITY_PATHS = ['santri.namaLengkap', 'santri.jenisKelamin', 'santri.tempatLahir', 'santri.tanggalLahir', 'santri.nik', 'keluarga.noKK']

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

export function normalizePhone(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`
  else if (digits.startsWith('8')) digits = `62${digits}`
  return digits
}

// "6281234567890" -> "0812 3456 7890" (how parents write it)
export function displayPhone(phone) {
  const d = String(phone || '').replace(/^62/, '0')
  return d.replace(/(\d{4})(\d{4})(\d+)/, '$1 $2 $3')
}

// A masked NIK/KK ("3515********0001") coming back from the server counts as filled and unchanged.
const isMasked = (v) => /^\d{4}\*{8}\d{4}$/.test(String(v || ''))

export function fieldError(field, rawValue, { forSubmit = true } = {}) {
  const value = String(rawValue ?? '').trim()
  if (!value) return forSubmit && field.required ? `${field.label} wajib diisi` : ''
  if (field.max && value.length > field.max) return `${field.label} terlalu panjang`
  if (field.type === 'digits16' && !isMasked(value) && !/^\d{16}$/.test(value.replace(/\s/g, ''))) return `${field.label} harus 16 angka`
  if (field.type === 'digits' && !/^\d+$/.test(value)) return `${field.label} hanya angka`
  if (field.type === 'phone' && !/^62\d{8,13}$/.test(normalizePhone(value))) return `${field.label} tidak valid (contoh: 0812 3456 7890)`
  if (field.type === 'gender' && !['L', 'P'].includes(value)) return `Pilih jenis kelamin`
  if (field.type === 'date') {
    const d = new Date(`${value}T12:00:00`)
    if (Number.isNaN(d.getTime())) return `${field.label} tidak valid`
    if (d > new Date()) return `${field.label} tidak boleh di masa depan`
  }
  return ''
}

export function stepErrors(step, data, options) {
  const errors = {}
  for (const field of step.fields) {
    const msg = fieldError(field, getPath(data, field.path), options)
    if (msg) errors[field.path] = msg
  }
  return errors
}

// Which step holds a field (to jump to the first problem the server reports).
export const stepOfPath = (path) => STEPS.findIndex((s) => s.fields.some((f) => f.path === path))

export function emptyProfile() {
  const data = {}
  for (const step of STEPS) for (const f of step.fields) setPath(data, f.path, '')
  data.persetujuan = { syarat: false, data: false }
  return data
}

// The server's data on top of an empty form, so every field exists for v-model.
export function mergeProfile(serverData = {}) {
  const data = emptyProfile()
  for (const step of STEPS) {
    for (const f of step.fields) {
      const v = getPath(serverData, f.path)
      if (v != null) setPath(data, f.path, String(v))
    }
  }
  data.persetujuan = { syarat: serverData?.persetujuan?.syarat === true, data: serverData?.persetujuan?.data === true }
  return data
}

// Invitation codes: "ab2c d3ef" -> "AB2C-D3EF" while typing.
export function formatLinkCode(raw) {
  const c = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  return c.length > 4 ? `${c.slice(0, 4)}-${c.slice(4)}` : c
}

// The private WhatsApp message a teacher sends to one parent (never to a group).
export function linkCodeMessage({ santriName, code, expiresAt, siteUrl }) {
  const until = expiresAt ? new Date(expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  return [
    `Assalamu'alaikum Bapak/Ibu wali dari *${santriName}*.`,
    '',
    'TPQ Amanah sedang memperbarui data santri. Mohon Bapak/Ibu mengisi data ananda lewat tautan berikut:',
    `${siteUrl}/wali/tautkan?kode=${code}`,
    '',
    `Masuk dengan nomor WhatsApp Bapak/Ibu, lalu masukkan kode: *${code}*`,
    until ? `Kode berlaku sampai ${until}.` : '',
    '',
    'Mohon kode ini tidak dibagikan ke orang lain. Jazakumullahu khairan.',
  ].filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n')
}
