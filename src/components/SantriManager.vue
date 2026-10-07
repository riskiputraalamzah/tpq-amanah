<template>
  <div class="santri-view">
    <header class="page-header">
      <div>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
    </header>

    <div v-if="loading" class="glass-card">
      <p>Memuat data santri...</p>
    </div>

    <div v-else>
      <!-- Form Tambah Santri (Hanya untuk Admin) -->
      <section v-if="adminMode" class="glass-card">
        <h2>Tambah Santri</h2>
        <form class="add-form" @submit.prevent="addSantri">
          <div class="form-group">
            <label>Nama Santri</label>
            <input v-model="newName" class="form-input" placeholder="Nama lengkap santri" required />
          </div>
          <div class="form-group">
            <label>Jilid / Marhalah</label>
            <select v-model="newLevel" class="form-input">
              <option value="">Belum ditentukan</option>
              <optgroup label="JILID">
                <option v-for="c in jilidList" :key="c.id" :value="String(c.id)">
                  {{ c.name }}
                </option>
              </optgroup>
              <optgroup label="MARHALAH" v-if="marhalahList.length > 0">
                <option v-for="c in marhalahList" :key="c.id" :value="String(c.id)">
                  {{ c.name }}
                </option>
              </optgroup>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="adding">
            {{ adding ? "Menambahkan..." : "Tambah Santri" }}
          </button>
        </form>
        <div v-if="formMessage" class="alert" :class="formOk ? 'alert-success' : 'alert-error'">
          {{ formMessage }}
        </div>
      </section>

      <!-- Info Banner Ramah untuk Guru -->
      <div v-else class="info-note-card glass-card">
        <div class="info-note-content">
          <span class="info-icon">💡</span>
          <div>
            <h3 class="info-title">Pusat Data Santri</h3>
            <p class="info-desc">
              Pendaftaran santri baru dan penetapan kelas dikelola secara terpusat oleh <strong>Admin TPQ</strong>. Anda dapat melihat daftar santri serta memperbaiki ejaan nama jika terdapat kekeliruan (typo) melalui tombol <strong>Ubah Nama</strong> di bawah.
            </p>
          </div>
        </div>
      </div>

      <section class="glass-card">
        <div class="roster-toolbar">
          <h2>Daftar Santri ({{ filtered.length }})</h2>
        </div>
        <div class="filters">
          <input v-model="search" class="form-input" placeholder="Cari nama santri..." />
          <select v-model="levelFilter" class="form-input filter-select">
            <option value="">Semua Jilid / Marhalah</option>
            <option value="__none">Belum ditentukan</option>
            <option v-for="c in classes" :key="c.id" :value="String(c.id)">
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

        <!-- Conflict Modal (Fixed Viewport Center via Teleport to body) -->
        <Teleport to="body">
          <div v-if="conflictSantri" class="modal-overlay" @click.self="conflictSantri = null">
            <div class="modal glass-card conflict-modal-card">
              <div class="modal-header-danger">
                <span class="modal-danger-icon">⚠️</span>
                <div>
                  <h3 class="modal-title">Santri Memiliki Riwayat KBM / Absensi</h3>
                  <p class="modal-subtitle">Santri: <strong>{{ conflictSantri.name }}</strong></p>
                </div>
              </div>
              <p class="modal-text">
                Santri ini memiliki catatan riwayat di sistem. Apakah data ini data uji coba (test) yang ingin dibersihkan sepenuhnya, atau santri yang ingin dinonaktifkan?
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
                <th>Nama</th>
                <th>Jilid / Marhalah</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in filtered" :key="row.id">
                <td>{{ index + 1 }}</td>
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
                    <select v-model="editingLevel" class="form-input status-select">
                      <option value="">Belum ditentukan</option>
                      <optgroup label="JILID">
                        <option v-for="c in jilidList" :key="c.id" :value="String(c.id)">
                          {{ c.name }}
                        </option>
                      </optgroup>
                      <optgroup label="MARHALAH" v-if="marhalahList.length > 0">
                        <option v-for="c in marhalahList" :key="c.id" :value="String(c.id)">
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
                    <select v-model="editingStatus" class="form-input status-select">
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
                    <button type="button" class="action-link" :disabled="saving" @click="saveSantri(row)">
                      {{ saving ? "Menyimpan..." : "Simpan" }}
                    </button>
                    <button type="button" class="action-link muted" @click="cancelEdit">
                      Batal
                    </button>
                  </template>
                  <button v-else-if="canEdit(row)" type="button" class="action-link" @click="startEdit(row)">
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
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useToast, useConfirm } from "@/composables/useToast";

const { success, error: showError, warning } = useToast();
const { confirm } = useConfirm();

const props = defineProps({
  title: { type: String, default: "Kelola Santri" },
  subtitle: { type: String, default: "Lihat, tambah, dan tetapkan Jilid / Marhalah santri" },
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
    const ok = await confirm(`Apakah Anda yakin ingin menghapus santri "${row.name}"?`, {
      title: "Hapus Santri",
      type: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });
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
  classes.value.filter((c) => ["1", "2", "3", "4", "5", "6"].includes(String(c.id))),
);
const marhalahList = computed(() =>
  classes.value.filter((c) => !["1", "2", "3", "4", "5", "6"].includes(String(c.id))),
);

const levelName = (classId) => {
  if (!classId) return "Belum ditentukan";
  const found = classes.value.find((c) => String(c.id) === String(classId));
  return found ? found.name : `Jilid / Marhalah ${classId}`;
};

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return santri.value.filter((row) => {
    if (q && !String(row.name || "").toLowerCase().includes(q)) return false;
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

const fetchData = async () => {
  loading.value = true;
  listError.value = "";
  try {
    const [santriRes, classesRes] = await Promise.all([
      api.get("/santri"),
      api.get("/classes"),
    ]);
    santri.value = santriRes.data;
    classes.value = classesRes.data;
  } catch (error) {
    listError.value = error.response?.data?.error || "Gagal memuat data santri.";
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
    const msg = error.response?.data?.error || "Gagal menyimpan perubahan santri.";
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
  gap: var(--space-md);
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
  margin-bottom: 6px;
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
.roster-toolbar h2 {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
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
  background: linear-gradient(135deg, rgba(240, 253, 244, 0.95) 0%, rgba(255, 255, 255, 0.95) 100%);
  border: 1px solid rgba(134, 239, 172, 0.5);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.05);
}
.info-note-content {
  display: flex;
  align-items: center;
  gap: 14px;
}
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
.editing-name-input {
  min-width: 140px;
  max-width: 260px;
}
</style>