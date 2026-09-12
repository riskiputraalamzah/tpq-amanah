<template>
  <div class="lpj-detail-view">
    <header class="page-header">
      <div>
        <h1>LPJ {{ periodLabel(report.period) }}</h1>
        <p>Rekap dan pusat kendali kelengkapan bulanan</p>
      </div>
      <button type="button" class="btn-link" @click="backLabel">
        {{ isAdmin ? "Kembali ke LPJ Guru" : "Kembali ke LPJ Bulanan" }}
      </button>
    </header>

    <div v-if="loading" class="glass-card">
      <SkeletonLoader type="title" />
      <SkeletonLoader type="paragraph" />
      <SkeletonLoader type="card" height="160px" />
    </div>

    <div v-else-if="loadError" class="glass-card">
      <div class="alert alert-error">{{ loadError }}</div>
      <button type="button" class="btn btn-secondary mt-4" @click="fetchData">
        Coba Lagi
      </button>
    </div>

    <template v-else>
      <div class="lpj-layout">
        <div class="lpj-side">
          <section class="glass-card">
            <h2>Ringkasan</h2>
            <dl class="context-grid">
              <div>
                <dt>Periode</dt>
                <dd>{{ periodLabel(report.period) }}</dd>
              </div>
              <div>
                <dt>Guru</dt>
                <dd>{{ guruName }}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd><span class="badge" :class="statusClass(report.status)">{{ statusLabel(report.status) }}</span></dd>
              </div>
              <div>
                <dt>Hari operasional</dt>
                <dd>{{ completeness?.totalExpectedDays ?? "-" }}</dd>
              </div>
              <div>
                <dt>Hari KBM valid</dt>
                <dd>{{ teachingDays }}</dd>
              </div>
              <div>
                <dt>Aktivitas khusus</dt>
                <dd>{{ specialDays }}</dd>
              </div>
            </dl>
          </section>

          <section class="glass-card completeness-card">
            <h2>Kelengkapan LPJ</h2>
            <div class="completeness-hero">
              <strong class="completeness-pct">{{ completeness ? `${completeness.percentage}%` : "-" }}</strong>
              <p class="text-muted">
                {{ completeness ? `${completeness.coveredDays} dari ${completeness.totalExpectedDays} hari terpenuhi` : "Menghitung dari server..." }}
              </p>
            </div>
            <div
              v-if="completeness"
              class="progress-track"
              role="progressbar"
              :aria-valuenow="completeness.percentage"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Kelengkapan LPJ"
            >
              <div class="progress-fill" :style="{ width: completeness.percentage + '%' }" />
            </div>
            <dl class="context-grid mt-4">
              <div>
                <dt>Kehadiran terpenuhi</dt>
                <dd>{{ coverageText }}</dd>
              </div>
              <div>
                <dt>Hari belum lengkap</dt>
                <dd>{{ completeness?.missingDays ?? "-" }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="!isAdmin || report.status === 'submitted' || report.status === 'approved'" class="glass-card submit-card">
            <h2>Pengajuan</h2>
            <div v-if="actionMessage" class="alert" :class="actionOk ? 'alert-success' : 'alert-error'">
              {{ actionMessage }}
            </div>

            <template v-if="!isAdmin">
              <div v-if="report.status === 'draft' && completeness && completeness.percentage < 100" class="alert alert-warning">
                LPJ belum lengkap. {{ incompleteMessage(completeness) }}.
              </div>
              <div v-else-if="report.status === 'draft'" class="alert alert-success">
                LPJ sudah lengkap dan siap diajukan.
              </div>
              <div v-else-if="report.status === 'submitted'" class="alert alert-info">
                LPJ sudah diajukan dan menunggu verifikasi admin. Data terkunci.
              </div>
              <div v-else-if="report.status === 'approved'" class="alert alert-success">
                LPJ telah disetujui admin.
              </div>
              <button
                v-if="report.status === 'draft'"
                type="button"
                class="mt-4 btn btn-primary btn-submit"
                :disabled="!canSubmit || submitting"
                @click="submit"
              >
                {{ submitting ? "Mengajukan..." : "Ajukan LPJ" }}
              </button>
            </template>

            <button
              type="button"
              class="mt-4 btn btn-secondary btn-submit"
              @click="router.push(`/dashboard/lpj/${reportId}/sptjm`)"
            >
              Lihat Kesiapan SPTJM
            </button>

            <div v-if="isAdmin" class="admin-actions">
              <button
                v-if="report.status === 'submitted'"
                type="button"
                class="btn btn-primary"
                :disabled="acting"
                @click="approve"
              >
                {{ acting ? "Memproses..." : "Setujui Laporan" }}
              </button>
              <button
                v-if="report.status === 'approved'"
                type="button"
                class="btn btn-secondary"
                :disabled="acting"
                @click="reopen"
              >
                {{ acting ? "Memproses..." : "Kembalikan ke Draft" }}
              </button>
              <p v-if="report.status === 'draft'" class="text-muted">Laporan masih draft. Aksi admin tersedia setelah guru mengajukan.</p>
            </div>
          </section>

          <SignedDocumentUpload v-if="isAdmin && report" :report-id="reportId" />
        </div>

        <section class="glass-card days-card">
          <div class="roster-toolbar">
            <h2>Rincian Harian ({{ days.length }})</h2>
          </div>
          <div v-if="days.length === 0" class="empty-state">
            <h3>Tidak ada hari operasional</h3>
            <p class="text-muted">Tidak ada hari operasional pada periode ini.</p>
          </div>
          <ul v-else class="day-list">
            <li v-for="day in days" :key="day.date" class="day-row" :class="day.isCovered ? 'day-covered' : 'day-missing'">
              <div class="day-info">
                <strong>{{ formatDay(day.date) }}</strong>
                <span class="badge" :class="day.isCovered ? 'badge-success' : 'badge-warning'">
                  {{ dayLabel(day) }}
                </span>
                <span class="day-note">{{ day.note }}</span>
              </div>
              <router-link
                v-if="dayAction(day).kind === 'link'"
                :to="dayAction(day).to"
                :class="dayAction(day).primary ? 'btn btn-primary btn-day' : 'btn btn-secondary btn-day'"
              >
                {{ dayAction(day).label }}
              </router-link>
              <div v-else-if="dayAction(day).kind === 'disabled'" class="day-action-disabled">
                <button type="button" class="btn btn-primary btn-day btn-disabled" disabled>
                  {{ dayAction(day).label }}
                </button>
                <span class="day-reason">{{ dayAction(day).reason }}</span>
              </div>
              <span v-else class="day-done">Lengkap</span>
            </li>
          </ul>
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
import SignedDocumentUpload from "@/components/SignedDocumentUpload.vue";
import {
  periodLabel,
  statusLabel,
  incompleteMessage,
  resolveDayAction,
} from "@/utils/lpjState";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const reportId = route.params.id;

const isAdmin = computed(() => authStore.user?.role === "admin");
const loading = ref(true);
const loadError = ref("");
const report = ref({});
const completeness = ref(null);
const sessionsByDate = ref({});
const teachers = ref([]);
const submitting = ref(false);
const acting = ref(false);
const actionMessage = ref("");
const actionOk = ref(false);

const statusClass = (status) => {
  if (status === "approved") return "badge-success";
  if (status === "submitted") return "badge-info";
  return "badge-warning";
};

const guruName = computed(() => {
  if (!isAdmin.value) return authStore.user?.displayName || authStore.user?.name || "-";
  const found = teachers.value.find((t) => t.id === report.value.guruId);
  return found ? found.displayName || found.name || report.value.guruId : report.value.guruId || "-";
});

const days = computed(() => completeness.value?.dailyDetails || []);

const coverageText = computed(() => {
  if (!completeness.value) return "-";
  return `${completeness.value.coveredDays}/${completeness.value.totalExpectedDays} hari`;
});

const teachingDays = computed(() =>
  days.value.filter((d) => d.statusClassification === "present_teaching").length,
);

const specialDays = computed(() =>
  days.value.filter((d) => d.statusClassification === "present_special").length,
);

const canSubmit = computed(
  () => report.value.status === "draft" && (completeness.value?.percentage ?? 0) === 100,
);

const dayLabel = (day) => {
  if (day.statusClassification === "permitted_absence") return "Izin / Sakit";
  if (day.statusClassification === "present_teaching") return "Hadir + KBM";
  if (day.statusClassification === "present_special") return "Hadir + Khusus";
  if (day.statusClassification === "present_non_kbm") return "Hadir + Non-KBM";
  return day.isCovered ? "Lengkap" : "Belum lengkap";
};

const formatDay = (dateStr) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ""));
  if (!m) return String(dateStr);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const dayAction = (day) => resolveDayAction(day, sessionsByDate.value);

const backLabel = () => {
  router.push(isAdmin.value ? "/dashboard/admin-lpj" : "/dashboard/lpj");
};

const toDateKey = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const s = value._seconds ?? value.seconds;
    if (s === undefined || s === null) return "";
    const d = new Date(Number(s) * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
};

const fetchData = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const reportRes = await api.get(`/ljp/reports/${reportId}`);
    report.value = reportRes.data;
    const compRes = await api.get(`/ljp/reports/${reportId}/completeness`);
    completeness.value = compRes.data;
    const [year, month] = String(report.value.period || "").split("-").map(Number);
    if (year && month) {
      const params = { month, year };
      if (isAdmin.value && report.value.guruId) {
        params.guruId = report.value.guruId;
        try {
          const usersRes = await api.get("/users", { params: { role: "guru" } });
          teachers.value = Array.isArray(usersRes.data) ? usersRes.data : [];
        } catch {
          teachers.value = [];
        }
      }
      const sessRes = await api.get("/teaching_sessions", { params });
      const grouped = {};
      for (const s of sessRes.data || []) {
        const key = toDateKey(s.date);
        if (!key) continue;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
      }
      sessionsByDate.value = grouped;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      loadError.value = "Laporan tidak ditemukan.";
    } else if (error.response?.status === 403) {
      loadError.value = "Anda tidak memiliki akses ke laporan ini.";
    } else {
      loadError.value = error.response?.data?.error || "Gagal memuat detail LPJ.";
    }
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  const reportRes = await api.get(`/ljp/reports/${reportId}`);
  report.value = reportRes.data;
  const compRes = await api.get(`/ljp/reports/${reportId}/completeness`);
  completeness.value = compRes.data;
};

const submit = async () => {
  submitting.value = true;
  actionMessage.value = "";
  try {
    await api.post(`/ljp/reports/${reportId}/submit`);
    actionOk.value = true;
    actionMessage.value = "LPJ berhasil diajukan.";
    await refresh();
  } catch (error) {
    actionOk.value = false;
    const details = error.response?.data?.details;
    actionMessage.value = details
      ? `LPJ belum lengkap. ${incompleteMessage(details)}.`
      : error.response?.data?.error || "Gagal mengajukan LPJ.";
  } finally {
    submitting.value = false;
  }
};

const approve = async () => {
  acting.value = true;
  actionMessage.value = "";
  try {
    await api.post(`/ljp/reports/${reportId}/approve`);
    actionOk.value = true;
    actionMessage.value = "Laporan disetujui.";
    await refresh();
  } catch (error) {
    actionOk.value = false;
    actionMessage.value = error.response?.data?.error || "Gagal menyetujui laporan.";
  } finally {
    acting.value = false;
  }
};

const reopen = async () => {
  acting.value = true;
  actionMessage.value = "";
  try {
    await api.post(`/ljp/reports/${reportId}/reopen`);
    actionOk.value = true;
    actionMessage.value = "Laporan dikembalikan ke draft.";
    await refresh();
  } catch (error) {
    actionOk.value = false;
    actionMessage.value = error.response?.data?.error || "Gagal mengembalikan laporan.";
  } finally {
    acting.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.lpj-detail-view {
  padding-top: 60px;
}
@media (min-width: 1024px) {
  .lpj-detail-view {
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
.lpj-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  align-items: start;
}
@media (min-width: 1024px) {
  .lpj-layout {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-xl);
  }
  .lpj-layout .glass-card {
    margin-bottom: 0;
  }
  .lpj-side {
    display: flex;
    flex-direction: column;
  }
  .lpj-side .glass-card {
    margin-bottom: var(--space-xl);
  }
  .lpj-side .glass-card:last-child {
    margin-bottom: 0;
  }
}
.lpj-side {
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
}
.completeness-hero {
  display: flex;
  align-items: baseline;
  gap: var(--space-md);
  flex-wrap: wrap;
  margin-bottom: var(--space-md);
}
.completeness-pct {
  font-size: 2.25rem;
  line-height: 1;
  color: var(--primary-dark);
}
.completeness-hero p {
  margin: 0;
}
.progress-track {
  height: 12px;
  border-radius: var(--radius-full);
  background: var(--gray-100);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--primary-gradient);
  transition: width var(--transition-normal);
}
.mt-4 {
  margin-top: var(--space-xl);
}
.btn {
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  text-decoration: none;
  display: inline-block;
  text-align: center;
}
.btn-secondary:hover:not(:disabled) {
  background: var(--gray-300);
}
.btn-submit {
  width: 100%;
  min-height: 2.75rem;
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
.alert-error {
  background: rgba(244, 67, 54, 0.1);
  color: #c62828;
  border: 1px solid rgba(244, 67, 54, 0.2);
}
.alert-warning {
  background: rgba(255, 152, 0, 0.1);
  color: #ef6c00;
  border: 1px solid rgba(255, 152, 0, 0.2);
}
.alert-info {
  background: rgba(33, 150, 243, 0.1);
  color: #1565c0;
  border: 1px solid rgba(33, 150, 243, 0.2);
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
.admin-actions {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  flex-wrap: wrap;
}
.roster-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: var(--space-lg);
}
.roster-toolbar h2 {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.empty-state {
  text-align: center;
  padding: var(--space-2xl) var(--space-lg);
}
.empty-state h3 {
  color: var(--primary-dark);
  margin: 0 0 var(--space-sm);
}
.day-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.day-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  background: var(--white);
}
.day-missing {
  border-left: 4px solid var(--warning);
}
.day-covered {
  border-left: 4px solid var(--success);
}
.day-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  min-width: 0;
}
.day-info strong {
  color: var(--gray-800);
}
.day-note {
  font-size: 0.85rem;
  color: var(--gray-500);
}
.day-done {
  font-size: 0.85rem;
  font-weight: 600;
  color: #2e7d32;
  white-space: nowrap;
}
.btn-day {
  font-size: 0.85rem;
  padding: 8px 14px;
}
.btn-disabled {
  background: var(--primary);
  color: #fff;
  opacity: 0.55;
  cursor: not-allowed;
}
.day-action-disabled {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}
.day-reason {
  font-size: 0.8rem;
  color: var(--gray-500);
}
@media (max-width: 640px) {
  .lpj-detail-view {
    font-size: 0.95rem;
  }
  .page-header {
    flex-direction: column;
  }
  .day-row {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-day {
    width: 100%;
  }
  .day-action-disabled {
    flex-direction: column;
    align-items: stretch;
  }
  .admin-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .admin-actions .btn {
    width: 100%;
  }
  .completeness-pct {
    font-size: 1.75rem;
  }
}
</style>
