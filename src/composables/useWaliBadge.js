// What waits for this person's decision in Data Wali Santri: the badge on that menu.
//   a teacher: the forms sent, identity changes and link requests of the jilid they teach
//   the admin: what was handed to the admin (the teacher did not decide within 30 minutes, or has no WhatsApp)
// One shared value; refreshed at most once a minute (on page changes), or at once after an action on the page.
import { ref } from 'vue'
import api, { getLastMutationAt } from '@/services/api'

const count = ref(0)
let lastAt = 0
let pending = null

export function useWaliBadge() {
  async function refresh({ force = false } = {}) {
    const mutatedSince = getLastMutationAt() > lastAt
    if (!force && !mutatedSince && Date.now() - lastAt < 60 * 1000) return count.value
    if (pending) return pending
    pending = api
      .get('/wali/admin/badge', { cache: false })
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
