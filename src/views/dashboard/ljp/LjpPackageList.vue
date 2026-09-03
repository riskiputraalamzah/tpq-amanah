<template>
  <div class="admin-ljp-view">
    <!-- Header -->
    <header class="page-header">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="page-title">📦 Kelola Package LJP (Admin)</h1>
          <p class="page-subtitle">Daftar paket pelaporan bulanan guru TPQ Amanah per periode.</p>
        </div>
        <div class="flex items-center gap-2">
          <button 
            class="btn btn-secondary btn-sm"
            :disabled="loading"
            @click="loadPackages"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Segarkan
          </button>
          <button 
            class="btn btn-primary btn-sm"
            @click="openCreateModal"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Buka Periode Baru
          </button>
        </div>
      </div>
    </header>

    <!-- Error Alert -->
    <div v-if="error" class="error-banner">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span>⚠️</span>
          <span>{{ error }}</span>
        </div>
        <button class="btn btn-secondary btn-sm" @click="loadPackages">Coba Lagi</button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="i in 3" :key="i" class="package-card skeleton-card">
        <div class="skeleton-line w-28 h-6 mb-3"></div>
        <div class="skeleton-line w-48 h-7 mb-2"></div>
        <div class="skeleton-line w-32 h-4 mb-4"></div>
        <div class="skeleton-line w-full h-10 mt-auto"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="packages.length === 0" class="empty-state glass-card">
      <div class="empty-icon">📁</div>
      <h3>Belum Ada Package LJP</h3>
      <p>Belum ada paket periode pelaporan yang dibuat oleh Administrator.</p>
      <button class="btn btn-primary btn-sm mt-4" @click="openCreateModal">
        + Buat Package Pertama
      </button>
    </div>

    <!-- Package Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div 
        v-for="pkg in packages" 
        :key="pkg.id" 
        class="package-card glass-card"
      >
        <div class="card-top">
          <span class="period-pill">{{ formatPeriod(pkg.period) }}</span>
          <span class="teachers-count">
            {{ (pkg.includedTeacherIds || []).length }} Guru
          </span>
        </div>

        <h3 class="package-title">LJP Periode {{ formatPeriod(pkg.period) }}</h3>
        <p class="package-code">Kode Periode: <code>{{ pkg.period }}</code></p>

        <div class="card-meta">
          <div class="meta-row">
            <span>Dibuat pada:</span>
            <span>{{ formatDateTime(pkg.createdAt) }}</span>
          </div>
          <div v-if="pkg.updatedAt" class="meta-row">
            <span>Pembaruan:</span>
            <span>{{ formatDateTime(pkg.updatedAt) }}</span>
          </div>
        </div>

        <div class="card-actions">
          <router-link 
            :to="`/dashboard/admin-ljp/${pkg.id}`" 
            class="btn btn-primary btn-sm w-full"
          >
            <span>Buka Detail Package</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14"/>
              <path d="M12 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Create Package Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Buka Package Periode Baru</h3>
          <button class="modal-close" @click="closeCreateModal">✕</button>
        </div>

        <form @submit.prevent="handleCreatePackage" class="modal-body">
          <p class="text-xs text-gray-600 mb-4">
            Pilih bulan dan tahun untuk membuka periode pelaporan LJP baru. Format teknis: <code>YYYY-MM</code>.
          </p>

          <div class="form-group">
            <label class="form-label">Bulan Pelaporan</label>
            <select v-model="formMonth" class="form-input form-select" required>
              <option v-for="(name, idx) in monthNames" :key="idx" :value="idx + 1">
                {{ name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Tahun</label>
            <input 
              v-model.number="formYear" 
              type="number" 
              class="form-input" 
              min="2020" 
              max="2035" 
              required 
            />
          </div>

          <div class="p-3 bg-blue-50 rounded-lg text-xs text-blue-900 border border-blue-100 mt-2">
            Periode yang akan dibuat: <strong>{{ selectedPeriodFormatted }}</strong> (<code>{{ selectedPeriodCode }}</code>)
          </div>

          <div class="modal-actions">
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              :disabled="creating" 
              @click="closeCreateModal"
            >
              Batal
            </button>
            <button 
              type="submit" 
              class="btn btn-primary btn-sm" 
              :disabled="creating"
            >
              <span v-if="creating" class="spinner-sm"></span>
              <span>{{ creating ? 'Menyimpan...' : 'Buka Package' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ljpService from '@/services/ljp.service'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const packages = ref([])
const loading = ref(true)
const creating = ref(false)
const error = ref(null)

// Modal state
const showModal = ref(false)
const today = new Date()
const formMonth = ref(today.getMonth() + 1)
const formYear = ref(today.getFullYear())

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const selectedPeriodCode = computed(() => {
  const m = String(formMonth.value).padStart(2, '0')
  return `${formYear.value}-${m}`
})

const selectedPeriodFormatted = computed(() => {
  return `${monthNames[formMonth.value - 1]} ${formYear.value}`
})

async function loadPackages() {
  loading.value = true
  error.value = null
  try {
    const res = await ljpService.getPackages()
    packages.value = res.data || []
  } catch (err) {
    console.error('Failed to load packages:', err)
    error.value = err.response?.data?.error || 'Gagal memuat daftar LJP Packages. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  formMonth.value = today.getMonth() + 1
  formYear.value = today.getFullYear()
  showModal.value = true
}

function closeCreateModal() {
  showModal.value = false
}

async function handleCreatePackage() {
  creating.value = true
  try {
    const res = await ljpService.createPackage({ period: selectedPeriodCode.value })
    toast.success(res.data?.message || 'Package LJP berhasil dibuka.')
    closeCreateModal()
    await loadPackages()
  } catch (err) {
    console.error('Failed to create package:', err)
    const msg = err.response?.data?.error || 'Gagal membuat package LJP.'
    toast.error(msg)
  } finally {
    creating.value = false
  }
}

function formatPeriod(periodStr) {
  if (!periodStr) return '-'
  try {
    const [y, m] = periodStr.split('-')
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
  loadPackages()
})
</script>

<style scoped>
.admin-ljp-view {
  padding-top: 60px;
  padding-bottom: 3rem;
}

@media (min-width: 1024px) {
  .admin-ljp-view {
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

.package-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.package-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.period-pill {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1b5e20;
  background: #e8f5e9;
  padding: 2px 8px;
  border-radius: 6px;
}

.teachers-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 9999px;
}

.package-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.package-code {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 2px;
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

.meta-row {
  display: flex;
  justify-content: space-between;
}

.card-actions {
  margin-top: 1.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-dialog {
  background: #ffffff;
  border-radius: 16px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: #64748b;
  cursor: pointer;
}

.modal-body {
  padding: 1.25rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
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

.spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
