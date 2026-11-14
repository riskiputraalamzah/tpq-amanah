<template>
  <div class="as" :class="{ 'is-admin': isAdmin }">
    <header class="as-head">
      <h1>Absen Santri</h1>
      <p>Catat santri yang datang di sesi ini, dari jilid mana pun. Dipakai untuk KBM dan portal wali, walau guru jilidnya berhalangan.</p>
    </header>

    <div class="as-controls">
      <div class="as-slots" role="group" aria-label="Sesi">
        <button v-for="s in SLOTS" :key="s.id" type="button" class="as-slot" :aria-pressed="slot === s.id" @click="setSlot(s.id)">
          {{ s.label }}
        </button>
      </div>
      <label class="as-date">
        <span class="sr-only">Tanggal</span>
        <input type="date" class="as-input" :value="date" :min="minDate" :max="today" @change="setDate($event.target.value)" />
      </label>
    </div>
    <p v-if="sheet && sheet.daysBack" class="as-hint">
      Guru bisa mengisi sampai {{ sheet.daysBack }} hari ke belakang. Hari yang lebih lama hanya bisa diubah admin.
    </p>

    <PageSkeleton v-if="loading && !sheet" :rows="6" label="Memuat daftar santri" />
    <p v-else-if="loadError" class="as-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else-if="sheet">
      <p v-if="!sheet.canEdit" class="as-note is-warn" role="status">
        {{ sheet.reason }}
        <router-link v-if="/absen kehadiran/.test(sheet.reason)" to="/dashboard/attendance" class="as-inline-link">Buka Absensi</router-link>
      </p>

      <!-- what is recorded, and whether it is saved -->
      <div class="as-summary" role="status" aria-live="polite">
        <span v-for="t in TALLY" :key="t.key" :class="`is-${t.key}`"><strong>{{ counts[t.key] }}</strong> {{ t.label }}</span>
        <span class="is-none"><strong>{{ counts.none }}</strong> belum dicatat</span>
        <span class="as-save" :class="`is-${saveState}`">{{ SAVE_TEXT[saveState] }}</span>
        <button v-if="saveState === 'error'" type="button" class="as-retry" @click="flush">Coba lagi</button>
      </div>

      <label class="sr-only" for="as-search">Cari nama santri</label>
      <input id="as-search" v-model="search" class="as-input as-search" placeholder="Cari nama santri (semua jilid)" />

      <section v-for="g in shownGroups" :key="g.classId" class="as-group" :aria-labelledby="`as-g-${g.classId}`">
        <div class="as-group-head">
          <button type="button" class="as-group-toggle" :aria-expanded="isOpen(g)" @click="toggle(g.classId)">
            <span :id="`as-g-${g.classId}`" class="as-group-name">{{ levelName(g.classId) }}</span>
            <span class="as-group-count">{{ g.recorded }}/{{ g.items.length }} dicatat</span>
            <span class="as-chevron" aria-hidden="true">{{ isOpen(g) ? '▾' : '▸' }}</span>
          </button>
          <button v-if="sheet.canEdit && isOpen(g) && g.recorded < g.items.length" type="button" class="as-all" @click="markRest(g)">
            Tandai sisanya hadir
          </button>
        </div>
        <ul v-if="isOpen(g)" class="as-list">
          <li v-for="s in g.items" :key="s.id" class="as-row">
            <div class="as-name">
              <strong>{{ s.name }}</strong>
              <span v-if="recordOf(s.id)?.byName" class="as-by">
                {{ recordOf(s.id).source === 'kbm' ? 'dari KBM' : 'oleh' }} {{ recordOf(s.id).byName }}
              </span>
            </div>
            <div class="as-choices" role="group" :aria-label="`Status ${s.name}`">
              <button v-for="st in STATUSES" :key="st.key" type="button" class="as-choice" :class="`is-${st.key}`"
                :aria-pressed="statusOf(s.id) === st.key" :disabled="!sheet.canEdit" @click="choose(s.id, st.key)">
                {{ st.label }}
              </button>
            </div>
          </li>
        </ul>
      </section>
      <p v-if="!shownGroups.length" class="as-empty">Tidak ada santri yang cocok.</p>

      <button v-if="!search && otherGroups.length" type="button" class="as-more" @click="showOthers = !showOthers">
        {{ showOthers ? 'Sembunyikan jilid lain' : `Santri jilid lain yang datang di sesi ini (${otherCount})` }}
      </button>
      <p class="as-foot">Ketuk status yang sama sekali lagi untuk menghapusnya. Santri yang tidak dicatat tidak dianggap alfa.</p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')

const SLOTS = [
  { id: 'wave_1', label: 'Sore' },
  { id: 'wave_2', label: 'Malam' },
]
const STATUSES = [
  { key: 'hadir', label: 'Hadir' },
  { key: 'izin', label: 'Izin' },
  { key: 'sakit', label: 'Sakit' },
  { key: 'alfa', label: 'Alfa' },
]
const TALLY = STATUSES.map((s) => ({ key: s.key, label: s.label.toLowerCase() }))
const SAVE_TEXT = { idle: '', saving: 'Menyimpan…', saved: 'Tersimpan ✓', error: 'Belum tersimpan' }

const wibNow = () => new Date(Date.now() + 7 * 3600 * 1000)
const today = wibNow().toISOString().slice(0, 10)
const defaultMin = new Date(Date.now() + 7 * 3600 * 1000 - 2 * 86400000).toISOString().slice(0, 10)
// the admin (or a guru given "Absen Santri tanpa batas hari") may open any past day
const minDate = computed(() => (sheet.value && sheet.value.daysBack === null ? undefined : defaultMin))
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')

const date = ref(today)
// from 17:00 WIB the malam sesi
const slot = ref(wibNow().toISOString().slice(11, 16) >= '17:00' ? 'wave_2' : 'wave_1')
const sheet = ref(null)
const records = ref({})
const loading = ref(false)
const loadError = ref('')
const search = ref('')
const showOthers = ref(false)
const opened = ref({})
const saveState = ref('idle')

const recordOf = (id) => records.value[id] || null
const statusOf = (id) => records.value[id]?.status || null

const groups = computed(() => {
  const map = new Map()
  for (const s of sheet.value?.santri || []) {
    if (!map.has(s.classId)) map.set(s.classId, [])
    map.get(s.classId).push(s)
  }
  return [...map.entries()].map(([classId, items]) => ({
    classId,
    items,
    recorded: items.filter((s) => statusOf(s.id)).length,
    own: (sheet.value?.defaultClassIds || []).includes(classId),
  }))
})
const otherGroups = computed(() => groups.value.filter((g) => !g.own))
const otherCount = computed(() => otherGroups.value.reduce((n, g) => n + g.items.length, 0))
const shownGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (q) {
    return groups.value
      .map((g) => ({ ...g, items: g.items.filter((s) => s.name.toLowerCase().includes(q)), searching: true }))
      .filter((g) => g.items.length)
  }
  // the sesi's own jilid, then (on request, or when someone of another jilid is already recorded) the others
  return groups.value.filter((g) => g.own || showOthers.value || g.recorded > 0)
})
const isOpen = (g) => g.searching || (opened.value[g.classId] ?? g.own)
const toggle = (classId) => {
  const g = groups.value.find((x) => x.classId === classId)
  opened.value = { ...opened.value, [classId]: !isOpen(g) }
}
const counts = computed(() => {
  const c = { hadir: 0, izin: 0, sakit: 0, alfa: 0, none: 0 }
  for (const s of sheet.value?.santri || []) {
    const st = statusOf(s.id)
    if (st) c[st] += 1
    else if ((sheet.value?.defaultClassIds || []).includes(s.classId)) c.none += 1
  }
  return c
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/santri-presence', { params: { date: date.value, slot: slot.value }, cache: false })
    sheet.value = data
    records.value = { ...data.records }
    opened.value = {}
    saveState.value = 'idle'
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Daftar santri belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

// Each tap is shown at once and saved shortly after, several taps in one request
const pending = new Map()
let timer = null
function queue(santriId, status) {
  const next = { ...records.value }
  if (status) next[santriId] = { ...(next[santriId] || {}), status, byName: 'Antum', source: 'absen' }
  else delete next[santriId]
  records.value = next
  pending.set(santriId, status)
  clearTimeout(timer)
  timer = setTimeout(flush, 600)
}
function choose(santriId, status) {
  queue(santriId, statusOf(santriId) === status ? null : status)
}
function markRest(g) {
  g.items.filter((s) => !statusOf(s.id)).forEach((s) => queue(s.id, 'hadir'))
}
async function flush() {
  clearTimeout(timer)
  if (!pending.size) return
  const marks = [...pending.entries()].map(([santriId, status]) => ({ santriId, status }))
  pending.clear()
  saveState.value = 'saving'
  try {
    const { data } = await api.put('/santri-presence', { date: date.value, slot: slot.value, marks })
    // the server's view (who recorded what), keeping taps made while this request was on its way
    const mine = Object.fromEntries([...pending.keys()].map((id) => [id, records.value[id]]))
    records.value = { ...data.records, ...mine }
    saveState.value = pending.size ? 'saving' : 'saved'
  } catch (err) {
    marks.forEach((m) => { if (!pending.has(m.santriId)) pending.set(m.santriId, m.status) })
    saveState.value = 'error'
    console.error('Absen santri save failed:', err.response?.data?.error || err.message)
  }
}
async function setSlot(id) {
  if (id === slot.value) return
  await flush()
  slot.value = id
  showOthers.value = false
  load()
}
async function setDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > today) return
  await flush()
  date.value = d
  load()
}

// leaving the page: send what is still waiting
const onHide = () => { if (document.visibilityState === 'hidden') flush() }
onMounted(() => {
  load()
  document.addEventListener('visibilitychange', onHide)
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onHide)
  flush()
})
</script>

<style scoped>
.as {
  --ink: #0b3b2a;
  --body: #475a50;
  --muted: #5b6b62;
  --emerald: #0a5c40;
  --line: rgba(11, 59, 42, 0.12);
  color: var(--ink);
  padding-bottom: 24px;
}

/* the admin's menu button floats top-left on a phone (the guru layout has its own top bar) */
.as.is-admin {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .as.is-admin {
    padding-top: 0;
  }
}

.as-head h1 {
  margin: 0 0 4px;
  font-size: 1.6rem;
  font-weight: 800;
}

.as-head p {
  margin: 0 0 14px;
  color: var(--body);
  line-height: 1.5;
}

.as-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.as-slots {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
}

.as-slot {
  min-height: 42px;
  min-width: 84px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  font: inherit;
  font-weight: 700;
  color: #3b4a42;
  cursor: pointer;
}

.as-slot[aria-pressed="true"] {
  background: #fff;
  color: var(--ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.as-input {
  width: 100%;
  min-height: 46px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  color: var(--ink);
  box-sizing: border-box;
}

.as-date {
  flex: 1 1 160px;
}

.as-hint {
  margin: -4px 0 12px;
  font-size: 0.82rem;
  color: var(--muted);
}

.as-search {
  margin: 10px 0 12px;
}

.as-note {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.as-note.is-warn {
  background: #fffbeb;
  color: #5b3a06;
  border: 1px solid #f3d58b;
}

.as-note.is-danger {
  background: #fdecea;
  color: #7a1810;
}

.as-inline-link {
  margin-left: 6px;
  color: var(--emerald);
  font-weight: 700;
}

/* the tally stays in view while scrolling a long list */
.as-summary {
  position: sticky;
  top: 64px;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 8px 18px -14px rgba(3, 41, 29, 0.4);
  font-size: 0.88rem;
  color: var(--body);
}

@media (min-width: 1024px) {
  .as-summary {
    top: 8px;
  }
}

.as-summary strong {
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.as-summary .is-hadir strong { color: #0a5c40; }
.as-summary .is-izin strong { color: #1d4f8a; }
.as-summary .is-sakit strong { color: #7c3a0d; }
.as-summary .is-alfa strong { color: #8e1b12; }

.as-save {
  margin-left: auto;
  font-weight: 700;
}

.as-save.is-saved { color: #0a5c40; }
.as-save.is-saving { color: var(--muted); }
.as-save.is-error { color: #b42318; }

.as-retry {
  min-height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid rgba(180, 35, 24, 0.4);
  background: #fff;
  color: #b42318;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.as-group {
  margin-bottom: 10px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--line);
  overflow: hidden;
}

.as-group-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px 8px 4px;
  background: #f7faf8;
}

.as-group-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 10px;
  border: 0;
  background: none;
  font: inherit;
  color: var(--ink);
  cursor: pointer;
}

.as-group-name {
  font-weight: 800;
}

.as-group-count {
  font-size: 0.82rem;
  color: var(--muted);
}

.as-chevron {
  color: var(--muted);
}

.as-all {
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1.5px solid rgba(10, 92, 64, 0.35);
  background: #fff;
  color: var(--emerald);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.as-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.as-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  padding: 10px 12px;
  border-top: 1px solid var(--line);
}

.as-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 180px;
}

.as-name strong {
  overflow-wrap: anywhere;
}

.as-by {
  font-size: 0.75rem;
  color: var(--muted);
}

.as-choices {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  flex: 1 1 280px;
}

.as-choice {
  min-height: 44px;
  border-radius: 10px;
  border: 1.5px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--body);
  cursor: pointer;
}

.as-choice:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.as-choice[aria-pressed="true"].is-hadir { background: #0a5c40; border-color: #0a5c40; color: #fff; }
.as-choice[aria-pressed="true"].is-izin { background: #1d4f8a; border-color: #1d4f8a; color: #fff; }
.as-choice[aria-pressed="true"].is-sakit { background: #b45309; border-color: #b45309; color: #fff; }
.as-choice[aria-pressed="true"].is-alfa { background: #b42318; border-color: #b42318; color: #fff; }

.as-slot:focus-visible,
.as-choice:focus-visible,
.as-all:focus-visible,
.as-group-toggle:focus-visible,
.as-more:focus-visible,
.as-input:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.as-more {
  width: 100%;
  min-height: 46px;
  margin-top: 4px;
  border-radius: 12px;
  border: 1px dashed rgba(11, 59, 42, 0.3);
  background: transparent;
  font: inherit;
  font-weight: 700;
  color: var(--emerald);
  cursor: pointer;
}

.as-empty,
.as-foot {
  margin: 12px 0 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--muted);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
