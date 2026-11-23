<template>
  <div class="iz">
    <header class="iz-head">
      <div class="iz-head-text">
        <h1>Izin &amp; Sakit Santri</h1>
        <p>
          <template v-if="!isAdmin && scopeLabel">Jilid Antum: <strong>{{ scopeLabel }}</strong> · </template>
          Pantau santri izin hari ini dan catat izin satu atau beberapa hari tanpa terkunci jam sesi.
        </p>
      </div>
      <div class="iz-head-actions">
        <button
          v-if="canCreate"
          type="button"
          class="iz-btn iz-btn-primary"
          @click="openComposer()"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Catat Izin / Sakit</span>
        </button>
        <router-link to="/dashboard/absen-santri" class="iz-btn iz-btn-ghost">
          ← Absen Santri
        </router-link>
      </div>
    </header>

    <PageSkeleton v-if="loading" :rows="5" label="Memuat data izin santri" />
    <p v-else-if="loadError" class="iz-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else>
      <AbsenReports @changed="load({ quiet: true })" />

      <p v-if="!isAdmin && classIds && !classIds.length" class="iz-note is-warn" role="status">
        Jilid yang Antum ampu belum diatur admin dan belum ada riwayat KBM. Minta admin mengaturnya di menu Kelola Pengajar.
      </p>

      <!-- 1. PRIMARY: Izin / Sakit Hari Ini (langsung terlihat saat halaman dibuka) -->
      <section class="iz-today" :class="{ 'has-items': todayItems.length > 0 }" aria-labelledby="iz-today-title">
        <div class="iz-today-head">
          <div class="iz-today-title-wrap">
            <h2 id="iz-today-title">
              {{ todayIsWeekend ? 'Akhir Pekan' : 'Izin Hari Ini' }}
              <span class="iz-today-date">· {{ longDayLabel(today) }}</span>
            </h2>
            <p v-if="todayIsWeekend" class="iz-today-sub">
              TPQ aktif Senin–Jumat.
              <template v-if="nextSchoolDayItems.length">
                Ada <strong>{{ nextSchoolDayItems.length }} santri</strong> izin untuk {{ shortDayFull(nextSchoolDay) }}.
              </template>
              <template v-else>Belum ada izin terjadwal untuk hari aktif berikutnya.</template>
            </p>
            <p v-else-if="todayItems.length" class="iz-today-sub">
              <strong>{{ todayItems.length }} santri</strong>
              {{ isAdmin ? 'di TPQ' : `di ${scopeLabel || 'jilid Antum'}` }} tercatat tidak masuk hari ini.
            </p>
            <p v-else class="iz-today-sub">
              Belum ada santri {{ isAdmin ? 'di semua jilid' : `di ${scopeLabel || 'jilid Antum'}` }} yang izin atau sakit hari ini.
            </p>
          </div>

          <div v-if="!todayIsWeekend && todayItems.length" class="iz-today-badges">
            <span v-if="todayIzinCount" class="iz-pill is-info">{{ todayIzinCount }} Izin</span>
            <span v-if="todaySakitCount" class="iz-pill is-warn">{{ todaySakitCount }} Sakit</span>
          </div>
          <span v-else-if="!todayIsWeekend" class="iz-pill is-ok">Semua terjadwal masuk</span>
        </div>

        <ul v-if="featuredTodayItems.length" class="iz-today-list">
          <li v-for="item in featuredTodayItems" :key="`today-${item.id}`" class="iz-today-row">
            <div class="iz-item-main">
              <div class="iz-item-top">
                <strong>{{ item.santriName }}</strong>
                <span class="iz-pill" :class="item.type === 'sakit' ? 'is-warn' : 'is-info'">
                  {{ item.type === 'sakit' ? 'Sakit' : 'Izin' }}
                </span>
                <span class="iz-meta-tag">{{ levelName(item.classId) }} · {{ slotLabel(item.slot) }}</span>
              </div>
              <p v-if="item.reason" class="iz-reason">"{{ item.reason }}"</p>
              <div class="iz-sub-row">
                <span v-if="(item.dates || []).length > 1" class="iz-sub">
                  {{ item.dates.length }} hari ({{ item.dates.map(shortDayFull).join(', ') }})
                </span>
                <span class="iz-sub">
                  Dicatat {{ item.byName || 'Wali' }}<template v-if="item.createdAt"> · <time :title="fullDateTime(item.createdAt)">{{ timeAgo(item.createdAt, now) }}</time></template>
                </span>
              </div>
            </div>
            <div v-if="item.cancellable" class="iz-item-side">
              <button
                type="button"
                class="iz-btn iz-btn-ghost iz-btn-sm is-danger"
                :disabled="cancellingId === item.id"
                @click="cancelIzin(item)"
              >
                {{ cancellingId === item.id ? 'Membatalkan…' : 'Batalkan' }}
              </button>
            </div>
          </li>
        </ul>

        <div v-else-if="canCreate" class="iz-today-empty-action">
          <button type="button" class="iz-btn iz-btn-ghost iz-btn-sm" @click="openComposer()">
            + Catat izin / sakit santri sekarang
          </button>
        </div>
      </section>

      <!-- 2. SECONDARY: Riwayat & Izin Mendatang (30 Hari) -->
      <section class="iz-history" aria-labelledby="iz-list-title">
        <div class="iz-list-head">
          <h2 id="iz-list-title" class="iz-section-title">Semua &amp; Riwayat Izin ({{ visibleList.length }})</h2>
          <div class="iz-seg" role="group" aria-label="Saring status izin">
            <button
              v-for="f in LIST_FILTERS"
              :key="f.value"
              type="button"
              class="iz-seg-btn"
              :aria-pressed="listStatusFilter === f.value"
              @click="listStatusFilter = f.value"
            >
              {{ f.label }} <span>{{ countListFor(f.value) }}</span>
            </button>
          </div>
        </div>

        <div class="iz-list-bar">
          <div class="iz-search-wrap">
            <svg class="iz-search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="listSearch"
              type="search"
              class="iz-input iz-search-input"
              placeholder="Cari nama santri atau alasan…"
              aria-label="Cari riwayat izin"
            />
          </div>
          <select
            v-if="classOptions.length > 1"
            v-model="listClassFilter"
            class="iz-input iz-jilid-select"
            aria-label="Saring jilid daftar izin"
          >
            <option value="">{{ isAdmin ? 'Semua jilid' : 'Semua jilid saya' }}</option>
            <option v-for="c in classOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>

        <div v-if="!visibleList.length" class="iz-empty">
          <p class="iz-empty-title">Belum ada data izin atau sakit yang cocok.</p>
          <p class="iz-sub">Izin yang dicatat pengajar/admin maupun dari portal wali muncul di sini, urut dari yang terbaru.</p>
        </div>

        <ul v-else class="iz-list">
          <li v-for="item in visibleList" :key="item.id" class="iz-item">
            <div class="iz-item-main">
              <div class="iz-item-top">
                <strong>{{ item.santriName }}</strong>
                <span class="iz-pill" :class="item.type === 'sakit' ? 'is-warn' : 'is-info'">
                  {{ item.type === 'sakit' ? 'Sakit' : 'Izin' }}
                </span>
                <span v-if="item.status === 'active' && (item.dates || []).includes(today)" class="iz-pill is-today">
                  Hari ini
                </span>
                <span v-if="item.status !== 'active'" class="iz-pill is-idle">
                  {{ item.status === 'cancelled' ? 'Dibatalkan' : 'Sebagian dibatalkan' }}
                </span>
              </div>
              <span class="iz-sub">
                {{ levelName(item.classId) }} · {{ slotLabel(item.slot) }} ·
                {{ (item.dates || []).map(shortDayFull).join(', ') }}
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
                class="iz-btn iz-btn-ghost iz-btn-sm is-danger"
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

    <!-- Bottom Sheet / Dialog Catat Izin & Sakit (tanpa native select dropdown panjang) -->
    <Teleport to="body">
      <div v-if="composerOpen" class="iz-overlay" @click.self="closeComposer" @keydown.esc="closeComposer">
        <section class="iz-sheet" role="dialog" aria-modal="true" aria-labelledby="iz-sheet-title">
          <header class="iz-sheet-head">
            <div>
              <h2 id="iz-sheet-title">Catat Izin / Sakit Santri</h2>
              <p class="iz-sub">Langsung masuk ke Absen Santri &amp; mengabari guru jilidnya.</p>
            </div>
            <button type="button" class="iz-close" aria-label="Tutup" @click="closeComposer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          <form class="iz-sheet-body" @submit.prevent="submitIzin">
            <!-- 1. Unified Smart Santri Picker (NO native <select>) -->
            <div class="iz-field">
              <span class="iz-label">Pilih Santri</span>

              <!-- Selected state -->
              <div v-if="selectedSantri && !pickerOpen" class="iz-picked">
                <div class="iz-picked-info">
                  <strong>{{ selectedSantri.name }}</strong>
                  <span>{{ levelName(selectedSantri.classId) }} · {{ slotLabel(form.slot) }}</span>
                </div>
                <button type="button" class="iz-btn iz-btn-ghost iz-btn-sm" @click="reopenPicker">
                  Ganti
                </button>
              </div>

              <!-- Search & tap list state -->
              <div v-else class="iz-picker">
                <div v-if="classOptions.length > 1" class="iz-jilid-strip" role="group" aria-label="Filter jilid">
                  <button
                    type="button"
                    class="iz-mini-chip"
                    :aria-pressed="formClassFilter === ''"
                    @click="formClassFilter = ''"
                  >
                    Semua
                  </button>
                  <button
                    v-for="c in classOptions"
                    :key="c.value"
                    type="button"
                    class="iz-mini-chip"
                    :aria-pressed="formClassFilter === c.value"
                    @click="formClassFilter = c.value"
                  >
                    {{ c.label }}
                  </button>
                </div>

                <div class="iz-search-wrap">
                  <svg class="iz-search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref="pickerSearchRef"
                    v-model="santriSearch"
                    type="search"
                    class="iz-input iz-search-input"
                    placeholder="Ketik nama santri lalu ketuk namanya…"
                    aria-label="Cari nama santri"
                  />
                </div>

                <ul v-if="filteredSantri.length" class="iz-picker-list" role="listbox" aria-label="Daftar santri">
                  <li v-for="s in filteredSantri" :key="s.id">
                    <button
                      type="button"
                      role="option"
                      class="iz-picker-item"
                      :aria-selected="form.santriId === s.id"
                      @click="pickSantri(s)"
                    >
                      <span class="iz-picker-name">{{ s.name }}</span>
                      <span class="iz-picker-jilid">{{ levelName(s.classId) }}</span>
                    </button>
                  </li>
                </ul>
                <p v-else class="iz-picker-empty">Tidak ada santri dengan nama "{{ santriSearch }}".</p>
              </div>
            </div>

            <!-- 2. Status & Sesi -->
            <div class="iz-grid2">
              <div class="iz-field">
                <span id="iz-type-label" class="iz-label">Status</span>
                <div class="iz-seg is-full" role="radiogroup" aria-labelledby="iz-type-label">
                  <button
                    type="button"
                    role="radio"
                    class="iz-seg-btn"
                    :aria-checked="form.type === 'izin'"
                    @click="form.type = 'izin'"
                  >
                    Izin
                  </button>
                  <button
                    type="button"
                    role="radio"
                    class="iz-seg-btn"
                    :aria-checked="form.type === 'sakit'"
                    @click="form.type = 'sakit'"
                  >
                    Sakit
                  </button>
                </div>
              </div>

              <div class="iz-field">
                <span id="iz-slot-label" class="iz-label">Sesi Ngaji</span>
                <div class="iz-seg is-full" role="radiogroup" aria-labelledby="iz-slot-label">
                  <button
                    v-for="s in SLOTS"
                    :key="s.id"
                    type="button"
                    role="radio"
                    class="iz-seg-btn"
                    :aria-checked="form.slot === s.id"
                    @click="form.slot = s.id"
                  >
                    {{ s.short }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. Tanggal (Senin–Jumat) -->
            <div class="iz-field">
              <span id="iz-dur-label" class="iz-label">Tanggal Izin (Senin–Jumat)</span>
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

              <div v-else-if="presetMode === 'pick'" class="iz-days-grid iz-mt" role="group" aria-label="Pilih tanggal sekolah">
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
                  <strong>{{ effectiveDates.length }} hari aktif</strong>:
                  {{ effectiveDates.map(shortDayFull).join(', ') }}
                </template>
                <template v-else>Belum ada hari aktif (Senin–Jumat) yang dipilih.</template>
              </p>
            </div>

            <!-- 4. Alasan -->
            <div class="iz-field">
              <span class="iz-label">Alasan / Keterangan</span>
              <div class="iz-quick-reasons">
                <button
                  v-for="r in QUICK_REASONS[form.type]"
                  :key="r"
                  type="button"
                  class="iz-tpl-btn"
                  :class="{ active: form.reason === r }"
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
                :placeholder="form.type === 'sakit' ? 'Contoh: demam, istirahat di rumah' : 'Contoh: acara keluarga / bepergian'"
                required
              />
            </div>

            <p v-if="formError" class="iz-note is-danger" role="alert">{{ formError }}</p>

            <div class="iz-sheet-foot">
              <button type="button" class="iz-btn iz-btn-ghost" :disabled="saving" @click="closeComposer">Batal</button>
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
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
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
  { id: 'wave_1', label: 'Sesi Sore', short: 'Sore' },
  { id: 'wave_2', label: 'Sesi Malam', short: 'Malam' },
]

const QUICK_REASONS = {
  izin: ['Acara keluarga', 'Pulang kampung / luar kota', 'Kegiatan sekolah', 'Keperluan keluarga'],
  sakit: ['Sakit demam, istirahat di rumah', 'Kurang enak badan', 'Periksa ke dokter / klinik'],
}

const LIST_FILTERS = [
  { value: 'active', label: 'Aktif' },
  { value: 'all', label: 'Semua' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const DAYS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
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

const composerOpen = ref(false)
const pickerOpen = ref(true)
const pickerSearchRef = ref(null)

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
const listStatusFilter = ref('active')

const now = ref(new Date())
let clockTimer = null

const canCreate = computed(() => isAdmin.value || (Array.isArray(classIds.value) && classIds.value.length > 0))
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Tanpa jilid')
const slotLabel = (s) => (s === 'wave_2' ? 'Sesi Malam' : 'Sesi Sore')

const classOptions = computed(() => {
  if (isAdmin.value || classIds.value === null) return CLASS_OPTIONS
  return CLASS_OPTIONS.filter((c) => (classIds.value || []).includes(c.value))
})
const scopeLabel = computed(() => classOptions.value.map((c) => c.label).join(', '))

const addDaysIso = (iso, n) => new Date(new Date(`${iso}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10)
const minAllowedDate = computed(() => addDaysIso(today.value, -7))
const maxAllowedDate = computed(() => addDaysIso(today.value, 14))

const todayIsWeekend = computed(() => {
  const wd = new Date(`${today.value}T12:00:00Z`).getUTCDay()
  return wd === 0 || wd === 6
})
const nextSchoolDay = computed(() => availableDays.value[0] || '')

const longDayLabel = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  return `${DAYS_FULL[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}
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

const PRESETS = computed(() => {
  const first = availableDays.value[0]
  const oneDayLabel = first && first !== today.value ? `1 hari (${shortDayFull(first)})` : 'Hari ini'
  return [
    { key: '1d', label: oneDayLabel },
    { key: '2d', label: '2 hari' },
    { key: '3d', label: '3 hari' },
    { key: '5d', label: '5 hari' },
    { key: 'pick', label: 'Pilih hari' },
    { key: 'range', label: 'Rentang' },
  ]
})

// Santri izin/sakit HARI INI (sudah otomatis sesuai scope admin = semua jilid, guru = jilid yang diampu)
const todayItems = computed(() =>
  izinList.value
    .filter((x) => x.status === 'active' && Array.isArray(x.dates) && x.dates.includes(today.value))
    .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt)),
)
const todayIzinCount = computed(() => todayItems.value.filter((x) => x.type !== 'sakit').length)
const todaySakitCount = computed(() => todayItems.value.filter((x) => x.type === 'sakit').length)

const nextSchoolDayItems = computed(() => {
  if (!nextSchoolDay.value) return []
  return izinList.value
    .filter((x) => x.status === 'active' && Array.isArray(x.dates) && x.dates.includes(nextSchoolDay.value))
    .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt))
})

const featuredTodayItems = computed(() => (todayIsWeekend.value ? nextSchoolDayItems.value : todayItems.value))

// Smart Santri Picker (search + tap, zero native <select>)
const selectedSantri = computed(() => santriList.value.find((s) => s.id === form.value.santriId) || null)

const filteredSantri = computed(() => {
  const q = santriSearch.value.trim().toLowerCase()
  return santriList.value.filter((s) => {
    if (formClassFilter.value && String(s.classId) !== formClassFilter.value) return false
    if (q && !s.name.toLowerCase().includes(q)) return false
    return true
  })
})

function pickSantri(s) {
  form.value.santriId = s.id
  if (s.defaultSlot) form.value.slot = s.defaultSlot
  santriSearch.value = ''
  pickerOpen.value = false
  formError.value = ''
}

function reopenPicker() {
  pickerOpen.value = true
  santriSearch.value = ''
  nextTick(() => pickerSearchRef.value?.focus())
}

function openComposer(prefillSantriId = '') {
  formError.value = ''
  if (prefillSantriId) {
    const found = santriList.value.find((s) => s.id === prefillSantriId)
    if (found) {
      form.value.santriId = found.id
      if (found.defaultSlot) form.value.slot = found.defaultSlot
      pickerOpen.value = false
    }
  } else {
    form.value.santriId = ''
    santriSearch.value = ''
    formClassFilter.value = ''
    pickerOpen.value = true
  }
  if (!form.value.dates.length && availableDays.value.length) {
    applyPreset('1d')
  }
  composerOpen.value = true
}

function closeComposer() {
  if (saving.value) return
  composerOpen.value = false
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
  const cur = form.value.dates
  form.value.dates = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()
}

// History / full list filtering
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
    if (!quiet && querySantri && santriList.value.some((s) => s.id === querySantri)) {
      openComposer(querySantri)
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
      `${form.value.type === 'sakit' ? 'Sakit' : 'Izin'} disimpan untuk ${(data?.recorded || effectiveDates.value).length} hari & tercatat di Absen Santri`,
    )
    composerOpen.value = false
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
.iz {
  color: #0b3b2a;
}

.iz-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.iz-head-text {
  min-width: 0;
  flex: 1 1 240px;
}

.iz-head h1 {
  margin: 0 0 4px;
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.iz-head p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--lp-body, #475a50);
}

.iz-head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 640px) {
  .iz-head-actions {
    width: 100%;
  }
  .iz-head-actions .iz-btn {
    flex: 1 1 auto;
  }
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

/* 1. Primary Today Status Section */
.iz-today {
  padding: 16px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
  margin-bottom: 22px;
}

.iz-today.has-items {
  background: #f8fcf9;
  border-color: rgba(10, 92, 64, 0.22);
}

.iz-today-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.iz-today-title-wrap {
  min-width: 0;
  flex: 1 1 220px;
}

.iz-today-head h2 {
  margin: 0 0 3px;
  font-size: 1.08rem;
  font-weight: 800;
  color: #0b3b2a;
}

.iz-today-date {
  font-weight: 600;
  color: #5b6b62;
  font-size: 0.92rem;
}

.iz-today-sub {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.45;
  color: #475a50;
}

.iz-today-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.iz-today-list {
  display: grid;
  gap: 8px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.iz-today-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.iz-today-empty-action {
  margin-top: 12px;
}

.iz-meta-tag {
  font-size: 0.78rem;
  font-weight: 600;
  color: #5b6b62;
}

.iz-sub-row {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
}

/* 2. Secondary History Section */
.iz-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.iz-section-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: #0b3b2a;
}

.iz-seg {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 4px;
  padding: 3px;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
}

.iz-seg.is-full {
  display: grid;
  width: 100%;
}

.iz-seg-btn {
  min-height: 38px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #3b4a42;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.iz-seg-btn span {
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
  margin-left: 3px;
}

.iz-seg-btn[aria-pressed='true'],
.iz-seg-btn[aria-checked='true'] {
  background: #fff;
  color: #0a5c40;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.iz-list-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  margin-bottom: 12px;
}

@media (max-width: 640px) {
  .iz-list-head .iz-seg {
    width: 100%;
  }
  .iz-list-bar {
    grid-template-columns: 1fr;
  }
}

.iz-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.iz-search-ico {
  position: absolute;
  left: 12px;
  color: #5b6b62;
  pointer-events: none;
}

.iz-search-input {
  padding-left: 36px;
}

.iz-jilid-select {
  min-width: 155px;
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

.iz-empty {
  padding: 24px 16px;
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
  gap: 8px;
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
  padding: 13px 15px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.iz-item-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1 1 200px;
}

.iz-item-top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.iz-item-top strong {
  font-size: 0.98rem;
  color: #0b3b2a;
}

.iz-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
}

.iz-pill.is-ok { background: #e3f1ea; color: #0a5c40; }
.iz-pill.is-info { background: #e0f2fe; color: #075985; }
.iz-pill.is-warn { background: #fef3c7; color: #92400e; }
.iz-pill.is-today { background: #dcfce7; color: #166534; }
.iz-pill.is-idle { background: #f3f4f6; color: #4b5563; }

.iz-reason {
  margin: 2px 0;
  font-size: 0.9rem;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.iz-sub {
  font-size: 0.81rem;
  color: #5b6b62;
}

/* Buttons */
.iz-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid transparent;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}

.iz-btn-sm {
  min-height: 38px;
  padding: 0 12px;
  font-size: 0.82rem;
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

/* Composer Sheet (teleported to body, z-index 9990 < DialogHost 100000) */
.iz-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 25, 17, 0.45);
}

@media (min-width: 640px) {
  .iz-overlay {
    align-items: center;
    padding: 20px;
  }
}

.iz-sheet {
  width: 100%;
  max-width: 560px;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  background: #fbf9f3;
  color: #0b3b2a;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 640px) {
  .iz-sheet {
    border-radius: 20px;
  }
}

.iz-sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  background: #fff;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.iz-sheet-head h2 {
  margin: 0 0 2px;
  font-size: 1.15rem;
  font-weight: 800;
}

.iz-close {
  flex: none;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.14);
  background: #fff;
  color: #0b3b2a;
  cursor: pointer;
}

.iz-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 18px 18px;
  overflow-y: auto;
}

.iz-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.iz-label {
  font-size: 0.84rem;
  font-weight: 700;
  color: #0b3b2a;
}

.iz-grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

/* Unified Smart Santri Picker */
.iz-picked {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 14px;
  background: #e9f5ef;
  border: 1.5px solid rgba(10, 92, 64, 0.3);
}

.iz-picked-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.iz-picked-info strong {
  font-size: 0.96rem;
  color: #0b3b2a;
}

.iz-picked-info span {
  font-size: 0.8rem;
  color: #2f5c48;
  font-weight: 600;
}

.iz-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.14);
}

.iz-jilid-strip {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.iz-jilid-strip::-webkit-scrollbar {
  display: none;
}

.iz-mini-chip {
  flex: none;
  min-height: 34px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  background: #fbf9f3;
  color: #2f4339;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.iz-mini-chip[aria-pressed='true'] {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.iz-picker-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 210px;
  overflow-y: auto;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.iz-picker-item {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 6px;
  border: 0;
  border-bottom: 1px solid rgba(11, 59, 42, 0.06);
  background: transparent;
  color: #0b3b2a;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.iz-picker-item:hover,
.iz-picker-item[aria-selected='true'] {
  background: #eef6f1;
}

.iz-picker-name {
  font-size: 0.92rem;
  font-weight: 700;
  min-width: 0;
  overflow-wrap: anywhere;
}

.iz-picker-jilid {
  flex: none;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(11, 59, 42, 0.07);
  color: #3b4a42;
  font-size: 0.74rem;
  font-weight: 700;
}

.iz-picker-empty {
  margin: 4px 0;
  text-align: center;
  font-size: 0.84rem;
  color: #5b6b62;
}

/* Date presets & chips */
.iz-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.iz-chip {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1.5px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.iz-chip[aria-pressed='true'] {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.iz-days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 6px;
}

.iz-day-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-height: 46px;
  padding: 6px 4px;
  border-radius: 11px;
  border: 1.5px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  cursor: pointer;
}

.iz-day-chip strong {
  font-size: 0.78rem;
  font-weight: 800;
}

.iz-day-chip span {
  font-size: 0.72rem;
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

.iz-selected-summary {
  margin: 0;
}

.iz-quick-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.iz-tpl-btn {
  min-height: 34px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid rgba(10, 92, 64, 0.22);
  background: #eef6f1;
  color: #0a5c40;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.iz-tpl-btn.active {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.iz-sheet-foot {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  padding-top: 4px;
}

.iz-btn:focus-visible,
.iz-close:focus-visible,
.iz-chip:focus-visible,
.iz-mini-chip:focus-visible,
.iz-seg-btn:focus-visible,
.iz-input:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}
</style>
