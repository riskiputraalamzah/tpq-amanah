<template>
  <div class="pd" :class="{ 'is-guru': !isAdmin }">
    <header class="pd-head">
      <div>
        <h1>Pendaftaran Santri Baru</h1>
        <p>Pendaftar dari formulir web. Hubungi wali, jadwalkan penempatan jilid, lalu terima.</p>
      </div>
      <div class="pd-head-actions">
        <button type="button" class="pd-btn pd-btn-ghost" @click="copyLink">
          <LineIcon name="link" :size="17" /> Salin link daftar
        </button>
        <button type="button" class="pd-btn pd-btn-ghost" :disabled="exporting || !shown.length" @click="exportExcel">
          <LineIcon name="table" :size="17" /> {{ exporting ? 'Menyiapkan…' : 'Export Excel' }}
        </button>
        <button v-if="isAdmin" type="button" class="pd-btn pd-btn-ghost" @click="openSettings">
          <LineIcon name="users" :size="17" /> Penerima WA
        </button>
      </div>
    </header>

    <section class="pd-summary" aria-label="Ringkasan">
      <div :class="{ 'is-attn': counts.submitted }"><strong>{{ counts.submitted || 0 }}</strong><span>baru, belum dihubungi</span></div>
      <div><strong>{{ counts.contacted || 0 }}</strong><span>sudah dihubungi</span></div>
      <div><strong>{{ counts.scheduled || 0 }}</strong><span>terjadwal penempatan</span></div>
      <div><strong>{{ counts.accepted || 0 }}</strong><span>diterima</span></div>
    </section>

    <div class="pd-tabs" role="tablist" aria-label="Kelompok pendaftar">
      <button v-for="t in TABS" :key="t.key" type="button" role="tab" :aria-selected="tab === t.key" :class="{ active: tab === t.key }" @click="tab = t.key">
        {{ t.label }} <span v-if="tabCount(t) && t.key === 'open'" class="pd-count">{{ tabCount(t) }}</span>
      </button>
    </div>

    <div class="pd-filters">
      <label class="sr-only" for="pd-search">Cari</label>
      <input id="pd-search" v-model="search" class="pd-input" placeholder="Cari nama, nomor pendaftaran, atau desa" />
    </div>

    <PageSkeleton v-if="loading" :rows="5" label="Memuat pendaftar" />
    <p v-else-if="loadError" class="pd-note is-danger" role="alert">{{ loadError }}</p>
    <div v-else-if="!shown.length" class="pd-empty">
      <p class="pd-empty-title">{{ search ? 'Tidak ada yang cocok.' : tab === 'open' ? 'Belum ada pendaftar baru.' : 'Belum ada data.' }}</p>
      <p v-if="tab === 'open' && !search" class="pd-sub">Bagikan link pendaftaran: <strong>{{ siteLink }}</strong></p>
    </div>

    <ul v-else class="pd-list">
      <li v-for="r in shown" :key="r.id" class="pd-row">
        <button type="button" class="pd-row-main" @click="openDetail(r.id)">
          <span class="pd-row-top">
            <strong>{{ r.childName }}</strong>
            <span class="pd-pill" :class="`is-${statusOf(r).tone}`">{{ statusOf(r).label }}</span>
            <span v-if="r.similarTo?.length" class="pd-pill is-twin" :title="`Mirip ${r.similarTo.join(', ')}`">Mungkin ganda</span>
          </span>
          <span class="pd-sub">
            {{ r.number }} · {{ genderShort(r.gender) }}{{ r.age !== null ? `, ${r.age} th` : '' }} · {{ sesiName(r.sesi) }}<template v-if="r.desa"> · {{ r.desa }}</template>
          </span>
          <span class="pd-sub">{{ r.history }}</span>
          <span v-if="r.status === 'scheduled' && r.schedule" class="pd-sub is-sched">
            <LineIcon name="calendar" :size="14" /> {{ longDate(r.schedule.date, { weekday: true }) }}{{ r.schedule.time ? `, ${r.schedule.time}` : '' }}
          </span>
          <span class="pd-sub is-muted">Daftar {{ ago(r.submittedAt) }}<template v-if="r.editedAfterSubmitAt"> · diubah wali</template></span>
        </button>
        <div class="pd-row-side">
          <a v-if="['submitted', 'contacted', 'scheduled'].includes(r.status)" :href="waLink(r)" target="_blank" rel="noopener noreferrer"
            class="pd-icon-btn is-wa" :aria-label="`WhatsApp wali ${r.childName}`" title="WhatsApp wali">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="WA_PATH" /></svg>
          </a>
          <button type="button" class="pd-btn pd-btn-ghost" @click="openDetail(r.id)">Buka</button>
        </div>
      </li>
    </ul>

    <!-- ============ detail ============ -->
    <div v-if="detailId" class="pd-overlay" @click.self="closeDetail">
      <section class="pd-sheet pd-sheet-wide" role="dialog" aria-modal="true" aria-labelledby="pd-detail-title">
        <header class="pd-sheet-head">
          <div>
            <h3 id="pd-detail-title">{{ detail?.childName || 'Memuat…' }}</h3>
            <p v-if="detail" class="pd-sub">{{ detail.number }} · <span class="pd-pill" :class="`is-${statusOf(detail).tone}`">{{ statusOf(detail).label }}</span></p>
          </div>
          <button type="button" class="pd-close" aria-label="Tutup" @click="closeDetail"><LineIcon name="x" :size="20" /></button>
        </header>

        <div v-if="detailLoading" class="pd-sheet-body"><PageSkeleton :rows="4" label="Memuat data pendaftar" /></div>
        <div v-else-if="detail" class="pd-sheet-body">
          <!-- the facts the admin needs first -->
          <div class="pd-facts">
            <div><span>Usia</span><strong>{{ detail.age !== null ? `${detail.age} tahun` : '-' }}</strong></div>
            <div><span>Sesi pilihan</span><strong>{{ sesiName(detail.sesi) }}</strong></div>
            <div><span>Wali</span><strong>{{ RELATION[detail.relation] }} · {{ displayPhone(detail.phone) }}</strong></div>
            <div><span>Daftar</span><strong>{{ fmtDate(detail.submittedAt) }}</strong></div>
          </div>
          <p v-if="detail.editedAfterSubmitAt && isOpen(detail)" class="pd-note is-warn">Wali mengubah data setelah mengirim ({{ ago(detail.editedAfterSubmitAt) }}).</p>

          <!-- the same child registered again (the other parent, or sent twice) -->
          <div v-if="detail.similar?.length" class="pd-note is-twin">
            <strong>Mungkin pendaftaran ganda (anak yang sama):</strong>
            <ul class="pd-twins">
              <li v-for="s in detail.similar" :key="s.id">
                <span>{{ s.number }} · {{ s.childName }} · {{ RELATION[s.relation] }} {{ displayPhone(s.phone) }}
                  <span class="pd-pill" :class="`is-${statusOf(s).tone}`">{{ statusOf(s).label }}</span></span>
                <button type="button" class="pd-btn pd-btn-ghost pd-twin-open" @click="openDetail(s.id)">Buka</button>
              </li>
            </ul>
            <span v-if="acceptedTwin" class="pd-sub">
              {{ acceptedTwin.number }} sudah diterima. Di "Terima &amp; tempatkan", pilih <strong>Gabungkan dengan {{ acceptedTwin.childName }}</strong>:
              wali ini ikut tertaut ke santri yang sama, tanpa santri ganda.
            </span>
            <span v-else-if="isOpen(detail)" class="pd-sub">Terima salah satu dulu, lalu di pendaftaran yang lain pilih "Gabungkan dengan …" agar kedua wali tertaut ke santri yang sama. Bila memang dobel dari wali yang sama, batalkan salah satunya.</span>
          </div>

          <!-- maybe already in Kelola Santri -->
          <div v-if="detail.duplicates?.length && isOpen(detail)" class="pd-note is-warn">
            <strong>Mungkin sudah terdaftar di Kelola Santri:</strong>
            <ul class="pd-plain">
              <li v-for="d in detail.duplicates" :key="d.id">
                {{ d.name }} · {{ levelName(d.classId) || 'tanpa jilid' }}<template v-if="d.birthDate"> · lahir {{ longDate(d.birthDate) }}</template>
                <em>{{ d.sameName ? '(nama sama)' : '(tanggal lahir sama)' }}</em>
              </li>
            </ul>
            <span class="pd-sub">Saat menerima, Antum bisa menggabungkan pendaftar ini dengan santri tersebut.</span>
          </div>

          <!-- accepted / cancelled -->
          <p v-if="detail.status === 'accepted'" class="pd-note">
            Diterima di <strong>{{ levelName(detail.classId) }}</strong><template v-if="detail.nomorInduk"> · No. induk <strong>{{ detail.nomorInduk }}</strong></template>
            <template v-if="detail.acceptedByName"> · oleh {{ detail.acceptedByName }}</template>.
            Wali sudah tertaut dan tinggal melengkapi NIK &amp; KK.
          </p>
          <div v-else-if="detail.status === 'cancelled'" class="pd-note is-danger">
            <span>{{ detail.cancelledBy === 'wali' ? 'Dibatalkan oleh wali.' : `Dibatalkan${detail.cancelledByName ? ` oleh ${detail.cancelledByName}` : ''}.` }}
              <template v-if="detail.cancelReason && detail.cancelledBy !== 'wali'"> Alasan: {{ detail.cancelReason }}</template></span>
            <span class="pd-cancel-actions">
              <button type="button" class="pd-btn pd-btn-ghost pd-reopen" :disabled="busy" @click="setStatus('submitted')">Buka lagi</button>
              <button v-if="isAdmin" type="button" class="pd-btn pd-btn-ghost is-danger pd-reopen" :disabled="busy" @click="removeForGood">Hapus permanen</button>
            </span>
          </div>

          <!-- the next steps -->
          <template v-if="isOpen(detail)">
            <a :href="waLink(detail)" target="_blank" rel="noopener noreferrer" class="pd-btn pd-btn-wa">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="WA_PATH" /></svg>
              WhatsApp wali ({{ displayPhone(detail.phone) }})
            </a>
            <div class="pd-steps">
              <button v-if="detail.status === 'submitted'" type="button" class="pd-btn pd-btn-ghost" :disabled="busy" @click="setStatus('contacted')">
                <LineIcon name="check" :size="16" /> Tandai sudah dihubungi
              </button>
              <button type="button" class="pd-btn pd-btn-ghost" :aria-expanded="panel === 'schedule'" @click="togglePanel('schedule')">
                <LineIcon name="calendar" :size="16" /> {{ detail.schedule ? 'Ubah jadwal penempatan' : 'Jadwalkan penempatan' }}
              </button>
              <button type="button" class="pd-btn pd-btn-primary" :aria-expanded="panel === 'accept'" @click="togglePanel('accept')">
                <LineIcon name="star" :size="16" /> Terima &amp; tempatkan
              </button>
            </div>

            <!-- placement schedule -->
            <form v-if="panel === 'schedule'" class="pd-panel" @submit.prevent="saveSchedule">
              <p class="pd-panel-title">Jadwal penempatan jilid</p>
              <div class="pd-grid2">
                <label class="pd-field"><span>Tanggal</span><input v-model="sched.date" type="date" :min="today" class="pd-input" required /></label>
                <label class="pd-field"><span>Jam</span><input v-model="sched.time" type="time" class="pd-input" /></label>
              </div>
              <label class="pd-field"><span>Catatan untuk wali (opsional)</span><input v-model="sched.note" class="pd-input" maxlength="200" placeholder="Contoh: Bawa buku tulis" /></label>
              <label class="pd-check"><input v-model="sched.notify" type="checkbox" /> Kirim jadwal ke WhatsApp wali</label>
              <button type="submit" class="pd-btn pd-btn-primary" :disabled="busy || !sched.date">{{ busy ? 'Menyimpan…' : 'Simpan jadwal' }}</button>
            </form>

            <!-- accept -->
            <form v-if="panel === 'accept'" class="pd-panel is-accept" @submit.prevent="accept">
              <p class="pd-panel-title">Terima &amp; tempatkan</p>
              <div class="pd-grid2">
                <label class="pd-field"><span>Jilid</span>
                  <select v-model="acc.classId" class="pd-input" required>
                    <option value="">Pilih jilid…</option>
                    <option v-for="c in CLASSES" :key="c" :value="c">{{ levelName(c) }}</option>
                  </select>
                </label>
                <div class="pd-field"><span id="acc-sesi">Sesi</span>
                  <div class="pd-seg" role="radiogroup" aria-labelledby="acc-sesi">
                    <button v-for="s in ['sore', 'malam']" :key="s" type="button" role="radio" :aria-checked="acc.sesi === s" @click="acc.sesi = s">{{ s === 'sore' ? 'Sore' : 'Malam' }}</button>
                  </div>
                </div>
              </div>
              <fieldset v-if="detail.duplicates?.length" class="pd-merge">
                <legend>Santri di Kelola Santri</legend>
                <label class="pd-check"><input v-model="acc.existing" type="radio" value="" /> Buat santri baru (nomor induk baru)</label>
                <label v-for="d in detail.duplicates" :key="d.id" class="pd-check">
                  <input v-model="acc.existing" type="radio" :value="d.id" /> Gabungkan dengan {{ d.name }} ({{ levelName(d.classId) || 'tanpa jilid' }})
                </label>
              </fieldset>
              <p class="pd-sub">Santri masuk Kelola Santri{{ acc.existing ? '' : ' dengan nomor induk baru' }}, wali langsung tertaut, data pendaftaran disalin ke Data Wali Santri, dan wali diberi tahu lewat WhatsApp.</p>
              <button type="submit" class="pd-btn pd-btn-primary" :disabled="busy || !acc.classId || !acc.sesi">{{ busy ? 'Memproses…' : `Terima di ${levelName(acc.classId) || '…'}` }}</button>
            </form>

            <button type="button" class="pd-btn pd-btn-ghost is-danger" :disabled="busy" @click="cancel">Batalkan pendaftaran</button>
          </template>

          <!-- the admin's own note -->
          <div class="pd-group">
            <label class="pd-label" for="pd-note">Catatan admin (tidak terlihat wali)</label>
            <textarea id="pd-note" v-model="note" class="pd-input" maxlength="500" placeholder="Contoh: kakaknya santri Jilid 4"></textarea>
            <button v-if="note !== (detail.adminNote || '')" type="button" class="pd-btn pd-btn-ghost pd-note-save" :disabled="busy" @click="saveNote">Simpan catatan</button>
          </div>

          <!-- everything the parent filled in -->
          <div v-for="s in STEPS" :key="s.key" class="pd-group">
            <strong>{{ s.title }}</strong>
            <dl>
              <template v-for="f in s.fields" :key="f.path">
                <div v-if="isShown(f, detail.data) && shownValue(f, detail.data)" class="pd-dl-row">
                  <dt>{{ f.label }}</dt>
                  <dd>{{ shownValue(f, detail.data) }}</dd>
                </div>
              </template>
              <div v-if="s.key === 'alamat'" class="pd-dl-row"><dt>Nomor WhatsApp</dt><dd>{{ displayPhone(detail.phone) }}</dd></div>
            </dl>
          </div>
        </div>
      </section>
    </div>

    <!-- ============ who gets the "pendaftar baru" message ============ -->
    <div v-if="settingsOpen" class="pd-overlay" @click.self="settingsOpen = false">
      <section class="pd-sheet" role="dialog" aria-modal="true" aria-labelledby="pd-settings-title">
        <header class="pd-sheet-head">
          <div>
            <h3 id="pd-settings-title">Penerima notifikasi WA</h3>
            <p class="pd-sub">Dapat pesan setiap ada pendaftar baru (pukul 06:30-21:00).</p>
          </div>
          <button type="button" class="pd-close" aria-label="Tutup" @click="settingsOpen = false"><LineIcon name="x" :size="20" /></button>
        </header>
        <form class="pd-sheet-body" @submit.prevent="saveSettings">
          <div v-for="(n, i) in notify" :key="i" class="pd-recipient">
            <input v-model="n.name" class="pd-input" placeholder="Nama, contoh: Ustadzah Ella" :aria-label="`Nama penerima ${i + 1}`" />
            <input v-model="n.phone" class="pd-input" type="tel" inputmode="tel" placeholder="0812 3456 7890" :aria-label="`Nomor WA penerima ${i + 1}`" />
            <button type="button" class="pd-close" :aria-label="`Hapus penerima ${i + 1}`" @click="notify.splice(i, 1)"><LineIcon name="x" :size="18" /></button>
          </div>
          <button v-if="notify.length < 5" type="button" class="pd-btn pd-btn-ghost" @click="notify.push({ name: '', phone: '' })"><LineIcon name="plus" :size="16" /> Tambah penerima</button>
          <button type="submit" class="pd-btn pd-btn-primary" :disabled="busy">{{ busy ? 'Menyimpan…' : 'Simpan' }}</button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import PageSkeleton from '@/components/PageSkeleton.vue'
import LineIcon from '@/components/LineIcon.vue'
import { loadExcelLib, downloadWorkbook } from '@/utils/excel'
import { buildRegistrationWorkbook, registrationFilename } from '@/utils/excelExports'
import { STEPS, REG_STATUS, isShown, shownValue, displayPhone, longDate, levelName, sesiName } from '@/utils/pendaftaran'
import { usePendaftaranCount } from '@/composables/usePendaftaranCount'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { ask } = useDialog()
const isAdmin = computed(() => useAuthStore().user?.role === 'admin')

const WA_PATH = 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z'
const TABS = [
  { key: 'open', label: 'Perlu ditindak', statuses: ['submitted', 'contacted', 'scheduled', 'accepting'] },
  { key: 'accepted', label: 'Diterima', statuses: ['accepted'] },
  { key: 'cancelled', label: 'Dibatalkan', statuses: ['cancelled'] },
  { key: 'all', label: 'Semua', statuses: null },
]
const CLASSES = ['1', '2', '3', '4', '5', '6', '7']
const RELATION = { ayah: 'Ayah', ibu: 'Ibu', wali: 'Wali' }
const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
const siteLink = `${window.location.origin}/daftar`

const loading = ref(true)
const loadError = ref('')
const list = ref([])
const counts = ref({})
const tab = ref('open')
const search = ref('')
const exporting = ref(false)

const detailId = ref('')
const detail = ref(null)
const detailLoading = ref(false)
const busy = ref(false)
const panel = ref('')
const note = ref('')
const sched = ref({ date: '', time: '15:30', note: '', notify: true })
const acc = ref({ classId: '', sesi: '', existing: '' })

const settingsOpen = ref(false)
const notify = ref([])

const { refresh: refreshCount } = usePendaftaranCount()
const statusOf = (r) => REG_STATUS[r.status] || REG_STATUS.submitted
const acceptedTwin = computed(() => detail.value?.similar?.find((s) => s.status === 'accepted' && s.santriId) || null)
const isOpen = (r) => ['submitted', 'contacted', 'scheduled'].includes(r.status)
const genderShort = (g) => (g === 'L' ? 'Laki-laki' : g === 'P' ? 'Perempuan' : '')
const tabCount = (t) => (t.statuses ? list.value.filter((r) => t.statuses.includes(r.status)).length : list.value.length)

const shown = computed(() => {
  const t = TABS.find((x) => x.key === tab.value)
  const q = search.value.trim().toLowerCase()
  return list.value.filter((r) => (!t.statuses || t.statuses.includes(r.status)) && (!q || `${r.childName} ${r.number} ${r.desa}`.toLowerCase().includes(q)))
})

const toDate = (v) => {
  if (!v) return null
  if (v._seconds !== undefined || v.seconds !== undefined) return new Date(Number(v._seconds ?? v.seconds) * 1000)
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}
const fmtDate = (v) => toDate(v)?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }) || '-'
function ago(v) {
  const d = toDate(v)
  if (!d) return ''
  const min = Math.round((Date.now() - d.getTime()) / 60000)
  if (min < 1) return 'baru saja'
  if (min < 60) return `${min} menit lalu`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} jam lalu`
  const days = Math.round(h / 24)
  return days < 8 ? `${days} hari lalu` : fmtDate(v)
}

const waLink = (r) => {
  const text = `Assalamu'alaikum Bapak/Ibu, kami dari TPQ Amanah terkait pendaftaran ananda ${r.childName} (${r.number}).`
  return `https://wa.me/${r.phone}?text=${encodeURIComponent(text)}`
}

async function load({ quiet = false } = {}) {
  if (!quiet) loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/pendaftaran/admin', { cache: false })
    list.value = data.list || []
    counts.value = data.counts || {}
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Data pendaftar belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

function applyDetail(data) {
  detail.value = data
  note.value = data.adminNote || ''
  // update the row in the list without reloading it
  const i = list.value.findIndex((r) => r.id === data.id)
  if (i >= 0) list.value[i] = { ...list.value[i], ...data }
}

async function openDetail(id) {
  detailId.value = id
  detail.value = null
  panel.value = ''
  detailLoading.value = true
  if (route.query.id !== id) router.replace({ query: { ...route.query, id } })
  try {
    const { data } = await api.get(`/pendaftaran/admin/${id}`, { cache: false })
    applyDetail(data)
    // the other parent's registration was accepted already: join the same santri by default
    const twin = (data.similar || []).find((s) => s.status === 'accepted' && s.santriId && (data.duplicates || []).some((d) => d.id === s.santriId))
    acc.value = { classId: twin?.classId || '', sesi: data.sesi || 'sore', existing: twin?.santriId || '' }
    sched.value = {
      date: data.schedule?.date || '',
      time: data.schedule?.time || (data.sesi === 'malam' ? '18:00' : '15:30'),
      note: data.schedule?.note || '',
      notify: true,
    }
  } catch (err) {
    toast.error(err.response?.data?.error || 'Data pendaftar belum bisa dimuat.')
    closeDetail()
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  detailId.value = ''
  detail.value = null
  if (route.query.id) {
    const { id, ...rest } = route.query
    router.replace({ query: rest })
  }
}

function togglePanel(name) {
  panel.value = panel.value === name ? '' : name
}

async function act(fn, success) {
  busy.value = true
  try {
    const { data } = await fn()
    applyDetail(data)
    panel.value = ''
    if (success) toast.success(typeof success === 'function' ? success(data) : success)
    load({ quiet: true })
    refreshCount({ force: true })
    return data
  } catch (err) {
    toast.error(err.response?.data?.error || 'Belum berhasil. Coba lagi.')
    return null
  } finally {
    busy.value = false
  }
}

const setStatus = (status) => act(() => api.post(`/pendaftaran/admin/${detail.value.id}/status`, { status }), status === 'contacted' ? 'Ditandai sudah dihubungi' : 'Pendaftaran dibuka lagi')

const saveSchedule = () =>
  act(
    () => api.post(`/pendaftaran/admin/${detail.value.id}/status`, { status: 'scheduled', schedule: { ...sched.value } }),
    sched.value.notify ? 'Jadwal tersimpan dan dikirim ke WhatsApp wali' : 'Jadwal tersimpan',
  )

const saveNote = () => act(() => api.put(`/pendaftaran/admin/${detail.value.id}/note`, { note: note.value }), 'Catatan tersimpan')

async function accept() {
  const merging = detail.value.duplicates?.find((d) => d.id === acc.value.existing)
  const ok = await ask({
    title: `Terima ${detail.value.childName}?`,
    message: merging
      ? `Digabung dengan ${merging.name} di Kelola Santri, ditempatkan di ${levelName(acc.value.classId)} sesi ${acc.value.sesi}. Wali diberi tahu lewat WhatsApp.`
      : `Ditambahkan ke Kelola Santri di ${levelName(acc.value.classId)} sesi ${acc.value.sesi} dengan nomor induk baru. Wali diberi tahu lewat WhatsApp.`,
    confirmText: 'Terima',
  })
  if (!ok) return
  await act(
    () => api.post(`/pendaftaran/admin/${detail.value.id}/accept`, { classId: acc.value.classId, sesi: acc.value.sesi, existingSantriId: acc.value.existing || undefined }),
    (data) => `${data.santri?.name || detail.value.childName} diterima${data.santri?.nomorInduk ? `, nomor induk ${data.santri.nomorInduk}` : ''}`,
  )
}

async function cancel() {
  const reason = await ask({
    title: 'Batalkan pendaftaran?',
    message: `Pendaftaran ${detail.value.childName} (${detail.value.number}) tidak dilanjutkan. Alasan dikirim ke WhatsApp wali.`,
    tone: 'danger',
    confirmText: 'Batalkan pendaftaran',
    cancelText: 'Kembali',
    input: { label: 'Alasan', value: '', placeholder: 'Contoh: usia belum cukup, kuota sesi penuh', required: true, maxlength: 300 },
  })
  if (reason === null) return
  await act(() => api.post(`/pendaftaran/admin/${detail.value.id}/cancel`, { reason }), 'Pendaftaran dibatalkan')
}

async function removeForGood() {
  const ok = await ask({
    title: 'Hapus permanen?',
    message: `${detail.value.number} (${detail.value.childName}) dihapus dan tidak bisa dikembalikan. Gunakan untuk uji coba atau salah input. Bila ini nomor terakhir, nomornya dipakai lagi oleh pendaftar berikutnya.`,
    tone: 'danger',
    confirmText: 'Hapus permanen',
  })
  if (!ok) return
  busy.value = true
  try {
    const { data } = await api.delete(`/pendaftaran/admin/${detail.value.id}`)
    toast.success(data.numberFreed ? `${data.number} dihapus. Nomornya dipakai lagi untuk pendaftar berikutnya.` : `${data.number} dihapus.`)
    list.value = list.value.filter((r) => r.id !== detail.value.id)
    closeDetail()
    load({ quiet: true })
  } catch (err) {
    toast.error(err.response?.data?.error || 'Belum terhapus. Coba lagi.')
  } finally {
    busy.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(siteLink)
    toast.success(`Link disalin: ${siteLink}`)
  } catch {
    toast.info(`Link pendaftaran: ${siteLink}`)
  }
}

async function exportExcel() {
  if (exporting.value || !shown.value.length) return
  exporting.value = true
  try {
    const exportedAt = new Date()
    const [{ data }, ExcelJS] = await Promise.all([api.get('/pendaftaran/admin', { params: { full: '1' }, cache: false }), loadExcelLib()])
    const order = new Map(shown.value.map((r, i) => [r.id, i]))
    const rows = (data.list || []).filter((r) => order.has(r.id)).sort((a, b) => order.get(a.id) - order.get(b.id))
    const t = TABS.find((x) => x.key === tab.value)
    const filtered = tab.value !== 'all' || !!search.value.trim()
    const workbook = buildRegistrationWorkbook(ExcelJS, {
      rows, steps: STEPS, shown: shownValue, status: REG_STATUS, exportedAt,
      filterLabel: filtered ? `${t.label}${search.value.trim() ? `, cari "${search.value.trim()}"` : ''}` : 'Semua pendaftar',
    })
    const filename = registrationFilename({ date: exportedAt, filtered })
    await downloadWorkbook(workbook, filename)
    toast.success(`${rows.length} pendaftar diekspor ke ${filename}`)
  } catch (err) {
    toast.error(err.response?.data?.error || 'Gagal mengekspor Excel. Coba lagi.')
  } finally {
    exporting.value = false
  }
}

async function openSettings() {
  settingsOpen.value = true
  try {
    const { data } = await api.get('/pendaftaran/admin/settings', { cache: false })
    notify.value = (data.notify || []).map((n) => ({ name: n.name, phone: displayPhone(n.phone) }))
  } catch (err) {
    toast.error(err.response?.data?.error || 'Pengaturan belum bisa dimuat.')
  }
}

async function saveSettings() {
  busy.value = true
  try {
    const { data } = await api.put('/pendaftaran/admin/settings', { notify: notify.value })
    notify.value = data.notify.map((n) => ({ name: n.name, phone: displayPhone(n.phone) }))
    toast.success('Penerima notifikasi tersimpan')
    settingsOpen.value = false
  } catch (err) {
    toast.error(err.response?.data?.error || 'Belum tersimpan.')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  await load()
  if (route.query.id) openDetail(String(route.query.id))
})
watch(() => route.query.id, (id) => {
  if (id && id !== detailId.value) openDetail(String(id))
  if (!id && detailId.value) {
    detailId.value = ''
    detail.value = null
  }
})
</script>

<style scoped>
.pd {
  padding-top: 60px;
}

.pd.is-guru {
  padding-top: 0;
}

@media (min-width: 1024px) {
  .pd {
    padding-top: 0;
  }
}

.pd-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.pd-head h1 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  font-weight: 800;
  color: #0b3b2a;
}

.pd-head p {
  margin: 0;
  color: #475a50;
}

.pd-head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pd-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 14px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  overflow: hidden;
}

.pd-summary > div {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
}

.pd-summary > div + div {
  border-left: 1px solid rgba(11, 59, 42, 0.08);
}

.pd-summary strong {
  font-size: 1.35rem;
  color: #0b3b2a;
  font-variant-numeric: tabular-nums;
}

.pd-summary span {
  font-size: 0.78rem;
  color: #5b6b62;
}

.pd-summary .is-attn {
  background: #fffbeb;
}

.pd-summary .is-attn strong {
  color: #7c3a0d;
}

@media (max-width: 560px) {
  .pd-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .pd-summary > div:nth-child(3) {
    border-left: 0;
  }
  .pd-summary > div:nth-child(n + 3) {
    border-top: 1px solid rgba(11, 59, 42, 0.08);
  }
}

.pd-tabs {
  display: flex;
  overflow-x: auto;
  gap: 6px;
  margin-bottom: 10px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
  width: fit-content;
  max-width: 100%;
}

.pd-tabs button {
  flex: none;
  white-space: nowrap;
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

.pd-tabs button.active {
  background: #fff;
  color: #0b3b2a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.pd-count {
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

.pd-filters {
  margin-bottom: 10px;
}

.pd-input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 11px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  color: #0b3b2a;
  box-sizing: border-box;
}

textarea.pd-input {
  min-height: 70px;
  padding: 10px 12px;
}

.pd-input:focus {
  border-color: #0a5c40;
  outline: none;
  box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.14);
}

.pd-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.pd-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.pd-row + .pd-row {
  border-top: 1px solid rgba(11, 59, 42, 0.07);
}

.pd-row-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.pd-row-main:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 4px;
  border-radius: 6px;
}

.pd-row-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
}

.pd-row-top strong {
  color: #0b3b2a;
  font-size: 1rem;
}

.pd-row-side {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pd-sub {
  margin: 0;
  font-size: 0.82rem;
  color: #5b6b62;
}

.pd-sub.is-muted {
  color: #8a968f;
}

.pd-sub.is-sched {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #92400e;
  font-weight: 700;
}

.pd-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.pd-pill.is-idle { background: #eef0ef; color: #4b5a52; }
.pd-pill.is-warn { background: #fef3c7; color: #7c3a0d; }
.pd-pill.is-info { background: #e6f0fb; color: #1d4f8a; }
.pd-pill.is-danger { background: #fdecea; color: #8e1b12; }
.pd-pill.is-ok { background: #e3f1ea; color: #0a5c40; }

.pd-btn {
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

.pd-btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #0a5c40, #053d2c);
}

.pd-btn-ghost {
  color: #0b3b2a;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.22);
}

.pd-btn-ghost.is-danger {
  color: #b42318;
  border-color: rgba(180, 35, 24, 0.35);
}

.pd-btn-wa {
  color: #fff;
  background: #128c4b;
}

.pd-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pd-icon-btn {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 11px;
  text-decoration: none;
}

.pd-icon-btn.is-wa {
  background: #e7f6ee;
  color: #128c4b;
}

.pd-btn:focus-visible,
.pd-icon-btn:focus-visible,
.pd-close:focus-visible,
.pd-seg button:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.pd-empty {
  padding: 28px 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px dashed rgba(11, 59, 42, 0.2);
  text-align: center;
}

.pd-empty-title {
  margin: 0 0 4px;
  font-weight: 700;
  color: #0b3b2a;
}

.pd-note {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #eef6f1;
  color: #0a4a34;
  font-size: 0.88rem;
  line-height: 1.5;
}

.pd-note.is-warn {
  background: #fffbeb;
  color: #5b3a06;
  border: 1px solid #f3d58b;
}

.pd-note.is-danger {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: #fdecea;
  color: #7a1810;
}

.pd-pill.is-twin {
  background: #fff1e6;
  color: #9a3412;
  border: 1px dashed #f0a46b;
}

.pd-note.is-twin {
  background: #fff7ed;
  color: #6b2d0b;
  border: 1px solid #f6c39b;
}

.pd-twins {
  list-style: none;
  margin: 8px 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.pd-twins li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fff;
}

.pd-twins .pd-pill {
  margin-left: 4px;
}

.pd-twin-open {
  min-height: 36px;
}

.pd-cancel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pd-plain {
  margin: 6px 0;
  padding-left: 18px;
}

.pd-plain em {
  margin-left: 4px;
  font-style: normal;
  color: #92400e;
}

/* sheets */
.pd-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 41, 29, 0.45);
}

.pd-sheet {
  width: 100%;
  max-height: 90dvh;
  overflow-y: auto;
  background: #fbf9f3;
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 640px) {
  .pd-overlay {
    align-items: center;
    padding: 24px;
  }
  .pd-sheet {
    max-width: 480px;
    border-radius: 20px;
  }
  .pd-sheet-wide {
    max-width: 680px;
  }
}

.pd-sheet-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  background: #fbf9f3;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.pd-sheet-head h3 {
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0b3b2a;
}

.pd-close {
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

.pd-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 18px 22px;
}

.pd-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.pd-facts > div {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.08);
}

.pd-facts span {
  font-size: 0.75rem;
  color: #5b6b62;
}

.pd-facts strong {
  font-size: 0.92rem;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.pd-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 8px;
}

.pd-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  background: #fff;
  border: 1.5px solid rgba(180, 83, 9, 0.35);
}

.pd-panel.is-accept {
  border-color: rgba(10, 92, 64, 0.45);
}

.pd-panel-title {
  margin: 0;
  font-weight: 800;
  color: #0b3b2a;
}

.pd-grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pd-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0b3b2a;
}

.pd-seg {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 3px;
  border-radius: 11px;
  background: rgba(11, 59, 42, 0.06);
}

.pd-seg button {
  min-height: 38px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-weight: 700;
  color: #3b4a42;
  cursor: pointer;
}

.pd-seg button[aria-checked="true"] {
  background: #0a5c40;
  color: #fff;
}

.pd-merge {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.12);
}

.pd-merge legend {
  padding: 0 4px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #5b6b62;
}

.pd-check {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 4px 0;
  font-size: 0.88rem;
  color: #0b3b2a;
}

.pd-check input {
  width: 18px;
  height: 18px;
  accent-color: #0a5c40;
}

.pd-group {
  padding-top: 10px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.pd-group > strong {
  color: #0b3b2a;
}

.pd-group dl {
  margin: 6px 0 0;
}

.pd-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0b3b2a;
}

.pd-note-save {
  margin-top: 6px;
}

.pd-reopen {
  min-height: 36px;
}

.pd-dl-row {
  display: grid;
  grid-template-columns: minmax(0, 42%) minmax(0, 1fr);
  gap: 10px;
  padding: 3px 0;
  font-size: 0.88rem;
}

.pd-dl-row dt {
  color: #5b6b62;
}

.pd-dl-row dd {
  margin: 0;
  font-weight: 600;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.pd-recipient {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 44px;
  gap: 8px;
}

@media (max-width: 480px) {
  .pd-recipient {
    grid-template-columns: minmax(0, 1fr) 44px;
  }
  .pd-recipient input:nth-child(2) {
    grid-column: 1;
    grid-row: 2;
  }
  .pd-recipient .pd-close {
    grid-column: 2;
    grid-row: 1 / span 2;
    height: auto;
  }
  .pd-row {
    align-items: flex-start;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
