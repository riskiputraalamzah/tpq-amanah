<template>
  <div class="lpj-view">
    <header class="page-header">
      <h1>LPJ Insentif Guru</h1>
      <p>Disusun otomatis dari absensi guru, absensi santri, jurnal KBM, dan profil guru. Admin cukup memilih periode lalu export PDF.</p>
    </header>

    <PageSkeleton v-if="loading" variant="form" :rows="6" label="Memuat LPJ" />

    <div v-else-if="loadError" class="card">
      <p class="alert alert-error">{{ loadError }}</p>
      <button type="button" class="btn btn-primary" @click="loadAll">Coba lagi</button>
    </div>

    <!-- ============ Detail satu LPJ ============ -->
    <template v-else-if="selected">
      <button type="button" class="btn btn-ghost btn-sm back" @click="closeBatch">← Semua LPJ</button>

      <section class="card">
        <div class="batch-head">
          <div>
            <h2>{{ selected.title }}</h2>
            <p class="muted">{{ selected.rangeLabel }} · {{ selected.months.length }} bulan · tanggal dokumen {{ formatDate(selected.docDate) }} · {{ selected.guruIds.length }} guru</p>
          </div>
          <div class="head-actions">
            <button type="button" class="btn btn-ghost btn-sm" @click="editing = !editing">{{ editing ? 'Tutup' : 'Ubah' }}</button>
            <button type="button" class="btn btn-ghost btn-sm danger" @click="removeBatch">Hapus</button>
          </div>
        </div>

        <form v-if="editing" class="edit-form" @submit.prevent="saveEdit">
          <label class="field">
            <span>Judul</span>
            <input v-model="editForm.title" class="input" maxlength="120" />
          </label>
          <label class="field">
            <span>Tanggal dokumen (SPTJM &amp; tanda tangan)</span>
            <input v-model="editForm.docDate" type="date" class="input" />
          </label>
          <fieldset class="field guru-pick">
            <legend>Guru dalam LPJ ini</legend>
            <label v-for="g in teachers" :key="g.id" class="pick">
              <input v-model="editForm.guruIds" type="checkbox" :value="g.id" />
              <span>{{ g.name }}</span>
            </label>
          </fieldset>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="savingEdit">{{ savingEdit ? 'Menyimpan...' : 'Simpan' }}</button>
          </div>
        </form>
      </section>

      <PageSkeleton v-if="readinessLoading" variant="list" :rows="4" label="Memeriksa kelengkapan" />

      <template v-else-if="readiness">
        <p v-if="readiness.tpqMissing.length" class="alert alert-warning">
          Profil TPQ belum lengkap: {{ readiness.tpqMissing.join(', ') }}. Lengkapi di menu
          <router-link to="/dashboard/tpq-profile">Profil TPQ</router-link> agar tanda tangan di PDF terisi.
        </p>

        <section class="card summary">
          <div class="summary-text">
            <strong class="big">{{ readiness.readyCount }} / {{ readiness.gurus.length }}</strong>
            <span>guru siap. {{ notReady.length ? `${notReady.length} guru masih ada yang perlu dilengkapi.` : 'Semua lengkap, siap di-export.' }}</span>
          </div>
          <div class="summary-actions">
            <button type="button" class="btn btn-ghost" :disabled="!remindable.length || reminding" @click="remind(remindable.map((g) => g.id))">
              {{ reminding ? 'Mengirim...' : `Kirim pengingat WA (${remindable.length})` }}
            </button>
            <button type="button" class="btn btn-primary" :disabled="!!exporting || !readiness.gurus.length" @click="exportPdf(readiness.gurus.map((g) => g.id), 'lembaga')">
              Export PDF LPJ lembaga
            </button>
          </div>
          <p v-if="exporting" class="progress" role="status">{{ exporting }}</p>
          <p v-if="!exporting" class="hint">
            Isi PDF lembaga: Cover, 1. SPTJM tiap guru (ada kotak materai 10.000), 2. Daftar hadir santri tiap guru,
            3. Daftar hadir guru (satu rekap TPQ), 4. Jurnal mengajar tiap guru (cover + {{ JOURNAL_SHEETS }} lembar awal periode).
          </p>
          <p v-if="notReady.length && !exporting" class="hint">PDF tetap bisa di-export walau belum lengkap; bagian yang kosong tercetak apa adanya.</p>
        </section>

        <ul class="guru-list">
          <li v-for="g in readiness.gurus" :key="g.id" class="guru-item">
            <div class="guru-top">
              <div class="guru-name">
                <strong>{{ g.name }}</strong>
                <span class="chip" :class="g.ready ? 'ok' : 'warn'">{{ g.ready ? 'Siap' : `${g.gapCount} perlu dilengkapi` }}</span>
              </div>
              <div class="guru-actions">
                <button v-if="!g.ready" type="button" class="btn btn-ghost btn-sm" :disabled="!g.canRemind || reminding"
                  :title="g.canRemind ? 'Kirim daftar kekurangan ke WhatsApp guru' : 'Nomor WA belum diatur di menu Notifikasi WA'"
                  @click="remind([g.id])">
                  Kirim pengingat
                </button>
                <button type="button" class="btn btn-ghost btn-sm" :disabled="!!exporting" title="SPTJM, daftar hadir santri, dan jurnal guru ini saja" @click="exportPdf([g.id], 'guru')">Export PDF</button>
              </div>
            </div>

            <p class="months">
              <span v-for="m in g.months" :key="m.period">{{ shortMonth(m.period) }}: {{ m.complete }}/{{ m.teachingDays }} hari lengkap</span>
            </p>

            <details v-if="!g.ready" class="gaps" :open="readiness.gurus.length <= 3">
              <summary>Lihat yang perlu dilengkapi</summary>
              <ul>
                <li v-if="g.missingProfile.length"><strong>Data diri untuk SPTJM:</strong> {{ g.missingProfile.join(', ') }}</li>
                <li v-if="g.gaps.missingAttendance.length"><strong>Belum absen ({{ g.gaps.missingAttendance.length }} hari):</strong> {{ dateList(g.gaps.missingAttendance) }}</li>
                <li v-if="g.gaps.missingKbm.length"><strong>Hadir, KBM belum dibuat ({{ g.gaps.missingKbm.length }}):</strong> {{ dateList(g.gaps.missingKbm) }}</li>
                <li v-if="g.gaps.incompleteKbm.length"><strong>KBM belum lengkap ({{ g.gaps.incompleteKbm.length }}):</strong> {{ incompleteList(g.gaps.incompleteKbm) }}</li>
              </ul>
              <p v-if="!g.canRemind" class="hint">Nomor WA guru ini belum diatur, jadi pengingat tidak bisa dikirim. Atur di menu <router-link to="/dashboard/wa-reminders">Notifikasi WA</router-link>.</p>
            </details>
          </li>
        </ul>
      </template>
    </template>

    <!-- ============ Daftar & buat LPJ ============ -->
    <template v-else>
      <section class="card" aria-labelledby="syahadah-title">
        <h2 id="syahadah-title">Guru bersyahadah</h2>
        <p class="muted">Ditandai sekali; guru ini otomatis terpilih setiap kali membuat LPJ dan bisa mengisi KBM susulan.</p>
        <ul class="syahadah-list">
          <li v-for="g in teachers" :key="g.id">
            <label class="pick" :class="{ on: g.hasSyahadah }">
              <input type="checkbox" :checked="g.hasSyahadah" :disabled="savingSyahadah === g.id" @change="toggleSyahadah(g, $event.target.checked)" />
              <span>{{ g.name }}</span>
              <small v-if="profileGaps(g).length" class="profile-gap" :title="`Belum diisi: ${profileGaps(g).join(', ')}`">data SPTJM kurang</small>
            </label>
          </li>
        </ul>
      </section>

      <section class="card" aria-labelledby="new-title">
        <h2 id="new-title">Buat LPJ</h2>
        <form class="new-form" @submit.prevent="createBatch">
          <div class="presets" role="group" aria-label="Pilihan cepat">
            <button v-for="n in [3, 6, 12]" :key="n" type="button" class="chip-btn" :class="{ active: preset === n }" @click="applyPreset(n)">
              {{ n }} bulan
            </button>
          </div>
          <div class="row">
            <label class="field">
              <span>Dari bulan</span>
              <input v-model="form.startPeriod" type="month" class="input" :max="form.endPeriod || currentPeriod" required @input="preset = null" />
            </label>
            <label class="field">
              <span>Sampai bulan</span>
              <input v-model="form.endPeriod" type="month" class="input" :max="currentPeriod" required @input="preset = null" />
            </label>
            <label class="field">
              <span>Tanggal dokumen</span>
              <input v-model="form.docDate" type="date" class="input" required />
            </label>
          </div>
          <label class="field">
            <span>Judul</span>
            <input v-model="form.title" class="input" maxlength="120" :placeholder="autoTitle" />
          </label>
          <fieldset class="field guru-pick">
            <legend>Guru ({{ form.guruIds.length }} dipilih)</legend>
            <label v-for="g in teachers" :key="g.id" class="pick">
              <input v-model="form.guruIds" type="checkbox" :value="g.id" />
              <span>{{ g.name }}</span>
            </label>
          </fieldset>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="creating || !form.guruIds.length">
              {{ creating ? 'Membuat...' : 'Buat LPJ & cek kelengkapan' }}
            </button>
          </div>
        </form>
      </section>

      <section class="card" aria-labelledby="list-title">
        <h2 id="list-title">Daftar LPJ</h2>
        <p v-if="!batches.length" class="muted">Belum ada LPJ.</p>
        <ul class="batch-list">
          <li v-for="b in batches" :key="b.id">
            <button type="button" class="batch-row" @click="openBatch(b)">
              <span class="batch-title">{{ b.title }}</span>
              <span class="muted">{{ b.rangeLabel }} · {{ b.guruIds.length }} guru · dibuat {{ formatCreated(b.createdAt) }}</span>
            </button>
          </li>
        </ul>
      </section>

      <p class="archive">
        Arsip sistem lama:
        <router-link to="/dashboard/admin-lpj">LPJ bulanan</router-link> ·
        <router-link to="/dashboard/admin-documents">Dokumen LPJ</router-link>
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api, { clearApiCache } from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useToast, useConfirm } from '@/composables/useToast'
import { loadPdfLibs } from '@/utils/pdf'
import { renderLpj, lpjFilename, JOURNAL_SHEETS } from '@/utils/lpjPdf'

const { success, error: showError, warning } = useToast()
const { confirm } = useConfirm()

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
const currentPeriod = todayStr.slice(0, 7)

const loading = ref(true)
const loadError = ref('')
const teachers = ref([])
const batches = ref([])
const savingSyahadah = ref(null)
const creating = ref(false)
const preset = ref(6)
const selected = ref(null)
const readiness = ref(null)
const readinessLoading = ref(false)
const reminding = ref(false)
const exporting = ref('')
const editing = ref(false)
const savingEdit = ref(false)
const editForm = ref({ title: '', docDate: '', guruIds: [] })

const shiftMonth = (period, delta) => {
  const [y, m] = period.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}
const form = ref({ startPeriod: shiftMonth(currentPeriod, -5), endPeriod: currentPeriod, docDate: todayStr, title: '', guruIds: [] })

const monthLabel = (period) => {
  const [y, m] = String(period || '').split('-').map(Number)
  return m ? `${MONTHS_LONG[m - 1]} ${y}` : ''
}
const shortMonth = (period) => {
  const [y, m] = period.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}
const autoTitle = computed(() => {
  const { startPeriod: s, endPeriod: e } = form.value
  if (!s || !e) return 'LPJ Insentif Guru'
  if (s === e) return `LPJ Insentif Guru ${monthLabel(s)}`
  return s.slice(0, 4) === e.slice(0, 4)
    ? `LPJ Insentif Guru ${MONTHS_LONG[Number(s.slice(5)) - 1]} – ${monthLabel(e)}`
    : `LPJ Insentif Guru ${monthLabel(s)} – ${monthLabel(e)}`
})

const formatDate = (date) => {
  if (!date) return '-'
  const [y, m, d] = date.split('-').map(Number)
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`
}
const formatCreated = (value) => {
  const seconds = value?._seconds ?? value?.seconds
  const date = seconds !== undefined ? new Date(seconds * 1000) : new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
const shortDate = (date) => {
  const [, m, d] = date.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}`
}
const MAX_LISTED = 12
const dateList = (dates) => {
  const shown = dates.slice(0, MAX_LISTED).map(shortDate).join(', ')
  return dates.length > MAX_LISTED ? `${shown}, +${dates.length - MAX_LISTED} lainnya` : shown
}
const incompleteList = (items) => {
  const shown = items.slice(0, MAX_LISTED).map((i) => `${shortDate(i.date)} (${i.label}: ${i.missing.join(' & ')})`).join('; ')
  return items.length > MAX_LISTED ? `${shown}; +${items.length - MAX_LISTED} lainnya` : shown
}
const profileGaps = (g) => ['nik', 'birthPlace', 'birthDate', 'address'].filter((k) => !g.profile?.[k]).map((k) => ({ nik: 'NIK', birthPlace: 'tempat lahir', birthDate: 'tanggal lahir', address: 'alamat' })[k])

const notReady = computed(() => (readiness.value?.gurus || []).filter((g) => !g.ready))
const remindable = computed(() => notReady.value.filter((g) => g.canRemind))

const applyPreset = (n) => {
  preset.value = n
  form.value.endPeriod = currentPeriod
  form.value.startPeriod = shiftMonth(currentPeriod, -(n - 1))
}

const loadAll = async () => {
  loading.value = true
  loadError.value = ''
  try {
    clearApiCache('/lpj')
    const [t, b] = await Promise.all([api.get('/lpj/teachers'), api.get('/lpj')])
    teachers.value = t.data
    batches.value = b.data
    if (!form.value.guruIds.length) form.value.guruIds = t.data.filter((g) => g.hasSyahadah).map((g) => g.id)
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Gagal memuat LPJ.'
  } finally {
    loading.value = false
  }
}

const toggleSyahadah = async (guru, value) => {
  savingSyahadah.value = guru.id
  try {
    await api.put(`/lpj/teachers/${guru.id}/syahadah`, { hasSyahadah: value })
    guru.hasSyahadah = value
    if (value && !form.value.guruIds.includes(guru.id)) form.value.guruIds.push(guru.id)
    if (!value) form.value.guruIds = form.value.guruIds.filter((id) => id !== guru.id)
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menyimpan.')
  } finally {
    savingSyahadah.value = null
  }
}

const loadReadiness = async () => {
  readinessLoading.value = true
  try {
    clearApiCache('/lpj')
    const { data } = await api.get(`/lpj/${selected.value.id}/readiness`, { timeout: 60000 })
    readiness.value = data
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal memeriksa kelengkapan.')
  } finally {
    readinessLoading.value = false
  }
}

const openBatch = (batch) => {
  selected.value = batch
  editing.value = false
  editForm.value = { title: batch.title, docDate: batch.docDate, guruIds: [...batch.guruIds] }
  readiness.value = null
  loadReadiness()
}

const closeBatch = () => {
  selected.value = null
  readiness.value = null
  loadAll()
}

const createBatch = async () => {
  if (creating.value) return
  creating.value = true
  try {
    const { data } = await api.post('/lpj', { ...form.value, title: form.value.title.trim() || autoTitle.value })
    success('LPJ dibuat. Memeriksa kelengkapan...')
    form.value.title = ''
    batches.value = [data, ...batches.value]
    openBatch(data)
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal membuat LPJ.')
  } finally {
    creating.value = false
  }
}

const saveEdit = async () => {
  savingEdit.value = true
  try {
    const { data } = await api.put(`/lpj/${selected.value.id}`, editForm.value)
    selected.value = data
    editing.value = false
    success('LPJ diperbarui.')
    loadReadiness()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menyimpan.')
  } finally {
    savingEdit.value = false
  }
}

const removeBatch = async () => {
  const ok = await confirm(`Hapus "${selected.value.title}"? Data absensi dan KBM guru tidak ikut terhapus.`, {
    title: 'Hapus LPJ',
    type: 'danger',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
  })
  if (!ok) return
  try {
    await api.delete(`/lpj/${selected.value.id}`)
    success('LPJ dihapus.')
    closeBatch()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menghapus.')
  }
}

const remind = async (guruIds) => {
  if (reminding.value || !guruIds.length) return
  reminding.value = true
  try {
    const { data } = await api.post(`/lpj/${selected.value.id}/remind`, { guruIds }, { timeout: 60000 })
    const skipped = data.results.filter((r) => r.status === 'skipped')
    if (data.queued) success(`${data.queued} pengingat WA dikirim ke bot.`)
    if (skipped.length) warning(skipped.map((r) => `${r.name}: ${r.reason}`).join(' · '))
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal mengirim pengingat.')
  } finally {
    reminding.value = false
  }
}

// Kop surat for the PDF (a light JPEG copy of /kop-surat.png).
let kopPromise = null
const loadKop = () => {
  if (!kopPromise) {
    kopPromise = fetch('/kop-surat-pdf.jpg')
      .then((res) => {
        if (!res.ok) throw new Error('kop')
        return res.blob()
      })
      .then((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      }))
      .catch(() => {
        kopPromise = null
        return null
      })
  }
  return kopPromise
}

// Fetches each teacher's data one by one (small responses), then builds one PDF in the browser.
// scope 'lembaga': the whole TPQ in the order of the official list; 'guru': one teacher's own part.
const exportPdf = async (guruIds, scope = 'lembaga') => {
  if (exporting.value || !guruIds.length) return
  const batch = selected.value
  exporting.value = 'Menyiapkan...'
  try {
    const [{ jsPDF, autoTable }, kop] = await Promise.all([loadPdfLibs(), loadKop()])
    const documents = []
    for (const [index, id] of guruIds.entries()) {
      const name = readiness.value?.gurus.find((g) => g.id === id)?.name || id
      exporting.value = `Mengambil data ${index + 1} dari ${guruIds.length}: ${name}...`
      const { data } = await api.get(`/lpj/${batch.id}/teachers/${id}/document`, { timeout: 60000 })
      documents.push(data)
    }
    exporting.value = 'Menyusun PDF...'
    await new Promise((r) => setTimeout(r, 30))
    const { doc } = renderLpj({ jsPDF, autoTable, kop, documents, scope })
    const filename = lpjFilename(batch, scope === 'guru' ? documents[0].guru.name : null)
    doc.save(filename)
    success(`${filename} diunduh (${doc.getNumberOfPages()} halaman).`)
  } catch (err) {
    console.error('LPJ export error:', err)
    showError(err.response?.data?.error || 'Gagal membuat PDF LPJ. Coba lagi.')
  } finally {
    exporting.value = ''
  }
}

onMounted(loadAll)
</script>

<style scoped>
.lpj-view {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .lpj-view {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: 18px;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin: 0 0 4px;
}

.page-header p,
.muted {
  margin: 0;
  color: var(--gray-600);
  font-size: 0.9rem;
}

.card {
  background: #fff;
  border: 1px solid var(--gray-200);
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 16px;
}

.card h2 {
  margin: 0 0 6px;
  font-size: 1.12rem;
  color: var(--primary-dark);
}

.alert {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.88rem;
  margin: 0 0 16px;
}

.alert-error {
  background: #fef2f2;
  color: #c62828;
}

.alert-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
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
  white-space: nowrap;
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

.btn-sm {
  min-height: 40px;
  padding: 6px 14px;
  font-size: 0.86rem;
}

.danger {
  color: #c62828;
}

.back {
  margin-bottom: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gray-700);
}

.input {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--gray-300);
  border-radius: 10px;
  background: #fff;
  font-size: 0.95rem;
  font-weight: 400;
}

.new-form,
.edit-form {
  display: grid;
  gap: 14px;
  margin-top: 10px;
}

.row {
  display: grid;
  gap: 12px;
}

@media (min-width: 720px) {
  .row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-btn {
  min-height: 40px;
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid var(--gray-300);
  background: #fff;
  font-weight: 600;
  color: var(--gray-700);
  cursor: pointer;
}

.chip-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.guru-pick {
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px 16px;
}

.guru-pick legend {
  padding: 0 6px;
}

.pick {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  font-weight: 500;
  color: var(--gray-800);
  cursor: pointer;
}

.pick input {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.syahadah-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.syahadah-list .pick {
  padding: 4px 12px;
  border: 1px solid var(--gray-200);
  border-radius: 999px;
}

.syahadah-list .pick.on {
  border-color: var(--primary);
  background: rgba(46, 125, 50, 0.07);
}

.profile-gap {
  font-size: 0.72rem;
  color: #b45309;
}

.batch-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.batch-row {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 56px;
  padding: 10px 14px;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.batch-row:hover,
.batch-row:focus-visible {
  border-color: var(--primary);
}

.batch-title {
  font-weight: 700;
  color: var(--primary-dark);
}

.batch-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
}

.head-actions {
  display: flex;
  gap: 8px;
}

.summary {
  display: grid;
  gap: 12px;
}

@media (min-width: 900px) {
  .summary {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}

.summary-text {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--gray-700);
}

.big {
  font-size: 1.6rem;
  color: var(--primary-dark);
  font-variant-numeric: tabular-nums;
}

.summary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.progress,
.hint {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.84rem;
  color: var(--gray-600);
}

.progress {
  color: var(--primary-dark);
  font-weight: 600;
}

.guru-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.guru-item {
  background: #fff;
  border: 1px solid var(--gray-200);
  border-radius: 14px;
  padding: 14px;
}

.guru-top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.guru-name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.guru-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.chip.ok {
  background: rgba(46, 125, 50, 0.12);
  color: #0f6b4a;
}

.chip.warn {
  background: #fef3c7;
  color: #92400e;
}

.months {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: var(--gray-600);
  font-variant-numeric: tabular-nums;
}

.gaps {
  margin-top: 8px;
}

.gaps summary {
  min-height: 40px;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--primary-dark);
}

.gaps ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--gray-700);
  line-height: 1.45;
}

.archive {
  font-size: 0.82rem;
  color: var(--gray-500);
}
</style>
