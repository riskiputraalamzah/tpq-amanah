// Jumlah saran & kritik (masukan) dari wali santri yang masih berstatus 'open' (belum ditanggapi/dicatat admin).
// Dipakai untuk badge pada menu "Saran & Kritik Wali" di sidebar Admin.
import { ref } from 'vue'
import api, { getLastMutationAt } from '@/services/api'

const count = ref(0)
let lastAt = 0
let pending = null

export function useWaliFeedbackBadge() {
  async function refresh({ force = false } = {}) {
    const mutatedSince = getLastMutationAt() > lastAt
    if (!force && !mutatedSince && Date.now() - lastAt < 60 * 1000) return count.value
    if (pending) return pending
    pending = api
      .get('/wali-feedback/admin/count', { cache: false })
      .then(({ data }) => {
        count.value = Number(data?.count || 0)
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
