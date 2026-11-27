<template>
  <div class="wali-shell" :class="{ 'has-nav': showNav }">
    <header class="wali-bar">
      <div class="wali-bar-inner">
        <router-link to="/wali" class="wali-brand" aria-label="Beranda wali santri">
          <img :src="logoUrl" alt="" width="32" height="32" />
          <span>
            <strong>TPQ Amanah</strong>
            <small>Wali Santri</small>
          </span>
        </router-link>
        <!-- newer data on its way (the page already shows the last one): a quiet mark, never a blank page -->
        <span class="wali-sync" :class="{ 'is-on': syncShown }" role="status" aria-live="polite">
          <span class="wali-sync-dot" aria-hidden="true"></span>
          <span>{{ syncShown ? 'Memperbarui…' : '' }}</span>
        </span>
      </div>
    </header>

    <!-- pull down at the top of a page (phone): everything on screen is asked again -->
    <div
      class="wali-pull"
      :class="{ 'is-shown': pullShown > 0, 'is-ready': pull >= PULL_AT, 'is-busy': pullBusy }"
      :style="{ '--pull': `${pullShown}px`, '--pull-turn': `${pullShown * 4}deg` }"
      aria-hidden="true"
    >
      <span class="wali-pull-ring"></span>
    </div>

    <main class="wali-main" @touchstart.passive="pullStart" @touchmove.passive="pullMove" @touchend="pullEnd" @touchcancel="pullCancel">
      <router-view v-slot="{ Component, route: current }">
        <transition :name="pageTransition" @before-leave="onBeforeLeave">
          <component :is="Component" :key="current.path" />
        </transition>
      </router-view>
    </main>

    <!-- Bottom navigation: the four places a parent goes, within thumb reach (the same bar as the dashboard's: BubbleNav).
         Hidden on the forms, which have their own Kembali / Lanjut bar at the bottom. -->
    <BubbleNav v-if="showNav" :items="navItems" :active-index="activeIndex" floating :max-width="560" aria-label="Menu wali santri" />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import BubbleNav from '@/components/BubbleNav.vue'
import { useRoute } from 'vue-router'
import { useWaliAnnouncements } from '@/composables/useWaliAnnouncements'
import { usePageTransition } from '@/composables/usePageTransition'
import { useAuthStore } from '@/stores/auth'
import { setWaliOwner, peek, subscribe, refreshingCount, refreshAll } from '@/utils/waliCache'
import { WALI_KEYS } from '@/utils/waliData'
import '@/styles/landing.css'
import './wali.css'

const logoUrl = new URL('@/assets/logo-sm.png', import.meta.url).href
const route = useRoute()
const authStore = useAuthStore()

// the wali store belongs to this account (another parent on this phone never sees it); set before any page reads it
const uidOf = () => authStore.user?.id || authStore.user?.uid || ''
setWaliOwner(uidOf())
watch(uidOf, (uid) => {
  if (uid) setWaliOwner(uid)
})

const { unseen, refresh } = useWaliAnnouncements()
const { name: pageTransition, onBeforeLeave } = usePageTransition({ role: () => 'wali' })

// the children (from the last /wali/me): one child -> the Izin tab opens their form straight away (no picker to load)
const meData = ref(peek(WALI_KEYS.me)?.data || null)
const stopMe = subscribe(WALI_KEYS.me, (ev) => {
  if (ev.type === 'data') meData.value = ev.data
})
const izinTo = computed(() => {
  const list = meData.value?.santri || []
  return list.length === 1 ? `/wali/santri/${list[0].santriId}/izin` : '/wali/izin'
})

const NAV = [
  { key: 'home', to: '/wali', label: 'Beranda', icon: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />' },
  { key: 'izin', to: '/wali/izin', label: 'Izin', icon: '<rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m9.5 14.5 5 5m0-5-5 5" />' },
  { key: 'pengumuman', to: '/wali/pengumuman', label: 'Pengumuman', icon: '<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Z" /><path d="M16 9a3 3 0 0 1 0 6" /><path d="M19 6a7 7 0 0 1 0 12" />' },
  { key: 'akun', to: '/wali/akun', label: 'Akun', icon: '<circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />' },
]

// the tabs as the bar draws them: the unread-announcement count rides on "Pengumuman"
const navItems = computed(() =>
  NAV.map((item) => ({ ...item, ...(item.key === 'izin' ? { to: izinTo.value } : {}), badge: item.key === 'pengumuman' ? unseen.value : 0, badgeLabel: 'baru' })),
)

const showNav = computed(() => !route.meta.hideNav)
const active = computed(() => {
  const p = route.path
  if (p === '/wali/izin' || /^\/wali\/santri\/[^/]+\/izin$/.test(p)) return 'izin'
  if (p.startsWith('/wali/pengumuman') || (route.name === 'WaliKegiatanInfo' && route.query.from === 'pengumuman')) return 'pengumuman'
  if (p.startsWith('/wali/akun')) return 'akun'
  return 'home'
})

const activeIndex = computed(() => NAV.findIndex((item) => item.key === active.value))

watch(() => route.path, () => {
  refresh()
})

// "Memperbarui…": only for a refresh that takes a moment (no flicker for a fast one)
const syncShown = ref(false)
let syncTimer = null
watch(refreshingCount, (n) => {
  clearTimeout(syncTimer)
  if (n > 0) syncTimer = setTimeout(() => (syncShown.value = true), 450)
  else syncShown.value = false
})

// Pull to refresh (phone): from the very top of the page, pull down past PULL_AT and let go
const PULL_AT = 72
const pull = ref(0)
const pullBusy = ref(false)
let pullFrom = null
const pullShown = computed(() => (pullBusy.value ? PULL_AT * 0.75 : Math.min(pull.value * 0.6, PULL_AT)))
function pullStart(e) {
  pullFrom = window.scrollY <= 0 && e.touches.length === 1 && !pullBusy.value ? e.touches[0].clientY : null
}
function pullMove(e) {
  if (pullFrom === null) return
  const dy = e.touches[0].clientY - pullFrom
  pull.value = window.scrollY > 0 || dy <= 0 ? 0 : dy
}
function pullCancel() {
  pullFrom = null
  pull.value = 0
}
function pullEnd() {
  const go = pullFrom !== null && pull.value >= PULL_AT && !pullBusy.value
  pullCancel()
  if (!go) return
  pullBusy.value = true
  try {
    navigator.vibrate?.(15)
  } catch {
    /* not supported */
  }
  refreshAll()
  refresh({ force: true })
  // the ring spins until the answers are in (at least a moment, so it is seen)
  const started = Date.now()
  const settle = () => {
    if (refreshingCount.value > 0 && Date.now() - started < 15000) {
      setTimeout(settle, 200)
      return
    }
    setTimeout(() => (pullBusy.value = false), Math.max(0, 600 - (Date.now() - started)))
  }
  setTimeout(settle, 250)
}

// the browser's own pull-to-refresh (a full reload) would fight ours: off while in the portal
onMounted(() => {
  refresh()
  document.documentElement.classList.add('wali-no-overscroll')
})
onBeforeUnmount(() => {
  stopMe()
  clearTimeout(syncTimer)
  document.documentElement.classList.remove('wali-no-overscroll')
})
</script>

<style>
html.wali-no-overscroll,
html.wali-no-overscroll body {
  overscroll-behavior-y: contain;
}
</style>

<style scoped>
/* room under the page for the floating bar (64px), the gap it keeps from the bottom edge (10px) and some air */
.wali-shell.has-nav :deep(.wali-main) {
  padding-bottom: calc(100px + env(safe-area-inset-bottom));
}

.wali-sync {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #fcd34d;
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.wali-sync.is-on {
  opacity: 1;
}

.wali-sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fcd34d;
  animation: wali-sync-pulse 1s ease-in-out infinite;
}

@keyframes wali-sync-pulse {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}

.wali-pull {
  position: fixed;
  top: calc(56px + env(safe-area-inset-top));
  left: 50%;
  z-index: 19;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-left: -20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 6px 18px -8px rgba(5, 61, 44, 0.5);
  opacity: 0;
  transform: translateY(calc(var(--pull, 0px) - 44px));
  pointer-events: none;
}

.wali-pull.is-shown {
  opacity: 1;
}

.wali-pull-ring {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2.5px solid #d7e5dd;
  border-top-color: #0a5c40;
  transform: rotate(var(--pull-turn, 0deg));
}

.wali-pull.is-ready .wali-pull-ring {
  border-color: #0a5c40;
  border-top-color: #b45309;
}

.wali-pull.is-busy .wali-pull-ring {
  animation: wali-pull-spin 0.8s linear infinite;
}

@keyframes wali-pull-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wali-sync-dot,
  .wali-pull.is-busy .wali-pull-ring {
    animation: none;
  }
}
</style>
