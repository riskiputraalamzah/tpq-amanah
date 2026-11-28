<template>
  <!-- Kartu Prestasi to print / save as PDF: A4 portrait with the columns of the paper card (user decision 2026-11-28) -->
  <div class="kc-page">
    <div class="kc-tools no-print">
      <router-link :to="`/wali/santri/${santriId}/prestasi`" class="w-back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        Kartu prestasi
      </router-link>
      <button type="button" class="w-btn w-btn-primary" :disabled="!data" @click="print">Cetak / Simpan PDF</button>
      <p class="w-help">Pilih "Simpan sebagai PDF" di jendela cetak untuk menyimpan ke HP. Ukuran kertas A4 tegak.</p>
    </div>

    <PageSkeleton v-if="loading" :rows="4" label="Menyiapkan kartu" />
    <p v-else-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

    <article v-else-if="data" class="kc-sheet">
      <header class="kc-head">
        <img src="/logo.png" alt="" class="kc-logo" />
        <div class="kc-title">
          <strong>KARTU PRESTASI SANTRI</strong>
          <span>TPQ Amanah · Sawotratap, Sidoarjo</span>
        </div>
        <div class="kc-legend">Kriteria nilai<br /><b>A</b> 8,6–10 · <b>B</b> 7,6–8,5 · <b>C</b> ≤ 7,5</div>
      </header>

      <dl class="kc-meta">
        <div><dt>Nama</dt><dd>{{ data.santri.name }}</dd></div>
        <div><dt>Jilid</dt><dd>{{ levelName(data.santri.classId) || '-' }}</dd></div>
        <div><dt>No. Induk</dt><dd>{{ data.santri.nomorInduk || '-' }}</dd></div>
        <div><dt>Bulan</dt><dd>{{ monthLabel(data.month) }}</dd></div>
        <div><dt>Wali</dt><dd>{{ waliName || '-' }}</dd></div>
        <div><dt>Jumlah tes</dt><dd>{{ data.stats.count }}× ({{ data.stats.lanjut }} lanjut, {{ data.stats.ulang }} ulang)</dd></div>
      </dl>

      <table class="kc-table">
        <thead>
          <tr>
            <th class="c-no">No</th>
            <th class="c-date">Tanggal</th>
            <th class="c-jilid">Jilid / Surat</th>
            <th class="c-page">Halaman / Ayat</th>
            <th class="c-score">Nilai</th>
            <th>Keterangan</th>
            <th class="c-guru">Ustadz / ah</th>
            <th class="c-wali">Paraf wali</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, i) in rows" :key="t.id">
            <td class="c-no">{{ i + 1 }}</td>
            <td class="c-date">{{ dayLabel(t.date) }}</td>
            <td class="c-jilid">{{ t.kind === 'jilid' ? t.jilid : (t.kind === 'hafalan' ? 'Hafalan ' : '') + t.surahName }}</td>
            <td class="c-page">{{ t.kind === 'jilid' ? t.page : ayat(t) }}</td>
            <td class="c-score">{{ t.grade ? `${t.scoreText} ${t.grade}` : '' }}</td>
            <td>{{ t.result === 'lanjut' ? 'Lanjut' : 'Ulang' }}<template v-if="t.notes"> · {{ t.notes }}</template></td>
            <td class="c-guru">
              <span class="kc-sig">
                <SignatureImage v-if="data.signatures[t.guruId]" :sig="data.signatures[t.guruId]" :width="34" :height="17" :stroke="4" />
                <span>{{ t.guruName }}</span>
              </span>
            </td>
            <td class="c-wali">
              <SignatureImage v-if="t.signed && t.sign && data.signatures[t.sign.waliId]" :sig="data.signatures[t.sign.waliId]" :width="46" :height="20" color="#111" :stroke="4" />
              <span v-else-if="t.signed" class="kc-check">✓ {{ t.sign?.name || '' }}</span>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="8" class="kc-none">Belum ada tes di bulan ini.</td>
          </tr>
        </tbody>
      </table>

      <footer class="kc-foot">
        <span>Dicetak dari portal wali TPQ Amanah, {{ printedAt }}. Setiap paraf tercatat atas akun dan waktunya.</span>
      </footer>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageSkeleton from '@/components/PageSkeleton.vue'
import SignatureImage from '@/components/signature/SignatureImage.vue'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'
import { dayLabel, monthLabel } from '@/utils/kps'

const route = useRoute()
const santriId = route.params.santriId
const month = String(route.query.month || '')
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : '')
const ayat = (t) => (t.ayatTo && t.ayatTo !== t.ayatFrom ? `${t.ayatFrom}-${t.ayatTo}` : `${t.ayatFrom}`)

const res = useWaliResource(() => WALI_KEYS.prestasi(santriId, month), () => waliFetch.prestasi(santriId, month))
const data = computed(() => res.data.value)
const loading = computed(() => res.loading.value)
const loadError = computed(() => res.error.value)
// oldest first, like a paper card filled day by day
const rows = computed(() => [...(data.value?.tests || [])].reverse())
// the parent's name (from the shared store: instant when Beranda was opened before)
const me = useWaliResource(() => WALI_KEYS.me, () => waliFetch.me())
const waliName = computed(() => me.data.value?.wali?.name || '')
const printedAt = (() => {
  const d = new Date(Date.now() + 7 * 3600 * 1000)
  return `${d.getUTCDate()} ${monthLabel(d.toISOString().slice(0, 7))}`
})()
const print = () => window.print()
</script>

<style scoped>
.kc-page { display: grid; gap: 14px; }
.kc-tools { display: grid; gap: 8px; }
.kc-sheet {
  padding: 18px 16px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid var(--w-line);
  color: #111;
  overflow-x: auto;
}
.kc-head { display: flex; align-items: center; gap: 12px; padding-bottom: 10px; border-bottom: 2.5px solid #0a5c40; }
.kc-logo { width: 46px; height: 46px; object-fit: contain; }
.kc-title { flex: 1; display: grid; gap: 2px; }
.kc-title strong { font-size: 1.05rem; letter-spacing: 0.04em; color: #053d2c; }
.kc-title span { font-size: 0.8rem; font-weight: 600; }
.kc-legend { font-size: 0.7rem; color: #444; text-align: right; line-height: 1.5; }
.kc-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 20px;
  margin: 12px 0;
  font-size: 0.8rem;
}
.kc-meta div { display: flex; gap: 6px; }
.kc-meta dt { width: 72px; flex: none; color: #444; }
.kc-meta dt::after { content: ':'; }
.kc-meta dd { margin: 0; font-weight: 700; }
.kc-table { width: 100%; min-width: 640px; border-collapse: collapse; font-size: 0.74rem; }
.kc-table th { padding: 6px 4px; background: #0a5c40; color: #fff; border: 1px solid #0a5c40; font-weight: 700; }
.kc-table td { padding: 4px 5px; border: 1px solid #999; vertical-align: middle; height: 26px; }
.c-no, .c-jilid, .c-page, .c-score { text-align: center; }
.c-no { width: 26px; }
.c-date { width: 86px; }
.c-score { width: 52px; font-weight: 700; }
.c-guru { width: 104px; }
.c-wali { width: 66px; text-align: center; }
.kc-sig { display: flex; align-items: center; gap: 4px; font-size: 0.68rem; }
.kc-check { font-size: 0.66rem; font-weight: 700; color: #0a5c40; }
.kc-none { text-align: center; color: #555; }
.kc-foot { margin-top: 12px; font-size: 0.7rem; color: #444; }
</style>

<style>
/* Printing: only the card, A4 portrait */
@media print {
  @page { size: A4 portrait; margin: 12mm; }
  html, body, .wali-shell, .wali-main { background: #fff !important; }
  .wali-bar, .no-print, nav, .mc-nav { display: none !important; }
  .wali-main { padding: 0 !important; max-width: none !important; }
  .kc-sheet { border: 0 !important; padding: 0 !important; overflow: visible !important; }
  .kc-table { min-width: 0 !important; }
  .kc-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
