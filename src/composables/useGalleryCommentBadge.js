// New comments on Dokumentasi moments since THIS ACCOUNT last opened the Komentar tab (kept on the server, so the
// laptop and the phone agree). For the admin and a guru with "Kelola Dokumentasi": the menu badge and the admin's
// Beranda. Asked on page changes at most once a minute (or after something was saved), never on a timer.
import { ref } from 'vue'
import api, { getLastMutationAt } from '@/services/api'

const count = ref(0)
let lastAt = 0
let pending = null

export function useGalleryCommentBadge() {
  async function refresh({ force = false } = {}) {
    const mutatedSince = getLastMutationAt() > lastAt
    if (!force && !mutatedSince && Date.now() - lastAt < 60 * 1000) return count.value
    if (pending) return pending
    pending = api
      .get('/gallery/manage/comments/badge', { cache: false })
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
  // the Komentar tab was opened here: nothing is "baru" any more, at once
  function clear() {
    count.value = 0
    lastAt = Date.now()
  }
  return { count, refresh, clear }
}
