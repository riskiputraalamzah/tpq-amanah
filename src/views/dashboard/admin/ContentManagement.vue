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

    <div class="content-form glass-card">
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

const tabs = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'Tentang' },
  { id: 'contact', label: 'Kontak' }
]

const activeTab = ref('hero')
const saving = ref(false)

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
  }
})

const fetchContent = async () => {
  try {
    const { data } = await api.get('/content')
    if (data.hero) content.value.hero = { ...content.value.hero, ...data.hero }
    if (data.about) content.value.about = { ...content.value.about, ...data.about }
    if (data.contact) content.value.contact = { ...content.value.contact, ...data.contact }
  } catch (error) {
    console.log('Using default content')
  }
}

const saveContent = async () => {
  saving.value = true
  try {
    await api.put(`/content/${activeTab.value}`, content.value[activeTab.value])
    alert('Konten berhasil disimpan!')
  } catch (error) {
    console.error('Failed to save content:', error)
    alert('Gagal menyimpan konten')
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

.form-actions {
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--gray-100);
}
</style>
