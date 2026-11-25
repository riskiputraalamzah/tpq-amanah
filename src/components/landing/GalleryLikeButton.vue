<template>
  <button
    type="button"
    :aria-pressed="liked"
    :aria-label="liked ? `Batal sukai ${moment?.title || 'momen ini'}` : `Sukai ${moment?.title || 'momen ini'}`"
    :disabled="pending"
    class="glb-btn relative inline-flex items-center justify-center font-bold select-none transition-all duration-300 active:scale-[0.94] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:opacity-80"
    :class="[variantClass, stateClass, { 'is-liking': action === 'like', 'is-unliking': action === 'unlike' }]"
    @click="onTap"
  >
    <!-- Glossy Shimmer Sweep Layer (clipped neatly to button radius) -->
    <span class="glb-sheen-clip" :class="radiusClass" aria-hidden="true">
      <span v-if="action === 'like'" :key="`sheen-${animKey}`" class="glb-sheen"></span>
    </span>

    <!-- Floating "+1" + Rising Mini Hearts (on hero & fab when liked) -->
    <span
      v-if="action === 'like' && variant !== 'card'"
      :key="`float-${animKey}`"
      class="glb-float-stage"
      aria-hidden="true"
    >
      <span class="glb-float-plus">+1</span>
      <svg class="glb-float-heart is-left" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      <svg class="glb-float-heart is-right" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </span>

    <!-- Heart Icon + Radial Particle Burst + Shockwave + Unlike Split-Puff -->
    <span class="relative grid place-items-center shrink-0">
      <!-- Like Shockwave Rings & 8-Way Confetti Sparkles -->
      <span v-if="action === 'like'" :key="`burst-${animKey}`" class="glb-burst" aria-hidden="true">
        <span class="glb-ring is-outer"></span>
        <span class="glb-ring is-inner"></span>
        <span
          v-for="p in SPARKLES"
          :key="p.id"
          class="glb-spark"
          :class="p.shape"
          :style="{
            '--tx': p.tx,
            '--ty': p.ty,
            '--c': p.color,
            '--d': p.delay,
          }"
        ></span>
      </span>

      <!-- Unlike Subtle Split-Puff Droplets -->
      <span v-if="action === 'unlike'" :key="`unburst-${animKey}`" class="glb-unburst" aria-hidden="true">
        <span class="glb-drop is-l"></span>
        <span class="glb-drop is-r"></span>
        <span class="glb-unring"></span>
      </span>

      <svg
        class="relative z-10 shrink-0 glb-heart"
        :class="[
          heartSizeClass,
          heartColorClass,
          action === 'like' ? 'is-pop' : action === 'unlike' ? 'is-unpop' : (!liked && variant === 'fab' ? 'is-nudge' : ''),
        ]"
        :fill="liked ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="2.2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        />
      </svg>
    </span>

    <!-- Label (for hero & fab) -->
    <span v-if="variant !== 'card'" class="relative z-10 leading-none">
      {{ liked ? 'Disukai' : 'Suka' }}
    </span>

    <!-- Rolling Odometer Count Badge -->
    <span
      v-if="showCount"
      class="relative z-10 inline-flex items-center justify-center overflow-hidden font-extrabold tabular-nums"
      :class="badgeClass"
    >
      <Transition :name="countTransitionName" mode="out-in">
        <span :key="count" class="block leading-none">{{ count }}</span>
      </Transition>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useGalleryLikes } from '@/composables/useGalleryLikes'

const SPARKLES = [
  { id: 1, tx: '0px', ty: '-30px', color: '#fcd34d', shape: 'is-diamond', delay: '0ms' },
  { id: 2, tx: '23px', ty: '-22px', color: '#fb7185', shape: 'is-dot', delay: '25ms' },
  { id: 3, tx: '31px', ty: '0px', color: '#fde68a', shape: 'is-diamond', delay: '15ms' },
  { id: 4, tx: '21px', ty: '21px', color: '#34d399', shape: 'is-dot', delay: '35ms' },
  { id: 5, tx: '0px', ty: '27px', color: '#fb7185', shape: 'is-diamond', delay: '10ms' },
  { id: 6, tx: '-22px', ty: '21px', color: '#fcd34d', shape: 'is-dot', delay: '30ms' },
  { id: 7, tx: '-31px', ty: '0px', color: '#f43f5e', shape: 'is-diamond', delay: '20ms' },
  { id: 8, tx: '-23px', ty: '-22px', color: '#ffffff', shape: 'is-dot', delay: '5ms' },
]

const props = defineProps({
  moment: { type: Object, required: true },
  variant: {
    type: String,
    default: 'hero', // 'hero' | 'fab' | 'card'
    validator: (v) => ['hero', 'fab', 'card'].includes(v),
  },
  stopPropagation: { type: Boolean, default: false },
})

const emit = defineEmits(['result'])

const { isLiked, likeCountOf, isPending, lastActionOf, animKeyOf, toggleLike } = useGalleryLikes()

const liked = computed(() => isLiked(props.moment))
const count = computed(() => likeCountOf(props.moment))
const pending = computed(() => isPending(props.moment))
const action = computed(() => lastActionOf(props.moment))
const animKey = computed(() => animKeyOf(props.moment))
const showCount = computed(() => props.variant === 'card' || count.value > 0)

const countTransitionName = computed(() =>
  action.value === 'unlike' ? 'glb-num-down' : 'glb-num-up',
)

const radiusClass = computed(() => (props.variant === 'hero' ? 'rounded-xl' : 'rounded-full'))

const variantClass = computed(() => {
  if (props.variant === 'fab') {
    return 'gap-2 min-h-[48px] pl-4 pr-3.5 rounded-full text-sm border backdrop-blur-md'
  }
  if (props.variant === 'card') {
    return 'gap-1.5 min-h-[34px] px-2.5 rounded-full text-xs border shrink-0'
  }
  return 'gap-2 min-h-[46px] px-4 sm:px-5 rounded-xl text-sm border'
})

const stateClass = computed(() => {
  if (props.variant === 'fab') {
    return liked.value
      ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 border-rose-200/70 text-white shadow-[0_14px_30px_-8px_rgba(225,29,72,0.65)]'
      : 'bg-gradient-to-br from-[#064532] to-[#03291d] border-amber-300/60 text-white shadow-[0_14px_30px_-8px_rgba(3,41,29,0.72)]'
  }
  if (props.variant === 'card') {
    return liked.value
      ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-[0_4px_12px_-6px_rgba(225,29,72,0.45)]'
      : 'bg-emerald-950/[0.03] border-amber-700/15 text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'
  }
  return liked.value
    ? 'bg-gradient-to-r from-rose-500/30 via-rose-500/25 to-pink-500/30 border-rose-300/75 text-rose-50 hover:from-rose-500/40 hover:to-pink-500/40 shadow-[0_8px_22px_-10px_rgba(244,63,94,0.65)]'
    : 'bg-white/10 border-amber-200/35 text-white hover:bg-white/20'
})

const heartSizeClass = computed(() => {
  if (props.variant === 'fab') return 'w-5 h-5'
  if (props.variant === 'card') return 'w-3.5 h-3.5'
  return 'w-[18px] h-[18px]'
})

const heartColorClass = computed(() => {
  if (props.variant === 'fab') return liked.value ? 'text-white' : 'text-rose-400'
  if (props.variant === 'card') return liked.value ? 'text-rose-500' : 'text-current'
  return liked.value ? 'text-rose-400' : 'text-amber-200'
})

const badgeClass = computed(() => {
  if (props.variant === 'card') return 'text-xs'
  if (props.variant === 'fab') {
    return liked.value
      ? 'min-w-[24px] h-6 px-1.5 text-xs rounded-full bg-white/20 text-white'
      : 'min-w-[24px] h-6 px-1.5 text-xs rounded-full bg-amber-300/20 text-amber-200'
  }
  return liked.value
    ? 'min-w-[22px] h-5 px-1.5 text-xs rounded-full bg-rose-400/30 text-rose-50'
    : 'min-w-[22px] h-5 px-1.5 text-xs rounded-full bg-white/15 text-amber-200'
})

async function onTap(event) {
  if (props.stopPropagation) {
    event.preventDefault()
    event.stopPropagation()
  }
  const res = await toggleLike(props.moment)
  emit('result', res)
}
</script>

<style scoped>
.glb-btn {
  overflow: visible;
  isolation: isolate;
}

.glb-sheen-clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.glb-sheen {
  position: absolute;
  inset: -20% auto -20% -60%;
  width: 55%;
  background: linear-gradient(105deg, transparent 0%, rgba(255, 255, 255, 0.42) 50%, transparent 100%);
  transform: skewX(-18deg);
  animation: glb-sheen-sweep 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.glb-burst,
.glb-unburst {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  z-index: 5;
}

.glb-ring {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 9999px;
  pointer-events: none;
}

.glb-ring.is-outer {
  border: 2px solid #fcd34d;
  animation: glb-ring-out 0.56s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.glb-ring.is-inner {
  border: 2px solid #fb7185;
  animation: glb-ring-out 0.44s cubic-bezier(0.16, 1, 0.3, 1) 0.06s forwards;
}

.glb-spark {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--c, #fcd34d);
  box-shadow: 0 0 8px var(--c, #fcd34d);
  opacity: 0;
  animation: glb-spark-fly 0.68s cubic-bezier(0.12, 0.88, 0.28, 1) var(--d, 0ms) forwards;
}

.glb-spark.is-dot {
  border-radius: 9999px;
}

.glb-spark.is-diamond {
  border-radius: 1px;
  transform: rotate(45deg);
}

/* Floating "+1" and twin mini hearts */
.glb-float-stage {
  position: absolute;
  left: 50%;
  top: -4px;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 30;
}

.glb-float-plus {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, 0);
  padding: 2px 7px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #fb7185, #f43f5e);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: 0 6px 14px -4px rgba(244, 63, 94, 0.65);
  animation: glb-float-up 0.72s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.glb-float-heart {
  position: absolute;
  top: 2px;
  width: 11px;
  height: 11px;
  color: #fda4af;
  filter: drop-shadow(0 2px 4px rgba(225, 29, 72, 0.45));
}

.glb-float-heart.is-left {
  left: -18px;
  color: #fcd34d;
  animation: glb-float-heart-l 0.74s cubic-bezier(0.16, 1, 0.3, 1) 0.04s forwards;
}

.glb-float-heart.is-right {
  left: 12px;
  animation: glb-float-heart-r 0.78s cubic-bezier(0.16, 1, 0.3, 1) 0.08s forwards;
}

/* Unlike split droplets + soft deflate ring */
.glb-unring {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  border: 1.5px dashed rgba(255, 255, 255, 0.55);
  animation: glb-unring-fade 0.42s ease-out forwards;
}

.glb-drop {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background: rgba(253, 164, 175, 0.85);
}

.glb-drop.is-l {
  animation: glb-drop-left 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.glb-drop.is-r {
  animation: glb-drop-right 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* Heart elastic pop (Like) & expressive shake-deflate (Unlike) */
@media (prefers-reduced-motion: no-preference) {
  .glb-btn.is-liking {
    animation: glb-pill-bounce 0.42s cubic-bezier(0.22, 1.35, 0.36, 1);
  }

  .glb-btn.is-unliking {
    animation: glb-pill-unbounce 0.38s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }

  .glb-heart.is-pop {
    animation: glb-heart-spring 0.56s cubic-bezier(0.22, 1.45, 0.36, 1);
  }

  .glb-heart.is-unpop {
    animation: glb-heart-wobble 0.46s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }

  .glb-heart.is-nudge {
    animation: glb-heartbeat-nudge 1.9s ease-in-out 0.35s 2;
  }

  /* Odometer number roll transitions */
  .glb-num-up-enter-active,
  .glb-num-up-leave-active,
  .glb-num-down-enter-active,
  .glb-num-down-leave-active {
    transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
  }

  .glb-num-up-enter-from {
    opacity: 0;
    transform: translateY(10px) scale(0.85);
  }
  .glb-num-up-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.85);
  }

  .glb-num-down-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.85);
  }
  .glb-num-down-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.85);
  }
}

@media (prefers-reduced-motion: reduce) {
  .glb-sheen,
  .glb-burst,
  .glb-unburst,
  .glb-float-stage {
    display: none;
  }
}

@keyframes glb-pill-bounce {
  0% { transform: scale(1); }
  28% { transform: scale(0.93); }
  62% { transform: scale(1.06); }
  100% { transform: scale(1); }
}

@keyframes glb-pill-unbounce {
  0% { transform: scale(1) translateX(0); }
  22% { transform: scale(0.95) translateX(-3px); }
  48% { transform: scale(0.97) translateX(3px); }
  74% { transform: scale(0.99) translateX(-1.5px); }
  100% { transform: scale(1) translateX(0); }
}

@keyframes glb-heart-spring {
  0% { transform: scale(1) rotate(0deg); }
  18% { transform: scale(0.65) rotate(-12deg); }
  48% { transform: scale(1.48) rotate(10deg); }
  72% { transform: scale(0.9) rotate(-4deg); }
  88% { transform: scale(1.08) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes glb-heart-wobble {
  0% { transform: scale(1) rotate(0deg); }
  22% { transform: scale(1.1) rotate(-16deg); }
  48% { transform: scale(0.76) rotate(14deg); }
  74% { transform: scale(0.92) rotate(-6deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes glb-heartbeat-nudge {
  0%, 100% { transform: scale(1); }
  18% { transform: scale(1.26); }
  34% { transform: scale(0.95); }
  50% { transform: scale(1.18); }
  68% { transform: scale(1); }
}

@keyframes glb-ring-out {
  0% { opacity: 0.95; transform: scale(0.45); }
  100% { opacity: 0; transform: scale(2.65); }
}

@keyframes glb-spark-fly {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.2) rotate(0deg);
  }
  20% {
    opacity: 1;
    transform: translate(calc(var(--tx) * 0.45), calc(var(--ty) * 0.45)) scale(1.15) rotate(45deg);
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) scale(0.15) rotate(110deg);
  }
}

@keyframes glb-sheen-sweep {
  from { left: -65%; opacity: 0.9; }
  to { left: 135%; opacity: 0; }
}

@keyframes glb-float-up {
  0% { opacity: 0; transform: translate(-50%, 6px) scale(0.6); }
  24% { opacity: 1; transform: translate(-50%, -14px) scale(1.08); }
  100% { opacity: 0; transform: translate(-50%, -36px) scale(0.9); }
}

@keyframes glb-float-heart-l {
  0% { opacity: 0; transform: translate(0, 6px) scale(0.4) rotate(-14deg); }
  30% { opacity: 0.95; transform: translate(-10px, -14px) scale(1) rotate(-22deg); }
  100% { opacity: 0; transform: translate(-18px, -34px) scale(0.5) rotate(-32deg); }
}

@keyframes glb-float-heart-r {
  0% { opacity: 0; transform: translate(0, 6px) scale(0.4) rotate(12deg); }
  30% { opacity: 0.95; transform: translate(10px, -16px) scale(1) rotate(22deg); }
  100% { opacity: 0; transform: translate(18px, -36px) scale(0.5) rotate(32deg); }
}

@keyframes glb-unring-fade {
  0% { opacity: 0.85; transform: scale(1.3); }
  100% { opacity: 0; transform: scale(0.45); }
}

@keyframes glb-drop-left {
  0% { opacity: 0.95; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(-15px, 14px) scale(0.3); }
}

@keyframes glb-drop-right {
  0% { opacity: 0.95; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(15px, 14px) scale(0.3); }
}
</style>
