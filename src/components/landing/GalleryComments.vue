<template>
  <section id="komentar" ref="sectionRef" aria-labelledby="comments-heading" class="pt-4 border-t border-amber-700/15 gc">
    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-4">
      <h2 id="comments-heading" class="text-xl font-extrabold sm:text-2xl lp-ink">
        Komentar <span v-if="total" class="text-base font-bold text-amber-800">({{ total }})</span>
      </h2>
      <p class="text-sm text-slate-600">Ucapan, doa, dan kesan untuk momen ini.</p>
    </div>

    <!-- write: only when logged in (wali by WhatsApp code, teacher / admin by password) -->
    <form v-if="authStore.isAuthenticated" class="p-4 mb-5 lp-card sm:p-5" @submit.prevent="send">
      <label for="gc-text" class="block mb-2 text-sm font-semibold lp-ink">
        Berkomentar sebagai <strong>{{ myName }}</strong>
        <span class="gc-role" :class="`is-${authStore.user?.role}`">{{ roleLabel(authStore.user?.role) }}</span>
      </label>
      <textarea
        id="gc-text"
        ref="textRef"
        v-model="text"
        rows="3"
        :maxlength="MAX"
        placeholder="Tulis komentar…"
        class="gc-input"
        :disabled="sending"
        @keydown.ctrl.enter.prevent="send"
        @keydown.meta.enter.prevent="send"
        @input="grow"
      ></textarea>
      <div class="flex flex-wrap items-center justify-between gap-3 mt-3">
        <span class="text-xs tabular-nums" :class="text.length > MAX - 50 ? 'text-amber-800 font-bold' : 'text-slate-500'">
          {{ text.length }}/{{ MAX }}
        </span>
        <button type="submit" class="gc-send" :disabled="sending || !text.trim()">
          {{ sending ? 'Mengirim…' : 'Kirim komentar' }}
        </button>
      </div>
      <p v-if="sendError" class="mt-2 text-sm font-semibold text-red-700" role="alert">{{ sendError }}</p>
    </form>

    <div v-else class="p-4 mb-5 lp-card sm:p-5 gc-login">
      <p class="mb-1 font-bold lp-ink">Ingin ikut berkomentar?</p>
      <p class="mb-4 text-sm text-slate-600">Masuk dulu ya. Menyukai momen tetap bisa tanpa masuk.</p>
      <div class="grid gap-2 sm:grid-cols-2">
        <router-link :to="loginLink('wali')" class="w-full lp-btn-gold">Masuk sebagai Wali (kode WA)</router-link>
        <router-link :to="loginLink('staff')" class="w-full lp-btn-line">Masuk Pengajar / Admin</router-link>
      </div>
    </div>

    <!-- read: everyone -->
    <div v-if="loading" class="grid gap-3" aria-busy="true" aria-label="Memuat komentar">
      <div v-for="n in 2" :key="n" class="gc-skel"></div>
    </div>
    <div v-else-if="loadError" class="p-4 text-sm text-center lp-card" role="alert">
      <p class="mb-2 text-slate-700">{{ loadError }}</p>
      <button type="button" class="font-bold text-emerald-800 underline underline-offset-4" @click="load">Coba lagi</button>
    </div>
    <p v-else-if="!comments.length" class="p-5 text-sm text-center text-slate-600 border border-dashed rounded-2xl border-amber-700/25">
      Belum ada komentar. Jadilah yang pertama mendoakan anak-anak.
    </p>
    <template v-else>
      <ul class="grid gap-3" aria-live="polite">
        <li v-for="t in shown" :key="t.id" class="p-4 lp-card">
          <div class="flex gap-3">
            <span class="gc-avatar" :class="`is-${t.authorRole}`" aria-hidden="true">{{ initialOf(t.authorName) }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <strong class="text-sm lp-ink">{{ t.authorName }}</strong>
                <span v-if="t.roleLabel && t.roleLabel !== t.authorName" class="gc-role" :class="`is-${t.authorRole}`">{{ t.roleLabel }}</span>
                <time class="text-xs text-slate-500" :datetime="t.createdAt" :title="fullTime(t.createdAt)">{{ timeAgo(t.createdAt) }}</time>
              </div>
              <p class="mt-1 text-[0.95rem] leading-relaxed text-slate-800 whitespace-pre-line break-words">{{ t.text }}</p>
              <div class="flex flex-wrap gap-x-4">
                <button v-if="canReply" type="button" class="gc-act" @click="startReply(t, t)">Balas</button>
                <button
                  v-if="t.canDelete"
                  type="button"
                  class="gc-act is-danger"
                  :disabled="deleting === t.id"
                  @click="remove(t)"
                >
                  {{ deleting === t.id ? 'Menghapus…' : t.mine ? 'Hapus komentar saya' : 'Hapus' }}
                </button>
              </div>
            </div>
          </div>

          <!-- answers from the TPQ (admin / pengajar), oldest first -->
          <ul v-if="t.replies.length" class="gc-replies">
            <li v-for="r in t.replies" :key="r.id" class="flex gap-3">
              <span class="gc-avatar is-sm" :class="`is-${r.authorRole}`" aria-hidden="true">{{ initialOf(r.authorName) }}</span>
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <strong class="text-sm lp-ink">{{ r.authorName }}</strong>
                  <span v-if="r.roleLabel && r.roleLabel !== r.authorName" class="gc-role" :class="`is-${r.authorRole}`">{{ r.roleLabel }}</span>
                  <time class="text-xs text-slate-500" :datetime="r.createdAt" :title="fullTime(r.createdAt)">{{ timeAgo(r.createdAt) }}</time>
                </div>
                <p v-if="r.replyToName && r.replyToName !== t.authorName" class="text-xs text-slate-500">↳ membalas {{ r.replyToName }}</p>
                <p class="mt-1 text-[0.95rem] leading-relaxed text-slate-800 whitespace-pre-line break-words">{{ r.text }}</p>
                <div class="flex flex-wrap gap-x-4">
                  <button v-if="canReply" type="button" class="gc-act" @click="startReply(t, r)">Balas</button>
                  <button
                    v-if="r.canDelete"
                    type="button"
                    class="gc-act is-danger"
                    :disabled="deleting === r.id"
                    @click="remove(r)"
                  >
                    {{ deleting === r.id ? 'Menghapus…' : r.mine ? 'Hapus balasan saya' : 'Hapus' }}
                  </button>
                </div>
              </div>
            </li>
          </ul>

          <form v-if="replyFor?.threadId === t.id" class="gc-reply" @submit.prevent="sendReply">
            <label :for="`gc-r-${t.id}`" class="block mb-2 text-sm text-slate-700">
              Membalas <strong class="lp-ink">{{ replyFor.name }}</strong>
            </label>
            <textarea
              :id="`gc-r-${t.id}`"
              ref="replyRef"
              v-model="replyText"
              rows="2"
              :maxlength="MAX"
              placeholder="Tulis balasan…"
              class="gc-input"
              :disabled="replySending"
              @keydown.ctrl.enter.prevent="sendReply"
              @keydown.meta.enter.prevent="sendReply"
              @keydown.esc.prevent="cancelReply"
            ></textarea>
            <div class="flex flex-wrap items-center justify-end gap-2 mt-2">
              <button type="button" class="gc-act" :disabled="replySending" @click="cancelReply">Batal</button>
              <button type="submit" class="gc-send" :disabled="replySending || !replyText.trim()">
                {{ replySending ? 'Mengirim…' : 'Kirim balasan' }}
              </button>
            </div>
            <p v-if="replyError" class="mt-2 text-sm font-semibold text-red-700" role="alert">{{ replyError }}</p>
          </form>
        </li>
      </ul>
      <button
        v-if="hiddenCount > 0"
        type="button"
        class="w-full mt-3 lp-btn-line"
        @click="showAll = true"
      >
        Lihat {{ hiddenCount }} komentar sebelumnya
      </button>
    </template>

    <!-- likes record who / rough place / device for the admin (anti-spam); said once, plainly -->
    <p class="mt-5 text-xs leading-relaxed text-slate-500">
      Saat menyukai momen, kami mencatat perkiraan lokasi dan jenis perangkat untuk mencegah spam. Data ini hanya
      dilihat admin TPQ dan alamat IP terhapus otomatis setelah 90 hari.
    </p>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { commentTimeAgo, commentInitial } from '@/utils/galleryComments'

const props = defineProps({
  slug: { type: String, required: true },
})

const MAX = 500
const FIRST_SHOWN = 10

const route = useRoute()
const authStore = useAuthStore()
const { ask } = useDialog()
const toast = useToast()

const comments = ref([]) // as the server sends them: oldest first, comments and replies together
const total = ref(0)
const canReply = ref(false) // the admin, or a guru with the Dokumentasi access
const replyFor = ref(null) // { threadId, targetId, name }
const replyText = ref('')
const replyError = ref('')
const replySending = ref(false)
const replyRef = ref(null)
const loading = ref(true)
const loadError = ref('')
const text = ref('')
const sending = ref(false)
const sendError = ref('')
const deleting = ref('')
const showAll = ref(false)
const textRef = ref(null)
const sectionRef = ref(null)

const ROLE_LABELS = { admin: 'Admin TPQ', guru: 'Pengajar', wali: 'Wali santri' }
const roleLabel = (role) => ROLE_LABELS[role] || ''
const initialOf = commentInitial
const timeAgo = (iso) => commentTimeAgo(iso, Date.now())
const fullTime = (iso) =>
  new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })

// a wali without a name yet is "wali santri" here (their number never shows)
const myName = computed(() => {
  const u = authStore.user || {}
  if (u.role === 'wali') return u.name || 'wali santri'
  return u.displayName || u.name || roleLabel(u.role)
})

// newest comment first; its replies (answers from the TPQ) under it, oldest first
const threads = computed(() => {
  const replies = new Map()
  for (const c of comments.value) {
    if (!c.parentId) continue
    if (!replies.has(c.parentId)) replies.set(c.parentId, [])
    replies.get(c.parentId).push(c)
  }
  return comments.value
    .filter((c) => !c.parentId)
    .reverse()
    .map((c) => ({ ...c, replies: replies.get(c.id) || [] }))
})
const shown = computed(() => (showAll.value ? threads.value : threads.value.slice(0, FIRST_SHOWN)))
const hiddenCount = computed(() => threads.value.length - shown.value.length)

const momentPath = computed(() => `/dokumentasi/${encodeURIComponent(props.slug)}`)
function loginLink(kind) {
  const query = { redirect: `${momentPath.value}?komentar=1` }
  if (kind === 'wali') query.as = 'wali'
  return { path: '/login', query }
}

async function load() {
  loadError.value = ''
  try {
    const { data } = await api.get(`/gallery/public/${encodeURIComponent(props.slug)}/comments`, { cache: false })
    comments.value = Array.isArray(data.comments) ? data.comments : []
    total.value = Number(data.total || comments.value.length)
    canReply.value = Boolean(data.canReply)
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Komentar belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

function grow() {
  const el = textRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 320)}px`
}

// a wali's first comment: the name shown with it (saved on their account, asked once)
async function askWaliName() {
  const name = await ask({
    title: 'Nama yang tampil di komentar',
    message: 'Nama ini dilihat semua pengunjung. Nomor WhatsApp Anda tidak pernah ditampilkan.',
    input: { label: 'Nama Anda', placeholder: 'mis. Bunda Aisyah', required: true, maxlength: 80 },
    confirmText: 'Simpan & kirim',
  })
  if (!name) return false
  const { data } = await api.put('/wali/me', { name })
  if (authStore.user) authStore.user.name = data?.name || name
  return true
}

async function send() {
  const body = text.value.trim()
  if (!body || sending.value) return
  sending.value = true
  sendError.value = ''
  try {
    let result
    try {
      result = await api.post(`/gallery/public/${encodeURIComponent(props.slug)}/comments`, { text: body })
    } catch (err) {
      if (err.response?.data?.code !== 'NAME_REQUIRED') throw err
      if (!(await askWaliName())) return
      result = await api.post(`/gallery/public/${encodeURIComponent(props.slug)}/comments`, { text: body })
    }
    comments.value = [...comments.value, result.data.comment]
    total.value += 1
    text.value = ''
    await nextTick()
    grow()
    toast.success('Komentar terkirim')
  } catch (err) {
    const status = err.response?.status
    sendError.value =
      status === 401 ? 'Sesi masuk sudah habis. Silakan masuk lagi.' : err.response?.data?.error || 'Komentar belum terkirim. Coba lagi.'
  } finally {
    sending.value = false
  }
}

async function remove(c) {
  const ok = await ask({
    title: 'Hapus komentar?',
    message:
      (c.mine ? 'Komentar Anda akan hilang dari halaman ini.' : `Komentar dari ${c.authorName} akan hilang dari halaman ini.`) +
      (c.replies?.length ? ` ${c.replies.length} balasan di bawahnya ikut terhapus.` : ''),
    tone: 'danger',
    confirmText: 'Hapus',
  })
  if (!ok) return
  deleting.value = c.id
  try {
    await api.delete(`/gallery/comments/${encodeURIComponent(c.id)}`)
    // a comment takes its replies along
    const before = comments.value.length
    comments.value = comments.value.filter((x) => x.id !== c.id && x.parentId !== c.id)
    total.value = Math.max(0, total.value - (before - comments.value.length))
    if (replyFor.value && !comments.value.some((x) => x.id === replyFor.value.targetId)) cancelReply()
    toast.success(c.parentId ? 'Balasan dihapus' : 'Komentar dihapus')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Komentar belum terhapus.')
  } finally {
    deleting.value = ''
  }
}

// the TPQ answers a comment (admin / guru with the Dokumentasi access; the server checks it again)
async function startReply(thread, target) {
  replyFor.value = { threadId: thread.id, targetId: target.id, name: target.authorName }
  replyError.value = ''
  await nextTick()
  const el = Array.isArray(replyRef.value) ? replyRef.value[0] : replyRef.value
  el?.focus()
}

function cancelReply() {
  if (replySending.value) return
  replyFor.value = null
  replyText.value = ''
  replyError.value = ''
}

async function sendReply() {
  const body = replyText.value.trim()
  if (!body || replySending.value || !replyFor.value) return
  replySending.value = true
  replyError.value = ''
  try {
    const { data } = await api.post(`/gallery/public/${encodeURIComponent(props.slug)}/comments`, {
      text: body,
      parentId: replyFor.value.targetId,
    })
    comments.value = [...comments.value, data.comment]
    total.value += 1
    replyFor.value = null
    replyText.value = ''
    toast.success('Balasan terkirim')
  } catch (err) {
    const status = err.response?.status
    replyError.value =
      status === 401
        ? 'Sesi masuk sudah habis. Silakan masuk lagi.'
        : status === 404
          ? 'Komentar ini sudah dihapus.'
          : err.response?.data?.error || 'Balasan belum terkirim. Coba lagi.'
  } finally {
    replySending.value = false
  }
}

// back from the login page (…?komentar=1): straight to the comment box
async function focusIfAsked() {
  if (route.query.komentar !== '1' || !authStore.isAuthenticated) return
  await nextTick()
  sectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  textRef.value?.focus({ preventScroll: true })
}

// another moment opened on the same page (related moments): its own comments
watch(
  () => props.slug,
  () => {
    loading.value = true
    showAll.value = false
    comments.value = []
    replyFor.value = null
    replyText.value = ''
    load()
  },
)

// logging in / out changes who may delete what
watch(
  () => authStore.user?.uid,
  () => load(),
)

onMounted(async () => {
  await load()
  focusIfAsked()
})
</script>

<style scoped>
/* scrolled to after login: the heading stays clear of the floating navbar */
.gc {
  scroll-margin-top: 112px;
}

.gc-input {
  display: block;
  width: 100%;
  min-height: 88px;
  padding: 12px 14px;
  border: 1px solid rgba(180, 83, 9, 0.25);
  border-radius: 14px;
  background: #fff;
  font: inherit;
  font-size: 1rem; /* 16px: no zoom on iPhone */
  line-height: 1.5;
  color: #0b3b2a;
  resize: none;
}

.gc-input:focus {
  outline: 2px solid rgba(10, 92, 64, 0.35);
  outline-offset: 1px;
  border-color: #0a5c40;
}

.gc-send {
  min-height: 44px;
  padding: 0 20px;
  border: 0;
  border-radius: 12px;
  background: #0a5c40;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.gc-send:hover:not(:disabled) {
  background: #053d2c;
}

.gc-send:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.gc-send:focus-visible {
  outline: 3px solid rgba(180, 83, 9, 0.45);
  outline-offset: 2px;
}

.gc-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-weight: 800;
  background: #fbf9f3;
  border: 1px solid rgba(180, 83, 9, 0.25);
  color: #b45309;
}

.gc-avatar.is-guru,
.gc-avatar.is-admin {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fde68a;
}

.gc-avatar.is-sm {
  width: 32px;
  height: 32px;
  font-size: 0.85rem;
}

.gc-act {
  min-height: 36px;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  color: #0a5c40;
  cursor: pointer;
}

.gc-act:hover:not(:disabled) {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.gc-act.is-danger {
  color: #b42318;
}

.gc-act:disabled {
  opacity: 0.55;
}

.gc-replies {
  display: grid;
  gap: 12px;
  margin: 10px 0 0 19px;
  padding: 4px 0 0 14px;
  list-style: none;
  border-left: 2px solid rgba(10, 92, 64, 0.18);
}

.gc-reply {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  background: #fbf9f3;
  border: 1px solid rgba(180, 83, 9, 0.18);
}

.gc-reply .gc-input {
  min-height: 64px;
}

.gc-role {
  display: inline-block;
  margin-left: 2px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  background: #fdf2e5;
  color: #8a4210;
  vertical-align: middle;
}

.gc-role.is-guru,
.gc-role.is-admin {
  background: #e7f1ec;
  color: #053d2c;
}

.gc-skel {
  height: 76px;
  border-radius: 18px;
  background: linear-gradient(90deg, #f1ede3 25%, #f8f5ee 50%, #f1ede3 75%);
  background-size: 200% 100%;
  animation: gc-shimmer 1.2s infinite;
}

@keyframes gc-shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gc-skel {
    animation: none;
  }
}
</style>
