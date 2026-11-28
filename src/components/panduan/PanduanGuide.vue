<template>
  <!-- Panduan: one role's guide (content/panduan.js). Mobile first; screenshots load lazily and open large on a tap. -->
  <div class="pg" :class="`is-${tone}`">
    <header class="pg-head">
      <h1>Panduan</h1>
      <p>{{ guide.intro }}</p>
    </header>

    <div v-if="roles.length > 1" class="pg-roles" role="tablist" aria-label="Panduan untuk">
      <button v-for="r in roles" :key="r" type="button" role="tab" :aria-selected="r === role" @click="setRole(r)">
        {{ ROLE_LABEL[r] }}
      </button>
    </div>

    <!-- what is new for this role -->
    <section v-if="releases.length" class="pg-section" aria-labelledby="pg-new">
      <h2 id="pg-new" class="pg-title">Yang baru</h2>
      <article v-for="rel in releases" :key="rel.id" class="pg-release">
        <div class="pg-release-top">
          <span class="pg-date">{{ longDate(rel.date) }}</span>
          <span v-if="unseenIds.has(rel.id)" class="pg-new">Baru</span>
        </div>
        <h3>{{ rel.title }}</h3>
        <ul>
          <li v-for="(p, i) in rel.points[role] || []" :key="i">{{ p }}</li>
        </ul>
        <a v-if="rel.topics[role]" :href="`#${anchor(rel.topics[role])}`" class="pg-link" @click.prevent="jump(rel.topics[role])">Lihat caranya ›</a>
      </article>
    </section>

    <!-- find a topic -->
    <section class="pg-section" aria-labelledby="pg-toc">
      <h2 id="pg-toc" class="pg-title">Cara melakukan</h2>
      <label class="pg-search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input v-model.trim="query" type="search" placeholder="Cari, misalnya: paraf, rapor, izin" aria-label="Cari di panduan" />
      </label>
      <nav class="pg-toc" aria-label="Daftar isi">
        <a v-for="t in shownTopics" :key="t.id" :href="`#${anchor(t.id)}`" @click.prevent="jump(t.id)">{{ t.title }}</a>
      </nav>
      <p v-if="!shownTopics.length" class="pg-empty">Tidak ada yang cocok. Coba kata lain.</p>
    </section>

    <section v-for="t in shownTopics" :id="anchor(t.id)" :key="t.id" class="pg-topic" :class="{ 'is-flash': flashed === t.id }">
      <h3>{{ t.title }}</h3>
      <p class="pg-summary">{{ t.summary }}</p>
      <ol v-if="t.steps?.length" class="pg-steps">
        <li v-for="(s, i) in t.steps" :key="i">{{ s }}</li>
      </ol>
      <div v-if="t.tips?.length" class="pg-tips">
        <strong>Tips</strong>
        <ul>
          <li v-for="(s, i) in t.tips" :key="i">{{ s }}</li>
        </ul>
      </div>
      <div v-if="t.shots?.length" class="pg-shots">
        <figure v-for="sh in t.shots" :key="sh.src" class="pg-shot">
          <button type="button" class="pg-shot-btn" :aria-label="`Perbesar: ${sh.caption}`" @click="open = sh">
            <img :src="sh.src" :alt="sh.caption" loading="lazy" decoding="async" width="390" height="780" />
          </button>
          <figcaption>{{ sh.caption }}</figcaption>
        </figure>
      </div>
    </section>

    <!-- every menu of this role -->
    <section class="pg-section" aria-labelledby="pg-menu">
      <h2 id="pg-menu" class="pg-title">Daftar menu</h2>
      <details v-for="(g, gi) in guide.menus" :key="g.title" class="pg-menu" :open="gi === 0">
        <summary>{{ g.title }} <small>{{ g.items.length }}</small></summary>
        <ul>
          <li v-for="m in g.items" :key="m.label">
            <div>
              <strong>{{ m.label }}</strong>
              <span>{{ m.desc }}</span>
            </div>
            <router-link v-if="m.to && role === ownRole && m.to !== route.path" :to="m.to" class="pg-open">Buka</router-link>
          </li>
        </ul>
      </details>
    </section>

    <p class="pg-foot">Ada yang belum jelas? {{ role === 'wali' ? 'Tanyakan ke ustadz/ustadzah ananda atau kirim lewat Saran & Kritik.' : 'Tanyakan ke admin TPQ.' }}</p>

    <Teleport to="body">
      <div v-if="open" class="pg-overlay" role="dialog" aria-modal="true" :aria-label="open.caption" @click.self="open = null" @keydown.esc="open = null">
        <figure class="pg-big">
          <img :src="open.src" :alt="open.caption" />
          <figcaption>{{ open.caption }}</figcaption>
        </figure>
        <button type="button" class="pg-close" aria-label="Tutup" @click="open = null">✕</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GUIDES, RELEASES, ROLE_LABEL, unseenReleases, markReleasesSeen } from '@/content/panduan'

const props = defineProps({
  roles: { type: Array, default: () => ['wali'] },
  ownRole: { type: String, default: '' }, // the viewer's role: only their own menus get "Buka"
  tone: { type: String, default: 'dashboard' }, // dashboard | wali | public
})
const route = useRoute()
const router = useRouter()
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const longDate = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`

const wanted = String(route.query.peran || '')
const role = ref(props.roles.includes(wanted) ? wanted : props.roles.includes(props.ownRole) ? props.ownRole : props.roles[0])
const guide = computed(() => GUIDES[role.value])
const releases = computed(() => RELEASES.filter((r) => r.roles.includes(role.value)))
// what was new when the page opened (it is marked seen right away, the "Baru" stays for this visit)
const unseenIds = ref(new Set(unseenReleases(role.value).map((r) => r.id)))
const query = ref('')
const open = ref(null)
const flashed = ref('')
const norm = (s) => String(s || '').toLowerCase()
const shownTopics = computed(() => {
  const q = norm(query.value)
  if (!q) return guide.value.topics
  return guide.value.topics.filter((t) => norm([t.title, t.summary, ...(t.steps || []), ...(t.tips || [])].join(' ')).includes(q))
})
const anchor = (id) => `${role.value}-${id}`

function setRole(r) {
  role.value = r
  query.value = ''
  unseenIds.value = new Set(unseenReleases(r).map((x) => x.id))
  markReleasesSeen(r)
  router.replace({ query: { ...route.query, peran: r }, hash: '' })
}
async function jump(topicId) {
  query.value = ''
  await nextTick()
  const el = document.getElementById(anchor(topicId))
  if (!el) return
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  flashed.value = topicId
  setTimeout(() => (flashed.value = ''), 1600)
}
onMounted(() => {
  markReleasesSeen(role.value)
  // /panduan#wali-kps-wali (a link from WhatsApp or a release): straight to the topic
  const hash = decodeURIComponent(route.hash || '').replace(/^#/, '')
  const topic = hash.startsWith(`${role.value}-`) ? hash.slice(role.value.length + 1) : ''
  if (topic) setTimeout(() => jump(topic), 300)
})
</script>

<style scoped>
.pg {
  --ink: #0b3b2a;
  --body: #3d5146;
  --muted: #55625b;
  --line: rgba(11, 59, 42, 0.11);
  --emerald: #0a5c40;
  --emerald-dark: #053d2c;
  --gold: #b45309;
  max-width: 760px;
  margin-inline: auto;
  color: var(--ink);
}
.pg-head h1 { margin: 0 0 4px; font-size: 1.6rem; font-weight: 800; }
.pg-head p { margin: 0 0 14px; color: var(--body); line-height: 1.55; }
.pg-roles { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 4px; padding: 4px; margin-bottom: 16px; border-radius: 14px; background: #efe9dc; }
.pg-roles button { min-height: 42px; border: 0; border-radius: 11px; background: transparent; font: inherit; font-size: 0.9rem; font-weight: 600; color: var(--muted); cursor: pointer; }
.pg-roles button[aria-selected='true'] { background: #fff; color: var(--emerald); font-weight: 800; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.pg-section { margin-bottom: 18px; }
.pg-title { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 1.05rem; font-weight: 800; }
.pg-title::before { content: ''; width: 7px; height: 7px; transform: rotate(45deg); background: var(--gold); }
.pg-release {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(150deg, #0a5c40, #053d2c);
  color: #fbf9f3;
}
.pg-release + .pg-release { margin-top: 10px; }
.pg-release-top { display: flex; align-items: center; gap: 8px; }
.pg-date { font-size: 0.78rem; color: #b6d3c4; }
.pg-new { padding: 2px 9px; border-radius: 999px; background: #e9c46a; color: #3a2405; font-size: 0.72rem; font-weight: 800; }
.pg-release h3 { margin: 0; font-size: 1.02rem; }
.pg-release ul { margin: 0; padding-left: 18px; font-size: 0.88rem; line-height: 1.5; color: #d6e9de; }
.pg-link { justify-self: start; min-height: 40px; display: inline-flex; align-items: center; font-weight: 800; color: #e9c46a; text-decoration: none; }
.pg-search { display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 0 12px; margin-bottom: 10px; border-radius: 14px; border: 1.5px solid #e4ded1; background: #fff; }
.pg-search svg { width: 18px; height: 18px; flex: none; fill: none; stroke: var(--muted); stroke-width: 2; stroke-linecap: round; }
.pg-search input { flex: 1; min-width: 0; min-height: 44px; border: 0; background: transparent; font: inherit; font-size: 1rem; color: var(--ink); }
.pg-search input:focus { outline: none; }
.pg-search:focus-within { border-color: var(--emerald); box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.15); }
.pg-toc { display: flex; flex-wrap: wrap; gap: 6px; }
.pg-toc a { display: inline-flex; align-items: center; min-height: 38px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line); background: #fff; font-size: 0.84rem; font-weight: 600; color: var(--body); text-decoration: none; }
.pg-toc a:hover { border-color: var(--emerald); color: var(--emerald); }
.pg-empty { color: var(--muted); }
.pg-topic {
  scroll-margin-top: calc(var(--appbar-h, 0px) + 16px);
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 1px 2px rgba(3, 41, 29, 0.04), 0 8px 22px -18px rgba(3, 41, 29, 0.25);
  transition: box-shadow 0.4s ease, border-color 0.4s ease;
}
.pg-topic.is-flash { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.2); }
.pg-topic h3 { margin: 0 0 4px; font-size: 1.05rem; font-weight: 800; }
.pg-summary { margin: 0 0 10px; color: var(--body); line-height: 1.5; }
.pg-steps { margin: 0; padding: 0; list-style: none; counter-reset: step; display: grid; gap: 8px; }
.pg-steps li { position: relative; padding-left: 36px; line-height: 1.5; counter-increment: step; }
.pg-steps li::before {
  content: counter(step);
  position: absolute;
  left: 0;
  top: 0;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e6f3ec;
  color: var(--emerald);
  font-size: 0.82rem;
  font-weight: 800;
}
.pg-tips { margin-top: 12px; padding: 10px 12px; border-radius: 12px; background: #fffaf0; border: 1px solid #f1d9a8; color: #5c3b0b; }
.pg-tips strong { font-size: 0.82rem; }
.pg-tips ul { margin: 4px 0 0; padding-left: 18px; font-size: 0.86rem; line-height: 1.5; }
.pg-shots { display: flex; gap: 12px; margin-top: 14px; overflow-x: auto; padding-bottom: 4px; scroll-snap-type: x mandatory; }
.pg-shot { flex: none; width: min(62vw, 230px); margin: 0; scroll-snap-align: start; }
.pg-shot-btn { display: block; width: 100%; padding: 0; border: 0; border-radius: 22px; background: #111; overflow: hidden; cursor: zoom-in; box-shadow: 0 10px 24px -14px rgba(0, 0, 0, 0.5); outline-offset: 3px; }
.pg-shot-btn img { display: block; width: 100%; height: auto; aspect-ratio: 1 / 2; object-fit: cover; object-position: top; border: 5px solid #111; border-radius: 22px; box-sizing: border-box; }
.pg-shot figcaption { margin-top: 6px; font-size: 0.8rem; color: var(--muted); line-height: 1.35; }
.pg-menu { margin-bottom: 8px; border-radius: 16px; background: #fff; border: 1px solid var(--line); overflow: hidden; }
.pg-menu summary { display: flex; align-items: center; justify-content: space-between; min-height: 50px; padding: 0 16px; font-weight: 800; cursor: pointer; list-style: none; }
.pg-menu summary::-webkit-details-marker { display: none; }
.pg-menu summary::after { content: '▾'; color: var(--muted); }
.pg-menu[open] summary::after { content: '▴'; }
.pg-menu summary small { margin-left: auto; margin-right: 10px; font-weight: 600; color: var(--muted); }
.pg-menu ul { margin: 0; padding: 0 16px 8px; list-style: none; }
.pg-menu li { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid #f1ece1; }
.pg-menu li div { flex: 1; min-width: 0; display: grid; gap: 2px; }
.pg-menu li strong { font-size: 0.92rem; }
.pg-menu li span { font-size: 0.84rem; color: var(--body); line-height: 1.45; }
.pg-open { flex: none; min-height: 38px; display: inline-flex; align-items: center; padding: 0 12px; border-radius: 10px; border: 1px solid var(--line); font-size: 0.82rem; font-weight: 700; color: var(--emerald); text-decoration: none; }
.pg-foot { margin: 18px 0 0; text-align: center; font-size: 0.86rem; color: var(--muted); }
.pg-overlay { position: fixed; inset: 0; z-index: 9990; display: grid; place-items: center; padding: 16px; background: rgba(3, 18, 12, 0.88); }
.pg-big { margin: 0; display: grid; gap: 8px; justify-items: center; max-height: 100%; }
.pg-big img { max-width: min(92vw, 420px); max-height: 82vh; border-radius: 18px; border: 5px solid #111; background: #111; }
.pg-big figcaption { color: #e8efe9; font-size: 0.88rem; text-align: center; }
.pg-close { position: fixed; top: calc(12px + env(safe-area-inset-top)); right: 12px; width: 48px; height: 48px; border: 0; border-radius: 14px; background: rgba(255, 255, 255, 0.14); color: #fff; font-size: 1.2rem; cursor: pointer; }
.pg button:focus-visible, .pg a:focus-visible, .pg summary:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
@media (min-width: 720px) {
  .pg-shot { width: 220px; }
}
</style>
