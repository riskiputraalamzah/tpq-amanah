<template>
  <div class="ann-management">
    <header class="page-header">
      <div class="header-content">
        <div>
          <h1>Kelola Pengumuman</h1>
          <p>Buat dan kelola notifikasi yang tampil di dashboard pengguna</p>
        </div>
        <button class="btn-create" @click="openCreate">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Buat Pengumuman
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state glass-card">
      <div class="spinner"></div>
      <span>Memuat pengumuman...</span>
    </div>

    <!-- Empty -->
    <div v-else-if="announcements.length === 0" class="empty-state glass-card">
      <div class="empty-icon">📢</div>
      <h3>Belum Ada Pengumuman</h3>
      <p>Buat pengumuman pertama untuk memberitahu pengguna tentang fitur atau info penting.</p>
      <button class="btn-create m-auto" @click="openCreate">Buat Sekarang</button>
    </div>

    <!-- List -->
    <div v-else class="ann-list">
      <div v-for="ann in announcements" :key="ann.id" class="ann-card glass-card" :class="{ inactive: !ann.isActive }">
        <div class="ann-card-top">
          <div class="ann-left">
            <span class="ann-type-badge" :class="'badge-' + ann.type">
              {{ typeLabel[ann.type] || ann.type }}
            </span>
            <span class="ann-role-badge">{{ roleLabel[ann.targetRole] || ann.targetRole }}</span>
            <span class="ann-channel-badge">{{ channelLabel[ann.deliveryChannel || 'web'] }}</span>
            <span v-if="ann.whatsapp?.enabled" class="ann-wa-badge" :class="'wa-' + getWhatsappTone(ann.whatsapp.status)">
              WA {{ whatsappStatusLabel[ann.whatsapp.status] || 'Dijadwalkan' }}
            </span>
          </div>
          <div class="ann-actions">
            <!-- Toggle Active -->
            <button class="toggle-btn" :class="{ active: ann.isActive }" @click="toggleActive(ann)"
              :title="ann.isActive ? 'Nonaktifkan' : 'Aktifkan'">
              <span class="toggle-dot"></span>
              <span>{{ ann.isActive ? 'Aktif' : 'Nonaktif' }}</span>
            </button>
            <!-- Reset Dismissal -->
            <button class="icon-btn reset" @click="resetDismissals(ann)" title="Tampilkan ulang ke semua pengguna">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
              </svg>
            </button>
            <!-- Edit -->
            <button class="icon-btn edit" @click="openEdit(ann)" title="Edit">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <!-- Delete -->
            <button class="icon-btn delete" @click="confirmDelete(ann)" title="Hapus">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>
        </div>

        <h3 class="ann-title">{{ ann.title }}</h3>
        <p class="ann-message">{{ ann.message }}</p>

        <div class="ann-meta">
          <span v-if="ann.linkUrl" class="ann-link">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {{ ann.linkUrl }}
          </span>
          <span class="ann-dismiss">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {{ ann.dismissCount }} pengguna menutup
          </span>
          <span v-if="ann.whatsapp?.enabled" class="ann-wa-meta">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            {{ formatWhatsappMeta(ann.whatsapp) }}
          </span>
          <span class="ann-date">{{ formatDate(ann.createdAt) }}</span>
        </div>

        <!-- Preview Banner -->
        <div v-if="ann.showOnWebsite !== false" class="ann-preview" :class="'preview-' + ann.type">
          <div class="preview-inner">
            <span class="preview-title">{{ ann.title }}</span>
            <span class="preview-msg">{{ ann.message }}</span>
            <span v-if="ann.linkUrl" class="preview-cta">{{ ann.linkLabel || 'Lihat Selengkapnya' }} →</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal glass-card">
        <div class="modal-header">
          <h3>{{ editingId ? 'Edit Pengumuman' : 'Buat Pengumuman Baru' }}</h3>
          <button class="close-btn" @click="closeForm">×</button>
        </div>

        <div class="ai-draft-panel">
          <input ref="aiFileInput" class="hidden-file-input" type="file" accept="application/pdf,image/jpeg,image/png,image/webp"
            @change="handleAiFileChange" />
          <div>
            <strong>Buat draft dari PDF/gambar</strong>
            <small>Upload undangan atau gambar info, AI akan mengisi judul dan pesan. Admin tetap bisa edit sebelum disimpan.</small>
          </div>
          <button class="btn-ai" :disabled="aiDrafting" @click="aiFileInput?.click()">
            {{ aiDrafting ? 'Menganalisis...' : 'Upload File' }}
          </button>
        </div>

        <div class="form-grid">
          <div class="form-group full">
            <label class="form-label">Judul *</label>
            <input v-model="form.title" type="text" class="form-input" placeholder="cth: 🎉 Fitur Tabungan Tersedia!"
              maxlength="100" />
          </div>
          <div class="form-group full">
            <label class="form-label">Pesan *</label>
            <textarea v-model="form.message" class="form-input" rows="3"
              placeholder="Deskripsi singkat tentang pengumuman ini..."></textarea>
          </div>
          <div class="form-group full">
            <label class="form-label">Mode Pengiriman</label>
            <div class="channel-segment">
              <button v-for="option in channelOptions" :key="option.value" type="button"
                :class="{ active: form.deliveryChannel === option.value }" @click="setDeliveryChannel(option.value)">
                <strong>{{ option.label }}</strong>
                <small>{{ option.description }}</small>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Tipe / Warna</label>
            <select v-model="form.type" class="form-input">
              <option value="info">ℹ️ Info (Biru)</option>
              <option value="success">✅ Sukses (Hijau)</option>
              <option value="warning">⚠️ Penting (Oranye)</option>
            </select>
          </div>
          <div v-if="form.deliveryChannel !== 'wa'" class="form-group">
            <label class="form-label">Target Pengguna</label>
            <select v-model="form.targetRole" class="form-input">
              <option value="all">Semua Pengguna</option>
              <option value="guru">Guru Saja</option>
              <option value="admin">Admin Saja</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Link Tujuan (Opsional)</label>
            <input v-model="form.linkUrl" type="text" class="form-input" placeholder="cth: /dashboard/savings" />
          </div>
          <div class="form-group">
            <label class="form-label">Label Tombol CTA (Opsional)</label>
            <input v-model="form.linkLabel" type="text" class="form-input" placeholder="cth: Coba Sekarang" />
          </div>
        </div>

        <div v-if="channelUsesWhatsapp(form.deliveryChannel)" class="wa-delivery-panel">
          <div class="wa-options">
            <div class="wa-options-head">
              <span>Jadwal Pengiriman WhatsApp</span>
              <small>Pilih tanggal dan jam. Bisa lebih dari satu jadwal.</small>
            </div>

            <div class="wa-schedule-list">
              <div v-for="(schedule, index) in form.whatsappSchedules" :key="index" class="wa-schedule-row">
                <input v-model="schedule.date" type="date" class="form-input" />
                <input v-model="schedule.time" type="time" class="form-input" />
                <button type="button" class="icon-btn delete" :disabled="form.whatsappSchedules.length === 1"
                  @click="removeWhatsappSchedule(index)" title="Hapus jadwal">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            </div>

            <button type="button" class="btn-add-schedule" @click="addWhatsappSchedule">+ Tambah Jadwal</button>

            <p class="wa-hint">
              Bot akan mengirim ke nomor guru unik di kontak WA. Jika satu nomor ada di beberapa kontak, tetap dikirim sekali untuk pengumuman yang sama.
            </p>
          </div>
        </div>

        <!-- Live Preview -->
        <div v-if="form.deliveryChannel !== 'wa'" class="preview-label">Preview Banner:</div>
        <div v-if="form.deliveryChannel !== 'wa'" class="ann-preview" :class="'preview-' + form.type" style="margin-top:0">
          <div class="preview-inner">
            <span class="preview-title">{{ form.title || 'Judul Pengumuman' }}</span>
            <span class="preview-msg">{{ form.message || 'Pesan pengumuman akan tampil di sini' }}</span>
            <span v-if="form.linkUrl" class="preview-cta">{{ form.linkLabel || 'Lihat Selengkapnya' }} →</span>
          </div>
        </div>

        <div v-if="channelUsesWhatsapp(form.deliveryChannel)" class="preview-label wa-preview-label">Preview WhatsApp:</div>
        <div v-if="channelUsesWhatsapp(form.deliveryChannel)" class="wa-message-preview">
          <strong>📢 {{ form.title || 'Judul Pengumuman' }}</strong>
          <span>{{ form.message || 'Pesan pengumuman akan tampil di sini' }}</span>
          <small v-if="form.linkUrl">{{ form.linkLabel || 'Buka pengumuman' }}: {{ form.linkUrl }}</small>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeForm">Batal</button>
          <button class="btn-save" @click="saveAnnouncement" :disabled="saving">
            {{ saving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Buat Pengumuman') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deletingId" class="modal-overlay" @click.self="deletingId = null">
      <div class="modal glass-card confirm-modal">
        <div class="confirm-icon">🗑️</div>
        <h3>Hapus Pengumuman?</h3>
        <p>Pengumuman "<strong>{{ deletingTitle }}</strong>" akan dihapus permanen.</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="deletingId = null">Batal</button>
          <button class="btn-delete" @click="deleteAnn" :disabled="saving">{{ saving ? 'Menghapus...' : 'Ya, Hapus'
            }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { success, error: showError } = useToast()

const announcements = ref([])
const loading = ref(true)
const saving = ref(false)
const aiDrafting = ref(false)
const showForm = ref(false)
const editingId = ref(null)
const deletingId = ref(null)
const deletingTitle = ref('')
const aiFileInput = ref(null)

const typeLabel = { info: 'ℹ️ Info', success: '✅ Sukses', warning: '⚠️ Penting' }
const roleLabel = { all: '👥 Semua', guru: '🧑‍🏫 Guru', admin: '🔧 Admin' }
const channelLabel = { web: 'Web', web_wa: 'Web + WA', wa: 'WA Saja' }
const channelOptions = [
  { value: 'web', label: 'Website saja', description: 'Tampil sebagai popup/banner dashboard.' },
  { value: 'web_wa', label: 'Website + WA Guru', description: 'Tampil di dashboard dan terkirim ke WA guru.' },
  { value: 'wa', label: 'WA Guru saja', description: 'Tidak tampil di website, hanya dikirim ke WA guru.' }
]
const whatsappStatusLabel = {
  disabled: 'Nonaktif',
  scheduled: 'Dijadwalkan',
  queued: 'Antrean',
  sent: 'Terkirim',
  partial: 'Sebagian',
  failed: 'Gagal'
}

const getDateInputValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getNextTimeInputValue = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  const minutes = Math.ceil(date.getMinutes() / 15) * 15
  if (minutes >= 60) {
    date.setHours(date.getHours() + 1, 0, 0, 0)
  } else {
    date.setMinutes(minutes, 0, 0)
  }
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const defaultWhatsappSchedule = () => ({ date: getDateInputValue(), time: getNextTimeInputValue() })

const defaultForm = () => ({
  title: '',
  message: '',
  type: 'info',
  targetRole: 'all',
  linkUrl: '',
  linkLabel: '',
  deliveryChannel: 'web',
  whatsappSchedules: [defaultWhatsappSchedule()]
})
const form = ref(defaultForm())

const formatDate = (d) => {
  if (!d) return '-'
  const dt = d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
  return isNaN(dt) ? '-' : dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const fetchAll = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/announcements')
    announcements.value = data
  } catch (e) {
    showError('Gagal memuat pengumuman')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingId.value = null
  form.value = defaultForm()
  showForm.value = true
}

const channelUsesWhatsapp = (channel) => channel === 'web_wa' || channel === 'wa'

const normalizeWhatsappScheduleForForm = (schedule) => {
  if (typeof schedule === 'string') {
    return { date: getDateInputValue(), time: schedule }
  }

  return {
    date: schedule?.date || getDateInputValue(),
    time: schedule?.time || getNextTimeInputValue()
  }
}

const openEdit = (ann) => {
  editingId.value = ann.id
  const deliveryChannel = ann.deliveryChannel || (ann.whatsapp?.enabled ? 'web_wa' : 'web')
  const schedules = (ann.whatsapp?.schedules || []).map(normalizeWhatsappScheduleForForm)
  form.value = {
    title: ann.title,
    message: ann.message,
    type: ann.type,
    targetRole: ann.targetRole,
    linkUrl: ann.linkUrl || '',
    linkLabel: ann.linkLabel || '',
    deliveryChannel,
    whatsappSchedules: schedules.length ? schedules : [defaultWhatsappSchedule()]
  }
  showForm.value = true
}

const closeForm = () => { showForm.value = false }

const setDeliveryChannel = (channel) => {
  form.value.deliveryChannel = channel
  if (channel === 'wa') {
    form.value.targetRole = 'guru'
  }
}

const addWhatsappSchedule = () => {
  form.value.whatsappSchedules.push(defaultWhatsappSchedule())
}

const removeWhatsappSchedule = (index) => {
  if (form.value.whatsappSchedules.length === 1) return
  form.value.whatsappSchedules.splice(index, 1)
}

const getCleanWhatsappSchedules = () => form.value.whatsappSchedules
  .map(schedule => ({
    date: String(schedule.date || '').trim(),
    time: String(schedule.time || '').trim()
  }))
  .filter(schedule => schedule.date || schedule.time)

const getPayload = () => ({
  title: form.value.title,
  message: form.value.message,
  type: form.value.type,
  targetRole: form.value.deliveryChannel === 'wa' ? 'guru' : form.value.targetRole,
  linkUrl: form.value.linkUrl,
  linkLabel: form.value.linkLabel,
  deliveryChannel: form.value.deliveryChannel,
  whatsapp: {
    enabled: channelUsesWhatsapp(form.value.deliveryChannel),
    schedules: getCleanWhatsappSchedules()
  }
})

const getWhatsappTone = (status) => {
  if (status === 'sent') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'partial' || status === 'queued') return 'warning'
  return 'info'
}

const formatWhatsappMeta = (whatsapp = {}) => {
  const schedules = (whatsapp.schedules || [])
    .map(schedule => schedule?.label || (schedule?.date && schedule?.time ? `${schedule.date} ${schedule.time} WIB` : schedule))
    .join(', ')
  const sent = Number(whatsapp.sentCount || 0)
  const queued = Number(whatsapp.queuedCount || 0)
  const failed = Number(whatsapp.failedCount || 0)
  const status = whatsappStatusLabel[whatsapp.status] || 'Dijadwalkan'
  const counts = []

  if (sent) counts.push(`${sent} terkirim`)
  if (queued) counts.push(`${queued} antrean`)
  if (failed) counts.push(`${failed} gagal`)

  return `WA ${schedules || '-'} · ${status}${counts.length ? ` · ${counts.join(', ')}` : ''}`
}

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => {
    const result = String(reader.result || '')
    resolve(result.includes(',') ? result.split(',')[1] : result)
  }
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file)
})

const handleAiFileChange = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    showError('File harus berupa PDF, JPG, PNG, atau WEBP')
    return
  }

  if (file.size > 8 * 1024 * 1024) {
    showError('Ukuran file maksimal 8 MB')
    return
  }

  aiDrafting.value = true
  try {
    const dataBase64 = await fileToBase64(file)
    const { data } = await api.post('/announcements/ai-draft', {
      fileName: file.name,
      mimeType: file.type,
      dataBase64
    }, { timeout: 60000 })

    const draft = data.draft || {}
    form.value.title = draft.title || form.value.title
    form.value.message = draft.message || form.value.message
    form.value.type = draft.type || form.value.type
    form.value.targetRole = draft.targetRole || form.value.targetRole
    form.value.linkUrl = draft.linkUrl || form.value.linkUrl
    form.value.linkLabel = draft.linkLabel || form.value.linkLabel
    success('Draft pengumuman berhasil dibuat dari file')
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menganalisis file')
  } finally {
    aiDrafting.value = false
  }
}

const saveAnnouncement = async () => {
  if (!form.value.title.trim()) { showError('Judul wajib diisi'); return }
  if (!form.value.message.trim()) { showError('Pesan wajib diisi'); return }
  if (channelUsesWhatsapp(form.value.deliveryChannel)) {
    const schedules = getCleanWhatsappSchedules()
    if (schedules.length === 0) {
      showError('Pilih minimal satu jadwal WhatsApp')
      return
    }
    const incomplete = schedules.some(schedule => !schedule.date || !schedule.time)
    if (incomplete) {
      showError('Tanggal dan jam WhatsApp wajib diisi')
      return
    }
  }
  saving.value = true
  try {
    const payload = getPayload()
    if (editingId.value) {
      await api.put(`/announcements/${editingId.value}`, payload)
      success('Pengumuman berhasil diperbarui')
    } else {
      await api.post('/announcements', payload)
      success('Pengumuman berhasil dibuat')
    }
    closeForm()
    await fetchAll()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menyimpan pengumuman')
  } finally {
    saving.value = false
  }
}

const toggleActive = async (ann) => {
  try {
    await api.put(`/announcements/${ann.id}`, { isActive: !ann.isActive })
    ann.isActive = !ann.isActive
    success(ann.isActive ? 'Pengumuman diaktifkan' : 'Pengumuman dinonaktifkan')
  } catch (e) {
    showError('Gagal mengubah status pengumuman')
  }
}

const resetDismissals = async (ann) => {
  try {
    await api.post(`/announcements/${ann.id}/reset-dismissals`)
    ann.dismissCount = 0
    ann.isActive = true
    success('Pengumuman akan tampil ulang ke semua pengguna')
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal mereset dismissal')
  }
}

const confirmDelete = (ann) => { deletingId.value = ann.id; deletingTitle.value = ann.title }

const deleteAnn = async () => {
  saving.value = true
  try {
    await api.delete(`/announcements/${deletingId.value}`)
    success('Pengumuman berhasil dihapus')
    deletingId.value = null
    await fetchAll()
  } catch (e) {
    showError(e.response?.data?.error || 'Gagal menghapus pengumuman')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchAll()
})
</script>

<style scoped>
.ann-management {
  padding-top: 0;
}

.page-header {
  margin-bottom: var(--space-xl);
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.page-header h1 {
  font-size: 1.75rem;
  color: var(--primary-dark);
}

.page-header p {
  color: var(--gray-600);
  margin-top: 2px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-3xl);
  color: var(--gray-500);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: var(--space-3xl);
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: var(--space-lg);
}

.empty-state h3 {
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--gray-500);
  margin-bottom: var(--space-xl);
}

.ann-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.ann-card {
  padding: var(--space-xl);
  transition: all 0.2s;
}

.ann-card.inactive {
  opacity: 0.6;
}

.ann-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.ann-left {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.ann-type-badge,
.ann-role-badge,
.ann-channel-badge,
.ann-wa-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.badge-info {
  background: rgba(33, 150, 243, 0.12);
  color: #1565C0;
}

.badge-success {
  background: rgba(76, 175, 80, 0.12);
  color: var(--success);
}

.badge-warning {
  background: rgba(255, 152, 0, 0.12);
  color: #E65100;
}

.ann-role-badge {
  background: var(--gray-100);
  color: var(--gray-600);
}

.ann-channel-badge {
  background: rgba(18, 140, 126, 0.1);
  color: #0B6B60;
}

.ann-wa-badge.wa-info {
  background: rgba(33, 150, 243, 0.12);
  color: #1565C0;
}

.ann-wa-badge.wa-success {
  background: rgba(76, 175, 80, 0.14);
  color: var(--success);
}

.ann-wa-badge.wa-warning {
  background: rgba(255, 152, 0, 0.16);
  color: #E65100;
}

.ann-wa-badge.wa-danger {
  background: rgba(244, 67, 54, 0.12);
  color: var(--error);
}

.ann-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--gray-100);
  color: var(--gray-500);
  transition: all 0.2s;
}

.toggle-btn.active {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}

.toggle-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gray-400);
}

.toggle-btn.active .toggle-dot {
  background: var(--success);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn.reset {
  color: #1565C0;
  background: rgba(33, 150, 243, 0.1);
}

.icon-btn.reset:hover {
  background: rgba(33, 150, 243, 0.2);
}

.icon-btn.edit {
  color: var(--info);
  background: rgba(33, 150, 243, 0.1);
}

.icon-btn.edit:hover {
  background: rgba(33, 150, 243, 0.2);
}

.icon-btn.delete {
  color: var(--error);
  background: rgba(244, 67, 54, 0.1);
}

.icon-btn.delete:hover {
  background: rgba(244, 67, 54, 0.2);
}

.ann-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: var(--space-xs);
}

.ann-message {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: var(--space-md);
  line-height: 1.5;
}

.ann-meta {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
  margin-bottom: var(--space-lg);
}

.ann-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--gray-400);
}

.ann-link {
  color: #1565C0 !important;
}

.ann-wa-meta {
  color: #128C7E !important;
}

.ann-dismiss {}

.ann-date {
  margin-left: auto;
}

/* Preview Banner */
.ann-preview {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.preview-info {
  background: linear-gradient(90deg, #1565C0, #1976D2);
}

.preview-success {
  background: linear-gradient(90deg, #2E7D32, #388E3C);
}

.preview-warning {
  background: linear-gradient(90deg, #E65100, #F57C00);
}

.preview-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: white;
  flex-wrap: wrap;
}

.preview-title {
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.preview-msg {
  font-size: 0.75rem;
  opacity: 0.9;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-cta {
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.25);
  padding: 3px 10px;
  border-radius: 50px;
  white-space: nowrap;
}

/* Create button */
.btn-create {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: var(--primary-gradient);
  color: white;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(27, 94, 32, 0.3);
  white-space: nowrap;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(27, 94, 32, 0.4);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 680px;
  padding: var(--space-2xl);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.modal-header h3 {
  font-size: 1.15rem;
  color: var(--primary-dark);
}

.close-btn {
  font-size: 1.5rem;
  color: var(--gray-400);
  padding: 0 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

@media (max-width: 500px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--space-xs);
}

.form-input {
  padding: var(--space-md) var(--space-lg);
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  resize: vertical;
}

.form-input:focus {
  border-color: var(--primary);
}

.hidden-file-input {
  display: none;
}

.ai-draft-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(21, 101, 192, 0.18);
  background: rgba(33, 150, 243, 0.06);
}

.ai-draft-panel div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ai-draft-panel strong {
  color: var(--primary-dark);
  font-size: 0.9rem;
}

.ai-draft-panel small {
  color: var(--gray-500);
  font-size: 0.75rem;
  line-height: 1.5;
}

.btn-ai {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  color: #1565C0;
  background: rgba(33, 150, 243, 0.12);
  font-weight: 700;
  font-size: 0.8rem;
  white-space: nowrap;
}

.btn-ai:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.channel-segment {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-sm);
}

.channel-segment button {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-height: 76px;
  padding: 12px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  background: white;
  color: var(--gray-600);
  text-align: left;
  transition: all 0.2s;
}

.channel-segment button.active {
  border-color: #128C7E;
  background: rgba(18, 140, 126, 0.1);
  color: #0B6B60;
  box-shadow: 0 0 0 2px rgba(18, 140, 126, 0.1);
}

.channel-segment strong {
  font-size: 0.8rem;
}

.channel-segment small {
  font-size: 0.68rem;
  line-height: 1.35;
}

.preview-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  margin-bottom: var(--space-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.wa-delivery-panel {
  border: 1px solid rgba(18, 140, 126, 0.18);
  background: rgba(18, 140, 126, 0.06);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.wa-options-head small,
.wa-hint {
  color: var(--gray-500);
  font-size: 0.75rem;
  line-height: 1.5;
}

.wa-options {
  margin-top: 0;
  padding-top: 0;
}

.wa-options-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.wa-options-head span {
  color: var(--gray-700);
  font-size: 0.8rem;
  font-weight: 700;
}

.wa-schedule-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.wa-schedule-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px 36px;
  gap: var(--space-sm);
  align-items: center;
}

.wa-schedule-row .form-input {
  padding: 10px 12px;
}

.btn-add-schedule {
  margin-top: var(--space-sm);
  color: #128C7E;
  font-weight: 700;
  font-size: 0.8rem;
}

.wa-hint {
  margin-top: var(--space-sm);
}

.wa-preview-label {
  margin-top: var(--space-lg);
}

.wa-message-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: #F7FFFB;
  border: 1px solid rgba(18, 140, 126, 0.18);
  color: var(--gray-700);
  font-size: 0.82rem;
  line-height: 1.5;
}

.wa-message-preview strong {
  color: var(--primary-dark);
}

.wa-message-preview span {
  white-space: pre-wrap;
}

.wa-message-preview small {
  color: #128C7E;
  font-weight: 600;
}

@media (max-width: 640px) {
  .ai-draft-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .channel-segment {
    grid-template-columns: 1fr;
  }

  .wa-schedule-row {
    grid-template-columns: 1fr;
  }

  .wa-options-head {
    align-items: flex-start;
    flex-direction: column;
  }
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-xl);
}

.btn-cancel {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  color: var(--gray-600);
  background: var(--gray-100);
  font-weight: 600;
}

.btn-save {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  background: var(--primary-gradient);
  color: white;
  font-weight: 600;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-modal {
  text-align: center;
  max-width: 380px;
}

.confirm-icon {
  font-size: 2.5rem;
  margin-bottom: var(--space-md);
}

.confirm-modal h3 {
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}

.confirm-modal p {
  color: var(--gray-600);
  font-size: 0.875rem;
  line-height: 1.6;
}

.btn-delete {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #c62828, #f44336);
  color: white;
  font-weight: 600;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
