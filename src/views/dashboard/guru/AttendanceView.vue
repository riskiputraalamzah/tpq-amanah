<template>
  <div class="attendance-view">
    <header class="page-header">
      <h1>Absensi Online</h1>
      <p>Catat kehadiran mengajar (Senin - Jumat)</p>
    </header>

    <!-- Today's Card - Prominent Design -->
    <div class="today-card glass-card">
      <div class="today-date-display">
        <span class="day-name">{{ dayName }}</span>
        <div class="date-number">{{ dateNumber }}</div>
        <span class="month-year">{{ monthYear }}</span>
      </div>

      <div class="today-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-today">
          <SkeletonLoader type="text" height="24px" width="180px" />
          <SkeletonLoader type="text" height="40px" width="220px" />
          <SkeletonLoader type="text" height="20px" width="140px" />
        </div>

        <div v-else-if="isWeekend" class="weekend-notice">
          <span class="weekend-icon">🏖️</span>
          <p>Hari ini adalah akhir pekan.<br/>Absensi hanya untuk hari Senin - Jumat.</p>
        </div>

        <div v-else-if="todayAttendance" class="attendance-done">
          <div class="done-icon">✅</div>
          <h3>Absensi Hari Ini Sudah Tercatat</h3>
          <div class="status-display" :class="todayAttendance.status">
            {{ todayAttendance.status === 'hadir' ? 'HADIR' : 'TIDAK HADIR' }}
          </div>
          <p v-if="todayAttendance.notes" class="notes-text">Catatan: {{ todayAttendance.notes }}</p>
        </div>

        <div v-else class="attendance-form">
          <h3>Pilih Status Kehadiran</h3>
          <div class="status-buttons">
            <button 
              class="status-btn hadir" 
              :class="{ active: selectedStatus === 'hadir' }"
              @click="selectedStatus = 'hadir'"
            >
              <span class="btn-icon">✓</span>
              <span class="btn-text">HADIR</span>
            </button>
            <button 
              class="status-btn tidak-hadir" 
              :class="{ active: selectedStatus === 'tidak_hadir' }"
              @click="selectedStatus = 'tidak_hadir'"
            >
              <span class="btn-icon">✗</span>
              <span class="btn-text">TIDAK HADIR</span>
            </button>
          </div>
          
          <div class="notes-input">
            <label class="form-label">Catatan (Opsional)</label>
            <input 
              v-model="notes" 
              type="text" 
              class="form-input" 
              placeholder="Tambahkan catatan jika perlu..."
            />
          </div>
          
          <button 
            class="btn btn-primary btn-submit" 
            @click="submitAttendance" 
            :disabled="!selectedStatus || submitting"
          >
            {{ submitting ? 'Menyimpan...' : 'Simpan Absensi' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Monthly Recap -->
    <div class="recap-section">
      <h2>Rekap Bulan Ini</h2>
      <div class="recap-cards">
        <div class="recap-card glass-card">
          <div class="recap-icon hadir">✓</div>
          <div class="recap-value">{{ monthlyStats.hadir }}</div>
          <div class="recap-label">Hari Hadir</div>
        </div>
        <div class="recap-card glass-card">
          <div class="recap-icon tidak">✗</div>
          <div class="recap-value">{{ monthlyStats.tidakHadir }}</div>
          <div class="recap-label">Tidak Hadir</div>
        </div>
        <div class="recap-card glass-card salary">
          <div class="recap-icon gaji">💰</div>
          <div class="recap-value">Rp {{ formatCurrency(monthlyStats.hadir * 10000) }}</div>
          <div class="recap-label">Estimasi Gaji</div>
        </div>
      </div>
    </div>

    <!-- History Section -->
    <div class="history-section">
      <div class="history-header">
        <h2>Riwayat Absensi</h2>
        <select v-model="selectedMonth" class="month-select" @change="fetchAttendance">
          <option v-for="m in availableMonths" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>

      <div v-if="loading" class="loading-list">
        <SkeletonLoader v-for="i in 5" :key="i" type="text" height="50px" />
      </div>

      <div v-else-if="attendanceHistory.length === 0" class="empty-history glass-card">
        <p>Belum ada data absensi untuk bulan ini.</p>
      </div>

      <div v-else class="history-list">
        <div v-for="item in attendanceHistory" :key="item.id" class="history-item glass-card">
          <div class="history-date">
            <span class="history-day">{{ formatHistoryDay(item.date) }}</span>
            <span class="history-full-date">{{ formatDate(item.date) }}</span>
          </div>
          <div class="history-status">
            <span class="status-badge" :class="item.status === 'hadir' ? 'hadir' : 'tidak'">
              {{ item.status === 'hadir' ? 'Hadir' : 'Tidak Hadir' }}
            </span>
            <span v-if="item.notes" class="history-notes">{{ item.notes }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

const today = new Date()
const isWeekend = computed(() => [0, 6].includes(today.getDay()))

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const dayName = computed(() => dayNames[today.getDay()])
const dateNumber = computed(() => today.getDate())
const monthYear = computed(() => `${monthNames[today.getMonth()]} ${today.getFullYear()}`)

const selectedStatus = ref(null)
const notes = ref('')
const submitting = ref(false)
const loading = ref(true)
const todayAttendance = ref(null)
const attendanceHistory = ref([])
const selectedMonth = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)

const availableMonths = computed(() => {
  const months = []
  const startYear = 2026
  const startMonth = 0 // January (0-indexed)
  
  // Generate months from January 2026 up to current month
  for (let year = startYear; year <= today.getFullYear(); year++) {
    const monthStart = (year === startYear) ? startMonth : 0
    const monthEnd = (year === today.getFullYear()) ? today.getMonth() : 11
    
    for (let month = monthStart; month <= monthEnd; month++) {
      months.push({
        value: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: `${monthNames[month]} ${year}`
      })
    }
  }
  
  // Sort descending (newest first)
  return months.reverse()
})

const monthlyStats = computed(() => {
  const hadir = attendanceHistory.value.filter(a => a.status === 'hadir').length
  const tidakHadir = attendanceHistory.value.filter(a => a.status !== 'hadir').length
  return { hadir, tidakHadir }
})

const formatCurrency = (num) => {
  return num.toLocaleString('id-ID')
}

const formatDate = (d) => {
  if (!d) return '-'
  // Handle Firestore Timestamp format (_seconds or seconds)
  let date
  if (d.toDate && typeof d.toDate === 'function') {
    date = d.toDate()
  } else if (d._seconds !== undefined) {
    date = new Date(d._seconds * 1000)
  } else if (d.seconds !== undefined) {
    date = new Date(d.seconds * 1000)
  } else {
    date = new Date(d)
  }
  return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatHistoryDay = (d) => {
  if (!d) return '-'
  // Handle Firestore Timestamp format (_seconds or seconds)
  let date
  if (d.toDate && typeof d.toDate === 'function') {
    date = d.toDate()
  } else if (d._seconds !== undefined) {
    date = new Date(d._seconds * 1000)
  } else if (d.seconds !== undefined) {
    date = new Date(d.seconds * 1000)
  } else {
    date = new Date(d)
  }
  return isNaN(date.getTime()) ? '-' : dayNames[date.getDay()]
}

const fetchAttendance = async () => {
  loading.value = true
  try {
    const [year, month] = selectedMonth.value.split('-').map(Number)
    const { data } = await api.get('/attendance/me', { params: { month, year } })
    attendanceHistory.value = data

    const todayStr = today.toISOString().split('T')[0]
    todayAttendance.value = data.find(a => {
      if (!a.date) return false
      // Handle Firestore Timestamp format
      let d
      if (a.date._seconds !== undefined) {
        d = new Date(a.date._seconds * 1000)
      } else if (a.date.seconds !== undefined) {
        d = new Date(a.date.seconds * 1000)
      } else {
        d = new Date(a.date)
      }
      return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === todayStr
    }) || null
  } catch (e) {
    console.log('Fetch error')
  } finally {
    loading.value = false
  }
}

const submitAttendance = async () => {
  if (!selectedStatus.value) return
  submitting.value = true
  try {
    const status = selectedStatus.value === 'hadir' ? 'hadir' : 'izin'
    const { data } = await api.post('/attendance', { 
      date: today.toISOString(), 
      status, 
      notes: notes.value 
    })
    todayAttendance.value = { 
      id: data.id, 
      status, 
      notes: notes.value, 
      date: today 
    }
    attendanceHistory.value.unshift(todayAttendance.value)
  } catch (e) {
    alert(e.response?.data?.error || 'Gagal menyimpan absensi')
  } finally {
    submitting.value = false
  }
}

onMounted(fetchAttendance)
</script>

<style scoped>
.attendance-view {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .attendance-view {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-size: 1.75rem;
  color: var(--primary-dark);
}

.page-header p {
  color: var(--gray-600);
}

/* Today Card */
.today-card {
  display: flex;
  gap: var(--space-xl);
  padding: var(--space-xl);
  margin-bottom: var(--space-2xl);
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9));
}

@media (max-width: 768px) {
  .today-card {
    flex-direction: column;
    text-align: center;
  }
}

.today-date-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg) var(--space-2xl);
  background: var(--primary-gradient);
  border-radius: var(--radius-xl);
  color: white;
  min-width: 140px;
}

.day-name {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
}

.date-number {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1;
  margin: var(--space-sm) 0;
}

.month-year {
  font-size: 0.875rem;
  opacity: 0.9;
}

.today-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.loading-today {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.weekend-notice {
  text-align: center;
  padding: var(--space-xl);
  color: var(--gray-500);
}

.weekend-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--space-md);
}

.attendance-done {
  text-align: center;
  padding: var(--space-lg);
}

.done-icon {
  font-size: 3rem;
  margin-bottom: var(--space-md);
}

.attendance-done h3 {
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
}

.status-display {
  display: inline-block;
  padding: var(--space-md) var(--space-2xl);
  border-radius: var(--radius-full);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.status-display.hadir {
  background: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
}

.status-display.izin, .status-display.sakit, .status-display.tidak_hadir {
  background: rgba(244, 67, 54, 0.15);
  color: #c62828;
}

.notes-text {
  margin-top: var(--space-md);
  color: var(--gray-500);
  font-style: italic;
}

.attendance-form h3 {
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
  text-align: center;
}

.status-buttons {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.status-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-lg);
  border-radius: var(--radius-xl);
  border: 3px solid var(--gray-200);
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.status-btn .btn-icon {
  font-size: 2rem;
  margin-bottom: var(--space-sm);
}

.status-btn .btn-text {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.status-btn.hadir:hover, .status-btn.hadir.active {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.status-btn.hadir.active {
  background: #4caf50;
  color: white;
}

.status-btn.tidak-hadir:hover, .status-btn.tidak-hadir.active {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.status-btn.tidak-hadir.active {
  background: #f44336;
  color: white;
}

.notes-input {
  margin-bottom: var(--space-lg);
}

.btn-submit {
  width: 100%;
  padding: var(--space-md) var(--space-xl);
  font-size: 1rem;
}

/* Recap Section */
.recap-section {
  margin-bottom: var(--space-2xl);
}

.recap-section h2 {
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
}

.recap-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

@media (max-width: 768px) {
  .recap-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }
  
  .recap-card.salary {
    grid-column: 1 / -1; /* Full width - spans both columns */
  }
}

.recap-card {
  padding: var(--space-lg);
  text-align: center;
  background: rgba(255,255,255,0.9);
}

.recap-card.salary {
  background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,193,7,0.1));
  border: 2px solid rgba(255,193,7,0.3);
}

.recap-icon {
  font-size: 2rem;
  margin-bottom: var(--space-sm);
}

.recap-icon.hadir { color: #4caf50; }
.recap-icon.tidak { color: #f44336; }
.recap-icon.gaji { color: #ffc107; }

.recap-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.recap-label {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-top: var(--space-xs);
}

/* History Section */
.history-section h2 {
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.month-select {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  border: 2px solid var(--gray-200);
  font-size: 0.875rem;
  background: white;
}

.loading-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.empty-history {
  padding: var(--space-2xl);
  text-align: center;
  color: var(--gray-500);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: rgba(255,255,255,0.9);
}

.history-date {
  display: flex;
  flex-direction: column;
}

.history-day {
  font-weight: 600;
  color: var(--primary-dark);
}

.history-full-date {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.history-status {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.status-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.status-badge.hadir {
  background: rgba(76, 175, 80, 0.15);
  color: #388e3c;
}

.status-badge.tidak {
  background: rgba(244, 67, 54, 0.15);
  color: #d32f2f;
}

.history-notes {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-style: italic;
}
</style>
