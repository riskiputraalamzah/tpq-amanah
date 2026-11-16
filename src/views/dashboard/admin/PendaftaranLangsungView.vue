<template>
  <div class="dl" :class="{ 'is-guru': !isAdmin }">
    <router-link to="/dashboard/pendaftaran" class="dl-back"
      ><span aria-hidden="true">←</span> Pendaftaran</router-link
    >

    <!-- ============ done ============ -->
    <section v-if="done" class="dl-done" aria-live="polite">
      <div class="dl-done-mark" aria-hidden="true">
        <LineIcon name="check" :size="30" :stroke="2.4" />
      </div>
      <p class="dl-eyebrow">Terdaftar &amp; diterima</p>
      <h1>{{ done.santri?.name || done.childName }}</h1>
      <dl class="dl-done-facts">
        <div>
          <dt>Nomor induk</dt>
          <dd>{{ done.santri?.nomorInduk || "-" }}</dd>
        </div>
        <div>
          <dt>Kelas</dt>
          <dd>
            {{ levelName(done.classId) }} ·
            {{ done.sesi === "malam" ? "Malam" : "Sore" }}
          </dd>
        </div>
        <div>
          <dt>No. pendaftaran</dt>
          <dd>{{ done.number }}</dd>
        </div>
      </dl>
      <p class="dl-done-note">
        Data ananda tercatat <strong>terverifikasi</strong>. Wali bisa langsung
        masuk ke portal wali dengan nomor
        <strong>{{ displayPhone(done.phone) }}</strong
        >, ananda sudah tertaut.
        <template v-if="doneMessage"> {{ doneMessage }}</template>
      </p>
      <div class="dl-done-actions">
        <button type="button" class="dl-btn dl-btn-primary" @click="startOver">
          <LineIcon name="plus" :size="17" /> Daftarkan santri lain
        </button>
        <router-link
          :to="`/dashboard/pendaftaran?id=${done.id}`"
          class="dl-btn dl-btn-ghost"
          >Lihat data pendaftaran</router-link
        >
      </div>
    </section>

    <!-- ============ the form ============ -->
    <template v-else>
      <header class="dl-head">
        <h1>Daftarkan santri langsung</h1>
        <p>
          Untuk wali yang datang langsung. Santri
          <strong>langsung diterima</strong>, mendapat nomor induk, dan datanya
          tercatat terverifikasi tanpa jadwal penempatan.
        </p>
      </header>

      <form ref="formEl" class="dl-grid" novalidate @submit.prevent="submit">
        <div class="dl-main">
          <section
            v-for="(s, i) in SECTIONS"
            :key="s.key"
            class="dl-card"
            :aria-labelledby="`dl-s-${s.key}`"
          >
            <header class="dl-card-head">
              <span class="dl-num" aria-hidden="true">{{ i + 1 }}</span>
              <div>
                <h2 :id="`dl-s-${s.key}`">
                  {{ s.title
                  }}<span v-if="s.optional" class="dl-opt">opsional</span>
                </h2>
                <p v-if="s.hint">{{ s.hint }}</p>
              </div>
            </header>

            <div class="dl-fields">
              <template v-for="field in s.fields" :key="field.path">
                <div
                  v-if="isShown(field, form)"
                  class="dl-field"
                  :class="{ 'is-half': field.half, 'is-sub': field.when }"
                  :data-path="field.path"
                >
                  <span
                    v-if="['chips', 'cards'].includes(field.type)"
                    :id="idOf(field)"
                    class="dl-label"
                  >
                    {{ field.label
                    }}<span
                      v-if="field.required"
                      class="dl-req"
                      aria-hidden="true"
                      >*</span
                    >
                  </span>
                  <label v-else :for="idOf(field)" class="dl-label">
                    {{ field.label
                    }}<span
                      v-if="field.required"
                      class="dl-req"
                      aria-hidden="true"
                      >*</span
                    >
                  </label>

                  <div
                    v-if="field.type === 'chips'"
                    class="dl-chips"
                    role="radiogroup"
                    :aria-labelledby="idOf(field)"
                  >
                    <button
                      v-for="o in OPTIONS[field.options]"
                      :key="o.value"
                      type="button"
                      role="radio"
                      class="dl-chip"
                      :aria-checked="value(field) === o.value"
                      @click="set(field, o.value)"
                    >
                      {{ o.label }}
                    </button>
                  </div>

                  <div
                    v-else-if="field.type === 'cards'"
                    class="dl-cards"
                    role="radiogroup"
                    :aria-labelledby="idOf(field)"
                  >
                    <button
                      v-for="o in OPTIONS[field.options]"
                      :key="o.value"
                      type="button"
                      role="radio"
                      class="dl-choice"
                      :aria-checked="value(field) === o.value"
                      @click="set(field, o.value)"
                    >
                      <strong
                        >{{ o.label
                        }}<span
                          v-if="field.recommend && suggested === o.value"
                          class="dl-badge"
                          >Disarankan</span
                        ></strong
                      >
                      <span>{{ o.sub }}</span>
                    </button>
                  </div>

                  <select
                    v-else-if="field.type === 'select'"
                    :id="idOf(field)"
                    class="dl-input"
                    :value="value(field)"
                    @change="set(field, $event.target.value)"
                  >
                    <option value="">Pilih…</option>
                    <option
                      v-for="o in OPTIONS[field.options]"
                      :key="o.value"
                      :value="o.value"
                    >
                      {{ o.label }}
                    </option>
                  </select>

                  <textarea
                    v-else-if="field.type === 'textarea'"
                    :id="idOf(field)"
                    class="dl-input"
                    rows="3"
                    :maxlength="field.max"
                    :placeholder="field.placeholder || ''"
                    :value="value(field)"
                    @input="set(field, $event.target.value)"
                  ></textarea>

                  <input
                    v-else
                    :id="idOf(field)"
                    class="dl-input"
                    :class="{ 'is-invalid': errors[field.path] }"
                    :type="
                      field.type === 'date'
                        ? 'date'
                        : field.type === 'phone'
                          ? 'tel'
                          : 'text'
                    "
                    :inputmode="
                      ['digits', 'id16'].includes(field.type)
                        ? 'numeric'
                        : field.type === 'phone'
                          ? 'tel'
                          : undefined
                    "
                    :maxlength="field.max || undefined"
                    :max="field.type === 'date' ? today : undefined"
                    autocomplete="off"
                    :autocapitalize="
                      /nama/i.test(field.path) ? 'words' : undefined
                    "
                    :placeholder="
                      field.placeholder ||
                      (field.type === 'phone' ? '0812 3456 7890' : '')
                    "
                    :aria-invalid="!!errors[field.path]"
                    :aria-describedby="
                      errors[field.path] ? `${idOf(field)}-err` : undefined
                    "
                    :value="value(field)"
                    @input="set(field, $event.target.value)"
                  />

                  <span
                    v-if="
                      field.type === 'date' &&
                      age !== null &&
                      !errors[field.path]
                    "
                    class="dl-help"
                    >Usia ananda sekarang {{ age }} tahun.</span
                  >
                  <span v-else-if="field.help" class="dl-help">{{
                    field.help
                  }}</span>
                  <span
                    v-if="errors[field.path]"
                    :id="`${idOf(field)}-err`"
                    class="dl-error"
                    role="alert"
                    >{{ errors[field.path] }}</span
                  >
                </div>
              </template>
            </div>
          </section>
        </div>

        <!-- placement and save: beside the form on wide screens, after it on phones -->
        <aside
          ref="sideEl"
          class="dl-side"
          :style="{ '--side-top': `${sideTop}px` }"
        >
          <section class="dl-card is-place" aria-labelledby="dl-place">
            <header class="dl-card-head">
              <span class="dl-num" aria-hidden="true">{{
                SECTIONS.length + 1
              }}</span>
              <div>
                <h2 id="dl-place">Penempatan</h2>
                <p>Langsung masuk Kelola Santri di kelas ini.</p>
              </div>
            </header>

            <div class="dl-field" data-path="classId">
              <span id="dl-class" class="dl-label"
                >Jilid / Marhalah<span class="dl-req" aria-hidden="true"
                  >*</span
                ></span
              >
              <div
                class="dl-chips is-levels"
                role="radiogroup"
                aria-labelledby="dl-class"
              >
                <button
                  v-for="c in CLASSES"
                  :key="c"
                  type="button"
                  role="radio"
                  class="dl-chip"
                  :aria-checked="place.classId === c"
                  @click="setPlace('classId', c)"
                >
                  {{ levelName(c) }}
                </button>
              </div>
              <span v-if="errors.classId" class="dl-error" role="alert">{{
                errors.classId
              }}</span>
            </div>

            <div class="dl-field" data-path="sesi">
              <span id="dl-sesi" class="dl-label"
                >Sesi<span class="dl-req" aria-hidden="true">*</span></span
              >
              <div class="dl-chips" role="radiogroup" aria-labelledby="dl-sesi">
                <button
                  v-for="o in OPTIONS.sesi"
                  :key="o.value"
                  type="button"
                  role="radio"
                  class="dl-chip"
                  :aria-checked="place.sesi === o.value"
                  @click="setPlace('sesi', o.value)"
                >
                  {{ o.label }}
                </button>
              </div>
              <span v-if="errors.sesi" class="dl-error" role="alert">{{
                errors.sesi
              }}</span>
            </div>

            <fieldset class="dl-pay">
              <legend class="dl-label">Sudah dibayar</legend>
              <label v-for="p in PAYMENTS" :key="p.key" class="dl-check">
                <input v-model="place.payments[p.key]" type="checkbox" />
                <span>{{ p.label }}</span
                ><span class="dl-amount">{{ p.amount }}</span>
              </label>
            </fieldset>

            <!-- the child may be listed already -->
            <div v-if="dupes" class="dl-dupes" role="alert">
              <template v-if="dupes.duplicates.length">
                <strong>Ananda mungkin sudah ada di Kelola Santri</strong>
                <label
                  v-for="d in dupes.duplicates"
                  :key="d.id"
                  class="dl-radio"
                >
                  <input v-model="dupeChoice" type="radio" :value="d.id" />
                  <span
                    >Ini santri yang sama: <strong>{{ d.name }}</strong> ({{
                      levelName(d.classId) || "tanpa jilid"
                    }}<template v-if="d.nomorInduk"
                      >, {{ d.nomorInduk }}</template
                    ><template v-if="d.birthDate"
                      >, lahir {{ longDate(d.birthDate) }}</template
                    >)</span
                  >
                </label>
                <label class="dl-radio">
                  <input v-model="dupeChoice" type="radio" value="__new" />
                  <span>Anak yang berbeda, buat santri baru</span>
                </label>
              </template>
              <template v-if="dupes.openRegistrations.length">
                <strong
                  >{{
                    dupes.duplicates.length ? "Juga ada" : "Ada"
                  }}
                  pendaftaran online untuk anak ini</strong
                >
                <p
                  v-for="o in dupes.openRegistrations"
                  :key="o.id"
                  class="dl-dupe-reg"
                >
                  {{ o.number }} · {{ o.childName }} ·
                  <router-link :to="`/dashboard/pendaftaran?id=${o.id}`"
                    >buka &amp; terima dari sana</router-link
                  >
                </p>
                <label v-if="!dupes.duplicates.length" class="dl-radio">
                  <input v-model="dupeChoice" type="radio" value="__new" />
                  <span>Tetap daftarkan langsung di sini</span>
                </label>
              </template>
            </div>

            <label class="dl-check is-agree" data-path="agreed">
              <input v-model="agreed" type="checkbox" />
              <span
                >Wali sudah membaca dan menyetujui
                <strong>syarat &amp; ketentuan</strong> serta penggunaan data,
                dan data di atas sudah dicek bersama wali.</span
              >
            </label>
            <span v-if="errors.agreed" class="dl-error" role="alert">{{
              errors.agreed
            }}</span>

            <label class="dl-check">
              <input v-model="notifyParent" type="checkbox" />
              <span
                >Kirim pesan sambutan ke WhatsApp wali<template v-if="phoneOk">
                  ({{ displayPhone(normalizePhone(form.kontak.wa)) }})</template
                ></span
              >
            </label>

            <button
              type="submit"
              class="dl-btn dl-btn-primary dl-submit"
              :disabled="busy || (dupes && !dupeChoice)"
            >
              {{ busy ? "Menyimpan…" : submitLabel }}
            </button>
            <p v-if="errorCount" class="dl-error-sum" role="status">
              {{ errorCount }} isian perlu diperbaiki.
            </p>
          </section>
        </aside>
      </form>
    </template>
  </div>
</template>

<script setup>
// "Daftarkan langsung": the admin, or a guru with the Pendaftaran access, registers a family at the desk with the
// same form as the online one. One way - the child is accepted at once (POST /pendaftaran/admin/direct).
import { ref, computed, watch, nextTick } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/composables/useToast";
import { useDialog } from "@/composables/useDialog";
import { useStickySide } from "@/composables/useStickySide";
import LineIcon from "@/components/LineIcon.vue";
import {
  STEPS,
  OPTIONS,
  getPath,
  setPath,
  isShown,
  fieldError,
  emptyForm,
  ageOn,
  recommendedSesi,
  normalizePhone,
  displayPhone,
  longDate,
  levelName,
} from "@/utils/pendaftaran";

const toast = useToast();
const { ask } = useDialog();
const isAdmin = computed(() => useAuthStore().user?.role === "admin");

const CLASSES = ["1", "2", "3", "4", "5", "6", "7"];
const PAYMENTS = [
  { key: "daftarUlang", label: "Daftar ulang", amount: "Rp35.000" },
  { key: "bukuPrestasi", label: "Buku Prestasi", amount: "Rp5.000" },
  { key: "bukuTartil", label: "Buku Tartil", amount: "Rp13.000" },
];
const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const step = (key) => STEPS.find((s) => s.key === key);

// the online form's steps, plus the parent's number (the online form takes it from the login) and NIK/KK
const PHONE_FIELD = {
  path: "kontak.wa",
  label: "Nomor WhatsApp wali",
  type: "phone",
  required: true,
  help: "Dipakai wali untuk masuk ke portal wali; ananda langsung tertaut ke nomor ini.",
};
const IDENTITY = {
  key: "identitas",
  title: "NIK & Kartu Keluarga",
  hint: "Isi bila wali membawa KK. Bila dikosongkan, wali diminta melengkapinya lewat portal.",
  optional: true,
  fields: [
    {
      path: "identitas.nik",
      label: "NIK ananda",
      type: "id16",
      max: 16,
      half: true,
      placeholder: "16 digit",
    },
    {
      path: "identitas.noKK",
      label: "Nomor KK",
      type: "id16",
      max: 16,
      half: true,
      placeholder: "16 digit",
    },
  ],
};
const SECTIONS = [
  step("ananda"),
  step("mengaji"),
  step("ortu"),
  {
    ...step("alamat"),
    fields: step("alamat").fields.flatMap((f) =>
      f.path === "kontak.pemilik"
        ? [
            PHONE_FIELD,
            { ...f, showPhone: false, label: "Nomor WhatsApp di atas milik" },
          ]
        : [f],
    ),
  },
  IDENTITY,
  step("tambahan"),
];
const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

const blank = () => {
  const data = emptyForm();
  delete data.persetujuan;
  setPath(data, "alamat.desa", "Sawotratap");
  setPath(data, "alamat.kecamatan", "Gedangan");
  setPath(data, "alamat.kabupaten", "Sidoarjo");
  setPath(data, "kontak.wa", "");
  data.identitas = { nik: "", noKK: "" };
  return data;
};
const form = ref(blank());
const place = ref({
  classId: "",
  sesi: "",
  payments: { daftarUlang: false, bukuPrestasi: false, bukuTartil: false },
});
const sesiTouched = ref(false);
const agreed = ref(false);
const notifyParent = ref(true);
const errors = ref({});
const busy = ref(false);
const done = ref(null);
const dirty = ref(false);
const dupes = ref(null);
const dupeChoice = ref("");
const formEl = ref(null);
const sideEl = ref(null);
const sideTop = useStickySide(sideEl);

const age = computed(() => ageOn(getPath(form.value, "santri.tanggalLahir")));
const suggested = computed(() =>
  recommendedSesi(getPath(form.value, "santri.tanggalLahir")),
);
const phoneOk = computed(() =>
  /^62\d{8,13}$/.test(normalizePhone(getPath(form.value, "kontak.wa"))),
);
const errorCount = computed(() => Object.keys(errors.value).length);
const childName = computed(() =>
  String(getPath(form.value, "santri.namaLengkap") || "").trim(),
);
const submitLabel = computed(() => {
  const merge = dupes.value?.duplicates.find((d) => d.id === dupeChoice.value);
  if (merge)
    return `Gabungkan & terima di ${levelName(place.value.classId) || "…"}`;
  return place.value.classId
    ? `Daftarkan & terima di ${levelName(place.value.classId)}`
    : "Daftarkan & terima";
});

const idOf = (field) => `dl-${field.path.replace(/\./g, "-")}`;
const value = (field) => getPath(form.value, field.path) ?? "";

const errorOf = (field, v) => {
  if (field.type === "id16") {
    const s = String(v || "").replace(/\s+/g, "");
    return s && !/^\d{16}$/.test(s)
      ? `${field.label} harus 16 digit angka`
      : "";
  }
  return fieldError(field, v, form.value);
};

function set(field, v) {
  setPath(
    form.value,
    field.path,
    field.type === "id16" ? String(v).replace(/\D/g, "").slice(0, 16) : v,
  );
  dirty.value = true;
  if (errors.value[field.path]) {
    const e = errorOf(field, getPath(form.value, field.path));
    const next = { ...errors.value };
    if (e) next[field.path] = e;
    else delete next[field.path];
    errors.value = next;
  }
}

function setPlace(key, v) {
  place.value[key] = v;
  if (key === "sesi") sesiTouched.value = true;
  dirty.value = true;
  if (errors.value[key]) {
    const next = { ...errors.value };
    delete next[key];
    errors.value = next;
  }
}

// the sesi asked in "Mengaji & sesi" is the placement sesi, unless the staff picks another one
watch(
  () => getPath(form.value, "riwayat.sesi"),
  (v) => {
    if (!sesiTouched.value && v) place.value.sesi = v;
  },
);
// another name or birth date: the duplicate check starts again
watch(
  () => [
    getPath(form.value, "santri.namaLengkap"),
    getPath(form.value, "santri.tanggalLahir"),
  ],
  () => {
    dupes.value = null;
    dupeChoice.value = "";
  },
);
watch(agreed, () => {
  if (errors.value.agreed) {
    const next = { ...errors.value };
    delete next.agreed;
    errors.value = next;
  }
});

function check() {
  const out = {};
  for (const f of ALL_FIELDS) {
    const e = errorOf(f, getPath(form.value, f.path));
    if (e) out[f.path] = e;
  }
  if (!place.value.classId) out.classId = "Pilih jilid penempatan";
  if (!place.value.sesi) out.sesi = "Pilih sesi";
  if (!agreed.value)
    out.agreed =
      "Pastikan wali sudah menyetujui syarat & ketentuan serta penggunaan data";
  return out;
}

async function showFirstError() {
  await nextTick();
  const first = Object.keys(errors.value)[0];
  const el = formEl.value?.querySelector(`[data-path="${first}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.querySelector("input, select, textarea, button")?.focus({
    preventScroll: true,
  });
}

function payload() {
  const data = JSON.parse(JSON.stringify(form.value));
  const phone = data.kontak.wa;
  delete data.kontak.wa;
  const identity = data.identitas;
  delete data.identitas;
  return {
    data,
    phone,
    identity,
    agreed: agreed.value,
    classId: place.value.classId,
    sesi: place.value.sesi,
    payments: place.value.payments,
    notifyParent: notifyParent.value,
    ...(dupeChoice.value && dupeChoice.value !== "__new"
      ? { existingSantriId: dupeChoice.value }
      : {}),
    ...(dupeChoice.value === "__new" ? { allowDuplicate: true } : {}),
  };
}

async function submit() {
  errors.value = check();
  if (errorCount.value) return showFirstError();
  const merge = dupes.value?.duplicates.find((d) => d.id === dupeChoice.value);
  const where = `${levelName(place.value.classId)} sesi ${place.value.sesi === "malam" ? "Malam" : "Sore"}`;
  const ok = await ask({
    title: merge
      ? `Gabungkan dengan ${merge.name}?`
      : `Daftarkan ${childName.value}?`,
    message: [
      merge
        ? `Data ini disatukan dengan ${merge.name} yang sudah ada di Kelola Santri, lalu ditempatkan di ${where}.`
        : `Langsung masuk Kelola Santri di ${where} dengan nomor induk baru.`,
      merge
        ? "Data ananda yang sudah ada tetap dipakai; wali ini ikut tertaut."
        : "Data ananda tercatat terverifikasi atas nama Anda.",
      notifyParent.value
        ? `Pesan sambutan dikirim ke WhatsApp ${displayPhone(normalizePhone(getPath(form.value, "kontak.wa")))}.`
        : "Tanpa pesan WhatsApp ke wali.",
    ].join(" "),
    confirmText: merge ? "Gabungkan & terima" : "Daftarkan",
  });
  if (!ok) return;
  busy.value = true;
  try {
    const { data } = await api.post("/pendaftaran/admin/direct", payload());
    done.value = data;
    dirty.value = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    document
      .querySelector(".dashboard-main, main")
      ?.scrollTo?.({ top: 0, behavior: "smooth" });
  } catch (err) {
    const res = err.response;
    if (
      res?.status === 409 &&
      (res.data?.duplicates || res.data?.openRegistrations)
    ) {
      dupes.value = {
        duplicates: res.data.duplicates || [],
        openRegistrations: res.data.openRegistrations || [],
      };
      dupeChoice.value = "";
      await nextTick();
      formEl.value
        ?.querySelector(".dl-dupes")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (res?.status === 422 && res.data?.fields) {
      const map = {
        phone: "kontak.wa",
        "identity.nik": "identitas.nik",
        "identity.noKK": "identitas.noKK",
      };
      errors.value = Object.fromEntries(
        Object.entries(res.data.fields).map(([k, v]) => [map[k] || k, v]),
      );
      showFirstError();
    } else {
      toast.error(
        res?.data?.error || "Belum bisa menyimpan. Coba lagi sebentar.",
      );
    }
  } finally {
    busy.value = false;
  }
}

const doneMessage = computed(() => {
  if (!done.value) return "";
  const sent = (done.value.messages || []).some((m) => m.kind === "diterima");
  return sent ? "Pesan sambutan masuk antrean WhatsApp." : "";
});

function startOver() {
  form.value = blank();
  place.value = {
    classId: "",
    sesi: "",
    payments: { daftarUlang: false, bukuPrestasi: false, bukuTartil: false },
  };
  sesiTouched.value = false;
  agreed.value = false;
  notifyParent.value = true;
  errors.value = {};
  dupes.value = null;
  dupeChoice.value = "";
  done.value = null;
  dirty.value = false;
}

onBeforeRouteLeave(async () => {
  if (!dirty.value || done.value) return true;
  return ask({
    title: "Tinggalkan formulir?",
    message: "Isian yang sudah diketik belum disimpan dan akan hilang.",
    confirmText: "Tinggalkan",
    cancelText: "Lanjut mengisi",
    tone: "danger",
  });
});
</script>

<style scoped>
.dl {
  color: #0b3b2a;
}

.dl-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  margin-bottom: 4px;
  color: #0a5c40;
  font-weight: 700;
  text-decoration: none;
}

.dl-head {
  margin-bottom: 16px;
}

.dl-head h1 {
  margin: 0 0 4px;
  font-size: 1.75rem;
  font-weight: 800;
}

.dl-head p {
  max-width: 62ch;
  margin: 0;
  color: #475a50;
  line-height: 1.5;
}

.dl-grid {
  display: grid;
  gap: 16px;
}

@media (min-width: 1100px) {
  .dl-grid {
    grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr);
    align-items: start;
  }

  /* sticky with the page's own scroll (see useStickySide) */
  .dl-side {
    position: sticky;
    top: 12px;
  }
}

.dl-main {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.dl-card {
  padding: 18px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.dl-card.is-place {
  border-color: rgba(10, 92, 64, 0.28);
  box-shadow: 0 8px 24px -16px rgba(11, 59, 42, 0.35);
}

.dl-card-head {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.dl-card-head h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0 2px;
  font-size: 1.08rem;
  font-weight: 800;
}

.dl-card-head p {
  margin: 0;
  font-size: 0.86rem;
  color: #5b6b62;
}

.dl-num {
  flex: none;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: #e3f1ea;
  color: #0a5c40;
  font-weight: 800;
  font-size: 0.9rem;
}

.dl-opt {
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef0ef;
  color: #4b5a52;
  font-size: 0.7rem;
  font-weight: 700;
}

.dl-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 12px;
}

.dl-field {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.dl-field.is-half {
  grid-column: span 1;
}

.is-place .dl-field {
  margin-bottom: 14px;
}

.dl-field.is-sub {
  padding-left: 12px;
  border-left: 3px solid #e3f1ea;
}

.dl-label {
  font-size: 0.86rem;
  font-weight: 700;
  color: #1f3a2f;
}

.dl-req {
  margin-left: 2px;
  color: #b42318;
}

.dl-input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 11px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  color: #0b3b2a;
  box-sizing: border-box;
}

textarea.dl-input {
  padding: 10px 12px;
  resize: vertical;
}

.dl-input:focus {
  outline: none;
  border-color: #0a5c40;
  box-shadow: 0 0 0 3px rgba(10, 92, 64, 0.15);
}

.dl-input.is-invalid {
  border-color: #b42318;
}

.dl-help {
  font-size: 0.8rem;
  color: #5b6b62;
}

.dl-error {
  font-size: 0.8rem;
  font-weight: 600;
  color: #b42318;
}

.dl-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dl-chips.is-levels {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.dl-chip {
  min-height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1f3a2f;
  cursor: pointer;
}

.is-levels .dl-chip {
  padding: 0 6px;
  border-radius: 11px;
}

.dl-chip[aria-checked="true"] {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.dl-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.dl-choice {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  text-align: left;
  color: #1f3a2f;
  cursor: pointer;
}

.dl-choice strong {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.92rem;
}

.dl-choice span {
  font-size: 0.8rem;
  color: #5b6b62;
}

.dl-choice[aria-checked="true"] {
  border-color: #0a5c40;
  background: #f0f8f4;
  box-shadow: inset 0 0 0 1px #0a5c40;
}

.dl-badge {
  padding: 1px 7px;
  border-radius: 999px;
  background: #fef3c7;
  color: #7c3a0d !important;
  font-size: 0.68rem !important;
  font-weight: 700;
}

.dl-pay {
  margin: 0 0 14px;
  padding: 0;
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dl-pay legend {
  margin-bottom: 6px;
}

.dl-check,
.dl-radio {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 40px;
  padding: 8px 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: #1f3a2f;
  cursor: pointer;
}

.dl-check input,
.dl-radio input {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  accent-color: #0a5c40;
}

.dl-amount {
  margin-left: auto;
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
}

.dl-check.is-agree {
  margin-top: 4px;
  padding: 12px;
  border-radius: 12px;
  background: #f6f8f7;
}

.dl-dupes {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fffbeb;
  border: 1px solid #fcd9a1;
  font-size: 0.88rem;
}

.dl-dupes > strong {
  color: #7c3a0d;
}

.dl-dupe-reg {
  margin: 2px 0 6px;
}

.dl-dupe-reg a {
  color: #0a5c40;
  font-weight: 700;
}

.dl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 0;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.dl-btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #0a5c40, #053d2c);
}

.dl-btn-ghost {
  color: #0b3b2a;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.22);
}

.dl-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dl-submit {
  width: 100%;
  min-height: 50px;
  margin-top: 10px;
  font-size: 1rem;
}

.dl-error-sum {
  margin: 8px 0 0;
  text-align: center;
  font-size: 0.82rem;
  font-weight: 600;
  color: #b42318;
}

.dl-chip:focus-visible,
.dl-choice:focus-visible,
.dl-btn:focus-visible,
.dl-back:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

/* done */
.dl-done {
  max-width: 560px;
  margin: 12px auto 0;
  padding: 28px 22px;
  border-radius: 22px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
  text-align: center;
}

.dl-done-mark {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  border-radius: 999px;
  background: #e3f1ea;
  color: #0a5c40;
}

.dl-eyebrow {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0a5c40;
}

.dl-done h1 {
  margin: 4px 0 16px;
  font-size: 1.6rem;
  font-weight: 800;
}

.dl-done-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0 0 16px;
  border-radius: 14px;
  background: #f6f8f7;
  overflow: hidden;
}

.dl-done-facts div {
  padding: 12px 8px;
}

.dl-done-facts div + div {
  border-left: 1px solid rgba(11, 59, 42, 0.08);
}

.dl-done-facts dt {
  font-size: 0.74rem;
  color: #5b6b62;
}

.dl-done-facts dd {
  margin: 2px 0 0;
  font-weight: 800;
  font-size: 0.92rem;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.dl-done-note {
  margin: 0 0 18px;
  color: #3b4a42;
  line-height: 1.55;
}

.dl-done-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 560px) {
  .dl-head h1 {
    font-size: 1.45rem;
  }
  .dl-card {
    padding: 16px 14px;
  }
  .dl-fields,
  .dl-cards {
    grid-template-columns: minmax(0, 1fr);
  }
  .dl-field.is-half {
    grid-column: 1 / -1;
  }
  .dl-done-facts {
    grid-template-columns: minmax(0, 1fr);
  }
  .dl-done-facts div + div {
    border-left: 0;
    border-top: 1px solid rgba(11, 59, 42, 0.08);
  }
  .dl-done-actions .dl-btn {
    width: 100%;
  }
}
</style>
