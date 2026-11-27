<template>
  <!-- Press and hold to confirm (PJ Absen): a deliberate act, like a signature, never a stray tap. The fill sweeps across
       while held; letting go early rolls it back. Keyboard: hold Space or Enter. -->
  <button
    ref="btn"
    type="button"
    class="hc"
    :class="[`is-${tone}`, { 'is-holding': holding, 'is-done': done, 'is-busy': busy }]"
    :disabled="disabled || busy"
    :aria-describedby="hintId"
    @pointerdown="start"
    @pointerup="stop"
    @pointercancel="stop"
    @pointerleave="leave"
    @keydown="onKeyDown"
    @keyup="onKeyUp"
    @blur="stop"
    @contextmenu.prevent
  >
    <span class="hc-fill" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true"></span>
    <span class="hc-body">
      <span class="hc-ring" aria-hidden="true">
        <svg viewBox="0 0 36 36" width="34" height="34">
          <circle class="hc-ring-track" cx="18" cy="18" r="15" />
          <circle class="hc-ring-bar" cx="18" cy="18" r="15" :style="{ strokeDashoffset: ringOffset }" />
          <path v-if="done || busy" class="hc-check" d="M11.5 18.5l4.5 4.5 8.5-9" />
          <path v-else class="hc-hand" d="M18 11v9m0 0l-3-3m3 3l3-3" />
        </svg>
      </span>
      <span class="hc-text">
        <strong class="hc-label">{{ busy ? busyLabel : holding ? holdingLabel : label }}</strong>
        <span v-if="sub && !busy" class="hc-sub">{{ sub }}</span>
      </span>
    </span>
    <span :id="hintId" class="sr-only">Tekan dan tahan {{ seconds }} detik untuk mengonfirmasi.</span>
  </button>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  holdingLabel: { type: String, default: 'Tahan terus…' },
  busyLabel: { type: String, default: 'Menyimpan…' },
  sub: { type: String, default: 'Tekan dan tahan' },
  duration: { type: Number, default: 1500 },
  disabled: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  tone: { type: String, default: 'emerald' }, // emerald | gold
})
const emit = defineEmits(['confirm'])

const uid = Math.random().toString(36).slice(2, 8)
const hintId = `hc-hint-${uid}`
const seconds = computed(() => String(Math.round(props.duration / 100) / 10).replace('.', ','))
const btn = ref(null)
const progress = ref(0)
const holding = ref(false)
const done = ref(false)
const CIRC = 2 * Math.PI * 15
const ringOffset = computed(() => CIRC * (1 - progress.value))

let raf = 0
let startedAt = 0
let back = 0
let keyHeld = false

const buzz = (pattern) => {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* some browsers refuse: fine */
  }
}

function tick(t) {
  const p = Math.min(1, (t - startedAt) / props.duration)
  progress.value = p
  if (p >= 1) {
    holding.value = false
    done.value = true
    buzz([30, 40, 60])
    emit('confirm')
    // ready again if the parent keeps the button (a refusal): the check stays a moment, then resets
    setTimeout(() => {
      if (!props.busy) reset()
    }, 1200)
    return
  }
  raf = requestAnimationFrame(tick)
}

function begin() {
  if (props.disabled || props.busy || holding.value || done.value) return
  cancelAnimationFrame(back)
  holding.value = true
  startedAt = performance.now() - progress.value * props.duration
  buzz(12)
  raf = requestAnimationFrame(tick)
}

function rollBack() {
  const from = progress.value
  const t0 = performance.now()
  const step = (t) => {
    const p = Math.max(0, from - ((t - t0) / 250) * from)
    progress.value = p
    if (p > 0) back = requestAnimationFrame(step)
  }
  back = requestAnimationFrame(step)
}

function stop() {
  keyHeld = false
  if (!holding.value) return
  holding.value = false
  cancelAnimationFrame(raf)
  if (!done.value) rollBack()
}

function reset() {
  done.value = false
  progress.value = 0
}

function start(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  try {
    btn.value?.setPointerCapture?.(e.pointerId)
  } catch {
    /* not supported */
  }
  begin()
}
// with pointer capture the finger may wander off the button; without it, leaving stops
function leave(e) {
  if (!btn.value?.hasPointerCapture?.(e.pointerId)) stop()
}
function onKeyDown(e) {
  if (e.key !== ' ' && e.key !== 'Enter') return
  e.preventDefault()
  if (e.repeat || keyHeld) return
  keyHeld = true
  begin()
}
function onKeyUp(e) {
  if (e.key !== ' ' && e.key !== 'Enter') return
  e.preventDefault()
  stop()
}

defineExpose({ reset })
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  cancelAnimationFrame(back)
})
</script>

<style scoped>
.hc {
  --hc-bg: #0a5c40;
  --hc-fill: #053d2c;
  --hc-ink: #fff;
  --hc-accent: #fcd34d;
  position: relative;
  display: block;
  width: 100%;
  min-height: 64px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 18px;
  background: var(--hc-bg);
  color: var(--hc-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  box-shadow: 0 10px 24px -14px rgba(5, 61, 44, 0.7);
  transition: transform 160ms ease, box-shadow 160ms ease;
}
.hc.is-gold {
  --hc-bg: #b45309;
  --hc-fill: #7c3a06;
  --hc-accent: #fff7e6;
}
.hc:focus-visible {
  outline: 3px solid #f59e0b;
  outline-offset: 3px;
}
.hc.is-holding {
  transform: scale(0.985);
  box-shadow: 0 6px 16px -12px rgba(5, 61, 44, 0.8);
}
.hc:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.hc.is-busy {
  cursor: progress;
  opacity: 1;
}
.hc-fill {
  position: absolute;
  inset: 0;
  background: var(--hc-fill);
  transform-origin: left center;
  will-change: transform;
}
.hc-body {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}
.hc-ring {
  flex: none;
  display: grid;
  place-items: center;
}
.hc-ring svg {
  display: block;
  overflow: visible;
}
.hc-ring-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.25);
  stroke-width: 3;
}
.hc-ring-bar {
  fill: none;
  stroke: var(--hc-accent);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 94.25;
  transform: rotate(-90deg);
  transform-origin: 18px 18px;
}
.hc-hand,
.hc-check {
  fill: none;
  stroke: var(--hc-ink);
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.hc.is-holding .hc-hand {
  animation: hc-nudge 600ms ease-in-out infinite;
}
.hc-check {
  stroke: var(--hc-accent);
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: hc-draw 360ms ease-out forwards;
}
.hc-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.hc-label {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.25;
}
.hc-sub {
  font-size: 0.78rem;
  font-weight: 600;
  opacity: 0.85;
}
.hc.is-done {
  animation: hc-pop 420ms ease-out;
}
@keyframes hc-draw {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes hc-nudge {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(2px);
  }
}
@keyframes hc-pop {
  0% {
    transform: scale(0.985);
  }
  55% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .hc,
  .hc.is-holding,
  .hc.is-done {
    transform: none;
    animation: none;
    transition: none;
  }
  .hc.is-holding .hc-hand {
    animation: none;
  }
  .hc-check {
    animation: none;
    stroke-dashoffset: 0;
  }
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
