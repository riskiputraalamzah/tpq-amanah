import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
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
