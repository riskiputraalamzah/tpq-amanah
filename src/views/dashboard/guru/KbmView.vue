<template>
  <div class="kbm-view">
    <header class="page-header">
      <div>
        <h1>KBM / Mengajar</h1>
        <p>Catat dan pantau aktivitas belajar mengajar harian</p>
      </div>
    </header>

    <div v-if="loadingInitial" class="loading-state glass-card">
      <div class="loading-spinner"></div>
      <p>Memuat data KBM...</p>
    </div>

    <template v-else>
      <!-- Quick Metrics Summary -->
      <div class="kbm-metrics-grid">
        <div class="kbm-metric-card glass-card">
          <div class="metric-icon total">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-label">Total Sesi Bulan Ini</span>
            <strong class="metric-value">{{ totalSessions }} <span class="metric-unit">Sesi</span></strong>
          </div>
        </div>

        <div class="kbm-metric-card glass-card">
          <div class="metric-icon today">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-label">Sesi Hari Ini</span>
            <strong class="metric-value">{{ todaySessions }} <span class="metric-unit">Sesi</span></strong>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Form Input KBM -->
        <div class="kbm-form glass-card">
          <div class="card-header-row">
            <div class="card-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h2>Input Sesi Mengajar</h2>
              <p class="card-subtitle">Catat presensi & sesi pembelajaran baru</p>
            </div>
          </div>

          <form @submit.prevent="submitSession" class="kbm-form-inner">
            <div class="form-group">
              <label>Tanggal KBM</label>
              <input
                type="date"
                v-model="form.date"
                :min="minDateString"
                :max="todayString"
                @change="validateEligibility"
                class="form-input"
                required
              />
              <small class="help-text">
                Pilih tanggal hari ini atau backfill tanggal sebelumnya dalam bulan yang sama.
              </small>
            </div>

            <div class="form-group">
              <label>Jilid / Marhalah</label>
              <select v-model="form.classId" class="form-input" required>
                <option value="" disabled>Pilih Jilid / Marhalah</option>
                <optgroup label="JILID">
                  <option v-for="c in jilidList" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </optgroup>
                <optgroup label="MARHALAH" v-if="marhalahList.length > 0">
                  <option v-for="c in marhalahList" :key="c.id" :value="c.id">
                    {{ c.name }}
                  </option>
                </optgroup>
              </select>
            </div>

            <div class="form-group">
              <label>Sesi / Gelombang</label>
              <select
                v-model="form.sessionSlotId"
                class="form-input"
                @change="validateEligibility"
                required
              >
                <option value="" disabled>Pilih Sesi</option>
                <option v-for="s in sessionSlots" :key="s.id" :value="s.id">
                  {{ s.name }} ({{ s.startTime }} - {{ s.endTime }})
                </option>
              </select>
            </div>

            <div class="form-group badal-group" v-if="teachers.length > 0">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isSubstitute" />
                <span>Menggantikan Guru Lain (Badal)</span>
              </label>
              <Transition name="fade">
                <select
                  v-if="form.isSubstitute"
                  v-model="form.substituteFor"
                  class="mt-2 form-input"
                  required
                >
                  <option value="" disabled>Pilih Guru yang Digantikan</option>
                  <option v-for="t in teachers" :key="t.id" :value="t.id">
                    {{ t.displayName || t.name }}
                  </option>
                </select>
              </Transition>
            </div>

            <!-- Eligibility Feedback -->
            <div
              v-if="eligibilityMessage"
              class="alert"
              :class="isEligible ? 'alert-success' : 'alert-error'"
            >
              <div class="alert-icon">
                <svg v-if="isEligible" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <span>{{ eligibilityMessage }}</span>
            </div>

            <button
              type="submit"
              class="submit-kbm-btn"
              :class="{ 'is-eligible': isEligible }"
              :disabled="!isEligible || submitting"
            >
              <svg v-if="!submitting" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{{ submitting ? "Menyimpan Sesi..." : "Simpan Sesi KBM" }}</span>
            </button>
          </form>
        </div>

        <!-- Riwayat KBM -->
        <div class="kbm-history glass-card">
          <div class="history-card-header">
            <div>
              <h2>Riwayat KBM Bulan Ini</h2>
              <p class="card-subtitle">Daftar sesi pembelajaran yang telah Anda laksanakan</p>
            </div>
            <div class="history-filter-wrapper" v-if="history.length > 3">
              <select v-model="historyFilter" class="filter-select">
                <option value="all">Semua Jilid / Kelas</option>
                <option v-for="c in classes" :key="'f-' + c.id" :value="String(c.id)">
                  {{ c.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Riwayat KBM Table (Desktop & Tablet) -->
          <div class="table-responsive desktop-table">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tanggal & Sesi</th>
                  <th>Jilid / Marhalah</th>
                  <th>Aktivitas</th>
                  <th class="text-center">RPP</th>
                  <th>Kelengkapan</th>
                  <th class="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredHistory.length === 0">
                  <td colspan="6" class="text-center empty-cell">
                    <div class="empty-state-mini">
                      <p>Belum ada sesi KBM tercatat {{ historyFilter !== 'all' ? 'untuk kelas ini' : 'bulan ini' }}</p>
                    </div>
                  </td>
                </tr>
                <tr v-for="session in filteredHistory" :key="session.id">
                  <td class="cell-nowrap">
                    <div class="date-slot-cell">
                      <span class="cell-date">{{ formatDate(session.date) }}</span>
                      <span class="cell-slot-badge">
                        {{ getSessionName(session.sessionSlotId) }}
                        <span v-if="getSessionTime(session.sessionSlotId)" class="slot-time">({{ getSessionTime(session.sessionSlotId) }})</span>
                      </span>
                    </div>
                  </td>
                  <td class="cell-nowrap">
                    <span class="level-badge font-semibold">{{ getLevelName(session) }}</span>
                  </td>
                  <td>
                    <div class="activity-cell">
                      <span class="activity-name">
                        {{ session.type === "teaching" ? "KBM Normal" : session.activityName || "Non-KBM" }}
                      </span>
                      <span v-if="session.meetingNumber" class="meeting-tag">Ke-{{ session.meetingNumber }}</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <span
                      class="badge"
                      :class="session.advancesRpp ? 'badge-success' : 'badge-warning'"
                    >
                      {{ session.advancesRpp ? "Maju" : "Tetap" }}
                    </span>
                  </td>
                  <td>
                    <div v-if="isWorkflowRow(session)" class="status-chips">
                      <span
                        class="badge"
                        :class="workflowOf(session).attFilled ? 'badge-success' : 'badge-warning'"
                      >
                        {{ attChipLabel(session) }}
                      </span>
                      <span
                        class="badge"
                        :class="workflowOf(session).journalFilled ? 'badge-success' : 'badge-warning'"
                      >
                        {{ journalChipLabel(session) }}
                      </span>
                    </div>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td class="text-right">
                    <div v-if="isWorkflowRow(session)" class="action-group">
                      <button
                        type="button"
                        class="btn-action-primary btn btn-primary btn-sm"
                        :class="{ 'btn-action-done': workflowOf(session).attFilled }"
                        @click="goAttendance(session.id)"
                        :title="workflowOf(session).attFilled ? 'Presensi santri sudah terisi, klik untuk edit' : 'Isi presensi santri'"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        {{ workflowOf(session).attFilled ? 'Absensi' : 'Isi Absen' }}
                      </button>
                      <button
                        type="button"
                        class="btn-action-secondary btn btn-secondary btn-sm"
                        :class="{ 'btn-action-done': workflowOf(session).journalFilled }"
                        @click="goJournal(session.id)"
                        :title="workflowOf(session).journalFilled ? 'Jurnal sudah terisi, klik untuk edit' : 'Isi jurnal mengajar'"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        {{ workflowOf(session).journalFilled ? 'Jurnal' : 'Isi Jurnal' }}
                      </button>
                    </div>
                    <span v-else class="text-muted">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Session Card List (Screen < 768px) -->
          <div class="mobile-session-list">
            <div v-if="filteredHistory.length === 0" class="empty-mobile-state">
              Belum ada sesi KBM tercatat
            </div>
            <div
              v-for="session in filteredHistory"
              :key="'m-' + session.id"
              class="mobile-session-card"
            >
              <div class="mobile-card-header">
                <div class="mobile-date-slot">
                  <span class="mobile-date">{{ formatDate(session.date) }}</span>
                  <span class="mobile-slot-badge">
                    {{ getSessionName(session.sessionSlotId) }}
                    <span v-if="getSessionTime(session.sessionSlotId)">({{ getSessionTime(session.sessionSlotId) }})</span>
                  </span>
                </div>
                <span
                  class="badge"
                  :class="session.advancesRpp ? 'badge-success' : 'badge-warning'"
                >
                  {{ session.advancesRpp ? "RPP Maju" : "RPP Tetap" }}
                </span>
              </div>

              <div class="mobile-card-body">
                <div class="mobile-meta-row">
                  <span class="mobile-meta-label">Jilid / Marhalah:</span>
                  <span class="mobile-meta-value font-semibold">{{ getLevelName(session) }}</span>
                </div>
                <div class="mobile-meta-row">
                  <span class="mobile-meta-label">Aktivitas:</span>
                  <span class="mobile-meta-value">
                    {{ session.type === "teaching" ? "KBM Normal" : session.activityName || "Non-KBM" }}
                    <span v-if="session.meetingNumber" class="text-muted"> (Ke-{{ session.meetingNumber }})</span>
                  </span>
                </div>
                <div v-if="isWorkflowRow(session)" class="mobile-chips-wrapper">
                  <span
                    class="badge"
                    :class="workflowOf(session).attFilled ? 'badge-success' : 'badge-warning'"
                  >
                    {{ attChipLabel(session) }}
                  </span>
                  <span
                    class="badge"
                    :class="workflowOf(session).journalFilled ? 'badge-success' : 'badge-warning'"
                  >
                    {{ journalChipLabel(session) }}
                  </span>
                </div>
              </div>

              <div v-if="isWorkflowRow(session)" class="mobile-card-actions">
                <button
                  type="button"
                  class="btn-action-primary"
                  :class="{ 'btn-action-done': workflowOf(session).attFilled }"
                  @click="goAttendance(session.id)"
                >
                  {{ workflowOf(session).attFilled ? '✓ Absensi Santri' : 'Isi Absensi Santri' }}
                </button>
                <button
                  type="button"
                  class="btn-action-secondary"
                  :class="{ 'btn-action-done': workflowOf(session).journalFilled }"
                  @click="goJournal(session.id)"
                >
                  {{ workflowOf(session).journalFilled ? '✓ Jurnal' : 'Isi Jurnal' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";
import { useRoute, useRouter } from "vue-router";
import { resolveKbmDateFromQuery } from "@/utils/lpjState";
import { useAuthStore } from "@/stores/auth";
import { summarizeSessionWorkflow } from "@/utils/journalState";
const router = useRouter();
const route = useRoute();

const authStore = useAuthStore();

const today = new Date();
const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const minDateString = ref(
  `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`,
);

const loadingInitial = ref(true);
const submitting = ref(false);
const classes = ref([]);
const sessionSlots = ref([]);
const teachers = ref([]);
const history = ref([]);
const myAttendances = ref([]);
const operationalCalendar = ref(null);
const tpqProfile = ref(null);

const contextualDate = resolveKbmDateFromQuery(route.query.date);

const viewedPeriod = () => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(form.value.date || "");
  if (m) return { month: Number(m[2]), year: Number(m[1]) };
  return { month: today.getMonth() + 1, year: today.getFullYear() };
};

const form = ref({
  date: contextualDate || todayString,
  classId: "",
  sessionSlotId: "",
  isSubstitute: false,
  substituteFor: "",
});

const isEligible = ref(false);
const eligibilityMessage = ref("");

const jilidList = computed(() =>
  classes.value.filter((c) => String(c.id) >= "1" && String(c.id) <= "6"),
);
const marhalahList = computed(() =>
  classes.value.filter((c) => !["1", "2", "3", "4", "5", "6"].includes(String(c.id))),
);

const fetchInitialData = async () => {
  try {
    const [classesRes, slotsRes, calendarRes, historyRes, attRes, profileRes] =
      await Promise.all([
        api.get("/classes"),
        api.get("/teaching_sessions/slots"),
        api.get("/settings/operational-calendar"),
        api.get("/teaching_sessions", {
          params: viewedPeriod(),
        }),
        api.get("/attendance/me", {
          params: viewedPeriod(),
        }),
        api.get("/settings/tpq-profile"),
      ]);

    classes.value = classesRes.data;
    sessionSlots.value = slotsRes.data;
    operationalCalendar.value = calendarRes.data;
    history.value = historyRes.data;
    myAttendances.value = attRes.data;
    tpqProfile.value = profileRes.data;

    if (tpqProfile.value?.activeOperationalPeriod) {
      minDateString.value = `${tpqProfile.value.activeOperationalPeriod}-01`;
    }

    try {
      const teachersRes = await api.get("/users/teachers/public");
      teachers.value = teachersRes.data.filter(
        (t) => t.id !== authStore.user?.id,
      );
    } catch (e) {
      // Ignored if unauthorized
    }
  } catch (error) {
    console.error("Failed to load initial data", error);
  } finally {
    loadingInitial.value = false;
    validateEligibility();
  }
};

const validateEligibility = () => {
  isEligible.value = false;
  eligibilityMessage.value = "";

  if (!form.value.date || !form.value.sessionSlotId) return;

  const selectedDate = new Date(form.value.date);

  // Check active operational period
  if (tpqProfile.value?.activeOperationalPeriod) {
    const sessionPeriod = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`;
    if (sessionPeriod !== tpqProfile.value.activeOperationalPeriod) {
      eligibilityMessage.value = `Tanggal berada di luar periode operasional aktif (${tpqProfile.value.activeOperationalPeriod}).`;
      return;
    }
  }

  // Check active weekdays
  if (operationalCalendar.value && operationalCalendar.value.activeWeekdays) {
    const day = selectedDate.getDay();
    if (!operationalCalendar.value.activeWeekdays.includes(day)) {
      eligibilityMessage.value =
        "Tanggal yang dipilih bukan hari operasional (Akhir pekan).";
      return;
    }
  }

  // Check if session already exists
  const existing = history.value.find((s) => {
    const sDate = new Date(s.date._seconds ? s.date._seconds * 1000 : s.date);
    const sDateStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, "0")}-${String(sDate.getDate()).padStart(2, "0")}`;
    return (
      sDateStr === form.value.date &&
      s.sessionSlotId === form.value.sessionSlotId
    );
  });

  if (existing) {
    eligibilityMessage.value =
      "Anda sudah memiliki sesi mengajar pada gelombang ini di tanggal tersebut.";
    return;
  }

  // Check attendance
  const attendance = myAttendances.value.find((a) => {
    const aDate = new Date(a.date._seconds ? a.date._seconds * 1000 : a.date);
    const aDateStr = `${aDate.getFullYear()}-${String(aDate.getMonth() + 1).padStart(2, "0")}-${String(aDate.getDate()).padStart(2, "0")}`;
    return aDateStr === form.value.date;
  });

  if (!attendance) {
    eligibilityMessage.value =
      "Anda belum mengisi absen kehadiran (Absensi Online) pada tanggal ini.";
    return;
  }
  if (attendance.status !== "hadir") {
    eligibilityMessage.value =
      'Status kehadiran Anda bukan "Hadir" pada tanggal ini.';
    return;
  }

  isEligible.value = true;
  eligibilityMessage.value = "Data valid. Sesi dapat disimpan.";
};

const submitSession = async () => {
  if (!isEligible.value) return;
  submitting.value = true;
  try {
    const payload = {
      date: form.value.date,
      type: "teaching",
      classId: form.value.classId,
      sessionSlotId: form.value.sessionSlotId,
      substituteFor: form.value.isSubstitute ? form.value.substituteFor : null,
      journal: { material: "KBM (Menunggu Update Jurnal)" },
      studentAttendances: [],
    };

    await api.post("/teaching_sessions", payload);

    // Refresh history
    const historyRes = await api.get("/teaching_sessions", {
      params: viewedPeriod(),
    });
    history.value = historyRes.data;

    // Reset form
    form.value.classId = "";
    form.value.isSubstitute = false;
    form.value.substituteFor = "";

    validateEligibility();
  } catch (error) {
    alert(error.response?.data?.error || "Gagal menyimpan sesi mengajar");
  } finally {
    submitting.value = false;
  }
};

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val._seconds ? val._seconds * 1000 : val);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getSessionName = (id) => {
  const slot = sessionSlots.value.find((s) => s.id === id);
  return slot ? slot.name : id;
};

const getLevelName = (session) => {
  if (!session) return "-";
  const levelId = session.levelId || session.classId;
  const found = classes.value.find((c) => String(c.id) === String(levelId));
  if (found) return found.name;
  return session.className || "-";
};

const goAttendance = (sessionId) => {
  router.push("/dashboard/kbm/" + sessionId + "/absensi");
};

const isWorkflowRow = (session) =>
  session.type === "teaching" || session.type === "special_non_kbm";

const workflowOf = (session) => summarizeSessionWorkflow(session);

const attChipLabel = (session) => {
  const w = summarizeSessionWorkflow(session);
  if (!w.attFilled) return "\u26A0 Absensi Belum diisi";
  return `\u2713 Absensi ${w.attHadir}/${w.attTotal} hadir`;
};

const journalChipLabel = (session) =>
  summarizeSessionWorkflow(session).journalFilled
    ? "\u2713 Jurnal Tersimpan"
    : "\u26A0 Jurnal Belum diisi";

const goJournal = (sessionId) => {
  router.push("/dashboard/kbm/" + sessionId + "/jurnal");
};

const getSessionTime = (id) => {
  const slot = sessionSlots.value.find((s) => s.id === id);
  return slot && slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : "";
};

const historyFilter = ref("all");

const filteredHistory = computed(() => {
  if (historyFilter.value === "all") return history.value;
  return history.value.filter((s) => {
    const levelId = String(s.levelId || s.classId || "");
    return levelId === historyFilter.value;
  });
});

const totalSessions = computed(() => history.value.length);

const todaySessions = computed(() => {
  return history.value.filter((s) => {
    if (!s.date) return false;
    const sDate = new Date(s.date._seconds ? s.date._seconds * 1000 : s.date);
    const sDateStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, "0")}-${String(sDate.getDate()).padStart(2, "0")}`;
    return sDateStr === todayString;
  }).length;
});

onMounted(() => {
  fetchInitialData();
});
</script>

<style scoped>
.kbm-view {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .kbm-view {
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

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-lg, 1.25rem);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 360px minmax(0, 1fr);
    align-items: start;
    gap: var(--space-xl, 1.5rem);
  }
}

@media (min-width: 1280px) {
  .content-grid {
    grid-template-columns: 380px minmax(0, 1fr);
  }
}

/* Quick Metrics Summary */
.kbm-metrics-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-md, 1rem);
  margin-bottom: var(--space-xl, 1.5rem);
}

@media (min-width: 640px) {
  .kbm-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.kbm-metric-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px !important;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kbm-metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  flex-shrink: 0;
}

.metric-icon.total {
  background: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.metric-icon.today {
  background: rgba(33, 150, 243, 0.12);
  color: #1976d2;
}

.metric-icon.complete {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.metric-icon.pending {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
}

.metric-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.metric-label {
  font-size: 0.8rem;
  color: var(--gray-500, #64748b);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.metric-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--gray-800, #1e293b);
  line-height: 1.2;
}

.metric-unit {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray-500, #64748b);
}

.text-warning-bold {
  color: #d97706 !important;
}

.text-success-bold {
  color: #059669 !important;
}

/* Glass Card Common */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-xl, 16px);
  padding: var(--space-lg, 1.25rem);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .glass-card {
    padding: var(--space-xl, 1.5rem);
  }
}

.card-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: var(--space-lg, 1.25rem);
  padding-bottom: var(--space-md, 0.75rem);
  border-bottom: 1px solid var(--gray-200, #e2e8f0);
}

.card-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(46, 125, 50, 0.1);
  color: var(--primary-dark, #2e7d32);
  flex-shrink: 0;
}

.card-header-row h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary-dark, #2e7d32);
  margin: 0;
  border: none;
  padding: 0;
}

.card-subtitle {
  font-size: 0.8rem;
  color: var(--gray-500, #64748b);
  margin: 2px 0 0 0;
}

.kbm-form {
  min-width: 0;
  max-width: 100%;
}

.kbm-history {
  min-width: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
}

.history-card-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: var(--space-lg, 1.25rem);
  padding-bottom: var(--space-md, 0.75rem);
  border-bottom: 1px solid var(--gray-200, #e2e8f0);
}

@media (min-width: 640px) {
  .history-card-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.history-card-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary-dark, #2e7d32);
  margin: 0;
  border: none;
  padding: 0;
}

.filter-select {
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 500;
  border: 1px solid var(--gray-300, #cbd5e1);
  border-radius: 8px;
  background: #ffffff;
  color: var(--gray-700, #334155);
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: var(--primary);
}

.form-group {
  margin-bottom: var(--space-md, 1rem);
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--gray-700, #334155);
  font-size: 0.88rem;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--gray-300, #cbd5e1);
  border-radius: var(--radius-md, 8px);
  font-size: 0.92rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  background-color: #ffffff;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary, #2e7d32);
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15);
}

.help-text {
  display: block;
  font-size: 0.76rem;
  color: var(--gray-500, #64748b);
  margin-top: 5px;
  line-height: 1.35;
}

.badal-group {
  padding: 10px 12px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid var(--gray-200, #e2e8f0);
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500 !important;
  color: var(--gray-700, #334155);
  cursor: pointer;
  font-size: 0.88rem;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-dark, #2e7d32);
  cursor: pointer;
}

.submit-kbm-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #cbd5e1;
  color: #64748b;
  margin-top: var(--space-lg, 1.25rem);
}

.submit-kbm-btn.is-eligible {
  background: var(--primary-gradient, linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%));
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(46, 125, 50, 0.25);
}

.submit-kbm-btn.is-eligible:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(46, 125, 50, 0.35);
}

.submit-kbm-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  margin-top: var(--space-md, 1rem);
  font-size: 0.84rem;
  font-weight: 500;
  line-height: 1.4;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.alert-success {
  background: rgba(46, 125, 50, 0.08);
  color: #1b5e20;
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.alert-error {
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Data Table & Table Responsive */
.table-responsive {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--gray-200, #e2e8f0);
}

.table-responsive::-webkit-scrollbar {
  height: 6px;
}

.table-responsive::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 4px;
}

.table-responsive::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.table-responsive::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 560px;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--gray-200, #e2e8f0);
  font-size: 0.84rem;
  vertical-align: middle;
}

.data-table th {
  font-weight: 600;
  color: var(--gray-700, #334155);
  background: var(--gray-50, #f8fafc);
  white-space: nowrap;
}

.data-table tbody tr:hover {
  background-color: rgba(46, 125, 50, 0.03);
}

.cell-nowrap {
  white-space: nowrap;
}

.date-slot-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cell-date {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--gray-800, #1e293b);
}

.cell-slot-badge {
  font-size: 0.74rem;
  color: var(--gray-500, #64748b);
  font-weight: 500;
}

.slot-time {
  color: var(--gray-400, #94a3b8);
}

.level-badge {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(46, 125, 50, 0.08);
  color: var(--primary-dark, #2e7d32);
  border-radius: 6px;
  font-size: 0.8rem;
}

.activity-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.meeting-tag {
  font-size: 0.72rem;
  padding: 1px 6px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 4px;
  font-weight: 600;
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}

.badge-success {
  background: rgba(46, 125, 50, 0.1);
  color: #2e7d32;
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.text-muted {
  color: var(--gray-400, #94a3b8);
}

.empty-cell {
  padding: 32px 16px !important;
  color: var(--gray-500, #64748b);
}

.empty-state-mini p {
  margin: 0;
  font-size: 0.88rem;
}

.status-chips {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: flex-start;
}

.action-group {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
}

.btn-action-primary,
.btn-action-secondary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  font-size: 0.76rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-action-primary {
  background: #2e7d32;
  color: #ffffff;
  border: none;
}

.btn-action-primary:hover {
  background: #1b5e20;
}

.btn-action-primary.btn-action-done {
  background: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
  border: 1px solid rgba(46, 125, 50, 0.3);
}

.btn-action-primary.btn-action-done:hover {
  background: rgba(46, 125, 50, 0.2);
}

.btn-action-secondary {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.btn-action-secondary:hover {
  background: #e2e8f0;
}

.btn-action-secondary.btn-action-done {
  background: rgba(33, 150, 243, 0.1);
  color: #1976d2;
  border: 1px solid rgba(33, 150, 243, 0.25);
}

.btn-action-secondary.btn-action-done:hover {
  background: rgba(33, 150, 243, 0.18);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 12px;
  color: var(--gray-600);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(46, 125, 50, 0.15);
  border-top-color: #2e7d32;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile Session Card List (< 768px) */
.mobile-session-list {
  display: none;
}

@media (max-width: 767px) {
  .desktop-table {
    display: none;
  }

  .mobile-session-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mobile-session-card {
    background: #ffffff;
    border: 1px solid var(--gray-200, #e2e8f0);
    border-radius: var(--radius-md, 10px);
    padding: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .mobile-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--gray-100, #f1f5f9);
  }

  .mobile-date-slot {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .mobile-date {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--gray-800, #1e293b);
  }

  .mobile-slot-badge {
    font-size: 0.78rem;
    color: var(--gray-600, #475569);
    font-weight: 500;
  }

  .mobile-card-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.85rem;
  }

  .mobile-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .mobile-meta-label {
    color: var(--gray-500, #64748b);
  }

  .mobile-meta-value {
    color: var(--gray-800, #1e293b);
  }

  .mobile-chips-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
    align-items: flex-start;
  }

  .mobile-card-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 4px;
    padding-top: 10px;
    border-top: 1px solid var(--gray-100, #f1f5f9);
  }

  .mobile-card-actions button {
    width: 100%;
    padding: 9px 10px;
    font-size: 0.8rem;
    border-radius: 6px;
    text-align: center;
    justify-content: center;
  }

  .empty-mobile-state {
    text-align: center;
    padding: 24px 12px;
    color: var(--gray-500, #64748b);
    font-size: 0.9rem;
    background: #f8fafc;
    border-radius: var(--radius-md, 8px);
    border: 1px dashed var(--gray-300, #cbd5e1);
  }
}
</style>
