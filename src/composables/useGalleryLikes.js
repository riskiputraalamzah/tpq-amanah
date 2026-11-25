// Shared reactive state & optimistic toggle for public Dokumentasi likes (no login needed).
// Uses a persistent anonymous visitorId in localStorage + server-side deduplication & IP fairness cap.
import { reactive } from 'vue'
import api from '@/services/api'

const VISITOR_ID_KEY = 'tpq_gallery_vid_v1'
const LIKED_IDS_KEY = 'tpq_gallery_liked_v1'

function safeStorageGet(key) {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  } catch {
    return null
  }
}

function safeStorageSet(key, val) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, val)
  } catch {
    /* ignore restricted storage / Safari private mode */
  }
}

function loadLikedIds() {
  try {
    const raw = safeStorageGet(LIKED_IDS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string' && id) : []
  } catch {
    return []
  }
}

function getOrCreateVisitorId() {
  const existing = safeStorageGet(VISITOR_ID_KEY)
  if (existing && existing.length >= 12) return existing
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`
  const vid = `v_${rand.slice(0, 28)}`
  safeStorageSet(VISITOR_ID_KEY, vid)
  return vid
}

const likedIds = reactive(new Set(loadLikedIds()))
const countOverrides = reactive({})
const pendingIds = reactive({})
const poppedIds = reactive({})

function persistLikedIds() {
  safeStorageSet(LIKED_IDS_KEY, JSON.stringify([...likedIds]))
}

export function useGalleryLikes() {
  function isLiked(moment) {
    return Boolean(moment?.id && likedIds.has(moment.id))
  }

  function likeCountOf(moment) {
    if (!moment?.id) return 0
    if (typeof countOverrides[moment.id] === 'number') return countOverrides[moment.id]
    return Math.max(0, Number(moment.likesCount) || 0)
  }

  function isPending(moment) {
    return Boolean(moment?.id && pendingIds[moment.id])
  }

  function isPopped(moment) {
    return Boolean(moment?.id && poppedIds[moment.id])
  }

  async function toggleLike(moment) {
    if (!moment?.id || pendingIds[moment.id]) return { ok: false, skipped: true }

    const id = moment.id
    const prevLiked = likedIds.has(id)
    const prevCount = likeCountOf(moment)
    const nextLiked = !prevLiked
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1))

    // Optimistic update for snappy tactile feel
    pendingIds[id] = true
    if (nextLiked) {
      likedIds.add(id)
      poppedIds[id] = true
      setTimeout(() => {
        poppedIds[id] = false
      }, 360)
    } else {
      likedIds.delete(id)
    }
    countOverrides[id] = nextCount
    persistLikedIds()

    try {
      const visitorId = getOrCreateVisitorId()
      const slugOrId = moment.slug || id
      const { data } = await api.post(`/gallery/public/${encodeURIComponent(slugOrId)}/like`, {
        visitorId,
      })
      const serverLiked = Boolean(data?.liked)
      const serverCount = Math.max(0, Number(data?.likesCount ?? nextCount) || 0)
      if (serverLiked) likedIds.add(id)
      else likedIds.delete(id)
      countOverrides[id] = serverCount
      moment.likesCount = serverCount
      persistLikedIds()
      return { ok: true, liked: serverLiked, likesCount: serverCount }
    } catch (err) {
      // Roll back cleanly if rejected (e.g. offline or IP spam cap)
      if (prevLiked) likedIds.add(id)
      else likedIds.delete(id)
      countOverrides[id] = prevCount
      persistLikedIds()
      return {
        ok: false,
        error: err?.response?.data?.error || 'Gagal menyimpan apresiasi. Coba lagi sebentar.',
      }
    } finally {
      pendingIds[id] = false
    }
  }

  return {
    isLiked,
    likeCountOf,
    isPending,
    isPopped,
    toggleLike,
  }
}
