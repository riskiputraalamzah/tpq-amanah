<template>
  <div>
    <router-link to="/wali" class="w-back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
      Beranda
    </router-link>

    <h1 class="w-title">Saran &amp; Kritik</h1>
    <p class="w-lead">
      Sampaikan saran, kritik, atau kendala Bapak/Ibu agar aplikasi dan pelayanan TPQ Amanah menjadi semakin baik.
    </p>

    <form class="w-card fb-form" novalidate @submit.prevent="submitFeedback">
      <div class="w-field fb-field">
        <span id="fb-cat-label" class="w-label">Topik masukan</span>
        <div class="fb-cats" role="radiogroup" aria-labelledby="fb-cat-label">
          <button
            v-for="c in CATEGORIES"
            :key="c.value"
            type="button"
            role="radio"
            class="fb-cat"
            :aria-checked="category === c.value"
            :class="{ 'is-active': category === c.value }"
            @click="category = c.value"
          >
            <strong>{{ c.label }}</strong>
            <span>{{ c.hint }}</span>
          </button>
        </div>
      </div>

      <div class="w-field fb-field">
        <label for="fb-msg">Saran atau kritik Bapak/Ibu</label>
        <textarea
          id="fb-msg"
          v-model="message"
          class="w-input fb-textarea"
          rows="4"
          maxlength="1000"
          placeholder="Contoh: tampilan jadwal atau kehadiran di HP sudah jelas, namun akan lebih membantu bila ada..."
          :aria-invalid="!!formError"
        ></textarea>
        <div class="fb-meta">
          <span class="w-help">Diterima langsung oleh pengurus/admin TPQ Amanah.</span>
          <span class="fb-counter">{{ message.trim().length }}/1000</span>
        </div>
      </div>

      <p v-if="formError" class="w-note is-danger" role="alert">{{ formError }}</p>
      <p v-if="sentNotice" class="w-note" role="status">{{ sentNotice }}</p>

      <button type="submit" class="w-btn w-btn-primary" :disabled="sending || message.trim().length < 10">
        {{ sending ? 'Mengirim…' : 'Kirim saran & masukan' }}
      </button>
    </form>

    <h2 class="w-section-title">Riwayat masukan Bapak/Ibu</h2>
    <PageSkeleton v-if="loading" :rows="2" label="Memuat riwayat masukan" />
    <div v-else-if="!items.length" class="w-card empty-box">
      <p class="w-help">Belum ada saran atau kritik yang dikirim.</p>
    </div>
    <div v-else class="fb-list">
      <article v-for="item in items" :key="item.id" class="w-card fb-item">
        <div class="fb-item-top">
          <span class="fb-cat-tag">{{ item.categoryLabel || categoryLabel(item.category) }}</span>
          <span class="w-pill" :class="`is-${statusInfo(item.status).tone}`">
            {{ statusInfo(item.status).label }}
          </span>
        </div>
        <p class="fb-item-time">
          Dikirim <time :title="fullDateTime(item.createdAt)">{{ timeAgo(item.createdAt, now) }}</time>
        </p>
        <p class="fb-item-msg">{{ item.message }}</p>

        <div v-if="item.reply && item.reply.text" class="fb-reply">
          <div class="fb-reply-head">
            <strong>Tanggapan Pengurus TPQ</strong>
            <span v-if="item.reply.at">
              <time :title="fullDateTime(item.reply.at)">{{ timeAgo(item.reply.at, now) }}</time>
            </span>
          </div>
          <p class="fb-reply-body">{{ item.reply.text }}</p>
        </div>
        <p v-else-if="item.status === 'noted' || item.status === 'done'" class="fb-noted">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
          <span>Masukan Bapak/Ibu sudah dicatat dan ditindaklanjuti oleh pengurus TPQ. Jazakumullahu khairan.</span>
        </p>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { timeAgo, fullDateTime } from '@/utils/timeAgo'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'
import { put } from '@/utils/waliCache'

const toast = useToast()

const CATEGORIES = [
  { value: 'aplikasi', label: 'Aplikasi & Portal', hint: 'Kemudahan atau kendala di HP' },
  { value: 'kbm', label: 'Kegiatan KBM', hint: 'Jadwal, materi, atau kehadiran' },
  { value: 'pelayanan', label: 'Pelayanan TPQ', hint: 'Informasi & administrasi' },
  { value: 'lainnya', label: 'Lainnya', hint: 'Masukan umum untuk TPQ' },
]

const STATUS_MAP = {
  open: { label: 'Menunggu dibaca', tone: 'info' },
  noted: { label: 'Sudah dicatat', tone: 'ok' },
  replied: { label: 'Ditanggapi pengurus', tone: 'ok' },
  done: { label: 'Selesai ditindaklanjuti', tone: 'ok' },
}

const category = ref('aplikasi')
const message = ref('')
const sending = ref(false)
// the parent's earlier messages: shown at once from the last visit, refreshed in the background
const feedback = useWaliResource(() => WALI_KEYS.feedback, () => waliFetch.feedback())
const loading = computed(() => feedback.loading.value)
const items = computed(() => (Array.isArray(feedback.data.value) ? feedback.data.value : []))
watch(
  () => feedback.error.value,
  (e) => {
    if (e) toast.error(e)
  },
)
const formError = ref('')
const sentNotice = ref('')
const now = ref(new Date())
let clockTimer = null

const categoryLabel = (val) => CATEGORIES.find((c) => c.value === val)?.label || 'Lainnya'
const statusInfo = (st) => STATUS_MAP[st] || STATUS_MAP.open

async function submitFeedback() {
  formError.value = ''
  sentNotice.value = ''
  const clean = message.value.trim()
  if (clean.length < 10) {
    formError.value = 'Mohon tulis saran atau masukan minimal 10 karakter agar jelas bagi pengurus.'
    return
  }
  sending.value = true
  try {
    const { data } = await api.post('/wali-feedback/mine', {
      category: category.value,
      message: clean,
    })
    put(WALI_KEYS.feedback, [data, ...items.value])
    message.value = ''
    sentNotice.value = 'Jazakumullahu khairan. Saran & masukan Bapak/Ibu sudah terkirim ke pengurus TPQ.'
    toast.success('Masukan terkirim ke pengurus TPQ')
  } catch (err) {
    formError.value = err.response?.data?.error || 'Masukan belum terkirim. Coba lagi sebentar.'
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 30000)
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
.fb-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.fb-field {
  margin-bottom: 0;
}

/* Compact 2x2 grid keeps the textarea visible above the fold on 360px-390px phones */
.fb-cats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 320px) {
  .fb-cats {
    grid-template-columns: 1fr;
  }
}

.fb-cat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 64px;
  padding: 10px 11px;
  border-radius: 13px;
  border: 1.5px solid rgba(11, 59, 42, 0.14);
  background: var(--w-bg);
  color: var(--w-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.fb-cat:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: 2px;
}

.fb-cat strong {
  font-size: 0.85rem;
  font-weight: 800;
  line-height: 1.25;
}

.fb-cat span {
  font-size: 0.74rem;
  color: var(--w-muted);
  line-height: 1.3;
}

.fb-cat.is-active {
  border-color: var(--w-emerald);
  background: var(--w-emerald);
  color: #fff;
}

.fb-cat.is-active span {
  color: rgba(209, 250, 229, 0.9);
}

.fb-textarea {
  min-height: 104px;
  resize: vertical;
  line-height: 1.5;
}

.fb-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.fb-counter {
  flex: none;
  font-size: 0.78rem;
  color: var(--w-muted);
  font-variant-numeric: tabular-nums;
}

.empty-box .w-help {
  margin: 0;
}

.fb-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fb-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 0;
}

.fb-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.fb-cat-tag {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--w-emerald);
  background: var(--w-emerald-soft);
  padding: 3px 9px;
  border-radius: 999px;
}

.fb-item-time {
  margin: 0;
  font-size: 0.78rem;
  color: var(--w-muted);
}

.fb-item-msg {
  margin: 0;
  font-size: 0.93rem;
  line-height: 1.55;
  color: var(--w-ink);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.fb-reply {
  margin-top: 4px;
  padding: 12px 14px;
  border-radius: 13px;
  background: linear-gradient(160deg, #f1f9f4, #e5f3eb);
  border: 1px solid rgba(10, 92, 64, 0.2);
}

.fb-reply-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.fb-reply-head strong {
  font-size: 0.84rem;
  font-weight: 800;
  color: var(--w-emerald);
}

.fb-reply-head span {
  font-size: 0.76rem;
  color: var(--w-body);
}

.fb-reply-body {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--w-ink);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.fb-noted {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 2px 0 0;
  padding: 8px 11px;
  border-radius: 10px;
  background: #f3f7f4;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.45;
  color: var(--w-emerald);
}

.fb-noted svg {
  flex: none;
  margin-top: 2px;
}
</style>
