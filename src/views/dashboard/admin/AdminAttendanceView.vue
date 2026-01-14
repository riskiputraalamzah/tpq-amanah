<template>
  <div class="admin-attendance-view">
    <header class="page-header">
      <div>
        <h1>📊 Rekap Absensi Guru</h1>
        <p>Monitor kehadiran semua pengajar TPQ AMANAH</p>
      </div>
      <div class="header-actions">
        <select v-model="selectedMonth" class="form-input form-select" @change="fetchData">
          <option v-for="m in availableMonths" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <button class="btn btn-primary" @click="openAddModal">+ Tambah Absensi</button>
      </div>
    </header>

    <!-- Summary Cards -->
    <div class="summary-row">
      <div class="summary-card glass-card">
        <div class="summary-icon">👥</div>
        <div class="summary-content">
          <span class="summary-value">{{ teachers.length }}</span>
          <span class="summary-label">Total Guru</span>
        </div>
      </div>
      <div class="summary-card glass-card">
        <div class="summary-icon">✅</div>
        <div class="summary-content">
          <span class="summary-value">{{ totalAttendance }}</span>
          <span class="summary-label">Total Kehadiran</span>
        </div>
      </div>
      <div class="summary-card glass-card highlight">
        <div class="summary-icon">💰</div>
        <div class="summary-content">
          <span class="summary-value">Rp {{ formatCurrency(totalSalary) }}</span>
          <span class="summary-label">Total Gaji Bulan Ini</span>
        </div>
      </div>
    </div>

    <!-- Teachers Attendance Table -->
    <div class="attendance-table glass-card">
      <div class="table-header">
        <h3>Detail Kehadiran Per Guru</h3>
      </div>

      <div v-if="loading" class="loading-state">
        <SkeletonLoader v-for="i in 5" :key="i" type="text" height="60px" class="skeleton-item" />
      </div>

      <div v-else-if="teachers.length === 0" class="empty-state">
        <p>Belum ada guru yang terdaftar.</p>
      </div>

      <div v-else class="teacher-list">
        <div v-for="teacher in teachersWithStats" :key="teacher.id" class="teacher-row" @click="openDetail(teacher)">
          <div class="teacher-info">
            <div class="teacher-avatar">{{ getInitials(teacher.displayName) }}</div>
            <div class="teacher-details">
              <h4>{{ teacher.displayName }}</h4>
              <p>{{ teacher.position || 'Pengajar' }}</p>
            </div>
          </div>
          <div class="teacher-stats">
            <div class="stat-item hadir">
              <span class="stat-value">{{ teacher.hadirCount }}</span>
              <span class="stat-label">Hadir</span>
            </div>
            <div class="stat-item tidak">
              <span class="stat-value">{{ teacher.tidakHadirCount }}</span>
              <span class="stat-label">Tidak Hadir</span>
            </div>
            <div class="stat-item gaji">
              <span class="stat-value">Rp {{ formatCurrency(teacher.hadirCount * 10000) }}</span>
              <span class="stat-label">Gaji</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Attendance Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal glass-card">
        <h3>Tambah Data Absensi</h3>
        <div class="form-group">
          <label class="form-label">Tanggal</label>
          <input v-model="form.date" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Guru</label>
          <select v-model="form.guruId" class="form-input form-select" @change="onGuruChange">
            <option value="">-- Pilih Guru --</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.displayName }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <div class="status-buttons">
            <button 
              class="status-btn" 
              :class="{ active: form.status === 'hadir', hadir: form.status === 'hadir' }" 
              @click="form.status = 'hadir'"
            >✅ Hadir</button>
            <button 
              class="status-btn" 
              :class="{ active: form.status === 'tidak_hadir', tidak: form.status === 'tidak_hadir' }" 
              @click="form.status = 'tidak_hadir'"
            >❌ Tidak Hadir</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Keterangan (opsional)</label>
          <input v-model="form.notes" type="text" class="form-input" placeholder="Contoh: Izin sakit" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">Batal</button>
          <button class="btn btn-primary" @click="saveAttendance" :disabled="saving">
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { success, error: showError, warning } = useToast()

const today = new Date()
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const loading = ref(true)
const teachers = ref([])
const attendanceData = ref([])
const selectedMonth = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)

const teachersWithStats = computed(() => {
  return teachers.value.map(t => {
    const records = attendanceData.value.filter(a => a.guruId === t.id)
    const hadirCount = records.filter(a => a.status === 'hadir').length
    const tidakHadirCount = records.filter(a => a.status !== 'hadir').length
    return { ...t, hadirCount, tidakHadirCount }
  })
})

// Modal state
const showModal = ref(false)
const saving = ref(false)
const form = ref({ date: '', guruId: '', guruName: '', status: 'hadir', notes: '' })

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



const totalAttendance = computed(() => {
  return teachersWithStats.value.reduce((sum, t) => sum + t.hadirCount, 0)
})

const totalSalary = computed(() => {
  return totalAttendance.value * 10000
})

const formatCurrency = (num) => num.toLocaleString('id-ID')

const parseDate = (val) => {
  if (!val) return null
  if (val.toDate && typeof val.toDate === 'function') {
    return val.toDate()
  }
  if (val._seconds !== undefined) {
    return new Date(val._seconds * 1000)
  }
  if (val.seconds !== undefined) {
    return new Date(val.seconds * 1000)
  }
  return new Date(val)
}

const formatDate = (dateStr) => {
  try {
    const d = parseDate(dateStr)
    if (!d || isNaN(d.getTime())) return '-'
    const options = { weekday: 'long', day: 'numeric', month: 'long' }
    return d.toLocaleDateString('id-ID', options)
  } catch (e) { return '-' }
}

const getMonthShort = (dateStr) => {
  try {
    const d = parseDate(dateStr)
    if (!d || isNaN(d.getTime())) return '?'
    return monthNames[d.getMonth()].substring(0, 3)
  } catch (e) { return '?' }
}

const getDay = (dateStr) => {
  const d = parseDate(dateStr)
  return (!d || isNaN(d.getTime())) ? '-' : d.getDate()
}

const selectedTeacherRecords = computed(() => {
  if (!selectedTeacher.value) return []
  return attendanceData.value
    .filter(a => a.guruId === selectedTeacher.value.id)
    .sort((a, b) => {
      const dateA = parseDate(a.date)
      const dateB = parseDate(b.date)
      return dateB - dateA
    })
})

const openDetail = (teacher) => {
  router.push(`/dashboard/admin-attendance/${teacher.id}`)
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const fetchData = async () => {
  loading.value = true
  try {
    const [year, month] = selectedMonth.value.split('-').map(Number)
    
    const { data: guruData } = await api.get('/users?role=guru')
    teachers.value = guruData

    const { data: attData } = await api.get('/attendance/all', { params: { month, year } })
    attendanceData.value = attData
  } catch (e) {
    console.error('Fetch error:', e)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  form.value = { date: '', guruId: '', guruName: '', status: 'hadir', notes: '' }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const onGuruChange = () => {
  const t = teachers.value.find(t => t.id === form.value.guruId)
  form.value.guruName = t?.displayName || ''
}

const saveAttendance = async () => {
  if (!form.value.date) { warning('Tanggal wajib diisi'); return }
  if (!form.value.guruId) { warning('Pilih guru terlebih dahulu'); return }
  
  saving.value = true
  try {
    await api.post('/attendance/admin', {
      guruId: form.value.guruId,
      guruName: form.value.guruName,
      date: form.value.date,
      status: form.value.status,
      notes: form.value.notes
    })
    success('Absensi berhasil ditambahkan')
    closeModal()
    await fetchData()
  } catch (e) {
    console.error(e)
    showError('Gagal menyimpan absensi')
  } finally {
    saving.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.admin-attendance-view { padding-top: 60px; }
@media (min-width: 1024px) { .admin-attendance-view { padding-top: 0; } }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-size: 1.5rem;
  color: var(--primary-dark);
  margin-bottom: 4px;
}

.page-header p {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin: 0;
}

/* Header Actions - Responsive */
.header-actions {
  display: flex;
  gap: var(--space-md);
  align-items: center;
  flex-wrap: nowrap;
}

.header-actions select {
  min-width: 160px;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    margin-top: var(--space-sm);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }
  .header-actions select,
  .header-actions .btn {
    width: 100%;
    min-width: 0; /* Prevent overflow */
  }
}

/* Summary Cards */
.summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

@media (max-width: 768px) {
  .summary-row {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.95);
}

.summary-card.highlight {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.15));
  border: 2px solid rgba(255, 193, 7, 0.3);
}

.summary-icon {
  font-size: 2.5rem;
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.summary-label {
  font-size: 0.875rem;
  color: var(--gray-500);
}

/* Table */
.attendance-table {
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.95);
}

.table-header {
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 2px solid var(--gray-100);
}

.table-header h3 {
  color: var(--primary-dark);
  margin: 0;
}

.loading-state, .empty-state {
  padding: var(--space-2xl);
  text-align: center;
  color: var(--gray-500);
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.skeleton-item {
  margin-bottom: 0;
}

.teacher-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.teacher-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
  gap: var(--space-md);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.teacher-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  background: white;
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.teacher-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--primary-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.teacher-details h4 {
  color: var(--primary-dark);
  margin: 0 0 2px 0;
}

.teacher-details p {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin: 0;
}

.teacher-stats {
  display: flex;
  gap: var(--space-xl);
}

.stat-item {
  text-align: center;
  min-width: 70px;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-item.hadir .stat-value { color: #4caf50; }
.stat-item.tidak .stat-value { color: #f44336; }
.stat-item.gaji .stat-value { color: #ff9800; font-size: 1rem; }



/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: var(--space-lg); }
.modal { width: 100%; max-width: 450px; padding: var(--space-xl); background: var(--white); border-radius: var(--radius-xl); }
.modal h3 { color: var(--primary-dark); margin-bottom: var(--space-lg); }
.modal-actions { display: flex; gap: var(--space-md); justify-content: flex-end; margin-top: var(--space-xl); }

/* Status Buttons */
.status-buttons { display: flex; gap: var(--space-md); }
.status-btn { flex: 1; padding: var(--space-md); border-radius: var(--radius-lg); font-weight: 600; background: var(--gray-100); color: var(--gray-600); transition: all 0.2s; }
.status-btn.active.hadir { background: rgba(76, 175, 80, 0.15); color: #388e3c; border: 2px solid #4caf50; }
.status-btn.active.tidak { background: rgba(244, 67, 54, 0.15); color: #c62828; border: 2px solid #f44336; }

/* Detail Modal Styles */
.detail-modal { max-width: 500px; padding: 0; overflow: hidden; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; padding: var(--space-xl); background: var(--gray-50); border-bottom: 1px solid var(--gray-100); }
.detail-profile { display: flex; gap: var(--space-lg); align-items: center; }
.teacher-avatar.large { width: 60px; height: 60px; font-size: 1.5rem; }
.detail-header h3 { margin: 0 0 4px 0; font-size: 1.25rem; }
.detail-header p { margin: 0; color: var(--gray-500); font-size: 0.875rem; }
.close-btn { background: none; border: none; font-size: 1.5rem; color: var(--gray-400); cursor: pointer; padding: 0; line-height: 1; }
.close-btn:hover { color: var(--gray-600); }

.detail-stats { display: flex; padding: var(--space-lg) var(--space-xl); gap: var(--space-lg); border-bottom: 1px solid var(--gray-100); }
.mini-stat { display: flex; flex-direction: column; flex: 1; text-align: center; background: var(--gray-50); padding: var(--space-sm); border-radius: var(--radius-md); }
.mini-stat .label { font-size: 0.75rem; color: var(--gray-500); text-transform: uppercase; }
.mini-stat .value { font-weight: 700; font-size: 1.1rem; }
.value.success { color: #4caf50; }
.value.danger { color: #f44336; }
.value.warning { color: #ff9800; }

.history-list { padding: var(--space-lg) var(--space-xl); max-height: 400px; overflow-y: auto; }
.history-item { display: flex; gap: var(--space-lg); padding: var(--space-md) 0; border-bottom: 1px solid var(--gray-100); }
.history-item:last-child { border-bottom: none; }
.history-date { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 50px; background: var(--primary-light); color: var(--primary-dark); border-radius: var(--radius-md); padding: 5px; height: fit-content; }
.date-day { font-weight: 800; font-size: 1.2rem; line-height: 1; }
.date-month { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; }

.history-content { flex: 1; }
.history-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.history-status { font-weight: 600; font-size: 0.9rem; }
.history-status.hadir { color: #2e7d32; }
.history-status.tidak_hadir { color: #c62828; }
.history-dayname { font-size: 0.8rem; color: var(--gray-500); }
.history-notes { margin: 0; font-size: 0.875rem; color: var(--gray-600); font-style: italic; background: var(--gray-50); padding: 4px 8px; border-radius: 4px; display: inline-block; }
.empty-history { text-align: center; color: var(--gray-400); padding: var(--space-xl); }
</style>
