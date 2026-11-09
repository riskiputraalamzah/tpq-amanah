<template>
  <div class="content-management">
    <header class="page-header">
      <h1>Kelola Konten</h1>
      <p>Edit konten landing page TPQ AMANAH</p>
    </header>

    <div class="content-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <PageSkeleton v-if="loading" variant="form" :rows="3" label="Memuat konten" />

    <div v-else class="content-form glass-card">
      <!-- Hero Section -->
      <div v-if="activeTab === 'hero'" class="form-section">
        <h3>Section Hero</h3>
        <div class="form-group">
          <label class="form-label">Judul Utama</label>
          <input v-model="content.hero.title" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Ayat Arab</label>
          <input v-model="content.hero.arabicText" type="text" class="form-input" dir="rtl" />
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi</label>
          <textarea v-model="content.hero.description" class="form-input" rows="4"></textarea>
        </div>
      </div>

      <!-- About Section -->
      <div v-if="activeTab === 'about'" class="form-section">
        <h3>Section Tentang Kami</h3>
        <div class="form-group">
          <label class="form-label">Sejarah TPQ</label>
          <textarea v-model="content.about.history" class="form-input" rows="6"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Visi</label>
          <textarea v-model="content.about.vision" class="form-input" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Misi (satu per baris)</label>
          <textarea v-model="content.about.mission" class="form-input" rows="5"></textarea>
        </div>
      </div>

      <!-- Contact Section -->
      <div v-if="activeTab === 'contact'" class="form-section">
        <h3>Section Kontak</h3>
        <div class="form-group">
          <label class="form-label">Alamat</label>
          <input v-model="content.contact.address" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Telepon</label>
          <input v-model="content.contact.phone" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="content.contact.email" type="email" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Jam Mengaji</label>
          <input v-model="content.contact.schedule" type="text" class="form-input" />
        </div>
      </div>

      <!-- Legal documents Section -->
      <div v-if="activeTab === 'legalitas'" class="form-section">
        <h3>Legalitas &amp; Dokumen Resmi</h3>
        <p class="section-hint">
          Pilih dokumen yang tampil di landing page. Pengaturan ini hanya menyembunyikan dokumen dari halaman. File
          gambarnya tetap bisa dibuka oleh orang yang sudah mengetahui alamat langsungnya.
        </p>

        <label class="switch-row switch-master">
          <span class="switch-text">
            <strong>Tampilkan bagian Legalitas</strong>
            <small>Matikan untuk menyembunyikan seluruh bagian dari landing page.</small>
          </span>
          <input v-model="content.legalitas.enabled" type="checkbox" role="switch" class="switch" />
        </label>

        <ul class="doc-list" :class="{ 'is-off': !content.legalitas.enabled }">
          <li v-for="doc in legalDocuments" :key="doc.id" class="doc-item">
            <img :src="documentSrc(doc, 'thumb')" alt="" width="56" height="78" loading="lazy" class="doc-thumb" />
            <span class="switch-text">
              <strong>{{ doc.title }}</strong>
              <small>{{ doc.issuer }}</small>
              <span v-if="doc.redacted" class="doc-tag">Data pribadi disamarkan</span>
            </span>
            <label class="switch-label">
              <span class="sr-only">Tampilkan {{ doc.title }}</span>
              <input type="checkbox" role="switch" class="switch" :disabled="!content.legalitas.enabled"
                :checked="isDocumentVisible(doc.id)" @change="setDocumentVisible(doc.id, $event.target.checked)" />
            </label>
          </li>
        </ul>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" @click="saveContent" :disabled="saving">
          {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { legalDocuments, documentSrc } from '@/data/legalDocuments'

const { success, error: showError } = useToast()

const tabs = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'Tentang' },
  { id: 'contact', label: 'Kontak' },
  { id: 'legalitas', label: 'Legalitas' }
]

const activeTab = ref('hero')
const saving = ref(false)
const loading = ref(true)

const content = ref({
  hero: {
    title: 'Selamat Datang di TPQ AMANAH',
    arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    description: 'Taman Pendidikan Al-Quran untuk membentuk generasi Qurani'
  },
  about: {
    history: '',
    vision: '',
    mission: ''
  },
  contact: {
    address: 'JL. Kertanegara Nomor 20, Sawotratap, Gedangan, Sidoarjo',
    phone: '+62 812 3456 7890',
    email: 'tpqamanah@gmail.com',
    schedule: 'Senin - Jumat: 15:30 - 17:30 WIB'
  },
  // Documents are shown unless listed in hiddenIds.
  legalitas: {
    enabled: true,
    hiddenIds: []
  }
})

const isDocumentVisible = (id) => !content.value.legalitas.hiddenIds.includes(id)

const setDocumentVisible = (id, visible) => {
  const hidden = new Set(content.value.legalitas.hiddenIds)
  if (visible) hidden.delete(id)
  else hidden.add(id)
  content.value.legalitas.hiddenIds = [...hidden]
}

const fetchContent = async () => {
  try {
    const { data } = await api.get('/content')
    if (data.hero) content.value.hero = { ...content.value.hero, ...data.hero }
    if (data.about) content.value.about = { ...content.value.about, ...data.about }
    if (data.contact) content.value.contact = { ...content.value.contact, ...data.contact }
    if (data.legalitas) {
      content.value.legalitas = {
        enabled: data.legalitas.enabled !== false,
        hiddenIds: Array.isArray(data.legalitas.hiddenIds) ? data.legalitas.hiddenIds : []
      }
    }
  } catch (error) {
    console.log('Using default content')
  } finally {
    loading.value = false
  }
}

const saveContent = async () => {
  saving.value = true
  try {
    await api.put(`/content/${activeTab.value}`, content.value[activeTab.value])
    success('Konten berhasil disimpan')
  } catch (error) {
    console.error('Failed to save content:', error)
    showError(error.response?.data?.error || 'Gagal menyimpan konten')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchContent()
})
</script>

<style scoped>
.content-management {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .content-management {
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

.content-tabs {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.tab-btn {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  font-weight: 500;
  color: var(--gray-600);
  background: rgba(255, 255, 255, 0.7);
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  background: var(--white);
}

.tab-btn.active {
  background: var(--primary-gradient);
  color: var(--white);
}

.content-form {
  padding: var(--space-xl);
  background: rgba(255, 255, 255, 0.9);
}

.form-section h3 {
  color: var(--primary);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 2px solid var(--gray-100);
}

textarea.form-input {
  resize: vertical;
  min-height: 100px;
}

.section-hint {
  margin-bottom: var(--space-lg);
  color: var(--gray-600);
  line-height: 1.6;
}

.switch-row,
.doc-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.switch-master {
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  margin-bottom: var(--space-lg);
  background: var(--gray-100, #f4f4f5);
  border-radius: var(--radius-lg);
  cursor: pointer;
}

.switch-text {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.switch-text small {
  color: var(--gray-600);
}

.doc-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  list-style: none;
  padding: 0;
  margin: 0;
  transition: opacity 0.2s ease;
}

.doc-list.is-off {
  opacity: 0.5;
}

.doc-item {
  padding: var(--space-md);
  border: 1px solid var(--gray-100, #f4f4f5);
  border-radius: var(--radius-lg);
  background: var(--white);
}

.doc-thumb {
  flex: none;
  width: 56px;
  height: 78px;
  object-fit: cover;
  object-position: top;
  border-radius: 6px;
  border: 1px solid var(--gray-200, #e4e4e7);
}

.doc-tag {
  align-self: flex-start;
  margin-top: 2px;
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
  background: #fef3c7;
  border-radius: 999px;
}

.switch {
  appearance: none;
  position: relative;
  flex: none;
  width: 46px;
  height: 26px;
  border-radius: 999px;
  background: var(--gray-300, #d4d4d8);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.switch:checked {
  background: var(--primary);
}

.switch:checked::after {
  transform: translateX(20px);
}

.switch:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.switch:focus-visible {
  outline: 3px solid var(--primary-300, #81c784);
  outline-offset: 2px;
}

.switch-label {
  display: inline-flex;
  flex: none;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.form-actions {
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--gray-100);
}
</style>
