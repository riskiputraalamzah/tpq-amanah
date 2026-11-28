<template>
  <!-- The rapor as on the TPQ's paper form, two A4 portrait pages (print / save as PDF). Read-only. -->
  <div class="rpp" :class="{ 'is-draft': draft }">
    <section class="rpp-page">
      <span v-if="draft" class="rpp-mark" aria-hidden="true">DRAF</span>
      <header class="rpp-head">
        <img src="/logo.png" alt="" class="rpp-logo" />
        <div>
          <strong>LAPORAN PERKEMBANGAN SANTRI</strong>
          <span>TPQ Amanah · Sawotratap, Sidoarjo</span>
        </div>
      </header>
      <dl class="rpp-id">
        <div><dt>Nama</dt><dd>{{ rapor.santriName }}</dd></div>
        <div><dt>Jilid</dt><dd>{{ levelName(rapor.classId) }}</dd></div>
        <div><dt>No. Induk</dt><dd>{{ rapor.nomorInduk || '-' }}</dd></div>
        <div><dt>Tahun</dt><dd>{{ period.tahun || period.name }}</dd></div>
      </dl>

      <table class="rpp-table">
        <thead>
          <tr><th class="c-no">No</th><th>Mata Pelajaran</th><th class="c-n">Angka</th><th class="c-n">Kriteria</th></tr>
        </thead>
        <tbody>
          <tr class="rpp-group"><td colspan="4">A. INTI</td></tr>
          <tr v-for="(s, i) in subjects.inti" :key="s.key">
            <td class="c-no">{{ i + 1 }}</td><td>{{ s.label }}</td><td class="c-n">{{ score(s.key) }}</td><td class="c-n">{{ crit(s.key) }}</td>
          </tr>
          <tr class="rpp-group"><td colspan="4">B. PENUNJANG</td></tr>
          <tr v-for="(s, i) in subjects.penunjang" :key="s.key">
            <td class="c-no">{{ i + 1 }}</td><td>{{ s.label }}</td><td class="c-n">{{ score(s.key) }}</td><td class="c-n">{{ crit(s.key) }}</td>
          </tr>
          <tr class="rpp-total"><td colspan="2">Jumlah Nilai</td><td class="c-n">{{ num(sum.total) }}</td><td></td></tr>
          <tr class="rpp-total"><td colspan="2">Nilai Rata-rata</td><td class="c-n">{{ num(sum.average) }}</td><td class="c-n">{{ sum.grade || '' }}</td></tr>
          <tr class="rpp-total"><td colspan="4">Ranking: <b>{{ rapor.rank || '…' }}</b> dari <b>{{ rapor.rankOf || '…' }}</b> santri</td></tr>
        </tbody>
      </table>
      <p class="rpp-legend">Kriteria: A = 8,6 – 10 · B = 7,6 – 8,5 · C = 7,5 ke bawah</p>

      <div class="rpp-row2">
        <div class="rpp-box">
          <strong>Kehadiran</strong>
          <span>a. Izin : {{ att.izin }} hari</span>
          <span>b. Sakit : {{ att.sakit }} hari</span>
          <span>c. Alpha : {{ att.alpha }} hari</span>
        </div>
        <div class="rpp-box">
          <strong>Keterangan</strong>
          <span>Berdasarkan nilai yang telah diperoleh, maka yang bersangkutan dinyatakan:</span>
          <b class="rpp-decision">{{ rapor.decisionText || '…' }}</b>
        </div>
      </div>
    </section>

    <section class="rpp-page">
      <span v-if="draft" class="rpp-mark" aria-hidden="true">DRAF</span>
      <h2 class="rpp-h2">Ragam Perkembangan</h2>
      <table class="rpp-table rpp-ragam">
        <thead>
          <tr><th class="c-no">I</th><th>Sikap</th><th v-for="[, t] in SIKAP_OPTIONS" :key="t" class="c-n">{{ t }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="[k, label] in SIKAP" :key="k">
            <td class="c-no">{{ k }}</td><td>{{ label }}</td>
            <td v-for="[v] in SIKAP_OPTIONS" :key="v" class="c-n">{{ rapor.sikap?.[k] === v ? '✓' : '' }}</td>
          </tr>
        </tbody>
        <thead>
          <tr><th class="c-no">II</th><th>Sifat</th><th v-for="[, t] in SIFAT_OPTIONS" :key="t" class="c-n">{{ t }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="[k, label] in SIFAT" :key="k">
            <td class="c-no">{{ k }}</td><td>{{ label }}</td>
            <td v-for="[v] in SIFAT_OPTIONS" :key="v" class="c-n">{{ rapor.sifat?.[k] === v ? '✓' : '' }}</td>
          </tr>
        </tbody>
      </table>

      <div class="rpp-note">
        <strong>Catatan / Saran dari Ustadz - Ustadzah</strong>
        <p>{{ rapor.notes || ' ' }}</p>
      </div>
      <div class="rpp-note">
        <strong>Catatan / Saran dari Orang Tua / Wali Santri</strong>
        <p>{{ rapor.wali?.note || ' ' }}</p>
      </div>

      <div class="rpp-signs">
        <div class="rpp-sign">
          <span>&nbsp;</span>
          <span>Orang Tua / Wali Santri</span>
          <SignatureImage v-if="rapor.wali?.sig" :sig="rapor.wali.sig" :width="130" :height="56" color="#111" :stroke="3" />
          <span v-else class="rpp-blank"></span>
          <b>{{ rapor.wali?.name || '(......................)' }}</b>
        </div>
        <div class="rpp-sign">
          <span>{{ period.place || 'Sidoarjo' }}, {{ longDate(period.raporDate) || '..............' }}</span>
          <span>Ustadz / Ustadzah</span>
          <SignatureImage v-if="rapor.teacher?.sig" :sig="rapor.teacher.sig" :width="130" :height="56" :stroke="3" />
          <span v-else class="rpp-blank"></span>
          <b>{{ rapor.teacher?.name || '(......................)' }}</b>
        </div>
      </div>
      <div class="rpp-sign rpp-kepala">
        <span>Mengetahui,</span>
        <span>Kepala TPQ Amanah</span>
        <SignatureImage v-if="rapor.kepala?.sig" :sig="rapor.kepala.sig" :width="130" :height="56" color="#111" :stroke="3" />
        <span v-else class="rpp-blank"></span>
        <b>{{ rapor.kepala?.name || '(......................)' }}</b>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SignatureImage from '@/components/signature/SignatureImage.vue'
import { SIKAP, SIFAT, SIKAP_OPTIONS, SIFAT_OPTIONS, subjectsOf, summaryOf, gradeOf, levelName, num, longDate } from '@/utils/rapor'

const props = defineProps({
  rapor: { type: Object, required: true },
  period: { type: Object, required: true },
  attendanceAuto: { type: Object, default: null },
  draft: { type: Boolean, default: false },
})
const subjects = computed(() => subjectsOf(props.period))
const sum = computed(() => summaryOf(props.rapor.scores || {}, props.period))
const att = computed(() => props.rapor.attendance || props.attendanceAuto || { izin: 0, sakit: 0, alpha: 0 })
const raw = (k) => props.rapor.scores?.[k]
const score = (k) => (raw(k) === null || raw(k) === undefined ? '-' : num(raw(k)))
const crit = (k) => (raw(k) === null || raw(k) === undefined ? '' : gradeOf(raw(k)))
</script>

<style scoped>
.rpp { display: grid; gap: 18px; color: #111; }
.rpp-page {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 794px;
  min-height: 1000px;
  margin: 0 auto;
  padding: 36px 40px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 10px 30px -18px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  font-size: 13px;
}
.rpp-mark {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-24deg);
  font-size: 120px;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: rgba(163, 38, 27, 0.09);
  pointer-events: none;
}
.rpp-head { display: flex; align-items: center; gap: 14px; padding-bottom: 10px; border-bottom: 2.5px solid #0a5c40; }
.rpp-head div { display: grid; gap: 2px; }
.rpp-head strong { font-size: 18px; letter-spacing: 0.04em; color: #053d2c; }
.rpp-head span { font-size: 12px; font-weight: 600; }
.rpp-logo { width: 52px; height: 52px; object-fit: contain; }
.rpp-id { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 24px; margin: 14px 0; }
.rpp-id div { display: flex; gap: 6px; }
.rpp-id dt { width: 70px; flex: none; color: #444; }
.rpp-id dt::after { content: ' :'; }
.rpp-id dd { margin: 0; font-weight: 700; }
.rpp-table { width: 100%; border-collapse: collapse; }
.rpp-table th, .rpp-table td { border: 1px solid #888; padding: 5px 8px; }
.rpp-table th { background: #0a5c40; color: #fff; font-weight: 700; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.c-no { width: 34px; text-align: center; }
.c-n { width: 74px; text-align: center; }
.rpp-group td { background: #eef5f1; font-weight: 800; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.rpp-total td { font-weight: 700; }
.rpp-legend { margin: 6px 0 14px; font-size: 11px; color: #444; }
.rpp-row2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.rpp-box { display: grid; gap: 4px; align-content: start; padding: 10px 12px; border: 1px solid #888; border-radius: 4px; }
.rpp-decision { font-size: 15px; color: #053d2c; }
.rpp-h2 { margin: 0 0 10px; font-size: 15px; letter-spacing: 0.04em; color: #053d2c; text-transform: uppercase; }
.rpp-ragam .c-n { width: 82px; }
.rpp-note { margin-top: 14px; }
.rpp-note p { min-height: 70px; margin: 6px 0 0; padding: 8px 10px; border: 1px solid #888; border-radius: 4px; white-space: pre-line; line-height: 1.5; }
.rpp-signs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; margin-top: 26px; }
.rpp-sign { display: grid; justify-items: center; gap: 4px; text-align: center; }
.rpp-sign b { padding-top: 2px; border-top: 1px solid #111; min-width: 160px; }
.rpp-blank { display: block; height: 56px; }
.rpp-kepala { margin-top: 18px; }
@media (max-width: 640px) {
  .rpp { overflow-x: auto; }
  .rpp-page { min-width: 640px; padding: 24px; }
}
@media print {
  .rpp { display: block; gap: 0; }
  .rpp-page { box-shadow: none; border-radius: 0; padding: 0; min-height: 0; max-width: none; break-after: page; }
  .rpp-page:last-child { break-after: auto; }
}
</style>
