import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import api, { clearApiCache } from '../services/api'
import { withAliases } from '../utils/guruRights'

const CACHED_USER_KEY = 'tpq_user'
const SESSION_INVALID_STATUSES = [401, 403, 404]

function readStoredToken() {
    try {
        return localStorage.getItem('tpq_token') || null
    } catch {
        return null
    }
}

function readCachedUser() {
    try {
        const cached = JSON.parse(localStorage.getItem(CACHED_USER_KEY))
        return cached?.role ? cached : null
    } catch {
        return null
    }
}

// Only what is needed to render the app before the session is re-verified.
function writeCachedUser(user) {
    try {
        if (!user) {
            localStorage.removeItem(CACHED_USER_KEY)
            return
        }
        const { id, uid, username, displayName, role, permissions, photoURL } = user
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify({
            id,
            uid,
            username,
            displayName,
            role,
            permissions,
            // Uploaded photos can be large data URLs that would overflow localStorage.
            photoURL: photoURL?.startsWith?.('data:') ? null : photoURL
        }))
    } catch {
        // Storage unavailable: the session is simply verified over the network instead.
    }
}

// Firebase config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Lazy-loaded Firebase instances
let firebaseApp = null
let auth = null
let googleProvider = null

// Initialize Firebase lazily for better performance
async function getFirebase() {
    if (!firebaseApp) {
        const { initializeApp } = await import('firebase/app')
        const { getAuth, GoogleAuthProvider } = await import('firebase/auth')
        firebaseApp = initializeApp(firebaseConfig)
        auth = getAuth(firebaseApp)
        googleProvider = new GoogleAuthProvider()
    }
    return { auth, googleProvider }
}

export const useAuthStore = defineStore('auth', () => {
    const token = ref(readStoredToken())
    const user = ref(token.value ? readCachedUser() : null)
    // an account that still has an old access id ("Export PDF") sees what it became ("Rekap Absensi")
    watch(user, (u) => {
        const f = u?.permissions?.features
        if (Array.isArray(f)) {
            const next = withAliases(f)
            if (next.length !== f.length) u.permissions.features = next
        }
    }, { immediate: true })
    const firebaseUser = ref(null)
    const loading = ref(false)
    const error = ref(null)
    // A cached user lets the first page render immediately; revalidateSession confirms it afterwards.
    const authChecked = ref(!!user.value)
    let sessionVerified = false
    let authCheckInFlight = null

    if (token.value) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }

    watch(user, writeCachedUser, { flush: 'sync' })

    const isAuthenticated = computed(() => !!user.value)
    const isAdmin = computed(() => user.value?.role === 'admin')
    const isGuru = computed(() => user.value?.role === 'guru')
    const isSantri = computed(() => user.value?.role === 'santri')
    const isWali = computed(() => user.value?.role === 'wali')

    // Set token to API headers
    const setToken = (newToken) => {
        token.value = newToken
        if (newToken) {
            try {
                localStorage.setItem('tpq_token', newToken)
            } catch {
                // Storage unavailable
            }
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        } else {
            try {
                localStorage.removeItem('tpq_token')
            } catch {
                // Storage unavailable
            }
            delete api.defaults.headers.common['Authorization']
        }
    }

    // Confirms a cached session in the background. Returns false only when the server rejected it,
    // or null when there is nothing to confirm.
    function revalidateSession() {
        if (sessionVerified || !token.value || !user.value) return null
        sessionVerified = true
        const verifiedToken = token.value
        return api.get('/auth/verify', { cache: false })
            .then(({ data }) => {
                if (token.value === verifiedToken) user.value = data
                return true
            })
            .catch((err) => {
                if (token.value !== verifiedToken) return true
                if (SESSION_INVALID_STATUSES.includes(err.response?.status)) {
                    setToken(null)
                    user.value = null
                    return false
                }
                // Offline or server hiccup: keep the session and let the next load verify it.
                sessionVerified = false
                return true
            })
    }

    // The signed-in account again from the server (its special access may have changed meanwhile: the admin added or
    // removed one). At most once a minute; the menus follow at once. A failure changes nothing.
    let lastRefresh = Date.now()
    let refreshing = null
    function refreshUser({ minIntervalMs = 60 * 1000 } = {}) {
        if (!token.value || !user.value || user.value.role === 'wali') return null
        if (refreshing || Date.now() - lastRefresh < minIntervalMs) return refreshing
        lastRefresh = Date.now()
        const asked = token.value
        refreshing = api.get('/auth/verify', { cache: false })
            .then(({ data }) => {
                if (token.value === asked && data && data.role) {
                    user.value = data
                    writeCachedUser(data)
                }
            })
            .catch(() => {})
            .finally(() => {
                refreshing = null
            })
        return refreshing
    }

    // Check auth on app load
    function checkAuth() {
        if (!authCheckInFlight) {
            authCheckInFlight = runAuthCheck().finally(() => {
                authCheckInFlight = null
            })
        }
        return authCheckInFlight
    }

    async function runAuthCheck() {
        try {
            if (token.value) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
                try {
                    const { data } = await api.get('/auth/verify', { cache: false })
                    user.value = data
                    sessionVerified = true
                    return
                } catch (err) {
                    if (!SESSION_INVALID_STATUSES.includes(err.response?.status)) {
                        // Network or server trouble must not log the user out; the next load retries.
                        return
                    }
                    console.log('Token expired, clearing...')
                    setToken(null)
                }
            }

            if (!firebaseConfig.apiKey) return

            // Also check Firebase auth state (lazy load Firebase), capped so a wedged IndexedDB never hangs boot
            const { auth: firebaseAuth } = await getFirebase()
            const { onAuthStateChanged } = await import('firebase/auth')

            await new Promise((resolve) => {
                let settled = false
                let unsubscribe = null
                const finish = () => {
                    if (settled) return
                    settled = true
                    clearTimeout(timer)
                    if (typeof unsubscribe === 'function') {
                        try { unsubscribe() } catch {}
                    }
                    resolve()
                }
                const timer = setTimeout(finish, 4000)

                unsubscribe = onAuthStateChanged(
                    firebaseAuth,
                    async (fbUser) => {
                        firebaseUser.value = fbUser
                        if (fbUser && !user.value) {
                            try {
                                const fbToken = await fbUser.getIdToken()
                                api.defaults.headers.common['Authorization'] = `Bearer ${fbToken}`
                                const { data } = await api.get('/users/me')
                                user.value = data
                            } catch (err) {
                                console.error('Failed to get user profile:', err)
                            }
                        }
                        finish()
                    },
                    () => finish()
                )
            })
        } catch (err) {
            console.error('Auth check failed safely:', err)
        } finally {
            authChecked.value = true
        }
    }

    // Login dengan username/password (untuk Admin dan Guru)
    async function loginWithCredentials(username, password) {
        loading.value = true
        error.value = null
        try {
            const { data } = await api.post('/auth/login', { username, password })
            setToken(data.token)
            user.value = data.user
            authChecked.value = true
            sessionVerified = true
            return { success: true }
        } catch (err) {
            const message = err.response?.data?.error || 'Login gagal'
            error.value = message
            return { success: false, error: message }
        } finally {
            loading.value = false
        }
    }

    // Wali santri: the 6-digit code the TPQ WhatsApp bot sent to their number
    async function loginWithWaliOtp(phone, code) {
        loading.value = true
        error.value = null
        try {
            const { data } = await api.post('/wali/auth/verify-otp', { phone, code })
            setToken(data.token)
            user.value = data.user
            authChecked.value = true
            sessionVerified = true
            return { success: true }
        } catch (err) {
            const message = err.response?.data?.error || 'Gagal masuk. Coba lagi.'
            error.value = message
            return { success: false, error: message }
        } finally {
            loading.value = false
        }
    }

    async function logout() {
        try {
            const { auth: firebaseAuth } = await getFirebase()
            const { signOut } = await import('firebase/auth')
            await signOut(firebaseAuth)
        } catch (err) {
            console.log('Firebase signout error:', err)
        }
        user.value = null
        firebaseUser.value = null
        setToken(null)
        sessionVerified = false
        clearApiCache()
        // the wali portal's data on this phone (a shared phone keeps nothing of this parent)
        try {
            const [{ clearWaliCache }, { resetWaliAnnouncements }] = await Promise.all([
                import('@/utils/waliCache'),
                import('@/composables/useWaliAnnouncements'),
            ])
            clearWaliCache()
            resetWaliAnnouncements()
        } catch (err) {
            console.log('Wali cache clear error:', err)
        }
    }

    async function refreshToken() {
        if (firebaseUser.value) {
            const fbToken = await firebaseUser.value.getIdToken(true)
            api.defaults.headers.common['Authorization'] = `Bearer ${fbToken}`
        }
    }

    return {
        user,
        firebaseUser,
        loading,
        error,
        authChecked,
        token,
        isAuthenticated,
        isAdmin,
        isGuru,
        isSantri,
        isWali,
        checkAuth,
        revalidateSession,
        refreshUser,
        loginWithCredentials,
        loginWithWaliOtp,
        logout,
        refreshToken
    }
})

