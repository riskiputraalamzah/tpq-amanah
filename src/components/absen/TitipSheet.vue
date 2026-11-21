<template>
  <!-- Titip santri: a child goes to another sesi / teacher (backend services/santri_titip_service.js) -->
  <Teleport to="body">
    <div v-if="open" class="ts-overlay" @click.self="emit('close')" @keydown.esc="emit('close')">
      <section class="ts" role="dialog" aria-modal="true" aria-labelledby="ts-title">
        <header class="ts-head">
          <h2 id="ts-title">Titip santri</h2>
          <button type="button" class="ts-x" aria-label="Tutup" @click="emit('close')">✕</button>
        </header>
        <p class="ts-lead">
          Santri yang ikut sesi lain (misalnya Jilid 4 tapi datang malam): titipkan ke guru sesi itu. Santri muncul di grup
          "Titipan" pada Absen Santri dan di KBM guru tersebut, dan tidak dihitung belum dicatat di sesi asalnya.
        </p>

        <p v-if="loadError" class="ts-error" role="alert">{{ loadError }}</p>

        <!-- what stands now -->
        <div v-if="active.length" class="ts-active">
          <h3>Titipan yang berjalan</h3>
          <ul>
            <li v-for="t in active" :key="t.id">
              <div>
                <strong>{{ t.santriName }}</strong>
                <span class="ts-meta">{{ levelName(t.classId) }} → sesi {{ slotName(t.slot) }}, {{ t.hostGuruName }} · {{ t.mode === 'tetap' ? 'tetap' : dayText(t.date) }}</span>
              </div>
              <button v-if="canEnd(t)" type="button" class="ts-end" :disabled="busy" @click="end(t)">Akhiri</button>
            </li>
          </ul>
        </div>

        <form class="ts-form" @submit.prevent="save">
          <h3>Titipan baru</h3>
          <label class="ts-field">
            <span>Santri</span>
            <select v-model="form.santriId" class="ts-input" required @change="pickDefaultSlot">
              <option value="" disabled>{{ choosable.length ? 'Pilih santri' : 'Tidak ada santri dari jilid Antum' }}</option>
              <optgroup v-for="g in choosableGroups" :key="g.classId" :label="levelName(g.classId)">
                <option v-for="s in g.items" :key="s.id" :value="s.id">{{ s.name }}</option>
              </optgroup>
            </select>
          </label>

          <div class="ts-field">
            <span id="ts-slot">Ikut sesi</span>
            <div class="ts-chips" role="radiogroup" aria-labelledby="ts-slot">
              <button v-for="s in SLOTS" :key="s.id" type="button" role="radio" class="ts-chip" :aria-checked="form.slot === s.id" @click="form.slot = s.id">{{ s.label }}</button>
            </div>
          </div>

          <label class="ts-field">
            <span>Dititipkan ke</span>
            <select v-model="form.hostGuruId" class="ts-input" required>
              <option value="" disabled>Pilih guru</option>
              <option v-for="h in hosts" :key="h.id" :value="h.id">{{ h.name }}</option>
            </select>
          </label>

          <div class="ts-field">
            <span id="ts-mode">Lamanya</span>
            <div class="ts-chips" role="radiogroup" aria-labelledby="ts-mode">
              <button type="button" role="radio" class="ts-chip" :disabled="todayIsWeekend" :aria-checked="form.mode === 'today'" @click="form.mode = 'today'">Hari ini saja</button>
              <button type="button" role="radio" class="ts-chip" :aria-checked="form.mode === 'date'" @click="form.mode = 'date'">Tanggal lain</button>
              <button type="button" role="radio" class="ts-chip" :aria-checked="form.mode === 'tetap'" @click="form.mode = 'tetap'">Tetap</button>
            </div>
            <input v-if="form.mode === 'date'" v-model="form.date" type="date" class="ts-input" :min="today" :max="maxDay" aria-label="Tanggal titipan" />
            <p v-if="form.mode === 'date' && isWeekendDate(form.date)" class="ts-error" role="alert">
              Pilih hari aktif Senin–Jumat untuk titipan harian.
            </p>
            <p class="ts-help">
              {{ form.mode === 'tetap' ? 'Berlaku mulai hari ini sampai diakhiri.' : todayIsWeekend && form.mode !== 'date' ? 'Hari ini akhir pekan; pilih Tanggal lain (Senin–Jumat) atau Tetap.' : 'Hanya untuk tanggal aktif (Senin–Jumat) itu.' }}
            </p>
          </div>

          <p v-if="error" class="ts-error" role="alert">{{ error }}</p>
          <button type="submit" class="ts-save" :disabled="busy || !ready">{{ busy ? 'Menyimpan…' : 'Titipkan' }}</button>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  open: { type: Boolean, default: false },
  santri: { type: Array, default: () => [] }, // the sheet's active santri [{ id, name, classId }]
})
const emit = defineEmits(['close', 'changed'])
const { ask } = useDialog()
const authStore = useAuthStore()

const SLOTS = [{ id: 'wave_1', label: 'Sore' }, { id: 'wave_2', label: 'Malam' }]
const slotName = (id) => (id === 'wave_2' ? 'Malam' : 'Sore')
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const dayText = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}
const wibDay = (ms = 0) => new Date(Date.now() + ms + 7 * 3600 * 1000).toISOString().slice(0, 10)
const isWeekendDate = (iso) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return false
  const wd = new Date(`${iso}T12:00:00Z`).getUTCDay()
  return wd === 0 || wd === 6
}
const nextWeekday = (iso) => {
  let cur = iso
  for (let i = 0; i < 7; i += 1) {
    if (!isWeekendDate(cur)) return cur
    cur = new Date(new Date(`${cur}T12:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10)
  }
  return iso
}
const today = wibDay()
const todayIsWeekend = isWeekendDate(today)
const defaultDay = nextWeekday(today)
const maxDay = wibDay(14 * 86400000)

const active = ref([])
const hosts = ref([])
const classIds = ref([]) // null: every jilid
const loadError = ref('')
const error = ref('')
const busy = ref(false)
const form = ref({ santriId: '', slot: 'wave_2', hostGuruId: '', mode: todayIsWeekend ? 'date' : 'today', date: defaultDay })

const choosable = computed(() => props.santri.filter((s) => classIds.value === null || classIds.value.includes(String(s.classId))))
const choosableGroups = computed(() => {
  const map = new Map()
  for (const s of choosable.value) {
    if (!map.has(s.classId)) map.set(s.classId, [])
    map.get(s.classId).push(s)
  }
  return [...map.entries()].map(([classId, items]) => ({ classId, items }))
})
const ready = computed(() => {
  if (!form.value.santriId || !form.value.hostGuruId || !form.value.slot) return false
  if (form.value.mode === 'today') return !todayIsWeekend
  if (form.value.mode === 'date') return !!form.value.date && !isWeekendDate(form.value.date)
  return true
})
const me = computed(() => authStore.user?.id || authStore.user?.uid || '')
const canEnd = (t) => classIds.value === null || classIds.value.includes(String(t.classId)) || t.hostGuruId === me.value

// the other sesi than the jilid's own (sore 1-4, malam 5-Marhalah)
function pickDefaultSlot() {
  const s = props.santri.find((x) => x.id === form.value.santriId)
  if (!s) return
  form.value.slot = Number(s.classId) >= 5 ? 'wave_1' : 'wave_2'
}

async function load() {
  loadError.value = ''
  try {
    const { data } = await api.get('/santri-titip', { cache: false })
    active.value = data.titip || []
    hosts.value = data.hosts || []
    classIds.value = data.classIds === null ? null : data.classIds || []
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Daftar titipan belum bisa dimuat.'
  }
}

async function save() {
  if (!ready.value) return
  busy.value = true
  error.value = ''
  try {
    const f = form.value
    await api.post('/santri-titip', {
      santriId: f.santriId,
      slot: f.slot,
      hostGuruId: f.hostGuruId,
      mode: f.mode === 'tetap' ? 'tetap' : 'hari',
      date: f.mode === 'date' ? f.date : today,
    })
    form.value = { santriId: '', slot: 'wave_2', hostGuruId: '', mode: todayIsWeekend ? 'date' : 'today', date: defaultDay }
    await load()
    emit('changed')
  } catch (err) {
    error.value = err.response?.data?.error || 'Titipan belum tersimpan. Coba lagi.'
  } finally {
    busy.value = false
  }
}

async function end(t) {
  const ok = await ask({
    title: `Akhiri titipan ${t.santriName}?`,
    message: `${t.santriName} kembali ke sesi jilidnya mulai sekarang. ${t.hostGuruName} dan guru jilidnya diberi kabar lewat WhatsApp.`,
    confirmText: 'Akhiri',
    tone: 'danger',
  })
  if (!ok) return
  busy.value = true
  error.value = ''
  try {
    await api.delete(`/santri-titip/${encodeURIComponent(t.id)}`)
    await load()
    emit('changed')
  } catch (err) {
    error.value = err.response?.data?.error || 'Belum bisa diakhiri. Coba lagi.'
  } finally {
    busy.value = false
  }
}

watch(() => props.open, (v) => { if (v) load() }, { immediate: true })
</script>

<style scoped>
.ts-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 25, 17, 0.45);
}
@media (min-width: 768px) {
  .ts-overlay { align-items: center; }
}
.ts {
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
  border-radius: 20px 20px 0 0;
  background: #fff;
  color: #0b3b2a;
  box-sizing: border-box;
}
@media (min-width: 768px) {
  .ts { border-radius: 20px; padding: 22px; }
}
.ts-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ts-head h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
}
.ts-x {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.ts-lead {
  margin: 6px 0 14px;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #475a50;
}
.ts h3 {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 800;
}
.ts-active {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 14px;
  background: #fff8ed;
  border: 1px solid #f1cf94;
}
.ts-active ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ts-active li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.ts-meta {
  display: block;
  font-size: 0.8rem;
  color: #5b6b62;
}
.ts-end {
  flex: none;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(180, 35, 24, 0.35);
  background: #fff;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  color: #b42318;
  cursor: pointer;
}
.ts-form {
  display: grid;
  gap: 12px;
}
.ts-field {
  display: grid;
  gap: 6px;
  font-size: 0.86rem;
  font-weight: 700;
}
.ts-input {
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
.ts-chips {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 6px;
}
.ts-chip {
  min-height: 44px;
  padding: 0 8px;
  border-radius: 12px;
  border: 1.5px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  color: #0b3b2a;
  cursor: pointer;
}
.ts-chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.ts-chip[aria-checked="true"] {
  border-color: #0a5c40;
  background: #e3f1ea;
  color: #0a5c40;
}
.ts-help {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 500;
  color: #5b6b62;
}
.ts-error {
  margin: 0 0 8px;
  font-size: 0.86rem;
  color: #7a1810;
}
.ts-save {
  min-height: 50px;
  border: 0;
  border-radius: 14px;
  background: #0a5c40;
  font: inherit;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
}
.ts-save:disabled {
  background: #dfe6e2;
  color: #6b7a72;
  cursor: not-allowed;
}
.ts-x:focus-visible,
.ts-end:focus-visible,
.ts-chip:focus-visible,
.ts-input:focus-visible,
.ts-save:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}
</style>
