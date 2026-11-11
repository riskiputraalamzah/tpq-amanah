<template>
  <section v-if="status?.batch" class="lpj-card" :class="status.ready ? 'is-ready' : 'is-todo'" aria-labelledby="lpj-card-title">
    <div class="lpj-head">
      <h2 id="lpj-card-title">Kelengkapan LPJ</h2>
      <span class="period">{{ status.batch.rangeLabel }}</span>
    </div>

    <p v-if="status.ready" class="done">
      Alhamdulillah, data Anda untuk LPJ ini sudah lengkap. Jazakumullahu khairan. ✓
    </p>

    <template v-else>
      <p class="intro">Admin sedang menyiapkan LPJ. Mohon lengkapi yang berikut ini:</p>
      <ul class="todo">
        <li v-if="status.missingProfile.length">
          <div class="text">
            <strong>Data diri untuk SPTJM</strong>
            <span>{{ status.missingProfile.join(', ') }} belum diisi</span>
          </div>
          <router-link to="/dashboard/profile" class="btn">Lengkapi Profil</router-link>
        </li>
        <li v-if="status.gaps.missingAttendance.length">
          <div class="text">
            <strong>Belum absen {{ status.gaps.missingAttendance.length }} hari</strong>
            <span>{{ dates(status.gaps.missingAttendance) }}</span>
          </div>
          <router-link to="/dashboard/attendance" class="btn">Isi Absensi</router-link>
        </li>
        <li v-if="kbmDates.length">
          <div class="text">
            <strong>KBM belum dibuat / belum lengkap {{ kbmDates.length }} hari</strong>
            <span>{{ dates(kbmDates) }}</span>
          </div>
          <router-link to="/dashboard/kbm" class="btn">Buka KBM</router-link>
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const MAX_SHOWN = 6

// Loaded after the rest of the dashboard and never blocks it; shows nothing for teachers not in an LPJ.
const status = ref(null)

const kbmDates = computed(() => {
  const gaps = status.value?.gaps
  if (!gaps) return []
  return [...new Set([...gaps.missingKbm, ...gaps.incompleteKbm.map((i) => i.date)])].sort()
})

const shortDate = (date) => {
  const [, m, d] = date.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}`
}
const dates = (list) => {
  const shown = list.slice(0, MAX_SHOWN).map(shortDate).join(', ')
  return list.length > MAX_SHOWN ? `${shown}, +${list.length - MAX_SHOWN} lainnya` : shown
}

onMounted(async () => {
  try {
    const { data } = await api.get('/lpj/me', { timeout: 30000 })
    status.value = data
  } catch {
    status.value = null
  }
})
</script>

<style scoped>
.lpj-card {
  margin-bottom: var(--space-xl, 24px);
  padding: 16px 18px;
  background: #fff;
  border: 1px solid var(--gray-200);
  border-left: 5px solid #f59e0b;
  border-radius: 14px;
}

.lpj-card.is-ready {
  border-left-color: #2e7d32;
}

.lpj-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 12px;
  margin-bottom: 6px;
}

.lpj-head h2 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--primary-dark);
}

.period {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-600);
}

.done {
  margin: 0;
  color: #2e7d32;
  font-weight: 600;
  font-size: 0.92rem;
}

.intro {
  margin: 0 0 10px;
  font-size: 0.88rem;
  color: var(--gray-700);
}

.todo {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.todo li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  padding: 10px 12px;
  background: #fffbeb;
  border-radius: 10px;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 220px;
}

.text strong {
  font-size: 0.9rem;
  color: #92400e;
}

.text span {
  font-size: 0.82rem;
  color: var(--gray-700);
  overflow-wrap: anywhere;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px 16px;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  font-size: 0.88rem;
  text-decoration: none;
  white-space: nowrap;
}

.btn:focus-visible {
  outline: 3px solid var(--primary-300, #81c784);
  outline-offset: 2px;
}
</style>
