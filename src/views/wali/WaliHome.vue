<template>
  <div>
    <PageSkeleton v-if="loading" :rows="3" label="Memuat data" />

    <template v-else>
      <h1 class="w-title">Assalamu'alaikum{{ wali?.name ? `, ${wali.name}` : '' }}</h1>
      <p class="w-lead">Lihat kehadiran dan materi ananda, dan lengkapi datanya agar TPQ mudah menghubungi Bapak/Ibu.</p>

      <p v-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

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
          <span class="reg-more">{{ r.status === 'draft' ? 'Lanjutkan mengisi ›' : 'Lihat status ›' }}</span>
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

          <p class="data-status">Data ananda: <span class="w-pill" :class="`is-${status(s).tone}`">{{ status(s).label }}</span></p>
          <p v-if="s.profileStatus === 'needs_fix' && s.adminNote" class="w-note is-danger child-note">
            <span><strong>Catatan admin:</strong> {{ s.adminNote }}</span>
          </p>
          <p v-else-if="s.hasPendingIdentity" class="w-note is-warn child-note">Perubahan identitas sedang dicek admin.</p>

          <!-- this month's attendance; tap for the meetings and material -->
          <router-link :to="`/wali/santri/${s.santriId}/progres`" class="month-strip" :aria-label="`Kehadiran dan materi ${s.name}`">
            <span class="month-strip-title">Kehadiran {{ monthName(s.thisMonth?.month) }}</span>
            <span class="month-strip-counts">
              <span v-for="t in TILES" :key="t.key" :class="`is-${t.key}`"><strong>{{ s.thisMonth?.[t.key] ?? 0 }}</strong> {{ t.label }}</span>
            </span>
            <span class="month-strip-more">Lihat kehadiran &amp; materi ›</span>
          </router-link>

          <!-- munaqosyah and the like (open ones), and the tabungan -->
          <router-link :to="`/wali/santri/${s.santriId}/kegiatan`" class="month-strip" :aria-label="`Kegiatan dan tabungan ${s.name}`">
            <span class="month-strip-title">Kegiatan &amp; tabungan</span>
            <span v-if="s.activities?.length" class="act-lines">
              <span v-for="k in s.activities" :key="k.id" class="act-line">
                <strong>{{ k.title }}</strong>
                <span class="w-pill" :class="`is-${k.paymentState === 'lunas' || k.paymentState === 'gratis' ? 'ok' : k.paymentState === 'sebagian' ? 'warn' : 'danger'}`">{{ k.payment }}</span>
              </span>
            </span>
            <span class="month-strip-more">{{ s.activities?.length ? 'Lihat rincian, persyaratan & tabungan' : 'Lihat kegiatan & tabungan' }} ›</span>
          </router-link>

          <router-link :to="`/wali/santri/${s.santriId}`" class="w-btn" :class="actionClass(s)">
            {{ actionLabel(s) }}
          </router-link>
        </article>

        <div class="add-row">
          <router-link to="/wali/tautkan" class="w-btn w-btn-ghost">+ Tautkan anak lain</router-link>
          <router-link to="/wali/daftar/baru" class="w-btn w-btn-ghost">+ Daftarkan santri baru</router-link>
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

const loading = ref(true)
const loadError = ref('')
const wali = ref(null)
const santri = ref([])
const requests = ref([])
const registrations = ref([])
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
  if (r.status === 'draft') return 'Belum dikirim. Isian sudah tersimpan.'
  if (r.status === 'scheduled' && r.schedule) return `Penempatan jilid: ${longDate(r.schedule.date, { weekday: true })}${r.schedule.time ? `, ${r.schedule.time}` : ''}`
  if (r.status === 'cancelled') return r.cancelReason ? `Alasan: ${r.cancelReason}` : 'Pendaftaran tidak dilanjutkan.'
  if (r.status === 'contacted') return `${r.number} · Sudah dihubungi, menunggu jadwal penempatan`
  return `${r.number} · Ustadz/ustadzah akan menghubungi Bapak/Ibu`
}
const actionClass = (s) => (['submitted', 'verified'].includes(s.profileStatus) ? 'w-btn-ghost' : 'w-btn-primary')

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [{ data }, regs] = await Promise.all([
      api.get('/wali/me', { cache: false }),
      // a failure here must not hide the children
      api.get('/pendaftaran/mine', { cache: false }).then((r) => r.data || []).catch(() => []),
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
  gap: 10px;
  margin-top: 14px;
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
