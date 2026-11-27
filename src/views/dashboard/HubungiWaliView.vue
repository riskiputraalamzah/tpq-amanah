<template>
  <div class="hw">
    <header class="hw-head">
      <div class="hw-head-text">
        <h1>Hubungi Wali</h1>
        <p>Chat WhatsApp orang tua santri langsung dari HP Antum. Pesan dikirim dari nomor Antum sendiri.</p>
      </div>
      <!-- how many have a number: the first thing that says whether the list is useful -->
      <div v-if="loaded && santri.length" class="hw-stat" role="status">
        <span class="hw-stat-num"><strong>{{ totals.withContact }}</strong>/{{ totals.total }}</span>
        <span class="hw-stat-label">santri punya nomor wali</span>
        <span class="hw-bar" aria-hidden="true"><span :style="{ width: `${totals.pct}%` }"></span></span>
      </div>
    </header>

    <!-- whose santri these are (a guru sees the jilid they look after) -->
    <p v-if="scope && scope.source === 'none'" class="hw-note is-warn" role="status">
      Jilid yang Antum ampu belum diatur admin dan belum ada riwayat KBM. Minta admin mengaturnya di menu Kelola Pengajar.
    </p>
    <p v-else-if="scope && scope.source === 'feature'" class="hw-note">Antum diberi akses ke <strong>semua jilid</strong>.</p>
    <p v-else-if="scope && !isAdmin && scopeLabel" class="hw-note">
      Jilid Antum: <strong>{{ scopeLabel }}</strong><template v-if="scope.source === 'kbm'"> (dari riwayat KBM 60 hari terakhir)</template>.
    </p>

    <div class="hw-body">
      <!-- phone: search + a strip of jilid chips; laptop: a side panel that stays while the list scrolls -->
      <aside class="hw-side">
        <label class="hw-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input v-model.trim="query" type="search" inputmode="search" placeholder="Cari santri atau wali" aria-label="Cari santri atau wali" />
          <button v-if="query" type="button" class="hw-clear" aria-label="Hapus pencarian" @click="query = ''">×</button>
        </label>

        <nav v-if="jilidOptions.length > 1" ref="chipsEl" class="hw-chips" aria-label="Pilih jilid">
          <p class="hw-side-title">Jilid</p>
          <button type="button" :aria-pressed="jilid === ''" :class="{ 'is-on': jilid === '' }" data-jilid="" @click="pickJilid('')">
            <span class="hw-chip-label">Semua</span>
            <span class="hw-chip-count">{{ santri.length }}</span>
            <span class="hw-chip-sub">{{ totals.withContact }}/{{ totals.total }} punya nomor</span>
          </button>
          <button
            v-for="opt in jilidOptions"
            :key="opt.id"
            type="button"
            :aria-pressed="jilid === opt.id"
            :class="{ 'is-on': jilid === opt.id, 'is-complete': opt.withContact === opt.count }"
            :data-jilid="opt.id"
            @click="pickJilid(opt.id)"
          >
            <span class="hw-chip-label">{{ opt.label }}</span>
            <span class="hw-chip-count">{{ opt.count }}</span>
            <span class="hw-chip-sub">{{ opt.withContact }}/{{ opt.count }} punya nomor</span>
          </button>
        </nav>
      </aside>

      <div class="hw-main">
        <div v-if="loaded && santri.length && (jilid || inView.total > inView.withContact)" class="hw-meta">
          <span v-if="jilid"><strong>{{ inView.withContact }}</strong> dari {{ inView.total }} santri {{ levelName(jilid) }} punya nomor wali</span>
          <button v-if="inView.total - inView.withContact > 0" type="button" class="hw-toggle" :aria-pressed="onlyMissing" @click="onlyMissing = !onlyMissing">
            {{ onlyMissing ? 'Tampilkan semua' : `Lihat ${inView.total - inView.withContact} yang belum ada nomor` }}
          </button>
        </div>

        <!-- loading / error / empty -->
        <div v-if="!loaded && !error" class="hw-grid" aria-busy="true" aria-label="Memuat">
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
            <div class="hw-grid">
              <article v-for="s in g.items" :key="s.santriId" class="hw-card" :class="{ 'is-missing': !s.contacts.length }">
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
            </div>
          </section>
        </div>

        <p v-if="loaded && santri.length" class="hw-foot">
          Nomor di sini adalah nomor wali yang sudah tertaut (masuk portal wali dengan kode WhatsApp). WhatsApp terbuka dengan salam pembuka
          yang bisa Antum ubah sebelum dikirim.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
const chipsEl = ref(null)

const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const relationLabel = (r) => ({ ayah: 'Ayah', ibu: 'Ibu' })[r] || 'Wali'
const initial = (name) => String(name || '?').trim().charAt(0).toUpperCase() || '?'
const phoneText = (phone) => formatLocalPhone(phone) || `+${phone}`

const scopeLabel = computed(() => (scope.value?.classIds || []).map(levelName).join(', '))

const totals = computed(() => {
  const total = santri.value.length
  const withContact = santri.value.filter((s) => s.contacts.length).length
  return { total, withContact, pct: total ? Math.round((withContact / total) * 100) : 0 }
})

const jilidOptions = computed(() => {
  const counts = new Map()
  for (const s of santri.value) {
    const e = counts.get(s.classId) || { count: 0, withContact: 0 }
    e.count += 1
    if (s.contacts.length) e.withContact += 1
    counts.set(s.classId, e)
  }
  return [...counts.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }))
    .map(([id, e]) => ({ id, label: levelName(id), count: e.count, withContact: e.withContact }))
})

// the chosen chip slides to the middle of the strip on a phone (never hidden at the edge); the page itself stays put
function centreChip(smooth = true) {
  const strip = chipsEl.value
  if (!strip || strip.scrollWidth <= strip.clientWidth + 1) return
  const el = strip.querySelector(`[data-jilid="${CSS.escape(jilid.value)}"]`)
  if (!el) return
  const left = el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  strip.scrollTo({ left: Math.max(0, left), behavior: smooth && !reduced ? 'smooth' : 'auto' })
}

function pickJilid(id) {
  jilid.value = id
  if (id) localStorage.setItem(JILID_KEY, id)
  else localStorage.removeItem(JILID_KEY)
  nextTick(() => centreChip())
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
    nextTick(() => centreChip(false))
  }
}

// a new filter starts from the full list again
watch(jilid, () => (onlyMissing.value = false))

onMounted(load)
</script>

<style scoped>
/* One centred column; the page measures itself (container) so the layout follows the space it really has
   (the sidebar open or closed), not the window. */
.hw {
  --ink: #0b3b2a;
  --body: #475a50;
  --line: rgba(11, 59, 42, 0.1);
  --emerald: #0a5c40;
  --emerald-dark: #053d2c;
  --gold: #b45309;
  --ivory: #fbf9f3;
  container: hw / inline-size;
  max-width: 1180px;
  margin-inline: auto;
  color: var(--ink);
}

/* ------------------------------------------------------------------ header */
.hw-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 24px;
  margin-bottom: 14px;
}

.hw-head-text {
  flex: 1 1 320px;
  min-width: 0;
}

.hw-head h1 {
  margin: 0 0 4px;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--ink);
}

.hw-head p {
  margin: 0;
  color: var(--body);
  line-height: 1.5;
}

.hw-stat {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: baseline;
  gap: 2px 10px;
  flex: 1 1 240px;
  max-width: 360px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;
}

.hw-stat-num {
  font-size: 0.95rem;
  color: #6b7c73;
  font-variant-numeric: tabular-nums;
}

.hw-stat-num strong {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--emerald);
}

.hw-stat-label {
  font-size: 0.82rem;
  color: var(--body);
}

.hw-bar {
  grid-column: 1 / -1;
  height: 6px;
  margin-top: 6px;
  border-radius: 999px;
  background: #eef2ef;
  overflow: hidden;
}

.hw-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0a5c40, #16a34a);
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

/* ------------------------------------------------------------------ body: phone = one column */
.hw-body {
  display: grid;
  gap: 12px;
}

.hw-side {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.hw-main {
  display: grid;
  gap: 12px;
  align-content: start;
  min-width: 0;
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
  box-sizing: border-box;
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

/* jilid chips. Phone: one strip that scrolls sideways, the right edge fades so it is clear there is more, and the
   end has room so the last chip (Marhalah) is never cut off. */
.hw-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  padding: 2px 28px 4px 2px;
  margin: 0 -2px;
  -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 32px), transparent);
  mask-image: linear-gradient(90deg, #000 calc(100% - 32px), transparent);
}

.hw-chips::-webkit-scrollbar {
  display: none;
}

.hw-side-title {
  display: none;
}

.hw-chips button {
  flex: none;
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
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.hw-chip-count {
  min-width: 22px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(11, 59, 42, 0.08);
  font-size: 0.78rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.hw-chip-sub {
  display: none;
}

.hw-chips button:hover {
  border-color: rgba(10, 92, 64, 0.35);
}

.hw-chips button.is-on {
  border-color: var(--emerald);
  background: var(--emerald);
  color: #fff;
}

.hw-chips button.is-on .hw-chip-count {
  background: rgba(255, 255, 255, 0.22);
}

/* a tablet: everything fits on two lines, nothing hidden */
@container hw (min-width: 600px) {
  .hw-chips {
    flex-wrap: wrap;
    overflow: visible;
    padding: 0;
    margin: 0;
    -webkit-mask-image: none;
    mask-image: none;
  }
}

/* a laptop: a side panel (search + the jilid as a list with how many have a number) next to the list */
@container hw (min-width: 900px) {
  .hw-body {
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }

  .hw-side {
    position: sticky;
    top: 16px;
    gap: 12px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: #fff;
  }

  .hw-side-title {
    display: block;
    margin: 4px 4px 2px;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #6b7c73;
  }

  .hw-chips {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 4px;
  }

  .hw-chips button {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0 8px;
    width: 100%;
    min-height: 52px;
    padding: 8px 12px;
    border-color: transparent;
    border-radius: 12px;
    background: transparent;
    text-align: left;
  }

  .hw-chips button:hover {
    border-color: transparent;
    background: #f3f7f5;
  }

  .hw-chips button.is-on {
    background: var(--emerald);
    border-color: var(--emerald);
  }

  .hw-chip-count {
    grid-row: span 2;
  }

  .hw-chip-sub {
    display: block;
    font-size: 0.74rem;
    font-weight: 600;
    color: #6b7c73;
  }

  .hw-chips button.is-complete:not(.is-on) .hw-chip-sub {
    color: var(--emerald);
  }

  .hw-chips button.is-on .hw-chip-sub {
    color: rgba(255, 255, 255, 0.8);
  }
}

/* ------------------------------------------------------------------ the list */
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
  gap: 20px;
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

/* cards: one column on a phone, two side by side when there is room */
.hw-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr));
}

.hw-card {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;
  min-width: 0;
}

.hw-card.is-missing {
  background: #fffdf7;
  border-style: dashed;
  border-color: rgba(180, 83, 9, 0.28);
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

/* a narrow card: who on top, the buttons full width below; a wide card: one row */
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
  min-width: 0;
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

@container (min-width: 380px) {
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
.hw-toggle:focus-visible,
.hw-missing a:focus-visible {
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
  background: #fff7e6;
  font-size: 0.88rem;
  color: #7c3a0d;
}

.hw-missing a {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(10, 92, 64, 0.3);
  background: #fff;
  font-weight: 800;
  color: var(--emerald);
  text-decoration: none;
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

  .hw-chips button {
    transition: none;
  }
}

.hw-foot {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: #6b7c73;
  line-height: 1.5;
}
</style>
