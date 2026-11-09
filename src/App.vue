<script setup>
import { RouterView } from 'vue-router'
import GlobalToast from '@/components/GlobalToast.vue'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <transition name="page-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </RouterView>
  <GlobalToast />
</template>

<style>
/* Global app styles are in style.css */

/* Page transition effects: enter only, so the old page never delays the new one */
.page-fade-enter-active {
  transition: opacity 0.12s ease;
}

.page-fade-enter-from {
  opacity: 0;
}
</style>
