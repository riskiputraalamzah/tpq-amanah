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
        <input v-model="searchQuery" type="text" class="form-input" placeholder="Cari nama atau email..." />
      </div>
    </div>

    <!-- Users List - Responsive Cards -->
    <div class="users-list glass-card">
      <div v-if="loading" class="loading-state">
        <!-- Skeleton Loading State -->
        <div v-for="i in 5" :key="i" class="user-card skeleton-card">
          <div class="skeleton-main">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-info">
              <div class="skeleton-name"></div>
              <div class="skeleton-email"></div>
            </div>
            <div class="skeleton-badge"></div>
          </div>
          <div class="skeleton-actions">
            <div class="skeleton-btn"></div>
            <div class="skeleton-btn"></div>
          </div>
        </div>
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
              <p class="user-email">{{ user.username || '-' }}</p>
            </div>
            <span class="role-badge" :class="user.role">{{ getRoleLabel(user.role) }}</span>
          </div>
          <div class="user-actions action-dropdown-wrapper">
            <button class="btn btn-icon dropdown-trigger" @click.stop="toggleDropdown(user.id)"
              :class="{ active: activeDropdownId === user.id }">
              ⚙️ <span class="btn-text">Aksi</span>
            </button>

            <transition name="dropdown-fade">
              <div v-if="activeDropdownId === user.id" class="action-dropdown-menu glass-card">
                <button class="action-item" @click="openCredentialsModal(user)">
                  <span class="action-icon">🔑</span> Credentials
                </button>
                <button v-if="user.role === 'guru'" class="action-item" @click="openPermissionsModal(user)">
                  <span class="action-icon">⚙️</span> Permissions
                </button>
                <button class="action-item" @click="openRoleModal(user)" :disabled="user.id === currentUser?.uid">
                  <span class="action-icon">👤</span> Ubah Role
                </button>
                <button class="action-item text-danger" @click="confirmDelete(user)"
                  :disabled="user.id === currentUser?.uid">
                  <span class="action-icon">🗑️</span> Hapus
                </button>
              </div>
            </transition>
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

    <!-- Permissions Modal -->
    <div v-if="showPermissionsModal" class="modal-overlay" @click.self="closePermissionsModal">
      <div class="modal glass-card animate-fadeInUp permissions-modal">
        <h3>⚙️ Atur Permissions</h3>
        <p>Mengatur akses khusus untuk: <strong>{{ selectedUser?.displayName }}</strong></p>

        <div class="form-group">
          <label class="form-label">Nama Grup Menu:</label>
          <input v-model="permissionsForm.menuGroupName" type="text" class="form-input"
            placeholder="Contoh: Operator" />
          <span class="form-hint">Nama menu yang akan muncul di sidebar guru</span>
        </div>

        <div class="form-group">
          <label class="form-label">Fitur yang Bisa Diakses:</label>
          <div class="features-list">
            <label v-for="feature in availableFeatures" :key="feature.id" class="feature-checkbox">
              <input type="checkbox" :value="feature.id" v-model="permissionsForm.features" />
              <div class="feature-info">
                <span class="feature-label">{{ feature.label }}</span>
                <span class="feature-desc">{{ feature.description }}</span>
              </div>
            </label>
          </div>
        </div>

        <div class="current-permissions" v-if="selectedUser?.permissions?.features?.length">
          <label class="form-label">Permissions Saat Ini:</label>
          <div class="current-list">
            <span class="permission-tag" v-for="f in selectedUser.permissions.features" :key="f">{{ getFeatureLabel(f)
            }}</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closePermissionsModal">Batal</button>
          <button class="btn btn-primary" @click="savePermissions" :disabled="savingPermissions">
            {{ savingPermissions ? 'Menyimpan...' : 'Simpan Permissions' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Credentials Modal -->
    <div v-if="showCredentialsModal" class="modal-overlay" @click.self="closeCredentialsModal">
      <div class="modal glass-card animate-fadeInUp credentials-modal">
        <h3>🔑 Edit Credentials</h3>
        <p>Mengubah credentials untuk: <strong>{{ selectedUser?.displayName }}</strong></p>

        <div class="form-group">
          <label class="form-label">Display Name:</label>
          <input v-model="credentialsForm.displayName" type="text" class="form-input" placeholder="Nama lengkap" />
        </div>

        <div class="form-group">
          <label class="form-label">Username:</label>
          <input v-model="credentialsForm.username" type="text" class="form-input" placeholder="Username" />
        </div>

        <div class="form-group">
          <label class="form-label">Password Baru: <span class="optional">(kosongkan jika tidak diubah)</span></label>
          <input v-model="credentialsForm.password" type="password" class="form-input"
            placeholder="Minimal 6 karakter" />
        </div>

        <div class="form-group">
          <label class="form-label">Konfirmasi Password:</label>
          <input v-model="credentialsForm.confirmPassword" type="password" class="form-input"
            placeholder="Ulangi password baru" />
        </div>

        <p v-if="credentialsError" class="error-text">{{ credentialsError }}</p>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeCredentialsModal">Batal</button>
          <button class="btn btn-primary" @click="saveCredentials" :disabled="savingCredentials">
            {{ savingCredentials ? 'Menyimpan...' : 'Simpan Credentials' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast } from '@/composables/useToast'

const { success, error: showError } = useToast()
const authStore = useAuthStore()
const currentUser = computed(() => authStore.firebaseUser)

const users = ref([])
const loading = ref(true)
const filterRole = ref('')
const searchQuery = ref('')

const showRoleModal = ref(false)
const showDeleteModal = ref(false)
const showPermissionsModal = ref(false)
const selectedUser = ref(null)
const newRole = ref('')
const updating = ref(false)
const deleting = ref(false)
const savingPermissions = ref(false)

// Credentials modal state
const showCredentialsModal = ref(false)
const savingCredentials = ref(false)
const credentialsError = ref('')
const credentialsForm = ref({
  displayName: '',
  username: '',
  password: '',
  confirmPassword: ''
})

// Permissions form
const permissionsForm = ref({
  menuGroupName: '',
  features: []
})

// Available features for permissions
const availableFeatures = ref([
  { id: 'admin-attendance-view', label: 'Rekap Absensi', description: 'Lihat rekap absensi semua guru' },
  { id: 'export-pdf', label: 'Export PDF', description: 'Export laporan absensi ke PDF' }
])

// Dropdown state
const activeDropdownId = ref(null)

const toggleDropdown = (userId) => {
  if (activeDropdownId.value === userId) {
    activeDropdownId.value = null
  } else {
    activeDropdownId.value = userId
  }
}

const closeDropdown = () => {
  activeDropdownId.value = null
}

const closeDropdownOnClickOutside = (e) => {
  // Logic: if click target is NOT inside .action-dropdown-wrapper, close dropdown
  if (activeDropdownId.value && !e.target.closest('.action-dropdown-wrapper')) {
    activeDropdownId.value = null
  }
}

onMounted(() => {
  fetchUsers()
  window.addEventListener('click', closeDropdownOnClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdownOnClickOutside)
})

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchRole = !filterRole.value || user.role === filterRole.value
    const matchSearch = !searchQuery.value ||
      user.displayName?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.value.toLowerCase())
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
    showError('Gagal mengubah role')
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
    showError('Gagal menghapus user')
  } finally {
    deleting.value = false
  }
}

// Permissions functions
const openPermissionsModal = (user) => {
  selectedUser.value = user
  permissionsForm.value = {
    menuGroupName: user.permissions?.menuGroupName || '',
    features: user.permissions?.features || []
  }
  showPermissionsModal.value = true
}

const closePermissionsModal = () => {
  showPermissionsModal.value = false
  selectedUser.value = null
  permissionsForm.value = { menuGroupName: '', features: [] }
}

const savePermissions = async () => {
  savingPermissions.value = true
  try {
    await api.patch(`/users/${selectedUser.value.id}/permissions`, {
      menuGroupName: permissionsForm.value.menuGroupName,
      features: permissionsForm.value.features
    })
    // Update local user data
    const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id)
    if (userIndex > -1) {
      users.value[userIndex].permissions = {
        menuGroupName: permissionsForm.value.menuGroupName,
        features: [...permissionsForm.value.features]
      }
    }
    closePermissionsModal()
    success('Permissions berhasil disimpan!')
  } catch (error) {
    console.error('Failed to save permissions:', error)
    showError('Gagal menyimpan permissions')
  } finally {
    savingPermissions.value = false
  }
}

// Credentials functions
const openCredentialsModal = (user) => {
  selectedUser.value = user
  credentialsForm.value = {
    displayName: user.displayName || '',
    username: user.username || '',
    password: '',
    confirmPassword: ''
  }
  credentialsError.value = ''
  showCredentialsModal.value = true
}

const closeCredentialsModal = () => {
  showCredentialsModal.value = false
  selectedUser.value = null
  credentialsForm.value = { displayName: '', username: '', password: '', confirmPassword: '' }
  credentialsError.value = ''
}

const saveCredentials = async () => {
  credentialsError.value = ''

  // Validation
  if (!credentialsForm.value.displayName && !credentialsForm.value.username && !credentialsForm.value.password) {
    credentialsError.value = 'Minimal isi satu field untuk diubah'
    return
  }

  if (credentialsForm.value.password) {
    if (credentialsForm.value.password.length < 6) {
      credentialsError.value = 'Password minimal 6 karakter'
      return
    }
    if (credentialsForm.value.password !== credentialsForm.value.confirmPassword) {
      credentialsError.value = 'Password dan konfirmasi tidak cocok'
      return
    }
  }

  savingCredentials.value = true
  try {
    const payload = {}
    if (credentialsForm.value.displayName) payload.displayName = credentialsForm.value.displayName
    if (credentialsForm.value.username) payload.username = credentialsForm.value.username
    if (credentialsForm.value.password) payload.password = credentialsForm.value.password

    await api.patch(`/users/${selectedUser.value.id}/credentials`, payload)

    // Update local user data
    const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id)
    if (userIndex > -1) {
      if (payload.displayName) users.value[userIndex].displayName = payload.displayName
      if (payload.username) users.value[userIndex].username = payload.username
    }

    closeCredentialsModal()
    success('Credentials berhasil diperbarui!')
  } catch (error) {
    console.error('Failed to save credentials:', error)
    credentialsError.value = error.response?.data?.error || 'Gagal menyimpan credentials'
  } finally {
    savingCredentials.value = false
  }
}

const getFeatureLabel = (featureId) => {
  const feature = availableFeatures.value.find(f => f.id === featureId)
  return feature?.label || featureId
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
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid var(--gray-100);
  transition: box-shadow 0.2s;
}

.user-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
  border-color: var(--primary-200);
  border-color: var(--primary-200);
}

@media (min-width: 768px) {
  .user-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

@media (max-width: 767px) {
  .user-card {
    position: relative;
    padding: var(--space-xl) var(--space-md) var(--space-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .btn-text {
    display: none;
  }

  .user-main {
    flex-direction: column;
    width: 100%;
    justify-content: center;
    gap: 12px;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .role-badge {
    margin-top: 4px;
  }

  /* Floating gear icon in top-right */
  .action-dropdown-wrapper {
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    margin-left: 0 !important;
    z-index: 10 !important;
  }

  .dropdown-trigger {
    width: 38px;
    height: 38px;
    padding: 0;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--white);
    border-color: var(--gray-200);
    box-shadow: var(--shadow-sm);
  }

  .dropdown-trigger:hover {
    background: var(--gray-50);
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

.role-badge.admin {
  background: rgba(103, 58, 183, 0.15);
  color: #673ab7;
}

.role-badge.guru {
  background: rgba(76, 175, 80, 0.15);
  color: #388e3c;
}

.role-badge.santri {
  background: rgba(33, 150, 243, 0.15);
  color: #1976d2;
}

/* Action Dropdown Styles */
.action-dropdown-wrapper {
  position: relative;
  margin-left: auto;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  color: var(--gray-700);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
  font-weight: 500;
  font-size: 0.875rem;
}

.dropdown-trigger:hover,
.dropdown-trigger.active {
  background: var(--gray-50);
  border-color: var(--gray-300);
  box-shadow: var(--shadow-md);
}

.action-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 200px;
  background: var(--white);
  border: 1px solid var(--gray-100);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  padding: 4px;
  z-index: 999;
  overflow: hidden;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  border: none;
  background: transparent;
  color: var(--gray-700);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.action-item:hover {
  background: var(--gray-50);
  color: var(--primary);
}

.action-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-item.text-danger {
  color: var(--error);
}

.action-item.text-danger:hover {
  background: #fee2e2;
}

/* Animations */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

@media (max-width: 640px) {
  .dropdown-trigger {
    width: 100%;
  }
}

.btn-danger {
  background: var(--error);
  color: var(--white);
}

.btn-danger:hover {
  background: #d32f2f;
}

.btn-info {
  background: #2196F3;
  color: var(--white);
}

.btn-info:hover {
  background: #1976D2;
}

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

/* Skeleton Styles */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.skeleton-avatar,
.skeleton-name,
.skeleton-email,
.skeleton-badge,
.skeleton-btn {
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
}

@media (min-width: 768px) {
  .skeleton-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.skeleton-main {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
}

.skeleton-avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.skeleton-name {
  height: 16px;
  width: 140px;
}

.skeleton-email {
  height: 12px;
  width: 180px;
}

.skeleton-badge {
  width: 60px;
  height: 22px;
  border-radius: var(--radius-full);
}

.skeleton-actions {
  display: flex;
  gap: var(--space-sm);
}

.skeleton-btn {
  width: 80px;
  height: 32px;
  border-radius: var(--radius-md);
}

/* Permissions Modal Styles */
.permissions-modal {
  max-width: 500px;
}

.form-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: var(--space-xs);
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.feature-checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s;
}

.feature-checkbox:hover {
  background: var(--gray-100);
}

.feature-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  accent-color: var(--primary);
}

.feature-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-label {
  font-weight: 600;
  color: var(--gray-800);
}

.feature-desc {
  font-size: 0.8rem;
  color: var(--gray-500);
}

.current-permissions {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--gray-200);
}

.current-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
}

.permission-tag {
  padding: var(--space-xs) var(--space-sm);
  background: rgba(76, 175, 80, 0.15);
  color: #388e3c;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

/* Credentials Modal Styles */
.credentials-modal {
  max-width: 450px;
}

.btn-warning {
  background: #ff9800;
  color: var(--white);
}

.btn-warning:hover {
  background: #f57c00;
}

.error-text {
  color: var(--error);
  font-size: 0.875rem;
  margin-top: var(--space-sm);
  padding: var(--space-sm);
  background: rgba(244, 67, 54, 0.1);
  border-radius: var(--radius-sm);
}

.optional {
  font-weight: 400;
  font-size: 0.75rem;
  color: var(--gray-500);
}
</style>
