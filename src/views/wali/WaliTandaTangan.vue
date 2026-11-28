<template>
  <div>
    <router-link to="/wali/akun" class="w-back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
      Akun
    </router-link>
    <h1 class="w-title">Tanda tangan saya</h1>
    <section class="w-card">
      <SignatureEditor
        title="Untuk paraf kartu prestasi"
        lead="Gambar sekali saja dengan jari. Setiap kali Ayah/Bunda menekan Paraf, tanda tangan ini yang ditempel, lengkap dengan nama dan waktunya. Tidak wajib: tanpa gambar, paraf tetap tercatat (nama + centang)."
        :name="name"
        caption="Wali santri · tercatat atas akun WhatsApp Anda"
      />
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SignatureEditor from '@/components/signature/SignatureEditor.vue'
import { peek } from '@/utils/waliCache'
import { WALI_KEYS } from '@/utils/waliData'

const name = computed(() => peek(WALI_KEYS.me)?.data?.wali?.name || '')
</script>
