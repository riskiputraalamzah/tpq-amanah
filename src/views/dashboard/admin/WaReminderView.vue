<template>
  <div class="wa-view">
    <header class="page-header">
      <h1>Notifikasi WhatsApp</h1>
      <p>Atur pengingat absen yang dikirim bot WhatsApp ke setiap guru, Senin–Jumat.</p>
    </header>

    <PageSkeleton v-if="loading" variant="form" :rows="6" label="Memuat pengaturan notifikasi" />

    <div v-else-if="loadError" class="card">
      <p class="alert alert-error">{{ loadError }}</p>
      <button type="button" class="btn btn-primary" @click="load">Coba lagi</button>
    </div>

    <template v-else>
      <!-- Status bot -->
      <section class="card status-card" aria-labelledby="bot-status-title">
        <div class="status-head">
          <h2 id="bot-status-title">Status bot</h2>
          <span class="pill" :class="botStatus.tone">{{ botStatus.label }}</span>
        </div>
        <p class="status-detail">{{ botStatus.detail }}</p>
        <p v-if="bot.scheduleSource === 'file'" class="alert alert-warning">
          Bot masih memakai jadwal lama dari <code>contacts.json</code>. Setelah pengaturan di bawah sudah benar
          dan pesan tes berhasil, ubah <code>WA_SCHEDULE_SOURCE=backend</code> di VM lalu restart bot.
        </p>
        <ul v-if="lastRunItems.length" class="last-runs">
          <li v-for="run in lastRunItems" :key="run.type">
            <span class="run-label">{{ run.label }}</span>
            <span class="run-value">{{ run.value }}</span>
          </li>
        </ul>
      </section>

      <!-- Alur pesan harian -->
      <section class="card" aria-labelledby="flow-title">
        <h2 id="flow-title">Alur pesan harian</h2>

        <div class="session-grid">
          <fieldset v-for="key in ['sore', 'malam']" :key="key" class="session-box">
            <legend>{{ key === 'sore' ? 'Sesi Sore' : 'Sesi Malam' }}</legend>
            <label class="field">
              <span>Pesan awal sesi</span>
              <input v-model="form.sessions[key].start" type="time" class="form-input" required />
            </label>
            <label class="field">
              <span>Cek akhir sesi</span>
              <input v-model="form.sessions[key].end" type="time" class="form-input" required />
            </label>
          </fieldset>
        </div>

        <ul class="toggle-list">
          <li>
            <label class="toggle-row">
              <span class="toggle-text">
                <strong>Pesan awal sesi</strong>
                <small>Link absen Hadir/Tidak Hadir dan pengingat mengisi absen santri &amp; jurnal KBM.</small>
              </span>
              <input v-model="form.startMessage.enabled" type="checkbox" role="switch" class="switch" />
            </label>
          </li>
          <li>
            <label class="toggle-row">
              <span class="toggle-text">
                <strong>Cek akhir sesi</strong>
                <small>Sudah lengkap: ucapan terima kasih. Belum isi KBM: pengingat KBM. Belum absen: link absen lagi. Izin/sakit: tidak dikirim.</small>
              </span>
              <input v-model="form.endCheck.enabled" type="checkbox" role="switch" class="switch" />
            </label>
          </li>
          <li>
            <div class="toggle-row">
              <label class="toggle-text" for="recap-switch">
                <strong>Rekap belum absen</strong>
                <small>Hanya di hari aktif mengajar. Berisi tanggal bulan ini yang belum diabsen atau KBM-nya belum diisi.</small>
              </label>
              <input v-model="form.nightlyRecap.time" type="time" class="form-input time-inline" aria-label="Jam rekap belum absen"
                :disabled="!form.nightlyRecap.enabled" />
              <input id="recap-switch" v-model="form.nightlyRecap.enabled" type="checkbox" role="switch" class="switch" />
            </div>
          </li>
          <li>
            <div class="toggle-row">
              <label class="toggle-text" for="coverage-switch">
                <strong>Jaga sesi agar tidak kosong guru</strong>
                <small>Jika guru lain di sesi yang sama berhalangan dan tinggal satu guru yang belum absen, guru itu diminta hadir
                  (berisi siapa saja yang berhalangan). Jika semua berhalangan, nomor admin di bawah diberi peringatan. Dicek tiap 5 menit.</small>
              </label>
              <select v-model.number="form.coverageAlert.leadMinutes" class="form-input time-inline lead-select"
                aria-label="Mulai dipantau sebelum sesi" :disabled="!form.coverageAlert.enabled">
                <option :value="60">1 jam sebelum</option>
                <option :value="120">2 jam sebelum</option>
                <option :value="180">3 jam sebelum</option>
                <option :value="240">4 jam sebelum</option>
              </select>
              <input id="coverage-switch" v-model="form.coverageAlert.enabled" type="checkbox" role="switch" class="switch" />
            </div>
            <label v-if="form.coverageAlert.enabled" class="admin-numbers">
              <span>Nomor WA admin untuk peringatan sesi kosong guru (pisahkan dengan koma, maks. 5)</span>
              <input v-model="form.coverageAlert.adminNumbersText" type="text" inputmode="tel" class="form-input"
                placeholder="0812xxxxxxxx, 0813xxxxxxxx" />
              <small v-if="!form.coverageAlert.adminNumbersText.trim()" class="field-warn">
                Belum diisi: kalau satu sesi kosong guru, belum ada yang diberi tahu.
              </small>
            </label>
          </li>
        </ul>
        <p class="hint">Pesan Sabtu, Minggu, dan info libur tetap terkirim otomatis seperti biasa.</p>
      </section>

      <!-- Guru -->
      <section class="card" aria-labelledby="guru-title">
        <div class="section-head">
          <h2 id="guru-title">Guru ({{ activeCount }} aktif dari {{ gurus.length }})</h2>
        </div>
        <p v-if="gurus.length === 0" class="alert alert-warning">Belum ada akun guru.</p>

        <ul class="guru-list">
          <li v-for="guru in gurus" :key="guru.id" class="guru-item" :class="{ 'is-off': !form.gurus[guru.id].enabled }">
            <div class="guru-top">
              <div class="guru-name">
                <strong>{{ guru.displayName }}</strong>
                <small>{{ timesLabel(form.gurus[guru.id]) }}</small>
              </div>
              <label class="toggle-inline">
                <span class="sr-only">Notifikasi WA untuk {{ guru.displayName }}</span>
                <span aria-hidden="true">{{ form.gurus[guru.id].enabled ? 'Aktif' : 'Nonaktif' }}</span>
                <input v-model="form.gurus[guru.id].enabled" type="checkbox" role="switch" class="switch" />
              </label>
            </div>

            <div class="guru-fields">
              <label class="field">
                <span>Nomor WA</span>
                <input v-model="form.gurus[guru.id].number" type="tel" inputmode="tel" class="form-input"
                  placeholder="08xx atau 628xx" autocomplete="off" />
              </label>
              <label class="field">
                <span>Nama di pesan</span>
                <input v-model="form.gurus[guru.id].waName" type="text" class="form-input" maxlength="60"
                  :placeholder="guru.displayName" />
              </label>
              <label class="field">
                <span>Sesi</span>
                <select v-model="form.gurus[guru.id].session" class="form-input">
                  <option value="sore">Sesi Sore</option>
                  <option value="malam">Sesi Malam</option>
                  <option value="custom">Jam lain</option>
                </select>
              </label>
              <template v-if="form.gurus[guru.id].session === 'custom'">
                <label class="field">
                  <span>Pesan awal</span>
                  <input v-model="form.gurus[guru.id].startTime" type="time" class="form-input" />
                </label>
                <label class="field">
                  <span>Cek akhir</span>
                  <input v-model="form.gurus[guru.id].endTime" type="time" class="form-input" />
                </label>
              </template>
            </div>

            <div class="guru-actions">
              <button type="button" class="btn btn-ghost btn-sm" @click="openTest(guru)">Kirim pesan tes</button>
            </div>
          </li>
        </ul>
      </section>

      <div class="save-bar" :class="{ visible: isDirty }" role="region" aria-label="Simpan perubahan">
        <span>Ada perubahan yang belum disimpan</span>
        <div class="save-actions">
          <button type="button" class="btn btn-ghost" :disabled="saving" @click="resetForm">Batalkan</button>
          <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </template>

    <!-- Kirim pesan tes -->
    <Teleport to="body">
      <div v-if="testDialog" class="modal-overlay" @click.self="closeTest" @keydown.esc="closeTest">
        <div class="modal glass-card test-modal" role="dialog" aria-modal="true" aria-labelledby="test-title">
          <h3 id="test-title">Kirim pesan tes</h3>
          <p class="test-intro">
            Contoh pesan untuk <strong>{{ testDialog.guru.displayName }}</strong> memakai data absen asli hari ini,
            tapi dikirim ke nomor di bawah. Link absen di pesan tes tidak mencatat absensi.
          </p>
          <p v-if="isDirty" class="alert alert-warning">Simpan perubahan dulu. Pesan tes memakai pengaturan yang sudah tersimpan.</p>

          <fieldset class="test-types">
            <legend>Jenis pesan</legend>
            <label v-for="option in testTypes" :key="option.value" class="radio-row">
              <input v-model="testDialog.type" type="radio" name="test-type" :value="option.value" />
              <span><strong>{{ option.label }}</strong><small>{{ option.hint }}</small></span>
            </label>
          </fieldset>

          <label class="field">
            <span>Kirim ke nomor</span>
            <input ref="testNumberInput" v-model="testDialog.number" type="tel" inputmode="tel" class="form-input"
              placeholder="08xx atau 628xx" />
          </label>

          <p v-if="testDialog.state" class="test-state" :class="testDialog.state.tone" role="status">{{ testDialog.state.text }}</p>

          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeTest">Tutup</button>
            <button type="button" class="btn btn-primary" :disabled="testDialog.sending || isDirty" @click="sendTest">
              {{ testDialog.sending ? 'Menunggu bot...' : 'Kirim tes' }}
            </button>
          </div>
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

const { success, error: showError, warning } = useToast()

const TEST_NUMBER_KEY = 'wa-reminder-test-number'
const testTypes = [
  { value: 'start', label: 'Awal sesi', hint: 'Selamat mengajar + link absen' },
  { value: 'end', label: 'Cek akhir sesi', hint: 'Sesuai status absen guru hari ini' },
  { value: 'recap', label: 'Rekap belum absen', hint: 'Daftar tanggal yang belum lengkap bulan ini' },
]
const RUN_LABELS = { start: 'Pesan awal sesi', end: 'Cek akhir sesi', recap: 'Rekap belum absen', coverage: 'Jaga sesi tidak kosong guru' }

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const gurus = ref([])
const bot = ref({})
const form = ref(null)
const snapshot = ref('')
const testDialog = ref(null)
const testNumberInput = ref(null)
const nowTick = ref(Date.now())
let pollTimer = null
let clockTimer = null

const toDate = (value) => {
  if (!value) return null
  if (value._seconds !== undefined) return new Date(value._seconds * 1000)
  if (value.seconds !== undefined) return new Date(value.seconds * 1000)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const relative = (date) => {
  const minutes = Math.round((nowTick.value - date.getTime()) / 60000)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

// WhatsApp state as reported by the bot (whatsapp-web.js states plus "ready").
const WA_STATES = {
  ready: { tone: 'ok', label: 'Online', text: 'WhatsApp terhubung' },
  CONNECTED: { tone: 'ok', label: 'Online', text: 'WhatsApp terhubung' },
  QR_RECEIVED: { tone: 'warn', label: 'Perlu scan QR', text: 'WhatsApp menunggu scan QR di halaman /scan bot' },
  AUTHENTICATED: { tone: 'warn', label: 'Menyambung...', text: 'WhatsApp sedang menyambung' },
  INITIALIZING: { tone: 'warn', label: 'Menyambung...', text: 'Bot sedang menyalakan WhatsApp' },
  OPENING: { tone: 'warn', label: 'Menyambung...', text: 'WhatsApp sedang menyambung' },
  PAIRING: { tone: 'warn', label: 'Menyambung...', text: 'WhatsApp sedang menyambung' },
  NOT_STARTED: { tone: 'warn', label: 'Menyambung...', text: 'Bot sedang menyalakan WhatsApp' },
  RECONNECTING: { tone: 'warn', label: 'Menyambung ulang...', text: 'WhatsApp terputus, bot sedang menyambung ulang otomatis' },
}

const botStatus = computed(() => {
  const last = toDate(bot.value.lastSyncAt)
  if (!last) {
    return { tone: 'neutral', label: 'Belum terhubung', detail: 'Bot belum pernah mengambil pengaturan ini. Pastikan bot versi terbaru sudah berjalan di VM.' }
  }
  const minutes = (nowTick.value - last.getTime()) / 60000
  if (minutes > 10) {
    return { tone: 'danger', label: 'Tidak ada kabar', detail: `Kabar terakhir dari bot ${relative(last)}. Cek bot di VM.` }
  }
  const wa = WA_STATES[bot.value.waState] || { tone: 'danger', label: 'WA terputus', text: 'WhatsApp terputus' }
  return {
    tone: wa.tone,
    label: wa.label,
    detail: `${wa.text} · kabar terakhir ${relative(last)} · perubahan pengaturan dipakai bot paling lambat 5 menit setelah disimpan.`,
  }
})

// Keeps the status card live: one light request every 15 seconds while the tab is visible.
const STATUS_REFRESH_MS = 15000
let statusTimer = null
const refreshBotStatus = async () => {
  if (document.visibilityState !== 'visible') return
  try {
    clearApiCache('/wa-reminders/status')
    const { data } = await api.get('/wa-reminders/status')
    bot.value = data || {}
    nowTick.value = Date.now()
  } catch {
    // Keep the last known status; the next tick tries again.
  }
}
const onVisibility = () => {
  if (document.visibilityState === 'visible') refreshBotStatus()
}

const lastRunItems = computed(() =>
  Object.entries(bot.value.lastRuns || {})
    .filter(([type]) => RUN_LABELS[type])
    .map(([type, run]) => {
      const at = toDate(run.at)
      const when = at ? at.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'
      const parts = [`${run.sent} terkirim`]
      if (run.failed) parts.push(`${run.failed} gagal`)
      if (run.skipped) parts.push(`${run.skipped} tidak perlu`)
      return { type, label: RUN_LABELS[type], value: `${when} · ${parts.join(', ')}` }
    }),
)

const activeCount = computed(() => (form.value ? Object.values(form.value.gurus).filter((g) => g.enabled).length : 0))
const isDirty = computed(() => !!form.value && JSON.stringify(form.value) !== snapshot.value)

const timesLabel = (entry) => {
  if (!form.value || !entry) return ''
  if (entry.session === 'custom') {
    return entry.startTime && entry.endTime ? `Jam lain · ${entry.startTime}–${entry.endTime}` : 'Jam lain · isi jamnya'
  }
  const s = form.value.sessions[entry.session === 'malam' ? 'malam' : 'sore']
  return `${entry.session === 'malam' ? 'Sesi Malam' : 'Sesi Sore'} · ${s.start}–${s.end}`
}

const buildForm = (data) => {
  const gurusForm = {}
  for (const guru of data.gurus) {
    const s = guru.settings || {}
    gurusForm[guru.id] = {
      enabled: !!s.enabled,
      number: s.number || '',
      waName: s.waName || '',
      session: s.session || 'sore',
      startTime: s.startTime || '',
      endTime: s.endTime || '',
    }
  }
  return {
    sessions: {
      sore: { start: data.config.sessions.sore.start, end: data.config.sessions.sore.end },
      malam: { start: data.config.sessions.malam.start, end: data.config.sessions.malam.end },
    },
    startMessage: { enabled: data.config.startMessage.enabled },
    endCheck: { enabled: data.config.endCheck.enabled },
    nightlyRecap: { enabled: data.config.nightlyRecap.enabled, time: data.config.nightlyRecap.time },
    coverageAlert: {
      enabled: data.config.coverageAlert?.enabled !== false,
      leadMinutes: data.config.coverageAlert?.leadMinutes || 180,
      adminNumbersText: (data.config.coverageAlert?.adminNumbers || []).join(', '),
    },
    gurus: gurusForm,
  }
}

const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    clearApiCache('/wa-reminders')
    const { data } = await api.get('/wa-reminders/settings')
    gurus.value = data.gurus
    bot.value = data.bot || {}
    form.value = buildForm(data)
    snapshot.value = JSON.stringify(form.value)
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Gagal memuat pengaturan notifikasi WA.'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = JSON.parse(snapshot.value)
}

const save = async () => {
  if (saving.value) return
  for (const guru of gurus.value) {
    const entry = form.value.gurus[guru.id]
    if (entry.enabled && !entry.number.trim()) {
      warning(`Isi nomor WA ${guru.displayName} atau nonaktifkan notifikasinya.`)
      return
    }
  }
  saving.value = true
  try {
    const payload = JSON.parse(JSON.stringify(form.value))
    for (const entry of Object.values(payload.gurus)) {
      entry.number = entry.number.trim()
      entry.waName = entry.waName.trim()
      if (entry.session !== 'custom') {
        entry.startTime = null
        entry.endTime = null
      }
    }
    payload.coverageAlert = {
      enabled: payload.coverageAlert.enabled,
      leadMinutes: payload.coverageAlert.leadMinutes,
      adminNumbers: payload.coverageAlert.adminNumbersText,
    }
    const { data } = await api.put('/wa-reminders/settings', payload)
    for (const [id, entry] of Object.entries(data.config.gurus)) {
      if (form.value.gurus[id]) form.value.gurus[id].number = entry.number
    }
    // numbers come back normalized (628...)
    form.value.coverageAlert.adminNumbersText = (data.config.coverageAlert?.adminNumbers || []).join(', ')
    snapshot.value = JSON.stringify(form.value)
    success(data.message || 'Pengaturan notifikasi WA tersimpan.')
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menyimpan pengaturan.')
  } finally {
    saving.value = false
  }
}

const readStoredNumber = () => {
  try {
    return localStorage.getItem(TEST_NUMBER_KEY) || ''
  } catch {
    return ''
  }
}

const openTest = async (guru) => {
  testDialog.value = { guru, type: 'start', number: readStoredNumber(), sending: false, state: null }
  await nextTick()
  testNumberInput.value?.focus()
}

const stopPolling = () => {
  clearTimeout(pollTimer)
  pollTimer = null
}

const closeTest = () => {
  stopPolling()
  testDialog.value = null
}

const pollTest = (id, startedAt) => {
  pollTimer = setTimeout(async () => {
    if (!testDialog.value) return
    try {
      clearApiCache('/wa-reminders/test')
      const { data } = await api.get(`/wa-reminders/test/${id}`)
      if (data.status === 'sent') {
        testDialog.value.state = { tone: 'ok', text: 'Terkirim. Cek WhatsApp di nomor tujuan.' }
        testDialog.value.sending = false
        return
      }
      if (data.status === 'failed' || data.status === 'expired') {
        testDialog.value.state = {
          tone: 'danger',
          text: data.status === 'expired' ? 'Bot tidak mengambil pesan dalam 10 menit. Cek bot di VM.' : `Gagal: ${data.error || 'bot tidak bisa mengirim'}`,
        }
        testDialog.value.sending = false
        return
      }
      if (Date.now() - startedAt > 3 * 60 * 1000) {
        testDialog.value.state = { tone: 'warn', text: 'Bot belum mengambil pesan tes. Status akan diperbarui jika dibuka lagi nanti.' }
        testDialog.value.sending = false
        return
      }
      pollTest(id, startedAt)
    } catch {
      pollTest(id, startedAt)
    }
  }, 3000)
}

const sendTest = async () => {
  const dialog = testDialog.value
  if (!dialog || dialog.sending) return
  if (!dialog.number.trim()) {
    warning('Isi nomor WA penerima tes.')
    return
  }
  dialog.sending = true
  dialog.state = { tone: 'neutral', text: 'Menunggu bot mengambil pesan (biasanya kurang dari 1 menit)...' }
  try {
    const { data } = await api.post('/wa-reminders/test', { guruId: dialog.guru.id, type: dialog.type, targetNumber: dialog.number })
    try {
      localStorage.setItem(TEST_NUMBER_KEY, dialog.number.trim())
    } catch {
      // Remembering the number is only a convenience.
    }
    pollTest(data.id, Date.now())
  } catch (err) {
    dialog.sending = false
    dialog.state = { tone: 'danger', text: err.response?.data?.error || 'Gagal membuat pesan tes.' }
  }
}

const warnBeforeLeave = (event) => {
  if (isDirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(() => {
  load()
  clockTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 30000)
  statusTimer = setInterval(refreshBotStatus, STATUS_REFRESH_MS)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('beforeunload', warnBeforeLeave)
})

onBeforeUnmount(() => {
  stopPolling()
  clearInterval(clockTimer)
  clearInterval(statusTimer)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('beforeunload', warnBeforeLeave)
})
</script>

<style scoped>
.wa-view {
  padding-top: 60px;
  padding-bottom: 96px;
}

@media (min-width: 1024px) {
  .wa-view {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 4px;
}

.page-header p {
  font-size: 0.95rem;
  color: var(--gray-600);
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: var(--space-xl);
}

@media (max-width: 640px) {
  .card {
    padding: var(--space-lg);
  }
}

.card h2 {
  font-size: 1.15rem;
  color: var(--primary-dark);
  margin: 0 0 var(--space-md);
}

.status-head,
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.status-head h2 {
  margin: 0;
}

.status-detail {
  margin: var(--space-sm) 0 0;
  font-size: 0.9rem;
  color: var(--gray-700);
}

.pill {
  flex: none;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.pill.ok {
  background: rgba(46, 125, 50, 0.12);
  color: #0f6b4a;
}

.pill.warn {
  background: rgba(239, 108, 0, 0.12);
  color: #b45309;
}

.pill.danger {
  background: rgba(211, 47, 47, 0.12);
  color: #c62828;
}

.pill.neutral {
  background: var(--gray-100);
  color: var(--gray-700);
}

.last-runs {
  list-style: none;
  margin: var(--space-md) 0 0;
  padding: var(--space-md) 0 0;
  border-top: 1px solid var(--gray-200);
  display: grid;
  gap: 6px;
}

.last-runs li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 12px;
  font-size: 0.85rem;
}

.run-label {
  font-weight: 600;
  color: var(--gray-700);
}

.run-value {
  color: var(--gray-600);
  font-variant-numeric: tabular-nums;
}

.session-grid {
  display: grid;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

@media (min-width: 640px) {
  .session-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.session-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin: 0;
  padding: var(--space-md);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
}

.session-box legend {
  padding: 0 6px;
  font-weight: 700;
  color: var(--primary-dark);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field > span {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gray-700);
}

.form-input {
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  background: #fff;
}

.form-input:disabled {
  background: var(--gray-100);
  color: var(--gray-500);
}

.toggle-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-sm);
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  cursor: pointer;
}

.toggle-text {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}

.toggle-text small {
  color: var(--gray-600);
  line-height: 1.4;
}

.time-inline {
  width: 120px;
  flex: none;
}

.lead-select {
  width: 160px;
}

.admin-numbers {
  display: grid;
  gap: 4px;
  margin-top: var(--space-sm);
  padding: 0 var(--space-md);
  font-size: 0.85rem;
  color: var(--gray-700);
}

.field-warn {
  color: #b45309;
}

@media (max-width: 480px) {
  .toggle-row {
    flex-wrap: wrap;
  }

  .toggle-row .toggle-text {
    flex-basis: calc(100% - 60px);
  }

  .time-inline {
    order: 3;
    width: 100%;
  }
}

.hint {
  margin: var(--space-md) 0 0;
  font-size: 0.85rem;
  color: var(--gray-600);
}

.guru-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-md);
}

.guru-item {
  padding: var(--space-md);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  transition: opacity 0.2s ease;
}

.guru-item.is-off .guru-fields {
  opacity: 0.6;
}

.guru-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.guru-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.guru-name strong {
  color: var(--gray-800);
  overflow-wrap: anywhere;
}

.guru-name small {
  color: var(--gray-600);
  font-variant-numeric: tabular-nums;
}

.toggle-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-700);
  cursor: pointer;
}

.guru-fields {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .guru-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1200px) {
  .guru-fields {
    grid-template-columns: 1.1fr 1.1fr 0.9fr 0.7fr 0.7fr;
  }
}

.guru-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-sm);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}

.btn-ghost {
  background: transparent;
  color: var(--primary-dark);
  border: 1px solid var(--gray-300);
}

.btn-ghost:hover {
  background: var(--gray-100);
}

.btn-sm {
  min-height: 40px;
  padding: 8px 14px;
  font-size: 0.85rem;
}

.save-bar {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 50;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm) var(--space-md);
  padding: 12px 16px;
  background: #fff;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  transform: translateY(150%);
  visibility: hidden;
  transition: transform 0.25s ease, visibility 0s linear 0.25s;
  font-weight: 600;
  color: var(--gray-800);
}

.save-bar.visible {
  transform: translateY(0);
  visibility: visible;
  transition: transform 0.25s ease, visibility 0s;
}

@media (min-width: 1024px) {
  .save-bar {
    left: calc(280px + 24px);
    right: 24px;
  }
}

.save-actions {
  display: flex;
  gap: var(--space-sm);
}

.alert {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  margin: var(--space-md) 0 0;
  font-size: 0.85rem;
  line-height: 1.5;
}

.alert-error {
  background: rgba(244, 67, 54, 0.1);
  color: #c62828;
}

.alert-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

code {
  font-size: 0.85em;
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 5px;
  border-radius: 4px;
  overflow-wrap: anywhere;
}

.test-modal {
  max-width: 480px !important;
  width: 100%;
  padding: 24px;
  background: #fff;
  display: grid;
  gap: var(--space-md);
}

.test-modal h3 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--primary-dark);
}

.test-intro {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--gray-700);
}

.test-modal .alert {
  margin: 0;
}

.test-types {
  margin: 0;
  padding: 0;
  border: none;
  display: grid;
  gap: 6px;
}

.test-types legend {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: 6px;
}

.radio-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.radio-row:has(input:checked) {
  border-color: var(--primary);
  background: rgba(46, 125, 50, 0.06);
}

.radio-row input {
  margin-top: 3px;
  accent-color: var(--primary);
}

.radio-row span {
  display: flex;
  flex-direction: column;
}

.radio-row small {
  color: var(--gray-600);
}

.test-state {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  background: var(--gray-50);
  color: var(--gray-700);
}

.test-state.ok {
  background: rgba(46, 125, 50, 0.1);
  color: #0f6b4a;
}

.test-state.danger {
  background: rgba(211, 47, 47, 0.1);
  color: #c62828;
}

.test-state.warn {
  background: #fffbeb;
  color: #92400e;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.switch {
  appearance: none;
  position: relative;
  flex: none;
  width: 46px;
  height: 26px;
  margin: 0;
  border-radius: 999px;
  background: var(--gray-300, #d4d4d8);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.switch:checked {
  background: var(--primary);
}

.switch:checked::after {
  transform: translateX(20px);
}

.switch:focus-visible {
  outline: 3px solid var(--primary-300, #81c784);
  outline-offset: 2px;
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
