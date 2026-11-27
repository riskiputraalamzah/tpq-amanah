<template>
  <div>
    <PageSkeleton v-if="loading" :rows="3" label="Memuat" />
    <template v-else>
      <h1 class="w-title">Izin / sakit</h1>
      <p v-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>
      <template v-else-if="santri.length">
        <p class="w-lead">Pilih ananda yang ingin diajukan izin atau kabar sakit.</p>
        <div class="w-card pick-list">
          <router-link v-for="s in santri" :key="s.santriId" :to="`/wali/santri/${s.santriId}/izin`" class="pick">
            <span class="pick-avatar" aria-hidden="true">{{ initials(s.name) }}</span>
            <span class="pick-text">
              <strong>{{ s.name }}</strong>
              <span v-if="levelName(s.classId)" class="pick-level">{{ levelName(s.classId) }}</span>
            </span>
            <svg class="w-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </router-link>
        </div>
      </template>
      <div v-else class="w-card w-center">
        <p class="w-lead">Izin bisa diajukan setelah ananda tertaut ke akun Bapak/Ibu.</p>
        <router-link to="/wali/tautkan" class="w-btn w-btn-primary">Tautkan dengan kode</router-link>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'

// The "Izin" tab: one child goes straight to their form; with more, the parent picks. The children come from the
// shared store (Beranda already has them), so this shows at once; the tab itself links straight to a single child.
const router = useRouter()
const me = useWaliResource(() => WALI_KEYS.me, () => waliFetch.me())
const santri = computed(() => me.data.value?.santri || [])
const loading = computed(() => me.loading.value || (santri.value.length === 1 && !me.error.value))
const loadError = computed(() => me.error.value)
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : '')
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

watch(
  santri,
  (list) => {
    if (list.length === 1) router.replace(`/wali/santri/${list[0].santriId}/izin`)
  },
  { immediate: true },
)
</script>

<style scoped>
.pick-list {
  padding: 0;
  overflow: hidden;
}

.pick {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 70px;
  padding: 13px 16px;
  color: var(--w-ink);
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.pick + .pick {
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.pick:hover {
  background: #f8fbf9;
}

.pick:active {
  background: var(--w-emerald-soft);
}

.pick:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: -3px;
}

.pick-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(145deg, #0a5c40, #053d2c);
  color: var(--w-gold);
  font-size: 0.94rem;
  font-weight: 800;
}

.pick-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  min-width: 0;
}

.pick-text strong {
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.25;
}

.pick-level {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-size: 0.74rem;
  font-weight: 800;
}
</style>
