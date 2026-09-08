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
        <div class="teacher-actions">
          <button class="btn btn-sm btn-secondary" @click="openEditModal(teacher)">Edit Info</button>
          <button class="btn btn-sm btn-danger" @click="confirmDelete(teacher)">Hapus</button>
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

const teachers = ref([])
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

.teacher-actions {
  display: flex;
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
