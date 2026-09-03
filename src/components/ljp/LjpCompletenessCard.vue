<template>
  <div class="completeness-card glass-card">
    <div v-if="loading" class="completeness-loading">
      <div class="skeleton-bar"></div>
      <div class="skeleton-text"></div>
    </div>

    <div v-else-if="!completeness" class="completeness-empty">
      <p class="text-sm text-gray-500">Data kelengkapan belum dihitung.</p>
    </div>

    <div v-else class="completeness-body">
      <!-- Top Overview: Percentage & Status -->
      <div class="overview-row">
        <div class="percent-circle" :class="isComplete ? 'complete' : 'incomplete'">
          <span class="percent-val">{{ completeness.percentage ?? 0 }}%</span>
          <span class="percent-label">Lengkap</span>
        </div>

        <div class="overview-info">
          <div class="flex items-center gap-2">
            <h3 class="overview-title">Kelengkapan Administrasi</h3>
            <span 
              class="status-pill"
              :class="isComplete ? 'pill-success' : 'pill-warning'"
            >
              {{ isComplete ? 'LENGKAP' : 'BELUM LENGKAP' }}
            </span>
          </div>

          <p class="overview-stats">
            <strong>{{ completeness.coveredDays ?? 0 }}</strong> dari <strong>{{ completeness.totalExpectedDays ?? 0 }}</strong> hari operasional terpenuhi.
            <span v-if="(completeness.missingDays ?? 0) > 0" class="text-amber-600 font-medium ml-1">
              ({{ completeness.missingDays }} hari belum lengkap)
            </span>
          </p>

          <p v-if="!isComplete" class="action-hint">
            Masih ada data operasional yang perlu dilengkapi sebelum laporan dapat dikirim.
          </p>
          <p v-else class="action-hint text-green-700">
            Seluruh data operasional bulan ini telah lengkap dan siap diajukan ke Admin.
          </p>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-track">
        <div 
          class="progress-fill" 
          :class="isComplete ? 'fill-success' : 'fill-warning'"
          :style="{ width: `${Math.min(completeness.percentage || 0, 100)}%` }"
        ></div>
      </div>

      <!-- Missing Days Notice & Quick Links -->
      <div v-if="!isComplete && missingDetails.length > 0" class="missing-section">
        <div class="missing-header">
          <span class="missing-title">Rincian Hari yang Belum Lengkap:</span>
          <span class="text-xs text-gray-500">{{ missingDetails.length }} tanggal</span>
        </div>

        <div class="missing-list">
          <div 
            v-for="item in missingDetails" 
            :key="item.date" 
            class="missing-item"
          >
            <span class="missing-date">{{ formatDate(item.date) }}</span>
            <span class="missing-note">{{ item.note || 'Belum ada presensi / jurnal' }}</span>
          </div>
        </div>

        <!-- Quick actions to fill data in existing modules -->
        <div class="quick-links">
          <span class="text-xs font-semibold text-gray-600">Lengkapi data melalui modul:</span>
          <div class="flex flex-wrap gap-2 mt-1">
            <router-link to="/dashboard/attendance" class="btn btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <path d="M9 16l2 2 4-4"/>
              </svg>
              Absensi Kehadiran
            </router-link>
            <router-link to="/dashboard/grading" class="btn btn-secondary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Penilaian Santri
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  completeness: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const isComplete = computed(() => {
  return props.completeness?.percentage === 100 || props.completeness?.status === 'COMPLETE'
})

const missingDetails = computed(() => {
  if (!props.completeness?.dailyDetails) return []
  return props.completeness.dailyDetails.filter(d => !d.isCovered)
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const [y, m, d] = dateStr.split('-')
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch (e) {
    return dateStr
  }
}
</script>

<style scoped>
.completeness-card {
  padding: 1.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.overview-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .overview-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

.percent-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-width: 4px;
}

.percent-circle.complete {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #15803d;
}

.percent-circle.incomplete {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #b45309;
}

.percent-val {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.percent-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 2px;
}

.overview-info {
  flex: 1;
}

.overview-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.05em;
}

.pill-success {
  background: #dcfce7;
  color: #166534;
}

.pill-warning {
  background: #fef3c7;
  color: #92400e;
}

.overview-stats {
  font-size: 0.9rem;
  color: #334155;
  margin-top: 0.25rem;
}

.action-hint {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
  margin-top: 1.25rem;
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.fill-success {
  background: #22c55e;
}

.fill-warning {
  background: #f59e0b;
}

.missing-section {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px dashed #e2e8f0;
}

.missing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.missing-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #b45309;
}

.missing-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.missing-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 6px;
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .missing-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}

.missing-date {
  font-weight: 600;
  color: #451a03;
}

.missing-note {
  color: #92400e;
}

.quick-links {
  margin-top: 1rem;
}

/* Skeleton loader */
.skeleton-bar {
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  animation: pulse 1.5s infinite;
  margin-bottom: 8px;
}
.skeleton-text {
  height: 20px;
  width: 60%;
  background: #e2e8f0;
  border-radius: 6px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>

