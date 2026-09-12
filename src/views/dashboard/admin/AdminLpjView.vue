<template>
  <div class="admin-lpj-view space-y-6">
    <!-- Header with Integrated Period Picker -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold font-jakarta text-slate-900 tracking-tight">LPJ Guru</h1>
        <p class="text-sm text-slate-500 font-inter mt-1">Verifikasi laporan kinerja bulanan pengajar & penetapan peserta</p>
      </div>

      <!-- Quick Period Selector Toolbar -->
      <div class="flex items-center gap-2.5 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm self-start md:self-auto">
        <div class="flex items-center gap-2 pl-2">
          <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <label for="admin-lpj-period" class="text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</label>
          <input
            id="admin-lpj-period"
            v-model="selectedMonth"
            type="month"
            class="form-input text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:bg-white transition-all"
          />
        </div>
        <button
          type="button"
          class="btn btn-primary px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-primary-600/20 hover:-translate-y-0.5 transition-all"
          :disabled="loading"
          @click="applyPeriod"
        >
          {{ loading ? "Memuat..." : "Tampilkan" }}
        </button>
      </div>
    </header>

    <!-- KPI Summary Cards (Situational Awareness) -->
    <div v-if="!loading && !loadError" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1: Wajib LPJ -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-500 font-inter">Peserta Wajib LPJ</p>
          <p class="text-xl sm:text-2xl font-black font-jakarta text-slate-900">{{ summaryStats.totalEligible }} <span class="text-xs font-medium text-slate-400">Guru</span></p>
        </div>
      </div>

      <!-- Card 2: Menunggu Review -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-500 font-inter">Menunggu Review</p>
          <p class="text-xl sm:text-2xl font-black font-jakarta text-sky-700">{{ summaryStats.submittedCount }} <span class="text-xs font-medium text-slate-400">Laporan</span></p>
        </div>
      </div>

      <!-- Card 3: Disetujui -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-500 font-inter">Telah Disetujui</p>
          <p class="text-xl sm:text-2xl font-black font-jakarta text-emerald-700">{{ summaryStats.approvedCount }} <span class="text-xs font-medium text-slate-400">Laporan</span></p>
        </div>
      </div>

      <!-- Card 4: Draft / Belum Selesai -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-500 font-inter">Draft / Proses</p>
          <p class="text-xl sm:text-2xl font-black font-jakarta text-amber-700">{{ summaryStats.draftCount }} <span class="text-xs font-medium text-slate-400">Laporan</span></p>
        </div>
      </div>
    </div>

    <!-- Section: Peserta LPJ (Redesigned as Clean Interactive Chip Grid) -->
    <section v-if="!loading && !loadError" class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2.5">
            <h2 class="text-lg sm:text-xl font-bold font-jakarta text-slate-900">Peserta LPJ {{ periodLabel(period) }}</h2>
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {{ eligibleIds.length }} Terpilih
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 font-inter mt-0.5">Pilih guru yang wajib LPJ pada periode ini.</p>
        </div>

        <!-- Batch Selection Actions -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-100 transition"
            @click="selectAllEligible"
          >
            Pilih Semua
          </button>
          <button
            type="button"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
            @click="clearAllEligible"
          >
            Kosongkan
          </button>
        </div>
      </div>

      <!-- Loading or Teacher Chips Grid -->
      <div v-if="eligLoading" class="py-8 text-center text-sm text-slate-400 font-inter">
        <svg class="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        Memuat peserta...
      </div>

      <div v-else class="mt-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 elig-list">
          <label
            v-for="t in teachers"
            :key="t.id"
            class="elig-item flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none"
            :class="eligibleIds.includes(t.id) ? 'bg-emerald-50/60 border-emerald-300 shadow-sm' : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80'"
          >
            <input
              type="checkbox"
              :value="t.id"
              v-model="eligibleIds"
              class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <div
              class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
              :class="eligibleIds.includes(t.id) ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'"
            >
              {{ getTeacherInitials(t.displayName || t.name) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate" :class="eligibleIds.includes(t.id) ? 'text-emerald-950 font-bold' : 'text-slate-700'">
                {{ t.displayName || t.name || t.id }}
              </p>
              <p class="text-[11px] text-slate-400 truncate">
                {{ t.email || 'Pengajar TPQ' }}
              </p>
            </div>
            <span v-if="eligibleIds.includes(t.id)" class="text-emerald-600 text-xs font-bold shrink-0">
              ✓
            </span>
          </label>
        </div>

        <div class="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            class="btn btn-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary-600/20 hover:-translate-y-0.5 transition flex items-center gap-2"
            :disabled="eligSaving"
            @click="saveEligibility"
          >
            <svg v-if="!eligSaving" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ eligSaving ? "Menyimpan..." : "Simpan Peserta" }}</span>
          </button>

          <div
            v-if="eligMessage"
            class="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl border flex items-center gap-2"
            :class="eligOk ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'"
          >
            <span>{{ eligOk ? '✓' : '⚠️' }}</span>
            <span>{{ eligMessage }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4">
      <SkeletonLoader type="title" />
      <SkeletonLoader type="paragraph" />
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
      <div class="alert alert-error max-w-md mx-auto mb-4">{{ loadError }}</div>
      <button type="button" class="btn btn-secondary" @click="fetchData">
        Coba Lagi
      </button>
    </div>

    <!-- Section: Roster Laporan LPJ & Verifikasi -->
    <section v-else class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
      <!-- Toolbar & Status Filters -->
      <div class="roster-toolbar flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 class="text-lg sm:text-xl font-bold font-jakarta text-slate-900">
            Laporan {{ periodLabel(period) }} ({{ reports.length }})
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 font-inter">Status kelengkapan dan persetujuan berkas guru</p>
        </div>

        <!-- Status Filter Pills -->
        <div class="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0"
            :class="statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
            @click="statusFilter = 'all'"
          >
            Semua ({{ reports.length }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0"
            :class="statusFilter === 'submitted' ? 'bg-sky-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
            @click="statusFilter = 'submitted'"
          >
            Menunggu ({{ summaryStats.submittedCount }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0"
            :class="statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
            @click="statusFilter = 'approved'"
          >
            Disetujui ({{ summaryStats.approvedCount }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0"
            :class="statusFilter === 'draft' ? 'bg-amber-500 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
            @click="statusFilter = 'draft'"
          >
            Draft ({{ summaryStats.draftCount }})
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="reports.length === 0" class="empty-state py-12 text-center">
        <div class="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class="empty-icon"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800 font-jakarta">Belum ada laporan</h3>
        <p class="text-sm text-slate-500 font-inter max-w-sm mx-auto mt-1">
          Belum ada LPJ guru pada periode {{ periodLabel(period) }}.
        </p>
      </div>

      <div v-else class="mt-4">
        <!-- Desktop Table View -->
        <div class="table-responsive">
          <table class="data-table w-full">
            <thead>
              <tr class="border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3.5 px-4">Guru</th>
                <th class="py-3.5 px-4">Status</th>
                <th class="py-3.5 px-4">Kelengkapan</th>
                <th class="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="report in filteredReports"
                :key="report.id"
                class="hover:bg-slate-50/70 transition-colors group"
              >
                <!-- Column Guru -->
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      {{ getTeacherInitials(teacherName(report)) }}
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900 font-jakarta group-hover:text-primary-700 transition-colors">
                        {{ teacherName(report) }}
                      </p>
                      <p class="text-xs text-slate-400 font-inter">
                        ID: {{ report.guruId?.slice(0, 8) }}...
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Column Status -->
                <td class="py-4 px-4">
                  <span
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs"
                    :class="statusBadgeClasses(report.status)"
                  >
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="statusDotClasses(report.status)"
                    ></span>
                    <span>{{ statusLabel(report.status) }}</span>
                  </span>
                </td>

                <!-- Column Kelengkapan -->
                <td class="py-4 px-4">
                  <div class="cell-progress max-w-[180px]">
                    <span class="text-xs font-bold text-slate-700 w-12">{{ completenessText(report.id) }}</span>
                    <div class="progress-track progress-track-sm h-2 rounded-full bg-slate-100 overflow-hidden flex-1">
                      <div
                        class="progress-fill h-full rounded-full transition-all duration-500"
                        :class="progressValue(report.id) === 100 ? 'bg-emerald-600' : 'bg-primary-500'"
                        :style="{ width: progressValue(report.id) + '%' }"
                      />
                    </div>
                  </div>
                </td>

                <!-- Column Aksi -->
                <td class="py-4 px-4 text-right">
                  <div class="row-actions inline-flex items-center justify-end gap-2">
                    <button
                      type="button"
                      class="action-link px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      @click="router.push(`/dashboard/lpj/${report.id}`)"
                    >
                      Detail
                    </button>
                    <button
                      v-if="report.status === 'submitted'"
                      type="button"
                      class="action-link px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition disabled:opacity-50"
                      :disabled="actingId === report.id"
                      @click="approve(report)"
                    >
                      {{ actingId === report.id ? "Memproses..." : "Setujui" }}
                    </button>
                    <button
                      v-if="report.status === 'approved'"
                      type="button"
                      class="action-link px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition disabled:opacity-50"
                      :disabled="actingId === report.id"
                      @click="reopen(report)"
                    >
                      {{ actingId === report.id ? "Memproses..." : "Reopen" }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="report-cards space-y-3.5 mt-2">
          <article
            v-for="report in filteredReports"
            :key="report.id"
            class="report-card p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3"
          >
            <div class="report-head flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {{ getTeacherInitials(teacherName(report)) }}
                </div>
                <h3 class="font-bold text-slate-900 text-sm font-jakarta">{{ teacherName(report) }}</h3>
              </div>
              <span
                class="badge text-xs font-bold px-2.5 py-0.5 rounded-full border"
                :class="statusBadgeClasses(report.status)"
              >
                {{ statusLabel(report.status) }}
              </span>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs text-slate-500">
                <span>Kelengkapan</span>
                <span class="font-bold text-slate-800">{{ completenessText(report.id) }}</span>
              </div>
              <div class="progress-track h-2 rounded-full bg-slate-200/80 overflow-hidden">
                <div
                  class="progress-fill h-full rounded-full bg-primary-600 transition-all duration-500"
                  :style="{ width: progressValue(report.id) + '%' }"
                />
              </div>
            </div>

            <div class="report-actions flex items-center gap-2 pt-1">
              <button
                type="button"
                class="btn btn-secondary flex-1 py-2 text-xs font-bold rounded-xl"
                @click="router.push(`/dashboard/lpj/${report.id}`)"
              >
                Detail
              </button>
              <button
                v-if="report.status === 'submitted'"
                type="button"
                class="btn btn-primary flex-1 py-2 text-xs font-bold rounded-xl"
                :disabled="actingId === report.id"
                @click="approve(report)"
              >
                Setujui
              </button>
              <button
                v-if="report.status === 'approved'"
                type="button"
                class="btn btn-secondary flex-1 py-2 text-xs font-bold rounded-xl"
                :disabled="actingId === report.id"
                @click="reopen(report)"
              >
                Reopen
              </button>
            </div>
          </article>
        </div>

        <!-- Global Action Toast -->
        <div
          v-if="actionMessage"
          class="mt-4 p-3 rounded-xl border text-sm font-semibold flex items-center gap-2"
          :class="actionOk ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'"
        >
          <span>{{ actionOk ? '✓' : '⚠️' }}</span>
          <span>{{ actionMessage }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import SkeletonLoader from "@/components/SkeletonLoader.vue";
import { currentPeriod, periodLabel, statusLabel } from "@/utils/lpjState";

const router = useRouter();
const period = ref(currentPeriod());
const selectedMonth = ref(currentPeriod());
const loading = ref(true);
const loadError = ref("");
const reports = ref([]);
const teachers = ref([]);
const completenessMap = ref({});
const actingId = ref("");
const actionMessage = ref("");
const eligibleIds = ref([]);
const eligLoading = ref(false);
const eligSaving = ref(false);
const eligMessage = ref("");
const eligOk = ref(false);

const actionOk = ref(false);
const statusFilter = ref("all");

const summaryStats = computed(() => {
  const totalEligible = eligibleIds.value.length;
  let submittedCount = 0;
  let approvedCount = 0;
  let draftCount = 0;

  reports.value.forEach((r) => {
    if (r.status === "submitted") submittedCount++;
    else if (r.status === "approved") approvedCount++;
    else draftCount++;
  });

  return {
    totalEligible,
    submittedCount,
    approvedCount,
    draftCount,
  };
});

const filteredReports = computed(() => {
  if (statusFilter.value === "all") return reports.value;
  return reports.value.filter((r) => r.status === statusFilter.value);
});

const selectAllEligible = () => {
  eligibleIds.value = teachers.value.map((t) => t.id);
};

const clearAllEligible = () => {
  eligibleIds.value = [];
};

const getTeacherInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const statusBadgeClasses = (status) => {
  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  }
  if (status === "submitted") {
    return "bg-sky-50 text-sky-700 border-sky-200/80";
  }
  return "bg-amber-50 text-amber-700 border-amber-200/80";
};

const statusDotClasses = (status) => {
  if (status === "approved") return "bg-emerald-500";
  if (status === "submitted") return "bg-sky-500";
  return "bg-amber-500";
};

const statusClass = (status) => {
  if (status === "approved") return "badge-success";
  if (status === "submitted") return "badge-info";
  return "badge-warning";
};

const teacherName = (report) => {
  const found = teachers.value.find((t) => t.id === report.guruId);
  return found
    ? found.displayName || found.name || report.guruId
    : report.guruId;
};

const progressValue = (id) => completenessMap.value[id]?.percentage ?? 0;

const completenessText = (id) => {
  const c = completenessMap.value[id];
  if (c === undefined) return "menghitung...";
  if (!c) return "-";
  return `${c.percentage}%`;
};

const applyPeriod = () => {
  periodTouched.value = true;
  if (selectedMonth.value) {
    period.value = selectedMonth.value;
    fetchData();
  }
};

const fetchData = async () => {
  loading.value = true;
  loadError.value = "";
  actionMessage.value = "";
  try {
    try {
      const profileRes = await api.get("/settings/tpq-profile");
      if (profileRes.data?.activeOperationalPeriod && !periodTouched.value) {
        period.value = profileRes.data.activeOperationalPeriod;
        selectedMonth.value = profileRes.data.activeOperationalPeriod;
      }
    } catch {
      // fall back to current month
    }
    const [reportsRes, teachersRes] = await Promise.all([
      api.get("/ljp/reports", { params: { period: period.value } }),
      api
        .get("/users", { params: { role: "guru" } })
        .catch(() => ({ data: [] })),
    ]);
    reports.value = Array.isArray(reportsRes.data) ? reportsRes.data : [];
    const teacherList = Array.isArray(teachersRes.data)
      ? teachersRes.data
      : teachersRes.data?.users;
    teachers.value = Array.isArray(teacherList) ? teacherList : [];
    completenessMap.value = {};
    await Promise.all(
      reports.value.map(async (report) => {
        try {
          const res = await api.get(`/ljp/reports/${report.id}/completeness`);
          completenessMap.value = {
            ...completenessMap.value,
            [report.id]: res.data,
          };
        } catch {
          completenessMap.value = {
            ...completenessMap.value,
            [report.id]: null,
          };
        }
      }),
    );
    await fetchEligibility();

  } catch (error) {
    loadError.value =
      error.response?.data?.error || "Gagal memuat laporan LPJ.";
  } finally {
    loading.value = false;
  }
};


const fetchEligibility = async () => {
  eligLoading.value = true;
  eligMessage.value = "";
  try {
    const res = await api.get("/ljp/eligibility", { params: { period: period.value } });
    eligibleIds.value = res.data?.guruIds || [];
  } catch {
    eligibleIds.value = [];
  } finally {
    eligLoading.value = false;
  }
};

const saveEligibility = async () => {
  eligSaving.value = true;
  eligMessage.value = "";
  try {
    await api.put("/ljp/eligibility", { period: period.value, guruIds: eligibleIds.value });
    eligOk.value = true;
    eligMessage.value = "Daftar peserta tersimpan.";
  } catch (error) {
    eligOk.value = false;
    eligMessage.value = error.response?.data?.error || "Gagal menyimpan peserta.";
  } finally {
    eligSaving.value = false;
  }
};
const periodTouched = ref(false);

const approve = async (report) => {
  actingId.value = report.id;
  actionMessage.value = "";
  try {
    await api.post(`/ljp/reports/${report.id}/approve`);
    actionOk.value = true;
    actionMessage.value = "Laporan disetujui.";
    await fetchData();
  } catch (error) {
    actionOk.value = false;
    actionMessage.value =
      error.response?.data?.error || "Gagal menyetujui laporan.";
  } finally {
    actingId.value = "";
  }
};

const reopen = async (report) => {
  actingId.value = report.id;
  actionMessage.value = "";
  try {
    await api.post(`/ljp/reports/${report.id}/reopen`);
    actionOk.value = true;
    actionMessage.value = "Laporan dikembalikan ke draft.";
    await fetchData();
  } catch (error) {
    actionOk.value = false;
    actionMessage.value =
      error.response?.data?.error || "Gagal mengembalikan laporan.";
  } finally {
    actingId.value = "";
  }
};

onMounted(fetchData);
</script>

<style scoped>
.admin-lpj-view {
  padding-top: 60px;
}
@media (min-width: 1024px) {
  .admin-lpj-view {
    padding-top: 0;
  }
}
.page-header {
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
.filter-card {
  display: flex;
  align-items: flex-end;
  gap: var(--space-md);
  flex-wrap: wrap;
}
.form-group label {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 6px;
  color: var(--gray-700);
}
.form-input {
  padding: 10px 12px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
}
.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}
.filter-input {
  min-width: 200px;
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
}
.btn-secondary:hover:not(:disabled) {
  background: var(--gray-300);
}
.mt-4 {
  margin-top: var(--space-xl);
}
.text-muted {
  color: var(--gray-500);
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
.table-responsive {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--gray-200);
  font-size: 0.9rem;
}
.data-table th {
  font-weight: 600;
  color: var(--gray-700);
  background: var(--gray-50);
}
.action-link {
  background: none;
  border: none;
  color: var(--primary-dark);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px 0;
  white-space: nowrap;
}
.action-link:hover {
  text-decoration: underline;
}
.action-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.row-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.cell-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
}
.progress-track {
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--gray-100);
  overflow: hidden;
  flex: 1;
}
.progress-track-sm {
  min-width: 90px;
}
.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--primary-gradient);
  transition: width var(--transition-normal);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-sm);
  padding: var(--space-2xl) var(--space-lg);
}
.empty-state h3 {
  color: var(--primary-dark);
  margin: 0;
}
.empty-icon {
  color: var(--primary);
  opacity: 0.6;
}
.report-cards {
  display: none;
}
@media (max-width: 767px) {
  .table-responsive {
    display: none;
  }
  .report-cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  .report-card {
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    background: var(--white);
  }
  .report-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
  }
  .report-head h3 {
    margin: 0;
    color: var(--primary-dark);
    font-size: 1rem;
  }
  .report-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  .report-actions .btn {
    width: 100%;
  }
}
@media (max-width: 640px) {
  .admin-lpj-view {
    font-size: 0.95rem;
  }
  .filter-card {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-card .btn {
    width: 100%;
  }
  .filter-input {
    min-width: 0;
    width: 100%;
  }
}
</style>
