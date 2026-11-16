<template>
  <!-- Pusat WhatsApp: one place for everything WhatsApp. The tabs move between its pages; the bot's status stays in view
       on every one of them, live. -->
  <div class="wh">
    <nav class="wh-tabs" aria-label="Pusat WhatsApp">
      <router-link v-for="t in TABS" :key="t.to" :to="t.to" class="wh-tab" :class="{ 'is-active': isActive(t) }"
        :aria-current="isActive(t) ? 'page' : undefined">
        {{ t.label }}
        <span v-if="t.key === 'riwayat' && queueCount" class="wh-count" :aria-label="`${queueCount} di antrean`">{{ queueCount }}</span>
      </router-link>
    </nav>

    <router-link to="/dashboard/whatsapp" class="wh-status" :class="`is-${status.tone}`" role="status" aria-live="polite">
      <span class="wh-dot" aria-hidden="true"></span>
      <strong class="wh-label">{{ status.label }}</strong>
      <span class="wh-text">{{ status.text }}<template v-if="status.seen"> · kabar {{ status.seen }}</template></span>
      <span v-if="live.state.error" class="wh-offline">{{ live.state.error }}</span>
    </router-link>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useWaLive } from '@/composables/useWaLive'
import { botStatusOf } from '@/utils/waBotStatus'

const TABS = [
  { key: 'ringkasan', to: '/dashboard/whatsapp', label: 'Ringkasan' },
  { key: 'riwayat', to: '/dashboard/wa-log', label: 'Riwayat & Antrean' },
  { key: 'broadcast', to: '/dashboard/broadcasts', label: 'Broadcast' },
  { key: 'pengingat', to: '/dashboard/wa-reminders', label: 'Pengingat Guru' },
]

const route = useRoute()
const live = useWaLive()
const isActive = (t) => route.path === t.to
const queueCount = computed(() => live.state.queue?.summary?.total || 0)

// "kabar 2 menit lalu" keeps moving between polls
const nowMs = ref(Date.now())
let clock = null
onMounted(() => { clock = setInterval(() => { nowMs.value = Date.now() }, 20000) })
onBeforeUnmount(() => clearInterval(clock))
const status = computed(() => botStatusOf(live.state.bot, Math.max(nowMs.value, live.state.updatedAt?.getTime() || 0)))
</script>

<style scoped>
.wh {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
}

.wh-tabs {
  display: flex;
  gap: 4px;
  width: fit-content;
  max-width: 100%;
  padding: 4px;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
  overflow-x: auto;
  scrollbar-width: none;
}

.wh-tabs::-webkit-scrollbar {
  display: none;
}

.wh-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 9px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #3b4a42;
  text-decoration: none;
  white-space: nowrap;
}

.wh-tab.is-active {
  background: #fff;
  color: #0b3b2a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.wh-tab:focus-visible,
.wh-status:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.wh-count {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #0a5c40;
  color: #fff;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}

.wh-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.12);
  background: #fff;
  color: #475a50;
  font-size: 0.86rem;
  text-decoration: none;
}

.wh-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9aa8a0;
  flex: none;
}

.wh-label {
  color: #0b3b2a;
}

.wh-text {
  min-width: 0;
  overflow-wrap: anywhere;
}

.is-ok .wh-dot {
  background: #16a34a;
  box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.5);
  animation: wh-pulse 2s ease-out infinite;
}

.is-ok .wh-label { color: #0f6b4a; }
.is-warn .wh-dot { background: #d97706; }
.is-warn .wh-label { color: #b45309; }
.is-danger { border-color: rgba(198, 40, 40, 0.35); background: #fdf3f2; }
.is-danger .wh-dot { background: #c62828; }
.is-danger .wh-label { color: #c62828; }

.wh-offline {
  flex-basis: 100%;
  color: #b45309;
  font-weight: 600;
}

/* a phone: the four tabs as a 2 x 2 block, all visible at once */
@media (max-width: 560px) {
  .wh-tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .wh-tab {
    justify-content: center;
    padding: 0 8px;
  }
}

@keyframes wh-pulse {
  0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.45); }
  70% { box-shadow: 0 0 0 7px rgba(22, 163, 74, 0); }
  100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .is-ok .wh-dot { animation: none; }
}
</style>
