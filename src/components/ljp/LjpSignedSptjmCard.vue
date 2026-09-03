<template>
  <div class="signed-sptjm-card">
    <div class="card-header">
      <div class="flex items-center gap-2">
        <div class="header-icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <path d="M12 18v-6"/>
            <path d="M9 15l3-3 3 3"/>
          </svg>
        </div>
        <div>
          <h4 class="card-title">Berkas Fisik: Signed SPTJM</h4>
          <p class="card-desc">Unggahan pindaian/foto dokumen SPTJM bermaterai dan bertandatangan basah.</p>
        </div>
      </div>

      <!-- Current Status Tag -->
      <span 
        class="status-tag"
        :class="latestValidDoc ? 'tag-valid' : (latestDoc ? 'tag-invalid' : 'tag-none')"
      >
        {{ latestValidDoc ? `V${latestValidDoc.signedVersion || 1} — VALID` : (latestDoc ? 'TIDAK BERLAKU' : 'BELUM DIUNGGAH') }}
      </span>
    </div>

    <!-- Active Valid File Notice if available -->
    <div v-if="latestValidDoc" class="active-file-box">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-green-600 font-bold">✓</span>
          <div>
            <div class="text-xs font-bold text-gray-900">
              Signed SPTJM Versi {{ latestValidDoc.signedVersion || 1 }} Aktif
            </div>
            <div class="text-[11px] text-gray-500">
              Diunggah pada: {{ formatDateTime(latestValidDoc.generatedAt || latestValidDoc.createdAt) }}
            </div>
          </div>
        </div>
        <button 
          v-if="latestValidDoc.downloadUrl"
          class="btn btn-secondary btn-sm text-xs py-1"
          @click="openUrl(latestValidDoc.downloadUrl)"
        >
          Lihat Berkas
        </button>
      </div>
    </div>

    <!-- Reopen / Invalid Notice -->
    <div v-else-if="latestDoc && latestDoc.status === 'INVALID'" class="invalid-notice">
      ⚠️ Versi Signed SPTJM sebelumnya (V{{ latestDoc.signedVersion || 1 }}) sudah <strong>TIDAK BERLAKU</strong> karena laporan telah dibuka kembali (reopened). Silakan unggah berkas signed SPTJM revisi terbaru.
    </div>

    <!-- Upload Dropzone (if canUpload) -->
    <div v-if="canUpload" class="upload-section">
      <div 
        class="dropzone"
        :class="{ 'dropzone-active': isDragging, 'dropzone-disabled': uploading }"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
        @click="triggerFileInput"
      >
        <input 
          ref="fileInputRef" 
          type="file" 
          class="hidden" 
          accept=".pdf,image/jpeg,image/png,image/jpg"
          :disabled="uploading"
          @change="onFileSelected"
        />

        <div class="text-center py-3">
          <div class="drop-icon">📤</div>
          <p class="drop-text">
            <strong>Klik untuk memilih berkas</strong> atau seret ke sini
          </p>
          <p class="drop-hint">Format yang didukung: PDF, JPG, PNG (Maksimal 5 MB)</p>
        </div>
      </div>

      <!-- Selected File Preview -->
      <div v-if="selectedFile" class="selected-file-preview">
        <div class="flex items-center gap-2 overflow-hidden">
          <span class="file-icon">📄</span>
          <div class="overflow-hidden text-ellipsis whitespace-nowrap">
            <div class="text-xs font-bold text-gray-800 truncate">{{ selectedFile.name }}</div>
            <div class="text-[11px] text-gray-500">{{ formatFileSize(selectedFile.size) }}</div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            type="button" 
            class="text-xs text-red-600 hover:text-red-800"
            :disabled="uploading"
            @click="clearSelectedFile"
          >
            Batal
          </button>
          <button 
            type="button" 
            class="btn btn-primary btn-sm text-xs py-1.5"
            :disabled="uploading"
            @click="handleUpload"
          >
            <span v-if="uploading" class="spinner-sm"></span>
            <span>{{ uploading ? 'Mengunggah...' : 'Unggah Signed SPTJM' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="read-only-notice">
      Unggah berkas Signed SPTJM hanya dapat dilakukan oleh guru pengampu saat laporan aktif.
    </div>

    <!-- Version History Section -->
    <div v-if="history.length > 0" class="history-section">
      <h5 class="history-title">Riwayat Versi Signed SPTJM:</h5>
      <div class="history-list">
        <div 
          v-for="item in history" 
          :key="item.documentId || item.id || item.storagePath"
          class="history-item"
        >
          <div class="flex items-center gap-2">
            <span class="version-badge">V{{ item.signedVersion || 1 }}</span>
            <span 
              class="history-status"
              :class="item.status === 'VALID' ? 'status-valid' : 'status-invalid'"
            >
              {{ item.status === 'VALID' ? 'VALID' : 'INVALID' }}
            </span>
            <span class="text-xs text-gray-500">
              {{ formatDateTime(item.generatedAt || item.createdAt) }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <span v-if="item.invalidatedReason" class="text-[11px] text-red-600 italic">
              ({{ item.invalidatedReason }})
            </span>
            <button 
              v-if="item.downloadUrl" 
              class="text-xs text-primary-600 hover:underline font-semibold"
              @click="openUrl(item.downloadUrl)"
            >
              Unduh
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ljpService from '@/services/ljp.service'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  reportId: {
    type: String,
    required: true
  },
  canUpload: {
    type: Boolean,
    default: true
  },
  signedDocs: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['upload-success'])

const toast = useToast()
const fileInputRef = ref(null)
const isDragging = ref(false)
const selectedFile = ref(null)
const uploading = ref(false)

// History of signed documents
const history = computed(() => {
  return [...props.signedDocs].sort((a, b) => {
    return (b.signedVersion || 0) - (a.signedVersion || 0)
  })
})

const latestValidDoc = computed(() => {
  return props.signedDocs.find(d => d.status === 'VALID') || null
})

const latestDoc = computed(() => {
  return history.value[0] || null
})

function triggerFileInput() {
  if (uploading.value) return
  fileInputRef.value?.click()
}

function onDragOver() {
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e) {
  isDragging.value = false
  if (uploading.value) return
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    validateAndSetFile(files[0])
  }
}

function onFileSelected(e) {
  const files = e.target.files
  if (files && files.length > 0) {
    validateAndSetFile(files[0])
  }
}

function validateAndSetFile(file) {
  // Validate format
  const validExtensions = ['pdf', 'jpg', 'jpeg', 'png']
  const ext = file.name.split('.').pop()?.toLowerCase()
  const validMimes = ['application/pdf', 'image/jpeg', 'image/png']

  if (!validExtensions.includes(ext) && !validMimes.includes(file.type)) {
    toast.error('Format berkas tidak didukung. Harap unggah berkas bertipe PDF, JPG, atau PNG.')
    return
  }

  // Validate size: 5MB maximum
  const maxBytes = 5 * 1024 * 1024
  if (file.size > maxBytes) {
    toast.error('Ukuran berkas melebihi batas maksimal 5 MB.')
    return
  }

  selectedFile.value = file
}

function clearSelectedFile() {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

async function handleUpload() {
  if (!selectedFile.value || uploading.value) return

  uploading.value = true
  try {
    const res = await ljpService.uploadSignedSptjm(props.reportId, selectedFile.value)
    toast.success(res.data?.message || 'Signed SPTJM berhasil diunggah.')
    clearSelectedFile()
    emit('upload-success', res.data?.document)
  } catch (err) {
    console.error('Upload signed SPTJM failed:', err)
    const msg = err.response?.data?.error || 'Gagal mengunggah berkas Signed SPTJM.'
    toast.error(msg)
  } finally {
    uploading.value = false
  }
}

function openUrl(url) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
.signed-sptjm-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-top: 1.25rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.header-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #eff6ff;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.card-desc {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 2px;
}

.status-tag {
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

.tag-none {
  background: #f1f5f9;
  color: #64748b;
}

.active-file-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}

.invalid-notice {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  font-size: 0.75rem;
  line-height: 1.4;
  margin-bottom: 0.75rem;
}

.read-only-notice {
  font-size: 0.75rem;
  color: #64748b;
  background: #f8fafc;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.upload-section {
  margin-top: 0.75rem;
}

.dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropzone:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.dropzone-active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.dropzone-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.drop-icon {
  font-size: 1.75rem;
  margin-bottom: 4px;
}

.drop-text {
  font-size: 0.8rem;
  color: #334155;
  margin: 0;
}

.drop-hint {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 2px;
}

.selected-file-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 0.5rem;
}

.file-icon {
  font-size: 1.25rem;
}

/* History */
.history-section {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}

.history-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 0.5rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.75rem;
}

.version-badge {
  font-weight: 700;
  font-size: 0.7rem;
  background: #e2e8f0;
  padding: 1px 5px;
  border-radius: 4px;
}

.history-status {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.status-valid {
  background: #dcfce7;
  color: #166534;
}

.status-invalid {
  background: #fee2e2;
  color: #991b1b;
}

.spinner-sm {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 4px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

