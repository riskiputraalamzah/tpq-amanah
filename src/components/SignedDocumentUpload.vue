<template>
  <section class="glass-card signed-card" data-testid="signed-upload">
    <h2>Dokumen Bertanda Tangan</h2>
    <div class="signed-row">
      <label for="signed-type">Jenis dokumen</label>
      <select id="signed-type" v-model="docType" class="form-input">
        <option value="sptjm">SPTJM</option>
        <option value="journal">Jurnal</option>
        <option value="teacher-attendance">Absensi Guru</option>
        <option value="student-attendance">Absensi Santri</option>
      </select>
    </div>
    <div v-if="loading" class="text-muted">Memuat versi...</div>
    <div v-else-if="listError" class="alert alert-error">{{ listError }}</div>
    <div v-else class="text-muted signed-status" data-testid="signed-status">
      <span v-if="current">Versi saat ini: V{{ current.version }} ({{ current.originalFilename }})</span>
      <span v-else>Belum ada dokumen bertanda tangan.</span>
      <span v-if="versions.length > 1"> | Riwayat: {{ versions.map((v) => `V${v.version}`).join(", ") }}</span>
    </div>
    <div class="signed-row">
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" :disabled="uploading" @change="onFile" />
      <button type="button" class="btn btn-primary" :disabled="!file || uploading" @click="upload">
        {{ uploading ? "Mengunggah..." : "Unggah Scan Bertanda Tangan" }}
      </button>
    </div>
    <p class="text-muted file-hint">PDF/JPG/PNG, maks 5 MB. Hanya admin.</p>
    <div v-if="message" class="alert mt-4" :class="ok ? `alert-success` : `alert-error`" data-testid="signed-result">{{ message }}</div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import api from "@/services/api";

const props = defineProps({ reportId: { type: String, required: true } });

const docType = ref("sptjm");
const versions = ref([]);
const current = ref(null);
const loading = ref(false);
const listError = ref("");
const file = ref(null);
const uploading = ref(false);
const message = ref("");
const ok = ref(false);

const toBase64 = (f) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1]);
  reader.onerror = reject;
  reader.readAsDataURL(f);
});

const fetchVersions = async () => {
  loading.value = true;
  listError.value = "";
  try {
    const res = await api.get(`/ljp/reports/${props.reportId}/documents/${docType.value}/signed`);
    versions.value = res.data?.versions || [];
    current.value = res.data?.current || null;
  } catch (e) {
    listError.value = e.response?.data?.error || "Gagal memuat versi dokumen bertanda tangan.";
  } finally {
    loading.value = false;
  }
};

const onFile = (e) => {
  message.value = "";
  const f = e.target.files?.[0];
  if (!f) { file.value = null; return; }
  if (f.size > 5 * 1024 * 1024) {
    ok.value = false;
    message.value = "Ukuran file melebihi 5 MB.";
    file.value = null;
    return;
  }
  file.value = f;
};

const upload = async () => {
  if (!file.value) return;
  uploading.value = true;
  message.value = "";
  try {
    const data = await toBase64(file.value);
    const res = await api.post(`/ljp/reports/${props.reportId}/documents/${docType.value}/signed`, {
      filename: file.value.name,
      contentType: file.value.type,
      data,
    });
    ok.value = true;
    message.value = `Unggahan V${res.data?.signed?.version} berhasil.`;
    file.value = null;
    await fetchVersions();
  } catch (e) {
    ok.value = false;
    message.value = e.response?.data?.error || "Gagal mengunggah dokumen.";
  } finally {
    uploading.value = false;
  }
};

watch(docType, fetchVersions);
onMounted(fetchVersions);
</script>

<style scoped>
.signed-card { margin-top: 1rem; }
.signed-row { display: flex; gap: 0.75rem; align-items: center; margin-top: 0.75rem; flex-wrap: wrap; }
.signed-status { margin-top: 0.5rem; }
.file-hint { margin-top: 0.5rem; font-size: 0.85rem; }
</style>
