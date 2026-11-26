// Shared reactive state & optimistic toggle for public Dokumentasi likes (no login needed).
// Uses a persistent anonymous visitorId in localStorage + server-side deduplication & IP fairness cap.
// When someone is logged in (the api client sends their token), the server counts one like per account and the admin
// sees who it was; the visitorId lets the account take over a like this browser gave before logging in.
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

function triggerHaptic(kind) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(kind === 'like' ? [12, 24, 16] : 10)
    }
  } catch {
    /* ignore unsupported devices */
  }
}

const likedIds = reactive(new Set(loadLikedIds()))
const countOverrides = reactive({})
const pendingIds = reactive({})
const burstSeq = reactive({})
const lastActions = reactive({})
const animTimers = new Map()

function persistLikedIds() {
  safeStorageSet(LIKED_IDS_KEY, JSON.stringify([...likedIds]))
}

function playActionAnimation(id, action) {
  burstSeq[id] = (burstSeq[id] || 0) + 1
  lastActions[id] = action
  clearTimeout(animTimers.get(id))
  const duration = action === 'like' ? 820 : 560
  animTimers.set(
    id,
    setTimeout(() => {
      if (lastActions[id] === action) lastActions[id] = ''
    }, duration),
  )
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

  function lastActionOf(moment) {
    return moment?.id ? lastActions[moment.id] || '' : ''
  }

  function animKeyOf(moment) {
    return moment?.id ? burstSeq[moment.id] || 0 : 0
  }

  function isPopped(moment) {
    return lastActionOf(moment) === 'like'
  }

  async function toggleLike(moment) {
    if (!moment?.id || pendingIds[moment.id]) return { ok: false, skipped: true }

    const id = moment.id
    const prevLiked = likedIds.has(id)
    const prevCount = likeCountOf(moment)
    const nextLiked = !prevLiked
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1))

    // Optimistic update + tactile animation choreography
    pendingIds[id] = true
    if (nextLiked) {
      likedIds.add(id)
      playActionAnimation(id, 'like')
      triggerHaptic('like')
    } else {
      likedIds.delete(id)
      playActionAnimation(id, 'unlike')
      triggerHaptic('unlike')
    }
    countOverrides[id] = nextCount
    persistLikedIds()

    try {
      const visitorId = getOrCreateVisitorId()
      const slugOrId = moment.slug || id
      // intent: what this tap means here. A logged-in parent who already liked on another phone stays liked (one
      // like per account) instead of being switched off by a heart that did not know.
      const { data } = await api.post(`/gallery/public/${encodeURIComponent(slugOrId)}/like`, {
        visitorId,
        intent: nextLiked ? 'like' : 'unlike',
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
      lastActions[id] = ''
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
    lastActionOf,
    animKeyOf,
    toggleLike,
  }
}
