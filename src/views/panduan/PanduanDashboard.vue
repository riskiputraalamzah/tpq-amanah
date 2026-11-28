<template>
  <!-- /dashboard/panduan: admin reads the guides of admin, guru and wali; a guru those of guru and wali -->
  <PanduanGuide :roles="rolesFor(role)" :own-role="role" tone="dashboard" />
</template>

<script setup>
import { computed } from 'vue'
import PanduanGuide from '@/components/panduan/PanduanGuide.vue'
import { useAuthStore } from '@/stores/auth'
import { rolesFor } from '@/content/panduan'

const authStore = useAuthStore()
const role = computed(() => (authStore.user?.role === 'admin' ? 'admin' : 'guru'))
</script>
