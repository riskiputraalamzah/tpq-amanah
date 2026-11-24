<template>
  <div>
    <h1 class="w-title">Pengumuman</h1>
    <p class="w-lead">Kabar dari TPQ Amanah dan info terkini kegiatan yang diikuti ananda.</p>

    <div v-if="!loading && hasBothKinds" class="ann-tabs" role="group" aria-label="Saring jenis kabar">
      <button type="button" class="ann-chip" :aria-pressed="filter === 'all'" @click="filter = 'all'">
        Semua <span>{{ list.length }}</span>
      </button>
      <button type="button" class="ann-chip" :aria-pressed="filter === 'kegiatan'" @click="filter = 'kegiatan'">
        Info Kegiatan <span>{{ kegiatanCount }}</span>
      </button>
      <button type="button" class="ann-chip" :aria-pressed="filter === 'umum'" @click="filter = 'umum'">
        Pengumuman TPQ <span>{{ umumCount }}</span>
      </button>
    </div>

    <PageSkeleton v-if="loading" :rows="3" label="Memuat pengumuman" />
    <div v-else-if="!visible.length" class="w-card w-center">
      <p class="w-help">Belum ada pengumuman saat ini.</p>
    </div>

    <template v-else>
      <template v-for="a in visible" :key="a.id">
        <!-- Info Kegiatan: clickable card navigating directly to that activity's dedicated info timeline -->
        <router-link
          v-if="a.kind === 'kegiatan_info'"
          :to="{
            path: `/wali/santri/${a.santriId}/kegiatan/${a.activityId}/info`,
            query: { from: 'pengumuman', highlight: a.updateId },
          }"
          class="w-card ann-kegiatan"
        >
          <div class="ann-k-top">
            <span class="w-pill is-ok">Info Kegiatan</span>
            <span class="ann-k-time">{{ formatWibDateTime(a.createdAt) }}</span>
          </div>
          <h2 class="ann-k-title">{{ a.activityTitle || a.title }}</h2>
          <p class="ann-k-meta">
            Ananda: <strong>{{ joinNames(a.santriNames || []) }}</strong>
            <template v-if="a.createdByName"> · oleh {{ a.createdByName }}</template>
          </p>
          <div class="ann-k-body wa-rich" v-html="renderWaMarkdownHtml(a.body)"></div>
          <span class="ann-k-go">Lihat semua info kegiatan ini ›</span>
        </router-link>

        <!-- General TPQ announcement -->
        <article v-else class="w-card ann">
          <span class="ann-tag">Pengumuman TPQ</span>
          <h2 class="ann-title">{{ a.title }}</h2>
          <p class="ann-dates">Berlaku {{ shortDate(a.startDate) }} - {{ shortDate(a.endDate) }}</p>
          <p class="ann-body">{{ a.body }}</p>
        </article>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useWaliAnnouncements } from '@/composables/useWaliAnnouncements'
import { formatWibDateTime, joinNames, renderWaMarkdownHtml } from '@/utils/waFormat'

// Every announcement & activity info shown now; opening the tab marks them as seen (clears bottom-bar badge)
const { list, refresh, markAllSeen } = useWaliAnnouncements()
const loading = ref(true)
const filter = ref('all')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const shortDate = (iso) => (iso ? `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}` : '')

const kegiatanCount = computed(() => list.value.filter((a) => a.kind === 'kegiatan_info').length)
const umumCount = computed(() => list.value.filter((a) => a.kind !== 'kegiatan_info').length)
const hasBothKinds = computed(() => kegiatanCount.value > 0 && umumCount.value > 0)
const visible = computed(() => {
  if (filter.value === 'kegiatan') return list.value.filter((a) => a.kind === 'kegiatan_info')
  if (filter.value === 'umum') return list.value.filter((a) => a.kind !== 'kegiatan_info')
  return list.value
})

onMounted(async () => {
  await refresh({ force: true })
  markAllSeen()
  loading.value = false
})
</script>

<style scoped>
.ann-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.ann-chip {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.ann-chip[aria-pressed="true"] {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.ann {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-color: #f3d58b;
  background: linear-gradient(160deg, #fffdf5, #fff8e1);
}

.ann-tag {
  align-self: flex-start;
  padding: 2px 9px;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.74rem;
  font-weight: 800;
}

.ann-title {
  margin: 2px 0 0;
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

/* Info Kegiatan clickable card */
.ann-kegiatan {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-decoration: none;
  color: inherit;
  border-color: rgba(10, 92, 64, 0.24);
  background: linear-gradient(160deg, #ffffff, #f2f9f5);
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.ann-kegiatan:hover {
  border-color: rgba(10, 92, 64, 0.55);
}

.ann-k-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.ann-k-time {
  font-size: 0.78rem;
  font-weight: 700;
  color: #5b6b62;
}

.ann-k-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: #0b3b2a;
}

.ann-k-meta {
  margin: 0;
  font-size: 0.82rem;
  color: #475a50;
}

.ann-k-body {
  margin-top: 2px;
  font-size: 0.92rem;
  line-height: 1.55;
  color: #163024;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.ann-k-go {
  margin-top: 4px;
  font-size: 0.84rem;
  font-weight: 800;
  color: #0a5c40;
}

.wa-rich :deep(.wa-line) { min-height: 1.15em; }
.wa-rich :deep(.wa-gap) { height: 6px; }
.wa-rich :deep(.wa-quote) {
  margin: 2px 0;
  padding: 2px 8px;
  border-left: 3px solid #0a5c40;
  background: rgba(10, 92, 64, 0.06);
}
.wa-rich :deep(.wa-li) { display: flex; gap: 6px; }
.wa-rich :deep(.wa-li-mark) { flex: none; font-weight: 700; }
.wa-rich :deep(.wa-mono) {
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(11, 59, 42, 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85em;
}
.wa-rich :deep(.wa-link) { color: #027eb5; text-decoration: underline; }
</style>
