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
      <span v-if="lockedReason" class="picker-closed" role="status">🔒 {{ lockedReason }}</span>
      <span v-else-if="!view.canFill" class="picker-closed">
        Bulan ini sudah di luar periode aktif dan Anda tidak termasuk LPJ yang memintanya, jadi belum bisa diisi.
        KBM yang sudah ada tetap bisa dibuka.
      </span>
    </div>

    <div class="weekdays" aria-hidden="true">
      <span v-for="d in ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']" :key="d">{{ d }}</span>
    </div>

    <div ref="gridEl" class="grid" :class="{ 'is-loading': loading }" :aria-busy="loading" role="group" :aria-label="`Kalender KBM, ${view.title}`" @keydown="onKeydown">
      <span v-for="n in view.leadingBlanks" :key="'blank-' + n" class="blank" aria-hidden="true"></span>
      <button v-for="(cell, index) in view.cells" :key="cell.date" type="button" class="cell"
        :class="[`is-${cell.state}`, { 'is-today': cell.isToday, 'is-selected': cell.isSelected }]"
        :data-index="index" :tabindex="index === focusIndex ? 0 : -1"
        :aria-disabled="!(cell.selectable || cell.openable)" :aria-pressed="cell.isSelected"
        :aria-label="cell.ariaLabel" :title="cell.label" @click="choose(cell)">
        <span class="num">{{ cell.dayNumber }}</span>
        <span v-if="cell.state === 'done'" class="mark mark-done" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
        <span v-else-if="cell.state === 'incomplete'" class="mark mark-incomplete" aria-hidden="true">!</span>
        <span v-else-if="cell.state === 'needs'" class="mark mark-needs" aria-hidden="true"></span>
        <span v-else-if="cell.state === 'no-att'" class="mark mark-noatt" aria-hidden="true"></span>
        <!-- more than one KBM that day (e.g. two jilid): how many -->
        <span v-if="cell.count > 1" class="count" aria-hidden="true">{{ cell.count }} KBM</span>
      </button>
    </div>

    <ul class="legend" aria-label="Keterangan">
      <li><span class="mark mark-done"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12" /></svg></span>KBM lengkap</li>
      <li><span class="mark mark-incomplete">!</span>Absen santri / jurnal belum</li>
      <li><span class="mark mark-needs"></span>Hadir, KBM belum diisi</li>
      <li><span class="mark mark-noatt"></span>Belum absen</li>
      <li><span class="swatch-off"></span>Libur / izin</li>
    </ul>
    <p class="picker-tip">Ketuk tanggal untuk melihat atau mengisi KBM hari itu.</p>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { buildCalendar } from '@/utils/kbmCalendar'

const props = defineProps({
  calendar: { type: Object, default: null },
  // the date whose details are open (highlighted)
  modelValue: { type: String, default: '' },
  minDate: { type: String, default: '' },
  maxDate: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  // Set when the month's monthly LPJ is submitted/approved: nothing new can be filled.
  lockedReason: { type: String, default: '' },
})
// pick: a tappable day ({ date, state, openable, selectable }); change-month: the month arrows
const emit = defineEmits(['pick', 'change-month'])

const gridEl = ref(null)
const view = computed(() =>
  buildCalendar(props.calendar, {
    selectedDate: props.modelValue,
    locked: !!props.lockedReason,
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
  if (cell.openable || cell.selectable) emit('pick', cell)
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
  min-height: 48px;
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

.cell.is-done {
  background: #e3f1ea;
  color: #0a5c40;
}

.cell.is-incomplete {
  background: #fef3c7;
  color: #7c3a0d;
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

.mark-done {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #0a5c40;
  color: #fff;
}

.mark-incomplete {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #b45309;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1;
}

.mark-needs {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ea580c;
}


.mark-noatt {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid var(--gray-400);
}

.count {
  position: absolute;
  bottom: 2px;
  left: 0;
  right: 0;
  font-size: 0.55rem;
  font-weight: 700;
  line-height: 1;
  opacity: 0.85;
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

.picker-tip {
  margin: 8px 0 0;
  font-size: 0.75rem;
  color: var(--gray-500);
}
</style>
