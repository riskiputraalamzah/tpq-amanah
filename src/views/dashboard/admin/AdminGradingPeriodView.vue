<template>
  <div class="admin-grading-period-view">
    <header class="page-header">
      <div>
        <router-link to="/dashboard/admin-grading" class="back-link">← Kembali ke Daftar Periode</router-link>
        <div class="header-title-row">
          <h1>{{ period?.name || 'Loading...' }}</h1>
          <span v-if="period" class="status-badge" :class="period.status">{{ period.status === 'archived' ? 'Diarsipkan' : 'Aktif' }}</span>
        </div>
        <p v-if="period" class="period-info">
          <strong>Periode:</strong> {{ formatPeriodDate(period.startDate) }} - {{ formatPeriodDate(period.endDate) }}
        </p>
      </div>
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

    <!-- Guru Accordion Cards -->
    <div class="guru-accordion">
      <div v-if="loading" v-for="i in 3" :key="i" class="guru-card glass-card">
        <SkeletonLoader type="title" />
        <SkeletonLoader type="paragraph" />
      </div>

      <div v-else-if="guruList.length === 0" class="empty-state glass-card">
        <p>Belum ada guru yang menginput nilai untuk periode ini.</p>
      </div>

      <div v-else v-for="guru in guruList" :key="guru.guruId" class="guru-card glass-card" :class="{ expanded: expandedGuruId === guru.guruId }">
        <div class="guru-header" @click="toggleGuru(guru.guruId)">
          <div class="guru-info">
            <div class="guru-avatar">{{ getInitials(guru.guruName) }}</div>
            <div>
              <h3 class="guru-name">{{ guru.guruName }}</h3>
              <p class="guru-meta">{{ guru.count }} santri dinilai</p>
            </div>
          </div>
          <div class="guru-toggle">
            <span class="toggle-icon">{{ expandedGuruId === guru.guruId ? '▲' : '▼' }}</span>
          </div>
        </div>

        <!-- Santri List (Expanded) -->
        <div v-if="expandedGuruId === guru.guruId" class="santri-list">
          <div v-for="student in getGuruStudents(guru.guruId)" :key="student.santriId" class="santri-card">
            <div class="santri-header">
              <div class="santri-avatar">{{ getInitials(student.santriName) }}</div>
              <div class="santri-info">
                <h4>{{ student.santriName }}</h4>
                <p>{{ student.criteria.length }} kriteria</p>
              </div>
              <div class="santri-grades">
                <span class="grade-value">{{ student.average.toFixed(1) }}</span>
                <span class="grade-badge" :class="student.grade">{{ student.grade }}</span>
              </div>
            </div>
            <div class="criteria-chips">
              <span v-for="(c, idx) in student.criteria" :key="idx" class="criteria-chip">
                {{ c.criteria }}: <strong>{{ c.score }}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

const route = useRoute()
const periodId = route.params.periodId

const period = ref(null)
const grades = ref([])
const loading = ref(true)
const expandedGuruId = ref(null)

// Get unique guru list from grades
const guruList = computed(() => {
  const gurus = {}
  grades.value.forEach(g => {
    if (!gurus[g.guruId]) {
      gurus[g.guruId] = { guruId: g.guruId, guruName: g.guruName, count: 0 }
    }
    gurus[g.guruId].count++
  })
  return Object.values(gurus)
})

const toggleGuru = (guruId) => {
  expandedGuruId.value = expandedGuruId.value === guruId ? null : guruId
}

// Get students for a specific guru
const getGuruStudents = (guruId) => {
  const guruGrades = grades.value.filter(g => g.guruId === guruId)
  
  // Group by student
  const grouped = {}
  guruGrades.forEach(g => {
    if (!grouped[g.santriId]) {
      grouped[g.santriId] = {
        santriId: g.santriId,
        santriName: g.santriName,
        criteria: []
      }
    }
    if (g.assessments) {
      g.assessments.forEach(a => {
        grouped[g.santriId].criteria.push({ ...a })
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
}

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
  if (d._seconds !== undefined) date = new Date(d._seconds * 1000)
  else if (d.seconds !== undefined) date = new Date(d.seconds * 1000)
  else date = new Date(d)
  return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const fetchData = async () => {
  loading.value = true
  try {
    const [periodsRes, gradesRes] = await Promise.all([
      api.get('/grading/periods'),
      api.get(`/grading/periods/${periodId}/grades?all=true`)
    ])
    period.value = periodsRes.data.find(p => p.id === periodId)
    grades.value = gradesRes.data

    // Auto-expand first guru if available
    if (guruList.value.length > 0 && !expandedGuruId.value) {
      expandedGuruId.value = guruList.value[0].guruId
    }
  } catch (e) { console.log('Fetch error', e) }
  finally { loading.value = false }
}

onMounted(fetchData)
</script>

<style scoped>
.admin-grading-period-view { padding-top: 60px; }
@media (min-width: 1024px) { .admin-grading-period-view { padding-top: 0; } }

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
.grade-legend { padding: var(--space-md) var(--space-lg); margin-bottom: var(--space-lg); display: flex; align-items: center; gap: var(--space-lg); flex-wrap: wrap; }
.grade-legend h4 { font-size: 0.875rem; color: var(--gray-600); margin: 0; }
.legend-items { display: flex; gap: var(--space-md); }
.legend-item { padding: var(--space-xs) var(--space-md); border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600; }
.legend-item.A { background: rgba(76,175,80,0.15); color: #388e3c; }
.legend-item.B { background: rgba(33,150,243,0.15); color: #1976d2; }
.legend-item.C { background: rgba(255,152,0,0.15); color: #f57c00; }

/* Guru Accordion Cards */
.guru-accordion { display: flex; flex-direction: column; gap: var(--space-lg); }
.guru-card { padding: 0; background: rgba(255,255,255,0.95); overflow: hidden; transition: box-shadow 0.2s; }
.guru-card.expanded { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12); }
.guru-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-lg) var(--space-xl); cursor: pointer; transition: background 0.2s; }
.guru-header:hover { background: var(--gray-50); }
.guru-info { display: flex; align-items: center; gap: var(--space-md); }
.guru-avatar { width: 50px; height: 50px; border-radius: var(--radius-full); background: var(--primary-gradient); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; flex-shrink: 0; }
.guru-name { color: var(--primary-dark); margin: 0; font-size: 1.1rem; }
.guru-meta { font-size: 0.8rem; color: var(--gray-500); margin: 2px 0 0 0; }
.guru-toggle { color: var(--gray-400); }
.toggle-icon { font-size: 0.8rem; }

/* Santri List (Expanded Content) */
.santri-list { padding: 0 var(--space-xl) var(--space-xl); display: flex; flex-direction: column; gap: var(--space-md); border-top: 1px solid var(--gray-100); padding-top: var(--space-lg); }
.santri-card { background: var(--gray-50); border-radius: var(--radius-lg); padding: var(--space-lg); }
.santri-header { display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-md); }
.santri-avatar { width: 36px; height: 36px; border-radius: var(--radius-full); background: linear-gradient(135deg, #64b5f6, #1976d2); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.75rem; flex-shrink: 0; }
.santri-info { flex: 1; min-width: 0; }
.santri-info h4 { color: var(--primary-dark); margin: 0; font-size: 0.95rem; }
.santri-info p { font-size: 0.75rem; color: var(--gray-500); margin: 2px 0 0 0; }
.santri-grades { display: flex; align-items: center; gap: var(--space-sm); }
.grade-value { font-size: 1.1rem; font-weight: 700; color: var(--primary-dark); }
.grade-badge { width: 30px; height: 30px; line-height: 30px; text-align: center; border-radius: var(--radius-full); font-weight: 800; font-size: 0.85rem; }
.grade-badge.A { background: #4caf50; color: white; }
.grade-badge.B { background: #2196f3; color: white; }
.grade-badge.C { background: #ff9800; color: white; }

/* Criteria Chips */
.criteria-chips { display: flex; flex-wrap: wrap; gap: var(--space-xs); }
.criteria-chip { background: rgba(27, 94, 32, 0.08); color: var(--gray-700); padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; white-space: nowrap; }
.criteria-chip strong { color: var(--primary); }

.empty-state { padding: var(--space-3xl); text-align: center; color: var(--gray-500); }
</style>
