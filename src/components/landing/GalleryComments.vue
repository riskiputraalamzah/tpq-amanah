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
        <li v-for="c in shown" :key="c.id" class="flex gap-3 p-4 lp-card">
          <span class="gc-avatar" :class="`is-${c.authorRole}`" aria-hidden="true">{{ initialOf(c.authorName) }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <strong class="text-sm lp-ink">{{ c.authorName }}</strong>
              <span v-if="c.roleLabel" class="gc-role" :class="`is-${c.authorRole}`">{{ c.roleLabel }}</span>
              <time class="text-xs text-slate-500" :datetime="c.createdAt" :title="fullTime(c.createdAt)">{{ timeAgo(c.createdAt) }}</time>
            </div>
            <p class="mt-1 text-[0.95rem] leading-relaxed text-slate-800 whitespace-pre-line break-words">{{ c.text }}</p>
            <button
              v-if="c.canDelete"
              type="button"
              class="mt-1 text-xs font-bold text-red-700 min-h-[32px] hover:underline underline-offset-4"
              :disabled="deleting === c.id"
              @click="remove(c)"
            >
              {{ deleting === c.id ? 'Menghapus…' : c.mine ? 'Hapus komentar saya' : 'Hapus' }}
            </button>
          </div>
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

const comments = ref([]) // newest first
const total = ref(0)
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

const shown = computed(() => (showAll.value ? comments.value : comments.value.slice(0, FIRST_SHOWN)))
const hiddenCount = computed(() => comments.value.length - shown.value.length)

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
    comments.value = [...(data.comments || [])].reverse()
    total.value = Number(data.total || comments.value.length)
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
    comments.value = [result.data.comment, ...comments.value]
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
    message: c.mine ? 'Komentar Anda akan hilang dari halaman ini.' : `Komentar dari ${c.authorName} akan hilang dari halaman ini.`,
    tone: 'danger',
    confirmText: 'Hapus',
  })
  if (!ok) return
  deleting.value = c.id
  try {
    await api.delete(`/gallery/comments/${encodeURIComponent(c.id)}`)
    comments.value = comments.value.filter((x) => x.id !== c.id)
    total.value = Math.max(0, total.value - 1)
    toast.success('Komentar dihapus')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Komentar belum terhapus.')
  } finally {
    deleting.value = ''
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
