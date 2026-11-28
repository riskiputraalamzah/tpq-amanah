<template>
  <!-- Draw with a finger (or mouse); the strokes become one SVG path { d, w, h } (v-model). -->
  <div class="sp" :class="{ 'is-empty': !strokes.length }">
    <canvas
      ref="canvas"
      class="sp-canvas"
      aria-label="Kotak tanda tangan. Coret dengan jari."
      @pointerdown="start"
      @pointermove="move"
      @pointerup="end"
      @pointercancel="end"
      @pointerleave="end"
    ></canvas>
    <span class="sp-line" aria-hidden="true"></span>
    <span v-if="!strokes.length" class="sp-hint" aria-hidden="true">Coret tanda tangan di sini</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits(['update:modelValue'])
defineProps({ modelValue: { type: Object, default: null } })

const canvas = ref(null)
const strokes = ref([]) // [[{x, y}]]
let drawing = null
let size = { w: 340, h: 170 }
let ctx = null

function setup() {
  const el = canvas.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  size = { w: Math.max(120, Math.round(rect.width)), h: Math.max(80, Math.round(rect.height)) }
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  el.width = size.w * dpr
  el.height = size.h * dpr
  ctx = el.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 2.6
  ctx.strokeStyle = '#1f3b8f'
  redraw()
}
function redraw() {
  if (!ctx) return
  ctx.clearRect(0, 0, size.w, size.h)
  for (const s of strokes.value) {
    if (!s.length) continue
    ctx.beginPath()
    ctx.moveTo(s[0].x, s[0].y)
    for (const p of s.slice(1)) ctx.lineTo(p.x, p.y)
    if (s.length === 1) ctx.lineTo(s[0].x + 0.1, s[0].y)
    ctx.stroke()
  }
}
const point = (e) => {
  const r = canvas.value.getBoundingClientRect()
  return { x: Math.round((e.clientX - r.left) * 10) / 10, y: Math.round((e.clientY - r.top) * 10) / 10 }
}
// The box may change size after it appears (the page slides in, a sidebar folds, the phone turns): measure again
// whenever it differs, so a stroke always lands where the finger is
function ensureSize() {
  const r = canvas.value?.getBoundingClientRect()
  if (!r || !r.width) return
  if (!ctx || Math.round(r.width) !== size.w || Math.round(r.height) !== size.h) setup()
}
function start(e) {
  e.preventDefault()
  ensureSize()
  canvas.value.setPointerCapture?.(e.pointerId)
  drawing = [point(e)]
  strokes.value = [...strokes.value, drawing]
}
function move(e) {
  if (!drawing) return
  e.preventDefault()
  const p = point(e)
  const last = drawing[drawing.length - 1]
  if (Math.hypot(p.x - last.x, p.y - last.y) < 1.5) return
  drawing.push(p)
  ctx.beginPath()
  ctx.moveTo(last.x, last.y)
  ctx.lineTo(p.x, p.y)
  ctx.stroke()
}
function end() {
  if (!drawing) return
  drawing = null
  strokes.value = [...strokes.value]
  emit('update:modelValue', toPath())
}
// "M10 20 L11 22 L…" per stroke; a dot becomes a tiny line
function toPath() {
  const parts = []
  for (const s of strokes.value) {
    if (!s.length) continue
    const pts = s.length === 1 ? [s[0], { x: s[0].x + 0.5, y: s[0].y }] : s
    parts.push(`M${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L${p.x} ${p.y}`).join(' '))
  }
  return parts.length ? { d: parts.join(' '), w: size.w, h: size.h } : null
}
function clear() {
  strokes.value = []
  redraw()
  emit('update:modelValue', null)
}
defineExpose({ clear })

let observer = null
onMounted(() => {
  setup()
  window.addEventListener('resize', ensureSize)
  if (typeof ResizeObserver !== 'undefined' && canvas.value) {
    observer = new ResizeObserver(() => ensureSize())
    observer.observe(canvas.value)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', ensureSize)
  observer?.disconnect()
})
</script>

<style scoped>
.sp {
  position: relative;
  height: 190px;
  border-radius: 18px;
  border: 2px dashed #c9c0ad;
  background: #fff;
  overflow: hidden;
}
.sp-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: crosshair;
}
.sp-line {
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 38px;
  border-bottom: 1px solid #e4ded1;
  pointer-events: none;
}
.sp-hint {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  text-align: center;
  font-size: 0.88rem;
  color: #8a948e;
  pointer-events: none;
}
</style>
