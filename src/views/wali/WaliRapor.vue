<template>
  <div>
    <PageSkeleton v-if="loading" :rows="5" label="Memuat rapor" />
    <div v-else-if="loadError" class="w-card w-center">
      <p class="w-note is-danger" role="alert">{{ loadError }}</p>
      <router-link to="/wali" class="w-btn w-btn-ghost">Kembali ke beranda</router-link>
    </div>

    <template v-else>
      <router-link to="/wali" class="w-back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        Beranda
      </router-link>

      <WaliChildSwitch :active-id="santriId" section="rapor" />

      <header class="rp-page-head">
        <h1 class="w-title">Rapor &amp; riwayat jilid</h1>
        <div class="rp-who">
          <strong>{{ data.santri.name }}</strong>
          <span class="rp-level">{{ levelName(data.santri.classId) || 'Belum ada jilid' }}</span>
        </div>
      </header>

      <!-- the published rapor (Laporan Perkembangan Santri), newest first -->
      <h2 class="w-section-title">Rapor</h2>
      <div v-if="!published.length" class="w-card w-center empty">
        <p class="w-help">Rapor ananda muncul di sini setelah diterbitkan TPQ. Ayah/Bunda akan dikabari lewat WhatsApp.</p>
      </div>
      <router-link v-for="r in published" :key="r.periodId" :to="`/wali/santri/${santriId}/rapor/${r.periodId}`" class="w-card rr">
        <div class="rr-top">
          <div class="rr-text">
            <strong>{{ r.name }}</strong>
            <span>{{ levelName(r.classId) }}<template v-if="r.publishedAt"> · terbit {{ shortDate(r.publishedAt.slice(0, 10)) }}</template></span>
          </div>
          <div class="rp-avg" :aria-label="`Rata-rata ${fmtN(r.average)}`">
            <strong>{{ fmtN(r.average) }}</strong>
            <span>{{ r.grade ? `kriteria ${r.grade}` : 'rata-rata' }}</span>
          </div>
        </div>
        <div class="rr-meta">
          <span v-if="r.rank" class="rr-chip">Ranking {{ r.rank }} dari {{ r.rankOf }}</span>
          <span v-if="r.decisionText" class="rr-chip is-dec">{{ r.decisionText }}</span>
          <span class="rr-chip" :class="r.signed ? 'is-ok' : 'is-warn'">{{ r.signed ? '✓ Sudah ditandatangani' : 'Belum ditandatangani' }}</span>
        </div>
        <span class="rr-open">Lihat rapor lengkap ›</span>
      </router-link>

      <!-- riwayat jilid inside a structured card -->
      <h2 class="w-section-title">Riwayat jilid</h2>
      <section class="w-card jl-card" aria-label="Riwayat jilid">
        <ol class="jl">
          <li v-for="j in data.jilid" :key="j.classId" :class="{ 'is-current': j.current }">
            <span class="jl-dot" aria-hidden="true">{{ j.classId === '7' ? 'M' : j.classId }}</span>
            <span class="jl-text">
              <strong>{{ levelName(j.classId) }}<span v-if="j.current" class="jl-now">Sekarang</span></strong>
              <span>{{ j.since ? `Sejak ${longDate(j.since)}` : 'Jilid saat ini' }}</span>
            </span>
          </li>
        </ol>
        <p class="w-help jl-help">Tanggal diambil dari catatan KBM dan perubahan jilid oleh admin.</p>
      </section>

      <!-- the old free-form Penilaian (before the Rapor module): only when there is some -->
      <h2 v-if="data.rapor.length" class="w-section-title">Penilaian sebelumnya</h2>
      <article v-for="p in data.rapor" :key="p.id" class="w-card rp">
        <header class="rp-head">
          <div class="rp-head-text">
            <h3 class="rp-name">{{ p.name }}</h3>
            <p v-if="p.startDate || commonGuru(p)" class="rp-dates">
              <template v-if="p.startDate">{{ shortDate(p.startDate) }} - {{ shortDate(p.endDate) }}</template>
              <template v-if="p.startDate && commonGuru(p)"> · </template>
              <template v-if="commonGuru(p)">{{ commonGuru(p) }}</template>
            </p>
            <p v-if="p.running" class="rp-run">Periode masih berjalan, nilai bisa bertambah.</p>
          </div>
          <div class="rp-avg" :aria-label="`Rata-rata ${fmt(p.average)} dari 10`">
            <strong>{{ fmt(p.average) }}</strong>
            <span>rata-rata</span>
          </div>
        </header>
        <ul class="rp-list">
          <li v-for="(x, i) in p.items" :key="i" class="rp-item">
            <div class="rp-row">
              <span class="rp-crit">{{ x.criteria }}</span>
              <strong class="rp-score">{{ fmt(x.score) }}</strong>
            </div>
            <span class="rp-bar" aria-hidden="true"><span :style="{ width: `${Math.max(0, Math.min(100, x.score * 10))}%` }"></span></span>
            <span v-if="rowMeta(x, p)" class="rp-note">{{ rowMeta(x, p) }}</span>
          </li>
        </ul>
      </article>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageSkeleton from '@/components/PageSkeleton.vue'
import WaliChildSwitch from './WaliChildSwitch.vue'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'

const route = useRoute()
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : '')
const longDate = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`
const shortDate = (iso) => (iso ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1].slice(0, 3)} ${iso.slice(0, 4)}` : '')
// scores the Indonesian way: 8,5
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(n).replace('.', ','))
const fmtN = (n) => (n === null || n === undefined ? '–' : fmt(n))

// If every criteria in a period was graded by the same teacher, show the teacher once in the header instead of repeating per row
const commonGuru = (p) => {
  const names = [...new Set((p.items || []).map((x) => x.guruName).filter(Boolean))]
  return names.length === 1 ? names[0] : ''
}
const rowMeta = (x, p) => {
  const single = commonGuru(p)
  const parts = []
  if (x.notes) parts.push(x.notes)
  if (x.guruName && x.guruName !== single) parts.push(x.guruName)
  return parts.join(' · ')
}

// shown at once from the last visit, refreshed in the background (utils/waliCache.js)
const santriId = route.params.santriId
const res = useWaliResource(() => WALI_KEYS.rapor(santriId), () => waliFetch.rapor(santriId))
const loading = computed(() => res.loading.value)
const loadError = computed(() => res.error.value)
const data = computed(() => res.data.value)
const published = computed(() => data.value?.published || [])
</script>

<style scoped>
.rr {
  display: grid;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.rr-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rr-text {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.rr-text strong {
  font-size: 1.04rem;
  font-weight: 800;
  color: var(--w-ink);
}

.rr-text span {
  font-size: 0.82rem;
  color: var(--w-muted);
}

.rr-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rr-chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-size: 0.76rem;
  font-weight: 800;
}

.rr-chip.is-dec {
  background: #fef3c7;
  color: #7c3a0d;
}

.rr-chip.is-warn {
  background: #fdf0d9;
  color: #7c3a06;
}

.rr-chip.is-ok {
  background: #dff1e7;
  color: #0a5c40;
}

.rr-open {
  font-size: 0.86rem;
  font-weight: 800;
  color: var(--w-emerald);
}

.rp-page-head {
  margin-bottom: 6px;
}

.rp-who {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.rp-who strong {
  font-size: 0.96rem;
  color: var(--w-body);
  font-weight: 700;
}

.rp-level {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-size: 0.76rem;
  font-weight: 800;
}

.jl-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.jl {
  margin: 0;
  padding: 0;
  list-style: none;
}

.jl li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
}

.jl li:last-child {
  padding-bottom: 0;
}

.jl li:not(:last-child)::after {
  content: "";
  position: absolute;
  left: 17px;
  top: 38px;
  bottom: 0;
  width: 2px;
  background: #cfe1d7;
}

.jl-dot {
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-weight: 800;
}

.jl li.is-current .jl-dot {
  background: var(--w-emerald);
  color: var(--w-gold);
  box-shadow: 0 0 0 4px var(--w-emerald-soft);
}

.jl-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.jl-text strong {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--w-ink);
}

.jl-text > span {
  font-size: 0.84rem;
  color: var(--w-muted);
}

.jl-now {
  padding: 2px 8px;
  border-radius: 999px;
  background: #fef3c7;
  color: #7c3a0d;
  font-size: 0.72rem;
  font-weight: 800;
}

.jl-help {
  margin: 0;
  padding-top: 10px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.empty {
  padding: 18px;
}

.rp {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.rp-head-text {
  min-width: 0;
}

.rp-name {
  margin: 0;
  font-size: 1.04rem;
  font-weight: 800;
  color: var(--w-ink);
}

.rp-dates {
  margin: 3px 0 0;
  font-size: 0.82rem;
  color: var(--w-muted);
}

.rp-run {
  margin: 4px 0 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: #19487f;
}

.rp-avg {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 68px;
  padding: 8px 10px;
  border-radius: 13px;
  background: linear-gradient(150deg, #0a5c40, #053d2c);
  color: #fff;
}

.rp-avg strong {
  font-size: 1.45rem;
  line-height: 1.1;
  color: var(--w-gold);
  font-variant-numeric: tabular-nums;
}

.rp-avg span {
  font-size: 0.7rem;
  color: rgba(209, 250, 229, 0.88);
}

.rp-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rp-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rp-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.rp-crit {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--w-ink);
}

.rp-score {
  font-size: 0.98rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--w-emerald);
}

.rp-bar {
  display: block;
  height: 7px;
  border-radius: 999px;
  background: #e6eee9;
  overflow: hidden;
}

.rp-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0a5c40, #2ea06a);
}

.rp-note {
  font-size: 0.8rem;
  color: var(--w-muted);
}
</style>
