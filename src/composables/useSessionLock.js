// Is the month of one KBM session locked by a submitted/approved monthly LPJ? (rules in utils/lpjLock.js)
import { ref, computed } from 'vue'
import api from '@/services/api'
import { pickMonthReport, isLockedStatus, lockMessage, sessionPeriod } from '@/utils/lpjLock'

// For one session page: is the session's month locked?
export function useSessionLock() {
  const status = ref(null)
  const locked = computed(() => isLockedStatus(status.value))
  const message = computed(() => lockMessage(status.value))
  async function check(session) {
    const period = sessionPeriod(session?.date)
    if (!period) return
    try {
      const { data } = await api.get('/ljp/reports', { params: { period } })
      status.value = pickMonthReport(data)?.status || null
    } catch {
      status.value = null // not eligible / unreachable: the server still refuses a locked save
    }
  }
  return { locked, message, check }
}
