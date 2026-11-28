<template>
  <div class="rpx rpr">
    <div class="rpr-tools no-print">
      <div>
        <h1>{{ d ? d.santri.name : 'Rapor' }}</h1>
        <p v-if="d && d.rapor.status !== 'published'" class="rpx-note is-warn">Belum terbit: tercetak dengan tanda "DRAF".</p>
      </div>
      <button type="button" class="rpx-btn is-primary" :disabled="!d" @click="print">Cetak / Simpan PDF</button>
    </div>
    <PageSkeleton v-if="loading" :rows="6" label="Menyiapkan rapor" />
    <p v-else-if="error" class="rpx-note is-danger" role="alert">{{ error }}</p>
    <RaporPaper v-else-if="d" :rapor="d.rapor" :period="d.period" :attendance-auto="d.attendanceAuto" :draft="d.rapor.status !== 'published'" />
  </div>
</template>

<script setup>
import '@/styles/rapor.css'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import RaporPaper from '@/components/rapor/RaporPaper.vue'

const route = useRoute()
const d = ref(null)
const loading = ref(true)
const error = ref('')
const print = () => window.print()
onMounted(async () => {
  try {
    const { data } = await api.get(`/rapor/periods/${route.params.periodId}/santri/${route.params.santriId}`, { cache: false })
    d.value = data
  } catch (err) {
    error.value = err?.response?.data?.error || 'Rapor belum bisa dimuat.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.rpr { max-width: 860px; }
.rpr-tools { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.rpr-tools h1 { margin: 0 0 6px; font-size: 1.4rem; }
</style>

<style>
@media print {
  @page { size: A4 portrait; margin: 12mm; }
  html, body, .dashboard-layout, .dashboard-main, .dashboard-content { background: #fff !important; }
  .dashboard-layout > aside, .mc-bar, .mc-nav, .no-print, .announcement-banner { display: none !important; }
  .dashboard-main, .dashboard-content { margin: 0 !important; padding: 0 !important; }
}
</style>
