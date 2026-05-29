/**
 * Holiday Service
 * Fetches and caches holiday data from backend.
 */
import api from './api'

// Cache for holiday data, keyed by year
const holidayCache = new Map()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

const FALLBACK_HOLIDAYS = {
  2026: [
    { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi' },
    { date: '2026-01-16', name: 'Isra Mikraj Nabi Muhammad SAW' },
    { date: '2026-02-16', name: 'Cuti Bersama Tahun Baru Imlek 2577 Kongzili' },
    { date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili' },
    { date: '2026-03-18', name: 'Cuti Bersama Hari Suci Nyepi Tahun Baru Saka 1948' },
    { date: '2026-03-19', name: 'Hari Suci Nyepi Tahun Baru Saka 1948' },
    { date: '2026-03-20', name: 'Cuti Bersama Hari Raya Idul Fitri 1447 Hijriah' },
    { date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 Hijriah' },
    { date: '2026-03-22', name: 'Hari Raya Idul Fitri 1447 Hijriah' },
    { date: '2026-03-23', name: 'Cuti Bersama Hari Raya Idul Fitri 1447 Hijriah' },
    { date: '2026-03-24', name: 'Cuti Bersama Hari Raya Idul Fitri 1447 Hijriah' },
    { date: '2026-04-03', name: 'Wafat Yesus Kristus' },
    { date: '2026-04-05', name: 'Kebangkitan Yesus Kristus (Paskah)' },
    { date: '2026-05-01', name: 'Hari Buruh Internasional' },
    { date: '2026-05-14', name: 'Kenaikan Yesus Kristus' },
    { date: '2026-05-15', name: 'Cuti Bersama Kenaikan Yesus Kristus' },
    { date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 Hijriah' },
    { date: '2026-05-28', name: 'Cuti Bersama Hari Raya Idul Adha 1447 Hijriah' },
    { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE' },
    { date: '2026-06-01', name: 'Hari Lahir Pancasila' },
    { date: '2026-06-16', name: 'Tahun Baru Islam 1448 Hijriah' },
    { date: '2026-08-17', name: 'Hari Kemerdekaan Republik Indonesia' },
    { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW' },
    { date: '2026-12-24', name: 'Cuti Bersama Hari Raya Natal' },
    { date: '2026-12-25', name: 'Hari Raya Natal' },
  ],
}

function mergeWithFallback(holidays, year) {
  const merged = new Map()

  for (const h of holidays || []) {
    if (h?.date && h?.name) merged.set(h.date, { date: h.date, name: h.name })
  }

  for (const h of FALLBACK_HOLIDAYS[year] || []) {
    merged.set(h.date, h)
  }

  return [...merged.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Fetch all holidays for the year
 * @returns {Promise<Array<{date: string, name: string}>>}
 */
export async function fetchHolidays(year = new Date().getFullYear()) {
  // Return cached data if still valid
  const cached = holidayCache.get(year)
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data
  }
  
  try {
    const { data } = await api.get('/holidays/national', {
      params: { year },
    })
    const merged = mergeWithFallback(data, year)
    holidayCache.set(year, { data: merged, timestamp: Date.now() })
    
    return merged
  } catch (error) {
    console.error('Error fetching holidays:', error)
    return mergeWithFallback([], year)
  }
}

/**
 * Check if a specific date is a holiday
 * @param {Date} date - The date to check
 * @param {Array} holidays - Array of holiday objects
 * @returns {{isHoliday: boolean, holidayName: string|null}}
 */
export function isHoliday(date, holidays) {
  if (!date || !holidays || holidays.length === 0) {
    return { isHoliday: false, holidayName: null }
  }
  
  const dateStr = formatDateToString(date)
  const holiday = holidays.find(h => h.date === dateStr)
  
  return {
    isHoliday: !!holiday,
    holidayName: holiday?.name || null
  }
}

/**
 * Check if today is a holiday
 * @param {Array} holidays - Array of holiday objects
 * @returns {{isHoliday: boolean, holidayName: string|null}}
 */
export function isTodayHoliday(holidays) {
  return isHoliday(new Date(), holidays)
}

/**
 * Check if tomorrow is a holiday
 * @param {Array} holidays - Array of holiday objects
 * @returns {{isHoliday: boolean, holidayName: string|null}}
 */
export function isTomorrowHoliday(holidays) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return isHoliday(tomorrow, holidays)
}

/**
 * Get holidays for a specific month
 * @param {number} month - Month (0-11)
 * @param {number} year - Year
 * @param {Array} holidays - Array of holiday objects
 * @returns {Array<{date: number, name: string}>}
 */
export function getHolidaysForMonth(month, year, holidays) {
  if (!holidays || holidays.length === 0) return []
  
  return holidays
    .filter(h => {
      const [y, m] = h.date.split('-').map(Number)
      return y === year && m === month + 1
    })
    .map(h => ({
      date: parseInt(h.date.split('-')[2]),
      name: h.name
    }))
}

/**
 * Format date to YYYY-MM-DD string
 * @param {Date} date 
 * @returns {string}
 */
function formatDateToString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default {
  fetchHolidays,
  isHoliday,
  isTodayHoliday,
  isTomorrowHoliday,
  getHolidaysForMonth
}
