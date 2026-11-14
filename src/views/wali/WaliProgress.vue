<template>
  <div>
    <router-link to="/wali" class="w-link back-link">← Beranda</router-link>

    <PageSkeleton v-if="loading && !data" :rows="4" label="Memuat progres ananda" />
    <p v-else-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else-if="data">
      <h1 class="w-title">{{ data.santri.name }}</h1>
      <p class="w-lead sub">
        {{ levelName(data.santri.classId) }}<template v-if="data.teacher"> · Pengajar: {{ data.teacher }}</template>
      </p>

      <!-- the latest material, the first thing a parent wants to know -->
      <section v-if="data.lastMaterial" class="w-card last-card" aria-labelledby="last-title">
        <p id="last-title" class="card-label">Materi terakhir · {{ longDate(data.lastMaterial.date) }}</p>
        <p class="last-material">{{ data.lastMaterial.material }}</p>
        <p v-if="data.lastMaterial.supportingMaterial" class="last-support">Materi pendukung: {{ data.lastMaterial.supportingMaterial }}</p>
      </section>

      <!-- month switcher -->
      <div class="month-bar" role="group" aria-label="Pilih bulan">
        <button type="button" class="month-btn" :disabled="!older" aria-label="Bulan sebelumnya" @click="go(older)">‹</button>
        <h2 class="month-title" aria-live="polite">{{ monthTitle(data.month) }}</h2>
        <button type="button" class="month-btn" :disabled="!newer" aria-label="Bulan berikutnya" @click="go(newer)">›</button>
      </div>

      <div class="tiles" role="list" aria-label="Rekap kehadiran">
        <div v-for="t in TILES" :key="t.key" class="tile" :class="`is-${t.key}`" role="listitem">
          <strong>{{ data.summary[t.key] }}</strong>
          <span>{{ t.label }}</span>
        </div>
      </div>

      <h2 class="w-section-title">Pertemuan</h2>
      <p v-if="!data.meetings.length" class="w-card empty">Belum ada catatan KBM untuk ananda di bulan ini.</p>
      <ul v-else class="meetings">
        <li v-for="(m, i) in data.meetings" :key="`${m.date}-${i}`" class="w-card meeting">
          <div class="meeting-head">
            <span class="meeting-date">{{ shortDate(m.date) }}</span>
            <span class="w-pill" :class="`is-${STATUS_META[m.status].tone}`">{{ STATUS_META[m.status].label }}</span>
          </div>
          <p v-if="m.material" class="meeting-material">{{ m.material }}</p>
          <p v-if="m.supportingMaterial" class="meeting-support">Pendukung: {{ m.supportingMaterial }}</p>
          <p v-if="m.guruName" class="meeting-teacher">{{ m.guruName }}<template v-if="m.badal"> (menggantikan)</template></p>
        </li>
      </ul>

      <p class="w-help foot">Data dari catatan KBM ustadz/ustadzah. Bila ada yang keliru, hubungi pengajar ananda.</p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const loadError = ref('')
const data = ref(null)

const TILES = [
  { key: 'hadir', label: 'Hadir' },
  { key: 'izin', label: 'Izin' },
  { key: 'sakit', label: 'Sakit' },
  { key: 'alfa', label: 'Alfa' },
]
const STATUS_META = {
  hadir: { label: 'Hadir', tone: 'ok' },
  izin: { label: 'Izin', tone: 'info' },
  sakit: { label: 'Sakit', tone: 'warn' },
  alfa: { label: 'Alfa', tone: 'danger' },
}
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const monthTitle = (ym) => {
  const [y, m] = String(ym).split('-').map(Number)
  return y && m ? `${MONTHS[m - 1]} ${y}` : ''
}
const parts = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number)
  return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }
}
const shortDate = (iso) => {
  const { m, d, wd } = parts(iso)
  return `${DAYS[wd]}, ${d} ${MONTHS[m - 1].slice(0, 3)}`
}
const longDate = (iso) => {
  const { y, m, d, wd } = parts(iso)
  return `${DAYS[wd]}, ${d} ${MONTHS[m - 1]} ${y}`
}

// months come newest first
const index = computed(() => data.value?.months.indexOf(data.value.month) ?? -1)
const older = computed(() => (index.value >= 0 ? data.value.months[index.value + 1] : null))
const newer = computed(() => (index.value > 0 ? data.value.months[index.value - 1] : null))

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const month = typeof route.query.bulan === 'string' ? route.query.bulan : ''
    const res = await api.get(`/wali/santri/${route.params.santriId}/progress`, { params: month ? { month } : {}, cache: false })
    data.value = res.data
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Progres belum bisa dimuat. Periksa koneksi lalu muat ulang.'
  } finally {
    loading.value = false
  }
}
function go(month) {
  if (month) router.replace({ query: { ...route.query, bulan: month } })
}

watch(() => route.query.bulan, load)
onMounted(load)
</script>

<style scoped>
.back-link {
  display: inline-block;
  margin: -4px 0 6px;
  text-decoration: none;
}

.sub {
  margin-bottom: 14px;
}

.last-card {
  background: #fffbeb;
  border-color: #f3d58b;
}

.card-label {
  margin: 0 0 4px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #5b6b62;
}

.last-material {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.last-support {
  margin: 4px 0 0;
  font-size: 0.88rem;
  color: #475a50;
}

.month-bar {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  gap: 8px;
  margin: 20px 0 12px;
}

.month-title {
  margin: 0;
  text-align: center;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0b3b2a;
}

.month-btn {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  border: 1.5px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  color: #0a5c40;
  font: inherit;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.month-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.month-btn:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 4px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
}

.tile strong {
  font-size: 1.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.tile span {
  font-size: 0.8rem;
  font-weight: 700;
  color: #5b6b62;
}

.tile.is-hadir strong { color: #0a5c40; }
.tile.is-izin strong { color: #1d4f8a; }
.tile.is-sakit strong { color: #7c3a0d; }
.tile.is-alfa strong { color: #8e1b12; }

.meetings {
  list-style: none;
  margin: 0;
  padding: 0;
}

.meeting {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
}

.meeting-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.meeting-date {
  font-weight: 800;
  color: #0b3b2a;
}

.meeting-material {
  margin: 2px 0 0;
  color: #0b3b2a;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.meeting-support,
.meeting-teacher {
  margin: 0;
  font-size: 0.85rem;
  color: #5b6b62;
}

.empty {
  margin: 0;
  color: #475a50;
}

.foot {
  display: block;
  margin-top: 16px;
  text-align: center;
}
</style>
