<template>
  <!-- "Laporkan absen keliru" from the wali portal: the jilid's teachers answer first, the admin after 30 minutes -->
  <section v-if="reports.length" class="ar" aria-labelledby="ar-title">
    <h2 id="ar-title" class="ar-title">
      <span class="ar-dot" aria-hidden="true"></span>
      Laporan absen keliru dari wali <span class="ar-count">{{ reports.length }}</span>
    </h2>
    <p class="ar-lead">Wali merasa absen ananda keliru. Cek dulu, lalu betulkan atau jelaskan. Jawaban Antum dikirim ke wali lewat WhatsApp.</p>
    <ul class="ar-list">
      <li v-for="r in reports" :key="r.id" class="ar-item">
        <div class="ar-who">
          <strong>{{ r.santriName }}</strong>
          <span class="ar-meta">{{ levelName(r.classId) }} · {{ dayText(r.date) }} · Sesi {{ r.slot === 'wave_2' ? 'Malam' : 'Sore' }}</span>
        </div>
        <p class="ar-change">
          Tercatat <span class="ar-pill" :class="`is-${r.recorded || 'none'}`">{{ word(r.recorded) }}</span>
          <span aria-hidden="true">→</span>
          <span class="sr-only">, menurut wali</span>
          <span class="ar-pill" :class="`is-${r.want}`">{{ word(r.want) }}</span>
          <span class="ar-by">menurut {{ r.byName }}</span>
        </p>
        <p class="ar-note">"{{ r.note }}"</p>
        <p v-if="errors[r.id]" class="ar-error" role="alert">{{ errors[r.id] }}</p>
        <div class="ar-actions">
          <button type="button" class="ar-btn is-primary" :disabled="busy === r.id" @click="fix(r)">Betulkan jadi {{ word(r.want) }}</button>
          <button type="button" class="ar-btn" :disabled="busy === r.id" @click="keep(r)">Sudah benar</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'

const emit = defineEmits(['changed'])
const { ask } = useDialog()

const WORD = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alfa: 'Alfa' }
const word = (s) => WORD[s] || 'Belum dicatat'
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Jilid ?')
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const dayText = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

const reports = ref([])
const busy = ref('')
const errors = ref({})

async function load() {
  try {
    const { data } = await api.get('/santri-presence/reports', { cache: false })
    reports.value = data.reports || []
  } catch {
    // the roll call itself must not be held up by this list
  }
}

async function send(r, body) {
  busy.value = r.id
  errors.value = { ...errors.value, [r.id]: '' }
  try {
    await api.post(`/santri-presence/reports/${encodeURIComponent(r.id)}/resolve`, body)
    reports.value = reports.value.filter((x) => x.id !== r.id)
    emit('changed', { date: r.date, slot: r.slot })
  } catch (err) {
    errors.value = { ...errors.value, [r.id]: err.response?.data?.error || 'Belum tersimpan. Coba lagi.' }
    if (err.response?.status === 409) load()
  } finally {
    busy.value = ''
  }
}

async function fix(r) {
  const ok = await ask({
    title: `Betulkan absen ${r.santriName}?`,
    message: `${dayText(r.date)}, sesi ${r.slot === 'wave_2' ? 'Malam' : 'Sore'}: ${word(r.recorded)} diganti menjadi ${word(r.want)}. Wali mendapat kabar lewat WhatsApp bahwa absennya sudah dibetulkan, dengan permintaan maaf.`,
    confirmText: `Ya, jadi ${word(r.want)}`,
  })
  if (ok) send(r, { action: 'fix' })
}

async function keep(r) {
  const answer = await ask({
    title: `Absen ${r.santriName} sudah benar?`,
    message: `Tetap ${word(r.recorded)}. Tuliskan keterangan untuk wali, misalnya "ananda tidak datang sampai sesi selesai".`,
    input: { label: 'Keterangan untuk wali', required: true, maxlength: 300, multiline: true },
    confirmText: 'Kirim ke wali',
  })
  if (answer) send(r, { action: 'keep', answer })
}

let poll = null
onMounted(() => {
  load()
  poll = setInterval(() => { if (document.visibilityState === 'visible') load() }, 90000)
})
onBeforeUnmount(() => clearInterval(poll))
defineExpose({ load })
</script>

<style scoped>
.ar {
  margin: 0 0 14px;
  padding: 14px;
  border-radius: 16px;
  background: #fff8ed;
  border: 1px solid #f1cf94;
}
.ar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 800;
  color: #5b3a06;
}
.ar-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d97706;
  flex: none;
}
.ar-count {
  min-width: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: #b45309;
  color: #fff;
  font-size: 0.78rem;
  line-height: 22px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.ar-lead {
  margin: 0 0 10px;
  font-size: 0.86rem;
  line-height: 1.5;
  color: #6b4a12;
}
.ar-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ar-item {
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(180, 83, 9, 0.18);
}
.ar-who {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  color: #0b3b2a;
}
.ar-meta {
  font-size: 0.8rem;
  font-weight: 600;
  color: #5b6b62;
}
.ar-change {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 8px 0 4px;
  font-size: 0.86rem;
  color: #475a50;
}
.ar-pill {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  background: #eef2ef;
  color: #3b4a42;
}
.ar-pill.is-hadir { background: #dcfce7; color: #14532d; }
.ar-pill.is-izin { background: #e0f2fe; color: #0c4a6e; }
.ar-pill.is-sakit { background: #fef3c7; color: #713f12; }
.ar-pill.is-alfa { background: #fee2e2; color: #7f1d1d; }
.ar-by {
  font-size: 0.8rem;
  color: #5b6b62;
}
.ar-note {
  margin: 0 0 10px;
  font-size: 0.88rem;
  font-style: italic;
  line-height: 1.45;
  color: #3b4a42;
  overflow-wrap: anywhere;
}
.ar-error {
  margin: 0 0 8px;
  font-size: 0.84rem;
  color: #7a1810;
}
.ar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ar-btn {
  flex: 1 1 140px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(10, 92, 64, 0.35);
  background: #fff;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  color: #0a5c40;
  cursor: pointer;
}
.ar-btn.is-primary {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}
.ar-btn:disabled {
  opacity: 0.6;
  cursor: progress;
}
.ar-btn:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
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
