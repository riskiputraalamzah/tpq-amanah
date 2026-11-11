<template>
  <div class="kbm-picker">
    <div class="picker-head">
      <div class="month-nav">
        <button type="button" class="nav-btn" :disabled="!view.prevPeriod || loading" aria-label="Bulan sebelumnya"
          @click="emit('change-month', view.prevPeriod)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <strong class="month-title" aria-live="polite">{{ view.title }}</strong>
        <button type="button" class="nav-btn" :disabled="!view.nextPeriod || loading" aria-label="Bulan berikutnya"
          @click="emit('change-month', view.nextPeriod)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
      <span v-if="!view.canFill" class="picker-closed">
        Bulan ini sudah di luar periode aktif dan Anda tidak termasuk LPJ yang memintanya, jadi belum bisa diisi.
        KBM yang sudah ada tetap bisa dibuka.
      </span>
      <span v-else-if="!slotId || !classId" class="picker-hint">Pilih sesi &amp; jilid dulu agar tanggal yang sudah diisi terkunci.</span>
    </div>

    <div class="weekdays" aria-hidden="true">
      <span v-for="d in ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']" :key="d">{{ d }}</span>
    </div>

    <div ref="gridEl" class="grid" :class="{ 'is-loading': loading }" :aria-busy="loading" role="group" :aria-label="`Pilih tanggal KBM, ${view.title}`" @keydown="onKeydown">
      <span v-for="n in view.leadingBlanks" :key="'blank-' + n" class="blank" aria-hidden="true"></span>
      <button v-for="(cell, index) in view.cells" :key="cell.date" type="button" class="cell"
        :class="[`is-${cell.state}`, { 'is-today': cell.isToday, 'is-selected': cell.isSelected }]"
        :data-index="index" :tabindex="index === focusIndex ? 0 : -1"
        :aria-disabled="!(cell.selectable || cell.openable)" :aria-pressed="cell.isSelected"
        :aria-label="cell.ariaLabel" :title="cell.label" @click="choose(cell)">
        <span class="num">{{ cell.dayNumber }}</span>
        <span v-if="cell.state === 'filled'" class="mark mark-filled" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
        <span v-else-if="cell.state === 'needs'" class="mark mark-needs" aria-hidden="true"></span>
        <span v-else-if="cell.state === 'partial'" class="mark mark-partial" aria-hidden="true">{{ cell.count }}</span>
        <span v-else-if="cell.state === 'no-att'" class="mark mark-noatt" aria-hidden="true"></span>
      </button>
    </div>

    <ul class="legend" aria-label="Keterangan">
      <li><span class="mark mark-filled"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12" /></svg></span>Sudah diisi (ketuk untuk membuka)</li>
      <li><span class="mark mark-needs"></span>Hadir, KBM belum diisi</li>
      <li><span class="mark mark-partial">1</span>Ada KBM jilid/sesi lain</li>
      <li><span class="mark mark-noatt"></span>Belum absen</li>
      <li><span class="swatch-off"></span>Libur / izin / belum bisa diisi</li>
    </ul>

    <div v-if="view.needsDates.length" class="needs-box">
      <span class="needs-title">{{ view.needsDates.length }} hari hadir belum ada KBM:</span>
      <div class="needs-chips">
        <button v-for="date in view.needsDates" :key="date" type="button" class="chip" :class="{ active: date === modelValue }"
          @click="emit('update:modelValue', date)">
          {{ shortDate(date) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { buildCalendar } from '@/utils/kbmCalendar'

const props = defineProps({
  calendar: { type: Object, default: null },
  modelValue: { type: String, default: '' },
  slotId: { type: String, default: '' },
  classId: { type: [String, Number], default: '' },
  minDate: { type: String, default: '' },
  maxDate: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'open-session', 'change-month'])

const gridEl = ref(null)
const view = computed(() =>
  buildCalendar(props.calendar, {
    slotId: props.slotId,
    classId: props.classId ? String(props.classId) : '',
    selectedDate: props.modelValue,
    minDate: props.minDate,
    maxDate: props.maxDate,
  }),
)

// Roving focus: one cell in the tab order, arrow keys move between days.
const focusIndex = ref(0)
watch(
  view,
  (v) => {
    const selected = v.cells.findIndex((c) => c.isSelected)
    const today = v.cells.findIndex((c) => c.isToday)
    focusIndex.value = selected >= 0 ? selected : today >= 0 ? today : 0
  },
  { immediate: true },
)

const onKeydown = async (event) => {
  const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
  if (!(event.key in moves)) return
  event.preventDefault()
  const next = Math.min(Math.max(focusIndex.value + moves[event.key], 0), view.value.cells.length - 1)
  focusIndex.value = next
  await nextTick()
  gridEl.value?.querySelector(`[data-index="${next}"]`)?.focus()
}

const choose = (cell) => {
  if (cell.openable) emit('open-session', cell.sessionId)
  else if (cell.selectable) emit('update:modelValue', cell.date)
}

const shortDate = (date) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.kbm-picker {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg, 12px);
  padding: 12px;
  background: #fff;
}

.picker-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.month-title {
  color: var(--primary-dark);
  font-size: 0.95rem;
  text-align: center;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  background: #fff;
  color: var(--primary-dark);
  cursor: pointer;
}

.nav-btn:hover:not(:disabled) {
  border-color: var(--primary);
}

.nav-btn:focus-visible {
  outline: 3px solid var(--primary-300, #81c784);
  outline-offset: 1px;
}

.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.picker-closed {
  font-size: 0.78rem;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 6px 8px;
}

.grid.is-loading {
  opacity: 0.5;
  pointer-events: none;
}

.picker-hint {
  font-size: 0.78rem;
  color: #b45309;
}

.weekdays,
.grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.weekdays span {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--gray-500);
  padding-bottom: 4px;
}

.cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--gray-50, #f8fafc);
  color: var(--gray-800);
  font-weight: 600;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.cell:hover:not([aria-disabled='true']) {
  border-color: var(--primary);
}

.cell:focus-visible {
  outline: 3px solid var(--primary-300, #81c784);
  outline-offset: 1px;
}

.cell.is-off,
.cell.is-absent {
  background: transparent;
  color: var(--gray-300);
  cursor: not-allowed;
  text-decoration: line-through;
  text-decoration-color: var(--gray-300);
}

.cell.is-absent {
  text-decoration: none;
  color: var(--gray-400);
}

.cell.is-filled {
  background: rgba(46, 125, 50, 0.1);
  color: #2e7d32;
}

.cell.is-needs {
  background: #fff7ed;
  color: #9a3412;
}

.cell.is-today {
  border-color: var(--primary);
}

.cell.is-selected {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.mark {
  position: absolute;
  top: 2px;
  right: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.legend .mark {
  position: static;
  flex: none;
}

.mark-filled {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #2e7d32;
  color: #fff;
}

.mark-needs {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ea580c;
}

.mark-partial {
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 7px;
  background: #0277bd;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
}

.mark-noatt {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid var(--gray-400);
}

.cell.is-selected .mark-needs,
.cell.is-selected .mark-noatt {
  background: #fff;
  border-color: #fff;
}

.legend {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  font-size: 0.72rem;
  color: var(--gray-600);
}

.legend li {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.swatch-off {
  width: 12px;
  height: 2px;
  background: var(--gray-300);
}

.needs-box {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.needs-title {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #9a3412;
  margin-bottom: 6px;
}

.needs-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  min-height: 36px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #fdba74;
  background: #fff;
  color: #9a3412;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.chip.active {
  background: #ea580c;
  border-color: #ea580c;
  color: #fff;
}
</style>
