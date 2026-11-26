<template>
  <section class="gcf" :aria-busy="loading">
    <div class="gcf-filters" :class="{ 'is-one': !!momentId }">
      <select v-if="!momentId" v-model="momentFilter" class="gm-input" aria-label="Pilih momen">
        <option value="all">Semua momen ({{ list.length }})</option>
        <option v-for="m in momentsWithComments" :key="m.id" :value="m.id">{{ m.title }} ({{ countFor(m.id) }})</option>
      </select>
      <input v-model="search" type="search" class="gm-input" placeholder="Cari isi komentar atau nama…" aria-label="Cari komentar" />
      <button
        v-if="flaggedCount"
        type="button"
        class="gm-chip gcf-flag-toggle"
        :class="{ 'is-active': onlyFlagged }"
        :aria-pressed="onlyFlagged"
        @click="onlyFlagged = !onlyFlagged"
      >
        ⚠ Perlu dicek <span class="gm-chip-n">{{ flaggedCount }}</span>
      </button>
    </div>

    <div v-if="loading && !list.length" class="gcf-skel-wrap" aria-label="Memuat komentar">
      <div v-for="n in 3" :key="n" class="gcf-skel"></div>
    </div>
    <div v-else-if="loadError" class="gcf-empty" role="alert">
      <p>{{ loadError }}</p>
      <button type="button" class="gm-btn is-secondary" @click="load">Coba lagi</button>
    </div>
    <p v-else-if="!list.length" class="gcf-empty">
      {{ momentId ? 'Belum ada komentar di momen ini.' : 'Belum ada komentar di dokumentasi mana pun.' }}
    </p>
    <p v-else-if="!threads.length" class="gcf-empty">Tidak ada komentar yang cocok dengan pilihan ini.</p>

    <ul v-else class="gcf-list">
      <li v-for="t in visibleThreads" :key="t.id" class="gcf-thread" :class="{ 'is-flagged': t.flagged }">
        <article v-if="t.root" class="gcf-item">
          <span class="gcf-avatar" :class="`is-${t.root.authorRole}`" aria-hidden="true">{{ initialOf(t.root.authorName) }}</span>
          <div class="gcf-main">
            <div class="gcf-top">
              <strong>{{ t.root.authorName }}</strong>
              <span v-if="t.root.roleLabel && t.root.roleLabel !== t.root.authorName" class="gcf-role" :class="`is-${t.root.authorRole}`">{{ t.root.roleLabel }}</span>
              <time :datetime="t.root.createdAt" :title="fullTime(t.root.createdAt)">{{ timeAgo(t.root.createdAt) }}</time>
              <span v-if="isNew(t.root)" class="gcf-new">Baru</span>
              <span v-if="t.root.flagged" class="gcf-flag">⚠ Perlu dicek</span>
            </div>
            <p class="gcf-text">{{ t.root.text }}</p>
            <div class="gcf-acts">
              <button type="button" class="gcf-link" @click="startReply(t, t.root)">Balas</button>
              <button type="button" class="gcf-link is-danger" :disabled="deletingId === t.root.id" @click="remove(t.root, t)">
                {{ deletingId === t.root.id ? 'Menghapus…' : 'Hapus' }}
              </button>
            </div>
          </div>
        </article>
        <p v-else class="gcf-orphan">Komentar awal di luar daftar ini</p>

        <ul v-if="t.replies.length" class="gcf-replies">
          <li v-for="r in t.replies" :key="r.id" class="gcf-item is-reply" :class="{ 'is-flagged': r.flagged }">
            <span class="gcf-avatar is-sm" :class="`is-${r.authorRole}`" aria-hidden="true">{{ initialOf(r.authorName) }}</span>
            <div class="gcf-main">
              <div class="gcf-top">
                <strong>{{ r.authorName }}</strong>
                <span v-if="r.roleLabel && r.roleLabel !== r.authorName" class="gcf-role" :class="`is-${r.authorRole}`">{{ r.roleLabel }}</span>
                <time :datetime="r.createdAt" :title="fullTime(r.createdAt)">{{ timeAgo(r.createdAt) }}</time>
                <span v-if="isNew(r)" class="gcf-new">Baru</span>
                <span v-if="r.flagged" class="gcf-flag">⚠ Perlu dicek</span>
              </div>
              <p v-if="r.replyToName" class="gcf-to">↳ membalas {{ r.replyToName }}</p>
              <p class="gcf-text">{{ r.text }}</p>
              <div class="gcf-acts">
                <button type="button" class="gcf-link" @click="startReply(t, r)">Balas</button>
                <button type="button" class="gcf-link is-danger" :disabled="deletingId === r.id" @click="remove(r, t)">
                  {{ deletingId === r.id ? 'Menghapus…' : 'Hapus' }}
                </button>
              </div>
            </div>
          </li>
        </ul>

        <form v-if="replyFor?.threadId === t.id" class="gcf-reply" @submit.prevent="sendReply">
          <label :for="`gcf-r-${t.id}`" class="gcf-reply-lbl">
            Membalas <strong>{{ replyFor.name }}</strong> · tampil di halaman dokumentasi
          </label>
          <textarea
            :id="`gcf-r-${t.id}`"
            ref="replyRef"
            v-model="replyText"
            class="gm-input gcf-reply-input"
            rows="3"
            :maxlength="MAX"
            placeholder="Tulis balasan…"
            :disabled="sending"
            @keydown.ctrl.enter.prevent="sendReply"
            @keydown.meta.enter.prevent="sendReply"
            @keydown.esc.prevent="cancelReply"
          ></textarea>
          <div class="gcf-reply-foot">
            <span class="gcf-count" :class="{ 'is-near': replyText.length > MAX - 50 }">{{ replyText.length }}/{{ MAX }}</span>
            <button type="button" class="gm-btn is-ghost gm-btn-sm" :disabled="sending" @click="cancelReply">Batal</button>
            <button type="submit" class="gm-btn is-primary gm-btn-sm" :disabled="sending || !replyText.trim()">
              {{ sending ? 'Mengirim…' : 'Kirim balasan' }}
            </button>
          </div>
          <p v-if="replyError" class="gcf-err" role="alert">{{ replyError }}</p>
        </form>

        <div v-if="!momentId" class="gcf-moment">
          <router-link :to="`/dashboard/dokumentasi/${encodeURIComponent(t.momentId)}`">📷 {{ momentTitle(t.momentId) }}</router-link>
        </div>
      </li>
    </ul>

    <button v-if="hiddenThreads > 0" type="button" class="gm-btn is-secondary gcf-more" @click="limit += PAGE">
      Muat {{ Math.min(PAGE, hiddenThreads) }} percakapan lagi
    </button>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { commentTimeAgo, commentInitial } from '@/utils/galleryComments'
import '@/styles/gallery-admin.css'

// momentId: one moment (its detail page) or '' for every moment (the Komentar tab)
// moments: the list from /gallery/manage (titles + the moment filter); seenAt: comments after it are "Baru"
const props = defineProps({
  momentId: { type: String, default: '' },
  moments: { type: Array, default: () => [] },
  seenAt: { type: Number, default: 0 },
})
const emit = defineEmits(['loaded', 'changed'])

const MAX = 500
const PAGE = 15

const { success, error: showError } = useToast()
const { ask } = useDialog()

const list = ref([]) // newest first, comments and replies together
const loading = ref(true)
const loadError = ref('')
const momentFilter = ref('all')
const search = ref('')
const onlyFlagged = ref(false)
const limit = ref(PAGE)
const deletingId = ref('')
const replyFor = ref(null) // { threadId, targetId, name }
const replyText = ref('')
const replyError = ref('')
const sending = ref(false)
const replyRef = ref(null)

const initialOf = commentInitial
const timeAgo = (iso) => commentTimeAgo(iso, Date.now())
const fullTime = (iso) =>
  new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
const isNew = (c) => !c.mine && Date.parse(c.createdAt) > props.seenAt
const at = (c) => Date.parse(c?.createdAt) || 0

const momentById = computed(() => new Map(props.moments.map((m) => [m.id, m])))
const momentTitle = (id) => momentById.value.get(id)?.title || 'Momen sudah dihapus'
const counts = computed(() => {
  const out = {}
  for (const c of list.value) out[c.momentId] = (out[c.momentId] || 0) + 1
  return out
})
const countFor = (id) => counts.value[id] || 0
const momentsWithComments = computed(() => props.moments.filter((m) => counts.value[m.id]))
const flaggedCount = computed(() => list.value.filter((c) => c.flagged).length)

// one thread = a comment and its replies (oldest reply first); the thread with the latest activity on top
const allThreads = computed(() => {
  const byId = new Map(list.value.map((c) => [c.id, c]))
  const map = new Map()
  for (const c of list.value) {
    const rootId = c.parentId || c.id
    if (!map.has(rootId)) map.set(rootId, { id: rootId, root: byId.get(rootId) || null, replies: [], momentId: c.momentId })
    if (c.parentId) map.get(rootId).replies.push(c)
  }
  return [...map.values()]
    .map((t) => {
      const items = [t.root, ...t.replies].filter(Boolean)
      return {
        ...t,
        replies: [...t.replies].sort((a, b) => at(a) - at(b)),
        items,
        lastAt: Math.max(...items.map(at)),
        flagged: items.some((c) => c.flagged),
      }
    })
    .sort((a, b) => b.lastAt - a.lastAt)
})

const threads = computed(() => {
  const q = search.value.trim().toLowerCase()
  return allThreads.value
    .filter((t) => momentFilter.value === 'all' || t.momentId === momentFilter.value)
    .filter((t) => !onlyFlagged.value || t.flagged)
    .filter(
      (t) =>
        !q ||
        t.items.some((c) => c.text.toLowerCase().includes(q) || String(c.authorName || '').toLowerCase().includes(q)),
    )
})
const visibleThreads = computed(() => threads.value.slice(0, limit.value))
const hiddenThreads = computed(() => threads.value.length - visibleThreads.value.length)

watch([momentFilter, search, onlyFlagged], () => {
  limit.value = PAGE
})

function report() {
  emit('loaded', { total: list.value.length, counts: counts.value, comments: list.value })
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/gallery/manage/comments', {
      params: props.momentId ? { momentId: props.momentId } : {},
      cache: false,
    })
    list.value = Array.isArray(data?.comments) ? data.comments : []
    report()
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Komentar belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

async function startReply(thread, target) {
  replyFor.value = { threadId: thread.id, targetId: target.id, name: target.authorName }
  replyError.value = ''
  await nextTick()
  const el = Array.isArray(replyRef.value) ? replyRef.value[0] : replyRef.value
  el?.focus()
  el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

function cancelReply() {
  if (sending.value) return
  replyFor.value = null
  replyText.value = ''
  replyError.value = ''
}

async function sendReply() {
  const text = replyText.value.trim()
  if (!text || sending.value || !replyFor.value) return
  sending.value = true
  replyError.value = ''
  try {
    const { data } = await api.post(`/gallery/manage/comments/${encodeURIComponent(replyFor.value.targetId)}/replies`, { text })
    list.value = [{ ...data.comment, flagged: false }, ...list.value]
    replyFor.value = null
    replyText.value = ''
    success('Balasan terkirim')
    report()
    emit('changed')
  } catch (err) {
    const status = err.response?.status
    replyError.value =
      status === 404
        ? 'Komentar ini sudah dihapus. Muat ulang daftar.'
        : err.response?.data?.error || 'Balasan belum terkirim. Coba lagi.'
  } finally {
    sending.value = false
  }
}

async function remove(c, thread) {
  const preview = c.text.length > 120 ? `${c.text.slice(0, 120)}…` : c.text
  const withReplies = !c.parentId && thread.replies.length
  const ok = await ask({
    title: c.parentId ? 'Hapus balasan ini?' : 'Hapus komentar ini?',
    message:
      `Dari ${c.authorName}: "${preview}"\n\n` +
      (withReplies ? `${thread.replies.length} balasan di bawahnya ikut terhapus. ` : '') +
      'Hilang dari halaman dokumentasi dan tidak bisa dikembalikan.',
    tone: 'danger',
    confirmText: 'Hapus',
  })
  if (!ok) return
  deletingId.value = c.id
  try {
    const { data } = await api.delete(`/gallery/comments/${encodeURIComponent(c.id)}`)
    const gone = new Set([c.id, ...(data?.removedReplies || [])])
    if (!c.parentId) for (const r of thread.replies) gone.add(r.id)
    list.value = list.value.filter((x) => !gone.has(x.id))
    if (replyFor.value && gone.has(replyFor.value.targetId)) cancelReply()
    success(c.parentId ? 'Balasan dihapus' : 'Komentar dihapus')
    report()
    emit('changed')
  } catch (err) {
    showError(err.response?.data?.error || 'Komentar belum terhapus.')
  } finally {
    deletingId.value = ''
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
.gcf-filters {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 14px;
}
@media (min-width: 720px) {
  .gcf-filters {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    align-items: center;
  }
  .gcf-filters.is-one {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
.gcf-filters .gm-input {
  font-size: 16px;
}
@media (min-width: 640px) {
  .gcf-filters .gm-input {
    font-size: 0.9rem;
  }
}
.gcf-flag-toggle {
  justify-self: start;
  min-height: 42px;
}
.gcf-empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  margin: 0;
  padding: 28px 16px;
  border: 1px dashed rgba(11, 59, 42, 0.22);
  border-radius: 16px;
  background: #fff;
  color: #5b6b62;
  text-align: center;
}
.gcf-empty p {
  margin: 0;
}
.gcf-skel-wrap {
  display: grid;
  gap: 10px;
}
.gcf-skel {
  height: 96px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f1f5f2 25%, #e7efe9 50%, #f1f5f2 75%);
  background-size: 200% 100%;
  animation: gcf-shimmer 1.2s infinite linear;
}
@keyframes gcf-shimmer {
  to {
    background-position: -200% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .gcf-skel {
    animation: none;
  }
}
.gcf-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.gcf-thread {
  padding: 14px;
  border: 1px solid rgba(11, 59, 42, 0.12);
  border-radius: 16px;
  background: #fff;
}
.gcf-thread.is-flagged {
  border-color: rgba(180, 35, 24, 0.35);
  background: #fffaf9;
}
.gcf-item {
  display: flex;
  gap: 10px;
  min-width: 0;
}
.gcf-main {
  flex: 1;
  min-width: 0;
}
.gcf-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #fdf2e5;
  color: #8a4210;
  font-weight: 800;
  font-size: 0.9rem;
}
.gcf-avatar.is-guru,
.gcf-avatar.is-admin {
  background: #0a5c40;
  color: #fde68a;
}
.gcf-avatar.is-sm {
  width: 30px;
  height: 30px;
  font-size: 0.8rem;
}
.gcf-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  font-size: 0.8rem;
  color: #5b6b62;
}
.gcf-top strong {
  color: #0b3b2a;
  font-size: 0.92rem;
}
.gcf-role {
  padding: 2px 8px;
  border-radius: 999px;
  background: #fdf2e5;
  color: #8a4210;
  font-size: 0.7rem;
  font-weight: 800;
}
.gcf-role.is-guru,
.gcf-role.is-admin {
  background: #e7f1ec;
  color: #053d2c;
}
.gcf-new {
  padding: 2px 8px;
  border-radius: 999px;
  background: #b45309;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
}
.gcf-flag {
  padding: 2px 8px;
  border-radius: 999px;
  background: #fee4e2;
  color: #b42318;
  font-size: 0.72rem;
  font-weight: 800;
}
.gcf-text {
  margin: 4px 0 2px;
  color: #1f2a24;
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.gcf-to {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #5b6b62;
}
.gcf-acts {
  display: flex;
  gap: 4px;
}
.gcf-link {
  min-height: 36px;
  padding: 0 10px;
  margin-left: -10px;
  margin-right: 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #0a5c40;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
}
.gcf-link:hover:not(:disabled) {
  background: #edf7f2;
}
.gcf-link.is-danger {
  color: #b42318;
}
.gcf-link.is-danger:hover:not(:disabled) {
  background: #fef2f2;
}
.gcf-link:disabled {
  opacity: 0.55;
  cursor: wait;
}
.gcf-orphan {
  margin: 0 0 6px;
  font-size: 0.78rem;
  color: #5b6b62;
  font-style: italic;
}
.gcf-replies {
  display: grid;
  gap: 10px;
  margin: 8px 0 0 18px;
  padding: 0 0 0 12px;
  list-style: none;
  border-left: 2px solid #d7e8df;
}
.gcf-item.is-reply.is-flagged .gcf-text {
  color: #8e1b12;
}
.gcf-reply {
  margin-top: 10px;
  padding: 12px;
  border-radius: 12px;
  background: #f6faf7;
  border: 1px solid #d7e8df;
}
.gcf-reply-lbl {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8rem;
  color: #475a50;
}
.gcf-reply-input {
  font-size: 16px;
  resize: vertical;
  min-height: 84px;
}
@media (min-width: 640px) {
  .gcf-reply-input {
    font-size: 0.9rem;
  }
}
.gcf-reply-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
.gcf-count {
  margin-right: auto;
  font-size: 0.75rem;
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
}
.gcf-count.is-near {
  color: #b45309;
  font-weight: 800;
}
.gcf-err {
  margin: 6px 0 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: #b42318;
}
.gcf-moment {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
  font-size: 0.82rem;
}
.gcf-moment a {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  font-weight: 700;
  color: #0a5c40;
  text-decoration: none;
  overflow-wrap: anywhere;
}
.gcf-moment a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.gcf-more {
  width: 100%;
  margin-top: 12px;
}
</style>
