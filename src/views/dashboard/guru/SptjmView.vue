<template>
  <div class="sptjm-view">
    <header class="page-header">
      <div>
        <h1>SPTJM</h1>
        <p>Surat Pernyataan Tanggung Jawab Mutlak</p>
      </div>
      <button type="button" class="btn-link" @click="router.push(`/dashboard/lpj/${reportId}`)">
        Kembali ke Detail LPJ
      </button>
    </header>

    <div v-if="loading" class="glass-card">
      <SkeletonLoader type="title" />
      <SkeletonLoader type="paragraph" />
      <SkeletonLoader type="card" height="140px" />
    </div>

    <div v-else-if="loadError" class="glass-card">
      <div class="alert alert-error">{{ loadError }}</div>
      <button type="button" class="btn btn-secondary mt-4" @click="fetchData">
        Coba Lagi
      </button>
    </div>

    <template v-else>
      <div class="sptjm-layout">
        <div class="sptjm-side">
          <section class="glass-card">
            <h2>Konteks Laporan</h2>
            <dl class="context-grid">
              <div>
                <dt>Periode</dt>
                <dd>{{ periodLabel(data.period) }}</dd>
              </div>
              <div>
                <dt>Guru</dt>
                <dd>{{ teacherName }}</dd>
              </div>
              <div>
                <dt>Status LPJ</dt>
                <dd><span class="badge" :class="statusClass(data.status)">{{ statusLabel(data.status) }}</span></dd>
              </div>
              <div>
                <dt>Kelengkapan LPJ</dt>
                <dd>{{ completenessText }}</dd>
              </div>
            </dl>
          </section>

          <section class="glass-card">
            <h2>Kesiapan SPTJM</h2>
            <div
              class="alert"
              :class="data.readiness?.ready ? 'alert-success' : 'alert-warning'"
            >
              {{ readinessHeadline(data.readiness?.ready) }}
            </div>
            <div v-if="!data.readiness?.ready" class="missing-list">
              <p class="text-muted">Data yang belum lengkap:</p>
              <ul>
                <li v-for="code in data.readiness?.missing || []" :key="code">
                  {{ missingFieldLabel(code) }}
                </li>
              </ul>
            </div>
            <div class="action-area">
              <button
                v-if="fixTarget.needsTeacher && !isAdmin"
                type="button"
                class="btn btn-primary"
                @click="router.push('/dashboard/profile')"
              >
                Lengkapi Profil Saya
              </button>
              <button
                v-if="fixTarget.needsTeacher && isAdmin"
                type="button"
                class="btn btn-primary"
                @click="router.push('/dashboard/teachers')"
              >
                Kelola Data Pengajar
              </button>
              <button
                v-if="fixTarget.needsTpq && isAdmin"
                type="button"
                class="btn btn-secondary"
                @click="router.push('/dashboard/tpq-profile')"
              >
                Lengkapi Profil TPQ
              </button>
              <p v-if="fixTarget.needsTpq && !isAdmin" class="text-muted">
                Profil TPQ dilengkapi oleh admin.
              </p>
            </div>
          </section>
        </div>

        <section class="glass-card">
          <h2>Ringkasan Profil</h2>
          <h3>TPQ</h3>
          <dl class="context-grid">
            <div>
              <dt>Nama</dt>
              <dd>{{ data.tpq?.name || "-" }}</dd>
            </div>
            <div>
              <dt>Alamat</dt>
              <dd>{{ data.tpq?.address || "-" }}</dd>
            </div>
            <div>
              <dt>Kepala TPQ</dt>
              <dd>{{ data.tpq?.headName || "-" }}</dd>
            </div>
          </dl>
          <h3 class="mt-4">Guru</h3>
          <dl class="context-grid">
            <div>
              <dt>Nama</dt>
              <dd>{{ data.teacher?.displayName || "-" }}</dd>
            </div>
            <div>
              <dt>NIK</dt>
              <dd>{{ data.teacher?.nik || "-" }}</dd>
            </div>
            <div>
              <dt>Tempat lahir</dt>
              <dd>{{ data.teacher?.birthPlace || "-" }}</dd>
            </div>
            <div>
              <dt>Tanggal lahir</dt>
              <dd>{{ data.teacher?.birthDate || "-" }}</dd>
            </div>
            <div>
              <dt>Alamat</dt>
              <dd>{{ data.teacher?.address || "-" }}</dd>
            </div>
            <div>
              <dt>Jabatan</dt>
              <dd>{{ data.teacher?.position || "-" }}</dd>
            </div>
          </dl>
          <p class="text-muted mt-4">
            Dokumen SPTJM dibuat pada tahap dokumen, dicetak, ditandatangani basah,
            dan pindaian bertanda tangan diunggah admin mengikuti alur dokumen yang berlaku.
          </p>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/services/api";
import SkeletonLoader from "@/components/SkeletonLoader.vue";
import { periodLabel, statusLabel } from "@/utils/lpjState";
import { missingFieldLabel, readinessHeadline, profileFixTarget } from "@/utils/sptjmState";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const reportId = route.params.id;

const isAdmin = computed(() => authStore.user?.role === "admin");
const loading = ref(true);
const loadError = ref("");
const data = ref({});

const statusClass = (status) => {
  if (status === "approved") return "badge-success";
  if (status === "submitted") return "badge-info";
  return "badge-warning";
};

const teacherName = computed(() => data.value.teacher?.displayName || "-");

const completenessText = computed(() => {
  const c = data.value.completeness;
  if (c === null || c === undefined) return "menghitung...";
  if (typeof c === "object") return `${c.percentage}%`;
  return String(c);
});

const fixTarget = computed(() => profileFixTarget(data.value.readiness?.missing));

const fetchData = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const res = await api.get(`/ljp/reports/${reportId}/sptjm-readiness`);
    data.value = res.data;
  } catch (error) {
    if (error.response?.status === 404) {
      loadError.value = "Laporan tidak ditemukan.";
    } else if (error.response?.status === 403) {
      loadError.value = "Anda tidak memiliki akses ke laporan ini.";
    } else {
      loadError.value = error.response?.data?.error || "Gagal memuat kesiapan SPTJM.";
    }
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.sptjm-view {
  padding-top: 60px;
}
@media (min-width: 1024px) {
  .sptjm-view {
    padding-top: 0;
  }
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: var(--space-xl);
}
.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin-bottom: 4px;
}
.page-header p {
  font-size: 0.95rem;
  color: var(--gray-600);
}
.btn-link {
  background: none;
  border: none;
  color: var(--primary-dark);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  padding: 8px 4px;
}
.btn-link:hover {
  text-decoration: underline;
}
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: var(--space-xl);
}
.glass-card h2 {
  font-size: 1.2rem;
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--gray-200);
}
.glass-card h3 {
  font-size: 1rem;
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}
.sptjm-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  align-items: start;
}
@media (min-width: 1024px) {
  .sptjm-layout {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-xl);
  }
  .sptjm-layout .glass-card {
    margin-bottom: 0;
  }
  .sptjm-side .glass-card {
    margin-bottom: var(--space-xl);
  }
  .sptjm-side .glass-card:last-child {
    margin-bottom: 0;
  }
}
.sptjm-side {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.context-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin: 0;
}
@media (min-width: 768px) {
  .context-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.context-grid dt {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gray-500);
}
.context-grid dd {
  margin: 2px 0 0;
  font-weight: 600;
  color: var(--gray-700);
}
.text-muted {
  color: var(--gray-500);
  font-size: 0.85rem;
}
.missing-list ul {
  margin: var(--space-sm) 0 0;
  padding-left: 1.25rem;
  color: var(--gray-700);
  font-size: 0.9rem;
}
.action-area {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  flex-wrap: wrap;
}
.btn {
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.btn-primary {
  background: var(--primary);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}
.btn-secondary {
  background: var(--gray-200);
  color: var(--gray-700);
  white-space: nowrap;
}
.btn-secondary:hover:not(:disabled) {
  background: var(--gray-300);
}
.alert {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  margin-top: var(--space-md);
  font-size: 0.85rem;
  font-weight: 500;
}
.alert-success {
  background: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
  border: 1px solid rgba(76, 175, 80, 0.2);
}
.alert-warning {
  background: rgba(255, 152, 0, 0.1);
  color: #ef6c00;
  border: 1px solid rgba(255, 152, 0, 0.2);
}
.alert-error {
  background: rgba(244, 67, 54, 0.1);
  color: #c62828;
  border: 1px solid rgba(244, 67, 54, 0.2);
}
.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.badge-success {
  background: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
}
.badge-warning {
  background: rgba(255, 152, 0, 0.1);
  color: #ef6c00;
}
.badge-info {
  background: rgba(33, 150, 243, 0.1);
  color: #1565c0;
}
.mt-4 {
  margin-top: var(--space-xl);
}
@media (max-width: 640px) {
  .sptjm-view {
    font-size: 0.95rem;
  }
  .page-header {
    flex-direction: column;
  }
  .action-area {
    flex-direction: column;
    align-items: stretch;
  }
  .action-area .btn {
    width: 100%;
  }
}
</style>