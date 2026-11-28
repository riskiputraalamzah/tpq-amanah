<template>
  <!-- /wali/panduan: the wali portal's guide -->
  <div>
    <router-link to="/wali/akun" class="w-back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
      Akun
    </router-link>
    <PanduanGuide :roles="['wali']" own-role="wali" tone="wali" />
  </div>
</template>

<script setup>
import PanduanGuide from '@/components/panduan/PanduanGuide.vue'
</script>
