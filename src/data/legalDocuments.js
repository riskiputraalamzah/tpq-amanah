// Legal documents shown on the landing page.
//
// The files in /public/legalitas are web copies of the originals: reduced in size, and the SK has
// its personal data (birth date, home address, teacher ID) painted out inside the image itself.
// The originals in /public/sertif must never be referenced from the app.
//
// Vercel caches .webp files for a year. When a file is replaced under the same name, raise
// `version` so visitors do not keep seeing the old one.
export const legalDocuments = [
  {
    id: 'tanda-daftar-lpq',
    title: "Tanda Daftar Lembaga Pendidikan Al-Qur'an",
    issuer: 'Kementerian Agama Kabupaten Sidoarjo',
    summary: 'NSQ 411235151939',
    facts: ['Nomor 472 Tahun 2026', 'NSQ 411235151939', 'Berlaku 20 Oktober 2026 sampai 20 Oktober 2031'],
    image: '/legalitas/tanda-daftar-lpq.webp',
    thumb: '/legalitas/tanda-daftar-lpq-thumb.webp',
    width: 1241,
    height: 1754,
    version: 1,
    redacted: false,
    alt: "Tanda Daftar Lembaga Pendidikan Al-Qur'an untuk TPQ Amanah dari Kementerian Agama Kabupaten Sidoarjo, Nomor 472 Tahun 2026, dengan Nomor Statistik 411235151939",
  },
  {
    id: 'piagam-bmq-at-tartil',
    title: 'Piagam Penetapan Nomor Unit',
    issuer: "Yayasan Belajar Membaca Al-Qur'an (BMQ) At-Tartil",
    summary: 'Nomor unit KP/03661/B-07/IX/2026-0294',
    facts: ['Nomor unit KP/03661/B-07/IX/2026-0294', 'Diterbitkan 16 September 2026', 'Berlaku sampai 16 September 2029'],
    image: '/legalitas/piagam-bmq-at-tartil.webp',
    thumb: '/legalitas/piagam-bmq-at-tartil-thumb.webp',
    width: 860,
    height: 1280,
    version: 1,
    redacted: false,
    alt: "Piagam Penetapan Nomor Unit TPQ Amanah dari Yayasan Belajar Membaca Al-Qur'an (BMQ) At-Tartil Kantor Pusat Sidoarjo, nomor KP/03661/B-07/IX/2026-0294",
  },
  {
    id: 'sk-kepala-tpq',
    title: 'SK Pengangkatan Kepala TPQ',
    issuer: "Yayasan Belajar Membaca Al-Qur'an (BMQ) At-Tartil",
    summary: 'No. KP/03847/B-02/X/2026',
    facts: ['No. KP/03847/B-02/X/2026', 'Ditetapkan 2 Oktober 2026', 'Berlaku sampai 16 September 2029'],
    image: '/legalitas/sk-kepala-tpq.webp',
    thumb: '/legalitas/sk-kepala-tpq-thumb.webp',
    width: 832,
    height: 1280,
    version: 1,
    redacted: true,
    alt: "Surat Keputusan pengangkatan Kepala TPQ Amanah dari Yayasan Belajar Membaca Al-Qur'an At-Tartil, nomor KP/03847/B-02/X/2026. Data pribadi disamarkan.",
  },
]

export function documentSrc(doc, kind = 'full') {
  const file = kind === 'thumb' ? doc.thumb : doc.image
  return `${file}?v=${doc.version}`
}
