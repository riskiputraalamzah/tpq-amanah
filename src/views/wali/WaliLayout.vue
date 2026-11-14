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
      <router-view />
    </main>

    <!-- Bottom navigation: the four places a parent goes, within thumb reach. Hidden on the forms, which have their
         own Kembali / Lanjut bar at the bottom. -->
    <nav v-if="showNav" class="wali-nav" aria-label="Menu wali santri">
      <router-link v-for="item in NAV" :key="item.key" :to="item.to" class="wali-nav-item" :class="{ 'is-active': active === item.key }"
        :aria-current="active === item.key ? 'page' : undefined">
        <span class="wali-nav-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon"></svg>
          <span v-if="item.key === 'pengumuman' && unseen" class="wali-nav-badge">{{ unseen > 9 ? '9+' : unseen }}</span>
        </span>
        <span class="wali-nav-label">{{ item.label }}</span>
        <span v-if="item.key === 'pengumuman' && unseen" class="sr-only">, {{ unseen }} baru</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWaliAnnouncements } from '@/composables/useWaliAnnouncements'
import '@/styles/landing.css'
import './wali.css'

const logoUrl = new URL('@/assets/logo-sm.png', import.meta.url).href
const route = useRoute()
const { unseen, refresh } = useWaliAnnouncements()

const NAV = [
  { key: 'home', to: '/wali', label: 'Beranda', icon: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />' },
  { key: 'izin', to: '/wali/izin', label: 'Izin', icon: '<rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m9.5 14.5 5 5m0-5-5 5" />' },
  { key: 'pengumuman', to: '/wali/pengumuman', label: 'Pengumuman', icon: '<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Z" /><path d="M16 9a3 3 0 0 1 0 6" /><path d="M19 6a7 7 0 0 1 0 12" />' },
  { key: 'akun', to: '/wali/akun', label: 'Akun', icon: '<circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />' },
]

const showNav = computed(() => !route.meta.hideNav)
const active = computed(() => {
  const p = route.path
  if (p === '/wali/izin' || /^\/wali\/santri\/[^/]+\/izin$/.test(p)) return 'izin'
  if (p.startsWith('/wali/pengumuman')) return 'pengumuman'
  if (p.startsWith('/wali/akun')) return 'akun'
  return 'home'
})

onMounted(() => refresh())
</script>

<style scoped>
.wali-shell.has-nav :deep(.wali-main) {
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
}

.wali-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-width: 560px;
  margin: 0 auto;
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.97);
  border-top: 1px solid rgba(11, 59, 42, 0.1);
  box-shadow: 0 -10px 24px -18px rgba(3, 41, 29, 0.45);
  backdrop-filter: blur(8px);
}

@media (min-width: 600px) {
  .wali-nav {
    bottom: 12px;
    border: 1px solid rgba(11, 59, 42, 0.12);
    border-radius: 20px;
    padding-bottom: 6px;
  }
}

.wali-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 52px;
  padding: 4px 2px;
  border-radius: 14px;
  color: #6b7a72;
  text-decoration: none;
}

.wali-nav-item.is-active {
  color: #0a5c40;
}

.wali-nav-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 52px;
  height: 30px;
  border-radius: 999px;
  transition: background-color 0.15s ease;
}

.wali-nav-item.is-active .wali-nav-icon {
  background: #e3f1ea;
}

.wali-nav-label {
  font-size: 0.72rem;
  font-weight: 700;
}

.wali-nav-badge {
  position: absolute;
  top: -2px;
  right: 4px;
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
}

.wali-nav-item:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 1px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .wali-nav-icon {
    transition: none;
  }
}
</style>
