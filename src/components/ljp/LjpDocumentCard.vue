<template>
  <div class="doc-card" :class="cardBorderClass">
    <div class="doc-header">
      <div class="flex items-center gap-2">
        <div class="doc-icon-box" :class="iconBoxClass">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div>
          <h4 class="doc-title">{{ title }}</h4>
          <p class="doc-desc">{{ description }}</p>
        </div>
      </div>

      <!-- State Tag -->
      <span class="doc-status-tag" :class="statusTagClass">
        {{ statusTagLabel }}
      </span>
    </div>

    <!-- Class Selection for Student Attendance (Document 3) -->
    <div v-if="docType === 'STUDENT_ATTENDANCE'" class="class-select-area">
      <div class="flex items-center justify-between mb-1">
        <label class="form-label text-xs mb-0">Pilih Kelas Santri:</label>
        <span v-if="currentClassDoc" class="text-[10px] text-gray-500 font-mono">
          {{ currentClassDoc.status === 'VALID' ? 'Sudah Digenerate' : 'Status: ' + currentClassDoc.status }}
        </span>
      </div>
      <select 
        v-model="selectedClassId" 
        class="form-input form-select text-xs py-1.5"
        :disabled="generating"
      >
        <option v-for="c in availableClasses" :key="c.id" :value="c.id">
          {{ c.name || `Kelas ${c.id}` }}
        </option>
      </select>
    </div>

    <!-- SPTJM Incomplete Warning Gate -->
    <div v-if="docType === 'SPTJM' && !sptjmReady" class="sptjm-warning-banner">
      <div class="text-xs text-amber-800 font-medium">
        ⚠️ Data Identitas Pengajar / Profil TPQ belum lengkap untuk SPTJM.
      </div>
      <div v-if="missingFields && missingFields.length > 0" class="text-[11px] text-amber-700 mt-0.5">
        Belum diisi: {{ missingFields.join(', ') }}
      </div>
      <router-link to="/dashboard/users" class="inline-block text-xs text-primary-700 font-bold underline mt-1">
        Lengkapi Profil Pengajar →
      </router-link>
    </div>

    <!-- Metadata Details if available -->
    <div v-if="activeMetadata && activeMetadata.status === 'VALID'" class="metadata-box">
      <div class="meta-row">
        <span>Versi Dokumen:</span>
        <strong class="text-gray-800">
          v{{ activeMetadata.documentVersion || 1 }} (Template {{ activeMetadata.templateVersion || '2026.1' }})
        </strong>
      </div>
      <div v-if="activeMetadata.generatedAt" class="meta-row">
        <span>Waktu Dibuat:</span>
        <span>{{ formatDateTime(activeMetadata.generatedAt) }}</span>
      </div>
      <div v-if="activeMetadata.storagePath" class="meta-row text-[10px] text-gray-400 truncate">
        <span>Berkas:</span>
        <span class="truncate ml-1 font-mono">{{ activeMetadata.storagePath }}</span>
      </div>
    </div>

    <!-- Invalidation Notice -->
    <div v-else-if="activeMetadata && activeMetadata.status === 'INVALID'" class="invalidation-notice">
      <div class="font-bold mb-0.5">Versi sebelumnya sudah tidak berlaku.</div>
      <div>Dokumen ini telah diinvalidasi (status: INVALID) karena laporan dibuka kembali untuk revisi. Silakan generate ulang untuk mendapatkan dokumen resmi versi terbaru.</div>
    </div>

    <!-- Error / Failed Notice -->
    <div v-else-if="generationError" class="failed-notice">
      <div class="font-bold">Gagal Membuat Dokumen:</div>
      <div class="text-[11px]">{{ generationError }}</div>
    </div>

    <!-- Actions Area -->
    <div class="doc-actions">
      <!-- 1. NOT GENERATED or FAILED: Generate button -->
      <button 
        v-if="!activeMetadata || activeMetadata.status === 'INVALID' || generationError"
        class="btn btn-primary btn-sm w-full"
        :disabled="generating || !canGenerate || (docType === 'SPTJM' && !sptjmReady)"
        @click="handleGenerate"
      >
        <span v-if="generating" class="spinner-sm"></span>
        <span>
          {{ generating ? 'Membuat Dokumen...' : (activeMetadata?.status === 'INVALID' ? 'Generate Versi Baru' : (generationError ? 'Coba Lagi' : generateBtnLabel)) }}
        </span>
      </button>

      <!-- 2. VALID / AVAILABLE: Regenerate & Download buttons -->
      <div v-else class="flex gap-2 w-full">
        <button 
          class="btn btn-secondary btn-sm flex-1"
          :disabled="generating || !canGenerate"
          @click="handleGenerate"
          title="Buat ulang dokumen terbaru"
        >
          <span v-if="generating" class="spinner-sm"></span>
          <span>{{ generating ? 'Memproses...' : 'Generate Ulang' }}</span>
        </button>

        <button 
          class="btn btn-primary btn-sm flex-1"
          :disabled="generating"
          @click="handleDownload"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Unduh PDF</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ljpService from '@/services/ljp.service'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  docType: {
    type: String,
    required: true // 'JOURNAL' | 'TEACHER_ATTENDANCE' | 'STUDENT_ATTENDANCE' | 'SPTJM'
  },
  reportId: {
    type: String,
    required: true
  },
  existingDoc: {
    type: Object,
    default: null
  },
  classDocsMap: {
    type: Object,
    default: () => ({})
  },
  canGenerate: {
    type: Boolean,
    default: true
  },
  availableClasses: {
    type: Array,
    default: () => []
  },
  sptjmReady: {
    type: Boolean,
    default: true
  },
  missingFields: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['generate-success'])

const toast = useToast()
const generating = ref(false)
const generationError = ref(null)

const selectedClassId = ref(props.availableClasses[0]?.id || '1')
const localDocsMap = ref({ ...props.classDocsMap })
const localDoc = ref(props.existingDoc)

watch(() => props.existingDoc, (newVal) => {
  localDoc.value = newVal
})

watch(() => props.classDocsMap, (newVal) => {
  localDocsMap.value = { ...newVal }
}, { deep: true })

watch(() => props.availableClasses, (newVal) => {
  if (newVal && newVal.length > 0 && !selectedClassId.value) {
    selectedClassId.value = newVal[0].id
  }
}, { immediate: true })

// The active metadata to display
const activeMetadata = computed(() => {
  if (props.docType === 'STUDENT_ATTENDANCE') {
    if (localDocsMap.value[selectedClassId.value]) {
      return localDocsMap.value[selectedClassId.value]
    }
    if (localDoc.value && localDoc.value.classId === selectedClassId.value) {
      return localDoc.value
    }
    return null
  }
  return localDoc.value
})

const currentClassDoc = computed(() => {
  return localDocsMap.value[selectedClassId.value] || null
})

// Status presentation
const statusTagLabel = computed(() => {
  if (generating.value) return 'MEMBUAT DOKUMEN...'
  if (generationError.value) return 'GAGAL'
  if (!activeMetadata.value) return 'BELUM DIBUAT'
  if (activeMetadata.value.status === 'VALID') return 'TERSEDIA / VALID'
  if (activeMetadata.value.status === 'INVALID') return 'TIDAK BERLAKU'
  return activeMetadata.value.status || 'BELUM DIBUAT'
})

const statusTagClass = computed(() => {
  if (generating.value) return 'tag-generating'
  if (generationError.value) return 'tag-failed'
  if (!activeMetadata.value) return 'tag-none'
  if (activeMetadata.value.status === 'VALID') return 'tag-valid'
  if (activeMetadata.value.status === 'INVALID') return 'tag-invalid'
  return 'tag-none'
})

const cardBorderClass = computed(() => {
  if (activeMetadata.value?.status === 'INVALID') return 'doc-card-invalid'
  if (generationError.value) return 'doc-card-failed'
  return ''
})

const iconBoxClass = computed(() => {
  if (activeMetadata.value?.status === 'INVALID') return 'icon-invalid'
  if (activeMetadata.value?.status === 'VALID') return 'icon-valid'
  return 'icon-default'
})

const generateBtnLabel = computed(() => {
  if (props.docType === 'STUDENT_ATTENDANCE') {
    const cls = props.availableClasses.find(c => c.id === selectedClassId.value)
    return cls ? `Buat Dokumen (${cls.name || 'Kelas ' + cls.id})` : 'Buat Dokumen Santri'
  }
  return 'Buat Dokumen'
})

async function handleGenerate() {
  if (generating.value) return
  generating.value = true
  generationError.value = null

  try {
    let res
    if (props.docType === 'JOURNAL') {
      res = await ljpService.generateJournal(props.reportId)
    } else if (props.docType === 'TEACHER_ATTENDANCE') {
      res = await ljpService.generateTeacherAttendance(props.reportId)
    } else if (props.docType === 'STUDENT_ATTENDANCE') {
      if (!selectedClassId.value) {
        toast.warning('Silakan pilih kelas santri terlebih dahulu.')
        generating.value = false
        return
      }
      res = await ljpService.generateStudentAttendance(props.reportId, selectedClassId.value)
    } else if (props.docType === 'SPTJM') {
      res = await ljpService.generateSptjm(props.reportId)
    }

    if (res?.data?.document) {
      const doc = res.data.document
      if (props.docType === 'STUDENT_ATTENDANCE') {
        localDocsMap.value[selectedClassId.value] = doc
      }
      localDoc.value = doc

      emit('generate-success', {
        docType: props.docType,
        document: doc,
        classId: selectedClassId.value
      })
      toast.success(res.data.message || 'Dokumen berhasil dibuat.')
    }
  } catch (err) {
    console.error('Failed to generate document:', err)
    generationError.value = err.response?.data?.error || err.message || 'Gagal membuat dokumen.'
    toast.error(generationError.value)
  } finally {
    generating.value = false
  }
}

function handleDownload() {
  const doc = activeMetadata.value
  if (!doc) {
    toast.info('Dokumen belum tersedia untuk diunduh.')
    return
  }

  // Contract rule: If signed URL is returned, open it directly.
  if (doc.downloadUrl) {
    window.open(doc.downloadUrl, '_blank', 'noopener,noreferrer')
    return
  }

  // Gracefully handle storage path without exposing public URL
  if (doc.storagePath) {
    toast.success(`Berkas ${props.title} (v${doc.documentVersion || 1}) tersimpan di arsip: ${doc.storagePath}`)
  } else {
    toast.info('Dokumen tersimpan di sistem LJP.')
  }
}

function formatDateTime(dateVal) {
  if (!dateVal) return '-'
  try {
    const d = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal)
    return d.toLocaleString('id-ID', {
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
</script>

<style scoped>
.doc-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.doc-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.doc-card-invalid {
  border-color: #fecaca;
  background: #fffafa;
}

.doc-card-failed {
  border-color: #fca5a5;
  background: #fffdfd;
}

.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.doc-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-default {
  background: #f1f5f9;
  color: #475569;
}

.icon-valid {
  background: #f0fdf4;
  color: #166534;
}

.icon-invalid {
  background: #fef2f2;
  color: #991b1b;
}

.doc-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.doc-desc {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 2px;
}

.doc-status-tag {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.tag-valid {
  background: #dcfce7;
  color: #15803d;
}

.tag-invalid {
  background: #fee2e2;
  color: #b91c1c;
}

.tag-generating {
  background: #eff6ff;
  color: #1d4ed8;
}

.tag-failed {
  background: #fef2f2;
  color: #dc2626;
}

.tag-none {
  background: #f1f5f9;
  color: #64748b;
}

.class-select-area {
  margin-top: 0.75rem;
  background: #f8fafc;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
}

.sptjm-warning-banner {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
}

.metadata-box {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.75rem;
  color: #475569;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.meta-row:last-child {
  margin-bottom: 0;
}

.invalidation-notice {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border-left: 3px solid #ef4444;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #991b1b;
  line-height: 1.4;
}

.failed-notice {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #be123c;
}

.doc-actions {
  margin-top: 1rem;
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
