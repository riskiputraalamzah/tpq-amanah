// "Hadir" may not be recorded for a teacher before their sesi starts (today), nor for a day still to come; the server
// refuses it (utils/session_window.js teacherHadirOpen). The admin's pages ask once per guru + date and switch the
// Hadir button off with the reason, instead of failing after a tap. Izin / sakit ("Tidak hadir") are never limited.
//
//   const { block, check, reset } = useHadirBlock()
//   check(guruId, 'YYYY-MM-DD', originalStatus)   // block.value: null | { short, reason }
import { ref, computed } from 'vue'
import api from '@/services/api'

export function useHadirBlock() {
  const info = ref(null)
  let seq = 0 // an old answer never replaces a newer question

  async function check(guruId, date, originalStatus = '') {
    const mine = ++seq
    info.value = null
    // a record that already says hadir keeps it; no guru / date yet: nothing to ask
    if (originalStatus === 'hadir' || !guruId || !/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return
    try {
      const { data } = await api.get('/attendance/hadir-window', { params: { guruId, date }, cache: false })
      if (mine === seq) info.value = data
    } catch {
      if (mine === seq) info.value = null // the save itself still checks
    }
  }

  function reset() {
    seq += 1
    info.value = null
  }

  const block = computed(() => {
    const i = info.value
    if (!i || i.open !== false) return null
    return {
      short: i.opensAt ? `Dibuka pukul ${String(i.opensAt).replace(':', '.')}, saat sesi guru dimulai` : 'Belum bisa untuk hari yang akan datang',
      reason: i.reason || 'Absen hadir belum bisa diisi sekarang.',
    }
  })

  return { block, check, reset }
}
