// Wali portal data, "show what we have, refresh quietly" (user decision 2026-11-28: a page shows the last data at once,
// even if a few minutes old, and the newest replaces it in the background with a small "Memperbarui…" mark).
//
//   - kept in memory and on the phone (localStorage), per wali account: opening the portal again shows data at once
//   - every page asks the server again each time it opens, when the app comes back to the screen, and after a change
//     the parent made (invalidate) - nothing stays stale for long
//   - one request per key at a time (several pages asking the same thing share it)
//   - cleared on logout (a shared phone keeps nothing of the parent before), and another account never sees it
import { ref } from 'vue'

const PREFIX = 'tpq.wali.cache.v1.'
const KEEP_MS = 7 * 24 * 3600 * 1000 // older than a week on the phone: not shown, asked again
const MAX_KEYS = 60

let owner = ''
const mem = new Map() // key -> { data, at }
const inflight = new Map() // key -> Promise
const listeners = new Map() // key -> Set(fn)
let saveTimer = null

// how many refreshes are on their way (the "Memperbarui…" mark in the layout)
export const refreshingCount = ref(0)

const storageKey = () => `${PREFIX}${owner}`

function hydrate() {
  mem.clear()
  if (!owner) return
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey()) || '{}')
    const now = Date.now()
    for (const [key, entry] of Object.entries(raw || {})) {
      if (entry && typeof entry.at === 'number' && now - entry.at < KEEP_MS) mem.set(key, { data: entry.data, at: entry.at })
    }
  } catch {
    /* broken or private mode: start empty */
  }
}

function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (!owner) return
    try {
      const newest = [...mem.entries()].sort((a, b) => b[1].at - a[1].at).slice(0, MAX_KEYS)
      localStorage.setItem(storageKey(), JSON.stringify(Object.fromEntries(newest)))
    } catch {
      /* storage full or private mode: memory only */
    }
  }, 250)
}

// the signed-in wali (their uid); another account starts from its own store
export function setWaliOwner(uid) {
  const next = String(uid || '')
  if (next === owner) return
  owner = next
  inflight.clear()
  hydrate()
  // another parent's data left on this phone (a session that ended without logout): removed
  if (owner) {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX) && k !== storageKey())
        .forEach((k) => localStorage.removeItem(k))
    } catch {
      /* nothing stored */
    }
  }
}

export function peek(key) {
  return mem.get(key) || null
}

export function put(key, data) {
  mem.set(key, { data, at: Date.now() })
  persist()
  ;(listeners.get(key) || new Set()).forEach((fn) => fn({ type: 'data', data }))
}

// ask the server (shared while on its way); the answer is kept and told to every page showing this key
export function fetchFresh(key, fetcher) {
  if (inflight.has(key)) return inflight.get(key)
  const forOwner = owner
  refreshingCount.value += 1
  const p = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      if (forOwner === owner) put(key, data) // signed out / another account meanwhile: dropped
      return data
    })
    .finally(() => {
      inflight.delete(key)
      refreshingCount.value = Math.max(0, refreshingCount.value - 1)
    })
  inflight.set(key, p)
  return p
}

// warm a key before the parent opens it (only when nothing recent is there)
export function prefetch(key, fetcher, { maxAgeMs = 60 * 1000 } = {}) {
  const e = peek(key)
  if (e && Date.now() - e.at < maxAgeMs) return Promise.resolve(e.data)
  return fetchFresh(key, fetcher).catch(() => null)
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key).add(fn)
  return () => listeners.get(key)?.delete(fn)
}

// after a change the parent made: these keys (exact, or ending in "*" for a prefix) are old; pages showing them ask
// again now, the others on their next visit
export function invalidate(...patterns) {
  const keys = [...new Set([...mem.keys(), ...listeners.keys()])]
  for (const pattern of patterns.flat()) {
    const match = (k) => (pattern.endsWith('*') ? k.startsWith(pattern.slice(0, -1)) : k === pattern)
    for (const k of keys.filter(match)) {
      const e = mem.get(k)
      if (e) e.at = 0
      ;(listeners.get(k) || new Set()).forEach((fn) => fn({ type: 'stale' }))
    }
  }
  persist()
}

// every page on screen asks again (pull to refresh)
export function refreshAll() {
  for (const set of listeners.values()) set.forEach((fn) => fn({ type: 'stale' }))
}

// logout: nothing of this parent stays on the phone
export function clearWaliCache() {
  mem.clear()
  inflight.clear()
  owner = ''
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* nothing stored */
  }
}
