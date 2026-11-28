<template>
  <div>
    <PageSkeleton v-if="loading" :rows="6" label="Memuat rapor" />
    <div v-else-if="loadError" class="w-card w-center">
      <p class="w-note is-danger" role="alert">{{ loadError }}</p>
      <router-link :to="`/wali/santri/${santriId}/rapor`" class="w-btn w-btn-ghost">Kembali</router-link>
    </div>

    <template v-else-if="data">
      <router-link :to="`/wali/santri/${santriId}/rapor`" class="w-back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        Rapor &amp; jilid
      </router-link>

      <header class="rd-head">
        <h1 class="w-title">{{ data.period.name }}</h1>
        <div class="rd-who">
          <strong>{{ r.santriName }}</strong>
          <span class="rd-level">{{ levelName(r.classId) }}</span>
        </div>
      </header>

      <!-- the result at a glance -->
      <section class="rd-hero" aria-label="Ringkasan rapor">
        <div class="rd-hero-top">
          <span>Terbit {{ longDate(r.publishedAt?.slice(0, 10)) }}</span>
          <span v-if="r.decisionText" class="rd-dec">{{ r.decisionText }}</span>
        </div>
        <div class="rd-stats">
          <div><strong>{{ num(r.average) }}</strong><span>rata-rata</span></div>
          <div><strong class="rd-gold">{{ r.grade || '–' }}</strong><span>kriteria</span></div>
          <div><strong>{{ r.rank || '–' }}<small v-if="r.rankOf">/{{ r.rankOf }}</small></strong><span>ranking jilid</span></div>
        </div>
        <router-link :to="`/wali/santri/${santriId}/rapor/${periodId}/cetak`" class="rd-pdf">Unduh PDF (seperti rapor kertas)</router-link>
      </section>

      <section class="w-card rd-scores" aria-label="Nilai">
        <template v-for="grp in groups" :key="grp.title">
          <h2 class="rd-h">{{ grp.title }}</h2>
          <div v-for="(s, i) in grp.items" :key="s.key" class="rd-row">
            <span>{{ i + 1 }}. {{ s.label }}</span>
            <strong>{{ score(s.key) }}</strong>
            <span class="rd-grade" :class="crit(s.key) ? `is-${crit(s.key)}` : 'is-none'">{{ crit(s.key) || '–' }}</span>
          </div>
        </template>
        <div class="rd-row rd-total"><span>Jumlah nilai</span><strong>{{ num(r.total) }}</strong><span class="rd-grade is-blank"></span></div>
        <p class="rd-legend">Kriteria: A 8,6–10 · B 7,6–8,5 · C 7,5 ke bawah</p>
      </section>

      <section class="w-card rd-att" aria-label="Kehadiran">
        <h2 class="rd-h">Kehadiran</h2>
        <div class="rd-att-grid">
          <div><strong>{{ att.izin }}</strong><span>hari izin</span></div>
          <div><strong>{{ att.sakit }}</strong><span>hari sakit</span></div>
          <div><strong>{{ att.alpha }}</strong><span>hari alpha</span></div>
        </div>
      </section>

      <section class="w-card" aria-label="Ragam perkembangan">
        <h2 class="rd-h">Ragam perkembangan</h2>
        <div v-for="x in ragam" :key="x.k" class="rd-ragam">
          <span>{{ x.k }}. {{ x.label }}</span>
          <strong :class="x.tone">{{ x.value }}</strong>
        </div>
      </section>

      <section v-if="r.notes" class="w-card rd-note" aria-label="Catatan ustadz">
        <h2 class="rd-h">Catatan {{ r.teacher?.name || 'ustadz/ustadzah' }}</h2>
        <p>{{ r.notes }}</p>
      </section>

      <!-- the parent's feedback + signature -->
      <section class="w-card rd-wali" aria-labelledby="rd-wali">
        <h2 id="rd-wali" class="rd-wali-title">Catatan dari Ayah/Bunda</h2>
        <p class="w-help">Masukan, terima kasih, atau pertanyaan untuk ustadz/ustadzah. Ikut tercetak di rapor.</p>
        <label class="sr-only" for="rd-note">Catatan untuk ustadz/ustadzah</label>
        <textarea id="rd-note" v-model="note" class="w-input rd-textarea" rows="4" maxlength="1000" placeholder="Contoh: Terima kasih ustadzah, insyaallah kami bantu latihan di rumah."></textarea>
        <button type="button" class="w-btn w-btn-primary rd-sign-btn" :disabled="signing || (signed && note.trim() === (r.wali?.note || ''))" @click="sign">
          {{ signing ? 'Menyimpan…' : signed ? 'Perbarui catatan' : 'Kirim & tanda tangan' }}
        </button>
        <p v-if="signMsg" class="w-note" :class="{ 'is-danger': signError }" role="status">{{ signMsg }}</p>
        <p v-if="signed && !r.wali?.sig" class="w-help">
          Tanda tangan tercatat atas akun Ayah/Bunda. <router-link to="/wali/tanda-tangan">Gambar tanda tangan</router-link> agar tampil di rapor (opsional).
        </p>
      </section>

      <section class="w-card rd-signs" aria-label="Tanda tangan">
        <span class="rd-place">{{ data.period.place || 'Sidoarjo' }}, {{ longDate(data.period.raporDate) || '' }}</span>
        <div class="rd-sign-grid">
          <div class="rd-sign">
            <span>Orang tua / wali</span>
            <SignatureImage v-if="r.wali?.sig" :sig="r.wali.sig" :width="84" :height="40" color="#111" />
            <span v-else-if="signed" class="rd-check">✓</span>
            <span v-else class="rd-empty">Belum</span>
            <strong>{{ r.wali?.name || '–' }}</strong>
          </div>
          <div class="rd-sign">
            <span>Ustadz/Ustadzah</span>
            <SignatureImage v-if="r.teacher?.sig" :sig="r.teacher.sig" :width="84" :height="40" />
            <span v-else class="rd-check">✓</span>
            <strong>{{ r.teacher?.name || '–' }}</strong>
          </div>
          <div class="rd-sign">
            <span>Kepala TPQ</span>
            <SignatureImage v-if="r.kepala?.sig" :sig="r.kepala.sig" :width="84" :height="40" color="#111" />
            <span v-else class="rd-check">✓</span>
            <strong>{{ r.kepala?.name || '–' }}</strong>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import SignatureImage from '@/components/signature/SignatureImage.vue'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'
import { put } from '@/utils/waliCache'
import { SIKAP, SIFAT, VALUE_LABEL, subjectsOf, gradeOf, levelName, num, longDate } from '@/utils/rapor'

const route = useRoute()
const santriId = route.params.santriId
const periodId = route.params.periodId
const key = WALI_KEYS.raporDetail(santriId, periodId)
const res = useWaliResource(() => key, () => waliFetch.raporDetail(santriId, periodId))
const data = computed(() => res.data.value)
const loading = computed(() => res.loading.value)
const loadError = computed(() => res.error.value)
const r = computed(() => data.value?.rapor || {})
const groups = computed(() => {
  const s = subjectsOf(data.value?.period || {})
  return [
    { title: 'A. Inti', items: s.inti },
    { title: 'B. Penunjang', items: s.penunjang },
  ]
})
const raw = (k) => r.value.scores?.[k]
const score = (k) => (raw(k) === null || raw(k) === undefined ? '–' : num(raw(k)))
const crit = (k) => (raw(k) === null || raw(k) === undefined ? '' : gradeOf(raw(k)))
const att = computed(() => r.value.attendance || { izin: 0, sakit: 0, alpha: 0 })
const TONE = { baik: 'is-good', tidak: 'is-good', cukup: 'is-mid', jarang: 'is-mid', kurang: 'is-low', sering: 'is-low' }
const ragam = computed(() => [
  ...SIKAP.map(([k, label]) => ({ k, label, value: VALUE_LABEL[r.value.sikap?.[k]] || '–', tone: TONE[r.value.sikap?.[k]] || '' })),
  ...SIFAT.map(([k, label]) => ({ k, label, value: VALUE_LABEL[r.value.sifat?.[k]] || '–', tone: TONE[r.value.sifat?.[k]] || '' })),
])
const signed = computed(() => !!r.value.wali?.signedAt)

const note = ref('')
let typed = false
watch(
  () => r.value.wali?.note,
  (v) => {
    if (!typed) note.value = v || ''
  },
  { immediate: true },
)
watch(note, (v) => {
  if (v !== (r.value.wali?.note || '')) typed = true
})
const signing = ref(false)
const signMsg = ref('')
const signError = ref(false)
async function sign() {
  signing.value = true
  signMsg.value = ''
  try {
    const { data: fresh } = await api.post(`/wali/santri/${santriId}/rapor/${periodId}/sign`, { note: note.value })
    put(key, fresh)
    typed = false
    signError.value = false
    signMsg.value = 'Terima kasih, catatan dan tanda tangan tersimpan.'
  } catch (err) {
    signError.value = true
    signMsg.value = err?.response?.data?.error || 'Belum tersimpan. Periksa koneksi lalu coba lagi.'
  } finally {
    signing.value = false
  }
}
</script>

<style scoped>
.rd-head { margin-bottom: 12px; }
.rd-who { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 4px; }
.rd-who strong { font-size: 0.96rem; color: var(--w-body); }
.rd-level { padding: 2px 9px; border-radius: 999px; background: var(--w-emerald-soft); color: var(--w-emerald); font-size: 0.76rem; font-weight: 800; }
.rd-hero { display: grid; gap: 14px; margin-bottom: 14px; padding: 18px; border-radius: 22px; background: linear-gradient(150deg, #0a5c40, #053d2c); color: #fbf9f3; }
.rd-hero-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; font-size: 0.8rem; color: #b6d3c4; }
.rd-dec { padding: 5px 12px; border-radius: 999px; background: #e9c46a; color: #3a2405; font-weight: 800; }
.rd-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.rd-stats div { display: grid; gap: 1px; }
.rd-stats strong { font-size: 1.7rem; font-weight: 800; line-height: 1.1; }
.rd-stats small { font-size: 0.95rem; color: #b6d3c4; }
.rd-stats span { font-size: 0.74rem; color: #b6d3c4; }
.rd-gold { color: var(--w-gold); }
.rd-pdf {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #fbf9f3;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
}
.rd-h { margin: 6px 0 6px; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--w-emerald-dark); }
.rd-scores .rd-h:first-child { margin-top: 0; }
.rd-row { display: grid; grid-template-columns: 1fr auto 32px; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid rgba(11, 59, 42, 0.07); }
.rd-row > span:first-child { font-size: 0.9rem; color: var(--w-ink); }
.rd-row strong { font-size: 0.98rem; font-variant-numeric: tabular-nums; }
.rd-total { border-bottom: 0; font-weight: 800; }
.rd-grade { display: grid; place-items: center; height: 28px; border-radius: 8px; font-size: 0.82rem; font-weight: 800; }
.rd-grade.is-A { background: #dff1e7; color: #0a5c40; }
.rd-grade.is-B { background: #fdf0d9; color: #7c3a06; }
.rd-grade.is-C { background: #fde4e1; color: #a3261b; }
.rd-grade.is-none { background: #f2efe6; color: #62746a; }
.rd-legend { margin: 8px 0 0; font-size: 0.76rem; color: var(--w-muted); }
.rd-att-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.rd-att-grid div { display: grid; padding: 10px; border-radius: 12px; background: var(--w-surface-soft); }
.rd-att-grid strong { font-size: 1.2rem; }
.rd-att-grid span { font-size: 0.78rem; color: var(--w-muted); }
.rd-ragam { display: flex; justify-content: space-between; gap: 10px; padding: 7px 0; border-bottom: 1px solid rgba(11, 59, 42, 0.07); font-size: 0.88rem; }
.rd-ragam:last-child { border-bottom: 0; }
.rd-ragam strong { flex: none; }
.rd-ragam .is-good { color: #0a5c40; }
.rd-ragam .is-mid { color: #7c3a06; }
.rd-ragam .is-low { color: #a3261b; }
.rd-note p { margin: 0; font-size: 0.94rem; line-height: 1.55; white-space: pre-line; color: var(--w-body); }
.rd-wali { display: grid; gap: 10px; border: 1.5px solid var(--w-emerald); }
.rd-wali-title { margin: 0; font-size: 1rem; font-weight: 800; color: var(--w-ink); }
.rd-wali .w-help { margin: 0; }
.rd-textarea { min-height: 100px; padding: 10px 12px; line-height: 1.5; resize: vertical; }
.rd-sign-btn { width: 100%; }
.rd-signs { display: grid; gap: 10px; }
.rd-place { justify-self: end; font-size: 0.8rem; color: var(--w-muted); }
.rd-sign-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.rd-sign-grid .rd-sign { display: grid; justify-items: center; gap: 4px; text-align: center; }
.rd-sign-grid .rd-sign > span:first-child { font-size: 0.72rem; color: var(--w-muted); }
.rd-sign-grid strong { font-size: 0.8rem; color: var(--w-ink); }
.rd-check { display: grid; place-items: center; height: 40px; font-size: 1.2rem; font-weight: 800; color: #0a5c40; }
.rd-empty { display: grid; place-items: center; width: 100%; height: 40px; border-radius: 10px; border: 1.5px dashed #d8a24a; font-size: 0.74rem; font-weight: 700; color: #7c3a06; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
