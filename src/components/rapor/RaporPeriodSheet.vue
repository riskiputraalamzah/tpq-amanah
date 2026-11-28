<template>
  <!-- Admin: a new rapor period, or its settings (dates, place, the free rows 6 and 7 of B. Penunjang) -->
  <Teleport to="body">
    <div v-if="open" class="rpx-overlay" @click.self="close" @keydown.esc="close">
      <form class="rpx-sheet" role="dialog" aria-modal="true" aria-labelledby="rps-title" @submit.prevent="save">
        <div class="rps-head">
          <h2 id="rps-title">{{ period ? 'Ubah periode rapor' : 'Buka periode rapor' }}</h2>
          <button type="button" class="rps-x" aria-label="Tutup" @click="close">✕</button>
        </div>
        <label class="rpx-field">
          Nama periode
          <input v-model="form.name" class="rpx-input" required maxlength="80" placeholder="Contoh: Rapor 2025/2026" />
        </label>
        <label class="rpx-field">
          Tahun ajaran <small>(tertulis di rapor)</small>
          <input v-model="form.tahun" class="rpx-input" maxlength="20" placeholder="2025/2026" />
        </label>
        <div class="rpx-grid2">
          <label class="rpx-field">
            Kehadiran dari
            <input v-model="form.attendanceFrom" type="date" class="rpx-input" required />
          </label>
          <label class="rpx-field">
            sampai
            <input v-model="form.attendanceTo" type="date" class="rpx-input" required />
          </label>
        </div>
        <p class="rps-help">Izin, sakit, dan alpha dihitung otomatis dari Absen Santri di rentang ini (guru tetap bisa membetulkan).</p>
        <div class="rpx-grid2">
          <label class="rpx-field">
            Guru mengisi sampai
            <input v-model="form.fillUntil" type="date" class="rpx-input" />
          </label>
          <label class="rpx-field">
            Tanggal rapor
            <input v-model="form.raporDate" type="date" class="rpx-input" />
          </label>
        </div>
        <label class="rpx-field">
          Tempat <small>(di atas tanda tangan)</small>
          <input v-model="form.place" class="rpx-input" maxlength="40" placeholder="Sidoarjo" />
        </label>
        <div class="rpx-grid2">
          <label class="rpx-field">
            Penunjang no. 6 <small>(opsional)</small>
            <input v-model="form.extra6" class="rpx-input" maxlength="40" placeholder="Contoh: Praktik Wudhu" />
          </label>
          <label class="rpx-field">
            Penunjang no. 7 <small>(opsional)</small>
            <input v-model="form.extra7" class="rpx-input" maxlength="40" placeholder="Kosongkan bila tidak ada" />
          </label>
        </div>
        <label v-if="!period" class="rps-open">
          <input v-model="openNow" type="checkbox" />
          <span>Langsung buka untuk guru <small>(bisa juga nanti)</small></span>
        </label>
        <p v-if="error" class="rpx-note is-danger" role="alert">{{ error }}</p>
        <div class="rps-foot">
          <button v-if="period && !period.hasRapor" type="button" class="rpx-btn is-danger" :disabled="busy" @click="remove">Hapus</button>
          <button type="submit" class="rpx-btn is-primary" :disabled="busy">{{ busy ? 'Menyimpan…' : period ? 'Simpan' : 'Buat periode' }}</button>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '@/services/api'
import { useDialog } from '@/composables/useDialog'

const props = defineProps({
  open: { type: Boolean, default: false },
  period: { type: Object, default: null },
})
const emit = defineEmits(['close', 'saved', 'deleted'])
const { ask } = useDialog()
const blank = () => ({ name: '', tahun: '', attendanceFrom: '', attendanceTo: '', fillUntil: '', raporDate: '', place: 'Sidoarjo', extra6: '', extra7: '' })
const form = ref(blank())
const openNow = ref(true)
const busy = ref(false)
const error = ref('')

watch(
  () => props.open,
  (v) => {
    if (!v) return
    error.value = ''
    const p = props.period
    form.value = p
      ? { name: p.name, tahun: p.tahun, attendanceFrom: p.attendanceFrom, attendanceTo: p.attendanceTo, fillUntil: p.fillUntil, raporDate: p.raporDate, place: p.place, extra6: p.extraSubjects?.[0] || '', extra7: p.extraSubjects?.[1] || '' }
      : blank()
  },
)
function close() {
  if (!busy.value) emit('close')
}
async function save() {
  busy.value = true
  error.value = ''
  const f = form.value
  const body = { name: f.name, tahun: f.tahun, attendanceFrom: f.attendanceFrom, attendanceTo: f.attendanceTo, fillUntil: f.fillUntil, raporDate: f.raporDate, place: f.place, extraSubjects: [f.extra6, f.extra7] }
  try {
    const { data } = props.period ? await api.put(`/rapor/periods/${props.period.id}`, body) : await api.post('/rapor/periods', { ...body, status: openNow.value ? 'open' : 'draft' })
    emit('saved', data)
    emit('close')
  } catch (err) {
    error.value = err?.response?.data?.error || 'Belum tersimpan. Coba lagi.'
  } finally {
    busy.value = false
  }
}
async function remove() {
  const ok = await ask({ title: 'Hapus periode ini?', message: 'Periode yang belum berisi rapor bisa dihapus.', confirmText: 'Hapus', tone: 'danger' })
  if (!ok) return
  busy.value = true
  try {
    await api.delete(`/rapor/periods/${props.period.id}`)
    emit('deleted')
    emit('close')
  } catch (err) {
    error.value = err?.response?.data?.error || 'Belum terhapus.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.rps-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.rps-x {
  width: 44px;
  height: 44px;
  border: 1px solid #e4ded1;
  border-radius: 12px;
  background: #fff;
  font: inherit;
  cursor: pointer;
}
.rps-help { margin: -6px 0 0; font-size: 0.8rem; color: var(--muted); line-height: 1.45; }
.rps-open { display: flex; align-items: center; gap: 10px; min-height: 44px; font-size: 0.9rem; font-weight: 700; }
.rps-open input { width: 20px; height: 20px; accent-color: var(--emerald); }
.rps-open small { font-weight: 500; color: var(--muted); }
.rps-foot { display: flex; gap: 10px; justify-content: flex-end; padding-top: 4px; }
.rps-foot .is-primary { flex: 1; }
@media (min-width: 560px) {
  .rps-foot .is-primary { flex: none; min-width: 180px; }
}
</style>
