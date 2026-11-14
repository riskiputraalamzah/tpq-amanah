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

      <!-- No child linked yet: a new family registers, a family already at the TPQ links with the code -->
      <div v-if="!santri.length" class="start">
        <h2 class="w-section-title">{{ registrations.length ? 'Lainnya' : 'Mulai dari sini' }}</h2>
        <router-link to="/wali/daftar/baru" class="start-card is-new">
          <span class="start-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
          </span>
          <span class="start-text">
            <strong>Daftarkan santri baru</strong>
            <span>Ananda belum mengaji di TPQ Amanah</span>
          </span>
        </router-link>
        <router-link to="/wali/tautkan" class="start-card">
          <span class="start-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
          </span>
          <span class="start-text">
            <strong>Tautkan dengan kode</strong>
            <span>Ananda sudah mengaji di sini: masukkan kode dari slip atau ustadz/ustadzah</span>
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

          <!-- Data ananda: a quiet row when done, a clear call when something is needed -->
          <router-link v-if="dataDone(s)" :to="`/wali/santri/${s.santriId}`" class="data-row">
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
          <p v-if="s.hasPendingIdentity" class="w-note is-warn child-note">Perubahan identitas sedang dicek admin.</p>
        </article>

        <!-- another child: kept small here (also under Akun) -->
        <div class="add-row" role="group" aria-label="Tambah ananda">
          <router-link to="/wali/tautkan" class="add-link">+ Tautkan anak lain</router-link>
          <router-link to="/wali/daftar/baru" class="add-link">+ Daftarkan santri baru</router-link>
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
            {{ r.status === 'rejected' ? 'Ditolak' : 'Menunggu dicek admin' }}
          </span>
          <p v-if="r.status === 'rejected' && r.reason" class="w-help">Alasan: {{ r.reason }}</p>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { STATUS } from '@/utils/santriProfile'
import { REG_STATUS, longDate } from '@/utils/pendaftaran'
import { useWaliAnnouncements } from '@/composables/useWaliAnnouncements'

const loading = ref(true)
const loadError = ref('')
const wali = ref(null)
const santri = ref([])
const requests = ref([])
const registrations = ref([])
const expanded = ref([])
// announcements: shared with the Pengumuman tab and its badge (closed ones are remembered on this phone)
const { onHome: annOnHome, refresh: refreshAnnouncements, dismiss } = useWaliAnnouncements()
const toggleMore = (id) => {
  expanded.value = expanded.value.includes(id) ? expanded.value.filter((x) => x !== id) : [...expanded.value, id]
}
const nameInput = ref('')
const savingName = ref(false)

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

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [{ data }, regs] = await Promise.all([
      api.get('/wali/me', { cache: false }),
      // a failure here must not hide the children
      api.get('/pendaftaran/mine', { cache: false }).then((r) => r.data || []).catch(() => []),
      refreshAnnouncements({ force: true }),
    ])
    wali.value = data.wali
    santri.value = data.santri || []
    requests.value = data.requests || []
    // accepted: the child is under Ananda now; cancelled by the parent themselves: nothing to show
    registrations.value = regs.filter((r) => r.status !== 'accepted' && !(r.status === 'cancelled' && r.cancelledBy === 'wali'))
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Data belum bisa dimuat. Periksa koneksi lalu muat ulang.'
  } finally {
    loading.value = false
  }
}

async function saveName() {
  savingName.value = true
  try {
    const { data } = await api.put('/wali/me', { name: nameInput.value })
    wali.value = data
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Nama belum tersimpan.'
  } finally {
    savingName.value = false
  }
}

onMounted(load)
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
  padding: 6px 10px;
  border-radius: 12px;
  border: 1.5px dashed rgba(11, 59, 42, 0.25);
  color: #0a5c40;
  font-size: 0.86rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
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
</style>
