<template>
  <Teleport to="body">
    <div class="kg-overlay" @click.self="$emit('close')" @keydown.esc="$emit('close')">
      <form class="kg-sheet" role="dialog" aria-modal="true" aria-labelledby="kg-form-title" @submit.prevent="submit">
        <header class="kg-sheet-head">
          <h3 id="kg-form-title">{{ activity ? 'Ubah kegiatan' : 'Kegiatan baru' }}</h3>
          <button type="button" class="kg-close" aria-label="Tutup" @click="$emit('close')">×</button>
        </header>

        <div class="kg-sheet-body">
          <div class="kg-field">
            <label class="kg-label" for="kg-title">Nama kegiatan</label>
            <input id="kg-title" v-model="form.title" class="kg-input" maxlength="120" placeholder="Contoh: Munaqosyah 2026" required />
            <span v-if="errors.title" class="kg-error">{{ errors.title }}</span>
          </div>

          <div class="kg-field">
            <label class="kg-label" for="kg-type">Jenis</label>
            <select id="kg-type" v-model="form.type" class="kg-input">
              <option v-for="t in ACTIVITY_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>

          <div class="kg-field">
            <label class="kg-label" for="kg-date">Tanggal pelaksanaan (boleh dikosongkan)</label>
            <input id="kg-date" v-model="form.date" type="date" class="kg-input" />
            <span v-if="errors.date" class="kg-error">{{ errors.date }}</span>
          </div>

          <div class="kg-field">
            <label class="kg-label" for="kg-fee">Biaya per santri (Rp, 0 bila tanpa biaya)</label>
            <input id="kg-fee" v-model.number="form.fee" type="number" inputmode="numeric" min="0" step="1000" class="kg-input" />
            <span v-if="errors.fee" class="kg-error">{{ errors.fee }}</span>
          </div>

          <div v-if="form.fee > 0" class="kg-field">
            <label class="kg-label" for="kg-book">Buku tabungan tempat pembayaran dicatat</label>
            <select id="kg-book" v-model="form.savingsBookId" class="kg-input">
              <option value="">Tidak ditautkan (lunas dicatat manual)</option>
              <option v-for="b in books" :key="b.id" :value="b.id">{{ b.title }}<template v-if="b.createdByName"> · {{ b.createdByName }}</template></option>
            </select>
            <span class="kg-sub">Setoran santri di buku ini otomatis dihitung sebagai pembayaran. Tidak perlu mencatat dua kali.</span>
            <span v-if="errors.savingsBookId" class="kg-error">{{ errors.savingsBookId }}</span>
          </div>

          <div class="kg-field">
            <span class="kg-label">Persyaratan (dicentang per santri)</span>
            <div v-for="(r, i) in form.requirements" :key="i" class="kg-req-row">
              <input v-model="r.label" class="kg-input" maxlength="80" :aria-label="`Persyaratan ${i + 1}`" placeholder="Contoh: Pas foto 3x4" />
              <button type="button" class="kg-btn kg-btn-sm" :aria-label="`Hapus persyaratan ${i + 1}`" @click="form.requirements.splice(i, 1)">×</button>
            </div>
            <button v-if="form.requirements.length < 12" type="button" class="kg-btn kg-btn-sm" @click="form.requirements.push({ id: '', label: '' })">+ Tambah persyaratan</button>
            <span v-if="errors.requirements" class="kg-error">{{ errors.requirements }}</span>
          </div>

          <div class="kg-field">
            <label class="kg-label" for="kg-desc">Keterangan untuk orang tua (opsional)</label>
            <textarea id="kg-desc" v-model="form.description" class="kg-input" maxlength="500" placeholder="Contoh: Dilaksanakan di TPQ, peserta datang pukul 07.30"></textarea>
          </div>

          <label class="kg-check">
            <input v-model="form.showToWali" type="checkbox" />
            Tampilkan di portal wali santri
          </label>
          <p v-if="error" class="kg-note is-danger" role="alert">{{ error }}</p>
        </div>

        <footer class="kg-sheet-foot">
          <button type="button" class="kg-btn" @click="$emit('close')">Batal</button>
          <button type="submit" class="kg-btn kg-btn-primary" :disabled="busy">{{ busy ? 'Menyimpan…' : 'Simpan' }}</button>
        </footer>
      </form>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive } from 'vue'
import { ACTIVITY_TYPES } from '@/utils/kegiatan'

const props = defineProps({
  activity: { type: Object, default: null },
  books: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
  errors: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['save', 'close'])

const a = props.activity
const form = reactive({
  title: a?.title || '',
  type: a?.type || 'munaqosyah',
  date: a?.date || '',
  fee: a?.fee || 0,
  savingsBookId: a?.savingsBookId || '',
  description: a?.description || '',
  showToWali: a ? a.showToWali !== false : true,
  requirements: (a?.requirements || []).map((r) => ({ ...r })),
})

function submit() {
  emit('save', {
    ...form,
    fee: Number(form.fee) || 0,
    // a fee of 0 needs no book
    savingsBookId: Number(form.fee) > 0 ? form.savingsBookId : '',
    requirements: form.requirements.filter((r) => r.label.trim()),
    status: a?.status || 'open',
  })
}
</script>
