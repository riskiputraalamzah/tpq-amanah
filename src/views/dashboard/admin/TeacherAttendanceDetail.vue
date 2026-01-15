<template>
  <div class="teacher-attendance-detail">
    <!-- Back Button -->
    <button class="back-btn" @click="goBack">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Kembali ke Rekap
    </button>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <!-- Header Skeleton -->
      <div class="teacher-header glass-card skeleton-header">
        <div class="teacher-profile">
          <div class="skeleton-avatar-lg"></div>
          <div class="skeleton-info">
            <div class="skeleton-title"></div>
            <div class="skeleton-subtitle"></div>
          </div>
        </div>
        <div class="skeleton-stats-row">
          <div class="skeleton-stat-box"></div>
          <div class="skeleton-stat-box"></div>
          <div class="skeleton-stat-box wide"></div>
        </div>
      </div>
      
      <!-- Calendar Skeleton -->
      <div class="calendar-section glass-card skeleton-calendar">
        <div class="skeleton-calendar-header">
          <div class="skeleton-nav-btn"></div>
          <div class="skeleton-month"></div>
          <div class="skeleton-nav-btn"></div>
        </div>
        <div class="skeleton-grid">
          <div v-for="i in 35" :key="i" class="skeleton-cell"></div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Teacher Header -->
      <header class="teacher-header glass-card">
        <div class="teacher-profile">
          <div class="teacher-avatar">{{ getInitials(teacher?.displayName) }}</div>
          <div class="teacher-info">
            <h1>{{ teacher?.displayName }}</h1>
            <p>{{ teacher?.position || 'Pengajar TPQ AMANAH' }}</p>
          </div>
        </div>
        <div class="teacher-stats">
          <div class="stat-box hadir">
            <span class="stat-value">{{ stats.hadir }}</span>
            <span class="stat-label">Hadir</span>
          </div>
          <div class="stat-box tidak">
            <span class="stat-value">{{ stats.tidakHadir }}</span>
            <span class="stat-label">Tidak Hadir</span>
          </div>
          <div class="stat-box gaji">
            <span class="stat-value">Rp {{ formatCurrency(stats.hadir * 10000) }}</span>
            <span class="stat-label">Gaji</span>
          </div>
        </div>
      </header>

      <!-- Calendar Section -->
      <section class="calendar-section glass-card">
        <!-- Month Navigation -->
        <div class="calendar-header">
          <button class="nav-btn" @click="prevMonth" :disabled="isFirstMonth">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h2>{{ monthNames[currentMonth] }} {{ currentYear }}</h2>
          <button class="nav-btn" @click="nextMonth" :disabled="isCurrentMonth">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <!-- Calendar Grid -->
        <div class="calendar-grid">
          <!-- Day Headers -->
          <div class="day-header" v-for="day in dayNames" :key="day">{{ day }}</div>
          
          <!-- Empty cells for alignment -->
          <div 
            v-for="n in firstDayOfMonth" 
            :key="'empty-' + n" 
            class="calendar-cell empty"
          ></div>
          
          <!-- Date Cells -->
          <div 
            v-for="date in daysInMonth" 
            :key="date"
            class="calendar-cell"
            :class="getCellClass(date)"
            @click="showDateDetail(date)"
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
      </section>

      <!-- Detail Popup -->
      <div v-if="selectedDate" class="date-detail-popup glass-card">
        <div class="popup-header">
          <h3>{{ formatFullDate(selectedDate) }}</h3>
          <button class="close-btn" @click="selectedDate = null">×</button>
        </div>
        
        <!-- Holiday Banner -->
        <div v-if="getHolidayForDate(selectedDate)" class="holiday-banner">
          <span class="holiday-icon">🎉</span>
          <div class="holiday-info">
            <span class="holiday-label">Hari Libur Nasional</span>
            <span class="holiday-name">{{ getHolidayForDate(selectedDate).name }}</span>
          </div>
        </div>
        
        <!-- View Mode -->
        <div class="popup-content" v-if="!isEditing">
          <div v-if="selectedAttendance">
            <div class="status-badge" :class="selectedAttendance.status">
              {{ selectedAttendance.status === 'hadir' ? '✅ Hadir' : '❌ Tidak Hadir' }}
            </div>
            <p v-if="selectedAttendance.notes" class="notes">
              <strong>Keterangan:</strong> {{ selectedAttendance.notes }}
            </p>
            <p v-else class="notes empty">Tidak ada keterangan</p>
            <button class="btn btn-secondary btn-edit" @click="startEdit">✏️ Edit</button>
          </div>
          <div v-else>
            <p class="notes empty">Tidak ada data absensi untuk tanggal ini</p>
            <button class="btn btn-primary btn-add" @click="startAdd">+ Tambah Absensi</button>
          </div>
        </div>
        
        <!-- Edit/Add Mode -->
        <div class="popup-content" v-else>
          <div class="form-group">
            <label class="form-label">Status Kehadiran</label>
            <div class="edit-status-buttons">
              <button 
                class="status-btn-small hadir" 
                :class="{ active: editForm.status === 'hadir' }"
                @click="editForm.status = 'hadir'"
              >✓ Hadir</button>
              <button 
                class="status-btn-small tidak" 
                :class="{ active: editForm.status === 'tidak_hadir' }"
                @click="editForm.status = 'tidak_hadir'"
              >✗ Tidak Hadir</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Keterangan</label>
            <input v-model="editForm.notes" type="text" class="form-input" placeholder="Opsional..." />
          </div>
          <div class="edit-actions">
            <button class="btn btn-secondary" @click="cancelEdit">Batal</button>
            <button class="btn btn-primary" @click="saveEdit" :disabled="saving">
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="selectedDate" class="popup-overlay" @click="selectedDate = null"></div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast } from '@/composables/useToast'
import { fetchHolidays, getHolidaysForMonth } from '@/services/holidayService'

const { success, error: showError } = useToast()

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const teacher = ref(null)
const attendanceData = ref([])
const selectedDate = ref(null)
const holidays = ref([])
const monthHolidays = ref([])

// Edit mode state
const isEditing = ref(false)
const saving = ref(false)
const editForm = ref({ status: '', notes: '' })

const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const guruId = computed(() => route.params.guruId)

const isCurrentMonth = computed(() => {
  return currentMonth.value === today.getMonth() && currentYear.value === today.getFullYear()
})

// Minimum date is January 2026
const isFirstMonth = computed(() => {
  return currentMonth.value === 0 && currentYear.value === 2026
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOfMonth = computed(() => {
  // Sunday = 0, Monday = 1, etc. (no conversion needed for Sun-Sat calendar)
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

const stats = computed(() => {
  const hadir = attendanceData.value.filter(a => a.status === 'hadir').length
  const tidakHadir = attendanceData.value.filter(a => a.status !== 'hadir').length
  return { hadir, tidakHadir }
})

const selectedAttendance = computed(() => {
  if (!selectedDate.value) return null
  return getAttendanceForDate(selectedDate.value)
})

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatCurrency = (num) => num.toLocaleString('id-ID')

const parseDate = (val) => {
  if (!val) return null
  if (val.toDate && typeof val.toDate === 'function') return val.toDate()
  if (val._seconds !== undefined) return new Date(val._seconds * 1000)
  if (val.seconds !== undefined) return new Date(val.seconds * 1000)
  return new Date(val)
}

const getAttendanceForDate = (date) => {
  return attendanceData.value.find(a => {
    const d = parseDate(a.date)
    return d && d.getDate() === date && d.getMonth() === currentMonth.value && d.getFullYear() === currentYear.value
  })
}

const getCellClass = (date) => {
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
  monthHolidays.value = getHolidaysForMonth(currentMonth.value, currentYear.value, holidays.value)
}

const formatFullDate = (date) => {
  const d = new Date(currentYear.value, currentMonth.value, date)
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const showDateDetail = (date) => {
  selectedDate.value = date
  isEditing.value = false
}

const startEdit = () => {
  editForm.value = {
    status: selectedAttendance.value.status === 'hadir' ? 'hadir' : 'tidak_hadir',
    notes: selectedAttendance.value.notes || ''
  }
  isEditing.value = true
}

const startAdd = () => {
  editForm.value = { status: 'hadir', notes: '' }
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
}

const saveEdit = async () => {
  if (!editForm.value.status) return
  saving.value = true
  
  try {
    const dateObj = new Date(currentYear.value, currentMonth.value, selectedDate.value)
    
    // Use admin endpoint which handles both create and update
    await api.post('/attendance/admin', {
      guruId: guruId.value,
      guruName: teacher.value?.displayName || 'Unknown',
      date: dateObj.toISOString(),
      status: editForm.value.status,
      notes: editForm.value.notes
    })
    
    success('Absensi berhasil disimpan')
    
    // Refresh attendance data
    await fetchAttendance()
    isEditing.value = false
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menyimpan absensi')
  } finally {
    saving.value = false
  }
}

const prevMonth = () => {
  if (isFirstMonth.value) return
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  fetchAttendance()
  updateMonthHolidays()
}

const nextMonth = () => {
  if (isCurrentMonth.value) return
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  fetchAttendance()
  updateMonthHolidays()
}

const goBack = () => {
  router.push('/dashboard/admin-attendance')
}

const fetchTeacher = async () => {
  try {
    // Fetch all guru users and find the one we need
    const { data } = await api.get('/users?role=guru')
    teacher.value = data.find(u => u.id === guruId.value) || null
  } catch (e) {
    console.error('Failed to fetch teacher:', e)
  }
}

const fetchAttendance = async () => {
  try {
    const { data } = await api.get('/attendance/all', {
      params: {
        month: currentMonth.value + 1,
        year: currentYear.value
      }
    })
    // Filter for this teacher only
    const teacherRecords = data.filter(a => a.guruId === guruId.value)
    attendanceData.value = teacherRecords
    
    // Fallback: if teacher wasn't fetched, try to get name from attendance data
    if (!teacher.value && teacherRecords.length > 0 && teacherRecords[0].guruName) {
      teacher.value = {
        id: guruId.value,
        displayName: teacherRecords[0].guruName,
        position: 'Pengajar'
      }
    }
  } catch (e) {
    console.error('Failed to fetch attendance:', e)
  }
}

onMounted(async () => {
  loading.value = true
  // Fetch holidays first
  holidays.value = await fetchHolidays()
  updateMonthHolidays()
  
  await Promise.all([fetchTeacher(), fetchAttendance()])
  loading.value = false
})
</script>

<style scoped>
.teacher-attendance-detail {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .teacher-attendance-detail {
    padding-top: 0;
  }
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  color: var(--gray-600);
  font-weight: 500;
  margin-bottom: var(--space-lg);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--gray-50);
  color: var(--primary);
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Skeleton Animation */
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-avatar-lg,
.skeleton-title,
.skeleton-subtitle,
.skeleton-stat-box,
.skeleton-nav-btn,
.skeleton-month,
.skeleton-cell {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-lg);
}

.skeleton-avatar-lg {
  width: 70px;
  height: 70px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.skeleton-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skeleton-title {
  height: 28px;
  width: 180px;
}

.skeleton-subtitle {
  height: 18px;
  width: 120px;
}

.skeleton-stats-row {
  display: flex;
  gap: var(--space-lg);
}

.skeleton-stat-box {
  width: 80px;
  height: 60px;
  border-radius: var(--radius-lg);
}

.skeleton-stat-box.wide {
  width: 110px;
}

.skeleton-calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
}

.skeleton-nav-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
}

.skeleton-month {
  width: 150px;
  height: 28px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  padding: 0 var(--space-lg) var(--space-lg);
}

.skeleton-cell {
  aspect-ratio: 1;
  border-radius: var(--radius-md);
}

/* Teacher Header */
.teacher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
  background: rgba(255, 255, 255, 0.95);
}

.teacher-profile {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.teacher-avatar {
  width: 70px;
  height: 70px;
  border-radius: var(--radius-full);
  background: var(--primary-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
}

.teacher-info h1 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  color: var(--primary-dark);
}

.teacher-info p {
  margin: 0;
  color: var(--gray-500);
}

.teacher-stats {
  display: flex;
  gap: var(--space-lg);
}

.stat-box {
  text-align: center;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  min-width: 90px;
}

.stat-box.hadir {
  background: rgba(76, 175, 80, 0.1);
}

.stat-box.tidak {
  background: rgba(244, 67, 54, 0.1);
}

.stat-box.gaji {
  background: rgba(255, 152, 0, 0.1);
}

.stat-box .stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
}

.stat-box.hadir .stat-value { color: #2e7d32; }
.stat-box.tidak .stat-value { color: #c62828; }
.stat-box.gaji .stat-value { color: #e65100; font-size: 1rem; }

.stat-box .stat-label {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-transform: uppercase;
}

/* Calendar Section */
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

.calendar-header h2 {
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

/* Calendar Grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day-header {
  text-align: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--gray-500);
  padding: var(--space-sm);
}

.calendar-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  background: var(--gray-50);
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
  top: 2px;
  right: 2px;
  font-size: 0.5rem;
  line-height: 1;
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

.cell-date {
  font-weight: 600;
  font-size: 1rem;
  color: var(--gray-800);
}

.cell-status {
  font-size: 0.75rem;
  margin-top: 2px;
}

.calendar-cell.hadir .cell-status { color: #2e7d32; }
.calendar-cell.tidak .cell-status { color: #c62828; }

/* Legend */
.calendar-legend {
  display: flex;
  justify-content: center;
  gap: var(--space-xl);
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--gray-100);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.875rem;
  color: var(--gray-600);
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-dot.hadir { background: rgba(76, 175, 80, 0.3); border: 2px solid #4caf50; }
.legend-dot.tidak { background: rgba(244, 67, 54, 0.3); border: 2px solid #f44336; }
.legend-dot.empty { background: var(--gray-100); border: 1px dashed var(--gray-300); }
.legend-dot.libur { background: rgba(255, 193, 7, 0.4); border: 2px solid #ffc107; }

/* Date Detail Popup */
.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.date-detail-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 400px;
  padding: 0;
  background: white;
  border-radius: var(--radius-xl);
  z-index: 101;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-100);
}

.popup-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--primary-dark);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--gray-400);
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: var(--gray-600);
}

.popup-content {
  padding: var(--space-xl);
}

.status-badge {
  display: inline-block;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-full);
  font-weight: 600;
  margin-bottom: var(--space-md);
}

.status-badge.hadir {
  background: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
}

.status-badge.tidak_hadir {
  background: rgba(244, 67, 54, 0.15);
  color: #c62828;
}

.notes {
  margin: 0;
  padding: var(--space-md);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  color: var(--gray-700);
}

.notes.empty {
  color: var(--gray-400);
  font-style: italic;
}

/* Responsive */
@media (max-width: 640px) {
  .teacher-header {
    flex-direction: column;
    align-items: flex-start;
    padding: var(--space-md);
  }
  
  .teacher-stats {
    width: 100%;
    justify-content: space-between;
    gap: var(--space-sm);
  }
  
  .stat-box {
    flex: 1;
    min-width: 0;
    padding: var(--space-sm);
  }

  .stat-box .stat-value {
    font-size: 0.9rem;
  }
  
  .calendar-legend {
    flex-wrap: wrap;
    gap: var(--space-sm);
    margin-top: var(--space-md);
  }
  
  .legend-item {
    font-size: 0.7rem;
  }

  /* Calendar Responsive Fixes */
  .calendar-section {
    padding: var(--space-sm); 
  }

  .calendar-header {
    margin-bottom: var(--space-md);
  }

  .calendar-header h2 {
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
  }

  .cell-date {
    font-size: 0.75rem;
  }

  .cell-status {
    font-size: 0.5rem;
    margin-top: 1px;
  }

  .teacher-attendance-detail {
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


/* Edit Mode Styles */
.btn-edit, .btn-add {
  margin-top: var(--space-lg);
  width: 100%;
}

.edit-status-buttons {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.status-btn-small {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  border: 2px solid var(--gray-200);
  background: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.status-btn-small.hadir:hover,
.status-btn-small.hadir.active {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
}

.status-btn-small.tidak:hover,
.status-btn-small.tidak.active {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.15);
  color: #c62828;
}

.edit-actions {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

.edit-actions .btn {
  flex: 1;
}
</style>
