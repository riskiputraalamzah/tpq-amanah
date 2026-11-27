<template>
  <div class="ad">
    <div class="ad-bar">
      <p class="ad-date">{{ longToday }}<template v-if="d?.today.holiday"> · <span class="ad-holiday">{{ d.today.holiday }}</span></template></p>
      <button type="button" class="ad-refresh" :disabled="loading" @click="load(true)">
        <LineIcon name="refresh" :size="15" /> {{ loading ? 'Memuat…' : updatedText }}
      </button>
    </div>

    <PageSkeleton v-if="!d && loading" :rows="6" label="Memuat ringkasan" />
    <p v-else-if="!d && error" class="ad-error" role="alert">{{ error }}</p>

    <div v-else-if="d" class="ad-grid">
      <!-- ===== main column ===== -->
      <div class="ad-col">
        <!-- 1. what waits -->
        <section class="ad-card" aria-labelledby="ad-act">
          <h2 id="ad-act" class="ad-title">Perlu ditindaklanjuti</h2>
          <div v-if="!actions.length" class="ad-allgood">
            <span class="ad-allgood-icon" aria-hidden="true"><LineIcon name="check" :size="20" :stroke="3" /></span>
            <p><strong>Semua beres.</strong> Tidak ada yang menunggu Antum saat ini.</p>
          </div>
          <ul v-else class="ad-actions">
            <li v-for="a in actions" :key="a.key">
              <router-link :to="a.to" class="ad-action" :class="`is-${a.tone}`">
                <span class="ad-action-count">{{ a.count }}</span>
                <span class="ad-action-text">
                  <span>{{ a.label }}</span>
                  <small v-if="a.sub">{{ a.sub }}</small>
                </span>
                <span class="ad-go" aria-hidden="true">›</span>
              </router-link>
            </li>
          </ul>
        </section>

        <!-- 2. today -->
        <section class="ad-card" aria-labelledby="ad-today">
          <div class="ad-title-row">
            <h2 id="ad-today" class="ad-title">Hari ini</h2>
            <router-link to="/dashboard/absen-santri" class="ad-link">Absen santri ›</router-link>
          </div>
          <div v-if="!d.today.schoolDay" class="ad-off">
            <LineIcon name="sun" :size="22" />
            <p>{{ d.today.holiday ? `Libur: ${d.today.holiday}` : 'Akhir pekan, tidak ada KBM.' }}</p>
          </div>
          <template v-else>
            <div class="ad-sesi-grid">
              <div v-for="s in SESI" :key="s.key" class="ad-sesi">
                <p class="ad-sesi-name">{{ s.label }} <small>{{ s.time }}</small></p>
                <div class="ad-stack" role="img" :aria-label="stackLabel(d.today.sesi[s.key])">
                  <span v-for="part in stackParts(d.today.sesi[s.key])" :key="part.key" :class="`is-${part.key}`" :style="{ width: `${part.pct}%` }"></span>
                </div>
                <ul class="ad-legend">
                  <li v-for="st in STATUS" :key="st.key" :class="`is-${st.key}`"><strong>{{ d.today.sesi[s.key][st.key] }}</strong> {{ st.label }}</li>
                  <li class="is-none"><strong>{{ d.today.sesi[s.key].notRecorded }}</strong> belum dicatat</li>
                </ul>
                <p v-if="d.today.sesi[s.key].fromWali" class="ad-note">{{ d.today.sesi[s.key].fromWali }} izin/sakit dari wali lewat portal</p>
              </div>
            </div>
            <div class="ad-minis">
              <div v-if="d.today.gurus" class="ad-mini">
                <span class="ad-mini-label">Guru</span>
                <strong>{{ d.today.gurus.present }}<small>/{{ d.today.gurus.total }}</small> hadir</strong>
                <span class="ad-mini-sub">
                  <template v-if="d.today.gurus.leave">{{ d.today.gurus.leave }} izin/sakit · </template>{{ d.today.gurus.notYet }} belum absen
                </span>
              </div>
              <div v-if="d.today.gurus" class="ad-mini">
                <span class="ad-mini-label">KBM</span>
                <strong>{{ d.today.gurus.kbmComplete }} lengkap</strong>
                <span class="ad-mini-sub">{{ d.today.gurus.kbmGaps ? `${d.today.gurus.kbmGaps} belum lengkap` : 'tidak ada yang tertinggal' }}</span>
              </div>
              <router-link to="/dashboard/whatsapp" class="ad-mini is-link">
                <span class="ad-mini-label">Pesan WA</span>
                <strong>{{ d.today.wa.sent }} terkirim</strong>
                <span class="ad-mini-sub" :class="{ 'is-bad': d.today.wa.failed }">{{ d.today.wa.failed ? `${d.today.wa.failed} gagal` : 'tidak ada yang gagal' }}</span>
              </router-link>
            </div>
          </template>
        </section>

        <!-- 4. this month -->
        <section class="ad-card" aria-labelledby="ad-month">
          <h2 id="ad-month" class="ad-title">Bulan {{ monthName }}</h2>
          <div class="ad-month">
            <div class="ad-kpi">
              <span class="ad-kpi-label">Kehadiran santri</span>
              <strong class="ad-kpi-num">{{ d.attendanceMonth.presentPct ?? '–' }}<small v-if="d.attendanceMonth.presentPct !== null">%</small></strong>
              <div class="ad-stack is-thin" role="img" :aria-label="`Hadir ${d.attendanceMonth.hadir}, izin ${d.attendanceMonth.izin}, sakit ${d.attendanceMonth.sakit}, alfa ${d.attendanceMonth.alfa}`">
                <span v-for="part in monthParts" :key="part.key" :class="`is-${part.key}`" :style="{ width: `${part.pct}%` }"></span>
              </div>
              <span class="ad-kpi-sub">{{ d.attendanceMonth.hadir }} hadir · {{ d.attendanceMonth.izin + d.attendanceMonth.sakit }} izin/sakit · {{ d.attendanceMonth.alfa }} alfa</span>
            </div>
            <router-link v-if="d.kbmMonth" to="/dashboard/kbm-monitor" class="ad-kpi is-link">
              <span class="ad-kpi-label">KBM lengkap</span>
              <strong class="ad-kpi-num">{{ d.kbmMonth.percent ?? '–' }}<small v-if="d.kbmMonth.percent !== null">%</small></strong>
              <span class="ad-meter" role="img" :aria-label="`${d.kbmMonth.percent ?? 0} persen KBM lengkap`"><span :style="{ width: `${d.kbmMonth.percent || 0}%` }"></span></span>
              <span class="ad-kpi-sub">{{ d.kbmMonth.gurusNeedingAction ? `${d.kbmMonth.gurusNeedingAction} dari ${d.kbmMonth.gurus} guru perlu melengkapi` : 'semua guru lengkap' }}</span>
            </router-link>
          </div>
          <router-link to="/dashboard/pendaftaran" class="ad-funnel" aria-label="Pendaftaran santri baru">
            <span class="ad-funnel-title">Pendaftaran</span>
            <span class="ad-funnel-steps">
              <span><strong>{{ d.pendaftaran.submitted }}</strong> baru</span>
              <span><strong>{{ d.pendaftaran.contacted }}</strong> dihubungi</span>
              <span><strong>{{ d.pendaftaran.scheduled }}</strong> terjadwal</span>
              <span class="is-done"><strong>{{ d.pendaftaran.acceptedThisMonth }}</strong> diterima bulan ini</span>
            </span>
          </router-link>
        </section>
      </div>

      <!-- ===== side column: stays in view while the main column scrolls (wide screens) ===== -->
      <div ref="sideEl" class="ad-col ad-side" :style="{ '--side-top': `${sideTop}px` }">
        <!-- 3. santri -->
        <section class="ad-card" aria-labelledby="ad-santri">
          <div class="ad-title-row">
            <h2 id="ad-santri" class="ad-title">Santri aktif</h2>
            <router-link to="/dashboard/santri" class="ad-link">Kelola ›</router-link>
          </div>
          <p class="ad-big">{{ d.santri.active }} <small>santri<template v-if="d.santri.newThisMonth"> · +{{ d.santri.newThisMonth }} bulan ini</template></small></p>
          <ul class="ad-bars" aria-label="Santri per jilid">
            <li v-for="j in d.santri.byJilid" :key="j.classId">
              <span class="ad-bar-label">{{ j.name }}</span>
              <span class="ad-bar-track"><span :style="{ width: `${barPct(j.count)}%` }"></span></span>
              <strong class="ad-bar-num">{{ j.count }}</strong>
            </li>
          </ul>
          <p v-if="d.santri.noJilid" class="ad-note is-warn">{{ d.santri.noJilid }} santri aktif belum punya jilid.</p>
          <div class="ad-progress">
            <router-link to="/dashboard/wali-santri" class="ad-prog">
              <span class="ad-prog-top"><span>Wali tertaut</span><strong>{{ d.santri.linkedPct ?? 0 }}%</strong></span>
              <span class="ad-meter"><span :style="{ width: `${d.santri.linkedPct || 0}%` }"></span></span>
              <small>{{ d.santri.linked }} dari {{ d.santri.active }} santri</small>
            </router-link>
            <router-link to="/dashboard/wali-santri" class="ad-prog">
              <span class="ad-prog-top"><span>Data ananda terverifikasi</span><strong>{{ d.santri.verifiedPct ?? 0 }}%</strong></span>
              <span class="ad-meter is-gold"><span :style="{ width: `${d.santri.verifiedPct || 0}%` }"></span></span>
              <small>{{ d.santri.verified }} terverifikasi<template v-if="d.santri.waitingCheck"> · {{ d.santri.waitingCheck }} menunggu dicek</template><template v-if="d.santri.needsFix"> · {{ d.santri.needsFix }} perlu diperbaiki</template></small>
            </router-link>
          </div>
        </section>

        <!-- 5. money and kegiatan -->
        <section class="ad-card" aria-labelledby="ad-money">
          <h2 id="ad-money" class="ad-title">Tabungan &amp; kegiatan</h2>
          <router-link to="/dashboard/admin-savings" class="ad-money">
            <span class="ad-kpi-label">Saldo tabungan</span>
            <strong>{{ formatRupiah(d.tabungan.totalBalance) }}</strong>
            <small>di {{ d.tabungan.books }} buku tabungan</small>
          </router-link>
          <div class="ad-keg">
            <div class="ad-title-row">
              <span class="ad-kpi-label">Kegiatan berjalan ({{ d.kegiatan.open }})</span>
              <router-link to="/dashboard/kegiatan" class="ad-link">Semua ›</router-link>
            </div>
            <p v-if="!d.kegiatan.next.length" class="ad-muted">Belum ada kegiatan berjalan.</p>
            <router-link v-for="k in d.kegiatan.next" :key="k.id" :to="`/dashboard/kegiatan/${k.id}`" class="ad-keg-row">
              <strong>{{ k.title }}</strong>
              <span>{{ k.date ? shortDate(k.date) : 'tanpa tanggal' }}<template v-if="k.fee"> · {{ formatRupiah(k.fee) }}</template></span>
            </router-link>
          </div>
          <router-link to="/dashboard/pengumuman-wali" class="ad-ann">
            <LineIcon name="info" :size="16" /> {{ d.announcements ? `${d.announcements} pengumuman tampil di portal wali` : 'Tidak ada pengumuman wali yang tampil' }} ›
          </router-link>
        </section>

        <!-- 6. latest -->
        <section class="ad-card" aria-labelledby="ad-recent">
          <h2 id="ad-recent" class="ad-title">Terkini</h2>
          <p v-if="!d.recent.length" class="ad-muted">Belum ada kabar terbaru.</p>
          <ul v-else class="ad-feed">
            <li v-for="(e, i) in d.recent" :key="i">
              <router-link :to="e.to" class="ad-feed-row">
                <span class="ad-feed-dot" :class="`is-${e.kind}`" aria-hidden="true"></span>
                <span class="ad-feed-text">{{ e.text }}</span>
                <time class="ad-feed-time">{{ ago(e.at) }}</time>
              </router-link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGalleryCommentBadge } from '@/composables/useGalleryCommentBadge'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import LineIcon from '@/components/LineIcon.vue'
import { formatRupiah } from '@/utils/money'
import { useStickySide } from '@/composables/useStickySide'

const SESI = [
  { key: 'wave_1', label: 'Sesi Sore', time: '15:30' },
  { key: 'wave_2', label: 'Sesi Malam', time: '18:00' },
]
const STATUS = [
  { key: 'hadir', label: 'hadir' },
  { key: 'izin', label: 'izin' },
  { key: 'sakit', label: 'sakit' },
  { key: 'alfa', label: 'alfa' },
]
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const d = ref(null)
// + new comments on Dokumentasi: kept per account (not in the shared, cached dashboard answer), same count as the menu
const { count: newComments, refresh: refreshComments } = useGalleryCommentBadge()
const actions = computed(() => [
  ...(d.value?.actions || []),
  ...(newComments.value
    ? [{ key: 'komentar', count: newComments.value, label: 'komentar baru di Dokumentasi', sub: 'Ucapan dan doa dari wali; balas atau hapus bila perlu', to: '/dashboard/dokumentasi?tab=komentar', tone: 'info' }]
    : []),
])
onMounted(() => refreshComments({ force: true }))
const sideEl = ref(null)
const sideTop = useStickySide(sideEl)
const loading = ref(false)
const error = ref('')
const loadedAt = ref(null)
const tick = ref(Date.now())

const longToday = computed(() => {
  const iso = d.value?.today.date || new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
  const [y, m, dd] = iso.split('-').map(Number)
  return `${DAYS[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]}, ${dd} ${MONTHS[m - 1]} ${y}`
})
const monthName = computed(() => MONTHS[Number((d.value?.attendanceMonth.month || '2026-01').slice(5, 7)) - 1])
const updatedText = computed(() => {
  if (!loadedAt.value) return 'Muat ulang'
  const min = Math.floor((tick.value - loadedAt.value) / 60000)
  return min < 1 ? 'Diperbarui baru saja' : `Diperbarui ${min} menit lalu`
})
const shortDate = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1].slice(0, 3)} ${iso.slice(0, 4)}`

// one bar per sesi: hadir / izin / sakit / alfa / not recorded, as parts of everything expected that day
function stackParts(s) {
  const whole = Math.max(s.expected, s.recorded) || 1
  return [...STATUS.map((st) => ({ key: st.key, n: s[st.key] })), { key: 'none', n: s.notRecorded }]
    .filter((p) => p.n > 0)
    .map((p) => ({ key: p.key, pct: (p.n / whole) * 100 }))
}
const stackLabel = (s) => `${s.hadir} hadir, ${s.izin} izin, ${s.sakit} sakit, ${s.alfa} alfa, ${s.notRecorded} belum dicatat`
const monthParts = computed(() => {
  const m = d.value.attendanceMonth
  const whole = m.total || 1
  return STATUS.map((st) => ({ key: st.key, pct: (m[st.key] / whole) * 100 })).filter((p) => p.pct > 0)
})
const barPct = (n) => {
  const max = Math.max(...d.value.santri.byJilid.map((j) => j.count), 1)
  return (n / max) * 100
}
function ago(v) {
  const t = new Date(v).getTime()
  if (!t) return ''
  const min = Math.round((tick.value - t) / 60000)
  if (min < 1) return 'baru saja'
  if (min < 60) return `${min} mnt`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} jam`
  const days = Math.round(h / 24)
  return days < 8 ? `${days} hari` : shortDate(new Date(t + 7 * 3600 * 1000).toISOString().slice(0, 10))
}

async function load(fresh = false, { silent = false } = {}) {
  if (!silent || !d.value) loading.value = true
  if (!silent) error.value = ''
  try {
    const { data } = await api.get('/admin-dashboard', { params: fresh ? { fresh: '1' } : {}, cache: false })
    d.value = data
    loadedAt.value = Date.now()
    tick.value = Date.now()
  } catch (err) {
    if (!silent || !d.value) {
      error.value = err.response?.data?.error || 'Ringkasan belum bisa dimuat. Periksa koneksi lalu muat ulang.'
    }
  } finally {
    loading.value = false
  }
}

function onVisible() {
  if (document.visibilityState === 'visible' && Date.now() - (loadedAt.value || 0) > 5000) {
    load(true, { silent: true })
  }
}

// fresh numbers while the page stays open and visible
let timer = null
onMounted(() => {
  load()
  document.addEventListener('visibilitychange', onVisible)
  timer = setInterval(() => {
    tick.value = Date.now()
    if (!document.hidden && Date.now() - (loadedAt.value || 0) > 2 * 60 * 1000) load(false, { silent: true })
  }, 30 * 1000)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<style scoped>
.ad {
  --ink: #0b3b2a;
  --body: #475a50;
  --muted: #6b7a72;
  --line: rgba(11, 59, 42, 0.1);
  --emerald: #0a5c40;
  --gold: #b45309;
  --hadir: #1f8a5b;
  --izin: #2f6fb3;
  --sakit: #d08a1e;
  --alfa: #c0392b;
  --none: #dfe6e2;
  color: var(--ink);
}

.ad-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}

.ad-date {
  margin: 0;
  font-weight: 700;
  color: var(--body);
}

.ad-holiday {
  color: var(--gold);
}

.ad-refresh {
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

.ad-error {
  padding: 12px;
  border-radius: 12px;
  background: #fdecea;
  color: #7a1810;
}

.ad-grid {
  display: grid;
  gap: 16px;
}

@media (min-width: 1100px) {
  .ad-grid {
    grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    align-items: start;
  }

  /* sticky with the page's own scroll: santri, money and the latest stay beside whatever is being read
     (top from useStickySide: a tall column scrolls along until its bottom shows, then stays) */
  .ad-side {
    position: sticky;
    top: var(--side-top, 16px);
  }
}

.ad-col {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.ad-card {
  padding: 18px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 12px 28px -24px rgba(3, 41, 29, 0.45);
  min-width: 0;
}

.ad-title {
  margin: 0 0 12px;
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--ink);
}

.ad-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.ad-link {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--emerald);
  text-decoration: none;
  white-space: nowrap;
}

.ad-link:hover {
  text-decoration: underline;
}

/* 1. actions */
.ad-actions {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.ad-action {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 12px;
  border-radius: 14px;
  background: #f6f9f7;
  border: 1px solid transparent;
  color: var(--ink);
  text-decoration: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.ad-action:hover {
  border-color: rgba(10, 92, 64, 0.25);
  background: #f1f7f3;
}

.ad-action-count {
  flex: none;
  display: grid;
  place-items: center;
  min-width: 42px;
  height: 42px;
  padding: 0 8px;
  border-radius: 12px;
  font-size: 1.15rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.ad-action.is-urgent .ad-action-count { background: #b45309; color: #fff; }
.ad-action.is-warn .ad-action-count { background: #fef3c7; color: #7c3a0d; }
.ad-action.is-info .ad-action-count { background: #e6eeea; color: #3b4a42; }

.ad-action-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-weight: 600;
}

.ad-action-text small {
  font-weight: 500;
  color: var(--muted);
}

.ad-go {
  font-size: 1.4rem;
  color: var(--emerald);
}

.ad-allgood {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: #eef6f1;
}

.ad-allgood p {
  margin: 0;
  color: #0a4a34;
}

.ad-allgood-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--emerald);
  color: #fcd34d;
}

/* 2. today */
.ad-off {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: #fffbeb;
  color: #7c3a0d;
}

.ad-off p {
  margin: 0;
  font-weight: 700;
}

.ad-sesi-grid {
  display: grid;
  gap: 14px;
}

@media (min-width: 640px) {
  .ad-sesi-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.ad-sesi-name {
  margin: 0 0 6px;
  font-weight: 800;
}

.ad-sesi-name small {
  font-weight: 600;
  color: var(--muted);
}

.ad-stack {
  display: flex;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--none);
}

.ad-stack.is-thin {
  height: 8px;
  margin: 6px 0;
}

.ad-stack span { height: 100%; }
.ad-stack .is-hadir { background: var(--hadir); }
.ad-stack .is-izin { background: var(--izin); }
.ad-stack .is-sakit { background: var(--sakit); }
.ad-stack .is-alfa { background: var(--alfa); }
.ad-stack .is-none { background: var(--none); }

.ad-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.82rem;
  color: var(--body);
}

.ad-legend strong {
  font-variant-numeric: tabular-nums;
}

.ad-legend .is-hadir strong { color: var(--hadir); }
.ad-legend .is-izin strong { color: var(--izin); }
.ad-legend .is-sakit strong { color: var(--sakit); }
.ad-legend .is-alfa strong { color: var(--alfa); }

.ad-note {
  margin: 6px 0 0;
  font-size: 0.8rem;
  color: var(--izin);
}

.ad-note.is-warn {
  color: #7c3a0d;
}

.ad-minis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.ad-mini {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f6f9f7;
  color: var(--ink);
  text-decoration: none;
}

.ad-mini-label,
.ad-kpi-label {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.ad-mini strong {
  font-size: 1.05rem;
}

.ad-mini strong small {
  font-size: 0.8rem;
  color: var(--muted);
}

.ad-mini-sub {
  font-size: 0.8rem;
  color: var(--body);
}

.ad-mini-sub.is-bad {
  color: var(--alfa);
  font-weight: 700;
}

/* 4. month */
.ad-month {
  display: grid;
  gap: 12px;
}

@media (min-width: 640px) {
  .ad-month {
    grid-template-columns: 1fr 1fr;
  }
}

.ad-kpi {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f6f9f7;
  color: var(--ink);
  text-decoration: none;
}

.ad-kpi-num {
  font-size: 2rem;
  line-height: 1.1;
  font-weight: 800;
  color: var(--emerald);
  font-variant-numeric: tabular-nums;
}

.ad-kpi-num small {
  font-size: 1rem;
}

.ad-kpi-sub {
  font-size: 0.8rem;
  color: var(--body);
}

.ad-meter {
  display: block;
  height: 8px;
  margin: 6px 0;
  border-radius: 999px;
  background: #e2ebe6;
  overflow: hidden;
}

.ad-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--emerald);
}

.ad-meter.is-gold span {
  background: #d4a017;
}

.ad-funnel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px dashed rgba(180, 83, 9, 0.35);
  color: var(--ink);
  text-decoration: none;
}

.ad-funnel-title {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gold);
}

.ad-funnel-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-size: 0.86rem;
  color: var(--body);
}

.ad-funnel-steps strong {
  font-size: 1.05rem;
  color: var(--ink);
}

.ad-funnel-steps .is-done strong {
  color: var(--emerald);
}

/* 3. santri */
.ad-big {
  margin: 0 0 12px;
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1;
  color: var(--emerald);
  font-variant-numeric: tabular-nums;
}

.ad-big small {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted);
}

.ad-bars {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
}

.ad-bars li {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
}

.ad-bar-label {
  color: var(--body);
}

.ad-bar-track {
  height: 10px;
  border-radius: 999px;
  background: #eef2ef;
  overflow: hidden;
}

.ad-bar-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0a5c40, #2f9a6b);
}

.ad-bar-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ad-progress {
  display: grid;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.ad-prog {
  display: flex;
  flex-direction: column;
  color: var(--ink);
  text-decoration: none;
}

.ad-prog-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  font-weight: 700;
}

.ad-prog small {
  font-size: 0.78rem;
  color: var(--muted);
}

/* 5. money, kegiatan */
.ad-money {
  display: flex;
  flex-direction: column;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(150deg, #0a5c40, #053d2c);
  color: #fff;
  text-decoration: none;
}

.ad-money .ad-kpi-label {
  color: rgba(209, 250, 229, 0.8);
}

.ad-money strong {
  font-size: 1.7rem;
  font-weight: 800;
  color: #fcd34d;
  font-variant-numeric: tabular-nums;
}

.ad-money small {
  color: rgba(209, 250, 229, 0.85);
}

.ad-keg {
  margin-top: 14px;
}

.ad-keg-row {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  border-top: 1px solid var(--line);
  color: var(--ink);
  text-decoration: none;
}

.ad-keg-row span {
  font-size: 0.8rem;
  color: var(--muted);
}

.ad-ann {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--emerald);
  text-decoration: none;
}

.ad-muted {
  margin: 4px 0 0;
  font-size: 0.86rem;
  color: var(--muted);
}

/* 6. feed */
.ad-feed {
  margin: 0;
  padding: 0;
  list-style: none;
}

.ad-feed-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  text-decoration: none;
  font-size: 0.88rem;
}

.ad-feed li:last-child .ad-feed-row {
  border-bottom: 0;
}

.ad-feed-dot {
  flex: none;
  width: 9px;
  height: 9px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--muted);
}

.ad-feed-dot.is-daftar { background: var(--gold); }
.ad-feed-dot.is-diterima { background: var(--emerald); }
.ad-feed-dot.is-izin { background: var(--izin); }
.ad-feed-dot.is-data { background: #8a6bd1; }

.ad-feed-text {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.ad-feed-time {
  flex: none;
  font-size: 0.76rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.ad-action:focus-visible,
.ad-mini.is-link:focus-visible,
.ad-kpi.is-link:focus-visible,
.ad-funnel:focus-visible,
.ad-prog:focus-visible,
.ad-money:focus-visible,
.ad-keg-row:focus-visible,
.ad-feed-row:focus-visible,
.ad-link:focus-visible,
.ad-ann:focus-visible,
.ad-refresh:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
  border-radius: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .ad-action {
    transition: none;
  }
}
</style>
