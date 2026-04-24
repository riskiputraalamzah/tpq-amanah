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
          <!-- Top row: icon + title + close -->
          <div class="banner-top-row">
            <!-- Icon -->
            <div class="banner-icon">
              <svg v-if="ann.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <svg v-else-if="ann.type === 'warning'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>

            <!-- Body (desktop: full inline row) -->
            <div class="banner-body" :class="{ clickable: ann.linkUrl }" @click="handleClick(ann)">
              <span class="banner-title">{{ ann.title }}</span>
              <!-- Desktop-only: inline message + CTA -->
              <span class="banner-msg d-desktop">{{ ann.message }}</span>
              <button v-if="ann.linkUrl" class="banner-cta d-desktop" @click.stop="handleClick(ann)">
                {{ ann.linkLabel || 'Lihat Selengkapnya' }}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>

            <!-- Close -->
            <button class="banner-close" @click="dismiss(ann.id)" aria-label="Tutup pengumuman">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Mobile-only: message + CTA below -->
          <p class="banner-msg d-mobile">{{ ann.message }}</p>
          <button v-if="ann.linkUrl" class="banner-cta d-mobile" @click="handleClick(ann)">
            {{ ann.linkLabel || 'Lihat Selengkapnya' }}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
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
  router.push(ann.linkUrl)
}
</script>

<style scoped>
/* ── Wrapper ── */
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

/* ── Colors ── */
.banner-info    { background: linear-gradient(90deg, #1565C0, #1976D2); color: white; }
.banner-success { background: linear-gradient(90deg, #2E7D32, #388E3C); color: white; }
.banner-warning { background: linear-gradient(90deg, #E65100, #F57C00); color: white; }

/* ── DESKTOP: single-line strip ── */
.banner-inner {
  display: flex;
  flex-direction: column; /* column so mobile d-mobile elements flow below */
  padding: 12px 20px;
  min-height: 52px;
  justify-content: center;
}

/* Top row = icon + body + close — always flex row */
.banner-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

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

.banner-body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.banner-body.clickable { cursor: pointer; }

.banner-title {
  font-weight: 700;
  font-size: 0.875rem;
  white-space: nowrap;
  flex-shrink: 0;
}

/* desktop message */
.banner-msg {
  font-size: 0.8rem;
  opacity: 0.92;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

/* desktop CTA */
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

/* Desktop: hide mobile-only elements */
.d-mobile { display: none; }
.d-desktop { display: flex; }
.banner-msg.d-desktop {
  align-items: center;
  display: block;
}

/* ── MOBILE ── */
@media (max-width: 600px) {
  .announcement-banner {
    padding: 10px 12px 0;
  }

  .banner-inner {
    flex-direction: column;
    padding: 14px 16px;
    gap: 0;
    border-radius: 16px;
    box-shadow:
      0 6px 28px rgba(0, 0, 0, 0.28),
      0 0 0 2px rgba(255, 255, 255, 0.18);
    position: relative;
    overflow: hidden;
    /* Subtle pulse to grab attention */
    animation: bannerPulse 3s ease-in-out infinite;
  }

  /* Override gradient for deeper look on mobile */
  .banner-info.announcement-banner    { background: none; }
  .banner-success.announcement-banner { background: none; }
  .banner-warning.announcement-banner { background: none; }

  .banner-info    .banner-inner { background: linear-gradient(145deg, #1565C0 0%, #0D47A1 100%); }
  .banner-success .banner-inner { background: linear-gradient(145deg, #2E7D32 0%, #1B5E20 100%); }
  .banner-warning .banner-inner { background: linear-gradient(145deg, #E65100 0%, #BF360C 100%); }

  /* Shimmer sweep */
  .banner-inner::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background: linear-gradient(
      110deg,
      transparent 35%,
      rgba(255,255,255,0.07) 50%,
      transparent 65%
    );
    pointer-events: none;
  }

  .banner-top-row {
    gap: 10px;
    margin-bottom: 8px;
    align-items: flex-start;
  }

  .banner-icon {
    width: 28px;
    height: 28px;
    margin-top: 2px;
  }

  .banner-body {
    flex-wrap: nowrap;
    gap: 0;
  }

  .banner-title {
    font-size: 0.9rem;
    font-weight: 800;
    line-height: 1.3;
    letter-spacing: -0.01em;
    white-space: normal;
  }

  .banner-close {
    align-self: flex-start;
    background: rgba(255,255,255,0.2);
    margin-top: 0;
    flex-shrink: 0;
  }

  /* Desktop elements hidden on mobile */
  .d-desktop { display: none !important; }

  /* Mobile-only elements */
  .d-mobile { display: flex !important; }

  .banner-msg.d-mobile {
    white-space: normal;
    font-size: 0.8rem;
    opacity: 0.9;
    line-height: 1.5;
    overflow: visible;
    text-overflow: unset;
    padding-left: 38px; /* align under title (icon 28px + gap 10px) */
    margin: 0 0 10px;
    color: rgba(255,255,255,0.95);
    display: block !important;
  }

  .banner-cta.d-mobile {
    align-self: flex-start;
    margin-left: 38px;
    padding: 6px 18px;
    font-size: 0.8rem;
    font-weight: 700;
    color: white;
    background: rgba(255,255,255,0.28);
    border: 1px solid rgba(255,255,255,0.42);
    border-radius: 50px;
    letter-spacing: 0.01em;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    transition: all 0.2s;
    gap: 6px;
  }
  .banner-cta.d-mobile:active {
    background: rgba(255,255,255,0.45);
    transform: scale(0.97);
  }
}

/* Pulse glow keyframe */
@keyframes bannerPulse {
  0%, 100% {
    box-shadow: 0 6px 28px rgba(0,0,0,0.28), 0 0 0 2px rgba(255,255,255,0.18);
  }
  50% {
    box-shadow: 0 8px 36px rgba(0,0,0,0.36), 0 0 0 3px rgba(255,255,255,0.32);
  }
}

/* ── Transitions ── */
.banner-slide-enter-active {
  animation: bannerIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.banner-slide-leave-active {
  animation: bannerOut 0.25s ease-in;
}
@keyframes bannerIn {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}
@keyframes bannerOut {
  from { opacity: 1; max-height: 200px; }
  to   { opacity: 0; max-height: 0; padding: 0; }
}
</style>
