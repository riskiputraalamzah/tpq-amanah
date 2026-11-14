import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomeView,
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
      {
        path: "admin-grading",
        name: "AdminGrading",
        component: () =>
          import("../views/dashboard/admin/AdminGradingView.vue"),
        meta: { role: "admin" },
      },
      {
        path: "admin-grading/:periodId",
        name: "AdminGradingPeriod",
        component: () =>
          import("../views/dashboard/admin/AdminGradingPeriodView.vue"),
        meta: { role: "admin" },
      },
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
      {
        path: "grading",
        name: "Grading",
        component: () => import("../views/dashboard/guru/GradingView.vue"),
        meta: { role: "guru" },
      },
      {
        path: "grading/:periodId",
        name: "GradingPeriod",
        component: () =>
          import("../views/dashboard/guru/GradingPeriodView.vue"),
        meta: { role: "guru" },
      },
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
        path: "pengumuman-wali",
        name: "WaliAnnouncements",
        component: () => import("../views/dashboard/admin/WaliAnnouncementsView.vue"),
        meta: { role: "admin" },
      },
      {
        path: "pendaftaran",
        name: "Pendaftaran",
        component: () => import("../views/dashboard/admin/PendaftaranView.vue"),
        meta: { role: "admin", feature: "pendaftaran" },
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
        meta: { role: ["guru", "admin"] },
      },
      {
        path: "kegiatan/:id",
        name: "KegiatanDetail",
        component: () => import("../views/dashboard/guru/KegiatanDetailView.vue"),
        meta: { role: ["guru", "admin"] },
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
      { path: "santri/:santriId/progres", name: "WaliProgress", component: () => import("../views/wali/WaliProgress.vue") },
      { path: "santri/:santriId/kegiatan", name: "WaliKegiatan", component: () => import("../views/wali/WaliKegiatan.vue") },
      { path: "santri/:santriId/rapor", name: "WaliRapor", component: () => import("../views/wali/WaliRapor.vue") },
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
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
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

// Public pages must not wait for the Firebase SDK, so signed-in visitors are detected after first paint.
function scheduleDeferredAuthCheck(authStore) {
  if (deferredAuthCheckScheduled) return;
  deferredAuthCheckScheduled = true;
  setTimeout(async () => {
    if (authStore.authChecked) return;
    await authStore.checkAuth();
    const current = router.currentRoute.value;
    if (current.name === "Login" && authStore.isAuthenticated) {
      router.replace(getSafeRedirect(current.query.redirect));
    }
  }, 1500);
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
    if (to.meta.requiresAuth || authStore.token) {
      await authStore.checkAuth();
    } else {
      scheduleDeferredAuthCheck(authStore);
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
  if (!/dynamically imported module|Importing a module script failed/i.test(error?.message || "")) return;
  const reloadKey = `tpq_chunk_reload:${to.fullPath}`;
  if (sessionStorage.getItem(reloadKey)) return;
  sessionStorage.setItem(reloadKey, "1");
  window.location.assign(to.fullPath);
});

export default router;
