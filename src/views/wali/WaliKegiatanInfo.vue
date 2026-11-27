<template>
  <div>
    <router-link :to="backTo" class="w-back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
      {{ backLabel }}
    </router-link>

    <PageSkeleton v-if="loading && !data" :rows="4" label="Memuat info kegiatan" />
    <p v-else-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else-if="data">
      <div class="w-card ki-head-card">
        <div class="ki-head-top">
          <div class="ki-head-text">
            <h1 class="w-title ki-title">{{ data.activity.title }}</h1>
            <p class="ki-sub">
              {{ data.activity.typeLabel }}<template v-if="data.activity.date"> · {{ dayLabel(data.activity.date) }}</template>
            </p>
          </div>
          <span class="w-pill" :class="`is-${data.activity.closed ? 'idle' : (STATUS_TONE[data.activity.status] || 'info')}`">
            {{ data.activity.closed ? 'Selesai' : data.activity.statusLabel }}
          </span>
        </div>
        <p class="ki-child">
          Ananda: <strong>{{ data.santri.name }}</strong>
          <span class="ki-level">{{ levelName(data.santri.classId) }}</span>
        </p>
        <p v-if="data.activity.description" class="ki-desc">{{ data.activity.description }}</p>
        <router-link :to="`/wali/santri/${route.params.santriId}/kegiatan`" class="ki-status-link">
          <span>Lihat pembayaran &amp; persyaratan kegiatan</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
        </router-link>
      </div>

      <div class="w-section-head">
        <h2 class="w-section-title">Info &amp; pengumuman kegiatan</h2>
        <span v-if="data.updates.length" class="ki-count">{{ data.updates.length }} info</span>
      </div>

      <div v-if="!data.updates.length" class="w-card w-center">
        <p class="w-help">Belum ada info tambahan untuk kegiatan ini.</p>
      </div>

      <ol v-else class="ki-list">
        <li
          v-for="(u, idx) in data.updates"
          :key="u.id"
          class="w-card ki-item"
          :class="{ 'is-highlight': highlightId === u.id, 'is-latest': idx === 0 }"
        >
          <div class="ki-meta">
            <span v-if="idx === 0" class="w-pill is-ok">Terbaru</span>
            <span class="ki-time">{{ formatWibDateTime(u.createdAt) }}</span>
            <span v-if="u.createdByName" class="ki-author">· {{ u.createdByName }}</span>
          </div>

          <div class="ki-body wa-rich" v-html="renderWaMarkdownHtml(u.body)"></div>

          <div v-if="normalizeWaPhone(u.contactPhone)" class="ki-contact">
            <span class="w-help">Ada hal yang kurang jelas? Hubungi langsung pengajar:</span>
            <a
              :href="`https://wa.me/${normalizeWaPhone(u.contactPhone)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="ki-wa-btn"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z" /></svg>
              <span>Hubungi {{ u.contactName || 'Ustadz/ustadzah' }} ({{ formatLocalPhone(u.contactPhone) }})</span>
            </a>
          </div>
        </li>
      </ol>

      <p class="w-help ki-foot">Urutan dari info paling terbaru di atas. Halaman ini bersifat satu arah (hanya baca).</p>
    </template>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useWaliAnnouncements } from '@/composables/useWaliAnnouncements'
import { STATUS_TONE, dayLabel } from '@/utils/kegiatan'
import { formatLocalPhone, formatWibDateTime, normalizeWaPhone, renderWaMarkdownHtml } from '@/utils/waFormat'
import { useWaliResource } from '@/composables/useWaliResource'
import { WALI_KEYS, waliFetch } from '@/utils/waliData'

const route = useRoute()
const { markSeen } = useWaliAnnouncements()

// shown at once from the last visit, refreshed in the background (utils/waliCache.js)
const santriId = route.params.santriId
const activityId = route.params.activityId
const res = useWaliResource(() => WALI_KEYS.kegiatanInfo(santriId, activityId), () => waliFetch.kegiatanInfo(santriId, activityId))
const data = computed(() => res.data.value)
const loading = computed(() => res.loading.value)
const loadError = computed(() => res.error.value)
// the updates shown are read: the Pengumuman badge goes down
watch(
  () => res.data.value?.updates,
  (updates) => (updates || []).forEach((u) => markSeen(`kegiatan_${u.id}`)),
  { immediate: true },
)

const highlightId = computed(() => String(route.query.highlight || ''))
const fromPengumuman = computed(() => route.query.from === 'pengumuman')
const backTo = computed(() => (fromPengumuman.value ? '/wali/pengumuman' : `/wali/santri/${route.params.santriId}/kegiatan`))
const backLabel = computed(() => (fromPengumuman.value ? 'Pengumuman' : 'Kegiatan & tabungan'))
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
</script>

<style scoped>
.ki-head-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ki-head-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.ki-head-text {
  min-width: 0;
}

.ki-title {
  margin: 0;
  font-size: 1.28rem;
}

.ki-sub,
.ki-desc {
  margin: 2px 0 0;
  font-size: 0.88rem;
  color: var(--w-body);
  line-height: 1.5;
}

.ki-child {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 0.88rem;
  color: var(--w-body);
}

.ki-level {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--w-emerald-soft);
  color: var(--w-emerald);
  font-size: 0.74rem;
  font-weight: 800;
}

.ki-status-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
  color: var(--w-emerald);
  font-size: 0.86rem;
  font-weight: 800;
  text-decoration: none;
}

.ki-status-link:focus-visible,
.ki-wa-btn:focus-visible {
  outline: 3px solid var(--w-gold-deep);
  outline-offset: 2px;
}

.ki-count {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--w-muted);
}

.ki-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.ki-item {
  display: grid;
  gap: 10px;
  margin: 0;
}

.ki-item.is-latest {
  border-color: rgba(10, 92, 64, 0.28);
  background: linear-gradient(160deg, #ffffff, #f4faf6);
}

.ki-item.is-highlight {
  border-color: var(--w-emerald);
  box-shadow: 0 0 0 2px rgba(10, 92, 64, 0.14);
}

.ki-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--w-muted);
}

.ki-time {
  font-weight: 700;
  color: var(--w-ink);
}

.ki-body {
  font-size: 0.94rem;
  line-height: 1.6;
  color: #163024;
  overflow-wrap: anywhere;
}

.ki-contact {
  display: grid;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px dashed rgba(11, 59, 42, 0.16);
}

.ki-wa-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 8px 14px;
  border-radius: 12px;
  background: var(--w-emerald-soft);
  border: 1px solid rgba(10, 92, 64, 0.26);
  color: var(--w-emerald);
  font-size: 0.87rem;
  font-weight: 700;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.15s ease;
}

.ki-wa-btn:hover {
  background: #d5ebdf;
}

.ki-wa-btn svg {
  flex: none;
}

.ki-foot {
  display: block;
  margin-top: 14px;
  text-align: center;
}

.wa-rich :deep(.wa-line) { min-height: 1.2em; }
.wa-rich :deep(.wa-gap) { height: 8px; }
.wa-rich :deep(.wa-quote) {
  margin: 4px 0;
  padding: 6px 10px;
  border: 1px solid rgba(10, 92, 64, 0.18);
  border-radius: 8px;
  background: rgba(10, 92, 64, 0.06);
}
.wa-rich :deep(.wa-li) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.wa-rich :deep(.wa-li-mark) {
  flex: none;
  font-weight: 700;
}
.wa-rich :deep(.wa-mono) {
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(11, 59, 42, 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85em;
}
.wa-rich :deep(.wa-link) {
  color: #027eb5;
  text-decoration: underline;
}
</style>
