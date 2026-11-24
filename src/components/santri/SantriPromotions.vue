<template>
  <!-- Guru mode: compact 24h undo banner right above the roster (only appears after the guru just promoted someone) -->
  <section v-if="!adminMode && items.length" class="pr" aria-labelledby="pr-title">
    <div class="pr-guru-head">
      <div>
        <h2 id="pr-title" class="pr-title">Baru Antum naikkan</h2>
        <p class="pr-lead">Salah pilih? Batalkan dalam 24 jam, santri kembali ke jilid semula.</p>
      </div>
    </div>
    <ul class="pr-list">
      <li v-for="h in items" :key="h.id" class="pr-item">
        <div class="pr-main">
          <strong>{{ h.santriName }}</strong>
          <span class="pr-meta">{{ levelName(h.from) }} → {{ levelName(h.to) }} · {{ when(h.at) }}</span>
        </div>
        <button type="button" class="pr-undo" :disabled="busy" :aria-label="`Batalkan kenaikan ${h.santriName}`" @click="undo(h)">Batalkan</button>
      </li>
    </ul>
  </section>

  <!-- Admin mode: dedicated "Riwayat Naik Jilid" workspace (inside its own tab, never crowding the top of Daftar Santri) -->
  <section v-else-if="adminMode" class="pr-admin" aria-labelledby="pr-admin-title">
    <!-- Compact 4-cell summary strip (clickable filters) -->
    <div class="pr-summary" role="region" aria-label="Ringkasan naik jilid">
      <button type="button" class="pr-stat" :class="{ 'is-attn': summary.last7Days > 0, 'is-active': dayWindow === '7' && sourceFilter === 'all' }" @click="pickSummary('7', 'all')">
        <strong>{{ summary.last7Days }}</strong>
        <span>7 hari terakhir</span>
      </button>
      <button type="button" class="pr-stat" :class="{ 'is-active': dayWindow === '30' && sourceFilter === 'all' }" @click="pickSummary('30', 'all')">
        <strong>{{ summary.last30Days }}</strong>
        <span>30 hari terakhir</span>
      </button>
      <button type="button" class="pr-stat" :class="{ 'is-active': sourceFilter === 'guru' }" @click="pickSummary('all', 'guru')">
        <strong>{{ summary.byGuru }}</strong>
        <span>naik oleh guru</span>
      </button>
      <button type="button" class="pr-stat" :class="{ 'is-active': sourceFilter === 'admin' }" @click="pickSummary('all', 'admin')">
        <strong>{{ summary.byAdmin }}</strong>
        <span>diubah admin</span>
      </button>
    </div>

    <div class="pr-card">
      <div class="pr-card-head">
        <div>
          <h2 id="pr-admin-title" class="pr-card-title">Riwayat Naik Jilid ({{ filteredItems.length }})</h2>
          <p class="pr-lead">Pantau siapa saja santri yang naik atau pindah jilid, siapa yang memproses, dan batalkan kenaikan guru bila keliru.</p>
        </div>
        <div class="pr-window-pills" role="group" aria-label="Rentang waktu">
          <button
            v-for="opt in WINDOWS"
            :key="opt.value"
            type="button"
            class="pr-pill-btn"
            :aria-pressed="dayWindow === opt.value"
            @click="dayWindow = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Search + source filter -->
      <div class="pr-filters">
        <input
          v-model="search"
          type="search"
          class="pr-input pr-search"
          aria-label="Cari riwayat naik jilid"
          placeholder="Cari nama santri, no. induk, atau nama pengajar…"
        />
        <select v-model="sourceFilter" class="pr-input pr-select" aria-label="Sumber perubahan">
          <option value="all">Semua pengubah</option>
          <option value="guru">Naik jilid oleh guru</option>
          <option value="admin">Diubah oleh admin</option>
        </select>
      </div>

      <!-- Transition flow breakdown chips (e.g. Jilid 1 -> Jilid 2: 3) -->
      <div v-if="routeChips.length > 1 || routeFilter" class="pr-routes" role="group" aria-label="Saring perpindahan jilid">
        <button type="button" class="pr-route-chip" :aria-pressed="!routeFilter" @click="routeFilter = ''">
          Semua alur <span>{{ windowItems.length }}</span>
        </button>
        <button
          v-for="rt in routeChips"
          :key="rt.key"
          type="button"
          class="pr-route-chip"
          :class="{ 'is-down': rt.direction === 'down' }"
          :aria-pressed="routeFilter === rt.key"
          @click="routeFilter = routeFilter === rt.key ? '' : rt.key"
        >
          {{ levelName(rt.from) }} → {{ levelName(rt.to) }} <span>{{ rt.count }}</span>
        </button>
      </div>

      <p v-if="loadingHistory" class="pr-empty">Memuat riwayat naik jilid…</p>
      <div v-else-if="!filteredItems.length" class="pr-empty">
        <p>{{ emptyMessage }}</p>
        <button v-if="hasFilters && summary.total > 0" type="button" class="pr-reset-btn" @click="resetFilters">
          Tampilkan semua riwayat ({{ summary.total }})
        </button>
      </div>

      <!-- Desktop table -->
      <div v-else class="pr-table-wrap">
        <table class="pr-table">
          <thead>
            <tr>
              <th>Santri</th>
              <th>Perpindahan Jilid</th>
              <th>Diproses Oleh</th>
              <th>Waktu</th>
              <th class="pr-col-action">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in filteredItems" :key="h.id">
              <td>
                <div class="pr-santri-cell">
                  <strong>{{ h.santriName }}</strong>
                  <span class="pr-sub">
                    <template v-if="h.nomorInduk">{{ h.nomorInduk }}</template>
                    <template v-if="h.currentClassId && h.currentClassId !== h.to">
                      <template v-if="h.nomorInduk"> · </template>Kini di {{ levelName(h.currentClassId) }}
                    </template>
                    <template v-if="h.santriStatus && h.santriStatus !== 'aktif'">
                      <template v-if="h.nomorInduk || (h.currentClassId && h.currentClassId !== h.to)"> · </template>{{ statusText(h.santriStatus) }}
                    </template>
                  </span>
                </div>
              </td>
              <td>
                <span class="pr-move-pill" :class="h.direction === 'down' ? 'is-down' : 'is-up'">
                  {{ levelName(h.from) }} → {{ levelName(h.to) }}
                </span>
              </td>
              <td>
                <div class="pr-actor-cell">
                  <span>{{ h.byName }}</span>
                  <span class="pr-source-tag" :class="h.source === 'naik-jilid-guru' ? 'is-guru' : 'is-admin'">
                    {{ h.source === 'naik-jilid-guru' ? 'Guru' : 'Admin' }}
                  </span>
                </div>
              </td>
              <td>
                <div class="pr-time-cell">
                  <span>{{ when(h.at) }}</span>
                  <time v-if="fullDateTime(h.at)" class="pr-sub">{{ fullDateTime(h.at) }}</time>
                </div>
              </td>
              <td class="pr-col-action">
                <button
                  v-if="h.canUndo"
                  type="button"
                  class="pr-undo"
                  :disabled="busy"
                  :aria-label="`Batalkan kenaikan ${h.santriName}`"
                  @click="undo(h)"
                >
                  Batalkan
                </button>
                <span v-else class="pr-sub pr-no-action" :title="undoBlockedReason(h)">
                  {{ h.source === 'naik-jilid-guru' ? 'Sudah berubah' : 'Via Kelola Santri' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile cards (shown <= 767px) -->
        <ul class="pr-mobile-cards">
          <li v-for="h in filteredItems" :key="`m-${h.id}`" class="pr-mcard">
            <div class="pr-mcard-top">
              <div class="pr-santri-cell">
                <strong>{{ h.santriName }}</strong>
                <span v-if="h.nomorInduk" class="pr-sub">{{ h.nomorInduk }}</span>
              </div>
              <span class="pr-move-pill" :class="h.direction === 'down' ? 'is-down' : 'is-up'">
                {{ levelName(h.from) }} → {{ levelName(h.to) }}
              </span>
            </div>
            <div class="pr-mcard-meta">
              <span class="pr-source-tag" :class="h.source === 'naik-jilid-guru' ? 'is-guru' : 'is-admin'">
                {{ h.source === 'naik-jilid-guru' ? 'Guru' : 'Admin' }}
              </span>
              <span>{{ h.byName }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ when(h.at) }}</span>
            </div>
            <p v-if="(h.currentClassId && h.currentClassId !== h.to) || (h.santriStatus && h.santriStatus !== 'aktif')" class="pr-sub pr-mcard-note">
              <template v-if="h.currentClassId && h.currentClassId !== h.to">Kini di {{ levelName(h.currentClassId) }}</template>
              <template v-if="h.santriStatus && h.santriStatus !== 'aktif'">
                <template v-if="h.currentClassId && h.currentClassId !== h.to"> · </template>Status: {{ statusText(h.santriStatus) }}
              </template>
            </p>
            <div v-if="h.canUndo" class="pr-mcard-actions">
              <button type="button" class="pr-undo" :disabled="busy" @click="undo(h)">Batalkan kenaikan</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { timeAgo, fullDateTime, timeOf } from '@/utils/timeAgo'

const props = defineProps({ adminMode: { type: Boolean, default: false } })
const emit = defineEmits(['changed'])
const { success, error: showError } = useToast()
const { ask } = useDialog()

const WINDOWS = [
  { value: '7', label: '7 hari' },
  { value: '30', label: '30 hari' },
  { value: '90', label: '90 hari' },
  { value: 'all', label: 'Semua' },
]
const DAY_MS = 24 * 3600 * 1000

const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ditentukan')
const statusText = (s) => ({ nonaktif: 'Nonaktif', lulus: 'Lulus', dihapus: 'Terhapus' }[s] || s)
const when = (v) => timeAgo(v)
const undoBlockedReason = (h) =>
  h.source === 'naik-jilid-guru'
    ? 'Jilid santri ini sudah diubah lagi setelah kenaikan ini'
    : 'Perubahan dari Kelola Santri bisa diubah langsung lewat tombol Ubah di Daftar Santri'

const items = ref([])
const summary = ref({ total: 0, last7Days: 0, last30Days: 0, byGuru: 0, byAdmin: 0, recentGuru7Days: 0 })
const loadingHistory = ref(false)
const busy = ref(false)

const dayWindow = ref('30')
const sourceFilter = ref('all')
const routeFilter = ref('')
const search = ref('')
let initializedWindow = false

const recentCount = computed(() => (props.adminMode ? Number(summary.value.last7Days || 0) : items.value.length))
const totalCount = computed(() => (props.adminMode ? Number(summary.value.total || 0) : items.value.length))

const windowItems = computed(() => {
  if (!props.adminMode) return items.value
  if (dayWindow.value === 'all') return items.value
  const days = Number(dayWindow.value)
  if (!Number.isFinite(days) || days <= 0) return items.value
  const cutoff = Date.now() - days * DAY_MS
  return items.value.filter((h) => {
    const t = timeOf(h.at)
    return t && t >= cutoff
  })
})

const routeChips = computed(() => {
  const by = new Map()
  for (const h of windowItems.value) {
    if (sourceFilter.value === 'guru' && h.source !== 'naik-jilid-guru') continue
    if (sourceFilter.value === 'admin' && h.source === 'naik-jilid-guru') continue
    const key = `${h.from}->${h.to}`
    if (!by.has(key)) by.set(key, { key, from: h.from, to: h.to, direction: h.direction, count: 0 })
    by.get(key).count += 1
  }
  return [...by.values()].sort((a, b) => b.count - a.count || a.from.localeCompare(b.from, undefined, { numeric: true }))
})

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  return windowItems.value.filter((h) => {
    if (sourceFilter.value === 'guru' && h.source !== 'naik-jilid-guru') return false
    if (sourceFilter.value === 'admin' && h.source === 'naik-jilid-guru') return false
    if (routeFilter.value && `${h.from}->${h.to}` !== routeFilter.value) return false
    if (q) {
      const hay = `${h.santriName} ${h.nomorInduk || ''} ${h.byName || ''} ${levelName(h.from)} ${levelName(h.to)}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const hasFilters = computed(() => dayWindow.value !== 'all' || sourceFilter.value !== 'all' || !!routeFilter.value || !!search.value.trim())

const emptyMessage = computed(() => {
  if (!summary.value.total) return 'Belum ada riwayat kenaikan atau perubahan jilid yang tercatat.'
  if (search.value.trim() || routeFilter.value || sourceFilter.value !== 'all') return 'Tidak ada riwayat naik jilid yang cocok dengan filter.'
  return `Belum ada santri yang naik jilid dalam ${dayWindow.value} hari terakhir.`
})

function pickSummary(windowVal, srcVal) {
  dayWindow.value = windowVal
  sourceFilter.value = srcVal
  routeFilter.value = ''
}

function resetFilters() {
  dayWindow.value = 'all'
  sourceFilter.value = 'all'
  routeFilter.value = ''
  search.value = ''
}

async function load() {
  if (props.adminMode) {
    loadingHistory.value = true
    try {
      const { data } = await api.get('/santri-changes/promotions/history', { params: { days: 'all' }, cache: false })
      items.value = Array.isArray(data?.items) ? data.items : []
      summary.value = data?.summary || { total: items.value.length, last7Days: 0, last30Days: 0, byGuru: 0, byAdmin: 0, recentGuru7Days: 0 }
      if (!initializedWindow) {
        initializedWindow = true
        dayWindow.value = summary.value.last30Days > 0 ? '30' : 'all'
      }
    } catch {
      items.value = []
      summary.value = { total: 0, last7Days: 0, last30Days: 0, byGuru: 0, byAdmin: 0, recentGuru7Days: 0 }
    } finally {
      loadingHistory.value = false
    }
    return
  }

  try {
    const { data } = await api.get('/santri-changes/promotions', { cache: false })
    items.value = Array.isArray(data) ? data : []
  } catch {
    items.value = []
  }
}

async function undo(h) {
  const ok = await ask({
    title: `Batalkan kenaikan ${h.santriName}?`,
    message: `${h.santriName} kembali ke ${levelName(h.from)}.${props.adminMode ? '' : ' Admin dan guru jilid tujuan dikabari.'}`,
    tone: 'danger',
    confirmText: 'Ya, kembalikan',
    cancelText: 'Biarkan',
  })
  if (!ok) return
  busy.value = true
  try {
    await api.post(`/santri-changes/promote/${h.id}/undo`)
    success(`${h.santriName} kembali ke ${levelName(h.from)}`)
    emit('changed')
  } catch (err) {
    showError(err.response?.data?.error || 'Belum berhasil. Coba lagi.')
  } finally {
    busy.value = false
    await load()
  }
}

onMounted(load)
defineExpose({ reload: load, recentCount, totalCount })
</script>

<style scoped>
/* Guru 24h undo bar */
.pr {
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f0f7f3;
  border: 1px solid rgba(10, 92, 64, 0.18);
  color: #0b3b2a;
}

.pr-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
}

.pr-lead {
  margin: 2px 0 0;
  font-size: 0.85rem;
  color: #475a50;
  line-height: 1.45;
}

.pr-list {
  display: grid;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.pr-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 8px 12px;
  border-radius: 12px;
  background: #fff;
}

.pr-main {
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
}

.pr-main strong {
  overflow-wrap: anywhere;
}

.pr-meta {
  font-size: 0.82rem;
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
}

/* Admin Riwayat Naik Jilid workspace */
.pr-admin {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pr-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  overflow: hidden;
}

.pr-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 16px;
  border: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.pr-stat + .pr-stat {
  border-left: 1px solid rgba(11, 59, 42, 0.08);
}

.pr-stat:hover {
  background: #f5faf7;
}

.pr-stat.is-attn {
  background: #fffdf5;
}

.pr-stat.is-attn strong {
  color: #92400e;
}

.pr-stat.is-active {
  background: #edf7f2;
  box-shadow: inset 0 -2px 0 #0a5c40;
}

.pr-stat strong {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0b3b2a;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.pr-stat span {
  font-size: 0.78rem;
  color: #5b6b62;
}

.pr-card {
  padding: 20px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  box-shadow: 0 4px 20px rgba(3, 41, 29, 0.04);
}

.pr-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.pr-card-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0b3b2a;
}

.pr-window-pills {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 3px;
  border-radius: 11px;
  background: rgba(11, 59, 42, 0.06);
}

.pr-pill-btn {
  min-height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  color: #3b4a42;
  cursor: pointer;
}

.pr-pill-btn[aria-pressed="true"] {
  background: #fff;
  color: #0b3b2a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.pr-filters {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

@media (min-width: 768px) {
  .pr-filters {
    grid-template-columns: 2fr 1fr;
  }
}

.pr-input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.92rem;
  box-sizing: border-box;
}

.pr-input:focus {
  outline: none;
  border-color: #0a5c40;
  box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.14);
}

.pr-routes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.pr-route-chip {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  color: #2f4339;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.pr-route-chip span {
  margin-left: 4px;
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
}

.pr-route-chip[aria-pressed="true"] {
  border-color: #0a5c40;
  background: #0a5c40;
  color: #fff;
}

.pr-route-chip[aria-pressed="true"] span {
  color: #d9efe4;
}

.pr-route-chip.is-down {
  border-color: rgba(180, 83, 9, 0.3);
}

.pr-empty {
  padding: 28px 16px;
  text-align: center;
  color: #5b6b62;
  font-size: 0.92rem;
}

.pr-empty p {
  margin: 0 0 10px;
}

.pr-reset-btn {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(10, 92, 64, 0.3);
  background: #f0f7f3;
  color: #0a5c40;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
}

/* Desktop table */
.pr-table-wrap {
  overflow-x: auto;
}

.pr-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.pr-table th {
  padding: 10px 12px;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #5b6b62;
  border-bottom: 1px solid rgba(11, 59, 42, 0.12);
  white-space: nowrap;
}

.pr-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(11, 59, 42, 0.07);
  vertical-align: middle;
  color: #0b3b2a;
}

.pr-table tbody tr:last-child td {
  border-bottom: 0;
}

.pr-col-action {
  text-align: right;
  white-space: nowrap;
}

.pr-santri-cell,
.pr-time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pr-santri-cell strong {
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.pr-sub {
  font-size: 0.78rem;
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
}

.pr-move-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.pr-move-pill.is-up {
  background: #e3f1ea;
  color: #0a5c40;
}

.pr-move-pill.is-down {
  background: #fef3c7;
  color: #7c3a0d;
}

.pr-actor-cell {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.pr-source-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.pr-source-tag.is-guru {
  background: #e6f0fb;
  color: #1d4f8a;
}

.pr-source-tag.is-admin {
  background: #eef0ef;
  color: #3b4a42;
}

.pr-no-action {
  color: #7c8b83;
}

.pr-undo {
  flex: none;
  min-height: 38px;
  padding: 0 13px;
  border-radius: 10px;
  border: 1.5px solid rgba(180, 35, 24, 0.3);
  background: #fff;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  color: #b42318;
  cursor: pointer;
}

.pr-undo:hover:not(:disabled) {
  background: #fdf3f2;
  border-color: rgba(180, 35, 24, 0.55);
}

.pr-undo:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pr-undo:focus-visible,
.pr-stat:focus-visible,
.pr-pill-btn:focus-visible,
.pr-route-chip:focus-visible,
.pr-reset-btn:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

/* Mobile cards */
.pr-mobile-cards {
  display: none;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 10px;
}

@media (max-width: 767px) {
  .pr-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pr-stat:nth-child(3) {
    border-left: 0;
  }

  .pr-stat:nth-child(n + 3) {
    border-top: 1px solid rgba(11, 59, 42, 0.08);
  }

  .pr-card {
    padding: 16px 14px;
  }

  .pr-table {
    display: none;
  }

  .pr-mobile-cards {
    display: grid;
  }

  .pr-mcard {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 14px;
    background: #fbfcf9;
    border: 1px solid rgba(11, 59, 42, 0.1);
  }

  .pr-mcard-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .pr-mcard-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
    color: #475a50;
  }

  .pr-mcard-note {
    margin: 0;
  }

  .pr-mcard-actions {
    display: flex;
    justify-content: flex-end;
  }

  .pr-mcard-actions .pr-undo {
    width: 100%;
    min-height: 44px;
  }

  .pr-input {
    font-size: 16px;
  }
}
</style>
