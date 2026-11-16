<template>
  <SantriManager
    :title="isAdmin ? 'Kelola Santri' : 'Data Santri'"
    :subtitle="isAdmin ? 'Lihat, tambah, tetapkan Jilid / Marhalah, dan hapus data santri' : 'Santri jilid Antum. Santri naik jilid? Ketuk Naik ke Jilid berikutnya. Salah ketik nama? Ketuk Ubah nama. Santri baru diusulkan ke admin.'"
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