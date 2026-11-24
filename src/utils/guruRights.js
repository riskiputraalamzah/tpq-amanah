// Who gets what (shown in Akun Pengguna > Akses khusus). The server enforces it; these are the words for the admin.

// What EVERY guru has for the jilid they teach, without any special access (backend: utils/guru_features.js)
export const GURU_DEFAULT_RIGHTS = [
  'KBM, absensi diri, dan penilaian',
  'Absen Santri, sampai 2 hari ke belakang',
  'Data Santri jilidnya: naik jilid, ubah nama, usulkan santri baru',
  'Data Wali Santri jilidnya: kode dan slip, pengingat ke wali, pengajuan & lepas tautan',
  'Verifikasi data wali, NIK/KK, dan foto KK: hanya untuk jilid yang ditetapkan admin di Kelola Pengajar',
  'Peserta kegiatan dari jilidnya',
]

// What a guru never gets, whatever is ticked
export const NEVER_FOR_GURU = 'Akun & password, Profil TPQ, LPJ insentif, Pengumuman & Broadcast, Notifikasi WA, tambah/hapus santri, Export Excel data wali.'

// One tap for a coordinator (like Ustadzah Ella): what they usually need
export const PRESETS = [
  { id: 'koordinator', label: 'Jadikan koordinator', features: ['pendaftaran', 'kbm-monitor', 'wa-log', 'admin-attendance-view'] },
]

export const KIND_LABEL = { view: 'Hanya melihat', act: 'Bisa mengubah' }

// The guru's home: one card for each special access they were given, to where it is used. A feature not listed
// here shows nothing (and the section hides when nothing shows).
export const ACCESS_CARDS = [
  { id: 'admin-attendance-view', label: 'Rekap Absensi', hint: 'Absensi semua guru, unduh PDF/Excel', to: '/dashboard/admin-attendance', icon: 'calendar' },
  { id: 'kbm-monitor', label: 'Monitor KBM', hint: 'Kelengkapan KBM semua guru', to: '/dashboard/kbm-monitor', icon: 'check' },
  { id: 'pendaftaran', label: 'Pendaftaran santri', hint: 'Pendaftar baru dan usulan santri dari guru', to: '/dashboard/pendaftaran', icon: 'file' },
  { id: 'wa-log', label: 'Riwayat WA Bot', hint: 'Semua pesan bot WhatsApp', to: '/dashboard/wa-log', icon: 'clock' },
  { id: 'kegiatan-manage', label: 'Kelola kegiatan', hint: 'Buat dan ubah kegiatan, peserta semua jilid', to: '/dashboard/kegiatan', icon: 'star' },
  { id: 'all-jilid', label: 'Semua jilid', hint: 'Lihat santri, data wali, dan izin semua jilid', to: '/dashboard/santri', icon: 'users' },
  { id: 'absen-santri-backdate', label: 'Absen Santri tanpa batas hari', hint: 'Isi atau ubah absen hari-hari lalu', to: '/dashboard/absen-santri', icon: 'calendar' },
]

// Old ids still stored on some accounts, read as what they became ("Export PDF" is part of "Rekap Absensi")
const ALIASES = { 'export-pdf': 'admin-attendance-view' }
export function withAliases(features) {
  if (!Array.isArray(features)) return features
  const out = new Set(features)
  for (const [old, now] of Object.entries(ALIASES)) if (out.has(old)) out.add(now)
  return [...out]
}
