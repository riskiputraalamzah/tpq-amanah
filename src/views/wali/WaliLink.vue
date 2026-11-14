<template>
  <div>
    <!-- done -->
    <div v-if="linked" class="w-card w-center">
      <div class="w-done-icon" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <h1 class="w-title">{{ linked.alreadyLinked ? 'Ananda sudah tertaut' : 'Alhamdulillah, tertaut' }}</h1>
      <p class="w-lead">
        <strong>{{ linked.santriName }}</strong>
        {{ linked.alreadyLinked ? 'sudah terhubung dengan akun Bapak/Ibu sebelumnya.' : 'sekarang terhubung dengan akun Bapak/Ibu.' }}
      </p>
      <router-link :to="`/wali/santri/${linked.santriId}`" class="w-btn w-btn-primary">Isi data ananda sekarang</router-link>
      <router-link to="/wali" class="w-btn w-btn-ghost done-secondary">Nanti saja</router-link>
    </div>

    <!-- request sent -->
    <div v-else-if="requestSent" class="w-card w-center">
      <div class="w-empty-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
      </div>
      <h1 class="w-title">Pengajuan terkirim</h1>
      <p class="w-lead">Admin TPQ akan mengecek dan menautkan ananda. Bapak/Ibu bisa membuka halaman ini lagi nanti.</p>
      <router-link to="/wali" class="w-btn w-btn-primary">Kembali ke beranda</router-link>
    </div>

    <!-- enter the code -->
    <template v-else-if="mode === 'code'">
      <router-link to="/wali" class="w-link back-link">← Kembali</router-link>
      <h1 class="w-title">Tautkan ananda</h1>
      <p class="w-lead">Masukkan kode dari <strong>slip TPQ</strong> atau <strong>pesan WhatsApp</strong> ustadz/ustadzah.</p>

      <form class="w-card" @submit.prevent="submitCode">
        <div class="w-field">
          <label for="link-code">Kode tautan</label>
          <input id="link-code" v-model="code" class="w-input w-code-input" autocomplete="off" autocapitalize="characters"
            spellcheck="false" placeholder="AB2C-D3EF" maxlength="9" @input="code = formatLinkCode(code)" />
          <span class="w-help">8 huruf/angka. Huruf besar/kecil tidak masalah.</span>
        </div>

        <!-- whose code this is, before it is used -->
        <p v-if="checking" class="w-help" role="status">Mengecek kode…</p>
        <div v-else-if="preview?.status === 'valid'" class="w-note code-for" role="status">
          <span>Kode ini untuk <strong>{{ preview.santriName }}</strong> · {{ levelName(preview.classId) }}.
            Pastikan ini ananda Bapak/Ibu.</span>
        </div>
        <div v-else-if="preview?.status === 'linked'" class="w-note code-for" role="status">
          <span><strong>{{ preview.santriName }}</strong> sudah tertaut dengan akun Bapak/Ibu.</span>
        </div>
        <p v-else-if="preview?.message" class="w-note is-danger" role="alert">{{ preview.message }}</p>

        <router-link v-if="preview?.status === 'linked'" :to="`/wali/santri/${preview.santriId}`" class="w-btn w-btn-primary">
          Lihat data ananda
        </router-link>

        <div v-if="preview?.status !== 'linked'" class="w-field">
          <span id="rel-label" class="w-label">Bapak/Ibu adalah</span>
          <div class="w-chips" role="radiogroup" aria-labelledby="rel-label">
            <button v-for="r in RELATIONS" :key="r.value" type="button" role="radio" class="w-chip"
              :aria-checked="relation === r.value" @click="relation = r.value">{{ r.label }}</button>
          </div>
        </div>

        <p v-if="error" class="w-note is-danger" role="alert">{{ error }}</p>
        <button v-if="preview?.status !== 'linked'" type="submit" class="w-btn w-btn-primary"
          :disabled="busy || checking || code.replace('-', '').length !== 8 || !relation || (preview && preview.status !== 'valid')">
          {{ busy ? 'Menautkan…' : 'Tautkan' }}
        </button>
      </form>

      <p class="w-center lost">
        Kode hilang atau belum dapat?
        <button type="button" class="w-link" @click="mode = 'request'; error = ''">Ajukan ke admin</button>
      </p>
    </template>

    <!-- lost code: a request -->
    <template v-else>
      <button type="button" class="w-link back-link" @click="mode = 'code'; error = ''">← Pakai kode saja</button>
      <h1 class="w-title">Ajukan tautan</h1>
      <p class="w-lead">Tulis nama ananda. Admin atau ustadz/ustadzah akan mencocokkan dan menautkannya.</p>

      <form class="w-card" @submit.prevent="submitRequest">
        <div class="w-field">
          <label for="req-name">Nama lengkap ananda</label>
          <input id="req-name" v-model="req.childName" class="w-input" autocomplete="off" />
        </div>
        <div class="w-field">
          <label for="req-class">Jilid / kelas di TPQ</label>
          <select id="req-class" v-model="req.classId" class="w-input">
            <option value="">Tidak tahu</option>
            <option v-for="n in 6" :key="n" :value="String(n)">Jilid {{ n }}</option>
            <option value="7">Marhalah</option>
          </select>
        </div>
        <div class="w-field">
          <span id="req-rel-label" class="w-label">Bapak/Ibu adalah</span>
          <div class="w-chips" role="radiogroup" aria-labelledby="req-rel-label">
            <button v-for="r in RELATIONS" :key="r.value" type="button" role="radio" class="w-chip"
              :aria-checked="req.relation === r.value" @click="req.relation = r.value">{{ r.label }}</button>
          </div>
        </div>
        <div class="w-field">
          <label for="req-note">Keterangan (opsional)</label>
          <textarea id="req-note" v-model="req.note" class="w-input" maxlength="300" placeholder="Contoh: kakaknya juga mengaji di Jilid 4"></textarea>
        </div>
        <p v-if="error" class="w-note is-danger" role="alert">{{ error }}</p>
        <button type="submit" class="w-btn w-btn-primary" :disabled="busy || req.childName.trim().length < 3 || !req.relation">
          {{ busy ? 'Mengirim…' : 'Kirim pengajuan' }}
        </button>
      </form>
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { RELATIONS, formatLinkCode } from '@/utils/santriProfile'

const route = useRoute()
const mode = ref('code')
// ?kode=... from the WhatsApp message fills the code in
const code = ref(formatLinkCode(route.query.kode || ''))
const relation = ref('')
const busy = ref(false)
const error = ref('')
const linked = ref(null)
const requestSent = ref(false)
const req = ref({ childName: '', classId: '', relation: '', note: '' })
const preview = ref(null)
const checking = ref(false)
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')

// Check the code as soon as it is complete: whose it is, or why it cannot be used
let previewSeq = 0
async function checkCode(value) {
  const seq = ++previewSeq
  preview.value = null
  error.value = ''
  if (String(value).replace(/[^A-Za-z0-9]/g, '').length !== 8) return
  checking.value = true
  try {
    const { data } = await api.get('/wali/link/preview', { params: { code: value }, cache: false })
    if (seq === previewSeq) preview.value = data
  } catch (err) {
    if (seq === previewSeq) error.value = err.response?.data?.error || ''
  } finally {
    if (seq === previewSeq) checking.value = false
  }
}
watch(code, checkCode, { immediate: true })

async function submitCode() {
  busy.value = true
  error.value = ''
  try {
    const { data } = await api.post('/wali/link', { code: code.value, relation: relation.value })
    linked.value = data
  } catch (err) {
    error.value = err.response?.data?.error || 'Gagal menautkan. Coba lagi.'
  } finally {
    busy.value = false
  }
}

async function submitRequest() {
  busy.value = true
  error.value = ''
  try {
    await api.post('/wali/link-requests', req.value)
    requestSent.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Pengajuan belum terkirim. Coba lagi.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.code-for {
  margin: 0 0 16px;
}

.back-link {
  display: inline-block;
  margin: -4px 0 8px;
  text-decoration: none;
}

.lost {
  margin-top: 16px;
  font-size: 0.9rem;
  color: #475a50;
}

.done-secondary {
  margin-top: 10px;
}
</style>
