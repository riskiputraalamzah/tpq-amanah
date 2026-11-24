<template>
  <div>
    <router-link :to="backTo" class="w-link back-link">{{ backLabel }}</router-link>

    <PageSkeleton v-if="loading && !data" :rows="4" label="Memuat info kegiatan" />
    <p v-else-if="loadError" class="w-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else-if="data">
      <div class="w-card ki-head-card">
        <div class="ki-head-top">
          <div>
            <h1 class="w-title ki-title">{{ data.activity.title }}</h1>
            <p class="ki-sub">
              {{ data.activity.typeLabel }}<template v-if="data.activity.date"> · {{ dayLabel(data.activity.date) }}</template>
            </p>
          </div>
          <span class="w-pill" :class="`is-${data.activity.closed ? 'idle' : (STATUS_TONE[data.activity.status] || 'info')}`">
            {{ data.activity.closed ? 'Selesai' : data.activity.statusLabel }}
          </span>
        </div>
        <p class="ki-child">Ananda: <strong>{{ data.santri.name }}</strong> · {{ levelName(data.santri.classId) }}</p>
        <p v-if="data.activity.description" class="ki-desc">{{ data.activity.description }}</p>
        <router-link :to="`/wali/santri/${route.params.santriId}/kegiatan`" class="ki-status-link">
          Lihat pembayaran &amp; persyaratan kegiatan ›
        </router-link>
      </div>

      <h2 class="w-section-title">
        Info &amp; pengumuman kegiatan
        <span v-if="data.updates.length" class="ki-count">({{ data.updates.length }})</span>
      </h2>

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
              Hubungi {{ u.contactName || 'Ustadz/ustadzah' }} via WhatsApp ({{ formatLocalPhone(u.contactPhone) }})
            </a>
          </div>
        </li>
      </ol>

      <p class="w-help ki-foot">Urutan dari info paling terbaru di atas. Halaman ini bersifat satu arah (hanya baca).</p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import { useWaliAnnouncements } from '@/composables/useWaliAnnouncements'
import { STATUS_TONE, dayLabel } from '@/utils/kegiatan'
import { formatLocalPhone, formatWibDateTime, normalizeWaPhone, renderWaMarkdownHtml } from '@/utils/waFormat'

const route = useRoute()
const { markSeen } = useWaliAnnouncements()

const data = ref(null)
const loading = ref(true)
const loadError = ref('')

const highlightId = computed(() => String(route.query.highlight || ''))
const fromPengumuman = computed(() => route.query.from === 'pengumuman')
const backTo = computed(() => (fromPengumuman.value ? '/wali/pengumuman' : `/wali/santri/${route.params.santriId}/kegiatan`))
const backLabel = computed(() => (fromPengumuman.value ? '← Pengumuman' : '← Kegiatan & tabungan'))
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')

onMounted(async () => {
  try {
    const res = await api.get(`/wali/santri/${route.params.santriId}/kegiatan/${route.params.activityId}/info`, { cache: false })
    data.value = res.data
    ;(res.data?.updates || []).forEach((u) => markSeen(`kegiatan_${u.id}`))
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Info kegiatan belum bisa dimuat.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.back-link {
  display: inline-block;
  margin: -4px 0 8px;
  text-decoration: none;
}

.ki-head-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.ki-head-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.ki-title {
  margin: 0;
  font-size: 1.3rem;
}

.ki-sub,
.ki-child,
.ki-desc {
  margin: 0;
  font-size: 0.9rem;
  color: #475a50;
  line-height: 1.5;
}

.ki-status-link {
  display: inline-flex;
  align-items: center;
  margin-top: 2px;
  padding-top: 8px;
  border-top: 1px solid rgba(11, 59, 42, 0.1);
  color: #0a5c40;
  font-size: 0.86rem;
  font-weight: 800;
  text-decoration: none;
}

.ki-count {
  font-weight: 700;
  color: #5b6b62;
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
  border-color: rgba(10, 92, 64, 0.32);
  background: linear-gradient(160deg, #ffffff, #f5fbf7);
}

.ki-item.is-highlight {
  border-color: #0a5c40;
  box-shadow: 0 0 0 2px rgba(10, 92, 64, 0.14);
}

.ki-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #5b6b62;
}

.ki-time {
  font-weight: 700;
  color: #0b3b2a;
}

.ki-body {
  font-size: 0.94rem;
  line-height: 1.6;
  color: #163024;
  overflow-wrap: anywhere;
}

.ki-contact {
  display: grid;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px dashed rgba(11, 59, 42, 0.15);
}

.ki-wa-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px 14px;
  border-radius: 12px;
  background: #e3f1ea;
  border: 1px solid rgba(10, 92, 64, 0.28);
  color: #0a5c40;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  text-align: center;
}

.ki-wa-btn:hover {
  background: #d2eadf;
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
  padding: 4px 10px;
  border-left: 3px solid #0a5c40;
  border-radius: 4px;
  background: rgba(10, 92, 64, 0.07);
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
