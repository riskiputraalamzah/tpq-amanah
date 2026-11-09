import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import api, { clearApiCache } from '../services/api'

const CACHED_USER_KEY = 'tpq_user'
const SESSION_INVALID_STATUSES = [401, 403, 404]

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
    const token = ref(localStorage.getItem('tpq_token') || null)
    const user = ref(token.value ? readCachedUser() : null)
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

    // Set token to API headers
    const setToken = (newToken) => {
        token.value = newToken
        if (newToken) {
            localStorage.setItem('tpq_token', newToken)
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
        } else {
            localStorage.removeItem('tpq_token')
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
        if (token.value) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
            try {
                const { data } = await api.get('/auth/verify', { cache: false })
                user.value = data
                authChecked.value = true
                sessionVerified = true
                return
            } catch (err) {
                if (!SESSION_INVALID_STATUSES.includes(err.response?.status)) {
                    // Network or server trouble must not log the user out; the next load retries.
                    authChecked.value = true
                    return
                }
                console.log('Token expired, clearing...')
                setToken(null)
            }
        }

        // Also check Firebase auth state (lazy load Firebase)
        const { auth: firebaseAuth } = await getFirebase()
        const { onAuthStateChanged } = await import('firebase/auth')

        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
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
                authChecked.value = true
                unsubscribe()
                resolve()
            })
        })
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

    // Login dengan Google (untuk Santri) - Firebase loaded lazily
    async function loginWithGoogle() {
        loading.value = true
        error.value = null
        try {
            const { auth: firebaseAuth, googleProvider: provider } = await getFirebase()
            const { signInWithPopup } = await import('firebase/auth')

            const result = await signInWithPopup(firebaseAuth, provider)
            const fbToken = await result.user.getIdToken()
            api.defaults.headers.common['Authorization'] = `Bearer ${fbToken}`
            const { data } = await api.get('/users/me')
            user.value = data
            firebaseUser.value = result.user
            authChecked.value = true
            return { success: true }
        } catch (err) {
            console.error('Login error:', err)
            error.value = err.code || err.message
            return { success: false, error: { code: err.code, message: err.message } }
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
        checkAuth,
        revalidateSession,
        loginWithCredentials,
        loginWithGoogle,
        logout,
        refreshToken
    }
})

