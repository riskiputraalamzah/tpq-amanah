<template>
  <div class="dashboard-layout">
    <!-- Announcement Banner (global, rendered via Teleport in component) -->
    <AnnouncementBanner />
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <router-link to="/" class="sidebar-header">
          <img :src="logoUrl" alt="TPQ AMANAH" class="sidebar-logo" />
          <span class="sidebar-title">TPQ AMANAH</span>
        </router-link>
        <a
          :href="tpqIdentity.sipdarUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="sidebar-nspq"
          :aria-label="`NSPQ ${tpqIdentity.nspq}, buka sertifikat LPQ di SIPDAR Kemenag (tab baru)`"
          title="Buka sertifikat LPQ di SIPDAR Kemenag"
        >
          <svg class="sidebar-nspq-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <span class="sidebar-nspq-text">
            <span class="sidebar-nspq-label">NSPQ</span>
            <span class="sidebar-nspq-number">{{ tpqIdentity.nspq }}</span>
          </span>
          <svg class="sidebar-nspq-external" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      <nav class="sidebar-nav">
        <!-- Beranda / Utama -->
        <router-link to="/dashboard" class="sidebar-link" exact-active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Dashboard
        </router-link>

        <!-- Menu groups by job (admin: santri & wali, KBM, keuangan, WhatsApp, pengaturan; guru: mengajar, santri,
             akses khusus, akun). A group folds; the one holding the open page is always open. -->
        <template v-for="g in menuGroups" :key="g.key">
          <button type="button" class="sidebar-section sidebar-group-toggle" :aria-expanded="isGroupOpen(g)"
            :aria-controls="`menu-group-${g.key}`" @click="toggleGroup(g)">
            <span class="sidebar-group-title">{{ g.title }}</span>
            <span v-if="!isGroupOpen(g) && groupBadge(g)" class="sidebar-badge is-small">{{ groupBadge(g) }}</span>
            <svg class="sidebar-chevron" :class="{ 'is-open': isGroupOpen(g) }" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <div v-show="isGroupOpen(g)" :id="`menu-group-${g.key}`" class="sidebar-group">
            <router-link v-for="m in g.items" :key="m.to" :to="m.to" class="sidebar-link" :class="{ active: isItemActive(m) }">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="m.icon"></svg>
              {{ m.label }}
              <span v-if="m.badge && badges[m.badge]" class="sidebar-badge" :aria-label="`${badges[m.badge]} ${BADGE_LABEL[m.badge]}`">{{ badges[m.badge] }}</span>
            </router-link>
          </div>
        </template>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/dashboard/profile" class="sidebar-user" v-if="user" title="Lihat & Edit Profil">
          <img v-if="user.photoURL" :src="user.photoURL" :alt="user.displayName" class="sidebar-user-avatar" />
          <div v-else class="sidebar-user-avatar-placeholder">
            {{ getInitials(user.displayName) }}
          </div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">{{ user.displayName }}</span>
            <span class="sidebar-user-role">{{ getRoleLabel(user.role) }}</span>
          </div>
        </router-link>
        <button class="sidebar-logout" @click="handleLogout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="dashboard-main">
      <div class="dashboard-content">
        <PageSkeleton v-if="routeLoading" :stats="3" :rows="6" />
        <div v-show="!routeLoading">
          <router-view v-slot="{ Component }">
            <!-- the old and the new page slide together; the direction follows where you are going (usePageTransition) -->
            <transition :name="pageTransition" @before-leave="onBeforeLeave">
              <component :is="Component" :key="$route.path" />
            </transition>
          </router-view>
        </div>
      </div>
    </main>

    <!-- Phone frame for admin and guru: top bar (context), bottom bar (main places) and the Menu sheet -->
    <MobileChrome
      :groups="menuGroups"
      :role="isAdmin ? 'admin' : 'guru'"
      :user="user"
      :badges="badges"
      :badge-labels="BADGE_LABEL"
      :nspq="tpqIdentity"
      @logout="handleLogout"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { usePendaftaranCount } from "@/composables/usePendaftaranCount";
import { useWaliBadge } from "@/composables/useWaliBadge";
import "@/styles/landing.css";
import "@/styles/dashboard.css";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAnnouncementStore } from "@/stores/announcements";
import AnnouncementBanner from "@/components/AnnouncementBanner.vue";
import MobileChrome from "@/components/MobileChrome.vue";
import { usePageTransition } from "@/composables/usePageTransition";
import PageSkeleton from "@/components/PageSkeleton.vue";
import api from "@/services/api";
import { prefetchDashboardRoutes } from "@/utils/prefetch";
import { useTpqIdentity } from "@/composables/useTpqIdentity";

const logoUrl = new URL("@/assets/logo-sm.png", import.meta.url).href;

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const announcementStore = useAnnouncementStore();

const user = computed(() => authStore.user);
const isAdmin = computed(() => authStore.isAdmin);
const isGuru = computed(() => authStore.isGuru);

const { name: pageTransition, onBeforeLeave } = usePageTransition({ role: () => (isAdmin.value ? "admin" : "guru") });

// Pages a guru can be given as "akses khusus" (feature ids: backend utils/guru_features.js; routes: meta.feature)
const SPECIAL_MENUS = [
  { id: 'admin-attendance-view', to: '/dashboard/admin-attendance', label: 'Rekap Absensi', icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M12 16v-4" /><path d="M8 16v-2" /><path d="M16 16v-3" />' },
  { id: 'kbm-monitor', to: '/dashboard/kbm-monitor', label: 'Monitor KBM', icon: '<rect x="3" y="4" width="18" height="16" rx="2" /><polyline points="7 13 10 16 17 9" />' },
  { id: 'pendaftaran', to: '/dashboard/pendaftaran', label: 'Pendaftaran', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />' },
  { id: 'wa-log', to: '/dashboard/wa-log', label: 'Riwayat WA Bot', icon: '<circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />' },
];
// ---- the side menu, grouped by what the person is doing ----
const ICON = {
  santri: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />',
  daftar: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />',
  wali: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Z" /><path d="M16 9a3 3 0 0 1 0 6" /><path d="M19 6a7 7 0 0 1 0 12" />',
  star: '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" />',
  absenSantri: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />',
  kbm: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />',
  monitor: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><polyline points="9 10 11 12 15 8" />',
  rekap: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M12 16v-4" /><path d="M8 16v-2" /><path d="M16 16v-3" />',
  absensi: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M9 16l2 2 4-4" />',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />',
  coin: '<circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /><path d="M8 14h8" />',
  bell: '<path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />',
  clock: '<circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />',
  building: '<path d="M3 21h18" /><path d="M5 21V7l8-4 6 3v15" /><path d="M9 10h2" /><path d="M9 14h2" /><path d="M9 18h2" />',
  person: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />',
}
const ADMIN_GROUPS = [
  {
    key: 'santri',
    title: 'Santri & Wali',
    items: [
      { to: '/dashboard/santri', label: 'Kelola Santri', icon: ICON.santri },
      { to: '/dashboard/pendaftaran', label: 'Pendaftaran', icon: ICON.daftar, badge: 'pendaftaran' },
      { to: '/dashboard/wali-santri', label: 'Data Wali Santri', icon: ICON.wali, badge: 'wali' },
      { to: '/dashboard/kegiatan', label: 'Kegiatan', icon: ICON.star },
    ],
  },
  {
    key: 'kbm',
    title: 'Belajar Mengajar',
    items: [
      { to: '/dashboard/absen-santri', label: 'Absen Santri', icon: ICON.absenSantri },
      { to: '/dashboard/kbm-monitor', label: 'Monitor KBM', icon: ICON.monitor },
      { to: '/dashboard/admin-attendance', label: 'Rekap Absensi Guru', icon: ICON.rekap },
      { to: '/dashboard/admin-grading', label: 'Kelola Penilaian', icon: ICON.doc },
    ],
  },
  {
    key: 'uang',
    title: 'Keuangan',
    items: [
      { to: '/dashboard/admin-savings', label: 'Tabungan Santri', icon: ICON.coin, also: ['/dashboard/savings'] },
      { to: '/dashboard/lpj-insentif', label: 'LPJ Insentif Guru', icon: ICON.doc, also: ['/dashboard/admin-lpj', '/dashboard/admin-documents'] },
    ],
  },
  {
    // everything WhatsApp is one page with tabs (Pusat WhatsApp: status, riwayat & antrean, broadcast, pengingat guru)
    key: 'info',
    title: 'Komunikasi',
    items: [
      { to: '/dashboard/whatsapp', label: 'Pusat WhatsApp', icon: ICON.chat, also: ['/dashboard/wa-log', '/dashboard/broadcasts', '/dashboard/wa-reminders'] },
      { to: '/dashboard/pengumuman-wali', label: 'Pengumuman Wali', icon: ICON.megaphone },
      { to: '/dashboard/announcements', label: 'Pengumuman Guru & Web', icon: ICON.bell },
    ],
  },
  {
    key: 'atur',
    title: 'Pengaturan',
    items: [
      { to: '/dashboard/tpq-profile', label: 'Profil TPQ', icon: ICON.building },
      { to: '/dashboard/teachers', label: 'Kelola Pengajar', icon: ICON.person },
      { to: '/dashboard/users', label: 'Akun Pengguna', icon: ICON.santri },
      { to: '/dashboard/content', label: 'Konten Website', icon: ICON.edit },
    ],
  },
]
const menuGroups = computed(() => {
  if (isAdmin.value) return ADMIN_GROUPS
  if (!isGuru.value) return []
  const groups = [
    {
      key: 'mengajar',
      title: 'Mengajar',
      items: [
        { to: '/dashboard/attendance', label: 'Absensi Saya', icon: ICON.absensi },
        { to: '/dashboard/kbm', label: 'KBM / Mengajar', icon: ICON.kbm },
        { to: '/dashboard/absen-santri', label: 'Absen Santri', icon: ICON.absenSantri },
        { to: '/dashboard/grading', label: 'Penilaian', icon: ICON.doc },
      ],
    },
    {
      key: 'santri',
      title: 'Santri & Wali',
      items: [
        { to: '/dashboard/santri', label: 'Data Santri', icon: ICON.santri },
        { to: '/dashboard/wali-santri', label: 'Data Wali Santri', icon: ICON.wali, badge: 'wali' },
        { to: '/dashboard/kegiatan', label: 'Kegiatan', icon: ICON.star },
        { to: '/dashboard/savings', label: 'Tabungan', icon: ICON.coin },
      ],
    },
  ]
  if (specialMenus.value.length) {
    groups.push({
      key: 'khusus',
      title: 'Akses Khusus', // always this name: the same for every guru, whatever was typed before
      items: specialMenus.value.map((m) => ({ to: m.to, label: m.label, icon: m.icon, badge: m.id === 'pendaftaran' ? 'pendaftaran' : '' })),
    })
  }
  groups.push({ key: 'akun', title: 'Akun', items: [{ to: '/dashboard/profile', label: 'Profil Saya', icon: ICON.person }] })
  return groups
})

const isItemActive = (m) => isActive(m.to) || (m.also || []).some((p) => isActive(p))
// folded groups, remembered on this device; the admin starts with only the open page's group unfolded
const FOLD_KEY = 'sidebar_folded_groups'
const readFolded = () => {
  try {
    const v = JSON.parse(localStorage.getItem(FOLD_KEY) || 'null')
    return Array.isArray(v) ? v : null
  } catch {
    return null
  }
}
const folded = ref(readFolded())
const isGroupOpen = (g) => g.items.some(isItemActive) || !(folded.value ?? (isAdmin.value ? ADMIN_GROUPS.map((x) => x.key) : [])).includes(g.key)
function toggleGroup(g) {
  const current = folded.value ?? (isAdmin.value ? ADMIN_GROUPS.map((x) => x.key) : [])
  const open = isGroupOpen(g)
  // the group of the open page stays open; folding it would hide where the person is
  if (open && g.items.some(isItemActive)) return
  folded.value = open ? [...new Set([...current, g.key])] : current.filter((k) => k !== g.key)
  try {
    localStorage.setItem(FOLD_KEY, JSON.stringify(folded.value))
  } catch {
    /* private mode: for this visit only */
  }
}
// a folded group shows what waits inside it
const groupBadge = (g) => g.items.reduce((n, m) => n + (m.badge ? badges.value[m.badge] || 0 : 0), 0)

const specialMenus = computed(() =>
  isGuru.value ? SPECIAL_MENUS.filter((m) => user.value?.permissions?.features?.includes(m.id)) : [],
);

// Check if user has specific permission
const hasPermission = (permissionId) => {
  return user.value?.permissions?.features?.includes(permissionId) || false;
};

const { tpqIdentity, loadTpqIdentity } = useTpqIdentity();


// Check if current route matches or starts with the given path
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + "/");
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getRoleLabel = (role) => {
  const labels = {
    admin: "Administrator",
    guru: "Guru",
    santri: "Santri",
  };
  return labels[role] || role;
};

const handleLogout = async () => {
  announcementStore.reset();
  await authStore.logout();
  router.push("/");
};

// New registrants nobody has contacted yet (admin, or a guru given "Pendaftaran santri")
const { count: newRegistrations, refresh: refreshRegistrations } = usePendaftaranCount();
const seesRegistrations = computed(() => isAdmin.value || hasPermission("pendaftaran"));
// What waits for a decision in Data Wali Santri (a teacher: their jilid; the admin: what was handed to the admin)
const { count: waliWaiting, refresh: refreshWali } = useWaliBadge();
// every badge of the menus, by the key a menu item names (sidebar, the phone's tabs and its Menu sheet)
const BADGE_LABEL = { pendaftaran: "pendaftar baru", wali: "data wali perlu diproses" };
const badges = computed(() => ({
  pendaftaran: seesRegistrations.value ? newRegistrations.value : 0,
  wali: isAdmin.value || isGuru.value ? waliWaiting.value : 0,
}));

watch(
  () => route.path,
  () => {
    if (seesRegistrations.value) refreshRegistrations();
    if (isAdmin.value || isGuru.value) refreshWali();
    // a special access the admin added or removed shows in the menus without signing in again (at most once a minute)
    authStore.refreshUser();
  }
);
// back to the app (another tab, the phone unlocked): the account's access again
const onVisible = () => {
  if (document.visibilityState === "visible") authStore.refreshUser();
};

// Shows a skeleton only when a page's code is still downloading; short waits stay invisible.
const ROUTE_SKELETON_DELAY_MS = 80;
const routeLoading = ref(false);
let routeLoadingTimer = null;

const stopRouteLoading = () => {
  clearTimeout(routeLoadingTimer);
  routeLoading.value = false;
};

const removeBeforeEach = router.beforeEach((to, from) => {
  if (to.path !== from.path && to.path.startsWith("/dashboard")) {
    clearTimeout(routeLoadingTimer);
    routeLoadingTimer = setTimeout(() => {
      routeLoading.value = true;
    }, ROUTE_SKELETON_DELAY_MS);
  }
});
const removeAfterEach = router.afterEach(stopRouteLoading);
const removeOnError = router.onError(stopRouteLoading);

onBeforeUnmount(() => {
  stopRouteLoading();
  removeBeforeEach();
  removeAfterEach();
  removeOnError();
  document.removeEventListener("visibilitychange", onVisible);
});

onMounted(() => {
  if (authStore.isAuthenticated && !announcementStore.fetched) {
    announcementStore.fetchActive();
  }
  prefetchDashboardRoutes(router, authStore.user?.role);
  if (authStore.isAuthenticated) loadTpqIdentity();
  if (seesRegistrations.value) refreshRegistrations({ force: true });
  if (isAdmin.value || isGuru.value) refreshWali({ force: true });
  document.addEventListener("visibilitychange", onVisible);
});
</script>

<style scoped>
/* Dashboard shell: the landing page's language, kept quiet. A deep emerald rail with gold hairlines on an ivory
   work area. Positions, breakpoints and behaviour are unchanged; only the look is new. */
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: var(--lp-ivory);
  /* the one stacking context of the dashboard: the page's pop-ups (9990 and up) and the phone bars (300) are in it
     together, so a pop-up always covers the bars. Not on .dashboard-main: that would shut every pop-up of a page
     under the bars (test/layers.test.js). */
  isolation: isolate;
}

/* ------------------------------------------------------------ sidebar */
.sidebar {
  width: 280px;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: var(--z-fixed);
  display: none; /* phones and tablets use the top bar, bottom bar and Menu sheet (MobileChrome) */
  flex-direction: column;
  isolation: isolate;
  color: #d1fae5;
  background: linear-gradient(180deg, #03291d 0%, #04231a 62%, #021c13 100%);
  border-right: 1px solid rgba(252, 211, 77, 0.2);
  box-shadow: 10px 0 34px -14px rgba(2, 28, 19, 0.55);
}

.sidebar::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: var(--lp-khatam-gold);
  background-size: 64px 64px;
  background-position: center top;
  opacity: 0.08;
  -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 46%);
  mask-image: linear-gradient(180deg, #000 0%, transparent 46%);
  pointer-events: none;
}

@media (min-width: 1024px) {
  .sidebar {
    display: flex;
    position: sticky;
    top: 0;
    height: 100vh;
  }
}

.sidebar-brand {
  padding-bottom: var(--space-md);
  border-bottom: 1px solid transparent;
  border-image: linear-gradient(90deg, transparent, rgba(252, 211, 77, 0.45), transparent) 1;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-lg) var(--space-sm);
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.sidebar-header:hover {
  opacity: 0.85;
}

.sidebar-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.sidebar-title {
  font-weight: 800;
  font-size: 1.125rem;
  letter-spacing: -0.01em;
  color: #fff;
}

.sidebar-nspq {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  margin: 0 var(--space-lg);
  padding: 8px 12px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(252, 211, 77, 0.3);
  color: #fff;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.sidebar-nspq:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(252, 211, 77, 0.6);
}

.sidebar-nspq:focus-visible {
  outline: 2px solid #fcd34d;
  outline-offset: 2px;
}

.sidebar-nspq-icon {
  flex-shrink: 0;
  color: #fcd34d;
}

.sidebar-nspq-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}

.sidebar-nspq-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #fcd34d;
}

.sidebar-nspq-number {
  font-size: 0.9rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.sidebar-nspq-external {
  flex-shrink: 0;
  margin-left: auto;
  color: rgba(209, 250, 229, 0.6);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-md);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(252, 211, 77, 0.3) transparent;
}

.sidebar-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--space-lg) var(--space-md) var(--space-sm);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(252, 211, 77, 0.8);
}

.sidebar-group-toggle {
  width: 100%;
  border: 0;
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
}

.sidebar-group-toggle:hover {
  color: #fcd34d;
}

.sidebar-group-toggle:focus-visible {
  outline: 2px solid #fcd34d;
  outline-offset: 2px;
}

.sidebar-group-title {
  flex: 1;
}

.sidebar-chevron {
  flex: none;
  opacity: 0.8;
  transform: rotate(-90deg);
  transition: transform 0.15s ease;
}

.sidebar-chevron.is-open {
  transform: rotate(0deg);
}

.sidebar-badge.is-small {
  margin-left: 0;
  min-width: 18px;
  height: 18px;
  font-size: 0.68rem;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-chevron {
    transition: none;
  }
}

.sidebar-section::before {
  content: "";
  width: 5px;
  height: 5px;
  flex: none;
  background: currentColor;
  transform: rotate(45deg);
}

.sidebar-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  margin-bottom: var(--space-xs);
  border-radius: var(--radius-lg);
  color: rgba(209, 250, 229, 0.85);
  font-weight: 500;
  transition: background-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
}

.sidebar-badge {
  margin-left: auto;
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: #fcd34d;
  color: #3b2404;
  font-size: 0.75rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}

.sidebar-link:focus-visible {
  outline: 2px solid #fcd34d;
  outline-offset: -2px;
}

.sidebar-link.active {
  background: rgba(252, 211, 77, 0.13);
  color: #fcd34d;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(252, 211, 77, 0.3);
}

.sidebar-link.active::after {
  content: "";
  width: 6px;
  height: 6px;
  margin-left: auto;
  flex: none;
  background: currentColor;
  transform: rotate(45deg);
}

.sidebar-footer {
  padding: var(--space-md);
  border-top: 1px solid transparent;
  border-image: linear-gradient(90deg, transparent, rgba(252, 211, 77, 0.4), transparent) 1;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
  border-radius: var(--radius-lg);
  transition: background-color 0.2s ease;
}

.sidebar-user:hover {
  background: rgba(255, 255, 255, 0.06);
}

.sidebar-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
  box-shadow: 0 0 0 2px rgba(252, 211, 77, 0.55);
}

.sidebar-user-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #0b6b4a, #065f46);
  color: #fcd34d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  box-shadow: 0 0 0 2px rgba(252, 211, 77, 0.55);
}

.sidebar-user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sidebar-user-name {
  font-weight: 600;
  color: #fff;
  font-size: 0.875rem;
}

.sidebar-user-role {
  font-size: 0.75rem;
  color: rgba(167, 243, 208, 0.85);
}

.sidebar-logout {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  min-height: 44px;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  color: #fca5a5;
  font-weight: 500;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.sidebar-logout:hover {
  background: rgba(248, 113, 113, 0.14);
  color: #fecaca;
}

.sidebar-logout:focus-visible {
  outline: 2px solid #fca5a5;
  outline-offset: -2px;
}

/* ------------------------------------------------------------ main work area */
.dashboard-main {
  position: relative;
  flex: 1;
  padding: var(--space-xl);
  min-height: 100vh;
  width: 100%;
  min-width: 0;
}

.dashboard-main::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 28rem;
  z-index: -1;
  background-image: var(--lp-khatam-brown);
  background-size: 64px 64px;
  background-position: center top;
  opacity: 0.05;
  -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 0%, transparent 100%);
  pointer-events: none;
}

/* phones and tablets: the content starts under the top bar and ends above the bottom bar */
.dashboard-layout {
  --appbar-h: 0px;
  --nav-h: 0px;
  --nav-over: 0px;
}

@media (max-width: 1023px) {
  .dashboard-layout {
    --appbar-h: calc(56px + env(safe-area-inset-top, 0px) + var(--banner-h, 0px));
    --nav-h: calc(64px + env(safe-area-inset-bottom, 0px));
    --nav-over: 24px; /* the bubble rises this far above the bottom bar */
  }

  /* the ONLY place that sets a page's margins on a phone: 16px sides and under the top bar, and above the
     bottom bar room for the bar, the bubble that rises above it, and 8px. A page's own root must not add padding or margin of its own. */
  .dashboard-main {
    padding: calc(var(--appbar-h) + 16px) 16px calc(var(--nav-h) + var(--nav-over) + 8px);
    overflow-x: clip; /* a page sliding in is wider than the screen for a moment */
  }

  .dashboard-content :deep(.glass-card:last-child) {
    margin-bottom: 0;
  }
}

@media (min-width: 1024px) {
  .dashboard-main {
    padding: var(--space-2xl);
  }

  .loading-overlay {
    left: 280px !important;
  }
}

.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(251, 249, 243, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all var(--transition-normal);
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(180, 83, 9, 0.18);
  border-top-color: #b45309;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.loading-spinner p {
  color: var(--lp-ink);
  font-weight: 500;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.15s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

/* Standard Dashboard Page Header (Admin & Guru) */
:deep(.page-header) {
  margin-bottom: var(--space-xl);
}

:deep(.page-header h1) {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--lp-ink);
  margin-bottom: 0.25rem;
  line-height: 1.25;
}

:deep(.page-header p) {
  font-size: 0.95rem;
  color: #5b6b62;
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 640px) {
  :deep(.page-header h1) {
    font-size: 1.45rem;
  }

  :deep(.page-header p) {
    font-size: 0.875rem;
  }
}

</style>
