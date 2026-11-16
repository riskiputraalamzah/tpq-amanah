<template>
  <!-- Top bar: context only (where am I, back, account). Brand while the page's own title is in view; the page
       title takes over once it scrolls away (and always on inner pages, which also get a Back button). -->
  <header ref="barEl" class="mc-bar">
    <button v-if="deep" type="button" class="mc-icon-btn" aria-label="Kembali" @click="goBack">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
    </button>
    <router-link v-else to="/dashboard" class="mc-logo" aria-label="Ke beranda dashboard">
      <img :src="logoUrl" alt="" width="34" height="34" />
    </router-link>

    <div class="mc-title" aria-live="polite">
      <Transition name="mc-swap" mode="out-in">
        <p v-if="showTitle" key="t" class="mc-title-text">{{ title }}</p>
        <p v-else key="b" class="mc-brand"><strong>TPQ AMANAH</strong><small>{{ roleLabel }}</small></p>
      </Transition>
    </div>

    <router-link to="/dashboard/profile" class="mc-avatar-link" aria-label="Profil saya">
      <img v-if="user?.photoURL" :src="user.photoURL" alt="" class="mc-avatar" />
      <span v-else class="mc-avatar mc-avatar-initials">{{ initials }}</span>
    </router-link>
  </header>

  <!-- Bottom bar: the few places used all day, within thumb reach; everything else is under "Menu" (BubbleNav.vue) -->
  <BubbleNav ref="bubbleNav" :items="barItems" :active-index="activeIdx" :current-index="currentIdx" phone-only
    :aria-label="`Menu utama ${roleLabel}`" @press="toggleSheet" />

  <!-- "Menu": every page, grouped like the desktop sidebar, as a sheet from the bottom -->
  <Teleport to="body">
    <Transition name="mc-sheet">
      <div v-if="sheetOpen" class="mc-overlay" @click.self="closeSheet">
        <section ref="sheetEl" class="mc-sheet" role="dialog" aria-modal="true" aria-labelledby="mc-sheet-title" tabindex="-1">
          <span class="mc-grab" aria-hidden="true"></span>
          <header class="mc-sheet-head">
            <img v-if="user?.photoURL" :src="user.photoURL" alt="" class="mc-avatar mc-avatar-lg" />
            <span v-else class="mc-avatar mc-avatar-lg mc-avatar-initials" aria-hidden="true">{{ initials }}</span>
            <div class="mc-who">
              <h2 id="mc-sheet-title">{{ user?.displayName }}</h2>
              <p>{{ roleLabel }}</p>
            </div>
            <router-link to="/dashboard/profile" class="mc-pill" @click="closeSheet">Profil</router-link>
            <button type="button" class="mc-icon-btn is-dark" aria-label="Tutup menu" @click="closeSheet">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </header>

          <div class="mc-sheet-body">
            <a v-if="nspq?.nspq" :href="nspq.sipdarUrl" target="_blank" rel="noopener noreferrer" class="mc-nspq"
              :aria-label="`NSPQ ${nspq.nspq}, buka sertifikat LPQ di SIPDAR Kemenag (tab baru)`">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
              <span><small>NSPQ</small><strong>{{ nspq.nspq }}</strong></span>
              <svg class="mc-ext" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>

            <section v-for="g in sheetGroups" :key="g.key" class="mc-group" :aria-labelledby="`mc-g-${g.key}`">
              <h3 :id="`mc-g-${g.key}`">{{ g.title }}</h3>
              <div class="mc-grid">
                <router-link v-for="m in g.items" :key="m.to" :to="m.to" class="mc-tile" :class="{ 'is-active': isItemActive(m) }"
                  :aria-current="isItemActive(m) ? 'page' : undefined" @click="closeSheet">
                  <span class="mc-tile-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="m.icon"></svg>
                    <span v-if="m.badge === 'pendaftaran' && badgeCount" class="mc-badge">{{ badgeCount > 9 ? '9+' : badgeCount }}</span>
                  </span>
                  <span class="mc-tile-label">{{ m.label }}</span>
                  <span v-if="m.badge === 'pendaftaran' && badgeCount" class="mc-sr">, {{ badgeCount }} pendaftar baru</span>
                </router-link>
              </div>
            </section>
          </div>

          <footer class="mc-sheet-foot">
            <button type="button" class="mc-logout" @click="logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Keluar
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// The phone frame of the dashboard for the admin and the guru (below 1024px; the sidebar takes over above it).
// Menu data comes from DashboardLayout (one list for the sidebar and this sheet).
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deepPageFor } from '@/utils/navDirection'
import BubbleNav from '@/components/BubbleNav.vue'

const props = defineProps({
  groups: { type: Array, default: () => [] },
  role: { type: String, default: 'guru' },
  user: { type: Object, default: null },
  badgeCount: { type: Number, default: 0 }, // registrations nobody has contacted yet
  menuBadge: { type: Number, default: 0 }, // the same, on the Menu tab when Pendaftaran is not a tab itself
  nspq: { type: Object, default: null },
})
const emit = defineEmits(['logout'])

const route = useRoute()
const router = useRouter()
const logoUrl = new URL('@/assets/logo-sm.png', import.meta.url).href

const isAdmin = computed(() => props.role === 'admin')
const roleLabel = computed(() => (isAdmin.value ? 'Administrator' : 'Guru'))
const initials = computed(() =>
  String(props.user?.displayName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2),
)

const isActive = (path) => route.path === path || route.path.startsWith(`${path}/`)
const isItemActive = (m) => isActive(m.to) || (m.also || []).some(isActive)

/* ------------------------------------------------------------ bottom bar */
const ICON = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />',
  santri: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />',
  daftar: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />',
  monitor: '<rect x="3" y="4" width="18" height="16" rx="2" /><polyline points="7 13 10 16 17 9" />',
  kbm: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />',
  check: '<path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />',
  absenSantri: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />',
  menu: '<rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />',
}
const MENU = { key: 'menu', label: 'Menu', icon: ICON.menu, sheet: true }
const NAV = {
  admin: [
    { key: 'home', to: '/dashboard', label: 'Beranda', icon: ICON.home, exact: true },
    { key: 'santri', to: '/dashboard/santri', label: 'Santri', icon: ICON.santri },
    { key: 'daftar', to: '/dashboard/pendaftaran', label: 'Pendaftaran', icon: ICON.daftar, badge: true },
    { key: 'monitor', to: '/dashboard/kbm-monitor', label: 'Monitor', icon: ICON.monitor },
    MENU,
  ],
  guru: [
    { key: 'home', to: '/dashboard', label: 'Beranda', icon: ICON.home, exact: true },
    { key: 'kbm', to: '/dashboard/kbm', label: 'KBM', icon: ICON.kbm },
    { key: 'absensi', to: '/dashboard/attendance', label: 'Absensi', icon: ICON.check },
    { key: 'absen-santri', to: '/dashboard/absen-santri', label: 'Santri', icon: ICON.absenSantri },
    MENU,
  ],
}
const navItems = computed(() => (isAdmin.value ? NAV.admin : NAV.guru))
const isNavActive = (item) => (item.exact ? route.path === item.to : isActive(item.to))

// Which tab the bubble sits in: the page's tab, or Menu while its sheet is open (none for a page that is in no tab)
const menuIndex = computed(() => navItems.value.findIndex((i) => i.sheet))
const currentIdx = computed(() => navItems.value.findIndex((i) => !i.sheet && isNavActive(i)))
const activeIdx = computed(() => (sheetOpen.value ? menuIndex.value : currentIdx.value))
const bubbleNav = ref(null)
// what BubbleNav draws: the tabs, the new-registrant badge where it belongs, and Menu as a button that opens the sheet
const barItems = computed(() =>
  navItems.value.map((item) =>
    item.sheet
      ? { key: item.key, label: item.label, icon: item.icon, button: true, expanded: sheetOpen.value, badge: props.menuBadge, badgeLabel: 'pendaftar baru' }
      : { key: item.key, label: item.label, icon: item.icon, to: item.to, badge: item.badge ? props.badgeCount : 0, badgeLabel: 'pendaftar baru' },
  ),
)

/* ------------------------------------------------------------ top bar: title and back */
// Inner pages get a Back button and their own title (the list is shared with the page slide: utils/navDirection.js)
const ALONE = { '/dashboard/profile': 'Profil Saya', '/dashboard/settings': 'Pengaturan' }

const deepInfo = computed(() => deepPageFor(route.path, props.role))
const deep = computed(() => !!deepInfo.value)
const isHome = computed(() => route.path === '/dashboard')
const title = computed(() => {
  if (deepInfo.value) return deepInfo.value.title
  if (ALONE[route.path]) return ALONE[route.path]
  for (const g of props.groups) {
    const hit = g.items.find(isItemActive)
    if (hit) return hit.label
  }
  return ''
})

function goBack() {
  const prev = window.history.state?.back
  if (typeof prev === 'string' && prev.startsWith('/dashboard')) router.back()
  else router.push(deepInfo.value?.back || '/dashboard')
}

// The page keeps its big title; the bar shows the brand until that title scrolls under it (like a large-title bar)
const barEl = ref(null)
const titleOut = ref(false)
let routeAt = 0
let raf = 0
let timers = []
function measure() {
  raf = 0
  const bar = barEl.value
  // the page that is sliding out is still in the document for a moment: its title does not count
  const h1 = [...document.querySelectorAll('.dashboard-content h1')].find((h) => !h.closest('.page-leaving'))
  if (!bar) return
  if (!h1) {
    // the page is still drawing its title: wait a moment before settling on "no title of its own"
    titleOut.value = performance.now() - routeAt > 1000
    return
  }
  titleOut.value = h1.getBoundingClientRect().bottom < bar.getBoundingClientRect().bottom + 6
}
const schedule = () => {
  if (!raf) raf = requestAnimationFrame(measure)
}
const showTitle = computed(() => !!title.value && !isHome.value && (deep.value || titleOut.value))

watch(
  () => route.path,
  () => {
    routeAt = performance.now()
    titleOut.value = false
    timers.forEach(clearTimeout)
    timers = [80, 400, 1100].map((ms) => setTimeout(schedule, ms))
    closeSheet()
  },
)

/* ------------------------------------------------------------ the Menu sheet */
const sheetOpen = ref(false)
const sheetEl = ref(null)
// the guru's own "Akun" group is just the profile, which the sheet header already links to
const sheetGroups = computed(() => props.groups.filter((g) => g.key !== 'akun'))

const onKey = (e) => {
  if (e.key === 'Escape') closeSheet()
}
async function openSheet() {
  sheetOpen.value = true
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKey)
  await nextTick()
  sheetEl.value?.focus()
}
function closeSheet() {
  if (!sheetOpen.value) return
  sheetOpen.value = false
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKey)
  const btn = bubbleNav.value?.itemEl(menuIndex.value)
  nextTick(() => btn?.focus?.({ preventScroll: true }))
}
const toggleSheet = () => (sheetOpen.value ? closeSheet() : openSheet())
function logout() {
  closeSheet()
  emit('logout')
}

onMounted(() => {
  routeAt = performance.now()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  timers = [80, 400, 1100].map((ms) => setTimeout(schedule, ms))
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
  timers.forEach(clearTimeout)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped>
/* only below the desktop breakpoint; the sidebar is the navigation above it */
.mc-bar {
  display: none;
}

@media (max-width: 1023px) {
  /* ---- top bar ---- */
  .mc-bar {
    position: fixed;
    top: var(--banner-h, 0px);
    left: 0;
    right: 0;
    z-index: var(--z-fixed, 300);
    display: flex;
    align-items: center;
    gap: 6px;
    height: calc(56px + env(safe-area-inset-top, 0px));
    padding: env(safe-area-inset-top, 0px) 10px 0 8px;
    color: #fff;
    background: #03291d; /* = theme-color: the status bar of the browser / installed app is the same colour */
    border-bottom: 1px solid rgba(252, 211, 77, 0.28);
    box-shadow: 0 8px 22px -16px rgba(2, 28, 19, 0.7);
  }

  .mc-logo,
  .mc-icon-btn,
  .mc-avatar-link {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 12px;
    background: none;
    color: #fff;
    text-decoration: none;
    cursor: pointer;
  }

  .mc-logo img {
    width: 34px;
    height: 34px;
    object-fit: contain;
  }

  .mc-icon-btn:active,
  .mc-logo:active,
  .mc-avatar-link:active {
    background: rgba(255, 255, 255, 0.12);
  }

  .mc-title {
    flex: 1;
    min-width: 0;
  }

  .mc-title-text {
    margin: 0;
    overflow: hidden;
    font-size: 1.06rem;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.01em;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #fff;
  }

  .mc-brand {
    display: flex;
    flex-direction: column;
    margin: 0;
    line-height: 1.15;
  }

  .mc-brand strong {
    font-size: 0.98rem;
    font-weight: 800;
    letter-spacing: 0.01em;
    color: #fff;
  }

  .mc-brand small {
    font-size: 0.7rem;
    font-weight: 600;
    color: #fcd34d;
  }

  .mc-swap-enter-active,
  .mc-swap-leave-active {
    transition: opacity 0.14s ease, transform 0.14s ease;
  }

  .mc-swap-enter-from {
    opacity: 0;
    transform: translateY(5px);
  }

  .mc-swap-leave-to {
    opacity: 0;
    transform: translateY(-5px);
  }

  .mc-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(252, 211, 77, 0.7);
  }

  .mc-avatar-initials {
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #0b6b4a, #065f46);
    color: #fcd34d;
    font-size: 0.82rem;
    font-weight: 800;
  }

  .mc-icon-btn:focus-visible,
  .mc-logo:focus-visible,
  .mc-avatar-link:focus-visible {
    outline: 3px solid #b45309;
    outline-offset: 1px;
  }

}

.mc-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* ---- the Menu sheet (teleported to body, so these are not under the media query above) ---- */
.mc-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(15, 23, 42, 0.5);
}

.mc-sheet {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  max-height: min(88vh, 760px);
  border-radius: 22px 22px 0 0;
  background: #fbf9f3;
  box-shadow: 0 -18px 50px rgba(0, 0, 0, 0.3);
  outline: none;
}

.mc-grab {
  flex: none;
  width: 40px;
  height: 4px;
  margin: 10px auto 2px;
  border-radius: 999px;
  background: #d3d9d5;
}

.mc-sheet-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px 12px 18px;
  border-bottom: 1px solid rgba(11, 59, 42, 0.1);
}

.mc-sheet .mc-avatar {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(180, 83, 9, 0.5);
}

.mc-sheet .mc-avatar-initials {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #0b6b4a, #065f46);
  color: #fcd34d;
  font-weight: 800;
}

.mc-who {
  flex: 1;
  min-width: 0;
}

.mc-who h2 {
  margin: 0;
  overflow: hidden;
  font-size: 1.02rem;
  font-weight: 800;
  line-height: 1.25;
  color: #0b3b2a;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-who p {
  margin: 1px 0 0;
  font-size: 0.8rem;
  color: #5b6b62;
}

.mc-pill {
  flex: none;
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(10, 92, 64, 0.35);
  background: #f0f8f4;
  color: #0a5c40;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
}

.mc-sheet .mc-icon-btn {
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 12px;
  background: none;
  color: #3b4a42;
  cursor: pointer;
}

.mc-sheet-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px 14px 4px;
}

.mc-nspq {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  margin-bottom: 6px;
  padding: 8px 12px;
  border-radius: 14px;
  background: #03291d;
  color: #fcd34d;
  text-decoration: none;
}

.mc-nspq span {
  display: flex;
  flex-direction: column;
  flex: 1;
  line-height: 1.2;
}

.mc-nspq small {
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #fcd34d;
}

.mc-nspq strong {
  font-size: 0.95rem;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.mc-ext {
  flex: none;
  opacity: 0.7;
}

.mc-group {
  padding-top: 12px;
}

.mc-group h3 {
  margin: 0 0 8px 2px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #8a5a14;
}

.mc-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.mc-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 86px;
  padding: 10px 4px 8px;
  border-radius: 14px;
  border: 1px solid rgba(11, 59, 42, 0.1);
  background: #fff;
  color: #1f3a2f;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.mc-tile:active {
  background: #f0f8f4;
}

.mc-tile-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: #e3f1ea;
  color: #0a5c40;
}

.mc-tile-label {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  overflow-wrap: anywhere;
}

.mc-tile.is-active {
  border-color: #0a5c40;
  background: #f0f8f4;
  box-shadow: inset 0 0 0 1px #0a5c40;
}

.mc-tile.is-active .mc-tile-icon {
  background: #0a5c40;
  color: #fcd34d;
}

.mc-sheet .mc-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #b45309;
  color: #fff;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 0 0 2px #fff;
}

.mc-sheet-foot {
  flex: none;
  padding: 10px 14px calc(12px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(11, 59, 42, 0.1);
  background: #fbf9f3;
}

.mc-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 14px;
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.mc-logout:active {
  background: rgba(220, 38, 38, 0.16);
}

.mc-tile:focus-visible,
.mc-pill:focus-visible,
.mc-nspq:focus-visible,
.mc-logout:focus-visible,
.mc-sheet .mc-icon-btn:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

/* the same sheet, from the bottom */
.mc-sheet-enter-active,
.mc-sheet-leave-active {
  transition: opacity 0.18s ease;
}

.mc-sheet-enter-active .mc-sheet,
.mc-sheet-leave-active .mc-sheet {
  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.mc-sheet-enter-from,
.mc-sheet-leave-to {
  opacity: 0;
}

.mc-sheet-enter-from .mc-sheet,
.mc-sheet-leave-to .mc-sheet {
  transform: translateY(100%);
}

@media (min-width: 1024px) {
  .mc-overlay {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mc-sheet-enter-active,
  .mc-sheet-leave-active,
  .mc-sheet-enter-active .mc-sheet,
  .mc-sheet-leave-active .mc-sheet,
  .mc-swap-enter-active,
  .mc-swap-leave-active {
    transition: none;
  }
}
</style>
