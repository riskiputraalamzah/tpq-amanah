// Utility functions for date/time with Asia/Jakarta timezone

const TIMEZONE = 'Asia/Jakarta'

/**
 * Get current date in Jakarta timezone
 */
export const getJakartaDate = () => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }))
}

/**
 * Format date to Indonesian locale with Jakarta timezone
 */
export const formatDate = (date, options = {}) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('id-ID', {
        timeZone: TIMEZONE,
        ...options
    })
}

/**
 * Format time to Indonesian locale with Jakarta timezone
 */
export const formatTime = (date, options = {}) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleTimeString('id-ID', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        ...options
    })
}

/**
 * Format date and time together
 */
export const formatDateTime = (date, options = {}) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleString('id-ID', {
        timeZone: TIMEZONE,
        ...options
    })
}

/**
 * Get day name in Indonesian
 */
export const getDayName = (date) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('id-ID', {
        timeZone: TIMEZONE,
        weekday: 'long'
    })
}

/**
 * Check if date is weekend (Saturday/Sunday)
 */
export const isWeekend = (date = new Date()) => {
    const d = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
    const day = d.getDay()
    return day === 0 || day === 6
}

export default {
    TIMEZONE,
    getJakartaDate,
    formatDate,
    formatTime,
    formatDateTime,
    getDayName,
    isWeekend
}
