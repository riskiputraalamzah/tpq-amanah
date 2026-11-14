<template>
  <div class="santri-view">
    <header class="page-header">
      <div>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
    </header>

    <PageSkeleton v-if="loading" :rows="8" label="Memuat data santri" />

    <div v-else>
      <!-- Form Tambah Santri (Hanya untuk Admin) -->
      <section v-if="adminMode" class="glass-card">
        <h2>Tambah Santri</h2>
        <form class="add-form" @submit.prevent="addSantri">
          <div class="form-group">
            <label>Nama Santri</label>
            <input
              v-model="newName"
              class="form-input"
              placeholder="Nama lengkap santri"
              required
            />
          </div>
          <div class="form-group">
            <label>Jilid / Marhalah</label>
            <select v-model="newLevel" class="form-input">
              <option value="">Belum ditentukan</option>
              <optgroup label="JILID">
                <option
                  v-for="c in jilidList"
                  :key="c.id"
                  :value="String(c.id)"
                >
                  {{ c.name }}
                </option>
              </optgroup>
              <optgroup label="MARHALAH" v-if="marhalahList.length > 0">
                <option
                  v-for="c in marhalahList"
                  :key="c.id"
                  :value="String(c.id)"
                >
                  {{ c.name }}
                </option>
              </optgroup>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="adding">
            {{ adding ? "Menambahkan..." : "Tambah Santri" }}
          </button>
        </form>
        <div
          v-if="formMessage"
          class="alert"
          :class="formOk ? 'alert-success' : 'alert-error'"
        >
          {{ formMessage }}
        </div>
      </section>

      <!-- Info Banner Ramah untuk Guru -->
      <div v-else class="info-note-card glass-card">
        <div class="info-note-content">
          <div
            style="
              display: flex;
              align-items: center;
              gap: 0.5rem;
              margin-bottom: 10px;
            "
          >
            <span class="info-icon">💡</span>
            <h3 class="info-title">Pusat Data Santri</h3>
          </div>
          <p class="info-desc">
            Pendaftaran santri baru dan penetapan kelas dikelola secara terpusat
            oleh <strong>Admin TPQ</strong>. Anda dapat melihat daftar santri
            serta memperbaiki ejaan nama jika terdapat kekeliruan (typo) melalui
            tombol <strong>Ubah Nama</strong> di bawah.
          </p>
        </div>
      </div>

      <section class="glass-card">
        <div class="roster-toolbar">
          <h2>Daftar Santri ({{ filtered.length }})</h2>
          <button
            type="button"
            class="btn btn-ghost btn-sm export-btn"
            :disabled="exportingExcel || filtered.length === 0"
            @click="exportExcel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {{ exportingExcel ? "Menyiapkan..." : "Export Excel" }}
          </button>
        </div>

        <!-- Nomor induk dengan NSPQ lama / salah ketik (Hanya Admin) -->
        <div v-if="adminMode && wrongPrefixRows.length > 0" class="ni-banner ni-banner-warn" role="status">
          <div class="ni-banner-text">
            <strong>{{ wrongPrefixRows.length }} nomor induk masih memakai NSPQ {{ wrongPrefixes.join(", ") }}.</strong>
            <span>NSPQ di Profil TPQ: {{ currentNspq }}. Contoh perbaikan: {{ wrongPrefixRows[0].nomorInduk }} → {{ correctedNumber(wrongPrefixRows[0].nomorInduk) }}</span>
          </div>
          <button type="button" class="btn btn-primary btn-sm" :disabled="fixingPrefix" @click="fixNspqPrefix">
            {{ fixingPrefix ? "Memperbaiki..." : "Perbaiki ke " + currentNspq }}
          </button>
        </div>

        <!-- Santri lama yang belum punya nomor induk (Hanya Admin) -->
        <div v-if="adminMode && unnumberedCount > 0" class="ni-banner">
          <div class="ni-banner-text">
            <strong>{{ unnumberedCount }} santri belum memiliki nomor induk.</strong>
            <span>Format: NSPQ-Tahun-Urut, contoh {{ exampleNomorInduk }}</span>
          </div>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="previewLoading"
            @click="openNomorIndukPreview"
          >
            {{ previewLoading ? "Menyiapkan..." : "Buat Nomor Induk" }}
          </button>
        </div>
        <!-- a guru sees the santri of the jilid they look after -->
        <p v-if="scope && !adminMode && scope.source === 'none'" class="scope-note is-warn" role="status">
          Jilid yang Antum ampu belum diatur admin dan belum ada riwayat KBM. Minta admin mengaturnya di menu Kelola Pengajar.
        </p>
        <p v-else-if="scope && !adminMode" class="scope-note">
          Menampilkan santri <strong>{{ scopeLabel }}</strong>.
          <template v-if="scope.source === 'kbm'"> Jilid diambil dari riwayat KBM 60 hari terakhir, belum ditetapkan admin.</template>
        </p>
        <div class="filters">
          <input
            v-model="search"
            class="form-input"
            placeholder="Cari nama atau nomor induk..."
          />
          <select v-model="levelFilter" class="form-input filter-select">
            <option value="">{{ adminMode ? "Semua Jilid / Marhalah" : "Semua jilid saya" }}</option>
            <option v-if="adminMode" value="__none">Belum ditentukan</option>
            <option v-for="c in filterClasses" :key="c.id" :value="String(c.id)">
              {{ c.name }}
            </option>
          </select>
          <select v-model="statusFilter" class="form-input filter-select">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
            <option value="lulus">Lulus</option>
          </select>
        </div>

        <!-- Pratinjau Nomor Induk -->
        <Teleport to="body">
          <div
            v-if="nomorIndukPreview"
            class="modal-overlay"
            @click.self="closeNomorIndukPreview"
            @keydown.esc="closeNomorIndukPreview"
          >
            <div
              class="modal glass-card ni-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ni-modal-title"
            >
              <h3 id="ni-modal-title" class="ni-modal-title">Buat Nomor Induk Santri</h3>
              <p class="ni-modal-text">
                <strong>{{ nomorIndukPreview.items.length }} santri</strong> akan
                mendapatkan nomor induk dengan NSPQ
                <strong>{{ nomorIndukPreview.nspq }}</strong> dan tahun
                <strong>{{ nomorIndukPreview.yearCode }}</strong>. Urutan: Jilid /
                Marhalah tertinggi lebih dulu, lalu nama A–Z.
              </p>
              <p class="ni-modal-note">
                Nomor induk bersifat tetap: tidak bisa diubah dan tidak dipakai
                ulang, walaupun santri lulus, nonaktif, atau dihapus.
              </p>
              <div class="ni-preview-list">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>No. Induk</th>
                      <th>Nama</th>
                      <th>Jilid / Marhalah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in nomorIndukPreview.items" :key="item.id">
                      <td class="ni-number">{{ item.nomorInduk }}</td>
                      <td>{{ item.name }}</td>
                      <td>{{ levelName(item.currentClassId) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="modal-action-buttons">
                <button
                  type="button"
                  class="btn btn-ghost"
                  :disabled="generating"
                  @click="closeNomorIndukPreview"
                >
                  Batal
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="generating || nomorIndukPreview.items.length === 0"
                  @click="generateNomorInduk"
                >
                  {{
                    generating
                      ? "Membuat nomor induk..."
                      : `Buat ${nomorIndukPreview.items.length} Nomor Induk`
                  }}
                </button>
              </div>
            </div>
          </div>
        </Teleport>

        <!-- Conflict Modal (Fixed Viewport Center via Teleport to body) -->
        <Teleport to="body">
          <div
            v-if="conflictSantri"
            class="modal-overlay"
            @click.self="conflictSantri = null"
          >
            <div class="modal glass-card conflict-modal-card">
              <div class="modal-header-danger">
                <span class="modal-danger-icon">⚠️</span>
                <div>
                  <h3 class="modal-title">
                    Santri Memiliki Riwayat KBM / Absensi
                  </h3>
                  <p class="modal-subtitle">
                    Santri: <strong>{{ conflictSantri.name }}</strong>
                  </p>
                </div>
              </div>
              <p class="modal-text">
                Santri ini memiliki catatan riwayat di sistem. Apakah data ini
                data uji coba (test) yang ingin dibersihkan sepenuhnya, atau
                santri yang ingin dinonaktifkan?
              </p>
              <div class="modal-action-buttons">
                <button
                  type="button"
                  class="btn btn-secondary"
                  :disabled="saving"
                  @click="softDeleteSantri(conflictSantri)"
                >
                  📁 Nonaktifkan Saja (Soft Delete)
                </button>
                <button
                  type="button"
                  class="btn btn-danger"
                  :disabled="saving"
                  @click="removeSantri(conflictSantri, true)"
                >
                  🗑️ Hapus Permanen &amp; Bersihkan Riwayat Test
                </button>
                <button
                  type="button"
                  class="btn btn-ghost"
                  @click="conflictSantri = null"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </Teleport>

        <div v-if="listError" class="alert alert-error">{{ listError }}</div>
        <div v-else-if="filtered.length === 0" class="alert alert-warning">
          Tidak ada santri yang cocok.
        </div>

        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th :aria-sort="ariaSort('nomorInduk')">
                  <button type="button" class="sort-btn" :class="{ active: sortKey === 'nomorInduk' }" @click="toggleSort('nomorInduk')">
                    No. Induk
                    <svg class="sort-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                      <path v-if="sortKey !== 'nomorInduk'" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                      <path v-else-if="sortDir === 'asc'" d="M6 15l6-6 6 6" />
                      <path v-else d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </th>
                <th :aria-sort="ariaSort('name')">
                  <button type="button" class="sort-btn" :class="{ active: sortKey === 'name' }" @click="toggleSort('name')">
                    Nama
                    <svg class="sort-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                      <path v-if="sortKey !== 'name'" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                      <path v-else-if="sortDir === 'asc'" d="M6 15l6-6 6 6" />
                      <path v-else d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </th>
                <th :aria-sort="ariaSort('level')">
                  <button type="button" class="sort-btn" :class="{ active: sortKey === 'level' }" @click="toggleSort('level')">
                    Jilid / Marhalah
                    <svg class="sort-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                      <path v-if="sortKey !== 'level'" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                      <path v-else-if="sortDir === 'asc'" d="M6 15l6-6 6 6" />
                      <path v-else d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in sortedRows" :key="row.id">
                <td>{{ index + 1 }}</td>
                <td class="ni-cell">
                  <template v-if="row.nomorInduk">
                    <span class="ni-number">{{ row.nomorInduk }}</span>
                    <button
                      type="button"
                      class="ni-copy"
                      :aria-label="`Salin nomor induk ${row.name} dengan strip`"
                      :title="copiedKey === `${row.id}:dash` ? 'Tersalin' : 'Salin dengan strip'"
                      @click="copyNomorInduk(row)"
                    >
                      <svg v-if="copiedKey === `${row.id}:dash`" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="ni-copy ni-copy-plain"
                      :aria-label="`Salin nomor induk ${row.name} tanpa strip`"
                      :title="copiedKey === `${row.id}:plain` ? 'Tersalin' : 'Salin tanpa strip'"
                      @click="copyNomorInduk(row, { stripped: true })"
                    >
                      <svg v-if="copiedKey === `${row.id}:plain`" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span v-else aria-hidden="true">123</span>
                    </button>
                  </template>
                  <span v-else class="ni-empty">Belum ada</span>
                </td>
                <td>
                  <template v-if="editingId === row.id">
                    <input
                      v-model="editingName"
                      type="text"
                      class="form-input editing-name-input"
                      placeholder="Nama santri..."
                      required
                      @keyup.enter="saveSantri(row)"
                      @keyup.esc="cancelEdit"
                    />
                  </template>
                  <template v-else>
                    {{ row.name }}
                  </template>
                </td>
                <td>
                  <template v-if="editingId === row.id && adminMode">
                    <select
                      v-model="editingLevel"
                      class="form-input status-select"
                    >
                      <option value="">Belum ditentukan</option>
                      <optgroup label="JILID">
                        <option
                          v-for="c in jilidList"
                          :key="c.id"
                          :value="String(c.id)"
                        >
                          {{ c.name }}
                        </option>
                      </optgroup>
                      <optgroup label="MARHALAH" v-if="marhalahList.length > 0">
                        <option
                          v-for="c in marhalahList"
                          :key="c.id"
                          :value="String(c.id)"
                        >
                          {{ c.name }}
                        </option>
                      </optgroup>
                    </select>
                  </template>
                  <template v-else>
                    {{ levelName(row.currentClassId) }}
                  </template>
                </td>
                <td>
                  <template v-if="editingId === row.id && adminMode">
                    <select
                      v-model="editingStatus"
                      class="form-input status-select"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                      <option value="lulus">Lulus</option>
                    </select>
                  </template>
                  <template v-else>
                    <span class="badge" :class="statusBadgeClass(row.status)">
                      {{ statusLabel(row.status) }}
                    </span>
                  </template>
                </td>
                <td>
                  <template v-if="editingId === row.id">
                    <button
                      type="button"
                      class="action-link"
                      :disabled="saving"
                      @click="saveSantri(row)"
                    >
                      {{ saving ? "Menyimpan..." : "Simpan" }}
                    </button>
                    <button
                      type="button"
                      class="action-link muted"
                      @click="cancelEdit"
                    >
                      Batal
                    </button>
                  </template>
                  <button
                    v-else-if="canEdit(row)"
                    type="button"
                    class="action-link"
                    @click="startEdit(row)"
                  >
                    {{ adminMode ? "Ubah" : "Ubah Nama" }}
                  </button>
                  <button
                    v-if="adminMode && editingId !== row.id"
                    type="button"
                    class="action-link danger"
                    @click="removeSantri(row)"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from "vue";
import api, { clearApiCache } from "@/services/api";
import PageSkeleton from "@/components/PageSkeleton.vue";
import { sortSantri } from "@/utils/santriSort";
import { loadExcelLib, downloadWorkbook } from "@/utils/excel";
import { buildSantriWorkbook, santriFilename } from "@/utils/excelExports";
import { useAuthStore } from "@/stores/auth";
import { useToast, useConfirm } from "@/composables/useToast";

const { success, error: showError, warning } = useToast();
const { confirm } = useConfirm();

const props = defineProps({
  title: { type: String, default: "Kelola Santri" },
  subtitle: {
    type: String,
    default: "Lihat, tambah, dan tetapkan Jilid / Marhalah santri",
  },
  adminMode: { type: Boolean, default: false },
});

const authStore = useAuthStore();
const currentUserId = computed(() => authStore.user?.id || "");

const canEdit = () => true;

const loading = ref(true);
const adding = ref(false);
const saving = ref(false);
const santri = ref([]);
const classes = ref([]);
const search = ref("");
const levelFilter = ref("");
const statusFilter = ref("");
const newName = ref("");
const newLevel = ref("");
const formMessage = ref("");
const formOk = ref(false);
const listError = ref("");
const editingId = ref(null);
const editingName = ref("");
const editingLevel = ref("");
const editingStatus = ref("aktif");
const conflictSantri = ref(null);
const nomorIndukPreview = ref(null);
const previewLoading = ref(false);
const generating = ref(false);
const copiedKey = ref(null);
let copiedTimer = null;

// NSPQ from Profil TPQ, normalized like the backend (empty means the official NSPQ).
const currentNspq = ref("");
const fixingPrefix = ref(false);
const prefixOf = (nomorInduk) => String(nomorInduk || "").split("-")[0];
const wrongPrefixRows = computed(() =>
  currentNspq.value ? santri.value.filter((row) => row.nomorInduk && prefixOf(row.nomorInduk) !== currentNspq.value) : [],
);
const wrongPrefixes = computed(() => [...new Set(wrongPrefixRows.value.map((row) => prefixOf(row.nomorInduk)))]);
const correctedNumber = (nomorInduk) => `${currentNspq.value}-${String(nomorInduk).split("-").slice(1).join("-")}`;

const loadNspq = async () => {
  if (!props.adminMode) return;
  try {
    const { data } = await api.get("/settings/tpq-profile");
    const digits = String(data?.nsq || "").replace(/\D/g, "");
    currentNspq.value = digits.length === 12 ? digits : "";
  } catch {
    currentNspq.value = "";
  }
};

const fixNspqPrefix = async () => {
  if (fixingPrefix.value) return;
  const ok = await confirm(
    `Ganti awalan NSPQ ${wrongPrefixes.value.join(", ")} menjadi ${currentNspq.value} pada ${wrongPrefixRows.value.length} nomor induk? Tahun dan nomor urut tidak berubah, nomor lama tetap disimpan sebagai riwayat.`,
    { title: "Perbaiki Nomor Induk", confirmText: "Ya, Perbaiki", cancelText: "Batal" },
  );
  if (!ok) return;
  fixingPrefix.value = true;
  try {
    const { data } = await api.post("/santri/nomor-induk/fix-nspq", {}, { timeout: 60000 });
    const fixedById = new Map((data.fixed || []).map((item) => [item.id, item.nomorInduk]));
    santri.value = santri.value.map((row) => (fixedById.has(row.id) ? { ...row, nomorInduk: fixedById.get(row.id) } : row));
    currentNspq.value = data.nspq || currentNspq.value;
    success(data.message || "Nomor induk berhasil diperbaiki.");
  } catch (error) {
    showError(error.response?.data?.error || "Gagal memperbaiki nomor induk.");
  } finally {
    fixingPrefix.value = false;
  }
};

const unnumberedCount = computed(
  () => santri.value.filter((row) => !row.nomorInduk).length,
);

const exampleNomorInduk = computed(
  () =>
    santri.value.find((row) => row.nomorInduk)?.nomorInduk ||
    "411235151939-26-001",
);

const openNomorIndukPreview = async () => {
  if (previewLoading.value) return;
  previewLoading.value = true;
  try {
    clearApiCache("/santri/nomor-induk");
    const { data } = await api.get("/santri/nomor-induk/preview");
    if (!data.items?.length) {
      success("Semua santri sudah memiliki nomor induk.");
      await fetchData();
      return;
    }
    nomorIndukPreview.value = data;
    await nextTick();
    document.querySelector(".ni-modal .btn-primary")?.focus();
  } catch (error) {
    showError(error.response?.data?.error || "Gagal menyiapkan pratinjau nomor induk.");
  } finally {
    previewLoading.value = false;
  }
};

const closeNomorIndukPreview = () => {
  if (!generating.value) nomorIndukPreview.value = null;
};

const generateNomorInduk = async () => {
  if (generating.value) return;
  generating.value = true;
  try {
    const { data } = await api.post("/santri/nomor-induk/generate", {}, {
      timeout: 60000,
    });
    const assignedById = new Map((data.assigned || []).map((item) => [item.id, item]));
    santri.value = santri.value.map((row) =>
      assignedById.has(row.id) ? { ...row, ...assignedById.get(row.id) } : row,
    );
    nomorIndukPreview.value = null;
    success(data.message || "Nomor induk berhasil dibuat.");
  } catch (error) {
    showError(error.response?.data?.error || "Gagal membuat nomor induk.");
  } finally {
    generating.value = false;
  }
};

// Default copy keeps the dashes (safe to paste into Excel, where a 17-digit number loses its last digits);
// the second button copies digits only, for forms that do not accept dashes.
const copyNomorInduk = async (row, { stripped = false } = {}) => {
  const text = stripped ? String(row.nomorInduk).replace(/-/g, "") : row.nomorInduk;
  try {
    await navigator.clipboard.writeText(text);
    copiedKey.value = `${row.id}:${stripped ? "plain" : "dash"}`;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copiedKey.value = null;
    }, 1500);
  } catch {
    showError("Gagal menyalin. Salin nomor induk secara manual.");
  }
};

onBeforeUnmount(() => clearTimeout(copiedTimer));

// Excel export: exactly the rows on screen (search, filters and sort applied).
const exportingExcel = ref(false);
const hasActiveFilter = computed(
  () => !!(search.value.trim() || levelFilter.value || statusFilter.value),
);

const exportExcel = async () => {
  if (exportingExcel.value) return;
  if (filtered.value.length === 0) {
    warning("Tidak ada santri untuk diekspor.");
    return;
  }
  exportingExcel.value = true;
  try {
    const ExcelJS = await loadExcelLib();
    const exportedAt = new Date();
    const rows = sortedRows.value.map((row) => ({
      nomorInduk: row.nomorInduk,
      name: row.name,
      level: levelName(row.currentClassId),
      status: statusLabel(row.status),
    }));
    const workbook = buildSantriWorkbook(ExcelJS, { rows, exportedAt });
    const filename = santriFilename({ filtered: hasActiveFilter.value, date: exportedAt });
    await downloadWorkbook(workbook, filename);
    success(`${rows.length} santri diekspor ke ${filename}`);
  } catch (error) {
    console.error("Export santri Excel error:", error);
    showError("Gagal mengekspor Excel. Periksa koneksi lalu coba lagi.");
  } finally {
    exportingExcel.value = false;
  }
};

const statusLabel = (status) => {
  const s = String(status || "aktif").toLowerCase();
  if (s === "nonaktif" || s === "keluar") return "Nonaktif";
  if (s === "lulus") return "Lulus";
  return "Aktif";
};

const statusBadgeClass = (status) => {
  const s = String(status || "aktif").toLowerCase();
  if (s === "nonaktif" || s === "keluar") return "badge-warning";
  if (s === "lulus") return "badge-info";
  return "badge-success";
};

const removeSantri = async (row, force = false) => {
  if (!force) {
    const ok = await confirm(
      `Apakah Anda yakin ingin menghapus santri "${row.name}"?`,
      {
        title: "Hapus Santri",
        type: "danger",
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
      },
    );
    if (!ok) return;
  }
  listError.value = "";
  try {
    const url = force ? `/santri/${row.id}?force=true` : `/santri/${row.id}`;
    await api.delete(url);
    santri.value = santri.value.filter((item) => item.id !== row.id);
    conflictSantri.value = null;
    success(`Santri "${row.name}" berhasil dihapus.`);
  } catch (error) {
    if (error.response?.status === 409) {
      conflictSantri.value = row;
    } else {
      const msg = error.response?.data?.error || "Gagal menghapus data santri.";
      listError.value = msg;
      showError(msg);
    }
  }
};

const softDeleteSantri = async (row) => {
  listError.value = "";
  saving.value = true;
  try {
    await api.delete(`/santri/${row.id}?soft=true`);
    row.status = "nonaktif";
    conflictSantri.value = null;
    success(`Santri "${row.name}" berhasil dinonaktifkan.`);
  } catch (error) {
    const msg = error.response?.data?.error || "Gagal menonaktifkan santri.";
    listError.value = msg;
    showError(msg);
  } finally {
    saving.value = false;
  }
};

const jilidList = computed(() =>
  classes.value.filter((c) =>
    ["1", "2", "3", "4", "5", "6"].includes(String(c.id)),
  ),
);
const marhalahList = computed(() =>
  classes.value.filter(
    (c) => !["1", "2", "3", "4", "5", "6"].includes(String(c.id)),
  ),
);

// Guru: only the jilid they look after (the admin sets it in Kelola Pengajar, else their KBM history).
const scope = ref(null);
const normLevel = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  return ["7", "8", "9", "marhalah"].includes(s) ? "7" : s;
};
const scopeIds = computed(() => (props.adminMode || !scope.value ? null : scope.value.classIds || []));
const scopedSantri = computed(() =>
  scopeIds.value ? santri.value.filter((row) => scopeIds.value.includes(normLevel(row.currentClassId))) : santri.value,
);
const filterClasses = computed(() =>
  scopeIds.value ? classes.value.filter((c) => scopeIds.value.includes(normLevel(c.id))) : classes.value,
);
const scopeLabel = computed(() => filterClasses.value.map((c) => c.name).join(", "));
const loadScope = async () => {
  if (props.adminMode) return;
  try {
    const { data } = await api.get("/guru-classes/me", { cache: false });
    scope.value = data;
  } catch {
    scope.value = { classIds: [], source: "none" };
  }
};

const levelName = (classId) => {
  if (!classId) return "Belum ditentukan";
  const found = classes.value.find((c) => String(c.id) === String(classId));
  return found ? found.name : `Jilid / Marhalah ${classId}`;
};

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  return scopedSantri.value.filter((row) => {
    if (q) {
      const nomorInduk = String(row.nomorInduk || "");
      const matches =
        String(row.name || "").toLowerCase().includes(q) ||
        nomorInduk.includes(q) ||
        // "26001" or "26 001" also finds 411235151939-26-001
        (qDigits.length >= 3 && nomorInduk.replace(/\D/g, "").includes(qDigits));
      if (!matches) return false;
    }
    if (levelFilter.value === "__none") {
      if (row.currentClassId) return false;
    } else if (levelFilter.value) {
      if (String(row.currentClassId || "") !== levelFilter.value) return false;
    }
    if (statusFilter.value) {
      const rowStatus = String(row.status || "aktif").toLowerCase();
      if (rowStatus !== statusFilter.value) return false;
    }
    return true;
  });
});

// Sorting: Nama (default), No. Induk, and Jilid 1-6 then Marhalah. Empty values always stay at the bottom.
const sortKey = ref("name");
const sortDir = ref("asc");

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = "asc";
  }
};

const ariaSort = (key) =>
  sortKey.value !== key ? "none" : sortDir.value === "asc" ? "ascending" : "descending";

const sortedRows = computed(() =>
  sortSantri(filtered.value, sortKey.value, sortDir.value),
);

const fetchData = async () => {
  loading.value = true;
  listError.value = "";
  try {
    const [santriRes, classesRes] = await Promise.all([
      api.get("/santri"),
      api.get("/classes"),
      loadNspq(),
      loadScope(),
    ]);
    santri.value = santriRes.data;
    classes.value = classesRes.data;
  } catch (error) {
    listError.value =
      error.response?.data?.error || "Gagal memuat data santri.";
  } finally {
    loading.value = false;
  }
};

const addSantri = async () => {
  const trimmed = newName.value.trim();
  if (!trimmed || adding.value) return;
  adding.value = true;
  formMessage.value = "";
  try {
    const payload = { name: trimmed };
    if (newLevel.value) payload.currentClassId = newLevel.value;
    const res = await api.post("/santri", payload);
    if (!res.data.alreadyExists) {
      santri.value.push(res.data);
    }
    formOk.value = true;
    if (res.data.alreadyExists) {
      formMessage.value = "Santri dengan nama ini sudah terdaftar.";
      warning(`Santri "${trimmed}" sudah terdaftar.`);
    } else {
      formMessage.value = "Santri berhasil ditambahkan.";
      success(`Santri "${trimmed}" berhasil ditambahkan!`);
    }
    newName.value = "";
    newLevel.value = "";
  } catch (error) {
    formOk.value = false;
    const msg = error.response?.data?.error || "Gagal menambahkan santri.";
    formMessage.value = msg;
    showError(msg);
  } finally {
    adding.value = false;
  }
};

const startEdit = (row) => {
  editingId.value = row.id;
  editingName.value = row.name || "";
  editingLevel.value = row.currentClassId ? String(row.currentClassId) : "";
  editingStatus.value = row.status || "aktif";
  listError.value = "";
};

const cancelEdit = () => {
  editingId.value = null;
  editingName.value = "";
  editingLevel.value = "";
  editingStatus.value = "aktif";
};

const saveSantri = async (row) => {
  if (saving.value) return;
  const trimmedName = editingName.value.trim();
  if (!trimmedName || trimmedName.length < 2) {
    showError("Nama santri wajib diisi (minimal 2 karakter).");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: trimmedName,
    };
    if (props.adminMode) {
      payload.currentClassId = editingLevel.value || null;
      payload.status = editingStatus.value;
    }
    const res = await api.put(`/santri/${row.id}`, payload);
    row.name = res.data.name || trimmedName;
    if (props.adminMode) {
      row.currentClassId = editingLevel.value || null;
      row.status = editingStatus.value;
    }
    editingId.value = null;
    editingName.value = "";
    editingLevel.value = "";
    editingStatus.value = "aktif";
    success(`Data santri "${row.name}" berhasil diperbarui.`);
  } catch (error) {
    const msg =
      error.response?.data?.error || "Gagal menyimpan perubahan santri.";
    listError.value = msg;
    showError(msg);
  } finally {
    saving.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.santri-view {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .santri-view {
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

.add-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem !important;
}

@media (min-width: 768px) {
  .add-form {
    grid-template-columns: 2fr 1fr auto;
    align-items: end;
  }
}

.form-group label {
  display: block;
  font-weight: 600;

  color: var(--gray-700);
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
}

.filters {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

@media (min-width: 768px) {
  .filters {
    grid-template-columns: 2fr 1.2fr 1fr;
  }
}

.roster-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.roster-toolbar h2 {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
}

.status-select {
  max-width: 220px;
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

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  margin: -6px -8px;
  padding: 6px 8px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  font: inherit;
  color: inherit;
  white-space: nowrap;
  cursor: pointer;
}

.sort-btn:hover,
.sort-btn:focus-visible {
  background: var(--gray-200);
}

.sort-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.sort-icon {
  flex-shrink: 0;
  color: var(--gray-400);
}

.sort-btn.active {
  color: var(--primary-dark);
}

.sort-btn.active .sort-icon {
  color: var(--primary);
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.action-link {
  background: none;
  border: none;
  color: var(--primary-dark);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px 8px 4px 0;
  white-space: nowrap;
}

.action-link:hover {
  text-decoration: underline;
}

.action-link.danger {
  color: #c62828;
}

.action-link.muted {
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

.alert-warning {
  background: rgba(255, 152, 0, 0.1);
  color: #ef6c00;
  border: 1px solid rgba(255, 152, 0, 0.2);
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  text-align: center;
}

.badge-success {
  background: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
  border: 1px solid rgba(46, 125, 50, 0.25);
}

.badge-warning {
  background: rgba(239, 108, 0, 0.12);
  color: #e65100;
  border: 1px solid rgba(239, 108, 0, 0.25);
}

.badge-info {
  background: rgba(2, 136, 209, 0.12);
  color: #0277bd;
  border: 1px solid rgba(2, 136, 209, 0.25);
}

.conflict-modal-card {
  max-width: 520px;
  width: 92%;
  padding: 28px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header-danger {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.modal-danger-icon {
  font-size: 2.2rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 50%;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #92400e;
}

.modal-subtitle {
  margin: 4px 0 0 0;
  font-size: 0.95rem;
  color: #4b5563;
}

.modal-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #4b5563;
  margin-bottom: 24px;
}

.modal-action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 640px) {
  .modal-action-buttons {
    flex-direction: row;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}

@keyframes modalScaleIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.btn-sm {
  padding: 6px 14px;
  font-size: 0.82rem;
}

.btn-secondary {
  background: var(--gray-200);
  color: var(--gray-800);
}

.btn-secondary:hover {
  background: var(--gray-300);
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover {
  background: #b71c1c;
}

.btn-ghost {
  background: transparent;
  color: var(--gray-600);
  border: 1px solid var(--gray-300);
}

.btn-ghost:hover {
  background: var(--gray-100);
}

.info-note-card {
  padding: 16px 20px;
  margin-bottom: var(--space-xl);
  background: linear-gradient(
    135deg,
    rgba(240, 253, 244, 0.95) 0%,
    rgba(255, 255, 255, 0.95) 100%
  );
  border: 1px solid rgba(134, 239, 172, 0.5);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.05);
}

/* .info-note-content {
  display: flex;
  align-items: start;
  gap: 14px;
} */

.info-icon {
  font-size: 1.4rem;
  line-height: 1;
  padding: 10px;
  background: rgba(34, 197, 94, 0.12);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.info-title {
  margin: 0 0 3px 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.info-desc {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--gray-700);
}

.scope-note {
  margin: var(--space-md) 0;
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  background: #eef6f1;
  color: #0a4a34;
  font-size: 0.9rem;
  line-height: 1.5;
}

.scope-note.is-warn {
  background: #fffbeb;
  color: #5b3a06;
  border: 1px solid #f3d58b;
}

.ni-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin: var(--space-md) 0 var(--space-lg);
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.28);
}

.ni-banner-warn {
  background: #fffbeb;
  border-color: #fcd34d;
}

.ni-banner-warn .ni-banner-text strong {
  color: #92400e;
}

.ni-banner-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.88rem;
  color: var(--primary-dark);
  min-width: 0;
}

.ni-banner-text span {
  color: var(--gray-600);
  font-size: 0.8rem;
  overflow-wrap: anywhere;
}

.ni-cell {
  white-space: nowrap;
}

.ni-number {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.84rem;
  font-variant-numeric: tabular-nums;
  color: var(--gray-800);
  white-space: nowrap;
}

.ni-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: 4px;
  vertical-align: middle;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--gray-500);
  cursor: pointer;
}

.ni-copy:hover,
.ni-copy:focus-visible {
  background: var(--gray-100);
  color: var(--primary-dark);
}

.ni-copy-plain {
  width: 34px;
  margin-left: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.ni-empty {
  font-size: 0.8rem;
  color: var(--gray-400);
}

.ni-modal {
  max-width: 640px !important;
  width: 100%;
  padding: 24px;
  background: #ffffff;
}

.ni-modal-title {
  margin: 0 0 8px;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.ni-modal-text {
  margin: 0 0 8px;
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--gray-700);
}

.ni-modal-note {
  margin: 0 0 16px;
  font-size: 0.82rem;
  line-height: 1.45;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--radius-md);
  padding: 8px 12px;
}

.ni-preview-list {
  max-height: 45vh;
  overflow: auto;
  margin-bottom: 20px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
}

.ni-preview-list .data-table th {
  position: sticky;
  top: 0;
  z-index: 1;
}

.ni-preview-list .data-table th,
.ni-preview-list .data-table td {
  padding: 8px 12px;
}

.editing-name-input {
  min-width: 140px;
  max-width: 260px;
}
</style>
