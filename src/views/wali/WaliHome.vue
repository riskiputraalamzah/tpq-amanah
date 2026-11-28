<template>
  <div>
    <PageSkeleton v-if="loading" :rows="3" label="Memuat data" />

    <template v-else>
      <header class="home-head">
        <h1 class="w-title">Assalamu'alaikum{{ wali?.name ? `, ${wali.name}` : '' }}</h1>
        <p class="home-sub">{{ homeLead }}</p>
      </header>

      <p v-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

      <!-- a new feature in the portal: one line to its guide, gone once the guide was opened on this phone -->
      <router-link v-if="newFeatures.length && santri.length" :to="`/wali/panduan#wali-${newFeatures[0].topics.wali}`" class="new-feat">
        <span class="new-feat-pill">Baru</span>
        <span class="new-feat-text">{{ newFeatures.map((r) => r.title.split(' (')[0]).join(' · ') }}<small>Lihat cara pakainya</small></span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
      </router-link>

      <!-- Compact, scannable announcements from the TPQ (no eyebrow kicker; expands inline) -->
      <section v-if="annOnHome.length" class="ann-list" aria-label="Pengumuman TPQ">
        <article v-for="a in annOnHome" :key="a.id" class="ann-card">
          <div class="ann-row">
            <span class="ann-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Z" /><path d="M16 9a3 3 0 0 1 0 6" /></svg>
            </span>
            <div class="ann-content">
              <div class="ann-head">
                <h2 class="ann-title">{{ a.title }}</h2>
                <button type="button" class="ann-close" :aria-label="`Tutup pengumuman ${a.title}`" @click="dismiss(a.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <p class="ann-body" :class="{ 'is-clamped': !expanded.includes(a.id) && a.body.length > 130 }">{{ a.body }}</p>
              <button v-if="a.body.length > 130" type="button" class="ann-more" @click="toggleMore(a.id)">
                {{ expanded.includes(a.id) ? 'Tutup' : 'Baca selengkapnya' }}
              </button>
            </div>
          </div>
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
          <span class="reg-more">
            {{ r.status === 'draft' ? 'Lanjutkan mengisi' : r.fixRequest ? 'Perbaiki data' : 'Lihat status' }}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </span>
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
          <svg class="start-go" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
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
        <div class="w-section-head ananda-head">
          <h2 class="w-section-title">Ananda</h2>
          <nav v-if="santri.length > 1" class="kid-jumps" aria-label="Lompat ke ananda">
            <button v-for="s in santri" :key="s.santriId" type="button" class="kid-jump" @click="scrollToChild(s.santriId)">
              {{ firstName(s.name) }}
              <span v-if="needsAttention(s)" class="kid-jump-dot" aria-hidden="true"></span>
            </button>
          </nav>
        </div>

        <article v-for="s in santri" :id="`child-${s.santriId}`" :key="s.santriId" class="w-card child-card">
          <!-- Identity row -->
          <div class="child-head">
            <div class="child-avatar" aria-hidden="true">{{ initials(s.name) }}</div>
            <div class="child-text">
              <div class="child-name-row">
                <strong>{{ s.name }}</strong>
              </div>
              <div class="child-meta">
                <span class="child-level">{{ levelName(s.classId) }}</span>
                <span v-if="s.nomorInduk" class="child-induk">No. induk {{ s.nomorInduk }}</span>
              </div>
            </div>
          </div>

          <!-- Monthly attendance summary: one integrated strip, zero counts muted so real numbers pop -->
          <router-link :to="`/wali/santri/${s.santriId}/progres`" class="month-strip" :aria-label="`Kehadiran dan materi ${s.name}`">
            <div class="month-strip-top">
              <span class="month-strip-title">Kehadiran {{ monthName(s.thisMonth?.month) }}</span>
              <span class="month-strip-more">
                Riwayat &amp; materi
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
              </span>
            </div>
            <div class="month-strip-grid">
              <div v-for="t in TILES" :key="t.key" class="ms-cell" :class="[`is-${t.key}`, { 'is-zero': !(s.thisMonth?.[t.key] > 0) }]">
                <strong>{{ s.thisMonth?.[t.key] ?? 0 }}</strong>
                <span>{{ t.label }}</span>
              </div>
            </div>
          </router-link>

          <!-- Alfa crosscheck shortcut (only when alfa > 0) -->
          <router-link
            v-if="s.thisMonth?.alfa > 0"
            :to="`/wali/santri/${s.santriId}/progres?koreksi=terbaru`"
            class="alfa-crosscheck-row"
          >
            <svg class="alfa-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <span class="alfa-crosscheck-text">
              Tercatat <strong>{{ s.thisMonth.alfa }} alfa</strong> · Ajukan crosscheck / koreksi
            </span>
            <svg class="alfa-crosscheck-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </router-link>

          <!-- Unified action dock (not nested floating cards) -->
          <nav class="tiles" :aria-label="`Menu ${s.name}`">
            <router-link :to="`/wali/santri/${s.santriId}/prestasi`" class="tile" :aria-label="s.kpsUnsigned ? `Kartu prestasi, ${s.kpsUnsigned} belum diparaf` : 'Kartu prestasi'">
              <span class="tile-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z" /><path d="M4 19.5A2 2 0 0 0 6 21.5h13" /><path d="m9 10 2 2 4-4" /></svg>
                <span v-if="s.kpsUnsigned" class="tile-dot">{{ s.kpsUnsigned > 9 ? '9+' : s.kpsUnsigned }}</span>
              </span>
              <span class="tile-label">Kartu prestasi</span>
            </router-link>
            <router-link :to="`/wali/santri/${s.santriId}/izin`" class="tile">
              <span class="tile-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m9.5 14.5 5 5m0-5-5 5" /></svg>
              </span>
              <span class="tile-label">Izin / sakit</span>
            </router-link>
            <router-link :to="`/wali/santri/${s.santriId}/rapor`" class="tile">
              <span class="tile-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.5 13.2 17 22l-5-3-5 3 1.5-8.8" /></svg>
              </span>
              <span class="tile-label">Rapor &amp; jilid</span>
            </router-link>
            <router-link :to="`/wali/santri/${s.santriId}/kegiatan`" class="tile">
              <span class="tile-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" /><path d="M4 6v12a2 2 0 0 0 2 2h14v-4" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
                <span v-if="s.activities?.length" class="tile-dot">{{ s.activities.length }}</span>
              </span>
              <span class="tile-label">Kegiatan &amp; tabungan</span>
            </router-link>
          </nav>

          <!-- Open activities (clickable: opens Kegiatan & tabungan directly) -->
          <div v-if="s.activities?.length" class="act-lines">
            <router-link v-for="k in s.activities" :key="k.id" :to="`/wali/santri/${s.santriId}/kegiatan`" class="act-line">
              <strong class="act-title">{{ k.title }}</strong>
              <span class="act-right">
                <span class="w-pill" :class="`is-${k.paymentState === 'lunas' || k.paymentState === 'gratis' ? 'ok' : k.paymentState === 'sebagian' ? 'warn' : 'danger'}`">{{ k.payment }}</span>
                <svg class="w-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
              </span>
            </router-link>
          </div>

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
            <svg class="w-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
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

        <!-- Secondary utilities: calmer hierarchy below the children -->
        <div class="add-row" role="group" aria-label="Tambah ananda">
          <router-link to="/wali/tautkan" class="add-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Tambah anak lain (pakai kode slip)
          </router-link>
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
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
        </span>
        <span class="feedback-text">
          <strong>Saran &amp; Kritik</strong>
          <span>Bantu kami menjadikan aplikasi &amp; layanan TPQ Amanah lebih baik</span>
        </span>
        <span v-if="repliedFeedbackCount" class="w-pill is-ok">{{ repliedFeedbackCount }} tanggapan</span>
        <svg class="w-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
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
import { unseenReleases } from '@/content/panduan'

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

const dataDone = (s) => ['submitted', 'verified'].includes(s.profileStatus)
const needsAttention = (s) => !dataDone(s) || !!s.verifiedNote || (s.thisMonth?.alfa > 0)
// releases of the portal this phone has not opened in Panduan yet
const newFeatures = ref(unseenReleases('wali'))

const homeLead = computed(() => {
  if (!santri.value.length) return 'Tautkan data ananda dengan kode slip dari TPQ Amanah.'
  if (santri.value.some((s) => !dataDone(s) || s.verifiedNote)) return 'Pantau kehadiran, materi, dan lengkapi data ananda.'
  return 'Pantau kehadiran, materi, dan kabar mengaji ananda.'
})

const TILES = [
  { key: 'hadir', label: 'Hadir' },
  { key: 'izin', label: 'Izin' },
  { key: 'sakit', label: 'Sakit' },
  { key: 'alfa', label: 'Alfa' },
]
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const monthName = (ym) => {
  const m = Number(String(ym || '').split('-')[1])
  return m ? MONTHS[m - 1] : 'bulan ini'
}
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'Ananda'
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

function scrollToChild(santriId) {
  const el = document.getElementById(`child-${santriId}`)
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

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
.home-head {
  margin-bottom: 14px;
}

.home-sub {
  margin: 2px 0 0;
  color: var(--w-body);
  font-size: 0.9rem;
  line-height: 1.45;
}

/* Compact announcement banner */
.ann-list {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.ann-card {
  padding: 12px 12px 12px 14px;
  border-radius: 16px;
  background: linear-gradient(160deg, #fffdf6, #fff7dd);
  border: 1px solid #eed085;
  box-shadow: 0 8px 20px -18px rgba(120, 80, 10, 0.45);
}

.ann-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.ann-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  margin-top: 2px;
  border-radius: 10px;
  background: #fde6a8;
  color: #8f4106;
}

.ann-content {
  flex: 1;
  min-width: 0;
}

.ann-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.ann-title {
  margin: 2px 0 2px;
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.3;
  color: #3b2404;
}

.ann-close {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  margin: -6px -4px -4px 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #7c5214;
  cursor: pointer;
}

.ann-close:hover {
  background: rgba(154, 71, 8, 0.1);
}

.ann-close:focus-visible,
.ann-more:focus-visible,
.kid-jump:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: 2px;
}

.ann-body {
  margin: 2px 0 0;
  font-size: 0.87rem;
  line-height: 1.5;
  color: #4f370f;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.ann-body.is-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ann-more {
  margin-top: 4px;
  padding: 2px 0;
  border: 0;
  background: none;
  color: #0a5c40;
  font: inherit;
  font-size: 0.83rem;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

/* Multi-child quick jumps */
.ananda-head {
  margin-top: 18px;
}

.kid-jumps {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.kid-jump {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  color: var(--w-ink);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.kid-jump:active {
  background: var(--w-emerald-soft);
}

.kid-jump-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c2410c;
}

/* Child card: one calm surface, internal hairline rhythm, zero nested card bloat */
.child-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-margin-top: 72px;
}

.child-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.child-avatar {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #0a5c40, #053d2c);
  color: var(--w-gold);
  font-size: 0.96rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.child-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.child-name-row strong {
  font-size: 1.04rem;
  font-weight: 800;
  line-height: 1.25;
  color: var(--w-ink);
}

.child-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.child-level {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-size: 0.75rem;
  font-weight: 800;
}

.child-induk {
  font-size: 0.78rem;
  color: var(--w-muted);
  font-variant-numeric: tabular-nums;
}

/* Monthly attendance strip: unified grid inside child card */
.month-strip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 11px 12px 10px;
  border-radius: 14px;
  background: #f3f7f4;
  border: 1px solid rgba(11, 59, 42, 0.09);
  color: var(--w-ink);
  text-decoration: none;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.month-strip:hover {
  background: #ebf3ee;
}

.month-strip:active {
  background: #e3eee7;
}

.month-strip:focus-visible,
.alfa-crosscheck-row:focus-visible,
.act-line:focus-visible,
.add-link:focus-visible,
.tile:focus-visible,
.data-row:focus-visible,
.feedback-card:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: 2px;
}

.month-strip-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.month-strip-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--w-muted);
}

.month-strip-more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--w-emerald);
}

.month-strip-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(11, 59, 42, 0.07);
}

.ms-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 2px 0;
}

.ms-cell strong {
  font-size: 1.18rem;
  font-weight: 800;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}

.ms-cell span {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--w-muted);
}

.ms-cell.is-hadir strong { color: #0a5c40; }
.ms-cell.is-izin strong { color: #19487f; }
.ms-cell.is-sakit strong { color: #8c4009; }
.ms-cell.is-alfa strong { color: #9f1b12; }

/* Mute zero counts so real absences & attendances pop immediately */
.ms-cell.is-zero strong {
  color: #6b7b72;
  font-weight: 700;
}

/* Alfa crosscheck callout */
.alfa-crosscheck-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff7e6;
  border: 1px solid #eec982;
  color: #7c3a0d;
  font-size: 0.84rem;
  font-weight: 700;
  text-decoration: none;
}

.alfa-icon,
.alfa-crosscheck-go {
  flex: none;
}

.alfa-crosscheck-text {
  flex: 1;
  min-width: 0;
  line-height: 1.35;
}

.new-feat {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: linear-gradient(150deg, #0a5c40, #053d2c);
  color: #fbf9f3;
  text-decoration: none;
}

.new-feat-pill {
  flex: none;
  padding: 3px 9px;
  border-radius: 999px;
  background: #fcd34d;
  color: #3a2405;
  font-size: 0.72rem;
  font-weight: 800;
}

.new-feat-text {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 1px;
  font-size: 0.9rem;
  font-weight: 700;
}

.new-feat-text small {
  font-size: 0.78rem;
  font-weight: 500;
  color: #b6d3c4;
}

/* Unified action dock (flat, quiet, touch-friendly): 4 tiles in a row, 2 x 2 on a very narrow phone */
.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 4px;
  border-radius: 14px;
  background: #f6f7f4;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 76px;
  padding: 10px 6px 8px;
  border-radius: 11px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.07);
  color: var(--w-ink);
  text-decoration: none;
  text-align: center;
  transition: background-color 0.14s ease, transform 0.12s ease;
}

.tile:hover {
  background: #f4faf6;
}

.tile:active {
  background: #e7f3ec;
  transform: scale(0.97);
}

.tile-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
}

.tile-dot {
  position: absolute;
  top: -5px;
  right: -6px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: #b45309;
  color: #fff;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 17px;
  text-align: center;
}

.tile-label {
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1.22;
}

@media (max-width: 340px) {
  .tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Open activities: clickable summary rows */
.act-lines {
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
  padding-top: 6px;
}

.act-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 40px;
  padding: 4px 2px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--w-ink);
  text-decoration: none;
}

.act-line:active {
  background: var(--w-surface-soft);
}

.act-title {
  min-width: 0;
  font-weight: 700;
}

.act-right {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Data ananda row & callout */
.data-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  margin-bottom: -4px;
  padding: 6px 2px 0;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
  color: var(--w-ink);
  text-decoration: none;
}

.data-row-label {
  flex: 1;
  min-width: 0;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--w-body);
  white-space: nowrap;
}

.data-row-hint {
  flex: none;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--w-emerald);
  white-space: nowrap;
}

@media (max-width: 375px) {
  .data-row {
    gap: 6px;
  }

  .data-row .w-pill {
    padding: 2px 8px;
    font-size: 0.73rem;
  }

  .data-row-hint {
    font-size: 0.74rem;
  }
}

.data-cta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 13px;
  border-radius: 13px;
  background: #fffbeb;
  border: 1px solid #eed085;
}

.data-cta.is-danger {
  background: #fdf2f0;
  border-color: #f3b5ad;
}

.data-cta-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.45;
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
  font-size: 0.9rem;
  color: var(--w-ink);
}

.data-cta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.data-cta-sub {
  font-size: 0.8rem;
  color: #7c5214;
}

.child-note {
  margin: 0;
}

/* Secondary actions */
.add-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.add-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 8px 14px;
  border-radius: 13px;
  border: 1px dashed rgba(11, 59, 42, 0.24);
  background: rgba(255, 255, 255, 0.65);
  color: var(--w-emerald);
  font-size: 0.84rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.add-link:hover {
  background: #fff;
}

.add-link:only-child {
  grid-column: 1 / -1;
}

.name-card {
  margin-top: 18px;
}

/* Registration & start cards */
.reg-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--w-ink);
  text-decoration: none;
  background: #fffdf7;
  border-color: rgba(180, 83, 9, 0.28);
}

.reg-card:focus-visible,
.start-card:focus-visible {
  outline: 3px solid var(--w-gold-deep);
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
  font-size: 1rem;
}

.reg-line {
  font-size: 0.86rem;
  color: var(--w-body);
}

.reg-more {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 2px;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--w-emerald);
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
  color: var(--w-ink);
  text-decoration: none;
  box-shadow: 0 10px 24px -18px rgba(3, 41, 29, 0.35);
}

.start-main {
  min-height: 90px;
}

.start-go {
  flex: none;
  margin-left: auto;
  opacity: 0.9;
}

.start-help {
  margin: 2px 4px 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--w-body);
}

.start-help strong {
  display: block;
  color: var(--w-ink);
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
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
}

.start-card.is-new .start-icon {
  background: var(--w-gold);
  color: var(--w-emerald-dark);
}

.start-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.start-text strong {
  font-size: 1rem;
}

.start-text span {
  font-size: 0.85rem;
  color: var(--w-muted);
}

.start-card.is-new .start-text span {
  color: rgba(209, 250, 229, 0.88);
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
  margin-top: 14px;
  padding: 13px 14px;
  text-decoration: none;
  color: var(--w-ink);
  transition: background-color 0.15s ease;
}

.feedback-card:hover {
  background: #fafcf9;
}

.feedback-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
}

.feedback-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.feedback-text strong {
  font-size: 0.94rem;
  font-weight: 800;
}

.feedback-text span {
  font-size: 0.8rem;
  color: var(--w-muted);
  line-height: 1.35;
}
</style>
