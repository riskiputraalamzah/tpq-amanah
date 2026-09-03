<template>
  <div class="ljp-teacher-view">
    <header class="page-header">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="page-title">📋 Laporan Jurnal Pembelajaran (LJP)</h1>
          <p class="page-subtitle">Pusat kendali dan administrasi laporan bulanan guru TPQ Amanah.</p>
        </div>
        <button 
          class="btn btn-secondary btn-sm self-start sm:self-auto"
          :disabled="loading"
          @click="loadReports"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6"/>
            <path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Segarkan
        </button>
      </div>
    </header>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span>⚠️</span>
          <span>{{ error }}</span>
        </div>
        <button class="btn btn-secondary btn-sm" @click="loadReports">Coba Lagi</button>
      </div>
    </div>

    <!-- Reports Grid / List -->
    <div class="reports-container">
      <!-- Loading Skeletons -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div v-for="i in 3" :key="i" class="report-card skeleton-card">
          <div class="skeleton-line w-24 h-5 mb-3"></div>
          <div class="skeleton-line w-40 h-6 mb-2"></div>
          <div class="skeleton-line w-full h-4 mb-4"></div>
          <div class="skeleton-line w-full h-10 mt-4"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="reports.length === 0" class="empty-state glass-card">
        <div class="empty-icon">📄</div>
        <h3>Belum Ada Laporan LJP</h3>
        <p>Anda belum memiliki laporan LJP yang ditugaskan oleh Admin untuk periode aktif.</p>
        <p class="text-xs text-gray-500 mt-1">Silakan hubungi administrator TPQ untuk membuka periode pelaporan.</p>
      </div>

      <!-- Real Reports List -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div 
          v-for="rep in sortedReports" 
          :key="rep.id" 
          class="report-card glass-card"
        >
          <div class="card-top">
            <span class="period-badge">{{ formatPeriod(rep.period) }}</span>
            <LjpStatusBadge :status="getReportStatus(rep)" />
          </div>

          <h3 class="card-title">LJP Periode {{ formatPeriod(rep.period) }}</h3>
          
          <!-- Completeness Snippet -->
          <div class="completeness-snippet">
            <div class="flex justify-between items-center text-xs mb-1">
              <span class="text-gray-600 font-medium">Kelengkapan Administrasi:</span>
              <strong :class="rep.completeness?.percentage === 100 ? 'text-green-700' : 'text-amber-700'">
                {{ rep.completeness?.percentage ?? 0 }}%
              </strong>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all"
                :class="rep.completeness?.percentage === 100 ? 'bg-green-600' : 'bg-amber-500'"
                :style="{ width: `${rep.completeness?.percentage ?? 0}%` }"
              ></div>
            </div>
          </div>

          <!-- Metadata info -->
          <div class="card-meta">
            <div class="meta-item">
              <span class="meta-label">Terakhir diperbarui:</span>
              <span class="meta-val">{{ formatDateTime(rep.updatedAt || rep.createdAt) }}</span>
            </div>
            <div v-if="rep.submittedAt" class="meta-item">
              <span class="meta-label">Tanggal submit:</span>
              <span class="meta-val">{{ formatDateTime(rep.submittedAt) }}</span>
            </div>
            <div v-if="rep.approvedAt" class="meta-item">
              <span class="meta-label">Tanggal disetujui:</span>
              <span class="meta-val">{{ formatDateTime(rep.approvedAt) }}</span>
            </div>
          </div>

          <!-- Action -->
          <div class="card-actions">
            <router-link 
              :to="`/dashboard/ljp/${rep.id}`" 
              class="btn btn-primary btn-sm w-full"
            >
              <span>Buka Laporan</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14"/>
                <path d="M12 5l7 7-7 7"/>
              </svg>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ljpService from '@/services/ljp.service'
import LjpStatusBadge from '@/components/ljp/LjpStatusBadge.vue'

const reports = ref([])
const loading = ref(true)
const error = ref(null)

const sortedReports = computed(() => {
  return [...reports.value].sort((a, b) => {
    return (b.period || '').localeCompare(a.period || '')
  })
})

async function loadReports() {
  loading.value = true
  error.value = null
  try {
    const res = await ljpService.getTeacherReports()
    reports.value = res.data || []
  } catch (err) {
    console.error('Failed to load teacher LJP reports:', err)
    error.value = err.response?.data?.error || 'Gagal memuat daftar laporan LJP. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}

function getReportStatus(rep) {
  if (rep?.status === 'draft' && rep?.reopenedAt) return 'reopen'
  return rep?.status || 'draft'
}

function formatPeriod(periodStr) {
  if (!periodStr) return '-'
  try {
    const [y, m] = periodStr.split('-')
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const mIdx = parseInt(m, 10) - 1
    return `${monthNames[mIdx] || m} ${y}`
  } catch (e) {
    return periodStr
  }
}

function formatDateTime(dateVal) {
  if (!dateVal) return '-'
  try {
    const d = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch (e) {
    return '-'
  }
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped>
.ljp-teacher-view {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .ljp-teacher-view {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 4px;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3.5rem 1.5rem;
  border-radius: 16px;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.empty-state h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.empty-state p {
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 4px;
}

.report-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.period-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1b5e20;
  background: #e8f5e9;
  padding: 2px 8px;
  border-radius: 6px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.completeness-snippet {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 10px;
}

.card-meta {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  color: #64748b;
  flex-grow: 1;
}

.meta-item {
  display: flex;
  justify-content: space-between;
}

.card-actions {
  margin-top: 1.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

/* Skeleton */
.skeleton-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
}
.skeleton-line {
  background: #f1f5f9;
  border-radius: 6px;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
