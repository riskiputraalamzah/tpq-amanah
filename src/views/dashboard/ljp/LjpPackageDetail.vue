<template>
  <div class="admin-pkg-detail-view">
    <!-- Top Bar -->
    <div class="top-nav">
      <router-link to="/dashboard/admin-ljp" class="back-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5"/>
          <path d="M12 19l-7-7 7-7"/>
        </svg>
        <span>Kembali ke Daftar Package</span>
      </router-link>

      <div class="flex items-center gap-2">
        <button 
          class="btn btn-secondary btn-sm"
          :disabled="loading"
          @click="loadAllData"
          title="Segarkan"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6"/>
            <path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Segarkan
        </button>
        <button 
          class="btn btn-primary btn-sm"
          @click="openAddTeacherModal"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Tambah Guru
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !pkg" class="py-12 text-center">
      <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3"></div>
      <p class="text-gray-500 font-medium">Memuat rincian package LJP...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !pkg" class="error-panel glass-card">
      <div class="text-3xl mb-2">⚠️</div>
      <h3 class="text-lg font-bold text-red-800">Gagal Memuat Package</h3>
      <p class="text-sm text-gray-600 mt-1 mb-4">{{ error }}</p>
      <router-link to="/dashboard/admin-ljp" class="btn btn-secondary btn-sm">
        Kembali ke Daftar Package
      </router-link>
    </div>

    <!-- Main Content -->
    <div v-else-if="pkg" class="detail-content">
      <!-- Header Banner -->
      <div class="header-card glass-card">
        <div class="header-left">
          <div class="flex items-center gap-2 mb-1">
            <span class="period-pill">{{ formatPeriod(pkg.period) }}</span>
            <span class="text-xs text-gray-500 font-mono">ID: {{ pkg.id }}</span>
          </div>
          <h1 class="header-title">Detail Package LJP - {{ formatPeriod(pkg.period) }}</h1>
          <p class="header-subtitle">
            Dibuat pada {{ formatDateTime(pkg.createdAt) }} · Terakhir diperbarui {{ formatDateTime(pkg.updatedAt || pkg.createdAt) }}
          </p>
        </div>
      </div>

      <!-- Summary Statistics Bar -->
      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">Total Guru Terpilih</span>
          <span class="summary-val text-gray-900">{{ summary?.totalSelected ?? (pkg.includedTeacherIds || []).length }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Menunggu Review</span>
          <span class="summary-val text-blue-600">{{ summary?.submitted ?? 0 }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Telah Disetujui</span>
          <span class="summary-val text-green-600">{{ summary?.approved ?? 0 }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Draf / Revisi</span>
          <span class="summary-val text-amber-600">{{ summary?.draft ?? 0 }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Kelengkapan 100%</span>
          <span class="summary-val text-emerald-600">{{ summary?.complete ?? 0 }}</span>
        </div>
      </div>

      <!-- Included Teachers Section -->
      <div class="teachers-section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Daftar Guru dalam Package Ini</h3>
            <p class="section-sub">
              Daftar seluruh guru yang disertakan dalam pelaporan periode {{ formatPeriod(pkg.period) }}.
            </p>
          </div>
          <button 
            class="btn btn-primary btn-sm"
            @click="openAddTeacherModal"
          >
            + Tambah Guru
          </button>
        </div>

        <!-- Empty Teachers in Package -->
        <div v-if="(pkg.includedTeacherIds || []).length === 0" class="empty-teachers glass-card">
          <div class="empty-icon">👥</div>
          <h4>Belum Ada Guru dalam Package</h4>
          <p>Tambahkan guru yang aktif mengajar di periode ini untuk memulai proses pelaporan LJP.</p>
          <button class="btn btn-primary btn-sm mt-3" @click="openAddTeacherModal">
            + Tambah Guru Sekarang
          </button>
        </div>

        <!-- Real Teachers Table & Mobile Cards -->
        <div v-else>
          <!-- Desktop Table -->
          <div class="desktop-table-wrapper">
            <table class="teachers-table">
              <thead>
                <tr>
                  <th>Nama Pengajar</th>
                  <th style="width: 150px;">Status Laporan</th>
                  <th style="width: 170px;">Kelengkapan Data</th>
                  <th style="width: 170px;">Pembaruan Terakhir</th>
                  <th style="width: 220px; text-align: right;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="teacherId in pkg.includedTeacherIds" :key="teacherId">
                  <!-- Nama Pengajar -->
                  <td>
                    <div class="font-bold text-gray-900 text-sm">
                      {{ getTeacherName(teacherId) }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ getTeacherEmail(teacherId) }}
                    </div>
                  </td>

                  <!-- Status Laporan -->
                  <td>
                    <LjpStatusBadge :status="getTeacherReportStatus(teacherId)" />
                  </td>

                  <!-- Kelengkapan Data -->
                  <td>
                    <div class="flex items-center gap-1.5">
                      <span 
                        class="status-indicator-dot"
                        :class="isTeacherComplete(teacherId) ? 'bg-green-500' : 'bg-amber-500'"
                      ></span>
                      <span class="text-xs font-semibold" :class="isTeacherComplete(teacherId) ? 'text-green-700' : 'text-amber-700'">
                        {{ isTeacherComplete(teacherId) ? 'Lengkap (100%)' : 'Belum Lengkap' }}
                      </span>
                    </div>
                  </td>

                  <!-- Pembaruan Terakhir -->
                  <td class="text-xs text-gray-600">
                    {{ formatDateTime(getReportForTeacher(teacherId)?.updatedAt || getReportForTeacher(teacherId)?.createdAt) }}
                  </td>

                  <!-- Aksi -->
                  <td style="text-align: right;">
                    <div class="flex items-center justify-end gap-2">
                      <router-link 
                        v-if="getReportForTeacher(teacherId)"
                        :to="`/dashboard/admin-ljp/report/${getReportForTeacher(teacherId).id}`"
                        class="btn btn-secondary btn-sm"
                      >
                        <span>Review</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M5 12h14"/>
                          <path d="M12 5l7 7-7 7"/>
                        </svg>
                      </router-link>

                      <button 
                        class="btn btn-secondary btn-sm text-red-600 hover:bg-red-50 hover:border-red-200"
                        title="Hapus dari package"
                        :disabled="removingTeacherId === teacherId"
                        @click="handleRemoveTeacher(teacherId)"
                      >
                        <span v-if="removingTeacherId === teacherId" class="spinner-sm"></span>
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="mobile-card-list">
            <div 
              v-for="teacherId in pkg.includedTeacherIds" 
              :key="'m-' + teacherId"
              class="teacher-mobile-card"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h4 class="font-bold text-gray-900 text-sm">{{ getTeacherName(teacherId) }}</h4>
                  <p class="text-xs text-gray-500">{{ getTeacherEmail(teacherId) }}</p>
                </div>
                <LjpStatusBadge :status="getTeacherReportStatus(teacherId)" />
              </div>

              <div class="flex items-center justify-between text-xs py-2 border-t border-b border-gray-100 my-2">
                <span class="text-gray-500">Status Administrasi:</span>
                <span class="font-bold" :class="isTeacherComplete(teacherId) ? 'text-green-700' : 'text-amber-700'">
                  {{ isTeacherComplete(teacherId) ? 'Lengkap (100%)' : 'Belum Lengkap' }}
                </span>
              </div>

              <div class="flex justify-end gap-2 mt-2">
                <button 
                  class="btn btn-secondary btn-sm text-red-600"
                  :disabled="removingTeacherId === teacherId"
                  @click="handleRemoveTeacher(teacherId)"
                >
                  Hapus
                </button>
                <router-link 
                  v-if="getReportForTeacher(teacherId)"
                  :to="`/dashboard/admin-ljp/report/${getReportForTeacher(teacherId).id}`"
                  class="btn btn-primary btn-sm flex-1 text-center"
                >
                  Review Laporan
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Teacher Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddTeacherModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Tambah Guru ke Package</h3>
          <button class="modal-close" @click="closeAddTeacherModal">✕</button>
        </div>

        <div class="modal-body">
          <p class="text-xs text-gray-600 mb-3">
            Pilih guru yang belum terdaftar di package periode ini:
          </p>

          <div v-if="loadingAvailable" class="py-6 text-center text-sm text-gray-500">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mb-2"></div>
            <p>Memuat daftar guru yang tersedia...</p>
          </div>

          <div v-else-if="availableTeachers.length === 0" class="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
            Semua guru aktif telah dimasukkan ke dalam package ini.
          </div>

          <div v-else class="available-list">
            <div 
              v-for="t in availableTeachers" 
              :key="t.id" 
              class="available-item"
              :class="{ 'selected': selectedTeacherId === t.id }"
              @click="selectedTeacherId = t.id"
            >
              <div class="flex items-center gap-2">
                <input 
                  type="radio" 
                  :id="'t-' + t.id" 
                  name="selected_teacher" 
                  :value="t.id" 
                  v-model="selectedTeacherId"
                  class="text-primary-600"
                />
                <div>
                  <label :for="'t-' + t.id" class="font-bold text-gray-900 text-sm cursor-pointer block">
                    {{ t.displayName || t.name || 'Guru' }}
                  </label>
                  <span class="text-xs text-gray-500">{{ t.email || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              :disabled="addingTeacher" 
              @click="closeAddTeacherModal"
            >
              Batal
            </button>
            <button 
              type="button" 
              class="btn btn-primary btn-sm" 
              :disabled="addingTeacher || !selectedTeacherId"
              @click="handleAddTeacher"
            >
              <span v-if="addingTeacher" class="spinner-sm"></span>
              <span>{{ addingTeacher ? 'Menambahkan...' : 'Tambahkan Guru' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ljpService from '@/services/ljp.service'
import { useToast, useConfirm } from '@/composables/useToast'
import LjpStatusBadge from '@/components/ljp/LjpStatusBadge.vue'

const route = useRoute()
const toast = useToast()
const { confirm } = useConfirm()

const packageId = route.params.packageId

const pkg = ref(null)
const summary = ref(null)
const reports = ref([])
const usersMap = ref({}) // { [id]: user }

const loading = ref(true)
const error = ref(null)

// Add Teacher Modal state
const showAddModal = ref(false)
const availableTeachers = ref([])
const loadingAvailable = ref(false)
const selectedTeacherId = ref(null)
const addingTeacher = ref(false)
const removingTeacherId = ref(null)

async function loadPackage() {
  const res = await ljpService.getPackageDetail(packageId)
  pkg.value = res.data
  return res.data
}

async function loadSummary() {
  try {
    const res = await ljpService.getPackageSummary(packageId)
    summary.value = res.data
  } catch (err) {
    console.warn('Could not load package summary:', err)
  }
}

async function loadReports(period) {
  try {
    const res = await ljpService.getTeacherReports({ period })
    reports.value = res.data || []
  } catch (err) {
    console.warn('Could not load teacher reports for package:', err)
  }
}

async function loadUsers() {
  try {
    const res = await ljpService.getTeachers()
    const map = {}
    ;(res.data || []).forEach(u => {
      map[u.id] = u
    })
    usersMap.value = map
  } catch (err) {
    console.warn('Could not load users map:', err)
  }
}

async function loadAllData() {
  loading.value = true
  error.value = null
  try {
    const p = await loadPackage()
    await Promise.all([
      loadSummary(),
      loadReports(p.period),
      loadUsers()
    ])
  } catch (err) {
    console.error('Failed to load package detail:', err)
    error.value = err.response?.data?.error || 'Gagal memuat detail package LJP.'
  } finally {
    loading.value = false
  }
}

function getTeacherName(teacherId) {
  return usersMap.value[teacherId]?.displayName || usersMap.value[teacherId]?.name || `Guru (${teacherId.slice(0, 6)}...)`
}

function getTeacherEmail(teacherId) {
  return usersMap.value[teacherId]?.email || ''
}

function getReportForTeacher(teacherId) {
  return reports.value.find(r => r.guruId === teacherId) || null
}

function getTeacherReportStatus(teacherId) {
  const rep = getReportForTeacher(teacherId)
  if (rep) {
    if (rep.status === 'draft' && rep.reopenedAt) return 'reopen'
    return rep.status
  }
  const summaryItem = summary.value?.teachers?.find(t => t.teacherId === teacherId)
  return summaryItem?.status || 'draft'
}

function isTeacherComplete(teacherId) {
  const summaryItem = summary.value?.teachers?.find(t => t.teacherId === teacherId)
  if (summaryItem) return summaryItem.isComplete
  const rep = getReportForTeacher(teacherId)
  return rep?.completeness?.percentage === 100
}

async function openAddTeacherModal() {
  selectedTeacherId.value = null
  showAddModal.value = true
  loadingAvailable.value = true
  try {
    const res = await ljpService.getAvailableTeachers(packageId)
    availableTeachers.value = res.data || []
  } catch (err) {
    console.error('Failed to load available teachers:', err)
    toast.error('Gagal mengambil daftar guru yang tersedia.')
  } finally {
    loadingAvailable.value = false
  }
}

function closeAddTeacherModal() {
  showAddModal.value = false
}

async function handleAddTeacher() {
  if (!selectedTeacherId.value) return
  addingTeacher.value = true
  try {
    await ljpService.addTeachersToPackage(packageId, { teacherId: selectedTeacherId.value })
    toast.success('Guru berhasil ditambahkan ke package.')
    closeAddTeacherModal()
    await loadAllData()
  } catch (err) {
    console.error('Failed to add teacher:', err)
    const msg = err.response?.data?.error || 'Gagal menambahkan guru ke package.'
    toast.error(msg)
  } finally {
    addingTeacher.value = false
  }
}

async function handleRemoveTeacher(teacherId) {
  const teacherName = getTeacherName(teacherId)
  const confirmed = await confirm(
    `Apakah Anda yakin ingin menghapus ${teacherName} dari package ini? Menghapus guru dari package tidak akan menghapus data operasional atau laporan LJP guru tersebut.`,
    {
      title: 'Konfirmasi Hapus Guru dari Package',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger'
    }
  )

  if (!confirmed) return

  removingTeacherId.value = teacherId
  try {
    await ljpService.removeTeacherFromPackage(packageId, teacherId)
    toast.success('Guru berhasil dihapus dari package.')
    await loadAllData()
  } catch (err) {
    console.error('Failed to remove teacher:', err)
    const msg = err.response?.data?.error || 'Gagal menghapus guru dari package.'
    toast.error(msg)
  } finally {
    removingTeacherId.value = null
  }
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
  loadAllData()
})
</script>

<style scoped>
.admin-pkg-detail-view {
  padding-top: 60px;
  padding-bottom: 3rem;
}

@media (min-width: 1024px) {
  .admin-pkg-detail-view {
    padding-top: 0;
  }
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  transition: color 0.2s;
}

.back-link:hover {
  color: #1e293b;
}

.error-panel {
  text-align: center;
  padding: 3rem 1.5rem;
  max-width: 480px;
  margin: 2rem auto;
}

/* Header Card */
.header-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.period-pill {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1b5e20;
  background: #e8f5e9;
  padding: 2px 8px;
  border-radius: 6px;
}

.header-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0.25rem 0;
}

.header-subtitle {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.summary-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.summary-val {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-top: 4px;
}

/* Teachers Section */
.teachers-section {
  margin-top: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.section-sub {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 2px;
}

.empty-teachers {
  text-align: center;
  padding: 3rem 1.5rem;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  background: #ffffff;
}

.empty-icon {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.empty-teachers h4 {
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.empty-teachers p {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 4px;
}

/* Desktop Table */
.desktop-table-wrapper {
  display: block;
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.teachers-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.teachers-table th {
  background: #f8fafc;
  padding: 10px 14px;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.teachers-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.teachers-table tbody tr:hover {
  background: #f8fafc;
}

.status-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

/* Mobile Cards */
.mobile-card-list {
  display: none;
  flex-direction: column;
  gap: 0.75rem;
}

.teacher-mobile-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

@media (max-width: 768px) {
  .desktop-table-wrapper {
    display: none;
  }
  .mobile-card-list {
    display: flex;
  }
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
  max-width: 440px;
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

.available-list {
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.available-item {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.available-item:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.available-item.selected {
  background: #eff6ff;
  border-color: #3b82f6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
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
