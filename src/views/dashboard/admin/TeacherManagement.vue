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
        <h3>Edit Info Pengajar</h3>
        
        <div class="form-group">
          <label class="form-label">Nama</label>
          <input v-model="form.displayName" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Jabatan</label>
          <input v-model="form.position" type="text" class="form-input" placeholder="Contoh: Kepala TPQ, Guru Iqro" />
        </div>
        <div class="form-group">
          <label class="form-label">URL Foto</label>
          <input v-model="form.photoURL" type="url" class="form-input" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label class="form-label">Bio</label>
          <textarea v-model="form.bio" class="form-input" rows="3" placeholder="Deskripsi singkat tentang guru"></textarea>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">Batal</button>
          <button class="btn btn-primary" @click="saveTeacher" :disabled="saving">
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
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
  if (!form.value.displayName) {
    warning('Nama wajib diisi')
    return
  }

  saving.value = true
  try {
    await api.patch(`/users/${selectedId.value}`, form.value)
    success('Data guru berhasil disimpan')
    await fetchTeachers()
    closeModal()
  } catch (error) {
    console.error('Failed to update teacher:', error)
    showError('Gagal menyimpan data')
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
  margin-bottom: var(--space-xs);
}

.position {
  color: var(--accent-dark);
  font-size: 0.875rem;
  font-weight: 500;
}

.bio {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-top: var(--space-sm);
}

.email {
  color: var(--gray-400);
  font-size: 0.75rem;
  margin-top: var(--space-xs);
}

.empty-state {
  padding: var(--space-3xl);
  text-align: center;
  color: var(--gray-500);
  grid-column: 1 / -1;
}

.teacher-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.btn-danger {
  background: var(--error);
  color: var(--white);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-lg);
}

.modal {
  width: 100%;
  max-width: 450px;
  padding: var(--space-xl);
  background: var(--white);
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-bottom: var(--space-lg);
  color: var(--primary-dark);
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-xl);
}

/* Skeleton Styles */
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-avatar-lg,
.skeleton-title,
.skeleton-text,
.skeleton-text-sm,
.skeleton-text-xs,
.skeleton-btn {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
  margin-inline: auto;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.skeleton-avatar-lg {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
}

.skeleton-title {
  height: 20px;
  width: 60%;
  margin-bottom: var(--space-xs);
}

.skeleton-text {
  height: 16px;
  width: 40%;
}

.skeleton-text-sm {
  height: 14px;
  width: 80%;
  margin-top: var(--space-sm);
}

.skeleton-text-xs {
  height: 12px;
  width: 50%;
  margin-top: var(--space-xs);
}

.skeleton-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
}

.skeleton-btn {
  width: 80px;
  height: 32px;
  border-radius: var(--radius-md);
}
</style>
