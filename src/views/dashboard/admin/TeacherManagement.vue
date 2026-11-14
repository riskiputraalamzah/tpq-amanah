<template>
  <div class="teacher-management">
    <header class="page-header">
      <div>
        <h1>Kelola Pengajar</h1>
        <p>Daftar guru yang terdaftar di sistem TPQ AMANAH</p>
      </div>
    </header>

    <div class="teachers-grid">
      <div v-if="loading" v-for="i in 4" :key="i" class="teacher-card glass-card skeleton-card">
        <div class="skeleton-avatar-lg"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text-sm"></div>
        <div class="skeleton-text-xs"></div>
        <div class="skeleton-actions">
          <div class="skeleton-btn"></div>
          <div class="skeleton-btn"></div>
        </div>
      </div>

      <div v-else-if="teachers.length === 0" class="empty-state glass-card">
        <p>Belum ada guru yang terdaftar. Guru akan muncul setelah user dengan role "guru" ditambahkan di menu Kelola Users.</p>
      </div>

      <div v-else v-for="teacher in teachers" :key="teacher.id" class="teacher-card glass-card">
        <div class="teacher-avatar">
          <img v-if="teacher.photoURL" :src="teacher.photoURL" :alt="teacher.displayName" />
          <div v-else class="avatar-placeholder">{{ getInitials(teacher.displayName) }}</div>
        </div>
        <h4>{{ teacher.displayName }}</h4>
        <p class="position">{{ teacher.position || 'Pengajar' }}</p>
        <p class="nik-badge" v-if="teacher.nik">NIK: {{ teacher.nik }}</p>
        <p class="nik-badge warning-badge" v-else>NIK: Belum diisi</p>
        <p v-if="teacher.bio" class="bio">{{ teacher.bio }}</p>
        <p class="email">{{ teacher.email || teacher.username || '-' }}</p>
        <div class="jilid-box">
          <div class="jilid-head">
            <span class="jilid-label">Jilid diampu</span>
            <button type="button" class="jilid-edit" :aria-label="`Atur jilid ${teacher.displayName}`" @click="openJilid(teacher)">Atur</button>
          </div>
          <div v-if="scopeOf(teacher).source === 'admin'" class="jilid-tags">
            <span v-for="id in scopeOf(teacher).classIds" :key="id" class="jilid-tag">{{ levelName(id) }}</span>
          </div>
          <p v-else-if="scopeOf(teacher).source === 'kbm'" class="jilid-hint">
            Belum ditetapkan · dari riwayat KBM: {{ scopeOf(teacher).classIds.map(levelName).join(', ') }}
          </p>
          <p v-else-if="scopesLoaded" class="jilid-hint is-warn">Belum ditetapkan dan belum ada riwayat KBM</p>
          <p v-if="scopeOf(teacher).unassignedTaught?.length" class="jilid-hint is-warn">
            Ada KBM di {{ scopeOf(teacher).unassignedTaught.map(levelName).join(', ') }} tapi belum ditetapkan
          </p>
        </div>
        <div class="teacher-actions">
          <button class="btn btn-sm btn-secondary" @click="openEditModal(teacher)">Edit Info</button>
          <button class="btn btn-sm btn-danger" @click="confirmDelete(teacher)">Hapus</button>
        </div>
      </div>
    </div>

    <!-- Jilid diampu -->
    <div v-if="jilidFor" class="modal-overlay" @click.self="jilidFor = null">
      <div class="modal jilid-modal glass-card animate-fadeInUp" role="dialog" aria-modal="true" aria-labelledby="jilid-title">
        <div class="modal-header">
          <h3 id="jilid-title">Jilid yang diampu</h3>
          <p class="modal-subtitle">{{ jilidFor.displayName }}. Guru hanya bisa membuka Data Wali Santri dari jilid ini.</p>
        </div>
        <div class="jilid-choices" role="group" aria-label="Pilih jilid">
          <button v-for="c in CLASS_OPTIONS" :key="c.value" type="button" class="jilid-choice"
            :aria-pressed="jilidPick.includes(c.value)" @click="toggleJilid(c.value)">{{ c.label }}</button>
        </div>
        <div v-if="scopeOf(jilidFor).suggested?.length" class="jilid-suggest">
          <span>Riwayat KBM 60 hari: {{ scopeOf(jilidFor).suggested.map((x) => `${levelName(x.classId)} (${x.count}x)`).join(', ') }}</span>
          <button type="button" class="btn btn-sm btn-secondary" @click="useSuggestion">Pakai usulan</button>
        </div>
        <p v-else class="jilid-hint">Belum ada riwayat KBM dalam 60 hari terakhir.</p>
        <p class="jilid-hint">Bila tidak ada yang dipilih, sistem memakai riwayat KBM guru ini.</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" :disabled="saving" @click="jilidFor = null">Batal</button>
          <button type="button" class="btn btn-primary" :disabled="saving" @click="saveJilid">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal glass-card animate-fadeInUp">
          <div class="modal-header">
            <h3>Edit Info Pengajar</h3>
            <p class="modal-subtitle">Kelengkapan data diperlukan untuk dokumen SPTJM & LPJ</p>
          </div>
          
          <form @submit.prevent="saveTeacher" class="modal-form">
            <div class="modal-grid">
              <div class="form-group">
                <label class="form-label">Nama Lengkap <span class="text-red-500">*</span></label>
                <input v-model="form.displayName" type="text" class="form-input" required />
              </div>
  
              <div class="form-group">
                <label class="form-label">NIK (16 Digit) <span class="text-red-500">*</span></label>
                <input v-model="form.nik" type="text" maxlength="16" class="form-input" placeholder="16 digit NIK" />
              </div>
  
              <div class="form-group">
                <label class="form-label">Tempat Lahir</label>
                <input v-model="form.birthPlace" type="text" class="form-input" placeholder="Kota/Kabupaten" />
              </div>
            <div class="form-group">
              <label class="form-label">Tanggal Lahir</label>
              <input v-model="form.birthDate" type="date" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Jabatan</label>
              <input v-model="form.position" type="text" class="form-input" placeholder="Contoh: Pengajar Iqro, Wali Kelas" />
            </div>

            <div class="form-group">
              <label class="form-label">URL Foto</label>
              <input v-model="form.photoURL" type="url" class="form-input" placeholder="https://..." />
            </div>
          </div>

          <div class="form-group full-width">
            <label class="form-label">Alamat Lengkap</label>
            <textarea v-model="form.address" class="form-input" rows="2" placeholder="Alamat tempat tinggal lengkap"></textarea>
          </div>

          <div class="form-group full-width">
            <label class="form-label">Bio / Keterangan</label>
            <textarea v-model="form.bio" class="form-input" rows="2" placeholder="Deskripsi singkat tentang guru"></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="saving">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast, useConfirm } from '@/composables/useToast'

const { success, error: showError, warning } = useToast()
const { confirm } = useConfirm()

const CLASS_OPTIONS = [...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Jilid ${n}` })), { value: '7', label: 'Marhalah' }]
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : `Jilid ${id}`)

const teachers = ref([])
const scopes = ref({})
const scopesLoaded = ref(false)
const jilidFor = ref(null)
const jilidPick = ref([])
const loading = ref(true)
const showModal = ref(false)
const saving = ref(false)
const selectedId = ref(null)

const form = ref({
  displayName: '',
  nik: '',
  birthPlace: '',
  birthDate: '',
  address: '',
  position: '',
  photoURL: '',
  bio: ''
})

const getInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const fetchTeachers = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/users?role=guru')
    teachers.value = data
  } catch (error) {
    console.error('Failed to fetch guru users:', error)
  } finally {
    loading.value = false
  }
}

// Jilid diampu: what the admin set, else the KBM history (the same rule the server applies)
const fetchScopes = async () => {
  try {
    const { data } = await api.get('/guru-classes', { cache: false })
    scopes.value = Object.fromEntries((data || []).map((g) => [g.guruId, g]))
  } catch (error) {
    console.error('Failed to fetch guru classes:', error)
  } finally {
    scopesLoaded.value = true
  }
}
const scopeOf = (teacher) => scopes.value[teacher.id] || { classIds: [], source: scopesLoaded.value ? 'none' : '', suggested: [], unassignedTaught: [] }
const openJilid = (teacher) => {
  jilidFor.value = teacher
  jilidPick.value = scopeOf(teacher).source === 'admin' ? [...scopeOf(teacher).classIds] : []
}
const toggleJilid = (id) => {
  jilidPick.value = jilidPick.value.includes(id) ? jilidPick.value.filter((x) => x !== id) : [...jilidPick.value, id]
}
const useSuggestion = () => {
  jilidPick.value = [...new Set(scopeOf(jilidFor.value).suggested.map((x) => x.classId))]
}
const saveJilid = async () => {
  saving.value = true
  try {
    await api.put(`/guru-classes/${jilidFor.value.id}`, { classIds: jilidPick.value })
    success(jilidPick.value.length ? 'Jilid pengajar disimpan' : 'Jilid dikosongkan, memakai riwayat KBM')
    jilidFor.value = null
    await fetchScopes()
  } catch (error) {
    showError(error.response?.data?.error || 'Gagal menyimpan jilid')
  } finally {
    saving.value = false
  }
}

const openEditModal = (teacher) => {
  selectedId.value = teacher.id
  form.value = { 
    displayName: teacher.displayName || '',
    nik: teacher.nik || '',
    birthPlace: teacher.birthPlace || '',
    birthDate: teacher.birthDate || '',
    address: teacher.address || '',
    position: teacher.position || '',
    photoURL: teacher.photoURL || '',
    bio: teacher.bio || ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedId.value = null
}

const saveTeacher = async () => {
  if (!form.value.displayName?.trim()) {
    warning('Nama wajib diisi')
    return
  }

  saving.value = true
  try {
    const payload = {
      displayName: form.value.displayName.trim(),
      nik: form.value.nik ? form.value.nik.trim() : null,
      birthPlace: form.value.birthPlace ? form.value.birthPlace.trim() : null,
      birthDate: form.value.birthDate || null,
      address: form.value.address ? form.value.address.trim() : null,
      position: form.value.position ? form.value.position.trim() : null,
      photoURL: form.value.photoURL ? form.value.photoURL.trim() : null,
      bio: form.value.bio ? form.value.bio.trim() : null
    }

    await api.patch('/users/' + selectedId.value, payload)
    success('Data guru berhasil disimpan')
    await fetchTeachers()
    closeModal()
  } catch (error) {
    console.error('Failed to update teacher:', error)
    showError(error.response?.data?.error || 'Gagal menyimpan data')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (teacher) => {
  const confirmed = await confirm(`Apakah Anda yakin ingin menghapus ${teacher.displayName}? Ini akan menghapus akun guru dari sistem.`, { type: 'danger', confirmText: 'Ya, Hapus' })
  if (!confirmed) return
  
  try {
    await api.delete(`/users/${teacher.id}`)
    teachers.value = teachers.value.filter(t => t.id !== teacher.id)
    success('Guru berhasil dihapus')
  } catch (error) {
    console.error('Failed to delete:', error)
    showError('Gagal menghapus')
  }
}

onMounted(() => {
  fetchTeachers()
  fetchScopes()
})
</script>

<style scoped>
.teacher-management {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .teacher-management {
    padding-top: 0;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-size: 1.75rem;
  color: var(--primary-dark);
}

.page-header p {
  color: var(--gray-600);
}

.teachers-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-lg);
}

@media (min-width: 640px) {
  .teachers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .teachers-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.teacher-card {
  padding: var(--space-xl);
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
}

.teacher-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-md);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.teacher-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--primary-gradient);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.teacher-card h4 {
  color: var(--primary-dark);
  margin-bottom: 2px;
}

.position {
  font-size: 0.85rem;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 6px;
}

.nik-badge {
  display: inline-block;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--gray-100);
  color: var(--gray-700);
  margin-bottom: 8px;
}

.warning-badge {
  background: rgba(255, 152, 0, 0.15);
  color: #e65100;
}

.bio {
  font-size: 0.8rem;
  color: var(--gray-600);
  margin-bottom: var(--space-sm);
}

.email {
  font-size: 0.75rem;
  color: var(--gray-400);
  margin-bottom: var(--space-md);
}

.jilid-box {
  margin: 0 0 var(--space-md);
  padding: 10px 12px;
  border-radius: 12px;
  background: #f4f8f5;
  text-align: left;
}

.jilid-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.jilid-edit {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1.5px solid rgba(10, 92, 64, 0.35);
  background: #fff;
  color: #0a5c40;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.jilid-edit:hover {
  background: #e3f1ea;
}

.jilid-edit:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.jilid-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gray-600);
}

.jilid-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.jilid-tag {
  padding: 3px 10px;
  border-radius: 999px;
  background: #e3f1ea;
  color: #0a5c40;
  font-size: 0.8rem;
  font-weight: 700;
}

.jilid-hint {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: var(--gray-600);
}

.jilid-hint.is-warn {
  color: #92400e;
}

.modal.jilid-modal {
  max-width: 520px;
}

.jilid-choices {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
  margin-bottom: var(--space-md);
}

.jilid-choice {
  min-height: 46px;
  border-radius: 12px;
  border: 1.5px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.jilid-choice[aria-pressed="true"] {
  border-color: #0a5c40;
  background: #e3f1ea;
  color: #0a5c40;
  box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.12);
}

.jilid-choice:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.jilid-suggest {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fffbeb;
  color: #5b3a06;
  font-size: 0.85rem;
}

.teacher-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: center;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-md);
}

.modal {
  width: 100%;
  max-width: 650px;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--space-2xl);
  background: white;
}

.modal-header {
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--gray-100);
}

.modal-header h3 {
  color: var(--primary-dark);
  margin-bottom: 2px;
}

.modal-subtitle {
  font-size: 0.8rem;
  color: var(--gray-500);
}

.modal-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
}

@media (min-width: 640px) {
  .modal-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.full-width {
  grid-column: 1 / -1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  padding-top: var(--space-md);
  border-top: 1px solid var(--gray-100);
}
</style>
