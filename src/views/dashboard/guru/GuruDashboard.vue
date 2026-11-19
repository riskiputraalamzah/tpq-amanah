<template>
  <div class="gd">
    <div class="gd-bar">
      <p class="gd-date">{{ longToday }}<template v-if="d?.today.holiday"> · <span class="gd-holiday">{{ d.today.holiday }}</span></template></p>
      <button type="button" class="gd-refresh" :disabled="loading" @click="load(true)">
        <LineIcon name="refresh" :size="15" /> {{ loading ? 'Memuat…' : 'Muat ulang' }}
      </button>
    </div>

    <PageSkeleton v-if="!d && loading" :rows="5" label="Memuat ringkasan" />
    <p v-else-if="!d && error" class="gd-error" role="alert">{{ error }}</p>

    <div v-else-if="d" class="gd-grid">
      <div class="gd-col">
        <!-- 1. today's tasks -->
        <section class="gd-card" aria-labelledby="gd-tasks">
          <h2 id="gd-tasks" class="gd-title">Tugas hari ini</h2>
          <div v-if="!d.today.schoolDay" class="gd-off">
            <LineIcon name="sun" :size="22" />
            <p>{{ d.today.holiday ? `Libur: ${d.today.holiday}` : 'Akhir pekan, tidak ada KBM. Selamat beristirahat.' }}</p>
          </div>
          <ul v-else class="gd-tasks">
            <li>
              <router-link to="/dashboard/attendance" class="gd-task" :class="d.tasks.attendance.done ? 'is-done' : 'is-todo'">
                <span class="gd-task-mark" aria-hidden="true"><LineIcon :name="d.tasks.attendance.done ? 'check' : 'clock'" :size="18" :stroke="2.6" /></span>
                <span class="gd-task-text">
                  <strong>Absen kehadiran saya</strong>
                  <small>{{ d.tasks.attendance.done ? `Sudah: ${attendanceWord(d.tasks.attendance.status)}` : 'Belum absen hari ini' }}</small>
                </span>
                <span class="gd-go" aria-hidden="true">›</span>
              </router-link>
            </li>
            <li>
              <router-link to="/dashboard/kbm" class="gd-task" :class="kbmDone ? 'is-done' : d.tasks.kbm.onLeave ? 'is-rest' : 'is-todo'">
                <span class="gd-task-mark" aria-hidden="true"><LineIcon :name="kbmDone ? 'check' : d.tasks.kbm.onLeave ? 'sun' : 'book'" :size="18" :stroke="2.4" /></span>
                <span class="gd-task-text">
                  <strong>KBM saya</strong>
                  <small>{{ kbmText }}</small>
                </span>
                <span class="gd-go" aria-hidden="true">›</span>
              </router-link>
            </li>
            <li>
              <router-link to="/dashboard/absen-santri" class="gd-task" :class="rollDone ? 'is-done' : 'is-todo'">
                <span class="gd-task-mark" aria-hidden="true"><LineIcon :name="rollDone ? 'check' : 'users'" :size="18" :stroke="2.4" /></span>
                <span class="gd-task-text">
                  <strong>Absen santri jilid saya</strong>
                  <small>{{ d.tasks.rollCall.recorded }} dari {{ d.tasks.rollCall.total }} santri sudah dicatat</small>
                </span>
                <span class="gd-go" aria-hidden="true">›</span>
              </router-link>
            </li>
          </ul>
        </section>

        <!-- 2. izin from the parents -->
        <section class="gd-card" aria-labelledby="gd-izin">
          <div class="gd-title-row">
            <h2 id="gd-izin" class="gd-title">Izin dari wali</h2>
            <span v-if="d.izin.length" class="gd-count">{{ d.izin.length }}</span>
          </div>
          <p v-if="!d.izin.length" class="gd-muted">Tidak ada izin atau sakit dari wali untuk 7 hari ke depan.</p>
          <ul v-else class="gd-izin">
            <li v-for="(x, i) in d.izin" :key="i" class="gd-izin-row" :class="{ 'is-today': x.today }">
              <span class="gd-izin-day">{{ x.today ? 'Hari ini' : dayShort(x.date) }}</span>
              <span class="gd-izin-main">
                <strong>{{ x.name }}</strong>
                <small>{{ levelName(x.classId) }}<template v-if="x.sesi"> · {{ x.sesi }}</template><template v-if="x.reason"> · "{{ x.reason }}"</template></small>
              </span>
              <span class="gd-pill" :class="`is-${x.status}`">{{ x.status }}</span>
            </li>
          </ul>
          <p class="gd-help">Sudah tercatat di Absen Santri, tidak perlu diubah.</p>
        </section>

        <!-- 3. who needs attention -->
        <section class="gd-card" aria-labelledby="gd-att">
          <h2 id="gd-att" class="gd-title">Perlu perhatian</h2>
          <p v-if="!d.attention.oftenAlfa.length && !d.attention.notLinked && !d.attention.dataUnfinished" class="gd-muted">Tidak ada yang perlu perhatian khusus. Alhamdulillah.</p>
          <template v-else>
            <ul v-if="d.attention.oftenAlfa.length" class="gd-alfa">
              <li v-for="a in d.attention.oftenAlfa" :key="a.santriId">
                <span class="gd-alfa-n">{{ a.alfa }}x</span>
                <span><strong>{{ a.name }}</strong> <small>{{ levelName(a.classId) }} · alfa bulan ini</small></span>
              </li>
            </ul>
            <p v-if="d.attention.oftenAlfa.length" class="gd-help">Santri yang sering alfa: mungkin perlu ditanyakan ke walinya.</p>
            <div class="gd-minis">
              <router-link v-if="d.attention.notLinked" to="/dashboard/wali-santri" class="gd-mini">
                <strong>{{ d.attention.notLinked }}</strong>
                <span>santri belum tertaut wali</span>
              </router-link>
              <router-link v-if="d.attention.dataUnfinished" to="/dashboard/wali-santri" class="gd-mini">
                <strong>{{ d.attention.dataUnfinished }}</strong>
                <span>data ananda belum selesai diisi wali</span>
              </router-link>
            </div>
          </template>
        </section>
      </div>

      <div ref="sideEl" class="gd-col gd-side" :style="{ '--side-top': `${sideTop}px` }">
        <!-- 4. my KBM this month -->
        <section class="gd-card" aria-labelledby="gd-kbm">
          <div class="gd-title-row">
            <h2 id="gd-kbm" class="gd-title">KBM saya bulan ini</h2>
            <router-link to="/dashboard/kbm" class="gd-link">Buka ›</router-link>
          </div>
          <p v-if="!d.kbmMonth" class="gd-muted">Belum ada data KBM bulan ini.</p>
          <template v-else>
            <p class="gd-big">{{ d.kbmMonth.percent ?? '–' }}<small v-if="d.kbmMonth.percent !== null">% lengkap</small></p>
            <span class="gd-meter" role="img" :aria-label="`${d.kbmMonth.percent ?? 0} persen KBM lengkap`"><span :style="{ width: `${d.kbmMonth.percent || 0}%` }"></span></span>
            <p class="gd-sub">{{ d.kbmMonth.counts.complete }} hari lengkap<template v-if="d.kbmMonth.counts.leave"> · {{ d.kbmMonth.counts.leave }} izin/sakit</template></p>
            <template v-if="d.kbmMonth.gaps.length">
              <p class="gd-gaps-title">Masih kurang ({{ d.kbmMonth.gapCount }} hari):</p>
              <ul class="gd-gaps">
                <li v-for="g in d.kbmMonth.gaps" :key="g.date"><span>{{ dayShort(g.date) }}</span><small>{{ GAP[g.state] }}</small></li>
              </ul>
            </template>
            <p v-else class="gd-ok">Semua KBM bulan ini sudah lengkap. Jazakallahu khairan.</p>
          </template>
        </section>

        <!-- 5. my jilid -->
        <section class="gd-card" aria-labelledby="gd-jilid">
          <h2 id="gd-jilid" class="gd-title">Jilid saya</h2>
          <p v-if="d.scope.source === 'none'" class="gd-warn">Jilid Antum belum diatur dan belum ada riwayat KBM. Minta admin mengaturnya.</p>
          <template v-else>
            <ul class="gd-jilid">
              <li v-for="j in d.jilid" :key="j.classId"><strong>{{ j.name }}</strong><span>{{ j.count }} santri</span></li>
            </ul>
            <p class="gd-help">{{ d.santriCount }} santri · {{ SOURCE[d.scope.source] || '' }}</p>
          </template>
          <router-link to="/dashboard/santri" class="gd-link gd-jilid-link">Lihat data santri ›</router-link>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import LineIcon from '@/components/LineIcon.vue'
import { useStickySide } from '@/composables/useStickySide'

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
// the teacher's own attendance today, in words (the API says hadir / tidak_hadir / izin / sakit / alfa)
const ATTENDANCE_WORD = { hadir: 'Hadir', tidak_hadir: 'Tidak hadir', izin: 'Izin', sakit: 'Sakit', alfa: 'Alfa' }
const attendanceWord = (s) => ATTENDANCE_WORD[String(s || '').toLowerCase()] || String(s || '').replace(/_/g, ' ')
const GAP = { incomplete: 'KBM belum lengkap', not_created: 'KBM belum dibuat', no_attendance: 'belum absen' }
const SOURCE = { admin: 'jilid ditetapkan admin', kbm: 'dari riwayat KBM 60 hari', feature: 'akses semua jilid' }

const d = ref(null)
const sideEl = ref(null)
const sideTop = useStickySide(sideEl)
const loading = ref(false)
const error = ref('')
const loadedAt = ref(0)

const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : '')
const dayShort = (iso) => {
  const [y, m, dd] = iso.split('-').map(Number)
  return `${DAYS[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()].slice(0, 3)} ${dd} ${MONTHS[m - 1].slice(0, 3)}`
}
const longToday = computed(() => {
  const iso = d.value?.today.date || new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
  const [y, m, dd] = iso.split('-').map(Number)
  return `${DAYS[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]}, ${dd} ${MONTHS[m - 1]} ${y}`
})
const kbmDone = computed(() => d.value && d.value.tasks.kbm.count > 0 && d.value.tasks.kbm.complete === d.value.tasks.kbm.count)
const kbmText = computed(() => {
  const k = d.value.tasks.kbm
  if (k.onLeave) return 'Antum izin/sakit hari ini'
  if (!k.count) return 'Belum ada KBM hari ini'
  if (kbmDone.value) return `${k.count} KBM lengkap`
  const open = k.sessions.filter((s) => !s.complete)
  return `${open.map((s) => s.label).join(', ')}: ${[...new Set(open.flatMap((s) => s.missing))].join(', ') || 'belum lengkap'}`
})
const rollDone = computed(() => d.value && d.value.tasks.rollCall.total > 0 && d.value.tasks.rollCall.recorded >= d.value.tasks.rollCall.total)

async function load(fresh = false) {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/guru-dashboard', { params: fresh ? { fresh: '1' } : {}, cache: false })
    d.value = data
    loadedAt.value = Date.now()
  } catch (err) {
    error.value = err.response?.data?.error || 'Ringkasan belum bisa dimuat. Periksa koneksi lalu muat ulang.'
  } finally {
    loading.value = false
  }
}

let timer = null
onMounted(() => {
  load()
  timer = setInterval(() => {
    if (!document.hidden && Date.now() - loadedAt.value > 2 * 60 * 1000) load()
  }, 30 * 1000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.gd {
  --ink: #0b3b2a;
  --body: #475a50;
  --muted: #6b7a72;
  --line: rgba(11, 59, 42, 0.1);
  --emerald: #0a5c40;
  --gold: #b45309;
  color: var(--ink);
  margin-bottom: 18px;
}

.gd-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}

.gd-date {
  margin: 0;
  font-weight: 700;
  color: var(--body);
}

.gd-holiday {
  color: var(--gold);
}

.gd-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  font: inherit;
  font-size: 0.82rem;
  color: var(--muted);
  cursor: pointer;
}

.gd-error {
  padding: 12px;
  border-radius: 12px;
  background: #fdecea;
  color: #7a1810;
}

.gd-grid {
  display: grid;
  gap: 16px;
}

.gd-col {
  display: grid;
  gap: 16px;
  min-width: 0;
}

@media (min-width: 1100px) {
  .gd-grid {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    align-items: start;
  }

  /* sticky with the page's own scroll (see useStickySide) */
  .gd-side {
    position: sticky;
    top: var(--side-top, 16px);
  }
}

.gd-card {
  padding: 18px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 12px 28px -24px rgba(3, 41, 29, 0.45);
  min-width: 0;
}

.gd-title {
  margin: 0 0 12px;
  font-size: 1.02rem;
  font-weight: 800;
}

.gd-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.gd-count {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: #2f6fb3;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 800;
}

.gd-link {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--emerald);
  text-decoration: none;
}

.gd-muted {
  margin: 0;
  font-size: 0.9rem;
  color: var(--muted);
}

.gd-help {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: var(--muted);
}

.gd-off {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: #fffbeb;
  color: #7c3a0d;
}

.gd-off p {
  margin: 0;
  font-weight: 700;
}

/* tasks */
.gd-tasks {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.gd-task {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1.5px solid transparent;
  color: var(--ink);
  text-decoration: none;
}

.gd-task.is-done { background: #eef6f1; }
.gd-task.is-todo { background: #fffbeb; border-color: #f3d58b; }
.gd-task.is-rest { background: #f4f6f5; }

.gd-task-mark {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

.is-done .gd-task-mark { background: var(--emerald); color: #fcd34d; }
.is-todo .gd-task-mark { background: #b45309; color: #fff; }
.is-rest .gd-task-mark { background: #dfe6e2; color: var(--body); }

.gd-task-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.gd-task-text small {
  font-size: 0.84rem;
  color: var(--body);
  overflow-wrap: anywhere;
}

.gd-go {
  font-size: 1.4rem;
  color: var(--emerald);
}

/* izin */
.gd-izin {
  margin: 0;
  padding: 0;
  list-style: none;
}

.gd-izin-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
}

.gd-izin-day {
  flex: none;
  width: 74px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--muted);
}

.gd-izin-row.is-today .gd-izin-day {
  color: #2f6fb3;
}

.gd-izin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.gd-izin-main small {
  font-size: 0.8rem;
  color: var(--body);
  overflow-wrap: anywhere;
}

.gd-pill {
  flex: none;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: capitalize;
}

.gd-pill.is-izin { background: #e6f0fb; color: #1d4f8a; }
.gd-pill.is-sakit { background: #fef3c7; color: #7c3a0d; }

/* attention */
.gd-alfa {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
}

.gd-alfa li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gd-alfa small {
  color: var(--muted);
}

.gd-alfa-n {
  flex: none;
  display: grid;
  place-items: center;
  min-width: 36px;
  height: 30px;
  border-radius: 10px;
  background: #fdecea;
  color: #8e1b12;
  font-weight: 800;
  font-size: 0.86rem;
}

.gd-minis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.gd-mini {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f6f9f7;
  color: var(--ink);
  text-decoration: none;
}

.gd-mini strong {
  font-size: 1.3rem;
}

.gd-mini span {
  font-size: 0.82rem;
  color: var(--body);
}

/* my KBM */
.gd-big {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--emerald);
}

.gd-big small {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--muted);
}

.gd-meter {
  display: block;
  height: 8px;
  margin: 8px 0;
  border-radius: 999px;
  background: #e2ebe6;
  overflow: hidden;
}

.gd-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--emerald);
}

.gd-sub {
  margin: 0;
  font-size: 0.84rem;
  color: var(--body);
}

.gd-gaps-title {
  margin: 12px 0 4px;
  font-size: 0.84rem;
  font-weight: 700;
  color: #7c3a0d;
}

.gd-gaps {
  margin: 0;
  padding: 0;
  list-style: none;
}

.gd-gaps li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--line);
  font-size: 0.86rem;
}

.gd-gaps small {
  color: #7c3a0d;
}

.gd-ok {
  margin: 10px 0 0;
  font-size: 0.86rem;
  color: var(--emerald);
  font-weight: 600;
}

/* my jilid */
.gd-jilid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.gd-jilid li {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  border-radius: 12px;
  background: #eef6f1;
}

.gd-jilid span {
  font-size: 0.82rem;
  color: var(--body);
}

.gd-warn {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fffbeb;
  color: #5b3a06;
  font-size: 0.88rem;
}

.gd-jilid-link {
  display: inline-block;
  margin-top: 10px;
}

.gd-task:focus-visible,
.gd-mini:focus-visible,
.gd-link:focus-visible,
.gd-refresh:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}
</style>
