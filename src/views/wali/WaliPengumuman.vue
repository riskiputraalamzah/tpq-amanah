<template>
  <div>
    <h1 class="w-title">Pengumuman</h1>
    <p class="w-lead">Kabar dari TPQ Amanah untuk orang tua/wali.</p>
    <PageSkeleton v-if="loading" :rows="3" label="Memuat pengumuman" />
    <div v-else-if="!list.length" class="w-card w-center">
      <p class="w-help">Belum ada pengumuman saat ini.</p>
    </div>
    <article v-for="a in list" v-else :key="a.id" class="w-card ann">
      <h2 class="ann-title">{{ a.title }}</h2>
      <p class="ann-dates">Berlaku {{ shortDate(a.startDate) }} - {{ shortDate(a.endDate) }}</p>
      <p class="ann-body">{{ a.body }}</p>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useWaliAnnouncements } from '@/composables/useWaliAnnouncements'

// Every announcement shown now (also the ones closed on the home page); opening the tab marks them as seen
const { list, refresh, markAllSeen } = useWaliAnnouncements()
const loading = ref(true)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const shortDate = (iso) => (iso ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}` : '')

onMounted(async () => {
  await refresh({ force: true })
  markAllSeen()
  loading.value = false
})
</script>

<style scoped>
.ann {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-color: #f3d58b;
  background: linear-gradient(160deg, #fffdf5, #fff8e1);
}

.ann-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: #3b2404;
}

.ann-dates {
  margin: 0 0 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #b45309;
}

.ann-body {
  margin: 0;
  font-size: 0.94rem;
  line-height: 1.6;
  color: #4a3510;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
