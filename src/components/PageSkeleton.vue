<template>
  <div class="page-skeleton" role="status" aria-busy="true">
    <span class="ps-sr-only">{{ label }}</span>

    <div v-if="stats > 0" class="ps-stats" aria-hidden="true">
      <div v-for="i in stats" :key="i" class="ps-surface ps-stat">
        <span class="ps-bone ps-avatar"></span>
        <div class="ps-stack">
          <span class="ps-bone ps-w-60 ps-h-lg"></span>
          <span class="ps-bone ps-w-80 ps-h-sm"></span>
        </div>
      </div>
    </div>

    <div v-if="variant === 'cards'" class="ps-cards" aria-hidden="true">
      <div v-for="i in rows" :key="i" class="ps-surface ps-card">
        <span class="ps-bone ps-w-40 ps-h-sm"></span>
        <span class="ps-bone ps-w-80 ps-h-lg"></span>
        <span class="ps-bone ps-w-100 ps-h-sm"></span>
        <span class="ps-bone ps-w-60 ps-h-sm"></span>
        <span class="ps-bone ps-w-100 ps-h-btn"></span>
      </div>
    </div>

    <div v-else-if="variant === 'form'" class="ps-surface ps-block" aria-hidden="true">
      <span class="ps-bone ps-w-40 ps-h-lg"></span>
      <div v-for="i in rows" :key="i" class="ps-stack">
        <span class="ps-bone ps-w-25 ps-h-sm"></span>
        <span class="ps-bone ps-w-100 ps-h-btn"></span>
      </div>
      <span class="ps-bone ps-w-25 ps-h-btn"></span>
    </div>

    <div v-else-if="variant === 'inline'" class="ps-stack" aria-hidden="true">
      <div v-for="i in rows" :key="i" class="ps-row">
        <span class="ps-bone ps-avatar ps-avatar-sm"></span>
        <div class="ps-stack">
          <span class="ps-bone ps-h-sm" :class="i % 2 ? 'ps-w-60' : 'ps-w-40'"></span>
        </div>
        <span class="ps-bone ps-pill"></span>
      </div>
    </div>

    <div v-else class="ps-surface ps-block" aria-hidden="true">
      <span class="ps-bone ps-w-40 ps-h-lg"></span>
      <div v-for="i in rows" :key="i" class="ps-row">
        <span class="ps-bone ps-avatar"></span>
        <div class="ps-stack">
          <span class="ps-bone ps-h-md" :class="i % 2 ? 'ps-w-60' : 'ps-w-40'"></span>
          <span class="ps-bone ps-w-40 ps-h-sm"></span>
        </div>
        <span class="ps-bone ps-pill"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'list',
    validator: (v) => ['list', 'cards', 'form', 'inline'].includes(v),
  },
  rows: { type: Number, default: 5 },
  stats: { type: Number, default: 0 },
  label: { type: String, default: 'Memuat data' },
})
</script>

<style scoped>
.page-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.ps-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.ps-surface {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(27, 94, 32, 0.08);
}

.ps-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.ps-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}

.ps-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.ps-card,
.ps-block {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.25rem;
}

.ps-stack {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.ps-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ps-bone {
  display: block;
  border-radius: 8px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: ps-shimmer 1.5s ease-in-out infinite;
}

.ps-avatar {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
}

.ps-avatar-sm {
  width: 32px;
  height: 32px;
}

.ps-pill {
  flex: none;
  width: 64px;
  height: 24px;
  border-radius: 999px;
}

.ps-h-sm { height: 0.75rem; }
.ps-h-md { height: 1rem; }
.ps-h-lg { height: 1.5rem; }
.ps-h-btn { height: 2.5rem; }
.ps-w-25 { width: 25%; }
.ps-w-40 { width: 40%; }
.ps-w-60 { width: 60%; }
.ps-w-80 { width: 80%; }
.ps-w-100 { width: 100%; }

@keyframes ps-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ps-bone { animation: none; }
}
</style>
