<template>
  <div class="rpx">
    <PageSkeleton v-if="loading && !data" :rows="5" label="Memuat rapor" />
    <p v-else-if="error && !data" class="rpx-note is-danger" role="alert">{{ error }}</p>

    <template v-else-if="data">
      <header class="rpx-head">
        <div>
          <h1>{{ data.period.name }}</h1>
          <p class="rb-meta">
            <span class="rpx-pill" :class="`is-${PERIOD_STATUS[data.period.status]?.tone}`">{{ PERIOD_STATUS[data.period.status]?.label }}</span>
            <span>Kehadiran {{ shortDate(data.period.attendanceFrom) }} – {{ shortDate(data.period.attendanceTo) }}</span>
            <span v-if="data.period.fillUntil">· isi sampai {{ shortDate(data.period.fillUntil) }}</span>
          </p>
        </div>
        <div v-if="data.isAdmin" class="rb-admin">
          <button type="button" class="rpx-btn is-small" @click="sheetOpen = true">Pengaturan</button>
          <button v-if="data.period.status !== 'open'" type="button" class="rpx-btn is-small is-primary" :disabled="busy" @click="setStatus('open')">{{ data.period.status === 'draft' ? 'Buka untuk guru' : 'Buka lagi' }}</button>
          <button v-else type="button" class="rpx-btn is-small" :disabled="busy" @click="setStatus('closed')">Tutup pengisian</button>
        </div>
      </header>

      <p v-if="!data.isAdmin && data.period.status === 'closed'" class="rpx-note is-warn">
        Pengisian sudah ditutup. Rapor yang masih kurang hanya bisa diisi bila admin membuka "susulan" untuk santri itu.
      </p>
      <p v-if="data.isAdmin && !data.kepala.uid" class="rpx-note is-warn">Kepala TPQ belum dipilih (halaman Rapor). Rapor tetap bisa terbit tanpa tanda tangan kepala.</p>
      <p v-else-if="data.isAdmin && !data.kepala.hasSignature" class="rpx-note is-warn">{{ data.kepala.name }} belum menyimpan tanda tangan Kepala TPQ (menu Profil Saya).</p>

      <div v-if="!data.jilid.length" class="rpx-card rpx-empty">Belum ada santri di jilid Antum. Jilid yang Antum ampu diatur admin di Kelola Pengajar.</div>

      <template v-else>
        <div class="rpx-chips rb-tabs" role="group" aria-label="Pilih jilid">
          <button v-for="j in data.jilid" :key="j.classId" type="button" class="rpx-chip" :aria-pressed="j.classId === current?.classId" @click="pick(j.classId)">
            {{ j.label }} <small>{{ j.done + j.published }}/{{ j.total }}</small>
          </button>
        </div>

        <section v-if="current" class="rpx-card rb-sum" :aria-label="`Ringkasan ${current.label}`">
          <div class="rb-sum-top">
            <strong>{{ current.label }}</strong>
            <span>{{ current.done + current.published }} dari {{ current.total }} selesai</span>
          </div>
          <span class="rpx-bar" aria-hidden="true"><span :style="{ width: `${pct(current)}%` }"></span></span>
          <ul class="rb-counts">
            <li v-if="current.empty"><b>{{ current.empty }}</b> belum diisi</li>
            <li v-if="current.draft"><b>{{ current.draft }}</b> draf</li>
            <li v-if="current.revision" class="is-danger"><b>{{ current.revision }}</b> perlu revisi</li>
            <li v-if="current.done"><b>{{ current.done }}</b> selesai</li>
            <li v-if="current.published"><b>{{ current.published }}</b> terbit · {{ current.waliSigned }} diparaf wali</li>
          </ul>
          <button v-if="data.isAdmin" type="button" class="rpx-btn is-primary rb-publish" :disabled="busy || !current.done" @click="publishJilid">
            {{ current.done ? `Terbitkan ${current.label} (${current.done})` : current.published ? 'Semua yang selesai sudah terbit' : 'Belum ada yang selesai' }}
          </button>
        </section>

        <ul class="rb-list" :aria-label="`Santri ${current?.label || ''}`">
          <li v-for="r in current?.rows || []" :key="r.santriId" class="rb-item">
            <router-link :to="`/dashboard/rapor/${periodId}/santri/${r.santriId}`" class="rpx-card rb-row">
              <span class="rb-name">
                <strong>{{ r.name }}</strong>
                <span class="rb-tags">
                  <span class="rpx-pill" :class="`is-${STATUS[r.status]?.tone}`">{{ STATUS[r.status]?.label }}</span>
                  <span v-if="r.titipan" class="rpx-pill is-muted">Titipan</span>
                  <span v-if="r.susulan" class="rpx-pill is-warn">Susulan</span>
                  <span v-if="r.status === 'draft' || r.status === 'empty'" class="rb-sub">Inti {{ r.intiFilled }}/6</span>
                  <span v-if="r.rank" class="rb-sub">Ranking {{ r.rank }}/{{ r.rankOf }}</span>
                  <span v-if="r.waliSigned" class="rb-sub is-ok">✓ wali</span>
                </span>
                <span v-if="r.revisionNote" class="rb-rev">Revisi: {{ r.revisionNote }}</span>
              </span>
              <span class="rpx-grade" :class="r.grade ? `is-${r.grade}` : 'is-none'">{{ r.average !== null ? `${num(r.average)}` : '–' }}</span>
            </router-link>
            <button v-if="data.isAdmin && r.status !== 'empty'" type="button" class="rb-more" :aria-label="`Aksi rapor ${r.name}`" @click="actionsFor = r">⋯</button>
            <button v-else-if="data.isAdmin && data.period.status === 'closed'" type="button" class="rb-more" :aria-label="`Aksi rapor ${r.name}`" @click="actionsFor = r">⋯</button>
          </li>
        </ul>
      </template>

      <!-- naik jilid from the published rapor -->
      <section v-if="data.isAdmin && data.promotions.length" class="rpx-card rb-promo" aria-labelledby="rb-promo">
        <h2 id="rb-promo">Kenaikan jilid dari rapor</h2>
        <p>{{ data.promotions.length }} santri dinyatakan <b>naik</b> di rapor yang sudah terbit. Jilid mereka belum diubah.</p>
        <ul>
          <li v-for="p in data.promotions" :key="p.santriId">{{ p.name }}: {{ levelName(p.from) }} → {{ levelName(p.to) }}<template v-if="!p.still"> <em>(sudah pindah jilid, dilewati)</em></template></li>
        </ul>
        <button type="button" class="rpx-btn is-gold" :disabled="busy" @click="applyPromotions">Terapkan kenaikan</button>
      </section>
    </template>

    <!-- admin: one rapor's actions -->
    <Teleport to="body">
      <div v-if="actionsFor" class="rpx-overlay" @click.self="actionsFor = null" @keydown.esc="actionsFor = null">
        <section class="rpx-sheet" role="dialog" aria-modal="true" aria-labelledby="rb-act">
          <h2 id="rb-act">{{ actionsFor.name }}</h2>
          <p class="rb-act-sub">{{ STATUS[actionsFor.status]?.label }}<template v-if="actionsFor.average !== null"> · rata-rata {{ num(actionsFor.average) }} {{ actionsFor.grade }}</template></p>
          <div class="rb-actions">
            <router-link class="rpx-btn" :to="`/dashboard/rapor/${periodId}/santri/${actionsFor.santriId}`">Buka rapor</router-link>
            <router-link v-if="actionsFor.status !== 'empty'" class="rpx-btn" :to="`/dashboard/rapor/${periodId}/santri/${actionsFor.santriId}/cetak`">Lihat / cetak</router-link>
            <button v-if="actionsFor.status === 'done'" type="button" class="rpx-btn is-primary" :disabled="busy" @click="publishOne(actionsFor)">Terbitkan ini saja</button>
            <button v-if="['done', 'draft'].includes(actionsFor.status)" type="button" class="rpx-btn" :disabled="busy" @click="revise(actionsFor)">Minta revisi ke guru</button>
            <button v-if="actionsFor.status === 'published'" type="button" class="rpx-btn is-danger" :disabled="busy" @click="unpublish(actionsFor)">Tarik kembali</button>
            <button v-if="actionsFor.status !== 'published'" type="button" class="rpx-btn" :disabled="busy" @click="susulan(actionsFor)">{{ actionsFor.susulan ? 'Tutup susulan' : 'Buka susulan (boleh diisi walau periode ditutup)' }}</button>
          </div>
          <button type="button" class="rpx-btn" @click="actionsFor = null">Tutup</button>
        </section>
      </div>
    </Teleport>

    <RaporPeriodSheet :open="sheetOpen" :period="data?.period || null" @close="sheetOpen = false" @saved="load" @deleted="$router.push('/dashboard/rapor')" />
  </div>
</template>

<script setup>
import '@/styles/rapor.css'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import RaporPeriodSheet from '@/components/rapor/RaporPeriodSheet.vue'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { STATUS, PERIOD_STATUS, levelName, num, shortDate } from '@/utils/rapor'

const route = useRoute()
const { ask } = useDialog()
const toast = useToast()
const periodId = route.params.periodId
const data = ref(null)
const loading = ref(true)
const error = ref('')
const busy = ref(false)
const sheetOpen = ref(false)
const actionsFor = ref(null)
const JILID_KEY = `tpq.rapor.jilid.${periodId}`
const chosen = ref(sessionStorage.getItem(JILID_KEY) || '')

const current = computed(() => {
  const list = data.value?.jilid || []
  return list.find((j) => j.classId === chosen.value) || list[0] || null
})
const pct = (j) => (j.total ? Math.round(((j.done + j.published) / j.total) * 100) : 0)
function pick(classId) {
  chosen.value = classId
  sessionStorage.setItem(JILID_KEY, classId)
  rememberOrder()
}
// the editor's "sebelumnya / berikutnya" follows this list
function rememberOrder() {
  const ids = (current.value?.rows || []).map((r) => r.santriId)
  sessionStorage.setItem(`tpq.rapor.order.${periodId}`, JSON.stringify(ids))
}

async function load() {
  if (!data.value) loading.value = true
  error.value = ''
  try {
    const { data: d } = await api.get(`/rapor/periods/${periodId}/board`, { cache: false })
    data.value = d
    rememberOrder()
  } catch (err) {
    error.value = err?.response?.data?.error || 'Rapor belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}
const errText = (err, f) => err?.response?.data?.error || f
async function run(fn, okText) {
  busy.value = true
  try {
    const r = await fn()
    if (okText) toast.success(typeof okText === 'function' ? okText(r) : okText)
    actionsFor.value = null
    await load()
  } catch (err) {
    toast.error(errText(err, 'Belum berhasil. Coba lagi.'))
  } finally {
    busy.value = false
  }
}
async function setStatus(status) {
  const msg = {
    open: 'Guru jilid bisa mulai mengisi rapor santrinya.',
    closed: 'Guru tidak bisa mengisi lagi, kecuali santri yang Antum buka "susulan". Rapor yang sudah selesai tetap bisa diterbitkan.',
  }[status]
  const ok = await ask({ title: status === 'open' ? 'Buka periode untuk guru?' : 'Tutup pengisian?', message: msg, confirmText: status === 'open' ? 'Buka' : 'Tutup' })
  if (ok) run(() => api.put(`/rapor/periods/${periodId}`, { status }), status === 'open' ? 'Periode dibuka' : 'Pengisian ditutup')
}
async function publishJilid() {
  const j = current.value
  const rest = j.total - j.done - j.published
  const ok = await ask({
    title: `Terbitkan ${j.label}?`,
    message: `${j.done} rapor yang sudah selesai terbit ke portal wali, dengan tanda tangan Kepala TPQ, dan wali diberi kabar lewat WhatsApp.${rest ? ` ${rest} santri lain belum selesai dan belum ikut terbit.` : ''} Ranking dihitung dari rapor yang terbit di jilid ini.`,
    confirmText: 'Terbitkan',
  })
  if (ok) run(() => api.post(`/rapor/periods/${periodId}/publish`, { classId: j.classId }).then((r) => r.data), (r) => `${r.published} rapor terbit`)
}
async function publishOne(r) {
  const ok = await ask({ title: `Terbitkan rapor ${r.name}?`, message: 'Rapor ini saja yang terbit (misalnya susulan). Wali diberi kabar lewat WhatsApp.', confirmText: 'Terbitkan' })
  if (ok) run(() => api.post(`/rapor/periods/${periodId}/publish`, { santriIds: [r.santriId] }), 'Rapor terbit')
}
async function revise(r) {
  const note = await ask({
    title: `Minta revisi rapor ${r.name}`,
    message: 'Guru jilid diberi kabar lewat WhatsApp dan rapor kembali bisa diubah.',
    input: { label: 'Apa yang perlu diperbaiki?', required: true, multiline: true, maxlength: 500 },
    confirmText: 'Kirim',
  })
  if (note) run(() => api.post(`/rapor/periods/${periodId}/santri/${r.santriId}/revision`, { note }), 'Permintaan revisi terkirim')
}
async function unpublish(r) {
  const ok = await ask({ title: `Tarik kembali rapor ${r.name}?`, message: 'Rapor hilang dari portal wali sampai diterbitkan lagi. Kabar WhatsApp yang belum terkirim dibatalkan.', confirmText: 'Tarik kembali', tone: 'danger' })
  if (ok) run(() => api.post(`/rapor/periods/${periodId}/santri/${r.santriId}/unpublish`), 'Rapor ditarik kembali')
}
function susulan(r) {
  run(() => api.post(`/rapor/periods/${periodId}/santri/${r.santriId}/susulan`, { on: !r.susulan }), r.susulan ? 'Susulan ditutup' : 'Susulan dibuka')
}
async function applyPromotions() {
  const n = data.value.promotions.filter((p) => p.still).length
  const ok = await ask({ title: 'Terapkan kenaikan jilid?', message: `${n} santri dipindah ke jilid berikutnya sesuai rapor. Riwayat jilid dicatat. Kartu prestasi mereka mulai dari halaman 1 jilid baru.`, confirmText: 'Terapkan' })
  if (ok) run(() => api.post(`/rapor/periods/${periodId}/promotions`, {}).then((r) => r.data), (r) => `${r.moved} santri naik jilid`)
}

// back on the tab: the teachers may have filled more meanwhile
const onVisible = () => {
  if (document.visibilityState === 'visible' && data.value) load()
}
onMounted(() => {
  load()
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisible))
</script>

<style scoped>
.rb-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; font-size: 0.86rem; }
.rb-admin { display: flex; flex-wrap: wrap; gap: 8px; }
.rb-tabs { margin-bottom: 12px; }
.rb-sum { display: grid; gap: 10px; }
.rb-sum-top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px; }
.rb-sum-top strong { font-size: 1.1rem; }
.rb-sum-top span { font-size: 0.86rem; color: var(--muted); }
.rb-counts { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 0; padding: 0; list-style: none; font-size: 0.86rem; color: var(--body); }
.rb-counts .is-danger { color: var(--danger); }
.rb-publish { width: 100%; }
@media (min-width: 640px) {
  .rb-publish { width: auto; justify-self: start; }
}
.rb-list { display: grid; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; }
.rb-item { position: relative; display: flex; gap: 8px; align-items: stretch; }
.rb-row {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  text-decoration: none;
  color: inherit;
}
.rb-row:hover { border-color: var(--line-strong); }
.rb-name { flex: 1; min-width: 0; display: grid; gap: 5px; }
.rb-name strong { font-size: 0.98rem; overflow-wrap: anywhere; }
.rb-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.rb-sub { font-size: 0.78rem; color: var(--muted); }
.rb-sub.is-ok { color: var(--emerald); font-weight: 700; }
.rb-rev { font-size: 0.8rem; color: var(--danger); }
.rb-more {
  flex: none;
  width: 48px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: #fff;
  font: inherit;
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--body);
  cursor: pointer;
}
.rb-promo { display: grid; gap: 8px; margin-top: 18px; background: var(--emerald-dark); color: #fbf9f3; border: 0; }
.rb-promo h2 { margin: 0; font-size: 1rem; }
.rb-promo p, .rb-promo ul { margin: 0; font-size: 0.88rem; line-height: 1.5; color: #d6e9de; }
.rb-promo ul { padding-left: 18px; }
.rb-promo .rpx-btn { justify-self: start; }
.rb-act-sub { margin: -8px 0 0; font-size: 0.86rem; color: var(--muted); }
.rb-actions { display: grid; gap: 8px; }
</style>
