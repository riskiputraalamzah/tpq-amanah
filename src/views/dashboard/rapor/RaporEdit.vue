<template>
  <div class="rpx re">
    <PageSkeleton v-if="loading && !d" :rows="6" label="Memuat rapor" />
    <p v-else-if="error && !d" class="rpx-note is-danger" role="alert">{{ error }}</p>

    <template v-else-if="d">
      <!-- who, and the next / previous child of the list -->
      <nav class="re-switch" aria-label="Pindah santri">
        <router-link v-if="prevId" :to="linkTo(prevId)" class="re-nav" aria-label="Santri sebelumnya" replace>‹</router-link>
        <span v-else class="re-nav is-off" aria-hidden="true">‹</span>
        <div class="re-who">
          <strong>{{ d.santri.name }}</strong>
          <span>
            {{ levelName(d.rapor.classId) }}<template v-if="position"> · {{ position }}</template>
            · <span class="rpx-pill" :class="`is-${STATUS[d.rapor.exists ? d.rapor.status : 'empty']?.tone}`">{{ STATUS[d.rapor.exists ? d.rapor.status : 'empty']?.label }}</span>
          </span>
        </div>
        <router-link v-if="nextId" :to="linkTo(nextId)" class="re-nav" aria-label="Santri berikutnya" replace>›</router-link>
        <span v-else class="re-nav is-off" aria-hidden="true">›</span>
      </nav>

      <p v-if="d.rapor.status === 'revision'" class="rpx-note is-danger"><b>Perlu revisi:</b> {{ d.rapor.revisionNote }}</p>
      <p v-if="!d.canEdit && d.reason" class="rpx-note is-warn">{{ d.reason }}</p>
      <p v-if="d.rapor.status === 'done'" class="rpx-note">✓ Selesai, diparaf {{ d.rapor.teacher?.name }}. Menunggu diterbitkan admin. Mengubah isi akan membuatnya draf lagi.</p>
      <p v-if="d.rapor.status === 'published'" class="rpx-note">Sudah terbit {{ shortDate(d.rapor.publishedAt) }}<template v-if="d.rapor.rank"> · ranking {{ d.rapor.rank }} dari {{ d.rapor.rankOf }}</template>.</p>

      <fieldset class="re-fs" :disabled="!d.canEdit">
        <section v-for="grp in groups" :key="grp.key" class="rpx-card re-scores" :aria-labelledby="`re-${grp.key}`">
          <h2 :id="`re-${grp.key}`" class="re-h">{{ grp.title }} <small v-if="grp.hint">{{ grp.hint }}</small></h2>
          <div v-for="(s, i) in grp.items" :key="s.key" class="re-score">
            <label :for="`sc-${s.key}`">{{ i + 1 }}. {{ s.label }}</label>
            <input
              :id="`sc-${s.key}`"
              :ref="(el) => (inputs[s.key] = el)"
              v-model="scoreInput[s.key]"
              class="rpx-input re-num"
              :class="{ 'is-bad': badScore(s.key) }"
              inputmode="decimal"
              enterkeyhint="next"
              placeholder="–"
              autocomplete="off"
              @input="onScore(s.key)"
              @keydown.enter.prevent="focusNext(s.key)"
            />
            <span class="rpx-grade" :class="gradeOfKey(s.key) ? `is-${gradeOfKey(s.key)}` : 'is-none'" aria-hidden="true">{{ gradeOfKey(s.key) || '–' }}</span>
          </div>
        </section>

        <section class="re-sum" aria-label="Jumlah dan rata-rata">
          <div><span>Jumlah</span><strong>{{ num(summary.total) }}</strong></div>
          <div><span>Rata-rata</span><strong>{{ num(summary.average) }} <em>{{ summary.grade || '' }}</em></strong></div>
          <div><span>Ranking</span><strong>{{ d.rapor.rank ? `${d.rapor.rank}/${d.rapor.rankOf}` : '–' }}</strong></div>
          <small>Dihitung otomatis dari nilai yang terisi. Ranking dihitung saat rapor jilid diterbitkan.</small>
        </section>

        <section class="rpx-card re-att" aria-labelledby="re-att">
          <div class="re-att-head">
            <h2 id="re-att" class="re-h">Kehadiran</h2>
            <button v-if="!attEdit" type="button" class="rpx-btn is-small" @click="startAttEdit">Ubah</button>
            <button v-else type="button" class="rpx-btn is-small" @click="useAutoAtt">Pakai hitungan otomatis</button>
          </div>
          <div class="re-att-grid">
            <label v-for="k in ATT" :key="k.key" class="re-att-box">
              <input v-if="attEdit" v-model.number="att[k.key]" type="number" inputmode="numeric" min="0" class="re-att-input" :aria-label="`${k.label} (hari)`" @input="saveAtt" />
              <strong v-else>{{ shownAtt[k.key] }}</strong>
              <span>hari {{ k.label }}</span>
            </label>
          </div>
          <small class="re-att-note">{{ attEdit || d.rapor.attendance ? 'Diisi manual oleh guru.' : `Otomatis dari Absen Santri, ${shortDate(d.period.attendanceFrom)} – ${shortDate(d.period.attendanceTo)}.` }}</small>
        </section>

        <section class="rpx-card re-ragam" aria-labelledby="re-ragam">
          <h2 id="re-ragam" class="re-h">Ragam perkembangan <small>{{ softLeft ? `${softLeft} belum dipilih` : 'lengkap' }}</small></h2>
          <p class="re-sub">I. Sikap</p>
          <div v-for="[k, label] in SIKAP" :key="k" class="re-seg-row">
            <span>{{ k }}. {{ label }}</span>
            <div class="re-seg" role="group" :aria-label="label">
              <button v-for="[v, t] in SIKAP_OPTIONS" :key="v" type="button" :aria-pressed="form.sikap[k] === v" @click="pickSeg('sikap', k, v)">{{ t }}</button>
            </div>
          </div>
          <p class="re-sub">II. Sifat</p>
          <div v-for="[k, label] in SIFAT" :key="k" class="re-seg-row">
            <span>{{ k }}. {{ label }}</span>
            <div class="re-seg" role="group" :aria-label="label">
              <button v-for="[v, t] in SIFAT_OPTIONS" :key="v" type="button" :aria-pressed="form.sifat[k] === v" @click="pickSeg('sifat', k, v)">{{ t }}</button>
            </div>
          </div>
        </section>

        <section class="rpx-card re-ket" aria-labelledby="re-ket">
          <h2 id="re-ket" class="re-h">Keterangan</h2>
          <div class="rpx-grid2">
            <button type="button" class="re-dec is-naik" :aria-pressed="form.decision === 'naik'" @click="pickDecision('naik')">
              <strong>Naik</strong><small>{{ nextLabel }}</small>
            </button>
            <button type="button" class="re-dec is-belum" :aria-pressed="form.decision === 'belum'" @click="pickDecision('belum')">
              <strong>Belum naik</strong><small>tetap {{ levelName(d.rapor.classId) }}</small>
            </button>
          </div>
          <label class="rpx-field">
            Catatan ustadz/ustadzah <small>(tampil ke wali)</small>
            <textarea v-model="form.notes" class="rpx-input" rows="3" maxlength="1000" placeholder="Contoh: Ananda rajin dan lancar. Mohon dibantu muroja'ah di rumah." @input="queueSave({ notes: form.notes })"></textarea>
          </label>
        </section>
      </fieldset>

      <div class="re-bar">
        <span class="re-state" :class="`is-${saveState}`" role="status" aria-live="polite">{{ saveText }}</span>
        <router-link v-if="d.rapor.exists" :to="`/dashboard/rapor/${periodId}/santri/${santriId}/cetak`" class="rpx-btn is-small">Lihat</router-link>
        <button v-if="d.canEdit && d.rapor.status !== 'done'" type="button" class="rpx-btn is-primary" :disabled="finishing" @click="finish">{{ finishing ? 'Menyimpan…' : 'Selesai & paraf' }}</button>
        <button v-else-if="d.canEdit && d.rapor.status === 'done'" type="button" class="rpx-btn" :disabled="finishing" @click="reopen">Ubah lagi</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import '@/styles/rapor.css'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { STATUS, SIKAP, SIFAT, SIKAP_OPTIONS, SIFAT_OPTIONS, subjectsOf, summaryOf, gradeOf, nextClassOf, levelName, num, shortDate } from '@/utils/rapor'

const route = useRoute()
const router = useRouter()
const { ask } = useDialog()
const toast = useToast()
const periodId = route.params.periodId
const santriId = ref(route.params.santriId)
const d = ref(null)
const loading = ref(true)
const error = ref('')
const finishing = ref(false)
const inputs = {}
const ATT = [
  { key: 'izin', label: 'izin' },
  { key: 'sakit', label: 'sakit' },
  { key: 'alpha', label: 'alpha' },
]

const form = ref({ sikap: {}, sifat: {}, decision: null, notes: '' })
const scoreInput = ref({})
const att = ref({ izin: 0, sakit: 0, alpha: 0 })
const attEdit = ref(false)

const order = computed(() => {
  try {
    return JSON.parse(sessionStorage.getItem(`tpq.rapor.order.${periodId}`) || '[]')
  } catch {
    return []
  }
})
const idx = computed(() => order.value.indexOf(santriId.value))
const prevId = computed(() => (idx.value > 0 ? order.value[idx.value - 1] : ''))
const nextId = computed(() => (idx.value >= 0 && idx.value < order.value.length - 1 ? order.value[idx.value + 1] : ''))
const position = computed(() => (idx.value >= 0 ? `${idx.value + 1} dari ${order.value.length}` : ''))
const linkTo = (id) => `/dashboard/rapor/${periodId}/santri/${id}`

const subjects = computed(() => subjectsOf(d.value?.period || {}))
const groups = computed(() => [
  { key: 'inti', title: 'A. Inti', hint: 'wajib', items: subjects.value.inti },
  { key: 'penunjang', title: 'B. Penunjang', hint: 'boleh kosong', items: subjects.value.penunjang },
])
const allKeys = computed(() => [...subjects.value.inti, ...subjects.value.penunjang].map((s) => s.key))
const parse = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null
  const n = Number(String(v).trim().replace(',', '.'))
  return Number.isFinite(n) && n >= 0 && n <= 10 ? Math.round(n * 10) / 10 : NaN
}
const badScore = (k) => Number.isNaN(parse(scoreInput.value[k]))
const gradeOfKey = (k) => {
  const n = parse(scoreInput.value[k])
  return n === null || Number.isNaN(n) ? null : gradeOf(n)
}
const scoresNow = computed(() => {
  const out = {}
  for (const k of allKeys.value) {
    const n = parse(scoreInput.value[k])
    if (n !== null && !Number.isNaN(n)) out[k] = n
  }
  return out
})
const summary = computed(() => summaryOf(scoresNow.value, d.value?.period || {}))
const shownAtt = computed(() => d.value?.rapor.attendance || d.value?.attendanceAuto || { izin: 0, sakit: 0, alpha: 0 })
const softLeft = computed(() => SIKAP.filter(([k]) => !form.value.sikap[k]).length + SIFAT.filter(([k]) => !form.value.sifat[k]).length)
const nextLabel = computed(() => {
  const to = nextClassOf(d.value?.rapor.classId)
  return to === 'lulus' ? 'lulus Marhalah' : to ? `ke ${levelName(to)}` : ''
})

function fill(data) {
  d.value = data
  const r = data.rapor
  const s = {}
  for (const k of [...subjectsOf(data.period).inti, ...subjectsOf(data.period).penunjang].map((x) => x.key)) s[k] = r.scores?.[k] !== null && r.scores?.[k] !== undefined ? String(r.scores[k]).replace('.', ',') : ''
  scoreInput.value = s
  form.value = { sikap: { ...(r.sikap || {}) }, sifat: { ...(r.sifat || {}) }, decision: r.decision || null, notes: r.notes || '' }
  attEdit.value = !!r.attendance
  att.value = { ...(r.attendance || data.attendanceAuto) }
}
async function load({ silent = false } = {}) {
  if (!silent) loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/rapor/periods/${periodId}/santri/${santriId.value}`, { cache: false })
    fill(data)
  } catch (err) {
    error.value = err?.response?.data?.error || 'Rapor belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

/* ---------------- autosave: changes collect for a moment, then one request; one at a time; retried */
let pending = {}
let timer = null
let sending = null
let retry = 0
const saveState = ref('idle')
const SAVE_TEXT = { idle: '', waiting: 'Menyimpan…', saving: 'Menyimpan…', saved: 'Tersimpan ✓', error: 'Belum tersimpan, dicoba lagi…', refused: 'Tidak tersimpan' }
const saveText = computed(() => SAVE_TEXT[saveState.value])
const merge = (a, b) => {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' ? { ...a[k], ...v } : v
  return out
}
function queueSave(patch, delay = 700) {
  if (!d.value?.canEdit) return
  pending = merge(pending, patch)
  saveState.value = 'waiting'
  clearTimeout(timer)
  timer = setTimeout(flush, delay)
}
async function flush() {
  clearTimeout(timer)
  if (sending) return sending
  if (!Object.keys(pending).length) return
  const body = pending
  const sid = santriId.value
  pending = {}
  saveState.value = 'saving'
  sending = api
    .put(`/rapor/periods/${periodId}/santri/${sid}`, body)
    .then(({ data }) => {
      retry = 0
      if (sid === santriId.value && d.value) {
        d.value = { ...d.value, rapor: { ...d.value.rapor, ...data.rapor, exists: true }, missing: data.missing, softMissing: data.softMissing }
      }
      saveState.value = Object.keys(pending).length ? 'waiting' : 'saved'
    })
    .catch((err) => {
      const s = err?.response?.status
      if (!s || s >= 500 || s === 429) {
        pending = merge(body, pending) // keep it, try again
        saveState.value = 'error'
        timer = setTimeout(flush, [3000, 8000, 20000][Math.min(retry++, 2)])
      } else {
        saveState.value = 'refused'
        toast.error(err?.response?.data?.error || 'Tidak tersimpan.')
      }
    })
    .finally(() => {
      sending = null
      if (Object.keys(pending).length && saveState.value !== 'error') timer = setTimeout(flush, 300)
    })
  return sending
}

function onScore(k) {
  const n = parse(scoreInput.value[k])
  if (Number.isNaN(n)) return
  queueSave({ scores: { [k]: n } })
}
function focusNext(k) {
  const keys = allKeys.value
  const next = keys[keys.indexOf(k) + 1]
  if (next && inputs[next]) inputs[next].focus()
  else inputs[k]?.blur()
}
function pickSeg(group, k, v) {
  if (!d.value?.canEdit) return
  const value = form.value[group][k] === v ? null : v
  form.value[group] = { ...form.value[group], [k]: value }
  queueSave({ [group]: { [k]: value } }, 300)
}
function pickDecision(v) {
  if (!d.value?.canEdit) return
  form.value.decision = form.value.decision === v ? null : v
  queueSave({ decision: form.value.decision }, 200)
}
function startAttEdit() {
  att.value = { ...shownAtt.value }
  attEdit.value = true
  queueSave({ attendance: { ...att.value } }, 200)
}
function saveAtt() {
  const a = att.value
  if (![a.izin, a.sakit, a.alpha].every((n) => Number.isInteger(n) && n >= 0)) return
  queueSave({ attendance: { ...a } })
}
function useAutoAtt() {
  attEdit.value = false
  att.value = { ...d.value.attendanceAuto }
  queueSave({ attendance: null }, 100)
  if (d.value) d.value = { ...d.value, rapor: { ...d.value.rapor, attendance: null } }
}

async function finish() {
  const bad = allKeys.value.filter(badScore)
  if (bad.length) return toast.error('Ada nilai yang tidak valid (0 sampai 10, contoh 8,5).')
  finishing.value = true
  try {
    await flush()
    if (sending) await sending
    if (softLeft.value) {
      const ok = await ask({ title: 'Ragam perkembangan belum lengkap', message: `${softLeft.value} sikap/sifat belum dipilih. Tetap tandai selesai?`, confirmText: 'Tetap selesai', cancelText: 'Lengkapi dulu' })
      if (!ok) return
    }
    const { data } = await api.post(`/rapor/periods/${periodId}/santri/${santriId.value}/done`)
    fill(data)
    toast.success('Rapor selesai & diparaf')
    if (nextId.value) {
      const go = await ask({ title: 'Lanjut ke santri berikutnya?', message: 'Rapor ini sudah selesai.', confirmText: 'Lanjut', cancelText: 'Tetap di sini' })
      if (go) router.replace(linkTo(nextId.value))
    }
  } catch (err) {
    const missing = err?.response?.data?.missing
    toast.error(missing?.length ? `Belum lengkap: ${missing.join(', ')}` : err?.response?.data?.error || 'Belum bisa ditandai selesai.')
  } finally {
    finishing.value = false
  }
}
async function reopen() {
  finishing.value = true
  try {
    const { data } = await api.post(`/rapor/periods/${periodId}/santri/${santriId.value}/reopen`)
    fill(data)
  } catch (err) {
    toast.error(err?.response?.data?.error || 'Belum bisa dibuka.')
  } finally {
    finishing.value = false
  }
}

// moving to another child on the same page: send what is waiting first
onBeforeRouteUpdate(async (to) => {
  await flush()
  if (sending) await sending
  santriId.value = to.params.santriId
  d.value = null
  await load()
})
onBeforeRouteLeave(async () => {
  await flush()
  if (sending) await sending
  if (!Object.keys(pending).length) return true
  return ask({ title: 'Ada yang belum tersimpan', message: 'Perubahan rapor belum terkirim ke server. Keluar sekarang?', confirmText: 'Keluar', cancelText: 'Tetap di sini', tone: 'danger' })
})
const onUnload = (e) => {
  if (!Object.keys(pending).length && !sending) return
  e.preventDefault()
  e.returnValue = ''
}
const onHide = () => {
  if (document.visibilityState === 'hidden') flush()
}
const onOnline = () => {
  if (Object.keys(pending).length) flush()
}
watch(santriId, () => (saveState.value = 'idle'))
onMounted(() => {
  load()
  window.addEventListener('beforeunload', onUnload)
  window.addEventListener('online', onOnline)
  document.addEventListener('visibilitychange', onHide)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  flush()
  window.removeEventListener('beforeunload', onUnload)
  window.removeEventListener('online', onOnline)
  document.removeEventListener('visibilitychange', onHide)
})
</script>

<style scoped>
.re { max-width: 720px; }
.re-switch { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.re-nav {
  flex: none;
  display: grid;
  place-items: center;
  width: 46px;
  height: 52px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fff;
  font-size: 1.6rem;
  color: var(--ink);
  text-decoration: none;
}
.re-nav.is-off { opacity: 0.35; }
.re-who { flex: 1; min-width: 0; display: grid; gap: 4px; padding: 8px 12px; border-radius: 14px; background: #fff; border: 1.5px solid var(--emerald); text-align: center; }
.re-who strong { font-size: 1.02rem; overflow-wrap: anywhere; }
.re-who > span { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 4px; font-size: 0.8rem; color: var(--muted); }
.re-fs { margin: 0; padding: 0; border: 0; min-width: 0; display: grid; gap: 12px; }
.re-fs:disabled { opacity: 0.85; }
.re-h { display: flex; align-items: baseline; gap: 8px; margin: 0 0 6px; font-size: 0.86rem; font-weight: 800; letter-spacing: 0.04em; color: var(--emerald-dark); text-transform: uppercase; }
.re-h small { font-size: 0.74rem; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--muted); }
.re-score { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f1ece1; }
.re-score:last-child { border-bottom: 0; }
.re-score label { flex: 1; min-width: 0; font-size: 0.92rem; font-weight: 600; color: var(--ink); }
.re-num { width: 74px; flex: none; min-height: 46px; text-align: center; font-size: 1.1rem; font-weight: 800; padding: 0 6px; }
.re-num.is-bad { border-color: var(--danger); background: #fff6f5; }
.re-sum {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px 8px;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--emerald-dark);
  color: #fbf9f3;
}
.re-sum div { display: grid; gap: 2px; }
.re-sum span { font-size: 0.74rem; color: #b6d3c4; }
.re-sum strong { font-size: 1.25rem; font-weight: 800; }
.re-sum em { font-style: normal; color: #e9c46a; }
.re-sum small { grid-column: 1 / -1; font-size: 0.74rem; color: #b6d3c4; }
.re-att { display: grid; gap: 10px; }
.re-att-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.re-att-head .re-h { margin: 0; }
.re-att-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.re-att-box { display: grid; gap: 2px; padding: 10px; border-radius: 12px; background: var(--sand); }
.re-att-box strong { font-size: 1.2rem; }
.re-att-box span { font-size: 0.78rem; color: var(--muted); }
.re-att-input { width: 100%; min-height: 40px; box-sizing: border-box; border-radius: 10px; border: 1.5px solid var(--emerald); font: inherit; font-size: 1.1rem; font-weight: 800; text-align: center; }
.re-att-note { font-size: 0.78rem; color: var(--muted); }
.re-ragam { display: grid; gap: 8px; }
.re-sub { margin: 6px 0 0; font-size: 0.8rem; font-weight: 800; color: var(--muted); }
.re-seg-row { display: grid; gap: 6px; }
.re-seg-row > span { font-size: 0.9rem; font-weight: 600; }
@media (min-width: 640px) {
  .re-seg-row { grid-template-columns: 1fr 320px; align-items: center; }
}
.re-seg { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; padding: 3px; border-radius: 12px; background: #f1ece1; }
.re-seg button { min-height: 40px; border: 0; border-radius: 9px; background: transparent; font: inherit; font-size: 0.84rem; font-weight: 600; color: #33413a; cursor: pointer; }
.re-seg button[aria-pressed='true'] { background: var(--emerald); color: #fff; font-weight: 800; }
.re-ket { display: grid; gap: 12px; }
.re-dec { display: grid; gap: 2px; min-height: 58px; padding: 8px 12px; border-radius: 14px; border: 1.5px solid #e4ded1; background: #fff; text-align: left; font: inherit; color: #33413a; cursor: pointer; }
.re-dec small { font-size: 0.78rem; color: var(--muted); }
.re-dec.is-naik[aria-pressed='true'] { background: var(--emerald); border-color: var(--emerald); color: #fff; }
.re-dec.is-belum[aria-pressed='true'] { background: #7c3a06; border-color: #7c3a06; color: #fff; }
.re-dec[aria-pressed='true'] small { color: rgba(255, 255, 255, 0.8); }
.re-bar {
  position: sticky;
  bottom: calc(var(--nav-h, 0px) + var(--nav-over, 0px) + 10px);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 10px 30px -12px rgba(3, 41, 29, 0.35);
}
@media (min-width: 1024px) {
  .re-bar { bottom: 16px; }
}
.re-state { flex: 1; min-width: 0; font-size: 0.82rem; color: var(--muted); }
.re-state.is-saved { color: var(--emerald); }
.re-state.is-error, .re-state.is-refused { color: var(--danger); }
</style>
