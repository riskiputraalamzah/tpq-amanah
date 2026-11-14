// Kegiatan (munaqosyah, wisuda, ...): labels and formats shared by the teachers' pages and the wali portal.
// The data itself comes from the backend (services/activity_service.js); payment is worked out there.

export const ACTIVITY_TYPES = [
  { value: 'munaqosyah', label: 'Munaqosyah' },
  { value: 'wisuda', label: 'Wisuda' },
  { value: 'rihlah', label: 'Rihlah' },
  { value: 'lomba', label: 'Lomba' },
  { value: 'lainnya', label: 'Lainnya' },
]

export const PARTICIPANT_STATUSES = [
  { value: 'terdaftar', label: 'Terdaftar' },
  { value: 'siap', label: 'Siap ikut' },
  { value: 'lulus', label: 'Lulus' },
  { value: 'tidak_lulus', label: 'Belum lulus' },
  { value: 'batal', label: 'Tidak jadi ikut' },
]

// payment state -> the pill tone used in both places (wali.css w-pill / the teachers' kg-pill)
export const PAYMENT_TONE = { lunas: 'ok', sebagian: 'warn', belum: 'danger', gratis: 'idle' }
export const STATUS_TONE = { terdaftar: 'info', siap: 'ok', lulus: 'ok', tidak_lulus: 'warn', batal: 'idle' }

export function formatRupiah(n) {
  const v = Math.round(Number(n) || 0)
  return `Rp${v.toLocaleString('id-ID')}`
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

// "2026-12-07" -> "Senin, 7 Desember 2026"; empty or invalid -> ""
export function dayLabel(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''))
  if (!m) return ''
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  return `${DAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()]}, ${d} ${MONTHS[mo - 1]} ${y}`
}

// How much was paid, in one line: "Rp100.000 dari Rp150.000", "Lunas (Rp150.000)", "Tanpa biaya"
export function paymentLine(p) {
  if (!p || p.state === 'gratis') return 'Tanpa biaya'
  if (p.state === 'lunas') return p.manual ? `Lunas (dicatat manual${p.manualNote ? `: ${p.manualNote}` : ''})` : `Lunas (${formatRupiah(p.fee)})`
  if (p.state === 'sebagian') return `${formatRupiah(p.paid)} dari ${formatRupiah(p.fee)}, kurang ${formatRupiah(p.remaining)}`
  return `Belum ada setoran, biaya ${formatRupiah(p.fee)}`
}

// The summary tiles of an activity from its participants (cancelled ones do not count)
export function summarize(participants = []) {
  const active = participants.filter((p) => p.status !== 'batal')
  return {
    total: active.length,
    lunas: active.filter((p) => p.payment.state === 'lunas' || p.payment.state === 'gratis').length,
    belum: active.filter((p) => p.payment.state === 'belum' || p.payment.state === 'sebagian').length,
    lengkap: active.filter((p) => p.requirementsTotal > 0 && p.requirementsDone === p.requirementsTotal).length,
    withRequirements: active.some((p) => p.requirementsTotal > 0),
  }
}
