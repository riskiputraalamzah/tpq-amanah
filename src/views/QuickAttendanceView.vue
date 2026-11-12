<template>
  <main class="quick-attendance-page lp">
    <section class="quick-card">
      <img :src="logoUrl" alt="TPQ AMANAH" class="mx-auto quick-logo" />

      <!-- Loading State -->
      <div v-if="state === 'loading'" class="state-block">
        <div class="spinner"></div>
        <h1>Memproses Absensi</h1>
        <p>Mohon tunggu sebentar.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="state === 'success'" class="state-block success">
        <div class="status-icon">✓</div>
        <h1>{{ resultTitle }}</h1>
        <p v-if="isTestResult">
          Link test WA berhasil diproses. Tidak ada absensi yang dicatat.
        </p>
        <p v-else>
          Absensi {{ targetGuruName }} tercatat sebagai
          <strong>{{ resultStatusLabel }}</strong>.
        </p>

        <!-- Sesi Mismatch Notice (Jika akun login berbeda / admin) -->
        <div v-if="isMismatch" class="mismatch-banner" :class="{ 'admin-mismatch': isMismatchAdmin }">
          <div class="mismatch-header">
            <span class="mismatch-icon">{{ isMismatchAdmin ? '🛡️' : '⚠️' }}</span>
            <span class="mismatch-badge">
              {{ isMismatchAdmin ? 'Sesi Admin Terdeteksi' : 'Sesi Akun Berbeda Terdeteksi' }}
            </span>
          </div>

          <div class="mismatch-body">
            <p v-if="isMismatchAdmin" class="mismatch-text">
              Anda saat ini sedang login sebagai <strong>Admin ({{ loggedInName }})</strong>, sedangkan link absensi WhatsApp ini adalah milik <strong>{{ targetGuruName }}</strong>.
            </p>
            <p v-else class="mismatch-text">
              Perangkat ini sedang login dengan akun <strong>{{ loggedInName }}</strong>{{ loggedInUsername ? ` (@${loggedInUsername})` : '' }}, sedangkan link absensi ini adalah milik <strong>{{ targetGuruName }}</strong>.
            </p>

            <div class="mismatch-note">
              <span class="check-mark">✓</span>
              <span>Absensi tetap tercatat untuk <strong>{{ targetGuruName }}</strong> (bukan untuk akun {{ loggedInName }}).</span>
            </div>

            <p v-if="isMismatchAdmin" class="mismatch-subtext">
              Pengalihan otomatis dinonaktifkan agar Anda tetap berada pada sesi Admin Anda.
            </p>
            <p v-else class="mismatch-subtext">
              Jika perangkat ini milik <strong>{{ targetGuruName }}</strong>, disarankan untuk logout dari akun {{ loggedInName }} agar data KBM & absensi santri tidak tertukar.
            </p>
          </div>

          <div class="mismatch-actions">
            <button
              v-if="!isMismatchAdmin"
              type="button"
              class="logout-action-btn"
              :disabled="loggingOut"
              @click="handleLogout"
            >
              {{ loggingOut ? "Memproses..." : `Ganti Akun (Logout dari ${loggedInName})` }}
            </button>
            <router-link
              v-if="isMismatchAdmin"
              class="admin-rekap-btn"
              to="/dashboard/admin/attendance"
            >
              Lihat Rekap Absensi Guru (Admin) →
            </router-link>
            <router-link class="secondary-btn" :to="dashboardLink">
              {{ isMismatchAdmin ? "Buka Dashboard Admin" : `Tetap Buka Dashboard (${loggedInName})` }}
            </router-link>
            <button
              v-if="isMismatchAdmin"
              type="button"
              class="text-link-btn"
              :disabled="loggingOut"
              @click="handleLogout"
            >
              {{ loggingOut ? "Memproses..." : "Logout dari Admin" }}
            </button>
          </div>
        </div>

        <!-- Normal Actions (Tidak ada mismatch) -->
        <template v-else>
          <div v-if="isEligibleHadir" class="actions" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <p v-if="redirecting" style="color: #059669; font-size: 0.875rem; font-weight: 500; margin: 0;">
              Mengalihkan ke Daily Workspace...
            </p>
            <router-link class="primary-btn" :to="workspaceLink">
              Buka Daily Workspace →
            </router-link>
            <router-link class="secondary-link" :to="dashboardLink">
              Buka Dashboard
            </router-link>
          </div>
          <div v-else class="actions">
            <router-link class="primary-btn" :to="dashboardLink">
              Buka Dashboard
            </router-link>
          </div>
        </template>
      </div>

      <!-- Already Recorded State -->
      <div v-else-if="state === 'already'" class="state-block success">
        <div class="status-icon">✓</div>
        <h1>Absensi Sudah Tercatat</h1>
        <p>
          Status hari ini untuk {{ targetGuruName }} sudah
          <strong>{{
            details?.existingAttendance?.statusLabel ||
            details?.requestedStatusLabel
          }}</strong>.
        </p>

        <!-- Sesi Mismatch Notice -->
        <div v-if="isMismatch" class="mismatch-banner" :class="{ 'admin-mismatch': isMismatchAdmin }">
          <div class="mismatch-header">
            <span class="mismatch-icon">{{ isMismatchAdmin ? '🛡️' : '⚠️' }}</span>
            <span class="mismatch-badge">
              {{ isMismatchAdmin ? 'Sesi Admin Terdeteksi' : 'Sesi Akun Berbeda Terdeteksi' }}
            </span>
          </div>

          <div class="mismatch-body">
            <p v-if="isMismatchAdmin" class="mismatch-text">
              Anda saat ini sedang login sebagai <strong>Admin ({{ loggedInName }})</strong>, sedangkan link absensi ini milik <strong>{{ targetGuruName }}</strong>.
            </p>
            <p v-else class="mismatch-text">
              Browser ini sedang login dengan akun <strong>{{ loggedInName }}</strong>{{ loggedInUsername ? ` (@${loggedInUsername})` : '' }}, sedangkan link ini milik <strong>{{ targetGuruName }}</strong>.
            </p>

            <div class="mismatch-note">
              <span class="check-mark">✓</span>
              <span>Data absensi tercatat untuk <strong>{{ targetGuruName }}</strong>, bukan untuk akun yang sedang login.</span>
            </div>
          </div>

          <div class="mismatch-actions">
            <button
              v-if="!isMismatchAdmin"
              type="button"
              class="logout-action-btn"
              :disabled="loggingOut"
              @click="handleLogout"
            >
              {{ loggingOut ? "Memproses..." : `Ganti Akun (Logout dari ${loggedInName})` }}
            </button>
            <router-link
              v-if="isMismatchAdmin"
              class="admin-rekap-btn"
              to="/dashboard/admin/attendance"
            >
              Lihat Rekap Absensi Guru (Admin) →
            </router-link>
            <router-link class="secondary-btn" :to="dashboardLink">
              {{ isMismatchAdmin ? "Buka Dashboard Admin" : `Tetap Buka Dashboard (${loggedInName})` }}
            </router-link>
          </div>
        </div>

        <!-- Normal Actions (Tidak ada mismatch) -->
        <template v-else>
          <div v-if="isEligibleHadir" class="actions" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <p v-if="redirecting" style="color: #059669; font-size: 0.875rem; font-weight: 500; margin: 0;">
              Mengalihkan ke Daily Workspace...
            </p>
            <router-link class="primary-btn" :to="workspaceLink">
              Buka Daily Workspace →
            </router-link>
            <router-link class="secondary-link" :to="dashboardLink">
              Buka Dashboard
            </router-link>
          </div>
          <div v-else class="actions">
            <router-link class="secondary-link" :to="dashboardLink">
              Buka Dashboard
            </router-link>
          </div>
        </template>
      </div>

      <!-- Conflict State -->
      <div v-else-if="state === 'conflict'" class="state-block warning">
        <div class="status-icon">!</div>
        <h1>Absensi Sudah Ada</h1>

        <!-- Mismatch warning for conflict -->
        <div v-if="isMismatch" class="mismatch-banner conflict-mismatch" :class="{ 'admin-mismatch': isMismatchAdmin }">
          <div class="mismatch-header">
            <span class="mismatch-icon">{{ isMismatchAdmin ? '🛡️' : '⚠️' }}</span>
            <span class="mismatch-badge">
              {{ isMismatchAdmin ? 'Konfirmasi Akun Admin' : 'Peringatan: Akun Tidak Sesuai' }}
            </span>
          </div>
          <p class="mismatch-text">
            Anda sedang login sebagai <strong>{{ loggedInName }}</strong> ({{ loggedInRoleLabel }}), namun konfirmasi ini akan mengubah absensi milik <strong>{{ targetGuruName }}</strong> dari <strong>{{ details?.existingAttendance?.statusLabel }}</strong> menjadi <strong>{{ details?.requestedStatusLabel }}</strong>.
          </p>
        </div>

        <p v-else>
          Status {{ targetGuruName }} saat ini
          <strong>{{ details?.existingAttendance?.statusLabel }}</strong>. Ubah menjadi <strong>{{ details?.requestedStatusLabel }}</strong>?
        </p>

        <div class="actions">
          <button
            class="primary-btn"
            :disabled="submitting"
            @click="confirmUpdate"
          >
            {{ submitting ? "Mengubah..." : `Ya, Ubah Status ${targetGuruName}` }}
          </button>
          <router-link class="ghost-btn" :to="dashboardLink">
            {{ isMismatchAdmin ? "Batal / Dashboard Admin" : "Cek Dashboard" }}
          </router-link>
        </div>
      </div>

      <!-- Expired State -->
      <div v-else-if="state === 'expired'" class="state-block expired">
        <div class="status-icon">×</div>
        <h1>Link Sudah Expired</h1>
        <p>{{ expiredMessage }}</p>
        <router-link class="primary-btn" :to="dashboardLink">
          Absen Manual
        </router-link>
      </div>

      <!-- Error State -->
      <div v-else class="state-block expired">
        <div class="status-icon">×</div>
        <h1>Link Tidak Bisa Dipakai</h1>
        <p>{{ errorMessage }}</p>
        <router-link class="primary-btn" :to="dashboardLink">
          Buka Dashboard
        </router-link>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api";
import { useAuthStore } from "@/stores/auth";
import logoUrl from "../assets/logo-sm.png";
import "@/styles/landing.css";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const dashboardLink = computed(() => {
  if (authStore.user?.role === "admin") {
    return "/dashboard";
  }
  return "/dashboard/attendance";
});

const state = ref("loading");
const details = ref(null);
const result = ref(null);
const errorMessage = ref("Link absensi tidak valid atau sudah tidak tersedia.");
const submitting = ref(false);
const redirecting = ref(false);
const loggingOut = ref(false);

const targetGuruId = computed(() => {
  return details.value?.guruId || result.value?.guruId || null;
});

const targetGuruName = computed(() => {
  return details.value?.guruName || result.value?.guruName || "Guru";
});

const sessionMismatch = computed(() => {
  if (details.value?.sessionAudit?.isMismatch || result.value?.sessionAudit?.isMismatch) {
    return details.value?.sessionAudit || result.value?.sessionAudit;
  }

  if (!authStore.isAuthenticated || !authStore.user) {
    return null;
  }

  const currentId = authStore.user.id || authStore.user.uid;
  const targetId = targetGuruId.value;

  if (targetId && currentId && currentId !== targetId) {
    const role = authStore.user.role || "user";
    const name = authStore.user.displayName || authStore.user.name || authStore.user.username || "Pengguna";
    const username = authStore.user.username || "";

    return {
      isMismatch: true,
      loggedInUser: {
        uid: currentId,
        displayName: name,
        username,
        role,
      },
      targetGuru: {
        id: targetId,
        name: targetGuruName.value,
      },
    };
  }

  return null;
});

const isMismatch = computed(() => Boolean(sessionMismatch.value?.isMismatch));

const isMismatchAdmin = computed(() => {
  return isMismatch.value && (sessionMismatch.value?.loggedInUser?.role === "admin" || authStore.user?.role === "admin");
});

const loggedInName = computed(() => {
  return sessionMismatch.value?.loggedInUser?.displayName || authStore.user?.displayName || "Pengguna";
});

const loggedInUsername = computed(() => {
  return sessionMismatch.value?.loggedInUser?.username || authStore.user?.username || "";
});

const loggedInRoleLabel = computed(() => {
  const role = sessionMismatch.value?.loggedInUser?.role || authStore.user?.role || "user";
  if (role === "admin") return "Admin";
  if (role === "guru") return "Guru";
  return role.toUpperCase();
});

const resultTitle = computed(() => {
  if (result.value?.action === "test") return "Test Link Berhasil";
  if (result.value?.action === "updated") return "Absensi Diperbarui";
  return "Absensi Berhasil";
});

const isTestResult = computed(() => {
  return result.value?.action === "test" || result.value?.isTest === true;
});

const resultStatusLabel = computed(() => {
  return (
    result.value?.statusLabel || details.value?.requestedStatusLabel || "-"
  );
});

const isEligibleHadir = computed(() => {
  const eligible = result.value?.lpjEligible ?? details.value?.lpjEligible;
  const status = result.value?.status || details.value?.existingAttendance?.status || details.value?.requestedStatus;
  return !!eligible && status === "hadir";
});

const workspaceLink = computed(() => {
  const dateStr = result.value?.dailyContext?.date || details.value?.dailyContext?.date || details.value?.date;
  if (dateStr) {
    return `/dashboard/kbm/daily-workspace?date=${dateStr}`;
  }
  return "/dashboard/kbm/daily-workspace";
});

function triggerAutoRedirectIfEligible(payload) {
  // If there is an active session mismatch (e.g. Admin or Teacher B clicked Teacher A's link),
  // NEVER auto-redirect! Keep them on screen so they clearly see the account notice.
  if (isMismatch.value) {
    redirecting.value = false;
    return false;
  }

  const eligible = payload?.lpjEligible ?? details.value?.lpjEligible;
  const status = payload?.status || details.value?.existingAttendance?.status || details.value?.requestedStatus;

  if (eligible && status === "hadir") {
    redirecting.value = true;
    const targetDate = payload?.dailyContext?.date || details.value?.dailyContext?.date || details.value?.date;
    const targetUrl = targetDate
      ? `/dashboard/kbm/daily-workspace?date=${targetDate}`
      : "/dashboard/kbm/daily-workspace";

    setTimeout(() => {
      router.push(targetUrl);
    }, 600);
    return true;
  }
  return false;
}

const expiryLabel = computed(() => {
  if (
    details.value?.expirySettings?.mode === "minutes" &&
    Number(details.value.expirySettings.minutes) > 0
  ) {
    return `${Number(details.value.expirySettings.minutes)} menit setelah link dikirim`;
  }

  if (
    details.value?.expirySettings?.mode === "custom_time" &&
    details.value.expirySettings.expiresAtTime
  ) {
    return `pukul ${details.value.expirySettings.expiresAtTime.replace(":", ".")} WIB`;
  }

  if (!details.value?.expiresAt) {
    return "waktu yang ditentukan admin";
  }

  const date = new Date(details.value.expiresAt);
  if (Number.isNaN(date.getTime())) {
    return "waktu yang ditentukan admin";
  }

  const formatted = date
    .toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(":", ".");

  return `pukul ${formatted} WIB`;
});

const expiredMessage = computed(() => {
  if (details.value?.expiredReason === "settings_changed") {
    return "Link ini sudah tidak berlaku karena admin memperbarui pengaturan link WA. Silakan isi manual lewat Dashboard.";
  }

  return `Link absensi dari WhatsApp berlaku sampai ${expiryLabel.value}.`;
});

function applyError(error) {
  const status = error.response?.status;
  const data = error.response?.data;

  if (data) {
    details.value = data;
  }

  if (status === 409) {
    state.value = "conflict";
    return;
  }

  if (status === 410) {
    state.value = "expired";
    return;
  }

  errorMessage.value =
    data?.error || "Link absensi tidak valid atau sudah tidak tersedia.";
  state.value = "error";
}

async function submitQuickAttendance() {
  try {
    const { data } = await api.post(`/attendance/quick/${route.params.code}`);
    result.value = data;
    state.value = data.action === "already_recorded" ? "already" : "success";
    triggerAutoRedirectIfEligible(data);
  } catch (error) {
    applyError(error);
  }
}

async function confirmUpdate() {
  submitting.value = true;
  try {
    const { data } = await api.post(
      `/attendance/quick/${route.params.code}/confirm`,
    );
    result.value = data;
    state.value = "success";
    triggerAutoRedirectIfEligible(data);
  } catch (error) {
    applyError(error);
  } finally {
    submitting.value = false;
  }
}

async function handleLogout() {
  loggingOut.value = true;
  try {
    await authStore.logout();
    router.push({ path: "/login", query: { notice: "switched_account" } });
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    loggingOut.value = false;
  }
}

onMounted(async () => {
  if (!authStore.authChecked) {
    try {
      await authStore.checkAuth();
    } catch (err) {
      // Non-fatal if auth check fails
    }
  }

  try {
    const { data } = await api.get(`/attendance/quick/${route.params.code}`);
    details.value = data;

    if (data.action === "already_recorded") {
      state.value = "already";
      triggerAutoRedirectIfEligible(data);
      return;
    }

    if (data.action === "needs_confirmation") {
      state.value = "conflict";
      return;
    }

    await submitQuickAttendance();
  } catch (error) {
    applyError(error);
  }
});
</script>

<style scoped>
/* WhatsApp quick-attendance landing: same mihrab language as login (emerald ground, ivory arch card, gold hairline).
   One tap from a chat, so the status and the next action stay large and the ornament stays out of the way. */
.quick-attendance-page {
  position: relative;
  isolation: isolate;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(120% 90% at 50% 0%, var(--lp-emerald-1) 0%, var(--lp-emerald-0) 60%, var(--lp-emerald-2) 100%);
}

.quick-attendance-page::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: var(--lp-khatam-gold);
  background-size: 64px 64px;
  background-position: center top;
  opacity: 0.07;
  -webkit-mask-image: linear-gradient(180deg, #000, transparent 70%);
  mask-image: linear-gradient(180deg, #000, transparent 70%);
}

.quick-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: min(100%, 460px);
  padding: 44px 28px 32px;
  border-radius: 9rem 9rem 1.5rem 1.5rem;
  border: 1px solid rgba(252, 211, 77, 0.5);
  background: var(--lp-ivory);
  box-shadow: 0 40px 70px -30px rgba(0, 0, 0, 0.65), 0 0 0 6px rgba(252, 211, 77, 0.06);
  text-align: center;
}

.quick-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: var(--lp-khatam-brown);
  background-size: 64px 64px;
  background-position: center top;
  opacity: 0.06;
  -webkit-mask-image: linear-gradient(180deg, #000, transparent 50%);
  mask-image: linear-gradient(180deg, #000, transparent 50%);
}

.quick-card::after {
  content: "";
  position: absolute;
  inset: 7px;
  border-radius: 8.6rem 8.6rem 1.15rem 1.15rem;
  border: 1px solid rgba(180, 83, 9, 0.16);
  pointer-events: none;
}

.quick-logo {
  width: 68px;
  height: 68px;
  object-fit: contain;
  margin-bottom: 18px;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.state-block h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--lp-ink);
}

.state-block p {
  margin: 0;
  color: var(--lp-body);
  font-size: 16px;
  line-height: 1.55;
}

.state-block p strong {
  color: var(--lp-ink);
}

.status-icon {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 34px;
  font-weight: 700;
  box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.9);
}

.success .status-icon {
  color: #0a5c40;
  background: #d9efe4;
}

.warning .status-icon {
  color: #8a5a00;
  background: #fdeeb0;
}

.expired .status-icon {
  color: #b42318;
  background: #ffe4e1;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #d9e8df;
  border-top-color: #0a5c40;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.actions {
  width: 100%;
  display: grid;
  gap: 10px;
  margin-top: 6px;
}

.primary-btn,
.ghost-btn,
.secondary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 12px;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.18s ease, border-color 0.18s ease, filter 0.18s ease;
}

.primary-btn {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #0a5c40, #053d2c);
  box-shadow: 0 1px 2px rgba(3, 41, 29, 0.2), 0 8px 18px -8px rgba(3, 41, 29, 0.55);
  cursor: pointer;
}

.primary-btn:hover:not(:disabled) {
  filter: brightness(1.12);
}

.primary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ghost-btn,
.secondary-link {
  color: #0a5c40;
  border: 1.5px solid #0a5c40;
  background: #fff;
}

.ghost-btn:hover,
.secondary-link:hover {
  background: #eef6f1;
}

.primary-btn:focus-visible,
.ghost-btn:focus-visible,
.secondary-link:focus-visible,
.secondary-btn:focus-visible,
.admin-rekap-btn:focus-visible,
.logout-action-btn:focus-visible,
.text-link-btn:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

/* --- Mismatch Banner Styles --- */
.mismatch-banner {
  width: 100%;
  margin-top: 14px;
  padding: 16px;
  border-radius: 14px;
  background: #fffbeb;
  border: 1.5px solid #d9a21b;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
}

.mismatch-banner.admin-mismatch {
  background: #eef6f1;
  border-color: #0a5c40;
}

.conflict-mismatch {
  margin-bottom: 12px;
}

.mismatch-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mismatch-icon {
  font-size: 20px;
}

.mismatch-badge {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #92400e;
}

.admin-mismatch .mismatch-badge {
  color: #0a5c40;
}

.mismatch-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mismatch-text {
  font-size: 14px;
  line-height: 1.5;
  color: #78350f;
  margin: 0;
}

.admin-mismatch .mismatch-text {
  color: #053d2c;
}

.mismatch-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(255, 255, 255, 0.75);
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  color: #0a5c40;
  font-weight: 500;
}

.check-mark {
  color: #0a5c40;
  font-weight: 700;
}

.mismatch-subtext {
  font-size: 12.5px;
  line-height: 1.45;
  color: #7c3a0d;
  margin: 0;
}

.admin-mismatch .mismatch-subtext {
  color: #0a5c40;
}

.mismatch-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.logout-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  color: #4a2c05;
  background: #fcd34d;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.logout-action-btn:hover {
  background: #f5c02a;
}

.logout-action-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.admin-rekap-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  background: #0a5c40;
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.admin-rekap-btn:hover {
  background: #053d2c;
}

.secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13.5px;
  color: #2f4339;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.25);
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.secondary-btn:hover {
  background: #f4f8f5;
}

.text-link-btn {
  background: none;
  border: none;
  color: #b42318;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px;
  text-decoration: underline;
  text-align: center;
}

.text-link-btn:hover {
  color: #8e1b12;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 2.4s;
  }
}

@media (max-width: 480px) {
  .quick-attendance-page {
    padding: 16px;
  }

  .quick-card {
    padding: 40px 20px 28px;
    border-radius: 7rem 7rem 1.25rem 1.25rem;
  }

  .quick-card::after {
    border-radius: 6.6rem 6.6rem 0.95rem 0.95rem;
  }

  .state-block h1 {
    font-size: 23px;
  }
}
</style>
