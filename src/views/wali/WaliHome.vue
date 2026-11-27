<template>
  <div>
    <PageSkeleton v-if="loading" :rows="3" label="Memuat data" />

    <template v-else>
      <h1 class="w-title">Assalamu'alaikum{{ wali?.name ? `, ${wali.name}` : '' }}</h1>
      <p class="w-lead">Lihat kehadiran dan materi ananda, dan lengkapi datanya agar TPQ mudah menghubungi Bapak/Ibu.</p>

      <p v-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

      <!-- announcements from the TPQ -->
      <section v-if="annOnHome.length" class="ann-list" aria-label="Pengumuman TPQ">
        <article v-for="a in annOnHome" :key="a.id" class="ann-card">
          <div class="ann-top">
            <span class="ann-kicker">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Z" /><path d="M16 9a3 3 0 0 1 0 6" /></svg>
              Pengumuman TPQ
            </span>
            <button type="button" class="ann-close" :aria-label="`Tutup pengumuman ${a.title}`" @click="dismiss(a.id)">×</button>
          </div>
          <h2 class="ann-title">{{ a.title }}</h2>
          <p class="ann-body" :class="{ 'is-clamped': !expanded.includes(a.id) && a.body.length > 220 }">{{ a.body }}</p>
          <button v-if="a.body.length > 220" type="button" class="w-link ann-more" @click="toggleMore(a.id)">
            {{ expanded.includes(a.id) ? 'Tutup' : 'Baca selengkapnya' }}
          </button>
        </article>
      </section>

      <!-- Registrations of new children (until accepted: then the child is listed under Ananda) -->
      <template v-if="registrations.length">
        <h2 class="w-section-title">Pendaftaran santri baru</h2>
        <router-link v-for="r in registrations" :key="r.id" :to="`/wali/daftar/${r.id}`" class="w-card reg-card"
          :aria-label="`Pendaftaran ${r.childName || 'belum diberi nama'}: ${regStatus(r).label}`">
          <span class="reg-top">
            <strong>{{ r.childName || 'Belum diberi nama' }}</strong>
            <span class="w-pill" :class="`is-${regStatus(r).tone}`">{{ regStatus(r).label }}</span>
          </span>
          <span class="reg-line">{{ regLine(r) }}</span>
          <span class="reg-more">{{ r.status === 'draft' ? 'Lanjutkan mengisi ›' : r.fixRequest ? 'Perbaiki data ›' : 'Lihat status ›' }}</span>
        </router-link>
      </template>

      <!-- No child linked yet: one obvious way in - the code on the paper slip ("pengkinian data").
           (A new family registering is switched off for now: utils/waliFeatures.js.) -->
      <div v-if="!santri.length" class="start">
        <h2 class="w-section-title">{{ registrations.length ? 'Lainnya' : 'Mulai dari sini' }}</h2>
        <router-link to="/wali/tautkan" class="start-card is-new start-main">
          <span class="start-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>
          </span>
          <span class="start-text">
            <strong>Pengkinian data santri</strong>
            <span>Ketuk di sini, lalu ketik kode dari slip kertas yang dibawa ananda</span>
          </span>
          <span class="start-go" aria-hidden="true">›</span>
        </router-link>
        <p class="start-help">
          <strong>Belum dapat slip, atau slipnya hilang?</strong>
          Minta kodenya ke ustadz/ustadzah yang mengajar ananda.
        </p>
        <router-link v-if="SHOW_NEW_REGISTRATION" to="/wali/daftar/baru" class="start-card">
          <span class="start-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
          </span>
          <span class="start-text">
            <strong>Daftarkan santri baru</strong>
            <span>Ananda belum mengaji di TPQ Amanah</span>
          </span>
        </router-link>
      </div>

      <!-- The children -->
      <template v-else>
        <h2 class="w-section-title">Ananda</h2>
        <article v-for="s in santri" :key="s.santriId" class="w-card child-card">
          <div class="child-head">
            <div class="child-avatar" aria-hidden="true">{{ initials(s.name) }}</div>
            <div class="child-text">
              <strong>{{ s.name }}</strong>
              <span>{{ levelName(s.classId) }}<template v-if="s.nomorInduk"> · No. induk {{ s.nomorInduk }}</template></span>
            </div>
          </div>

          <!-- this month's attendance; tap for the meetings and material -->
          <router-link :to="`/wali/santri/${s.santriId}/progres`" class="month-strip" :aria-label="`Kehadiran dan materi ${s.name}`">
            <span class="month-strip-title">Kehadiran {{ monthName(s.thisMonth?.month) }}</span>
            <span class="month-strip-counts">
              <span v-for="t in TILES" :key="t.key" :class="`is-${t.key}`"><strong>{{ s.thisMonth?.[t.key] ?? 0 }}</strong> {{ t.label }}</span>
            </span>
            <span class="month-strip-more">Lihat kehadiran &amp; materi ›</span>
          </router-link>

          <router-link
            v-if="s.thisMonth?.alfa > 0"
            :to="`/wali/santri/${s.santriId}/progres?koreksi=terbaru`"
            class="alfa-crosscheck-row"
          >
            <span class="alfa-crosscheck-text">
              Tercatat <strong>{{ s.thisMonth.alfa }} alfa</strong> · Ajukan crosscheck / koreksi absen
            </span>
            <span class="alfa-crosscheck-go" aria-hidden="true">›</span>
          </router-link>

          <!-- the child's other pages: three tiles, thumb-sized -->
          <nav class="tiles" :aria-label="`Menu ${s.name}`">
            <router-link :to="`/wali/santri/${s.santriId}/izin`" class="tile">
              <span class="tile-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m9.5 14.5 5 5m0-5-5 5" /></svg>
              </span>
              <span class="tile-label">Izin / sakit</span>
            </router-link>
            <router-link :to="`/wali/santri/${s.santriId}/rapor`" class="tile">
              <span class="tile-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.5 13.2 17 22l-5-3-5 3 1.5-8.8" /></svg>
              </span>
              <span class="tile-label">Rapor &amp; jilid</span>
            </router-link>
            <router-link :to="`/wali/santri/${s.santriId}/kegiatan`" class="tile">
              <span class="tile-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" /><path d="M4 6v12a2 2 0 0 0 2 2h14v-4" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
                <span v-if="s.activities?.length" class="tile-dot">{{ s.activities.length }}</span>
              </span>
              <span class="tile-label">Kegiatan &amp; tabungan</span>
            </router-link>
          </nav>

          <!-- open activities (munaqosyah, ...) with their payment -->
          <ul v-if="s.activities?.length" class="act-lines">
            <li v-for="k in s.activities" :key="k.id" class="act-line">
              <strong>{{ k.title }}</strong>
              <span class="w-pill" :class="`is-${k.paymentState === 'lunas' || k.paymentState === 'gratis' ? 'ok' : k.paymentState === 'sebagian' ? 'warn' : 'danger'}`">{{ k.payment }}</span>
            </li>
          </ul>

          <!-- Data ananda: verified with an active advisory note keeps the verified pill AND calls out what to update -->
          <div v-if="s.profileStatus === 'verified' && s.verifiedNote" class="data-cta is-verified-note">
            <div class="data-cta-head">
              <strong>Data ananda</strong>
              <span class="data-cta-pills">
                <span class="w-pill is-ok">{{ status(s).label }}</span>
                <span class="w-pill is-warn">Perlu dibenahi</span>
              </span>
            </div>
            <p class="data-cta-text">
              <span>
                Catatan pengurus<template v-if="s.verifiedNoteByName"> ({{ s.verifiedNoteByName }})</template>:
                <strong>{{ s.verifiedNote }}</strong>
              </span>
              <span class="data-cta-sub">Data tetap terverifikasi, mohon segera diperbarui ya Bapak/Ibu.</span>
            </p>
            <router-link :to="`/wali/santri/${s.santriId}`" class="w-btn w-btn-primary">Perbarui data sekarang</router-link>
          </div>
          <!-- Data ananda: a quiet row when done, a clear call when something is needed -->
          <router-link v-else-if="dataDone(s)" :to="`/wali/santri/${s.santriId}`" class="data-row">
            <span class="data-row-label">Data ananda</span>
            <span class="w-pill" :class="`is-${status(s).tone}`">{{ status(s).label }}</span>
            <span class="data-row-hint">Lihat / ubah</span>
            <span class="data-row-go" aria-hidden="true">›</span>
          </router-link>
          <div v-else class="data-cta" :class="{ 'is-danger': s.profileStatus === 'needs_fix' }">
            <p class="data-cta-text">
              <strong>Data ananda: {{ status(s).label.toLowerCase() }}</strong>
              <span v-if="s.profileStatus === 'needs_fix' && s.adminNote">Catatan admin: {{ s.adminNote }}</span>
              <span v-else>Lengkapi agar TPQ mudah menghubungi Bapak/Ibu.</span>
            </p>
            <router-link :to="`/wali/santri/${s.santriId}`" class="w-btn w-btn-primary">{{ actionLabel(s) }}</router-link>
          </div>
          <p v-if="s.hasPendingIdentity" class="w-note is-warn child-note">Perubahan identitas sedang dicek pengurus TPQ.</p>
        </article>

        <!-- another child: kept small here (also under Akun) -->
        <div class="add-row" role="group" aria-label="Tambah ananda">
          <router-link to="/wali/tautkan" class="add-link">+ Tambah anak lain (pakai kode slip)</router-link>
          <router-link v-if="SHOW_NEW_REGISTRATION" to="/wali/daftar/baru" class="add-link">+ Daftarkan santri baru</router-link>
        </div>
      </template>

      <!-- Ask the parent's name once, after the children: the teachers see who filled the data -->
      <form v-if="!wali?.name" class="w-card name-card" @submit.prevent="saveName">
        <div class="w-field">
          <label for="wali-name">Nama Bapak/Ibu</label>
          <input id="wali-name" v-model="nameInput" class="w-input" autocomplete="name" placeholder="Contoh: Ibu Aminah" />
          <span class="w-help">Agar ustadz/ustadzah tahu siapa yang mengisi data ananda.</span>
        </div>
        <button type="submit" class="w-btn w-btn-ghost" :disabled="!nameInput.trim() || savingName">
          {{ savingName ? 'Menyimpan…' : 'Simpan nama' }}
        </button>
      </form>

      <!-- Requests while the code was lost -->
      <template v-if="requests.length">
        <h2 class="w-section-title">Pengajuan tautan</h2>
        <div v-for="r in requests" :key="r.id" class="w-card request-card">
          <strong>{{ r.childName }}</strong>
          <span class="w-pill" :class="r.status === 'rejected' ? 'is-danger' : 'is-info'">
            {{ r.status === 'rejected' ? 'Ditolak' : 'Menunggu dicek' }}
          </span>
          <p v-if="r.status === 'rejected' && r.reason" class="w-help">Alasan: {{ r.reason }}</p>
        </div>
      </template>

      <!-- Saran & kritik untuk menjadikan platform dan layanan TPQ Amanah lebih baik -->
      <router-link to="/wali/masukan" class="w-card feedback-card">
        <span class="feedback-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
        </span>
        <span class="feedback-text">
          <strong>Saran &amp; Kritik</strong>
          <span>Bantu kami menjadikan aplikasi &amp; layanan TPQ Amanah lebih baik</span>
        </span>
        <span v-if="repliedFeedbackCount" class="w-pill is-ok">{{ repliedFeedbackCount }} tanggapan</span>
        <span class="feedback-go" aria-hidden="true">›</span>
      </router-link>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { STATUS } from '@/utils/santriProfile'
import { REG_STATUS, longDate } from '@/utils/pendaftaran'
import { useWaliAnnouncements } from '@/composables/useWaliAnnouncements'
import { SHOW_NEW_REGISTRATION } from '@/utils/waliFeatures'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch, warmUpWali } from '@/utils/waliData'
import { put } from '@/utils/waliCache'

// shown at once from the last visit (this phone), refreshed in the background (utils/waliCache.js)
const me = useWaliResource(() => WALI_KEYS.me, () => waliFetch.me())
const regs = useWaliResource(() => WALI_KEYS.regs, () => waliFetch.regs())
const feedbacks = useWaliResource(() => WALI_KEYS.feedback, () => waliFetch.feedback())
const saveError = ref('')
const loading = computed(() => me.loading.value)
const loadError = computed(() => saveError.value || me.error.value)
const wali = computed(() => me.data.value?.wali || null)
const santri = computed(() => me.data.value?.santri || [])
const requests = computed(() => me.data.value?.requests || [])
// accepted: the child is under Ananda now; cancelled by the parent themselves: nothing to show (a failure: none shown)
const registrations = computed(() =>
  (Array.isArray(regs.data.value) ? regs.data.value : []).filter((r) => r.status !== 'accepted' && !(r.status === 'cancelled' && r.cancelledBy === 'wali')),
)
const expanded = ref([])
// announcements: shared with the Pengumuman tab and its badge (closed ones are remembered on this phone)
const { onHome: annOnHome, refresh: refreshAnnouncements, dismiss } = useWaliAnnouncements()
const toggleMore = (id) => {
  expanded.value = expanded.value.includes(id) ? expanded.value.filter((x) => x !== id) : [...expanded.value, id]
}
const nameInput = ref('')
const savingName = ref(false)
const repliedFeedbackCount = computed(() => (Array.isArray(feedbacks.data.value) ? feedbacks.data.value.filter((f) => f.reply?.text).length : 0))

const TILES = [
  { key: 'hadir', label: 'hadir' },
  { key: 'izin', label: 'izin' },
  { key: 'sakit', label: 'sakit' },
  { key: 'alfa', label: 'alfa' },
]
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const monthName = (ym) => {
  const m = Number(String(ym || '').split('-')[1])
  return m ? MONTHS[m - 1] : 'bulan ini'
}
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
const status = (s) => STATUS[s.profileStatus] || STATUS.empty
const actionLabel = (s) => ({
  empty: 'Isi data sekarang',
  draft: 'Lanjutkan mengisi',
  needs_fix: 'Perbaiki data',
  submitted: 'Lihat / ubah data',
  verified: 'Lihat / perbarui data',
}[s.profileStatus] || 'Isi data sekarang')
const regStatus = (r) => REG_STATUS[r.status] || REG_STATUS.submitted
const regLine = (r) => {
  if (r.fixRequest) return `Perlu diperbaiki: ${r.fixRequest.note}`
  if (r.status === 'draft') return 'Belum dikirim. Isian sudah tersimpan.'
  if (r.status === 'scheduled' && r.schedule) return `Penempatan jilid: ${longDate(r.schedule.date, { weekday: true })}${r.schedule.time ? `, ${r.schedule.time}` : ''}`
  if (r.status === 'cancelled') return r.cancelReason ? `Alasan: ${r.cancelReason}` : 'Pendaftaran tidak dilanjutkan.'
  if (r.status === 'contacted') return `${r.number} · Sudah dihubungi, menunggu jadwal penempatan`
  return `${r.number} · Ustadz/ustadzah akan menghubungi Bapak/Ibu`
}
const dataDone = (s) => ['submitted', 'verified'].includes(s.profileStatus)
const actionClass = (s) => (['submitted', 'verified'].includes(s.profileStatus) ? 'w-btn-ghost' : 'w-btn-primary')

async function saveName() {
  savingName.value = true
  saveError.value = ''
  try {
    const { data } = await api.put('/wali/me', { name: nameInput.value })
    put(WALI_KEYS.me, { ...(me.data.value || {}), wali: data })
  } catch (err) {
    saveError.value = err.response?.data?.error || 'Nama belum tersimpan.'
  } finally {
    savingName.value = false
  }
}

// the next pages (code + each child's progress and izin) are made ready while the phone is idle
let warmed = false
watch(
  () => me.ready.value && santri.value.length,
  (ok) => {
    if (!ok || warmed) return
    warmed = true
    warmUpWali(santri.value)
  },
  { immediate: true },
)

onMounted(() => refreshAnnouncements({ force: true }))
</script>

<style scoped>
.ann-list {
  display: grid;
  gap: 10px;
  margin-bottom: 6px;
}

.ann-card {
  padding: 14px 16px 12px;
  border-radius: 18px;
  background: linear-gradient(160deg, #fffdf5, #fff8e1);
  border: 1px solid #f3d58b;
  box-shadow: 0 10px 24px -20px rgba(120, 80, 10, 0.5);
}

.ann-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ann-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #b45309;
}

.ann-close {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #7c5a1a;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.ann-close:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.ann-title {
  margin: 2px 0 4px;
  font-size: 1.08rem;
  font-weight: 800;
  color: #3b2404;
}

.ann-body {
  margin: 0;
  font-size: 0.93rem;
  line-height: 1.55;
  color: #4a3510;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.ann-body.is-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ann-more {
  padding-bottom: 0;
}

.name-card {
  margin-top: 20px;
}

.data-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: #475a50;
}

.child-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.child-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.child-avatar {
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #0a5c40;
  color: #fcd34d;
  font-weight: 800;
}

.child-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.child-text strong {
  font-size: 1.05rem;
  color: #0b3b2a;
}

.child-text span {
  font-size: 0.85rem;
  color: #5b6b62;
}

.data-status .w-pill {
  align-self: center;
}

.child-note {
  margin: 0;
}

.month-strip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f4f8f5;
  border: 1px solid rgba(11, 59, 42, 0.12);
  color: #0b3b2a;
  text-decoration: none;
}

.month-strip:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.month-strip-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #5b6b62;
}

.month-strip-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 0.9rem;
  color: #475a50;
}

.month-strip-counts strong {
  font-size: 1.05rem;
  font-variant-numeric: tabular-nums;
}

.month-strip-counts .is-hadir strong { color: #0a5c40; }
.month-strip-counts .is-izin strong { color: #1d4f8a; }
.month-strip-counts .is-sakit strong { color: #7c3a0d; }
.month-strip-counts .is-alfa strong { color: #8e1b12; }

.alfa-crosscheck-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff8ed;
  border: 1px solid #f1cf94;
  color: #7c3a0d;
  font-size: 0.84rem;
  font-weight: 700;
  text-decoration: none;
}

.alfa-crosscheck-text {
  flex: 1;
  min-width: 0;
  line-height: 1.35;
}

.alfa-crosscheck-go {
  flex: none;
  font-size: 1.2rem;
  line-height: 1;
}

.act-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.act-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 10px;
  font-size: 0.92rem;
  color: #0b3b2a;
}

.month-strip-more {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0a5c40;
}

.add-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.add-link {
  display: grid;
  place-items: center;
  min-height: 46px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1.5px dashed rgba(11, 59, 42, 0.25);
  color: #0a5c40;
  font-size: 0.86rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}

.add-link:only-child {
  grid-column: 1 / -1;
}

.add-link:focus-visible,
.tile:focus-visible,
.data-row:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

/* the child's pages as tiles */
.tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 86px;
  padding: 12px 6px 10px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
  color: #0b3b2a;
  text-decoration: none;
  text-align: center;
}

.tile:active {
  background: #f1f8f4;
}

.tile-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #e3f1ea;
  color: #0a5c40;
}

.tile-dot {
  position: absolute;
  top: -5px;
  right: -7px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #b45309;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 18px;
}

.tile-label {
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.2;
}

/* data ananda */
.data-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 4px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
  color: #0b3b2a;
  text-decoration: none;
}

.data-row-label {
  flex: 1;
  font-size: 0.92rem;
  font-weight: 700;
}

.data-row-hint {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0a5c40;
}

.data-row-go {
  font-size: 1.4rem;
  line-height: 1;
  color: #0a5c40;
}

.data-cta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: #fffbeb;
  border: 1px solid #f3d58b;
}

.data-cta.is-danger {
  background: #fdf3f2;
  border-color: #f5b5ad;
}

.data-cta-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  font-size: 0.88rem;
  color: #5b3a06;
}

.data-cta.is-danger .data-cta-text {
  color: #7a1810;
}

.data-cta-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 8px;
}

.data-cta-head strong {
  font-size: 0.92rem;
  color: #0b3b2a;
}

.data-cta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.data-cta-sub {
  font-size: 0.82rem;
  color: #7c5a1a;
}

.reg-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #0b3b2a;
  text-decoration: none;
  background: #fffdf7;
  border-color: rgba(180, 83, 9, 0.28);
}

.reg-card:focus-visible,
.start-card:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.reg-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 10px;
}

.reg-top strong {
  font-size: 1.02rem;
}

.reg-line {
  font-size: 0.88rem;
  color: #475a50;
}

.reg-more {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0a5c40;
}

.start {
  display: grid;
  gap: 10px;
}

.start .w-section-title {
  margin-bottom: 0;
}

.start-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  background: #fff;
  border: 1.5px solid rgba(11, 59, 42, 0.14);
  color: #0b3b2a;
  text-decoration: none;
  box-shadow: 0 10px 24px -18px rgba(3, 41, 29, 0.35);
}

.start-main {
  min-height: 92px;
}

.start-go {
  margin-left: auto;
  font-size: 1.8rem;
  line-height: 1;
  opacity: 0.9;
}

.start-help {
  margin: 2px 4px 14px;
  font-size: 0.92rem;
  line-height: 1.5;
  color: #475a50;
}

.start-help strong {
  display: block;
  color: #0b3b2a;
}

.start-card.is-new {
  background: linear-gradient(150deg, #0a5c40, #053d2c);
  border-color: transparent;
  color: #fff;
}

.start-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: #e3f1ea;
  color: #0a5c40;
}

.start-card.is-new .start-icon {
  background: #fcd34d;
  color: #053d2c;
}

.start-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.start-text strong {
  font-size: 1.02rem;
}

.start-text span {
  font-size: 0.86rem;
  color: #5b6b62;
}

.start-card.is-new .start-text span {
  color: rgba(209, 250, 229, 0.85);
}

.request-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.request-card .w-help {
  flex-basis: 100%;
  margin: 0;
}

.feedback-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  padding: 13px 15px;
  text-decoration: none;
  color: #0b3b2a;
}

.feedback-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #e3f1ea;
  color: #0a5c40;
}

.feedback-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.feedback-text strong {
  font-size: 0.96rem;
  font-weight: 800;
}

.feedback-text span {
  font-size: 0.82rem;
  color: #5b6b62;
  line-height: 1.35;
}

.feedback-go {
  font-size: 1.35rem;
  color: #0a5c40;
}
</style>
