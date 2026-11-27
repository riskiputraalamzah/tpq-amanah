// The TPQ's announcements for the signed-in wali: one shared list for the home cards, the Pengumuman tab and its
// badge. "Seen" (the badge) and "closed" (the home card) are remembered on this phone only.
// The list itself rides on the wali store (utils/waliCache.js): shown at once from the last visit, refreshed quietly.
import { ref, computed } from 'vue'
import { peek, fetchFresh } from '@/utils/waliCache'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'

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

// logout: nothing of this parent stays on screen for the next one
export function resetWaliAnnouncements() {
  list.value = []
  loadedAt = 0
}

export function useWaliAnnouncements() {
  if (!list.value.length) {
    const cached = peek(WALI_KEYS.announcements)
    if (Array.isArray(cached?.data)) list.value = cached.data
  }
  async function refresh({ force = false } = {}) {
    if (!force && Date.now() - loadedAt < 60 * 1000) return list.value
    if (pending) return pending
    pending = fetchFresh(WALI_KEYS.announcements, waliFetch.announcements)
      .then((data) => {
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
  // Beranda stays focused on general TPQ announcements; activity info surfaces via Pengumuman tab + badge and Kegiatan.
  const onHome = computed(() => list.value.filter((a) => a.kind !== 'kegiatan_info' && !dismissed.value.includes(a.id)))
  function markSeen(id) {
    if (!id || seen.value.includes(id)) return
    seen.value = [...seen.value, id]
    write(SEEN_KEY, seen.value)
  }
  function markAllSeen() {
    seen.value = [...new Set([...seen.value, ...list.value.map((a) => a.id)])]
    write(SEEN_KEY, seen.value)
  }
  function dismiss(id) {
    dismissed.value = [...dismissed.value, id]
    write(DISMISS_KEY, dismissed.value)
    markSeen(id)
  }
  return { list, unseen, onHome, refresh, markSeen, markAllSeen, dismiss }
}
