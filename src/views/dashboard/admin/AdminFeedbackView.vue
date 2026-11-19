<template>
  <div class="fb">
    <header class="fb-head">
      <div>
        <h1>Saran &amp; Kritik Wali</h1>
        <p>Masukan dari wali santri untuk menjadikan platform dan pelayanan TPQ Amanah lebih baik.</p>
      </div>
    </header>

    <section class="fb-summary" aria-label="Ringkasan masukan">
      <div><strong>{{ items.length }}</strong><span>total masukan</span></div>
      <div :class="{ 'is-attn': counts.open }"><strong>{{ counts.open }}</strong><span>belum diproses</span></div>
      <div><strong>{{ counts.replied }}</strong><span>ditanggapi</span></div>
      <div><strong>{{ counts.done }}</strong><span>dicatat / selesai</span></div>
    </section>

    <PageSkeleton v-if="loading" :rows="4" label="Memuat saran & kritik wali" />
    <p v-else-if="loadError" class="fb-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else>
      <div class="fb-filters">
        <label class="sr-only" for="fb-cat">Topik</label>
        <select id="fb-cat" v-model="categoryFilter" class="fb-input">
          <option value="">Semua topik</option>
          <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
        <label class="sr-only" for="fb-search">Cari masukan</label>
        <input id="fb-search" v-model="search" class="fb-input" placeholder="Cari nama wali, santri, atau isi masukan…" />
      </div>

      <div class="fb-chips" role="group" aria-label="Saring status">
        <button
          v-for="f in STATUS_FILTERS"
          :key="f.value"
          type="button"
          class="fb-chip"
          :aria-pressed="statusFilter === f.value"
          @click="statusFilter = f.value"
        >
          {{ f.label }} <span>{{ countFor(f.value) }}</span>
        </button>
      </div>

      <div class="fb-sort" role="group" aria-label="Urutkan">
        <span class="fb-sort-label">Urutkan</span>
        <button
          v-for="s in SORTS"
          :key="s.value"
          type="button"
          class="fb-chip"
          :aria-pressed="sortDir === s.value"
          @click="sortDir = s.value"
        >
          {{ s.label }}
        </button>
      </div>

      <div v-if="!visibleItems.length" class="fb-empty">
        <p class="fb-empty-title">
          {{ items.length ? 'Tidak ada masukan yang cocok dengan saringan ini.' : 'Belum ada saran atau kritik dari wali santri.' }}
        </p>
        <p v-if="!items.length" class="fb-sub">
          Masukan yang dikirim wali dari menu Saran &amp; Kritik di portal wali akan muncul di sini.
        </p>
      </div>

      <ul v-else class="fb-list">
        <li v-for="item in visibleItems" :key="item.id" class="fb-card" :class="{ 'is-open': item.status === 'open' }">
          <div class="fb-card-top">
            <div class="fb-who">
              <strong>{{ item.waliName || 'Wali santri' }}</strong>
              <span class="fb-sub">
                WA {{ displayPhone(item.phone) }}
                <template v-if="item.santri?.length"> · Wali dari {{ santriSummary(item.santri) }}</template>
              </span>
            </div>
            <div class="fb-badges">
              <span class="fb-cat-pill">{{ item.categoryLabel || categoryLabel(item.category) }}</span>
              <span class="fb-pill" :class="`is-${statusInfo(item.status).tone}`">{{ statusInfo(item.status).label }}</span>
            </div>
          </div>

          <p class="fb-time">
            Dikirim <time :title="fullDateTime(item.createdAt)">{{ timeAgo(item.createdAt, now) }}</time>
          </p>

          <p class="fb-body">{{ item.message }}</p>

          <div v-if="item.reply && item.reply.text" class="fb-reply-box">
            <div class="fb-reply-head">
              <strong>Tanggapan Pengurus ({{ item.reply.byName || 'Admin TPQ' }})</strong>
              <span>
                <template v-if="item.reply.at">
                  <time :title="fullDateTime(item.reply.at)">{{ timeAgo(item.reply.at, now) }}</time>
                </template>
                <template v-if="item.reply.sentWa"> · Terkirim ke WA wali</template>
              </span>
            </div>
            <p class="fb-reply-text">{{ item.reply.text }}</p>
          </div>
          <p v-else-if="item.status === 'noted' || item.status === 'done'" class="fb-sub fb-noted-line">
            Ditandai {{ statusInfo(item.status).label.toLowerCase() }}
            <template v-if="item.resolvedByName"> oleh {{ item.resolvedByName }}</template>
            <template v-if="item.resolvedAt"> · <time :title="fullDateTime(item.resolvedAt)">{{ timeAgo(item.resolvedAt, now) }}</time></template>
          </p>

          <div class="fb-actions">
            <button type="button" class="fb-btn fb-btn-primary" :disabled="busyId === item.id" @click="openReply(item)">
              {{ item.reply?.text ? 'Ubah tanggapan' : 'Beri tanggapan' }}
            </button>
            <button
              v-if="item.status === 'open'"
              type="button"
              class="fb-btn fb-btn-ghost"
              :disabled="busyId === item.id"
              @click="quickStatus(item, 'noted')"
            >
              Tandai dicatat
            </button>
            <button
              v-if="item.status !== 'done'"
              type="button"
              class="fb-btn fb-btn-ghost"
              :disabled="busyId === item.id"
              @click="quickStatus(item, 'done')"
            >
              Tandai selesai
            </button>
            <button
              type="button"
              class="fb-btn fb-btn-ghost is-danger"
              :disabled="busyId === item.id"
              @click="removeItem(item)"
            >
              Hapus
            </button>
          </div>
        </li>
      </ul>
    </template>

    <!-- Sheet: Beri tanggapan ke wali -->
    <Teleport to="body">
      <div v-if="sheet" class="fb-overlay" @click.self="sheet = null" @keydown.esc="sheet = null">
        <section class="fb-sheet" role="dialog" aria-modal="true" aria-labelledby="fb-sheet-title">
          <header class="fb-sheet-head">
            <div>
              <h3 id="fb-sheet-title">Tanggapi masukan {{ sheet.item.waliName || 'Wali santri' }}</h3>
              <span class="fb-sub">
                {{ sheet.item.categoryLabel || categoryLabel(sheet.item.category) }} ·
                <time :title="fullDateTime(sheet.item.createdAt)">{{ timeAgo(sheet.item.createdAt, now) }}</time>
              </span>
            </div>
            <button type="button" class="fb-close" aria-label="Tutup" @click="sheet = null">
              <LineIcon name="x" :size="18" />
            </button>
          </header>

          <form class="fb-sheet-body" @submit.prevent="submitReply">
            <div class="fb-quote-box">
              <p class="fb-quote-who">
                <strong>{{ sheet.item.waliName || 'Wali santri' }}</strong>
                <template v-if="sheet.item.santri?.length"> ({{ santriSummary(sheet.item.santri) }})</template>
              </p>
              <p class="fb-quote-text">"{{ sheet.item.message }}"</p>
            </div>

            <div class="fb-field">
              <span class="fb-label">Template cepat</span>
              <div class="fb-templates">
                <button
                  v-for="(tpl, idx) in QUICK_TEMPLATES"
                  :key="idx"
                  type="button"
                  class="fb-tpl-btn"
                  @click="sheet.replyText = tpl.text"
                >
                  {{ tpl.label }}
                </button>
              </div>
            </div>

            <label class="fb-field" for="fb-reply-input">
              <span class="fb-label">Tanggapan untuk wali</span>
              <textarea
                id="fb-reply-input"
                v-model="sheet.replyText"
                class="fb-input fb-textarea"
                rows="4"
                maxlength="1000"
                placeholder="Tulis tanggapan yang sopan dan jelas untuk Bapak/Ibu wali santri…"
                required
              ></textarea>
              <small class="fb-sub">{{ sheet.replyText.trim().length }}/1000 · tampil di halaman Saran &amp; Kritik wali</small>
            </label>

            <div class="fb-field">
              <span class="fb-label">Status setelah ditanggapi</span>
              <div class="fb-chips">
                <button
                  type="button"
                  class="fb-chip"
                  :aria-pressed="sheet.status === 'replied'"
                  @click="sheet.status = 'replied'"
                >
                  Ditanggapi
                </button>
                <button
                  type="button"
                  class="fb-chip"
                  :aria-pressed="sheet.status === 'done'"
                  @click="sheet.status = 'done'"
                >
                  Selesai ditindaklanjuti
                </button>
              </div>
            </div>

            <label class="fb-check">
              <input v-model="sheet.sendWa" type="checkbox" />
              <span>
                Kirim juga tanggapan ini lewat <strong>WA bot TPQ</strong> ke nomor wali ({{ displayPhone(sheet.item.phone) }})
              </span>
            </label>

            <p v-if="sheetError" class="fb-note is-danger" role="alert">{{ sheetError }}</p>

            <div class="fb-sheet-actions">
              <button type="button" class="fb-btn fb-btn-ghost" :disabled="savingReply" @click="sheet = null">Batal</button>
              <button
                type="submit"
                class="fb-btn fb-btn-primary"
                :disabled="savingReply || sheet.replyText.trim().length < 3"
              >
                {{ savingReply ? 'Menyimpan…' : sheet.sendWa ? 'Simpan & kirim WA' : 'Simpan tanggapan' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import LineIcon from '@/components/LineIcon.vue'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { useWaliFeedbackBadge } from '@/composables/useWaliFeedbackBadge'
import { displayPhone } from '@/utils/santriProfile'
import { timeAgo, fullDateTime, timeOf } from '@/utils/timeAgo'

const { success: showSuccess, error: showError } = useToast()
const { ask } = useDialog()
const { refresh: refreshFeedbackBadge } = useWaliFeedbackBadge()

const CATEGORIES = [
  { value: 'aplikasi', label: 'Aplikasi & Portal Wali' },
  { value: 'kbm', label: 'Kegiatan Belajar & Mengajar' },
  { value: 'pelayanan', label: 'Pelayanan & Komunikasi TPQ' },
  { value: 'lainnya', label: 'Lainnya' },
]

const STATUS_MAP = {
  open: { label: 'Belum diproses', tone: 'warn' },
  noted: { label: 'Sudah dicatat', tone: 'info' },
  replied: { label: 'Ditanggapi', tone: 'ok' },
  done: { label: 'Selesai', tone: 'ok' },
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'open', label: 'Belum diproses' },
  { value: 'replied', label: 'Ditanggapi' },
  { value: 'noted', label: 'Sudah dicatat' },
  { value: 'done', label: 'Selesai' },
]

const SORTS = [
  { value: 'desc', label: 'Terbaru' },
  { value: 'asc', label: 'Terlama' },
]

const QUICK_TEMPLATES = [
  {
    label: 'Terima kasih & ditindaklanjuti',
    text: 'Jazakumullahu khairan Bapak/Ibu atas saran dan masukannya. Masukan ini sangat berharga bagi kami dan segera kami tindak lanjuti demi kebaikan bersama di TPQ Amanah.',
  },
  {
    label: 'Kendala sudah diperbaiki',
    text: 'Alhamdulillah, terima kasih atas laporannya Bapak/Ibu. Kendala tersebut sudah kami perbaiki. Silakan dicoba kembali di portal wali. Jazakumullahu khairan.',
  },
  {
    label: 'Masukan dicatat untuk evaluasi',
    text: 'Jazakumullahu khairan atas perhatian dan masukan Bapak/Ibu. Sudah kami catat sebagai bahan evaluasi pengurus dan asatidz TPQ Amanah.',
  },
]

const loading = ref(true)
const loadError = ref('')
const items = ref([])
const categoryFilter = ref('')
const statusFilter = ref('all')
const search = ref('')
const sortDir = ref('desc')
const busyId = ref('')
const sheet = ref(null)
const sheetError = ref('')
const savingReply = ref(false)
const now = ref(new Date())
let clockTimer = null

const categoryLabel = (val) => CATEGORIES.find((c) => c.value === val)?.label || 'Lainnya'
const statusInfo = (st) => STATUS_MAP[st] || STATUS_MAP.open
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : '')
const santriSummary = (list) =>
  (list || [])
    .map((s) => `${s.name}${s.classId ? ` (${levelName(s.classId)})` : ''}`)
    .join(', ')

const counts = computed(() => ({
  open: items.value.filter((x) => x.status === 'open').length,
  replied: items.value.filter((x) => x.status === 'replied').length,
  done: items.value.filter((x) => x.status === 'noted' || x.status === 'done').length,
}))

const filteredByCategory = computed(() =>
  items.value.filter((x) => !categoryFilter.value || x.category === categoryFilter.value),
)

const matchStatus = (x, f) => (f === 'all' ? true : x.status === f)
const countFor = (f) => filteredByCategory.value.filter((x) => matchStatus(x, f)).length

const visibleItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  const dir = sortDir.value === 'asc' ? 1 : -1
  return filteredByCategory.value
    .filter((x) => {
      if (!matchStatus(x, statusFilter.value)) return false
      if (!q) return true
      const hay = [
        x.waliName,
        x.phone,
        x.message,
        x.reply?.text,
        ...(x.santri || []).map((s) => s.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
    .sort((a, b) => dir * (timeOf(a.createdAt) - timeOf(b.createdAt)))
})

async function load({ quiet = false } = {}) {
  if (!quiet) loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/wali-feedback/admin', { cache: false })
    items.value = Array.isArray(data) ? data : []
    refreshFeedbackBadge({ force: true })
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Data masukan belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

function openReply(item) {
  sheetError.value = ''
  sheet.value = {
    item,
    replyText: item.reply?.text || '',
    status: item.status === 'done' ? 'done' : 'replied',
    sendWa: !item.reply?.sentWa,
  }
}

async function submitReply() {
  if (!sheet.value) return
  savingReply.value = true
  sheetError.value = ''
  try {
    const { item, replyText, status, sendWa } = sheet.value
    const { data } = await api.post(`/wali-feedback/admin/${item.id}/respond`, {
      replyText,
      status,
      sendWa,
    })
    items.value = items.value.map((x) => (x.id === item.id ? data : x))
    sheet.value = null
    refreshFeedbackBadge({ force: true })
    showSuccess(sendWa ? 'Tanggapan disimpan & masuk antrean WA bot ke wali' : 'Tanggapan disimpan ke portal wali')
  } catch (err) {
    sheetError.value = err.response?.data?.error || 'Gagal menyimpan tanggapan.'
  } finally {
    savingReply.value = false
  }
}

async function quickStatus(item, status) {
  busyId.value = item.id
  try {
    const { data } = await api.post(`/wali-feedback/admin/${item.id}/respond`, { status })
    items.value = items.value.map((x) => (x.id === item.id ? data : x))
    refreshFeedbackBadge({ force: true })
    showSuccess(status === 'noted' ? 'Masukan ditandai sudah dicatat' : 'Masukan ditandai selesai')
  } catch (err) {
    showError(err.response?.data?.error || 'Belum bisa memperbarui status')
  } finally {
    busyId.value = ''
  }
}

async function removeItem(item) {
  const ok = await ask({
    title: 'Hapus masukan ini?',
    message: `Masukan dari ${item.waliName || 'wali santri'} akan dihapus permanen.`,
    tone: 'danger',
    confirmText: 'Hapus',
    cancelText: 'Batal',
  })
  if (!ok) return
  busyId.value = item.id
  try {
    await api.delete(`/wali-feedback/admin/${item.id}`)
    items.value = items.value.filter((x) => x.id !== item.id)
    refreshFeedbackBadge({ force: true })
    showSuccess('Masukan dihapus')
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menghapus masukan')
  } finally {
    busyId.value = ''
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
.fb-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.fb-head h1 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.fb-head p {
  margin: 0;
  color: var(--lp-body, #475a50);
}

.fb-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 14px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  overflow: hidden;
}

@media (max-width: 640px) {
  .fb-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.fb-summary > div {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
}

.fb-summary > div + div {
  border-left: 1px solid rgba(11, 59, 42, 0.08);
}

.fb-summary strong {
  font-size: 1.35rem;
  color: var(--lp-ink, #0b3b2a);
  font-variant-numeric: tabular-nums;
}

.fb-summary span {
  font-size: 0.78rem;
  color: #5b6b62;
}

.fb-summary .is-attn {
  background: #fffbeb;
}

.fb-summary .is-attn strong {
  color: #7c3a0d;
}

.fb-filters {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

@media (max-width: 640px) {
  .fb-filters {
    grid-template-columns: 1fr;
  }
}

.fb-input {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  box-sizing: border-box;
}

.fb-textarea {
  min-height: 105px;
  resize: vertical;
  line-height: 1.5;
}

.fb-chips,
.fb-sort {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.fb-sort-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #5b6b62;
  margin-right: 2px;
}

.fb-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.14);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

.fb-chip span {
  font-size: 0.76rem;
  opacity: 0.75;
}

.fb-chip[aria-pressed='true'] {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.fb-empty {
  padding: 28px 18px;
  border-radius: 16px;
  background: #fff;
  border: 1px dashed rgba(11, 59, 42, 0.2);
  text-align: center;
}

.fb-empty-title {
  margin: 0 0 4px;
  font-weight: 700;
  color: #0b3b2a;
}

.fb-sub {
  font-size: 0.82rem;
  color: #5b6b62;
}

.fb-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.fb-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 15px 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.fb-card.is-open {
  border-color: rgba(217, 119, 6, 0.35);
  background: #fffdf8;
}

.fb-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.fb-who {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fb-who strong {
  font-size: 1rem;
  color: #0b3b2a;
}

.fb-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.fb-cat-pill {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  background: #eef6f1;
  color: #0a5c40;
}

.fb-pill {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.fb-pill.is-warn {
  background: #fef3c7;
  color: #92400e;
}

.fb-pill.is-info {
  background: #e0f2fe;
  color: #075985;
}

.fb-pill.is-ok {
  background: #dcfce7;
  color: #166534;
}

.fb-time {
  margin: 0;
  font-size: 0.78rem;
  color: #5b6b62;
}

.fb-body {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: #0b3b2a;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.fb-reply-box {
  padding: 11px 13px;
  border-radius: 12px;
  background: #f1f8f4;
  border: 1px solid rgba(10, 92, 64, 0.18);
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
  font-size: 0.82rem;
  color: #0a5c40;
}

.fb-reply-head span {
  font-size: 0.76rem;
  color: #5b6b62;
}

.fb-reply-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #0b3b2a;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.fb-noted-line {
  margin: 0;
}

.fb-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
}

.fb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 13px;
  border-radius: 10px;
  border: 1px solid transparent;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.fb-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.fb-btn-primary {
  background: #0a5c40;
  color: #fff;
}

.fb-btn-ghost {
  background: #fff;
  border-color: rgba(11, 59, 42, 0.18);
  color: #0b3b2a;
}

.fb-btn-ghost.is-danger {
  color: #991b1b;
  border-color: rgba(153, 27, 27, 0.22);
}

.fb-note {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.86rem;
  background: #eef6f1;
  color: #0b3b2a;
}

.fb-note.is-danger {
  background: #fdecea;
  color: #7a1810;
}

/* Modal sheet */
.fb-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(3, 28, 19, 0.52);
}

.fb-sheet {
  width: min(560px, 100%);
  max-height: min(88dvh, 720px);
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  background: #fbf9f3;
  border: 1px solid rgba(11, 59, 42, 0.14);
  overflow: hidden;
  box-shadow: 0 24px 54px -18px rgba(0, 0, 0, 0.45);
}

.fb-sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.fb-sheet-head h3 {
  margin: 0 0 2px;
  font-size: 1.08rem;
  font-weight: 800;
  color: #0b3b2a;
}

.fb-close {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: rgba(11, 59, 42, 0.06);
  color: #0b3b2a;
  cursor: pointer;
}

.fb-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
}

.fb-quote-box {
  padding: 11px 13px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.fb-quote-who {
  margin: 0 0 4px;
  font-size: 0.82rem;
  color: #475a50;
}

.fb-quote-text {
  margin: 0;
  font-size: 0.92rem;
  color: #0b3b2a;
  line-height: 1.5;
  white-space: pre-wrap;
}

.fb-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.fb-label {
  font-size: 0.84rem;
  font-weight: 700;
  color: #0b3b2a;
}

.fb-templates {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fb-tpl-btn {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid rgba(10, 92, 64, 0.22);
  background: #eef6f1;
  color: #0a5c40;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.fb-tpl-btn:hover {
  background: #dfeee5;
}

.fb-check {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.86rem;
  color: #0b3b2a;
  line-height: 1.4;
}

.fb-check input {
  margin-top: 3px;
}

.fb-sheet-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
</style>
