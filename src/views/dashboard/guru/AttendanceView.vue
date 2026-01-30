<template>
  <div class="attendance-view">
    <header class="page-header">
      <h1>Absensi Online</h1>
      <p>Catat kehadiran mengajar (Senin - Jumat)</p>
    </header>

    <!-- Holiday Banner -->
    <div v-if="todayHoliday.isHoliday" class="holiday-alert today-holiday">
      <div class="holiday-alert-icon">🎉</div>
      <div class="holiday-alert-content">
        <span class="holiday-alert-label">Hari Ini Libur Nasional</span>
        <span class="holiday-alert-name">{{ todayHoliday.holidayName }}</span>
      </div>
    </div>
    <div v-else-if="tomorrowHoliday.isHoliday" class="holiday-alert tomorrow-holiday">
      <div class="holiday-alert-icon">📅</div>
      <div class="holiday-alert-content">
        <span class="holiday-alert-label">Besok Libur Nasional</span>
        <span class="holiday-alert-name">{{ tomorrowHoliday.holidayName }}</span>
      </div>
    </div>

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

        <div v-else-if="todayHoliday.isHoliday" class="holiday-notice">
          <span class="holiday-notice-icon">🎉</span>
          <h3>Hari Ini Libur Nasional</h3>
          <p class="holiday-notice-name">{{ todayHoliday.holidayName }}</p>
          <p class="holiday-notice-text">Tidak ada absensi untuk hari libur nasional.<br/>Selamat beristirahat! 🙏</p>
        </div>

        <div v-else-if="todayAttendance" class="attendance-done">
          <div class="done-icon">✅</div>
          <h3>Absensi Hari Ini Sudah Tercatat</h3>
          <div class="status-display" :class="todayAttendance.status">
            {{ todayAttendance.status === 'hadir' ? 'HADIR' : 'TIDAK HADIR' }}
          </div>
          <p v-if="todayAttendance.notes" class="notes-text">Catatan: {{ todayAttendance.notes }}</p>
          <button class="btn btn-secondary ms-2 btn-update" @click="openUpdateModal">
            ✏️ Ubah Status
          </button>
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
          <div v-if="loading" class="recap-value-skeleton"></div>
          <div v-else class="recap-value">{{ monthlyStats.hadir }}</div>
          <div class="recap-label">Hari Hadir</div>
        </div>
        <div class="recap-card glass-card">
          <div class="recap-icon tidak">✗</div>
          <div v-if="loading" class="recap-value-skeleton"></div>
          <div v-else class="recap-value">{{ monthlyStats.tidakHadir }}</div>
          <div class="recap-label">Tidak Hadir</div>
        </div>
        <div class="recap-card glass-card salary">
          <div class="recap-icon gaji">💰</div>
          <div v-if="loading" class="recap-value-skeleton wide"></div>
          <div v-else class="recap-value">Rp {{ formatCurrency(monthlyStats.hadir * 10000) }}</div>
          <div class="recap-label">Estimasi Gaji</div>
        </div>
      </div>
    </div>

    <!-- History Section - Calendar View -->
    <div class="history-section">
      <div class="history-header">
        <h2>Riwayat Absensi</h2>
      </div>

      <!-- Calendar Navigation -->
      <div class="calendar-section glass-card">
        <div class="calendar-header">
          <button class="nav-btn" @click="prevMonth" :disabled="isFirstMonth">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h3>{{ calendarMonthNames[calendarMonth] }} {{ calendarYear }}</h3>
          <button class="nav-btn" @click="nextMonth" :disabled="isCurrentCalendarMonth">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div v-if="loading" class="loading-calendar">
          <div class="skeleton-calendar-grid">
            <div v-for="i in 7" :key="'header-'+i" class="skeleton-day-header"></div>
            <div v-for="i in 35" :key="'cell-'+i" class="skeleton-calendar-cell"></div>
          </div>
        </div>

        <template v-else>
          <!-- Calendar Grid -->
          <div class="calendar-grid">
            <!-- Day Headers -->
            <div class="day-header" v-for="day in calendarDayNames" :key="day">{{ day }}</div>
            
            <!-- Empty cells for alignment -->
            <div v-for="n in firstDayOfMonth" :key="'empty-' + n" class="calendar-cell empty"></div>
            
            <!-- Date Cells -->
            <div 
              v-for="date in daysInMonth" 
              :key="date"
              class="calendar-cell"
              :class="getCalendarCellClass(date)"
              @click="showCalendarDetail(date)"
              :title="getHolidayForDate(date)?.name || ''"
            >
              <span class="cell-date">{{ date }}</span>
              <span class="cell-status" v-if="getAttendanceForDate(date)">
                {{ getAttendanceForDate(date).status === 'hadir' ? '✓' : '✗' }}
              </span>
              <span class="cell-holiday-dot" v-if="getHolidayForDate(date)">🎉</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="calendar-legend">
            <div class="legend-item"><span class="legend-dot hadir"></span> Hadir</div>
            <div class="legend-item"><span class="legend-dot tidak"></span> Tidak Hadir</div>
            <div class="legend-item"><span class="legend-dot empty"></span> Tidak Ada Data</div>
            <div class="legend-item"><span class="legend-dot libur"></span> Hari Libur</div>
          </div>
        </template>
      </div>

      <!-- Calendar Detail Popup -->
      <div v-if="selectedCalendarDate" class="calendar-popup-overlay" @click="selectedCalendarDate = null"></div>
      <div v-if="selectedCalendarDate" class="calendar-popup glass-card">
        <div class="popup-header">
          <h4>{{ formatCalendarDate(selectedCalendarDate) }}</h4>
          <button class="close-btn" @click="selectedCalendarDate = null">×</button>
        </div>
        
        <!-- Check-in Time - Below Date Header -->
        <div v-if="getCheckinTimeForPopup()" class="popup-checkin-time-header">
          <span class="checkin-icon">🕐</span>
          <span>{{ getCheckinTimeForPopup() }}</span>
        </div>
        
        <!-- Holiday Banner in Popup -->
        <div v-if="getHolidayForDate(selectedCalendarDate)" class="holiday-banner">
          <span class="holiday-icon">🎉</span>
          <div class="holiday-info">
            <span class="holiday-label">Hari Libur Nasional</span>
            <span class="holiday-name">{{ getHolidayForDate(selectedCalendarDate).name }}</span>
          </div>
        </div>
        
        <div class="popup-content" v-if="selectedCalendarAttendance">
          <div class="popup-status" :class="selectedCalendarAttendance.status">
            {{ selectedCalendarAttendance.status === 'hadir' ? '✅ Hadir' : '❌ Tidak Hadir' }}
          </div>
          <p v-if="selectedCalendarAttendance.notes" class="popup-notes">
            <strong>Catatan:</strong> {{ selectedCalendarAttendance.notes }}
          </p>
          <p v-else class="popup-notes empty">Tidak ada catatan</p>
        </div>
        <div class="popup-content" v-else>
          <p class="popup-notes empty">Tidak ada data absensi</p>
        </div>
      </div>
    </div>

    <!-- Update Modal -->
    <div v-if="showUpdateModal" class="modal-overlay" @click.self="closeUpdateModal">
      <div class="modal glass-card">
        <h3>Ubah Status Absensi</h3>
        <p class="modal-date">{{ dayName }}, {{ dateNumber }} {{ monthYear }}</p>
        
        <div class="form-group">
          <label class="form-label">Status Kehadiran</label>
          <div class="status-buttons modal-status">
            <button 
              class="status-btn hadir" 
              :class="{ active: updateForm.status === 'hadir' }"
              @click="updateForm.status = 'hadir'"
            >
              <span class="btn-icon">✓</span>
              <span class="btn-text">HADIR</span>
            </button>
            <button 
              class="status-btn tidak-hadir" 
              :class="{ active: updateForm.status === 'tidak_hadir' }"
              @click="updateForm.status = 'tidak_hadir'"
            >
              <span class="btn-icon">✗</span>
              <span class="btn-text">TIDAK HADIR</span>
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Catatan (Opsional)</label>
          <input v-model="updateForm.notes" type="text" class="form-input" placeholder="Tambahkan catatan..." />
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeUpdateModal">Batal</button>
          <button class="btn btn-primary" @click="submitUpdate" :disabled="updating">
            {{ updating ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast } from '@/composables/useToast'
import { fetchHolidays, isTodayHoliday, isTomorrowHoliday, getHolidaysForMonth } from '@/services/holidayService'

const { success, error: showError } = useToast()

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

// Update modal state
const showUpdateModal = ref(false)
const updating = ref(false)
const updateForm = ref({ status: '', notes: '' })

// Calendar state
const calendarMonth = ref(today.getMonth())
const calendarYear = ref(today.getFullYear())
const calendarMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const calendarDayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const selectedCalendarDate = ref(null)

// Holiday state
const holidays = ref([])
const monthHolidays = ref([])

// Computed for holidays
const todayHoliday = computed(() => isTodayHoliday(holidays.value))
const tomorrowHoliday = computed(() => isTomorrowHoliday(holidays.value))

const isCurrentCalendarMonth = computed(() => {
  return calendarMonth.value === today.getMonth() && calendarYear.value === today.getFullYear()
})

const isFirstMonth = computed(() => {
  return calendarMonth.value === 0 && calendarYear.value === 2026
})

const daysInMonth = computed(() => {
  return new Date(calendarYear.value, calendarMonth.value + 1, 0).getDate()
})

const firstDayOfMonth = computed(() => {
  return new Date(calendarYear.value, calendarMonth.value, 1).getDay()
})

const selectedCalendarAttendance = computed(() => {
  if (!selectedCalendarDate.value) return null
  return getAttendanceForDate(selectedCalendarDate.value)
})

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

// Calendar helper functions
const parseDate = (val) => {
  if (!val) return null
  if (val.toDate && typeof val.toDate === 'function') return val.toDate()
  if (val._seconds !== undefined) return new Date(val._seconds * 1000)
  if (val.seconds !== undefined) return new Date(val.seconds * 1000)
  return new Date(val)
}

const getAttendanceForDate = (date) => {
  return attendanceHistory.value.find(a => {
    const d = parseDate(a.date)
    return d && d.getDate() === date && d.getMonth() === calendarMonth.value && d.getFullYear() === calendarYear.value
  })
}

const getCalendarCellClass = (date) => {
  const classes = []
  const attendance = getAttendanceForDate(date)
  
  if (!attendance) {
    classes.push('no-data')
  } else {
    classes.push(attendance.status === 'hadir' ? 'hadir' : 'tidak')
  }
  
  // Check if this date is a holiday
  if (getHolidayForDate(date)) {
    classes.push('libur')
  }
  
  return classes.join(' ')
}

const getHolidayForDate = (date) => {
  return monthHolidays.value.find(h => h.date === date)
}

const updateMonthHolidays = () => {
  monthHolidays.value = getHolidaysForMonth(calendarMonth.value, calendarYear.value, holidays.value)
}

const formatCalendarDate = (date) => {
  const d = new Date(calendarYear.value, calendarMonth.value, date)
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Format check-in time from createdAt timestamp
const formatCheckinTime = (timestamp) => {
  if (!timestamp) return null
  const d = parseDate(timestamp)
  if (!d || isNaN(d.getTime())) return null
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
}

// Get check-in time for popup display
const getCheckinTimeForPopup = () => {
  if (!selectedCalendarAttendance.value) return null
  if (selectedCalendarAttendance.value.status !== 'hadir') return null
  return formatCheckinTime(selectedCalendarAttendance.value.createdAt)
}

const showCalendarDetail = (date) => {
  selectedCalendarDate.value = date
}

const prevMonth = () => {
  if (isFirstMonth.value) return
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
  // Update selectedMonth and fetch
  selectedMonth.value = `${calendarYear.value}-${String(calendarMonth.value + 1).padStart(2, '0')}`
  fetchAttendance()
  updateMonthHolidays()
}

const nextMonth = () => {
  if (isCurrentCalendarMonth.value) return
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
  // Update selectedMonth and fetch
  selectedMonth.value = `${calendarYear.value}-${String(calendarMonth.value + 1).padStart(2, '0')}`
  fetchAttendance()
  updateMonthHolidays()
}

const fetchAttendance = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/attendance/me', { 
      params: { 
        month: calendarMonth.value + 1, 
        year: calendarYear.value 
      } 
    })
    attendanceHistory.value = data

    // Check for today's attendance using local date comparison
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()
    const todayDate = today.getDate()
    
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
      // Compare using local date components
      return !isNaN(d.getTime()) && 
             d.getFullYear() === todayYear && 
             d.getMonth() === todayMonth && 
             d.getDate() === todayDate
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
      date: today,
      createdAt: new Date() // Add current timestamp for immediate display
    }
    attendanceHistory.value.unshift(todayAttendance.value)
    success('Absensi berhasil disimpan')
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menyimpan absensi')
  } finally {
    submitting.value = false
  }
}

const openUpdateModal = () => {
  updateForm.value = {
    status: todayAttendance.value.status === 'hadir' ? 'hadir' : 'tidak_hadir',
    notes: todayAttendance.value.notes || ''
  }
  showUpdateModal.value = true
}

const closeUpdateModal = () => {
  showUpdateModal.value = false
}

const submitUpdate = async () => {
  if (!updateForm.value.status) return
  updating.value = true
  try {
    await api.put(`/attendance/${todayAttendance.value.id}`, {
      status: updateForm.value.status,
      notes: updateForm.value.notes
    })
    
    // Update local state
    todayAttendance.value.status = updateForm.value.status
    todayAttendance.value.notes = updateForm.value.notes
    
    // Update in history list too
    const idx = attendanceHistory.value.findIndex(a => a.id === todayAttendance.value.id)
    if (idx !== -1) {
      attendanceHistory.value[idx].status = updateForm.value.status
      attendanceHistory.value[idx].notes = updateForm.value.notes
    }
    
    success('Absensi berhasil diperbarui')
    closeUpdateModal()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal memperbarui absensi')
  } finally {
    updating.value = false
  }
}

onMounted(async () => {
  // Fetch holidays first
  holidays.value = await fetchHolidays()
  updateMonthHolidays()
  
  // Fetch attendance
  await fetchAttendance()
})
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

/* Holiday Notice in Today Card */
.holiday-notice {
  text-align: center;
  padding: var(--space-xl);
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 152, 0, 0.1));
  border-radius: var(--radius-xl);
  border: 2px solid rgba(255, 152, 0, 0.3);
}

.holiday-notice-icon {
  font-size: 3.5rem;
  display: block;
  margin-bottom: var(--space-md);
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.holiday-notice h3 {
  color: #e65100;
  margin-bottom: var(--space-sm);
  font-size: 1.25rem;
}

.holiday-notice-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e65100;
  margin-bottom: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
  background: rgba(255, 152, 0, 0.15);
  border-radius: var(--radius-full);
  display: inline-block;
}

.holiday-notice-text {
  color: var(--gray-600);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
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

/* Skeleton Loading for Recap Values */
.recap-value-skeleton {
  height: 1.75rem;
  width: 60px;
  margin: 0 auto;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

.recap-value-skeleton.wide {
  width: 120px;
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

/* Update Button */
.btn-update {
  margin-top: var(--space-lg);
  padding: var(--space-sm) var(--space-lg);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: var(--space-lg);
}

.modal {
  width: 100%;
  max-width: 450px;
  padding: var(--space-xl);
  background: var(--white);
  border-radius: var(--radius-xl);
}

.modal h3 {
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}

.modal-date {
  color: var(--gray-500);
  margin-bottom: var(--space-lg);
}

.modal-status {
  margin-bottom: var(--space-md);
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-xl);
}

/* Calendar Styles */
.calendar-section {
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.95);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.calendar-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--primary-dark);
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--gray-100);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-calendar {
  padding: var(--space-lg);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.day-header {
  text-align: center;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--gray-500);
  padding: var(--space-sm);
}

/* Skeleton Calendar Styles */
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-xs);
}

.skeleton-day-header,
.skeleton-calendar-cell {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

.skeleton-day-header {
  height: 20px;
  margin-bottom: var(--space-xs);
  opacity: 0.7;
}

.skeleton-calendar-cell {
  aspect-ratio: 1;
}

.calendar-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  background: var(--gray-50);
  font-size: 0.875rem;
}

.calendar-cell.empty {
  background: transparent;
  cursor: default;
}

.calendar-cell:not(.empty):hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.calendar-cell.hadir {
  background: rgba(76, 175, 80, 0.2);
  border: 2px solid #4caf50;
}

.calendar-cell.tidak {
  background: rgba(244, 67, 54, 0.2);
  border: 2px solid #f44336;
}

.calendar-cell.no-data {
  background: var(--gray-100);
  border: 1px dashed var(--gray-300);
}

.cell-date {
  font-weight: 600;
  color: var(--gray-800);
}

.cell-status {
  font-size: 0.625rem;
  margin-top: 1px;
}

.calendar-cell.hadir .cell-status { color: #2e7d32; }
.calendar-cell.tidak .cell-status { color: #c62828; }

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--gray-100);
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.75rem;
  color: var(--gray-600);
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.legend-dot.hadir { background: rgba(76, 175, 80, 0.3); border: 2px solid #4caf50; }
.legend-dot.tidak { background: rgba(244, 67, 54, 0.3); border: 2px solid #f44336; }
.legend-dot.empty { background: var(--gray-100); border: 1px dashed var(--gray-300); }
.legend-dot.libur { background: rgba(255, 193, 7, 0.4); border: 2px solid #ffc107; }

/* Holiday Styles */
.calendar-cell.libur {
  background: rgba(255, 193, 7, 0.25) !important;
  border: 2px solid #ffc107 !important;
  position: relative;
}

.calendar-cell.libur.no-data {
  border-style: solid !important;
}

.cell-holiday-dot {
  position: absolute;
  top: 1px;
  right: 1px;
  font-size: 0.4rem;
  line-height: 1;
}

/* Holiday Alert Banner */
.holiday-alert {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-lg);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.today-holiday {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.25));
  border: 2px solid rgba(255, 152, 0, 0.4);
}

.tomorrow-holiday {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.15), rgba(30, 136, 229, 0.2));
  border: 2px solid rgba(33, 150, 243, 0.3);
}

.holiday-alert-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.holiday-alert-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.holiday-alert-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.today-holiday .holiday-alert-label {
  color: #e65100;
}

.tomorrow-holiday .holiday-alert-label {
  color: #1565c0;
}

.holiday-alert-name {
  font-size: 1.1rem;
  font-weight: 600;
}

.today-holiday .holiday-alert-name {
  color: #e65100;
}

.tomorrow-holiday .holiday-alert-name {
  color: #1565c0;
}

/* Holiday Banner in Popup */
.holiday-banner {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.2));
  border-bottom: 1px solid rgba(255, 193, 7, 0.3);
}

.holiday-icon {
  font-size: 1.5rem;
}

.holiday-info {
  display: flex;
  flex-direction: column;
}

.holiday-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #e65100;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.holiday-name {
  font-size: 0.9rem;
  color: #e65100;
  font-weight: 500;
}

@media (max-width: 640px) {
  .holiday-alert {
    padding: var(--space-md);
  }
  
  .holiday-alert-icon {
    font-size: 1.5rem;
  }
  
  .holiday-alert-label {
    font-size: 0.7rem;
  }
  
  .holiday-alert-name {
    font-size: 0.95rem;
  }
  
  .cell-holiday-dot {
    font-size: 0.35rem;
  }
}

/* Calendar Popup */
.calendar-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.calendar-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 350px;
  padding: 0;
  background: white;
  border-radius: var(--radius-xl);
  z-index: 101;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.calendar-popup .popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-100);
}

.calendar-popup .popup-header h4 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--primary-dark);
}

.calendar-popup .close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--gray-400);
  cursor: pointer;
  line-height: 1;
}

.calendar-popup .close-btn:hover {
  color: var(--gray-600);
}

.calendar-popup .popup-content {
  padding: var(--space-lg);
}

.popup-status {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: var(--space-sm);
}

.popup-status.hadir {
  background: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
}

.popup-status.tidak_hadir, .popup-status.izin, .popup-status.sakit {
  background: rgba(244, 67, 54, 0.15);
  color: #c62828;
}

.popup-notes {
  margin: 0;
  padding: var(--space-sm);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--gray-700);
}

.popup-notes.empty {
  color: var(--gray-400);
  font-style: italic;
}

.popup-checkin-time {
  font-size: 0.85rem;
  color: var(--gray-600);
  margin: var(--space-sm) 0;
  padding: var(--space-xs) var(--space-sm);
  background: rgba(33, 150, 243, 0.1);
  border-radius: var(--radius-sm);
  display: inline-block;
}

/* Check-in Time Header - Below Date */
.popup-checkin-time-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(46, 125, 50, 0.08));
  border-bottom: 1px solid rgba(76, 175, 80, 0.2);
  font-size: 0.85rem;
  color: #2e7d32;
  font-weight: 500;
}

.popup-checkin-time-header .checkin-icon {
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  /* Calendar Responsive Fixes */
  .calendar-section {
    padding: var(--space-sm);
  }

  .calendar-header {
    margin-bottom: var(--space-md);
  }

  .calendar-header h3 {
    font-size: 0.9rem;
  }
  
  .nav-btn {
    width: 32px;
    height: 32px;
  }

  .calendar-grid {
    gap: 2px;
  }

  .day-header {
    font-size: 0.65rem;
    padding: 2px 0;
  }

  .calendar-cell {
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
  }

  .cell-date {
    font-size: 0.75rem;
  }

  .cell-status {
    font-size: 0.5rem;
    margin-top: 1px;
  }

  .calendar-legend {
    gap: var(--space-sm);
    margin-top: var(--space-md);
  }
  
  .legend-item {
    font-size: 0.5rem;
  }

  .attendance-view {
    padding-top: 10px;
  }
}

@media (max-width: 400px) {
  .calendar-section {
    padding: 4px;
  }
  
  .calendar-grid {
    gap: 1px;
  }
  
  .cell-date {
    font-size: 0.7rem;
  }
  
  .cell-status {
    font-size: 8px;
  }
}
</style>
