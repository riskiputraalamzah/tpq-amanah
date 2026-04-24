<template>
  <Teleport to="body">
    <TransitionGroup name="banner-slide" tag="div" class="banners-wrapper">
      <div
        v-for="ann in store.activeAnnouncements"
        :key="ann.id"
        class="announcement-banner"
        :class="['banner-' + ann.type]"
        role="alert"
      >
        <div class="banner-inner">
          <!-- Icon -->
          <div class="banner-icon">
            <svg v-if="ann.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <svg v-else-if="ann.type === 'warning'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>

          <!-- Text -->
          <div class="banner-body" :class="{ clickable: ann.linkUrl }" @click="handleClick(ann)">
            <span class="banner-title">{{ ann.title }}</span>
            <span class="banner-msg">{{ ann.message }}</span>
            <button v-if="ann.linkUrl" class="banner-cta" @click.stop="handleClick(ann)">
              {{ ann.linkLabel || 'Lihat Selengkapnya' }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

          <!-- Close -->
          <button class="banner-close" @click="dismiss(ann.id)" aria-label="Tutup pengumuman">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { useAnnouncementStore } from '@/stores/announcements'
import { useRouter } from 'vue-router'

const store = useAnnouncementStore()
const router = useRouter()

const dismiss = (id) => store.dismiss(id)

const handleClick = (ann) => {
  if (!ann.linkUrl) return
  // Navigate to the link, then dismiss
  router.push(ann.linkUrl)
}
</script>

<style scoped>
.banners-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.announcement-banner {
  pointer-events: all;
  width: 100%;
}

.banner-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  min-height: 52px;
}

/* Colors */
.banner-info   { background: linear-gradient(90deg, #1565C0, #1976D2); color: white; }
.banner-success { background: linear-gradient(90deg, #2E7D32, #388E3C); color: white; }
.banner-warning { background: linear-gradient(90deg, #E65100, #F57C00); color: white; }

/* Icon */
.banner-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

/* Body */
.banner-body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}

.banner-body.clickable { cursor: pointer; }

.banner-title {
  font-weight: 700;
  font-size: 0.875rem;
  white-space: nowrap;
}

.banner-msg {
  font-size: 0.8rem;
  opacity: 0.92;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.banner-cta {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  padding: 5px 14px;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.2s;
  flex-shrink: 0;
}

.banner-cta:hover { background: rgba(255, 255, 255, 0.4); }

/* Close */
.banner-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  color: white;
  transition: background 0.2s;
}
.banner-close:hover { background: rgba(255, 255, 255, 0.35); }

/* Mobile */
@media (max-width: 600px) {
  .banner-inner { padding: 10px 14px; gap: 8px; }
  .banner-msg { display: none; }
  .banner-title { font-size: 0.8rem; }
}

/* Transition */
.banner-slide-enter-active {
  animation: bannerIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.banner-slide-leave-active {
  animation: bannerOut 0.25s ease-in;
}
@keyframes bannerIn {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes bannerOut {
  from { transform: translateY(0);    opacity: 1; max-height: 60px; }
  to   { transform: translateY(-20%); opacity: 0; max-height: 0; }
}
</style>
