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
      <!-- Skeleton Loading State -->
      <div v-if="loading" v-for="i in 3" :key="i" class="student-card glass-card skeleton-student-card">
        <div class="skeleton-student-header">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-info">
            <div class="skeleton-name"></div>
            <div class="skeleton-meta"></div>
          </div>
          <div class="skeleton-summary">
            <div class="skeleton-summary-item"></div>
            <div class="skeleton-summary-item"></div>
            <div class="skeleton-summary-item"></div>
          </div>
        </div>
        <div class="skeleton-criteria">
          <div class="skeleton-criteria-item"></div>
          <div class="skeleton-criteria-item"></div>
        </div>
        <div class="skeleton-actions">
          <div class="skeleton-btn"></div>
          <div class="skeleton-btn danger"></div>
        </div>
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
            <!-- Cross-guru indicator -->
            <p v-if="student.otherTeachersCount > 0" class="cross-guru-badge">
              <span class="badge-icon">👥</span> Juga dinilai oleh {{ student.otherTeachersCount }} guru lain
            </p>
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

        <!-- Other Teachers Grades Section (only show if there are actually other teachers) -->
        <div v-if="student.otherTeachersCount > 0" class="other-teachers-section">
          <button class="btn btn-link" @click="toggleOtherTeachers(student)">
            {{ isStudentExpanded(student) ? '▼ Sembunyikan' : '▶ Lihat' }} penilaian dari {{ student.otherTeachersCount }} guru lain
          </button>
          <div v-if="isStudentExpanded(student)" class="other-teachers-grades">
            <div v-for="(og, ogIdx) in student.otherTeachersGrades" :key="ogIdx" class="other-teacher-card">
              <div class="other-teacher-header">
                <span class="other-teacher-name">{{ og.guruName }}</span>
                <span class="other-teacher-date">{{ formatDate(og.createdAt) }}</span>
              </div>
              <div class="other-teacher-criteria">
                <div v-for="(ac, acIdx) in og.assessments" :key="acIdx" class="mini-criteria">
                  <span>{{ ac.criteria }}</span>
                  <span class="mini-score">{{ ac.score }}</span>
                </div>
              </div>
            </div>
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
          <label class="form-label">Cari atau Tambah Santri</label>
          
          <div class="santri-search-container">
            <input 
              v-model="searchQuery" 
              type="text" 
              class="form-input" 
              placeholder="Ketik nama santri..." 
              @input="onSearchInput"
              @focus="showSuggestions = true"
            />
            
            <!-- Loading indicator -->
            <div v-if="searching" class="search-loading">
              <span class="spinner-sm"></span> Mencari...
            </div>
            
            <!-- Suggestions dropdown -->
            <div v-if="showSuggestions && (suggestions.length > 0 || (searchQuery.length >= 2 && !searching))" class="suggestions-dropdown">
              <!-- Existing santri suggestions -->
              <div 
                v-for="s in suggestions" 
                :key="s.id" 
                class="suggestion-item"
                @click="selectSantri(s)"
              >
                <div class="suggestion-name">{{ s.name }}</div>
                <div v-if="s.gradingInfo && s.gradingInfo.length > 0" class="suggestion-grading-info">
                  <span class="grading-badge">Sudah dinilai oleh {{ s.gradingInfo.map(g => g.guruName).join(', ') }}</span>
                </div>
                <div v-else class="suggestion-new-badge">Belum ada penilaian</div>
              </div>
              
              <!-- Add new santri option -->
              <div 
                v-if="searchQuery.length >= 2 && !suggestions.some(s => s.nameNormalized === searchQuery.toLowerCase().trim())" 
                class="suggestion-item add-new"
                @click="addNewSantri"
              >
                <span class="add-icon">+</span>
                <span>Tambahkan "<strong>{{ searchQuery }}</strong>" sebagai santri baru</span>
              </div>
              
              <!-- No results message -->
              <div v-if="searchQuery.length >= 2 && suggestions.length === 0 && !searching" class="no-results">
                <p>Tidak ditemukan santri dengan nama "{{ searchQuery }}"</p>
              </div>
            </div>
          </div>
          
          <!-- Selected santri display -->
          <div v-if="form.santriId && form.santriName" class="selected-santri">
            <div class="selected-santri-info">
              <span class="selected-name">{{ form.santriName }}</span>
              <button type="button" class="btn-clear" @click="clearSelectedSantri">×</button>
            </div>
            
            <!-- Previous grading info -->
            <div v-if="selectedSantriGradingInfo && selectedSantriGradingInfo.length > 0" class="previous-grading-alert">
              <div class="alert-icon">ℹ️</div>
              <div class="alert-content">
                <strong>Santri ini sudah dinilai oleh:</strong>
                <ul>
                  <li v-for="(g, gIdx) in selectedSantriGradingInfo" :key="gIdx">
                    {{ g.guruName }} ({{ g.criteriaCount }} kriteria) - {{ formatDate(g.createdAt) }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
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
          <button class="btn btn-primary" @click="saveCriteria" :disabled="saving || (!selectedStudent && !form.santriId)">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast, useConfirm } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const { success, error: showError, warning } = useToast()
const { confirm } = useConfirm()
const authStore = useAuthStore()

const route = useRoute()
const router = useRouter()
const periodId = route.params.periodId

const period = ref(null)
const grades = ref([])
const allGrades = ref([]) // All grades across all teachers for this period
const loading = ref(true)
const showModal = ref(false)
const saving = ref(false)

const selectedStudent = ref(null)
const form = ref({ santriId: '', santriName: '', criteria: '', score: null })

// Santri search
const searchQuery = ref('')
const suggestions = ref([])
const showSuggestions = ref(false)
const searching = ref(false)
const selectedSantriGradingInfo = ref([])

// Track which students have their other teachers section expanded
const expandedStudents = ref(new Set())

let searchTimeout = null

// Normalize name for matching
const normalizeName = (name) => {
  if (!name) return ''
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

// Group grades by student (including cross-guru info)
const groupedGrades = computed(() => {
  const grouped = {}
  const currentUserId = authStore.user?.id || ''
  
  // First, group my own grades by normalized name (to handle duplicates)
  grades.value.forEach(g => {
    const normalizedName = normalizeName(g.santriName)
    if (!grouped[normalizedName]) {
      grouped[normalizedName] = {
        santriId: g.santriId,
        santriName: g.santriName,
        normalizedName,
        gradeIds: [],
        criteria: [],
        otherTeachersGrades: [],
        otherTeachersCount: 0,
        showOtherTeachers: false
      }
    }
    grouped[normalizedName].gradeIds.push(g.id)
    if (g.assessments) {
      g.assessments.forEach(a => {
        grouped[normalizedName].criteria.push({ ...a, gradeId: g.id })
      })
    }
  })

  // Add other teachers' grades info - match by NORMALIZED NAME, not santriId
  allGrades.value.forEach(g => {
    if (!g.santriName) return
    const normalizedName = normalizeName(g.santriName)
    
    // Check if this santri is in our grades list AND grade is from another teacher
    if (grouped[normalizedName] && g.guruId !== currentUserId) {
      grouped[normalizedName].otherTeachersGrades.push({
        guruId: g.guruId,
        guruName: g.guruName,
        assessments: g.assessments || [],
        createdAt: g.createdAt
      })
    }
  })

  // Calculate totals and grades
  return Object.values(grouped).map(s => {
    const scores = s.criteria.map(c => c.score).filter(n => !isNaN(n))
    s.total = scores.reduce((sum, n) => sum + n, 0)
    s.average = scores.length > 0 ? s.total / scores.length : 0
    s.grade = getGrade(s.average)
    
    // Count unique other teachers
    const uniqueTeachers = new Set(s.otherTeachersGrades.map(og => og.guruId))
    s.otherTeachersCount = uniqueTeachers.size
    
    return s
  })
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

const formatDate = (d) => {
  if (!d) return '-'
  let date
  if (d._seconds !== undefined) date = new Date(d._seconds * 1000)
  else if (d.seconds !== undefined) date = new Date(d.seconds * 1000)
  else date = new Date(d)
  return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const fetchData = async () => {
  loading.value = true
  try {
    const [periodsRes, gradesRes, allGradesRes] = await Promise.all([
      api.get('/grading/periods'),
      api.get(`/grading/periods/${periodId}/grades`),
      api.get(`/grading/periods/${periodId}/grades?allTeachers=true`)
    ])
    period.value = periodsRes.data.find(p => p.id === periodId)
    grades.value = gradesRes.data
    allGrades.value = allGradesRes.data
  } catch (e) { console.log('Fetch error', e) }
  finally { loading.value = false }
}

// Santri search functions
const onSearchInput = () => {
  showSuggestions.value = true
  
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (searchQuery.value.length < 2) {
    suggestions.value = []
    return
  }
  
  searching.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const { data } = await api.get(`/santri/search?q=${encodeURIComponent(searchQuery.value)}&periodId=${periodId}`)
      suggestions.value = data
    } catch (e) {
      console.error('Search error:', e)
      suggestions.value = []
    } finally {
      searching.value = false
    }
  }, 300)
}

const selectSantri = (santri) => {
  form.value.santriId = santri.id
  form.value.santriName = santri.name
  selectedSantriGradingInfo.value = santri.gradingInfo || []
  showSuggestions.value = false
  searchQuery.value = ''
}

const addNewSantri = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) return
  
  searching.value = true
  try {
    const { data } = await api.post('/santri', { name: searchQuery.value })
    
    if (data.alreadyExists) {
      warning('Santri dengan nama ini sudah terdaftar')
    } else {
      success('Santri berhasil ditambahkan')
    }
    
    form.value.santriId = data.id
    form.value.santriName = data.name
    selectedSantriGradingInfo.value = []
    showSuggestions.value = false
    searchQuery.value = ''
  } catch (e) {
    console.error('Add santri error:', e)
    showError('Gagal menambahkan santri')
  } finally {
    searching.value = false
  }
}

const clearSelectedSantri = () => {
  form.value.santriId = ''
  form.value.santriName = ''
  selectedSantriGradingInfo.value = []
  searchQuery.value = ''
}

const toggleOtherTeachers = (student) => {
  const key = student.normalizedName || student.santriName
  if (expandedStudents.value.has(key)) {
    expandedStudents.value.delete(key)
  } else {
    expandedStudents.value.add(key)
  }
  // Force reactivity update
  expandedStudents.value = new Set(expandedStudents.value)
}

const isStudentExpanded = (student) => {
  const key = student.normalizedName || student.santriName
  return expandedStudents.value.has(key)
}

const openAddCriteriaModal = (student) => {
  selectedStudent.value = student
  form.value = { 
    santriId: student?.santriId || '', 
    santriName: student?.santriName || '', 
    criteria: '', 
    score: null 
  }
  searchQuery.value = ''
  suggestions.value = []
  selectedSantriGradingInfo.value = []
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedStudent.value = null
  form.value = { santriId: '', santriName: '', criteria: '', score: null }
  searchQuery.value = ''
  suggestions.value = []
  selectedSantriGradingInfo.value = []
  showSuggestions.value = false
}

const saveCriteria = async () => {
  // Validate
  if (!selectedStudent.value && !form.value.santriId) {
    warning('Pilih atau tambah santri terlebih dahulu')
    return
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

// Close suggestions when clicking outside
const handleClickOutside = (e) => {
  if (!e.target.closest('.santri-search-container')) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  fetchData()
  document.addEventListener('click', handleClickOutside)
})
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

/* Cross-guru badge */
.cross-guru-badge { font-size: 0.75rem; color: var(--primary); background: rgba(var(--primary-rgb), 0.1); padding: 2px 8px; border-radius: 12px; margin-top: var(--space-xs); display: inline-flex; align-items: center; gap: 4px; }
.badge-icon { font-size: 0.875rem; }

/* Other Teachers Section */
.other-teachers-section { margin-bottom: var(--space-lg); padding-top: var(--space-md); border-top: 1px dashed var(--gray-200); }
.btn-link { background: none; border: none; color: var(--primary); font-size: 0.875rem; padding: 0; cursor: pointer; }
.btn-link:hover { text-decoration: underline; }
.other-teachers-grades { margin-top: var(--space-md); display: flex; flex-direction: column; gap: var(--space-sm); }
.other-teacher-card { background: var(--gray-50); padding: var(--space-md); border-radius: var(--radius-md); border-left: 3px solid var(--primary-light); }
.other-teacher-header { display: flex; justify-content: space-between; margin-bottom: var(--space-sm); }
.other-teacher-name { font-weight: 600; color: var(--primary-dark); font-size: 0.875rem; }
.other-teacher-date { font-size: 0.75rem; color: var(--gray-500); }
.other-teacher-criteria { display: flex; flex-wrap: wrap; gap: var(--space-xs); }
.mini-criteria { background: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; display: flex; gap: 8px; }
.mini-score { font-weight: 600; color: var(--primary); }

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
.modal { width: 100%; max-width: 500px; padding: var(--space-xl); background: var(--white); max-height: 90vh; overflow-y: auto; }
.modal h3 { color: var(--primary-dark); margin-bottom: var(--space-lg); font-size: 1.1rem; }
.modal-actions { display: flex; gap: var(--space-md); justify-content: flex-end; margin-top: var(--space-xl); }

/* Santri Search */
.santri-search-container { position: relative; }
.search-loading { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--gray-500); display: flex; align-items: center; gap: 4px; }
.spinner-sm { width: 14px; height: 14px; border: 2px solid var(--gray-200); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.suggestions-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid var(--gray-200); border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 250px; overflow-y: auto; z-index: 100; }
.suggestion-item { padding: var(--space-md); cursor: pointer; border-bottom: 1px solid var(--gray-100); }
.suggestion-item:last-child { border-bottom: none; }
.suggestion-item:hover { background: var(--gray-50); }
.suggestion-name { font-weight: 600; color: var(--primary-dark); }
.suggestion-grading-info { margin-top: 4px; }
.grading-badge { font-size: 0.75rem; color: var(--accent-dark); background: rgba(255,152,0,0.1); padding: 2px 8px; border-radius: 10px; }
.suggestion-new-badge { font-size: 0.75rem; color: var(--gray-500); margin-top: 4px; }
.suggestion-item.add-new { background: rgba(var(--primary-rgb), 0.05); display: flex; align-items: center; gap: 8px; }
.add-icon { width: 24px; height: 24px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.no-results { padding: var(--space-md); color: var(--gray-500); font-size: 0.875rem; text-align: center; }

/* Selected Santri */
.selected-santri { margin-top: var(--space-md); }
.selected-santri-info { display: flex; align-items: center; justify-content: space-between; background: rgba(var(--primary-rgb), 0.1); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-md); }
.selected-name { font-weight: 600; color: var(--primary-dark); }
.btn-clear { background: none; border: none; font-size: 1.2rem; color: var(--gray-500); cursor: pointer; padding: 0 4px; }
.btn-clear:hover { color: var(--error); }

/* Previous Grading Alert */
.previous-grading-alert { margin-top: var(--space-md); background: rgba(33,150,243,0.1); border-left: 3px solid #2196f3; padding: var(--space-md); border-radius: var(--radius-sm); display: flex; gap: var(--space-md); }
.alert-icon { font-size: 1.25rem; }
.alert-content { flex: 1; font-size: 0.875rem; }
.alert-content strong { display: block; margin-bottom: var(--space-xs); color: var(--primary-dark); }
.alert-content ul { margin: 0; padding-left: var(--space-lg); color: var(--gray-600); }
.alert-content li { margin-bottom: 2px; }

/* Skeleton Styles for Student Cards */
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-avatar,
.skeleton-name,
.skeleton-meta,
.skeleton-summary-item,
.skeleton-criteria-item,
.skeleton-btn {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton-student-header {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.skeleton-avatar {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.skeleton-info {
  flex: 1;
  min-width: 150px;
}

.skeleton-name {
  height: 20px;
  width: 140px;
  margin-bottom: var(--space-xs);
}

.skeleton-meta {
  height: 14px;
  width: 100px;
}

.skeleton-summary {
  display: flex;
  gap: var(--space-lg);
}

.skeleton-summary-item {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-md);
}

.skeleton-criteria {
  margin-bottom: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.skeleton-criteria-item {
  height: 40px;
  width: 100%;
  border-radius: var(--radius-md);
}

.skeleton-actions {
  display: flex;
  gap: var(--space-sm);
}

.skeleton-btn {
  height: 36px;
  width: 130px;
  border-radius: var(--radius-md);
}

.skeleton-btn.danger {
  width: 110px;
}
</style>
