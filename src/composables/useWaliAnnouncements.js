// The TPQ's announcements for the signed-in wali: one shared list for the home cards, the Pengumuman tab and its
// badge. "Seen" (the badge) and "closed" (the home card) are remembered on this phone only.
import { ref, computed } from 'vue'
import api from '@/services/api'

const SEEN_KEY = 'wali_ann_seen'
const DISMISS_KEY = 'wali_ann_dismissed'
const read = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value.slice(-80)))
  } catch {
    /* private mode: remembered for this visit only */
  }
}

const list = ref([])
const seen = ref(read(SEEN_KEY))
const dismissed = ref(read(DISMISS_KEY))
let loadedAt = 0
let pending = null

export function useWaliAnnouncements() {
  async function refresh({ force = false } = {}) {
    if (!force && Date.now() - loadedAt < 60 * 1000) return list.value
    if (pending) return pending
    pending = api
      .get('/wali-announcements/mine', { cache: false })
      .then(({ data }) => {
        list.value = Array.isArray(data) ? data : []
        loadedAt = Date.now()
        return list.value
      })
      .catch(() => list.value)
      .finally(() => {
        pending = null
      })
    return pending
  }
  const unseen = computed(() => list.value.filter((a) => !seen.value.includes(a.id)).length)
  const onHome = computed(() => list.value.filter((a) => !dismissed.value.includes(a.id)))
  function markAllSeen() {
    seen.value = [...new Set([...seen.value, ...list.value.map((a) => a.id)])]
    write(SEEN_KEY, seen.value)
  }
  function dismiss(id) {
    dismissed.value = [...dismissed.value, id]
    write(DISMISS_KEY, dismissed.value)
    if (!seen.value.includes(id)) {
      seen.value = [...seen.value, id]
      write(SEEN_KEY, seen.value)
    }
  }
  return { list, unseen, onHome, refresh, markAllSeen, dismiss }
}
