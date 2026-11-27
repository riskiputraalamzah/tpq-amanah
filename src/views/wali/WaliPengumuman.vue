<template>
  <div>
    <h1 class="w-title">Pengumuman</h1>
    <p class="w-lead">Kabar dari TPQ Amanah dan info terkini kegiatan yang diikuti ananda.</p>

    <!-- Single-row segmented filter bar: never wraps onto an orphan line on 360px-390px phones -->
    <div v-if="!loading && hasBothKinds" class="ann-tabs" role="group" aria-label="Saring jenis kabar">
      <button type="button" class="ann-chip" :aria-pressed="filter === 'all'" @click="filter = 'all'">
        <span>Semua</span>
        <span class="ann-chip-n">{{ list.length }}</span>
      </button>
      <button type="button" class="ann-chip" :aria-pressed="filter === 'kegiatan'" @click="filter = 'kegiatan'">
        <span>Kegiatan</span>
        <span class="ann-chip-n">{{ kegiatanCount }}</span>
      </button>
      <button type="button" class="ann-chip" :aria-pressed="filter === 'umum'" @click="filter = 'umum'">
        <span>Umum TPQ</span>
        <span class="ann-chip-n">{{ umumCount }}</span>
      </button>
    </div>

    <PageSkeleton v-if="loading" :rows="3" label="Memuat pengumuman" />
    <div v-else-if="!visible.length" class="w-card w-center empty-box">
      <p class="w-help">Belum ada pengumuman saat ini.</p>
    </div>

    <div v-else class="ann-feed">
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
          <div class="ann-top">
            <span class="w-pill is-ok">Info Kegiatan</span>
            <span class="ann-time">{{ formatWibDateTime(a.createdAt) }}</span>
          </div>
          <h2 class="ann-k-title">{{ a.activityTitle || a.title }}</h2>
          <p class="ann-k-meta">
            Ananda: <strong>{{ joinNames(a.santriNames || []) }}</strong>
            <template v-if="a.createdByName"> · {{ a.createdByName }}</template>
          </p>
          <div class="ann-k-body wa-rich" v-html="renderWaMarkdownHtml(a.body)"></div>
          <span class="ann-k-go">
            <span>Lihat semua info kegiatan ini</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          </span>
        </router-link>

        <!-- General TPQ announcement: unified header rhythm matching Info Kegiatan -->
        <article v-else class="w-card ann">
          <div class="ann-top">
            <span class="w-pill is-warn">Pengumuman TPQ</span>
            <span class="ann-dates">{{ shortDate(a.startDate) }} - {{ shortDate(a.endDate) }}</span>
          </div>
          <h2 class="ann-title">{{ a.title }}</h2>
          <p class="ann-body">{{ a.body }}</p>
        </article>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useWaliAnnouncements } from '@/composables/useWaliAnnouncements'
import { peek } from '@/utils/waliCache'
import { WALI_KEYS } from '@/utils/waliData'
import { formatWibDateTime, joinNames, renderWaMarkdownHtml } from '@/utils/waFormat'

// Every announcement & activity info shown now; opening the tab marks them as seen (clears bottom-bar badge)
const { list, refresh, markAllSeen } = useWaliAnnouncements()
// the skeleton only when this phone has never had the list; otherwise it shows at once and refreshes
const loading = ref(!peek(WALI_KEYS.announcements))
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
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 14px;
  padding: 4px;
  border-radius: 14px;
  background: #ecefe9;
}

.ann-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 38px;
  padding: 0 6px;
  border-radius: 10px;
  border: 0;
  background: transparent;
  color: var(--w-body);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.ann-chip:focus-visible,
.ann-kegiatan:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: 2px;
}

.ann-chip-n {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(11, 59, 42, 0.1);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}

.ann-chip[aria-pressed="true"] {
  background: var(--w-emerald);
  color: #fff;
  box-shadow: 0 2px 8px -3px rgba(3, 41, 29, 0.45);
}

.ann-chip[aria-pressed="true"] .ann-chip-n {
  background: rgba(255, 255, 255, 0.22);
  color: var(--w-gold);
}

.empty-box {
  padding: 20px 16px;
}

.ann-feed {
  display: grid;
  gap: 12px;
}

.ann-feed > .w-card {
  margin-top: 0;
}

.ann-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.ann-time {
  font-size: 0.77rem;
  font-weight: 700;
  color: var(--w-muted);
  font-variant-numeric: tabular-nums;
}

.ann-dates {
  font-size: 0.77rem;
  font-weight: 700;
  color: #8f4106;
  font-variant-numeric: tabular-nums;
}

/* General TPQ announcement */
.ann {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-color: #eed085;
  background: linear-gradient(160deg, #fffdf6, #fff8e2);
}

.ann-title {
  margin: 2px 0 0;
  font-size: 1.06rem;
  font-weight: 800;
  line-height: 1.3;
  color: #3b2404;
}

.ann-body {
  margin: 0;
  font-size: 0.92rem;
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
  border-color: rgba(10, 92, 64, 0.22);
  background: linear-gradient(160deg, #ffffff, #f3faf6);
  transition: border-color 0.15s ease;
}

.ann-kegiatan:hover {
  border-color: rgba(10, 92, 64, 0.48);
}

.ann-k-title {
  margin: 2px 0 0;
  font-size: 1.06rem;
  font-weight: 800;
  line-height: 1.3;
  color: var(--w-ink);
}

.ann-k-meta {
  margin: 0;
  font-size: 0.82rem;
  color: var(--w-body);
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
  font-size: 0.84rem;
  font-weight: 800;
  color: var(--w-emerald);
}

.wa-rich :deep(.wa-line) { min-height: 1.15em; }
.wa-rich :deep(.wa-gap) { height: 6px; }
.wa-rich :deep(.wa-quote) {
  margin: 2px 0;
  padding: 4px 8px;
  border: 1px solid rgba(10, 92, 64, 0.16);
  border-radius: 7px;
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
