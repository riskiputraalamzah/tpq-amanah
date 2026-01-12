<template>
  <div class="grading-period-view">
    <header class="page-header">
      <div>
        <router-link to="/dashboard/grading" class="back-link">← Kembali ke Daftar Periode</router-link>
        <div class="header-title-row">
          <h1>{{ period?.name || 'Loading...' }}</h1>
          <span v-if="period" class="status-badge" :class="period.status">{{ period.status === 'archived' ? 'Diarsipkan' : 'Aktif' }}</span>
        </div>
        <p v-if="period" class="period-info">
          <strong>Periode:</strong> {{ formatPeriodDate(period.startDate) }} - {{ formatPeriodDate(period.endDate) }}
        </p>
      </div>
      <button class="btn btn-primary" @click="openAddCriteriaModal(null)">+ Input Nilai Santri</button>
    </header>

    <!-- Grade Legend -->
    <div class="grade-legend glass-card">
      <h4>Kriteria Penilaian:</h4>
      <div class="legend-items">
        <span class="legend-item A">A (8.6-9.9)</span>
        <span class="legend-item B">B (7.6-8.5)</span>
        <span class="legend-item C">C (&lt;7.5)</span>
      </div>
    </div>

    <div class="students-list">
      <div v-if="loading" v-for="i in 3" :key="i" class="student-card glass-card">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="paragraph" />
      </div>

      <div v-else-if="groupedGrades.length === 0" class="empty-state glass-card">
        <p>Belum ada nilai untuk periode ini. Klik "Input Nilai Santri" untuk menambah.</p>
      </div>

      <div v-else v-for="student in groupedGrades" :key="student.santriId" class="student-card glass-card">
        <div class="student-header">
          <div class="student-avatar">{{ getInitials(student.santriName) }}</div>
          <div class="student-info">
            <h4>{{ student.santriName }}</h4>
            <p class="student-meta">{{ student.criteria.length }} kriteria dinilai</p>
          </div>
          <div class="student-summary">
            <div class="summary-item">
              <span class="summary-label">Total</span>
              <span class="summary-value">{{ student.total.toFixed(1) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Rata-rata</span>
              <span class="summary-value">{{ student.average.toFixed(2) }}</span>
            </div>
            <div class="summary-item grade">
              <span class="summary-label">Grade</span>
              <span class="grade-badge" :class="student.grade">{{ student.grade }}</span>
            </div>
          </div>
        </div>

        <div class="criteria-list">
          <div v-for="(c, idx) in student.criteria" :key="idx" class="criteria-item">
            <span class="criteria-name">{{ c.criteria }}</span>
            <span class="criteria-score">{{ c.score }}</span>
            <button class="btn-icon-sm" @click="deleteCriteria(student, idx)" title="Hapus kriteria">×</button>
          </div>
        </div>

        <div class="student-actions">
          <button class="btn btn-sm btn-primary" @click="openAddCriteriaModal(student)">+ Tambah Kriteria</button>
          <button class="btn btn-sm btn-danger" @click="deleteStudent(student)">Hapus Santri</button>
        </div>
      </div>
    </div>

    <!-- Add Criteria Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal glass-card">
        <h3>{{ selectedStudent ? `Tambah Kriteria untuk ${selectedStudent.santriName}` : 'Input Nilai Baru' }}</h3>
        
        <!-- Student Selection (only if adding new student) -->
        <div v-if="!selectedStudent" class="form-group">
          <div class="input-toggle">
            <label class="form-label">Pilih Santri</label>
            <label class="toggle-manual">
              <input type="checkbox" v-model="manualInput" disabled> Input Manual
            </label>
          </div>
          
          <select v-if="!manualInput" v-model="form.santriId" class="form-input form-select" @change="onSantriChange">
            <option value="">-- Pilih Santri dari Database --</option>
            <option v-for="s in availableSantri" :key="s.id" :value="s.id">{{ s.displayName }}</option>
          </select>
          <input v-else v-model="form.santriName" type="text" class="form-input" placeholder="Ketik nama santri manual" />
        </div>

        <div class="form-group">
          <label class="form-label">Kriteria Penilaian</label>
          <input v-model="form.criteria" type="text" class="form-input" placeholder="Contoh: Baca Tartil, Hafalan Juz 30, dll" />
        </div>

        <div class="form-group">
          <label class="form-label">Nilai (0-10)</label>
          <input v-model.number="form.score" type="number" class="form-input" placeholder="Masukkan nilai" min="0" max="10" step="0.1" />
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">Batal</button>
          <button class="btn btn-primary" @click="saveCriteria" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast, useConfirm } from '@/composables/useToast'

const { success, error: showError, warning } = useToast()
const { confirm } = useConfirm()

const route = useRoute()
const periodId = route.params.periodId

const period = ref(null)
const grades = ref([])
const santriList = ref([])
const loading = ref(true)
const showModal = ref(false)
const saving = ref(false)

const manualInput = ref(true)
const selectedStudent = ref(null)
const form = ref({ santriId: '', santriName: '', criteria: '', score: null })

// Group grades by student
const groupedGrades = computed(() => {
  const grouped = {}
  grades.value.forEach(g => {
    if (!grouped[g.santriId]) {
      grouped[g.santriId] = {
        santriId: g.santriId,
        santriName: g.santriName,
        gradeIds: [],
        criteria: []
      }
    }
    grouped[g.santriId].gradeIds.push(g.id)
    if (g.assessments) {
      g.assessments.forEach(a => {
        grouped[g.santriId].criteria.push({ ...a, gradeId: g.id })
      })
    }
  })

  // Calculate totals and grades
  return Object.values(grouped).map(s => {
    const scores = s.criteria.map(c => c.score).filter(n => !isNaN(n))
    s.total = scores.reduce((sum, n) => sum + n, 0)
    s.average = scores.length > 0 ? s.total / scores.length : 0
    s.grade = getGrade(s.average)
    return s
  })
})

// Available santri (excluding already added)
const availableSantri = computed(() => {
  const addedIds = new Set(groupedGrades.value.map(s => s.santriId))
  return santriList.value.filter(s => !addedIds.has(s.id))
})

const getGrade = (avg) => {
  if (avg >= 8.6) return 'A'
  if (avg >= 7.6) return 'B'
  return 'C'
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatPeriodDate = (d) => {
  if (!d) return '-'
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
  return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const fetchData = async () => {
  loading.value = true
  try {
    const [periodsRes, gradesRes, santriRes] = await Promise.all([
      api.get('/grading/periods'),
      api.get(`/grading/periods/${periodId}/grades`),
      api.get('/grading/santri')
    ])
    period.value = periodsRes.data.find(p => p.id === periodId)
    grades.value = gradesRes.data
    santriList.value = santriRes.data
  } catch (e) { console.log('Fetch error', e) }
  finally { loading.value = false }
}

watch(manualInput, () => {
  form.value.santriId = ''
  form.value.santriName = ''
})

const onSantriChange = () => {
  if (manualInput.value) return
  const s = santriList.value.find(s => s.id === form.value.santriId)
  form.value.santriName = s?.displayName || ''
}

const openAddCriteriaModal = (student) => {
  selectedStudent.value = student
  manualInput.value = true
  form.value = { 
    santriId: student?.santriId || '', 
    santriName: student?.santriName || '', 
    criteria: '', 
    score: null 
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedStudent.value = null
  form.value = { santriId: '', santriName: '', criteria: '', score: null }
}

const saveCriteria = async () => {
  // Validate
  if (!selectedStudent.value) {
    if (manualInput.value) {
      if (!form.value.santriName) { warning('Nama santri wajib diisi'); return }
      form.value.santriId = `manual_${Date.now()}`
    } else {
      if (!form.value.santriId) { warning('Pilih santri dari daftar'); return }
    }
  }

  if (!form.value.criteria) { warning('Kriteria wajib diisi'); return }
  if (form.value.score === null || isNaN(form.value.score)) { warning('Nilai wajib diisi'); return }

  saving.value = true
  try {
    const santriId = selectedStudent.value?.santriId || form.value.santriId
    const santriName = selectedStudent.value?.santriName || form.value.santriName

    await api.post('/grading/grades', { 
      periodId, 
      santriId,
      santriName, 
      assessments: [{ criteria: form.value.criteria, score: form.value.score }]
    })
    await fetchData()
    closeModal()
    success('Nilai berhasil disimpan')
  } catch (e) { 
    console.error(e)
    showError('Gagal menyimpan nilai') 
  }
  finally { saving.value = false }
}

const deleteCriteria = async (student, criteriaIndex) => {
  const criteria = student.criteria[criteriaIndex]
  const confirmed = await confirm(`Hapus kriteria "${criteria.criteria}" dari ${student.santriName}?`, { type: 'danger', confirmText: 'Ya, Hapus' })
  if (!confirmed) return
  
  try {
    const gradeId = criteria.gradeId
    await api.delete(`/grading/grades/${gradeId}`)
    await fetchData()
    success('Kriteria berhasil dihapus')
  } catch (e) { showError('Gagal menghapus kriteria') }
}

const deleteStudent = async (student) => {
  const confirmed = await confirm(`Hapus semua nilai untuk ${student.santriName}? Data tidak dapat dikembalikan.`, { type: 'danger', confirmText: 'Ya, Hapus Semua' })
  if (!confirmed) return
  
  try {
    for (const gradeId of student.gradeIds) {
      await api.delete(`/grading/grades/${gradeId}`)
    }
    await fetchData()
    success('Data santri berhasil dihapus')
  } catch (e) { showError('Gagal menghapus santri') }
}

onMounted(fetchData)
</script>

<style scoped>
.grading-period-view { padding-top: 60px; }
@media (min-width: 1024px) { .grading-period-view { padding-top: 0; } }

.page-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--space-md); margin-bottom: var(--space-lg); }
.back-link { color: var(--gray-500); font-size: 0.875rem; display: block; margin-bottom: var(--space-sm); }
.back-link:hover { color: var(--primary); }
.header-title-row { display: flex; align-items: center; gap: var(--space-md); flex-wrap: wrap; }
.page-header h1 { color: var(--primary-dark); margin: 0; }
.period-info { color: var(--gray-600); font-size: 0.875rem; margin-top: var(--space-xs); }
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; text-transform: uppercase; font-weight: 600; }
.status-badge.active { background: rgba(76,175,80,0.15); color: #388e3c; }
.status-badge.archived { background: rgba(255,152,0,0.15); color: #f57c00; }

/* Grade Legend */
.grade-legend { padding: var(--space-md) var(--space-lg); margin-bottom: var(--space-xl); display: flex; align-items: center; gap: var(--space-lg); flex-wrap: wrap; }
.grade-legend h4 { font-size: 0.875rem; color: var(--gray-600); margin: 0; }
.legend-items { display: flex; gap: var(--space-md); }
.legend-item { padding: var(--space-xs) var(--space-md); border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; }
.legend-item.A { background: rgba(76,175,80,0.15); color: #388e3c; }
.legend-item.B { background: rgba(33,150,243,0.15); color: #1976d2; }
.legend-item.C { background: rgba(255,152,0,0.15); color: #f57c00; }

/* Student Cards */
.students-list { display: flex; flex-direction: column; gap: var(--space-lg); }
.student-card { padding: var(--space-xl); background: rgba(255,255,255,0.95); }
.student-header { display: flex; align-items: center; gap: var(--space-lg); margin-bottom: var(--space-lg); flex-wrap: wrap; }
.student-avatar { width: 50px; height: 50px; border-radius: var(--radius-full); background: var(--primary-gradient); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; flex-shrink: 0; }
.student-info { flex: 1; min-width: 150px; }
.student-info h4 { color: var(--primary-dark); margin: 0 0 var(--space-xs) 0; }
.student-meta { font-size: 0.75rem; color: var(--gray-500); margin: 0; }
.student-summary { display: flex; gap: var(--space-lg); }
.summary-item { text-align: center; }
.summary-label { display: block; font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; }
.summary-value { font-size: 1.25rem; font-weight: 700; color: var(--primary-dark); }
.grade-badge { display: inline-block; width: 36px; height: 36px; line-height: 36px; text-align: center; border-radius: var(--radius-full); font-weight: 800; font-size: 1rem; }
.grade-badge.A { background: #4caf50; color: white; }
.grade-badge.B { background: #2196f3; color: white; }
.grade-badge.C { background: #ff9800; color: white; }

/* Criteria List */
.criteria-list { margin-bottom: var(--space-lg); }
.criteria-item { display: flex; align-items: center; gap: var(--space-md); padding: var(--space-sm) var(--space-md); background: var(--gray-50); border-radius: var(--radius-md); margin-bottom: var(--space-xs); }
.criteria-name { flex: 1; color: var(--gray-700); }
.criteria-score { font-weight: 700; color: var(--primary); min-width: 40px; text-align: right; }
.btn-icon-sm { width: 24px; height: 24px; border-radius: var(--radius-sm); background: rgba(244,67,54,0.1); color: var(--error); font-size: 1rem; line-height: 1; flex-shrink: 0; }
.btn-icon-sm:hover { background: rgba(244,67,54,0.2); }

/* Student Actions */
.student-actions { display: flex; gap: var(--space-sm); }
.btn-danger { background: var(--error); color: white; }

/* Empty State */
.empty-state { padding: var(--space-3xl); text-align: center; color: var(--gray-500); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: var(--z-modal); padding: var(--space-lg); overflow-y: auto; }
.modal { width: 100%; max-width: 450px; padding: var(--space-xl); background: var(--white); max-height: 90vh; overflow-y: auto; }
.modal h3 { color: var(--primary-dark); margin-bottom: var(--space-lg); font-size: 1.1rem; }
.input-toggle { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm); }
.toggle-manual { font-size: 0.875rem; color: var(--primary); display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.modal-actions { display: flex; gap: var(--space-md); justify-content: flex-end; margin-top: var(--space-xl); }
</style>
