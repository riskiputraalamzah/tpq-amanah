/**
 * Holiday Service
 * Fetches and caches holiday data from https://libur.deno.dev/api
 */

// Cache for holiday data
let holidayCache = null
let cacheTimestamp = null
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Fetch all holidays for the year
 * @returns {Promise<Array<{date: string, name: string}>>}
 */
export async function fetchHolidays() {
  // Return cached data if still valid
  if (holidayCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return holidayCache
  }
  
  try {
    const response = await fetch('https://libur.deno.dev/api')
    if (!response.ok) {
      throw new Error('Failed to fetch holidays')
    }
    
    const data = await response.json()
    holidayCache = data
    cacheTimestamp = Date.now()
    
    return data
  } catch (error) {
    console.error('Error fetching holidays:', error)
    return []
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
