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
          <span class="ann-date">{{ formatDate(ann.createdAt) }}</span>
        </div>

        <!-- Preview Banner -->
        <div class="ann-preview" :class="'preview-' + ann.type">
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
          <div class="form-group">
            <label class="form-label">Tipe / Warna</label>
            <select v-model="form.type" class="form-input">
              <option value="info">ℹ️ Info (Biru)</option>
              <option value="success">✅ Sukses (Hijau)</option>
              <option value="warning">⚠️ Penting (Oranye)</option>
            </select>
          </div>
          <div class="form-group">
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

        <!-- Live Preview -->
        <div class="preview-label">Preview Banner:</div>
        <div class="ann-preview" :class="'preview-' + form.type" style="margin-top:0">
          <div class="preview-inner">
            <span class="preview-title">{{ form.title || 'Judul Pengumuman' }}</span>
            <span class="preview-msg">{{ form.message || 'Pesan pengumuman akan tampil di sini' }}</span>
            <span v-if="form.linkUrl" class="preview-cta">{{ form.linkLabel || 'Lihat Selengkapnya' }} →</span>
          </div>
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
const showForm = ref(false)
const editingId = ref(null)
const deletingId = ref(null)
const deletingTitle = ref('')

const typeLabel = { info: 'ℹ️ Info', success: '✅ Sukses', warning: '⚠️ Penting' }
const roleLabel = { all: '👥 Semua', guru: '🧑‍🏫 Guru', admin: '🔧 Admin' }

const defaultForm = () => ({ title: '', message: '', type: 'info', targetRole: 'all', linkUrl: '', linkLabel: '' })
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

const openEdit = (ann) => {
  editingId.value = ann.id
  form.value = { title: ann.title, message: ann.message, type: ann.type, targetRole: ann.targetRole, linkUrl: ann.linkUrl || '', linkLabel: ann.linkLabel || '' }
  showForm.value = true
}

const closeForm = () => { showForm.value = false }

const saveAnnouncement = async () => {
  if (!form.value.title.trim()) { showError('Judul wajib diisi'); return }
  if (!form.value.message.trim()) { showError('Pesan wajib diisi'); return }
  saving.value = true
  try {
    if (editingId.value) {
      await api.put(`/announcements/${editingId.value}`, form.value)
      success('Pengumuman berhasil diperbarui')
    } else {
      await api.post('/announcements', form.value)
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

onMounted(fetchAll)
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
.ann-role-badge {
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
  max-width: 580px;
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

.preview-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  margin-bottom: var(--space-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
