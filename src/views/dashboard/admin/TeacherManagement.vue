<template>
  <div class="pp tm">
    <header class="pp-head">
      <div>
        <h1>Kelola Pengajar</h1>
        <p>Data guru untuk dokumen SPTJM &amp; LPJ, dan jilid yang diampu. Username, password, dan hapus akun ada di <router-link to="/dashboard/users">Akun Pengguna</router-link>.</p>
      </div>
      <router-link :to="{ path: '/dashboard/users', query: { tambah: 'guru' } }" class="pp-btn pp-btn-primary">
        <LineIcon name="plus" :size="17" /> Tambah guru
      </router-link>
    </header>

    <div v-if="teachers.length" class="pp-tools">
      <div class="pp-chips" role="group" aria-label="Saring guru">
        <button type="button" class="pp-chip" :aria-pressed="filter === ''" @click="filter = ''">Semua<span>{{ teachers.length }}</span></button>
        <button v-if="noNik.length" type="button" class="pp-chip is-warn" :aria-pressed="filter === 'nik'" @click="filter = 'nik'">NIK belum diisi<span>{{ noNik.length }}</span></button>
        <button v-if="noJilid.length" type="button" class="pp-chip is-warn" :aria-pressed="filter === 'jilid'" @click="filter = 'jilid'">Jilid belum ditetapkan<span>{{ noJilid.length }}</span></button>
      </div>
      <label class="pp-search">
        <span class="sr-only">Cari guru</span>
        <input v-model="search" class="pp-input" type="search" placeholder="Cari nama guru" />
      </label>
    </div>

    <!-- the jilid set here decides who verifies the wali's data and who hears about it first -->
    <p v-if="!loading && noJilid.length" class="pp-note is-warn" role="status">
      <strong>{{ noJilid.length }} guru belum ditetapkan jilidnya.</strong> Mereka belum bisa memverifikasi data wali santri, dan kabar
      data wali dari jilid itu langsung ke admin. Tekan <strong>Atur jilid</strong> pada guru tersebut.
    </p>

    <ul v-if="loading" class="pp-list" aria-label="Memuat guru"><li v-for="i in 4" :key="i" class="pp-skeleton"></li></ul>
    <p v-else-if="loadError" class="pp-note is-danger" role="alert">{{ loadError }}</p>
    <p v-else-if="!teachers.length" class="pp-empty">Belum ada guru. Tekan <strong>Tambah guru</strong> untuk membuat akunnya.</p>
    <p v-else-if="!shown.length" class="pp-empty">Tidak ada guru yang cocok.</p>
    <ul v-else class="pp-list" aria-label="Daftar guru">
      <li v-for="t in shown" :key="t.id" class="pp-row">
        <img v-if="t.photoURL" :src="t.photoURL" alt="" class="pp-avatar" />
        <span v-else class="pp-avatar" aria-hidden="true">{{ initials(t.displayName) }}</span>
        <div class="pp-main">
          <span class="pp-name">{{ t.displayName }}</span>
          <span class="pp-sub">{{ t.position || 'Pengajar' }} · @{{ t.username || '-' }}</span>
          <!-- jilid diampu: set by the admin, else taken from the KBM -->
          <span v-if="scopeOf(t).source === 'admin'" class="pp-tags" aria-label="Jilid diampu">
            <span v-for="id in scopeOf(t).classIds" :key="id" class="pp-pill is-guru">{{ levelName(id) }}</span>
          </span>
          <span v-else-if="scopeOf(t).source === 'kbm'" class="pp-sub is-warn">Jilid belum ditetapkan · dari KBM: {{ scopeOf(t).classIds.map(levelName).join(', ') }}</span>
          <span v-else-if="scopesLoaded" class="pp-sub is-warn">Jilid belum ditetapkan, belum ada KBM</span>
          <span v-if="scopeOf(t).unassignedTaught?.length" class="pp-sub is-warn">Ada KBM di {{ scopeOf(t).unassignedTaught.map(levelName).join(', ') }} tapi belum ditetapkan</span>
          <span class="pp-tags">
            <span class="pp-pill" :class="t.nik ? 'is-ok' : 'is-warn'">{{ t.nik ? 'NIK lengkap' : 'NIK belum diisi' }}</span>
          </span>
        </div>
        <div class="pp-actions">
          <button type="button" class="pp-btn pp-btn-ghost" :aria-label="`Atur jilid ${t.displayName}`" @click="openJilid(t)">Atur jilid</button>
          <button type="button" class="pp-btn pp-btn-ghost" :aria-label="`Ubah data ${t.displayName}`" @click="openEdit(t)">Ubah data</button>
        </div>
      </li>
    </ul>

    <!-- jilid diampu -->
    <Teleport to="body">
      <div v-if="jilidFor" class="pp-overlay" @click.self="jilidFor = null" @keydown.esc="jilidFor = null">
        <div class="pp-sheet" role="dialog" aria-modal="true" aria-labelledby="tm-jilid-title">
          <span class="pp-grab" aria-hidden="true"></span>
          <div class="pp-sheet-head">
            <div>
              <h3 id="tm-jilid-title">Jilid yang diampu</h3>
              <p>{{ jilidFor.displayName }}. Menentukan santri yang guru ini lihat dan kelola, data wali yang ia verifikasi, dan kabar WA data wali yang ia terima lebih dulu.</p>
            </div>
            <button type="button" class="pp-close" aria-label="Tutup" @click="jilidFor = null"><LineIcon name="x" :size="18" /></button>
          </div>
          <div class="pp-choices" role="group" aria-label="Pilih jilid">
            <button v-for="c in CLASS_OPTIONS" :key="c.value" type="button" class="pp-choice" :aria-pressed="jilidPick.includes(c.value)" @click="toggleJilid(c.value)">{{ c.label }}</button>
          </div>
          <div v-if="scopeOf(jilidFor).suggested?.length" class="pp-note tm-suggest">
            <span>Riwayat KBM 60 hari: {{ scopeOf(jilidFor).suggested.map((x) => `${levelName(x.classId)} (${x.count}x)`).join(', ') }}</span>
            <button type="button" class="pp-btn pp-btn-ghost" @click="useSuggestion">Pakai ini</button>
          </div>
          <p v-else class="pp-help tm-gap">Belum ada riwayat KBM dalam 60 hari terakhir.</p>
          <p class="pp-help tm-gap">Bila tidak ada yang dipilih, sistem memakai riwayat KBM guru ini.</p>
          <div class="pp-sheet-actions">
            <button type="button" class="pp-btn pp-btn-ghost" :disabled="saving" @click="jilidFor = null">Batal</button>
            <button type="button" class="pp-btn pp-btn-primary" :disabled="saving" @click="saveJilid">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- the guru's data (for the SPTJM & LPJ documents) -->
    <Teleport to="body">
      <div v-if="editFor" class="pp-overlay" @click.self="closeEdit" @keydown.esc="closeEdit">
        <form class="pp-sheet is-wide" role="dialog" aria-modal="true" aria-labelledby="tm-edit-title" novalidate @submit.prevent="saveTeacher">
          <span class="pp-grab" aria-hidden="true"></span>
          <div class="pp-sheet-head">
            <div>
              <h3 id="tm-edit-title">Data pengajar</h3>
              <p>Dipakai di dokumen SPTJM &amp; LPJ.</p>
            </div>
            <button type="button" class="pp-close" aria-label="Tutup" @click="closeEdit"><LineIcon name="x" :size="18" /></button>
          </div>
          <div class="pp-grid">
            <div class="pp-field is-full">
              <label for="tm-name" class="pp-label">Nama lengkap</label>
              <input id="tm-name" v-model="form.displayName" class="pp-input" type="text" maxlength="80" autocomplete="off" />
            </div>
            <div class="pp-field">
              <label for="tm-nik" class="pp-label">NIK <small>(16 angka)</small></label>
              <input id="tm-nik" v-model="form.nik" class="pp-input" type="text" inputmode="numeric" maxlength="16" autocomplete="off" placeholder="16 angka di KTP"
                :aria-invalid="!!form.nik && !nikOk" @input="form.nik = form.nik.replace(/\D/g, '')" />
              <p v-if="form.nik && !nikOk" class="pp-help">Baru {{ form.nik.length }} angka, NIK berisi 16 angka.</p>
            </div>
            <div class="pp-field">
              <label for="tm-position" class="pp-label">Jabatan</label>
              <input id="tm-position" v-model="form.position" class="pp-input" type="text" maxlength="60" placeholder="Contoh: Pengajar, Wali kelas" />
            </div>
            <div class="pp-field">
              <label for="tm-place" class="pp-label">Tempat lahir</label>
              <input id="tm-place" v-model="form.birthPlace" class="pp-input" type="text" maxlength="60" placeholder="Kota / kabupaten" />
            </div>
            <div class="pp-field">
              <label for="tm-birth" class="pp-label">Tanggal lahir</label>
              <input id="tm-birth" v-model="form.birthDate" class="pp-input" type="date" />
            </div>
            <div class="pp-field is-full">
              <label for="tm-address" class="pp-label">Alamat lengkap</label>
              <textarea id="tm-address" v-model="form.address" class="pp-input" rows="2" maxlength="300"></textarea>
            </div>
            <div class="pp-field is-full">
              <label for="tm-bio" class="pp-label">Keterangan <small>(boleh kosong)</small></label>
              <textarea id="tm-bio" v-model="form.bio" class="pp-input" rows="2" maxlength="300"></textarea>
            </div>
            <div class="pp-field is-full">
              <label for="tm-photo" class="pp-label">Alamat foto <small>(boleh kosong)</small></label>
              <input id="tm-photo" v-model="form.photoURL" class="pp-input" type="url" placeholder="https://…" />
            </div>
          </div>
          <p v-if="editError" class="pp-error" role="alert">{{ editError }}</p>
          <div class="pp-sheet-actions">
            <button type="button" class="pp-btn pp-btn-ghost" :disabled="saving" @click="closeEdit">Batal</button>
            <button type="submit" class="pp-btn pp-btn-primary" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/services/api'
import LineIcon from '@/components/LineIcon.vue'
import { useToast } from '@/composables/useToast'

const { success, error: showError } = useToast()

const CLASS_OPTIONS = [...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Jilid ${n}` })), { value: '7', label: 'Marhalah' }]
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : `Jilid ${id}`)
const initials = (name) => String(name || 'U').split(/\s+/).filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)

const teachers = ref([])
const scopes = ref({})
const scopesLoaded = ref(false)
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const filter = ref('')
const search = ref('')

async function fetchTeachers() {
  loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/users?role=guru', { cache: false })
    teachers.value = (Array.isArray(data) ? data : []).sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || '')))
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Daftar guru belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}
// Jilid diampu: what the admin set, else the KBM history (the same rule the server applies)
async function fetchScopes() {
  try {
    const { data } = await api.get('/guru-classes', { cache: false })
    scopes.value = Object.fromEntries((data || []).map((g) => [g.guruId, g]))
  } catch {
    /* the rows say nothing about the jilid; the rest works */
  } finally {
    scopesLoaded.value = true
  }
}
const scopeOf = (t) => scopes.value[t.id] || { classIds: [], source: scopesLoaded.value ? 'none' : '', suggested: [], unassignedTaught: [] }

const noNik = computed(() => teachers.value.filter((t) => !t.nik))
const noJilid = computed(() => (scopesLoaded.value ? teachers.value.filter((t) => scopeOf(t).source !== 'admin') : []))
const shown = computed(() => {
  const q = search.value.trim().toLowerCase()
  const base = filter.value === 'nik' ? noNik.value : filter.value === 'jilid' ? noJilid.value : teachers.value
  return base.filter((t) => !q || String(t.displayName || '').toLowerCase().includes(q) || String(t.username || '').toLowerCase().includes(q))
})

/* ---- jilid */
const jilidFor = ref(null)
const jilidPick = ref([])
function openJilid(t) {
  jilidFor.value = t
  jilidPick.value = scopeOf(t).source === 'admin' ? [...scopeOf(t).classIds] : []
}
const toggleJilid = (id) => {
  jilidPick.value = jilidPick.value.includes(id) ? jilidPick.value.filter((x) => x !== id) : [...jilidPick.value, id]
}
const useSuggestion = () => {
  jilidPick.value = [...new Set(scopeOf(jilidFor.value).suggested.map((x) => x.classId))]
}
async function saveJilid() {
  saving.value = true
  try {
    await api.put(`/guru-classes/${jilidFor.value.id}`, { classIds: jilidPick.value })
    success(jilidPick.value.length ? 'Jilid pengajar disimpan' : 'Jilid dikosongkan, memakai riwayat KBM')
    jilidFor.value = null
    await fetchScopes()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menyimpan jilid')
  } finally {
    saving.value = false
  }
}

/* ---- data */
const editFor = ref(null)
const editError = ref('')
const form = ref({})
const nikOk = computed(() => /^\d{16}$/.test(form.value.nik || ''))
function openEdit(t) {
  editError.value = ''
  editFor.value = t
  form.value = {
    displayName: t.displayName || '',
    nik: String(t.nik || '').replace(/\D/g, ''),
    birthPlace: t.birthPlace || '',
    birthDate: t.birthDate || '',
    address: t.address || '',
    position: t.position || '',
    photoURL: t.photoURL || '',
    bio: t.bio || '',
  }
}
function closeEdit() {
  if (!saving.value) editFor.value = null
}
async function saveTeacher() {
  const f = form.value
  editError.value = ''
  if (f.displayName.trim().length < 3) return (editError.value = 'Nama lengkap wajib diisi')
  if (f.nik && !nikOk.value) return (editError.value = 'NIK berisi 16 angka, atau kosongkan dulu')
  saving.value = true
  const clean = (v) => (String(v || '').trim() ? String(v).trim() : null)
  try {
    await api.patch(`/users/${editFor.value.id}`, {
      displayName: f.displayName.trim(),
      nik: clean(f.nik),
      birthPlace: clean(f.birthPlace),
      birthDate: f.birthDate || null,
      address: clean(f.address),
      position: clean(f.position),
      photoURL: clean(f.photoURL),
      bio: clean(f.bio),
    })
    success('Data guru disimpan')
    saving.value = false
    editFor.value = null
    await fetchTeachers()
  } catch (err) {
    editError.value = err.response?.data?.error || 'Gagal menyimpan data'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchTeachers()
  fetchScopes()
})
</script>

<style src="@/styles/people.css"></style>
<style scoped>
.tm-suggest {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tm-gap {
  margin-bottom: 10px;
}
</style>
