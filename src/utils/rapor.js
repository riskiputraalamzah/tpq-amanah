// Rapor on the screen: the same subjects and rules as backend/src/utils/rapor.js (a test compares them)
import { gradeOf } from './kps.js'

export const INTI = [
  ['makhorijul', 'Makhorijul Huruf'],
  ['tajwid', 'Ulumut Tajwid'],
  ['shifatul', 'Shifatul Huruf'],
  ['tartil', 'Tartil'],
  ['ghorib', 'Ghorib / Musykilat'],
  ['akhlaq', 'Akhlaq'],
]
export const PENUNJANG = [
  ['sholat', 'Bacaan Sholat'],
  ['doa', "Hafalan Do'a sehari-hari"],
  ['surat', 'Hafalan Surat-surat'],
  ['khot', 'Khot / Menulis'],
  ['menyanyi', 'Menyanyi'],
]
export const SIKAP = [
  ['a', 'Kebersihan dan kerapian'],
  ['b', 'Aktifitas'],
  ['c', 'Kedisiplinan'],
  ['d', 'Kerjasama'],
  ['e', 'Kepatuhan'],
  ['f', 'Ketelitian'],
]
export const SIFAT = [
  ['g', 'Menangis'],
  ['h', 'Mengganggu'],
  ['i', 'Terlambat'],
]
export const SIKAP_OPTIONS = [
  ['baik', 'Baik'],
  ['cukup', 'Cukup'],
  ['kurang', 'Kurang'],
]
export const SIFAT_OPTIONS = [
  ['tidak', 'Tdk pernah'],
  ['jarang', 'Jarang'],
  ['sering', 'Sering'],
]
export const VALUE_LABEL = { baik: 'Baik', cukup: 'Cukup', kurang: 'Kurang', tidak: 'Tidak pernah', jarang: 'Jarang', sering: 'Sering' }
export const STATUS = {
  empty: { label: 'Belum diisi', tone: 'muted' },
  draft: { label: 'Draf', tone: 'warn' },
  revision: { label: 'Perlu revisi', tone: 'danger' },
  done: { label: 'Selesai', tone: 'ok' },
  published: { label: 'Terbit', tone: 'dark' },
}
export const PERIOD_STATUS = {
  draft: { label: 'Draf (belum dibuka)', tone: 'muted' },
  open: { label: 'Dibuka', tone: 'ok' },
  closed: { label: 'Ditutup', tone: 'dark' },
}

export const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id && id !== '-' ? `Jilid ${id}` : 'Belum ada jilid')
export const normalizeLevel = (value) => {
  const s = String(value ?? '').trim().toLowerCase()
  return ['7', '8', '9', 'marhalah'].includes(s) || s.includes('marhalah') ? '7' : s
}
export function subjectsOf(period = {}) {
  const extra = Array.isArray(period.extraSubjects) ? period.extraSubjects : []
  return {
    inti: INTI.map(([key, label]) => ({ key, label })),
    penunjang: [
      ...PENUNJANG.map(([key, label]) => ({ key, label })),
      ...['p6', 'p7'].map((key, i) => ({ key, label: String(extra[i] || '').trim() })).filter((s) => s.label),
    ],
  }
}
const round1 = (n) => Math.round(n * 10) / 10
export function summaryOf(scores = {}, period = {}) {
  const s = subjectsOf(period)
  const vals = [...s.inti, ...s.penunjang]
    .map((x) => scores?.[x.key])
    .filter((v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)))
    .map(Number)
  if (!vals.length) return { total: null, average: null, grade: null, filled: 0 }
  const total = round1(vals.reduce((a, b) => a + b, 0))
  const average = round1(total / vals.length)
  return { total, average, grade: gradeOf(average), filled: vals.length }
}
export function nextClassOf(classId) {
  const c = normalizeLevel(classId)
  if (/^[1-5]$/.test(c)) return String(Number(c) + 1)
  if (c === '6') return '7'
  if (c === '7') return 'lulus'
  return ''
}
export function decisionText(decision, classId) {
  if (decision === 'belum') return `Belum naik, tetap di ${levelName(classId)}`
  if (decision !== 'naik') return ''
  const to = nextClassOf(classId)
  return to === 'lulus' ? 'Naik, lulus Marhalah' : `Naik ke ${levelName(to)}`
}
export const num = (n) => (n === null || n === undefined || n === '' ? '–' : String(round1(Number(n))).replace('.', ','))
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
export const longDate = (iso) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : '')
export const shortDate = (iso) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1].slice(0, 3)} ${iso.slice(0, 4)}` : '')
export { gradeOf }
