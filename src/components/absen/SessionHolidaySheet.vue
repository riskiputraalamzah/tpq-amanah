<template>
  <!-- Liburkan Sesi (Admin): emergency per-session holiday (Sore / Malam / Sehari Penuh) -->
  <Teleport to="body">
    <div v-if="open" class="sh-overlay" @click.self="emit('close')" @keydown.esc="emit('close')">
      <section class="sh" role="dialog" aria-modal="true" aria-labelledby="sh-title">
        <header class="sh-head">
          <div>
            <h2 id="sh-title">Liburkan Sesi</h2>
            <p class="sh-sub">Khusus kondisi darurat (hujan deras, listrik padam, dll.)</p>
          </div>
          <button type="button" class="sh-x" aria-label="Tutup" @click="emit('close')">✕</button>
        </header>

        <p class="sh-lead">
          Meliburkan satu sesi (misal <strong>Sesi Malam saja</strong> saat Sesi Sore sudah berjalan).
          Absen santri sesi tersebut dikosongkan (tidak dicatat alfa) dan guru sesi yang dicentang otomatis
          mendapat dispensasi <strong>Hadir + Non-KBM</strong> agar insentif tetap utuh.
        </p>

        <p v-if="loadError" class="sh-error" role="alert">{{ loadError }}</p>

        <!-- Active / recent session holidays -->
        <div v-if="holidays.length" class="sh-active">
          <h3>Sesi yang diliburkan</h3>
          <ul>
            <li v-for="h in holidays" :key="h.id">
              <div class="sh-active-info">
                <strong>{{ dayText(h.date) }} · {{ h.slotLabel }}</strong>
                <span class="sh-meta">{{ h.reason }}</span>
                <span class="sh-meta">
                  {{ h.affectedGurus?.length || 0 }} guru dispensasi
                  <template v-if="h.clearedAlfaCount"> · {{ h.clearedAlfaCount }} alfa dibersihkan</template>
                </span>
              </div>
              <button
                type="button"
                class="sh-cancel-btn"
                :disabled="busy"
                @click="cancelHoliday(h)"
              >
                Batalkan
              </button>
            </li>
          </ul>
        </div>

        <form class="sh-form" @submit.prevent="submit">
          <h3>Tetapkan libur sesi baru</h3>

          <label class="sh-field">
            <span>Tanggal</span>
            <input
              v-model="date"
              type="date"
              class="sh-input"
              required
              @change="loadPreview"
            />
          </label>

          <div class="sh-field">
            <span id="sh-slot-label">Sesi yang diliburkan</span>
            <div class="sh-chips" role="radiogroup" aria-labelledby="sh-slot-label">
              <button
                v-for="opt in SLOT_OPTIONS"
                :key="opt.id"
                type="button"
                role="radio"
                class="sh-chip"
                :aria-checked="slotMode === opt.id"
                @click="setSlotMode(opt.id)"
              >
                {{ opt.label }}
              </button>
            </div>
            <p v-if="alreadyMarkedMessage" class="sh-warn-inline" role="status">
              {{ alreadyMarkedMessage }}
            </p>
          </div>

          <div class="sh-field">
            <label for="sh-reason">Alasan libur sesi</label>
            <div class="sh-quick-reasons">
              <button
                v-for="r in QUICK_REASONS"
                :key="r"
                type="button"
                class="sh-quick-pill"
                :class="{ active: reason === r }"
                @click="reason = r"
              >
                {{ r }}
              </button>
            </div>
            <input
              id="sh-reason"
              v-model="reason"
              type="text"
              class="sh-input"
              maxlength="160"
              placeholder="Contoh: Hujan deras & banjir sekitar TPQ"
              required
            />
          </div>

          <div class="sh-disp-box">
            <label class="sh-toggle">
              <input v-model="grantDispensation" type="checkbox" />
              <span>
                <strong>Berikan dispensasi Hadir + Non-KBM untuk guru sesi ini</strong>
                <small>
                  Guru yang belum absen dicatat Hadir (Dispensasi) + Non-KBM sehingga insentif tidak terpotong &amp; Monitor KBM langsung hijau.
                </small>
              </span>
            </label>

            <div v-if="grantDispensation" class="sh-guru-picker">
              <div class="sh-guru-head">
                <span class="sh-guru-title">
                  Guru penerima dispensasi ({{ selectedGuruIds.length }} dipilih)
                </span>
                <button
                  v-if="otherGurusCount > 0"
                  type="button"
                  class="sh-link-btn"
                  @click="showAllGurus = !showAllGurus"
                >
                  {{ showAllGurus ? 'Hanya guru sesi ini' : `Tampilkan semua guru (+${otherGurusCount})` }}
                </button>
              </div>

              <p v-if="loadingPreview" class="sh-help">Memuat daftar guru…</p>
              <p v-else-if="!visibleGurus.length" class="sh-help">
                Tidak ada guru terdeteksi di sesi ini. Klik "Tampilkan semua guru" untuk memilih manual.
              </p>

              <ul v-else class="sh-guru-list">
                <li v-for="g in visibleGurus" :key="g.guruId">
                  <label class="sh-guru-row" :class="{ 'is-checked': isGuruSelected(g.guruId) }">
                    <input
                      type="checkbox"
                      :checked="isGuruSelected(g.guruId)"
                      @change="toggleGuru(g.guruId)"
                    />
                    <span class="sh-guru-main">
                      <span class="sh-guru-name">{{ g.name }}</span>
                      <span class="sh-guru-tags">
                        <span v-if="g.scheduledSlot" class="sh-tag">
                          {{ g.scheduledSlot === 'wave_2' ? 'Jadwal Malam' : 'Jadwal Sore' }}
                        </span>
                        <span class="sh-tag" :class="statusTagClass(g.currentStatus)">
                          {{ statusText(g.currentStatus) }}
                        </span>
                      </span>
                    </span>
                  </label>
                </li>
              </ul>
            </div>
          </div>

          <p v-if="error" class="sh-error" role="alert">{{ error }}</p>

          <button
            type="submit"
            class="sh-save"
            :disabled="busy || !ready"
          >
            {{ busy ? 'Menyimpan…' : submitLabel }}
          </button>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  open: { type: Boolean, default: false },
  defaultDate: { type: String, default: '' },
  defaultSlot: { type: String, default: 'wave_2' },
})

const emit = defineEmits(['close', 'changed'])
const { ask } = useDialog()
const { success } = useToast()

const SLOT_OPTIONS = [
  { id: 'wave_1', label: 'Sesi Sore' },
  { id: 'wave_2', label: 'Sesi Malam' },
  { id: 'both', label: 'Sehari Penuh' },
]

const QUICK_REASONS = [
  'Hujan deras',
  'Listrik padam',
  'Cuaca ekstrem / banjir',
  'Kegiatan mendadak TPQ',
]

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const dayText = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
const wibToday = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)

const date = ref(wibToday())
const slotMode = ref('wave_2')
const reason = ref('')
const grantDispensation = ref(true)
const showAllGurus = ref(false)
const holidays = ref([])
const previewGurus = ref([])
const existingForSelection = ref([])
const selectedGuruIds = ref([])
const loadingPreview = ref(false)
const loadError = ref('')
const error = ref('')
const busy = ref(false)

const isGuruSelected = (id) => selectedGuruIds.value.includes(id)
function toggleGuru(id) {
  if (isGuruSelected(id)) {
    selectedGuruIds.value = selectedGuruIds.value.filter((x) => x !== id)
  } else {
    selectedGuruIds.value = [...selectedGuruIds.value, id]
  }
}

const visibleGurus = computed(() => {
  if (showAllGurus.value) return previewGurus.value
  return previewGurus.value.filter((g) => g.belongsToSlot || isGuruSelected(g.guruId))
})

const otherGurusCount = computed(() => {
  const shown = new Set(previewGurus.value.filter((g) => g.belongsToSlot || isGuruSelected(g.guruId)).map((g) => g.guruId))
  return previewGurus.value.filter((g) => !shown.has(g.guruId)).length
})

const alreadyMarkedMessage = computed(() => {
  if (!existingForSelection.value.length) return ''
  const labels = existingForSelection.value.map((x) => x.slotLabel).join(' & ')
  return `${labels} pada tanggal ini sudah ditandai libur. Batalkan dulu di daftar atas jika ingin mengubah.`
})

const ready = computed(() => (
  /^\d{4}-\d{2}-\d{2}$/.test(date.value)
  && reason.value.trim().length >= 3
  && existingForSelection.value.length === 0
))

const submitLabel = computed(() => {
  if (slotMode.value === 'both') return 'Liburkan Sesi Sore & Malam'
  return slotMode.value === 'wave_2' ? 'Liburkan Sesi Malam' : 'Liburkan Sesi Sore'
})

function statusText(st) {
  if (!st) return 'Belum absen'
  const s = String(st).toLowerCase()
  if (s === 'hadir') return 'Sudah Hadir'
  if (s === 'izin') return 'Izin'
  if (s === 'sakit') return 'Sakit'
  return 'Tidak hadir'
}

function statusTagClass(st) {
  if (!st) return 'is-muted'
  const s = String(st).toLowerCase()
  if (s === 'hadir') return 'is-hadir'
  return 'is-warn'
}

function setSlotMode(id) {
  slotMode.value = id
  loadPreview()
}

async function loadList() {
  try {
    const { data } = await api.get('/santri-presence/session-holidays', { params: { days: 45 }, cache: false })
    holidays.value = data.items || []
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Daftar libur sesi belum bisa dimuat.'
  }
}

let previewSeq = 0
async function loadPreview() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.value)) return
  const mine = ++previewSeq
  loadingPreview.value = true
  error.value = ''
  try {
    const slotsToFetch = slotMode.value === 'both' ? ['wave_1', 'wave_2'] : [slotMode.value]
    const responses = await Promise.all(
      slotsToFetch.map((sl) => api.get('/santri-presence/session-holidays/preview', { params: { date: date.value, slot: sl }, cache: false })),
    )
    if (mine !== previewSeq) return

    const existing = responses.map((r) => r.data?.existing).filter(Boolean)
    existingForSelection.value = existing

    const byId = new Map()
    for (const r of responses) {
      for (const g of r.data?.gurus || []) {
        const prev = byId.get(g.guruId)
        if (!prev) {
          byId.set(g.guruId, { ...g })
        } else {
          byId.set(g.guruId, {
            ...prev,
            belongsToSlot: prev.belongsToSlot || g.belongsToSlot,
            selected: prev.selected || g.selected,
          })
        }
      }
    }
    const merged = [...byId.values()].sort(
      (a, b) => Number(b.belongsToSlot) - Number(a.belongsToSlot) || a.name.localeCompare(b.name, 'id'),
    )
    previewGurus.value = merged
    selectedGuruIds.value = merged.filter((g) => g.selected).map((g) => g.guruId)
  } catch (err) {
    if (mine === previewSeq) {
      loadError.value = err.response?.data?.error || 'Daftar guru sesi belum bisa dimuat.'
    }
  } finally {
    if (mine === previewSeq) loadingPreview.value = false
  }
}

async function submit() {
  if (!ready.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await api.post('/santri-presence/session-holidays', {
      date: date.value,
      slot: slotMode.value,
      reason: reason.value.trim(),
      grantDispensation: grantDispensation.value,
      guruIds: grantDispensation.value ? [...selectedGuruIds.value] : [],
    })
    success('Libur sesi berhasil ditetapkan.')
    reason.value = ''
    await Promise.all([loadList(), loadPreview()])
    emit('changed', { date: date.value, slot: slotMode.value })
  } catch (err) {
    error.value = err.response?.data?.error || 'Gagal menetapkan libur sesi.'
  } finally {
    busy.value = false
  }
}

async function cancelHoliday(h) {
  const ok = await ask({
    title: `Batalkan libur ${h.slotLabel}?`,
    message: `Libur ${h.slotLabel} tanggal ${dayText(h.date)} (${h.reason}) akan dihapus beserta dispensasi hadir & Non-KBM otomatis untuk guru sesi ini.`,
    confirmText: 'Ya, batalkan',
    cancelText: 'Tutup',
    tone: 'danger',
  })
  if (!ok) return
  busy.value = true
  error.value = ''
  try {
    await api.delete(`/santri-presence/session-holidays/${encodeURIComponent(h.id)}`)
    success(`Libur ${h.slotLabel} dibatalkan.`)
    await Promise.all([loadList(), loadPreview()])
    emit('changed', { date: h.date, slot: h.slot })
  } catch (err) {
    error.value = err.response?.data?.error || 'Gagal membatalkan libur sesi.'
  } finally {
    busy.value = false
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    loadError.value = ''
    error.value = ''
    showAllGurus.value = false
    date.value = props.defaultDate || wibToday()
    slotMode.value = props.defaultSlot || 'wave_2'
    loadList()
    loadPreview()
  },
  { immediate: true },
)
</script>

<style scoped>
.sh-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 25, 17, 0.45);
}
@media (min-width: 768px) {
  .sh-overlay { align-items: center; padding: 16px; }
}
.sh {
  width: 100%;
  max-width: 580px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 18px 16px calc(20px + env(safe-area-inset-bottom));
  border-radius: 20px 20px 0 0;
  background: #fff;
  color: #0b3b2a;
  box-sizing: border-box;
}
@media (min-width: 768px) {
  .sh { border-radius: 20px; padding: 22px; }
}
.sh-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.sh-head h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
}
.sh-sub {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #5b6b62;
}
.sh-x {
  flex: none;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.sh-lead {
  margin: 10px 0 14px;
  font-size: 0.86rem;
  line-height: 1.5;
  color: #475a50;
}
.sh h3 {
  margin: 0 0 8px;
  font-size: 0.94rem;
  font-weight: 800;
}
.sh-active {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 14px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
}
.sh-active ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.sh-active li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.sh-active-info {
  min-width: 0;
  flex: 1 1 200px;
}
.sh-meta {
  display: block;
  font-size: 0.79rem;
  color: #475569;
  line-height: 1.4;
}
.sh-cancel-btn {
  flex: none;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(180, 35, 24, 0.35);
  background: #fff;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  color: #b42318;
  cursor: pointer;
}
.sh-form {
  display: grid;
  gap: 12px;
}
.sh-field {
  display: grid;
  gap: 6px;
  font-size: 0.86rem;
  font-weight: 700;
}
.sh-input {
  width: 100%;
  min-height: 46px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  font-weight: 500;
  color: #0b3b2a;
  box-sizing: border-box;
}
.sh-chips {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.sh-chip {
  min-height: 44px;
  padding: 6px 8px;
  border-radius: 12px;
  border: 1.5px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  font: inherit;
  font-size: 0.83rem;
  font-weight: 700;
  color: #0b3b2a;
  cursor: pointer;
}
.sh-chip[aria-checked="true"] {
  border-color: #0a5c40;
  background: #e3f1ea;
  color: #0a5c40;
}
.sh-quick-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sh-quick-pill {
  min-height: 36px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.2);
  background: #f8faf9;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  color: #354a3f;
  cursor: pointer;
}
.sh-quick-pill.active {
  border-color: #0a5c40;
  background: #e3f1ea;
  color: #0a5c40;
}
.sh-warn-inline {
  margin: 2px 0 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.4;
}
.sh-disp-box {
  padding: 12px;
  border-radius: 14px;
  background: #f6faf8;
  border: 1px solid rgba(11, 59, 42, 0.14);
  display: grid;
  gap: 10px;
}
.sh-toggle {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 0.84rem;
  line-height: 1.45;
}
.sh-toggle input {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex: none;
  accent-color: #0a5c40;
}
.sh-toggle small {
  display: block;
  margin-top: 2px;
  font-size: 0.77rem;
  font-weight: 500;
  color: #5b6b62;
}
.sh-guru-picker {
  display: grid;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(11, 59, 42, 0.1);
}
.sh-guru-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.sh-guru-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0b3b2a;
}
.sh-link-btn {
  padding: 4px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #0a5c40;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
}
.sh-guru-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
}
.sh-guru-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(11, 59, 42, 0.14);
  background: #fff;
  cursor: pointer;
  box-sizing: border-box;
}
.sh-guru-row.is-checked {
  border-color: rgba(10, 92, 64, 0.45);
  background: #edf7f2;
}
.sh-guru-row input {
  width: 18px;
  height: 18px;
  flex: none;
  accent-color: #0a5c40;
}
.sh-guru-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}
.sh-guru-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}
.sh-guru-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.sh-tag {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  background: rgba(11, 59, 42, 0.08);
  color: #3b4a42;
}
.sh-tag.is-hadir {
  background: #dcfce7;
  color: #166534;
}
.sh-tag.is-warn {
  background: #fef3c7;
  color: #92400e;
}
.sh-tag.is-muted {
  background: #f1f5f9;
  color: #475569;
}
.sh-help {
  margin: 0;
  font-size: 0.78rem;
  color: #5b6b62;
}
.sh-error {
  margin: 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fdecea;
  color: #7a1810;
  font-size: 0.84rem;
  font-weight: 600;
}
.sh-save {
  min-height: 50px;
  border: 0;
  border-radius: 14px;
  background: #0a5c40;
  font: inherit;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
}
.sh-save:disabled {
  background: #dfe6e2;
  color: #6b7a72;
  cursor: not-allowed;
}
.sh-x:focus-visible,
.sh-cancel-btn:focus-visible,
.sh-chip:focus-visible,
.sh-quick-pill:focus-visible,
.sh-input:focus-visible,
.sh-save:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}
</style>
