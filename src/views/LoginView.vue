<template>
  <main
    class="relative flex items-center justify-center px-4 py-10 lp lp-emerald lp-on-dark isolate min-h-dvh"
  >
    <div class="w-full max-w-[26rem]">
      <div class="login-card login-rise">
        <!-- The mihrab dome carries the brand -->
        <div class="login-dome">
          <img :src="logoUrl" alt="TPQ AMANAH" width="64" height="64" class="w-16 h-16" />
          <h1 class="mt-3 text-2xl font-extrabold tracking-tight lp-ink">{{ heading.title }}</h1>
          <p class="mt-1 text-sm lp-body">{{ heading.sub }}</p>
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

          <!-- Account type (hidden when a parent arrives from a link with a code: only the wali login makes sense) -->
          <div v-if="!linkingMode" role="tablist" aria-label="Jenis akun" class="login-tabs">
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
              id="tab-wali"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'wali'"
              aria-controls="panel-wali"
              @click="activeTab = 'wali'"
              :class="{ 'is-active': activeTab === 'wali' }"
            >
              Wali Santri
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

          <!-- Wali santri: a code sent to their WhatsApp -->
          <div v-else id="panel-wali" :role="linkingMode ? undefined : 'tabpanel'" :aria-labelledby="linkingMode ? undefined : 'tab-wali'"
            :class="linkingMode ? 'mt-1' : 'mt-6'">
            <!-- step 1: the number -->
            <form v-if="waliStep === 'phone'" class="space-y-4" @submit.prevent="requestWaliCode">
              <!-- from the teacher's link: this page is the first step of linking the child -->
              <div v-if="linkingMode" class="link-steps" role="note">
                <p class="link-steps-lead">Bapak/Ibu membuka tautan dari TPQ untuk menautkan data ananda. Caranya:</p>
                <ol>
                  <li class="is-now">
                    <strong>Masuk dengan nomor WhatsApp</strong> Bapak/Ibu di bawah ini. Tidak perlu daftar, kode masuk dikirim lewat WhatsApp TPQ.
                  </li>
                  <li>Ananda <strong>langsung tertaut</strong><template v-if="linkCode"> dengan kode <strong class="link-code">{{ linkCode }}</strong></template>.</li>
                  <li>Isi data ananda, sekitar 5 menit.</li>
                </ol>
              </div>
              <p v-else class="text-sm text-center lp-body">
                Masuk dengan nomor WhatsApp Bapak/Ibu. Kode masuk akan dikirim lewat WhatsApp TPQ Amanah.
              </p>
              <div>
                <label for="wali-phone" class="login-label">Nomor WhatsApp</label>
                <input id="wali-phone" v-model="waliPhone" type="tel" inputmode="tel" autocomplete="tel"
                  class="login-input wali-phone-input" placeholder="0812 3456 7890" required />
              </div>
              <button type="submit" class="w-full lp-btn-gold" :disabled="waliBusy || !waliPhone.trim()">
                {{ waliBusy ? 'Mengirim kode…' : 'Kirim kode lewat WhatsApp' }}
              </button>
            </form>

            <!-- step 2: the code -->
            <form v-else class="space-y-4" @submit.prevent="verifyWaliCode">
              <p class="text-sm text-center lp-body">
                Kode 6 angka dikirim ke <strong class="lp-ink">{{ waliPhoneShown }}</strong>
                <button type="button" class="wali-link" @click="changeWaliPhone">Ubah</button>
              </p>
              <p v-if="linkingMode" class="link-otp-note">Ini kode untuk <strong>masuk</strong>. Kode tautan ananda
                <template v-if="linkCode">(<strong>{{ linkCode }}</strong>) </template>sudah tersimpan, tidak perlu diketik lagi.</p>
              <p class="wali-delivery" :class="`is-${waliDelivery}`" role="status" aria-live="polite">
                {{ waliDeliveryText }}
              </p>
              <div>
                <label for="wali-code" class="login-label">Kode dari WhatsApp</label>
                <input id="wali-code" ref="waliCodeInput" v-model="waliCode" type="text" inputmode="numeric"
                  autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" class="login-input wali-code-input"
                  placeholder="••••••" @input="onWaliCodeInput" />
              </div>
              <button type="submit" class="w-full lp-btn-gold" :disabled="loading || waliCode.length !== 6">
                {{ loading ? 'Memeriksa…' : 'Masuk' }}
              </button>
              <p class="text-xs text-center lp-body">
                Belum menerima kode?
                <button type="button" class="wali-link" :disabled="waliResendIn > 0 || waliBusy" @click="requestWaliCode">
                  {{ waliResendIn > 0 ? `Kirim ulang (${waliResendIn} dtk)` : 'Kirim ulang' }}
                </button>
              </p>
            </form>
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
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import api from "@/services/api";
import { normalizePhone, displayPhone } from "@/utils/santriProfile";
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

// ?as=wali (a link from the wali portal or a WhatsApp message) opens the wali tab
// A parent who opened the teacher's link (/wali/tautkan?kode=...) and was sent here to sign in first
const linkRedirect = typeof route.query.redirect === "string" && route.query.redirect.startsWith("/wali/tautkan") ? route.query.redirect : "";
const linkingMode = !!linkRedirect;
const linkCode = (() => {
  try {
    return new URLSearchParams(linkRedirect.split("?")[1] || "").get("kode") || "";
  } catch {
    return "";
  }
})().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 9);
const activeTab = ref(linkingMode || route.query.as === "wali" ? "wali" : "credentials");
const heading = computed(() => {
  if (linkingMode) return { title: "Tautkan Data Ananda", sub: "Langkah pertama: masuk dengan nomor WhatsApp Bapak/Ibu" };
  if (activeTab.value === "wali") return { title: "Masuk Wali Santri", sub: "Untuk orang tua / wali santri TPQ Amanah" };
  return { title: "Login Dashboard", sub: "Masuk untuk mengakses dashboard" };
});
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

/* ---- wali santri: WhatsApp code ---- */
const waliStep = ref("phone");
const waliPhone = ref("");
const waliCode = ref("");
const waliBusy = ref(false);
const waliResendIn = ref(0);
const waliDelivery = ref("pending");
const waliCodeInput = ref(null);
let resendTimer = null;
let statusTimer = null;

const waliPhoneShown = computed(() => displayPhone(normalizePhone(waliPhone.value)));
const waliDeliveryText = computed(() => ({
  pending: "Mengirim kode ke WhatsApp…",
  sending: "Mengirim kode ke WhatsApp…",
  sent: "Kode sudah terkirim. Buka WhatsApp Anda.",
  failed: "Kode gagal terkirim. Coba kirim ulang sebentar lagi.",
  slow: "Kode belum terkirim. Bila tidak sampai dalam 1 menit, hubungi admin TPQ.",
  expired: "Kode sudah kedaluwarsa. Kirim ulang kode.",
}[waliDelivery.value] || ""));

function stopTimers() {
  clearInterval(resendTimer);
  clearTimeout(statusTimer);
}
onBeforeUnmount(stopTimers);

function startResendCountdown(seconds) {
  clearInterval(resendTimer);
  waliResendIn.value = seconds;
  resendTimer = setInterval(() => {
    waliResendIn.value = Math.max(0, waliResendIn.value - 1);
    if (!waliResendIn.value) clearInterval(resendTimer);
  }, 1000);
}

// Follow the code on its way (bot online?) for about a minute.
function watchDelivery(startedAt = Date.now()) {
  clearTimeout(statusTimer);
  statusTimer = setTimeout(async () => {
    try {
      const { data } = await api.get("/wali/auth/otp-status", { params: { phone: waliPhone.value }, cache: false });
      if (data.status === "sent" || data.status === "failed" || data.status === "expired") {
        waliDelivery.value = data.status;
        return;
      }
    } catch {
      /* keep waiting */
    }
    if (Date.now() - startedAt > 30000) waliDelivery.value = "slow";
    if (Date.now() - startedAt < 90000) watchDelivery(startedAt);
  }, 2500);
}

const requestWaliCode = async () => {
  error.value = null;
  waliBusy.value = true;
  try {
    const { data } = await api.post("/wali/auth/request-otp", { phone: waliPhone.value });
    waliStep.value = "code";
    waliCode.value = "";
    waliDelivery.value = "pending";
    startResendCountdown(data.resendInSeconds || 60);
    watchDelivery();
    await nextTick();
    waliCodeInput.value?.focus();
  } catch (err) {
    error.value = err.response?.data?.error || "Gagal mengirim kode. Coba lagi.";
    if (err.response?.data?.retryAfter && waliStep.value === "code") startResendCountdown(Math.min(err.response.data.retryAfter, 3600));
  } finally {
    waliBusy.value = false;
  }
};

const verifyWaliCode = async () => {
  error.value = null;
  const result = await authStore.loginWithWaliOtp(waliPhone.value, waliCode.value);
  if (result.success) {
    stopTimers();
    const redirect = getSafeRedirect();
    router.push(redirect.startsWith("/wali") ? redirect : "/wali");
  } else {
    error.value = result.error;
  }
};

// digits only; six digits sign in by themselves
const onWaliCodeInput = () => {
  waliCode.value = waliCode.value.replace(/\D/g, "").slice(0, 6);
  if (waliCode.value.length === 6 && !loading.value) verifyWaliCode();
};

const changeWaliPhone = () => {
  stopTimers();
  waliStep.value = "phone";
  waliCode.value = "";
  error.value = null;
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

.link-steps {
  padding: 14px 16px;
  border-radius: 0.9rem;
  background: rgba(255, 251, 235, 0.85);
  border: 1px solid rgba(180, 83, 9, 0.22);
  color: var(--lp-ink);
  font-size: 0.9rem;
  line-height: 1.5;
}

.link-steps-lead {
  margin: 0 0 8px;
  font-weight: 600;
}

.link-steps ol {
  margin: 0;
  list-style: decimal; /* Tailwind resets lists: keep the 1-2-3 */
  padding-left: 1.25rem;
  display: grid;
  gap: 6px;
}

.link-steps li {
  color: var(--lp-body);
}

.link-steps li.is-now {
  color: var(--lp-ink);
}

.link-steps li::marker {
  font-weight: 800;
  color: var(--lp-gold-deep);
}

.link-otp-note {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 0.75rem;
  background: rgba(255, 251, 235, 0.85);
  border: 1px solid rgba(180, 83, 9, 0.22);
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--lp-body);
  text-align: center;
}

.link-code {
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
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

/* wali santri tab */
.wali-phone-input {
  font-size: 1.1rem;
  letter-spacing: 0.02em;
}

.wali-code-input {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 0.5em;
  padding-left: 0.5em;
  font-variant-numeric: tabular-nums;
}

.wali-link {
  margin-left: 4px;
  padding: 6px 4px;
  border: 0;
  background: none;
  color: #065f46;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.wali-link:disabled {
  color: #7c8a83;
  text-decoration: none;
  cursor: default;
}

.wali-delivery {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  text-align: center;
  background: #f3f4f1;
  color: #3b4a42;
}

.wali-delivery.is-sent {
  background: #e3f1ea;
  color: #0a5c40;
}

.wali-delivery.is-failed,
.wali-delivery.is-slow,
.wali-delivery.is-expired {
  background: #fff7ed;
  color: #7c3a0d;
}
</style>
