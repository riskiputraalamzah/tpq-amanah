<template>
  <div class="daily-table-container">
    <div class="section-header">
      <div>
        <h3 class="section-title">Aktivitas Operasional Harian</h3>
        <p class="section-subtitle">Daftar rekaman sesi KBM dan non-KBM pada periode laporan ini.</p>
      </div>
      <div v-if="sessions.length > 0" class="badge-count">
        {{ sessions.length }} Sesi Tercatat
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-8 text-center text-gray-500">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
      <p class="text-sm">Memuat data sesi harian...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="sessions.length === 0" class="empty-state">
      <div class="empty-icon">📅</div>
      <h4>Belum Ada Sesi Tercatat</h4>
      <p>Belum ada rekaman sesi mengajar atau non-KBM untuk periode ini.</p>
      <router-link to="/dashboard/attendance" class="btn btn-secondary btn-sm mt-3">
        Buka Modul Absensi
      </router-link>
    </div>

    <!-- Data Display -->
    <div v-else>
      <!-- Desktop Table View -->
      <div class="desktop-table-wrapper">
        <table class="session-table">
          <thead>
            <tr>
              <th style="width: 140px;">Tanggal</th>
              <th style="width: 110px;">Jenis Sesi</th>
              <th style="width: 120px;">Kelas</th>
              <th>Materi & Catatan Jurnal</th>
              <th style="width: 130px;">Kehadiran Santri</th>
              <th style="width: 130px;">Pengajar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in sortedSessions" :key="session.id || session._id">
              <!-- Tanggal -->
              <td class="font-medium text-gray-900">
                {{ formatSessionDate(session.date) }}
              </td>

              <!-- Jenis Sesi -->
              <td>
                <span 
                  class="type-pill"
                  :class="session.type === 'teaching' ? 'type-teaching' : 'type-non-kbm'"
                >
                  {{ session.type === 'teaching' ? 'KBM' : 'NON-KBM' }}
                </span>
              </td>

              <!-- Kelas -->
              <td>
                <span v-if="session.type === 'teaching'" class="class-pill">
                  {{ session.className || `Kelas ${session.classId}` }}
                </span>
                <span v-else class="text-gray-400 text-xs italic">-</span>
              </td>

              <!-- Materi & Catatan Jurnal -->
              <td>
                <div v-if="session.type === 'teaching' && session.journal">
                  <div class="font-medium text-gray-800 text-sm">
                    {{ session.journal.material || '-' }}
                  </div>
                  <div v-if="session.journal.notes" class="text-xs text-gray-500 mt-0.5 italic">
                    Catatan: {{ session.journal.notes }}
                  </div>
                </div>
                <div v-else-if="session.notes || session.activity">
                  <div class="text-sm text-gray-700">
                    {{ session.notes || session.activity || 'Kegiatan operasional non-KBM' }}
                  </div>
                </div>
                <div v-else class="text-xs text-gray-400 italic">
                  Tidak ada catatan jurnal
                </div>
              </td>

              <!-- Kehadiran Santri -->
              <td>
                <div v-if="session.type === 'teaching' && session.studentAttendances" class="text-xs">
                  <span class="font-semibold text-green-700">
                    {{ getStudentCount(session.studentAttendances, 'hadir') }} Hadir
                  </span>
                  <span v-if="getStudentCount(session.studentAttendances, 'sakit') > 0" class="text-amber-600 ml-1">
                    · {{ getStudentCount(session.studentAttendances, 'sakit') }} S
                  </span>
                  <span v-if="getStudentCount(session.studentAttendances, 'izin') > 0" class="text-blue-600 ml-1">
                    · {{ getStudentCount(session.studentAttendances, 'izin') }} I
                  </span>
                  <span v-if="getStudentCount(session.studentAttendances, 'alpa') > 0" class="text-red-600 ml-1">
                    · {{ getStudentCount(session.studentAttendances, 'alpa') }} A
                  </span>
                </div>
                <span v-else class="text-xs text-gray-400 italic">-</span>
              </td>

              <!-- Pengajar / Pengganti -->
              <td>
                <div class="text-xs">
                  <div class="font-medium text-gray-800">
                    {{ session.guruName || 'Guru Utama' }}
                  </div>
                  <span v-if="session.isSubstitute" class="text-amber-600 text-[10px] font-semibold">
                    (Guru Pengganti)
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Stacked Card View -->
      <div class="mobile-card-list">
        <div 
          v-for="session in sortedSessions" 
          :key="'m-' + (session.id || session._id)"
          class="session-card"
        >
          <div class="session-card-header">
            <span class="session-card-date">{{ formatSessionDate(session.date) }}</span>
            <div class="flex items-center gap-1.5">
              <span 
                class="type-pill text-[10px]"
                :class="session.type === 'teaching' ? 'type-teaching' : 'type-non-kbm'"
              >
                {{ session.type === 'teaching' ? 'KBM' : 'NON-KBM' }}
              </span>
              <span v-if="session.type === 'teaching'" class="class-pill text-[10px]">
                {{ session.className || `Kelas ${session.classId}` }}
              </span>
            </div>
          </div>

          <div class="session-card-body">
            <div v-if="session.type === 'teaching' && session.journal">
              <p class="material-text">{{ session.journal.material || '-' }}</p>
              <p v-if="session.journal.notes" class="notes-text">Catatan: {{ session.journal.notes }}</p>
            </div>
            <div v-else>
              <p class="notes-text">{{ session.notes || session.activity || 'Kegiatan non-KBM' }}</p>
            </div>
          </div>

          <div class="session-card-footer">
            <div v-if="session.type === 'teaching' && session.studentAttendances" class="footer-stats">
              <span>Hadir: <strong>{{ getStudentCount(session.studentAttendances, 'hadir') }}</strong></span>
              <span v-if="getStudentCount(session.studentAttendances, 'sakit') > 0">S: {{ getStudentCount(session.studentAttendances, 'sakit') }}</span>
              <span v-if="getStudentCount(session.studentAttendances, 'izin') > 0">I: {{ getStudentCount(session.studentAttendances, 'izin') }}</span>
              <span v-if="getStudentCount(session.studentAttendances, 'alpa') > 0">A: {{ getStudentCount(session.studentAttendances, 'alpa') }}</span>
            </div>
            <div class="text-right text-[11px] text-gray-500">
              {{ session.guruName || 'Guru' }}
              <span v-if="session.isSubstitute" class="text-amber-600 font-bold">(Pengganti)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  sessions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Sort sessions chronologically ascending
const sortedSessions = computed(() => {
  return [...props.sessions].sort((a, b) => {
    const timeA = a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date).getTime()
    const timeB = b.date?.seconds ? b.date.seconds * 1000 : new Date(b.date).getTime()
    return timeA - timeB
  })
})

function formatSessionDate(dateVal) {
  if (!dateVal) return '-'
  try {
    const d = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal)
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  } catch (e) {
    return String(dateVal)
  }
}

function getStudentCount(attendances, status) {
  if (!Array.isArray(attendances)) return 0
  return attendances.filter(a => a.status === status).length
}
</script>

<style scoped>
.daily-table-container {
  margin-top: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.section-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 2px;
}

.badge-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e293b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 9999px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
}
.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.empty-state h4 {
  font-weight: 600;
  color: #334155;
  margin: 0;
}
.empty-state p {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 4px;
}

/* Desktop Table */
.desktop-table-wrapper {
  display: block;
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.session-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.session-table th {
  background: #f8fafc;
  padding: 10px 14px;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.session-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.session-table tbody tr:hover {
  background: #f8fafc;
}

/* Pills */
.type-pill {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}
.type-teaching {
  background: #e0f2fe;
  color: #0369a1;
}
.type-non-kbm {
  background: #fef3c7;
  color: #92400e;
}

.class-pill {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  background: #f1f5f9;
  color: #334155;
  border-radius: 6px;
}

/* Mobile Cards */
.mobile-card-list {
  display: none;
  flex-direction: column;
  gap: 0.75rem;
}

.session-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.session-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.session-card-date {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}

.session-card-body .material-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.session-card-body .notes-text {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 2px;
}

.session-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px dashed #f1f5f9;
}

.footer-stats {
  font-size: 0.75rem;
  color: #475569;
  display: flex;
  gap: 6px;
}

/* Responsive breakpoint */
@media (max-width: 768px) {
  .desktop-table-wrapper {
    display: none;
  }
  .mobile-card-list {
    display: flex;
  }
}
</style>

