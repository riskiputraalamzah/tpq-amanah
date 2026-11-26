<template>
  <div class="hw">
    <header class="hw-head">
      <h1>Hubungi Wali</h1>
      <p>Chat WhatsApp orang tua santri langsung dari HP Antum. Pesan dikirim dari nomor Antum sendiri.</p>
    </header>

    <!-- whose santri these are (a guru sees the jilid they look after) -->
    <p v-if="scope && scope.source === 'none'" class="hw-note is-warn" role="status">
      Jilid yang Antum ampu belum diatur admin dan belum ada riwayat KBM. Minta admin mengaturnya di menu Kelola Pengajar.
    </p>
    <p v-else-if="scope && scope.source === 'feature'" class="hw-note">Antum diberi akses ke <strong>semua jilid</strong>.</p>
    <p v-else-if="scope && !isAdmin && scopeLabel" class="hw-note">
      Jilid Antum: <strong>{{ scopeLabel }}</strong><template v-if="scope.source === 'kbm'"> (dari riwayat KBM 60 hari terakhir)</template>.
    </p>

    <div class="hw-tools">
      <label class="hw-search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input v-model.trim="query" type="search" inputmode="search" placeholder="Cari nama santri, wali, atau nomor" aria-label="Cari santri atau wali" />
        <button v-if="query" type="button" class="hw-clear" aria-label="Hapus pencarian" @click="query = ''">×</button>
      </label>

      <div v-if="jilidOptions.length > 1" class="hw-chips" role="tablist" aria-label="Pilih jilid">
        <button type="button" role="tab" :aria-selected="jilid === ''" :class="{ 'is-on': jilid === '' }" @click="pickJilid('')">
          Semua <span>{{ santri.length }}</span>
        </button>
        <button
          v-for="opt in jilidOptions"
          :key="opt.id"
          type="button"
          role="tab"
          :aria-selected="jilid === opt.id"
          :class="{ 'is-on': jilid === opt.id }"
          @click="pickJilid(opt.id)"
        >
          {{ opt.label }} <span>{{ opt.count }}</span>
        </button>
      </div>

      <div v-if="loaded && santri.length" class="hw-meta">
        <span><strong>{{ inView.withContact }}</strong> dari {{ inView.total }} santri punya nomor wali</span>
        <button v-if="inView.total - inView.withContact > 0" type="button" class="hw-toggle" :aria-pressed="onlyMissing" @click="onlyMissing = !onlyMissing">
          {{ onlyMissing ? 'Tampilkan semua' : `Lihat ${inView.total - inView.withContact} yang belum ada nomor` }}
        </button>
      </div>
    </div>

    <!-- loading / error / empty -->
    <div v-if="!loaded && !error" class="hw-list" aria-busy="true" aria-label="Memuat">
      <div v-for="n in 4" :key="n" class="hw-card is-skeleton"><span /><span /><span /></div>
    </div>
    <div v-else-if="error" class="hw-empty" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="hw-btn hw-btn-ghost" @click="load">Coba lagi</button>
    </div>
    <div v-else-if="!santri.length" class="hw-empty">
      <p>Belum ada santri di jilid Antum.</p>
    </div>
    <div v-else-if="!groups.length" class="hw-empty">
      <p v-if="onlyMissing">Semua santri di sini sudah punya nomor wali. Alhamdulillah.</p>
      <p v-else>Tidak ada yang cocok dengan “{{ query }}”.</p>
    </div>

    <!-- the list, by jilid -->
    <div v-else class="hw-list">
      <section v-for="g in groups" :key="g.id" class="hw-group" :aria-label="g.label">
        <h2 v-if="!jilid" class="hw-group-title">{{ g.label }} <span>{{ g.items.length }} santri</span></h2>
        <article v-for="s in g.items" :key="s.santriId" class="hw-card">
          <div class="hw-card-head">
            <span class="hw-avatar" aria-hidden="true">{{ initial(s.name) }}</span>
            <div class="hw-who">
              <h3>{{ s.name || 'Tanpa nama' }}</h3>
              <span>{{ levelName(s.classId) }}<template v-if="s.nomorInduk"> · {{ s.nomorInduk }}</template></span>
            </div>
          </div>

          <ul v-if="s.contacts.length" class="hw-contacts">
            <li v-for="c in s.contacts" :key="c.phone" class="hw-contact">
              <div class="hw-contact-info">
                <span class="hw-rel" :class="`is-${c.relation}`">{{ relationLabel(c.relation) }}</span>
                <span class="hw-contact-name">{{ c.name || 'Nama belum diisi' }}</span>
                <span class="hw-phone">{{ phoneText(c.phone) }}</span>
              </div>
              <div class="hw-actions">
                <a class="hw-call" :href="`tel:+${c.phone}`" :aria-label="`Telepon ${relationLabel(c.relation)} ${s.name}`">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
                </a>
                <a class="hw-wa" :href="waLink(s, c)" target="_blank" rel="noopener" :aria-label="`WhatsApp ${relationLabel(c.relation)} ${s.name}`">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3Z" /></svg>
                  WhatsApp
                </a>
              </div>
            </li>
          </ul>
          <div v-else class="hw-missing">
            <span>Belum ada nomor wali yang tertaut.</span>
            <router-link :to="{ path: '/dashboard/wali-santri', query: { santri: s.santriId } }">Tautkan wali →</router-link>
          </div>
        </article>
      </section>
    </div>

    <p v-if="loaded && santri.length" class="hw-foot">
      Nomor di sini adalah nomor wali yang sudah tertaut (masuk portal wali dengan kode WhatsApp). WhatsApp terbuka dengan salam pembuka
      yang bisa Antum ubah sebelum dikirim.
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatLocalPhone } from '@/utils/waFormat'
import { buildWaliGreeting, matchesContactQuery } from '@/utils/waliContact'

const JILID_KEY = 'tpq.hubungiWali.jilid'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')

const santri = ref([])
const scope = ref(null)
const loaded = ref(false)
const error = ref('')
const query = ref('')
const onlyMissing = ref(false)
const jilid = ref(localStorage.getItem(JILID_KEY) || '')

const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const relationLabel = (r) => ({ ayah: 'Ayah', ibu: 'Ibu' })[r] || 'Wali'
const initial = (name) => String(name || '?').trim().charAt(0).toUpperCase() || '?'
const phoneText = (phone) => formatLocalPhone(phone) || `+${phone}`

const scopeLabel = computed(() => (scope.value?.classIds || []).map(levelName).join(', '))

const jilidOptions = computed(() => {
  const counts = new Map()
  for (const s of santri.value) counts.set(s.classId, (counts.get(s.classId) || 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }))
    .map(([id, count]) => ({ id, label: levelName(id), count }))
})

function pickJilid(id) {
  jilid.value = id
  if (id) localStorage.setItem(JILID_KEY, id)
  else localStorage.removeItem(JILID_KEY)
}

// the jilid chosen (before the search and the "no number" filter): what the counts talk about
const inJilid = computed(() => santri.value.filter((s) => !jilid.value || s.classId === jilid.value))
const inView = computed(() => ({
  total: inJilid.value.length,
  withContact: inJilid.value.filter((s) => s.contacts.length).length,
}))

const groups = computed(() => {
  const shown = inJilid.value
    .filter((s) => !onlyMissing.value || !s.contacts.length)
    .filter((s) => matchesContactQuery(s, query.value))
  const byJilid = new Map()
  for (const s of shown) {
    if (!byJilid.has(s.classId)) byJilid.set(s.classId, [])
    byJilid.get(s.classId).push(s)
  }
  return [...byJilid.entries()].map(([id, items]) => ({ id, label: levelName(id), items }))
})

function waLink(s, c) {
  const text = buildWaliGreeting({
    relation: c.relation,
    waliName: c.name,
    santriName: s.name,
    jilidLabel: levelName(s.classId),
    senderName: authStore.user?.displayName || '',
    senderIsAdmin: isAdmin.value,
  })
  return `https://wa.me/${c.phone}?text=${encodeURIComponent(text)}`
}

async function load() {
  error.value = ''
  try {
    const { data } = await api.get('/wali/admin/contacts', { cache: false })
    santri.value = data.santri || []
    scope.value = data.scope || null
    // a remembered jilid that is no longer in the list: show all
    if (jilid.value && !santri.value.some((s) => s.classId === jilid.value)) pickJilid('')
  } catch (err) {
    error.value = err.response?.data?.error || 'Gagal memuat nomor wali. Periksa koneksi lalu coba lagi.'
  } finally {
    loaded.value = true
  }
}

// a new filter starts from the full list again
watch(jilid, () => (onlyMissing.value = false))

onMounted(load)
</script>

<style scoped>
.hw {
  --ink: #0b3b2a;
  --body: #475a50;
  --line: rgba(11, 59, 42, 0.1);
  --emerald: #0a5c40;
  --emerald-dark: #053d2c;
  --gold: #b45309;
  --ivory: #fbf9f3;
  max-width: 860px;
  color: var(--ink);
}

.hw-head h1 {
  margin: 0 0 4px;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--ink);
}

.hw-head p {
  margin: 0 0 12px;
  color: var(--body);
  line-height: 1.5;
}

.hw-note {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #eef6f1;
  color: #1f4d3a;
  font-size: 0.9rem;
  line-height: 1.45;
}

.hw-note.is-warn {
  background: #fffbeb;
  color: #7c3a0d;
}

.hw-tools {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.hw-search {
  position: relative;
  display: flex;
  align-items: center;
}

.hw-search svg {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #6b7c73;
  stroke-width: 2;
  stroke-linecap: round;
  pointer-events: none;
}

.hw-search input {
  width: 100%;
  min-height: 48px;
  padding: 0 44px 0 42px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
  font: inherit;
  font-size: 1rem; /* 16px: no zoom-in on iPhone */
  color: var(--ink);
}

.hw-search input:focus {
  outline: 2px solid rgba(10, 92, 64, 0.35);
  outline-offset: 1px;
  border-color: var(--emerald);
}

.hw-search input::-webkit-search-cancel-button {
  display: none;
}

.hw-clear {
  position: absolute;
  right: 6px;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  font-size: 1.4rem;
  line-height: 1;
  color: #6b7c73;
  cursor: pointer;
}

.hw-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  padding-bottom: 2px;
  margin: 0 -2px;
}

.hw-chips::-webkit-scrollbar {
  display: none;
}

.hw-chips button {
  flex: none;
  scroll-snap-align: start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fff;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: #3b4a42;
  cursor: pointer;
  white-space: nowrap;
}

.hw-chips button span {
  min-width: 22px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(11, 59, 42, 0.08);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}

.hw-chips button.is-on {
  border-color: var(--emerald);
  background: var(--emerald);
  color: #fff;
}

.hw-chips button.is-on span {
  background: rgba(255, 255, 255, 0.22);
}

.hw-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 12px;
  font-size: 0.88rem;
  color: var(--body);
}

.hw-toggle {
  min-height: 36px;
  padding: 0 4px;
  border: 0;
  background: transparent;
  font: inherit;
  font-weight: 700;
  color: var(--gold);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.hw-list {
  display: grid;
  gap: 18px;
}

.hw-group {
  display: grid;
  gap: 10px;
}

.hw-group-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--emerald-dark);
}

.hw-group-title span {
  font-weight: 600;
  color: #6b7c73;
  font-size: 0.85rem;
}

.hw-card {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;
}

.hw-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hw-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--ivory);
  border: 1px solid rgba(180, 83, 9, 0.25);
  color: var(--gold);
  font-weight: 800;
}

.hw-who {
  min-width: 0;
}

.hw-who h3 {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.hw-who span {
  font-size: 0.82rem;
  color: #6b7c73;
}

.hw-contacts {
  display: grid;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

/* phones: who on top, the buttons full width below; wider screens: one row */
.hw-contact {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: #f7faf8;
}

.hw-contact-info {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 2px 8px;
  min-width: 0;
}

.hw-rel {
  grid-row: span 2;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  background: #e7f1ec;
  color: var(--emerald-dark);
}

.hw-rel.is-ibu {
  background: #fdf2e5;
  color: #8a4210;
}

.hw-contact-name {
  font-weight: 700;
  font-size: 0.92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hw-phone {
  font-size: 0.88rem;
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.hw-actions {
  display: flex;
  gap: 8px;
}

.hw-actions .hw-wa {
  flex: 1;
}

@media (min-width: 560px) {
  .hw-contact {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .hw-actions {
    flex: none;
  }

  .hw-actions .hw-wa {
    flex: none;
  }
}

.hw-call,
.hw-wa {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 800;
}

.hw-call {
  width: 44px;
  border: 1px solid var(--line);
  background: #fff;
}

.hw-call svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: var(--emerald);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.hw-wa {
  gap: 6px;
  padding: 0 14px;
  background: var(--emerald);
  color: #fff;
}

.hw-wa:hover {
  background: var(--emerald-dark);
}

.hw-wa svg {
  width: 19px;
  height: 19px;
  fill: currentColor;
}

.hw-call:focus-visible,
.hw-wa:focus-visible,
.hw-chips button:focus-visible,
.hw-toggle:focus-visible {
  outline: 3px solid rgba(180, 83, 9, 0.45);
  outline-offset: 2px;
}

.hw-missing {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 12px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fffbeb;
  font-size: 0.88rem;
  color: #7c3a0d;
}

.hw-missing a {
  font-weight: 800;
  color: var(--emerald);
  text-decoration: none;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
}

.hw-empty {
  padding: 28px 16px;
  border: 1px dashed var(--line);
  border-radius: 16px;
  text-align: center;
  color: var(--body);
}

.hw-empty p {
  margin: 0 0 10px;
}

.hw-btn {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.hw-btn-ghost {
  border: 1px solid var(--line);
  background: #fff;
  color: var(--emerald);
}

.hw-card.is-skeleton {
  display: grid;
  gap: 10px;
}

.hw-card.is-skeleton span {
  display: block;
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(90deg, #eef2ef 25%, #f6f8f6 50%, #eef2ef 75%);
  background-size: 200% 100%;
  animation: hw-shimmer 1.2s infinite;
}

.hw-card.is-skeleton span:first-child {
  width: 45%;
  height: 18px;
}

.hw-card.is-skeleton span:last-child {
  width: 70%;
  height: 44px;
  border-radius: 12px;
}

@keyframes hw-shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hw-card.is-skeleton span {
    animation: none;
  }
}

.hw-foot {
  margin: 16px 0 0;
  font-size: 0.8rem;
  color: #6b7c73;
  line-height: 1.5;
}
</style>
