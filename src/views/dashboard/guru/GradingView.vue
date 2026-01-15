<template>
  <div class="grading-view">
    <header class="page-header">
      <div>
        <h1>📝 Input Nilai Santri</h1>
        <p>Pilih periode penilaian dan input nilai santri</p>
      </div>
    </header>

    <div class="periods-grid">
      <!-- Skeleton Loading State -->
      <div v-if="loading" v-for="i in 3" :key="i" class="period-card glass-card skeleton-card">
        <div class="skeleton-status"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-dates">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
        <div class="skeleton-count"></div>
        <div class="skeleton-button"></div>
      </div>

      <div v-else-if="activePeriods.length === 0" class="empty-state glass-card">
        <p>Belum ada periode penilaian aktif. Hubungi admin untuk membuat periode.</p>
      </div>

      <div v-else v-for="period in activePeriods" :key="period.id" class="period-card glass-card">
        <div class="period-status active">Aktif</div>
        <h3>{{ period.name }}</h3>
        <p class="period-dates">
          <strong>Dari:</strong> {{ formatDate(period.startDate) }}<br/>
          <strong>Sampai:</strong> {{ formatDate(period.endDate) }}
        </p>
        <p v-if="period.description" class="period-desc">{{ period.description }}</p>
        <p class="period-count">{{ period.myGradeCount || 0 }} santri sudah Anda nilai</p>
        <div class="card-actions">
          <router-link :to="`/dashboard/grading/${period.id}`" class="btn btn-action btn-primary">
            ✏️ Input Nilai
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

const periods = ref([])
const loading = ref(true)

const activePeriods = computed(() => {
  return periods.value.filter(p => p.status !== 'archived')
})

const formatDate = (d) => {
  if (!d) return '-'
  let date
  if (d._seconds !== undefined) date = new Date(d._seconds * 1000)
  else if (d.seconds !== undefined) date = new Date(d.seconds * 1000)
  else date = new Date(d)
  return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const fetchPeriods = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/grading/periods')
    periods.value = data
  } catch (e) { console.log('Failed to fetch periods') }
  finally { loading.value = false }
}

onMounted(fetchPeriods)
</script>

<style scoped>
.grading-view { padding-top: 60px; }
@media (min-width: 1024px) { .grading-view { padding-top: 0; } }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-md); margin-bottom: var(--space-xl); }
.page-header h1 { color: var(--primary-dark); }
.page-header p { color: var(--gray-600); }

.periods-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: var(--space-lg); }
@media (min-width: 768px) { .periods-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .periods-grid { grid-template-columns: repeat(3, 1fr); } }

.period-card { padding: var(--space-xl); background: rgba(255,255,255,0.9); position: relative; }
.period-status { position: absolute; top: var(--space-md); right: var(--space-md); padding: var(--space-xs) var(--space-sm); border-radius: var(--radius-sm); font-size: 0.7rem; text-transform: uppercase; font-weight: 600; }
.period-status.active { background: rgba(76,175,80,0.15); color: #388e3c; }
.period-card h3 { color: var(--primary-dark); margin-bottom: var(--space-sm); padding-right: 80px; }
.period-dates { color: var(--gray-600); font-size: 0.875rem; line-height: 1.6; }
.period-desc { color: var(--gray-500); font-size: 0.875rem; margin-top: var(--space-sm); }
.period-count { font-size: 0.75rem; color: var(--accent-dark); font-weight: 600; margin-top: var(--space-sm); }

.card-actions { margin-top: var(--space-md); }
.btn-action { display: block; width: 100%; border-radius: var(--radius-full) !important; padding: var(--space-md) var(--space-lg); text-align: center; }

.empty-state { padding: var(--space-3xl); text-align: center; color: var(--gray-500); grid-column: 1 / -1; }

/* Skeleton Styles */
.skeleton-card { position: relative; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-status,
.skeleton-title,
.skeleton-line,
.skeleton-count,
.skeleton-button {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton-status {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 50px;
  height: 22px;
  border-radius: var(--radius-sm);
}

.skeleton-title {
  height: 24px;
  width: 70%;
  margin-bottom: var(--space-md);
}

.skeleton-dates {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.skeleton-line {
  height: 16px;
  width: 85%;
}

.skeleton-line:last-child {
  width: 75%;
}

.skeleton-count {
  height: 14px;
  width: 60%;
  margin-bottom: var(--space-lg);
}

.skeleton-button {
  height: 48px;
  width: 100%;
  border-radius: var(--radius-full);
}
</style>
