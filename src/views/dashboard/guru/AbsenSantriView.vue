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

      <!-- the parents told the TPQ ahead through the portal -->
      <p v-if="fromWali.length" class="as-note as-wali-note" role="status">
        <strong>{{ fromWali.length }} izin/sakit dari wali</strong> di sesi ini:
        {{ fromWali.map((x) => `${x.name} (${x.status})`).join(', ') }}. Sudah tercatat dan barisnya dikunci supaya tidak
        terubah tanpa sengaja<template v-if="sheet.canEdit">; ketuk "Ubah status" bila memang perlu menggantinya</template>.
      </p>

      <!-- what is recorded, and whether it is saved -->
      <div class="as-summary" role="status" aria-live="polite">
        <span v-for="t in TALLY" :key="t.key" :class="`is-${t.key}`"><strong>{{ counts[t.key] }}</strong> {{ t.label }}</span>
        <span class="is-none"><strong>{{ counts.none }}</strong> belum dicatat</span>
        <span class="as-save" :class="`is-${saveState}`">{{ saveLabel }}</span>
        <button v-if="saveState === 'error'" type="button" class="as-retry" @click="retryNow">Coba lagi</button>
      </div>
      <!-- why something was not saved (the server refused it, or the session ended) -->
      <p v-if="saveNote" class="as-note is-warn as-save-note" role="alert">{{ saveNote }}</p>

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
          <li v-for="s in g.items" :key="s.id" class="as-row" :class="{ 'is-locked': isLocked(s.id) }">
            <div class="as-name">
              <strong>{{ s.name }}</strong>
              <span v-if="recordOf(s.id)?.source === 'wali'" class="as-by is-wali">
                {{ recordOf(s.id).status === 'sakit' ? 'Sakit' : 'Izin' }} dari {{ recordOf(s.id).byName }}<template v-if="recordOf(s.id).reason">: "{{ recordOf(s.id).reason }}"</template>
              </span>
              <span v-else-if="recordOf(s.id)?.byName" class="as-by">
                {{ recordOf(s.id).source === 'kbm' ? 'dari KBM' : 'oleh' }} {{ recordOf(s.id).byName }}<template v-if="recordOf(s.id).changedFrom">
                  · menggantikan {{ recordOf(s.id).changedFrom.status }} dari wali</template>
              </span>
              <button v-if="sheet.canEdit && isLocked(s.id)" type="button" class="as-unlock" :aria-label="`Ubah status ${s.name}`" @click="unlock(s)">
                🔒 Ubah status
              </button>
            </div>
            <div class="as-choices" role="group" :aria-label="`Status ${s.name}`">
              <button v-for="st in STATUSES" :key="st.key" type="button" class="as-choice" :class="`is-${st.key}`"
                :aria-pressed="statusOf(s.id) === st.key" :disabled="!sheet.canEdit || isLocked(s.id)" @click="choose(s.id, st.key)">
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
      <p class="as-foot">Ketuk status yang sama sekali lagi untuk menghapusnya. Santri yang tidak dicatat tidak dianggap alfa. Baris izin/sakit dari wali terkunci.</p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useAuthStore } from '@/stores/auth'
import { useDialog } from '@/composables/useDialog'

const authStore = useAuthStore()
const { ask } = useDialog()
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
const SAVE_TEXT = { idle: '', saving: 'Menyimpan…', saved: 'Tersimpan ✓', error: 'Belum tersimpan', refused: 'Sebagian tidak tersimpan' }

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
const saveNote = ref('')
const unlocked = ref({}) // santri whose parent's izin the person confirmed to change
const pendingCount = ref(0)

const recordOf = (id) => records.value[id] || null
// izin / sakit the parents sent from the wali portal
const fromWali = computed(() =>
  Object.entries(records.value)
    .filter(([, r]) => r?.source === 'wali')
    .map(([id, r]) => ({ id, status: r.status, name: sheet.value?.santri.find((s) => s.id === id)?.name || '' }))
    .filter((x) => x.name),
)
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

// A row the parent's izin/sakit holds: its buttons are off until the person says "Ubah status" and confirms
const isLocked = (id) => records.value[id]?.locked === true && !unlocked.value[id]

// ---------------------------------------------------------------------------------------------------------------
// Loading. A late answer to an old question is dropped (loadSeq), and a refresh in the background never replaces
// what the person is in the middle of saving.
let loadSeq = 0
async function load({ silent = false } = {}) {
  const mine = ++loadSeq
  const d = date.value
  const sl = slot.value
  if (!silent) {
    loading.value = true
    loadError.value = ''
  }
  try {
    const { data } = await api.get('/santri-presence', { params: { date: d, slot: sl }, cache: false })
    if (mine !== loadSeq) return
    if (silent && (pending.size || sending > 0)) return // taps are on their way: they show the newest state
    sheet.value = data
    records.value = withPending(data.records, d, sl)
    if (!silent) {
      opened.value = {}
      unlocked.value = {}
      if (!pending.size) saveState.value = 'idle'
    }
  } catch (err) {
    if (mine === loadSeq && !silent) {
      sheet.value = null
      loadError.value = err.response?.data?.error || 'Daftar santri belum bisa dimuat.'
    }
  } finally {
    if (mine === loadSeq) loading.value = false
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Autosave. Every tap is shown at once and sent shortly after, several taps in one request.
//  - a tap remembers the day and sesi it was made on, so it can never land on another day
//  - requests go one after another (a slower earlier answer cannot overwrite a newer one)
//  - a network failure keeps the taps and tries again by itself; the server refusing is told to the person
//  - leaving the page (route, tab, browser) with something unsent is stopped or flushed
const pending = new Map() // `${date}|${slot}|${santriId}` -> { date, slot, santriId, status, override }
const keyOf = (d, sl, id) => `${d}|${sl}|${id}`
const touch = () => { pendingCount.value = pending.size }
let timer = null
let retryTimer = null
let retries = 0
let sending = 0
let alive = true
let chain = Promise.resolve()
let lastTap = { id: '', status: '', at: 0 }
const RETRY_AFTER = [4000, 10000, 25000]

const saveLabel = computed(() => (saveState.value === 'error' && pendingCount.value ? `${SAVE_TEXT.error} (${pendingCount.value})` : SAVE_TEXT[saveState.value]))

// the server's records for this view, with the taps that are still waiting laid over them
function withPending(serverRecords, d, sl) {
  const out = { ...(serverRecords || {}) }
  for (const m of pending.values()) {
    if (m.date !== d || m.slot !== sl) continue
    if (m.status) out[m.santriId] = { status: m.status, byName: 'Antum', source: 'absen' }
    else delete out[m.santriId]
  }
  return out
}

function queue(santriId, status) {
  const d = date.value
  const sl = slot.value
  // a row still holding the parent's izin: this change needs the confirmation the person gave
  const override = records.value[santriId]?.locked === true
  const next = { ...records.value }
  if (status) next[santriId] = { status, byName: 'Antum', source: 'absen' }
  else delete next[santriId]
  records.value = next
  pending.set(keyOf(d, sl, santriId), { date: d, slot: sl, santriId, status, override })
  touch()
  saveNote.value = ''
  saveState.value = 'saving'
  clearTimeout(timer)
  timer = setTimeout(flush, 600)
}

function choose(santriId, status) {
  if (isLocked(santriId)) return
  const same = statusOf(santriId) === status
  const now = Date.now()
  // a second tap right after the first (a double tap) must not undo it
  if (same && lastTap.id === santriId && lastTap.status === status && now - lastTap.at < 450) return
  lastTap = { id: santriId, status, at: now }
  // the parent's own status is not cleared by tapping it again
  if (same && records.value[santriId]?.locked) return
  queue(santriId, same ? null : status)
}

function markRest(g) {
  g.items.filter((s) => !statusOf(s.id)).forEach((s) => queue(s.id, 'hadir'))
}

async function unlock(s) {
  const r = recordOf(s.id)
  if (!r || !sheet.value?.canEdit) return
  const ok = await ask({
    title: `Ubah status ${s.name}?`,
    message: `${r.status === 'sakit' ? 'Sakit' : 'Izin'} ini dikirim oleh ${r.byName || 'wali'}${r.reason ? `: "${r.reason}"` : ''}. Jika diubah, izin dari wali itu diganti dengan catatan Antum. Ubah hanya bila santri memang datang atau keadaannya berbeda.`,
    confirmText: 'Ya, ubah',
    cancelText: 'Biarkan',
    tone: 'danger',
  })
  if (ok) unlocked.value = { ...unlocked.value, [s.id]: true }
}

// a failure that may pass by itself (no connection, a busy server) keeps the taps; the rest is a "no" from the server
const retriable = (err) => !err.response || err.response.status >= 500 || [408, 429].includes(err.response.status)

function scheduleRetry() {
  clearTimeout(retryTimer)
  if (!alive || !pending.size) return
  const wait = RETRY_AFTER[Math.min(retries, RETRY_AFTER.length - 1)]
  retries += 1
  retryTimer = setTimeout(flush, wait)
}

function flush() {
  clearTimeout(timer)
  // one request at a time, in the order the taps were made
  chain = chain.then(sendAll, sendAll)
  return chain
}

function retryNow() {
  retries = 0
  return flush()
}

async function sendAll() {
  clearTimeout(timer)
  clearTimeout(retryTimer)
  let failed = false
  let refusal = ''
  while (pending.size) {
    const first = pending.values().next().value
    const ctx = { date: first.date, slot: first.slot }
    const batch = [...pending.entries()].filter(([, m]) => m.date === ctx.date && m.slot === ctx.slot)
    batch.forEach(([k]) => pending.delete(k))
    touch()
    saveState.value = 'saving'
    sending += 1
    try {
      const marks = batch.map(([, m]) => ({ santriId: m.santriId, status: m.status, ...(m.override ? { override: true } : {}) }))
      const { data } = await api.put('/santri-presence', { ...ctx, marks })
      const stillHere = ctx.date === date.value && ctx.slot === slot.value
      if (stillHere) records.value = withPending(data.records, ctx.date, ctx.slot)
      if (data.locked?.length) {
        refusal = `${data.locked.map((x) => x.name).join(', ')}: izin dari wali tidak diubah.`
      }
      retries = 0
    } catch (err) {
      const status = err.response?.status
      const data = err.response?.data
      if (status === 409 && data?.code === 'WALI_IZIN_LOCKED') {
        // somebody (the parent) recorded it while this page was open: show what is there now
        if (ctx.date === date.value && ctx.slot === slot.value && data.records) records.value = withPending(data.records, ctx.date, ctx.slot)
        refusal = `${(data.locked || []).map((x) => x.name).join(', ') || 'Santri'}: sudah ada izin dari wali, tidak diubah.`
      } else if (status === 401) {
        // the login ended: keep the taps; they cannot be sent until the person signs in again
        batch.forEach(([k, m]) => { if (!pending.has(k)) pending.set(k, m) })
        touch()
        refusal = 'Sesi masuk berakhir. Masuk lagi, lalu ulangi catatan yang belum tersimpan.'
        failed = true
        break
      } else if (retriable(err)) {
        batch.forEach(([k, m]) => { if (!pending.has(k)) pending.set(k, m) })
        touch()
        failed = true
        scheduleRetry()
        break
      } else {
        // 4xx: the server will not take it (e.g. the day is closed to this teacher): say so, and show the true state
        refusal = data?.error || 'Perubahan ditolak server.'
        if (ctx.date === date.value && ctx.slot === slot.value) load({ silent: true })
      }
    } finally {
      sending -= 1
    }
  }
  touch()
  if (failed) saveState.value = 'error'
  else if (refusal) saveState.value = 'refused'
  else saveState.value = pending.size ? 'saving' : 'saved'
  if (refusal) saveNote.value = refusal
}

function resetView() {
  sheet.value = null // the old day's rows are never tapped on a new day
  records.value = {}
  showOthers.value = false
  saveNote.value = ''
  load()
}
function setSlot(id) {
  if (id === slot.value) return
  flush() // unsent taps keep their own day and sesi; they are sent (or retried) on their own
  slot.value = id
  resetView()
}
function setDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > today) return
  if (d === date.value) return
  flush()
  date.value = d
  resetView()
}

// ---------------------------------------------------------------------------------------------------------------
// Leaving, coming back
const onHide = () => {
  if (document.visibilityState === 'hidden') flush()
  // back on the tab: the sheet may have changed meanwhile (a parent's izin, another teacher)
  else if (!pending.size && sheet.value) load({ silent: true })
}
const onOnline = () => { if (pending.size) retryNow() }
const onBeforeUnload = (e) => {
  if (!pending.size) return
  e.preventDefault()
  e.returnValue = ''
}
let poll = null
onBeforeRouteLeave(async () => {
  await flush()
  if (!pending.size) return true
  return ask({
    title: 'Ada yang belum tersimpan',
    message: `${pending.size} catatan absen belum terkirim ke server. Jika keluar sekarang, catatan itu hilang.`,
    confirmText: 'Keluar',
    cancelText: 'Tetap di sini',
    tone: 'danger',
  })
})
onMounted(() => {
  load()
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('online', onOnline)
  window.addEventListener('beforeunload', onBeforeUnload)
  // a parent's izin may arrive while the page is open
  poll = setInterval(() => {
    if (document.visibilityState === 'visible' && sheet.value && !pending.size && !sending) load({ silent: true })
  }, 60000)
})
onBeforeUnmount(() => {
  alive = false
  document.removeEventListener('visibilitychange', onHide)
  window.removeEventListener('online', onOnline)
  window.removeEventListener('beforeunload', onBeforeUnload)
  clearInterval(poll)
  clearTimeout(retryTimer)
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
  top: calc(var(--appbar-h, 0px) + 8px); /* under the phone top bar */
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
.as-save.is-refused { color: #b45309; }

.as-save-note {
  margin: 8px 0 0;
}

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

.as-by.is-wali {
  color: #1d4f8a;
  font-weight: 600;
}

.as-wali-note {
  background: #e6f0fb;
  color: #173f6e;
  border: 1px solid #b9d3f0;
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

/* the parent's izin/sakit: the row is held, the status it holds stays clear */
.as-row.is-locked {
  background: #f3f8fd;
}

.as-row.is-locked .as-choice:disabled {
  opacity: 0.4;
}

.as-row.is-locked .as-choice[aria-pressed="true"]:disabled {
  opacity: 1;
  cursor: default;
}

.as-unlock {
  align-self: flex-start;
  min-height: 36px;
  margin-top: 4px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1.5px solid rgba(29, 79, 138, 0.35);
  background: #fff;
  color: #1d4f8a;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.as-unlock:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
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
