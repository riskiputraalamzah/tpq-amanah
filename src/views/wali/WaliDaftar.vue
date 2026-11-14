<template>
  <div class="daftar">
    <PageSkeleton v-if="loading" :rows="6" label="Menyiapkan formulir pendaftaran" />

    <div v-else-if="loadError" class="w-card w-center">
      <p class="w-note is-danger" role="alert">{{ loadError }}</p>
      <router-link to="/wali" class="w-btn w-btn-ghost">Kembali ke beranda</router-link>
    </div>

    <!-- ============ just sent ============ -->
    <section v-else-if="mode === 'done'" class="done" aria-labelledby="done-title">
      <div class="done-hero">
        <div class="done-seal" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <p class="done-kicker">Pendaftaran terkirim</p>
        <h1 id="done-title" class="done-title">Jazakumullahu khairan</h1>
        <p class="done-lead">Pendaftaran <strong>{{ reg.childName }}</strong> sudah kami terima.</p>
        <div class="done-number">
          <span>Nomor pendaftaran</span>
          <strong>{{ reg.number }}</strong>
        </div>
        <p class="done-wa">Konfirmasi juga dikirim ke WhatsApp {{ displayPhone(reg.phone) }}.</p>
      </div>

      <h2 class="w-section-title">Apa selanjutnya?</h2>
      <ol class="next-list">
        <li><span class="next-num">1</span><span><strong>Ustadz/ustadzah menghubungi</strong> Bapak/Ibu lewat WhatsApp, biasanya dalam 1-2 hari.</span></li>
        <li><span class="next-num">2</span><span><strong>Penempatan jilid</strong>: ananda datang ke TPQ untuk bincang santai, tanpa tes.</span></li>
        <li><span class="next-num">3</span><span><strong>Mulai mengaji</strong> sesuai jilid dan sesi yang ditentukan.</span></li>
      </ol>

      <button type="button" class="w-btn w-btn-primary" @click="showStatus">Lihat status pendaftaran</button>
      <router-link :to="{ path: '/wali/daftar/baru', query: { dari: reg.id } }" class="w-btn w-btn-ghost done-more">+ Daftarkan adik / kakaknya</router-link>
    </section>

    <!-- ============ status of a sent registration ============ -->
    <section v-else-if="mode === 'status'" aria-labelledby="st-title">
      <router-link to="/wali" class="w-link back-link">← Beranda</router-link>

      <div class="st-hero" :class="`is-${reg.status}`">
        <div class="st-hero-top">
          <span class="st-number">{{ reg.number }}</span>
          <span class="w-pill" :class="`is-${statusInfo.tone}`">{{ statusInfo.label }}</span>
        </div>
        <h1 id="st-title" class="st-name">{{ reg.childName }}</h1>
        <p class="st-sub">{{ sesiName(reg.data?.riwayat?.sesi) }} · didaftarkan {{ fmtDate(reg.submittedAt) }}</p>
      </div>

      <!-- accepted -->
      <div v-if="reg.status === 'accepted'" class="w-card accepted-card">
        <p class="accepted-title">Alhamdulillah, ananda diterima</p>
        <p class="accepted-place">{{ levelName(reg.placement?.classId) }} · {{ sesiName(reg.placement?.sesi) }}</p>
        <p v-if="reg.placement?.nomorInduk" class="w-help">Nomor induk {{ reg.placement.nomorInduk }}</p>
        <p class="w-note is-warn accepted-note"><span>Satu langkah lagi: lengkapi <strong>NIK ananda</strong> dan <strong>nomor KK</strong>. Data lain sudah terisi dari pendaftaran.</span></p>
        <router-link :to="`/wali/santri/${reg.placement?.santriId}`" class="w-btn w-btn-primary">Lengkapi NIK &amp; KK</router-link>
        <router-link :to="`/wali/santri/${reg.placement?.santriId}/progres`" class="w-btn w-btn-ghost done-more">Lihat kehadiran &amp; materi</router-link>
      </div>

      <!-- cancelled -->
      <div v-else-if="reg.status === 'cancelled'" class="w-card">
        <p class="w-note is-danger"><span><strong>{{ reg.cancelledBy === 'wali' ? 'Pendaftaran dibatalkan oleh Bapak/Ibu.' : 'Pendaftaran tidak dilanjutkan.' }}</strong>
          <template v-if="reg.cancelledBy !== 'wali' && reg.cancelReason"> Alasan: {{ reg.cancelReason }}</template></span></p>
        <p class="w-help">Bila ada pertanyaan, hubungi koordinator pendaftaran di bawah.</p>
      </div>

      <!-- the journey -->
      <template v-else>
        <div v-if="reg.status === 'scheduled' && reg.schedule" class="sched-card">
          <span class="sched-icon" aria-hidden="true"><LineIcon name="calendar" :size="22" /></span>
          <div>
            <p class="sched-kicker">Jadwal penempatan jilid</p>
            <p class="sched-date">{{ longDate(reg.schedule.date, { weekday: true }) }}<template v-if="reg.schedule.time"> · {{ reg.schedule.time }}</template></p>
            <p class="sched-where">Di TPQ Amanah Sawotratap, didampingi orang tua/wali.</p>
            <p v-if="reg.schedule.note" class="sched-note">Catatan: {{ reg.schedule.note }}</p>
          </div>
        </div>

        <ol class="journey" aria-label="Tahapan pendaftaran">
          <li v-for="(j, i) in journey" :key="j.key" :class="{ 'is-done': j.done, 'is-now': j.now }">
            <span class="journey-dot" aria-hidden="true">
              <LineIcon v-if="j.done" name="check" :size="14" :stroke="3" />
              <template v-else>{{ i + 1 }}</template>
            </span>
            <span class="journey-text">
              <strong>{{ j.title }}</strong>
              <span>{{ j.sub }}</span>
            </span>
          </li>
        </ol>
      </template>

      <!-- contacts -->
      <div v-if="reg.contacts?.length" class="contact-box">
        <p class="contact-title">Ada pertanyaan? Hubungi koordinator pendaftaran</p>
        <div class="contact-grid">
          <a v-for="c in reg.contacts" :key="c.phone" :href="waLink(c)" target="_blank" rel="noopener noreferrer" class="contact-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z" /></svg>
            {{ c.name }}
          </a>
        </div>
      </div>

      <div class="st-actions">
        <button v-if="reg.editable && reg.status !== 'draft'" type="button" class="w-btn w-btn-ghost" @click="startEdit">Ubah data pendaftaran</button>
        <router-link v-if="reg.status !== 'cancelled'" :to="{ path: '/wali/daftar/baru', query: { dari: reg.id } }" class="w-btn w-btn-ghost">+ Daftarkan adik / kakaknya</router-link>
        <button v-if="['submitted', 'contacted', 'scheduled'].includes(reg.status)" type="button" class="w-link cancel-link" @click="cancelReg">Batalkan pendaftaran</button>
      </div>
    </section>

    <!-- ============ the form ============ -->
    <template v-else>
      <div class="form-top">
        <router-link to="/wali" class="w-link back-link">← Beranda</router-link>
        <span v-if="reg.number" class="form-number">{{ reg.number }}</span>
      </div>
      <h1 class="w-title">{{ editingSent ? 'Ubah data pendaftaran' : 'Pendaftaran santri baru' }}</h1>
      <p v-if="copied" class="w-note"><span>Data orang tua dan alamat sudah terisi dari pendaftaran sebelumnya. Periksa lagi, lalu isi data ananda.</span></p>
      <p v-else-if="resumed" class="w-note"><span>Melanjutkan pendaftaran yang belum dikirim. Isian sebelumnya sudah tersimpan.</span></p>

      <!-- steps with names: where am I, what is left -->
      <ol class="stepper" aria-label="Langkah pendaftaran">
        <li v-for="(s, i) in allSteps" :key="s.key" :class="{ 'is-done': i < step, 'is-now': i === step }" :aria-current="i === step ? 'step' : undefined">
          <button type="button" class="stepper-btn" :disabled="i > maxStep" :aria-label="`Langkah ${i + 1}: ${s.title}`" @click="goTo(i)">
            <span class="stepper-dot" aria-hidden="true">
              <LineIcon v-if="i < step" name="check" :size="13" :stroke="3" />
              <template v-else>{{ i + 1 }}</template>
            </span>
            <span class="stepper-label">{{ s.short }}</span>
          </button>
        </li>
      </ol>

      <form ref="formEl" novalidate @submit.prevent="next" @focusin="keepAboveBar">
        <!-- field steps -->
        <section v-if="step < STEPS.length" class="w-card step-card" :aria-labelledby="`step-${step}-title`">
          <header class="step-head">
            <p class="step-count">Langkah {{ step + 1 }} dari {{ allSteps.length }}<template v-if="current.optional"> · opsional</template></p>
            <h2 :id="`step-${step}-title`" class="step-title">{{ current.title }}</h2>
            <p class="step-hint">{{ current.hint }}</p>
          </header>

          <template v-for="field in current.fields" :key="field.path">
            <div v-if="isShown(field, form)" class="w-field" :class="{ 'is-half': field.half, 'is-sub': field.when }">
              <span v-if="['chips', 'cards'].includes(field.type)" :id="idOf(field)" class="w-label">
                {{ field.label }}<span v-if="field.required" class="w-req" aria-hidden="true">*</span>
              </span>
              <label v-else :for="idOf(field)">
                {{ field.label }}<span v-if="field.required" class="w-req" aria-hidden="true">*</span>
              </label>

              <!-- the number they signed in with -->
              <p v-if="field.showPhone" class="phone-chip">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                {{ displayPhone(reg.phone) }}
              </p>

              <!-- small choices -->
              <div v-if="field.type === 'chips'" class="w-chips chips-wrap" role="radiogroup" :aria-labelledby="idOf(field)">
                <button v-for="o in OPTIONS[field.options]" :key="o.value" type="button" role="radio" class="w-chip"
                  :aria-checked="value(field) === o.value" @click="set(field, o.value)">{{ o.label }}</button>
              </div>

              <!-- big choices with a line of explanation -->
              <div v-else-if="field.type === 'cards'" class="choice-cards" role="radiogroup" :aria-labelledby="idOf(field)">
                <button v-for="o in OPTIONS[field.options]" :key="o.value" type="button" role="radio" class="choice-card"
                  :aria-checked="value(field) === o.value" @click="set(field, o.value)">
                  <span class="choice-radio" aria-hidden="true"></span>
                  <span class="choice-text">
                    <strong>{{ o.label }}<span v-if="field.recommend && suggested === o.value" class="choice-badge">Disarankan</span></strong>
                    <span>{{ o.sub }}</span>
                    <small v-if="o.note">{{ o.note }}</small>
                  </span>
                </button>
              </div>

              <select v-else-if="field.type === 'select'" :id="idOf(field)" class="w-input" :value="value(field)" @change="set(field, $event.target.value)">
                <option value="">Pilih…</option>
                <option v-for="o in OPTIONS[field.options]" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>

              <textarea v-else-if="field.type === 'textarea'" :id="idOf(field)" class="w-input" :maxlength="field.max"
                :placeholder="field.placeholder || ''" :value="value(field)" @input="set(field, $event.target.value)"></textarea>

              <input v-else :id="idOf(field)" class="w-input" :class="{ 'is-invalid': errors[field.path] }"
                :type="field.type === 'date' ? 'date' : field.type === 'phone' ? 'tel' : 'text'"
                :inputmode="field.type === 'digits' ? 'numeric' : field.type === 'phone' ? 'tel' : undefined"
                :maxlength="field.max || undefined" :max="field.type === 'date' ? today : undefined"
                :autocomplete="field.autocomplete || 'off'"
                :autocapitalize="field.path.endsWith('nama') || field.path.endsWith('namaLengkap') ? 'words' : undefined"
                :placeholder="field.placeholder || (field.type === 'phone' ? '0812 3456 7890' : '')"
                :aria-invalid="!!errors[field.path]" :aria-describedby="errors[field.path] ? `${idOf(field)}-err` : undefined"
                :value="value(field)" @input="onInput(field, $event)" />

              <span v-if="field.type === 'date' && age !== null && !errors[field.path]" class="w-help">Usia ananda sekarang {{ age }} tahun.</span>
              <span v-else-if="field.help" class="w-help">{{ field.help }}</span>
              <span v-if="errors[field.path]" :id="`${idOf(field)}-err`" class="w-error" role="alert">{{ errors[field.path] }}</span>
            </div>
          </template>
        </section>

        <!-- last step: check, fees, agree -->
        <section v-else class="review" aria-labelledby="review-title">
          <header class="step-head review-head-top">
            <p class="step-count">Langkah {{ allSteps.length }} dari {{ allSteps.length }}</p>
            <h2 id="review-title" class="step-title">Periksa &amp; kirim</h2>
            <p class="step-hint">Pastikan semuanya benar. Ketuk "Ubah" untuk memperbaiki.</p>
          </header>

          <div v-for="(s, i) in STEPS" :key="s.key" class="w-card review-group">
            <div class="review-head">
              <strong>{{ s.title }}</strong>
              <button type="button" class="w-link" @click="goTo(i)">Ubah</button>
            </div>
            <dl>
              <template v-for="f in s.fields" :key="f.path">
                <div v-if="isShown(f, form) && shownValue(f, form)" class="review-row">
                  <dt>{{ f.label }}</dt>
                  <dd>{{ shownValue(f, form) }}</dd>
                </div>
              </template>
              <div v-if="s.key === 'alamat'" class="review-row">
                <dt>Nomor WhatsApp</dt>
                <dd>{{ displayPhone(reg.phone) }}</dd>
              </div>
              <p v-if="s.optional && !s.fields.some((f) => shownValue(f, form))" class="w-help">Tidak diisi.</p>
            </dl>
          </div>

          <div class="fees" aria-labelledby="fees-title">
            <p id="fees-title" class="fees-title">Rincian biaya</p>
            <ul class="fees-list">
              <li v-for="f in FEES" :key="f.label">
                <span>{{ f.label }} <small>{{ f.note }}</small></span>
                <strong>{{ f.amount }}</strong>
              </li>
            </ul>
            <p class="fees-note">Tidak ada biaya untuk mengisi formulir ini. Pembayaran dilakukan setelah ananda diterima.</p>
          </div>

          <div class="w-card agree">
            <strong class="agree-title">Syarat &amp; ketentuan</strong>
            <ul class="terms">
              <li v-for="t in TERMS" :key="t">{{ t }}</li>
            </ul>
            <label v-for="a in AGREEMENTS" :key="a.key" class="check" :class="{ 'is-invalid': errors[`persetujuan.${a.key}`] }">
              <input v-model="form.persetujuan[a.key]" type="checkbox" />
              <span>{{ a.label }}</span>
            </label>
            <span v-if="AGREEMENTS.some((a) => errors[`persetujuan.${a.key}`])" class="w-error" role="alert">Mohon centang ketiga pernyataan.</span>
          </div>
        </section>

        <p v-if="saveError" class="w-note is-danger form-error" role="alert">{{ saveError }}</p>

        <div class="w-actionbar">
          <button v-if="step > 0" type="button" class="w-btn w-btn-ghost" @click="back">Kembali</button>
          <button type="submit" class="w-btn w-btn-primary" :disabled="saving">
            {{ saving ? 'Menyimpan…' : step < STEPS.length ? (current.optional && !stepFilled ? 'Lewati' : 'Lanjut') : editingSent ? 'Simpan perubahan' : 'Kirim pendaftaran' }}
          </button>
        </div>
        <p class="w-center later">
          <button v-if="!editingSent && step < STEPS.length" type="button" class="w-link" :disabled="saving" @click="saveAndLeave">Simpan &amp; lanjutkan nanti</button>
          <button v-else-if="editingSent" type="button" class="w-link" @click="stopEdit">Batal mengubah</button>
        </p>
        <p v-if="!editingSent" class="w-center">
          <button type="button" class="w-link discard-link" @click="cancelReg">Hapus pendaftaran ini</button>
        </p>
      </form>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import LineIcon from '@/components/LineIcon.vue'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import {
  OPTIONS, STEPS, FEES, TERMS, AGREEMENTS, REG_STATUS,
  getPath, setPath, isShown, fieldError, stepErrors, stepOfPath, mergeForm, shownValue,
  ageOn, recommendedSesi, displayPhone, longDate, levelName, sesiName,
} from '@/utils/pendaftaran'

const route = useRoute()
const router = useRouter()
const { ask } = useDialog()
const toast = useToast()

const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
const loading = ref(true)
const loadError = ref('')
const reg = ref({})
const form = ref(mergeForm())
const mode = ref('form') // form | status | done
const step = ref(0)
const maxStep = ref(0)
const errors = ref({})
const saving = ref(false)
const saveError = ref('')
const formEl = ref(null)
const copied = ref(false)
const resumed = ref(false)

const allSteps = [...STEPS, { key: 'kirim', title: 'Periksa & kirim', short: 'Kirim' }]
const current = computed(() => STEPS[step.value] || {})
const editingSent = computed(() => mode.value === 'form' && reg.value.status && reg.value.status !== 'draft')
const age = computed(() => ageOn(form.value.santri?.tanggalLahir))
const suggested = computed(() => recommendedSesi(form.value.santri?.tanggalLahir))
const stepFilled = computed(() => (current.value.fields || []).some((f) => String(getPath(form.value, f.path) || '').trim()))
const statusInfo = computed(() => REG_STATUS[reg.value.status] || REG_STATUS.submitted)

const idOf = (field) => `f-${field.path.replace(/\./g, '-')}`
const value = (field) => getPath(form.value, field.path) ?? ''

const toDate = (v) => {
  if (!v) return null
  if (v._seconds !== undefined || v.seconds !== undefined) return new Date(Number(v._seconds ?? v.seconds) * 1000)
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}
const fmtDate = (v) => {
  const d = toDate(v)
  return d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }) : ''
}

const journey = computed(() => {
  const s = reg.value.status
  const contacted = ['contacted', 'scheduled', 'accepting', 'accepted'].includes(s)
  const scheduled = ['scheduled', 'accepting', 'accepted'].includes(s)
  return [
    { key: 'sent', title: 'Pendaftaran terkirim', sub: fmtDate(reg.value.submittedAt), done: true, now: false },
    { key: 'contact', title: 'Dihubungi ustadz/ustadzah', sub: contacted ? 'Sudah dihubungi lewat WhatsApp' : 'Biasanya dalam 1-2 hari', done: contacted, now: !contacted },
    {
      key: 'place',
      title: 'Penempatan jilid',
      sub: scheduled && reg.value.schedule ? `${longDate(reg.value.schedule.date, { weekday: true })}${reg.value.schedule.time ? `, ${reg.value.schedule.time}` : ''}` : 'Bincang santai di TPQ, tanpa tes',
      done: false,
      now: contacted,
    },
    { key: 'in', title: 'Diterima & mulai mengaji', sub: 'Jilid dan sesi ditentukan ustadz/ustadzah', done: false, now: false },
  ]
})

const waLink = (c) => {
  const text = `Assalamu'alaikum ${c.name}, saya wali dari ${reg.value.childName || 'calon santri'}${reg.value.number ? ` (nomor pendaftaran ${reg.value.number})` : ''}. Saya ingin bertanya tentang pendaftaran di TPQ Amanah.`
  return `https://wa.me/${c.phone}?text=${encodeURIComponent(text)}`
}

function set(field, v) {
  setPath(form.value, field.path, v)
  if (errors.value[field.path]) errors.value = { ...errors.value, [field.path]: fieldError(field, v, form.value) }
}
function onInput(field, event) {
  let v = event.target.value
  if (field.type === 'digits') {
    v = v.replace(/\D/g, '')
    event.target.value = v
  }
  set(field, v)
}

function applyServer(data) {
  reg.value = data
  form.value = mergeForm(data.data)
}

// The first step not finished yet, so "lanjutkan nanti" brings the parent back where they stopped
function firstOpenStep() {
  for (let i = 0; i < STEPS.length; i += 1) {
    if (STEPS[i].optional) continue
    if (Object.keys(stepErrors(STEPS[i], form.value)).length) return i
  }
  return STEPS.length - 1
}

async function load() {
  loading.value = true
  loadError.value = ''
  let moving = false // going on to the new registration's own address: keep the skeleton, no flash of an empty form
  copied.value = false
  resumed.value = false
  try {
    const id = String(route.params.id || '')
    if (id === 'baru') {
      const dari = String(route.query.dari || '')
      if (!dari) {
        // an unfinished registration is continued instead of starting a second empty one
        const { data: mine } = await api.get('/pendaftaran/mine', { cache: false })
        const draft = (mine || []).find((r) => r.status === 'draft')
        if (draft) {
          moving = true
          router.replace({ path: `/wali/daftar/${draft.id}`, query: { lanjut: '1' } })
          return
        }
      }
      const { data } = await api.post('/pendaftaran', dari ? { copyFrom: dari } : {})
      moving = true
      router.replace({ path: `/wali/daftar/${data.id}`, query: dari ? { salin: '1' } : {} })
      return
    }
    const { data } = await api.get(`/pendaftaran/${id}`, { cache: false })
    applyServer(data)
    copied.value = route.query.salin === '1'
    resumed.value = route.query.lanjut === '1'
    if (data.status === 'draft') {
      mode.value = 'form'
      step.value = copied.value ? 0 : resumed.value ? firstOpenStep() : 0
      maxStep.value = resumed.value ? step.value : 0
    } else {
      mode.value = 'status'
    }
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Pendaftaran belum bisa dimuat. Periksa koneksi lalu coba lagi.'
  } finally {
    if (!moving) loading.value = false
  }
}

async function focusFirstError() {
  await nextTick()
  formEl.value?.querySelector('[aria-invalid="true"], .w-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

async function save({ submit = false } = {}) {
  saving.value = true
  saveError.value = ''
  try {
    const { data } = await api.put(`/pendaftaran/${reg.value.id}`, { data: form.value, submit })
    return data
  } catch (err) {
    const fields = err.response?.data?.fields
    if (fields) {
      errors.value = fields
      const at = stepOfPath(Object.keys(fields)[0])
      step.value = at >= 0 ? at : STEPS.length
      focusFirstError()
    } else {
      saveError.value = err.response?.data?.error || 'Belum tersimpan. Periksa koneksi lalu coba lagi.'
    }
    return null
  } finally {
    saving.value = false
  }
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function next() {
  if (step.value < STEPS.length) {
    const errs = stepErrors(STEPS[step.value], form.value)
    errors.value = errs
    if (Object.keys(errs).length) return focusFirstError()
    // a draft is saved at every step; a sent registration only at the end (it is checked in full)
    if (!editingSent.value) {
      const saved = await save()
      if (!saved) return
    }
    step.value += 1
    maxStep.value = Math.max(maxStep.value, step.value)
    return scrollTop()
  }
  const all = STEPS.reduce((acc, s) => ({ ...acc, ...stepErrors(s, form.value) }), {})
  AGREEMENTS.forEach((a) => {
    if (!form.value.persetujuan[a.key]) all[`persetujuan.${a.key}`] = 'wajib'
  })
  errors.value = all
  if (Object.keys(all).length) {
    const at = stepOfPath(Object.keys(all)[0])
    if (at >= 0) step.value = at
    return focusFirstError()
  }
  const wasSent = editingSent.value
  const saved = await save({ submit: true })
  if (!saved) return
  reg.value = { ...reg.value, ...saved }
  form.value = mergeForm(saved.data)
  if (wasSent) {
    toast.success('Perubahan data pendaftaran tersimpan')
    mode.value = 'status'
  } else {
    mode.value = 'done'
  }
  window.scrollTo({ top: 0 })
}

function back() {
  errors.value = {}
  step.value = Math.max(0, step.value - 1)
  scrollTop()
}
function goTo(i) {
  if (i > maxStep.value) return
  errors.value = {}
  step.value = i
  scrollTop()
}
async function saveAndLeave() {
  const saved = await save()
  if (saved) {
    toast.success('Tersimpan. Lanjutkan kapan saja dari beranda.')
    router.push('/wali')
  }
}
function startEdit() {
  mode.value = 'form'
  step.value = 0
  maxStep.value = STEPS.length
  errors.value = {}
  window.scrollTo({ top: 0 })
}
function stopEdit() {
  form.value = mergeForm(reg.value.data)
  errors.value = {}
  mode.value = 'status'
  window.scrollTo({ top: 0 })
}

async function cancelReg() {
  const draft = reg.value.status === 'draft'
  const name = String(form.value.santri?.namaLengkap || '').trim()
  const ok = await ask({
    title: draft ? 'Hapus pendaftaran ini?' : 'Batalkan pendaftaran?',
    message: draft
      ? `Isian yang sudah diketik${name ? ` untuk ${name}` : ''} akan dihapus.`
      : `Pendaftaran ${reg.value.childName} (${reg.value.number}) tidak dilanjutkan. Untuk mendaftar lagi, isi formulir baru.`,
    tone: 'danger',
    confirmText: draft ? 'Hapus' : 'Batalkan pendaftaran',
    cancelText: 'Kembali',
  })
  if (!ok) return
  try {
    await api.delete(`/pendaftaran/${reg.value.id}`)
    toast.success(draft ? 'Pendaftaran dihapus' : 'Pendaftaran dibatalkan')
    router.push('/wali')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Belum berhasil. Coba lagi.')
  }
}

function showStatus() {
  mode.value = 'status'
  window.scrollTo({ top: 0 })
}

// The sticky Kembali / Lanjut bar must never cover the field being typed in (a tap, the keyboard's "next" key)
onMounted(() => {
  document.documentElement.style.scrollPaddingBottom = '110px'
})
onBeforeUnmount(() => {
  document.documentElement.style.scrollPaddingBottom = ''
})
function keepAboveBar(event) {
  const el = event.target
  if (!el?.matches?.('input:not([type=checkbox]), select, textarea')) return
  requestAnimationFrame(() => {
    const bar = formEl.value?.querySelector('.w-actionbar')?.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    if (bar && r.bottom > bar.top - 8) window.scrollBy({ top: r.bottom - bar.top + 24, behavior: 'smooth' })
  })
}

watch(() => route.params.id, (id) => {
  if (id) {
    mode.value = 'form'
    step.value = 0
    load()
  }
}, { immediate: true })
</script>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: 6px;
  text-decoration: none;
}

.form-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-number {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #b45309;
}

/* stepper: numbered dots with a short name, the line fills as the parent goes */
.stepper {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0;
  margin: 14px 0 16px;
  padding: 0;
  list-style: none;
}

.stepper li {
  position: relative;
}

.stepper li + li::before {
  content: "";
  position: absolute;
  top: 15px;
  right: 50%;
  width: 100%;
  height: 3px;
  background: #e1e7e3;
  z-index: 0;
}

.stepper li.is-done + li::before,
.stepper li.is-done + li.is-now::before {
  background: #0a5c40;
}

.stepper-btn {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  cursor: pointer;
}

.stepper-btn:disabled {
  cursor: default;
}

.stepper-dot {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #d3ddd7;
  color: #6b7a72;
  font-size: 0.82rem;
  font-weight: 800;
}

.stepper li.is-done .stepper-dot {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fcd34d;
}

.stepper li.is-now .stepper-dot {
  border-color: #b45309;
  background: #fffbeb;
  color: #7c3a0d;
  box-shadow: 0 0 0 4px rgba(180, 83, 9, 0.14);
}

.stepper-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #6b7a72;
  text-align: center;
  line-height: 1.15;
}

.stepper li.is-now .stepper-label {
  color: #0b3b2a;
}

.stepper-btn:focus-visible .stepper-dot {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

/* a step */
.step-card {
  padding: 18px 16px 6px;
}

.step-head {
  margin-bottom: 16px;
}

.step-count {
  margin: 0 0 2px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #b45309;
}

.step-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #0b3b2a;
}

.step-hint {
  margin: 4px 0 0;
  font-size: 0.88rem;
  color: #5b6b62;
}

/* a follow-up question (shown for one answer) sits under its question */
.w-field.is-sub {
  padding-left: 12px;
  border-left: 3px solid #e3f1ea;
}

.chips-wrap {
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
}

.chips-wrap .w-chip {
  min-height: 46px;
  font-size: 0.92rem;
}

.phone-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  margin: 0 0 2px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #eef6f1;
  color: #0a4a34;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

/* big choices */
.choice-cards {
  display: grid;
  gap: 10px;
}

.choice-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  border: 1.5px solid rgba(11, 59, 42, 0.18);
  background: #fff;
  font: inherit;
  text-align: left;
  color: #0b3b2a;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

.choice-card[aria-checked="true"] {
  border-color: #0a5c40;
  background: #f1f8f4;
  box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.12);
}

.choice-card:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.choice-radio {
  flex: none;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border-radius: 50%;
  border: 2px solid #b8c6be;
  background: #fff;
}

.choice-card[aria-checked="true"] .choice-radio {
  border: 7px solid #0a5c40;
}

.choice-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.choice-text strong {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
}

.choice-text > span {
  font-size: 0.88rem;
  color: #475a50;
}

.choice-text small {
  font-size: 0.8rem;
  color: #6b7a72;
}

.choice-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: #fef3c7;
  color: #7c3a0d;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

select.w-input {
  appearance: none;
  padding-right: 40px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%230a5c40' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

/* review */
.review-head-top {
  margin: 0 0 12px;
}

.review-group {
  padding: 14px 16px;
}

.review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.review-head strong {
  font-size: 0.98rem;
}

.review-group dl {
  margin: 0;
}

.review-row {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 10px;
  padding: 7px 0;
  border-top: 1px dashed rgba(11, 59, 42, 0.12);
  font-size: 0.9rem;
}

.review-row dt {
  color: #5b6b62;
}

.review-row dd {
  margin: 0;
  font-weight: 700;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.fees {
  margin: 14px 0 12px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(150deg, #0a5c40, #053d2c);
  color: #fff;
}

.fees-title {
  margin: 0 0 8px;
  font-size: 0.98rem;
  font-weight: 800;
  color: #fcd34d;
}

.fees-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.fees-list li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.92rem;
}

.fees-list small {
  margin-left: 4px;
  color: rgba(209, 250, 229, 0.7);
  font-size: 0.75rem;
}

.fees-list strong {
  font-variant-numeric: tabular-nums;
}

.fees-note {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: rgba(209, 250, 229, 0.85);
}

.agree {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.agree-title {
  font-size: 0.98rem;
}

.terms {
  margin: 0;
  padding-left: 18px;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #475a50;
}

.terms li + li {
  margin-top: 4px;
}

.check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: #f4f8f5;
  border: 1.5px solid transparent;
  font-size: 0.9rem;
  line-height: 1.45;
  cursor: pointer;
}

.check.is-invalid {
  border-color: #f5b5ad;
  background: #fdf3f2;
}

.check input {
  flex: none;
  width: 22px;
  height: 22px;
  margin: 0;
  accent-color: #0a5c40;
}

.form-error {
  margin-top: 12px;
}

.later {
  margin: 4px 0 0;
}

.discard-link {
  color: #8e1b12;
  font-size: 0.88rem;
  font-weight: 600;
}

/* done */
.done-hero {
  position: relative;
  overflow: hidden;
  padding: 28px 20px 22px;
  border-radius: 24px;
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(252, 211, 77, 0.18), transparent 60%),
    linear-gradient(160deg, #0a5c40, #03291d);
  color: #fff;
  text-align: center;
}

.done-seal {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: #fcd34d;
  color: #053d2c;
  box-shadow: 0 0 0 8px rgba(252, 211, 77, 0.18);
  animation: seal-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1.2) both;
}

@keyframes seal-in {
  from { transform: scale(0.4); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.done-kicker {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fcd34d;
}

.done-title {
  margin: 4px 0 6px;
  font-size: 1.55rem;
  font-weight: 800;
}

.done-lead {
  margin: 0 0 16px;
  color: rgba(236, 253, 245, 0.9);
}

.done-number {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 22px;
  border-radius: 14px;
  border: 1.5px dashed rgba(252, 211, 77, 0.6);
  background: rgba(255, 255, 255, 0.06);
}

.done-number span {
  font-size: 0.75rem;
  color: rgba(209, 250, 229, 0.8);
}

.done-number strong {
  font-size: 1.35rem;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
}

.done-wa {
  margin: 12px 0 0;
  font-size: 0.82rem;
  color: rgba(209, 250, 229, 0.8);
}

.next-list {
  display: grid;
  gap: 10px;
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
}

.next-list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  font-size: 0.92rem;
  line-height: 1.45;
  color: #475a50;
}

.next-list strong {
  color: #0b3b2a;
}

.next-num {
  flex: none;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e3f1ea;
  color: #0a5c40;
  font-weight: 800;
  font-size: 0.85rem;
}

.done-more {
  margin-top: 10px;
}

/* status */
.st-hero {
  padding: 18px 18px 16px;
  border-radius: 20px;
  background: linear-gradient(150deg, #0a5c40, #053d2c);
  color: #fff;
  margin-bottom: 14px;
}

.st-hero.is-cancelled {
  background: linear-gradient(150deg, #5b6b62, #3a4640);
}

.st-hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.st-number {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #fcd34d;
}

.st-name {
  margin: 8px 0 2px;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.2;
}

.st-sub {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(209, 250, 229, 0.85);
}

.sched-card {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #fffbeb;
  border: 1.5px solid #f3d58b;
  color: #5b3a06;
}

.sched-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #fef3c7;
  color: #b45309;
}

.sched-kicker {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: #b45309;
}

.sched-date {
  margin: 2px 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #3b2404;
}

.sched-where,
.sched-note {
  margin: 0;
  font-size: 0.86rem;
}

.journey {
  margin: 0 0 16px;
  padding: 4px 0 0;
  list-style: none;
}

.journey li {
  position: relative;
  display: flex;
  gap: 12px;
  padding-bottom: 18px;
}

.journey li:not(:last-child)::after {
  content: "";
  position: absolute;
  left: 15px;
  top: 32px;
  bottom: 2px;
  width: 2px;
  background: #dfe6e2;
}

.journey li.is-done:not(:last-child)::after {
  background: #0a5c40;
}

.journey-dot {
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #d3ddd7;
  color: #6b7a72;
  font-size: 0.82rem;
  font-weight: 800;
}

.journey li.is-done .journey-dot {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fcd34d;
}

.journey li.is-now .journey-dot {
  border-color: #b45309;
  background: #fffbeb;
  color: #7c3a0d;
  box-shadow: 0 0 0 4px rgba(180, 83, 9, 0.14);
}

.journey-text {
  display: flex;
  flex-direction: column;
  padding-top: 5px;
}

.journey-text strong {
  font-size: 0.96rem;
  color: #0b3b2a;
}

.journey li:not(.is-done):not(.is-now) .journey-text strong {
  color: #6b7a72;
}

.journey-text span {
  font-size: 0.85rem;
  color: #5b6b62;
}

.accepted-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.accepted-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0a5c40;
}

.accepted-place {
  margin: 0;
  font-weight: 700;
}

.accepted-note {
  margin: 4px 0;
}

.contact-box {
  margin: 4px 0 16px;
  padding: 14px;
  border-radius: 16px;
  background: #f4f8f5;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.contact-title {
  margin: 0 0 10px;
  font-size: 0.88rem;
  font-weight: 700;
  color: #0b3b2a;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.contact-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 12px;
  border-radius: 12px;
  background: #fff;
  border: 1.5px solid rgba(10, 92, 64, 0.3);
  color: #0a5c40;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
}

.contact-btn:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.st-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cancel-link {
  align-self: center;
  color: #8e1b12;
  font-size: 0.9rem;
}

@media (prefers-reduced-motion: reduce) {
  .done-seal {
    animation: none;
  }
  .choice-card {
    transition: none;
  }
}
</style>
