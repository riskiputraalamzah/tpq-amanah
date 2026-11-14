<template>
  <div class="wv">
    <header class="wv-head">
      <div>
        <h1>Data Wali Santri</h1>
        <p>Tautkan wali dengan santri lewat kode, lalu cek data yang mereka isi.</p>
      </div>
      <div class="wv-head-actions">
        <!-- the full data (NIK / KK in full): admin only -->
        <button v-if="isAdmin" type="button" class="wv-btn wv-btn-ghost" :disabled="exporting || !visibleRows.length" @click="exportExcel">
          <LineIcon name="table" :size="17" /> {{ exporting ? 'Menyiapkan…' : 'Export Excel' }}
        </button>
        <button v-if="classOptions.length" type="button" class="wv-btn wv-btn-primary" @click="openSlips">
          <LineIcon name="file" :size="17" /> Cetak slip kode
        </button>
      </div>
    </header>

    <!-- a guru works with the jilid they look after; say which and where that comes from -->
    <p v-if="scope && !isAdmin && scope.source === 'none'" class="wv-note is-warn wv-scope" role="status">
      Jilid yang Antum ampu belum diatur admin dan belum ada riwayat KBM. Minta admin mengaturnya di menu Kelola Pengajar.
    </p>
    <p v-else-if="scope && !isAdmin" class="wv-note wv-scope">
      Jilid Antum: <strong>{{ scopeLabel }}</strong>.
      <template v-if="scope.source === 'kbm'"> Diambil dari riwayat KBM 60 hari terakhir, belum ditetapkan admin.</template>
    </p>

    <!-- summary -->
    <section class="wv-summary" aria-label="Ringkasan">
      <div><strong>{{ stats.linked }}/{{ rows.length }}</strong><span>santri tertaut wali</span></div>
      <div><strong>{{ stats.verified }}</strong><span>data terverifikasi</span></div>
      <div :class="{ 'is-attn': stats.toCheck }"><strong>{{ stats.toCheck }}</strong><span>menunggu dicek</span></div>
      <div :class="{ 'is-attn': requests.length }"><strong>{{ requests.length }}</strong><span>pengajuan tautan</span></div>
    </section>

    <div class="wv-tabs" role="tablist">
      <button type="button" role="tab" :aria-selected="tab === 'santri'" :class="{ active: tab === 'santri' }" @click="tab = 'santri'">Santri</button>
      <button type="button" role="tab" :aria-selected="tab === 'requests'" :class="{ active: tab === 'requests' }" @click="tab = 'requests'">
        Pengajuan tautan <span v-if="requests.length" class="wv-count">{{ requests.length }}</span>
      </button>
    </div>

    <PageSkeleton v-if="loading" :rows="6" label="Memuat data wali santri" />
    <p v-else-if="loadError" class="wv-note is-danger" role="alert">{{ loadError }}</p>

    <!-- santri -->
    <template v-else-if="tab === 'santri'">
      <div class="wv-filters">
        <label class="sr-only" for="wv-class">Jilid</label>
        <select id="wv-class" v-model="classFilter" class="wv-input">
          <option value="">{{ isAdmin ? 'Semua jilid' : 'Semua jilid saya' }}</option>
          <option v-for="c in classOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
        <label class="sr-only" for="wv-search">Cari nama</label>
        <input id="wv-search" v-model="search" class="wv-input" placeholder="Cari nama santri" />
      </div>
      <div class="wv-chips" role="group" aria-label="Saring status">
        <button v-for="f in STATUS_FILTERS" :key="f.value" type="button" class="wv-chip" :aria-pressed="statusFilter === f.value"
          @click="statusFilter = f.value">{{ f.label }} <span>{{ countFor(f.value) }}</span></button>
      </div>

      <p v-if="!visibleRows.length" class="wv-empty">Tidak ada santri yang cocok.</p>
      <ul v-else class="wv-list">
        <li v-for="r in visibleRows" :key="r.santriId" class="wv-row">
          <div class="wv-row-main">
            <strong>{{ r.name }}</strong>
            <span class="wv-sub">{{ levelName(r.classId) }}<template v-if="r.nomorInduk"> · {{ r.nomorInduk }}</template></span>
            <span v-if="r.guardians.length" class="wv-sub">
              Wali: <template v-for="(g, i) in r.guardians" :key="g.waliId">{{ i ? ', ' : '' }}{{ relationLabel(g.relation) }} {{ displayPhone(g.phone) }}</template>
            </span>
            <span v-else class="wv-sub is-muted">Belum ada wali tertaut</span>
          </div>
          <div class="wv-row-side">
            <span class="wv-pill" :class="`is-${(STATUS[r.profileStatus] || STATUS.empty).tone}`">
              {{ (STATUS[r.profileStatus] || STATUS.empty).label }}
            </span>
            <span v-if="r.hasPendingIdentity" class="wv-pill is-warn">Ubah identitas</span>
            <div class="wv-actions">
              <button v-if="r.guardians.length < 2" type="button" class="wv-btn wv-btn-ghost" @click="makeCode(r)">
                <LineIcon name="link" :size="16" /> Kode
              </button>
              <button v-if="r.profileStatus !== 'empty'" type="button" class="wv-btn wv-btn-primary" @click="openReview(r)">
                Tinjau
              </button>
            </div>
          </div>
        </li>
      </ul>
    </template>

    <!-- link requests -->
    <template v-else>
      <p v-if="!requests.length" class="wv-empty">Tidak ada pengajuan tautan.</p>
      <article v-for="q in requests" :key="q.id" class="wv-card wv-request">
        <div class="wv-request-head">
          <strong>{{ q.childName }}</strong>
          <span class="wv-sub">{{ q.classId ? levelName(q.classId) : 'Jilid tidak diisi' }} · {{ relationLabel(q.relation) }} {{ q.waliName || '' }}</span>
          <span class="wv-sub">WA {{ displayPhone(q.phone) }} · {{ dateText(q.createdAt) }}</span>
          <p v-if="q.note" class="wv-quote">"{{ q.note }}"</p>
        </div>
        <label class="wv-label" :for="`req-${q.id}`">Santri yang dimaksud</label>
        <select :id="`req-${q.id}`" v-model="choice[q.id]" class="wv-input">
          <option value="">Pilih santri…</option>
          <option v-for="s in candidatesFor(q)" :key="s.santriId" :value="s.santriId">
            {{ s.name }} · {{ levelName(s.classId) }}{{ s.guardians.length >= 2 ? ' (sudah 2 wali)' : '' }}
          </option>
        </select>
        <div class="wv-request-actions">
          <button type="button" class="wv-btn wv-btn-ghost is-danger" :disabled="busy" @click="decide(q, false)">Tolak</button>
          <button type="button" class="wv-btn wv-btn-primary" :disabled="busy || !choice[q.id]" @click="decide(q, true)">Tautkan</button>
        </div>
      </article>
    </template>

    <!-- code for one santri -->
    <Teleport to="body">
      <div v-if="codeSheet" class="wv-overlay" @click.self="codeSheet = null">
        <section class="wv-sheet" role="dialog" aria-modal="true" aria-labelledby="code-title">
          <header class="wv-sheet-head">
            <h3 id="code-title">Kode untuk {{ codeSheet.santriName }}</h3>
            <button type="button" class="wv-close" aria-label="Tutup" @click="codeSheet = null"><LineIcon name="x" :size="18" /></button>
          </header>
          <div class="wv-sheet-body">
            <p class="wv-code">{{ codeSheet.code }}</p>
            <p class="wv-sub wv-center">Berlaku sampai {{ dateText(codeSheet.expiresAt) }}. Kode lama santri ini tidak berlaku lagi.</p>
            <p class="wv-note">Kirim <strong>langsung ke wali (japri)</strong>, jangan di grup.</p>
            <a class="wv-btn wv-btn-wa" :href="waShareUrl(codeSheet)" target="_blank" rel="noopener">Kirim lewat WhatsApp</a>
            <button type="button" class="wv-btn wv-btn-ghost" @click="copyMessage(codeSheet)">{{ copied ? 'Pesan tersalin ✓' : 'Salin pesan' }}</button>
          </div>
        </section>
      </div>
    </Teleport>

    <!-- slips for a jilid -->
    <Teleport to="body">
      <div v-if="slipOpen" class="wv-overlay" @click.self="slipOpen = false">
        <section class="wv-sheet" role="dialog" aria-modal="true" aria-labelledby="slip-title">
          <header class="wv-sheet-head">
            <h3 id="slip-title">Cetak slip kode</h3>
            <button type="button" class="wv-close" aria-label="Tutup" @click="slipOpen = false"><LineIcon name="x" :size="18" /></button>
          </header>
          <div class="wv-sheet-body">
            <label class="wv-label" for="slip-class">Jilid</label>
            <select id="slip-class" v-model="slipClass" class="wv-input">
              <option v-for="c in classOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <label class="wv-check"><input v-model="slipOnlyUnlinked" type="checkbox" /> Hanya santri yang belum tertaut wali</label>
            <p class="wv-note is-warn">Slip berisi kode baru. Kode lama santri tersebut tidak berlaku lagi.</p>
            <p v-if="slipError" class="wv-note is-danger" role="alert">{{ slipError }}</p>
            <button type="button" class="wv-btn wv-btn-primary" :disabled="busy" @click="printSlips">
              {{ busy ? 'Membuat slip…' : 'Buat & unduh PDF' }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>

    <!-- review one santri's data -->
    <Teleport to="body">
      <div v-if="review" class="wv-overlay" @click.self="review = null">
        <section class="wv-sheet wv-sheet-wide" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <header class="wv-sheet-head">
            <div>
              <h3 id="review-title">{{ review.santri.name }}</h3>
              <span class="wv-pill" :class="`is-${(STATUS[review.profile.status] || STATUS.empty).tone}`">{{ (STATUS[review.profile.status] || STATUS.empty).label }}</span>
            </div>
            <button type="button" class="wv-close" aria-label="Tutup" @click="review = null"><LineIcon name="x" :size="18" /></button>
          </header>
          <div class="wv-sheet-body">
            <div v-if="review.profile.pendingIdentity" class="wv-note is-warn">
              <strong>Wali mengajukan perubahan identitas:</strong>
              <ul class="wv-diff">
                <li v-for="(v, path) in review.profile.pendingIdentity" :key="path">
                  {{ labelOf(path) }}: <s>{{ valueAt(review.profile.data, path) || '-' }}</s> → <strong>{{ v || '-' }}</strong>
                </li>
              </ul>
              <div v-if="isAdmin" class="wv-request-actions">
                <button type="button" class="wv-btn wv-btn-ghost is-danger" :disabled="busy" @click="decideIdentity(false)">Tolak</button>
                <button type="button" class="wv-btn wv-btn-primary" :disabled="busy" @click="decideIdentity(true)">Setujui</button>
              </div>
            </div>

            <div v-for="s in STEPS" :key="s.key" class="wv-group">
              <strong>{{ s.title }}</strong>
              <dl>
                <div v-for="f in s.fields" :key="f.path" class="wv-dl-row">
                  <dt>{{ f.label }}</dt>
                  <dd>{{ shownValue(f, valueAt(review.profile.data, f.path)) }}</dd>
                </div>
              </dl>
            </div>

            <div class="wv-group">
              <strong>Wali tertaut</strong>
              <ul class="wv-plain">
                <li v-for="g in review.guardians" :key="g.waliId">
                  {{ relationLabel(g.relation) }} · WA {{ displayPhone(g.phone) }} · lewat {{ g.via === 'code' ? 'kode' : 'pengajuan' }}
                  <button v-if="isAdmin" type="button" class="wv-link is-danger" @click="unlink(g)">Lepas</button>
                </li>
              </ul>
              <button v-if="isAdmin && review.profile.hasKkPhoto" type="button" class="wv-btn wv-btn-ghost" @click="openKk">Lihat foto KK</button>
              <p v-else-if="!review.profile.hasKkPhoto" class="wv-sub">Foto KK tidak diunggah.</p>
            </div>

            <template v-if="isAdmin && ['submitted', 'needs_fix', 'verified'].includes(review.profile.status)">
              <div class="wv-group">
                <label v-if="nameDiffers" class="wv-check">
                  <input v-model="syncName" type="checkbox" /> Pakai nama "{{ valueAt(review.profile.data, 'santri.namaLengkap') }}" sebagai nama santri di sistem
                </label>
                <label class="wv-label" for="fix-note">Catatan perbaikan untuk wali</label>
                <textarea id="fix-note" v-model="fixNote" class="wv-input" rows="2" placeholder="Contoh: NIK belum sesuai KK"></textarea>
              </div>
              <p v-if="reviewError" class="wv-note is-danger" role="alert">{{ reviewError }}</p>
              <div class="wv-request-actions">
                <button type="button" class="wv-btn wv-btn-ghost is-danger" :disabled="busy || !fixNote.trim()" @click="decideReview('needs_fix')">Minta perbaikan</button>
                <button type="button" class="wv-btn wv-btn-primary" :disabled="busy" @click="decideReview('verified')">Verifikasi</button>
              </div>
            </template>
            <p v-else-if="!isAdmin" class="wv-sub">Verifikasi data dilakukan oleh admin.</p>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import PageSkeleton from '@/components/PageSkeleton.vue'
import LineIcon from '@/components/LineIcon.vue'
import { STATUS, STEPS, RELATIONS, getPath, displayPhone, linkCodeMessage } from '@/utils/santriProfile'
import { loadPdfLibs } from '@/utils/pdf'
import { renderSlips } from '@/utils/waliSlips'
import { loadExcelLib, downloadWorkbook } from '@/utils/excel'
import { buildSantriDataWorkbook, santriDataFilename } from '@/utils/excelExports'

const CLASS_OPTIONS = [...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Jilid ${n}` })), { value: '7', label: 'Marhalah' }]
const STATUS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'unlinked', label: 'Belum tertaut' },
  { value: 'tocheck', label: 'Menunggu dicek' },
  { value: 'needs_fix', label: 'Perlu diperbaiki' },
  { value: 'verified', label: 'Terverifikasi' },
]

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')
const { success: showSuccess, error: showError } = useToast()
const siteUrl = window.location.origin

const loading = ref(true)
const loadError = ref('')
const rows = ref([])
const requests = ref([])
const tab = ref('santri')
const classFilter = ref('')
const search = ref('')
const statusFilter = ref('all')
const busy = ref(false)
const choice = ref({})
const codeSheet = ref(null)
const copied = ref(false)
const slipOpen = ref(false)
const slipClass = ref('1')
const slipOnlyUnlinked = ref(true)
const slipError = ref('')
const review = ref(null)
const fixNote = ref('')
const syncName = ref(true)
const reviewError = ref('')
const scope = ref(null)
const exporting = ref(false)

// Admin: every jilid. Guru: the jilid they look after (from the server, which enforces the same rule).
const classOptions = computed(() => {
  if (isAdmin.value || !scope.value) return isAdmin.value ? CLASS_OPTIONS : []
  return CLASS_OPTIONS.filter((c) => (scope.value.classIds || []).includes(c.value))
})
const scopeLabel = computed(() => classOptions.value.map((c) => c.label).join(', '))
function openSlips() {
  if (!classOptions.value.some((c) => c.value === slipClass.value)) slipClass.value = classOptions.value[0]?.value || ''
  slipError.value = ''
  slipOpen.value = true
}

const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Tanpa jilid')
const relationLabel = (r) => RELATIONS.find((x) => x.value === r)?.label || r
const dateText = (v) => {
  const d = v?._seconds ? new Date(v._seconds * 1000) : v ? new Date(v) : null
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}
const valueAt = (data, path) => getPath(data || {}, path) ?? ''
const labelOf = (path) => STEPS.flatMap((s) => s.fields).find((f) => f.path === path)?.label || path
const shownValue = (f, v) => {
  if (!v) return '-'
  if (f.type === 'gender') return v === 'L' ? 'Laki-laki' : 'Perempuan'
  if (f.type === 'phone') return displayPhone(v)
  if (f.type === 'date') return new Date(`${v}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  return v
}

const matchStatus = (r, f) => {
  if (f === 'all') return true
  if (f === 'unlinked') return r.guardians.length === 0
  if (f === 'tocheck') return r.profileStatus === 'submitted' || r.hasPendingIdentity
  return r.profileStatus === f
}
const filteredByClass = computed(() => rows.value.filter((r) => !classFilter.value || r.classId === classFilter.value))
const visibleRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return filteredByClass.value.filter((r) => matchStatus(r, statusFilter.value) && (!q || r.name.toLowerCase().includes(q)))
})
const countFor = (f) => filteredByClass.value.filter((r) => matchStatus(r, f)).length
const stats = computed(() => ({
  linked: rows.value.filter((r) => r.guardians.length).length,
  verified: rows.value.filter((r) => r.profileStatus === 'verified').length,
  toCheck: rows.value.filter((r) => r.profileStatus === 'submitted' || r.hasPendingIdentity).length,
}))
const nameDiffers = computed(() => {
  const formName = valueAt(review.value?.profile?.data, 'santri.namaLengkap')
  return !!formName && formName !== review.value?.santri?.name
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [p, q, sc] = await Promise.all([
      api.get('/wali/admin/progress', { cache: false }),
      api.get('/wali/admin/link-requests', { cache: false }),
      api.get('/wali/admin/scope', { cache: false }),
    ])
    rows.value = p.data || []
    requests.value = q.data || []
    scope.value = sc.data || null
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Data belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

/* ---- Excel: the rows on screen (jilid, status and search applied), with everything the wali filled in */
async function exportExcel() {
  if (exporting.value || !visibleRows.value.length) return
  exporting.value = true
  try {
    const exportedAt = new Date()
    const [{ data }, ExcelJS] = await Promise.all([
      api.get('/wali/admin/export', { params: { classId: classFilter.value || undefined }, cache: false }),
      loadExcelLib(),
    ])
    const order = new Map(visibleRows.value.map((r, i) => [r.santriId, i]))
    const rows = (data || []).filter((r) => order.has(r.santriId)).sort((a, b) => order.get(a.santriId) - order.get(b.santriId))
    const parts = [
      classFilter.value && levelName(classFilter.value),
      statusFilter.value !== 'all' && STATUS_FILTERS.find((f) => f.value === statusFilter.value)?.label,
      search.value.trim() && `cari "${search.value.trim()}"`,
    ].filter(Boolean)
    const workbook = buildSantriDataWorkbook(ExcelJS, {
      rows, steps: STEPS, status: STATUS, relations: RELATIONS, exportedAt,
      filterLabel: parts.length ? `Filter: ${parts.join(', ')}` : 'Semua santri aktif',
    })
    const filename = santriDataFilename({ filtered: parts.length > 0, date: exportedAt })
    await downloadWorkbook(workbook, filename)
    showSuccess(`${rows.length} santri diekspor ke ${filename}`)
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal mengekspor Excel. Coba lagi.')
  } finally {
    exporting.value = false
  }
}

/* ---- codes */
async function makeCode(r) {
  busy.value = true
  try {
    const { data } = await api.post('/wali/admin/codes', { santriId: r.santriId })
    copied.value = false
    codeSheet.value = data
  } catch (err) {
    showError(err.response?.data?.error || 'Kode belum bisa dibuat')
  } finally {
    busy.value = false
  }
}
const messageFor = (c) => linkCodeMessage({ santriName: c.santriName, code: c.code, expiresAt: c.expiresAt, siteUrl })
// wa.me without a number: the teacher picks the parent's chat (a private message, not the group)
const waShareUrl = (c) => `https://wa.me/?text=${encodeURIComponent(messageFor(c))}`
async function copyMessage(c) {
  try {
    await navigator.clipboard.writeText(messageFor(c))
    copied.value = true
  } catch {
    showError('Tidak bisa menyalin otomatis. Tekan lama pada kode untuk menyalin.')
  }
}

async function printSlips() {
  busy.value = true
  slipError.value = ''
  try {
    const { data } = await api.post('/wali/admin/codes/class', { classId: slipClass.value, onlyUnlinked: slipOnlyUnlinked.value })
    if (!data.length) {
      slipError.value = slipOnlyUnlinked.value ? 'Semua santri di jilid ini sudah tertaut wali.' : 'Tidak ada santri aktif di jilid ini.'
      return
    }
    const { jsPDF } = await loadPdfLibs()
    const doc = renderSlips({
      jsPDF,
      siteUrl,
      slips: data.map((c) => ({ santriName: c.santriName, classLabel: levelName(c.classId), code: c.code, expiresAt: c.expiresAt })),
    })
    doc.save(`Slip-Kode-Wali-${levelName(slipClass.value).replace(' ', '-')}.pdf`)
    showSuccess(`${data.length} slip kode dibuat`)
    slipOpen.value = false
  } catch (err) {
    slipError.value = err.response?.data?.error || 'Slip belum bisa dibuat.'
  } finally {
    busy.value = false
  }
}

/* ---- requests */
function candidatesFor(q) {
  const list = rows.value.filter((r) => !q.classId || r.classId === q.classId)
  const words = String(q.childName || '').toLowerCase().split(/\s+/).filter(Boolean)
  const score = (r) => words.filter((w) => r.name.toLowerCase().includes(w)).length
  return [...list].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
}
async function decide(q, approve) {
  let reason = ''
  if (!approve) {
    reason = window.prompt('Alasan menolak (akan dilihat wali):', 'Nama santri tidak ditemukan') ?? null
    if (reason === null) return
  }
  busy.value = true
  try {
    await api.post(`/wali/admin/link-requests/${q.id}/decide`, { approve, santriId: choice.value[q.id], reason })
    showSuccess(approve ? 'Wali sudah ditautkan' : 'Pengajuan ditolak')
    await load()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal memproses pengajuan')
  } finally {
    busy.value = false
  }
}

/* ---- review */
async function openReview(r) {
  reviewError.value = ''
  fixNote.value = ''
  syncName.value = true
  try {
    const { data } = await api.get(`/wali/admin/santri/${r.santriId}`, { cache: false })
    review.value = data
  } catch (err) {
    showError(err.response?.data?.error || 'Data belum bisa dibuka')
  }
}
async function decideReview(decision) {
  busy.value = true
  reviewError.value = ''
  try {
    const { data } = await api.post(`/wali/admin/santri/${review.value.santri.id}/review`, { decision, note: fixNote.value, syncName: nameDiffers.value && syncName.value })
    review.value = data
    showSuccess(decision === 'verified' ? 'Data terverifikasi' : 'Permintaan perbaikan dikirim ke wali')
    load()
  } catch (err) {
    reviewError.value = err.response?.data?.error || 'Gagal menyimpan'
  } finally {
    busy.value = false
  }
}
async function decideIdentity(approve) {
  busy.value = true
  try {
    const { data } = await api.post(`/wali/admin/santri/${review.value.santri.id}/identity`, { approve, syncName: approve })
    review.value = data
    showSuccess(approve ? 'Perubahan identitas disetujui' : 'Perubahan identitas ditolak')
    load()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menyimpan')
  } finally {
    busy.value = false
  }
}
async function openKk() {
  try {
    const { data } = await api.get(`/wali/admin/santri/${review.value.santri.id}/kk`, { cache: false })
    window.open(data.url, '_blank', 'noopener')
  } catch (err) {
    showError(err.response?.data?.error || 'Foto KK tidak bisa dibuka')
  }
}
async function unlink(g) {
  if (!window.confirm(`Lepas tautan ${relationLabel(g.relation)} (WA ${displayPhone(g.phone)}) dari santri ini?`)) return
  try {
    await api.delete(`/wali/admin/guardians/${review.value.santri.id}/${g.waliId}`)
    review.value = { ...review.value, guardians: review.value.guardians.filter((x) => x.waliId !== g.waliId) }
    load()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal melepas tautan')
  }
}

onMounted(load)
</script>

<style scoped>
.wv-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.wv-head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wv-head h1 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.wv-head p {
  margin: 0;
  color: var(--lp-body, #475a50);
}

.wv-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 14px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  overflow: hidden;
}

.wv-summary > div {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
}

.wv-summary > div + div {
  border-left: 1px solid rgba(11, 59, 42, 0.08);
}

.wv-summary strong {
  font-size: 1.35rem;
  color: var(--lp-ink, #0b3b2a);
  font-variant-numeric: tabular-nums;
}

.wv-summary span {
  font-size: 0.78rem;
  color: #5b6b62;
}

.wv-summary .is-attn {
  background: #fffbeb;
}

.wv-summary .is-attn strong {
  color: #7c3a0d;
}

.wv-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
  width: fit-content;
  max-width: 100%;
}

.wv-tabs button {
  min-height: 42px;
  padding: 0 14px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  font: inherit;
  font-weight: 700;
  color: #3b4a42;
  cursor: pointer;
}

.wv-tabs button.active {
  background: #fff;
  color: var(--lp-ink, #0b3b2a);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.wv-count {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  margin-left: 4px;
  border-radius: 999px;
  background: #b45309;
  color: #fff;
  font-size: 0.72rem;
}

.wv-filters {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.wv-input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 11px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  box-sizing: border-box;
}

textarea.wv-input {
  padding: 10px 12px;
  min-height: 70px;
}

.wv-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.wv-chip {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: #2f4339;
  cursor: pointer;
}

.wv-chip span {
  margin-left: 4px;
  color: #5b6b62;
}

.wv-chip[aria-pressed="true"] {
  border-color: #0a5c40;
  background: #0a5c40;
  color: #fff;
}

.wv-chip[aria-pressed="true"] span {
  color: #d9efe4;
}

.wv-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.wv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
}

.wv-row + .wv-row {
  border-top: 1px solid rgba(11, 59, 42, 0.07);
}

.wv-row-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.wv-row-main strong {
  color: var(--lp-ink, #0b3b2a);
}

.wv-sub {
  font-size: 0.82rem;
  color: #5b6b62;
}

.wv-sub.is-muted {
  color: #8a968f;
}

.wv-row-side {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.wv-actions {
  display: flex;
  gap: 6px;
}

.wv-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.wv-pill.is-idle { background: #eef0ef; color: #4b5a52; }
.wv-pill.is-warn { background: #fef3c7; color: #7c3a0d; }
.wv-pill.is-info { background: #e6f0fb; color: #1d4f8a; }
.wv-pill.is-danger { background: #fdecea; color: #8e1b12; }
.wv-pill.is-ok { background: #e3f1ea; color: #0a5c40; }

.wv-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 11px;
  border: 0;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.wv-btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #0a5c40, #053d2c);
}

.wv-btn-ghost {
  color: var(--lp-ink, #0b3b2a);
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.22);
}

.wv-btn-ghost.is-danger {
  color: #b42318;
  border-color: rgba(180, 35, 24, 0.35);
}

.wv-btn-wa {
  color: #fff;
  background: #128c4b;
}

.wv-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.wv-btn:focus-visible,
.wv-chip:focus-visible,
.wv-close:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.wv-empty {
  padding: 24px;
  text-align: center;
  color: #5b6b62;
}

.wv-card {
  padding: 14px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.wv-card + .wv-card {
  margin-top: 10px;
}

.wv-request-head {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.wv-request-head strong {
  color: var(--lp-ink, #0b3b2a);
  font-size: 1rem;
}

.wv-quote {
  margin: 6px 0 0;
  font-size: 0.88rem;
  color: #2f4339;
}

.wv-label {
  display: block;
  margin: 8px 0 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--lp-ink, #0b3b2a);
}

.wv-request-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}

.wv-note {
  margin: 0 0 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #eef6f1;
  color: #0a4a34;
  font-size: 0.88rem;
}

.wv-note.is-warn {
  background: #fffbeb;
  color: #5b3a06;
  border: 1px solid #f3d58b;
}

.wv-scope {
  margin-bottom: 14px;
}

.wv-note.is-danger {
  background: #fdecea;
  color: #7a1810;
}

.wv-check {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 0;
  font-size: 0.88rem;
  color: #0b3b2a;
}

.wv-check input {
  width: 18px;
  height: 18px;
  accent-color: #0a5c40;
}

/* sheets */
.wv-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 41, 29, 0.45);
}

.wv-sheet {
  width: 100%;
  max-height: 88dvh;
  overflow-y: auto;
  background: #fbf9f3;
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 640px) {
  .wv-overlay {
    align-items: center;
    padding: 24px;
  }

  .wv-sheet {
    max-width: 460px;
    border-radius: 20px;
  }

  .wv-sheet-wide {
    max-width: 640px;
  }
}

.wv-sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.wv-sheet-head h3 {
  margin: 0 0 4px;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.wv-close {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.15);
  background: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.wv-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 18px 20px;
}

.wv-code {
  margin: 4px 0 0;
  text-align: center;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--lp-ink, #0b3b2a);
  font-variant-numeric: tabular-nums;
  user-select: all;
}

.wv-center {
  text-align: center;
}

.wv-group {
  padding-top: 10px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.wv-group > strong {
  color: var(--lp-ink, #0b3b2a);
}

.wv-group dl {
  margin: 6px 0 0;
}

.wv-dl-row {
  display: grid;
  grid-template-columns: minmax(0, 42%) minmax(0, 1fr);
  gap: 10px;
  padding: 3px 0;
  font-size: 0.88rem;
}

.wv-dl-row dt {
  color: #5b6b62;
}

.wv-dl-row dd {
  margin: 0;
  font-weight: 600;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.wv-diff {
  margin: 6px 0 0;
  padding-left: 18px;
}

.wv-plain {
  list-style: none;
  margin: 6px 0 8px;
  padding: 0;
  font-size: 0.88rem;
}

.wv-link {
  margin-left: 8px;
  border: 0;
  background: none;
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.wv-link.is-danger {
  color: #b42318;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 720px) {
  .wv-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wv-summary > div:nth-child(3) {
    border-left: 0;
  }

  .wv-summary > div:nth-child(n + 3) {
    border-top: 1px solid rgba(11, 59, 42, 0.08);
  }

  .wv-filters {
    grid-template-columns: minmax(0, 1fr);
  }

  .wv-row {
    flex-direction: column;
    align-items: stretch;
  }

  .wv-row-side {
    justify-content: flex-start;
  }

  .wv-actions {
    margin-left: auto;
  }

  .wv-head-actions {
    width: 100%;
  }

  .wv-head .wv-btn {
    flex: 1 1 0;
    min-width: 0;
  }
}
</style>
