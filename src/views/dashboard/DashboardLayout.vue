<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
      <div class="sidebar-header">
        <img :src="logoUrl" alt="TPQ AMANAH" class="sidebar-logo" />
        <span class="sidebar-title">TPQ AMANAH</span>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="sidebar-link" exact-active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </router-link>

        <!-- Admin Menu -->
        <template v-if="isAdmin">
          <div class="sidebar-section">Admin</div>
          <router-link to="/dashboard/users" class="sidebar-link" active-class="active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Kelola Users
          </router-link>
          <router-link to="/dashboard/content" class="sidebar-link" :class="{ active: isActive('/dashboard/content') }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Kelola Konten
          </router-link>
          <router-link to="/dashboard/teachers" class="sidebar-link" :class="{ active: isActive('/dashboard/teachers') }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Kelola Pengajar
          </router-link>
          <router-link to="/dashboard/admin-attendance" class="sidebar-link" :class="{ active: isActive('/dashboard/admin-attendance') }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M12 16v-4"/>
              <path d="M8 16v-2"/>
              <path d="M16 16v-3"/>
            </svg>
            Rekap Absensi
          </router-link>
          <router-link to="/dashboard/admin-grading" class="sidebar-link" :class="{ active: isActive('/dashboard/admin-grading') }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Kelola Penilaian
          </router-link>
        </template>

        <!-- Guru Menu -->
        <template v-if="isGuru">
          <div class="sidebar-section">Guru</div>
          <router-link to="/dashboard/attendance" class="sidebar-link" :class="{ active: isActive('/dashboard/attendance') }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M9 16l2 2 4-4"/>
            </svg>
            Absensi
          </router-link>
          <router-link to="/dashboard/grading" class="sidebar-link" :class="{ active: isActive('/dashboard/grading') }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Penilaian
          </router-link>
        </template>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user" v-if="user">
          <img v-if="user.photoURL" :src="user.photoURL" :alt="user.displayName" class="sidebar-user-avatar" />
          <div v-else class="sidebar-user-avatar-placeholder">
            {{ getInitials(user.displayName) }}
          </div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">{{ user.displayName }}</span>
            <span class="sidebar-user-role">{{ getRoleLabel(user.role) }}</span>
          </div>
        </div>
        <button class="sidebar-logout" @click="handleLogout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>

    <!-- Mobile Sidebar Toggle -->
    <button class="sidebar-toggle" @click="toggleSidebar">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <!-- Overlay -->
    <div class="sidebar-overlay" :class="{ active: isSidebarOpen }" @click="closeSidebar"></div>

    <!-- Main Content -->
    <main class="dashboard-main">
      <div class="dashboard-content">
        <!-- Loading Overlay -->
        <Transition name="loading-fade">
          <div v-if="isPageLoading" class="loading-overlay">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Memuat...</p>
            </div>
          </div>
        </Transition>

        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const logoUrl = new URL('@/assets/logo.png', import.meta.url).href

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)
const isGuru = computed(() => authStore.isGuru)

const isSidebarOpen = ref(false)
const isPageLoading = ref(false)

// Watch for route changes to trigger loading
watch(() => route.path, () => {
  isPageLoading.value = true
  setTimeout(() => {
    isPageLoading.value = false
  }, 300)
})

// Check if current route matches or starts with the given path
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const getInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getRoleLabel = (role) => {
  const labels = {
    admin: 'Administrator',
    guru: 'Guru',
    santri: 'Santri'
  }
  return labels[role] || role
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%);
}

/* Sidebar */
.sidebar {
  width: 280px;
  background: var(--white);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: var(--z-fixed);
  transform: translateX(-100%);
  transition: transform var(--transition-normal);
}

@media (min-width: 1024px) {
  .sidebar {
    transform: translateX(0);
    position: sticky;
    top: 0;
    height: 100vh;
  }
}

.sidebar-open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-bottom: 1px solid var(--gray-100);
}

.sidebar-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.sidebar-title {
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--primary);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-md);
  overflow-y: auto;
}

.sidebar-section {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-400);
  padding: var(--space-lg) var(--space-md) var(--space-sm);
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  color: var(--gray-600);
  font-weight: 500;
  transition: all var(--transition-fast);
  margin-bottom: var(--space-xs);
}

.sidebar-link:hover {
  background: var(--gray-50);
  color: var(--primary);
}

.sidebar-link.active {
  background: var(--primary-gradient);
  color: var(--white);
}

.sidebar-footer {
  padding: var(--space-md);
  border-top: 1px solid var(--gray-100);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
}

.sidebar-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.sidebar-user-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--primary-gradient);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.sidebar-user-info {
  display: flex;
  flex-direction: column;
}

.sidebar-user-name {
  font-weight: 600;
  color: var(--gray-800);
  font-size: 0.875rem;
}

.sidebar-user-role {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.sidebar-logout {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  color: var(--error);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.sidebar-logout:hover {
  background: rgba(244, 67, 54, 0.1);
}

/* Mobile Toggle */
.sidebar-toggle {
  position: fixed;
  top: var(--space-md);
  left: var(--space-md);
  z-index: var(--z-fixed);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
  color: var(--gray-700);
}

@media (min-width: 1024px) {
  .sidebar-toggle {
    display: none;
  }
}

/* Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: calc(var(--z-fixed) - 1);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-normal);
}

.sidebar-overlay.active {
  opacity: 1;
  visibility: visible;
}

@media (min-width: 1024px) {
  .sidebar-overlay {
    display: none;
  }
}

/* Main Content */
.dashboard-main {
  flex: 1;
  padding: var(--space-xl);
  min-height: 100vh;
}

@media (min-width: 1024px) {
  .dashboard-main {
    padding: var(--space-2xl);
  }
  .loading-overlay{
    left: 280px !important;
  }
}

.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(232, 245, 233, 0.9);
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
  border: 4px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.loading-spinner p {
  color: var(--primary);
  font-weight: 500;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.15s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}


</style>
