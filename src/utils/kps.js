// Kartu Prestasi Santri on the screen: the same rules as backend/src/utils/kps.js (criteria, next place, texts),
// so the page can show "Hal. 16" the moment a teacher taps, before the server answers.
import { SURAHS, surahName, ayatCount } from './surahs.js'

export const PAGES = 36
export const KINDS = [
  { key: 'jilid', label: 'Jilid' },
  { key: 'quran', label: "Al-Qur'an" },
  { key: 'hafalan', label: 'Hafalan' },
]
export const KIND_LABEL = { jilid: 'Jilid', quran: "Al-Qur'an", hafalan: 'Hafalan' }
// the notes a teacher taps instead of typing (joined with ", ")
export const NOTE_CHIPS = ['Lancar', 'Kurang lancar', 'Mad kurang panjang', 'Dengung kurang', 'Makhroj belum tepat', 'Tajwid perlu diulang', 'Belum hafal']
export const QUICK_SCORES = [7, 7.5, 8, 8.5, 9, 9.5]

const round1 = (n) => Math.round(n * 10) / 10
export const parseScore = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.'))
  return Number.isFinite(n) ? round1(n) : NaN
}
export const gradeOf = (score) => {
  if (score === null || score === undefined || score === '' || !Number.isFinite(Number(score))) return null
  const n = round1(Number(score))
  return n >= 8.6 ? 'A' : n >= 7.6 ? 'B' : 'C'
}
export const GRADE_RANGE = { A: '8,6 – 10', B: '7,6 – 8,5', C: '≤ 7,5' }
export const scoreText = (n) => (n === null || n === undefined || n === '' ? '' : String(round1(Number(n))).replace('.', ','))

export const normalizeLevel = (value) => {
  const s = String(value ?? '').trim().toLowerCase()
  return ['7', '8', '9', 'marhalah'].includes(s) || s.includes('marhalah') ? '7' : s
}
export const mainKind = (classId) => (normalizeLevel(classId) === '7' ? 'quran' : 'jilid')

const rangeText = (p = {}) => (p.ayatTo && Number(p.ayatTo) !== Number(p.ayatFrom) ? `${p.ayatFrom}-${p.ayatTo}` : `${p.ayatFrom}`)
export function placeText(kind, p = {}) {
  if (!p) return ''
  if (kind === 'jilid') return `Jilid ${p.jilid} hal. ${p.page}`
  const name = p.surahName || surahName(p.surah)
  return kind === 'hafalan' ? `Hafalan ${name} ayat ${rangeText(p)}` : `QS ${name} ayat ${rangeText(p)}`
}
// the short chip in a row: "Hal. 15" / "Al-Mulk 11"
export function placeChip(kind, p) {
  if (!p) return ''
  if (kind === 'jilid') return `Hal. ${p.page}`
  return `${p.surahName || surahName(p.surah)} ${rangeText(p)}`
}

const JUZ_AMMA_FIRST = 78
function nextSurah(kind, surah) {
  if (kind === 'hafalan' && surah > JUZ_AMMA_FIRST) return surah - 1
  if (kind === 'hafalan' && surah === JUZ_AMMA_FIRST) return null
  return surah < SURAHS.length ? surah + 1 : null
}
export function nextPosition(test) {
  const kind = test.kind
  if (kind === 'jilid') {
    if (test.result !== 'lanjut') return { jilid: String(test.jilid), page: Number(test.page) }
    const page = Number(test.page) + 1
    return page > PAGES ? { jilid: String(test.jilid), page: PAGES, done: true } : { jilid: String(test.jilid), page }
  }
  const surah = Number(test.surah)
  if (test.result !== 'lanjut') return { surah, surahName: surahName(surah), ayatFrom: Number(test.ayatFrom), ayatTo: Number(test.ayatTo) }
  const to = Number(test.ayatTo || test.ayatFrom)
  if (to < ayatCount(surah)) return { surah, surahName: surahName(surah), ayatFrom: to + 1, ayatTo: null }
  const next = nextSurah(kind, surah)
  return next ? { surah: next, surahName: surahName(next), ayatFrom: 1, ayatTo: null } : { surah, surahName: surahName(surah), ayatFrom: to, ayatTo: to, done: true }
}
export function nextText(test) {
  const next = nextPosition(test)
  if (next.done) return test.kind === 'jilid' ? `selesai Jilid ${test.jilid}` : test.kind === 'hafalan' ? "hafalan Juz 'Amma selesai" : 'khatam'
  if (test.result !== 'lanjut') return test.kind === 'jilid' ? `mengulang hal. ${test.page}` : `mengulang ayat ${rangeText(test)}`
  if (test.kind === 'jilid') return `lanjut ke hal. ${next.page}`
  return `lanjut ke ${next.surahName} ayat ${next.ayatFrom}`
}

// the place a quick tap uses (null: the teacher sets it first); a child moved up a jilid starts at page 1
export function suggestPlace(kind, entry, classId) {
  if (kind === 'jilid') {
    const level = normalizeLevel(classId)
    if (!entry || !entry.jilid) return null
    if (/^[1-6]$/.test(level) && Number(entry.jilid) < Number(level)) return { jilid: level, page: 1 }
    if (/^[1-6]$/.test(level) && Number(entry.jilid) > Number(level)) return null
    return { jilid: String(entry.jilid), page: Number(entry.page), ...(entry.done ? { done: true } : {}) }
  }
  if (!entry || !entry.surah) return null
  return { surah: Number(entry.surah), surahName: surahName(entry.surah), ayatFrom: Number(entry.ayatFrom), ayatTo: entry.ayatTo ? Number(entry.ayatTo) : null, ...(entry.done ? { done: true } : {}) }
}

const DAYS = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
export const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
export const dayLabel = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}
export const shortDay = (iso) => (iso ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}` : '')
export const monthLabel = (ym) => (ym ? `${MONTHS_LONG[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}` : '')
export const SESI = { wave_1: 'Sore', wave_2: 'Malam' }
