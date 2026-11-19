<template>
  <div class="wali-shell" :class="{ 'has-nav': showNav }">
    <header class="wali-bar">
      <router-link to="/wali" class="wali-brand" aria-label="Beranda wali santri">
        <img :src="logoUrl" alt="" width="32" height="32" />
        <span>
          <strong>TPQ Amanah</strong>
          <small>Wali Santri</small>
        </span>
      </router-link>
    </header>

    <main class="wali-main">
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
import { computed, onMounted } from 'vue'
import BubbleNav from '@/components/BubbleNav.vue'
import { useRoute } from 'vue-router'
import { useWaliAnnouncements } from '@/composables/useWaliAnnouncements'
import { usePageTransition } from '@/composables/usePageTransition'
import '@/styles/landing.css'
import './wali.css'

const logoUrl = new URL('@/assets/logo-sm.png', import.meta.url).href
const route = useRoute()
const { unseen, refresh } = useWaliAnnouncements()
const { name: pageTransition, onBeforeLeave } = usePageTransition({ role: () => 'wali' })

const NAV = [
  { key: 'home', to: '/wali', label: 'Beranda', icon: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />' },
  { key: 'izin', to: '/wali/izin', label: 'Izin', icon: '<rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m9.5 14.5 5 5m0-5-5 5" />' },
  { key: 'pengumuman', to: '/wali/pengumuman', label: 'Pengumuman', icon: '<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Z" /><path d="M16 9a3 3 0 0 1 0 6" /><path d="M19 6a7 7 0 0 1 0 12" />' },
  { key: 'akun', to: '/wali/akun', label: 'Akun', icon: '<circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />' },
]

// the tabs as the bar draws them: the unread-announcement count rides on "Pengumuman"
const navItems = computed(() => NAV.map((item) => ({ ...item, badge: item.key === 'pengumuman' ? unseen.value : 0, badgeLabel: 'baru' })))

const showNav = computed(() => !route.meta.hideNav)
const active = computed(() => {
  const p = route.path
  if (p === '/wali/izin' || /^\/wali\/santri\/[^/]+\/izin$/.test(p)) return 'izin'
  if (p.startsWith('/wali/pengumuman')) return 'pengumuman'
  if (p.startsWith('/wali/akun')) return 'akun'
  return 'home'
})

const activeIndex = computed(() => NAV.findIndex((item) => item.key === active.value))

onMounted(() => refresh())
</script>

<style scoped>
/* room under the page for the floating bar (64px), the gap it keeps from the bottom edge (10px) and some air */
.wali-shell.has-nav :deep(.wali-main) {
  padding-bottom: calc(100px + env(safe-area-inset-bottom));
}
</style>
