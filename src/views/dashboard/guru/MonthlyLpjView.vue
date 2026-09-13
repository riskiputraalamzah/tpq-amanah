<template>
  <div class="lpj-view">
    <header class="page-header">
      <div>
        <h1>LPJ Bulanan</h1>
        <p>Pantau dan lengkapi laporan pertanggungjawaban kinerja bulanan Anda</p>
      </div>
    </header>

    <div v-if="loading" class="glass-card">
      <SkeletonLoader type="title" />
      <SkeletonLoader type="card" height="120px" />
      <SkeletonLoader type="paragraph" />
    </div>

    <div v-else-if="loadError" class="glass-card">
      <div class="alert alert-error">{{ loadError }}</div>
      <button type="button" class="btn btn-secondary mt-4" @click="fetchData">
        Coba Lagi
      </button>
    </div>

    <div v-else-if="notEligible" class="glass-card">
      <div class="alert alert-warning">Anda tidak terdaftar sebagai peserta LPJ periode ini. Hubungi admin.</div>
    </div>

    <template v-else>
      <!-- Active Period Hero Banner -->
      <section class="glass-card active-period-banner">
        <div class="banner-content">
          <div class="banner-badge-row">
            <span class="active-pulse-badge">
              <span class="pulse-indicator"></span>
              Periode Aktif
            </span>
            <span v-if="activeReport" class="badge" :class="statusClass(activeReport.status)">
              {{ statusLabel(activeReport.status) }}
            </span>
          </div>

          <h2 class="banner-title">Periode {{ periodLabel(activePeriod) }}</h2>
          <p class="banner-desc">
            Laporan Pertanggungjawaban (LPJ) Kinerja Mengajar & Operasional Guru bulan berjalan.
          </p>

          <!-- Current Month Progress Preview -->
          <div v-if="activeReport" class="banner-progress-card">
            <div class="banner-progress-header">
              <span class="progress-title">Kelengkapan Dokumen LPJ</span>
              <span class="progress-percent font-bold">{{ progressText(activeReport.id) }}</span>
            </div>
            <div class="progress-track banner-track">
              <div
                class="progress-fill banner-fill"
                :style="{ width: progressValue(activeReport.id) + '%' }"
              />
            </div>
            <span class="progress-subtext">{{ progressSub(activeReport.id) }}</span>
          </div>
        </div>

        <div class="banner-cta-container">
          <button
            type="button"
            class="btn-open-active"
            :disabled="opening"
            @click="openCurrent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span>{{ opening ? "Membuka..." : (activeReport ? "Lanjutkan Pengisian LPJ" : "Buka LPJ Bulan Ini") }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cta-arrow">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </section>

      <!-- Archive & Report List Section -->
      <section class="glass-card lpj-list-card">
        <div class="lpj-toolbar">
          <div class="toolbar-title-box">
            <h2>Daftar Dokumen LPJ</h2>
            <span class="report-count-tag">{{ filteredReports.length }} Laporan</span>
          </div>

          <!-- Archive Filter Controls -->
          <div class="archive-filter-box">
            <div class="filter-input-wrapper">
              <label for="lpj-period" class="filter-label">Pilih Periode:</label>
              <input
                id="lpj-period"
                v-model="selectedMonth"
                type="month"
                class="form-input period-input-compact"
              />
              <button
                type="button"
                class="btn-filter-apply"
                @click="filterPeriod = selectedMonth"
              >
                Tampilkan
              </button>
            </div>

            <button
              v-if="filterPeriod !== activePeriod"
              type="button"
              class="btn-reset-filter"
              @click="resetToActivePeriod"
            >
              ✕ Tampilkan Bulan Berjalan
            </button>
          </div>
        </div>

        <div v-if="filteredReports.length === 0" class="empty-state">
          <div class="empty-icon-circle">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h3>Belum Ada Laporan</h3>
          <p class="text-muted">Tidak ada dokumen LPJ guru pada periode {{ periodLabel(filterPeriod) }}.</p>
          <div class="empty-actions-row">
            <button
              v-if="filterPeriod === activePeriod"
              type="button"
              class="btn btn-primary"
              :disabled="opening"
              @click="openCurrent"
            >
              {{ opening ? "Membuka..." : "Buka LPJ Bulan Ini" }}
            </button>
            <button
              v-else
              type="button"
              class="btn btn-secondary"
              @click="resetToActivePeriod"
            >
              Kembali ke Bulan Berjalan
            </button>
          </div>
        </div>

        <div v-else class="report-grid">
          <article
            v-for="report in filteredReports"
            :key="report.id"
            class="report-card"
            :class="{ 'is-active-period': report.period === activePeriod }"
          >
            <div class="report-head">
              <div class="report-period-title">
                <div class="calendar-icon-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h3>{{ periodLabel(report.period) }}</h3>
                  <span v-if="report.period === activePeriod" class="current-month-indicator">Bulan Berjalan</span>
                </div>
              </div>
              <span class="badge" :class="statusClass(report.status)">{{ statusLabel(report.status) }}</span>
            </div>

            <div class="report-progress">
              <div class="progress-meta">
                <span>Kelengkapan Dokumen</span>
                <strong class="progress-percent-val">{{ progressText(report.id) }}</strong>
              </div>
              <div
                class="progress-track"
                role="progressbar"
                :aria-valuenow="progressValue(report.id)"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="'Kelengkapan ' + periodLabel(report.period)"
              >
                <div
                  class="progress-fill"
                  :style="{ width: progressValue(report.id) + '%' }"
                />
              </div>
              <p class="text-muted progress-sub">{{ progressSub(report.id) }}</p>
            </div>

            <button
              type="button"
              class="btn-open-detail"
              @click="router.push(`/dashboard/lpj/${report.id}`)"
            >
              <span>Lihat Detail & Kelola LPJ</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import SkeletonLoader from "@/components/SkeletonLoader.vue";
import { currentPeriod, periodLabel, statusLabel } from "@/utils/lpjState";
import { fetchMyEligibility } from "@/utils/lpjEligibility";

const router = useRouter();
const loading = ref(true);
const loadError = ref("");
const opening = ref(false);
const notEligible = ref(false);

const reports = ref([]);
const completenessMap = ref({});
const activePeriod = ref(currentPeriod());
const filterPeriod = ref(currentPeriod());
const selectedMonth = ref(currentPeriod());

const activeReport = computed(() => {
  return reports.value.find((r) => r.period === activePeriod.value);
});

const filteredReports = computed(() => {
  if (!filterPeriod.value) return reports.value;
  return reports.value.filter((r) => r.period === filterPeriod.value);
});

const resetToActivePeriod = () => {
  filterPeriod.value = activePeriod.value;
  selectedMonth.value = activePeriod.value;
};

const statusClass = (status) => {
  if (status === "approved") return "badge-success";
  if (status === "submitted") return "badge-info";
  return "badge-warning";
};

const progressValue = (id) => completenessMap.value[id]?.percentage ?? 0;

const progressText = (id) => {
  const c = completenessMap.value[id];
  if (!c) return "menghitung...";
  return `${c.percentage}%`;
};

const progressSub = (id) => {
  const c = completenessMap.value[id];
  if (!c) return "Menghitung kelengkapan dari server...";
  return `${c.coveredDays} dari ${c.totalExpectedDays} hari terpenuhi`;
};

const fetchCompleteness = async (report) => {
  if ((report.status === "submitted" || report.status === "approved" || (report.status === "draft" && !report.isCompletenessStale)) && report.completeness) {
    completenessMap.value = { ...completenessMap.value, [report.id]: report.completeness };
    return;
  }
  try {
    const res = await api.get(`/ljp/reports/${report.id}/completeness`);
    completenessMap.value = { ...completenessMap.value, [report.id]: res.data };
  } catch {
    completenessMap.value = { ...completenessMap.value, [report.id]: null };
  }
};

const fetchData = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    try {
      const profileRes = await api.get("/settings/tpq-profile");
      if (profileRes.data?.activeOperationalPeriod) {
        activePeriod.value = profileRes.data.activeOperationalPeriod;
      }
    } catch {
      activePeriod.value = currentPeriod();
    }
    filterPeriod.value = activePeriod.value;
    selectedMonth.value = activePeriod.value;
    notEligible.value = false;
    try {
      notEligible.value = !(await fetchMyEligibility(activePeriod.value));
    } catch {
      notEligible.value = false;
    }
    if (notEligible.value) {
      reports.value = [];
      return;
    }
    const res = await api.get("/ljp/reports");
    reports.value = Array.isArray(res.data) ? res.data : [];
    await Promise.all(reports.value.map(fetchCompleteness));
  } catch (error) {
    loadError.value = error.response?.data?.error || "Gagal memuat laporan LPJ.";
  } finally {
    loading.value = false;
  }
};

const openCurrent = async () => {
  opening.value = true;
  try {
    const res = await api.post("/ljp/reports", { period: activePeriod.value });
    router.push(`/dashboard/lpj/${res.data.id}`);
  } catch (error) {
    loadError.value = error.response?.data?.error || "Gagal membuka LPJ bulan ini.";
  } finally {
    opening.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.lpj-view {
  padding-top: 60px;
}
@media (min-width: 1024px) {
  .lpj-view {
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
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-xl, 16px);
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  margin-bottom: var(--space-xl, 24px);
}

/* --- Active Period Hero Banner --- */
.active-period-banner {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 244, 0.9) 100%);
  border: 1.5px solid rgba(46, 125, 50, 0.2);
  box-shadow: 0 8px 28px rgba(46, 125, 50, 0.08);
  position: relative;
  overflow: hidden;
}

.active-period-banner::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 100%;
  background: var(--primary-gradient, linear-gradient(180deg, #1b5e20 0%, #43a047 100%));
}

@media (min-width: 900px) {
  .active-period-banner {
    grid-template-columns: 1fr auto;
    align-items: center;
    padding: 1.75rem 2rem;
  }
}

.banner-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.banner-badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.active-pulse-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(46, 125, 50, 0.12);
  color: #1b5e20;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2e7d32;
  box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7);
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(46, 125, 50, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(46, 125, 50, 0);
  }
}

.banner-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-dark, #1b5e20);
  margin: 2px 0 4px 0;
}

.banner-desc {
  font-size: 0.92rem;
  color: var(--gray-600, #4b5563);
  margin: 0 0 12px 0;
  max-width: 540px;
  line-height: 1.5;
}

/* Current Month Progress Preview in Banner */
.banner-progress-card {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(46, 125, 50, 0.16);
  border-radius: 12px;
  padding: 12px 16px;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.banner-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gray-700, #374151);
}

.progress-percent {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--primary-dark, #1b5e20);
}

.banner-track {
  height: 8px;
  background: var(--gray-200, #e5e7eb);
  border-radius: 999px;
  overflow: hidden;
}

.banner-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--primary-gradient, linear-gradient(135deg, #1b5e20, #43a047));
  transition: width 0.4s ease;
}

.progress-subtext {
  font-size: 0.78rem;
  color: var(--gray-500, #6b7280);
}

.banner-cta-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

@media (min-width: 900px) {
  .banner-cta-container {
    align-items: flex-end;
  }
}

.btn-open-active {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  background: var(--primary-gradient, linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%));
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(27, 94, 32, 0.28);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.btn-open-active:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(27, 94, 32, 0.38);
  filter: brightness(1.05);
}

.btn-open-active:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.cta-arrow {
  transition: transform 0.2s ease;
}

.btn-open-active:hover:not(:disabled) .cta-arrow {
  transform: translateX(4px);
}

/* --- Archive & Report List Section --- */
.lpj-list-card {
  padding: 1.5rem;
}

.lpj-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
}

.toolbar-title-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-title-box h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-dark, #1b5e20);
  margin: 0;
}

.report-count-tag {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--gray-100, #f3f4f6);
  color: var(--gray-600, #4b5563);
  border: 1px solid var(--gray-200, #e5e7eb);
}

.archive-filter-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-700, #374151);
  white-space: nowrap;
}

.period-input-compact {
  padding: 7px 12px;
  border: 1px solid var(--gray-300, #d1d5db);
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  background: #ffffff;
  color: var(--gray-800, #1f2937);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.period-input-compact:focus {
  border-color: var(--primary, #2e7d32);
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.12);
}

.btn-filter-apply {
  padding: 8px 16px;
  background: var(--gray-800, #1f2937);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-filter-apply:hover {
  background: #111827;
}

.btn-reset-filter {
  padding: 8px 14px;
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-reset-filter:hover {
  background: rgba(239, 68, 68, 0.15);
}

/* --- Empty State --- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
}

.empty-icon-circle {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: var(--gray-100, #f3f4f6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400, #9ca3af);
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--gray-800, #1f2937);
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 6px 0;
}

.text-muted {
  color: var(--gray-500, #6b7280);
  font-size: 0.9rem;
  margin: 0 0 1.25rem 0;
}

.empty-actions-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

/* --- Report Cards Grid --- */
.report-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 680px) {
  .report-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .report-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.report-card {
  background: #ffffff;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.report-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.07);
  border-color: rgba(46, 125, 50, 0.35);
}

.report-card.is-active-period {
  border: 1.5px solid rgba(46, 125, 50, 0.35);
  background: linear-gradient(180deg, rgba(232, 245, 233, 0.2) 0%, #ffffff 100%);
}

.report-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.report-period-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.calendar-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(46, 125, 50, 0.08);
  color: var(--primary-dark, #1b5e20);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.report-period-title h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--gray-900, #111827);
  margin: 0;
  line-height: 1.3;
}

.current-month-indicator {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #1b5e20;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

.report-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--gray-50, #f9fafb);
  border-radius: 10px;
  border: 1px solid var(--gray-100, #f3f4f6);
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.82rem;
  color: var(--gray-600, #4b5563);
}

.progress-percent-val {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--primary-dark, #1b5e20);
}

.progress-track {
  height: 8px;
  border-radius: 999px;
  background: var(--gray-200, #e5e7eb);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--primary-gradient, linear-gradient(135deg, #1b5e20, #43a047));
  transition: width 0.3s ease;
}

.progress-sub {
  font-size: 0.76rem;
  color: var(--gray-500, #6b7280);
  margin: 0;
}

.btn-open-detail {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f3f4f6;
  color: var(--gray-800, #1f2937);
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: auto;
}

.btn-open-detail:hover {
  background: var(--primary, #2e7d32);
  color: #ffffff;
  border-color: var(--primary, #2e7d32);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.25);
}

/* Common Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
}

.badge-success {
  background: rgba(46, 125, 50, 0.12);
  color: #1b5e20;
}

.badge-warning {
  background: rgba(234, 88, 12, 0.12);
  color: #c2410c;
}

.badge-info {
  background: rgba(2, 132, 199, 0.12);
  color: #0369a1;
}

/* Alert & Generic Buttons */
.alert {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 500;
}

.alert-error {
  background: rgba(244, 67, 54, 0.1);
  color: #c62828;
  border: 1px solid rgba(244, 67, 54, 0.25);
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary, #2e7d32);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark, #1b5e20);
}

.btn-secondary {
  background: var(--gray-200, #e5e7eb);
  color: var(--gray-700, #374151);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--gray-300, #d1d5db);
}

.mt-4 {
  margin-top: 1rem;
}

/* --- Mobile Responsive Tweaks --- */
@media (max-width: 640px) {
  .lpj-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .archive-filter-box {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .filter-input-wrapper {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .period-input-compact {
    width: 100%;
  }

  .btn-filter-apply,
  .btn-reset-filter {
    width: 100%;
    text-align: center;
  }

  .btn-open-active {
    width: 100%;
  }
}
</style>
