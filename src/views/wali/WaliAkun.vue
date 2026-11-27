<template>
  <div>
    <PageSkeleton v-if="loading" :rows="3" label="Memuat akun" />
    <template v-else>
      <h1 class="w-title">Akun</h1>

      <section class="w-card me">
        <div class="me-head">
          <span class="me-avatar" aria-hidden="true">{{ initials }}</span>
          <div class="me-text">
            <strong>{{ wali?.name || 'Wali santri' }}</strong>
            <span>WhatsApp {{ phone }}</span>
          </div>
        </div>
        <form class="me-form" @submit.prevent="saveName">
          <div class="w-field me-field">
            <label for="akun-name">Nama Bapak/Ibu</label>
            <input id="akun-name" v-model="nameInput" class="w-input" autocomplete="name" maxlength="80" placeholder="Contoh: Ibu Aminah" />
            <span class="w-help">Tampil untuk ustadz/ustadzah saat Bapak/Ibu mengisi data atau mengajukan izin.</span>
          </div>
          <button v-if="nameDirty" type="submit" class="w-btn w-btn-primary" :disabled="savingName || !nameInput.trim()">
            {{ savingName ? 'Menyimpan…' : 'Simpan nama' }}
          </button>
        </form>
      </section>

      <h2 class="w-section-title">Ananda di TPQ</h2>
      <div class="links">
        <router-link v-for="s in santri" :key="s.santriId" :to="`/wali/santri/${s.santriId}`" class="link-row">
          <span class="kid-avatar" aria-hidden="true">{{ kidInitials(s.name) }}</span>
          <span class="link-text">
            <strong>{{ s.name }}</strong>
            <span>{{ levelName(s.classId) }} · Data ananda</span>
          </span>
          <span class="w-pill" :class="`is-${status(s).tone}`">{{ status(s).label }}</span>
          <svg class="w-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </router-link>
        <router-link to="/wali/tautkan" class="link-row">
          <span class="link-icon" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
          </span>
          <span class="link-text"><strong>Tambah anak lain</strong><span>Ketik kode dari slip kertas, atau minta kodenya ke ustadz/ustadzah</span></span>
          <svg class="w-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </router-link>
        <router-link v-if="SHOW_NEW_REGISTRATION" to="/wali/daftar/baru" class="link-row">
          <span class="link-icon" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
          </span>
          <span class="link-text"><strong>Daftarkan santri baru</strong><span>Adik atau saudara yang belum mengaji di TPQ Amanah</span></span>
          <svg class="w-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </router-link>
      </div>

      <h2 class="w-section-title">Bantuan &amp; masukan</h2>
      <div class="links">
        <router-link to="/wali/masukan" class="link-row">
          <span class="link-icon" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
          </span>
          <span class="link-text"><strong>Saran &amp; Kritik</strong><span>Sampaikan masukan untuk platform &amp; pelayanan TPQ Amanah</span></span>
          <svg class="w-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </router-link>
      </div>

      <button type="button" class="w-btn w-btn-ghost logout" @click="logout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
        Keluar
      </button>
    </template>
  </div>
</template>

<script setup>
import { SHOW_NEW_REGISTRATION } from '@/utils/waliFeatures'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { STATUS } from '@/utils/santriProfile'
import { useAuthStore } from '@/stores/auth'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'
import { put } from '@/utils/waliCache'

const router = useRouter()
const authStore = useAuthStore()
const { ask } = useDialog()
const toast = useToast()

// shown at once from the shared store (Beranda has it), refreshed in the background
const me = useWaliResource(() => WALI_KEYS.me, () => waliFetch.me())
const loading = computed(() => me.loading.value)
const wali = computed(() => me.data.value?.wali || null)
const santri = computed(() => me.data.value?.santri || [])
const nameInput = ref('')
const savingName = ref(false)

const phone = computed(() => String(wali.value?.phone || '').replace(/^62/, '0').replace(/(\d{4})(\d{4})(\d+)/, '$1 $2 $3'))
const initials = computed(() => String(wali.value?.name || 'W').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(''))
const kidInitials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const status = (s) => STATUS[s.profileStatus] || STATUS.empty
const nameDirty = computed(() => nameInput.value.trim() !== (wali.value?.name || '').trim())

// the name field starts from the saved name (not overwritten while the parent is typing)
let nameEdited = false
watch(
  () => wali.value?.name,
  (n) => {
    if (!nameEdited) nameInput.value = n || ''
  },
  { immediate: true },
)
watch(nameInput, (v) => {
  if (v !== (wali.value?.name || '')) nameEdited = true
})
watch(
  () => me.error.value,
  (e) => {
    if (e) toast.error(e)
  },
)

async function saveName() {
  savingName.value = true
  try {
    const { data } = await api.put('/wali/me', { name: nameInput.value })
    put(WALI_KEYS.me, { ...(me.data.value || {}), wali: data })
    nameEdited = false
    toast.success('Nama tersimpan')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Nama belum tersimpan.')
  } finally {
    savingName.value = false
  }
}

async function logout() {
  const ok = await ask({ title: 'Keluar dari portal wali?', message: 'Untuk masuk lagi, cukup nomor WhatsApp dan kode yang dikirim TPQ.', confirmText: 'Keluar' })
  if (!ok) return
  await authStore.logout()
  router.push({ name: 'Login', query: { as: 'wali' } })
}
</script>

<style scoped>
.me {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 12px;
}

.me-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.me-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 15px;
  background: linear-gradient(145deg, #0a5c40, #053d2c);
  color: var(--w-gold);
  font-weight: 800;
  font-size: 1.05rem;
}

.me-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.me-text strong {
  font-size: 1.06rem;
  font-weight: 800;
  color: var(--w-ink);
}

.me-text span {
  font-size: 0.86rem;
  color: var(--w-muted);
  font-variant-numeric: tabular-nums;
}

.me-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.me-field {
  margin-bottom: 0;
}

.links {
  display: flex;
  flex-direction: column;
  border-radius: var(--w-radius-card);
  background: #fff;
  border: 1px solid var(--w-line);
  box-shadow: var(--w-shadow-card);
  overflow: hidden;
}

.link-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 62px;
  padding: 12px 14px;
  color: var(--w-ink);
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.link-row + .link-row {
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.link-row:hover {
  background: #f8fbf9;
}

.link-row:active {
  background: var(--w-emerald-soft);
}

.link-row:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: -3px;
}

.link-icon,
.kid-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
}

.kid-avatar {
  font-size: 0.82rem;
  font-weight: 800;
}

.link-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.link-text strong {
  font-size: 0.94rem;
  font-weight: 800;
  line-height: 1.25;
}

.link-text span {
  font-size: 0.8rem;
  color: var(--w-muted);
  line-height: 1.35;
}

.link-row .w-pill {
  flex: none;
}

.logout {
  margin-top: 22px;
  color: #8e1b12;
  border-color: rgba(142, 27, 18, 0.24);
}
</style>
