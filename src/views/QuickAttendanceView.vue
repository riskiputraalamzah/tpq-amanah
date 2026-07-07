<template>
  <main class="quick-attendance-page">
    <section class="quick-card">
      <img :src="logoUrl" alt="TPQ AMANAH" class="mx-auto quick-logo" />

      <div v-if="state === 'loading'" class="state-block">
        <div class="spinner"></div>
        <h1>Memproses Absensi</h1>
        <p>Mohon tunggu sebentar.</p>
      </div>

      <div v-else-if="state === 'success'" class="state-block success">
        <div class="status-icon">✓</div>
        <h1>{{ resultTitle }}</h1>
        <p v-if="isTestResult">
          Link test WA berhasil diproses. Tidak ada absensi yang dicatat.
        </p>
        <p v-else>
          Absensi {{ details?.guruName || "guru" }} tercatat sebagai
          <strong>{{ resultStatusLabel }}</strong
          >.
        </p>
        <router-link class="secondary-link" :to="dashboardLink">
          Buka Dashboard
        </router-link>
      </div>

      <div v-else-if="state === 'already'" class="state-block success">
        <div class="status-icon">✓</div>
        <h1>Absensi Sudah Tercatat</h1>
        <p>
          Status hari ini sudah
          <strong>{{
            details?.existingAttendance?.statusLabel ||
            details?.requestedStatusLabel
          }}</strong
          >.
        </p>
        <router-link class="secondary-link" :to="dashboardLink">
          Buka Dashboard
        </router-link>
      </div>

      <div v-else-if="state === 'conflict'" class="state-block warning">
        <div class="status-icon">!</div>
        <h1>Absensi Sudah Ada</h1>
        <p>
          Status saat ini
          <strong>{{ details?.existingAttendance?.statusLabel }}</strong
          >. Ubah menjadi <strong>{{ details?.requestedStatusLabel }}</strong
          >?
        </p>
        <div class="actions">
          <button
            class="primary-btn"
            :disabled="submitting"
            @click="confirmUpdate"
          >
            {{ submitting ? "Mengubah..." : "Ya, Ubah Status" }}
          </button>
          <router-link class="ghost-btn" :to="dashboardLink">
            Cek Dashboard
          </router-link>
        </div>
      </div>

      <div v-else-if="state === 'expired'" class="state-block expired">
        <div class="status-icon">×</div>
        <h1>Link Sudah Expired</h1>
        <p>{{ expiredMessage }}</p>
        <router-link class="primary-btn" :to="dashboardLink">
          Absen Manual
        </router-link>
      </div>

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
import { useRoute } from "vue-router";
import api from "../services/api";
import logoUrl from "../assets/logo.png";

const route = useRoute();
const dashboardLink = "/dashboard/attendance";
const state = ref("loading");
const details = ref(null);
const result = ref(null);
const errorMessage = ref("Link absensi tidak valid atau sudah tidak tersedia.");
const submitting = ref(false);

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
  } catch (error) {
    applyError(error);
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/attendance/quick/${route.params.code}`);
    details.value = data;

    if (data.action === "already_recorded") {
      state.value = "already";
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
.quick-attendance-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #e8f5e9 0%, #f7fff8 45%, #d6efd8 100%);
}

.quick-card {
  width: min(100%, 440px);
  padding: 32px 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 70px rgba(27, 94, 32, 0.16);
  text-align: center;
}

.quick-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  margin-bottom: 20px;
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
  line-height: 1.2;
  color: #123d19;
}

.state-block p {
  margin: 0;
  color: #52615a;
  font-size: 16px;
  line-height: 1.55;
}

.status-icon {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 36px;
  font-weight: 700;
}

.success .status-icon {
  color: #1b7a31;
  background: #dcf4e1;
}

.warning .status-icon {
  color: #8a5a00;
  background: #fff4cc;
}

.expired .status-icon {
  color: #b42318;
  background: #ffe4e1;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #d9eadb;
  border-top-color: #2e7d32;
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
  min-height: 46px;
  padding: 0 18px;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
}

.primary-btn {
  border: 0;
  color: #fff;
  background: #2e7d32;
  cursor: pointer;
}

.primary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ghost-btn,
.secondary-link {
  color: #1f6b2b;
  border: 1px solid #2e7d32;
  background: #fff;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .quick-attendance-page {
    padding: 16px;
  }

  .quick-card {
    padding: 28px 20px;
  }

  .state-block h1 {
    font-size: 23px;
  }
}
</style>
