<template>
  <div>
    <PageSkeleton v-if="loading" :rows="5" label="Memuat kartu prestasi" />
    <div v-else-if="loadError" class="w-card w-center">
      <p class="w-note is-danger" role="alert">{{ loadError }}</p>
      <router-link to="/wali" class="w-btn w-btn-ghost">Kembali ke beranda</router-link>
    </div>

    <template v-else-if="data">
      <router-link to="/wali" class="w-back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        Beranda
      </router-link>

      <WaliChildSwitch :active-id="santriId" section="prestasi" />

      <header class="kp-head">
        <h1 class="w-title">Kartu Prestasi</h1>
        <div class="kp-who">
          <strong>{{ data.santri.name }}</strong>
          <span class="kp-level">{{ levelName(data.santri.classId) || 'Belum ada jilid' }}</span>
        </div>
      </header>

      <!-- where ananda is now -->
      <section class="kp-hero" aria-label="Posisi ananda sekarang">
        <template v-if="hero">
          <div class="kp-hero-top">
            <div class="kp-hero-text">
              <span>Posisi sekarang</span>
              <strong v-if="hero.kind === 'jilid'">Jilid {{ hero.jilid }} · Hal. {{ hero.page }} <small>dari {{ PAGES }}</small></strong>
              <strong v-else>{{ hero.surahName }} <small>ayat {{ hero.ayatFrom }}</small></strong>
            </div>
            <span v-if="hero.kind === 'jilid'" class="kp-pct">{{ heroPct }}%</span>
          </div>
          <span v-if="hero.kind === 'jilid'" class="kp-bar" aria-hidden="true"><span :style="{ width: `${heroPct}%` }"></span></span>
          <p v-if="hero.done" class="kp-done">{{ hero.kind === 'jilid' ? `Jilid ${hero.jilid} sudah selesai. Menunggu kenaikan jilid.` : 'Bagian ini sudah selesai.' }}</p>
        </template>
        <p v-else class="kp-hero-empty">Posisi halaman muncul setelah ustadz/ustadzah mencatat tes pertama ananda.</p>
        <div class="kp-stats">
          <div><strong>{{ data.stats.count }}×</strong><span>dites {{ monthShort }}</span></div>
          <div><strong>{{ data.stats.average !== null ? `${data.stats.averageText} ${data.stats.grade}` : '–' }}</strong><span>rata-rata nilai</span></div>
          <div><strong>{{ data.stats.ulang }}×</strong><span>mengulang</span></div>
        </div>
      </section>

      <!-- paraf -->
      <div v-if="data.unsignedCount" class="kp-sign-bar">
        <div>
          <strong>{{ data.unsignedCount }} tes belum diparaf</strong>
          <span>Paraf = tanda Ayah/Bunda sudah membaca.</span>
        </div>
        <button type="button" class="kp-sign-all" :disabled="signing" @click="signAll">{{ signing ? 'Memaraf…' : 'Paraf semua' }}</button>
      </div>
      <p v-if="signMsg" class="w-note" :class="{ 'is-danger': signError }" role="status">{{ signMsg }}</p>

      <div class="w-section-head kp-list-head">
        <h2 class="w-section-title">Riwayat tes</h2>
        <router-link :to="`/wali/santri/${santriId}/prestasi/cetak?month=${data.month}`" class="kp-print">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v7H7z" /></svg>
          Cetak / PDF
        </router-link>
      </div>

      <div v-if="data.months.length > 1" class="kp-months" role="group" aria-label="Pilih bulan">
        <button v-for="m in data.months" :key="m" type="button" :aria-pressed="m === data.month" @click="month = m">{{ monthLabel(m) }}</button>
      </div>

      <div v-if="!data.tests.length" class="w-card w-center kp-empty">
        <p class="w-help">Belum ada catatan tes di {{ monthLabel(data.month) }}. Catatan muncul setelah ananda dites mengaji oleh ustadz/ustadzah.</p>
      </div>

      <article v-for="t in data.tests" :key="t.id" class="w-card kp-item">
        <div class="kp-item-top">
          <div class="kp-item-text">
            <span class="kp-date">{{ dayLabel(t.date) }} · {{ SESI[t.slot] }}</span>
            <strong>{{ t.place }}</strong>
          </div>
          <span v-if="t.grade" class="kp-grade" :class="`is-${t.grade}`">{{ t.scoreText }} {{ t.grade }}</span>
        </div>
        <div class="kp-item-mid">
          <span class="kp-result" :class="`is-${t.result}`">{{ t.result === 'lanjut' ? 'Lanjut' : 'Ulang' }}</span>
          <span class="kp-next">{{ capital(t.next) }}</span>
        </div>
        <p v-if="t.notes" class="kp-notes">{{ t.notes }}</p>
        <div class="kp-paraf">
          <div class="kp-guru">
            <SignatureImage v-if="data.signatures[t.guruId]" :sig="data.signatures[t.guruId]" :width="44" :height="22" :label="`Paraf ${t.guruName}`" />
            <span>{{ t.guruName || 'Ustadz/Ustadzah' }}</span>
          </div>
          <span v-if="t.signed" class="kp-signed">
            <SignatureImage v-if="t.sign && data.signatures[t.sign.waliId]" :sig="data.signatures[t.sign.waliId]" :width="40" :height="20" color="#222" label="Paraf wali" />
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
            Diparaf{{ t.sign?.name ? ` ${t.sign.name}` : '' }}<template v-if="t.sign?.at"> · {{ shortStamp(t.sign.at) }}</template>
          </span>
          <button v-else type="button" class="kp-sign-one" :disabled="signing" @click="signOne(t)">Paraf</button>
        </div>
      </article>

      <p class="kp-legend">
        Kriteria nilai: <b>A</b> 8,6–10 · <b>B</b> 7,6–8,5 · <b>C</b> ≤ 7,5. Nilai boleh tidak diisi ustadz/ustadzah.
        <router-link v-if="!hasMySignature" to="/wali/tanda-tangan">Gambar tanda tangan untuk paraf (opsional)</router-link>
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import SignatureImage from '@/components/signature/SignatureImage.vue'
import WaliChildSwitch from './WaliChildSwitch.vue'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'
import { useAuthStore } from '@/stores/auth'
import { PAGES, SESI, dayLabel, monthLabel, mainKind } from '@/utils/kps'

const route = useRoute()
const authStore = useAuthStore()
const santriId = route.params.santriId
const month = ref(String(route.query.month || ''))
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : '')
const capital = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '')
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const shortStamp = (iso) => {
  const d = new Date(new Date(iso).getTime() + 7 * 3600 * 1000)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}`
}

const res = useWaliResource(() => WALI_KEYS.prestasi(santriId, month.value), () => waliFetch.prestasi(santriId, month.value), { keepPrevious: true })
const data = computed(() => res.data.value)
const loading = computed(() => res.loading.value)
const loadError = computed(() => res.error.value)
const monthShort = computed(() => (data.value ? monthLabel(data.value.month).split(' ')[0].toLowerCase() : ''))
const myId = computed(() => authStore.user?.uid || authStore.user?.id || '')
const hasMySignature = computed(() => !!data.value?.signatures?.[myId.value])

// the main kind of this child first (jilid / Al-Qur'an), else whatever position there is
const hero = computed(() => {
  const pos = data.value?.position || {}
  const main = data.value?.santri?.mainKind || mainKind(data.value?.santri?.classId)
  for (const k of [main, 'jilid', 'quran', 'hafalan']) if (pos[k]) return { kind: k, ...pos[k] }
  return null
})
const heroPct = computed(() => (hero.value?.kind === 'jilid' ? Math.round(((hero.value.done ? PAGES : hero.value.page - 1) / PAGES) * 100) : 0))

const signing = ref(false)
const signMsg = ref('')
const signError = ref(false)
async function sign(ids) {
  signing.value = true
  signMsg.value = ''
  try {
    const { data: r } = await api.post(`/wali/santri/${santriId}/prestasi/paraf`, ids ? { ids } : {})
    signError.value = false
    signMsg.value = r.signed ? `${r.signed} tes sudah diparaf. Jazakumullah khairan.` : 'Semua tes sudah diparaf.'
    await res.refresh()
  } catch (err) {
    signError.value = true
    signMsg.value = err?.response?.data?.error || 'Paraf belum tersimpan. Periksa koneksi lalu coba lagi.'
  } finally {
    signing.value = false
  }
}
const signAll = () => sign(null)
const signOne = (t) => sign([t.id])
</script>

<style scoped>
.kp-head { margin-bottom: 12px; }
.kp-who { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 4px; }
.kp-who strong { font-size: 0.96rem; color: var(--w-body); font-weight: 700; }
.kp-level {
  display: inline-flex;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-size: 0.76rem;
  font-weight: 800;
}
.kp-hero {
  display: grid;
  gap: 12px;
  margin-bottom: 14px;
  padding: 18px;
  border-radius: 22px;
  background: linear-gradient(150deg, #0a5c40, #053d2c);
  color: #fbf9f3;
}
.kp-hero-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
.kp-hero-text { display: grid; gap: 2px; }
.kp-hero-text > span { font-size: 0.78rem; font-weight: 600; color: #b6d3c4; }
.kp-hero-text strong { font-size: 1.45rem; font-weight: 800; line-height: 1.2; }
.kp-hero-text small { font-size: 0.9rem; font-weight: 600; color: #b6d3c4; }
.kp-pct { font-size: 0.86rem; font-weight: 800; color: var(--w-gold); }
.kp-bar { display: block; height: 8px; border-radius: 8px; background: rgba(255, 255, 255, 0.16); overflow: hidden; }
.kp-bar span { display: block; height: 100%; border-radius: inherit; background: var(--w-gold); }
.kp-done { margin: 0; font-size: 0.84rem; font-weight: 700; color: var(--w-gold); }
.kp-hero-empty { margin: 0; font-size: 0.9rem; line-height: 1.5; color: #d6e9de; }
.kp-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.kp-stats div { display: grid; gap: 1px; }
.kp-stats strong { font-size: 1.1rem; font-weight: 800; }
.kp-stats span { font-size: 0.74rem; color: #b6d3c4; }
.kp-sign-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid #f1d9a8;
  background: #fdf0d9;
  color: #6b3a05;
}
.kp-sign-bar div { flex: 1; display: grid; gap: 2px; }
.kp-sign-bar strong { font-size: 0.92rem; }
.kp-sign-bar span { font-size: 0.8rem; }
.kp-sign-all {
  flex: none;
  min-height: 46px;
  padding: 0 16px;
  border: 0;
  border-radius: 14px;
  background: #b45309;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
}
.kp-sign-all:disabled, .kp-sign-one:disabled { opacity: 0.6; cursor: default; }
.kp-list-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.kp-print {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--w-line-strong);
  background: #fff;
  color: var(--w-emerald);
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
}
.kp-months { display: flex; gap: 6px; margin: 0 0 12px; overflow-x: auto; scrollbar-width: none; }
.kp-months::-webkit-scrollbar { display: none; }
.kp-months button {
  flex: none;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--w-line-strong);
  background: #fff;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--w-body);
  cursor: pointer;
}
.kp-months button[aria-pressed='true'] { background: var(--w-emerald); border-color: var(--w-emerald); color: #fff; font-weight: 800; }
.kp-empty { padding: 18px; }
.kp-item { display: grid; gap: 10px; }
.kp-item-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.kp-item-text { display: grid; gap: 2px; min-width: 0; }
.kp-date { font-size: 0.78rem; font-weight: 700; color: var(--w-muted); }
.kp-item-text strong { font-size: 1rem; font-weight: 800; color: var(--w-ink); }
.kp-grade { flex: none; padding: 6px 10px; border-radius: 11px; font-size: 0.92rem; font-weight: 800; }
.kp-grade.is-A { background: #dff1e7; color: #0a5c40; }
.kp-grade.is-B { background: #fdf0d9; color: #7c3a06; }
.kp-grade.is-C { background: #fde4e1; color: #a3261b; }
.kp-item-mid { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.kp-result { padding: 3px 10px; border-radius: 999px; font-size: 0.76rem; font-weight: 800; }
.kp-result.is-lanjut { background: #0a5c40; color: #fff; }
.kp-result.is-ulang { background: #fde4e1; color: #a3261b; }
.kp-next { font-size: 0.86rem; color: var(--w-body); }
.kp-notes { margin: 0; font-size: 0.88rem; line-height: 1.5; color: var(--w-body); white-space: pre-line; }
.kp-paraf {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(11, 59, 42, 0.14);
}
.kp-guru { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0; font-size: 0.8rem; color: var(--w-muted); }
.kp-signed { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; color: #0a5c40; text-align: right; }
.kp-sign-one {
  flex: none;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  border: 1.5px solid #b45309;
  background: #fff;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  color: #8a4b07;
  cursor: pointer;
}
.kp-legend { margin: 14px 2px 0; font-size: 0.8rem; line-height: 1.6; color: var(--w-muted); }
.kp-legend a { display: block; margin-top: 4px; font-weight: 700; color: var(--w-emerald); }
</style>
