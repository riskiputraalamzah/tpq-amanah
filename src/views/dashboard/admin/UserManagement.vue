<template>
  <div class="user-management">
    <header class="page-header">
      <div>
        <h1>Kelola Users</h1>
        <p>Manajemen pengguna (Admin, Guru, Santri)</p>
      </div>
    </header>

    <!-- Filters -->
    <div class="filters glass-card">
      <div class="filter-group">
        <label>Filter Role:</label>
        <select v-model="filterRole" class="form-input form-select">
          <option value="">Semua</option>
          <option value="admin">Admin</option>
          <option value="guru">Guru</option>
          <option value="santri">Santri</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Cari:</label>
        <input 
          v-model="searchQuery" 
          type="text" 
          class="form-input" 
          placeholder="Cari nama atau email..."
        />
      </div>
    </div>

    <!-- Users List - Responsive Cards -->
    <div class="users-list glass-card">
      <div v-if="loading" class="loading-state">
        <SkeletonLoader v-for="i in 5" :key="i" type="text" height="70px" />
      </div>

      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        Tidak ada user ditemukan
      </div>

      <div v-else class="user-cards">
        <div v-for="user in filteredUsers" :key="user.id" class="user-card">
          <div class="user-main">
            <img v-if="user.photoURL" :src="user.photoURL" :alt="user.displayName" class="user-avatar" />
            <div v-else class="user-avatar-placeholder">{{ getInitials(user.displayName) }}</div>
            <div class="user-info">
              <h4>{{ user.displayName }}</h4>
              <p class="user-email">{{ user.email || '-' }}</p>
            </div>
            <span class="role-badge" :class="user.role">{{ getRoleLabel(user.role) }}</span>
          </div>
          <div class="user-actions">
            <button 
              class="btn btn-sm btn-secondary"
              @click="openRoleModal(user)"
              :disabled="user.id === currentUser?.uid"
            >Ubah Role</button>
            <button 
              class="btn btn-sm btn-danger"
              @click="confirmDelete(user)"
              :disabled="user.id === currentUser?.uid"
            >Hapus</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Role Modal -->
    <div v-if="showRoleModal" class="modal-overlay" @click.self="closeRoleModal">
      <div class="modal glass-card animate-fadeInUp">
        <h3>Ubah Role</h3>
        <p>Mengubah role untuk: <strong>{{ selectedUser?.displayName }}</strong></p>
        
        <div class="form-group">
          <label class="form-label">Role Baru:</label>
          <select v-model="newRole" class="form-input form-select">
            <option value="admin">Admin</option>
            <option value="guru">Guru</option>
            <option value="santri">Santri</option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeRoleModal">Batal</button>
          <button class="btn btn-primary" @click="updateRole" :disabled="updating">
            {{ updating ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal glass-card animate-fadeInUp">
        <h3>🗑️ Konfirmasi Hapus</h3>
        <p>Apakah Anda yakin ingin menghapus user <strong>{{ selectedUser?.displayName }}</strong>?</p>
        <p class="warning-text">Tindakan ini tidak dapat dibatalkan!</p>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeDeleteModal">Batal</button>
          <button class="btn btn-danger" @click="deleteUser" :disabled="deleting">
            {{ deleting ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.firebaseUser)

const users = ref([])
const loading = ref(true)
const filterRole = ref('')
const searchQuery = ref('')

const showRoleModal = ref(false)
const showDeleteModal = ref(false)
const selectedUser = ref(null)
const newRole = ref('')
const updating = ref(false)
const deleting = ref(false)

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchRole = !filterRole.value || user.role === filterRole.value
    const matchSearch = !searchQuery.value || 
      user.displayName?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchRole && matchSearch
  })
})

const getInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getRoleLabel = (role) => {
  const labels = { admin: 'Admin', guru: 'Guru', santri: 'Santri' }
  return labels[role] || role
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/users')
    users.value = data
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

const openRoleModal = (user) => {
  selectedUser.value = user
  newRole.value = user.role
  showRoleModal.value = true
}

const closeRoleModal = () => {
  showRoleModal.value = false
  selectedUser.value = null
}

const updateRole = async () => {
  updating.value = true
  try {
    await api.patch(`/users/${selectedUser.value.id}/role`, { role: newRole.value })
    const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id)
    if (userIndex > -1) {
      users.value[userIndex].role = newRole.value
    }
    closeRoleModal()
  } catch (error) {
    console.error('Failed to update role:', error)
    alert('Gagal mengubah role')
  } finally {
    updating.value = false
  }
}

const confirmDelete = (user) => {
  selectedUser.value = user
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedUser.value = null
}

const deleteUser = async () => {
  deleting.value = true
  try {
    await api.delete(`/users/${selectedUser.value.id}`)
    users.value = users.value.filter(u => u.id !== selectedUser.value.id)
    closeDeleteModal()
  } catch (error) {
    console.error('Failed to delete user:', error)
    alert('Gagal menghapus user')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .user-management {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-size: 1.75rem;
  color: var(--primary-dark);
  margin-bottom: var(--space-xs);
}

.page-header p {
  color: var(--gray-600);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
  background: rgba(255, 255, 255, 0.9);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-width: 200px;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-700);
}

/* Users List Cards */
.users-list {
  padding: var(--space-lg);
  background: rgba(255, 255, 255, 0.9);
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.user-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.user-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
}

@media (min-width: 768px) {
  .user-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.user-main {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
  min-width: 0;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
}

.user-avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: var(--primary-gradient);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info h4 {
  color: var(--primary-dark);
  margin: 0 0 2px 0;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
}

.role-badge.admin { background: rgba(103, 58, 183, 0.15); color: #673ab7; }
.role-badge.guru { background: rgba(76, 175, 80, 0.15); color: #388e3c; }
.role-badge.santri { background: rgba(33, 150, 243, 0.15); color: #1976d2; }

.user-actions {
  display: flex;
  gap: var(--space-sm);
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .user-actions {
    width: 100%;
  }
  .user-actions .btn {
    flex: 1;
  }
}

.btn-danger { background: var(--error); color: var(--white); }
.btn-danger:hover { background: #d32f2f; }

.empty-state {
  text-align: center;
  color: var(--gray-500);
  padding: var(--space-2xl);
}

/* Modal */
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
  max-width: 400px;
  padding: var(--space-xl);
  background: var(--white);
}

.modal h3 {
  margin-bottom: var(--space-md);
  color: var(--primary-dark);
}

.modal p {
  color: var(--gray-600);
  margin-bottom: var(--space-lg);
}

.warning-text {
  color: var(--error);
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-xl);
}
</style>
