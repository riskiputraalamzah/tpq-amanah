<template>
  <SantriManager
    :title="isAdmin ? 'Kelola Santri' : 'Data Santri'"
    :subtitle="isAdmin ? 'Lihat, tambah, tetapkan Jilid / Marhalah, dan hapus data santri' : 'Daftar santri TPQ Amanah, pencarian, dan pembaruan nama santri'"
    :admin-mode="isAdmin"
  />
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import SantriManager from "@/components/SantriManager.vue";

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === "admin");
</script>