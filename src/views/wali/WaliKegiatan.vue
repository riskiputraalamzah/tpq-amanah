<template>
  <div>
    <router-link to="/wali" class="w-back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
      Beranda
    </router-link>

    <WaliChildSwitch :active-id="santriId" section="kegiatan" />

    <PageSkeleton v-if="loading && !data" :rows="4" label="Memuat kegiatan ananda" />
    <p v-else-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else-if="data">
      <header class="kg-head">
        <h1 class="w-title">Kegiatan &amp; tabungan</h1>
        <div class="kg-who">
          <strong>{{ data.santri.name }}</strong>
          <span class="kg-level">{{ levelName(data.santri.classId) }}</span>
        </div>
      </header>

      <h2 class="w-section-title">Kegiatan ananda</h2>
      <p v-if="!data.activities.length" class="w-card empty">Ananda belum terdaftar di kegiatan TPQ (munaqosyah, wisuda, dan lainnya). Bila ada, informasinya muncul di sini.</p>

      <article v-for="k in data.activities" :key="k.id" class="w-card kegiatan" :class="{ 'is-closed': k.closed }">
        <div class="k-head">
          <div class="k-head-text">
            <strong class="k-title">{{ k.title }}</strong>
            <span class="k-sub">{{ k.typeLabel }}<template v-if="k.date"> · {{ dayLabel(k.date) }}</template></span>
          </div>
          <span class="w-pill" :class="`is-${k.closed ? 'idle' : (STATUS_TONE[k.status] || 'info')}`">{{ k.closed ? 'Selesai' : k.statusLabel }}</span>
        </div>
        <p v-if="k.description" class="k-desc">{{ k.description }}</p>

        <div v-if="k.payment.state !== 'gratis'" class="k-block">
          <div class="k-bar">
            <span class="k-label">Pembayaran</span>
            <span class="w-pill" :class="`is-${PAYMENT_TONE[k.payment.state]}`">{{ k.payment.label }}</span>
          </div>
          <span class="k-line">{{ waliPaymentLine(k.payment) }}</span>
        </div>
        <p v-else class="k-line k-free">Kegiatan ini tanpa biaya.</p>

        <div v-if="k.requirements.length" class="k-block">
          <div class="k-bar">
            <span class="k-label">Persyaratan</span>
            <span class="k-req-count">{{ doneCount(k) }} dari {{ k.requirements.length }} lengkap</span>
          </div>
          <ul class="k-reqs">
            <li v-for="r in k.requirements" :key="r.id" :class="{ done: r.done }">
              <span class="k-mark" aria-hidden="true">
                <svg v-if="r.done" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8" /></svg>
              </span>
              <span>{{ r.label }}</span><span class="sr-only">{{ r.done ? ' (sudah)' : ' (belum)' }}</span>
            </li>
          </ul>
          <p v-if="doneCount(k) < k.requirements.length && !k.closed" class="w-help">Hubungi ustadz/ustadzah untuk melengkapi persyaratan yang belum.</p>
        </div>

        <div v-if="k.updates && k.updates.length" class="k-block k-updates">
          <div class="k-bar">
            <span class="k-label">Info terbaru kegiatan</span>
            <span class="w-pill is-ok">{{ k.updateCount || k.updates.length }} info</span>
          </div>
          <div class="k-upd-preview">
            <div class="k-upd-meta">
              <span>{{ formatWibDateTime(k.updates[0].createdAt) }}</span>
              <span v-if="k.updates[0].createdByName">· {{ k.updates[0].createdByName }}</span>
            </div>
            <div class="k-upd-body k-upd-clamp wa-rich" v-html="renderWaMarkdownHtml(k.updates[0].body)"></div>
          </div>
          <router-link :to="`/wali/santri/${route.params.santriId}/kegiatan/${k.id}/info`" class="k-wa-link">
            <span>Lihat semua info kegiatan ({{ k.updateCount || k.updates.length }})</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </router-link>
        </div>
      </article>

      <h2 class="w-section-title">Tabungan ananda</h2>
      <p v-if="!data.savings.length" class="w-card empty">Belum ada setoran tabungan atas nama ananda.</p>
      <article v-for="t in data.savings" :key="t.bookId" class="w-card tabungan">
        <div class="t-summary">
          <div class="t-summary-top">
            <strong class="k-title">{{ t.title }}</strong>
            <span class="k-sub">{{ t.count }} kali setoran<template v-if="t.closed"> · buku sudah ditutup</template></span>
          </div>
          <p class="t-total">{{ formatRupiah(t.total) }}</p>
        </div>
        <ul class="t-list">
          <li v-for="(i, n) in t.recent" :key="n"><span>{{ shortDay(i.date) }}</span><strong>{{ formatRupiah(i.amount) }}</strong></li>
        </ul>
        <p v-if="t.count > t.recent.length" class="w-help t-more">Menampilkan {{ t.recent.length }} setoran terbaru.</p>
      </article>

      <p class="w-help foot">Data dari catatan ustadz/ustadzah. Bila ada yang keliru, hubungi pengajar ananda.</p>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageSkeleton from '@/components/PageSkeleton.vue'
import WaliChildSwitch from './WaliChildSwitch.vue'
import { PAYMENT_TONE, STATUS_TONE, dayLabel, formatRupiah, paymentLine } from '@/utils/kegiatan'
import { formatWibDateTime, renderWaMarkdownHtml } from '@/utils/waFormat'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'

const route = useRoute()
// shown at once from the last visit, refreshed in the background (utils/waliCache.js)
const santriId = route.params.santriId
const res = useWaliResource(() => WALI_KEYS.kegiatan(santriId), () => waliFetch.kegiatan(santriId))
const data = computed(() => res.data.value)
const loading = computed(() => res.loading.value)
const loadError = computed(() => res.error.value)

// "Lunas" is already the label next to it: say what it rests on instead of repeating it
const waliPaymentLine = (p) => (p.state === 'lunas'
  ? (p.manual ? `Biaya ${formatRupiah(p.fee)} sudah dicatat lunas oleh pengurus TPQ.` : `Setoran tabungan sudah memenuhi biaya ${formatRupiah(p.fee)}.`)
  : paymentLine(p))
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const doneCount = (k) => k.requirements.filter((r) => r.done).length
const shortDay = (iso) => (iso ? dayLabel(new Date(new Date(iso).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10)) : '')
</script>

<style scoped>
.kg-head {
  margin-bottom: 6px;
}

.kg-who {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.kg-who strong {
  font-size: 0.96rem;
  font-weight: 700;
  color: var(--w-body);
}

.kg-level {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-size: 0.76rem;
  font-weight: 800;
}

.empty {
  margin: 0;
  color: var(--w-body);
  line-height: 1.5;
}

.kegiatan {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kegiatan.is-closed {
  opacity: 0.86;
}

.k-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.k-head-text {
  min-width: 0;
}

.k-title {
  display: block;
  font-size: 1.08rem;
  font-weight: 800;
  line-height: 1.25;
  color: var(--w-ink);
  overflow-wrap: anywhere;
}

.k-sub {
  display: block;
  margin-top: 2px;
  font-size: 0.84rem;
  color: var(--w-muted);
}

.k-desc,
.k-line {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--w-body);
}

.k-free {
  padding-top: 10px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.k-block {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.k-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.k-label {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--w-ink);
}

.k-req-count {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--w-muted);
  font-variant-numeric: tabular-nums;
}

.k-reqs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.k-reqs li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 6px 12px;
  border-radius: 10px;
  background: #f6f4ee;
  font-size: 0.9rem;
  color: var(--w-body);
}

.k-reqs li.done {
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-weight: 700;
}

.k-mark {
  flex: none;
  display: grid;
  place-items: center;
}

.k-upd-preview {
  display: grid;
  gap: 5px;
  padding: 11px 12px;
  border-radius: 12px;
  background: #f4f8f5;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.k-upd-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--w-muted);
}

.k-upd-body {
  font-size: 0.9rem;
  line-height: 1.52;
  color: #163024;
  overflow-wrap: anywhere;
}

.k-upd-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.k-wa-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 44px;
  padding: 6px 12px;
  border-radius: 11px;
  background: var(--w-emerald-soft);
  border: 1px solid rgba(10, 92, 64, 0.22);
  color: var(--w-emerald);
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
  box-sizing: border-box;
  transition: background-color 0.15s ease;
}

.k-wa-link:hover {
  background: #d5ebdf;
}

.k-wa-link:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: 2px;
}

.wa-rich :deep(.wa-line) { min-height: 1.2em; }
.wa-rich :deep(.wa-gap) { height: 8px; }
.wa-rich :deep(.wa-quote) {
  margin: 4px 0;
  padding: 6px 10px;
  border: 1px solid rgba(10, 92, 64, 0.18);
  border-radius: 8px;
  background: rgba(10, 92, 64, 0.06);
}
.wa-rich :deep(.wa-li) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.wa-rich :deep(.wa-li-mark) {
  flex: none;
  font-weight: 700;
}
.wa-rich :deep(.wa-mono) {
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(11, 59, 42, 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85em;
}
.wa-rich :deep(.wa-link) {
  color: #027eb5;
  text-decoration: underline;
}

/* Tabungan card with dedicated balance header */
.tabungan {
  padding: 0;
  overflow: hidden;
}

.t-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: #f3f8f5;
  border-bottom: 1px solid rgba(11, 59, 42, 0.09);
}

.t-summary-top {
  display: flex;
  flex-direction: column;
}

.t-total {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 800;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  color: var(--w-emerald);
}

.t-list {
  list-style: none;
  margin: 0;
  padding: 4px 16px 8px;
}

.t-list li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 0;
  font-size: 0.9rem;
  color: var(--w-body);
}

.t-list li + li {
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.t-list strong {
  color: var(--w-ink);
  font-variant-numeric: tabular-nums;
}

.t-more {
  margin: 0;
  padding: 0 16px 12px;
}

.foot {
  display: block;
  margin-top: 16px;
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
</style>
