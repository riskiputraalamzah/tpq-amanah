<template>
  <div>
    <router-link to="/wali" class="w-link back-link">← Beranda</router-link>

    <PageSkeleton v-if="loading && !data" :rows="4" label="Memuat progres ananda" />
    <p v-else-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else-if="data">
      <h1 class="w-title">{{ data.santri.name }}</h1>
      <p class="w-lead sub">
        {{ levelName(data.santri.classId) }}<template v-if="data.teacher"> · Pengajar: {{ data.teacher }}</template>
      </p>

      <!-- the latest material, the first thing a parent wants to know -->
      <section v-if="data.lastMaterial" class="w-card last-card" aria-labelledby="last-title">
        <p id="last-title" class="card-label">Materi terakhir · {{ longDate(data.lastMaterial.date) }}</p>
        <p class="last-material">{{ data.lastMaterial.material }}</p>
        <p v-if="data.lastMaterial.supportingMaterial" class="last-support">Materi pendukung: {{ data.lastMaterial.supportingMaterial }}</p>
      </section>

      <!-- month switcher -->
      <div class="month-bar" role="group" aria-label="Pilih bulan">
        <button type="button" class="month-btn" :disabled="!older" aria-label="Bulan sebelumnya" @click="go(older)">‹</button>
        <h2 class="month-title" aria-live="polite">{{ monthTitle(data.month) }}</h2>
        <button type="button" class="month-btn" :disabled="!newer" aria-label="Bulan berikutnya" @click="go(newer)">›</button>
      </div>

      <div class="tiles" role="list" aria-label="Rekap kehadiran">
        <div v-for="t in TILES" :key="t.key" class="tile" :class="`is-${t.key}`" role="listitem">
          <strong>{{ data.summary[t.key] }}</strong>
          <span>{{ t.label }}</span>
        </div>
      </div>

      <!-- Banner crosscheck bila ada pertemuan 7 hari terakhir yang tercatat alfa dan belum dilaporkan -->
      <section v-if="unreportedAlfas.length" class="w-card alfa-alert" aria-labelledby="alfa-alert-title">
        <div class="alfa-alert-top">
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
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </section>

      <h2 class="w-section-title">Pertemuan</h2>
      <p v-if="!data.meetings.length" class="w-card empty">Belum ada catatan KBM untuk ananda di bulan ini.</p>
      <ul v-else class="meetings">
        <li v-for="(m, i) in data.meetings" :id="`mt-${keyOf(m)}`" :key="`${m.date}-${i}`" class="w-card meeting">
          <div class="meeting-head">
            <span class="meeting-date">{{ shortDate(m.date) }}<span class="meeting-slot"> · {{ m.slot === 'wave_2' ? 'Malam' : 'Sore' }}</span></span>
            <span class="w-pill" :class="`is-${STATUS_META[m.status].tone}`">{{ STATUS_META[m.status].label }}</span>
          </div>
          <p v-if="m.material" class="meeting-material">{{ m.material }}</p>
          <p v-else-if="m.noKbm" class="meeting-support">Belum ada catatan materi untuk sesi ini.</p>
          <p v-if="m.supportingMaterial" class="meeting-support">Pendukung: {{ m.supportingMaterial }}</p>
          <p v-if="m.guruName" class="meeting-teacher">{{ m.guruName }}<template v-if="m.badal"> (menggantikan)</template></p>

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
              <span aria-hidden="true">›</span>
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
      </ul>

      <p class="w-help foot">
        Data dari catatan KBM ustadz/ustadzah. Bila absen alfa keliru (7 hari terakhir), ketuk "Laporkan" pada pertemuannya; untuk yang lain,
        hubungi pengajar ananda.
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const loadError = ref('')
const data = ref(null)

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

// reports of the last 30 days, by `${date}|${slot}`
const reports = ref({})
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

async function loadReports() {
  try {
    const res = await api.get(`/wali/santri/${route.params.santriId}/absen-reports`, { cache: false })
    const map = {}
    for (const r of res.data.reports || []) map[`${r.date}|${r.slot}`] = r
    reports.value = map
  } catch {
    reports.value = {}
  }
}

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
    reports.value = { ...reports.value, [keyOf(m)]: res.data }
    formKey.value = ''
  } catch (err) {
    formError.value = err.response?.data?.error || 'Laporan belum terkirim. Periksa koneksi lalu coba lagi.'
    if (err.response?.status === 409) loadReports()
  } finally {
    sending.value = false
  }
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const month = typeof route.query.bulan === 'string' ? route.query.bulan : ''
    const [res] = await Promise.all([
      api.get(`/wali/santri/${route.params.santriId}/progress`, { params: month ? { month } : {}, cache: false }),
      loadReports(),
    ])
    data.value = res.data
    const kor = typeof route.query.koreksi === 'string' ? route.query.koreksi : ''
    if (kor && unreportedAlfas.value.length) {
      const target = kor === 'terbaru'
        ? unreportedAlfas.value[0]
        : unreportedAlfas.value.find((m) => m.date === kor) || unreportedAlfas.value[0]
      if (target) jumpToReport(target)
    }
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Progres belum bisa dimuat. Periksa koneksi lalu muat ulang.'
  } finally {
    loading.value = false
  }
}
function go(month) {
  if (month) router.replace({ query: { ...route.query, bulan: month } })
}

watch(() => route.query.bulan, load)
onMounted(load)
</script>

<style scoped>
.alfa-alert {
  margin-top: 14px;
  padding: 14px 15px;
  background: #fff8ed;
  border-color: #f1cf94;
}

.alfa-alert-top strong {
  font-size: 0.96rem;
  font-weight: 800;
  color: #7c3a0d;
}

.alfa-alert-text {
  margin: 4px 0 10px;
  font-size: 0.85rem;
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
  min-height: 42px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1.5px solid rgba(180, 83, 9, 0.35);
  background: #fff;
  color: #7c3a0d;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.report-open {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  min-height: 44px;
  padding: 6px 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(142, 27, 18, 0.3);
  background: #fff;
  color: #8e1b12;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.report-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.report-quick-btn {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid rgba(10, 92, 64, 0.22);
  background: #eef6f1;
  color: #0a5c40;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.report-hint {
  margin: 0;
}

.report-open:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: 2px;
}

.report-form {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(11, 59, 42, 0.1);
}

.report-q,
.report-label {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--w-ink);
}

.report-note {
  min-height: 72px;
  padding-top: 10px;
  resize: vertical;
}

.report-actions {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 8px;
}

.report-actions .w-btn {
  min-height: 48px;
  font-size: 0.92rem;
}

.report-state {
  margin: 10px 0 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(11, 59, 42, 0.05);
  font-size: 0.84rem;
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

.back-link {
  display: inline-block;
  margin: -4px 0 6px;
  text-decoration: none;
}

.sub {
  margin-bottom: 14px;
}

.last-card {
  background: #fffbeb;
  border-color: #f3d58b;
}

.card-label {
  margin: 0 0 4px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #5b6b62;
}

.last-material {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.last-support {
  margin: 4px 0 0;
  font-size: 0.88rem;
  color: #475a50;
}

.month-bar {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  gap: 8px;
  margin: 20px 0 12px;
}

.month-title {
  margin: 0;
  text-align: center;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0b3b2a;
}

.month-btn {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  border: 1.5px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  color: #0a5c40;
  font: inherit;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.month-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.month-btn:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 4px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
}

.tile strong {
  font-size: 1.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.tile span {
  font-size: 0.8rem;
  font-weight: 700;
  color: #5b6b62;
}

.tile.is-hadir strong { color: #0a5c40; }
.tile.is-izin strong { color: #1d4f8a; }
.tile.is-sakit strong { color: #7c3a0d; }
.tile.is-alfa strong { color: #8e1b12; }

.meetings {
  list-style: none;
  margin: 0;
  padding: 0;
}

.meeting {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
}

.meeting-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.meeting-date {
  font-weight: 800;
  color: #0b3b2a;
}

.meeting-slot {
  font-weight: 600;
  color: #5b6b62;
}

.meeting-material {
  margin: 2px 0 0;
  color: #0b3b2a;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.meeting-support,
.meeting-teacher {
  margin: 0;
  font-size: 0.85rem;
  color: #5b6b62;
}

.empty {
  margin: 0;
  color: #475a50;
}

.foot {
  display: block;
  margin-top: 16px;
  text-align: center;
}
</style>
