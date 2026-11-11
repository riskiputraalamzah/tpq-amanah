<template>
  <div class="monitor-view">
    <header class="page-header">
      <div>
        <h1>Monitor KBM</h1>
        <p>Kelengkapan absensi santri &amp; jurnal KBM setiap guru, per hari mengajar.</p>
      </div>
    </header>

    <div class="toolbar">
      <label class="field">
        <span>Bulan</span>
        <input v-model="period" type="month" class="input" @change="load()" />
      </label>
      <label class="field grow">
        <span>Cari guru</span>
        <input v-model="search" type="search" class="input" placeholder="Nama guru" />
      </label>
      <label class="check">
        <input v-model="onlyIssues" type="checkbox" />
        <span>Perlu tindak lanjut saja</span>
      </label>
      <button type="button" class="btn btn-ghost" :disabled="loading" @click="load(true)">
        {{ loading ? 'Memuat...' : 'Muat ulang' }}
      </button>
      <button type="button" class="btn btn-ghost" :disabled="!data || loading || exportingExcel || rows.length === 0" @click="exportExcel">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" class="btn-icon">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {{ exportingExcel ? 'Menyiapkan...' : 'Export Excel' }}
      </button>
    </div>

    <PageSkeleton v-if="loading && !data" :stats="4" :rows="6" label="Memuat monitor KBM" />

    <div v-else-if="error" class="card">
      <p class="alert">{{ error }}</p>
      <button type="button" class="btn btn-primary" @click="load(true)">Coba lagi</button>
    </div>

    <template v-else-if="data">
      <section class="stats" aria-label="Ringkasan bulan">
        <div class="stat">
          <span class="stat-label">KBM lengkap</span>
          <strong class="stat-value tone-ok">{{ data.summary.percent ?? 0 }}%</strong>
          <span class="stat-sub">{{ data.summary.complete }} dari {{ data.summary.counted }} hari</span>
        </div>
        <div class="stat">
          <span class="stat-label">Belum lengkap</span>
          <strong class="stat-value tone-warn">{{ data.summary.incomplete }}</strong>
          <span class="stat-sub">absen santri / jurnal kosong</span>
        </div>
        <div class="stat">
          <span class="stat-label">KBM belum dibuat</span>
          <strong class="stat-value tone-alert">{{ data.summary.notCreated }}</strong>
          <span class="stat-sub">hadir tanpa KBM</span>
        </div>
        <div class="stat">
          <span class="stat-label">Belum absen</span>
          <strong class="stat-value">{{ data.summary.noAttendance }}</strong>
          <span class="stat-sub">hari mengajar tanpa absen</span>
        </div>
      </section>

      <p class="meta-line">
        {{ monthTitle(data.period) }} · {{ data.summary.teachingDays }} hari mengajar ·
        <strong>{{ data.summary.gurusNeedingAction }} dari {{ data.summary.gurus }} guru</strong> perlu tindak lanjut ·
        diperbarui {{ updatedAt }}
      </p>

      <ul class="legend" aria-label="Keterangan">
        <li v-for="(meta, key) in legend" :key="key"><span class="sq" :class="`tone-${meta.tone}`">{{ meta.symbol }}</span>{{ meta.label }}</li>
        <li><span class="sq tone-off"></span>Libur / belum terjadi</li>
      </ul>

      <p v-if="rows.length === 0" class="card empty">Tidak ada guru yang cocok dengan filter.</p>

      <!-- Desktop: board guru x tanggal -->
      <div v-else class="board-wrap">
        <table class="board">
          <caption class="sr-only">Status KBM per guru per hari, {{ monthTitle(data.period) }}</caption>
          <thead>
            <tr>
              <th scope="col" class="col-name">Guru</th>
              <th v-for="day in columns" :key="day.date" scope="col" class="col-day"
                :class="{ 'is-holiday': day.kind === 'holiday', 'week-start': day.weekday === 1 }"
                :title="day.kind === 'holiday' ? `Libur: ${day.holidayName}` : longDate(day.date)">
                <span class="dow">{{ dayShort(day.date) }}</span>
                <span class="dnum">{{ dayNumber(day.date) }}</span>
              </th>
              <th scope="col" class="col-sum">Lengkap</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in boardRows" :key="row.guru.id">
              <th scope="row" class="col-name">
                <button type="button" class="name-btn" @click="openDetail(row.guru)">{{ row.guru.name }}</button>
              </th>
              <td v-for="cell in row.cells" :key="cell.date" class="col-day" :class="{ 'week-start': cell.weekStart }">
                <button v-if="cell.clickable" type="button" class="sq" :class="`tone-${cell.tone}`"
                  :aria-label="`${row.guru.name}, ${cell.title}`" :title="cell.title" @click="openDetail(row.guru, cell.date)">
                  {{ cell.symbol }}
                </button>
                <span v-else class="sq" :class="`tone-${cell.tone}`" :title="cell.label" aria-hidden="true">{{ cell.symbol }}</span>
              </td>
              <td class="col-sum">
                <span class="sum-main">{{ row.guru.counts.complete }}/{{ row.guru.counted }}</span>
                <span v-if="row.guru.needsAction" class="sum-flag">{{ row.guru.needsAction }} perlu</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Phone: one card per guru -->
      <ul v-if="rows.length" class="cards">
        <li v-for="guru in rows" :key="guru.id" class="guru-card">
          <div class="card-top">
            <strong>{{ guru.name }}</strong>
            <span class="pct" :class="guru.needsAction ? 'tone-warn' : 'tone-ok'">{{ guru.percent ?? '-' }}%</span>
          </div>
          <div class="bar" role="img" :aria-label="`${guru.counts.complete} dari ${guru.counted} hari lengkap`">
            <span :style="{ width: `${guru.percent || 0}%` }"></span>
          </div>
          <p class="card-sub">{{ guru.counts.complete }} dari {{ guru.counted }} hari lengkap<template v-if="guru.counts.leave"> · {{ guru.counts.leave }} izin/sakit</template></p>
          <div v-if="issueChips(guru.counts).length" class="chips">
            <span v-for="chip in issueChips(guru.counts)" :key="chip.key" class="chip" :class="`tone-${chip.tone}`">{{ chip.text }}</span>
          </div>
          <p v-else class="all-good">Semua lengkap ✓</p>
          <button type="button" class="btn btn-ghost btn-block" @click="openDetail(guru)">Lihat detail</button>
        </li>
      </ul>
    </template>

    <!-- Detail guru -->
    <Teleport to="body">
      <div v-if="detail" class="modal-overlay" @click.self="closeDetail" @keydown.esc="closeDetail">
        <div ref="detailEl" class="modal detail" role="dialog" aria-modal="true" aria-labelledby="detail-title" tabindex="-1">
          <div class="detail-head">
            <div>
              <h2 id="detail-title">{{ detail.guru.name }}</h2>
              <p>{{ monthTitle(data.period) }} · {{ detail.guru.counts.complete }} dari {{ detail.guru.counted }} hari lengkap</p>
            </div>
            <button type="button" class="close" aria-label="Tutup" @click="closeDetail">✕</button>
          </div>

          <div class="strip" aria-hidden="true">
            <span v-for="day in columns" :key="day.date" class="sq sm" :class="[`tone-${cellInfo(detail.guru, day).tone}`, { focus: day.date === detail.focusDate }]"
              :title="`${longDate(day.date)}: ${cellInfo(detail.guru, day).label}`">{{ cellInfo(detail.guru, day).symbol }}</span>
          </div>

          <div class="nudge">
            <button type="button" class="btn btn-primary" :disabled="!canNudge || nudge.sending" @click="sendNudge">
              {{ nudge.sending ? 'Mengirim...' : 'Kirim pengingat WA' }}
            </button>
            <span class="nudge-note">{{ nudgeNote }}</span>
          </div>
          <p v-if="nudge.state" class="nudge-state" :class="`tone-${nudge.state.tone}`" role="status">{{ nudge.state.text }}</p>

          <h3>Perlu tindak lanjut ({{ detail.issues.length }})</h3>
          <p v-if="detail.issues.length === 0" class="all-good">Tidak ada. Semua hari mengajar sudah lengkap.</p>
          <ul v-else class="issues">
            <li v-for="item in detail.issues" :key="item.date" :id="`issue-${item.date}`" :class="{ focus: item.date === detail.focusDate }">
              <div class="issue-head">
                <strong>{{ longDate(item.date) }}</strong>
                <span class="chip" :class="`tone-${STATE_META[item.state].tone}`">{{ STATE_META[item.state].label }}</span>
              </div>
              <ul v-if="item.sessions && item.sessions.length" class="sessions">
                <li v-for="s in item.sessions" :key="s.id">
                  <span>{{ s.slot }} · {{ s.level }}<template v-if="s.substituteFor"> · badal untuk {{ s.substituteFor }}</template></span>
                  <span v-if="s.complete" class="tone-text-ok">lengkap</span>
                  <span v-else class="tone-text-warn">{{ s.missing.join(' & ') }} belum diisi</span>
                </li>
              </ul>
              <p v-else-if="item.state === 'not_created'" class="issue-note">Hadir, tapi belum membuat KBM.</p>
              <p v-else class="issue-note">Belum ada absen kehadiran guru.</p>
            </li>
          </ul>

          <details v-if="completedDays.length" class="done">
            <summary>Hari yang sudah lengkap ({{ completedDays.length }})</summary>
            <ul class="issues">
              <li v-for="item in completedDays" :key="item.date">
                <div class="issue-head"><strong>{{ longDate(item.date) }}</strong></div>
                <ul class="sessions">
                  <li v-for="s in item.sessions" :key="s.id">
                    <span>{{ s.slot }} · {{ s.level }} · {{ s.studentsPresent }}/{{ s.studentsTotal }} santri hadir</span>
                    <span v-if="s.material" class="material">{{ s.material }}</span>
                  </li>
                </ul>
              </li>
            </ul>
          </details>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import api, { clearApiCache } from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useToast } from '@/composables/useToast'
import { loadExcelLib, downloadWorkbook } from '@/utils/excel'
import { buildKbmMonitorWorkbook, monitorFilename } from '@/utils/excelExports'
import {
  STATE_META,
  boardColumns,
  cellInfo,
  dayNumber,
  dayShort,
  filterGurus,
  issueChips,
  issuesOf,
  longDate,
  monthTitle,
} from '@/utils/kbmMonitor'

const { success, error: showError, warning } = useToast()

const legend = {
  complete: STATE_META.complete,
  incomplete: STATE_META.incomplete,
  not_created: STATE_META.not_created,
  no_attendance: STATE_META.no_attendance,
  leave: STATE_META.leave,
}

const data = ref(null)
const loading = ref(true)
const error = ref('')
const period = ref('')
const search = ref('')
const onlyIssues = ref(false)
const detail = ref(null)
const detailEl = ref(null)
const nudge = ref({ sending: false, state: null })
let pollTimer = null

const columns = computed(() => boardColumns(data.value?.days))
const rows = computed(() => filterGurus(data.value?.gurus, { search: search.value, onlyIssues: onlyIssues.value }))
const updatedAt = computed(() => {
  const at = data.value?.generatedAt ? new Date(data.value.generatedAt._seconds ? data.value.generatedAt._seconds * 1000 : data.value.generatedAt) : null
  return at && !Number.isNaN(at.getTime()) ? at.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'
})

// Each board cell is worked out once per data/filter change, not on every render.
const boardRows = computed(() =>
  rows.value.map((guru) => ({
    guru,
    cells: columns.value.map((day) => {
      const info = cellInfo(guru, day)
      const cell = guru.cells?.[day.date]
      return {
        ...info,
        date: day.date,
        weekStart: day.weekday === 1,
        clickable: !!cell && cell.state !== 'before_join',
        title: `${longDate(day.date)}: ${info.label}`,
      }
    }),
  })),
)

const completedDays = computed(() =>
  detail.value
    ? Object.entries(detail.value.guru.cells)
        .filter(([, c]) => c.state === 'complete')
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, c]) => ({ date, ...c }))
    : [],
)

const canNudge = computed(() => !!detail.value?.guru.wa?.canNudge && detail.value.issues.length > 0)
const nudgeNote = computed(() => {
  const guru = detail.value?.guru
  if (!guru) return ''
  if (!guru.wa?.canNudge) return 'Nomor WA belum diatur di menu Notifikasi WA.'
  if (!detail.value.issues.length) return 'Tidak ada yang perlu diingatkan.'
  const last = guru.lastNudge?.at ? new Date(guru.lastNudge.at._seconds ? guru.lastNudge.at._seconds * 1000 : guru.lastNudge.at) : null
  const lastText = last && !Number.isNaN(last.getTime())
    ? ` Terakhir diingatkan ${last.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`
    : ''
  return `Daftar ${detail.value.issues.length} hari di bawah dikirim ke WA guru.${lastText}`
})

// Excel export: the teachers on screen (search and "perlu tindak lanjut" applied), three sheets.
const exportingExcel = ref(false)
const exportExcel = async () => {
  if (exportingExcel.value || !data.value) return
  if (rows.value.length === 0) {
    warning('Tidak ada guru untuk diekspor.')
    return
  }
  exportingExcel.value = true
  try {
    const ExcelJS = await loadExcelLib()
    const filterNote = [search.value.trim() ? `Pencarian "${search.value.trim()}"` : '', onlyIssues.value ? 'Perlu tindak lanjut saja' : '']
      .filter(Boolean)
      .join(', ')
    const workbook = buildKbmMonitorWorkbook(ExcelJS, { data: data.value, gurus: rows.value, filterNote, exportedAt: new Date() })
    const filename = monitorFilename({ period: data.value.period, filtered: !!filterNote })
    await downloadWorkbook(workbook, filename)
    success(`Monitor KBM diekspor ke ${filename}`)
  } catch (err) {
    console.error('Export Monitor KBM error:', err)
    showError('Gagal mengekspor Excel. Periksa koneksi lalu coba lagi.')
  } finally {
    exportingExcel.value = false
  }
}

const load = async (fresh = false) => {
  loading.value = true
  error.value = ''
  try {
    clearApiCache('/kbm-monitor')
    const params = {}
    if (period.value) params.period = period.value
    if (fresh) params.fresh = '1'
    const res = await api.get('/kbm-monitor', { params })
    data.value = res.data
    period.value = res.data.period
    if (detail.value) {
      const guru = res.data.gurus.find((g) => g.id === detail.value.guru.id)
      if (guru) detail.value = { ...detail.value, guru, issues: issuesOf(guru) }
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Gagal memuat monitor KBM.'
  } finally {
    loading.value = false
  }
}

const stopPolling = () => {
  clearTimeout(pollTimer)
  pollTimer = null
}

const openDetail = async (guru, focusDate = null) => {
  stopPolling()
  nudge.value = { sending: false, state: null }
  detail.value = { guru, issues: issuesOf(guru), focusDate }
  await nextTick()
  detailEl.value?.focus()
  if (focusDate) document.getElementById(`issue-${focusDate}`)?.scrollIntoView({ block: 'center' })
}

const closeDetail = () => {
  stopPolling()
  detail.value = null
}

const pollNudge = (id, startedAt) => {
  pollTimer = setTimeout(async () => {
    if (!detail.value) return
    try {
      clearApiCache('/wa-reminders/test')
      const { data: job } = await api.get(`/wa-reminders/test/${id}`)
      if (job.status === 'sent') {
        nudge.value = { sending: false, state: { tone: 'ok', text: 'Pengingat terkirim ke WhatsApp guru.' } }
        return
      }
      if (job.status === 'failed' || job.status === 'expired') {
        nudge.value = { sending: false, state: { tone: 'alert', text: job.status === 'expired' ? 'Bot tidak mengambil pesan dalam 30 menit. Cek status bot di menu Notifikasi WA.' : `Gagal: ${job.error || 'bot tidak bisa mengirim'}` } }
        return
      }
      if (Date.now() - startedAt > 3 * 60 * 1000) {
        nudge.value = { sending: false, state: { tone: 'warn', text: 'Pengingat sudah diantrikan, bot belum mengambilnya. Akan terkirim saat bot aktif.' } }
        return
      }
      pollNudge(id, startedAt)
    } catch {
      pollNudge(id, startedAt)
    }
  }, 3000)
}

const sendNudge = async () => {
  if (!detail.value || nudge.value.sending) return
  nudge.value = { sending: true, state: { tone: 'muted', text: 'Menunggu bot mengirim (biasanya kurang dari 1 menit)...' } }
  try {
    const { data: res } = await api.post(`/kbm-monitor/${detail.value.guru.id}/nudge`, { period: data.value.period })
    detail.value.guru.lastNudge = { at: new Date().toISOString(), jobId: res.id }
    pollNudge(res.id, Date.now())
  } catch (err) {
    nudge.value = { sending: false, state: { tone: 'alert', text: err.response?.data?.error || 'Gagal membuat pengingat.' } }
  }
}

onMounted(() => load())
onBeforeUnmount(stopPolling)
</script>

<style scoped>
.monitor-view {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .monitor-view {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: 16px;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin: 0 0 4px;
}

.page-header p {
  margin: 0;
  color: var(--gray-600);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gray-700);
}

.field.grow {
  flex: 1 1 180px;
}

.input {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--gray-300);
  border-radius: 10px;
  background: #fff;
  font-size: 0.95rem;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--gray-700);
  cursor: pointer;
}

.check input {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px 18px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}

.btn-ghost {
  background: #fff;
  border-color: var(--gray-300);
  color: var(--primary-dark);
}

.btn-icon {
  margin-right: 8px;
  flex: none;
}

.btn-block {
  width: 100%;
}

.card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}

.alert {
  color: #c62828;
}

.empty {
  color: var(--gray-600);
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 10px;
}

@media (min-width: 900px) {
  .stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid var(--gray-200);
}

.stat-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--gray-600);
}

.stat-value {
  font-size: 1.6rem;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  color: var(--gray-800);
}

.stat-sub {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.meta-line {
  margin: 0 0 10px;
  font-size: 0.85rem;
  color: var(--gray-700);
}

.legend {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 0 0 12px;
  padding: 0;
  font-size: 0.78rem;
  color: var(--gray-700);
}

.legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Status squares: colour + symbol, so they read without relying on colour alone */
.sq {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1;
  padding: 0;
}

button.sq {
  cursor: pointer;
}

button.sq:focus-visible,
.name-btn:focus-visible {
  outline: 3px solid var(--primary-300, #81c784);
  outline-offset: 1px;
}

.legend .sq {
  width: 18px;
  height: 18px;
  font-size: 0.65rem;
}

.tone-ok.sq { background: #2e7d32; color: #fff; }
.tone-warn.sq { background: #fde68a; color: #92400e; border-color: #f59e0b; }
.tone-alert.sq { background: #ffedd5; color: #c2410c; border-color: #fb923c; }
.tone-muted.sq { background: #fff; color: var(--gray-600); border-color: var(--gray-400); border-style: dashed; }
.tone-leave.sq { background: var(--gray-100); color: var(--gray-500); }
.tone-off.sq { background: repeating-linear-gradient(135deg, var(--gray-100), var(--gray-100) 3px, transparent 3px, transparent 6px); }
.tone-none.sq { background: transparent; }

.tone-ok { color: #2e7d32; }
.tone-warn { color: #b45309; }
.tone-alert { color: #c2410c; }

/* Board (desktop) */
.board-wrap {
  display: none;
  background: #fff;
  border: 1px solid var(--gray-200);
  border-radius: 14px;
  overflow-x: auto;
  margin-bottom: 16px;
}

@media (min-width: 900px) {
  .board-wrap {
    display: block;
  }
}

.board {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  font-size: 0.82rem;
}

.board th,
.board td {
  padding: 5px 3px;
  text-align: center;
  border-bottom: 1px solid var(--gray-100);
}

.board thead th {
  position: sticky;
  top: 0;
  background: var(--gray-50, #f8fafc);
  font-weight: 600;
  color: var(--gray-600);
  z-index: 1;
}

.col-name {
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 150px;
  max-width: 200px;
  text-align: left !important;
  padding-left: 12px !important;
  background: #fff;
}

.board thead .col-name {
  background: var(--gray-50, #f8fafc);
  z-index: 3;
}

.name-btn {
  padding: 6px 0;
  border: none;
  background: none;
  font: inherit;
  font-weight: 700;
  color: var(--primary-dark);
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.name-btn:hover {
  text-decoration: underline;
}

.col-day .dow,
.col-day .dnum {
  display: block;
  line-height: 1.2;
}

.col-day .dow {
  font-size: 0.68rem;
}

.col-day .dnum {
  font-variant-numeric: tabular-nums;
  color: var(--gray-800);
}

.board thead .is-holiday .dnum {
  color: #c62828;
}

.week-start {
  border-left: 1px solid var(--gray-200);
}

.col-sum {
  min-width: 82px;
  padding-right: 12px !important;
  white-space: nowrap;
}

.sum-main {
  display: block;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.sum-flag {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: #c2410c;
}

/* Cards (phone) */
.cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

@media (min-width: 900px) {
  .cards {
    display: none;
  }
}

.guru-card {
  background: #fff;
  border: 1px solid var(--gray-200);
  border-radius: 14px;
  padding: 14px;
  display: grid;
  gap: 8px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.pct {
  font-size: 1.1rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.bar {
  height: 8px;
  border-radius: 99px;
  background: var(--gray-100);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: #2e7d32;
}

.card-sub {
  margin: 0;
  font-size: 0.8rem;
  color: var(--gray-600);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--gray-100);
  color: var(--gray-700);
}

.chip.tone-warn { background: #fef3c7; color: #92400e; }
.chip.tone-alert { background: #ffedd5; color: #c2410c; }
.chip.tone-ok { background: rgba(46, 125, 50, 0.12); color: #2e7d32; }
.chip.tone-muted { background: var(--gray-100); color: var(--gray-700); }
.chip.tone-leave { background: var(--gray-100); color: var(--gray-500); }

.all-good {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #2e7d32;
}

/* Detail */
.detail {
  width: 100%;
  max-width: 640px !important;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  outline: none;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-head h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--primary-dark);
}

.detail-head p {
  margin: 2px 0 0;
  font-size: 0.85rem;
  color: var(--gray-600);
}

.close {
  width: 44px;
  height: 44px;
  flex: none;
  border: none;
  border-radius: 10px;
  background: var(--gray-100);
  font-size: 1rem;
  cursor: pointer;
}

.strip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 14px;
}

.sq.sm {
  width: 20px;
  height: 20px;
  font-size: 0.65rem;
}

.sq.focus {
  outline: 2px solid var(--primary-dark);
  outline-offset: 1px;
}

.nudge {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.nudge-note {
  flex: 1 1 200px;
  font-size: 0.8rem;
  color: var(--gray-600);
}

.nudge-state {
  margin: 8px 0 0;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  background: var(--gray-50, #f8fafc);
}

.nudge-state.tone-ok { background: rgba(46, 125, 50, 0.1); }
.nudge-state.tone-alert { background: #fef2f2; color: #c62828; }
.nudge-state.tone-warn { background: #fffbeb; }

.detail h3 {
  margin: 16px 0 8px;
  font-size: 0.95rem;
  color: var(--gray-800);
}

.issues {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.issues > li {
  padding: 10px 12px;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
}

.issues > li.focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.15);
}

.issue-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.issue-note {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: var(--gray-600);
}

.sessions {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: grid;
  gap: 4px;
  font-size: 0.82rem;
}

.sessions li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2px 10px;
  color: var(--gray-700);
}

.tone-text-ok { color: #2e7d32; font-weight: 600; }
.tone-text-warn { color: #b45309; font-weight: 600; }

.material {
  flex-basis: 100%;
  color: var(--gray-500);
  font-size: 0.78rem;
}

.done {
  margin-top: 14px;
}

.done summary {
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--primary-dark);
  min-height: 44px;
  display: flex;
  align-items: center;
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
