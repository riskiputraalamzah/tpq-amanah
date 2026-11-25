<script setup>
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import GlobalToast from '@/components/GlobalToast.vue'
import DialogHost from '@/components/DialogHost.vue'
import { applyThemeColor } from '@/utils/themeColor'

const router = useRouter()
const navigating = ref(false)
let navTimer = null

router.beforeEach((to) => {
  applyThemeColor(to.path)
  clearTimeout(navTimer)
  navTimer = setTimeout(() => {
    navigating.value = true
  }, 120)
})

router.afterEach(() => {
  clearTimeout(navTimer)
  navigating.value = false
})

router.onError(() => {
  clearTimeout(navTimer)
  navigating.value = false
})
</script>

<template>
  <div
    v-if="navigating"
    class="route-progress-bar"
    aria-hidden="true"
  ></div>
  <RouterView v-slot="{ Component }">
    <transition name="page-fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </RouterView>
  <GlobalToast />
  <DialogHost />
</template>

<style>
/* Global app styles are in style.css */

/* Subtle golden indicator shown only when a lazy route chunk takes >120ms */
.route-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  z-index: 999;
  background: linear-gradient(90deg, transparent, #fcd34d 45%, #fbbf24 55%, transparent);
  background-size: 200% 100%;
  animation: route-bar-slide 0.9s linear infinite;
  pointer-events: none;
}

@keyframes route-bar-slide {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

/* Smooth, zero-white-flash page transition (never drops opacity to 0 over a white canvas;
   backdrop matches page surface via applyThemeColor and avoids transform so fixed Navbar never jumps). */
.page-fade-enter-active {
  transition: opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.page-fade-enter-from {
  opacity: 0.88;
}

@media (prefers-reduced-motion: reduce) {
  .page-fade-enter-active {
    transition: none;
  }
  .page-fade-enter-from {
    opacity: 1;
  }
}
</style>
