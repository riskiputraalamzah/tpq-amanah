<template>
  <!-- "Tanda tangan saya": drawn once, stamped on every paraf (wali portal Akun, dashboard Profil) -->
  <section class="se" :aria-label="title">
    <h2 class="se-title">{{ title }}</h2>
    <p class="se-lead">{{ lead }}</p>

    <p v-if="loading" class="se-muted">Memuat…</p>
    <template v-else>
      <div v-if="saved && !redraw" class="se-saved">
        <SignatureImage :sig="saved" width="100%" height="140" :stroke="3.2" label="Tanda tangan tersimpan" />
        <div class="se-row">
          <button type="button" class="se-btn" @click="redraw = true">Gambar ulang</button>
          <button type="button" class="se-btn is-danger" :disabled="busy" @click="remove">Hapus</button>
        </div>
      </div>
      <div v-else class="se-draw">
        <SignaturePad ref="pad" v-model="draft" />
        <div class="se-row">
          <button type="button" class="se-btn" :disabled="busy" @click="clearPad">{{ saved ? 'Batal' : 'Hapus, ulangi' }}</button>
          <button type="button" class="se-btn is-primary" :disabled="busy || !draft" @click="save">{{ busy ? 'Menyimpan…' : 'Simpan tanda tangan' }}</button>
        </div>
      </div>
      <p v-if="message" class="se-msg" :class="{ 'is-error': isError }" role="status">{{ message }}</p>
    </template>

    <div class="se-preview">
      <span class="se-preview-label">Begini tampilannya saat paraf</span>
      <div class="se-stamp">
        <SignatureImage v-if="saved" :sig="saved" :width="64" :height="32" />
        <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a5c40" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
        <span><strong>{{ name || 'Nama Anda' }}</strong><small>{{ caption }}</small></span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'
import SignaturePad from './SignaturePad.vue'
import SignatureImage from './SignatureImage.vue'

const props = defineProps({
  title: { type: String, default: 'Tanda tangan saya' },
  lead: { type: String, default: 'Gambar sekali saja. Setiap kali menekan Paraf, tanda tangan ini yang ditempel, lengkap dengan nama dan waktunya.' },
  name: { type: String, default: '' },
  caption: { type: String, default: 'Tercatat atas akun dan waktunya' },
  // where the signature is kept: the person's own (/signatures/me) or the Kepala TPQ's (/signatures/kepala)
  endpoint: { type: String, default: '/signatures/me' },
})
const emit = defineEmits(['changed'])
const { ask } = useDialog()

const loading = ref(true)
const saved = ref(null)
const draft = ref(null)
const redraw = ref(false)
const busy = ref(false)
const message = ref('')
const isError = ref(false)
const pad = ref(null)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(props.endpoint, { cache: false })
    saved.value = data?.signature || null
  } catch {
    saved.value = null
  } finally {
    loading.value = false
  }
}
function clearPad() {
  draft.value = null
  pad.value?.clear()
  if (saved.value) redraw.value = false
}
async function save() {
  if (!draft.value) return
  busy.value = true
  message.value = ''
  try {
    const { data } = await api.put(props.endpoint, draft.value)
    saved.value = data.signature
    draft.value = null
    redraw.value = false
    isError.value = false
    message.value = 'Tanda tangan tersimpan.'
    emit('changed', saved.value)
  } catch (err) {
    isError.value = true
    message.value = err?.response?.data?.error || 'Belum tersimpan. Coba lagi.'
  } finally {
    busy.value = false
  }
}
async function remove() {
  const ok = await ask({
    title: 'Hapus tanda tangan?',
    message: 'Paraf berikutnya tampil sebagai nama dan centang saja, sampai Anda menggambar lagi. Paraf yang sudah ada tetap tercatat.',
    confirmText: 'Hapus',
    cancelText: 'Batal',
    tone: 'danger',
  })
  if (!ok) return
  busy.value = true
  try {
    await api.delete(props.endpoint)
    saved.value = null
    isError.value = false
    message.value = 'Tanda tangan dihapus.'
    emit('changed', null)
  } catch (err) {
    isError.value = true
    message.value = err?.response?.data?.error || 'Belum terhapus. Coba lagi.'
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>

<style scoped>
.se { display: grid; gap: 12px; }
.se-title { margin: 0; font-size: 1.05rem; font-weight: 800; color: #0b3b2a; }
.se-lead { margin: -4px 0 0; font-size: 0.88rem; line-height: 1.5; color: #3d5146; }
.se-muted { margin: 0; color: #52645a; font-size: 0.88rem; }
.se-saved {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(11, 59, 42, 0.12);
  background: #fff;
}
.se-draw { display: grid; gap: 10px; }
.se-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.se-btn {
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  background: #fff;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0b3b2a;
  cursor: pointer;
}
.se-btn.is-primary { border: 0; background: #0a5c40; color: #fff; font-weight: 800; }
.se-btn.is-danger { color: #a3261b; border-color: rgba(163, 38, 27, 0.35); }
.se-btn:disabled { opacity: 0.55; cursor: default; }
.se-btn:focus-visible { outline: 3px solid #b45309; outline-offset: 2px; }
.se-msg { margin: 0; font-size: 0.86rem; font-weight: 700; color: #0a5c40; }
.se-msg.is-error { color: #a3261b; }
.se-preview {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 16px;
  background: #f6f3ec;
}
.se-preview-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #52645a;
}
.se-stamp { display: flex; align-items: center; gap: 12px; }
.se-stamp span { display: grid; gap: 1px; }
.se-stamp strong { font-size: 0.92rem; color: #0b3b2a; }
.se-stamp small { font-size: 0.78rem; color: #52645a; }
</style>
