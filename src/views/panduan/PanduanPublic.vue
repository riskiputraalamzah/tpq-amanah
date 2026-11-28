<template>
  <!-- /panduan: signed in -> the guide of that person's own area; a visitor reads the wali guide -->
  <div class="pp">
    <header class="pp-bar">
      <router-link to="/" class="pp-brand" aria-label="Ke halaman depan TPQ Amanah">
        <img src="/logo-sm.png" alt="" width="32" height="32" />
        <span><strong>TPQ Amanah</strong><small>Panduan</small></span>
      </router-link>
      <router-link to="/login?as=wali" class="pp-login">Masuk</router-link>
    </header>
    <main class="pp-main">
      <PanduanGuide :roles="['wali']" tone="public" />
      <p class="pp-staff">Ustadz/ustadzah dan admin: <router-link to="/login">masuk</router-link> lalu buka menu Panduan untuk panduan guru dan admin.</p>
    </main>
  </div>
</template>

<script setup>
import PanduanGuide from '@/components/panduan/PanduanGuide.vue'
</script>

<style scoped>
.pp { min-height: 100vh; background: #f8f6ef; }
.pp-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: calc(10px + env(safe-area-inset-top)) 16px 10px;
  background: #043325;
}
.pp-brand { display: flex; align-items: center; gap: 10px; color: #fbf9f3; text-decoration: none; }
.pp-brand span { display: grid; line-height: 1.15; }
.pp-brand small { color: #fcd34d; font-weight: 700; }
.pp-login { min-height: 42px; display: inline-flex; align-items: center; padding: 0 16px; border-radius: 12px; background: #fcd34d; color: #3a2405; font-weight: 800; text-decoration: none; }
.pp-main { padding: 18px 16px 40px; }
.pp-staff { max-width: 760px; margin: 18px auto 0; text-align: center; font-size: 0.86rem; color: #52645a; }
.pp-staff a { color: #0a5c40; font-weight: 700; }
</style>
