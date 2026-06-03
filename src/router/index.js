import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/HomeView.vue')
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/LoginView.vue')
    },
    {
        path: '/a/:code',
        name: 'QuickAttendance',
        component: () => import('../views/QuickAttendanceView.vue')
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/DashboardLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'DashboardHome',
                component: () => import('../views/dashboard/DashboardHome.vue')
            },
            // Admin routes
            {
                path: 'users',
                name: 'UserManagement',
                component: () => import('../views/dashboard/admin/UserManagement.vue'),
                meta: { role: 'admin' }
            },
            {
                path: 'content',
                name: 'ContentManagement',
                component: () => import('../views/dashboard/admin/ContentManagement.vue'),
                meta: { role: 'admin' }
            },
            {
                path: 'teachers',
                name: 'TeacherManagement',
                component: () => import('../views/dashboard/admin/TeacherManagement.vue'),
                meta: { role: 'admin' }
            },
            {
                path: 'admin-attendance',
                name: 'AdminAttendance',
                component: () => import('../views/dashboard/admin/AdminAttendanceView.vue'),
                meta: { role: 'admin' }
            },
            // Note: TeacherAttendanceDetail route removed - all info now on main page
            {
                path: 'admin-grading',
                name: 'AdminGrading',
                component: () => import('../views/dashboard/admin/AdminGradingView.vue'),
                meta: { role: 'admin' }
            },
            {
                path: 'admin-grading/:periodId',
                name: 'AdminGradingPeriod',
                component: () => import('../views/dashboard/admin/AdminGradingPeriodView.vue'),
                meta: { role: 'admin' }
            },
            // Guru routes
            {
                path: 'attendance',
                name: 'Attendance',
                component: () => import('../views/dashboard/guru/AttendanceView.vue'),
                meta: { role: 'guru' }
            },
            {
                path: 'grading',
                name: 'Grading',
                component: () => import('../views/dashboard/guru/GradingView.vue'),
                meta: { role: 'guru' }
            },
            {
                path: 'grading/:periodId',
                name: 'GradingPeriod',
                component: () => import('../views/dashboard/guru/GradingPeriodView.vue'),
                meta: { role: 'guru' }
            },
            {
                path: 'savings',
                name: 'Savings',
                component: () => import('../views/dashboard/guru/SavingsView.vue'),
                meta: { role: 'guru' }
            },
            {
                path: 'savings/:bookId',
                name: 'SavingsDetail',
                component: () => import('../views/dashboard/guru/SavingsDetailView.vue'),
                meta: { role: ['guru', 'admin'] }
            },
            // Admin savings
            {
                path: 'admin-savings',
                name: 'AdminSavings',
                component: () => import('../views/dashboard/admin/AdminSavingsView.vue'),
                meta: { role: 'admin' }
            },
            {
                path: 'announcements',
                name: 'AnnouncementManagement',
                component: () => import('../views/dashboard/admin/AnnouncementManagement.vue'),
                meta: { role: 'admin' }
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/NotFoundView.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
    const { useAuthStore } = await import('../stores/auth')
    const authStore = useAuthStore()

    // Wait for auth to be checked
    if (!authStore.authChecked) {
        await authStore.checkAuth()
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
    } else if (to.name === 'Login' && authStore.isAuthenticated) {
        next({ name: 'Dashboard' })
    } else if (to.meta.role) {
        const requiredRoles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role]
        const userRole = authStore.user?.role
        const userPermissions = authStore.user?.permissions?.features || []

        // Check if user has required role
        if (requiredRoles.includes(userRole)) {
            next()
        }
        // Special case: guru with admin-attendance-view permission can access admin-attendance
        else if (userRole === 'guru' && to.name === 'AdminAttendance' && userPermissions.includes('admin-attendance-view')) {
            next()
        }
        else {
            next({ name: 'DashboardHome' })
        }
    } else {
        next()
    }
})

export default router
