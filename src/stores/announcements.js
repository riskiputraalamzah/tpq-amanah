import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useAnnouncementStore = defineStore('announcements', () => {
    const activeAnnouncements = ref([])
    const fetched = ref(false)
    const loading = ref(false)

    // Fetch pengumuman aktif yang belum di-dismiss oleh user ini
    async function fetchActive() {
        if (loading.value) return
        loading.value = true
        try {
            const { data } = await api.get('/announcements/active')
            activeAnnouncements.value = data
            fetched.value = true
        } catch (e) {
            console.error('Failed to fetch announcements:', e)
        } finally {
            loading.value = false
        }
    }

    // Dismiss satu pengumuman — hapus dari state lokal & kirim ke backend
    async function dismiss(id) {
        // Optimistically remove from UI first
        activeAnnouncements.value = activeAnnouncements.value.filter(a => a.id !== id)
        try {
            await api.post(`/announcements/${id}/dismiss`)
        } catch (e) {
            console.error('Failed to dismiss announcement:', e)
            // If it fails, refetch to restore correct state
            await fetchActive()
        }
    }

    // Reset store (saat logout)
    function reset() {
        activeAnnouncements.value = []
        fetched.value = false
    }

    return {
        activeAnnouncements,
        fetched,
        loading,
        fetchActive,
        dismiss,
        reset,
    }
})
