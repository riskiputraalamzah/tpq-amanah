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
        meta: { role: "admin" },
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

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: "Login", query: { redirect: to.fullPath } });
  } else if (to.name === "Login" && authStore.isAuthenticated) {
    next(getSafeRedirect(to.query.redirect));
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
    // Special case: guru with admin-attendance-view permission can access admin-attendance
    else if (
      userRole === "guru" &&
      to.name === "AdminAttendance" &&
      userPermissions.includes("admin-attendance-view")
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
