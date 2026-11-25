import axios from 'axios'

// In-memory client cache + in-flight request deduplication
const cache = new Map()
const inFlightRequests = new Map()

// Reference data that no operational write changes, so it survives cache invalidation.
const MUTATION_SAFE_URLS = [
  '/classes',
  '/teaching_sessions/slots',
  '/holidays/national',
  '/settings/operational-calendar',
]

// Endpoints that also maintain a short-lived server-side summary cache (60s) and accept `?fresh=1`.
// After any mutation in this browser session, we force `?fresh=1` for 90s so even multi-instance backends
// immediately reflect the just-saved KBM, attendance, izin, santri, etc. without needing a manual refresh.
const SERVER_CACHED_URLS = [
  '/guru-dashboard',
  '/admin-dashboard',
  '/kbm-monitor',
]
const SERVER_FRESH_WINDOW_MS = 90 * 1000
const MUTATION_STORAGE_KEY = 'tpq_last_mutation_at'

let mutationVersion = 0
let lastMutationAt = 0

try {
  const saved = Number(typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(MUTATION_STORAGE_KEY) : 0)
  if (Number.isFinite(saved) && saved > 0) lastMutationAt = saved
} catch {
  /* ignore restricted storage */
}

function isMutationSafe(url = '') {
  return MUTATION_SAFE_URLS.some((prefix) => String(url).startsWith(prefix))
}

function isServerCachedUrl(url = '') {
  const clean = String(url).split('?')[0]
  return SERVER_CACHED_URLS.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`))
}

// Dynamic operational endpoints that should never return a stale 45s client cache (static slots stay cached).
const NO_CLIENT_CACHE_PREFIXES = [
  '/guru-dashboard',
  '/admin-dashboard',
  '/kbm-monitor',
  '/teaching_sessions',
  '/ljp/',
  '/lpj/',
  '/attendance/quick',
]

function isNoClientCacheUrl(url = '') {
  const clean = String(url).split('?')[0]
  if (isMutationSafe(clean)) return false
  return NO_CLIENT_CACHE_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(prefix))
}

export function getLastMutationAt() {
  return lastMutationAt
}

export function needsFreshServerRead(url = '', now = Date.now()) {
  if (!isServerCachedUrl(url)) return false
  return lastMutationAt > 0 && now - lastMutationAt < SERVER_FRESH_WINDOW_MS
}

export function markDataMutated() {
  mutationVersion += 1
  lastMutationAt = Date.now()
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(MUTATION_STORAGE_KEY, String(lastMutationAt))
  } catch {
    /* ignore */
  }
  for (const key of cache.keys()) {
    if (!isMutationSafe(key)) cache.delete(key)
  }
  // Drop in-flight GET dedup entries started before this write so a post-write read never joins stale pre-write data.
  for (const key of inFlightRequests.keys()) {
    if (!isMutationSafe(key)) inFlightRequests.delete(key)
  }
}

function isMutation(method = '') {
  return ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase())
}

// Helper to determine TTL based on endpoint nature
function getCacheTtl(url = '') {
  // Static / configuration data (5 minutes)
  if (
    url.includes('/classes') ||
    url.includes('/teaching_sessions/slots') ||
    url.includes('/settings/tpq-profile') ||
    url.includes('/settings/operational-calendar') ||
    url.includes('/holidays/national') ||
    url.includes('/content')
  ) {
    return 5 * 60 * 1000
  }

  // Semi-static reference data (2 minutes)
  if (
    url.includes('/users/teachers/public') ||
    url.includes('/users?role=guru') ||
    url.includes('/announcements') ||
    url.includes('/holidays') ||
    url.includes('/santri')
  ) {
    return 2 * 60 * 1000
  }

  // Dynamic operational data (45 seconds - allows instant A -> B -> A transitions without refetching)
  return 45 * 1000
}

/**
 * Clear the client-side API cache.
 * @param {string} [urlPattern] Optional substring pattern to match against cached URLs. If omitted, clears all cache.
 */
export function clearApiCache(urlPattern) {
  if (!urlPattern) {
    cache.clear()
    inFlightRequests.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) {
      cache.delete(key)
    }
  }
  for (const key of inFlightRequests.keys()) {
    if (key.includes(urlPattern)) {
      inFlightRequests.delete(key)
    }
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Get original adapter
const defaultAdapter = axios.getAdapter(api.defaults.adapter)

// Request interceptor: invalidate on mutations, inject fresh=1 for server-cached endpoints after mutations, and cache GETs safely
api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase()

  if (isMutation(method)) {
    markDataMutated()
    return config
  }

  if (method === 'get' && needsFreshServerRead(config.url)) {
    config.params = { ...(config.params || {}), fresh: '1' }
    config.cache = false
  }
  if (method === 'get' && isNoClientCacheUrl(config.url)) {
    config.cache = false
  } else if (method === 'get' && isNoClientCacheUrl(config.url)) {
    config.cache = false
  }

  // Skip caching if explicitly disabled via config
  if (method === 'get' && config.cache !== false && config.headers?.['Cache-Control'] !== 'no-cache') {
    const cacheKey = `${config.url || ''}:${JSON.stringify(config.params || {})}`

    config.adapter = async (cfg) => {
      const now = Date.now()
      const startVersion = mutationVersion

      // 1. Check cache hit
      const cached = cache.get(cacheKey)
      if (cached && now < cached.expiresAt) {
        return {
          data: JSON.parse(JSON.stringify(cached.data)),
          status: 200,
          statusText: 'OK',
          headers: { ...cached.headers, 'x-client-cache': 'HIT' },
          config: cfg,
          request: {},
        }
      }

      // 2. In-flight request deduplication
      if (inFlightRequests.has(cacheKey)) {
        const response = await inFlightRequests.get(cacheKey)
        return {
          data: JSON.parse(JSON.stringify(response.data)),
          status: response.status,
          statusText: response.statusText,
          headers: { ...response.headers, 'x-client-cache': 'DEDUP' },
          config: cfg,
          request: response.request,
        }
      }

      // 3. Perform network request via default adapter
      const fetchPromise = defaultAdapter(cfg)
        .then((response) => {
          // Only cache if no mutation happened while this GET was in flight
          if (response.status >= 200 && response.status < 300 && mutationVersion === startVersion) {
            const ttl = getCacheTtl(cfg.url || '')
            cache.set(cacheKey, {
              data: response.data,
              headers: response.headers,
              expiresAt: Date.now() + ttl,
            })
          }
          return response
        })
        .finally(() => {
          if (inFlightRequests.get(cacheKey) === fetchPromise) {
            inFlightRequests.delete(cacheKey)
          }
        })

      inFlightRequests.set(cacheKey, fetchPromise)
      return fetchPromise
    }
  }

  return config
})

// Response interceptor for mutation cleanup and auth error handling
api.interceptors.response.use(
  (response) => {
    // A read that raced the write may have finished before the write committed; drop caches & mark fresh window again.
    if (isMutation(response.config?.method)) {
      markDataMutated()
    }
    return response
  },
  async (error) => {
    if (error.response?.status === 401) {
      clearApiCache()

      const { useAuthStore } = await import('../stores/auth')
      const authStore = useAuthStore()

      if (authStore.firebaseUser) {
        try {
          await authStore.refreshToken()
          return api.request(error.config)
        } catch {
          authStore.logout()
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
