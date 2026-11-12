<template>
  <main
    class="relative flex items-center justify-center px-4 py-10 lp lp-emerald lp-on-dark isolate min-h-dvh"
  >
    <div class="w-full max-w-[26rem]">
      <div class="login-card login-rise">
        <!-- The mihrab dome carries the brand -->
        <div class="login-dome">
          <img :src="logoUrl" alt="TPQ AMANAH" width="64" height="64" class="w-16 h-16" />
          <h1 class="mt-3 text-2xl font-extrabold tracking-tight lp-ink">Login Dashboard</h1>
          <p class="mt-1 text-sm lp-body">Masuk untuk mengakses dashboard</p>
        </div>

        <div class="px-6 pb-8 sm:px-9">
          <OrnamentRule class="mt-5 mb-6" />

          <!-- Notice if coming from quick attendance account switch -->
          <div
            v-if="route.query.notice === 'switched_account'"
            role="status"
            class="flex items-start gap-2.5 p-3 mb-5 text-xs font-medium border rounded-xl border-amber-700/30 bg-amber-50 text-amber-900"
          >
            <i class="lp-diamond mt-1 text-amber-600"></i>
            <span>Anda telah logout dari sesi sebelumnya. Silakan login dengan akun yang sesuai.</span>
          </div>

          <!-- Account type -->
          <div role="tablist" aria-label="Jenis akun" class="login-tabs">
            <button
              id="tab-credentials"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'credentials'"
              aria-controls="panel-credentials"
              @click="activeTab = 'credentials'"
              :class="{ 'is-active': activeTab === 'credentials' }"
            >
              Admin / Guru
            </button>
            <button
              id="tab-google"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'google'"
              aria-controls="panel-google"
              @click="activeTab = 'google'"
              :class="{ 'is-active': activeTab === 'google' }"
            >
              Santri
            </button>
          </div>

          <!-- Login Form - Admin/Guru -->
          <form
            v-if="activeTab === 'credentials'"
            id="panel-credentials"
            role="tabpanel"
            aria-labelledby="tab-credentials"
            @submit.prevent="handleCredentialsLogin"
            class="mt-6 space-y-4"
          >
            <div>
              <label for="login-username" class="login-label">Username</label>
              <input
                id="login-username"
                v-model="username"
                type="text"
                class="login-input"
                placeholder="Masukkan username"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                required
              />
            </div>
            <div>
              <label for="login-password" class="login-label">Password</label>
              <div class="relative">
                <input
                  id="login-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="pr-12 login-input"
                  placeholder="Masukkan password"
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                  :aria-pressed="showPassword"
                  class="login-eye"
                >
                  <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /> </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /> </svg>
                </button>
              </div>
            </div>

            <button type="submit" class="w-full mt-2 lp-btn-gold" :disabled="loading">
              <span v-if="loading" class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"> <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /> <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /> </svg>
                Memproses...
              </span>
              <span v-else>Masuk</span>
            </button>
          </form>

          <!-- Google Login - Santri -->
          <div
            v-else
            id="panel-google"
            role="tabpanel"
            aria-labelledby="tab-google"
            class="mt-6 space-y-5"
          >
            <p class="text-sm font-medium text-center lp-body">
              Santri gunakan akun Google untuk login
            </p>

            <button
              type="button"
              @click="handleGoogleLogin"
              class="w-full google-login-btn"
              :disabled="loading"
            >
              <div class="google-btn-inner">
                <div class="google-icon-wrapper">
                  <svg v-if="!loading" class="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true"> <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /> <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /> <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /> <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /> </svg>
                  <svg v-else class="w-5 h-5 text-gray-600 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true"> <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /> <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /> </svg>
                </div>
                <span class="google-btn-text">{{
                  loading ? "Memproses..." : "Masuk dengan Google"
                }}</span>
                <svg class="w-5 h-5 text-amber-700 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /> </svg>
              </div>
            </button>

            <p class="text-xs text-center lp-body">
              Login menggunakan akun Google yang terdaftar di TPQ
            </p>
          </div>

          <!-- Error Message -->
          <div
            v-if="error"
            role="alert"
            class="flex items-center gap-3 p-4 mt-5 text-red-700 border border-red-200 bg-red-50 rounded-xl animate-slide-down"
          >
            <svg class="flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>
            <span class="text-sm">{{ error }}</span>
          </div>
        </div>
      </div>

      <!-- Back Link -->
      <div class="mt-6 text-center">
        <router-link
          to="/"
          class="inline-flex items-center gap-2 min-h-11 px-3 text-sm font-medium transition-colors rounded-lg text-emerald-100/85 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /> </svg>
          Kembali ke Beranda
        </router-link>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { prefetchWhenIdle } from "@/utils/prefetch";
import OrnamentRule from "@/components/landing/OrnamentRule.vue";
import "@/styles/landing.css";

const logoUrl = new URL("@/assets/logo-sm.png", import.meta.url).href;

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// The dashboard is the next page after logging in, so have it ready.
onMounted(() => {
  prefetchWhenIdle([
    () => import("@/views/dashboard/DashboardLayout.vue"),
    () => import("@/views/dashboard/DashboardHome.vue"),
  ]);
});

const activeTab = ref("credentials");
const username = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref(null);

const loading = computed(() => authStore.loading);

const getSafeRedirect = () => {
  const redirect = route.query.redirect;

  if (
    typeof redirect === "string" &&
    redirect.startsWith("/") &&
    !redirect.startsWith("//") &&
    !redirect.startsWith("/login")
  ) {
    return redirect;
  }

  return "/dashboard";
};

// Login dengan username/password
const handleCredentialsLogin = async () => {
  error.value = null;
  const result = await authStore.loginWithCredentials(
    username.value,
    password.value,
  );

  if (result.success) {
    router.push(getSafeRedirect());
  } else {
    error.value = result.error;
  }
};

// Login dengan Google
const handleGoogleLogin = async () => {
  error.value = null;
  const result = await authStore.loginWithGoogle();

  if (result.success) {
    router.push(getSafeRedirect());
  } else {
    // Ignore popup-closed error
    if (result.error?.code !== "auth/popup-closed-by-user") {
      error.value = "Login gagal. Silakan coba lagi.";
    }
  }
};
</script>

<style scoped>
/* Login: a mihrab-shaped card on the emerald ground, same language as the landing page */
.login-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 12rem 12rem 1.75rem 1.75rem;
  border: 1px solid rgba(252, 211, 77, 0.5);
  background: var(--lp-ivory);
  box-shadow: 0 40px 70px -30px rgba(0, 0, 0, 0.65), 0 0 0 6px rgba(252, 211, 77, 0.06);
}

.login-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: var(--lp-khatam-brown);
  background-size: 64px 64px;
  background-position: center top;
  opacity: 0.06;
  -webkit-mask-image: linear-gradient(180deg, #000, transparent 55%);
  mask-image: linear-gradient(180deg, #000, transparent 55%);
}

.login-card::after {
  content: "";
  position: absolute;
  inset: 7px;
  border-radius: 11.5rem 11.5rem 1.4rem 1.4rem;
  border: 1px solid rgba(180, 83, 9, 0.16);
  pointer-events: none;
}

.login-dome {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3.25rem 1.5rem 0;
  text-align: center;
}

.login-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 0.9rem;
  border: 1px solid rgba(180, 83, 9, 0.18);
  background: rgba(255, 251, 235, 0.7);
}

.login-tabs button {
  flex: 1;
  min-height: 2.75rem;
  padding: 0 1rem;
  border-radius: 0.65rem;
  font-weight: 600;
  color: #5b6b62;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.login-tabs button:hover:not(.is-active) {
  color: var(--lp-ink);
}

.login-tabs button.is-active {
  background: #fff;
  color: #065f46;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 6px 14px -8px rgba(5, 61, 44, 0.5), 0 0 0 1px rgba(180, 83, 9, 0.28);
}

.login-tabs button:focus-visible {
  outline: 2px solid var(--lp-gold-deep);
  outline-offset: 2px;
}

.login-label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--lp-ink);
}

.login-input {
  width: 100%;
  min-height: 3rem;
  padding: 0 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(180, 83, 9, 0.3);
  background: #fff;
  color: var(--lp-ink);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.login-input::placeholder {
  color: #8a968f;
}

.login-input:hover {
  border-color: rgba(180, 83, 9, 0.55);
}

.login-input:focus {
  border-color: #047857;
  box-shadow: 0 0 0 4px rgba(4, 120, 87, 0.16);
}

.login-eye {
  position: absolute;
  top: 50%;
  right: 0.25rem;
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  transform: translateY(-50%);
  border-radius: 0.6rem;
  color: #7a8680;
  transition: color 0.2s ease;
}

.login-eye:hover {
  color: var(--lp-ink);
}

.login-eye:focus-visible {
  outline: 2px solid var(--lp-gold-deep);
  outline-offset: 1px;
}

.lp-btn-gold:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.google-login-btn {
  width: 100%;
  border: 1px solid rgba(180, 83, 9, 0.32);
  border-radius: 0.9rem;
  padding: 3px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.google-login-btn:hover:not(:disabled) {
  border-color: #047857;
  box-shadow: 0 14px 28px -16px rgba(5, 61, 44, 0.55);
  transform: translateY(-1px);
}

.google-login-btn:focus-visible {
  outline: 2px solid var(--lp-gold-deep);
  outline-offset: 3px;
}

.google-login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-btn-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border-radius: 0.7rem;
  background: #fff;
}

.google-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 10px;
  background: var(--lp-ivory);
  box-shadow: 0 0 0 1px rgba(180, 83, 9, 0.18);
}

.google-btn-text {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--lp-ink);
  text-align: left;
}

@media (prefers-reduced-motion: no-preference) {
  .login-rise {
    animation: login-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
}

@keyframes login-rise {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
