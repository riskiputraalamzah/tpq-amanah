<template>
  <div>
    <router-link to="/wali" class="w-back">← Beranda</router-link>
    <h1 class="w-title">Saran &amp; Kritik</h1>
    <p class="w-lead">
      Sampaikan saran, kritik, atau kendala Bapak/Ibu agar aplikasi dan pelayanan TPQ Amanah menjadi semakin baik.
    </p>

    <form class="w-card fb-form" novalidate @submit.prevent="submitFeedback">
      <div class="w-field">
        <label id="fb-cat-label">Topik masukan</label>
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

      <div class="w-field">
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
    <div v-else-if="!items.length" class="w-card">
      <p class="w-help" style="margin: 0">Belum ada saran atau kritik yang dikirim.</p>
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
          ✓ Masukan Bapak/Ibu sudah dicatat dan ditindaklanjuti oleh pengurus TPQ. Jazakumullahu khairan.
        </p>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { timeAgo, fullDateTime } from '@/utils/timeAgo'

const toast = useToast()

const CATEGORIES = [
  { value: 'aplikasi', label: 'Aplikasi & Portal Wali', hint: 'Kemudahan, fitur, atau kendala di HP' },
  { value: 'kbm', label: 'Kegiatan Belajar & Mengajar', hint: 'KBM, jadwal, materi, atau kehadiran' },
  { value: 'pelayanan', label: 'Pelayanan & Komunikasi TPQ', hint: 'Informasi, administrasi, pengumuman' },
  { value: 'lainnya', label: 'Lainnya', hint: 'Masukan umum untuk TPQ Amanah' },
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
const loading = ref(true)
const formError = ref('')
const sentNotice = ref('')
const items = ref([])
const now = ref(new Date())
let clockTimer = null

const categoryLabel = (val) => CATEGORIES.find((c) => c.value === val)?.label || 'Lainnya'
const statusInfo = (st) => STATUS_MAP[st] || STATUS_MAP.open

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/wali-feedback/mine', { cache: false })
    items.value = Array.isArray(data) ? data : []
  } catch (err) {
    toast.error(err.response?.data?.error || 'Riwayat masukan belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

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
    items.value = [data, ...items.value]
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
  load()
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
.w-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 0.88rem;
  font-weight: 700;
  color: #0a5c40;
  text-decoration: none;
}

.fb-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.fb-cats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 6px;
}

@media (max-width: 420px) {
  .fb-cats {
    grid-template-columns: 1fr;
  }
}

.fb-cat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1.5px solid rgba(11, 59, 42, 0.14);
  background: #fbf9f3;
  color: #0b3b2a;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.fb-cat strong {
  font-size: 0.88rem;
  font-weight: 800;
}

.fb-cat span {
  font-size: 0.76rem;
  color: #5b6b62;
  line-height: 1.35;
}

.fb-cat.is-active {
  border-color: #0a5c40;
  background: #e6f4ec;
}

.fb-textarea {
  min-height: 108px;
  resize: vertical;
  line-height: 1.5;
}

.fb-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.fb-counter {
  font-size: 0.78rem;
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
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
  color: #0a5c40;
  background: #e6f4ec;
  padding: 3px 9px;
  border-radius: 999px;
}

.fb-item-time {
  margin: 0;
  font-size: 0.78rem;
  color: #5b6b62;
}

.fb-item-msg {
  margin: 0;
  font-size: 0.94rem;
  line-height: 1.55;
  color: #0b3b2a;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.fb-reply {
  margin-top: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(160deg, #f1f9f4, #e5f3eb);
  border: 1px solid rgba(10, 92, 64, 0.22);
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
  color: #0a5c40;
}

.fb-reply-head span {
  font-size: 0.76rem;
  color: #475a50;
}

.fb-reply-body {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: #0b3b2a;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.fb-noted {
  margin: 2px 0 0;
  padding: 8px 11px;
  border-radius: 10px;
  background: #f3f7f4;
  font-size: 0.82rem;
  font-weight: 600;
  color: #0a5c40;
}
</style>
