<template>
  <div>
    <PageSkeleton v-if="loading" :rows="5" label="Memuat" />
    <div v-else-if="loadError" class="w-card w-center">
      <p class="w-note is-danger" role="alert">{{ loadError }}</p>
      <router-link to="/wali" class="w-btn w-btn-ghost">Kembali ke beranda</router-link>
    </div>

    <template v-else>
      <router-link to="/wali" class="w-back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        Beranda
      </router-link>

      <WaliChildSwitch :active-id="santriId" section="izin" />

      <header class="iz-head">
        <h1 class="w-title">Izin / sakit</h1>
        <div class="iz-who">
          <strong>{{ page.santri.name }}</strong>
          <span v-if="levelName(page.santri.classId)" class="iz-level">{{ levelName(page.santri.classId) }}</span>
        </div>
        <p class="w-lead iz-lead">Langsung tercatat di daftar hadir TPQ dan diteruskan ke ustadz/ustadzah jilidnya, tidak perlu mengabari lagi.</p>
      </header>

      <!-- just sent -->
      <div v-if="done" class="w-card done-card" role="status">
        <div class="done-row">
          <span class="done-icon" aria-hidden="true"><LineIcon name="check" :size="20" :stroke="3" /></span>
          <div>
            <p class="done-title">{{ done.replaced ? `${done.type === 'sakit' ? 'Sakit' : 'Izin'} diperbarui` : `${done.type === 'sakit' ? 'Sakit' : 'Izin'} tercatat` }}</p>
            <p class="done-text">{{ done.recorded.map((d) => dayLabel(d)).join(', ') }} · {{ SLOT_NAME[done.slot] }}</p>
            <p v-if="done.teachersNotified" class="done-text">Ustadz/ustadzah jilid ini diberi tahu lewat WhatsApp 2 menit lagi. Ada yang keliru? Batalkan sebelum itu, pesannya tidak akan terkirim.</p>
          </div>
        </div>
        <p v-if="done.teacher.length" class="w-note is-warn done-teacher">
          <span>{{ done.teacher.map((t) => t.label).join(', ') }} sudah dicatat ustadz/ustadzah, jadi tidak diubah.</span>
        </p>
        <p class="w-help">Semoga ananda lekas sehat dan dimudahkan urusannya.</p>
        <button type="button" class="w-btn w-btn-ghost" @click="done = null">Ajukan izin tanggal lain</button>
      </div>

      <form v-else class="w-card izin-form" novalidate @submit.prevent="send()">
        <div class="w-field">
          <span id="iz-type" class="w-label">Jenis<span class="w-req" aria-hidden="true">*</span></span>
          <div class="w-chips" role="radiogroup" aria-labelledby="iz-type">
            <button v-for="t in TYPES" :key="t.value" type="button" role="radio" class="w-chip" :aria-checked="type === t.value" @click="type = t.value">{{ t.label }}</button>
          </div>
        </div>

        <div class="w-field">
          <span id="iz-slot" class="w-label">Sesi</span>
          <div class="w-chips" role="radiogroup" aria-labelledby="iz-slot">
            <button v-for="s in ['wave_1', 'wave_2']" :key="s" type="button" role="radio" class="w-chip" :aria-checked="slot === s" @click="setSlot(s)">
              {{ SLOT_NAME[s] }}
            </button>
          </div>
          <span class="w-help">Sesi ananda biasanya {{ SLOT_NAME[page.slot] }}.</span>
        </div>

        <div class="w-field">
          <div class="days-head">
            <span id="iz-days" class="w-label">Tanggal<span class="w-req" aria-hidden="true">*</span></span>
            <span v-if="dates.length" class="days-picked">{{ dates.length }} hari dipilih</span>
          </div>
          <div class="day-grid" role="group" aria-labelledby="iz-days">
            <button
              v-for="d in days"
              :key="d"
              type="button"
              class="day-chip" :class="{ 'has-existing': !!activeByDay.get(d) }"
              :aria-pressed="dates.includes(d)"
              @click="toggleDay(d)"
            >
              <span class="day-top">{{ d === today ? 'Hari ini' : dayShort(d) }}</span>
              <strong>{{ dayNum(d) }}</strong>
              <span v-if="activeByDay.get(d)" class="day-tag">
                {{ activeByDay.get(d).type === 'sakit' ? 'Sudah sakit' : 'Sudah izin' }}
              </span>
            </button>
          </div>
          <span v-if="!days.includes(today) && isSchoolDay(today)" class="w-help">
            Izin untuk hari ini bisa diajukan pukul {{ page.opens }}-{{ page.closes[slot] }}.
          </span>
          <span v-else class="w-help">Bisa memilih beberapa hari, sampai 7 hari ke depan (Senin-Jumat).</span>
          <span v-if="errors.dates" class="w-error" role="alert">{{ errors.dates }}</span>
        </div>

        <!-- Duplicate / existing active izin warning -->
        <div v-if="overlappingExisting.length" class="w-note is-warn dup-warn" role="status">
          <p class="dup-title">
            Sudah ada catatan {{ firstOverlap.type === 'sakit' ? 'Sakit' : 'Izin' }} untuk {{ overlapDaysText }} ({{ SLOT_NAME[slot] }})
          </p>
          <p class="dup-detail">
            "{{ firstOverlap.reason }}"<template v-if="firstOverlap.byName"> · dicatat {{ firstOverlap.byName }}</template>
          </p>
          <p class="dup-hint">
            Bila sudah sesuai, <strong>tidak perlu mengirim ulang</strong>. Bila ingin mengubah jenis atau alasannya, ubah isian di bawah lalu tekan <strong>Perbarui izin</strong>.
          </p>
          <div class="dup-actions">
            <button type="button" class="dup-btn" @click="prefillEdit(firstOverlap)">Isi form untuk ubah</button>
            <button v-if="firstOverlap.cancellable" type="button" class="dup-btn is-danger" @click="cancel(firstOverlap)">Batalkan izin ini</button>
          </div>
        </div>

        <div class="w-field">
          <label for="iz-reason">Alasan<span class="w-req" aria-hidden="true">*</span></label>
          <input id="iz-reason" v-model="reason" class="w-input" :class="{ 'is-invalid': errors.reason }" maxlength="200"
            :placeholder="type === 'sakit' ? 'Contoh: demam sejak semalam' : 'Contoh: acara keluarga'" :aria-invalid="!!errors.reason" />
          <div class="quick">
            <button v-for="q in QUICK[type]" :key="q" type="button" class="quick-chip" :class="{ 'is-picked': reason === q }" @click="reason = q">{{ q }}</button>
          </div>
          <span v-if="errors.reason" class="w-error" role="alert">{{ errors.reason }}</span>
        </div>

        <p v-if="sendError" class="w-note is-danger" role="alert">{{ sendError }}</p>
        <button type="submit" class="w-btn w-btn-primary" :disabled="sending">
          <template v-if="sending">Mengirim…</template>
          <template v-else-if="overlappingExisting.length">Perbarui {{ type === 'sakit' ? 'kabar sakit' : 'izin' }} yang ada</template>
          <template v-else-if="dates.length">Kirim {{ type === 'sakit' ? 'kabar sakit' : 'izin' }} ({{ dates.length }} hari)</template>
          <template v-else>Kirim {{ type === 'sakit' ? 'kabar sakit' : 'izin' }}</template>
        </button>
      </form>

      <!-- earlier requests -->
      <template v-if="page.list.length">
        <h2 class="w-section-title">Izin 30 hari terakhir</h2>
        <article v-for="x in page.list" :key="x.id" class="w-card past-card">
          <div class="past-top">
            <strong>{{ x.type === 'sakit' ? 'Sakit' : 'Izin' }} · {{ SLOT_NAME[x.slot] }}</strong>
            <span class="w-pill" :class="x.status === 'active' ? 'is-ok' : 'is-idle'">{{ x.status === 'active' ? 'Tercatat' : x.status === 'cancelled' ? 'Dibatalkan' : 'Sebagian dibatalkan' }}</span>
          </div>
          <p class="past-days">{{ x.dates.map((d) => dayLabel(d)).join(', ') }}</p>
          <p class="w-help">"{{ x.reason }}"<template v-if="x.byName"> · dari {{ x.byName }}</template></p>
          <p v-if="x.status === 'active' && noticeLine(x.notice)" class="w-help past-wa" :class="{ 'is-waiting': cancelPlan(x.notice) === 'retract' }">{{ noticeLine(x.notice) }}</p>
          <div v-if="x.cancellable" class="past-actions">
            <button type="button" class="past-btn past-edit" @click="prefillEdit(x)">Ubah izin</button>
            <button type="button" class="past-btn past-cancel" @click="cancel(x)">Batalkan izin ini</button>
          </div>
        </article>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { cancelPlan, noticeLine, cancelResultText, NOTE_INPUT } from '@/utils/izinNotice'
import PageSkeleton from '@/components/PageSkeleton.vue'
import LineIcon from '@/components/LineIcon.vue'
import WaliChildSwitch from './WaliChildSwitch.vue'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'
import { invalidate } from '@/utils/waliCache'

const route = useRoute()
const { ask } = useDialog()
const toast = useToast()
const santriId = route.params.santriId

const TYPES = [
  { value: 'izin', label: 'Izin' },
  { value: 'sakit', label: 'Sakit' },
]
const SLOT_NAME = { wave_1: 'Sesi Sore', wave_2: 'Sesi Malam' }
const QUICK = {
  izin: ['Acara keluarga', 'Kegiatan sekolah', 'Bepergian'],
  sakit: ['Demam', 'Batuk pilek', 'Sakit perut'],
}
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const DAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
const wd = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay()
const dayShort = (iso) => DAYS[wd(iso)]
const dayNum = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`
const dayLabel = (iso) => `${iso === today ? 'Hari ini' : DAYS_LONG[wd(iso)]} ${dayNum(iso)}`
const isSchoolDay = (iso) => wd(iso) > 0 && wd(iso) < 6
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : '')

// shown at once from the last visit (or the warm-up after Beranda), refreshed in the background
const res = useWaliResource(() => WALI_KEYS.izin(santriId), () => waliFetch.izin(santriId))
const loading = computed(() => res.loading.value)
const loadError = computed(() => res.error.value)
const page = computed(() => res.data.value)
const type = ref('izin')
const slot = ref('wave_1')
const dates = ref([])
const reason = ref('')
const errors = ref({})
const sending = ref(false)
const sendError = ref('')
const done = ref(null)

const days = computed(() => page.value?.days?.[slot.value] || [])

// Map date -> active izin for the chosen sesi (ignoring days already overridden by teacher)
const activeByDay = computed(() => {
  const map = new Map()
  for (const item of page.value?.list || []) {
    if (item.status !== 'active' || item.slot !== slot.value) continue
    for (const d of item.dates || []) {
      if (item.applied?.[d] === 'teacher') continue
      if (!map.has(d)) map.set(d, item)
    }
  }
  return map
})

const overlappingExisting = computed(() => {
  const seen = new Set()
  const out = []
  for (const d of dates.value) {
    const hit = activeByDay.value.get(d)
    if (hit && !seen.has(hit.id)) {
      seen.add(hit.id)
      out.push(hit)
    }
  }
  return out
})
const firstOverlap = computed(() => overlappingExisting.value[0] || null)
const overlapDaysText = computed(() =>
  dates.value
    .filter((d) => activeByDay.value.has(d))
    .map((d) => dayLabel(d))
    .join(', '),
)

// a mistake already pointed out goes away as soon as it is fixed
watch(reason, (v) => {
  if (errors.value.reason && v.trim().length >= 3) errors.value = { ...errors.value, reason: '' }
  if (sendError.value) sendError.value = ''
})

function setSlot(s) {
  slotTouched = true
  slot.value = s
  dates.value = dates.value.filter((d) => days.value.includes(d))
  sendError.value = ''
}
function toggleDay(d) {
  dates.value = dates.value.includes(d) ? dates.value.filter((x) => x !== d) : [...dates.value, d].sort()
  if (errors.value.dates) errors.value = { ...errors.value, dates: '' }
  sendError.value = ''
}

function prefillEdit(x) {
  done.value = null
  slotTouched = true
  slot.value = x.slot || slot.value
  type.value = x.type === 'sakit' ? 'sakit' : 'izin'
  const openSet = new Set(page.value?.days?.[slot.value] || [])
  dates.value = (x.dates || []).filter((d) => openSet.has(d))
  reason.value = x.reason || ''
  sendError.value = ''
  errors.value = {}
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function isIdenticalToOverlap(existing) {
  if (!existing) return false
  const sameDates = [...(existing.dates || [])].sort().join(',') === [...dates.value].sort().join(',')
  return sameDates && existing.type === type.value && String(existing.reason || '').trim().toLowerCase() === reason.value.trim().toLowerCase()
}

// the child's usual sesi is the starting choice (until the parent picks one)
let slotTouched = false
watch(
  () => page.value?.slot,
  (s) => {
    if (s && !slotTouched && !done.value) slot.value = s
  },
  { immediate: true },
)

// after a change: this page asks again now; Beranda (counts) and the progress months on their next look
async function load() {
  await res.refresh()
  invalidate(WALI_KEYS.me, `progress:${santriId}:*`)
}

async function send(forceReplace = false) {
  const errs = {}
  if (!dates.value.length) errs.dates = 'Pilih tanggalnya'
  if (reason.value.trim().length < 3) errs.reason = 'Tulis alasannya singkat'
  errors.value = errs
  if (Object.keys(errs).length) return

  let replace = forceReplace === true
  if (!replace && overlappingExisting.value.length) {
    const existing = firstOverlap.value
    if (overlappingExisting.value.length === 1 && isIdenticalToOverlap(existing)) {
      sendError.value = `Catatan ${existing.type === 'sakit' ? 'sakit' : 'izin'} dengan tanggal dan alasan yang sama sudah tercatat sebelumnya ("${existing.reason}"). Tidak perlu mengirim ulang.`
      return
    }
    const ok = await ask({
      title: 'Perbarui izin yang sudah ada?',
      message: `Sudah ada catatan ${existing.type === 'sakit' ? 'sakit' : 'izin'} untuk ${overlapDaysText.value} ("${existing.reason}"). Catatan lama akan diganti dengan data baru ini sehingga tidak ganda.`,
      confirmText: 'Ya, perbarui',
      cancelText: 'Batal',
    })
    if (!ok) return
    replace = true
  }

  sending.value = true
  sendError.value = ''
  try {
    const { data } = await api.post(`/wali/santri/${santriId}/izin`, {
      type: type.value,
      dates: dates.value,
      slot: slot.value,
      reason: reason.value,
      replace,
    })
    done.value = {
      type: type.value,
      slot: slot.value,
      recorded: data.recorded,
      replaced: !!data.replaced,
      teacher: data.teacher,
      teachersNotified: data.teachersNotified || 0,
    }
    dates.value = []
    reason.value = ''
    await load()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    const resp = err.response?.data || {}
    if (err.response?.status === 409 && resp.code === 'DUPLICATE_IZIN' && !replace) {
      await load()
      const first = resp.conflicts?.[0]
      if (first?.samePayload) {
        sendError.value = resp.error || 'Izin dengan data yang sama sudah tercatat sebelumnya. Tidak perlu mengirim ulang.'
        return
      }
      const ok = await ask({
        title: 'Sudah ada izin pada tanggal ini',
        message: `${resp.error || 'Sudah ada catatan izin aktif.'} Ingin memperbarui izin yang ada dengan data baru ini?`,
        confirmText: 'Perbarui izin',
        cancelText: 'Batal',
      })
      if (ok) {
        sending.value = false
        return send(true)
      }
      return
    }
    sendError.value = resp.error || 'Belum terkirim. Periksa koneksi lalu coba lagi.'
  } finally {
    sending.value = false
  }
}

// Still in the 2-minute window: the teachers' message is taken back unseen. Already sent: the bot sends them a
// correction with an apology, with the parent's optional note (utils/izinNotice.js)
async function cancel(x) {
  const label = x.type === 'sakit' ? 'Sakit' : 'Izin'
  const base = `${label} untuk ${x.dates.map((d) => dayLabel(d)).join(', ')} dibatalkan. Hari yang sudah lewat tetap tercatat.`
  const plan = cancelPlan(x.notice)
  let note = ''
  if (plan === 'apologize') {
    const text = await ask({
      title: 'Batalkan izin?',
      message: `${base} Ustadz/ustadzah sudah menerima kabar izinnya, jadi akan dikirimi ralat beserta permintaan maaf.`,
      tone: 'danger',
      confirmText: 'Batalkan & kirim ralat',
      cancelText: 'Kembali',
      input: { ...NOTE_INPUT, label: 'Pesan untuk ustadz/ustadzah (opsional)', placeholder: 'mis. alhamdulillah sudah sehat, ananda masuk' },
    })
    if (text === null) return
    note = text
  } else {
    const ok = await ask({
      title: 'Batalkan izin?',
      message: plan === 'retract' ? `${base} Kabar ke ustadz/ustadzah belum terkirim, jadi ikut dibatalkan.` : base,
      tone: 'danger',
      confirmText: 'Batalkan izin',
      cancelText: 'Kembali',
    })
    if (!ok) return
  }
  try {
    const { data } = await api.delete(`/wali/izin/${x.id}`, { data: { note } })
    toast.success(cancelResultText(label, data))
    await load()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Belum berhasil. Coba lagi.')
  }
}
</script>

<style scoped>
.iz-head {
  margin-bottom: 14px;
}

.iz-who {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.iz-who strong {
  font-size: 0.96rem;
  color: var(--w-ink);
}

.iz-level {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-size: 0.76rem;
  font-weight: 800;
}

.iz-lead {
  margin: 6px 0 0;
  font-size: 0.88rem;
}

.izin-form .w-field:last-of-type {
  margin-bottom: 16px;
}

.days-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.days-picked {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--w-emerald);
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.day-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 64px;
  padding: 8px 6px;
  border-radius: 12px;
  border: 1.5px solid rgba(11, 59, 42, 0.18);
  background: #fff;
  font: inherit;
  color: var(--w-ink);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.12s ease;
}

.day-chip:active {
  transform: scale(0.97);
}

.day-chip.has-existing {
  border-color: #d97706;
  background: #fffbeb;
}

.day-chip strong {
  font-size: 0.92rem;
  font-variant-numeric: tabular-nums;
}

.day-top {
  font-size: 0.73rem;
  font-weight: 700;
  color: var(--w-muted);
}

.day-tag {
  margin-top: 2px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #fef3c7;
  color: #8f4106;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 1.3;
}

.day-chip[aria-pressed="true"] {
  border-color: var(--w-emerald);
  background: var(--w-emerald);
  color: #fff;
  box-shadow: 0 4px 12px -6px rgba(5, 61, 44, 0.6);
}

.day-chip[aria-pressed="true"] .day-top {
  color: var(--w-gold);
}

.day-chip[aria-pressed="true"] .day-tag {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.day-chip:focus-visible,
.quick-chip:focus-visible,
.past-btn:focus-visible,
.dup-btn:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: 2px;
}

.dup-warn {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
}

.dup-title {
  margin: 0;
  font-weight: 800;
  color: #78350f;
}

.dup-detail,
.dup-hint {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: #5b3a06;
}

.dup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.dup-btn {
  min-height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(120, 53, 15, 0.3);
  background: #fff;
  color: #78350f;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.dup-btn.is-danger {
  color: #9f1239;
  border-color: rgba(159, 18, 57, 0.3);
}

.quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.quick-chip {
  min-height: 40px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.16);
  background: var(--w-surface-soft);
  font: inherit;
  font-size: 0.83rem;
  font-weight: 700;
  color: var(--w-emerald);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.quick-chip.is-picked {
  background: var(--w-emerald-soft);
  border-color: var(--w-emerald);
  color: var(--w-ink);
}

.done-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.done-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.done-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--w-emerald);
  color: var(--w-gold);
}

.done-title {
  margin: 0;
  font-weight: 800;
  color: var(--w-ink);
}

.done-text {
  margin: 2px 0 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--w-body);
}

.done-teacher {
  margin: 0;
}

.past-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.past-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.past-days {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--w-ink);
}

.past-card .w-help {
  margin: 0;
}

/* the teachers' WhatsApp of this izin (2-minute undo window) */
.past-wa {
  margin-top: 4px;
}

.past-wa.is-waiting {
  color: var(--w-gold-deep);
  font-weight: 700;
}

.past-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.past-btn {
  min-height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.past-edit {
  color: var(--w-emerald);
  border-color: rgba(10, 92, 64, 0.25);
  background: var(--w-surface-soft);
}

.past-cancel {
  color: #8e1b12;
  border-color: rgba(142, 27, 18, 0.25);
  background: #fff;
}
</style>
