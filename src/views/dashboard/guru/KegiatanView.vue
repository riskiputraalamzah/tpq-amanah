<template>
  <div class="kg" :class="{ 'is-admin': isAdmin }">
    <header class="kg-head">
      <div>
        <h1>Kegiatan</h1>
        <p>Munaqosyah, wisuda, dan kegiatan lain beserta pesertanya. Orang tua melihat status ananda di portal wali.</p>
      </div>
      <button v-if="canManage" type="button" class="kg-btn kg-btn-primary" @click="openForm">+ Kegiatan baru</button>
    </header>

    <PageSkeleton v-if="loading" :rows="4" label="Memuat kegiatan" />
    <p v-else-if="loadError" class="kg-note is-danger" role="alert">{{ loadError }}</p>
    <p v-else-if="!activities.length" class="kg-empty">
      Belum ada kegiatan.<template v-if="canManage"> Tekan <strong>+ Kegiatan baru</strong> untuk membuat yang pertama.</template>
      <template v-else> Admin akan menambahkannya.</template>
    </p>

    <ul v-else class="kg-list">
      <li v-for="a in activities" :key="a.id">
        <router-link :to="`/dashboard/kegiatan/${a.id}`" class="kg-card">
          <span class="kg-card-top">
            <strong>{{ a.title }}</strong>
            <span class="kg-pill" :class="a.status === 'open' ? 'is-ok' : 'is-idle'">{{ a.status === 'open' ? 'Berjalan' : 'Selesai' }}</span>
          </span>
          <span class="kg-sub">{{ a.typeLabel }}<template v-if="a.date"> · {{ dayLabel(a.date) }}</template></span>
          <span class="kg-meta">
            <span><strong>{{ a.participantCount }}</strong> peserta</span>
            <span v-if="a.fee">Biaya {{ formatRupiah(a.fee) }}</span>
            <span v-else>Tanpa biaya</span>
            <span v-if="!a.showToWali">Tidak tampil di portal wali</span>
          </span>
        </router-link>
      </li>
    </ul>

    <KegiatanForm v-if="form" :books="books" :busy="busy" :error="formError" :errors="formErrors" @close="form = false" @save="create" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import KegiatanForm from '@/components/KegiatanForm.vue'
import { useAuthStore } from '@/stores/auth'
import { dayLabel, formatRupiah } from '@/utils/kegiatan'
import './kegiatan.css'

const router = useRouter()
const isAdmin = computed(() => useAuthStore().user?.role === 'admin')
const loading = ref(true)
const loadError = ref('')
const activities = ref([])
const canManage = ref(false)
const books = ref([])
const form = ref(false)
const busy = ref(false)
const formError = ref('')
const formErrors = ref({})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/activities', { cache: false })
    activities.value = data.activities || []
    canManage.value = !!data.canManage
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Kegiatan belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

async function openForm() {
  formError.value = ''
  formErrors.value = {}
  try {
    const { data } = await api.get('/activities/books', { cache: false })
    books.value = data || []
  } catch {
    books.value = []
  }
  form.value = true
}

async function create(payload) {
  busy.value = true
  formError.value = ''
  formErrors.value = {}
  try {
    const { data } = await api.post('/activities', payload)
    router.push(`/dashboard/kegiatan/${data.activity.id}`)
  } catch (err) {
    formErrors.value = err.response?.data?.fields || {}
    formError.value = err.response?.data?.error || 'Kegiatan belum tersimpan.'
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>
