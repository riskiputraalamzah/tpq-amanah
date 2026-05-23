<template>
  <div
    class="flex items-center justify-center p-4 min-h-dvh bg-gradient-to-br from-primary-100 via-primary-50 to-green-50 islamic-pattern"
  >
    <div class="grid items-center w-full max-w-md gap-8">
      <!-- Login Card -->
      <div class="w-full p-6 glass-card-solid sm:p-8 animate-slide-up">
        <!-- Logo -->
        <div class="mb-6 text-center">
          <img
            :src="logoUrl"
            alt="TPQ AMANAH"
            class="w-16 h-16 mx-auto mb-3 drop-shadow-lg"
          />
          <h1 class="text-2xl font-bold text-primary-700">Login Dashboard</h1>
          <p class="mt-1 text-gray-500">Masuk untuk mengakses dashboard</p>
        </div>

        <!-- Tabs -->
        <div class="flex p-1 mb-6 bg-gray-100 rounded-xl">
          <button
            @click="activeTab = 'credentials'"
            class="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-200"
            :class="
              activeTab === 'credentials'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            "
          >
            Admin / Guru
          </button>
          <button
            @click="activeTab = 'google'"
            class="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-200"
            :class="
              activeTab === 'google'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            "
          >
            Santri
          </button>
        </div>

        <!-- Login Form - Admin/Guru -->
        <form
          v-if="activeTab === 'credentials'"
          @submit.prevent="handleCredentialsLogin"
          class="space-y-4"
        >
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700"
              >Username</label
            >
            <input
              v-model="username"
              type="text"
              class="input-field"
              placeholder="Masukkan username"
              required
            />
          </div>
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700"
              >Password</label
            >
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="pr-12 input-field"
                placeholder="Masukkan password"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute text-gray-400 -translate-y-1/2 right-4 top-1/2 hover:text-gray-600"
              >
                <svg
                  v-if="!showPassword"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-3 btn-primary"
            :disabled="loading"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Memproses...
            </span>
            <span v-else>Masuk</span>
          </button>
        </form>

        <!-- Google Login - Santri -->
        <div v-else class="space-y-6">
          <div class="text-center">
            <div
              class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-50 to-green-50"
            >
              <svg class="w-8 h-8" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            <p class="font-medium text-gray-600">
              Santri gunakan akun Google untuk login
            </p>
          </div>

          <button
            @click="handleGoogleLogin"
            class="w-full google-login-btn"
            :disabled="loading"
          >
            <div class="google-btn-inner">
              <div class="google-icon-wrapper">
                <svg v-if="!loading" class="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5 text-gray-600 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
              <span class="google-btn-text">{{
                loading ? "Memproses..." : "Masuk dengan Google"
              }}</span>
              <svg
                class="w-5 h-5 text-gray-400 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>

          <p class="text-xs text-center text-gray-400">
            Login menggunakan akun Google yang terdaftar di TPQ
          </p>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="flex items-center gap-3 p-4 mt-4 text-red-600 border border-red-200 bg-red-50 rounded-xl animate-slide-down"
        >
          <svg
            class="flex-shrink-0 w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-sm">{{ error }}</span>
        </div>

        <!-- Back Link -->
        <div class="pt-6 mt-6 text-center border-t border-gray-200">
          <router-link
            to="/"
            class="inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-primary-600"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Kembali ke Beranda
          </router-link>
        </div>
      </div>

      <!-- Info Panel -->
      <div
        class="order-1 hidden text-white lg:order-2 animate-slide-up"
        style="animation-delay: 100ms"
      >
        <h2 class="mb-4 text-3xl font-bold lg:text-4xl text-primary-800">
          Selamat Datang!
        </h2>
        <p class="mb-8 text-primary-700/80">
          Akses dashboard TPQ AMANAH untuk:
        </p>

        <div class="space-y-4">
          <div class="p-5 glass-card bg-white/60">
            <div class="flex items-start gap-4">
              <div
                class="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-primary-800">Admin</h3>
                <p class="text-sm text-gray-600">
                  Kelola users, konten, dan data TPQ
                </p>
              </div>
            </div>
          </div>

          <div class="p-5 glass-card bg-white/60">
            <div class="flex items-start gap-4">
              <div
                class="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-primary-800">Guru</h3>
                <p class="text-sm text-gray-600">
                  Absensi online dan input nilai ujian
                </p>
              </div>
            </div>
          </div>

          <div class="p-5 glass-card bg-white/60">
            <div class="flex items-start gap-4">
              <div
                class="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-primary-800">Santri</h3>
                <p class="text-sm text-gray-600">
                  Lihat nilai dan informasi pribadi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const logoUrl = new URL("@/assets/logo.png", import.meta.url).href;

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const activeTab = ref("credentials");
const username = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref(null);

const loading = computed(() => authStore.loading);

// Login dengan username/password
const handleCredentialsLogin = async () => {
  error.value = null;
  const result = await authStore.loginWithCredentials(
    username.value,
    password.value,
  );

  if (result.success) {
    const redirect = route.query.redirect || "/dashboard";
    router.push(redirect);
  } else {
    error.value = result.error;
  }
};

// Login dengan Google
const handleGoogleLogin = async () => {
  error.value = null;
  const result = await authStore.loginWithGoogle();

  if (result.success) {
    const redirect = route.query.redirect || "/dashboard";
    router.push(redirect);
  } else {
    // Ignore popup-closed error
    if (result.error?.code !== "auth/popup-closed-by-user") {
      error.value = "Login gagal. Silakan coba lagi.";
    }
  }
};
</script>

<style scoped>
.google-login-btn {
  position: relative;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.08),
    0 2px 4px -1px rgba(0, 0, 0, 0.04);
}

.google-login-btn:hover {
  border-color: #10b981;
  box-shadow:
    0 10px 25px -5px rgba(16, 185, 129, 0.15),
    0 8px 10px -6px rgba(16, 185, 129, 0.1);
  transform: translateY(-2px);
}

.google-login-btn:active {
  transform: translateY(0);
}

.google-login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.google-btn-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: white;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.google-login-btn:hover .google-btn-inner {
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
}

.google-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 10px;
  flex-shrink: 0;
}

.google-btn-text {
  flex: 1;
  font-weight: 600;
  font-size: 15px;
  color: #374151;
  text-align: left;
}
</style>
