<template>
  <div>
    <PageSkeleton v-if="loading" :rows="3" label="Memuat data" />

    <template v-else>
      <h1 class="w-title">Assalamu'alaikum{{ wali?.name ? `, ${wali.name}` : '' }}</h1>
      <p class="w-lead">Lengkapi data ananda agar TPQ bisa menghubungi Bapak/Ibu dan mengirim kabar absensi.</p>

      <p v-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

      <!-- Ask the parent's name once: the admin sees who filled the data -->
      <form v-if="!wali?.name" class="w-card name-card" @submit.prevent="saveName">
        <div class="w-field">
          <label for="wali-name">Nama Bapak/Ibu</label>
          <input id="wali-name" v-model="nameInput" class="w-input" autocomplete="name" placeholder="Contoh: Ibu Aminah" />
        </div>
        <button type="submit" class="w-btn w-btn-ghost" :disabled="!nameInput.trim() || savingName">
          {{ savingName ? 'Menyimpan…' : 'Simpan nama' }}
        </button>
      </form>

      <!-- No child linked yet -->
      <div v-if="!santri.length" class="w-card w-center">
        <div class="w-empty-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
        </div>
        <h2 class="w-title" style="font-size: 1.15rem">Tautkan ananda dulu</h2>
        <p class="w-lead">Masukkan kode dari slip TPQ atau pesan WhatsApp dari ustadz/ustadzah.</p>
        <router-link to="/wali/tautkan" class="w-btn w-btn-primary">Masukkan kode</router-link>
      </div>

      <!-- The children -->
      <template v-else>
        <h2 class="w-section-title">Ananda</h2>
        <article v-for="s in santri" :key="s.santriId" class="w-card child-card">
          <div class="child-head">
            <div class="child-avatar" aria-hidden="true">{{ initials(s.name) }}</div>
            <div class="child-text">
              <strong>{{ s.name }}</strong>
              <span>{{ levelName(s.classId) }}<template v-if="s.nomorInduk"> · No. induk {{ s.nomorInduk }}</template></span>
            </div>
          </div>

          <span class="w-pill" :class="`is-${status(s).tone}`">{{ status(s).label }}</span>
          <p v-if="s.profileStatus === 'needs_fix' && s.adminNote" class="w-note is-danger child-note">
            <strong>Catatan admin:</strong> {{ s.adminNote }}
          </p>
          <p v-else-if="s.hasPendingIdentity" class="w-note is-warn child-note">Perubahan identitas sedang dicek admin.</p>

          <router-link :to="`/wali/santri/${s.santriId}`" class="w-btn" :class="actionClass(s)">
            {{ actionLabel(s) }}
          </router-link>
        </article>

        <router-link to="/wali/tautkan" class="w-btn w-btn-ghost add-child">+ Tautkan anak lain</router-link>
      </template>

      <!-- Requests while the code was lost -->
      <template v-if="requests.length">
        <h2 class="w-section-title">Pengajuan tautan</h2>
        <div v-for="r in requests" :key="r.id" class="w-card request-card">
          <strong>{{ r.childName }}</strong>
          <span class="w-pill" :class="r.status === 'rejected' ? 'is-danger' : 'is-info'">
            {{ r.status === 'rejected' ? 'Ditolak' : 'Menunggu dicek admin' }}
          </span>
          <p v-if="r.status === 'rejected' && r.reason" class="w-help">Alasan: {{ r.reason }}</p>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { STATUS } from '@/utils/santriProfile'

const loading = ref(true)
const loadError = ref('')
const wali = ref(null)
const santri = ref([])
const requests = ref([])
const nameInput = ref('')
const savingName = ref(false)

const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
const status = (s) => STATUS[s.profileStatus] || STATUS.empty
const actionLabel = (s) => ({
  empty: 'Isi data sekarang',
  draft: 'Lanjutkan mengisi',
  needs_fix: 'Perbaiki data',
  submitted: 'Lihat / ubah data',
  verified: 'Lihat / perbarui data',
}[s.profileStatus] || 'Isi data sekarang')
const actionClass = (s) => (['submitted', 'verified'].includes(s.profileStatus) ? 'w-btn-ghost' : 'w-btn-primary')

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/wali/me', { cache: false })
    wali.value = data.wali
    santri.value = data.santri || []
    requests.value = data.requests || []
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Data belum bisa dimuat. Periksa koneksi lalu muat ulang.'
  } finally {
    loading.value = false
  }
}

async function saveName() {
  savingName.value = true
  try {
    const { data } = await api.put('/wali/me', { name: nameInput.value })
    wali.value = data
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Nama belum tersimpan.'
  } finally {
    savingName.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.name-card {
  margin-bottom: 4px;
}

.child-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.child-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.child-avatar {
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #0a5c40;
  color: #fcd34d;
  font-weight: 800;
}

.child-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.child-text strong {
  font-size: 1.05rem;
  color: #0b3b2a;
}

.child-text span {
  font-size: 0.85rem;
  color: #5b6b62;
}

.child-card .w-pill {
  align-self: flex-start;
}

.child-note {
  margin: 0;
}

.add-child {
  margin-top: 14px;
}

.request-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.request-card .w-help {
  flex-basis: 100%;
  margin: 0;
}
</style>
