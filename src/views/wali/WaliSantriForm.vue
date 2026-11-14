<template>
  <div>
    <PageSkeleton v-if="loading" :rows="6" label="Memuat data ananda" />

    <div v-else-if="loadError" class="w-card w-center">
      <p class="w-note is-danger" role="alert">{{ loadError }}</p>
      <router-link to="/wali" class="w-btn w-btn-ghost">Kembali ke beranda</router-link>
    </div>

    <!-- sent -->
    <div v-else-if="done" class="w-card w-center">
      <div class="w-done-icon" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      </div>
      <h1 class="w-title">{{ wasVerified ? 'Perubahan tersimpan' : 'Data terkirim' }}</h1>
      <p class="w-lead">
        <template v-if="wasVerified && pendingIdentity.length">Perubahan identitas akan dicek admin dulu. Perubahan lain sudah tersimpan.</template>
        <template v-else-if="wasVerified">Terima kasih, data ananda sudah diperbarui.</template>
        <template v-else>Jazakumullahu khairan. Admin TPQ akan mengecek data ananda.</template>
      </p>
      <router-link to="/wali" class="w-btn w-btn-primary">Kembali ke beranda</router-link>
    </div>

    <template v-else>
      <router-link to="/wali" class="w-link back-link">← Beranda</router-link>
      <h1 class="w-title">{{ santri.name }}</h1>
      <p class="w-lead santri-sub">{{ levelName(santri.classId) }}</p>

      <p v-if="status === 'needs_fix' && adminNote" class="w-note is-danger" role="alert">
        <span><strong>Perlu diperbaiki:</strong> {{ adminNote }}</span>
      </p>
      <p v-else-if="status === 'verified'" class="w-note">
        <span>Data sudah terverifikasi. Perubahan alamat dan kontak langsung tersimpan. Perubahan nama, jenis kelamin, tempat/tanggal lahir, NIK, atau KK dicek admin dulu.</span>
      </p>
      <p v-if="pendingIdentity.length" class="w-note is-warn">Ada perubahan identitas yang sedang dicek admin.</p>

      <!-- progress -->
      <div class="w-steps" aria-hidden="true">
        <span v-for="(s, i) in allSteps" :key="s.key" :class="{ 'is-done': i < step, 'is-current': i === step }"></span>
      </div>
      <p class="w-step-label">Langkah {{ step + 1 }} dari {{ allSteps.length }} · {{ allSteps[step].title }}</p>

      <form ref="formEl" novalidate @submit.prevent="next">
        <!-- field steps -->
        <section v-if="step < STEPS.length" class="w-card" :aria-label="STEPS[step].title">
          <p class="w-help step-hint">{{ STEPS[step].hint }}</p>
          <template v-for="field in STEPS[step].fields" :key="field.path">
            <div class="w-field" :class="{ 'is-half': field.half }">
              <label v-if="field.type !== 'gender'" :for="idOf(field)">
                {{ field.label }}<span v-if="field.required" class="w-req" aria-hidden="true">*</span>
              </label>
              <span v-else :id="idOf(field)" class="w-label">{{ field.label }}<span class="w-req" aria-hidden="true">*</span></span>

              <!-- gender -->
              <div v-if="field.type === 'gender'" class="w-chips" role="radiogroup" :aria-labelledby="idOf(field)">
                <button type="button" role="radio" class="w-chip" :aria-checked="value(field) === 'L'" @click="set(field, 'L')">Laki-laki</button>
                <button type="button" role="radio" class="w-chip" :aria-checked="value(field) === 'P'" @click="set(field, 'P')">Perempuan</button>
              </div>

              <!-- NIK / KK already saved: shown masked, changed on purpose only -->
              <div v-else-if="field.type === 'digits16' && isMasked(value(field))" class="masked-row">
                <span class="masked-value">{{ value(field) }}</span>
                <button type="button" class="w-link" @click="set(field, '')">Ubah</button>
              </div>

              <textarea v-else-if="field.type === 'textarea'" :id="idOf(field)" class="w-input" :maxlength="field.max"
                :placeholder="field.placeholder || ''" :value="value(field)" @input="set(field, $event.target.value)"></textarea>

              <input v-else :id="idOf(field)" class="w-input" :class="{ 'is-invalid': errors[field.path] }"
                :type="field.type === 'date' ? 'date' : field.type === 'phone' ? 'tel' : 'text'"
                :inputmode="['digits16', 'digits'].includes(field.type) ? 'numeric' : field.type === 'phone' ? 'tel' : undefined"
                :maxlength="field.type === 'digits16' ? 16 : field.max || undefined"
                :max="field.type === 'date' ? today : undefined"
                :autocomplete="field.autocomplete || 'off'"
                :placeholder="field.placeholder || (field.type === 'phone' ? '0812 3456 7890' : '')"
                :aria-invalid="!!errors[field.path]" :aria-describedby="errors[field.path] ? `${idOf(field)}-err` : undefined"
                :value="value(field)" @input="onInput(field, $event)" />

              <span v-if="field.type === 'digits16' && !isMasked(value(field))" class="w-help">
                {{ field.help }} <strong>{{ String(value(field)).length }}/16</strong>
              </span>
              <span v-else-if="field.help" class="w-help">{{ field.help }}</span>
              <!-- the name comes from the TPQ records, often a short or nick name: say it can (and should) be completed -->
              <template v-if="field.path === 'santri.namaLengkap' && santri.name">
                <p v-if="sameAsRecord(value(field))" class="w-note is-warn name-note">
                  Nama ini dari catatan TPQ. Bila belum lengkap atau ejaannya keliru, ubah sesuai <strong>akta kelahiran</strong>.
                </p>
                <p v-else-if="value(field)" class="w-help">
                  Di catatan TPQ tertulis "{{ santri.name }}". Setelah dicek admin, nama lengkap ini yang dipakai di TPQ.
                </p>
              </template>
              <span v-if="errors[field.path]" :id="`${idOf(field)}-err`" class="w-error" role="alert">{{ errors[field.path] }}</span>
            </div>
          </template>

          <!-- optional KK photo on the "lainnya" step -->
          <div v-if="STEPS[step].key === 'lainnya'" class="kk-box">
            <span class="w-label">Foto Kartu Keluarga (opsional)</span>
            <p class="w-help">Foto disimpan tertutup dan hanya bisa dilihat admin TPQ.</p>
            <div v-if="hasKkPhoto" class="kk-done">
              <span class="w-pill is-ok">Foto KK terunggah</span>
              <label class="w-link kk-change">Ganti<input type="file" accept="image/*" class="sr-only" @change="uploadKk" /></label>
              <button type="button" class="w-link kk-remove" @click="removeKk">Hapus</button>
            </div>
            <label v-else class="w-btn w-btn-ghost kk-pick">
              {{ kkBusy ? 'Mengunggah…' : 'Pilih / foto KK' }}
              <input type="file" accept="image/*" class="sr-only" :disabled="kkBusy" @change="uploadKk" />
            </label>
            <span v-if="kkError" class="w-error" role="alert">{{ kkError }}</span>
          </div>
        </section>

        <!-- last step: check and agree -->
        <section v-else class="w-card" aria-label="Periksa dan kirim">
          <div v-for="(s, i) in STEPS" :key="s.key" class="review-group">
            <div class="review-head">
              <strong>{{ s.title }}</strong>
              <button type="button" class="w-link" @click="goTo(i)">Ubah</button>
            </div>
            <dl>
              <template v-for="f in s.fields" :key="f.path">
                <div v-if="value(f)" class="review-row">
                  <dt>{{ f.label }}</dt>
                  <dd>{{ shown(f) }}</dd>
                </div>
              </template>
            </dl>
          </div>

          <div class="agree">
            <strong class="agree-title">Syarat &amp; ketentuan TPQ Amanah</strong>
            <ul>
              <li v-for="t in TERMS" :key="t">{{ t }}</li>
            </ul>
            <label class="check">
              <input v-model="form.persetujuan.syarat" type="checkbox" />
              <span>Saya sudah membaca dan bersedia menaati syarat &amp; ketentuan TPQ Amanah.</span>
            </label>
            <label class="check">
              <input v-model="form.persetujuan.data" type="checkbox" />
              <span>{{ DATA_CONSENT }}</span>
            </label>
            <span v-if="errors['persetujuan.syarat'] || errors['persetujuan.data']" class="w-error" role="alert">
              Mohon centang kedua persetujuan.
            </span>
          </div>
        </section>

        <p v-if="saveError" class="w-note is-danger form-error" role="alert">{{ saveError }}</p>

        <div class="w-actionbar">
          <button v-if="step > 0" type="button" class="w-btn w-btn-ghost" @click="back">Kembali</button>
          <button type="submit" class="w-btn w-btn-primary" :disabled="saving">
            {{ saving ? 'Menyimpan…' : step < STEPS.length ? 'Lanjut' : status === 'verified' ? 'Simpan perubahan' : 'Kirim data' }}
          </button>
        </div>
        <p v-if="step < STEPS.length" class="w-center later">
          <button type="button" class="w-link" :disabled="saving" @click="saveAndLeave">Simpan &amp; lanjutkan nanti</button>
        </p>
      </form>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { STEPS, getPath, setPath, stepErrors, stepOfPath, mergeProfile, fieldError } from '@/utils/santriProfile'

// The TPQ's conditions, as on the registration form. Update here when the fees change.
const TERMS = [
  'Orang tua/wali mendukung dan membimbing ananda mengikuti kegiatan mengaji sesuai jadwal.',
  'Santri menaati tata tertib, menjaga sikap dan sopan santun, serta menghormati ustadz/ustadzah dan sesama santri.',
  'Orang tua/wali memenuhi kewajiban administrasi: daftar ulang Rp35.000, biaya program (Prestasi Rp5.000, Tartil Rp13.000), dan SPP Rp20.000 per bulan.',
]
const DATA_CONSENT = 'Saya setuju data ini disimpan TPQ Amanah untuk administrasi santri, pelaporan ke lembaga terkait, dan kabar kegiatan/absensi lewat WhatsApp. Data tidak dibagikan untuk keperluan lain.'

const route = useRoute()
const router = useRouter()
const santriId = route.params.santriId
const today = new Date().toISOString().slice(0, 10)

const loading = ref(true)
const loadError = ref('')
const santri = ref({})
const form = ref(mergeProfile())
const status = ref('empty')
const adminNote = ref('')
const pendingIdentity = ref([])
const hasKkPhoto = ref(false)
const step = ref(0)
const errors = ref({})
const saving = ref(false)
const saveError = ref('')
const done = ref(false)
const wasVerified = ref(false)
const kkBusy = ref(false)
const kkError = ref('')
const formEl = ref(null)

const allSteps = computed(() => [...STEPS, { key: 'kirim', title: 'Periksa & kirim' }])
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : '')
const idOf = (field) => `f-${field.path.replace('.', '-')}`
const value = (field) => getPath(form.value, field.path) ?? ''
const isMasked = (v) => /^\d{4}\*{8}\d{4}$/.test(String(v || ''))
// same name as in the TPQ records (ignoring case and spaces)
const norm = (v) => String(v || '').toLowerCase().replace(/\s+/g, ' ').trim()
const sameAsRecord = (v) => !!v && norm(v) === norm(santri.value.name)
const shown = (f) => {
  const v = value(f)
  if (f.type === 'gender') return v === 'L' ? 'Laki-laki' : 'Perempuan'
  if (f.type === 'date') return new Date(`${v}T12:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  return v
}

function set(field, v) {
  setPath(form.value, field.path, v)
  if (errors.value[field.path]) errors.value = { ...errors.value, [field.path]: fieldError(field, v) }
}

function onInput(field, event) {
  let v = event.target.value
  if (field.type === 'digits16' || field.type === 'digits') {
    v = v.replace(/\D/g, '')
    event.target.value = v
  }
  set(field, v)
}

function applyServer(data) {
  santri.value = data.santri
  form.value = mergeProfile(data.profile.data)
  status.value = data.profile.status
  adminNote.value = data.profile.adminNote || ''
  pendingIdentity.value = data.profile.pendingIdentity || []
  hasKkPhoto.value = !!data.profile.hasKkPhoto
}

async function load() {
  try {
    const { data } = await api.get(`/wali/santri/${santriId}`, { cache: false })
    applyServer(data)
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Data belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

async function focusFirstError() {
  await nextTick()
  formEl.value?.querySelector('[aria-invalid="true"], .w-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

// Saves what is there (a draft, or the full form when submit). Server field errors bring the person to that step.
async function save({ submit = false } = {}) {
  saving.value = true
  saveError.value = ''
  try {
    const { data } = await api.put(`/wali/santri/${santriId}`, { data: form.value, submit })
    return data
  } catch (err) {
    const fields = err.response?.data?.fields
    if (fields) {
      errors.value = fields
      const first = Object.keys(fields)[0]
      const at = stepOfPath(first)
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

async function next() {
  if (step.value < STEPS.length) {
    const errs = stepErrors(STEPS[step.value], form.value)
    errors.value = errs
    if (Object.keys(errs).length) return focusFirstError()
    // a verified profile is only saved at the end (identity rules); a draft is saved at every step
    if (status.value !== 'verified') {
      const saved = await save()
      if (!saved) return
      status.value = saved.profile.status
    }
    step.value += 1
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  // last step
  const all = STEPS.reduce((acc, s) => ({ ...acc, ...stepErrors(s, form.value) }), {})
  if (!form.value.persetujuan.syarat) all['persetujuan.syarat'] = 'wajib'
  if (!form.value.persetujuan.data) all['persetujuan.data'] = 'wajib'
  errors.value = all
  if (Object.keys(all).length) {
    const at = stepOfPath(Object.keys(all)[0])
    if (at >= 0) step.value = at
    return focusFirstError()
  }
  wasVerified.value = status.value === 'verified'
  const saved = await save({ submit: !wasVerified.value })
  if (!saved) return
  applyServer(saved)
  done.value = true
  window.scrollTo({ top: 0 })
}

function back() {
  errors.value = {}
  step.value = Math.max(0, step.value - 1)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goTo(i) {
  step.value = i
  window.scrollTo({ top: 0 })
}

async function saveAndLeave() {
  if (status.value === 'verified') return router.push('/wali')
  const saved = await save()
  if (saved) router.push('/wali')
}

// The KK photo is made smaller on the phone first (max 1600px, JPEG), so it uploads fast on mobile data.
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gambar tidak bisa dibaca'))
    }
    img.src = url
  })
}

async function uploadKk(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  kkError.value = ''
  if (!file.type.startsWith('image/')) {
    kkError.value = 'Pilih file gambar (foto KK).'
    return
  }
  kkBusy.value = true
  try {
    const dataUrl = await shrinkImage(file)
    await api.post(`/wali/santri/${santriId}/kk`, { dataBase64: dataUrl, contentType: 'image/jpeg' })
    hasKkPhoto.value = true
  } catch (err) {
    kkError.value = err.response?.data?.error || err.message || 'Foto KK belum terunggah.'
  } finally {
    kkBusy.value = false
  }
}

async function removeKk() {
  kkError.value = ''
  try {
    await api.delete(`/wali/santri/${santriId}/kk`)
    hasKkPhoto.value = false
  } catch (err) {
    kkError.value = err.response?.data?.error || 'Foto KK belum terhapus.'
  }
}

onMounted(load)
</script>

<style scoped>
.back-link {
  display: inline-block;
  margin: -4px 0 6px;
  text-decoration: none;
}

.santri-sub {
  margin-bottom: 12px;
}

.name-note {
  display: block; /* .w-note is a flex row: keep the sentence flowing around the bold words */
  margin: 6px 0 0;
  font-size: 0.85rem;
}

.step-hint {
  display: block;
  margin: 0 0 14px;
}

.masked-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 50px;
  padding: 0 4px 0 14px;
  border-radius: 12px;
  background: #f3f6f4;
  border: 1.5px dashed rgba(11, 59, 42, 0.2);
}

.masked-value {
  font-weight: 700;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
  color: #0b3b2a;
}

.kk-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid rgba(11, 59, 42, 0.1);
}

.kk-box .w-help {
  margin: 0;
}

.kk-done {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.kk-pick {
  position: relative;
}

.kk-remove {
  color: #b42318;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.review-group + .review-group {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(11, 59, 42, 0.1);
}

.review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.review-head strong {
  color: #0b3b2a;
}

.review-group dl {
  margin: 6px 0 0;
}

.review-row {
  display: grid;
  grid-template-columns: minmax(0, 42%) minmax(0, 1fr);
  gap: 10px;
  padding: 4px 0;
  font-size: 0.9rem;
}

.review-row dt {
  color: #5b6b62;
}

.review-row dd {
  margin: 0;
  font-weight: 600;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.agree {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(11, 59, 42, 0.1);
}

.agree-title {
  color: #0b3b2a;
}

.agree ul {
  margin: 8px 0 12px;
  padding-left: 18px;
  font-size: 0.88rem;
  line-height: 1.55;
  color: #475a50;
}

.check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #0b3b2a;
  cursor: pointer;
}

.check input {
  flex: none;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  accent-color: #0a5c40;
}

.form-error {
  margin-top: 12px;
}

.later {
  margin-top: 4px;
}
</style>
