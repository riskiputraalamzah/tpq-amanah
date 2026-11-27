<template>
  <!-- Who hears of a wali's comment on WhatsApp (backend utils/gallery_comment_notices.js). Admin changes it; a guru reads it. -->
  <section class="gcn" aria-labelledby="gcn-title">
    <button type="button" class="gcn-head" :aria-expanded="open" aria-controls="gcn-body" @click="open = !open">
      <span class="gcn-ico" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </span>
      <span class="gcn-titles">
        <strong id="gcn-title">Notifikasi WhatsApp komentar</strong>
        <small>{{ summary }}</small>
      </span>
      <span class="gcn-caret" :class="{ 'is-open': open }" aria-hidden="true">›</span>
    </button>

    <div v-show="open" id="gcn-body" class="gcn-body">
      <ul class="gcn-rules">
        <li><strong>Pembuat momen</strong> (guru dengan Notifikasi WA aktif) menerima setiap komentar wali di momennya.</li>
        <li><strong>Wali</strong> yang komentarnya dibalas pengurus dikabari lewat WhatsApp.</li>
        <li>Pesan dikumpulkan <strong>3 menit</strong>, jadi komentar beruntun menjadi satu pesan. Jam tenang 21.00–06.30 tetap berlaku.</li>
      </ul>

      <p class="gcn-label" id="gcn-admin">Admin menerima</p>
      <div v-if="isAdmin" class="gm-mode-tabs" role="radiogroup" aria-labelledby="gcn-admin">
        <button
          v-for="o in OPTIONS"
          :key="o.value"
          type="button"
          role="radio"
          class="gm-mode-tab"
          :class="{ 'is-active': mode === o.value }"
          :aria-checked="mode === o.value"
          :disabled="saving || loading"
          @click="choose(o.value)"
        >
          {{ o.label }}
        </button>
      </div>
      <p v-else class="gcn-readonly">{{ current.label }}</p>
      <p class="gm-privacy-note">{{ current.hint }} Momen buatan admin, atau buatan guru yang WhatsApp-nya tidak aktif, selalu dikabarkan ke admin.</p>
      <p v-if="loadError" class="gm-error-text" role="alert">{{ loadError }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const OPTIONS = [
  { value: 'flagged', label: 'Hanya yang perlu dicek ⚠️', hint: 'Admin hanya dikabari komentar yang terlihat kasar, supaya cepat dicek.' },
  { value: 'all', label: 'Semua komentar', hint: 'Admin dikabari setiap komentar wali.' },
]

const authStore = useAuthStore()
const { success, error: showError } = useToast()
const isAdmin = computed(() => authStore.user?.role === 'admin')

const open = ref(false)
const loading = ref(true)
const saving = ref(false)
const loadError = ref('')
const mode = ref('flagged')
const current = computed(() => OPTIONS.find((o) => o.value === mode.value) || OPTIONS[0])
const summary = computed(() => `Pembuat momen: semua · Admin: ${mode.value === 'all' ? 'semua' : 'yang perlu dicek'} · Wali: saat dibalas`)

onMounted(async () => {
  try {
    const { data } = await api.get('/gallery/manage/comment-settings', { cache: false })
    if (data?.adminNotify) mode.value = data.adminNotify
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Pengaturan belum bisa dimuat.'
  } finally {
    loading.value = false
  }
})

async function choose(value) {
  if (value === mode.value || saving.value) return
  const before = mode.value
  mode.value = value
  saving.value = true
  try {
    await api.put('/gallery/manage/comment-settings', { adminNotify: value })
    success(value === 'all' ? 'Admin akan dikabari setiap komentar wali.' : 'Admin hanya dikabari komentar yang perlu dicek.')
  } catch (err) {
    mode.value = before
    showError(err.response?.data?.error || 'Pengaturan belum tersimpan.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.gcn {
  margin: 0 0 14px;
  border: 1px solid var(--line, #dfe8e2);
  border-radius: 14px;
  background: #fff;
}

.gcn-head {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 56px;
  padding: 10px 14px;
  border: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.gcn-ico {
  display: grid;
  flex: none;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #e8f3ed;
  color: #0a5c40;
}

.gcn-titles {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 2px;
}

.gcn-titles strong {
  font-size: 0.9rem;
  color: #053d2c;
}

.gcn-titles small {
  font-size: 0.76rem;
  color: var(--muted, #5b6b62);
  overflow-wrap: anywhere;
}

.gcn-caret {
  flex: none;
  font-size: 1.3rem;
  color: var(--muted, #5b6b62);
  transition: transform 0.2s ease;
}

.gcn-caret.is-open {
  transform: rotate(90deg);
}

.gcn-body {
  display: grid;
  gap: 8px;
  padding: 0 14px 14px;
}

.gcn-rules {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-left: 18px;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--body, #33443b);
}

.gcn-label {
  margin: 4px 0 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #053d2c;
}

.gcn-readonly {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0a5c40;
}

@media (prefers-reduced-motion: reduce) {
  .gcn-caret {
    transition: none;
  }
}
</style>
