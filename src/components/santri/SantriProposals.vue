<template>
  <div class="sp">
    <!-- the guru: propose a new child; what they proposed and the answer -->
    <section v-if="!adminMode" class="sp-card" aria-labelledby="sp-mine-title">
      <div class="sp-head">
        <div>
          <h2 id="sp-mine-title">Ada santri baru?</h2>
          <p class="sp-lead">Usulkan ke admin. Setelah disetujui, santri masuk daftar lengkap dengan nomor induk.</p>
        </div>
        <button type="button" class="sp-btn sp-btn-primary" @click="openPropose">+ Usulkan santri baru</button>
      </div>
      <ul v-if="mine.length" class="sp-list" aria-label="Usulan Antum">
        <li v-for="p in mine" :key="p.id" class="sp-item">
          <div class="sp-item-main">
            <strong>{{ p.status === 'approved' && p.finalName ? p.finalName : p.name }}</strong>
            <span class="sp-meta">{{ levelName(p.status === 'approved' ? p.finalClassId : p.classId) }} · {{ when(p.createdAt) }}</span>
            <span v-if="p.status === 'rejected' && p.reason" class="sp-reason">Alasan: {{ p.reason }}</span>
          </div>
          <span class="sp-pill" :class="`is-${p.status}`">{{ STATUS[p.status] || p.status }}</span>
          <button v-if="p.status === 'pending'" type="button" class="sp-link" :disabled="busy" @click="cancel(p)">Batalkan</button>
        </li>
      </ul>
    </section>

    <!-- who decides (admin, or a guru with "Pendaftaran santri"): what waits -->
    <section v-if="canDecide && pending.length" class="sp-card is-waiting" aria-labelledby="sp-wait-title">
      <h2 id="sp-wait-title">Usulan santri baru dari guru <span class="sp-count">{{ pending.length }}</span></h2>
      <ul class="sp-list">
        <li v-for="p in pending" :key="p.id" class="sp-item">
          <div class="sp-item-main">
            <strong>{{ p.name }}</strong>
            <span class="sp-meta">{{ levelName(p.classId) }} · dari {{ p.proposedByName }} · {{ when(p.createdAt) }}</span>
            <span v-if="p.note" class="sp-note">"{{ p.note }}"</span>
          </div>
          <div class="sp-actions">
            <button type="button" class="sp-btn sp-btn-ghost is-danger" :disabled="busy" @click="reject(p)">Tolak</button>
            <button type="button" class="sp-btn sp-btn-primary" :disabled="busy" @click="openAccept(p)">Terima</button>
          </div>
        </li>
      </ul>
    </section>

    <!-- one sheet: propose (guru) or accept (who decides), from the bottom on phones -->
    <Teleport to="body">
      <div v-if="sheet" class="sp-overlay" @click.self="closeSheet" @keydown.esc="closeSheet">
        <form class="sp-sheet" role="dialog" aria-modal="true" aria-labelledby="sp-sheet-title" novalidate @submit.prevent="submitSheet">
          <span class="sp-grab" aria-hidden="true"></span>
          <h3 id="sp-sheet-title" class="sp-title">{{ sheet.mode === 'accept' ? 'Terima usulan santri' : 'Usulkan santri baru' }}</h3>
          <p class="sp-sub">
            <template v-if="sheet.mode === 'accept'">Dari {{ sheet.proposal.proposedByName }}. Periksa ejaan nama dan jilidnya.</template>
            <template v-else>Admin yang menyetujui. Antum dikabari lewat WhatsApp.</template>
          </p>

          <label for="sp-name" class="sp-label">Nama lengkap santri</label>
          <input id="sp-name" ref="nameInput" v-model="form.name" class="sp-input" type="text" maxlength="80" autocomplete="off"
            autocapitalize="words" spellcheck="false" placeholder="Contoh: Muhammad Rizky Ramadhan" :aria-invalid="!!exactMatch" @input="checkSimilar" />
          <!-- names that look alike, before anything is sent -->
          <div v-if="similarItems.length" class="sp-similar" :class="{ 'is-block': !!exactMatch }" role="status">
            <strong>{{ exactMatch ? 'Nama ini sudah ada:' : 'Nama mirip yang sudah ada, pastikan bukan anak yang sama:' }}</strong>
            <ul>
              <li v-for="x in shownSimilar" :key="`${x.kind}-${x.name}`">
                {{ x.name }} · {{ levelName(x.classId) }}<template v-if="x.kind === 'usulan'"> · diusulkan {{ x.by }}</template><template v-else-if="x.status && x.status !== 'aktif'"> · {{ x.status }}</template>
              </li>
            </ul>
          </div>

          <label for="sp-level" class="sp-label sp-gap">Jilid / Marhalah</label>
          <select id="sp-level" v-model="form.classId" class="sp-input">
            <option value="">Belum tahu (admin yang menentukan)</option>
            <option v-for="id in LEVELS" :key="id" :value="id">{{ levelName(id) }}</option>
          </select>

          <template v-if="sheet.mode === 'propose'">
            <label for="sp-note" class="sp-label sp-gap">Catatan untuk admin <span class="sp-optional">(boleh kosong)</span></label>
            <textarea id="sp-note" v-model="form.note" class="sp-input sp-textarea" rows="2" maxlength="300"
              placeholder="Contoh: pindahan dari TPQ lain, mulai ikut Senin"></textarea>
          </template>

          <p v-if="sheetError" class="sp-error" role="alert">{{ sheetError }}</p>
          <div class="sp-sheet-actions">
            <button type="button" class="sp-btn sp-btn-ghost" @click="closeSheet">Batal</button>
            <button type="submit" class="sp-btn sp-btn-primary" :disabled="busy || form.name.trim().length < 3 || (sheet.mode === 'propose' && !!exactMatch)">
              {{ busy ? 'Menyimpan…' : sheet.mode === 'accept' ? 'Terima & tambahkan' : 'Kirim usulan' }}
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'

const props = defineProps({
  adminMode: { type: Boolean, default: false },
  // the jilid the guru teaches: the default for a new proposal
  defaultClassId: { type: String, default: '' },
})
const emit = defineEmits(['changed'])
const { success, error: showError } = useToast()
const { ask } = useDialog()

const LEVELS = ['1', '2', '3', '4', '5', '6', '7']
const STATUS = { pending: 'Menunggu admin', approved: 'Diterima', rejected: 'Ditolak' }
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Jilid belum ditentukan')
const when = (v) => {
  const d = v?._seconds ? new Date(v._seconds * 1000) : v ? new Date(v) : null
  if (!d || Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' })
}

const mine = ref([])
const pending = ref([])
const canDecide = ref(false)
const busy = ref(false)

async function load() {
  try {
    const { data } = await api.get('/santri-changes/proposals', { cache: false })
    mine.value = data.mine || []
    pending.value = data.pending || []
    canDecide.value = !!data.canDecide
  } catch {
    /* the card simply shows nothing new; the rest of the page works */
  }
}

/* ---- the sheet */
const sheet = ref(null) // { mode: 'propose' | 'accept', proposal? }
const form = ref({ name: '', classId: '', note: '' })
const sheetError = ref('')
const nameInput = ref(null)
const similarItems = ref([])
const exactMatch = computed(() => similarItems.value.find((x) => x.same) || null)
// the same name: only that one (the merely alike would blur it); otherwise every name that looks alike
const shownSimilar = computed(() => (exactMatch.value ? similarItems.value.filter((x) => x.same) : similarItems.value))
let similarTimer = null
let similarSeq = 0

function openSheet(mode, proposal = null) {
  sheetError.value = ''
  similarItems.value = []
  form.value = proposal
    ? { name: proposal.name, classId: proposal.classId || '', note: '' }
    : { name: '', classId: props.defaultClassId || '', note: '' }
  sheet.value = { mode, proposal }
  nextTick(() => nameInput.value?.focus())
  if (proposal) checkSimilar()
}
const openPropose = () => openSheet('propose')
const openAccept = (p) => openSheet('accept', p)
function closeSheet() {
  if (busy.value) return
  sheet.value = null
}

// after a pause in typing, the names that look alike
function checkSimilar() {
  clearTimeout(similarTimer)
  const name = form.value.name.trim()
  if (name.length < 3) {
    similarItems.value = []
    return
  }
  similarTimer = setTimeout(async () => {
    const mineSeq = ++similarSeq
    try {
      const { data } = await api.get('/santri-changes/proposals/similar', { params: { name }, cache: false })
      if (mineSeq !== similarSeq || !sheet.value) return
      // accepting: the proposal itself is not "a name that already exists"
      const own = sheet.value.proposal
      similarItems.value = (data.items || []).filter((x) => !(own && x.kind === 'usulan' && x.name === own.name))
    } catch {
      if (mineSeq === similarSeq) similarItems.value = []
    }
  }, 400)
}

async function submitSheet() {
  if (busy.value || !sheet.value) return
  busy.value = true
  sheetError.value = ''
  try {
    if (sheet.value.mode === 'propose') {
      await api.post('/santri-changes/proposals', { name: form.value.name, classId: form.value.classId, note: form.value.note })
      success(`Usulan ${form.value.name.trim()} terkirim ke admin`)
    } else {
      const { data } = await api.post(`/santri-changes/proposals/${sheet.value.proposal.id}/decide`, { approve: true, name: form.value.name, classId: form.value.classId })
      success(`${data.santri.name} ditambahkan${data.santri.nomorInduk ? `, nomor induk ${data.santri.nomorInduk}` : ''}`)
      emit('changed')
    }
    busy.value = false
    sheet.value = null
    await load()
  } catch (err) {
    sheetError.value = err.response?.data?.error || 'Belum berhasil. Coba lagi.'
  } finally {
    busy.value = false
  }
}

async function reject(p) {
  const reason = await ask({
    title: `Tolak usulan ${p.name}?`,
    message: `Usulan dari ${p.proposedByName}. Alasannya dikirim ke WhatsApp guru tersebut.`,
    tone: 'danger',
    confirmText: 'Tolak usulan',
    cancelText: 'Kembali',
    input: { label: 'Alasan', value: '', placeholder: 'Contoh: sudah terdaftar dengan nama lain', required: true, maxlength: 300, multiline: true },
  })
  if (reason === null) return
  busy.value = true
  try {
    await api.post(`/santri-changes/proposals/${p.id}/decide`, { approve: false, reason })
    success('Usulan ditolak, guru dikabari lewat WA')
    await load()
  } catch (err) {
    showError(err.response?.data?.error || 'Belum berhasil. Coba lagi.')
    await load()
  } finally {
    busy.value = false
  }
}

async function cancel(p) {
  const ok = await ask({ title: `Batalkan usulan ${p.name}?`, message: 'Usulan ditarik dan tidak diproses admin.', tone: 'danger', confirmText: 'Batalkan usulan', cancelText: 'Kembali' })
  if (!ok) return
  busy.value = true
  try {
    await api.delete(`/santri-changes/proposals/${p.id}`)
    success('Usulan dibatalkan')
  } catch (err) {
    showError(err.response?.data?.error || 'Belum berhasil. Coba lagi.')
  } finally {
    busy.value = false
    await load()
  }
}

onMounted(load)
onBeforeUnmount(() => clearTimeout(similarTimer))
defineExpose({ reload: load })
</script>

<style scoped>
.sp {
  display: grid;
  gap: 14px;
  margin-bottom: 14px;
}

.sp:empty {
  display: none;
}

.sp-card {
  padding: 16px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
  color: #0b3b2a;
}

.sp-card.is-waiting {
  border-color: #f3d58b;
  background: #fffbeb;
}

.sp-card h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
}

.sp-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sp-lead {
  margin: 4px 0 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #475a50;
}

.sp-count {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  background: #b45309;
  color: #fff;
  font-size: 0.8rem;
  vertical-align: 2px;
}

.sp-list {
  display: grid;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.sp-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.sp-item-main {
  display: grid;
  gap: 2px;
  flex: 1 1 200px;
  min-width: 0;
}

.sp-item-main strong {
  overflow-wrap: anywhere;
}

.sp-meta,
.sp-note,
.sp-reason {
  font-size: 0.82rem;
  color: #5b6b62;
  overflow-wrap: anywhere;
}

.sp-note {
  font-style: italic;
}

.sp-reason {
  color: #8e1b12;
}

.sp-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.sp-pill.is-pending { background: #fff4d6; color: #7a4b00; }
.sp-pill.is-approved { background: #e3f1ea; color: #0a5c40; }
.sp-pill.is-rejected { background: #fdecea; color: #8e1b12; }

.sp-actions {
  display: flex;
  gap: 8px;
}

.sp-btn {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1.5px solid transparent;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.sp-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.sp-btn-primary {
  background: #0a5c40;
  color: #fff;
}

.sp-btn-ghost {
  background: #fff;
  border-color: rgba(11, 59, 42, 0.22);
  color: #0b3b2a;
}

.sp-btn-ghost.is-danger {
  color: #b42318;
  border-color: rgba(180, 35, 24, 0.3);
}

.sp-link {
  min-height: 40px;
  padding: 0 6px;
  border: 0;
  background: none;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  color: #b42318;
  text-decoration: underline;
  cursor: pointer;
}

.sp-btn:focus-visible,
.sp-link:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .sp-head .sp-btn {
    width: 100%;
  }
  .sp-actions {
    width: 100%;
  }
  .sp-actions .sp-btn {
    flex: 1 1 0;
  }
}

/* the sheet (layers: like the other sheets, 9990; the app's confirmation goes above it) */
.sp-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.5);
}

.sp-sheet {
  width: 100%;
  max-width: 460px;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 22px 20px 20px;
  border-radius: 20px;
  background: #fff;
  color: #0b3b2a;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
}

.sp-grab {
  display: none;
}

.sp-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
}

.sp-sub {
  margin: 4px 0 16px;
  font-size: 0.86rem;
  line-height: 1.5;
  color: #5b6b62;
}

.sp-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.86rem;
  font-weight: 700;
  color: #1f3a2f;
}

.sp-gap {
  margin-top: 14px;
}

.sp-optional {
  font-weight: 500;
  color: #5b6b62;
}

.sp-input {
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.25);
  background: #fff;
  font: inherit;
  font-size: 16px; /* no zoom on iPhone */
  color: #0b3b2a;
  box-sizing: border-box;
}

.sp-textarea {
  min-height: 72px;
  padding: 10px 14px;
  line-height: 1.5;
  resize: vertical;
}

.sp-input:focus {
  outline: none;
  border-color: #0a5c40;
  box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.15);
}

.sp-input[aria-invalid="true"] {
  border-color: #b42318;
}

.sp-similar {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fffbeb;
  border: 1px solid #f3d58b;
  font-size: 0.84rem;
  line-height: 1.5;
  color: #5b3a06;
}

.sp-similar.is-block {
  background: #fdecea;
  border-color: #f4b4ad;
  color: #7a1810;
}

.sp-similar ul {
  margin: 4px 0 0;
  padding-left: 18px;
}

.sp-error {
  margin: 12px 0 0;
  font-size: 0.86rem;
  font-weight: 600;
  color: #b42318;
}

.sp-sheet-actions {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 8px;
  margin-top: 18px;
}

@media (max-width: 600px) {
  .sp-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .sp-sheet {
    max-width: none;
    border-radius: 22px 22px 0 0;
    padding: 10px 18px calc(18px + env(safe-area-inset-bottom));
  }
  .sp-grab {
    display: block;
    width: 40px;
    height: 4px;
    margin: 0 auto 14px;
    border-radius: 999px;
    background: #d6dcd9;
  }
}
</style>
