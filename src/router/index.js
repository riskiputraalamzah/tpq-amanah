import { createRouter, createWebHistory } from "vue-router";
import { applyThemeColor } from "@/utils/themeColor";
import { isChunkLoadError, recoverFromChunkError } from "@/utils/chunkRecovery";

import HomeView from "../views/HomeView.vue";
import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomeView,
  },
  {
    path: "/dokumentasi",
    name: "GalleryArchive",
    component: () => import("../views/GalleryArchiveView.vue"),
  },
  {
    path: "/dokumentasi/:slug",
    name: "GalleryMomentDetail",
    component: () => import("../views/GalleryMomentDetailView.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/a/:code",
    name: "QuickAttendance",
    component: () => import("../views/QuickAttendanceView.vue"),
  },
  {
    path: "/tabungan/:bookId",
    name: "PublicSavings",
    component: () => import("../views/PublicSavingsView.vue"),
  },
  {
    path: "/p/tabungan/:bookId",
    redirect: (to) => `/tabungan/${to.params.bookId}`,
  },
  {
    path: "/savings/public/:bookId",
    redirect: (to) => `/tabungan/${to.params.bookId}`,
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("../views/dashboard/DashboardLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "DashboardHome",
        component: () => import("../views/dashboard/DashboardHome.vue"),
      },
      // Admin routes
      {
        path: "users",
        name: "UserManagement",
        component: () => import("../views/dashboard/admin/UserManagement.vue"),
        meta: { role: "admin" },
      },
      {
        path: "lpj-insentif",
        name: "LpjInsentif",
        component: () =>
          import("../views/dashboard/admin/LpjInsentifView.vue"),
        meta: { role: "admin" },
      },
      {
        path: "kbm-monitor",
        name: "KbmMonitor",
        component: () =>
          import("../views/dashboard/admin/KbmMonitorView.vue"),
        meta: { role: "admin", feature: "kbm-monitor" },
      },
      {
        path: "wa-reminders",
        name: "WaReminders",
        component: () =>
          import("../views/dashboard/admin/WaReminderView.vue"),
        meta: { role: "admin" },
      },
      {
        path: "content",
        name: "ContentManagement",
        component: () =>
          import("../views/dashboard/admin/ContentManagement.vue"),
        meta: { role: "admin" },
      },
      {
        path: "teachers",
        name: "TeacherManagement",
        component: () =>
          import("../views/dashboard/admin/TeacherManagement.vue"),
        meta: { role: "admin" },
      },
      {
        path: "wali-santri",
        name: "WaliSantriAdmin",
        component: () => import("../views/dashboard/admin/AdminWaliView.vue"),
        meta: { role: ["admin", "guru"] },
      },
      {
        // WhatsApp the parents of a santri from the teacher's own phone (scope: the server's, like Data Wali Santri)
        path: "hubungi-wali",
        name: "HubungiWali",
        component: () => import("../views/dashboard/HubungiWaliView.vue"),
        meta: { role: ["admin", "guru"] },
      },
      {
        path: "santri",
        name: "SantriManagement",
        component: () =>
          import("../views/dashboard/admin/AdminSantriView.vue"),
        meta: { role: ["admin", "guru"] },
      },
      {
        path: "admin-attendance",
        name: "AdminAttendance",
        component: () =>
          import("../views/dashboard/admin/AdminAttendanceView.vue"),
        meta: { role: "admin", feature: "admin-attendance-view" },
      },
      // Note: TeacherAttendanceDetail route removed - all info now on main page
      // the old free-form "Penilaian" became the Rapor (user decision 2026-11-28)
      { path: "admin-grading", redirect: "/dashboard/rapor" },
      { path: "admin-grading/:periodId", redirect: "/dashboard/rapor" },
      // Rapor (Laporan Perkembangan Santri): admin and guru, the page shows what the role may do
      { path: "rapor", name: "Rapor", component: () => import("../views/dashboard/rapor/RaporHome.vue") },
      { path: "rapor/:periodId", name: "RaporBoard", component: () => import("../views/dashboard/rapor/RaporBoard.vue") },
      { path: "rapor/:periodId/santri/:santriId", name: "RaporEdit", component: () => import("../views/dashboard/rapor/RaporEdit.vue") },
      { path: "rapor/:periodId/santri/:santriId/cetak", name: "RaporPrint", component: () => import("../views/dashboard/rapor/RaporPrint.vue") },
      // Guru routes
      {
        path: "kbm",
        name: "Kbm",
        component: () => import("../views/dashboard/guru/KbmView.vue"),
        meta: { role: "guru" },
      },
      {
        path: "kbm/daily-workspace",
        name: "DailyWorkspace",
        component: () => import("../views/dashboard/guru/DailyWorkspace.vue"),
        meta: { role: ["guru", "admin"] },
      },
      {
        path: "kbm/:id/jurnal",
        name: "Journal",
        component: () =>
          import("../views/dashboard/guru/JournalView.vue"),
        meta: { role: "guru" },
      },
      {
        path: "kbm/:id/absensi",
        name: "StudentAttendance",
        component: () =>
          import("../views/dashboard/guru/StudentAttendanceView.vue"),
        meta: { role: "guru" },
      },
      {
        path: "lpj",
        name: "MonthlyLpj",
        component: () =>
          import("../views/dashboard/guru/MonthlyLpjView.vue"),
        meta: { role: "guru" },
      },
      {
        path: "lpj/:id",
        name: "LpjDetail",
        component: () =>
          import("../views/dashboard/guru/LpjDetailView.vue"),
        meta: { role: ["guru", "admin"] },
      },
      {
        path: "lpj/:id/sptjm",
        name: "Sptjm",
        component: () =>
          import("../views/dashboard/guru/SptjmView.vue"),
        meta: { role: ["guru", "admin"] },
      },
      {
        path: "admin-lpj",
        name: "AdminLpj",
        component: () =>
          import("../views/dashboard/admin/AdminLpjView.vue"),
        meta: { role: "admin" },
      },
      {
        path: "admin-documents",
        name: "AdminDocuments",
        component: () =>
          import("../views/dashboard/admin/AdminDocumentView.vue"),
        meta: { role: "admin" },
      },
      {
        path: "attendance",
        name: "Attendance",
        component: () => import("../views/dashboard/guru/AttendanceView.vue"),
        meta: { role: "guru" },
      },
      { path: "grading", redirect: "/dashboard/rapor" },
      { path: "grading/:periodId", redirect: "/dashboard/rapor" },
      {
        path: "savings",
        name: "Savings",
        component: () => import("../views/dashboard/guru/SavingsView.vue"),
        meta: { role: "guru" },
      },
      {
        path: "savings/:bookId",
        name: "SavingsDetail",
        component: () =>
          import("../views/dashboard/guru/SavingsDetailView.vue"),
        meta: { role: ["guru", "admin"] },
      },
      // Admin savings
      {
        path: "admin-savings",
        name: "AdminSavings",
        component: () =>
          import("../views/dashboard/admin/AdminSavingsView.vue"),
        meta: { role: "admin" },
      },
      {
        path: "announcements",
        name: "AnnouncementManagement",
        component: () =>
          import("../views/dashboard/admin/AnnouncementManagement.vue"),
        meta: { role: "admin" },
      },
      {
        path: "broadcasts",
        name: "BroadcastManagement",
        component: () =>
          import("../views/dashboard/admin/BroadcastManagement.vue"),
        meta: { role: "admin" },
      },
      {
        path: "absen-santri",
        name: "AbsenSantri",
        component: () => import("../views/dashboard/guru/AbsenSantriView.vue"),
        meta: { role: ["guru", "admin"] },
      },
      {
        path: "izin-santri",
        name: "IzinSantri",
        component: () => import("../views/dashboard/guru/IzinSantriView.vue"),
        meta: { role: ["guru", "admin"] },
      },
      {
        path: "pengumuman-wali",
        name: "WaliAnnouncements",
        component: () => import("../views/dashboard/admin/WaliAnnouncementsView.vue"),
        meta: { role: "admin" },
      },
      {
        path: "masukan-wali",
        name: "WaliFeedbackAdmin",
        component: () => import("../views/dashboard/admin/AdminFeedbackView.vue"),
        meta: { role: "admin" },
      },
      {
        path: "pendaftaran",
        name: "Pendaftaran",
        component: () => import("../views/dashboard/admin/PendaftaranView.vue"),
        meta: { role: "admin", feature: "pendaftaran" },
      },
      {
        // the staff registers a family at the desk: accepted at once, no placement talk
        path: "pendaftaran/langsung",
        name: "PendaftaranLangsung",
        component: () => import("../views/dashboard/admin/PendaftaranLangsungView.vue"),
        meta: { role: "admin", feature: "pendaftaran" },
      },
      {
        // Pusat WhatsApp: the bot's status, today's messages and the queue, live (tabs: wa-log, broadcasts, wa-reminders)
        path: "whatsapp",
        name: "WhatsAppHub",
        component: () => import("../views/dashboard/admin/WhatsAppHubView.vue"),
        meta: { role: "admin" },
      },
      {
        path: "wa-log",
        name: "WaLog",
        component: () => import("../views/dashboard/admin/WaLogView.vue"),
        meta: { role: "admin", feature: "wa-log" },
      },
      {
        path: "kegiatan",
        name: "Kegiatan",
        component: () => import("../views/dashboard/guru/KegiatanView.vue"),
        meta: { role: "admin", feature: "kegiatan-manage" },
      },
      {
        path: "kegiatan/:id",
        name: "KegiatanDetail",
        component: () => import("../views/dashboard/guru/KegiatanDetailView.vue"),
        meta: { role: "admin", feature: "kegiatan-manage" },
      },
      {
        path: "dokumentasi",
        name: "GalleryManagement",
        component: () => import("../views/dashboard/admin/GalleryManagementView.vue"),
        meta: { role: "admin", feature: "gallery-manage" },
      },
      {
        path: "dokumentasi/baru",
        name: "GalleryMomentCreate",
        component: () => import("../views/dashboard/admin/GalleryMomentFormView.vue"),
        meta: { role: "admin", feature: "gallery-manage" },
      },
      {
        path: "dokumentasi/:id/ubah",
        name: "GalleryMomentEdit",
        component: () => import("../views/dashboard/admin/GalleryMomentFormView.vue"),
        meta: { role: "admin", feature: "gallery-manage" },
      },
      {
        path: "dokumentasi/:id",
        name: "GalleryMomentAdmin",
        component: () => import("../views/dashboard/admin/GalleryMomentAdminView.vue"),
        meta: { role: "admin", feature: "gallery-manage" },
      },
      {
        path: "tpq-profile",
        name: "TpqProfile",
        component: () => import("../views/dashboard/admin/TpqProfileView.vue"),
        meta: { role: "admin" },
      },
      {
        path: "settings",
        redirect: "/dashboard/tpq-profile",
      },
      // Shared / Guru routes
      {
        path: "profile",
        name: "Profile",
        component: () => import("../views/dashboard/guru/ProfileView.vue"),
        meta: { role: ["guru", "admin"] },
      },
    ],
  },
  // Wali santri portal (login with a WhatsApp code). Mobile-first, separate from the staff dashboard.
  {
    path: "/wali",
    component: () => import("../views/wali/WaliLayout.vue"),
    meta: { requiresAuth: true, wali: true },
    children: [
      { path: "", name: "WaliHome", component: () => import("../views/wali/WaliHome.vue") },
      // the forms hide the bottom navigation (they have their own bar at the bottom)
      { path: "tautkan", name: "WaliLink", component: () => import("../views/wali/WaliLink.vue"), meta: { hideNav: true } },
      { path: "santri/:santriId", name: "WaliSantriForm", component: () => import("../views/wali/WaliSantriForm.vue"), meta: { hideNav: true } },
      { path: "izin", name: "WaliIzinPick", component: () => import("../views/wali/WaliIzinPick.vue") },
      { path: "pengumuman", name: "WaliPengumuman", component: () => import("../views/wali/WaliPengumuman.vue") },
      { path: "akun", name: "WaliAkun", component: () => import("../views/wali/WaliAkun.vue") },
      { path: "masukan", name: "WaliMasukan", component: () => import("../views/wali/WaliMasukan.vue") },
      { path: "santri/:santriId/progres", name: "WaliProgress", component: () => import("../views/wali/WaliProgress.vue") },
      { path: "santri/:santriId/kegiatan", name: "WaliKegiatan", component: () => import("../views/wali/WaliKegiatan.vue") },
      { path: "santri/:santriId/kegiatan/:activityId/info", name: "WaliKegiatanInfo", component: () => import("../views/wali/WaliKegiatanInfo.vue") },
      { path: "santri/:santriId/rapor", name: "WaliRapor", component: () => import("../views/wali/WaliRapor.vue") },
      { path: "santri/:santriId/rapor/:periodId", name: "WaliRaporDetail", component: () => import("../views/wali/WaliRaporDetail.vue") },
      { path: "santri/:santriId/rapor/:periodId/cetak", name: "WaliRaporCetak", component: () => import("../views/wali/WaliRaporCetak.vue"), meta: { hideNav: true } },
      // Kartu Prestasi (the daily reading test), its print page (A4) and "Tanda tangan saya" for the paraf
      { path: "santri/:santriId/prestasi", name: "WaliPrestasi", component: () => import("../views/wali/WaliPrestasi.vue") },
      { path: "santri/:santriId/prestasi/cetak", name: "WaliPrestasiCetak", component: () => import("../views/wali/WaliPrestasiCetak.vue"), meta: { hideNav: true } },
      { path: "tanda-tangan", name: "WaliTandaTangan", component: () => import("../views/wali/WaliTandaTangan.vue") },
      { path: "santri/:santriId/izin", name: "WaliIzin", component: () => import("../views/wali/WaliIzin.vue") },
      // pendaftaran santri baru ("baru" starts one, or continues the unfinished one)
      { path: "daftar/:id", name: "WaliDaftar", component: () => import("../views/wali/WaliDaftar.vue"), meta: { hideNav: true } },
    ],
  },
  // the short link on the landing page, posters and WhatsApp: tpqamanahsawotratap.com/daftar
  { path: "/daftar", redirect: "/wali/daftar/baru" },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/NotFoundView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 'instant': the page has scroll-behavior: smooth (for anchor links), which would scroll the new page into view
    // while it slides in
    if (savedPosition) {
      return { ...savedPosition, behavior: "instant" };
    }
    if (to.hash) {
      if (typeof document !== "undefined" && document.querySelector(to.hash)) {
        return { el: to.hash, top: 110, behavior: "smooth" };
      }
      // Async sections (e.g. #dokumentasi, #legalitas) mount after data loads and scroll themselves into view
      return false;
    }
    return { top: 0, behavior: "instant" };
  },
});

// Where a signed-in person belongs: wali santri have their own portal, staff the dashboard.
const homeFor = (user) => (user?.role === "wali" ? "/wali" : "/dashboard");

function getSafeRedirect(redirect, fallback = "/dashboard") {
  if (typeof redirect !== "string") return fallback;
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return fallback;
  if (redirect.startsWith("/login")) return fallback;
  return redirect;
}

let deferredAuthCheckScheduled = false;

// Public pages must not wait for network/Firebase auth, so visitors never get stuck on the splash screen.
function scheduleDeferredAuthCheck(authStore, delayMs = 1500) {
  if (deferredAuthCheckScheduled) return;
  deferredAuthCheckScheduled = true;
  setTimeout(async () => {
    if (authStore.authChecked) return;
    try {
      await authStore.checkAuth();
    } catch {
      return;
    }
    const current = router.currentRoute.value;
    if (current.name === "Login" && authStore.isAuthenticated) {
      const isWali = authStore.user?.role === "wali";
      const target = getSafeRedirect(current.query.redirect, homeFor(authStore.user));
      router.replace(
        isWali && !target.startsWith("/wali")
          ? "/wali"
          : !isWali && target.startsWith("/wali")
            ? "/dashboard"
            : target,
      );
    }
  }, delayMs);
}

function revalidateCachedSession(authStore) {
  const pending = authStore.revalidateSession();
  if (!pending) return;
  pending.then(async (stillValid) => {
    if (stillValid) return;
    await router.isReady();
    const current = router.currentRoute.value;
    if (current.meta.requiresAuth) {
      router.replace({ name: "Login", query: { redirect: current.fullPath } });
    }
  });
}

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.authChecked) {
    if (to.meta.requiresAuth) {
      try {
        await authStore.checkAuth();
      } catch {
        // Guard against unexpected auth errors so initial navigation still resolves
      }
    } else {
      scheduleDeferredAuthCheck(authStore, authStore.token ? 0 : 1500);
    }
  } else {
    revalidateCachedSession(authStore);
  }

  const isWali = authStore.user?.role === "wali";
  const inWaliPortal = to.matched.some((r) => r.meta.wali);
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // a wali coming from a WhatsApp link: open the login on the wali tab
    const query = { redirect: to.fullPath };
    if (inWaliPortal) query.as = "wali";
    next({ name: "Login", query });
  } else if (to.name === "Login" && authStore.isAuthenticated) {
    const target = getSafeRedirect(to.query.redirect, homeFor(authStore.user));
    next(isWali && !target.startsWith("/wali") ? "/wali" : !isWali && target.startsWith("/wali") ? "/dashboard" : target);
  } else if (authStore.isAuthenticated && to.meta.requiresAuth && isWali !== inWaliPortal) {
    // a wali never sees the staff dashboard, staff never the wali portal
    next(homeFor(authStore.user));
  } else if (to.meta.role) {
    const requiredRoles = Array.isArray(to.meta.role)
      ? to.meta.role
      : [to.meta.role];
    const userRole = authStore.user?.role;
    const userPermissions = authStore.user?.permissions?.features || [];

    // Check if user has required role
    if (requiredRoles.includes(userRole)) {
      next();
    }
    // A guru the admin gave this page as "akses khusus" (meta.feature, see backend utils/guru_features.js)
    else if (
      userRole === "guru" &&
      to.meta.feature &&
      userPermissions.includes(to.meta.feature)
    ) {
      next();
    } else {
      next({ name: "DashboardHome" });
    }
  } else {
    next();
  }
});

// After a new deploy, chunks referenced by an already-open tab no longer exist.
router.onError((error, to) => {
  if (!isChunkLoadError(error)) return;
  recoverFromChunkError(to?.fullPath);
});

// The browser's own bars (status bar, address bar) take the colour of the area: dashboard and wali portal are dark green
// like their top bars, the website keeps its brand green.
router.afterEach((to) => applyThemeColor(to.path));

export default router;
