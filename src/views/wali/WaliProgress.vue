<template>
  <div>
    <router-link to="/wali" class="w-back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
      Beranda
    </router-link>

    <WaliChildSwitch :active-id="santriId" section="progres" />

    <PageSkeleton v-if="loading && !data" :rows="4" label="Memuat progres ananda" />
    <p v-else-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else-if="data">
      <header class="pg-head">
        <h1 class="w-title">{{ data.santri.name }}</h1>
        <div class="pg-meta">
          <span class="pg-level">{{ levelName(data.santri.classId) }}</span>
          <span v-if="data.teacher" class="pg-teacher">Pengajar: {{ data.teacher }}</span>
        </div>
      </header>

      <!-- Latest material: the #1 thing a parent checks after ngaji -->
      <section v-if="data.lastMaterial" class="w-card last-card" aria-labelledby="last-title">
        <div class="last-top">
          <span class="last-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
          </span>
          <p id="last-title" class="card-label">Materi terakhir · {{ longDate(data.lastMaterial.date) }}</p>
        </div>
        <p class="last-material">{{ data.lastMaterial.material }}</p>
        <p v-if="data.lastMaterial.supportingMaterial" class="last-support"><span class="note-label">Materi penunjang:</span> {{ data.lastMaterial.supportingMaterial }}</p>
        <div v-if="data.lastMaterial.notes" class="teacher-note">
          <span class="note-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Catatan ustadz/ustadzah
          </span>
          <p class="teacher-note-text">{{ data.lastMaterial.notes }}</p>
        </div>
      </section>

      <!-- Cohesive monthly attendance card: month switcher + 4-column summary together -->
      <section class="w-card month-card" aria-label="Rekap kehadiran bulanan">
        <div class="month-bar" role="group" aria-label="Pilih bulan">
          <button type="button" class="month-btn" :disabled="!older" aria-label="Bulan sebelumnya" @click="go(older)">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h2 class="month-title" aria-live="polite">{{ monthTitle(data.month) }}</h2>
          <button type="button" class="month-btn" :disabled="!newer" aria-label="Bulan berikutnya" @click="go(newer)">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <div class="tiles" role="list" aria-label="Rekap kehadiran">
          <div v-for="t in TILES" :key="t.key" class="tile" :class="[`is-${t.key}`, { 'is-zero': !(data.summary[t.key] > 0) }]" role="listitem">
            <strong>{{ data.summary[t.key] }}</strong>
            <span>{{ t.label }}</span>
          </div>
        </div>
      </section>

      <!-- Banner crosscheck bila ada pertemuan 7 hari terakhir yang tercatat alfa dan belum dilaporkan -->
      <section v-if="unreportedAlfas.length" class="w-card alfa-alert" aria-labelledby="alfa-alert-title">
        <div class="alfa-alert-top">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <strong id="alfa-alert-title">Crosscheck Absen Alfa ({{ unreportedAlfas.length }} pertemuan)</strong>
        </div>
        <p class="alfa-alert-text">
          Tercatat <strong>Alfa</strong> dalam 7 hari terakhir, padahal ananda sebenarnya <strong>Hadir, Izin, atau Sakit</strong>?
          Ajukan crosscheck agar langsung dikirim lewat WA Bot ke <strong>Guru Jilid</strong> dan <strong>Admin TPQ</strong> untuk dikoreksi.
        </p>
        <div class="alfa-alert-list">
          <button
            v-for="m in unreportedAlfas"
            :key="keyOf(m)"
            type="button"
            class="alfa-alert-btn"
            @click="jumpToReport(m)"
          >
            <span>Crosscheck {{ shortDate(m.date) }} ({{ m.slot === 'wave_2' ? 'Malam' : 'Sore' }})</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </section>

      <div class="w-section-head">
        <h2 class="w-section-title">Pertemuan</h2>
        <span v-if="data.meetings.length" class="mt-count">{{ data.meetings.length }} catatan</span>
      </div>

      <p v-if="!data.meetings.length" class="w-card empty">Belum ada catatan KBM untuk ananda di bulan ini.</p>

      <!-- Single clean chronological ledger card instead of 20 heavy floating cards -->
      <ol v-else class="w-card meetings">
        <li
          v-for="(m, i) in data.meetings"
          :id="`mt-${keyOf(m)}`"
          :key="`${m.date}-${i}`"
          class="meeting"
          :class="[`is-st-${m.status}`, { 'is-holiday': m.status === 'libur', 'is-open-form': formKey === keyOf(m) }]"
        >
          <div class="meeting-head">
            <span class="meeting-date">{{ shortDate(m.date) }}<span class="meeting-slot"> · {{ m.slot === 'wave_2' ? 'Malam' : 'Sore' }}</span></span>
            <span class="w-pill" :class="`is-${STATUS_META[m.status]?.tone || 'info'}`">{{ STATUS_META[m.status]?.label || m.status }}</span>
          </div>
          <template v-if="m.status === 'libur'">
            <p class="meeting-holiday-reason">{{ m.holidayReason || 'Sesi diliburkan oleh TPQ' }}</p>
            <p class="meeting-support">Sesi ini diliburkan dan tidak memengaruhi rekap kehadiran ananda.</p>
          </template>
          <template v-else>
            <p v-if="m.material" class="meeting-material">{{ m.material }}</p>
            <p v-else-if="m.noKbm" class="meeting-support">Belum ada catatan materi untuk sesi ini.</p>
            <p v-if="m.supportingMaterial" class="meeting-support"><span class="note-label">Materi penunjang:</span> {{ m.supportingMaterial }}</p>
            <div v-if="m.notes" class="teacher-note is-compact">
              <span class="note-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                Catatan ustadz/ustadzah
              </span>
              <p class="teacher-note-text">{{ m.notes }}</p>
            </div>
            <p v-if="m.guruName" class="meeting-teacher">{{ m.guruName }}<template v-if="m.badal"> (menggantikan)</template></p>
            <p v-if="m.holidayReason" class="meeting-holiday-note">Catatan: Sesi ini kemudian diliburkan TPQ ({{ m.holidayReason }}).</p>
          </template>

          <!-- "Laporkan absen keliru": checked by the ustadz/ustadzah, the answer comes by WhatsApp -->
          <template v-if="reportOf(m)">
            <p v-if="reportOf(m).state === 'open'" class="report-state is-open" role="status">
              Laporan terkirim: menurut Bapak/Ibu <strong>{{ STATUS_META[reportOf(m).want]?.label }}</strong>. Sedang dicek ustadz/ustadzah.
            </p>
            <p v-else-if="reportOf(m).resolution === 'fixed'" class="report-state is-done">
              Sudah dibetulkan menjadi <strong>{{ STATUS_META[reportOf(m).want]?.label }}</strong>.
            </p>
            <p v-else class="report-state">
              Sudah dicek: tetap {{ STATUS_META[reportOf(m).recorded]?.label || 'tercatat' }}.<template v-if="reportOf(m).answer"> "{{ reportOf(m).answer }}"</template>
            </p>
          </template>
          <template v-else-if="canReport(m)">
            <button v-if="formKey !== keyOf(m)" type="button" class="report-open" @click="openForm(m)">
              <span>Absen ini keliru? Crosscheck / Koreksi</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <form v-else class="report-form" @submit.prevent="sendReport(m)">
              <p :id="`rp-${keyOf(m)}`" class="report-q">Yang benar, ananda pada hari tersebut:</p>
              <div class="w-chips" role="radiogroup" :aria-labelledby="`rp-${keyOf(m)}`">
                <button v-for="o in WANTS" :key="o.key" type="button" role="radio" class="w-chip" :aria-checked="form.want === o.key" @click="pickWant(o.key)">
                  {{ o.label }}
                </button>
              </div>
              <div v-if="form.want && QUICK_NOTES[form.want]?.length" class="report-quick">
                <button
                  v-for="qn in QUICK_NOTES[form.want]"
                  :key="qn"
                  type="button"
                  class="report-quick-btn"
                  :class="{ 'is-picked': form.note === qn }"
                  @click="form.note = qn"
                >
                  {{ qn }}
                </button>
              </div>
              <label class="report-label" :for="`rn-${keyOf(m)}`">Alasan / Keterangan Crosscheck</label>
              <textarea :id="`rn-${keyOf(m)}`" v-model="form.note" class="w-input report-note" rows="2" maxlength="300"
                placeholder="Misalnya: ananda hadir mengikuti ngaji hari tersebut / datang terlambat pukul 15.30"></textarea>
              <p class="w-help report-hint">
                Laporan ini dikirim lewat WA Bot ke Guru Jilid ananda &amp; Admin TPQ. Setelah disetujui, konfirmasi perubahan absen dikirim ke WhatsApp Bapak/Ibu.
              </p>
              <p v-if="formError" class="w-error" role="alert">{{ formError }}</p>
              <div class="report-actions">
                <button type="button" class="w-btn w-btn-ghost" @click="formKey = ''">Batal</button>
                <button type="submit" class="w-btn w-btn-primary" :disabled="sending || !form.want || form.note.trim().length < 3">
                  {{ sending ? 'Mengirim…' : 'Kirim laporan' }}
                </button>
              </div>
            </form>
          </template>
        </li>
      </ol>

      <p class="w-help foot">
        Data dari catatan KBM ustadz/ustadzah. Bila absen alfa keliru (7 hari terakhir), ketuk "Crosscheck / Koreksi" pada pertemuannya; untuk yang lain,
        hubungi pengajar ananda.
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import WaliChildSwitch from './WaliChildSwitch.vue'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch, warmUpMonth } from '@/utils/waliData'

const route = useRoute()
const router = useRouter()
const santriId = route.params.santriId
const monthQ = computed(() => (typeof route.query.bulan === 'string' ? route.query.bulan : ''))
// shown at once from the last visit (or the warm-up after Beranda); another month keeps this one on screen until it
// arrives (no blank page between months)
const progress = useWaliResource(() => WALI_KEYS.progress(santriId, monthQ.value), (k) => waliFetch.progress(santriId, monthQ.value), { keepPrevious: true })
const reportsRes = useWaliResource(() => WALI_KEYS.reports(santriId), () => waliFetch.reports(santriId))
const loading = computed(() => progress.loading.value)
const loadError = computed(() => progress.error.value)
const data = computed(() => progress.data.value)

const TILES = [
  { key: 'hadir', label: 'Hadir' },
  { key: 'izin', label: 'Izin' },
  { key: 'sakit', label: 'Sakit' },
  { key: 'alfa', label: 'Alfa' },
]
const STATUS_META = {
  hadir: { label: 'Hadir', tone: 'ok' },
  izin: { label: 'Izin', tone: 'info' },
  sakit: { label: 'Sakit', tone: 'warn' },
  alfa: { label: 'Alfa', tone: 'danger' },
  libur: { label: 'Libur Sesi', tone: 'holiday' },
}
const WANTS = [
  { key: 'hadir', label: 'Hadir' },
  { key: 'izin', label: 'Izin' },
  { key: 'sakit', label: 'Sakit' },
]
const QUICK_NOTES = {
  hadir: ['Ananda hadir mengikuti ngaji hari tersebut', 'Ananda hadir namun datang terlambat'],
  izin: ['Ananda izin acara keluarga', 'Ananda izin kegiatan sekolah'],
  sakit: ['Ananda sakit dan istirahat di rumah', 'Ananda kurang enak badan'],
}
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const monthTitle = (ym) => {
  const [y, m] = String(ym).split('-').map(Number)
  return y && m ? `${MONTHS[m - 1]} ${y}` : ''
}
const parts = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number)
  return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }
}
const shortDate = (iso) => {
  const { m, d, wd } = parts(iso)
  return `${DAYS[wd]}, ${d} ${MONTHS[m - 1].slice(0, 3)}`
}
const longDate = (iso) => {
  const { y, m, d, wd } = parts(iso)
  return `${DAYS[wd]}, ${d} ${MONTHS[m - 1]} ${y}`
}

// months come newest first
const index = computed(() => data.value?.months.indexOf(data.value.month) ?? -1)
const older = computed(() => (index.value >= 0 ? data.value.months[index.value + 1] : null))
const newer = computed(() => (index.value > 0 ? data.value.months[index.value - 1] : null))
// the month before is made ready quietly: "‹" then shows at once
watch(older, (m) => warmUpMonth(santriId, m), { immediate: true })

// reports of the last 30 days, by `${date}|${slot}` (the server's list, plus the ones just sent from this page)
const sentReports = ref({})
const reports = computed(() => {
  const map = {}
  for (const r of reportsRes.data.value?.reports || []) map[`${r.date}|${r.slot}`] = r
  return { ...map, ...sentReports.value }
})
const formKey = ref('')
const form = ref({ want: '', note: '' })
const formError = ref('')
const sending = ref(false)
const keyOf = (m) => `${m.date}|${m.slot}`
const reportOf = (m) => reports.value[keyOf(m)] || null
const wibToday = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
const weekAgo = () => new Date(Date.now() + 7 * 3600 * 1000 - 7 * 86400000).toISOString().slice(0, 10)
const canReport = (m) => m.status === 'alfa' && m.date >= weekAgo() && m.date <= wibToday()
const unreportedAlfas = computed(() =>
  (data.value?.meetings || []).filter((m) => canReport(m) && !reportOf(m)),
)

const loadReports = () => reportsRes.refresh()

function openForm(m) {
  formKey.value = keyOf(m)
  form.value = { want: 'hadir', note: '' }
  formError.value = ''
}

function pickWant(key) {
  form.value.want = key
}

async function jumpToReport(m) {
  openForm(m)
  await nextTick()
  const el = document.getElementById(`mt-${keyOf(m)}`)
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

async function sendReport(m) {
  sending.value = true
  formError.value = ''
  try {
    const res = await api.post(`/wali/santri/${route.params.santriId}/absen-reports`, { date: m.date, slot: m.slot, want: form.value.want, note: form.value.note })
    sentReports.value = { ...sentReports.value, [keyOf(m)]: res.data }
    loadReports()
    formKey.value = ''
  } catch (err) {
    formError.value = err.response?.data?.error || 'Laporan belum terkirim. Periksa koneksi lalu coba lagi.'
    if (err.response?.status === 409) loadReports()
  } finally {
    sending.value = false
  }
}

// from the kabar alfa link (?koreksi=YYYY-MM-DD): once the fresh progress and reports are in, open its report form
let korDone = false
watch(
  () => progress.ready.value && !progress.refreshing.value && !reportsRes.refreshing.value,
  (ok) => {
    const kor = typeof route.query.koreksi === 'string' ? route.query.koreksi : ''
    if (!ok || korDone || !kor) return
    korDone = true
    if (!unreportedAlfas.value.length) return
    const target = kor === 'terbaru' ? unreportedAlfas.value[0] : unreportedAlfas.value.find((m) => m.date === kor) || unreportedAlfas.value[0]
    if (target) jumpToReport(target)
  },
  { immediate: true },
)
function go(month) {
  if (month) router.replace({ query: { ...route.query, bulan: month } })
}
</script>

<style scoped>
.pg-head {
  margin-bottom: 14px;
}

.pg-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.pg-level {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-size: 0.78rem;
  font-weight: 800;
}

.pg-teacher {
  font-size: 0.86rem;
  color: var(--w-body);
}

/* Latest material highlight */
.last-card {
  background: linear-gradient(160deg, #fffdf6, #fff8e3);
  border-color: #eed085;
}

.last-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.last-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #fde6a8;
  color: #8f4106;
}

.card-label {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: #7c5214;
}

.last-material {
  margin: 0;
  font-size: 1.06rem;
  font-weight: 800;
  line-height: 1.35;
  color: var(--w-ink);
  overflow-wrap: anywhere;
}

.last-support {
  margin: 5px 0 0;
  font-size: 0.86rem;
  line-height: 1.45;
  color: var(--w-body);
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.note-label {
  font-weight: 700;
  color: var(--w-ink);
}

/* Teacher note: full subtle border & soft warm tint (no one-sided bar) */
.teacher-note {
  margin: 10px 0 0;
  padding: 9px 11px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(180, 83, 9, 0.24);
}

.teacher-note .note-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  font-weight: 800;
  color: #8f4106;
}

.teacher-note-text {
  margin: 3px 0 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: #213c2f;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.teacher-note.is-compact {
  margin: 6px 0 2px;
  padding: 8px 10px;
  background: #fcfaf3;
  border-color: rgba(180, 83, 9, 0.2);
}

.teacher-note.is-compact .teacher-note-text {
  font-size: 0.84rem;
}

/* Cohesive monthly attendance card */
.month-card {
  margin-top: 12px;
  padding: 12px 14px 14px;
}

.month-bar {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.month-title {
  margin: 0;
  text-align: center;
  font-size: 1rem;
  font-weight: 800;
  color: var(--w-ink);
}

.month-btn {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.16);
  background: var(--w-surface-soft);
  color: var(--w-emerald);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.month-btn:hover:not(:disabled) {
  background: var(--w-emerald-soft);
}

.month-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.month-btn:focus-visible,
.alfa-alert-btn:focus-visible,
.report-open:focus-visible,
.report-quick-btn:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: 2px;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding-top: 10px;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border-radius: 12px;
  background: #f6f9f7;
}

.tile strong {
  font-size: 1.42rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.tile span {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--w-muted);
}

.tile.is-hadir strong { color: #0a5c40; }
.tile.is-izin strong { color: #19487f; }
.tile.is-sakit strong { color: #8c4009; }
.tile.is-alfa strong { color: #9f1b12; }

.tile.is-alfa:not(.is-zero) {
  background: #fdf2f0;
}

.tile.is-zero strong {
  color: #6b7b72;
  font-weight: 700;
}

/* Alfa alert card */
.alfa-alert {
  margin-top: 12px;
  padding: 13px 14px;
  background: #fff8ed;
  border-color: #eec982;
}

.alfa-alert-top {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #7c3a0d;
}

.alfa-alert-top strong {
  font-size: 0.94rem;
  font-weight: 800;
}

.alfa-alert-text {
  margin: 5px 0 10px;
  font-size: 0.84rem;
  line-height: 1.5;
  color: #5b3a06;
}

.alfa-alert-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alfa-alert-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 11px;
  border: 1.5px solid rgba(154, 71, 8, 0.35);
  background: #fff;
  color: #7c3a0d;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.mt-count {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--w-muted);
  font-variant-numeric: tabular-nums;
}

/* Unified chronological meetings ledger */
.meetings {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.meeting {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 13px 16px;
  scroll-margin-top: 76px;
}

.meeting + .meeting {
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.meeting.is-st-alfa {
  background: #fff7f6;
}

.meeting.is-st-sakit {
  background: #fffcf3;
}

.meeting.is-st-izin {
  background: #f6faff;
}

.meeting.is-holiday {
  background: #f0f9ff;
}

.meeting-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.meeting-date {
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--w-ink);
}

.meeting-slot {
  font-weight: 600;
  color: var(--w-muted);
}

.meeting-material {
  margin: 2px 0 0;
  font-size: 0.94rem;
  line-height: 1.4;
  color: var(--w-ink);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.meeting-support,
.meeting-teacher {
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.42;
  color: var(--w-muted);
  overflow-wrap: anywhere;
}

.meeting-teacher {
  margin-top: 1px;
}

.w-pill.is-holiday {
  background: #e0f2fe;
  color: #075985;
}

.meeting-holiday-reason {
  margin: 2px 0 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: #075985;
  overflow-wrap: anywhere;
}

.meeting-holiday-note {
  margin: 4px 0 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #0369a1;
}

/* Crosscheck / report controls */
.report-open {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  min-height: 44px;
  padding: 6px 12px;
  border-radius: 11px;
  border: 1.5px solid rgba(142, 27, 18, 0.32);
  background: #fff;
  color: #8e1b12;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.report-form {
  display: grid;
  gap: 8px;
  margin-top: 10px;
  padding: 12px;
  border-radius: 13px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.14);
}

.report-q,
.report-label {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--w-ink);
}

.report-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.report-quick-btn {
  min-height: 36px;
  padding: 6px 10px;
  border-radius: 9px;
  border: 1px solid rgba(10, 92, 64, 0.22);
  background: #eef6f1;
  color: var(--w-emerald);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.report-quick-btn.is-picked {
  background: var(--w-emerald);
  border-color: var(--w-emerald);
  color: #fff;
}

.report-note {
  min-height: 72px;
  padding-top: 10px;
  resize: vertical;
}

.report-hint {
  margin: 0;
}

.report-actions {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 8px;
}

.report-actions .w-btn {
  min-height: 46px;
  font-size: 0.9rem;
}

.report-state {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(11, 59, 42, 0.05);
  font-size: 0.83rem;
  line-height: 1.45;
  color: var(--w-ink);
}

.report-state.is-open {
  background: #fff8e6;
  color: #6b4a12;
}

.report-state.is-done {
  background: #e3f1ea;
  color: #0a5c40;
}

.empty {
  margin: 0;
  color: var(--w-body);
}

.foot {
  display: block;
  margin-top: 16px;
  text-align: center;
}
</style>
