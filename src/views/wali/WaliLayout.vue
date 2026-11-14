<template>
  <div class="wali-shell">
    <header class="wali-bar">
      <router-link to="/wali" class="wali-brand" aria-label="Beranda wali santri">
        <img :src="logoUrl" alt="" width="32" height="32" />
        <span>
          <strong>TPQ Amanah</strong>
          <small>Wali Santri</small>
        </span>
      </router-link>
      <button type="button" class="wali-logout" @click="logout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Keluar
      </button>
    </header>

    <main class="wali-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import '@/styles/landing.css'
import './wali.css'

const logoUrl = new URL('@/assets/logo-sm.png', import.meta.url).href
const router = useRouter()
const authStore = useAuthStore()

async function logout() {
  await authStore.logout()
  router.push({ name: 'Login', query: { as: 'wali' } })
}
</script>
