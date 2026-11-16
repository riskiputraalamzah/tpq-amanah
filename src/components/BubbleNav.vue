<template>
  <!-- A bottom bar: rounded top corners, a round hole under the ACTIVE tab and a dark-green bubble sitting in it. Both slide
       to the tab you choose (--cx is the centre of the active tab, measured here). Shared by the dashboard (admin, guru)
       and the wali portal, so they always look and behave the same. -->
  <nav ref="navEl" class="mc-nav" :class="{ 'is-hidden': typing, 'is-ready': navReady, 'has-active': activeIndex >= 0, 'is-phone-only': phoneOnly, 'is-floating': floating }"
    :style="{ '--cx': `${cx}px`, '--cols': items.length, '--nav-max': `${maxWidth}px` }" :aria-label="ariaLabel">
    <span class="mc-nav-bg" aria-hidden="true"></span>
    <span class="mc-bubble" aria-hidden="true">
      <Transition name="mc-pop" mode="out-in">
        <span :key="activeIndex" class="mc-bubble-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" v-html="activeItem?.icon || ''"></svg>
        </span>
      </Transition>
      <span v-if="activeBadge" class="mc-badge">{{ activeBadge > 9 ? '9+' : activeBadge }}</span>
    </span>

    <div class="mc-nav-row">
      <template v-for="(item, i) in items" :key="item.key">
        <button v-if="item.button" :ref="(el) => setItemEl(i, el)" type="button" class="mc-nav-item" :class="{ 'is-open': i === activeIndex }" :aria-expanded="!!item.expanded" aria-haspopup="dialog" @click="$emit('press', item, i)">
          <span class="mc-nav-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon"></svg>
            <span v-if="item.badge && i !== activeIndex" class="mc-badge">{{ item.badge > 9 ? '9+' : item.badge }}</span>
          </span>
          <span class="mc-nav-label">{{ item.label }}</span>
          <span v-if="item.badge" class="mc-sr">, {{ item.badge }} {{ item.badgeLabel }}</span>
        </button>
        <router-link v-else :ref="(el) => setItemEl(i, el)" :to="item.to" class="mc-nav-item" :class="{ 'is-active': i === activeIndex }"
          :aria-current="i === (currentIndex ?? activeIndex) ? 'page' : undefined">
          <span class="mc-nav-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon"></svg>
            <span v-if="item.badge && i !== activeIndex" class="mc-badge">{{ item.badge > 9 ? '9+' : item.badge }}</span>
          </span>
          <span class="mc-nav-label">{{ item.label }}</span>
          <span v-if="item.badge" class="mc-sr">, {{ item.badge }} {{ item.badgeLabel }}</span>
        </router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
// items: [{ key, label, icon (svg inner markup), to? | button: true, badge?, badgeLabel?, expanded? }]
// activeIndex: where the bubble sits (-1: nowhere); currentIndex: the tab of the page being shown (aria-current)
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  activeIndex: { type: Number, default: -1 },
  currentIndex: { type: Number, default: undefined },
  ariaLabel: { type: String, default: 'Menu utama' },
  phoneOnly: { type: Boolean, default: false },
  floating: { type: Boolean, default: false },
  maxWidth: { type: Number, default: 640 },
})
defineEmits(['press'])

const activeItem = computed(() => props.items[props.activeIndex] || null)
const activeBadge = computed(() => activeItem.value?.badge || 0)

// where the bubble and the hole are: the centre of the active tab, measured from the bar's left edge
const navEl = ref(null)
const itemEls = []
const cx = ref(-120)
const navReady = ref(false) // transitions start after the first measure, so the bubble does not slide in from nowhere
const setItemEl = (i, el) => {
  itemEls[i] = el ? el.$el || el : null
}
function measureNav() {
  const nav = navEl.value
  const el = itemEls[props.activeIndex]
  if (!nav) return
  // a page that is in no tab: the bubble and the hole close where they are (no sliding away)
  if (props.activeIndex < 0 || !el) return
  const n = nav.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  if (!n.width || !r.width) return // hidden (laptop width): measured again when it shows
  cx.value = Math.round(r.left - n.left + r.width / 2)
}
let observer = null
watch(
  () => [props.activeIndex, props.items.length],
  async () => {
    await nextTick()
    measureNav()
  },
)

// while typing the on-screen keyboard takes the room: the bar steps aside
const typing = ref(false)
const TEXT_FIELD = 'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=file]):not([type=range]), textarea, select'
const onFocusIn = (e) => {
  if (e.target?.matches?.(TEXT_FIELD)) typing.value = true
}
const onFocusOut = () => {
  setTimeout(() => {
    typing.value = !!document.activeElement?.matches?.(TEXT_FIELD)
  }, 60)
}

onMounted(() => {
  measureNav()
  requestAnimationFrame(() => {
    navReady.value = true
  })
  if (typeof ResizeObserver !== 'undefined' && navEl.value) {
    observer = new ResizeObserver(measureNav)
    observer.observe(navEl.value)
  }
  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('focusout', onFocusOut)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('focusin', onFocusIn)
  document.removeEventListener('focusout', onFocusOut)
})

defineExpose({ itemEl: (i) => itemEls[i] })
</script>

<style scoped>
/* the bar: rounded top corners, a round hole under the active tab and a dark-green bubble in it */
.mc-nav {
  --nav-bar: 64px;
  --hole: 0px; /* the hole's radius: it opens under the active tab and closes when no tab is active */
  display: block;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-fixed, 300);
  height: calc(var(--nav-bar) + env(safe-area-inset-bottom, 0px));
  max-width: var(--nav-max, 640px);
  margin: 0 auto;
  /* the shadow follows the bar's real shape, hole included (a box-shadow would be cut by the mask) */
  filter: drop-shadow(0 -3px 10px rgba(2, 28, 19, 0.14));
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s ease;
}

.mc-nav.is-ready {
  transition: transform 0.2s ease, --cx 0.42s cubic-bezier(0.22, 1, 0.36, 1), --hole 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.mc-nav.has-active {
  --hole: 36px;
}

.mc-nav.is-hidden {
  transform: translateY(calc(100% + 40px));
  pointer-events: none;
}

/* the bar: rounded top corners, and a round hole (radius 36) around the active tab's bubble */
.mc-nav-bg {
  position: absolute;
  inset: 0;
  background: #fbf9f3;
  border-radius: 24px 24px 0 0;
  -webkit-mask: radial-gradient(circle at var(--cx) 2px, transparent var(--hole), #000 calc(var(--hole) * 1.02));
  mask: radial-gradient(circle at var(--cx) 2px, transparent var(--hole), #000 calc(var(--hole) * 1.02));
}

/* the bubble: dark green with the brand's gold icon, centred in the hole (it rises 24px above the bar) */
.mc-bubble {
  position: absolute;
  top: -24px;
  left: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  color: #fcd34d;
  background: radial-gradient(circle at 30% 22%, #138a5f 0%, #065f46 52%, #03291d 100%);
  box-shadow: 0 10px 18px -8px rgba(3, 41, 29, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: translate3d(calc(var(--cx) - 26px), 0, 0);
  opacity: 0;
  scale: 0.4;
  pointer-events: none;
  transition: opacity 0.2s ease, scale 0.28s cubic-bezier(0.34, 1.4, 0.5, 1);
}

.mc-nav.has-active .mc-bubble {
  opacity: 1;
  scale: 1;
}

.mc-bubble-icon {
  display: grid;
  place-items: center;
}

.mc-pop-enter-active,
.mc-pop-leave-active {
  transition: opacity 0.12s ease, transform 0.16s ease;
}

.mc-pop-enter-from {
  opacity: 0;
  transform: scale(0.5) rotate(-12deg);
}

.mc-pop-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

.mc-nav-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--cols, 5), minmax(0, 1fr));
  height: var(--nav-bar);
}

.mc-nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 2px 0;
  border: 0;
  border-radius: 16px;
  background: none;
  font: inherit;
  color: #5b6b62;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s ease, transform 0.12s ease;
}

.mc-nav-item:active {
  transform: scale(0.94);
}

.mc-nav-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 30px;
  height: 28px;
}

/* the active tab's own icon is the one in the bubble: it steps out of the way */
.mc-nav-icon svg {
  transition: opacity 0.15s ease, transform 0.2s ease;
}

.mc-nav-item.is-active,
.mc-nav-item.is-open {
  color: #053d2c;
}

.mc-nav-item.is-active .mc-nav-icon svg,
.mc-nav-item.is-open .mc-nav-icon svg {
  opacity: 0;
  transform: translateY(8px) scale(0.5);
}

.mc-nav-label {
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
}

.mc-badge {
  position: absolute;
  top: -5px;
  right: -7px; /* on the icon's corner, not over it */
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #b45309;
  color: #fff;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 0 0 2px #fbf9f3;
}

.mc-bubble .mc-badge {
  top: -2px;
  right: -2px;
}


.mc-nav-item:focus-visible {
  outline: 2px solid #0a5c40;
  outline-offset: -4px;
}

.mc-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* the dashboard shows it on phones and tablets only (the laptop has the sidebar) */
.mc-nav.is-phone-only {
  display: none;
}

@media (max-width: 1023px) {
  .mc-nav.is-phone-only {
    display: block;
  }
}

/* a wide screen: the bar floats a little above the bottom edge, rounded all round (the wali portal) */
@media (min-width: 600px) {
  .mc-nav.is-floating {
    bottom: 12px;
    height: var(--nav-bar);
  }

  .mc-nav.is-floating .mc-nav-bg {
    border-radius: 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mc-nav,
  .mc-nav.is-ready,
  .mc-bubble,
  .mc-nav-item,
  .mc-nav-icon svg,
  .mc-pop-enter-active,
  .mc-pop-leave-active {
    transition: none;
  }
}
</style>

<style>
/* --cx (the centre of the active tab) and --hole (the hole's radius) are registered as lengths so they can animate: the
   hole and the bubble read them every frame, so they always move together. Without @property support they simply jump. */
@property --cx {
  syntax: '<length>';
  inherits: true;
  initial-value: 0px;
}

@property --hole {
  syntax: '<length>';
  inherits: true;
  initial-value: 0px;
}
</style>
