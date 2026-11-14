// How many registrations nobody has contacted yet: the badge on the "Pendaftaran" menu and the note on the Dashboard.
// One shared value; refreshed at most once a minute (on page changes), or at once after an action on the page.
import { ref } from 'vue'
import api from '@/services/api'

const count = ref(0)
let lastAt = 0
let pending = null

export function usePendaftaranCount() {
  async function refresh({ force = false } = {}) {
    if (!force && Date.now() - lastAt < 60 * 1000) return count.value
    if (pending) return pending
    pending = api
      .get('/pendaftaran/admin/count', { cache: false })
      .then(({ data }) => {
        count.value = Number(data?.submitted || 0)
        lastAt = Date.now()
        return count.value
      })
      .catch(() => count.value)
      .finally(() => {
        pending = null
      })
    return pending
  }
  return { count, refresh }
}
