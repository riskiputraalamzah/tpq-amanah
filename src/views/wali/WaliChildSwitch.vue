<template>
  <!-- Quick sibling switcher for families with 2+ children: reads the already-cached /wali/me list (zero network) -->
  <nav v-if="kids.length > 1" class="cs-bar" aria-label="Pilih ananda">
    <router-link
      v-for="s in kids"
      :key="s.santriId"
      :to="routeFor(s.santriId)"
      class="cs-pill"
      :class="{ 'is-active': s.santriId === activeId }"
      :aria-current="s.santriId === activeId ? 'page' : undefined"
    >
      <span class="cs-dot" aria-hidden="true">{{ initials(s.name) }}</span>
      <span class="cs-name">{{ shortName(s.name) }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { peek, subscribe } from '@/utils/waliCache'
import { WALI_KEYS } from '@/utils/waliData'

const props = defineProps({
  activeId: { type: String, required: true },
  section: { type: String, required: true }, // 'progres' | 'izin' | 'rapor' | 'kegiatan'
})

const meData = ref(peek(WALI_KEYS.me)?.data || null)
const stop = subscribe(WALI_KEYS.me, (ev) => {
  if (ev.type === 'data') meData.value = ev.data
})
onBeforeUnmount(stop)

const kids = computed(() => meData.value?.santri || [])
const routeFor = (id) => `/wali/santri/${id}/${props.section}`
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
const shortName = (name) => {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (words.length <= 2) return words.join(' ')
  return `${words[0]} ${words[1]}`
}
</script>

<style scoped>
.cs-bar {
  display: flex;
  gap: 8px;
  margin: 0 0 14px;
  padding: 2px 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.cs-bar::-webkit-scrollbar {
  display: none;
}

.cs-pill {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 4px 12px 4px 6px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.14);
  color: var(--w-ink);
  font-size: 0.84rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.cs-pill:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: 2px;
}

.cs-dot {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-size: 0.72rem;
  font-weight: 800;
}

.cs-pill.is-active {
  background: var(--w-emerald);
  border-color: var(--w-emerald);
  color: #fff;
}

.cs-pill.is-active .cs-dot {
  background: rgba(252, 211, 77, 0.22);
  color: var(--w-gold);
}
</style>
