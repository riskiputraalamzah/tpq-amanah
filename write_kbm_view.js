const fs = require('fs');
const path = require('path');

const vueContent = `<template>
  <div class="kbm-view">
    <header class="page-header">
      <div>
        <h1>KBM / Mengajar</h1>
        <p>Catat dan pantau aktivitas belajar mengajar</p>
      </div>
    </header>

    <div v-if="loadingInitial" class="loading-state">
      <p>Memuat data...</p>
    </div>
    
    <div v-else class="content-grid">
      <!-- Form Input KBM -->
      <div class="kbm-form glass-card">
        <h2>Input Sesi Mengajar</h2>
        <form @submit.prevent="submitSession">
          <div class="form-group">
            <label>Tanggal KBM</label>
            <input type="date" v-model="form.date" :max="todayString" @change="validateEligibility" class="form-input" required />
            <small class="help-text">Pilih tanggal untuk hari ini atau backfill tanggal sebelumnya dalam bulan yang sama.</small>
          </div>

          <div class="form-group">
            <label>Kelas / Jilid</label>
            <select v-model="form.classId" class="form-input" required>
              <option value="" disabled>Pilih Kelas</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Sesi / Gelombang</label>
            <select v-model="form.sessionSlotId" class="form-input" @change="validateEligibility" required>
              <option value="" disabled>Pilih Sesi</option>
              <option v-for="s in sessionSlots" :key="s.id" :value="s.id">{{ s.name }} ({{ s.startTime }} - {{ s.endTime }})</option>
            </select>
          </div>

          <div class="form-group" v-if="teachers.length > 0">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.isSubstitute" />
              Menggantikan Guru Lain (Badal)
            </label>
            <select v-if="form.isSubstitute" v-model="form.substituteFor" class="form-input mt-2">
              <option value="" disabled>Pilih Guru yang Digantikan</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.displayName || t.name }}</option>
            </select>
          </div>

          <!-- Eligibility Feedback -->
          <div v-if="eligibilityMessage" class="alert" :class="isEligible ? 'alert-success' : 'alert-error'">
            {{ eligibilityMessage }}
          </div>

          <button type="submit" class="btn btn-primary mt-4" :disabled="!isEligible || submitting">
            {{ submitting ? 'Menyimpan...' : 'Simpan KBM' }}
          </button>
        </form>
      </div>

      <!-- Riwayat KBM -->
      <div class="kbm-history glass-card">
        <h2>Riwayat KBM Bulan Ini</h2>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Sesi</th>
                <th>Kelas</th>
                <th>Aktivitas</th>
                <th>Ke-</th>
                <th>Status RPP</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="history.length === 0">
                <td colspan="7" class="text-center">Belum ada KBM bulan ini</td>
              </tr>
              <tr v-for="session in history" :key="session.id">
                <td>{{ formatDate(session.date) }}</td>
                <td>{{ getSessionName(session.sessionSlotId) }}</td>
                <td>{{ session.className }}</td>
                <td>
                  {{ session.type === 'teaching' ? 'KBM Normal' : (session.activityName || 'Non-KBM') }}
                </td>
                <td>{{ session.meetingNumber || '-' }}</td>
                <td>
                  <span class="badge" :class="session.advancesRpp ? 'badge-success' : 'badge-warning'">
                    {{ session.advancesRpp ? 'Maju' : 'Tetap' }}
                  </span>
                </td>
                <td>
                  <span v-if="session.substituteFor" class="badge badge-info">Badal</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const today = new Date()
const todayString = \`\${today.getFullYear()}-\${String(today.getMonth() + 1).padStart(2, '0')}-\${String(today.getDate()).padStart(2, '0')}\`
const minDateString = \`\${today.getFullYear()}-\${String(today.getMonth() + 1).padStart(2, '0')}-01\`

const loadingInitial = ref(true)
const submitting = ref(false)
const classes = ref([])
const sessionSlots = ref([])
const teachers = ref([])
const history = ref([])
const myAttendances = ref([])
const operationalCalendar = ref(null)

const form = ref({
  date: todayString,
  classId: '',
  sessionSlotId: '',
  isSubstitute: false,
  substituteFor: ''
})

const isEligible = ref(false)
const eligibilityMessage = ref('')

const fetchInitialData = async () => {
  try {
    const [classesRes, slotsRes, calendarRes, historyRes, attRes] = await Promise.all([
      api.get('/classes'),
      api.get('/teaching_sessions/slots'),
      api.get('/settings/operational-calendar'),
      api.get('/teaching_sessions', { params: { month: today.getMonth() + 1, year: today.getFullYear() } }),
      api.get('/attendance/me', { params: { month: today.getMonth() + 1, year: today.getFullYear() } })
    ])
    
    classes.value = classesRes.data
    sessionSlots.value = slotsRes.data
    operationalCalendar.value = calendarRes.data
    history.value = historyRes.data
    myAttendances.value = attRes.data

    try {
      const teachersRes = await api.get('/users?role=guru')
      // Only keep other teachers
      teachers.value = teachersRes.data.filter(t => t.id !== 'my_id') // Will fix my_id checking if possible, or just list all
    } catch (e) {
      // Ignore, user doesn't have permission to see teachers for substitute
    }
  } catch (error) {
    console.error("Failed to load initial data", error)
  } finally {
    loadingInitial.value = false
    validateEligibility()
  }
}

const validateEligibility = () => {
  isEligible.value = false
  eligibilityMessage.value = ''

  if (!form.value.date || !form.value.sessionSlotId) return

  const selectedDate = new Date(form.value.date)
  
  // Check active weekdays
  if (operationalCalendar.value && operationalCalendar.value.activeWeekdays) {
    const day = selectedDate.getDay()
    if (!operationalCalendar.value.activeWeekdays.includes(day)) {
      eligibilityMessage.value = 'Tanggal yang dipilih bukan hari operasional (Akhir pekan).'
      return
    }
  }

  // Check if session already exists for this slot & date
  const existing = history.value.find(s => {
    const sDate = new Date(s.date._seconds ? s.date._seconds * 1000 : s.date)
    const sDateStr = \`\${sDate.getFullYear()}-\${String(sDate.getMonth() + 1).padStart(2, '0')}-\${String(sDate.getDate()).padStart(2, '0')}\`
    return sDateStr === form.value.date && s.sessionSlotId === form.value.sessionSlotId
  })

  if (existing) {
    eligibilityMessage.value = 'Anda sudah memiliki sesi mengajar pada gelombang ini di tanggal tersebut.'
    return
  }

  // Check if teacher has attendance "hadir" for this date
  const attendance = myAttendances.value.find(a => {
    const aDate = new Date(a.date._seconds ? a.date._seconds * 1000 : a.date)
    const aDateStr = \`\${aDate.getFullYear()}-\${String(aDate.getMonth() + 1).padStart(2, '0')}-\${String(aDate.getDate()).padStart(2, '0')}\`
    return aDateStr === form.value.date
  })

  if (!attendance) {
    eligibilityMessage.value = 'Anda belum mengisi absen kehadiran (Absensi Online) pada tanggal ini.'
    return
  }
  if (attendance.status !== 'hadir') {
    eligibilityMessage.value = 'Status kehadiran Anda bukan "Hadir" pada tanggal ini.'
    return
  }

  isEligible.value = true
  eligibilityMessage.value = 'Data valid. Sesi dapat disimpan.'
}

const submitSession = async () => {
  if (!isEligible.value) return
  submitting.value = true
  try {
    const payload = {
      date: form.value.date,
      type: 'teaching',
      classId: form.value.classId,
      sessionSlotId: form.value.sessionSlotId,
      substituteFor: form.value.isSubstitute ? form.value.substituteFor : null,
      journal: { material: "KBM (Menunggu Update Jurnal)" },
      studentAttendances: []
    }

    await api.post('/teaching_sessions', payload)
    
    // Refresh history
    const historyRes = await api.get('/teaching_sessions', { params: { month: today.getMonth() + 1, year: today.getFullYear() } })
    history.value = historyRes.data

    // Reset form
    form.value.classId = ''
    form.value.isSubstitute = false
    form.value.substituteFor = ''
    
    alert('Sesi mengajar berhasil disimpan')
    validateEligibility()
  } catch (error) {
    alert(error.response?.data?.error || 'Gagal menyimpan sesi mengajar')
  } finally {
    submitting.value = false
  }
}

const formatDate = (val) => {
  if (!val) return '-'
  const d = new Date(val._seconds ? val._seconds * 1000 : val)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const getSessionName = (id) => {
  const slot = sessionSlots.value.find(s => s.id === id)
  return slot ? slot.name : id
}

onMounted(() => {
  fetchInitialData()
})
</script>

<style scoped>
.kbm-view {
  padding-top: 60px;
}
@media (min-width: 1024px) {
  .kbm-view {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: var(--space-xl);
}
.page-header h1 {
  color: var(--primary-dark);
}
.page-header p {
  color: var(--gray-600);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-xl);
}
@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 350px 1fr;
  }
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.glass-card h2 {
  font-size: 1.2rem;
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--gray-200);
}

.form-group {
  margin-bottom: var(--space-md);
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--gray-700);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.help-text {
  display: block;
  font-size: 0.8rem;
  color: var(--gray-500);
  margin-top: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal !important;
  cursor: pointer;
}

.mt-2 { margin-top: var(--space-sm); }
.mt-4 { margin-top: var(--space-xl); }

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.alert {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  margin-top: var(--space-md);
  font-size: 0.85rem;
  font-weight: 500;
}
.alert-success {
  background: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
  border: 1px solid rgba(76, 175, 80, 0.2);
}
.alert-error {
  background: rgba(244, 67, 54, 0.1);
  color: #c62828;
  border: 1px solid rgba(244, 67, 54, 0.2);
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--gray-200);
  font-size: 0.9rem;
}

.data-table th {
  font-weight: 600;
  color: var(--gray-700);
  background: var(--gray-50);
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-success { background: rgba(76,175,80,0.1); color: #2e7d32; }
.badge-warning { background: rgba(255,152,0,0.1); color: #ef6c00; }
.badge-info { background: rgba(33,150,243,0.1); color: #1565c0; }

.text-center { text-align: center; }
</style>
`;
const viewPath = path.resolve('src/views/dashboard/guru/KbmView.vue');
fs.writeFileSync(viewPath, vueContent);
console.log('Created KbmView.vue');
`;

fs.writeFileSync('write_kbm_view.js', code);

