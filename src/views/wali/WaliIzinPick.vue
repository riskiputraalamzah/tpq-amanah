<template>
  <div>
    <PageSkeleton v-if="loading" :rows="3" label="Memuat" />
    <template v-else>
      <h1 class="w-title">Izin / sakit</h1>
      <p v-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>
      <template v-else-if="santri.length">
        <p class="w-lead">Untuk ananda yang mana?</p>
        <router-link v-for="s in santri" :key="s.santriId" :to="`/wali/santri/${s.santriId}/izin`" class="w-card pick">
          <span class="pick-avatar" aria-hidden="true">{{ initials(s.name) }}</span>
          <span class="pick-text"><strong>{{ s.name }}</strong><span>{{ levelName(s.classId) }}</span></span>
          <span class="pick-go" aria-hidden="true">›</span>
        </router-link>
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
.pick {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #0b3b2a;
  text-decoration: none;
}

.pick:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.pick-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #0a5c40;
  color: #fcd34d;
  font-weight: 800;
}

.pick-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pick-text span {
  font-size: 0.86rem;
  color: #5b6b62;
}

.pick-go {
  font-size: 1.4rem;
  color: #0a5c40;
}
</style>
