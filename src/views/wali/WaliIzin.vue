<template>
  <div>
    <PageSkeleton v-if="loading" :rows="5" label="Memuat" />
    <div v-else-if="loadError" class="w-card w-center">
      <p class="w-note is-danger" role="alert">{{ loadError }}</p>
      <router-link to="/wali" class="w-btn w-btn-ghost">Kembali ke beranda</router-link>
    </div>

    <template v-else>
      <router-link to="/wali" class="w-link back-link">← Beranda</router-link>
      <h1 class="w-title">Izin / sakit</h1>
      <p class="w-lead">{{ page.santri.name }} · {{ levelName(page.santri.classId) }}. Langsung tercatat di daftar hadir TPQ, tidak perlu mengabari ustadz lagi.</p>

      <!-- just sent -->
      <div v-if="done" class="w-card done-card" role="status">
        <div class="done-row">
          <span class="done-icon" aria-hidden="true"><LineIcon name="check" :size="20" :stroke="3" /></span>
          <div>
            <p class="done-title">{{ done.type === 'sakit' ? 'Sakit' : 'Izin' }} tercatat</p>
            <p class="done-text">{{ done.recorded.map((d) => dayLabel(d)).join(', ') }} · {{ SLOT_NAME[done.slot] }}</p>
          </div>
        </div>
        <p v-if="done.teacher.length" class="w-note is-warn done-teacher">
          <span>{{ done.teacher.map((t) => t.label).join(', ') }} sudah dicatat ustadz/ustadzah, jadi tidak diubah.</span>
        </p>
        <p class="w-help">Semoga ananda lekas sehat dan dimudahkan urusannya.</p>
        <button type="button" class="w-btn w-btn-ghost" @click="done = null">Ajukan izin lain</button>
      </div>

      <form v-else class="w-card izin-form" novalidate @submit.prevent="send">
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
          <span id="iz-days" class="w-label">Tanggal<span class="w-req" aria-hidden="true">*</span></span>
          <div class="day-grid" role="group" aria-labelledby="iz-days">
            <button v-for="d in days" :key="d" type="button" class="day-chip" :aria-pressed="dates.includes(d)" @click="toggleDay(d)">
              <span class="day-top">{{ d === today ? 'Hari ini' : dayShort(d) }}</span>
              <strong>{{ dayNum(d) }}</strong>
            </button>
          </div>
          <span v-if="!days.includes(today) && isSchoolDay(today)" class="w-help">
            Izin untuk hari ini bisa diajukan pukul {{ page.opens }}-{{ page.closes[slot] }}.
          </span>
          <span v-else class="w-help">Bisa memilih beberapa hari, sampai 7 hari ke depan (Senin-Jumat).</span>
          <span v-if="errors.dates" class="w-error" role="alert">{{ errors.dates }}</span>
        </div>

        <div class="w-field">
          <label for="iz-reason">Alasan<span class="w-req" aria-hidden="true">*</span></label>
          <input id="iz-reason" v-model="reason" class="w-input" :class="{ 'is-invalid': errors.reason }" maxlength="200"
            :placeholder="type === 'sakit' ? 'Contoh: demam sejak semalam' : 'Contoh: acara keluarga'" :aria-invalid="!!errors.reason" />
          <div class="quick">
            <button v-for="q in QUICK[type]" :key="q" type="button" class="quick-chip" @click="reason = q">{{ q }}</button>
          </div>
          <span v-if="errors.reason" class="w-error" role="alert">{{ errors.reason }}</span>
        </div>

        <p v-if="sendError" class="w-note is-danger" role="alert">{{ sendError }}</p>
        <button type="submit" class="w-btn w-btn-primary" :disabled="sending">{{ sending ? 'Mengirim…' : `Kirim ${type === 'sakit' ? 'kabar sakit' : 'izin'}` }}</button>
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
          <button v-if="x.cancellable" type="button" class="w-link past-cancel" @click="cancel(x)">Batalkan izin ini</button>
        </article>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import LineIcon from '@/components/LineIcon.vue'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

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

const loading = ref(true)
const loadError = ref('')
const page = ref(null)
const type = ref('izin')
const slot = ref('wave_1')
const dates = ref([])
const reason = ref('')
const errors = ref({})
const sending = ref(false)
const sendError = ref('')
const done = ref(null)

const days = computed(() => page.value?.days?.[slot.value] || [])
// a mistake already pointed out goes away as soon as it is fixed
watch(reason, (v) => {
  if (errors.value.reason && v.trim().length >= 3) errors.value = { ...errors.value, reason: '' }
})

function setSlot(s) {
  slot.value = s
  dates.value = dates.value.filter((d) => days.value.includes(d))
}
function toggleDay(d) {
  dates.value = dates.value.includes(d) ? dates.value.filter((x) => x !== d) : [...dates.value, d].sort()
  if (errors.value.dates) errors.value = { ...errors.value, dates: '' }
}

async function load() {
  try {
    const { data } = await api.get(`/wali/santri/${santriId}/izin`, { cache: false })
    page.value = data
    if (!done.value) slot.value = data.slot
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Belum bisa dimuat. Periksa koneksi lalu coba lagi.'
  } finally {
    loading.value = false
  }
}

async function send() {
  const errs = {}
  if (!dates.value.length) errs.dates = 'Pilih tanggalnya'
  if (reason.value.trim().length < 3) errs.reason = 'Tulis alasannya singkat'
  errors.value = errs
  if (Object.keys(errs).length) return
  sending.value = true
  sendError.value = ''
  try {
    const { data } = await api.post(`/wali/santri/${santriId}/izin`, { type: type.value, dates: dates.value, slot: slot.value, reason: reason.value })
    done.value = { type: type.value, slot: slot.value, recorded: data.recorded, teacher: data.teacher }
    dates.value = []
    reason.value = ''
    await load()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    sendError.value = err.response?.data?.error || 'Belum terkirim. Periksa koneksi lalu coba lagi.'
  } finally {
    sending.value = false
  }
}

async function cancel(x) {
  const ok = await ask({
    title: 'Batalkan izin?',
    message: `${x.type === 'sakit' ? 'Sakit' : 'Izin'} untuk ${x.dates.map((d) => dayLabel(d)).join(', ')} dibatalkan. Hari yang sudah lewat tetap tercatat.`,
    tone: 'danger',
    confirmText: 'Batalkan izin',
    cancelText: 'Kembali',
  })
  if (!ok) return
  try {
    await api.delete(`/wali/izin/${x.id}`)
    toast.success('Izin dibatalkan')
    await load()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Belum berhasil. Coba lagi.')
  }
}

onMounted(load)
</script>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: 6px;
  text-decoration: none;
}

.izin-form .w-field:last-of-type {
  margin-bottom: 18px;
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 8px;
}

.day-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 58px;
  padding: 8px 4px;
  border-radius: 12px;
  border: 1.5px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  font: inherit;
  color: #0b3b2a;
  cursor: pointer;
}

.day-chip strong {
  font-size: 0.92rem;
}

.day-top {
  font-size: 0.72rem;
  font-weight: 700;
  color: #5b6b62;
}

.day-chip[aria-pressed="true"] {
  border-color: #0a5c40;
  background: #0a5c40;
  color: #fff;
}

.day-chip[aria-pressed="true"] .day-top {
  color: #fcd34d;
}

.day-chip:focus-visible,
.quick-chip:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quick-chip {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  background: #f4f8f5;
  font: inherit;
  font-size: 0.82rem;
  color: #0a4a34;
  cursor: pointer;
}

.done-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.done-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.done-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #0a5c40;
  color: #fcd34d;
}

.done-title {
  margin: 0;
  font-weight: 800;
  color: #0b3b2a;
}

.done-text {
  margin: 0;
  font-size: 0.9rem;
  color: #475a50;
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
  color: #0b3b2a;
}

.past-card .w-help {
  margin: 0;
}

.past-cancel {
  align-self: flex-start;
  color: #8e1b12;
}
</style>
