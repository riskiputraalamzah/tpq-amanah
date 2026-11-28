// Panduan (user guide) per role: what each menu is for, the main tasks step by step with phone screenshots, and
// "Yang baru" (release notes) at the top. One place to edit: add a release here when a feature ships.
//
// Screenshots: public/panduan/<file>.jpg, taken on a 390px phone from the emulator with made-up names
// (scratchpad e2e/shots-panduan.cjs). A test checks every menu of the dashboard is described here.

export const ROLE_LABEL = { admin: 'Admin', guru: 'Guru', wali: 'Wali santri' }

// newest first. topics: the guide topic of each role that explains it
export const RELEASES = [
  {
    id: '2026-11-rapor',
    date: '2026-11-28',
    title: 'Rapor digital (Laporan Perkembangan Santri)',
    roles: ['admin', 'guru', 'wali'],
    topics: { admin: 'rapor-admin', guru: 'rapor-guru', wali: 'rapor-wali' },
    points: {
      admin: ['Buka satu periode untuk semua jilid, terbitkan per jilid', 'Pilih Kepala TPQ; tanda tangannya tercetak di setiap rapor', 'Kenaikan jilid langsung dari hasil rapor'],
      guru: ['Isi rapor di HP: nilai A/B/C otomatis, kehadiran otomatis dari Absen Santri', 'Tersimpan otomatis, tekan "Selesai & paraf" bila lengkap'],
      wali: ['Rapor ananda muncul di portal setelah diterbitkan', 'Tulis catatan untuk ustadz/ustadzah lalu tanda tangan', 'Unduh PDF seperti rapor kertas'],
    },
  },
  {
    id: '2026-11-kps',
    date: '2026-11-28',
    title: 'Kartu Prestasi Santri (nilai harian mengaji)',
    roles: ['admin', 'guru', 'wali'],
    topics: { admin: 'kps-admin', guru: 'kps-guru', wali: 'kps-wali' },
    points: {
      admin: ['Guru mengisi tes mengaji dari Absen Santri (mode "Tes mengaji")', 'Wali menerima kabar WA dan memaraf di portal'],
      guru: ['Satu ketukan Lanjut / Ulang per santri, halaman otomatis', 'Nilai & catatan boleh dikosongkan; lupa saat KBM boleh diisi malamnya'],
      wali: ['Lihat halaman dan nilai ananda setiap kali dites', 'Paraf langsung dari HP, cetak kartu A4', 'Pilih kabar WA: harian, mingguan, atau tidak usah'],
    },
  },
  {
    id: '2026-11-ttd',
    date: '2026-11-28',
    title: 'Tanda tangan digital',
    roles: ['admin', 'guru', 'wali'],
    topics: { admin: 'ttd', guru: 'ttd', wali: 'ttd-wali' },
    points: {
      admin: ['Gambar sekali di Profil, dipakai untuk setiap paraf'],
      guru: ['Gambar sekali di Profil Saya; paraf di kartu prestasi & rapor otomatis'],
      wali: ['Gambar sekali di menu Akun, setiap paraf cukup satu ketukan'],
    },
  },
]

const shot = (file, caption) => ({ src: `/panduan/${file}.jpg`, caption })

/* ------------------------------------------------------------------ wali */
const WALI = {
  intro:
    'Portal wali santri untuk memantau ananda dari HP: kehadiran, kartu prestasi mengaji, rapor, izin, pengumuman, dan kegiatan. Masuk cukup dengan nomor WhatsApp, tanpa password.',
  menus: [
    {
      title: 'Menu bawah',
      items: [
        { label: 'Beranda', to: '/wali', desc: 'Kartu setiap ananda: kehadiran bulan ini, Kartu prestasi, Izin, Rapor & jilid, Kegiatan & tabungan.' },
        { label: 'Izin', to: '/wali/izin', desc: 'Kabarkan ananda izin atau sakit ke ustadz/ustadzah.' },
        { label: 'Pengumuman', to: '/wali/pengumuman', desc: 'Pengumuman dari TPQ (libur, kegiatan, dll).' },
        { label: 'Akun', to: '/wali/akun', desc: 'Nama Ayah/Bunda, data ananda, kabar WA kartu prestasi, tanda tangan, panduan, keluar.' },
      ],
    },
    {
      title: 'Di kartu ananda (Beranda)',
      items: [
        { label: 'Kartu prestasi', desc: 'Catatan tes mengaji harian, posisi halaman, dan paraf.' },
        { label: 'Izin / sakit', desc: 'Ajukan atau batalkan izin ananda.' },
        { label: 'Rapor & jilid', desc: 'Rapor yang sudah terbit dan riwayat jilid.' },
        { label: 'Kegiatan & tabungan', desc: 'Kegiatan yang diikuti (munaqosyah, dll) dan tabungannya.' },
        { label: 'Riwayat & materi', desc: 'Kehadiran per bulan dan materi yang diajarkan.' },
      ],
    },
  ],
  topics: [
    {
      id: 'masuk',
      title: 'Masuk ke portal wali',
      summary: 'Masuk dengan nomor WhatsApp yang terdaftar. Kode masuk dikirim lewat WhatsApp TPQ.',
      steps: ['Buka halaman Masuk, pilih "Wali santri".', 'Ketik nomor WhatsApp Ayah/Bunda, tekan kirim kode.', 'Masukkan 6 angka kode dari WhatsApp. Selesai, Ayah/Bunda tetap masuk sampai 30 hari.'],
      tips: ['Belum melihat ananda? Tautkan dengan kode dari slip kertas (menu Akun > Tambah anak lain).'],
    },
    {
      id: 'beranda-wali',
      title: 'Beranda: semua tentang ananda',
      summary: 'Setiap ananda punya satu kartu: kehadiran bulan ini dan empat tombol cepat.',
      steps: ['Lihat jumlah hadir, izin, sakit, dan alfa bulan ini.', 'Tombol Kartu prestasi menampilkan angka bila ada tes yang belum diparaf.', 'Ketuk "Riwayat & materi" untuk melihat materi yang diajarkan.'],
      shots: [shot('wali-beranda', 'Beranda wali dengan kartu ananda')],
    },
    {
      id: 'kps-wali',
      title: 'Kartu prestasi & paraf',
      summary: 'Pengganti buku kartu prestasi. Setiap kali ananda dites mengaji, catatannya muncul di sini.',
      steps: [
        'Dari Beranda, ketuk "Kartu prestasi".',
        'Lihat posisi ananda sekarang (misalnya Jilid 3 halaman 16 dari 36) dan riwayat tes.',
        'Setiap tes berisi halaman, Lanjut / Ulang, nilai (bila diisi), catatan, dan paraf ustadz/ustadzah.',
        'Tekan "Paraf" pada satu tes, atau "Paraf semua" untuk semua yang belum.',
        'Butuh versi kertas? Tekan "Cetak / PDF" lalu pilih "Simpan sebagai PDF".',
      ],
      tips: ['Kriteria nilai: A 8,6–10, B 7,6–8,5, C 7,5 ke bawah. Nilai boleh tidak diisi ustadz/ustadzah.', 'Paraf tercatat atas akun dan waktunya.'],
      shots: [shot('wali-kartu', 'Kartu prestasi ananda'), shot('wali-kartu-cetak', 'Kartu prestasi versi cetak (A4)')],
    },
    {
      id: 'kabar-wa',
      title: 'Kabar WhatsApp kartu prestasi',
      summary: 'Ayah/Bunda bisa memilih seberapa sering dikabari lewat WhatsApp.',
      steps: ['Buka menu Akun.', 'Di bagian "Kartu prestasi", pilih: Setiap hari ananda dites, Rekap mingguan (Ahad pagi), atau Tidak usah.'],
      tips: ['Pesan harian dikirim sekitar 45 menit setelah ngaji selesai; kakak-adik digabung dalam satu pesan.', 'Malam (21.00–06.30) tidak ada pesan; yang tertunda dikirim pagi.'],
      shots: [shot('wali-akun', 'Pilihan kabar prestasi di menu Akun')],
    },
    {
      id: 'rapor-wali',
      title: 'Rapor: membaca, memberi catatan, tanda tangan',
      summary: 'Rapor muncul setelah diterbitkan TPQ. Ayah/Bunda dikabari lewat WhatsApp.',
      steps: [
        'Dari Beranda, ketuk "Rapor & jilid", lalu pilih rapornya.',
        'Bagian atas: rata-rata, kriteria, ranking di jilidnya, dan keterangan naik jilid.',
        'Gulir untuk melihat nilai per mata pelajaran, kehadiran, ragam perkembangan, dan catatan ustadzah.',
        'Tulis catatan (masukan, terima kasih, atau pertanyaan) lalu tekan "Kirim & tanda tangan".',
        'Tekan "Unduh PDF" untuk menyimpan rapor seperti versi kertas.',
      ],
      tips: ['Catatan masih bisa diperbarui setelah dikirim; ustadz/ustadzah jilidnya diberi kabar.'],
      shots: [shot('wali-rapor', 'Ringkasan rapor'), shot('wali-rapor-catatan', 'Catatan dari Ayah/Bunda dan tanda tangan')],
    },
    {
      id: 'ttd-wali',
      title: 'Tanda tangan saya',
      summary: 'Gambar tanda tangan sekali; setiap paraf memakai gambar itu. Tidak wajib.',
      steps: ['Buka Akun > Tanda tangan saya.', 'Coret tanda tangan di kotak dengan jari, lalu tekan "Simpan tanda tangan".'],
      tips: ['Tanpa gambar, paraf tetap tercatat sebagai nama + centang.'],
      shots: [shot('wali-ttd', 'Menggambar tanda tangan')],
    },
    {
      id: 'izin-wali',
      title: 'Izin atau sakit',
      summary: 'Kabarkan ustadz/ustadzah bila ananda tidak bisa datang.',
      steps: ['Ketuk menu Izin (atau tombol Izin / sakit di kartu ananda).', 'Pilih hari, izin atau sakit, dan tulis alasannya.', 'Kirim. Ustadz/ustadzah jilidnya langsung tahu; izin bisa dibatalkan selama hari itu belum lewat.'],
      tips: ['Izin bisa untuk hari ini (sejak 07.00 sampai sesi selesai) atau sampai 7 hari ke depan.'],
      shots: [shot('wali-izin', 'Mengajukan izin')],
    },
    {
      id: 'absen-keliru',
      title: 'Absen ananda keliru?',
      summary: 'Bila tercatat alfa padahal hadir/izin, laporkan dari halaman Riwayat & materi.',
      steps: ['Buka Riwayat & materi ananda.', 'Pada hari yang tercatat alfa (7 hari terakhir), tekan "Laporkan absen keliru".', 'Ustadz/ustadzah jilidnya memeriksa dan membetulkan.'],
    },
    {
      id: 'data-ananda',
      title: 'Data ananda & tautkan anak',
      summary: 'Lengkapi data ananda untuk administrasi TPQ, dan tautkan saudara ananda.',
      steps: ['Akun > pilih nama ananda untuk melihat / mengubah data.', 'Akun > Tambah anak lain: ketik kode dari slip kertas, atau minta kodenya ke ustadz/ustadzah.'],
    },
    {
      id: 'lainnya-wali',
      title: 'Pengumuman, kegiatan, tabungan, saran',
      summary: 'Info lain dari TPQ dalam satu portal.',
      steps: ['Pengumuman: menu bawah.', 'Kegiatan & tabungan: tombol di kartu ananda (biaya, persyaratan, info terbaru).', 'Saran & kritik: menu Akun > Bantuan & masukan.'],
    },
  ],
}

/* ------------------------------------------------------------------ guru */
const GURU = {
  intro:
    'Dashboard ustadz/ustadzah: absensi diri, KBM dan jurnal, absen santri, tes mengaji (kartu prestasi), rapor, data santri dan wali. Semua bisa dari HP.',
  menus: [
    {
      title: 'Mengajar',
      items: [
        { label: 'Absensi Saya', to: '/dashboard/attendance', desc: 'Tandai hadir / izin / sakit Antum. Hadir dibuka saat sesi Antum dimulai.' },
        { label: 'KBM / Mengajar', to: '/dashboard/kbm', desc: 'Kalender KBM; isi KBM: absen santri + jurnal (materi, catatan untuk wali).' },
        { label: 'Absen Santri', to: '/dashboard/absen-santri', desc: 'Absen santri per sesi (PJ Absen), titip santri, dan mode "Tes mengaji".' },
        { label: 'Izin Santri', to: '/dashboard/izin-santri', desc: 'Izin/sakit dari wali dan yang dicatat guru.' },
        { label: 'Rapor', to: '/dashboard/rapor', desc: 'Isi rapor santri jilid Antum saat periode dibuka admin.' },
      ],
    },
    {
      title: 'Santri & Wali',
      items: [
        { label: 'Data Santri', to: '/dashboard/santri', desc: 'Santri jilid Antum: naik jilid, usulan santri baru, ubah nama panggilan.' },
        { label: 'Data Wali Santri', to: '/dashboard/wali-santri', desc: 'Periksa data ananda dari wali, kode tautan untuk wali.' },
        { label: 'Hubungi Wali', to: '/dashboard/hubungi-wali', desc: 'Chat / telepon wali santri dari HP Antum.' },
        { label: 'Tabungan', to: '/dashboard/savings', desc: 'Buku tabungan yang Antum kelola.' },
      ],
    },
    {
      title: 'Akses Khusus & Akun',
      items: [
        { label: 'Akses Khusus', desc: 'Muncul bila admin memberi akses tambahan (Monitor KBM, Pendaftaran, Riwayat WA Bot, Kegiatan, Dokumentasi, dll).' },
        { label: 'Profil Saya', to: '/dashboard/profile', desc: 'Data diri dan tanda tangan untuk paraf.' },
        { label: 'Panduan', to: '/dashboard/panduan', desc: 'Halaman ini.' },
      ],
    },
  ],
  topics: [
    {
      id: 'absensi-guru',
      title: 'Absensi Saya',
      summary: 'Tandai kehadiran Antum setiap hari mengajar.',
      steps: ['Buka Absensi Saya (atau tombol tengah di menu bawah).', 'Tekan Hadir saat sesi Antum sudah dimulai; izin/sakit bisa dikabarkan lebih awal.'],
      tips: ['Absen santri dan tes mengaji hanya bisa diisi guru yang sudah hadir hari itu.'],
    },
    {
      id: 'absen-santri',
      title: 'Absen Santri & PJ Absen',
      summary: 'Satu daftar untuk semua santri sesi itu. Guru pertama yang membuka absen menjadi PJ Absen sesi.',
      steps: [
        'Buka Absen Santri, pilih sesi Sore / Malam.',
        'Tahan tombol "Buka Absen" untuk menjadi PJ (guru berikutnya ikut membantu).',
        'Ketuk Hadir / Izin / Sakit / Alfa di setiap santri; ketuk lagi untuk menghapus. Tersimpan otomatis.',
        'Santri jilid lain yang ikut sesi ini: tampilkan jilid lain atau pakai "Titip santri".',
      ],
      tips: ['Bisa diubah sampai 24.00, besok paginya sampai 12.00 dengan konfirmasi.', 'Izin dari wali terkunci; pakai "Ubah status" bila perlu.'],
    },
    {
      id: 'kps-guru',
      title: 'Tes mengaji (Kartu Prestasi)',
      summary: 'Pengganti kartu prestasi kertas. Isi yang dites saja, tidak wajib semua santri.',
      steps: [
        'Di Absen Santri, pilih mode "Tes mengaji". Yang tampil hanya santri yang sudah ditandai hadir.',
        'Ketuk Lanjut (lanjut halaman berikutnya) atau Ulang (mengulang halaman yang sama). Halaman terisi otomatis dari tes terakhir.',
        'Santri yang belum pernah dites: ketuk "Atur hal." sekali untuk memilih jilid & halamannya.',
        'Ikon pensil: isi nilai (boleh kosong, kriteria A/B/C otomatis), catatan cepat, atau tes Al-Qur\'an / hafalan (surat & ayat).',
        'Ketuk pilihan yang sama lagi untuk membatalkan tes.',
      ],
      tips: ['Paraf ustadz/ustadzah otomatis atas nama Antum.', 'Lupa saat KBM? Bisa diisi sampai 24.00, atau besok sampai 12.00 dengan memilih tanggal kemarin.', 'Wali dikabari lewat WA sekitar 45 menit setelah sesi; masih bisa dibetulkan sebelum itu.', 'Sinyal putus? Ketukan disimpan dan dikirim ulang otomatis.'],
      shots: [shot('guru-tes', 'Mode Tes mengaji: Lanjut / Ulang'), shot('guru-tes-sheet', 'Nilai, catatan, dan jenis tes')],
    },
    {
      id: 'kbm',
      title: 'KBM & jurnal',
      summary: 'Catat KBM Antum: absen santri dan jurnal materi.',
      steps: ['Buka KBM / Mengajar, pilih tanggal di kalender lalu isi KBM.', 'Isi materi utama, materi penunjang, dan catatan guru. Materi penunjang dan catatan tampil di portal wali.'],
    },
    {
      id: 'rapor-guru',
      title: 'Mengisi rapor',
      summary: 'Saat admin membuka periode rapor, isi rapor santri jilid Antum dari HP.',
      steps: [
        'Buka Rapor, pilih periode, lalu pilih santri.',
        'Isi nilai A. Inti (wajib) dan B. Penunjang (boleh kosong). Tekan Enter di keyboard untuk pindah ke nilai berikutnya.',
        'Kehadiran terisi otomatis dari Absen Santri; tekan "Ubah" bila perlu.',
        'Pilih sikap & sifat, Naik / Belum naik, lalu tulis catatan untuk wali.',
        'Tekan "Selesai & paraf". Lanjut ke santri berikutnya dengan tombol ›.',
      ],
      tips: ['Semua tersimpan otomatis. Mengubah rapor yang sudah selesai membuatnya draf lagi.', 'Rapor yang diminta revisi admin bertanda merah beserta catatannya.', 'Wali melihat rapor setelah admin menerbitkannya.'],
      shots: [shot('guru-rapor-list', 'Daftar santri dan statusnya'), shot('guru-rapor-isi', 'Mengisi nilai rapor di HP')],
    },
    {
      id: 'data-santri-guru',
      title: 'Data santri, naik jilid, usulan santri baru',
      summary: 'Kelola santri jilid Antum.',
      steps: ['Data Santri: ubah nama panggilan, naikkan jilid santri (bisa dibatalkan 24 jam).', 'Usulkan santri baru; admin yang menyetujui.'],
    },
    {
      id: 'wali-guru',
      title: 'Data wali & menghubungi wali',
      summary: 'Bantu wali tertaut ke portal dan periksa data ananda.',
      steps: ['Data Wali Santri: periksa data yang dikirim wali (verifikasi / minta perbaikan), buat kode tautan.', 'Hubungi Wali: chat WhatsApp atau telepon dari HP Antum.'],
    },
    {
      id: 'ttd',
      title: 'Tanda tangan saya',
      summary: 'Gambar sekali di Profil Saya. Dipakai di kartu prestasi, rapor, dan hasil cetak.',
      steps: ['Buka Profil Saya, gulir ke "Tanda tangan saya".', 'Coret dengan jari atau mouse, lalu tekan "Simpan tanda tangan".'],
      tips: ['Kepala TPQ yang dipilih admin punya kotak kedua: tanda tangan resmi untuk rapor.'],
      shots: [shot('guru-ttd', 'Tanda tangan di Profil Saya')],
    },
  ],
}

/* ------------------------------------------------------------------ admin */
const ADMIN = {
  intro: 'Dashboard admin TPQ: santri & wali, belajar mengajar, rapor, keuangan, WhatsApp, dan pengaturan.',
  menus: [
    {
      title: 'Santri & Wali',
      items: [
        { label: 'Kelola Santri', to: '/dashboard/santri', desc: 'Tambah, ubah jilid/status, nonaktifkan santri; riwayat naik jilid.' },
        { label: 'Pendaftaran', to: '/dashboard/pendaftaran', desc: 'Pendaftar online, jadwal, terima santri; "Daftarkan langsung" untuk yang datang ke TPQ.' },
        { label: 'Data Wali Santri', to: '/dashboard/wali-santri', desc: 'Verifikasi data ananda, kode tautan, wali tertaut.' },
        { label: 'Hubungi Wali', to: '/dashboard/hubungi-wali', desc: 'Nomor wali tertaut, chat atau telepon.' },
        { label: 'Saran & Kritik Wali', to: '/dashboard/masukan-wali', desc: 'Masukan dari wali dan tanggapannya.' },
        { label: 'Kegiatan', to: '/dashboard/kegiatan', desc: 'Munaqosyah dan kegiatan lain: peserta, biaya, persyaratan, info ke wali.' },
      ],
    },
    {
      title: 'Belajar Mengajar',
      items: [
        { label: 'Absen Santri', to: '/dashboard/absen-santri', desc: 'Absen semua sesi, audit, liburkan sesi, mode Tes mengaji.' },
        { label: 'Izin Santri', to: '/dashboard/izin-santri', desc: 'Semua izin/sakit santri.' },
        { label: 'Monitor KBM', to: '/dashboard/kbm-monitor', desc: 'Kelengkapan KBM setiap guru.' },
        { label: 'Rekap Absensi Guru', to: '/dashboard/admin-attendance', desc: 'Absensi guru per bulan, unduh PDF/Excel.' },
        { label: 'Rapor', to: '/dashboard/rapor', desc: 'Periode rapor, Kepala TPQ, terbitkan per jilid, kenaikan jilid.' },
      ],
    },
    {
      title: 'Keuangan',
      items: [
        { label: 'Tabungan Santri', to: '/dashboard/admin-savings', desc: 'Buku tabungan dan transaksi.' },
        { label: 'LPJ Insentif Guru', to: '/dashboard/lpj-insentif', desc: 'LPJ insentif, dokumen, dan paket bulanan.' },
      ],
    },
    {
      title: 'Komunikasi',
      items: [
        { label: 'Pusat WhatsApp', to: '/dashboard/whatsapp', desc: 'Status bot, riwayat & antrean pesan, broadcast, pengingat guru.' },
        { label: 'Pengumuman Wali', to: '/dashboard/pengumuman-wali', desc: 'Pengumuman di portal wali (opsional WA).' },
        { label: 'Pengumuman Guru & Web', to: '/dashboard/announcements', desc: 'Pengumuman untuk guru dan halaman depan website.' },
      ],
    },
    {
      title: 'Pengaturan',
      items: [
        { label: 'Profil TPQ', to: '/dashboard/tpq-profile', desc: 'Data lembaga.' },
        { label: 'Kelola Pengajar', to: '/dashboard/teachers', desc: 'Jilid yang diampu, akses khusus, koordinator.' },
        { label: 'Akun Pengguna', to: '/dashboard/users', desc: 'Akun admin & guru, password.' },
        { label: 'Dokumentasi', to: '/dashboard/dokumentasi', desc: 'Foto/video kegiatan di website, komentar wali.' },
        { label: 'Konten Website', to: '/dashboard/content', desc: 'Isi halaman depan website.' },
        { label: 'Panduan', to: '/dashboard/panduan', desc: 'Halaman ini (panduan admin, guru, dan wali).' },
      ],
    },
  ],
  topics: [
    {
      id: 'beranda-admin',
      title: 'Beranda admin',
      summary: 'Semua yang perlu ditindaklanjuti ada di bagian atas Beranda.',
      steps: ['"Perlu ditindaklanjuti" hanya menampilkan yang ada isinya; ketuk untuk langsung ke halamannya.', 'Hari ini: absen per sesi, guru, KBM, dan WhatsApp.'],
    },
    {
      id: 'rapor-admin',
      title: 'Rapor: dari membuka periode sampai kenaikan jilid',
      summary: 'Satu periode untuk semua jilid, diterbitkan per jilid.',
      steps: [
        'Buka Rapor, pilih Kepala TPQ (guru yang tanda tangannya tercetak di rapor). Minta beliau menyimpan tanda tangan di Profil Saya.',
        'Tekan "+ Buka periode": nama, tahun ajaran, rentang kehadiran, batas pengisian, tanggal rapor, dan nama Penunjang no. 6–7 bila ada.',
        'Pantau papan per jilid: belum diisi, draf, perlu revisi, selesai, terbit.',
        'Tekan "Terbitkan Jilid X" bila rapor sudah selesai. Ranking dihitung, wali dikabari lewat WA.',
        'Menu ⋯ di setiap santri: lihat/cetak, minta revisi (guru dikabari), tarik kembali, buka susulan, terbitkan satu saja.',
        'Setelah terbit, tekan "Terapkan kenaikan" untuk memindahkan santri yang dinyatakan naik.',
      ],
      tips: ['Setelah "Tutup pengisian", hanya santri yang dibuka susulan yang masih bisa diisi guru.', 'Rapor yang belum terbit tercetak dengan tanda DRAF.'],
      shots: [shot('admin-rapor-home', 'Kepala TPQ dan periode rapor'), shot('admin-rapor-board', 'Papan rapor per jilid')],
    },
    {
      id: 'kps-admin',
      title: 'Kartu Prestasi (tes mengaji harian)',
      summary: 'Diisi guru di Absen Santri > Tes mengaji; wali melihat dan memaraf di portal.',
      steps: ['Admin bisa mengisi atau membetulkan tes kapan saja dari Absen Santri (pilih tanggal & sesi, mode Tes mengaji).', 'Pesan WA ke wali tampil di Pusat WhatsApp > Riwayat & Antrean (kategori Info wali).'],
      tips: ['Wali memilih sendiri kabar harian / mingguan / tidak usah di portal.'],
    },
    {
      id: 'pendaftaran-admin',
      title: 'Pendaftaran santri baru',
      summary: 'Dari pendaftar online sampai menjadi santri dengan nomor induk.',
      steps: ['Pendaftaran: hubungi, beri jadwal, lalu "Terima" (nomor induk, wali tertaut otomatis).', '"Daftarkan langsung" untuk pendaftar yang datang ke TPQ.'],
    },
    {
      id: 'absen-admin',
      title: 'Absen Santri, izin, dan libur sesi',
      summary: 'Admin melihat semua sesi dan bisa mengubah hari-hari lalu.',
      steps: ['Absen Santri: pilih tanggal & sesi; "Liburkan sesi" untuk hujan/kegiatan.', 'Izin Santri: semua izin dari wali dan guru.', 'Kabar alfa ke wali otomatis setelah sesi, bisa dinyalakan/dimatikan.'],
    },
    {
      id: 'wa-admin',
      title: 'Pusat WhatsApp',
      summary: 'Pantau bot dan semua pesan otomatis.',
      steps: ['Ringkasan: status bot dan pesan hari ini.', 'Riwayat & Antrean: pesan terkirim, gagal, dan yang ditahan sampai 06.30.', 'Broadcast dan Pengingat Guru.'],
    },
    {
      id: 'pengajar-admin',
      title: 'Kelola pengajar & akses khusus',
      summary: 'Atur jilid yang diampu guru dan akses tambahan.',
      steps: ['Kelola Pengajar: jilid tiap guru, "Jadikan koordinator", akses khusus.', 'Akun Pengguna: buat akun guru/admin dan atur password.'],
    },
    {
      id: 'ttd',
      title: 'Tanda tangan',
      summary: 'Admin juga bisa menyimpan tanda tangan di Profil (ketuk foto di pojok kanan atas).',
      steps: ['Buka Profil, gulir ke "Tanda tangan saya", coret lalu simpan.'],
    },
  ],
}

export const GUIDES = { admin: ADMIN, guru: GURU, wali: WALI }

// the roles a person may read: admin all, guru guru + wali (to explain to parents), wali / guest only wali
export const rolesFor = (role) => (role === 'admin' ? ['admin', 'guru', 'wali'] : role === 'guru' ? ['guru', 'wali'] : ['wali'])

// "Baru": releases for this role this device has not opened yet (by id, so two releases of one day both count)
const SEEN_KEY = (role) => `tpq.panduan.seen.${role}`
const readSeen = (role, storage) => {
  try {
    const v = JSON.parse(storage?.getItem(SEEN_KEY(role)) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
export function unseenReleases(role, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  const seen = new Set(readSeen(role, storage))
  return RELEASES.filter((r) => r.roles.includes(role) && !seen.has(r.id))
}
export function markReleasesSeen(role, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  try {
    storage?.setItem(SEEN_KEY(role), JSON.stringify(RELEASES.filter((r) => r.roles.includes(role)).map((r) => r.id)))
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('panduan-seen'))
  } catch {
    /* private mode */
  }
}
