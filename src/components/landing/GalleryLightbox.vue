<template>
  <Teleport to="body">
    <div
      v-if="open && activePhoto"
      role="dialog"
      aria-modal="true"
      :aria-label="title || 'Pratinjau foto dokumentasi'"
      data-lenis-prevent
      class="fixed inset-0 z-[80] flex flex-col bg-slate-950/95 backdrop-blur-sm text-white select-none"
      @click.self="close"
    >
      <!-- Top Bar (clears mobile notch / Dynamic Island safely) -->
      <div
        class="flex items-start justify-between gap-3 px-4 pb-2.5 border-b border-white/10 shrink-0"
        style="padding-top: max(14px, env(safe-area-inset-top))"
      >
        <div class="min-w-0">
          <p v-if="subtitle" class="text-xs font-semibold truncate text-amber-300">
            {{ subtitle }}
          </p>
          <h3 class="mt-0.5 text-sm sm:text-lg font-bold leading-snug text-white line-clamp-1">
            {{ title || 'Dokumentasi Foto' }}
          </h3>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span
            v-if="photos.length > 1"
            class="hidden px-2.5 py-1 text-xs font-bold rounded-full sm:inline-flex tabular-nums bg-white/10 text-emerald-50"
          >
            {{ activeIndex + 1 }} / {{ photos.length }}
          </span>
          <button
            ref="closeBtnRef"
            type="button"
            aria-label="Tutup pratinjau foto"
            class="grid transition-colors rounded-full place-items-center w-11 h-11 bg-white/10 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            @click="close"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Zoomable & Pannable Photo Stage -->
      <div
        ref="stageRef"
        class="relative flex items-center justify-center flex-1 min-h-0 overflow-hidden"
        style="touch-action: none"
        @click.self="onStageBackdropClick"
        @wheel.prevent="onWheel"
        @mousedown="onMouseDown"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <!-- Desktop Prev Button -->
        <button
          v-if="photos.length > 1"
          type="button"
          aria-label="Foto sebelumnya"
          class="absolute z-20 hidden transition-colors rounded-full sm:grid place-items-center left-4 w-11 h-11 bg-slate-900/70 border border-white/15 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
          @click.stop="stepPhoto(-1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Loading Pill -->
        <span
          v-if="photoLoading"
          class="absolute z-10 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-slate-900/85 text-amber-200 border border-white/10 backdrop-blur-sm pointer-events-none"
          aria-live="polite"
        >
          Memuat foto HD…
        </span>

        <!-- Image Transform Layer -->
        <div
          class="flex items-center justify-center w-full h-full px-3 py-3 sm:px-16"
          :class="zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'"
          @dblclick.prevent="toggleDoubleTapZoom"
        >
          <img
            ref="imgRef"
            :key="activePhoto.id || activeIndex"
            :src="galleryPhotoSrc(activePhoto, hiRes ? { width: HIRES_WIDTH } : {})"
            :alt="`${title || 'Dokumentasi'} - foto ${activeIndex + 1}`"
            decoding="async"
            referrerpolicy="no-referrer"
            draggable="false"
            class="max-w-full max-h-[min(68dvh,680px)] sm:max-h-[min(74dvh,760px)] rounded-xl shadow-2xl object-contain"
            :class="[
              photoLoading ? 'opacity-40' : 'opacity-100',
              // will-change only while moving: at rest the browser redraws the photo at its zoomed size (sharp at 1000%)
              isInteracting ? 'transition-none will-change-transform' : 'transition-[transform,opacity] duration-200 ease-out',
            ]"
            :style="imgTransformStyle"
            @load="onImageLoaded"
            @error="photoLoading = false"
          />
        </div>

        <!-- Desktop Next Button -->
        <button
          v-if="photos.length > 1"
          type="button"
          aria-label="Foto berikutnya"
          class="absolute z-20 hidden transition-colors rounded-full sm:grid place-items-center right-4 w-11 h-11 bg-slate-900/70 border border-white/15 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
          @click.stop="stepPhoto(1)"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Dedicated Non-Overlapping Zoom Controls Bar (never covers photo on mobile or desktop) -->
      <div class="flex items-center justify-center px-4 py-2 shrink-0 bg-slate-950/90 border-t border-white/10">
        <div
          class="inline-flex items-center gap-1 p-1 border rounded-full bg-white/5 border-white/15"
          role="group"
          aria-label="Kontrol zoom foto"
          @click.stop
        >
          <button
            type="button"
            aria-label="Perkecil foto (Zoom Out)"
            :disabled="zoom <= MIN_ZOOM"
            class="grid transition-colors rounded-full place-items-center w-9 h-9 text-white hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
            @click="zoomOut"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path stroke-linecap="round" d="m20 20-3.5-3.5M8 11h6" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Reset ukuran foto ke 100%"
            :title="zoom > 1 ? 'Ketuk untuk kembali ke 100%' : 'Ketuk 2× atau cubit layar untuk perbesar'"
            class="min-w-[54px] h-9 px-2.5 rounded-full text-xs font-bold tabular-nums transition-colors"
            :class="zoom > 1 ? 'bg-amber-300 text-slate-950 hover:bg-amber-200' : 'text-emerald-50 hover:bg-white/10'"
            @click="resetZoom"
          >
            {{ Math.round(zoom * 100) }}%
          </button>

          <button
            type="button"
            aria-label="Perbesar foto (Zoom In)"
            :disabled="zoom >= MAX_ZOOM"
            class="grid transition-colors rounded-full place-items-center w-9 h-9 text-white hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
            @click="zoomIn"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path stroke-linecap="round" d="m20 20-3.5-3.5M11 8v6M8 11h6" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Bottom Caption & Thumbnail Strip (clears mobile home indicator) -->
      <div
        class="px-4 pt-2 bg-slate-950/95 shrink-0"
        style="padding-bottom: max(14px, env(safe-area-inset-bottom))"
      >
        <p
          v-if="caption"
          class="max-w-3xl mx-auto text-xs sm:text-sm leading-relaxed text-center text-emerald-50/90 line-clamp-2"
          :class="photos.length > 1 ? 'mb-2.5' : ''"
        >
          {{ caption }}
        </p>

        <div
          v-if="photos.length > 1"
          class="flex items-center justify-center max-w-4xl gap-2 mx-auto"
        >
          <button
            type="button"
            aria-label="Foto sebelumnya"
            class="grid shrink-0 rounded-full sm:hidden place-items-center w-9 h-9 bg-white/10 active:bg-white/25"
            @click="stepPhoto(-1)"
          >
            &lsaquo;
          </button>

          <div
            ref="thumbStripRef"
            class="flex items-center max-w-full gap-2 py-0.5 overflow-x-auto scroll-smooth"
            style="scrollbar-width: none"
          >
            <button
              v-for="(p, idx) in photos"
              :key="p.id || idx"
              type="button"
              :data-thumb-idx="idx"
              :aria-label="`Pilih foto ${idx + 1}`"
              class="w-12 h-9 overflow-hidden rounded-lg border-2 shrink-0 transition-opacity bg-slate-900"
              :class="idx === activeIndex ? 'border-amber-300 opacity-100' : 'border-transparent opacity-55 hover:opacity-90'"
              @click="selectPhoto(idx)"
            >
              <img
                :src="galleryPhotoThumbSrc(p, 240)"
                alt=""
                width="48"
                height="36"
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
                class="object-cover w-full h-full"
              />
            </button>
          </div>

          <button
            type="button"
            aria-label="Foto berikutnya"
            class="grid shrink-0 rounded-full sm:hidden place-items-center w-9 h-9 bg-white/10 active:bg-white/25"
            @click="stepPhoto(1)"
          >
            &rsaquo;
          </button>

          <span class="ml-1 text-xs font-semibold tabular-nums text-emerald-100/80 shrink-0 sm:hidden">
            {{ activeIndex + 1 }}/{{ photos.length }}
          </span>
        </div>

        <p v-else class="text-[11px] text-center text-emerald-100/60">
          Ketuk 2× atau cubit layar untuk memperbesar foto
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { galleryPhotoSrc, galleryPhotoThumbSrc } from '@/utils/galleryMedia'

const MIN_ZOOM = 1
const MAX_ZOOM = 10 // 1000%: very close looks at faces and names on banners
const ZOOM_FACTOR = 1.5 // the +/- buttons: 100 → 150 → 225 → 338 → 506 → 759 → 1000%
const DOUBLE_TAP_ZOOM = 2.5
// from this zoom a Google Drive photo is loaded again at a larger size, so deep zoom stays sharp
const HIRES_FROM = 2.5
const HIRES_WIDTH = 3200

const props = defineProps({
  open: { type: Boolean, default: false },
  photos: { type: Array, default: () => [] },
  initialIndex: { type: Number, default: 0 },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  caption: { type: String, default: '' },
})

const emit = defineEmits(['close', 'change'])

const activeIndex = ref(0)
const photoLoading = ref(false)
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const isInteracting = ref(false)
const isDragging = ref(false)
const hiRes = ref(false) // this photo zoomed deep: the larger Google Drive size is shown

const closeBtnRef = ref(null)
const stageRef = ref(null)
const imgRef = ref(null)
const thumbStripRef = ref(null)

let savedBody = null
let previouslyFocused = null
const preloadedUrls = new Set()

const activePhoto = computed(() => props.photos[activeIndex.value] || null)

const imgTransformStyle = computed(() => ({
  transform: `translate3d(${panX.value}px, ${panY.value}px, 0) scale(${zoom.value})`,
  transformOrigin: 'center center',
}))

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val))
}

function clampPan(nx, ny, scale = zoom.value) {
  if (scale <= 1.01) return { x: 0, y: 0 }
  const stageRect = stageRef.value?.getBoundingClientRect()
  const baseW = imgRef.value?.offsetWidth || stageRect?.width || 600
  const baseH = imgRef.value?.offsetHeight || stageRect?.height || 450
  const maxX = Math.max(40, ((scale - 1) * baseW) / 2 + 24)
  const maxY = Math.max(40, ((scale - 1) * baseH) / 2 + 24)
  return {
    x: clamp(nx, -maxX, maxX),
    y: clamp(ny, -maxY, maxY),
  }
}

// where the photo's middle sits on screen when not moved (it is centred in its box)
function restingCenter() {
  const box = imgRef.value?.parentElement?.getBoundingClientRect()
  return box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : null
}

// focal: a screen point ({ x, y }) that stays under the finger / cursor while zooming; none = the middle
function setZoom(nextScale, focal = null) {
  const prev = zoom.value
  const s = clamp(Number(nextScale.toFixed(3)), MIN_ZOOM, MAX_ZOOM)
  let nx = panX.value
  let ny = panY.value
  const c = focal ? restingCenter() : null
  if (c && prev > 0) {
    const fx = focal.x - c.x
    const fy = focal.y - c.y
    nx = fx - (fx - panX.value) * (s / prev)
    ny = fy - (fy - panY.value) * (s / prev)
  }
  zoom.value = s
  if (s >= HIRES_FROM) hiRes.value = true
  const clamped = clampPan(nx, ny, s)
  panX.value = clamped.x
  panY.value = clamped.y
}

function zoomIn() {
  isInteracting.value = false
  setZoom(zoom.value * ZOOM_FACTOR)
}

function zoomOut() {
  isInteracting.value = false
  const next = zoom.value / ZOOM_FACTOR
  if (next < 1.05) resetZoom()
  else setZoom(next)
}

function resetZoom() {
  isInteracting.value = false
  zoom.value = MIN_ZOOM
  panX.value = 0
  panY.value = 0
}

// double tap / double click: zoom in on that spot, or back to 100% when already zoomed
function toggleDoubleTapZoom(point = null) {
  isInteracting.value = false
  if (zoom.value > 1.05) resetZoom()
  else setZoom(DOUBLE_TAP_ZOOM, point)
}

function preloadNextPhoto() {
  if (props.photos.length <= 1 || typeof Image === 'undefined') return
  const nextIdx = (activeIndex.value + 1) % props.photos.length
  const url = galleryPhotoSrc(props.photos[nextIdx])
  if (!url || preloadedUrls.has(url)) return
  preloadedUrls.add(url)
  const img = new Image()
  img.referrerPolicy = 'no-referrer'
  img.src = url
}

function onImageLoaded() {
  photoLoading.value = false
  preloadNextPhoto()
}

function selectPhoto(idx) {
  if (idx < 0 || idx >= props.photos.length || idx === activeIndex.value) return
  resetZoom()
  photoLoading.value = true
  activeIndex.value = idx
  emit('change', idx)
}

function stepPhoto(delta) {
  const total = props.photos.length
  if (total <= 1) return
  resetZoom()
  photoLoading.value = true
  activeIndex.value = (activeIndex.value + delta + total) % total
  emit('change', activeIndex.value)
}

function lockScroll() {
  if (typeof document === 'undefined' || savedBody) return
  const scrollbar = window.innerWidth - document.documentElement.clientWidth
  savedBody = {
    overflow: document.body.style.overflow,
    paddingRight: document.body.style.paddingRight,
  }
  document.body.style.overflow = 'hidden'
  if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
}

function unlockScroll() {
  if (!savedBody || typeof document === 'undefined') return
  document.body.style.overflow = savedBody.overflow
  document.body.style.paddingRight = savedBody.paddingRight
  savedBody = null
}

function close() {
  emit('close')
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    stepPhoto(1)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    stepPhoto(-1)
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault()
    zoomIn()
  } else if (e.key === '-' || e.key === '_') {
    e.preventDefault()
    zoomOut()
  } else if (e.key === '0') {
    e.preventDefault()
    resetZoom()
  }
}

/* ===== Mouse Wheel & Click-Drag Pan (Desktop) ===== */
let dragStartX = 0
let dragStartY = 0
let dragOriginX = 0
let dragOriginY = 0
let didDrag = false

// a mouse notch is about ×1.2; a laptop touchpad pinch (small deltas) zooms smoothly; always toward the cursor
function onWheel(e) {
  isInteracting.value = false
  const delta = clamp(Number(e.deltaY) || 0, -300, 300)
  const next = zoom.value * Math.exp(-delta * 0.0018)
  if (next < 1.02) resetZoom()
  else setZoom(next, { x: e.clientX, y: e.clientY })
}

function onMouseDown(e) {
  if (e.target?.closest?.('button, a')) return
  if (e.button !== 0 || zoom.value <= 1) return
  e.preventDefault()
  isInteracting.value = true
  isDragging.value = true
  didDrag = false
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragOriginX = panX.value
  dragOriginY = panY.value
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true
  const clamped = clampPan(dragOriginX + dx, dragOriginY + dy)
  panX.value = clamped.x
  panY.value = clamped.y
}

function onMouseUp() {
  isDragging.value = false
  isInteracting.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

function onStageBackdropClick() {
  if (didDrag) {
    didDrag = false
    return
  }
  if (zoom.value > 1.05) resetZoom()
  else close()
}

/* ===== Touch Pinch-to-Zoom, Pan, Double-Tap & Swipe (Mobile) ===== */
let touchMode = 'none' // 'swipe' | 'pan' | 'pinch'
let touchStartX = 0
let touchStartY = 0
let touchPanOriginX = 0
let touchPanOriginY = 0
let pinchStartDist = 0
let pinchStartZoom = 1
let lastTapAt = 0
let lastTapX = 0
let lastTapY = 0
let touchMoved = false

function touchDistance(t1, t2) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
}

function onTouchStart(e) {
  if (e.target?.closest?.('button, a')) return
  if (e.touches.length === 2) {
    touchMode = 'pinch'
    isInteracting.value = true
    pinchStartDist = touchDistance(e.touches[0], e.touches[1]) || 1
    pinchStartZoom = zoom.value
    touchMoved = true
    return
  }

  if (e.touches.length === 1) {
    const t = e.touches[0]
    touchStartX = t.clientX
    touchStartY = t.clientY
    touchPanOriginX = panX.value
    touchPanOriginY = panY.value
    touchMoved = false
    touchMode = zoom.value > 1.02 ? 'pan' : 'swipe'
    isInteracting.value = touchMode === 'pan'
  }
}

function onTouchMove(e) {
  if (touchMode === 'pinch' && e.touches.length === 2) {
    e.preventDefault()
    const [a, b] = [e.touches[0], e.touches[1]]
    const dist = touchDistance(a, b)
    // zoom toward the spot between the two fingers
    setZoom(pinchStartZoom * (dist / pinchStartDist), { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 })
    return
  }

  if (e.touches.length === 1) {
    const t = e.touches[0]
    const dx = t.clientX - touchStartX
    const dy = t.clientY - touchStartY
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) touchMoved = true

    if (touchMode === 'pan' && zoom.value > 1.02) {
      e.preventDefault()
      const clamped = clampPan(touchPanOriginX + dx, touchPanOriginY + dy)
      panX.value = clamped.x
      panY.value = clamped.y
    }
  }
}

function onTouchEnd(e) {
  if (e.target?.closest?.('button, a')) {
    touchMode = 'none'
    isInteracting.value = false
    return
  }
  if (touchMode === 'pinch') {
    if (e.touches.length < 2) {
      isInteracting.value = false
      touchMode = 'none'
      if (zoom.value < 1.06) resetZoom()
    }
    return
  }

  const changed = e.changedTouches?.[0]
  if (touchMode === 'swipe' && changed) {
    const dx = changed.clientX - touchStartX
    const dy = changed.clientY - touchStartY
    if (Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      stepPhoto(dx < 0 ? 1 : -1)
      touchMode = 'none'
      isInteracting.value = false
      return
    }
  }

  // Double-tap on photo toggles zoom 1x <-> 2.5x, on the spot tapped
  if (!touchMoved && changed && e.touches.length === 0) {
    const now = Date.now()
    const nearPrev = Math.hypot(changed.clientX - lastTapX, changed.clientY - lastTapY) < 30
    if (now - lastTapAt < 300 && nearPrev) {
      lastTapAt = 0
      toggleDoubleTapZoom({ x: changed.clientX, y: changed.clientY })
    } else {
      lastTapAt = now
      lastTapX = changed.clientX
      lastTapY = changed.clientY
    }
  }

  touchMode = 'none'
  isInteracting.value = false
}

// another photo: back to the normal size until it is zoomed deep
watch(activeIndex, () => {
  hiRes.value = false
})

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused = typeof document !== 'undefined' ? document.activeElement : null
      const safeIdx = clamp(props.initialIndex || 0, 0, Math.max(0, props.photos.length - 1))
      activeIndex.value = safeIdx
      resetZoom()
      hiRes.value = false
      photoLoading.value = !!props.photos.length
      lockScroll()
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      closeBtnRef.value?.focus?.()
      const thumb = thumbStripRef.value?.querySelector(`[data-thumb-idx="${safeIdx}"]`)
      thumb?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'instant' })
    } else {
      document.removeEventListener('keydown', onKeydown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      unlockScroll()
      previouslyFocused?.focus?.()
      previouslyFocused = null
    }
  },
  { immediate: true },
)

watch(activeIndex, async (idx) => {
  if (!props.open) return
  await nextTick()
  const btn = thumbStripRef.value?.querySelector(`[data-thumb-idx="${idx}"]`)
  btn?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  unlockScroll()
})
</script>
