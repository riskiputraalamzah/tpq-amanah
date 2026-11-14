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
          <div class="w-field">
            <label for="akun-name">Nama Bapak/Ibu</label>
            <input id="akun-name" v-model="nameInput" class="w-input" autocomplete="name" maxlength="80" placeholder="Contoh: Ibu Aminah" />
            <span class="w-help">Tampil untuk ustadz/ustadzah saat Bapak/Ibu mengisi data atau mengajukan izin.</span>
          </div>
          <button type="submit" class="w-btn w-btn-ghost" :disabled="savingName || !nameInput.trim() || nameInput.trim() === (wali?.name || '')">
            {{ savingName ? 'Menyimpan…' : 'Simpan nama' }}
          </button>
        </form>
      </section>

      <h2 class="w-section-title">Ananda di TPQ</h2>
      <div class="links">
        <router-link to="/wali/tautkan" class="link-row">
          <span class="link-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
          </span>
          <span class="link-text"><strong>Tautkan anak lain</strong><span>Sudah mengaji di sini, punya kode dari ustadz/ustadzah</span></span>
          <span class="link-go" aria-hidden="true">›</span>
        </router-link>
        <router-link to="/wali/daftar/baru" class="link-row">
          <span class="link-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
          </span>
          <span class="link-text"><strong>Daftarkan santri baru</strong><span>Adik atau saudara yang belum mengaji di TPQ Amanah</span></span>
          <span class="link-go" aria-hidden="true">›</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useAuthStore } from '@/stores/auth'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { ask } = useDialog()
const toast = useToast()

const loading = ref(true)
const wali = ref(null)
const nameInput = ref('')
const savingName = ref(false)

const phone = computed(() => String(wali.value?.phone || '').replace(/^62/, '0').replace(/(\d{4})(\d{4})(\d+)/, '$1 $2 $3'))
const initials = computed(() => String(wali.value?.name || 'W').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(''))

onMounted(async () => {
  try {
    const { data } = await api.get('/wali/me', { cache: false })
    wali.value = data.wali
    nameInput.value = data.wali?.name || ''
  } catch (err) {
    toast.error(err.response?.data?.error || 'Data akun belum bisa dimuat.')
  } finally {
    loading.value = false
  }
})

async function saveName() {
  savingName.value = true
  try {
    const { data } = await api.put('/wali/me', { name: nameInput.value })
    wali.value = data
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
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #0a5c40;
  color: #fcd34d;
  font-weight: 800;
  font-size: 1.1rem;
}

.me-text {
  display: flex;
  flex-direction: column;
}

.me-text strong {
  font-size: 1.08rem;
  color: #0b3b2a;
}

.me-text span {
  font-size: 0.88rem;
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
}

.me-form .w-field {
  margin-bottom: 10px;
}

.links {
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
  overflow: hidden;
}

.link-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 12px 14px;
  color: #0b3b2a;
  text-decoration: none;
}

.link-row + .link-row {
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.link-row:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: -3px;
}

.link-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #e3f1ea;
  color: #0a5c40;
}

.link-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.link-text span {
  font-size: 0.82rem;
  color: #5b6b62;
}

.link-go {
  font-size: 1.4rem;
  color: #0a5c40;
}

.logout {
  margin-top: 22px;
  color: #8e1b12;
  border-color: rgba(142, 27, 18, 0.25);
}
</style>
