<template>
  <!-- Shown right after a save: the next thing to do, so the teacher never has to scroll back up to switch pages -->
  <Transition name="next-step">
    <div v-if="open" class="next-step" role="status" aria-live="polite">
      <div class="next-step-text">
        <span class="next-step-check" aria-hidden="true">✓</span>
        <span>{{ title }}</span>
      </div>
      <div class="next-step-actions">
        <router-link v-if="secondary" :to="secondary.to" class="next-step-secondary">{{ secondary.label }}</router-link>
        <router-link :to="primary.to" class="next-step-primary">{{ primary.label }} <span aria-hidden="true">→</span></router-link>
      </div>
      <button type="button" class="next-step-close" aria-label="Tutup" @click="emit('close')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  // { label, to }
  primary: { type: Object, required: true },
  secondary: { type: Object, default: null },
})
const emit = defineEmits(['close'])
</script>

<style scoped>
.next-step {
  position: fixed;
  left: 12px;
  right: 12px;
  /* above the guru bottom navigation on phones */
  bottom: calc(84px + env(safe-area-inset-bottom));
  z-index: 950;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px 8px;
  align-items: center;
  padding: 12px 12px 12px 14px;
  border-radius: 16px;
  background: #053d2c;
  color: #fff;
  box-shadow: 0 18px 40px -16px rgba(3, 41, 29, 0.7), inset 0 0 0 1px rgba(252, 211, 77, 0.25);
}

@media (min-width: 1024px) {
  .next-step {
    left: auto;
    right: 32px;
    bottom: 28px;
    width: min(560px, calc(100vw - 340px));
  }
}

.next-step-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.92rem;
  min-width: 0;
}

.next-step-check {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fcd34d;
  color: #053d2c;
  display: grid;
  place-items: center;
  font-size: 0.8rem;
}

.next-step-close {
  grid-column: 2;
  grid-row: 1;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 0;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.next-step-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
}

.next-step-primary,
.next-step-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  text-align: center;
}

.next-step-primary {
  flex: 1.4;
  background: #fcd34d;
  color: #3b2404;
}

.next-step-primary:hover {
  background: #f5c02a;
}

.next-step-secondary {
  flex: 1;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.next-step-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
}

.next-step-primary:focus-visible,
.next-step-secondary:focus-visible,
.next-step-close:focus-visible {
  outline: 3px solid #fcd34d;
  outline-offset: 2px;
}

.next-step-enter-active,
.next-step-leave-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.next-step-enter-from,
.next-step-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

@media (prefers-reduced-motion: reduce) {
  .next-step-enter-active,
  .next-step-leave-active {
    transition: opacity 0.2s ease;
  }

  .next-step-enter-from,
  .next-step-leave-to {
    transform: none;
  }
}
</style>
