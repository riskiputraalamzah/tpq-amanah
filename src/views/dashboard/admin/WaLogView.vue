<template>
  <div class="wl" :class="{ 'is-guru': isGuru }">
    <header class="wl-head">
      <div>
        <h1>Riwayat WA Bot</h1>
        <p>Pesan yang dikirim bot WhatsApp TPQ: ke siapa, kapan, untuk apa, dan berhasil atau tidak.</p>
      </div>
      <button type="button" class="wl-btn" :disabled="loading" @click="refresh">
        <LineIcon name="refresh" :size="16" /> {{ loading ? 'Memuat…' : 'Muat ulang' }}
      </button>
    </header>

    <!-- the last 14 days: pick a day; failures stand out -->
    <nav class="wl-days" aria-label="Pilih hari">
      <button v-for="d in days" :key="d.day" type="button" class="wl-day" :class="{ 'is-active': d.day === selectedDay, 'is-empty': !d.total }"
        :aria-pressed="d.day === selectedDay" @click="selectDay(d.day)">
        <span class="wl-day-name">{{ dayShort(d.day) }}</span>
        <strong>{{ d.total }}</strong>
        <span class="wl-day-sub" :class="{ 'is-failed': d.failed }">{{ d.failed ? `${d.failed} gagal` : 'pesan' }}</span>
      </button>
    </nav>

    <section class="wl-card" aria-labelledby="wl-day-title">
      <div class="wl-day-head">
        <div>
          <h2 id="wl-day-title">{{ longDay(selectedDay) }}</h2>
          <p v-if="data" class="wl-sub">
            {{ data.summary.total }} pesan · {{ data.summary.sent }} terkirim
            <template v-if="data.summary.failed"> · <span class="wl-failed-text">{{ data.summary.failed }} gagal</span></template>
          </p>
        </div>
        <label class="wl-date">
          <span class="sr-only">Pilih tanggal lain</span>
          <input type="date" class="wl-input" :value="selectedDay" :max="today" @change="selectDay($event.target.value)" />
        </label>
      </div>

      <div class="wl-filters">
        <label class="sr-only" for="wl-search">Cari nama atau nomor</label>
        <input id="wl-search" v-model="search" class="wl-input" placeholder="Cari nama atau nomor" />
        <div class="wl-chips" role="group" aria-label="Saring jenis pesan">
          <button type="button" class="wl-chip" :aria-pressed="category === ''" @click="category = ''">Semua <span>{{ data?.summary.total || 0 }}</span></button>
          <button v-for="c in presentCategories" :key="c" type="button" class="wl-chip" :aria-pressed="category === c" @click="category = c">
            {{ CATEGORY[c] || c }} <span>{{ data.summary.byCategory[c] }}</span>
          </button>
          <button v-if="data?.summary.failed" type="button" class="wl-chip is-failed" :aria-pressed="onlyFailed" @click="onlyFailed = !onlyFailed">
            Hanya yang gagal <span>{{ data.summary.failed }}</span>
          </button>
        </div>
      </div>

      <PageSkeleton v-if="loading && !data" :rows="6" label="Memuat riwayat WA" />
      <p v-else-if="loadError" class="wl-note is-danger" role="alert">{{ loadError }}</p>
      <p v-else-if="!visible.length" class="wl-empty">
        {{ data?.summary.total ? 'Tidak ada pesan yang cocok dengan saringan.' : 'Bot tidak mengirim pesan di hari ini.' }}
      </p>
      <ul v-else class="wl-list">
        <li v-for="r in shown" :key="r.id" class="wl-row" :class="{ 'is-failed': r.status === 'failed' }">
          <button type="button" class="wl-row-btn" :aria-expanded="open === r.id" @click="open = open === r.id ? null : r.id">
            <span class="wl-time">{{ timeOf(r.at) }}</span>
            <span class="wl-main">
              <strong>{{ r.name || 'Tanpa nama' }}</strong>
              <span class="wl-number">{{ displayPhone(r.number) }}</span>
              <span class="wl-what">
                <span class="wl-pill" :class="`is-${r.category}`">{{ CATEGORY[r.category] || r.category }}</span>
                <span v-if="r.label" class="wl-label">{{ r.label }}</span>
              </span>
            </span>
            <span class="wl-status" :class="r.status === 'sent' ? 'is-sent' : 'is-failed'">{{ r.status === 'sent' ? 'Terkirim' : 'Gagal' }}</span>
          </button>
          <div v-if="open === r.id" class="wl-detail">
            <p v-if="r.status === 'failed'" class="wl-note is-danger">Gagal setelah {{ r.attempts }}x percobaan<template v-if="r.error">: {{ r.error }}</template></p>
            <p v-else-if="r.attempts > 1" class="wl-sub">Terkirim pada percobaan ke-{{ r.attempts }}.</p>
            <p class="wl-preview">{{ r.preview || '(tanpa isi)' }}</p>
          </div>
        </li>
      </ul>
      <button v-if="visible.length > limit" type="button" class="wl-btn wl-more" @click="limit += PAGE">
        Tampilkan {{ Math.min(PAGE, visible.length - limit) }} lagi
      </button>
    </section>

    <p class="wl-foot">Riwayat disimpan 90 hari. Isi kode masuk wali tidak pernah disimpan.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import LineIcon from '@/components/LineIcon.vue'
import { displayPhone } from '@/utils/santriProfile'
import { useAuthStore } from '@/stores/auth'

// the guru layout has its own top bar: no room for the admin's floating menu button
const isGuru = useAuthStore().user?.role === 'guru'

const CATEGORY = {
  guru: 'Guru',
  pengumuman: 'Pengumuman',
  broadcast: 'Broadcast',
  wali_kode: 'Kode masuk wali',
  wali_alfa: 'Kabar alfa',
  pendaftaran: 'Pendaftaran',
  tes: 'Tes',
  lainnya: 'Lainnya',
}
const CATEGORY_ORDER = Object.keys(CATEGORY)
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const PAGE = 100

const wibDay = (d = new Date()) => new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10)
const today = wibDay()
const parts = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number)
  return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }
}
const dayShort = (iso) => {
  const { d, wd } = parts(iso)
  return iso === today ? 'Hari ini' : `${DAYS[wd].slice(0, 3)} ${d}`
}
const longDay = (iso) => {
  const { y, m, d, wd } = parts(iso)
  return `${DAYS[wd]}, ${d} ${MONTHS[m - 1]} ${y}`
}
const timeOf = (iso) => (iso ? new Date(new Date(iso).getTime() + 7 * 3600 * 1000).toISOString().slice(11, 16) : '')

const days = ref([])
const selectedDay = ref(today)
const data = ref(null)
const loading = ref(false)
const loadError = ref('')
const search = ref('')
const category = ref('')
const onlyFailed = ref(false)
const open = ref(null)
const limit = ref(PAGE)

const presentCategories = computed(() => CATEGORY_ORDER.filter((c) => data.value?.summary.byCategory[c]))
const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  const qDigits = q.replace(/\D/g, '').replace(/^0/, '')
  return (data.value?.rows || []).filter((r) =>
    (!category.value || r.category === category.value)
    && (!onlyFailed.value || r.status === 'failed')
    && (!q || r.name.toLowerCase().includes(q) || (qDigits.length >= 3 && r.number.includes(qDigits))))
})
const shown = computed(() => visible.value.slice(0, limit.value))
watch([search, category, onlyFailed], () => { limit.value = PAGE })

async function loadDays() {
  try {
    const { data: d } = await api.get('/wa-log/days', { params: { days: 14 }, cache: false })
    days.value = d || []
  } catch {
    days.value = []
  }
}
async function loadDay() {
  loading.value = true
  loadError.value = ''
  try {
    const { data: d } = await api.get('/wa-log', { params: { day: selectedDay.value }, cache: false })
    data.value = d
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Riwayat belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}
function selectDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > today) return
  selectedDay.value = day
  category.value = ''
  onlyFailed.value = false
  open.value = null
  limit.value = PAGE
  loadDay()
}
function refresh() {
  loadDays()
  loadDay()
}

// today's list refreshes by itself while the page is open and visible
let timer = null
onMounted(() => {
  refresh()
  timer = setInterval(() => {
    if (selectedDay.value === today && !document.hidden && !loading.value) refresh()
  }, 60 * 1000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.wl {
  --ink: #0b3b2a;
  --body: #475a50;
  --muted: #5b6b62;
  --emerald: #0a5c40;
  --line: rgba(11, 59, 42, 0.12);
  padding-top: 60px;
  color: var(--ink);
}

@media (min-width: 1024px) {
  .wl {
    padding-top: 0;
  }
}

.wl.is-guru {
  padding-top: 0;
}

.wl-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.wl-head h1 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  font-weight: 800;
}

.wl-head p {
  margin: 0;
  color: var(--body);
}

.wl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.wl-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.wl-btn:focus-visible,
.wl-day:focus-visible,
.wl-chip:focus-visible,
.wl-row-btn:focus-visible,
.wl-input:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

/* the days strip scrolls inside itself on a phone */
.wl-days {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 2px 8px;
  margin-bottom: 8px;
  scrollbar-width: thin;
}

.wl-day {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 76px;
  padding: 10px 8px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  font: inherit;
  cursor: pointer;
}

.wl-day strong {
  font-size: 1.3rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.wl-day-name,
.wl-day-sub {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
}

.wl-day-sub.is-failed {
  color: #b42318;
}

.wl-day.is-empty strong {
  color: #9aa6a0;
}

.wl-day.is-active {
  border-color: var(--emerald);
  background: #e3f1ea;
  box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.12);
}

.wl-card {
  padding: 16px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid var(--line);
}

.wl-day-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.wl-day-head h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
}

.wl-sub {
  margin: 2px 0 0;
  font-size: 0.88rem;
  color: var(--body);
}

.wl-failed-text {
  color: #b42318;
  font-weight: 700;
}

.wl-input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  color: var(--ink);
  box-sizing: border-box;
}

.wl-date .wl-input {
  width: auto;
}

.wl-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.wl-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.wl-chip {
  min-height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.wl-chip span {
  margin-left: 4px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.wl-chip[aria-pressed="true"] {
  background: var(--emerald);
  border-color: var(--emerald);
  color: #fff;
}

.wl-chip[aria-pressed="true"] span {
  color: #d9efe4;
}

.wl-chip.is-failed {
  border-color: rgba(180, 35, 24, 0.35);
  color: #b42318;
}

.wl-chip.is-failed[aria-pressed="true"] {
  background: #b42318;
  border-color: #b42318;
  color: #fff;
}

.wl-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.wl-row + .wl-row {
  border-top: 1px solid var(--line);
}

.wl-row-btn {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: start;
  gap: 10px;
  width: 100%;
  padding: 12px 4px;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.wl-row-btn:hover {
  background: #f7faf8;
}

.wl-time {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.wl-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.wl-main strong {
  overflow-wrap: anywhere;
}

.wl-number {
  font-size: 0.85rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.wl-what {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.wl-label {
  font-size: 0.85rem;
  color: var(--body);
  overflow-wrap: anywhere;
}

.wl-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: #eef0ef;
  color: #4b5a52;
  white-space: nowrap;
}

.wl-pill.is-guru { background: #e3f1ea; color: #0a5c40; }
.wl-pill.is-pengumuman { background: #e6f0fb; color: #1d4f8a; }
.wl-pill.is-broadcast { background: #efe9fb; color: #5b3a9a; }
.wl-pill.is-wali_kode { background: #fef3c7; color: #7c3a0d; }
.wl-pill.is-wali_alfa { background: #fdecea; color: #8e1b12; }
.wl-pill.is-pendaftaran { background: #fef3c7; color: #7c3a0d; }

.wl-status {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.wl-status.is-sent { background: #e3f1ea; color: #0a5c40; }
.wl-status.is-failed { background: #fdecea; color: #8e1b12; }

.wl-detail {
  margin: 0 4px 12px 66px;
}

.wl-preview {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f4f8f5;
  border: 1px solid var(--line);
  font-size: 0.88rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.wl-note {
  margin: 0 0 8px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.88rem;
}

.wl-note.is-danger {
  background: #fdecea;
  color: #7a1810;
}

.wl-empty {
  margin: 0;
  padding: 24px 8px;
  text-align: center;
  color: var(--body);
}

.wl-more {
  width: 100%;
  margin-top: 10px;
}

.wl-foot {
  margin: 12px 0 0;
  text-align: center;
  font-size: 0.82rem;
  color: var(--muted);
}

@media (max-width: 640px) {
  .wl-row-btn {
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .wl-status {
    grid-column: 2;
    justify-self: start;
  }

  .wl-detail {
    margin-left: 4px;
  }

  .wl-date {
    width: 100%;
  }

  .wl-date .wl-input {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>
