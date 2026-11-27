// One piece of wali portal data on a page, from the shared store (utils/waliCache.js):
//
//   const { data, loading, refreshing, error, refresh } = useWaliResource(() => `progress:${id}:${month}`, () => api...)
//
//   data        what we have (the last answer, from memory or the phone), null only the very first time
//   loading     true only while there is nothing to show yet (the skeleton)
//   refreshing  a newer answer is on its way (the page stays as it is)
//   error       the request failed AND there is nothing to show; with data on screen a failed refresh is only `stale`
//   refresh()   ask again now
//
// It asks the server every time the page opens, when the app comes back to the screen (after 30 s away), and when a
// change invalidated the key. keepPrevious: a new key (another month) keeps the old data on screen until it arrives.
import { ref, computed, watch, onBeforeUnmount, getCurrentInstance } from 'vue'
import { peek, fetchFresh, subscribe } from '@/utils/waliCache'

const BACK_AFTER_MS = 30 * 1000

export function useWaliResource(keyOf, fetcher, { keepPrevious = false, enabled = () => true } = {}) {
  const key = computed(() => (enabled() ? keyOf() : null))
  const data = ref(null)
  const error = ref('')
  const stale = ref(false) // a refresh failed while older data is shown
  const refreshing = ref(false)
  const ready = ref(false) // the shown data belongs to the current key
  let seq = 0
  let unsubscribe = null
  let hiddenAt = 0

  async function run() {
    const k = key.value
    if (!k) return
    const mine = ++seq
    refreshing.value = true
    try {
      const fresh = await fetchFresh(k, () => fetcher(k))
      if (mine !== seq) return
      data.value = fresh
      ready.value = true
      error.value = ''
      stale.value = false
    } catch (err) {
      if (mine !== seq) return
      if (err?.response?.status === 401) return // the app takes the parent to the login
      if (data.value !== null && ready.value) stale.value = true
      else error.value = err?.response?.data?.error || 'Belum bisa dimuat. Periksa koneksi lalu coba lagi.'
    } finally {
      if (mine === seq) refreshing.value = false
    }
  }

  watch(
    key,
    (k) => {
      unsubscribe?.()
      unsubscribe = null
      error.value = ''
      stale.value = false
      if (!k) return
      const cached = peek(k)
      if (cached) {
        data.value = cached.data
        ready.value = true
      } else {
        ready.value = false
        if (!keepPrevious) data.value = null
      }
      unsubscribe = subscribe(k, (ev) => {
        if (ev.type === 'data') {
          data.value = ev.data
          ready.value = true
        } else if (ev.type === 'stale') run()
      })
      run()
    },
    { immediate: true },
  )

  const onVisible = () => {
    if (document.visibilityState === 'hidden') hiddenAt = Date.now()
    else if (hiddenAt && Date.now() - hiddenAt > BACK_AFTER_MS) run()
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible)
  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      seq += 1
      unsubscribe?.()
      document.removeEventListener('visibilitychange', onVisible)
    })
  }

  const loading = computed(() => data.value === null && !error.value)
  return { data, loading, refreshing, error, stale, ready, refresh: run }
}
