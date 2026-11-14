<template>
  <div class="kg" :class="{ 'is-admin': isAdmin }">
    <router-link to="/dashboard/kegiatan" class="kg-back">← Semua kegiatan</router-link>

    <PageSkeleton v-if="loading && !data" :rows="5" label="Memuat kegiatan" />
    <p v-else-if="loadError" class="kg-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else-if="data">
      <header class="kg-head">
        <div>
          <h1>{{ a.title }}</h1>
          <p>
            {{ a.typeLabel }}<template v-if="a.date"> · {{ dayLabel(a.date) }}</template>
            <span class="kg-pill" :class="a.status === 'open' ? 'is-ok' : 'is-idle'">{{ a.status === 'open' ? 'Berjalan' : 'Selesai' }}</span>
          </p>
        </div>
        <div v-if="data.canManage" class="kg-inline">
          <button type="button" class="kg-btn kg-btn-sm" @click="openForm">Ubah</button>
          <button type="button" class="kg-btn kg-btn-sm" :disabled="busy" @click="toggleClosed">{{ a.status === 'open' ? 'Tutup kegiatan' : 'Buka lagi' }}</button>
          <button v-if="isAdmin" type="button" class="kg-btn kg-btn-sm kg-btn-danger" :disabled="busy" @click="removeActivity">Hapus</button>
        </div>
      </header>

      <p v-if="a.description" class="kg-note">{{ a.description }}</p>
      <p class="kg-note">
        <template v-if="a.fee">Biaya <strong>{{ formatRupiah(a.fee) }}</strong> per santri.
          <template v-if="a.savingsBookTitle">Pembayaran dihitung dari setoran di buku <strong>{{ a.savingsBookTitle }}</strong>, tidak perlu dicatat dua kali.</template>
          <template v-else>Tidak ditautkan ke buku tabungan, jadi lunas ditandai manual.</template>
        </template>
        <template v-else>Kegiatan ini tanpa biaya.</template>
        <template v-if="data.limitedToJilid"> Antum melihat dan mengelola peserta dari jilid yang Antum ampu.</template>
      </p>

      <div class="kg-tiles">
        <div class="kg-tile"><strong>{{ sum.total }}</strong><span>peserta</span></div>
        <div v-if="a.fee" class="kg-tile"><strong>{{ sum.lunas }}</strong><span>sudah lunas</span></div>
        <div v-if="a.fee" class="kg-tile" :class="{ 'is-attn': sum.belum }"><strong>{{ sum.belum }}</strong><span>belum lunas</span></div>
        <div v-if="sum.withRequirements" class="kg-tile"><strong>{{ sum.lengkap }}</strong><span>persyaratan lengkap</span></div>
      </div>

      <section class="kg-panel" aria-labelledby="kg-peserta">
        <div class="kg-card-top">
          <h2 id="kg-peserta">Peserta</h2>
          <button v-if="a.status === 'open'" type="button" class="kg-btn kg-btn-primary kg-btn-sm" @click="openAdd">+ Tambah peserta</button>
        </div>

        <div v-if="data.participants.length" class="kg-filters">
          <label class="sr-only" for="kg-search">Cari nama</label>
          <input id="kg-search" v-model="search" class="kg-input" placeholder="Cari nama santri" />
          <label class="sr-only" for="kg-jilid">Jilid</label>
          <select id="kg-jilid" v-model="jilidFilter" class="kg-input">
            <option value="">Semua jilid</option>
            <option v-for="id in presentJilid" :key="id" :value="id">{{ levelName(id) }}</option>
          </select>
        </div>
        <div v-if="data.participants.length" class="kg-chips" role="group" aria-label="Saring peserta">
          <button v-for="f in FILTERS" v-show="f.show()" :key="f.value" type="button" class="kg-chip" :aria-pressed="filter === f.value" @click="filter = f.value">
            {{ f.label }} <span>{{ countFor(f.value) }}</span>
          </button>
        </div>

        <p v-if="!data.participants.length" class="kg-empty">Belum ada peserta. Tekan <strong>+ Tambah peserta</strong>.</p>
        <p v-else-if="!visible.length" class="kg-empty">Tidak ada peserta yang cocok.</p>

        <ul v-else class="kg-rows">
          <li v-for="p in visible" :key="p.santriId" class="kg-row">
            <button type="button" class="kg-row-head kg-toggle" :aria-expanded="open === p.santriId" @click="open = open === p.santriId ? null : p.santriId">
              <span class="kg-who">
                <strong>{{ p.name }}</strong>
                <span class="kg-sub">{{ levelName(p.classId) }}<template v-if="p.requirementsTotal"> · {{ p.requirementsDone }}/{{ p.requirementsTotal }} persyaratan</template></span>
              </span>
              <span class="kg-row-pills">
                <span class="kg-pill" :class="`is-${STATUS_TONE[p.status] || 'idle'}`">{{ p.statusLabel }}</span>
                <span v-if="a.fee" class="kg-pill" :class="`is-${PAYMENT_TONE[p.payment.state]}`">{{ p.payment.label }}</span>
              </span>
            </button>

            <div v-if="open === p.santriId" class="kg-open">
              <div class="kg-field">
                <label class="kg-label" :for="`st-${p.santriId}`">Status</label>
                <select :id="`st-${p.santriId}`" class="kg-input" :value="p.status" @change="setStatus(p, $event.target.value)">
                  <option v-for="s in PARTICIPANT_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>

              <div v-if="a.requirements.length" class="kg-field">
                <span class="kg-label">Persyaratan</span>
                <div class="kg-checks">
                  <label v-for="r in a.requirements" :key="r.id" class="kg-check">
                    <input type="checkbox" :checked="!!p.checked[r.id]" @change="toggleRequirement(p, r)" />
                    {{ r.label }}
                  </label>
                </div>
              </div>

              <div v-if="a.fee" class="kg-field">
                <span class="kg-label">Pembayaran</span>
                <span class="kg-sub">{{ paymentLine(p.payment) }}</span>
                <div v-if="p.payment.manual" class="kg-inline">
                  <button type="button" class="kg-btn kg-btn-sm" :disabled="busy" @click="clearManual(p)">Batalkan tanda lunas manual</button>
                </div>
                <div v-else-if="p.payment.state !== 'lunas'" class="kg-inline">
                  <input v-model="manualReason[p.santriId]" class="kg-input" maxlength="200" :aria-label="`Alasan lunas manual ${p.name}`" placeholder="Alasan, misalnya: bayar tunai ke admin" />
                  <button type="button" class="kg-btn kg-btn-sm" :disabled="busy || (manualReason[p.santriId] || '').trim().length < 3" @click="markManual(p)">Tandai lunas</button>
                </div>
              </div>

              <div class="kg-field">
                <label class="kg-label" :for="`nt-${p.santriId}`">Catatan (hanya terlihat guru dan admin)</label>
                <textarea :id="`nt-${p.santriId}`" class="kg-input" maxlength="300" :value="p.note" @blur="saveNote(p, $event.target.value)"></textarea>
              </div>

              <div class="kg-inline">
                <button type="button" class="kg-btn kg-btn-sm kg-btn-danger" :disabled="busy" @click="removeParticipant(p)">Keluarkan dari kegiatan</button>
              </div>
            </div>
          </li>
        </ul>
        <p v-if="actionError" class="kg-note is-danger" role="alert">{{ actionError }}</p>
      </section>
    </template>

    <!-- add participants -->
    <Teleport to="body">
      <div v-if="addOpen" class="kg-overlay" @click.self="addOpen = false">
        <section class="kg-sheet" role="dialog" aria-modal="true" aria-labelledby="kg-add-title">
          <header class="kg-sheet-head">
            <h3 id="kg-add-title">Tambah peserta</h3>
            <button type="button" class="kg-close" aria-label="Tutup" @click="addOpen = false">×</button>
          </header>
          <div class="kg-sheet-body">
            <div class="kg-filters">
              <label class="sr-only" for="kg-pick-search">Cari nama</label>
              <input id="kg-pick-search" v-model="pickSearch" class="kg-input" placeholder="Cari nama santri" />
              <label class="sr-only" for="kg-pick-jilid">Jilid</label>
              <select id="kg-pick-jilid" v-model="pickJilid" class="kg-input">
                <option value="">Semua jilid{{ data?.limitedToJilid ? ' saya' : '' }}</option>
                <option v-for="o in jilidOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </div>
            <p v-if="pickLoading" class="kg-sub">Memuat daftar santri…</p>
            <p v-else-if="!candidates.length" class="kg-empty">Tidak ada santri yang bisa ditambahkan.</p>
            <template v-else>
              <button type="button" class="kg-btn kg-btn-sm" @click="pickAll">{{ allPicked ? 'Batalkan semua' : `Pilih semua (${candidates.length})` }}</button>
              <div class="kg-pick">
                <label v-for="s in candidates" :key="s.id" class="kg-check">
                  <input v-model="picked" type="checkbox" :value="s.id" />
                  <span>{{ s.name }} <span class="kg-sub">· {{ levelName(normLevel(s.currentClassId)) }}</span></span>
                </label>
              </div>
            </template>
            <p v-if="addError" class="kg-note is-danger" role="alert">{{ addError }}</p>
          </div>
          <footer class="kg-sheet-foot">
            <button type="button" class="kg-btn" @click="addOpen = false">Batal</button>
            <button type="button" class="kg-btn kg-btn-primary" :disabled="busy || !picked.length" @click="addPicked">
              {{ busy ? 'Menambahkan…' : `Tambahkan${picked.length ? ` (${picked.length})` : ''}` }}
            </button>
          </footer>
        </section>
      </div>
    </Teleport>

    <KegiatanForm v-if="form" :activity="a" :books="books" :busy="busy" :error="formError" :errors="formErrors" @close="form = false" @save="saveActivity" />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import KegiatanForm from '@/components/KegiatanForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useDialog } from '@/composables/useDialog'
import { PARTICIPANT_STATUSES, PAYMENT_TONE, STATUS_TONE, dayLabel, formatRupiah, paymentLine, summarize } from '@/utils/kegiatan'
import './kegiatan.css'

const route = useRoute()
const { ask } = useDialog()
const router = useRouter()
const isAdmin = computed(() => useAuthStore().user?.role === 'admin')
const id = route.params.id

const data = ref(null)
const loading = ref(true)
const loadError = ref('')
const busy = ref(false)
const actionError = ref('')
const search = ref('')
const jilidFilter = ref('')
const filter = ref('all')
const open = ref(null)
const manualReason = reactive({})
const form = ref(false)
const books = ref([])
const formError = ref('')
const formErrors = ref({})

const a = computed(() => data.value.activity)
const sum = computed(() => summarize(data.value?.participants || []))
const normLevel = (v) => {
  const s = String(v ?? '').trim().toLowerCase()
  return ['7', '8', '9', 'marhalah'].includes(s) ? '7' : s
}
const levelName = (lv) => (String(lv) === '7' ? 'Marhalah' : lv ? `Jilid ${lv}` : 'Belum ada jilid')
const ALL_JILID = [...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Jilid ${n}` })), { value: '7', label: 'Marhalah' }]

const FILTERS = [
  { value: 'all', label: 'Semua', show: () => true },
  { value: 'unpaid', label: 'Belum lunas', show: () => !!a.value.fee },
  { value: 'incomplete', label: 'Persyaratan belum lengkap', show: () => sum.value.withRequirements },
  { value: 'lulus', label: 'Lulus', show: () => true },
]
const matches = (p, f) => {
  if (f === 'unpaid') return p.status !== 'batal' && ['belum', 'sebagian'].includes(p.payment.state)
  if (f === 'incomplete') return p.status !== 'batal' && p.requirementsTotal > 0 && p.requirementsDone < p.requirementsTotal
  if (f === 'lulus') return p.status === 'lulus'
  return true
}
const presentJilid = computed(() => [...new Set(data.value.participants.map((p) => p.classId))].sort((x, y) => x.localeCompare(y, undefined, { numeric: true })))
const byJilid = computed(() => data.value.participants.filter((p) => !jilidFilter.value || p.classId === jilidFilter.value))
const countFor = (f) => byJilid.value.filter((p) => matches(p, f)).length
const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return byJilid.value.filter((p) => matches(p, filter.value) && (!q || p.name.toLowerCase().includes(q)))
})

async function load(quiet = false) {
  if (!quiet) loading.value = true
  loadError.value = ''
  try {
    const { data: d } = await api.get(`/activities/${id}`, { cache: false })
    data.value = d
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Kegiatan belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

async function act(fn) {
  busy.value = true
  actionError.value = ''
  try {
    await fn()
  } catch (err) {
    actionError.value = err.response?.data?.error || 'Belum tersimpan. Coba lagi.'
    await load(true)
  } finally {
    busy.value = false
  }
}
const patch = (p, body) => api.patch(`/activities/${id}/participants/${p.santriId}`, body)

// each change is shown at once and saved; a failure reloads the true state
const setStatus = (p, value) => act(async () => {
  await patch(p, { status: value })
  p.status = value
  p.statusLabel = PARTICIPANT_STATUSES.find((s) => s.value === value)?.label || p.statusLabel
})
const toggleRequirement = (p, r) => act(async () => {
  const on = !p.checked[r.id]
  await patch(p, { checked: { [r.id]: on } })
  const next = { ...p.checked }
  if (on) next[r.id] = true
  else delete next[r.id]
  p.checked = next
  p.requirementsDone = a.value.requirements.filter((x) => next[x.id]).length
})
const saveNote = (p, value) => {
  if (value.trim() === (p.note || '').trim()) return
  return act(async () => {
    await patch(p, { note: value })
    p.note = value.trim()
  })
}
const markManual = (p) => act(async () => {
  await patch(p, { lunasManual: { on: true, note: manualReason[p.santriId] } })
  manualReason[p.santriId] = ''
  await load(true)
})
const clearManual = (p) => act(async () => {
  await patch(p, { lunasManual: { on: false } })
  await load(true)
})
const removeParticipant = async (p) => {
  const ok = await ask({
    title: 'Keluarkan dari kegiatan?',
    message: `${p.name} dikeluarkan dari ${a.value.title}. Centang persyaratan dan catatannya ikut terhapus.`,
    tone: 'danger',
    confirmText: 'Keluarkan',
  })
  if (!ok) return
  return act(async () => {
    await api.delete(`/activities/${id}/participants/${p.santriId}`)
    open.value = null
    await load(true)
  })
}

/* ---- the activity itself */
async function openForm() {
  formError.value = ''
  formErrors.value = {}
  try {
    books.value = (await api.get('/activities/books', { cache: false })).data || []
  } catch {
    books.value = []
  }
  form.value = true
}
async function saveActivity(payload) {
  busy.value = true
  formError.value = ''
  formErrors.value = {}
  try {
    await api.put(`/activities/${id}`, payload)
    form.value = false
    await load(true)
  } catch (err) {
    formErrors.value = err.response?.data?.fields || {}
    formError.value = err.response?.data?.error || 'Belum tersimpan.'
  } finally {
    busy.value = false
  }
}
const toggleClosed = () => act(async () => {
  const x = a.value
  await api.put(`/activities/${id}`, { ...x, status: x.status === 'open' ? 'closed' : 'open' })
  await load(true)
})
const removeActivity = async () => {
  const ok = await ask({
    title: 'Hapus kegiatan?',
    message: `"${a.value.title}" beserta ${data.value.participants.length} pesertanya akan dihapus dan tidak bisa dikembalikan. Untuk menyimpan riwayatnya, pilih "Tutup kegiatan".`,
    tone: 'danger',
    confirmText: 'Hapus kegiatan',
  })
  if (!ok) return
  return act(async () => {
    await api.delete(`/activities/${id}`)
    router.push('/dashboard/kegiatan')
  })
}

/* ---- adding participants: the santri of the jilid this person manages, who are not in yet */
const addOpen = ref(false)
const santriAll = ref([])
const pickLoading = ref(false)
const pickSearch = ref('')
const pickJilid = ref('')
const picked = ref([])
const addError = ref('')
const jilidOptions = computed(() => {
  const lim = data.value?.limitedToJilid
  return lim ? ALL_JILID.filter((o) => lim.includes(o.value)) : ALL_JILID
})
const candidates = computed(() => {
  const taken = new Set(data.value.participants.map((p) => p.santriId))
  const lim = data.value.limitedToJilid
  const q = pickSearch.value.trim().toLowerCase()
  return santriAll.value
    .filter((s) => ['aktif', '-', ''].includes(String(s.status || 'aktif').toLowerCase()) && !taken.has(s.id))
    .filter((s) => !lim || lim.includes(normLevel(s.currentClassId)))
    .filter((s) => !pickJilid.value || normLevel(s.currentClassId) === pickJilid.value)
    .filter((s) => !q || String(s.name || '').toLowerCase().includes(q))
})
const allPicked = computed(() => candidates.value.length > 0 && candidates.value.every((s) => picked.value.includes(s.id)))
const pickAll = () => {
  picked.value = allPicked.value ? picked.value.filter((x) => !candidates.value.some((s) => s.id === x)) : [...new Set([...picked.value, ...candidates.value.map((s) => s.id)])]
}
async function openAdd() {
  addOpen.value = true
  addError.value = ''
  picked.value = []
  pickSearch.value = ''
  pickJilid.value = ''
  if (santriAll.value.length) return
  pickLoading.value = true
  try {
    santriAll.value = (await api.get('/santri', { cache: false })).data || []
  } catch (err) {
    addError.value = err.response?.data?.error || 'Daftar santri belum bisa dimuat.'
  } finally {
    pickLoading.value = false
  }
}
async function addPicked() {
  busy.value = true
  addError.value = ''
  try {
    await api.post(`/activities/${id}/participants`, { santriIds: picked.value })
    addOpen.value = false
    await load(true)
  } catch (err) {
    addError.value = err.response?.data?.error || 'Belum bisa menambahkan.'
  } finally {
    busy.value = false
  }
}

onMounted(() => load())
</script>
