<template>
  <!-- The bottom bar: a dark-green bar floating above the bottom edge. The ACTIVE tab is a pill with its icon and its name;
       the other tabs are icons only (their names are read aloud). Shared by the dashboard (admin, guru) and the wali
       portal, so they always look and behave the same. No measuring: the pill grows by itself (CSS only). -->
  <nav class="mc-nav" :class="{ 'is-hidden': typing, 'is-phone-only': phoneOnly, 'is-floating': floating }"
    :style="{ '--nav-max': `${maxWidth}px` }" :aria-label="ariaLabel">
    <div class="mc-nav-row">
      <template v-for="(item, i) in items" :key="item.key">
        <button v-if="item.button" :ref="(el) => setItemEl(i, el)" type="button" class="mc-nav-item" :class="{ 'is-open': i === activeIndex }" :aria-expanded="!!item.expanded" aria-haspopup="dialog" :aria-label="itemLabel(item)" @click="$emit('press', item, i)">
          <span class="mc-nav-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon"></svg>
            <span v-if="item.badge && i !== activeIndex" class="mc-badge">{{ item.badge > 9 ? '9+' : item.badge }}</span>
          </span>
          <span class="mc-nav-label" aria-hidden="true">{{ item.label }}</span>
          <span v-if="item.badge && i === activeIndex" class="mc-badge is-inline" aria-hidden="true">{{ item.badge > 9 ? '9+' : item.badge }}</span>
        </button>
        <router-link v-else :ref="(el) => setItemEl(i, el)" :to="item.to" class="mc-nav-item" :class="{ 'is-active': i === activeIndex }"
          :aria-label="itemLabel(item)" :aria-current="i === (currentIndex ?? activeIndex) ? 'page' : undefined">
          <span class="mc-nav-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon"></svg>
            <span v-if="item.badge && i !== activeIndex" class="mc-badge">{{ item.badge > 9 ? '9+' : item.badge }}</span>
          </span>
          <span class="mc-nav-label" aria-hidden="true">{{ item.label }}</span>
          <span v-if="item.badge && i === activeIndex" class="mc-badge is-inline" aria-hidden="true">{{ item.badge > 9 ? '9+' : item.badge }}</span>
        </router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
// items: [{ key, label, icon (svg inner markup), to? | button: true, badge?, badgeLabel?, expanded? }]
// activeIndex: the tab shown as the pill (-1: none, every tab is an icon); currentIndex: the tab of the page being shown (aria-current)
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  items: { type: Array, required: true },
  activeIndex: { type: Number, default: -1 },
  currentIndex: { type: Number, default: undefined },
  ariaLabel: { type: String, default: 'Menu utama' },
  phoneOnly: { type: Boolean, default: false },
  floating: { type: Boolean, default: false },
  maxWidth: { type: Number, default: 640 },
})
defineEmits(['press'])

// a tab whose name is not drawn (icon only) is still named: "Pendaftaran, 3 perlu diproses"
const itemLabel = (item) => (item.badge ? `${item.label}, ${item.badge} ${item.badgeLabel || 'baru'}` : item.label)

const itemEls = []
const setItemEl = (i, el) => {
  itemEls[i] = el ? el.$el || el : null
}

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
  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('focusout', onFocusOut)
})
onBeforeUnmount(() => {
  document.removeEventListener('focusin', onFocusIn)
  document.removeEventListener('focusout', onFocusOut)
})

defineExpose({ itemEl: (i) => itemEls[i] })
</script>

<style scoped>
/* the bar: a dark-green rounded bar floating 10px above the bottom edge (and above the phone's own gesture bar) */
.mc-nav {
  --nav-bar: 64px;
  --nav-gap: 10px; /* from the bottom edge; the sides keep 12px */
  display: block;
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(var(--nav-gap) + env(safe-area-inset-bottom, 0px));
  z-index: var(--z-fixed, 300);
  height: var(--nav-bar);
  max-width: var(--nav-max, 640px);
  margin: 0 auto;
  border-radius: 28px;
  background: linear-gradient(180deg, #06452f 0%, #03291d 100%);
  border: 1px solid rgba(167, 243, 208, 0.12);
  box-shadow: 0 16px 30px -12px rgba(2, 28, 19, 0.6), 0 3px 8px rgba(2, 28, 19, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.07);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.mc-nav.is-hidden {
  transform: translateY(calc(100% + 40px));
  opacity: 0;
  pointer-events: none;
}

.mc-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 8px;
}

.mc-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 1 auto;
  min-width: 44px; /* a tap target on a phone: 44px, whatever is drawn */
  height: 44px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: none;
  font: inherit;
  color: rgba(236, 253, 245, 0.66);
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.18s ease, background-color 0.22s ease, border-color 0.22s ease, padding 0.28s cubic-bezier(0.22, 1, 0.36, 1), transform 0.12s ease;
}

.mc-nav-item:active {
  transform: scale(0.94);
}

.mc-nav-icon {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
}

/* the active tab: a pill, the icon and its name (the name opens out) */
.mc-nav-item.is-active,
.mc-nav-item.is-open {
  padding: 0 14px 0 12px;
  border-color: rgba(110, 231, 183, 0.3);
  background: rgba(110, 231, 183, 0.17);
  color: #d1fae5;
}

.mc-nav-item.is-active .mc-nav-icon svg,
.mc-nav-item.is-open .mc-nav-icon svg {
  stroke-width: 2.3;
}

.mc-nav-label {
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
  transition: max-width 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease 0.04s, margin 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

/* the name takes the room there is (the other tabs keep 44px): up to 10em, then it is cut with an ellipsis */
.mc-nav-item.is-active .mc-nav-label,
.mc-nav-item.is-open .mc-nav-label {
  max-width: 10em;
  margin-left: 7px;
  opacity: 1;
}

/* what waits: on the icon's corner while the tab is an icon, after the name while it is the pill */
.mc-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #d97706;
  color: #fff;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 0 0 2px #04321f;
}

.mc-badge.is-inline {
  position: static;
  flex: none;
  margin-left: 6px;
  box-shadow: none;
}

.mc-nav-item:focus-visible {
  outline: 2px solid #fcd34d;
  outline-offset: 2px;
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

/* narrow phones: a little tighter, so five tabs and the pill (with "Pendaftaran") still fit */
@media (max-width: 360px) {
  .mc-nav-row {
    padding: 0 4px;
  }

  .mc-nav-item {
    padding: 0 8px;
  }

  .mc-nav-item.is-active,
  .mc-nav-item.is-open {
    padding: 0 10px 0 8px;
  }

  .mc-nav-item.is-active .mc-nav-label,
  .mc-nav-item.is-open .mc-nav-label {
    margin-left: 5px;
    font-size: 0.74rem;
    letter-spacing: 0;
  }
}

@media (max-width: 340px) {
  .mc-nav {
    left: 8px;
    right: 8px;
  }

  .mc-nav-item.is-active .mc-nav-label,
  .mc-nav-item.is-open .mc-nav-label {
    margin-left: 4px;
    font-size: 0.72rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mc-nav,
  .mc-nav-item,
  .mc-nav-label {
    transition: none;
  }
}
</style>
