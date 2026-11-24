<template>
  <div>
    <router-link to="/wali" class="w-link back-link">← Beranda</router-link>

    <PageSkeleton v-if="loading && !data" :rows="4" label="Memuat kegiatan ananda" />
    <p v-else-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else-if="data">
      <h1 class="w-title">Kegiatan &amp; tabungan</h1>
      <p class="w-lead sub">{{ data.santri.name }} · {{ levelName(data.santri.classId) }}</p>

      <h2 class="w-section-title">Kegiatan ananda</h2>
      <p v-if="!data.activities.length" class="w-card empty">Ananda belum terdaftar di kegiatan TPQ (munaqosyah, wisuda, dan lainnya). Bila ada, informasinya muncul di sini.</p>

      <article v-for="k in data.activities" :key="k.id" class="w-card kegiatan" :class="{ 'is-closed': k.closed }">
        <div class="k-head">
          <div>
            <strong class="k-title">{{ k.title }}</strong>
            <span class="k-sub">{{ k.typeLabel }}<template v-if="k.date"> · {{ dayLabel(k.date) }}</template></span>
          </div>
          <span class="w-pill" :class="`is-${k.closed ? 'idle' : (STATUS_TONE[k.status] || 'info')}`">{{ k.closed ? 'Selesai' : k.statusLabel }}</span>
        </div>
        <p v-if="k.description" class="k-desc">{{ k.description }}</p>

        <div v-if="k.payment.state !== 'gratis'" class="k-block">
          <span class="k-label">Pembayaran</span>
          <span class="w-pill" :class="`is-${PAYMENT_TONE[k.payment.state]}`">{{ k.payment.label }}</span>
          <span class="k-line">{{ waliPaymentLine(k.payment) }}</span>
        </div>
        <p v-else class="k-line">Kegiatan ini tanpa biaya.</p>

        <div v-if="k.requirements.length" class="k-block">
          <span class="k-label">Persyaratan · {{ doneCount(k) }} dari {{ k.requirements.length }} lengkap</span>
          <ul class="k-reqs">
            <li v-for="r in k.requirements" :key="r.id" :class="{ done: r.done }">
              <span class="k-mark" aria-hidden="true">{{ r.done ? '✓' : '○' }}</span>
              {{ r.label }}<span class="sr-only">{{ r.done ? ' (sudah)' : ' (belum)' }}</span>
            </li>
          </ul>
          <p v-if="doneCount(k) < k.requirements.length && !k.closed" class="w-help">Hubungi ustadz/ustadzah untuk melengkapi persyaratan yang belum.</p>
        </div>

        <div v-if="k.updates && k.updates.length" class="k-block k-updates">
          <div class="k-upd-bar">
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
            Lihat semua info kegiatan ({{ k.updateCount || k.updates.length }}) ›
          </router-link>
        </div>
      </article>

      <h2 class="w-section-title">Tabungan ananda</h2>
      <p v-if="!data.savings.length" class="w-card empty">Belum ada setoran tabungan atas nama ananda.</p>
      <article v-for="t in data.savings" :key="t.bookId" class="w-card tabungan">
        <div class="k-head">
          <div>
            <strong class="k-title">{{ t.title }}</strong>
            <span class="k-sub">{{ t.count }} kali setoran<template v-if="t.closed"> · buku sudah ditutup</template></span>
          </div>
        </div>
        <p class="t-total">{{ formatRupiah(t.total) }}</p>
        <ul class="t-list">
          <li v-for="(i, n) in t.recent" :key="n"><span>{{ shortDay(i.date) }}</span><strong>{{ formatRupiah(i.amount) }}</strong></li>
        </ul>
        <p v-if="t.count > t.recent.length" class="w-help">Menampilkan {{ t.recent.length }} setoran terbaru.</p>
      </article>

      <p class="w-help foot">Data dari catatan ustadz/ustadzah. Bila ada yang keliru, hubungi pengajar ananda.</p>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { PAYMENT_TONE, STATUS_TONE, dayLabel, formatRupiah, paymentLine } from '@/utils/kegiatan'
import { formatWibDateTime, renderWaMarkdownHtml } from '@/utils/waFormat'

const route = useRoute()
const data = ref(null)
const loading = ref(true)
const loadError = ref('')

// "Lunas" is already the label next to it: say what it rests on instead of repeating it
const waliPaymentLine = (p) => (p.state === 'lunas'
  ? (p.manual ? `Biaya ${formatRupiah(p.fee)} sudah dicatat lunas oleh pengurus TPQ.` : `Setoran tabungan sudah memenuhi biaya ${formatRupiah(p.fee)}.`)
  : paymentLine(p))
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const doneCount = (k) => k.requirements.filter((r) => r.done).length
const shortDay = (iso) => (iso ? dayLabel(new Date(new Date(iso).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10)) : '')

onMounted(async () => {
  try {
    data.value = (await api.get(`/wali/santri/${route.params.santriId}/kegiatan`, { cache: false })).data
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Belum bisa dimuat. Periksa koneksi lalu muat ulang.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.back-link {
  display: inline-block;
  margin: -4px 0 6px;
  text-decoration: none;
}

.sub {
  margin-bottom: 4px;
}

.empty {
  margin: 0;
  color: #475a50;
  line-height: 1.5;
}

.kegiatan,
.tabungan {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kegiatan.is-closed {
  opacity: 0.85;
}

.k-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.k-title {
  display: block;
  font-size: 1.1rem;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.k-sub {
  display: block;
  font-size: 0.85rem;
  color: #5b6b62;
}

.k-desc,
.k-line {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: #475a50;
}

.k-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(11, 59, 42, 0.1);
}

.k-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #5b6b62;
}

.k-reqs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
  width: 100%;
}

.k-reqs li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  background: #f6f4ee;
  color: #475a50;
}

.k-reqs li.done {
  background: #e3f1ea;
  color: #0a5c40;
  font-weight: 600;
}

.k-mark {
  width: 18px;
  text-align: center;
  font-weight: 800;
}

.k-updates {
  width: 100%;
}

.k-upd-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.k-upd-preview {
  display: grid;
  gap: 6px;
  width: 100%;
  padding: 11px 12px;
  border-radius: 12px;
  background: #f5f9f6;
  border: 1px solid rgba(11, 59, 42, 0.12);
  box-sizing: border-box;
}

.k-upd-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #5b6b62;
}

.k-upd-body {
  font-size: 0.92rem;
  line-height: 1.55;
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
  min-height: 42px;
  padding: 6px 12px;
  border-radius: 10px;
  background: #e3f1ea;
  border: 1px solid rgba(10, 92, 64, 0.25);
  color: #0a5c40;
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
  box-sizing: border-box;
}

.k-wa-link:hover {
  background: #d2eadf;
}

.wa-rich :deep(.wa-line) { min-height: 1.2em; }
.wa-rich :deep(.wa-gap) { height: 8px; }
.wa-rich :deep(.wa-quote) {
  margin: 4px 0;
  padding: 4px 10px;
  border-left: 3px solid #0a5c40;
  border-radius: 4px;
  background: rgba(10, 92, 64, 0.07);
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

.t-total {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #0a5c40;
}

.t-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.t-list li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid rgba(11, 59, 42, 0.1);
  font-size: 0.92rem;
  color: #475a50;
}

.t-list strong {
  color: #0b3b2a;
  font-variant-numeric: tabular-nums;
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
