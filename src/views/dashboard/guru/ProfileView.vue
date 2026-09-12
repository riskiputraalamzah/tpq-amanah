<template>
  <div class="profile-view">
    <header class="page-header">
      <div>
        <h1>Profil Saya</h1>
        <p>Kelola data identitas dan informasi pengajar Anda</p>
      </div>
    </header>

    <div class="profile-container">
      <div v-if="loading" class="glass-card loading-card">
        <SkeletonLoader type="text" height="32px" width="200px" />
        <SkeletonLoader type="rect" height="40px" class="mt-4" />
        <SkeletonLoader type="rect" height="40px" class="mt-4" />
        <SkeletonLoader type="rect" height="40px" class="mt-4" />
      </div>

      <div v-else class="glass-card profile-card">
        <div class="user-summary">
          <div class="avatar-wrapper">
            <img v-if="user?.photoURL" :src="user.photoURL" :alt="user.displayName" class="profile-avatar" />
            <div v-else class="avatar-placeholder">{{ getInitials(user?.displayName) }}</div>
          </div>
          <div class="summary-info">
            <h2>{{ form.displayName || 'Nama Pengajar' }}</h2>
            <p class="role-badge">{{ user?.role === 'admin' ? 'Administrator' : 'Guru / Pengajar' }}</p>
            <p class="username-text">Username/Email: {{ user?.username || user?.email || '-' }}</p>
          </div>
        </div>

        <form @submit.prevent="saveProfile" class="profile-form">
          <div class="form-grid">
            <!-- Display Name -->
            <div class="form-group">
              <label class="form-label">
                Nama Lengkap <span class="required-star">*</span>
              </label>
              <input
                v-model="form.displayName"
                type="text"
                class="form-input"
                placeholder="Nama lengkap beserta gelar jika ada"
                required
              />
            </div>

            <!-- NIK -->
            <div class="form-group">
              <label class="form-label">
                NIK (Nomor Induk Kependudukan) <span class="required-star">*</span>
              </label>
              <input
                v-model="form.nik"
                type="text"
                maxlength="16"
                class="form-input"
                placeholder="16 digit NIK sesuai KTP"
                required
              />
              <span class="field-hint">Wajib untuk kelengkapan SPTJM & Dokumen LPJ</span>
            </div>

            <!-- Tempat Lahir -->
            <div class="form-group">
              <label class="form-label">
                Tempat Lahir <span class="required-star">*</span>
              </label>
              <input
                v-model="form.birthPlace"
                type="text"
                class="form-input"
                placeholder="Kota/Kabupaten kelahiran"
                required
              />
            </div>

            <!-- Tanggal Lahir -->
            <div class="form-group">
              <label class="form-label">
                Tanggal Lahir <span class="required-star">*</span>
              </label>
              <input
                v-model="form.birthDate"
                type="date"
                class="form-input"
                required
              />
            </div>

            <!-- Jabatan -->
            <div class="form-group">
              <label class="form-label">
                Jabatan / Posisi <span class="required-star">*</span>
              </label>
              <input
                v-model="form.position"
                type="text"
                class="form-input"
                placeholder="Contoh: Guru Pengajar, Wali Kelas"
                required
              />
            </div>

            <!-- Telepon / WA -->
            <div class="form-group">
              <label class="form-label">Nomor WhatsApp / Telepon</label>
              <input
                v-model="form.phone"
                type="tel"
                class="form-input"
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          <!-- Alamat (Full Width) -->
          <div class="form-group full-width">
            <label class="form-label">
              Alamat Lengkap <span class="required-star">*</span>
            </label>
            <textarea
              v-model="form.address"
              class="form-input textarea-input"
              rows="3"
              placeholder="Alamat tempat tinggal lengkap (Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kab)"
              required
            ></textarea>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              @click="resetForm"
              :disabled="saving"
            >
              Batal
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="saving"
            >
              <span v-if="saving">Menyimpan...</span>
              <span v-else>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const { success, error: showError, warning } = useToast()

const user = computed(() => authStore.user)
const loading = ref(true)
const saving = ref(false)

const form = ref({
  displayName: '',
  nik: '',
  birthPlace: '',
  birthDate: '',
  address: '',
  position: '',
  phone: ''
})

const getInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const loadProfile = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/users/me')
    authStore.user = data
    form.value = {
      displayName: data.displayName || '',
      nik: data.nik || '',
      birthPlace: data.birthPlace || '',
      birthDate: data.birthDate || '',
      address: data.address || '',
      position: data.position || '',
      phone: data.phone || ''
    }
  } catch (err) {
    console.error('Failed to load profile:', err)
    showError('Gagal memuat profil')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  if (user.value) {
    form.value = {
      displayName: user.value.displayName || '',
      nik: user.value.nik || '',
      birthPlace: user.value.birthPlace || '',
      birthDate: user.value.birthDate || '',
      address: user.value.address || '',
      position: user.value.position || '',
      phone: user.value.phone || ''
    }
  }
}

const saveProfile = async () => {
  if (!form.value.displayName?.trim()) {
    warning('Nama lengkap wajib diisi')
    return
  }

  saving.value = true
  try {
    const userId = user.value?.id || user.value?.uid
    await api.patch('/users/' + userId, {
      displayName: form.value.displayName.trim(),
      nik: form.value.nik ? form.value.nik.trim() : null,
      birthPlace: form.value.birthPlace ? form.value.birthPlace.trim() : null,
      birthDate: form.value.birthDate || null,
      address: form.value.address ? form.value.address.trim() : null,
      position: form.value.position ? form.value.position.trim() : null,
      phone: form.value.phone ? form.value.phone.trim() : null
    })

    // Refresh user state in authStore
    const { data } = await api.get('/users/me')
    authStore.user = data

    success('Profil berhasil diperbarui')
  } catch (err) {
    console.error('Failed to save profile:', err)
    showError(err.response?.data?.error || 'Gagal menyimpan profil')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-view {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .profile-view {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 4px;
}

.page-header p {
  font-size: 0.95rem;
  color: var(--gray-600);
}

.profile-container {
  max-width: 800px;
}

.profile-card {
  padding: var(--space-2xl);
}

.loading-card {
  padding: var(--space-2xl);
}

.user-summary {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: var(--space-xl);
}

@media (max-width: 640px) {
  .user-summary {
    flex-direction: column;
    text-align: center;
  }
}

.avatar-wrapper {
  flex-shrink: 0;
}

.profile-avatar {
  width: 90px;
  height: 90px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 3px solid var(--primary-light, #81C784);
}

.avatar-placeholder {
  width: 90px;
  height: 90px;
  border-radius: var(--radius-full);
  background: var(--primary-gradient);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(27, 94, 32, 0.2);
}

.summary-info h2 {
  font-size: 1.35rem;
  color: var(--gray-800);
  margin-bottom: 4px;
}

.role-badge {
  display: inline-block;
  padding: 2px 10px;
  background: rgba(46, 125, 50, 0.1);
  color: var(--primary);
  font-weight: 600;
  font-size: 0.75rem;
  border-radius: var(--radius-full);
  margin-bottom: 6px;
}

.username-text {
  font-size: 0.85rem;
  color: var(--gray-500);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md) var(--space-lg);
}

@media (min-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.full-width {
  grid-column: 1 / -1;
  margin-top: var(--space-sm);
}

.required-star {
  color: var(--error, #F44336);
}

.field-hint {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: 2px;
}

.textarea-input {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--gray-100);
}
</style>
