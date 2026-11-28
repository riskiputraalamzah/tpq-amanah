<template>
  <!-- Kartu Prestasi: the full form of one child's test (place, optional score and note), or only "ananda sekarang di
       halaman ..." when nothing is tested yet. The quick row (Lanjut / Ulang) covers most taps; this is for the rest. -->
  <Teleport to="body">
    <div v-if="open && santri" class="kt-overlay" @click.self="close" @keydown.esc="close">
      <section class="kt" role="dialog" aria-modal="true" aria-labelledby="kt-title">
        <span class="kt-grip" aria-hidden="true"></span>
        <header class="kt-head">
          <div class="kt-head-text">
            <span class="kt-kicker">{{ onlyPlace ? 'Posisi ananda' : 'Tes mengaji' }}</span>
            <h2 id="kt-title">{{ santri.name }}</h2>
            <p class="kt-last">{{ lastText }}</p>
          </div>
          <button type="button" class="kt-x" aria-label="Tutup" @click="close">✕</button>
        </header>

        <div class="kt-seg" role="group" aria-label="Yang dites">
          <button v-for="k in KINDS" :key="k.key" type="button" :aria-pressed="kind === k.key" @click="setKind(k.key)">{{ k.label }}</button>
        </div>

        <!-- where -->
        <div v-if="kind === 'jilid'" class="kt-grid2">
          <label class="kt-field">
            <span>Jilid</span>
            <select v-model="jilid" class="kt-input">
              <option v-for="n in 6" :key="n" :value="String(n)">Jilid {{ n }}</option>
            </select>
          </label>
          <div class="kt-field">
            <span id="kt-page-label">Halaman (1–{{ PAGES }})</span>
            <div class="kt-stepper" role="group" aria-labelledby="kt-page-label">
              <button type="button" aria-label="Halaman sebelumnya" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">−</button>
              <input v-model.number="page" type="number" inputmode="numeric" :min="1" :max="PAGES" aria-label="Halaman" @blur="page = clampPage(page)" />
              <button type="button" aria-label="Halaman berikutnya" :disabled="page >= PAGES" @click="page = Math.min(PAGES, page + 1)">+</button>
            </div>
          </div>
        </div>
        <div v-else class="kt-surah">
          <label class="kt-field">
            <span>Surat</span>
            <select v-model.number="surah" class="kt-input">
              <option v-for="(s, i) in SURAHS" :key="i" :value="i + 1">{{ i + 1 }}. {{ s[0] }} ({{ s[1] }} ayat)</option>
            </select>
          </label>
          <div class="kt-grid2">
            <label class="kt-field">
              <span>Dari ayat</span>
              <input v-model.number="ayatFrom" type="number" inputmode="numeric" class="kt-input" :min="1" :max="maxAyat" />
            </label>
            <label class="kt-field">
              <span>Sampai ayat</span>
              <input v-model.number="ayatTo" type="number" inputmode="numeric" class="kt-input" :min="ayatFrom || 1" :max="maxAyat" />
            </label>
          </div>
        </div>
        <p v-if="placeHint" class="kt-hint">{{ placeHint }}</p>

        <template v-if="!onlyPlace">
          <!-- optional score -->
          <div class="kt-block">
            <span class="kt-label">Nilai <em>(boleh dikosongkan)</em></span>
            <div class="kt-score-row">
              <input v-model="scoreInput" class="kt-input kt-score" inputmode="decimal" placeholder="–" aria-label="Nilai 0 sampai 10" />
              <span v-if="grade" class="kt-grade" :class="`is-${grade}`"><strong>{{ grade }}</strong><small>Kriteria {{ grade }}<br />{{ GRADE_RANGE[grade] }}</small></span>
              <span v-else class="kt-grade is-none"><small>Tanpa nilai</small></span>
            </div>
            <div class="kt-quick">
              <button v-for="q in QUICK_SCORES" :key="q" type="button" :aria-pressed="scoreValue === q" @click="pickScore(q)">{{ scoreText(q) }}</button>
            </div>
            <p v-if="scoreError" class="kt-err" role="alert">{{ scoreError }}</p>
          </div>

          <!-- lanjut / ulang -->
          <div class="kt-block">
            <span class="kt-label">Pertemuan berikutnya</span>
            <div class="kt-grid2">
              <button type="button" class="kt-result is-lanjut" :aria-pressed="result === 'lanjut'" @click="chooseResult('lanjut')">
                <strong>Lanjut</strong><small>{{ nextLabel('lanjut') }}</small>
              </button>
              <button type="button" class="kt-result is-ulang" :aria-pressed="result === 'ulang'" @click="chooseResult('ulang')">
                <strong>Ulang</strong><small>{{ nextLabel('ulang') }}</small>
              </button>
            </div>
          </div>

          <!-- note -->
          <div class="kt-block">
            <span class="kt-label">Catatan <em>(tampil ke wali, boleh dikosongkan)</em></span>
            <div class="kt-chips">
              <button v-for="c in NOTE_CHIPS" :key="c" type="button" :aria-pressed="hasChip(c)" @click="toggleChip(c)">{{ c }}</button>
            </div>
            <textarea v-model="notes" class="kt-input kt-notes" rows="2" maxlength="300" placeholder="Tulis catatan lain (opsional)"></textarea>
          </div>
        </template>

        <p v-if="saveError" class="kt-err" role="alert">{{ saveError }}</p>

        <footer class="kt-foot">
          <template v-if="onlyPlace">
            <button type="button" class="kt-primary" :disabled="busy || !placeValid" @click="savePlace">{{ busy ? 'Menyimpan…' : 'Simpan posisi' }}</button>
          </template>
          <template v-else>
            <span class="kt-paraf">Paraf otomatis<br /><strong>{{ myName || 'Antum' }}</strong></span>
            <button v-if="existing" type="button" class="kt-delete" :disabled="busy" @click="removeTest">Hapus</button>
            <button type="button" class="kt-primary" :disabled="busy || !placeValid || !!scoreError" @click="saveTest">{{ busy ? 'Menyimpan…' : 'Simpan' }}</button>
          </template>
        </footer>
        <button v-if="!onlyPlace && !existing" type="button" class="kt-link" @click="onlyPlace = true">Belum dites, hanya atur posisi ananda</button>
        <button v-else-if="onlyPlace && hadir" type="button" class="kt-link" @click="onlyPlace = false">Isi tes hari ini</button>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDialog } from '@/composables/useDialog'
import { SURAHS, ayatCount, surahName } from '@/utils/surahs'
import { PAGES, KINDS, NOTE_CHIPS, QUICK_SCORES, GRADE_RANGE, parseScore, gradeOf, scoreText, mainKind, nextText, shortDay, placeText } from '@/utils/kps'

const props = defineProps({
  open: { type: Boolean, default: false },
  santri: { type: Object, default: null }, // { id, name, classId }
  hadir: { type: Boolean, default: false },
  kps: { type: Object, required: true }, // useKpsDay()
  myName: { type: String, default: '' },
  startKind: { type: String, default: '' },
})
const emit = defineEmits(['close', 'saved'])
const { ask } = useDialog()

const kind = ref('jilid')
const jilid = ref('1')
const page = ref(1)
const surah = ref(1)
const ayatFrom = ref(1)
const ayatTo = ref(1)
const scoreInput = ref('')
const result = ref('lanjut')
const notes = ref('')
const onlyPlace = ref(false)
const busy = ref(false)
const saveError = ref('')
let resultTouched = false

const day = computed(() => props.kps.day.value)
const existing = computed(() => (props.santri ? props.kps.testOf(props.santri.id, kind.value) : null))
const position = computed(() => (props.santri ? props.kps.positionOf(props.santri.id, kind.value) : null))
const maxAyat = computed(() => ayatCount(surah.value) || 1)
const clampPage = (n) => Math.min(PAGES, Math.max(1, Math.round(Number(n) || 1)))
const scoreValue = computed(() => parseScore(scoreInput.value))
const scoreError = computed(() => {
  const v = scoreValue.value
  if (v === null) return ''
  return Number.isNaN(v) || v < 0 || v > 10 ? 'Nilai 0 sampai 10, contoh 8,5.' : ''
})
const grade = computed(() => (scoreError.value ? null : gradeOf(scoreValue.value)))
const placeValid = computed(() =>
  kind.value === 'jilid'
    ? /^[1-6]$/.test(jilid.value) && Number.isInteger(page.value) && page.value >= 1 && page.value <= PAGES
    : surah.value >= 1 && Number.isInteger(ayatFrom.value) && ayatFrom.value >= 1 && ayatFrom.value <= maxAyat.value && Number.isInteger(ayatTo.value) && ayatTo.value >= ayatFrom.value && ayatTo.value <= maxAyat.value,
)
const place = computed(() => (kind.value === 'jilid' ? { jilid: jilid.value, page: page.value } : { surah: surah.value, surahName: surahName(surah.value), ayatFrom: ayatFrom.value, ayatTo: ayatTo.value }))
const nextLabel = (r) => (placeValid.value ? nextText({ kind: kind.value, ...place.value, result: r }) : '')

const lastText = computed(() => {
  const last = position.value?.last
  if (existing.value) return `Sudah dites sesi ini: ${placeText(existing.value.kind, existing.value)} · ${existing.value.result === 'lanjut' ? 'Lanjut' : 'Ulang'}`
  if (last) return `Terakhir: ${last.text} · ${last.result === 'lanjut' ? 'Lanjut' : 'Ulang'} · ${shortDay(last.date)}`
  return position.value ? 'Posisi sudah diatur, belum ada tes.' : 'Belum ada catatan tes.'
})
const placeHint = computed(() => {
  if (existing.value || !position.value) return ''
  if (position.value.done) return kind.value === 'jilid' ? `Ananda sudah menyelesaikan Jilid ${position.value.jilid}. Pilih jilid/halaman berikutnya.` : 'Bagian sebelumnya sudah selesai. Pilih surat berikutnya.'
  return kind.value === 'jilid' ? 'Otomatis dari tes terakhir. Ubah bila ananda sedang di halaman lain.' : 'Otomatis dari tes terakhir. Ubah bila perlu.'
})

// fill the form from today's test, else from the child's position
function fill() {
  const t = existing.value
  const p = t || props.kps.placeFor(props.santri, kind.value) || null
  if (kind.value === 'jilid') {
    const level = /^[1-6]$/.test(String(props.santri.classId)) ? String(props.santri.classId) : '1'
    jilid.value = p?.jilid ? String(p.jilid) : level
    page.value = p?.page ? Number(p.page) : 1
  } else {
    surah.value = p?.surah ? Number(p.surah) : kind.value === 'hafalan' ? 114 : 1
    ayatFrom.value = p?.ayatFrom ? Number(p.ayatFrom) : 1
    ayatTo.value = p?.ayatTo ? Number(p.ayatTo) : ayatFrom.value
  }
  scoreInput.value = t?.score !== null && t?.score !== undefined ? scoreText(t.score) : ''
  result.value = t?.result || 'lanjut'
  notes.value = t?.notes || ''
  resultTouched = !!t
}
function setKind(k) {
  kind.value = k
  fill()
}
watch(
  () => props.open,
  (v) => {
    if (!v || !props.santri) return
    saveError.value = ''
    busy.value = false
    kind.value = props.startKind || mainKind(props.santri.classId)
    onlyPlace.value = !props.hadir
    fill()
  },
)
watch(surah, () => {
  if (ayatFrom.value > maxAyat.value) ayatFrom.value = 1
  if (ayatTo.value > maxAyat.value || ayatTo.value < ayatFrom.value) ayatTo.value = ayatFrom.value
})
watch(ayatFrom, (v) => {
  if (Number(ayatTo.value) < Number(v)) ayatTo.value = v
})
function chooseResult(r) {
  result.value = r
  resultTouched = true
}
// a C score suggests "ulang" (the teacher can still choose lanjut)
watch(grade, (g) => {
  if (!resultTouched && g) result.value = g === 'C' ? 'ulang' : 'lanjut'
})
function pickScore(q) {
  scoreInput.value = scoreValue.value === q ? '' : scoreText(q)
}

const chipsIn = () => notes.value.split(',').map((s) => s.trim()).filter(Boolean)
const hasChip = (c) => chipsIn().some((x) => x.toLowerCase() === c.toLowerCase())
function toggleChip(c) {
  const list = chipsIn()
  notes.value = hasChip(c) ? list.filter((x) => x.toLowerCase() !== c.toLowerCase()).join(', ') : [...list, c].join(', ')
}

const errorOf = (err, fallback) => err?.response?.data?.error || fallback
async function saveTest() {
  if (!placeValid.value || scoreError.value) return
  busy.value = true
  saveError.value = ''
  try {
    const { date, slot } = day.value
    await props.kps.saveDetail({ date, slot, santriId: props.santri.id, kind: kind.value, result: result.value, ...place.value, score: scoreValue.value, notes: notes.value })
    emit('saved', { santriId: props.santri.id })
    emit('close')
  } catch (err) {
    saveError.value = errorOf(err, 'Tes belum tersimpan. Periksa koneksi lalu coba lagi.')
  } finally {
    busy.value = false
  }
}
async function savePlace() {
  if (!placeValid.value) return
  busy.value = true
  saveError.value = ''
  try {
    const { date, slot } = day.value
    await props.kps.setPosition({ date, slot, santriId: props.santri.id, kind: kind.value, ...place.value })
    emit('saved', { santriId: props.santri.id })
    emit('close')
  } catch (err) {
    saveError.value = errorOf(err, 'Posisi belum tersimpan. Coba lagi.')
  } finally {
    busy.value = false
  }
}
async function removeTest() {
  const ok = await ask({
    title: 'Hapus tes ini?',
    message: `Tes ${placeText(existing.value.kind, existing.value)} untuk ${props.santri.name} dihapus. Pesan ke wali yang belum terkirim ikut dibatalkan.`,
    confirmText: 'Hapus',
    cancelText: 'Batal',
    tone: 'danger',
  })
  if (!ok) return
  busy.value = true
  saveError.value = ''
  try {
    const { date, slot } = day.value
    await props.kps.removeDetail({ date, slot, santriId: props.santri.id, kind: kind.value })
    emit('saved', { santriId: props.santri.id })
    emit('close')
  } catch (err) {
    saveError.value = errorOf(err, 'Tes belum terhapus. Coba lagi.')
  } finally {
    busy.value = false
  }
}
function close() {
  if (!busy.value) emit('close')
}
</script>

<style scoped>
.kt-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 25, 17, 0.45);
}
@media (min-width: 768px) {
  .kt-overlay { align-items: center; }
}
.kt {
  display: grid;
  gap: 14px;
  width: 100%;
  max-width: 520px;
  max-height: 94vh;
  overflow-y: auto;
  padding: 10px 16px calc(16px + env(safe-area-inset-bottom));
  border-radius: 22px 22px 0 0;
  background: #fbf9f3;
  color: #0b3b2a;
  box-sizing: border-box;
  animation: kt-in 240ms ease-out;
}
@media (min-width: 768px) {
  .kt { border-radius: 22px; padding: 18px 22px 22px; }
  .kt-grip { display: none; }
}
.kt-grip {
  justify-self: center;
  width: 44px;
  height: 5px;
  border-radius: 5px;
  background: #d8d1c2;
}
.kt-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.kt-head-text { display: grid; gap: 2px; min-width: 0; }
.kt-kicker {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8a4b07;
}
.kt-head h2 { margin: 0; font-size: 1.2rem; font-weight: 800; }
.kt-last { margin: 0; font-size: 0.82rem; color: #55625b; }
.kt-x {
  flex: none;
  width: 44px;
  height: 44px;
  border: 1px solid #e4ded1;
  border-radius: 12px;
  background: #fff;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.kt-seg {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border-radius: 14px;
  background: #efe9dc;
}
.kt-seg button {
  min-height: 40px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  color: #55625b;
  cursor: pointer;
}
.kt-seg button[aria-pressed='true'] {
  background: #fff;
  color: #0a5c40;
  font-weight: 800;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.kt-grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.kt-surah { display: grid; gap: 10px; }
.kt-field { display: grid; gap: 6px; font-size: 0.82rem; font-weight: 700; color: #33413a; }
.kt-input {
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
  padding: 0 12px;
  border-radius: 13px;
  border: 1.5px solid #e4ded1;
  background: #fff;
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  color: #0b3b2a;
}
.kt-input:focus { outline: none; border-color: #0a5c40; box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.15); }
.kt-stepper {
  display: flex;
  align-items: center;
  min-height: 48px;
  border-radius: 13px;
  border: 1.5px solid #0a5c40;
  background: #fff;
  padding: 2px;
}
.kt-stepper button {
  flex: none;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 11px;
  background: #f2efe6;
  font: inherit;
  font-size: 1.3rem;
  font-weight: 700;
  color: #0a5c40;
  cursor: pointer;
}
.kt-stepper button:disabled { opacity: 0.4; cursor: default; }
.kt-stepper input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  text-align: center;
  font: inherit;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0b3b2a;
  -moz-appearance: textfield;
}
.kt-stepper input::-webkit-outer-spin-button,
.kt-stepper input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.kt-stepper input:focus { outline: none; }
.kt-hint { margin: -6px 0 0; font-size: 0.8rem; color: #55625b; }
.kt-block { display: grid; gap: 8px; }
.kt-label { font-size: 0.84rem; font-weight: 800; color: #33413a; }
.kt-label em { font-style: normal; font-weight: 500; color: #55625b; }
.kt-score-row { display: flex; gap: 10px; align-items: stretch; }
.kt-score { width: 96px; flex: none; text-align: center; font-size: 1.4rem; font-weight: 800; }
.kt-grade {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-radius: 13px;
  min-height: 48px;
}
.kt-grade strong { font-size: 1.6rem; }
.kt-grade small { font-size: 0.74rem; font-weight: 600; line-height: 1.3; }
.kt-grade.is-A { background: #dff1e7; color: #0a5c40; }
.kt-grade.is-B { background: #fdf0d9; color: #7c3a06; }
.kt-grade.is-C { background: #fde4e1; color: #a3261b; }
.kt-grade.is-none { background: #f2efe6; color: #55625b; }
.kt-quick {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
}
.kt-quick button,
.kt-chips button {
  min-height: 40px;
  border-radius: 11px;
  border: 1px solid #e4ded1;
  background: #fff;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  color: #33413a;
  cursor: pointer;
}
.kt-quick button[aria-pressed='true'],
.kt-chips button[aria-pressed='true'] {
  border: 1.5px solid #0a5c40;
  background: #dff1e7;
  color: #0a5c40;
}
.kt-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.kt-chips button { padding: 0 12px; border-radius: 999px; font-weight: 600; }
.kt-notes { min-height: 64px; padding: 10px 12px; font-weight: 500; font-size: 0.92rem; resize: vertical; }
.kt-result {
  display: grid;
  gap: 2px;
  min-height: 60px;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1.5px solid #e4ded1;
  background: #fff;
  text-align: left;
  font: inherit;
  color: #33413a;
  cursor: pointer;
}
.kt-result strong { font-size: 0.98rem; }
.kt-result small { font-size: 0.78rem; color: #55625b; }
.kt-result.is-lanjut[aria-pressed='true'] { border: 2px solid #0a5c40; background: #0a5c40; color: #fff; }
.kt-result.is-lanjut[aria-pressed='true'] small { color: #cfe3d8; }
.kt-result.is-ulang[aria-pressed='true'] { border: 2px solid #a3261b; background: #a3261b; color: #fff; }
.kt-result.is-ulang[aria-pressed='true'] small { color: #fde4e1; }
.kt-err { margin: 0; font-size: 0.84rem; font-weight: 700; color: #a3261b; }
.kt-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #e4ded1;
}
.kt-paraf { flex: 1; font-size: 0.74rem; color: #55625b; line-height: 1.35; }
.kt-paraf strong { font-size: 0.86rem; color: #0b3b2a; }
.kt-primary {
  min-height: 50px;
  padding: 0 22px;
  border: 0;
  border-radius: 15px;
  background: #0a5c40;
  font: inherit;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
}
.kt-foot > .kt-primary:only-child { flex: 1; }
.kt-primary:disabled { opacity: 0.55; cursor: default; }
.kt-delete {
  min-height: 50px;
  padding: 0 14px;
  border-radius: 15px;
  border: 1.5px solid rgba(163, 38, 27, 0.35);
  background: #fff;
  font: inherit;
  font-weight: 700;
  color: #a3261b;
  cursor: pointer;
}
.kt-link {
  justify-self: center;
  min-height: 40px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  color: #0a5c40;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
@keyframes kt-in {
  from { transform: translateY(18px); opacity: 0; }
  to { transform: none; opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .kt { animation: none; }
}
</style>
