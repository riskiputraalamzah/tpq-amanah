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
      <section class="glass-card">
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
        </div>

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
                <td>{{ row.name }}</td>
                <td>
                  <template v-if="editingId === row.id">
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
                <td>{{ row.status || "-" }}</td>
                <td>
                  <template v-if="editingId === row.id">
                    <button type="button" class="action-link" :disabled="saving" @click="saveLevel(row)">
                      {{ saving ? "Menyimpan..." : "Simpan" }}
                    </button>
                    <button type="button" class="action-link muted" @click="cancelEdit">
                      Batal
                    </button>
                  </template>
                  <button v-else-if="canEdit(row)" type="button" class="action-link" @click="startEdit(row)">
                    Ubah
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

const props = defineProps({
  title: { type: String, default: "Kelola Santri" },
  subtitle: { type: String, default: "Lihat, tambah, dan tetapkan Jilid / Marhalah santri" },
  adminMode: { type: Boolean, default: false },
});

const authStore = useAuthStore();
const currentUserId = computed(() => authStore.user?.id || "");

const canEdit = (row) =>
  props.adminMode || (!!row.createdBy && row.createdBy === currentUserId.value);

const loading = ref(true);
const adding = ref(false);
const saving = ref(false);
const santri = ref([]);
const classes = ref([]);
const search = ref("");
const levelFilter = ref("");
const newName = ref("");
const newLevel = ref("");
const formMessage = ref("");
const formOk = ref(false);
const listError = ref("");
const editingId = ref(null);
const editingLevel = ref("");

const removeSantri = async (row) => {
  if (!confirm("Hapus " + row.name + " dari data santri?")) return;
  listError.value = "";
  try {
    await api.delete("/santri/" + row.id);
    santri.value = santri.value.filter((item) => item.id !== row.id);
  } catch (error) {
    listError.value = error.response?.data?.error || "Gagal menghapus data santri.";
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
    if (levelFilter.value === "__none") return !row.currentClassId;
    if (levelFilter.value) return String(row.currentClassId || "") === levelFilter.value;
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
  if (!newName.value.trim() || adding.value) return;
  adding.value = true;
  formMessage.value = "";
  try {
    const payload = { name: newName.value.trim() };
    if (newLevel.value) payload.currentClassId = newLevel.value;
    const res = await api.post("/santri", payload);
    if (!res.data.alreadyExists) {
      santri.value.push(res.data);
    }
    formOk.value = true;
    formMessage.value = res.data.alreadyExists
      ? "Santri dengan nama ini sudah terdaftar."
      : "Santri berhasil ditambahkan.";
    newName.value = "";
    newLevel.value = "";
  } catch (error) {
    formOk.value = false;
    formMessage.value = error.response?.data?.error || "Gagal menambahkan santri.";
  } finally {
    adding.value = false;
  }
};

const startEdit = (row) => {
  editingId.value = row.id;
  editingLevel.value = row.currentClassId ? String(row.currentClassId) : "";
  listError.value = "";
};

const cancelEdit = () => {
  editingId.value = null;
  editingLevel.value = "";
};

const saveLevel = async (row) => {
  if (saving.value) return;
  saving.value = true;
  try {
    await api.put(`/santri/${row.id}`, { currentClassId: editingLevel.value || null });
    row.currentClassId = editingLevel.value || null;
    editingId.value = null;
    editingLevel.value = "";
  } catch (error) {
    listError.value = error.response?.data?.error || "Gagal menyimpan Jilid / Marhalah.";
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
    grid-template-columns: 2fr 1fr;
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
</style>