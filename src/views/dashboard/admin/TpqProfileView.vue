<template>
  <div class="tpq-profile-view">
    <header class="page-header">
      <div>
        <h1>Profil TPQ</h1>
        <p>Kelola informasi dan identitas resmi TPQ AMANAH</p>
      </div>
    </header>

    <div class="tpq-profile-container">
      <div v-if="loading" class="glass-card loading-card">
        <SkeletonLoader type="text" height="32px" width="200px" />
        <SkeletonLoader type="rect" height="40px" class="mt-4" />
        <SkeletonLoader type="rect" height="40px" class="mt-4" />
        <SkeletonLoader type="rect" height="40px" class="mt-4" />
      </div>

      <div v-else class="glass-card profile-card">
        <div class="tpq-header-card">
          <div class="tpq-logo-wrapper">
            <img v-if="form.logoUrl" :src="form.logoUrl" alt="Logo TPQ" class="tpq-logo" />
            <img v-else :src="defaultLogoUrl" alt="Logo TPQ" class="tpq-logo" />
          </div>
          <div class="tpq-info-summary">
            <h2>{{ form.name || 'TPQ AMANAH' }}</h2>
            <p class="nsq-badge">NSPQ: {{ form.nsq || 'Belum diatur' }}</p>
            <p class="head-text">Kepala TPQ: {{ form.headName || '-' }}</p>
          </div>
        </div>

        <form @submit.prevent="saveTpqProfile" class="tpq-form">
          <div class="form-grid">
            <!-- Nama TPQ -->
            <div class="form-group">
              <label class="form-label">
                Nama TPQ <span class="required-star">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                class="form-input"
                placeholder="Contoh: TPQ AMANAH"
                required
              />
              <span class="field-hint">Wajib untuk kelengkapan SPTJM & Dokumen LPJ</span>
            </div>

            <!-- NSPQ -->
            <div class="form-group">
              <label class="form-label">Nomor Statistik Pendidikan Al-Qur'an (NSPQ)</label>
              <input
                v-model="form.nsq"
                type="text"
                class="form-input"
                placeholder="Contoh: 411235xxxxxxxx"
              />
            </div>

            <!-- Nama Kepala TPQ -->
            <div class="form-group">
              <label class="form-label">
                Nama Kepala TPQ <span class="required-star">*</span>
              </label>
              <input
                v-model="form.headName"
                type="text"
                class="form-input"
                placeholder="Nama lengkap Kepala TPQ beserta gelar"
                required
              />
              <span class="field-hint">Digunakan sebagai penandatangan dokumen resmi</span>
            </div>

            <!-- Logo URL -->
            <div class="form-group">
              <label class="form-label">URL Logo TPQ (Opsional)</label>
              <input
                v-model="form.logoUrl"
                type="url"
                class="form-input"
                placeholder="https://..."
              />
            </div>
          </div>

          <!-- Alamat Lembaga (Full Width) -->
          <div class="form-group full-width">
            <label class="form-label">
              Alamat Lengkap TPQ <span class="required-star">*</span>
            </label>
            <textarea
              v-model="form.address"
              class="form-input textarea-input"
              rows="3"
              placeholder="Alamat lengkap TPQ (Jalan, RT/RW, Dusun/Kelurahan, Kecamatan, Kota/Kabupaten)"
              required
            ></textarea>
            <span class="field-hint">Wajib untuk kop dan pengesahan SPTJM</span>
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
              <span v-else>Simpan Profil TPQ</span>
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
import { useToast } from '@/composables/useToast'

const defaultLogoUrl = new URL('@/assets/logo.png', import.meta.url).href
const { success, error: showError, warning } = useToast()

const loading = ref(true)
const saving = ref(false)

const originalData = ref({})
const form = ref({
  name: '',
  nsq: '',
  address: '',
  headName: '',
  logoUrl: ''
})

const fetchTpqProfile = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/settings/tpq-profile')
    originalData.value = { ...data }
    form.value = {
      name: data.name || '',
      nsq: data.nsq || '',
      address: data.address || '',
      headName: data.headName || '',
      logoUrl: data.logoUrl || ''
    }
  } catch (err) {
    console.error('Failed to fetch TPQ profile:', err)
    showError('Gagal memuat profil TPQ')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = {
    name: originalData.value.name || '',
    nsq: originalData.value.nsq || '',
    address: originalData.value.address || '',
    headName: originalData.value.headName || '',
    logoUrl: originalData.value.logoUrl || ''
  }
}

const saveTpqProfile = async () => {
  if (!form.value.name?.trim()) {
    warning('Nama TPQ wajib diisi')
    return
  }
  if (!form.value.address?.trim()) {
    warning('Alamat TPQ wajib diisi')
    return
  }
  if (!form.value.headName?.trim()) {
    warning('Nama Kepala TPQ wajib diisi')
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      nsq: form.value.nsq ? form.value.nsq.trim() : '',
      address: form.value.address.trim(),
      headName: form.value.headName.trim(),
      logoUrl: form.value.logoUrl ? form.value.logoUrl.trim() : null
    }

    await api.put('/settings/tpq-profile', payload)
    originalData.value = { ...payload }
    success('Profil TPQ berhasil disimpan')
  } catch (err) {
    console.error('Failed to save TPQ profile:', err)
    showError(err.response?.data?.error || 'Gagal menyimpan profil TPQ')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchTpqProfile()
})
</script>

<style scoped>
.tpq-profile-view {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .tpq-profile-view {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-size: 1.75rem;
  color: var(--primary-dark);
}

.page-header p {
  color: var(--gray-600);
}

.tpq-profile-container {
  max-width: 800px;
}

.profile-card {
  padding: var(--space-2xl);
}

.loading-card {
  padding: var(--space-2xl);
}

.tpq-header-card {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  padding-bottom: var(--space-xl);
  border-bottom: 1px solid var(--gray-200);
  margin-bottom: var(--space-xl);
}

@media (max-width: 640px) {
  .tpq-header-card {
    flex-direction: column;
    text-align: center;
  }
}

.tpq-logo-wrapper {
  flex-shrink: 0;
}

.tpq-logo {
  width: 90px;
  height: 90px;
  object-fit: contain;
  border-radius: var(--radius-xl);
  background: white;
  padding: 8px;
  box-shadow: 0 4px 15px rgba(27, 94, 32, 0.15);
  border: 1px solid var(--gray-200);
}

.tpq-info-summary h2 {
  font-size: 1.35rem;
  color: var(--gray-800);
  margin-bottom: 4px;
}

.nsq-badge {
  display: inline-block;
  padding: 2px 10px;
  background: rgba(46, 125, 50, 0.1);
  color: var(--primary);
  font-weight: 600;
  font-size: 0.75rem;
  border-radius: var(--radius-full);
  margin-bottom: 6px;
}

.head-text {
  font-size: 0.85rem;
  color: var(--gray-600);
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
