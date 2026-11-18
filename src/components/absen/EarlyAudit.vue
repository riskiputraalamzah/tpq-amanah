<template>
  <!-- admin: records saved before their sesi started (a KBM or a roll call filled in ahead) -->
  <section v-if="rows.length" class="ea" aria-labelledby="ea-title">
    <button type="button" class="ea-head" :aria-expanded="open" aria-controls="ea-body" @click="open = !open">
      <span id="ea-title" class="ea-title">Absen dicatat sebelum sesinya dimulai</span>
      <span class="ea-count">{{ rows.length }}</span>
      <span class="ea-chevron" aria-hidden="true">{{ open ? '▾' : '▸' }}</span>
    </button>
    <div v-if="open" id="ea-body">
      <p class="ea-lead">
        Absen ini disimpan sebelum ngaji dimulai (Sore 15.00, Malam 18.00), jadi mungkin belum sesuai kenyataan.
        <strong>Kosongkan</strong> membuat santri kembali "belum dicatat"; bila kabar alfa sudah terkirim, wali otomatis mendapat pesan
        pembatalan. <strong>Biarkan</strong> menandainya sudah dicek.
      </p>
      <p v-if="error" class="ea-error" role="alert">{{ error }}</p>
      <div v-for="g in grouped" :key="g.key" class="ea-group">
        <div class="ea-group-head">
          <strong>{{ g.title }}</strong>
          <span class="ea-group-meta">{{ g.rows.length }} santri · disimpan {{ g.savedText }}</span>
        </div>
        <ul class="ea-list">
          <li v-for="r in g.rows" :key="r.id" class="ea-row">
            <span class="ea-name">{{ r.name || r.santriId }}</span>
            <span class="ea-pill" :class="`is-${r.status}`">{{ word(r.status) }}</span>
            <span class="ea-by">{{ r.source === 'kbm' ? 'KBM' : 'Absen' }} · {{ r.byName || '—' }} · {{ clock(r.savedAt) }}</span>
          </li>
        </ul>
        <div class="ea-actions">
          <button type="button" class="ea-btn is-danger" :disabled="busy" @click="settle(g, 'clear')">Kosongkan {{ g.rows.length }}</button>
          <button type="button" class="ea-btn" :disabled="busy" @click="settle(g, 'keep')">Biarkan</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'

const emit = defineEmits(['changed'])
const { ask } = useDialog()
const WORD = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alfa: 'Alfa' }
const word = (s) => WORD[s] || s
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const dayText = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}
const clock = (v) => (v ? new Date(new Date(v).getTime() + 7 * 3600 * 1000).toISOString().slice(11, 16).replace(':', '.') : '')

const rows = ref([])
const open = ref(false)
const busy = ref(false)
const error = ref('')

// per day and sesi: one decision for what one person filled in ahead
const grouped = computed(() => {
  const map = new Map()
  for (const r of rows.value) {
    const key = `${r.date}|${r.slot}`
    if (!map.has(key)) map.set(key, { key, date: r.date, slot: r.slot, title: `${dayText(r.date)} · Sesi ${r.slot === 'wave_2' ? 'Malam' : 'Sore'}`, rows: [] })
    map.get(key).rows.push(r)
  }
  return [...map.values()].map((g) => {
    const times = g.rows.map((r) => clock(r.savedAt)).sort()
    return { ...g, savedText: times[0] === times[times.length - 1] ? `pukul ${times[0]}` : `pukul ${times[0]}–${times[times.length - 1]}` }
  })
})

async function load() {
  try {
    const { data } = await api.get('/santri-presence/audit/early', { params: { days: 14 }, cache: false })
    rows.value = data.rows || []
  } catch {
    rows.value = []
  }
}

async function settle(g, action) {
  if (action === 'clear') {
    const ok = await ask({
      title: `Kosongkan ${g.rows.length} absen?`,
      message: `${g.title}: absen yang disimpan sebelum sesi dimulai dihapus, santri kembali "belum dicatat". Wali yang sudah menerima kabar alfa otomatis mendapat pesan pembatalan dengan permintaan maaf.`,
      confirmText: 'Kosongkan',
      tone: 'danger',
    })
    if (!ok) return
  }
  busy.value = true
  error.value = ''
  try {
    await api.post('/santri-presence/audit/early', { action, ids: g.rows.map((r) => r.id) })
    await load()
    emit('changed', { date: g.date, slot: g.slot })
  } catch (err) {
    error.value = err.response?.data?.error || 'Belum tersimpan. Coba lagi.'
  } finally {
    busy.value = false
  }
}

onMounted(load)
defineExpose({ load })
</script>

<style scoped>
.ea {
  margin: 0 0 14px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(122, 24, 16, 0.22);
  overflow: hidden;
}
.ea-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 52px;
  padding: 10px 14px;
  border: 0;
  background: #fdf2f0;
  font: inherit;
  text-align: left;
  color: #7a1810;
  cursor: pointer;
}
.ea-head:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: -3px;
}
.ea-title {
  flex: 1;
  font-weight: 800;
}
.ea-count {
  min-width: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: #b42318;
  color: #fff;
  font-size: 0.78rem;
  line-height: 22px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
#ea-body {
  padding: 12px 14px 14px;
}
.ea-lead {
  margin: 0 0 12px;
  font-size: 0.86rem;
  line-height: 1.5;
  color: #475a50;
}
.ea-error {
  margin: 0 0 10px;
  color: #7a1810;
  font-size: 0.86rem;
}
.ea-group + .ea-group {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(11, 59, 42, 0.1);
}
.ea-group-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 10px;
  margin-bottom: 6px;
  color: #0b3b2a;
}
.ea-group-meta {
  font-size: 0.8rem;
  color: #5b6b62;
}
.ea-list {
  display: grid;
  gap: 4px;
  margin: 0 0 10px;
  padding: 0;
  list-style: none;
}
.ea-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  padding: 6px 0;
  font-size: 0.88rem;
  color: #0b3b2a;
}
.ea-name {
  font-weight: 700;
}
.ea-pill {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
  background: #eef2ef;
}
.ea-pill.is-hadir { background: #dcfce7; color: #14532d; }
.ea-pill.is-izin { background: #e0f2fe; color: #0c4a6e; }
.ea-pill.is-sakit { background: #fef3c7; color: #713f12; }
.ea-pill.is-alfa { background: #fee2e2; color: #7f1d1d; }
.ea-by {
  flex-basis: 100%;
  font-size: 0.78rem;
  color: #5b6b62;
}
.ea-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ea-btn {
  flex: 1 1 130px;
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
.ea-btn.is-danger {
  background: #b42318;
  border-color: #b42318;
  color: #fff;
}
.ea-btn:disabled {
  opacity: 0.6;
  cursor: progress;
}
.ea-btn:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}
</style>
