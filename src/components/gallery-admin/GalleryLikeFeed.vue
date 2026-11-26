<template>
  <section class="glf" :aria-busy="loading">
    <div class="glf-filters">
      <div class="gm-chips" role="group" aria-label="Saring yang menyukai">
        <button
          v-for="f in FILTERS"
          :key="f.id"
          type="button"
          class="gm-chip"
          :class="{ 'is-active': kind === f.id }"
          :aria-pressed="kind === f.id"
          @click="kind = f.id"
        >
          {{ f.label }} <span class="gm-chip-n">{{ kindCount(f.id) }}</span>
        </button>
      </div>
      <input v-model="search" type="search" class="gm-input" placeholder="Cari nama, IP, kota, perangkat…" aria-label="Cari suka" />
    </div>

    <div v-if="loading && !likes.length" class="glf-skel-wrap" aria-label="Memuat daftar suka">
      <div v-for="n in 3" :key="n" class="glf-skel"></div>
    </div>
    <div v-else-if="loadError" class="glf-empty" role="alert">
      <p>{{ loadError }}</p>
      <button type="button" class="gm-btn is-secondary" @click="load">Coba lagi</button>
    </div>
    <template v-else>
      <p v-if="!likes.length && !legacy" class="glf-empty">
        {{ momentId ? 'Belum ada yang menyukai momen ini.' : 'Belum ada suka yang tercatat.' }}
      </p>
      <p v-else-if="likes.length && !shown.length" class="glf-empty">Tidak ada yang cocok dengan pilihan ini.</p>

      <ul v-if="visible.length" class="glf-list">
        <li v-for="l in visible" :key="l.id" class="glf-row">
          <span class="glf-avatar" :class="`is-${l.who.kind}`" aria-hidden="true">
            {{ l.who.kind === 'anon' ? '?' : initialOf(l.who.name) }}
          </span>
          <div class="glf-main">
            <div class="glf-top">
              <strong>{{ l.who.name }}</strong>
              <span class="glf-role" :class="`is-${l.who.kind}`">{{ l.who.roleLabel }}</span>
              <time :datetime="l.createdAt" :title="fullTime(l.createdAt)">{{ timeAgo(l.createdAt) }}</time>
            </div>

            <p v-if="l.who.kind === 'wali' && l.who.children.length" class="glf-kids">
              Wali dari
              <template v-for="(c, i) in l.who.children" :key="`${l.id}-${i}`">
                <span v-if="i">, </span><strong>{{ c.name }}</strong><span v-if="c.classLabel"> ({{ c.classLabel }})</span>
              </template>
            </p>
            <p v-else-if="l.who.kind === 'wali'" class="glf-kids">Belum tertaut ke santri</p>
            <a
              v-if="l.who.phone"
              class="glf-phone"
              :href="`https://wa.me/${l.who.phone}`"
              target="_blank"
              rel="noopener noreferrer"
            >WhatsApp {{ prettyPhone(l.who.phone) }} ↗</a>

            <ul class="glf-facts">
              <li :title="'Perkiraan dari jaringan internet, bisa meleset'">
                <span aria-hidden="true">📍</span>
                {{ l.place ? `Perkiraan: ${l.place}` : 'Lokasi tidak terbaca' }}
              </li>
              <li>
                <span aria-hidden="true">📱</span>
                {{ l.device || 'Perangkat tidak dikenal' }}<span v-if="l.deviceTag" class="glf-tag"> · #{{ l.deviceTag }}</span>
              </li>
              <li>
                <span aria-hidden="true">🌐</span>
                <template v-if="l.ip">
                  IP <code>{{ l.ip }}</code>
                  <button type="button" class="glf-copy" :aria-label="`Salin IP ${l.ip}`" @click="copyIp(l.ip)">Salin</button>
                </template>
                <template v-else>{{ isOld(l) ? 'IP sudah dihapus otomatis (lebih dari 90 hari)' : 'IP tidak terbaca' }}</template>
              </li>
            </ul>

            <p v-if="l.sameNetwork > 1" class="glf-hint">
              {{ l.sameNetwork }} suka di momen ini datang dari jaringan yang sama (satu Wi-Fi, atau alamat bersama operator seluler).
            </p>
            <p v-if="l.claimed" class="glf-note">Disukai sebelum login, lalu dikenali saat orangnya login.</p>

            <details v-if="l.userAgent" class="glf-ua">
              <summary>Detail perangkat</summary>
              <code>{{ l.userAgent }}</code>
            </details>

            <router-link v-if="!momentId" class="glf-moment" :to="`/dashboard/dokumentasi/${encodeURIComponent(l.momentId)}?tab=suka`">
              📷 {{ momentTitle(l.momentId) }}
            </router-link>
          </div>
        </li>
      </ul>

      <button v-if="hidden > 0" type="button" class="gm-btn is-secondary glf-more" @click="limit += PAGE">
        Muat {{ Math.min(PAGE, hidden) }} lagi
      </button>

      <p v-if="legacy > 0 && kind === 'all' && !search.trim()" class="glf-legacy">
        ♥ {{ legacy }} suka diberikan sebelum pencatatan dimulai, jadi tidak ada rinciannya.
      </p>
    </template>

    <p class="glf-foot">
      Lokasi adalah perkiraan dari jaringan internet: data seluler sering terbaca kota lain (mis. Surabaya atau Jakarta).
      IP dan detail perangkat terhapus otomatis setelah 90 hari. Data ini hanya untuk admin.
    </p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { commentTimeAgo, commentInitial } from '@/utils/galleryComments'
import '@/styles/gallery-admin.css'

// momentId: one moment, or '' for the newest likes on every moment. likesTotal: the moment's ♥ count (or the sum of
// all moments) — what is not in the list was liked before the recording started.
const props = defineProps({
  momentId: { type: String, default: '' },
  moments: { type: Array, default: () => [] },
  likesTotal: { type: Number, default: 0 },
})
const emit = defineEmits(['loaded'])

const PAGE = 30
const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'wali', label: 'Wali' },
  { id: 'staff', label: 'Pengurus' },
  { id: 'anon', label: 'Tanpa login' },
]
const OLD_MS = 90 * 24 * 3600 * 1000

const { success, error: showError } = useToast()

const likes = ref([])
const total = ref(0)
const loading = ref(true)
const loadError = ref('')
const kind = ref('all')
const search = ref('')
const limit = ref(PAGE)

const initialOf = commentInitial
const timeAgo = (iso) => commentTimeAgo(iso, Date.now())
const fullTime = (iso) =>
  new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
const isOld = (l) => Date.now() - Date.parse(l.createdAt) > OLD_MS
const prettyPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '')
  const local = d.startsWith('62') ? `0${d.slice(2)}` : d
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3')
}

const momentById = computed(() => new Map(props.moments.map((m) => [m.id, m])))
const momentTitle = (id) => momentById.value.get(id)?.title || 'Momen sudah dihapus'
const legacy = computed(() => Math.max(0, props.likesTotal - total.value))

const matchKind = (l, k) =>
  k === 'all' || (k === 'staff' ? l.who.kind === 'guru' || l.who.kind === 'admin' : l.who.kind === k)
const kindCount = (k) => likes.value.filter((l) => matchKind(l, k)).length

const shown = computed(() => {
  const q = search.value.trim().toLowerCase()
  return likes.value
    .filter((l) => matchKind(l, kind.value))
    .filter((l) => {
      if (!q) return true
      const hay = [
        l.who.name,
        l.who.phone,
        ...(l.who.children || []).map((c) => c.name),
        l.ip,
        l.place,
        l.device,
        l.deviceTag,
        props.momentId ? '' : momentTitle(l.momentId),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
})
const visible = computed(() => shown.value.slice(0, limit.value))
const hidden = computed(() => shown.value.length - visible.value.length)

watch([kind, search], () => {
  limit.value = PAGE
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/gallery/manage/likes', {
      params: props.momentId ? { momentId: props.momentId } : {},
      cache: false,
    })
    likes.value = Array.isArray(data?.likes) ? data.likes : []
    total.value = Number(data?.total || 0)
    emit('loaded', { total: total.value, counts: data?.counts || {} })
  } catch (err) {
    loadError.value =
      err.response?.status === 403
        ? 'Daftar suka hanya untuk admin.'
        : err.response?.data?.error || 'Daftar suka belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

async function copyIp(ip) {
  try {
    await navigator.clipboard.writeText(ip)
    success('IP disalin')
  } catch {
    showError('Gagal menyalin IP.')
  }
}

watch(
  () => props.momentId,
  () => {
    limit.value = PAGE
    load()
  },
)
onMounted(load)

defineExpose({ load })
</script>

<style scoped>
.glf-filters {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
}
@media (min-width: 720px) {
  .glf-filters {
    grid-template-columns: auto minmax(0, 280px);
    justify-content: space-between;
    align-items: center;
  }
}
.glf-filters .gm-input {
  font-size: 16px;
}
@media (min-width: 640px) {
  .glf-filters .gm-input {
    font-size: 0.9rem;
  }
}
.glf-empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  margin: 0 0 12px;
  padding: 28px 16px;
  border: 1px dashed rgba(11, 59, 42, 0.22);
  border-radius: 16px;
  background: #fff;
  color: #5b6b62;
  text-align: center;
}
.glf-empty p {
  margin: 0;
}
.glf-skel-wrap {
  display: grid;
  gap: 10px;
}
.glf-skel {
  height: 110px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f1f5f2 25%, #e7efe9 50%, #f1f5f2 75%);
  background-size: 200% 100%;
  animation: glf-shimmer 1.2s infinite linear;
}
@keyframes glf-shimmer {
  to {
    background-position: -200% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .glf-skel {
    animation: none;
  }
}
.glf-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.glf-row {
  display: flex;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgba(11, 59, 42, 0.12);
  border-radius: 16px;
  background: #fff;
}
.glf-main {
  flex: 1;
  min-width: 0;
}
.glf-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-weight: 800;
  font-size: 0.9rem;
}
.glf-avatar.is-wali {
  background: #fdf2e5;
  color: #8a4210;
}
.glf-avatar.is-guru,
.glf-avatar.is-admin {
  background: #0a5c40;
  color: #fde68a;
}
.glf-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  font-size: 0.8rem;
  color: #5b6b62;
}
.glf-top strong {
  color: #0b3b2a;
  font-size: 0.94rem;
  overflow-wrap: anywhere;
}
.glf-role {
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.7rem;
  font-weight: 800;
}
.glf-role.is-wali {
  background: #fdf2e5;
  color: #8a4210;
}
.glf-role.is-guru,
.glf-role.is-admin {
  background: #e7f1ec;
  color: #053d2c;
}
.glf-kids {
  margin: 4px 0 0;
  font-size: 0.84rem;
  color: #1f2a24;
  line-height: 1.45;
}
.glf-kids strong {
  color: #0b3b2a;
}
.glf-phone {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #0a5c40;
  text-decoration: none;
}
.glf-phone:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.glf-facts {
  display: grid;
  gap: 3px;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.82rem;
  color: #475a50;
}
.glf-facts li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.glf-facts code {
  padding: 1px 6px;
  border-radius: 6px;
  background: #f3f7f4;
  color: #0b3b2a;
  font-size: 0.8rem;
  overflow-wrap: anywhere;
}
.glf-tag {
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
}
.glf-copy {
  min-height: 28px;
  padding: 0 8px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  border-radius: 8px;
  background: #fff;
  color: #0a5c40;
  font: inherit;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
}
.glf-hint {
  margin: 8px 0 0;
  padding: 6px 10px;
  border-radius: 10px;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.78rem;
  line-height: 1.4;
}
.glf-note {
  margin: 6px 0 0;
  font-size: 0.78rem;
  color: #5b6b62;
}
.glf-ua {
  margin-top: 6px;
  font-size: 0.78rem;
  color: #5b6b62;
}
.glf-ua summary {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  cursor: pointer;
  font-weight: 700;
  color: #0a5c40;
}
.glf-ua code {
  display: block;
  padding: 8px;
  border-radius: 8px;
  background: #f3f7f4;
  overflow-wrap: anywhere;
  font-size: 0.74rem;
}
.glf-moment {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  margin-top: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #0a5c40;
  text-decoration: none;
  overflow-wrap: anywhere;
}
.glf-moment:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.glf-more {
  width: 100%;
  margin-top: 12px;
}
.glf-legacy {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff1f2;
  color: #9f1239;
  font-size: 0.84rem;
  font-weight: 600;
}
.glf-foot {
  margin: 14px 0 0;
  font-size: 0.76rem;
  line-height: 1.5;
  color: #5b6b62;
}
</style>
