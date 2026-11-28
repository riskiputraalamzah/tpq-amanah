<template>
  <!-- The published rapor as on paper: print / save as PDF (A4 portrait, two pages) -->
  <div class="wrc">
    <div class="wrc-tools no-print">
      <router-link :to="`/wali/santri/${santriId}/rapor/${periodId}`" class="w-back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
        Rapor
      </router-link>
      <!-- printed only from the newest data (the phone may show an older copy for a moment) -->
      <button type="button" class="w-btn w-btn-primary" :disabled="!data || refreshing" @click="print">{{ refreshing ? 'Memperbarui…' : 'Cetak / Simpan PDF' }}</button>
      <p class="w-help">Pilih "Simpan sebagai PDF" di jendela cetak untuk menyimpan ke HP. Geser ke samping untuk melihat seluruh halaman.</p>
    </div>
    <PageSkeleton v-if="loading" :rows="5" label="Menyiapkan rapor" />
    <p v-else-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>
    <RaporPaper v-else-if="data" :rapor="data.rapor" :period="data.period" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageSkeleton from '@/components/PageSkeleton.vue'
import RaporPaper from '@/components/rapor/RaporPaper.vue'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'

const route = useRoute()
const santriId = route.params.santriId
const periodId = route.params.periodId
const res = useWaliResource(() => WALI_KEYS.raporDetail(santriId, periodId), () => waliFetch.raporDetail(santriId, periodId))
const data = computed(() => res.data.value)
const loading = computed(() => res.loading.value)
const loadError = computed(() => res.error.value)
const refreshing = computed(() => res.refreshing.value)
const print = () => window.print()
</script>

<style scoped>
.wrc { display: grid; gap: 14px; }
.wrc-tools { display: grid; gap: 8px; }
</style>

<style>
@media print {
  @page { size: A4 portrait; margin: 12mm; }
  html, body, .wali-shell, .wali-main { background: #fff !important; }
  .wali-bar, .no-print, nav, .mc-nav { display: none !important; }
  .wali-main { padding: 0 !important; max-width: none !important; }
}
</style>
