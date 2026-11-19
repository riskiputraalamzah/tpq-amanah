<template>
  <!-- naik jilid just done: the guru's own of the last 24 hours (to undo a wrong tap); the admin: the teachers' of 7 days -->
  <section v-if="items.length" class="pr" aria-labelledby="pr-title">
    <h2 id="pr-title" class="pr-title">{{ adminMode ? 'Naik jilid oleh guru (7 hari terakhir)' : 'Baru Antum naikkan' }}</h2>
    <p v-if="!adminMode" class="pr-lead">Salah pilih? Batalkan dalam 24 jam, santri kembali ke jilid semula.</p>
    <ul class="pr-list">
      <li v-for="h in items" :key="h.id" class="pr-item">
        <div class="pr-main">
          <strong>{{ h.santriName }}</strong>
          <span class="pr-meta">{{ levelName(h.from) }} → {{ levelName(h.to) }} · {{ when(h.at) }}<template v-if="adminMode"> · oleh {{ h.byName }}</template></span>
        </div>
        <button type="button" class="pr-undo" :disabled="busy" :aria-label="`Batalkan kenaikan ${h.santriName}`" @click="undo(h)">Batalkan</button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { timeAgo } from '@/utils/timeAgo'

const props = defineProps({ adminMode: { type: Boolean, default: false } })
const emit = defineEmits(['changed'])
const { success, error: showError } = useToast()
const { ask } = useDialog()

const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ditentukan')
const when = (v) => timeAgo(v)

const items = ref([])
const busy = ref(false)

async function load() {
  try {
    const { data } = await api.get('/santri-changes/promotions', { cache: false })
    items.value = Array.isArray(data) ? data : []
  } catch {
    items.value = []
  }
}

async function undo(h) {
  const ok = await ask({
    title: `Batalkan kenaikan ${h.santriName}?`,
    message: `${h.santriName} kembali ke ${levelName(h.from)}.${props.adminMode ? '' : ' Admin dan guru jilid tujuan dikabari.'}`,
    tone: 'danger',
    confirmText: 'Ya, kembalikan',
    cancelText: 'Biarkan',
  })
  if (!ok) return
  busy.value = true
  try {
    await api.post(`/santri-changes/promote/${h.id}/undo`)
    success(`${h.santriName} kembali ke ${levelName(h.from)}`)
    emit('changed')
  } catch (err) {
    showError(err.response?.data?.error || 'Belum berhasil. Coba lagi.')
  } finally {
    busy.value = false
    await load()
  }
}

onMounted(load)
defineExpose({ reload: load })
</script>

<style scoped>
.pr {
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f0f7f3;
  border: 1px solid rgba(10, 92, 64, 0.18);
  color: #0b3b2a;
}

.pr-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
}

.pr-lead {
  margin: 2px 0 0;
  font-size: 0.84rem;
  color: #475a50;
}

.pr-list {
  display: grid;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.pr-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 8px 12px;
  border-radius: 12px;
  background: #fff;
}

.pr-main {
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
}

.pr-main strong {
  overflow-wrap: anywhere;
}

.pr-meta {
  font-size: 0.82rem;
  color: #5b6b62;
  font-variant-numeric: tabular-nums;
}

.pr-undo {
  flex: none;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1.5px solid rgba(180, 35, 24, 0.3);
  background: #fff;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  color: #b42318;
  cursor: pointer;
}

.pr-undo:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pr-undo:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}
</style>
