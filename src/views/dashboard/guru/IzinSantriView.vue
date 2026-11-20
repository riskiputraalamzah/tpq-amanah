<template>
  <div class="iz">
    <header class="iz-head">
      <div>
        <h1>Izin &amp; Sakit Santri</h1>
        <p>Catat izin atau sakit santri untuk hari ini maupun beberapa hari ke depan tanpa terkunci jam sesi.</p>
      </div>
      <router-link to="/dashboard/absen-santri" class="iz-btn iz-btn-ghost">
        ← Buka Absen Santri
      </router-link>
    </header>

    <PageSkeleton v-if="loading" :rows="5" label="Memuat data izin santri" />
    <p v-else-if="loadError" class="iz-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else>
      <AbsenReports @changed="load({ quiet: true })" />

      <!-- Scope info for Guru -->
      <p v-if="!isAdmin && classIds && !classIds.length" class="iz-note is-warn" role="status">
        Jilid yang Antum ampu belum diatur admin dan belum ada riwayat KBM. Minta admin mengaturnya di menu Kelola Pengajar.
      </p>
      <p v-else-if="!isAdmin" class="iz-note">
        Jilid Antum: <strong>{{ scopeLabel }}</strong>. Antum dapat mencatat dan mengelola izin untuk santri pada jilid tersebut.
      </p>

      <!-- Form Catat Izin / Sakit Baru -->
      <section v-if="isAdmin || (classIds && classIds.length)" class="iz-card" aria-labelledby="iz-form-title">
        <h2 id="iz-form-title" class="iz-card-title">Catat Izin / Sakit Santri</h2>

        <form class="iz-form" @submit.prevent="submitIzin">
          <div class="iz-grid2">
            <label v-if="classOptions.length > 1" class="iz-field">
              <span class="iz-label">Filter Jilid</span>
              <select v-model="formClassFilter" class="iz-input" @change="onClassFilterChange">
                <option value="">{{ isAdmin ? 'Semua jilid' : 'Semua jilid saya' }}</option>
                <option v-for="c in classOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </label>

            <label class="iz-field">
              <span class="iz-label">Cari &amp; Pilih Santri</span>
              <input
                v-model="santriSearch"
                type="search"
                class="iz-input"
                placeholder="Ketik nama santri untuk menyaring…"
              />
            </label>
          </div>

          <label class="iz-field">
            <span class="iz-label">Santri ({{ filteredSantri.length }} santri)</span>
            <select v-model="form.santriId" class="iz-input" required @change="onSantriChange">
              <option value="" disabled>
                {{ filteredSantri.length ? 'Pilih nama santri…' : 'Tidak ada santri yang cocok' }}
              </option>
              <optgroup v-for="g in santriGroups" :key="g.classId" :label="levelName(g.classId)">
                <option v-for="s in g.items" :key="s.id" :value="s.id">
                  {{ s.name }}{{ s.nomorInduk ? ` · ${s.nomorInduk}` : '' }}
                </option>
              </optgroup>
            </select>
          </label>

          <div class="iz-grid2">
            <div class="iz-field">
              <span id="iz-type-label" class="iz-label">Status</span>
              <div class="iz-chips" role="radiogroup" aria-labelledby="iz-type-label">
                <button
                  type="button"
                  role="radio"
                  class="iz-chip"
                  :aria-checked="form.type === 'izin'"
                  @click="form.type = 'izin'"
                >
                  Izin
                </button>
                <button
                  type="button"
                  role="radio"
                  class="iz-chip"
                  :aria-checked="form.type === 'sakit'"
                  @click="form.type = 'sakit'"
                >
                  Sakit
                </button>
              </div>
            </div>

            <div class="iz-field">
              <span id="iz-slot-label" class="iz-label">Sesi Ngaji</span>
              <div class="iz-chips" role="radiogroup" aria-labelledby="iz-slot-label">
                <button
                  v-for="s in SLOTS"
                  :key="s.id"
                  type="button"
                  role="radio"
                  class="iz-chip"
                  :aria-checked="form.slot === s.id"
                  @click="form.slot = s.id"
                >
                  {{ s.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Durasi / Tanggal (1 hari atau beberapa hari) -->
          <div class="iz-field">
            <span id="iz-dur-label" class="iz-label">Lamanya / Tanggal Izin (Senin–Jumat)</span>
            <div class="iz-presets" role="group" aria-labelledby="iz-dur-label">
              <button
                v-for="p in PRESETS"
                :key="p.key"
                type="button"
                class="iz-chip"
                :aria-pressed="presetMode === p.key"
                @click="applyPreset(p.key)"
              >
                {{ p.label }}
              </button>
            </div>

            <!-- Mode Rentang Tanggal -->
            <div v-if="presetMode === 'range'" class="iz-grid2 iz-mt">
              <label class="iz-field">
                <span class="iz-sub">Dari tanggal</span>
                <input v-model="form.startDate" type="date" class="iz-input" :min="minAllowedDate" :max="maxAllowedDate" />
              </label>
              <label class="iz-field">
                <span class="iz-sub">Sampai tanggal</span>
                <input
                  v-model="form.endDate"
                  type="date"
                  class="iz-input"
                  :min="form.startDate || minAllowedDate"
                  :max="maxAllowedDate"
                />
              </label>
            </div>

            <!-- Mode Pilih / Centang Hari Sekolah -->
            <div v-else class="iz-days-grid iz-mt" role="group" aria-label="Pilih tanggal sekolah">
              <button
                v-for="d in availableDays"
                :key="d"
                type="button"
                class="iz-day-chip"
                :aria-pressed="form.dates.includes(d)"
                @click="toggleDate(d)"
              >
                <strong>{{ shortDayName(d) }}</strong>
                <span>{{ shortDayNum(d) }}</span>
              </button>
            </div>

            <p class="iz-sub iz-selected-summary">
              <template v-if="effectiveDates.length">
                <strong>{{ effectiveDates.length }} hari sekolah</strong> dipilih:
                {{ effectiveDates.map(shortDayFull).join(', ') }}
              </template>
              <template v-else>Belum ada hari sekolah (Senin–Jumat) yang dipilih.</template>
            </p>
          </div>

          <!-- Alasan / Keterangan -->
          <div class="iz-field">
            <span class="iz-label">Alasan / Keterangan</span>
            <div class="iz-quick-reasons">
              <button
                v-for="r in QUICK_REASONS[form.type]"
                :key="r"
                type="button"
                class="iz-tpl-btn"
                @click="form.reason = r"
              >
                {{ r }}
              </button>
            </div>
            <input
              v-model="form.reason"
              type="text"
              class="iz-input"
              maxlength="200"
              :placeholder="form.type === 'sakit' ? 'Contoh: demam, istirahat di rumah' : 'Contoh: acara keluarga / bepergian luar kota'"
              required
            />
          </div>

          <p v-if="formError" class="iz-note is-danger" role="alert">{{ formError }}</p>

          <div class="iz-form-actions">
            <button
              type="submit"
              class="iz-btn iz-btn-primary"
              :disabled="saving || !form.santriId || !effectiveDates.length || form.reason.trim().length < 3"
            >
              {{ saving ? 'Menyimpan…' : `Simpan ${form.type === 'sakit' ? 'Sakit' : 'Izin'} (${effectiveDates.length || 0} hari)` }}
            </button>
          </div>
        </form>
      </section>

      <!-- Daftar Izin & Sakit (Sedang Berjalan / Akan Datang & Riwayat 30 Hari) -->
      <section class="iz-history" aria-labelledby="iz-list-title">
        <div class="iz-list-head">
          <h2 id="iz-list-title" class="iz-section-title">Daftar Izin &amp; Sakit ({{ visibleList.length }})</h2>
          <div class="iz-list-filters">
            <select v-if="classOptions.length > 1" v-model="listClassFilter" class="iz-input iz-input-sm" aria-label="Saring jilid daftar izin">
              <option value="">{{ isAdmin ? 'Semua jilid' : 'Semua jilid saya' }}</option>
              <option v-for="c in classOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
            <input
              v-model="listSearch"
              type="search"
              class="iz-input iz-input-sm"
              placeholder="Cari nama santri atau alasan…"
            />
          </div>
        </div>

        <div class="iz-chips iz-mb" role="group" aria-label="Saring status izin">
          <button
            v-for="f in LIST_FILTERS"
            :key="f.value"
            type="button"
            class="iz-chip"
            :aria-pressed="listStatusFilter === f.value"
            @click="listStatusFilter = f.value"
          >
            {{ f.label }} <span>{{ countListFor(f.value) }}</span>
          </button>
        </div>

        <div v-if="!visibleList.length" class="iz-empty">
          <p class="iz-empty-title">Belum ada data izin atau sakit yang cocok.</p>
          <p class="iz-sub">Izin yang dicatat oleh pengajar/admin maupun dari portal wali akan muncul di sini, urut dari yang terbaru.</p>
        </div>

        <ul v-else class="iz-list">
          <li v-for="item in visibleList" :key="item.id" class="iz-item">
            <div class="iz-item-main">
              <div class="iz-item-top">
                <strong>{{ item.santriName }}</strong>
                <span class="iz-pill" :class="item.type === 'sakit' ? 'is-warn' : 'is-info'">
                  {{ item.type === 'sakit' ? 'Sakit' : 'Izin' }}
                </span>
                <span v-if="item.status !== 'active'" class="iz-pill is-idle">
                  {{ item.status === 'cancelled' ? 'Dibatalkan' : 'Sebagian dibatalkan' }}
                </span>
              </div>

              <span class="iz-sub">
                {{ levelName(item.classId) }} · {{ slotLabel(item.slot) }} ·
                <strong>{{ (item.dates || []).length }} hari</strong> ({{ (item.dates || []).map(shortDayFull).join(', ') }})
              </span>

              <p v-if="item.reason" class="iz-reason">"{{ item.reason }}"</p>

              <span class="iz-sub">
                Dicatat oleh {{ item.byName || 'Wali' }}
                <template v-if="item.createdAt">
                  · <time :title="fullDateTime(item.createdAt)">{{ timeAgo(item.createdAt, now) }}</time>
                </template>
              </span>
            </div>

            <div v-if="item.cancellable" class="iz-item-side">
              <button
                type="button"
                class="iz-btn iz-btn-ghost is-danger"
                :disabled="cancellingId === item.id"
                @click="cancelIzin(item)"
              >
                {{ cancellingId === item.id ? 'Membatalkan…' : 'Batalkan' }}
              </button>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import AbsenReports from '@/components/absen/AbsenReports.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { timeAgo, fullDateTime, timeOf } from '@/utils/timeAgo'

const authStore = useAuthStore()
const route = useRoute()
const { success: showSuccess, error: showError } = useToast()
const { ask } = useDialog()

const isAdmin = computed(() => authStore.user?.role === 'admin')

const CLASS_OPTIONS = [
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Jilid ${n}` })),
  { value: '7', label: 'Marhalah' },
]

const SLOTS = [
  { id: 'wave_1', label: 'Sesi Sore' },
  { id: 'wave_2', label: 'Sesi Malam' },
]

const PRESETS = [
  { key: '1d', label: 'Hari ini (1 hari)' },
  { key: '2d', label: '2 hari' },
  { key: '3d', label: '3 hari' },
  { key: '5d', label: '1 minggu (5 hari)' },
  { key: 'pick', label: 'Pilih hari' },
  { key: 'range', label: 'Rentang tanggal' },
]

const QUICK_REASONS = {
  izin: ['Acara keluarga', 'Pulang kampung / luar kota', 'Kegiatan sekolah', 'Keperluan keluarga'],
  sakit: ['Sakit demam, istirahat di rumah', 'Kurang enak badan', 'Periksa ke dokter / klinik'],
}

const LIST_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Aktif / Berjalan' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const cancellingId = ref('')
const formError = ref('')

const classIds = ref(null) // null = admin (all jilid), array = guru's jilid
const scopeSource = ref('admin')
const today = ref(new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10))
const availableDays = ref([])
const santriList = ref([])
const izinList = ref([])

const formClassFilter = ref('')
const santriSearch = ref('')
const presetMode = ref('1d')
const form = ref({
  santriId: '',
  type: 'izin',
  slot: 'wave_1',
  dates: [],
  startDate: '',
  endDate: '',
  reason: 'Acara keluarga',
})

const listClassFilter = ref('')
const listSearch = ref('')
const listStatusFilter = ref('all')

const now = ref(new Date())
let clockTimer = null

const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Tanpa jilid')
const slotLabel = (s) => (s === 'wave_2' ? 'Sesi Malam' : 'Sesi Sore')

const classOptions = computed(() => {
  if (isAdmin.value || classIds.value === null) return CLASS_OPTIONS
  return CLASS_OPTIONS.filter((c) => (classIds.value || []).includes(c.value))
})

const scopeLabel = computed(() => classOptions.value.map((c) => c.label).join(', '))

const filteredSantri = computed(() => {
  const q = santriSearch.value.trim().toLowerCase()
  return santriList.value.filter((s) => {
    if (formClassFilter.value && String(s.classId) !== formClassFilter.value) return false
    if (q && !s.name.toLowerCase().includes(q) && !String(s.nomorInduk || '').toLowerCase().includes(q)) return false
    return true
  })
})

const santriGroups = computed(() => {
  const by = new Map()
  for (const s of filteredSantri.value) {
    if (!by.has(s.classId)) by.set(s.classId, [])
    by.get(s.classId).push(s)
  }
  return [...by.entries()].map(([classId, items]) => ({ classId, items }))
})

const addDaysIso = (iso, n) => new Date(new Date(`${iso}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10)
const minAllowedDate = computed(() => addDaysIso(today.value, -7))
const maxAllowedDate = computed(() => addDaysIso(today.value, 14))

const shortDayName = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return iso === today.value ? 'Hari ini' : DAYS_SHORT[d.getUTCDay()]
}
const shortDayNum = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}
const shortDayFull = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  return `${DAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}

const effectiveDates = computed(() => {
  if (presetMode.value === 'range') {
    const start = form.value.startDate
    const end = form.value.endDate
    if (!start || !end || end < start) return []
    const out = []
    let cur = start
    let steps = 0
    while (cur <= end && steps <= 31) {
      const wd = new Date(`${cur}T12:00:00Z`).getUTCDay()
      if (wd !== 0 && wd !== 6) out.push(cur)
      cur = addDaysIso(cur, 1)
      steps += 1
    }
    return out
  }
  return [...form.value.dates].sort()
})

function applyPreset(key) {
  presetMode.value = key
  const days = availableDays.value
  if (key === '1d') form.value.dates = days.slice(0, 1)
  else if (key === '2d') form.value.dates = days.slice(0, 2)
  else if (key === '3d') form.value.dates = days.slice(0, 3)
  else if (key === '5d') form.value.dates = days.slice(0, 5)
  else if (key === 'range') {
    form.value.startDate = days[0] || today.value
    form.value.endDate = days[Math.min(2, days.length - 1)] || today.value
  }
}

function toggleDate(d) {
  presetMode.value = 'pick'
  const cur = form.value.dates
  form.value.dates = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()
}

function onClassFilterChange() {
  if (form.value.santriId && !filteredSantri.value.some((s) => s.id === form.value.santriId)) {
    form.value.santriId = filteredSantri.value[0]?.id || ''
    onSantriChange()
  }
}

function onSantriChange() {
  const s = santriList.value.find((x) => x.id === form.value.santriId)
  if (s && s.defaultSlot) {
    form.value.slot = s.defaultSlot
  }
}

const matchListStatus = (item, f) => {
  if (f === 'all') return true
  if (f === 'active') return item.status === 'active'
  return item.status !== 'active'
}

const filteredListByClass = computed(() =>
  izinList.value.filter((x) => !listClassFilter.value || String(x.classId) === listClassFilter.value),
)

const countListFor = (f) => filteredListByClass.value.filter((x) => matchListStatus(x, f)).length

const visibleList = computed(() => {
  const q = listSearch.value.trim().toLowerCase()
  return filteredListByClass.value
    .filter((x) => {
      if (!matchListStatus(x, listStatusFilter.value)) return false
      if (!q) return true
      return (
        String(x.santriName || '').toLowerCase().includes(q) ||
        String(x.reason || '').toLowerCase().includes(q) ||
        String(x.byName || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt))
})

async function load({ quiet = false } = {}) {
  if (!quiet) loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/santri-presence/izin', { cache: false })
    classIds.value = data.classIds === null ? null : data.classIds || []
    scopeSource.value = data.scopeSource || 'admin'
    today.value = data.today || today.value
    availableDays.value = Array.isArray(data.days) ? data.days : []
    santriList.value = Array.isArray(data.santri) ? data.santri : []
    izinList.value = Array.isArray(data.list) ? data.list : []

    if (!form.value.dates.length && availableDays.value.length) {
      applyPreset(presetMode.value)
    }
    const querySantri = typeof route.query.santri === 'string' ? route.query.santri : ''
    if (querySantri && santriList.value.some((s) => s.id === querySantri)) {
      form.value.santriId = querySantri
      onSantriChange()
    }
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Data izin santri belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

async function submitIzin() {
  formError.value = ''
  if (!form.value.santriId) {
    formError.value = 'Pilih santri terlebih dahulu.'
    return
  }
  if (!effectiveDates.value.length) {
    formError.value = 'Pilih minimal 1 hari sekolah (Senin–Jumat).'
    return
  }
  saving.value = true
  try {
    const payload = {
      santriId: form.value.santriId,
      type: form.value.type,
      slot: form.value.slot,
      dates: effectiveDates.value,
      reason: form.value.reason.trim(),
    }
    const { data } = await api.post('/santri-presence/izin', payload)
    if (data?.izin) {
      izinList.value = [data.izin, ...izinList.value.filter((x) => x.id !== data.izin.id)]
    } else {
      await load({ quiet: true })
    }
    showSuccess(
      `${form.value.type === 'sakit' ? 'Sakit' : 'Izin'} disimpan untuk ${(data?.recorded || effectiveDates.value).length} hari & langsung tercatat di Absen Santri`,
    )
  } catch (err) {
    formError.value = err.response?.data?.error || 'Gagal menyimpan izin santri.'
  } finally {
    saving.value = false
  }
}

async function cancelIzin(item) {
  const ok = await ask({
    title: `Batalkan ${item.type === 'sakit' ? 'sakit' : 'izin'} ${item.santriName}?`,
    message: `Status ${item.type} untuk tanggal yang belum lewat akan dihapus dari Absen Santri sehingga santri bisa diabsen hadir seperti biasa.`,
    tone: 'danger',
    confirmText: 'Ya, batalkan',
    cancelText: 'Biarkan',
  })
  if (!ok) return
  cancellingId.value = item.id
  try {
    await api.delete(`/santri-presence/izin/${encodeURIComponent(item.id)}`)
    showSuccess(`Izin ${item.santriName} dibatalkan`)
    await load({ quiet: true })
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal membatalkan izin')
  } finally {
    cancellingId.value = ''
  }
}

onMounted(() => {
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 30000)
  load()
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
.iz-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.iz-head h1 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.iz-head p {
  margin: 0;
  color: var(--lp-body, #475a50);
}

.iz-note {
  margin: 0 0 12px;
  padding: 11px 14px;
  border-radius: 14px;
  font-size: 0.88rem;
  line-height: 1.5;
  background: #eef6f1;
  color: #0b3b2a;
}

.iz-note.is-warn {
  background: #fffbeb;
  border: 1px solid #f3d58b;
  color: #7c3a0d;
}

.iz-note.is-danger {
  background: #fdecea;
  border: 1px solid #f5b5ad;
  color: #7a1810;
}

.iz-card {
  padding: 18px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
  margin-bottom: 20px;
}

.iz-card-title {
  margin: 0 0 14px;
  font-size: 1.12rem;
  font-weight: 800;
  color: #0b3b2a;
}

.iz-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.iz-grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 640px) {
  .iz-grid2 {
    grid-template-columns: 1fr;
  }
}

.iz-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.iz-label {
  font-size: 0.86rem;
  font-weight: 700;
  color: #0b3b2a;
}

.iz-input {
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  box-sizing: border-box;
}

.iz-input-sm {
  min-height: 38px;
  font-size: 0.86rem;
}

.iz-chips,
.iz-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.iz-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1.5px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.iz-chip span {
  font-size: 0.76rem;
  opacity: 0.75;
}

.iz-chip[aria-checked='true'],
.iz-chip[aria-pressed='true'] {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.iz-days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(94px, 1fr));
  gap: 8px;
}

.iz-day-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  border-radius: 12px;
  border: 1.5px solid rgba(11, 59, 42, 0.16);
  background: #fbf9f3;
  color: #0b3b2a;
  font: inherit;
  cursor: pointer;
}

.iz-day-chip strong {
  font-size: 0.82rem;
  font-weight: 800;
}

.iz-day-chip span {
  font-size: 0.76rem;
  color: #5b6b62;
}

.iz-day-chip[aria-pressed='true'] {
  background: #e3f1ea;
  border-color: #0a5c40;
  color: #0a5c40;
}

.iz-mt {
  margin-top: 4px;
}

.iz-mb {
  margin-bottom: 10px;
}

.iz-sub {
  font-size: 0.82rem;
  color: #5b6b62;
}

.iz-selected-summary {
  margin: 2px 0 0;
}

.iz-quick-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.iz-tpl-btn {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid rgba(10, 92, 64, 0.22);
  background: #eef6f1;
  color: #0a5c40;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.iz-form-actions {
  display: flex;
  justify-content: flex-end;
}

.iz-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid transparent;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.iz-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.iz-btn-primary {
  background: #0a5c40;
  color: #fff;
}

.iz-btn-ghost {
  background: #fff;
  border-color: rgba(11, 59, 42, 0.2);
  color: #0b3b2a;
}

.iz-btn-ghost.is-danger {
  color: #991b1b;
  border-color: rgba(153, 27, 27, 0.25);
}

.iz-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.iz-section-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0b3b2a;
}

.iz-list-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.iz-empty {
  padding: 26px 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px dashed rgba(11, 59, 42, 0.2);
  text-align: center;
}

.iz-empty-title {
  margin: 0 0 4px;
  font-weight: 700;
  color: #0b3b2a;
}

.iz-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.iz-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.iz-item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.iz-item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.iz-item-top strong {
  font-size: 1rem;
  color: #0b3b2a;
}

.iz-pill {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.iz-pill.is-info {
  background: #e0f2fe;
  color: #075985;
}

.iz-pill.is-warn {
  background: #fef3c7;
  color: #92400e;
}

.iz-pill.is-idle {
  background: #f3f4f6;
  color: #4b5563;
}

.iz-reason {
  margin: 2px 0;
  font-size: 0.9rem;
  color: #0b3b2a;
}
</style>
