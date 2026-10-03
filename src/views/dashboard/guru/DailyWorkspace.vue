<template>
  <div class="daily-workspace-view">
    <!-- Top Header -->
    <header class="workspace-header glass-card">
      <div class="header-left">
        <div class="header-title-row">
          <h1>DAILY WORKSPACE</h1>
          <span v-if="dailyContext?.teacherAttendance?.status === 'hadir'" class="badge badge-present">
            ✓ Guru Hadir
          </span>
          <span v-else-if="(dailyContext?.isBackfill || isBackfill) && dailyContext?.lpj?.eligible" class="badge badge-present">
            ✓ Hadir (Otomatis LPJ)
          </span>
          <span v-else-if="dailyContext?.teacherAttendance?.exists" class="badge badge-absent">
            {{ dailyContext.teacherAttendance.status }}
          </span>
        </div>
        <p class="header-subtitle">
          {{ formattedHeaderDate }} • {{ dailyContext?.lpj?.eligible ? `LPJ ${formattedPeriodName}` : `Periode ${formattedPeriodName}` }}
        </p>
      </div>

      <div class="header-right">
        <button v-if="isBackfill" type="button" class="btn btn-secondary btn-sm" @click="handleReturnToLpj">
          {{ dailyContext?.lpj?.eligible ? '← Kembali ke LPJ' : '← Kembali ke KBM' }}
        </button>
      </div>
    </header>

    <!-- History Backfill Banner -->
    <div v-if="isBackfill" class="history-banner glass-card">
      <div class="history-icon">📜</div>
      <div class="history-content">
        <span class="history-badge">RIWAYAT</span>
        <p>Anda sedang melengkapi data KBM untuk <strong>{{ formattedHeaderDate }}</strong> ({{ dailyContext?.lpj?.eligible ? `LPJ ${formattedPeriodName}` : `Periode ${formattedPeriodName}` }}).</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingContext" class="state-card glass-card text-center py-12">
      <div class="spinner mx-auto mb-4"></div>
      <p class="text-gray-600 font-medium">Memuat konteks KBM harian...</p>
    </div>

    <!-- Error / Blocking State -->
    <div v-else-if="blockingError" class="state-card glass-card text-center py-10">
      <div class="state-icon">{{ blockingError.icon || '⚠️' }}</div>
      <h2 class="state-title">{{ blockingError.title }}</h2>
      <p class="state-desc">{{ blockingError.message }}</p>
      <div class="state-actions mt-6">
        <router-link v-if="blockingError.actionLink" :to="blockingError.actionLink" class="btn btn-primary">
          {{ blockingError.actionLabel }}
        </router-link>
        <button v-else type="button" class="btn btn-secondary" @click="handleReturnToLpj">
          {{ dailyContext?.lpj?.eligible ? 'Kembali ke LPJ' : 'Kembali ke KBM' }}
        </button>
      </div>
    </div>

    <!-- Main Workspace Content -->
    <div v-else class="workspace-grid">
      <!-- Left Column: Session Slot & Level Selector -->
      <div class="workspace-main">
        <!-- Section 1: Session Slot -->
        <section class="workspace-section glass-card">
          <div class="section-header">
            <span class="step-num">1</span>
            <div>
              <h2>Pilih Sesi Pembelajaran</h2>
              <p>Pilih slot waktu KBM yang dijalankan</p>
            </div>
          </div>

          <div class="slots-grid">
            <button
              type="button"
              class="slot-btn"
              :class="{
                active: selectedSlotId === 'wave_1',
                disabled: isSlotSaved('wave_1')
              }"
              @click="selectSlot('wave_1')"
            >
              <div class="slot-header">
                <span class="slot-name">SORE</span>
                <span class="slot-time">15.00 – 16.30</span>
              </div>
              <span class="slot-wave">Gelombang 1</span>
              <div v-if="getSavedSession('wave_1')" class="slot-status-saved">
                ✓ {{ getSavedSessionSummary('wave_1') }} — Tersimpan
              </div>
            </button>

            <button
              type="button"
              class="slot-btn"
              :class="{
                active: selectedSlotId === 'wave_2',
                disabled: isSlotSaved('wave_2')
              }"
              @click="selectSlot('wave_2')"
            >
              <div class="slot-header">
                <span class="slot-name">MALAM</span>
                <span class="slot-time">18.00 – 19.30</span>
              </div>
              <span class="slot-wave">Gelombang 2</span>
              <div v-if="getSavedSession('wave_2')" class="slot-status-saved">
                ✓ {{ getSavedSessionSummary('wave_2') }} — Tersimpan
              </div>
            </button>
          </div>
        </section>

        <!-- Section 2: Jilid / Marhalah Selector -->
        <section class="workspace-section glass-card">
          <div class="section-header">
            <span class="step-num">2</span>
            <div>
              <h2>Pilih Jilid / Marhalah</h2>
              <p>Pilih tingkat materi yang diajarkan</p>
            </div>
          </div>

          <!-- Jilid List -->
          <div class="level-group-title">Jilid</div>
          <div class="levels-grid">
            <button
              v-for="item in jilidLevels"
              :key="item.levelId"
              type="button"
              class="level-card"
              :class="{
                active: selectedLevelId === item.levelId,
                recommended: dailyContext?.suggestedLevelId === item.levelId
              }"
              @click="selectLevel(item.levelId)"
            >
              <span class="level-name">{{ item.levelName }}</span>
              <span v-if="dailyContext?.suggestedLevelId === item.levelId" class="badge-rec">
                Rekomendasi
              </span>
            </button>
          </div>

          <!-- Marhalah List -->
          <div class="level-group-title mt-4">Marhalah</div>
          <div class="levels-grid">
            <button
              v-for="item in marhalahLevels"
              :key="item.levelId"
              type="button"
              class="level-card"
              :class="{
                active: selectedLevelId === item.levelId,
                recommended: dailyContext?.suggestedLevelId === item.levelId
              }"
              @click="selectLevel(item.levelId)"
            >
              <span class="level-name">{{ item.levelName }}</span>
              <span v-if="dailyContext?.suggestedLevelId === item.levelId" class="badge-rec">
                Rekomendasi
              </span>
            </button>
          </div>
        </section>

        <!-- Section 3: Roster & Student Attendance -->
        <section v-if="selectedLevelId" class="workspace-section glass-card">
          <div class="section-header">
            <span class="step-num">3</span>
            <div class="flex-1">
              <div class="flex-between">
                <h2>Absensi Santri — {{ currentLevelName }}</h2>
                <span class="roster-count-badge">{{ roster.length }} Santri</span>
              </div>
              <p>Default seluruh santri hadir. Ubah hanya bila ada santri yang berhalangan.</p>
            </div>
          </div>

          <!-- Quick Actions & Stats -->
          <div class="roster-toolbar">
            <button type="button" class="btn btn-outline-success btn-sm" @click="markAllPresent">
              ✓ Semua Hadir
            </button>

            <div class="roster-stats-chips">
              <span class="chip chip-hadir">{{ stats.hadir }} Hadir</span>
              <span class="chip chip-sakit">{{ stats.sakit }} Sakit</span>
              <span class="chip chip-izin">{{ stats.izin }} Izin</span>
              <span class="chip chip-alpa">{{ stats.alpa }} Alpa</span>
            </div>
          </div>

          <!-- Santri Search -->
          <div v-if="roster.length > 6" class="roster-search-box">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama santri..."
              class="form-input search-input"
            />
          </div>

          <!-- Roster List -->
          <div v-if="loadingLevelContext" class="py-6 text-center">
            <div class="spinner mx-auto mb-2"></div>
            <p class="text-gray-500 text-sm">Memuat roster santri...</p>
          </div>

          <div v-else-if="filteredRoster.length === 0" class="py-6 text-center text-gray-500">
            <p v-if="searchQuery">Tidak ada santri dengan nama "{{ searchQuery }}"</p>
            <p v-else>Roster santri belum tersedia untuk Jilid ini. Hubungi Admin.</p>
          </div>

          <div v-else class="roster-list">
            <div
              v-for="santri in filteredRoster"
              :key="santri.santriId"
              class="santri-item"
              :class="`status-${santri.status}`"
            >
              <div class="santri-name-col">
                <span class="santri-avatar">{{ santri.name.charAt(0).toUpperCase() }}</span>
                <span class="santri-name">{{ santri.name }}</span>
                <button
                  type="button"
                  class="btn-rename-santri"
                  @click.stop="openRenameModal(santri)"
                  title="Ubah Nama Santri"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>

              <div class="status-pills">
                <button
                  type="button"
                  class="pill-btn pill-hadir"
                  :class="{ active: santri.status === 'hadir' }"
                  @click="setSantriStatus(santri.santriId, 'hadir')"
                >
                  Hadir
                </button>
                <button
                  type="button"
                  class="pill-btn pill-sakit"
                  :class="{ active: santri.status === 'sakit' }"
                  @click="setSantriStatus(santri.santriId, 'sakit')"
                >
                  Sakit
                </button>
                <button
                  type="button"
                  class="pill-btn pill-izin"
                  :class="{ active: santri.status === 'izin' }"
                  @click="setSantriStatus(santri.santriId, 'izin')"
                >
                  Izin
                </button>
                <button
                  type="button"
                  class="pill-btn pill-alpa"
                  :class="{ active: santri.status === 'alpa' }"
                  @click="setSantriStatus(santri.santriId, 'alpa')"
                >
                  Alpa
                </button>
              </div>
            </div>
          </div>

          <!-- Inactive / Graduated Santri Info List -->
          <div v-if="inactiveSantri.length > 0" class="inactive-santri-section">
            <div class="inactive-header">
              <div class="inactive-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div>
                <h3 class="inactive-title">Santri Nonaktif / Lulus ({{ inactiveSantri.length }})</h3>
                <p class="inactive-desc">
                  Santri dengan status Lulus atau Nonaktif otomatis dikecualikan dari absensi harian
                </p>
              </div>
            </div>

            <div class="inactive-list">
              <div
                v-for="st in inactiveSantri"
                :key="st.id || st.santriId"
                class="inactive-item"
              >
                <div class="inactive-item-main">
                  <span class="inactive-avatar">{{ (st.name || '?').charAt(0).toUpperCase() }}</span>
                  <span class="inactive-name">{{ st.name }}</span>
                </div>
                <span
                  class="badge-status-santri"
                  :class="'badge-santri-' + (st.status || 'nonaktif').toLowerCase()"
                >
                  {{ (st.status || '').toLowerCase() === 'lulus' ? 'Lulus' : 'Nonaktif' }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 4: Journal & Curriculum -->
        <section v-if="selectedLevelId" class="workspace-section glass-card">
          <div class="section-header">
            <span class="step-num">4</span>
            <div class="flex-1">
              <div class="flex-between">
                <h2>Jurnal Pembelajaran</h2>
                <span v-if="curriculum?.advancesRpp" class="badge badge-rpp">
                  Melanjutkan RPP • Pertemuan ke-{{ curriculum.meetingNumber }}
                </span>
                <span v-else class="badge badge-special">
                  Kegiatan Khusus
                </span>
              </div>
              <p>Materi inti telah diisi otomatis dari kurikulum TPQ</p>
            </div>
          </div>

          <div class="journal-fields">
            <div class="form-group">
              <label class="form-label">
                Materi Inti / Pokok <span class="required">*</span>
              </label>
              <input
                v-model="journalForm.material"
                type="text"
                class="form-input"
                placeholder="Materi inti pembelajaran"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                Materi Penunjang / Deskripsi
              </label>
              <textarea
                v-model="journalForm.supportingMaterial"
                rows="2"
                class="form-textarea"
                placeholder="Penjelasan ringkas materi pendukung..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">
                Catatan Pembelajaran (Opsional)
              </label>
              <textarea
                v-model="journalForm.notes"
                rows="2"
                class="form-textarea"
                placeholder="Catatan tambahan santri atau evaluasi sesi..."
              ></textarea>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column: Verification & Submit Panel -->
      <aside class="workspace-sidebar">
        <div class="summary-panel glass-card">
          <h3>Ringkasan KBM</h3>
          <p class="summary-subtitle">Periksa sebelum menyimpan</p>

          <ul class="summary-checklist">
            <li class="check-item" :class="{ ok: ((dailyContext?.isBackfill || isBackfill) && dailyContext?.lpj?.eligible) || dailyContext?.teacherAttendance?.status === 'hadir' }">
              <span class="check-icon">{{ (((dailyContext?.isBackfill || isBackfill) && dailyContext?.lpj?.eligible) || dailyContext?.teacherAttendance?.status === 'hadir') ? '✓' : '✗' }}</span>
              <span>Guru Hadir ({{ ((dailyContext?.isBackfill || isBackfill) && dailyContext?.lpj?.eligible) ? 'Otomatis untuk LPJ' : (dailyContext?.teacherAttendance?.status || 'Belum Absen') }})</span>
            </li>
            <li class="check-item" :class="{ ok: selectedSlotId }">
              <span class="check-icon">{{ selectedSlotId ? '✓' : '○' }}</span>
              <span>Sesi: {{ selectedSlotId === 'wave_2' ? 'Malam' : 'Sore' }}</span>
            </li>
            <li class="check-item" :class="{ ok: selectedLevelId }">
              <span class="check-icon">{{ selectedLevelId ? '✓' : '○' }}</span>
              <span>Jilid: {{ currentLevelName || 'Belum Dipilih' }}</span>
            </li>
            <li class="check-item" :class="{ ok: roster.length > 0 }">
              <span class="check-icon">{{ roster.length > 0 ? '✓' : '○' }}</span>
              <span>Santri: {{ stats.hadir }} Hadir (Total {{ roster.length }})</span>
            </li>
            <li class="check-item" :class="{ ok: !!journalForm.material.trim() }">
              <span class="check-icon">{{ journalForm.material.trim() ? '✓' : '○' }}</span>
              <span>Jurnal: {{ journalForm.material.trim() ? 'Siap' : 'Belum Lengkap' }}</span>
            </li>
          </ul>

          <div class="submit-action-box">
            <button
              type="button"
              class="btn btn-primary btn-lg w-full btn-save-kbm"
              :disabled="!canSubmit || submitting"
              @click="submitKbm"
            >
              <span v-if="submitting">Menyimpan KBM...</span>
              <span v-else>SIMPAN KBM</span>
            </button>
            <p v-if="!canSubmit && selectedLevelId" class="text-center text-xs text-gray-500 mt-2">
              Lengkapi materi jurnal untuk menyimpan.
            </p>
          </div>
        </div>
      </aside>
    </div>

    <!-- Success Modal -->
      <div v-if="showSuccessModal" class="modal-backdrop">
        <div class="modal-card glass-card text-center">
          <div class="success-icon-wrap">✓</div>
          <h2>KBM Berhasil Disimpan!</h2>
          <p class="modal-desc">
            Sesi mengajar <strong>{{ currentLevelName }} ({{ selectedSlotId === 'wave_2' ? 'Malam' : 'Sore' }})</strong> telah tercatat beserta absensi santri dan jurnal.
          </p>
  
          <div class="modal-summary-box">
            <div>✓ Sesi Mengajar Tersimpan</div>
            <div>✓ Absensi {{ roster.length }} Santri</div>
            <div>✓ Jurnal Pembelajaran Terarsip</div>
          </div>
  
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary w-full" @click="handleAddNewSession">
              + Tambah Sesi Lainnya
            </button>
            <button type="button" class="btn btn-primary w-full mt-2" @click="handleReturnToLpj">
              {{ dailyContext?.lpj?.eligible ? (isBackfill ? 'Kembali ke LPJ Riwayat' : 'Kembali ke LPJ') : 'Kembali ke KBM' }}
            </button>
          </div>
        </div>
      </div>

    <!-- Modal Ubah Nama Santri (Teleport to body for viewport centering) -->
    <Teleport to="body">
      <div v-if="renamingSantri" class="modal-overlay" @click.self="closeRenameModal">
        <div class="modal glass-card rename-modal-card">
          <div class="rename-modal-header">
            <div class="rename-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h3 class="modal-title">Ubah Nama Santri</h3>
              <p class="modal-subtitle">{{ currentLevelName }}</p>
            </div>
          </div>

          <form @submit.prevent="submitRename" class="rename-modal-body">
            <div class="form-group mb-4">
              <label class="form-label font-semibold">Nama Lengkap Santri:</label>
              <input
                ref="renameInputRef"
                v-model="renameFormName"
                type="text"
                class="form-input rename-input"
                placeholder="Contoh: Muhammad Rizky Pratama"
                required
                :disabled="renamingLoading"
              />
              <small class="help-text">
                Ubah nama panggilan menjadi nama lengkap santri untuk keperluan administrasi dan laporan.
              </small>
            </div>

            <div v-if="renameError" class="alert alert-error mb-3">
              {{ renameError }}
            </div>

            <div class="modal-action-buttons">
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="renamingLoading"
                @click="closeRenameModal"
              >
                Batal
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="renamingLoading || !renameFormName.trim()"
              >
                {{ renamingLoading ? "Menyimpan..." : "Simpan Nama" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';

const route = useRoute();
const router = useRouter();
const { success, error: showError, warning } = useToast();

// Query Parameters
const targetDate = route.query.date || getTodayWibString();
const isBackfill = route.query.isBackfill === 'true' || false;
const reportId = route.query.reportId || null;

// State
const loadingContext = ref(true);
const loadingLevelContext = ref(false);
const submitting = ref(false);
const showSuccessModal = ref(false);

const dailyContext = ref(null);
const blockingError = ref(null);

const selectedSlotId = ref('wave_1');
const selectedLevelId = ref('');
const roster = ref([]);
const inactiveSantri = ref([]);
const curriculum = ref(null);
const searchQuery = ref('');

const journalForm = ref({
  material: '',
  supportingMaterial: '',
  notes: ''
});

// Rename Santri State & Handlers
const renamingSantri = ref(null);
const renameFormName = ref('');
const renamingLoading = ref(false);
const renameError = ref('');
const renameInputRef = ref(null);

function openRenameModal(santri) {
  renamingSantri.value = santri;
  renameFormName.value = santri.name;
  renameError.value = '';
  setTimeout(() => {
    renameInputRef.value?.focus();
    renameInputRef.value?.select();
  }, 100);
}

function closeRenameModal() {
  if (renamingLoading.value) return;
  renamingSantri.value = null;
  renameFormName.value = '';
  renameError.value = '';
}

async function submitRename() {
  if (!renamingSantri.value || !renameFormName.value.trim() || renamingLoading.value) return;
  renamingLoading.value = true;
  renameError.value = '';
  try {
    const santriId = renamingSantri.value.santriId || renamingSantri.value.id;
    const res = await api.patch(`/santri/${santriId}/name`, {
      name: renameFormName.value.trim()
    });
    const updatedName = res.data?.name || res.data?.santri?.name || renameFormName.value.trim();
    renamingSantri.value.name = updatedName;
    success(`✅ Nama santri berhasil diubah menjadi "${updatedName}"!`);
    closeRenameModal();
  } catch (err) {
    renameError.value = err.response?.data?.error || 'Gagal mengubah nama santri.';
  } finally {
    renamingLoading.value = false;
  }
}

// Helper for local WIB date string
function getTodayWibString() {
  const d = new Date();
  const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wibDate = new Date(utcMs + (7 * 60 * 60000));
  return `${wibDate.getFullYear()}-${String(wibDate.getMonth() + 1).padStart(2, '0')}-${String(wibDate.getDate()).padStart(2, '0')}`;
}

// Formatted Strings
const formattedHeaderDate = computed(() => {
  if (!targetDate) return '';
  const [y, m, d] = targetDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
});

const formattedPeriodName = computed(() => {
  if (!dailyContext.value?.period) return '';
  const [y, m] = dailyContext.value.period.split('-').map(Number);
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${monthNames[m - 1]} ${y}`;
});

// Level Catalog Filter
const jilidLevels = computed(() => {
  const list = dailyContext.value?.availableLevelContexts || [];
  return list.filter(item => {
    const num = Number(item.levelId);
    return num >= 1 && num <= 6;
  });
});

const marhalahLevels = computed(() => {
  const list = dailyContext.value?.availableLevelContexts || [];
  return list.filter(item => {
    const num = Number(item.levelId);
    return num >= 7 && num <= 9;
  });
});

const currentLevelName = computed(() => {
  const all = dailyContext.value?.availableLevelContexts || [];
  const found = all.find(c => String(c.levelId) === String(selectedLevelId.value));
  return found?.levelName || '';
});

// Filtered Roster by Search
const filteredRoster = computed(() => {
  if (!searchQuery.value.trim()) return roster.value;
  const q = searchQuery.value.toLowerCase();
  return roster.value.filter(s => s.name.toLowerCase().includes(q));
});

// Roster Attendance Counts
const stats = computed(() => {
  const count = { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
  for (const s of roster.value) {
    if (count[s.status] !== undefined) {
      count[s.status]++;
    } else {
      count.hadir++;
    }
  }
  return count;
});

// Submission Validation
const canSubmit = computed(() => {
  const isLpjBackfill = (dailyContext.value?.isBackfill || isBackfill) && dailyContext.value?.lpj?.eligible;
  const teacherOk = isLpjBackfill || dailyContext.value?.teacherAttendance?.status === 'hadir';
  return (
    teacherOk &&
    !!selectedSlotId.value &&
    !!selectedLevelId.value &&
    roster.value.length > 0 &&
    !!journalForm.value.material.trim()
  );
});

// Check if a slot already has a saved session
function isSlotSaved(slotId) {
  const sessions = dailyContext.value?.existingSessions || [];
  return sessions.some(s => (s.sessionSlotId || 'wave_1') === slotId);
}

function getSavedSession(slotId) {
  const sessions = dailyContext.value?.existingSessions || [];
  return sessions.find(s => (s.sessionSlotId || 'wave_1') === slotId);
}

function getSavedSessionSummary(slotId) {
  const s = getSavedSession(slotId);
  if (!s) return '';
  return s.className || `Jilid ${s.classId || s.levelId}`;
}

// Select Slot
function selectSlot(slotId) {
  selectedSlotId.value = slotId;
}

// Select Level
async function selectLevel(levelId) {
  selectedLevelId.value = String(levelId);
  await loadLevelContext(levelId);
}

// Set all santri to present
function markAllPresent() {
  for (const s of roster.value) {
    s.status = 'hadir';
  }
}

// Set individual santri status
function setSantriStatus(santriId, status) {
  const santri = roster.value.find(s => s.santriId === santriId);
  if (santri) {
    santri.status = status;
  }
}

// Load Daily Context
async function loadDailyContext() {
  loadingContext.value = true;
  blockingError.value = null;

  try {
    const { data } = await api.get('/teaching_sessions/daily-context', {
      params: { date: targetDate }
    });
    dailyContext.value = data;

    // Check blocking conditions
    const isLpjBackfill = (data.isBackfill || isBackfill) && data.lpj?.eligible;
    if (!isLpjBackfill && (!data.teacherAttendance?.exists || data.teacherAttendance?.status !== 'hadir')) {
      blockingError.value = {
        icon: '⚠️',
        title: 'Absensi Guru Belum Hadir',
        message: 'Absensi guru untuk tanggal ini belum tercatat sebagai hadir. Silakan lakukan absensi terlebih dahulu.',
        actionLink: '/dashboard/attendance',
        actionLabel: 'Isi Absensi Guru'
      };
      return;
    }

    if (data.holiday?.isHoliday) {
      blockingError.value = {
        icon: '🎉',
        title: 'Hari Libur',
        message: `Hari ini libur: ${data.holiday.name}. Tidak ada KBM yang perlu diisi.`
      };
      return;
    }

    if (data.lpj?.locked) {
      blockingError.value = {
        icon: '🔒',
        title: 'LPJ Terkunci',
        message: 'LPJ bulan ini sudah dikunci Admin. KBM tidak dapat diubah atau ditambahkan.'
      };
      return;
    }

    if (data.isBackfill && !data.lpj?.eligible) {
      blockingError.value = {
        icon: 'ℹ️',
        title: 'Backfill Khusus Guru LPJ',
        message: 'Pengisian KBM tanggal lampau (backfill) khusus diperuntukkan bagi guru yang menyusun dokumen LPJ. Untuk KBM reguler, silakan isi pada hari mengajar berjalan.',
        actionLink: '/dashboard/kbm',
        actionLabel: 'Kembali ke KBM'
      };
      return;
    }

    // Set suggested level if present
    if (data.suggestedLevelId) {
      selectLevel(data.suggestedLevelId);
    }
  } catch (err) {
    console.error('Failed to load daily context:', err);
    blockingError.value = {
      icon: '❌',
      title: 'Gagal Memuat Konteks KBM',
      message: err.response?.data?.error || 'Terjadi kesalahan sistem saat memuat data.'
    };
  } finally {
    loadingContext.value = false;
  }
}

// Load Level Context (Roster & RPP)
async function loadLevelContext(levelId) {
  loadingLevelContext.value = true;
  try {
    const { data } = await api.get('/teaching_sessions/level-context', {
      params: { date: targetDate, levelId }
    });

    roster.value = (data.roster || []).map(s => ({
      santriId: s.santriId,
      name: s.name,
      status: s.status || 'hadir'
    }));

    inactiveSantri.value = data.inactiveSantri || [];

    curriculum.value = data.curriculum || null;

    if (data.curriculum) {
      journalForm.value.material = data.curriculum.material || '';
      journalForm.value.supportingMaterial = data.curriculum.supportingMaterial || '';
    } else {
      journalForm.value.material = '';
      journalForm.value.supportingMaterial = '';
    }
  } catch (err) {
    console.error('Failed to load level context:', err);
    showError(err.response?.data?.error || 'Gagal memuat roster santri');
  } finally {
    loadingLevelContext.value = false;
  }
}

// Submit KBM Sesi
async function submitKbm() {
  if (!canSubmit.value) {
    warning('Pastikan sesi, level, absensi santri, dan jurnal telah terisi.');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      date: targetDate,
      type: 'teaching',
      classId: selectedLevelId.value,
      levelId: selectedLevelId.value,
      sessionSlotId: selectedSlotId.value,
      journal: {
        material: journalForm.value.material.trim(),
        notes: journalForm.value.notes.trim()
      },
      studentAttendances: roster.value.map(s => ({
        santriId: s.santriId,
        name: s.name,
        status: s.status
      }))
    };

    await api.post('/teaching_sessions', payload);
    success('KBM berhasil disimpan.');
    showSuccessModal.value = true;
  } catch (err) {
    console.error('Failed to submit KBM:', err);
    const msg = err.response?.data?.error;
    if (msg?.includes('already exists') || msg?.includes('duplikat')) {
      showError('KBM untuk sesi dan Jilid ini sudah tersimpan.');
    } else {
      showError(msg || 'Gagal menyimpan KBM');
    }
  } finally {
    submitting.value = false;
  }
}

// Multi-session: Add another session
async function handleAddNewSession() {
  showSuccessModal.value = false;
  selectedLevelId.value = '';
  roster.value = [];
  journalForm.value.material = '';
  journalForm.value.supportingMaterial = '';
  journalForm.value.notes = '';
  await loadDailyContext();
}

// Return to LPJ
function handleReturnToLpj() {
  showSuccessModal.value = false;
  if (!dailyContext.value?.lpj?.eligible) {
    router.push('/dashboard/kbm');
    return;
  }
  if (reportId) {
    router.push(`/dashboard/lpj/${reportId}`);
  } else if (isBackfill && dailyContext.value?.period) {
    router.push(`/dashboard/lpj`);
  } else {
    router.push('/dashboard/lpj');
  }
}

onMounted(async () => {
  await loadDailyContext();
});
</script>

<style scoped>
.daily-workspace-view {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 5rem;
}

/* Header */
.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-radius: var(--radius-lg, 16px);
  margin-bottom: 1.5rem;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.header-title-row h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-dark, #1b4332);
  margin: 0;
  letter-spacing: -0.02em;
}

.header-subtitle {
  color: var(--gray-600, #4b5563);
  font-size: 0.95rem;
  margin: 0.25rem 0 0 0;
}

/* Badges */
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.badge-present {
  background: #d1fae5;
  color: #065f46;
}

.badge-absent {
  background: #fee2e2;
  color: #991b1b;
}

.badge-rec {
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-weight: 600;
}

.badge-rpp {
  background: #e0e7ff;
  color: #3730a3;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-special {
  background: #fef3c7;
  color: #92400e;
  font-size: 0.8rem;
  font-weight: 600;
}

/* History Banner */
.history-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.history-icon {
  font-size: 1.5rem;
}

.history-badge {
  background: #f59e0b;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 800;
  margin-right: 0.5rem;
}

.history-content p {
  margin: 0;
  font-size: 0.95rem;
  color: #78350f;
}

/* Workspace Grid */
.workspace-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .workspace-grid {
    grid-template-columns: 2fr 1fr;
  }
}

.workspace-section {
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.step-num {
  background: var(--primary, #2d6a4f);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.section-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--gray-800, #1f2937);
  margin: 0;
}

.section-header p {
  font-size: 0.85rem;
  color: var(--gray-500, #6b7280);
  margin: 0.2rem 0 0 0;
}

/* Slots Grid */
.slots-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.slot-btn {
  background: white;
  border: 2px solid var(--gray-200, #e5e7eb);
  border-radius: 12px;
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slot-btn:hover:not(.disabled) {
  border-color: var(--primary, #2d6a4f);
  transform: translateY(-2px);
}

.slot-btn.active {
  border-color: var(--primary, #2d6a4f);
  background: #f0fdf4;
  box-shadow: 0 4px 12px rgba(45, 106, 79, 0.15);
}

.slot-btn.disabled {
  opacity: 0.6;
  background: #f9fafb;
  cursor: default;
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slot-name {
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--gray-800, #1f2937);
}

.slot-time {
  font-size: 0.85rem;
  color: var(--gray-500, #6b7280);
}

.slot-wave {
  display: block;
  font-size: 0.8rem;
  color: var(--primary, #2d6a4f);
  margin-top: 0.25rem;
  font-weight: 600;
}

.slot-status-saved {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #059669;
}

/* Levels Grid */
.level-group-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--gray-500, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 0.75rem;
}

.level-card {
  background: white;
  border: 1.5px solid var(--gray-200, #e5e7eb);
  border-radius: 10px;
  padding: 0.85rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.level-card:hover {
  border-color: var(--primary, #2d6a4f);
  transform: translateY(-2px);
}

.level-card.active {
  border-color: var(--primary, #2d6a4f);
  background: #f0fdf4;
  box-shadow: 0 4px 10px rgba(45, 106, 79, 0.15);
}

.level-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--gray-800, #1f2937);
}

/* Roster */
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.roster-count-badge {
  background: var(--gray-100, #f3f4f6);
  color: var(--gray-700, #374151);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.roster-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.roster-stats-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chip {
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}

.chip-hadir { background: #d1fae5; color: #065f46; }
.chip-sakit { background: #fef3c7; color: #92400e; }
.chip-izin { background: #e0e7ff; color: #3730a3; }
.chip-alpa { background: #fee2e2; color: #991b1b; }

.roster-search-box {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  border: 1px solid var(--gray-300, #d1d5db);
  font-size: 0.9rem;
}

.roster-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.santri-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
}

.santri-name-col {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.santri-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-light, #d8f3dc);
  color: var(--primary-dark, #1b4332);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.santri-name {
  font-weight: 600;
  color: var(--gray-800, #1f2937);
  font-size: 0.95rem;
}

.status-pills {
  display: flex;
  gap: 0.35rem;
}

.pill-btn {
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid var(--gray-200, #e5e7eb);
  background: white;
  color: var(--gray-600, #4b5563);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill-hadir.active { background: #10b981; color: white; border-color: #10b981; }
.pill-sakit.active { background: #f59e0b; color: white; border-color: #f59e0b; }
.pill-izin.active { background: #6366f1; color: white; border-color: #6366f1; }
.pill-alpa.active { background: #ef4444; color: white; border-color: #ef4444; }

/* Journal */
.journal-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-700, #374151);
}

.required {
  color: #ef4444;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--gray-200, #e5e7eb);
  border-radius: 10px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary, #2d6a4f);
}

/* Sidebar Summary */
.summary-panel {
  padding: 1.5rem;
  border-radius: 16px;
  position: sticky;
  top: 1.5rem;
}

.summary-panel h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary-dark, #1b4332);
  margin: 0;
}

.summary-subtitle {
  font-size: 0.85rem;
  color: var(--gray-500, #6b7280);
  margin: 0.2rem 0 1.25rem 0;
}

.summary-checklist {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.9rem;
  color: var(--gray-600, #4b5563);
}

.check-item.ok {
  color: var(--gray-800, #1f2937);
  font-weight: 600;
}

.check-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  background: var(--gray-200, #e5e7eb);
  color: var(--gray-500, #6b7280);
}

.check-item.ok .check-icon {
  background: #d1fae5;
  color: #065f46;
}

.btn-save-kbm {
  font-weight: 800;
  letter-spacing: 0.03em;
  padding: 0.9rem;
  font-size: 1rem;
}

/* Mobile Sticky Submit Bar */
@media (max-width: 1023px) {
  .workspace-sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    padding: 0.75rem 1rem;
    background: white;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  }

  .summary-panel {
    position: static;
    padding: 0;
    background: none;
    box-shadow: none;
    border: none;
  }

  .summary-panel h3,
  .summary-subtitle,
  .summary-checklist {
    display: none;
  }
}

/* State Cards */
.state-card {
  padding: 3rem 1.5rem;
  border-radius: 16px;
}

.state-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.state-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--gray-800, #1f2937);
  margin-bottom: 0.5rem;
}

.state-desc {
  color: var(--gray-600, #4b5563);
  max-width: 500px;
  margin: 0 auto;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal-card {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  max-width: 440px;
  width: 100%;
}

.success-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #d1fae5;
  color: #059669;
  font-size: 2rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
}

.modal-desc {
  color: var(--gray-600, #4b5563);
  font-size: 0.95rem;
  margin: 0.5rem 0 1.25rem 0;
}

.modal-summary-box {
  background: #f9fafb;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 12px;
  padding: 0.85rem;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-700, #374151);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.5rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3.5px solid var(--gray-200, #e5e7eb);
  border-top-color: var(--primary, #2d6a4f);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* --- Rename Santri Button & Modal --- */
.btn-rename-santri {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 6px;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
  margin-left: 6px;
  flex-shrink: 0;
}

.btn-rename-santri:hover {
  background: #d8f3dc;
  border-color: #2d6a4f;
  color: #1b4332;
  transform: scale(1.08);
}

.rename-modal-card {
  max-width: 440px;
  width: 92%;
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.rename-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
}

.rename-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(45, 106, 79, 0.12);
  color: var(--primary, #2d6a4f);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rename-modal-body .help-text {
  display: block;
  font-size: 0.78rem;
  color: var(--gray-500, #6b7280);
  margin-top: 0.35rem;
}

.rename-input {
  font-size: 0.95rem;
  font-weight: 500;
  padding: 10px 14px;
  width: 100%;
}

.modal-action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.25rem;
}

/* --- Inactive / Graduated Santri Section --- */
.inactive-santri-section {
  margin-top: 1.5rem;
  padding: 1.1rem 1.25rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: var(--radius-lg, 12px);
}

.inactive-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.inactive-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  flex-shrink: 0;
  margin-top: 2px;
}

.inactive-title {
  font-size: 0.925rem;
  font-weight: 700;
  color: #334155;
  margin: 0;
}

.inactive-desc {
  font-size: 0.8rem;
  color: #64748b;
  margin: 2px 0 0 0;
}

.inactive-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.inactive-item {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.inactive-item-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.inactive-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}

.inactive-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.badge-status-santri {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: capitalize;
}

.badge-santri-lulus {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.badge-santri-nonaktif {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}
</style>
