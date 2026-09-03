<template>
  <div class="ljp-detail-view">
    <!-- Back Navigation & Top Bar -->
    <div class="top-nav">
      <router-link to="/dashboard/ljp" class="back-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5"/>
          <path d="M12 19l-7-7 7-7"/>
        </svg>
        <span>Kembali ke Daftar LJP</span>
      </router-link>

      <div class="flex items-center gap-2">
        <button 
          class="btn btn-secondary btn-sm"
          :disabled="loading"
          @click="loadAllData"
          title="Segarkan Data"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6"/>
            <path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Segarkan
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading && !report" class="py-12 text-center">
      <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3"></div>
      <p class="text-gray-500 font-medium">Memuat rincian laporan LJP...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !report" class="error-panel glass-card">
      <div class="text-3xl mb-2">⚠️</div>
      <h3 class="text-lg font-bold text-red-800">Gagal Memuat Laporan</h3>
      <p class="text-sm text-gray-600 mt-1 mb-4">{{ error }}</p>
      <router-link to="/dashboard/ljp" class="btn btn-secondary btn-sm">
        Kembali ke Daftar
      </router-link>
    </div>

    <!-- Main Content -->
    <div v-else-if="report" class="report-content">
      <!-- Header Banner -->
      <div class="report-header glass-card">
        <div class="header-main">
          <div class="flex flex-wrap items-center gap-3">
            <span class="period-pill">{{ formatPeriod(report.period) }}</span>
            <LjpStatusBadge :status="reportStatusDisplay" />
          </div>
          <h1 class="report-title">Laporan Jurnal Pembelajaran (LJP)</h1>
          <div class="teacher-info">
            <span>Pengajar: <strong>{{ teacherName }}</strong></span>
            <span v-if="teacherNik" class="text-gray-400">·</span>
            <span v-if="teacherNik">NIK: {{ teacherNik }}</span>
          </div>
        </div>

        <!-- Submit Action Bar (if Draft/Reopen) -->
        <div class="header-actions">
          <div v-if="isDraftOrReopen" class="flex flex-col sm:items-end gap-2">
            <button 
              class="btn btn-primary"
              :disabled="submitting || !canSubmit"
              @click="handleSubmit"
            >
              <span v-if="submitting" class="spinner-sm"></span>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <span>{{ submitting ? 'Mengirim...' : 'Ajukan Laporan ke Admin' }}</span>
            </button>
            <span v-if="!canSubmit" class="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
              ⚠️ Belum 100% lengkap. Lengkapi data agar tombol aktif.
            </span>
          </div>
        </div>
      </div>

      <!-- Lifecycle Alert Banners -->
      <div v-if="report.status === 'submitted'" class="status-alert alert-submitted">
        <div class="flex items-start gap-3">
          <span class="text-xl">⏳</span>
          <div>
            <h4 class="font-bold text-blue-900">Menunggu Review dan Persetujuan Admin</h4>
            <p class="text-xs text-blue-800 mt-0.5">
              Laporan telah berhasil diajukan pada {{ formatDateTime(report.submittedAt) }}. Selama tahap peninjauan, seluruh data sesi dan absensi pada periode ini berada dalam status terkunci.
            </p>
          </div>
        </div>
      </div>

      <div v-else-if="report.status === 'approved'" class="status-alert alert-approved">
        <div class="flex items-start gap-3">
          <span class="text-xl">✅</span>
          <div>
            <h4 class="font-bold text-green-900">Laporan Telah Disetujui (Approved)</h4>
            <p class="text-xs text-green-800 mt-0.5">
              Laporan telah diverifikasi dan disetujui oleh Administrator pada {{ formatDateTime(report.approvedAt) }}. Anda dapat men-generate dan mengunduh seluruh dokumen berkas LJP di bawah ini.
            </p>
          </div>
        </div>
      </div>

      <div v-else-if="isReopen" class="status-alert alert-reopen">
        <div class="flex items-start gap-3">
          <span class="text-xl">⚠️</span>
          <div>
            <h4 class="font-bold text-red-900">Laporan Dibuka Kembali (Perlu Revisi)</h4>
            <p class="text-xs text-red-800 mt-0.5">
              Laporan dibuka kembali oleh Admin untuk perbaikan. Seluruh dokumen fisik yang pernah digenerate sebelumnya telah ditandai tidak berlaku (invalid). Silakan perbaiki data melalui modul absensi/jurnal, kemudian ajukan kembali.
            </p>
          </div>
        </div>
      </div>

      <!-- Section 1: Completeness Overview -->
      <section class="content-section">
        <LjpCompletenessCard 
          :completeness="completeness"
          :loading="loadingCompleteness"
        />
      </section>

      <!-- Section 2: Document Generation (Highlighted especially when Approved) -->
      <section class="content-section">
        <div class="section-header">
          <div>
            <h3 class="section-heading">Berkas & Dokumen Cetak LJP</h3>
            <p class="section-sub">Dokumen resmi format Kemenag yang digenerate berdasarkan data operasional yang telah divalidasi.</p>
          </div>
          <span v-if="report.status !== 'approved'" class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
            Tersedia untuk divalidasi
          </span>
          <span v-else class="text-xs text-green-800 bg-green-100 px-3 py-1 rounded-full font-bold">
            Siap Unduh / Cetak
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <!-- Dokumen 1: Jurnal Harian -->
          <LjpDocumentCard 
            title="1. Jurnal Harian Mengajar"
            description="Rekap materi pelajaran, catatan KBM, dan aktivitas santri per hari."
            docType="JOURNAL"
            :reportId="report.id"
            :existingDoc="findDocument('JOURNAL')"
            :canGenerate="true"
            @generate-success="onDocumentGenerated"
          />

          <!-- Dokumen 2: Presensi Guru -->
          <LjpDocumentCard 
            title="2. Daftar Hadir Guru"
            description="Rekap tanda tangan kehadiran bulanan guru (format landscape)."
            docType="TEACHER_ATTENDANCE"
            :reportId="report.id"
            :existingDoc="findDocument('TEACHER_ATTENDANCE')"
            :canGenerate="true"
            @generate-success="onDocumentGenerated"
          />

          <!-- Dokumen 3: Presensi Santri (Class-specific) -->
          <LjpDocumentCard 
            title="3. Daftar Hadir Santri"
            description="Presensi santri per kelas yang diampu dalam periode laporan ini."
            docType="STUDENT_ATTENDANCE"
            :reportId="report.id"
            :availableClasses="taughtClasses"
            :classDocsMap="classDocsMap"
            :existingDoc="findDocument('STUDENT_ATTENDANCE')"
            :canGenerate="true"
            @generate-success="onDocumentGenerated"
          />

          <!-- Dokumen 4: SPTJM -->
          <LjpDocumentCard 
            title="4. SPTJM (Surat Pertanggungjawaban)"
            description="Pernyataan mutlak tanggung jawab bermaterai dengan identitas lengkap."
            docType="SPTJM"
            :reportId="report.id"
            :existingDoc="findDocument('SPTJM')"
            :canGenerate="true"
            :sptjmReady="sptjmReady"
            :missingFields="missingSptjmFields"
            @generate-success="onDocumentGenerated"
          />
        </div>

        <!-- Berkas Fisik: Signed SPTJM Upload & Versioning -->
        <LjpSignedSptjmCard 
          :reportId="report.id"
          :signedDocs="signedDocs"
          :canUpload="true"
          @upload-success="onSignedUploaded"
        />
      </section>

      <!-- Section 3: Daily Operational Review -->
      <section class="content-section">
        <LjpDailyTable 
          :sessions="sessions"
          :loading="loadingSessions"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast, useConfirm } from '@/composables/useToast'
import ljpService from '@/services/ljp.service'
import LjpStatusBadge from '@/components/ljp/LjpStatusBadge.vue'
import LjpCompletenessCard from '@/components/ljp/LjpCompletenessCard.vue'
import LjpDailyTable from '@/components/ljp/LjpDailyTable.vue'
import LjpDocumentCard from '@/components/ljp/LjpDocumentCard.vue'
import LjpSignedSptjmCard from '@/components/ljp/LjpSignedSptjmCard.vue'

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()
const { confirm } = useConfirm()

const reportId = route.params.reportId

const report = ref(null)
const completeness = ref(null)
const sessions = ref([])
const taughtClasses = ref([])
const tpqProfile = ref(null)

const loading = ref(true)
const loadingCompleteness = ref(false)
const loadingSessions = ref(false)
const submitting = ref(false)
const error = ref(null)

// Generated documents metadata map: { [docType]: docMetadata }
const documentsMap = ref({})
// Class-specific documents map: { [classId]: docMetadata }
const classDocsMap = ref({})
// Signed SPTJM history list: [docMetadata, ...]
const signedDocs = ref([])

// Computed
const teacherName = computed(() => {
  return authStore.user?.displayName || authStore.user?.name || 'Guru'
})

const teacherNik = computed(() => {
  return authStore.user?.nik || ''
})

const isDraftOrReopen = computed(() => {
  const s = report.value?.status
  return s === 'draft' || s === 'reopen'
})

const isReopen = computed(() => {
  return report.value?.status === 'reopen' || (report.value?.status === 'draft' && !!report.value?.reopenedAt)
})

const reportStatusDisplay = computed(() => {
  if (isReopen.value) return 'reopen'
  return report.value?.status || 'draft'
})

const canSubmit = computed(() => {
  return isDraftOrReopen.value && completeness.value?.percentage === 100
})

// SPTJM Readiness Check
const missingSptjmFields = computed(() => {
  const missing = []
  const u = authStore.user || {}
  if (!u.nik) missing.push('NIK')
  if (!u.birthPlace) missing.push('Tempat Lahir')
  if (!u.birthDate) missing.push('Tanggal Lahir')
  if (!u.address) missing.push('Alamat')
  if (!u.position) missing.push('Jabatan')

  const tpq = tpqProfile.value || {}
  if (!tpq.tpqName && !tpq.name) missing.push('Nama TPQ')
  if (!tpq.address) missing.push('Alamat TPQ')
  if (!tpq.headName) missing.push('Nama Kepala TPQ')

  return missing
})

const sptjmReady = computed(() => {
  return missingSptjmFields.value.length === 0
})

// Functions
async function loadReport() {
  const res = await ljpService.getReportDetail(reportId)
  report.value = res.data
  return res.data
}

async function loadCompleteness() {
  loadingCompleteness.value = true
  try {
    const res = await ljpService.checkCompleteness(reportId)
    completeness.value = res.data
  } catch (err) {
    console.error('Failed to load completeness:', err)
  } finally {
    loadingCompleteness.value = false
  }
}

async function loadSessions(period) {
  if (!period) return
  loadingSessions.value = true
  try {
    const [year, month] = period.split('-')
    const res = await ljpService.getTeachingSessions({ year, month })
    sessions.value = res.data || []

    // Extract unique classes taught in this period
    const classesMap = new Map()
    sessions.value.forEach(s => {
      if (s.type === 'teaching' && s.classId) {
        if (!classesMap.has(s.classId)) {
          classesMap.set(s.classId, {
            id: s.classId,
            name: s.className || `Kelas ${s.classId}`
          })
        }
      }
    })

    if (classesMap.size > 0) {
      taughtClasses.value = Array.from(classesMap.values())
    } else {
      // Fallback to all classes from backend if none recorded yet
      const clRes = await ljpService.getClasses()
      taughtClasses.value = clRes.data || [
        { id: '1', name: 'Kelas 1' },
        { id: '2', name: 'Kelas 2' }
      ]
    }
  } catch (err) {
    console.error('Failed to load sessions:', err)
  } finally {
    loadingSessions.value = false
  }
}

async function loadTpqProfile() {
  try {
    const res = await ljpService.getTpqProfile()
    tpqProfile.value = res.data
  } catch (err) {
    console.warn('Could not load TPQ profile for SPTJM readiness check:', err)
  }
}

async function loadAllData() {
  loading.value = true
  error.value = null
  try {
    const rep = await loadReport()
    applyReopenInvalidation()
    await Promise.all([
      loadCompleteness(),
      loadSessions(rep.period),
      loadTpqProfile()
    ])
  } catch (err) {
    console.error('Failed to load LJP report detail:', err)
    if (err.response?.status === 403) {
      error.value = 'Anda tidak memiliki akses ke laporan LJP ini atau laporan sedang dikunci.'
    } else if (err.response?.status === 404) {
      error.value = 'Laporan LJP tidak ditemukan.'
    } else {
      error.value = err.response?.data?.error || 'Gagal memuat data laporan LJP. Silakan coba lagi.'
    }
  } finally {
    loading.value = false
  }
}

function findDocument(docType) {
  return documentsMap.value[docType] || null
}

function onDocumentGenerated({ docType, document, classId }) {
  if (docType === 'STUDENT_ATTENDANCE' && classId) {
    classDocsMap.value[classId] = document
    documentsMap.value[docType] = document
  } else {
    documentsMap.value[docType] = document
  }
}

function onSignedUploaded(document) {
  if (!document) return
  // Invalidate any previously valid signed doc locally to reflect backend state
  signedDocs.value.forEach(d => {
    if (d.status === 'VALID') {
      d.status = 'INVALID'
      d.invalidatedReason = 'Superseded by new version'
    }
  })
  signedDocs.value.unshift(document)
}

function applyReopenInvalidation() {
  if (isReopen.value) {
    Object.keys(documentsMap.value).forEach(k => {
      if (documentsMap.value[k]) {
        documentsMap.value[k] = { ...documentsMap.value[k], status: 'INVALID' }
      }
    })
    Object.keys(classDocsMap.value).forEach(k => {
      if (classDocsMap.value[k]) {
        classDocsMap.value[k] = { ...classDocsMap.value[k], status: 'INVALID' }
      }
    })
    signedDocs.value = signedDocs.value.map(d => ({
      ...d,
      status: 'INVALID',
      invalidatedReason: d.invalidatedReason || 'Report reopened to draft'
    }))
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return

  const confirmed = await confirm(
    'Setelah diajukan, Anda tidak dapat mengubah data presensi kehadiran atau jurnal mengajar bulan ini sampai diverifikasi oleh Administrator TPQ. Apakah Anda yakin ingin mengajukan laporan ini?',
    {
      title: 'Konfirmasi Pengajuan Laporan LJP',
      confirmText: 'Ya, Ajukan Laporan',
      cancelText: 'Batal',
      type: 'warning'
    }
  )

  if (!confirmed) return

  submitting.value = true
  try {
    const res = await ljpService.submitReport(reportId)
    toast.success(res.data?.message || 'Laporan LJP berhasil diajukan ke Admin.')
    await loadAllData()
  } catch (err) {
    console.error('Failed to submit report:', err)
    const msg = err.response?.data?.error || 'Gagal mengajukan laporan. Pastikan seluruh kelengkapan data terpenuhi.'
    toast.error(msg)
  } finally {
    submitting.value = false
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return String(dateVal)
  }
}

onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
.ljp-detail-view {
  padding-top: 60px;
  padding-bottom: 3rem;
}

@media (min-width: 1024px) {
  .ljp-detail-view {
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

/* Header */
.report-header {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.header-main {
  flex: 1;
}

.period-pill {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1b5e20;
  background: #e8f5e9;
  padding: 3px 10px;
  border-radius: 6px;
}

.report-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0.5rem 0 0.25rem 0;
}

.teacher-info {
  font-size: 0.85rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Status Alert Banners */
.status-alert {
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border-left-width: 4px;
}

.alert-submitted {
  background: #eff6ff;
  border-color: #3b82f6;
}

.alert-approved {
  background: #f0fdf4;
  border-color: #22c55e;
}

.alert-reopen {
  background: #fef2f2;
  border-color: #ef4444;
}

/* Sections */
.content-section {
  margin-top: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.section-heading {
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
