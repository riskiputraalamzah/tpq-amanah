<template>
  <div class="pp ua">
    <header class="pp-head">
      <div>
        <h1>Akun Pengguna</h1>
        <p>Akun untuk masuk ke dashboard: admin dan guru. Data guru (NIK, jilid diampu) diatur di <router-link to="/dashboard/teachers">Kelola Pengajar</router-link>. Wali santri masuk lewat portal wali, tidak perlu akun di sini.</p>
      </div>
      <button type="button" class="pp-btn pp-btn-primary" @click="openCreate()">
        <LineIcon name="plus" :size="17" /> Tambah akun
      </button>
    </header>

    <div class="pp-tools">
      <div class="pp-chips" role="group" aria-label="Saring peran">
        <button v-for="f in roleFilters" :key="f.id" type="button" class="pp-chip" :aria-pressed="filterRole === f.id" @click="filterRole = f.id">
          {{ f.label }}<span>{{ f.count }}</span>
        </button>
      </div>
      <label class="pp-search">
        <span class="sr-only">Cari akun</span>
        <input v-model="searchQuery" class="pp-input" type="search" placeholder="Cari nama atau username" />
      </label>
    </div>

    <p v-if="loadError" class="pp-note is-danger" role="alert">{{ loadError }}</p>
    <ul v-else-if="loading" class="pp-list" aria-label="Memuat akun"><li v-for="i in 4" :key="i" class="pp-skeleton"></li></ul>
    <p v-else-if="!filteredUsers.length" class="pp-empty">Tidak ada akun yang cocok.</p>
    <ul v-else class="pp-list" aria-label="Daftar akun">
      <li v-for="u in filteredUsers" :key="u.id" class="pp-row">
        <img v-if="u.photoURL" :src="u.photoURL" alt="" class="pp-avatar" />
        <span v-else class="pp-avatar" aria-hidden="true">{{ initials(u.displayName) }}</span>
        <div class="pp-main">
          <span class="pp-name">
            {{ u.displayName || '(tanpa nama)' }}
            <span class="pp-pill" :class="`is-${u.role === 'admin' ? 'admin' : u.role === 'guru' ? 'guru' : 'idle'}`">{{ roleLabel(u.role) }}</span>
            <span v-if="isMe(u)" class="pp-pill is-info">Akun Antum</span>
          </span>
          <span class="pp-sub">@{{ u.username || '-' }}</span>
          <span v-if="u.role === 'guru' && featureNames(u).length" class="pp-sub">Akses khusus: {{ featureNames(u).join(', ') }}</span>
        </div>
        <div class="pp-actions">
          <button type="button" class="pp-btn pp-btn-ghost" :aria-label="`Ubah akun ${u.displayName}`" @click="openEdit(u)">Ubah</button>
          <button v-if="u.role === 'guru'" type="button" class="pp-btn pp-btn-ghost" :aria-label="`Akses khusus ${u.displayName}`" @click="openAccess(u)">Akses khusus</button>
          <button v-if="!isMe(u)" type="button" class="pp-btn pp-btn-danger" :aria-label="`Hapus akun ${u.displayName}`" @click="removeUser(u)">Hapus</button>
        </div>
      </li>
    </ul>

    <!-- add / change an account -->
    <Teleport to="body">
      <div v-if="sheet" class="pp-overlay" @click.self="closeSheet" @keydown.esc="closeSheet">
        <form class="pp-sheet" role="dialog" aria-modal="true" aria-labelledby="ua-title" novalidate @submit.prevent="submitSheet">
          <span class="pp-grab" aria-hidden="true"></span>
          <div class="pp-sheet-head">
            <div>
              <h3 id="ua-title">{{ sheet.done ? 'Akun dibuat' : sheet.mode === 'create' ? 'Tambah akun' : 'Ubah akun' }}</h3>
              <p v-if="sheet.done">Kirim info masuk ini ke {{ sheet.done.displayName }} (japri).</p>
              <p v-else-if="sheet.mode === 'create'">Guru atau admin yang masuk ke dashboard dengan username dan password.</p>
              <p v-else>{{ sheet.user.displayName }}</p>
            </div>
            <button type="button" class="pp-close" aria-label="Tutup" @click="closeSheet"><LineIcon name="x" :size="18" /></button>
          </div>

          <!-- created: the sign-in info to pass on -->
          <template v-if="sheet.done">
            <p class="pp-done">{{ doneText }}</p>
            <div class="pp-sheet-actions">
              <button type="button" class="pp-btn pp-btn-ghost" @click="closeSheet">Selesai</button>
              <button type="button" class="pp-btn pp-btn-primary" @click="copyDone">{{ copied ? 'Tersalin ✓' : 'Salin info masuk' }}</button>
            </div>
          </template>

          <template v-else>
            <div class="pp-field">
              <span class="pp-label">Peran</span>
              <div class="pp-segment" role="group" aria-label="Peran">
                <button v-for="r in ROLES" :key="r.id" type="button" :aria-pressed="form.role === r.id" :disabled="sheet.mode === 'edit' && isMe(sheet.user)" @click="form.role = r.id">{{ r.label }}</button>
              </div>
              <p class="pp-help">{{ form.role === 'admin' ? 'Admin bisa membuka dan mengubah semua menu.' : 'Guru membuka KBM, absen, dan santri jilidnya. Akses tambahan lewat "Akses khusus".' }}<template v-if="sheet.mode === 'edit' && isMe(sheet.user)"> Peran akun Antum sendiri tidak bisa diubah di sini.</template></p>
            </div>
            <div class="pp-field">
              <label for="ua-name" class="pp-label">Nama lengkap</label>
              <input id="ua-name" ref="firstInput" v-model="form.displayName" class="pp-input" type="text" maxlength="80" autocomplete="off" placeholder="Contoh: Ustadzah Aini" />
            </div>
            <div class="pp-field">
              <label for="ua-username" class="pp-label">Username</label>
              <input id="ua-username" v-model="form.username" class="pp-input" type="text" maxlength="30" autocomplete="off" autocapitalize="none" spellcheck="false"
                placeholder="Contoh: aini" @input="form.username = form.username.toLowerCase().replace(/\s/g, '')" />
              <p class="pp-help">Huruf kecil atau angka, tanpa spasi. Dipakai untuk masuk.</p>
            </div>
            <div class="pp-field">
              <label for="ua-pass" class="pp-label">{{ sheet.mode === 'create' ? 'Password' : 'Password baru' }} <small v-if="sheet.mode === 'edit'">(kosongkan bila tidak diganti)</small></label>
              <div class="pp-pass">
                <input id="ua-pass" v-model="form.password" class="pp-input" :type="showPass ? 'text' : 'password'" autocomplete="new-password" placeholder="Minimal 6 karakter" />
                <button type="button" class="pp-btn pp-btn-ghost" :aria-pressed="showPass" @click="showPass = !showPass">{{ showPass ? 'Sembunyikan' : 'Lihat' }}</button>
              </div>
              <button type="button" class="pp-btn pp-btn-ghost ua-gen" @click="suggestPassword">Buatkan password</button>
            </div>
            <p v-if="sheetError" class="pp-error" role="alert">{{ sheetError }}</p>
            <div class="pp-sheet-actions">
              <button type="button" class="pp-btn pp-btn-ghost" :disabled="busy" @click="closeSheet">Batal</button>
              <button type="submit" class="pp-btn pp-btn-primary" :disabled="busy">{{ busy ? 'Menyimpan…' : sheet.mode === 'create' ? 'Buat akun' : 'Simpan' }}</button>
            </div>
          </template>
        </form>
      </div>
    </Teleport>

    <!-- special access for a guru -->
    <Teleport to="body">
      <div v-if="access" class="pp-overlay" @click.self="access = null" @keydown.esc="access = null">
        <form class="pp-sheet is-wide" role="dialog" aria-modal="true" aria-labelledby="ua-access-title" @submit.prevent="saveAccess">
          <span class="pp-grab" aria-hidden="true"></span>
          <div class="pp-sheet-head">
            <div>
              <h3 id="ua-access-title">Akses khusus</h3>
              <p>{{ access.user.displayName }}. Muncul di menu "Akses Khusus" guru ini, berlaku langsung setelah disimpan.</p>
            </div>
            <button type="button" class="pp-close" aria-label="Tutup" @click="access = null"><LineIcon name="x" :size="18" /></button>
          </div>
          <div class="pp-checks">
            <label v-for="f in features" :key="f.id" class="pp-check">
              <input v-model="access.features" type="checkbox" :value="f.id" />
              <div><strong>{{ f.label }}</strong><span>{{ f.description }}</span></div>
            </label>
          </div>
          <p v-if="sheetError" class="pp-error" role="alert">{{ sheetError }}</p>
          <div class="pp-sheet-actions">
            <button type="button" class="pp-btn pp-btn-ghost" :disabled="busy" @click="access = null">Batal</button>
            <button type="submit" class="pp-btn pp-btn-primary" :disabled="busy">{{ busy ? 'Menyimpan…' : 'Simpan akses' }}</button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import LineIcon from '@/components/LineIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'

const { success, error: showError } = useToast()
const { ask } = useDialog()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const ROLES = [{ id: 'guru', label: 'Guru' }, { id: 'admin', label: 'Admin' }]
// who is signed in (username sign-in: the store's user, not a Firebase user)
const myId = computed(() => authStore.user?.id || authStore.user?.uid || '')
const isMe = (u) => !!myId.value && u.id === myId.value

const users = ref([])
const features = ref([])
const loading = ref(true)
const loadError = ref('')
const filterRole = ref('')
const searchQuery = ref('')

const initials = (name) => String(name || 'U').split(/\s+/).filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
const roleLabel = (role) => ({ admin: 'Admin', guru: 'Guru', santri: 'Santri' }[role] || role || '-')
const featureNames = (u) => (u.permissions?.features || []).map((id) => features.value.find((f) => f.id === id)?.label || id)

const roleFilters = computed(() => {
  const count = (r) => users.value.filter((u) => u.role === r).length
  const list = [{ id: '', label: 'Semua', count: users.value.length }, { id: 'guru', label: 'Guru', count: count('guru') }, { id: 'admin', label: 'Admin', count: count('admin') }]
  const others = users.value.filter((u) => !['guru', 'admin'].includes(u.role)).length
  if (others) list.push({ id: 'other', label: 'Lainnya', count: others })
  return list
})
const filteredUsers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return users.value
    .filter((u) => !filterRole.value || (filterRole.value === 'other' ? !['guru', 'admin'].includes(u.role) : u.role === filterRole.value))
    .filter((u) => !q || String(u.displayName || '').toLowerCase().includes(q) || String(u.username || '').toLowerCase().includes(q))
    .sort((a, b) => (a.role === b.role ? 0 : a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : 0) || String(a.displayName || '').localeCompare(String(b.displayName || '')))
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [u, f] = await Promise.all([api.get('/users', { cache: false }), api.get('/users/available-features').catch(() => ({ data: [] }))])
    users.value = Array.isArray(u.data) ? u.data : []
    features.value = Array.isArray(f.data) ? f.data : []
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Daftar akun belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

/* ---- add / change */
const sheet = ref(null) // { mode: 'create' | 'edit', user?, done? }
const form = ref({ displayName: '', username: '', password: '', role: 'guru' })
const sheetError = ref('')
const busy = ref(false)
const showPass = ref(false)
const copied = ref(false)
const firstInput = ref(null)

function openCreate(role = 'guru') {
  sheetError.value = ''
  showPass.value = true
  copied.value = false
  form.value = { displayName: '', username: '', password: '', role }
  sheet.value = { mode: 'create' }
  nextTick(() => firstInput.value?.focus())
}
function openEdit(u) {
  sheetError.value = ''
  showPass.value = false
  form.value = { displayName: u.displayName || '', username: u.username || '', password: '', role: ['guru', 'admin'].includes(u.role) ? u.role : 'guru' }
  sheet.value = { mode: 'edit', user: u }
}
function closeSheet() {
  if (busy.value) return
  sheet.value = null
}
// easy to read out on the phone and to type: no 0/O, 1/l
function suggestPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  const pick = () => chars[Math.floor(Math.random() * chars.length)]
  form.value.password = `${Array.from({ length: 4 }, pick).join('')}-${Array.from({ length: 4 }, pick).join('')}`
  showPass.value = true
}

async function submitSheet() {
  if (busy.value || !sheet.value) return
  const f = form.value
  sheetError.value = ''
  if (f.displayName.trim().length < 3) return (sheetError.value = 'Tulis nama lengkap (minimal 3 huruf)')
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(f.username)) return (sheetError.value = 'Username 3–30 huruf kecil atau angka, tanpa spasi')
  if ((sheet.value.mode === 'create' || f.password) && f.password.length < 6) return (sheetError.value = 'Password minimal 6 karakter')
  busy.value = true
  try {
    if (sheet.value.mode === 'create') {
      const { data } = await api.post('/users', { displayName: f.displayName, username: f.username, password: f.password, role: f.role })
      users.value = [...users.value, data]
      sheet.value = { mode: 'create', done: { displayName: data.displayName, username: data.username, password: f.password } }
      success(`Akun ${data.displayName} dibuat`)
    } else {
      const u = sheet.value.user
      const payload = {}
      if (f.displayName.trim() !== (u.displayName || '')) payload.displayName = f.displayName.trim()
      if (f.username !== (u.username || '')) payload.username = f.username
      if (f.password) payload.password = f.password
      if (Object.keys(payload).length) await api.patch(`/users/${u.id}/credentials`, payload)
      Object.assign(u, { displayName: payload.displayName ?? u.displayName, username: payload.username ?? u.username })
      if (f.role !== u.role && !isMe(u)) {
        await api.patch(`/users/${u.id}/role`, { role: f.role })
        u.role = f.role
      }
      users.value = [...users.value]
      busy.value = false
      sheet.value = null
      success(f.password ? 'Akun disimpan. Beri tahu password barunya ke pemilik akun.' : 'Akun disimpan')
    }
  } catch (err) {
    sheetError.value = err.response?.data?.error || 'Belum berhasil. Coba lagi.'
    users.value = [...users.value] // what was saved before the error shows
  } finally {
    busy.value = false
  }
}

const doneText = computed(() => {
  const d = sheet.value?.done
  if (!d) return ''
  return [`Assalamu'alaikum, ${d.displayName}.`, '', 'Akun dashboard TPQ Amanah:', `Alamat: ${window.location.origin}/login`, `Username: ${d.username}`, `Password: ${d.password}`, '', 'Mohon password diganti setelah masuk (menu Profil).'].join('\n')
})
async function copyDone() {
  try {
    await navigator.clipboard.writeText(doneText.value)
    copied.value = true
  } catch {
    showError('Tidak bisa menyalin otomatis. Tekan lama pada teksnya untuk menyalin.')
  }
}

/* ---- special access */
const access = ref(null) // { user, features: [] }
function openAccess(u) {
  sheetError.value = ''
  access.value = { user: u, features: [...(u.permissions?.features || [])] }
}
async function saveAccess() {
  if (busy.value || !access.value) return
  busy.value = true
  sheetError.value = ''
  try {
    const { data } = await api.patch(`/users/${access.value.user.id}/permissions`, { features: access.value.features })
    access.value.user.permissions = data.permissions || { features: [...access.value.features] }
    users.value = [...users.value]
    busy.value = false
    access.value = null
    success('Akses khusus disimpan')
  } catch (err) {
    sheetError.value = err.response?.data?.error || 'Belum berhasil. Coba lagi.'
  } finally {
    busy.value = false
  }
}

/* ---- remove */
async function removeUser(u) {
  const ok = await ask({
    title: `Hapus akun ${u.displayName}?`,
    message: `${u.displayName} (@${u.username}) tidak bisa masuk lagi. Riwayat KBM, absensi, dan LPJ-nya tetap tersimpan. Bila hanya lupa password, pilih "Ubah" lalu ganti passwordnya.`,
    tone: 'danger',
    confirmText: 'Hapus akun',
    cancelText: 'Batal',
  })
  if (!ok) return
  try {
    await api.delete(`/users/${u.id}`)
    users.value = users.value.filter((x) => x.id !== u.id)
    success(`Akun ${u.displayName} dihapus`)
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal menghapus akun')
  }
}

onMounted(async () => {
  await load()
  // from Kelola Pengajar: "Tambah guru"
  if (route.query.tambah) {
    openCreate(route.query.tambah === 'admin' ? 'admin' : 'guru')
    router.replace({ query: {} })
  }
})
</script>

<style src="@/styles/people.css"></style>
<style scoped>
.ua-gen {
  justify-self: start;
  min-height: 36px;
  font-size: 0.84rem;
}
</style>
