import axios from 'axios'

// In-memory cache store
const cache = new Map()
const inFlightRequests = new Map()

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
    return
  }
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) {
      cache.delete(key)
    }
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Get original adapter
const defaultAdapter = axios.getAdapter(api.defaults.adapter)

// Request interceptor: attach caching adapter for GET requests
api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase()

  // Invalidate cache on data mutation
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    clearApiCache()
    return config
  }

  // Skip caching if explicitly disabled via config
  if (method === 'get' && config.cache !== false && config.headers?.['Cache-Control'] !== 'no-cache') {
    const cacheKey = `${config.url || ''}:${JSON.stringify(config.params || {})}`

    config.adapter = async (cfg) => {
      const now = Date.now()

      // 1. Check cache hit
      const cached = cache.get(cacheKey)
      if (cached && now < cached.expiresAt) {
        return {
          data: JSON.parse(JSON.stringify(cached.data)),
          status: 200,
          statusText: 'OK',
          headers: { ...cached.headers, 'x-client-cache': 'HIT' },
          config: cfg,
          request: {}
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
          request: response.request
        }
      }

      // 3. Perform network request via default adapter
      const fetchPromise = defaultAdapter(cfg)
        .then((response) => {
          if (response.status >= 200 && response.status < 300) {
            const ttl = getCacheTtl(cfg.url || '')
            cache.set(cacheKey, {
              data: response.data,
              headers: response.headers,
              expiresAt: Date.now() + ttl
            })
          }
          return response
        })
        .finally(() => {
          inFlightRequests.delete(cacheKey)
        })

      inFlightRequests.set(cacheKey, fetchPromise)
      return fetchPromise
    }
  }

  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear cache on authentication errors
      clearApiCache()

      // Token expired, try refresh
      const { useAuthStore } = await import('../stores/auth')
      const authStore = useAuthStore()

      if (authStore.firebaseUser) {
        try {
          await authStore.refreshToken()
          // Retry the request
          return api.request(error.config)
        } catch (refreshError) {
          authStore.logout()
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

