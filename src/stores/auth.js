import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth'
import api from '../services/api'

// Firebase config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const firebaseUser = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const authChecked = ref(false)
    const token = ref(localStorage.getItem('tpq_token') || null)

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

    // Check auth on app load
    async function checkAuth() {
        if (token.value) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
            try {
                const { data } = await api.get('/auth/verify')
                user.value = data
                authChecked.value = true
                return
            } catch (err) {
                console.log('Token expired, clearing...')
                setToken(null)
            }
        }

        // Also check Firebase auth state
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
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
            return { success: true }
        } catch (err) {
            const message = err.response?.data?.error || 'Login gagal'
            error.value = message
            return { success: false, error: message }
        } finally {
            loading.value = false
        }
    }

    // Login dengan Google (untuk Santri)
    async function loginWithGoogle() {
        loading.value = true
        error.value = null
        try {
            const result = await signInWithPopup(auth, googleProvider)
            const fbToken = await result.user.getIdToken()
            api.defaults.headers.common['Authorization'] = `Bearer ${fbToken}`
            const { data } = await api.get('/users/me')
            user.value = data
            firebaseUser.value = result.user
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
            await signOut(auth)
        } catch (err) {
            console.log('Firebase signout error:', err)
        }
        user.value = null
        firebaseUser.value = null
        setToken(null)
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
        loginWithCredentials,
        loginWithGoogle,
        logout,
        refreshToken
    }
})
