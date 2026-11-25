<template>
  <div class="as" :class="{ 'is-admin': isAdmin }">
    <header class="as-head">
      <h1>Absen Santri</h1>
      <p>Catat santri yang datang di sesi ini, dari jilid mana pun. Dipakai untuk KBM dan portal wali, walau guru jilidnya berhalangan.</p>
    </header>

    <div class="as-controls">
      <label class="as-date">
        <span class="sr-only">Tanggal</span>
        <input type="date" class="as-input" :value="date" :min="minDate" :max="today" @change="setDate($event.target.value)" />
      </label>
      <!-- a child who goes to another sesi / teacher (Jilid 4 coming at malam) -->
      <button type="button" class="as-titip-btn" :disabled="!sheet" @click="titipOpen = true">Titip santri</button>
      <router-link to="/dashboard/izin-santri" class="as-titip-btn as-izin-link">Izin / sakit santri</router-link>
      <button v-if="isAdmin" type="button" class="as-titip-btn as-holiday-btn" @click="holidayOpen = true">Liburkan sesi</button>
    </div>
    <TitipSheet :open="titipOpen" :santri="sheet?.santri || []" @close="titipOpen = false" @changed="onTitipChanged" />
    <SessionHolidaySheet v-if="isAdmin" :open="holidayOpen" :default-date="date" :default-slot="slot" @close="holidayOpen = false" @changed="onHolidayChanged" />
    <div v-if="sheet && sheet.daysBack === 0 && !sheet.dayOff" ref="hintWrap" class="as-hint-wrap">
      <!-- Desktop: concise inline hint; Mobile: compact tooltip trigger so it does not eat screen space -->
      <p class="as-hint as-hint-desktop">
        Absen dibuka saat ngaji dimulai (Sore 15.00, Malam 18.00) dan bisa diubah sampai pukul 24.00 hari itu. Esok paginya masih bisa
        sampai pukul 12.00 dengan konfirmasi (guru koordinator diberi kabar). Setelahnya hanya admin atau guru dengan akses khusus.
      </p>
      <div class="as-hint-mobile">
        <button
          type="button"
          class="as-hint-trigger"
          :aria-expanded="hintOpen"
          aria-controls="as-hint-tooltip"
          @click="hintOpen = !hintOpen"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Ketentuan jam absen</span>
        </button>
        <div
          v-if="hintOpen"
          id="as-hint-tooltip"
          class="as-hint-popover"
          role="tooltip"
        >
          <p>
            Absen dibuka saat ngaji dimulai (Sore 15.00, Malam 18.00) dan bisa diubah sampai pukul 24.00 hari itu. Esok paginya masih bisa
            sampai pukul 12.00 dengan konfirmasi (guru koordinator diberi kabar). Setelahnya hanya admin atau guru dengan akses khusus.
          </p>
          <button type="button" class="as-hint-close" aria-label="Tutup keterangan jam absen" @click="hintOpen = false">×</button>
        </div>
      </div>
    </div>

    <AbsenReports ref="reportsBox" @changed="onOutsideChange" />
    <EarlyAudit v-if="isAdmin" ref="auditBox" @changed="onOutsideChange" />

    <!-- stays at the top while scrolling: switch sesi from anywhere, see what is recorded and whether it is saved -->
    <div ref="bar" class="as-bar">
      <div class="as-slots" role="group" aria-label="Sesi">
        <button v-for="s in SLOTS" :key="s.id" type="button" class="as-slot" :aria-pressed="slot === s.id" @click="setSlot(s.id)">
          <span class="as-slot-top">
            <span class="as-slot-name">{{ s.label }}</span>
            <span v-if="sheetOf(s.id)?.dayOff" class="as-slot-count">Libur</span>
            <span v-else-if="sheetOf(s.id)?.sessionHoliday" class="as-slot-count">Diliburkan</span>
            <span v-else-if="slotCount(s.id) !== null" class="as-slot-count">{{ slotCount(s.id) }} dicatat</span>
          </span>
          <span class="as-slot-meta">{{ slotJilid(s.id) }}</span>
        </button>
      </div>
      <div v-if="sheet" class="as-summary" role="status" aria-live="polite">
        <template v-if="sheet.dayOff">
          <span class="is-dayoff-bar">
            <strong>{{ sheet.dayOff.title }}</strong> · {{ sheet.dayOff.kind === 'weekend' ? 'Senin sampai Jumat' : sheet.dayOff.name }}
          </span>
        </template>
        <template v-else-if="sheet.sessionHoliday">
          <span class="is-holiday-bar">
            <strong>Sesi {{ slotLabel }} diliburkan</strong><template v-if="sheet.sessionHoliday.reason"> · {{ sheet.sessionHoliday.reason }}</template>
          </span>
          <span v-if="counts.izin + counts.sakit > 0" class="is-izin">
            ({{ counts.izin + counts.sakit }} izin/sakit wali tercatat sebelumnya)
          </span>
        </template>
        <template v-else>
          <span v-if="myJilidFilterActive && myJilidLabel" class="as-scope-tag">{{ myJilidLabel }}</span>
          <span v-for="t in TALLY" :key="t.key" :class="`is-${t.key}`"><strong>{{ counts[t.key] }}</strong> {{ t.label }}</span>
          <span class="is-none"><strong>{{ counts.none }}</strong> belum dicatat</span>
          <span class="as-save" :class="`is-${saveState}`">{{ saveLabel }}</span>
          <button v-if="saveState === 'error'" type="button" class="as-retry" @click="retryNow">Coba lagi</button>
        </template>
      </div>
    </div>

    <PageSkeleton v-if="loading && !sheet" :rows="6" label="Memuat daftar santri" />
    <p v-else-if="loadError" class="as-note is-danger" role="alert">{{ loadError }}</p>

    <!-- weekend or full-day holiday: closed like Absensi Guru, with 1-tap shortcut back to the previous school day -->
    <div v-else-if="sheet && sheet.dayOff" class="as-dayoff-card" :class="`is-${sheet.dayOff.kind}`" role="status">
      <span class="as-dayoff-icon" aria-hidden="true">
        <svg v-if="sheet.dayOff.kind === 'weekend'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" /><path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" /><path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="m9.5 14.5 5 5m0-5-5 5" />
        </svg>
      </span>
      <p class="as-closed-title">{{ sheet.dayOff.title }}</p>
      <p v-if="sheet.dayOff.kind === 'holiday' && sheet.dayOff.name" class="as-holiday-reason">{{ sheet.dayOff.name }}</p>
      <p class="as-closed-text">{{ sheet.reason }}</p>
      <p class="as-closed-wali">
        Untuk mengecek atau mengubah absen hari aktif sebelumnya, pilih tanggal di atas atau buka hari aktif terakhir.
      </p>
      <div class="as-holiday-actions">
        <button
          v-if="sheet.dayOff.lastActiveDay"
          type="button"
          class="as-jump"
          @click="setDate(sheet.dayOff.lastActiveDay)"
        >
          <span>← Buka hari aktif terakhir ({{ shortDayLabel(sheet.dayOff.lastActiveDay) }})</span>
        </button>
        <router-link to="/dashboard/izin-santri" class="as-jump">
          <span>Catat izin / sakit santri</span>
          <span aria-hidden="true">›</span>
        </router-link>
      </div>
    </div>

    <!-- emergency session holiday set by admin (Opsi 2: teacher dispensation, santri attendance left empty) -->
    <div v-else-if="sheet && sheet.sessionHoliday" class="as-holiday-card" role="status">
      <span class="as-holiday-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="m9.5 14.5 5 5m0-5-5 5" />
        </svg>
      </span>
      <p class="as-closed-title">Sesi {{ slotLabel }} diliburkan</p>
      <p class="as-holiday-reason">{{ sheet.sessionHoliday.reason }}</p>
      <p class="as-closed-text">
        Absen santri sesi ini dikosongkan (tidak dicatat alfa maupun izin).
        <template v-if="sheet.sessionHoliday.grantDispensation">
          {{ sheet.sessionHoliday.affectedGurus?.length || 0 }} guru sesi mendapat dispensasi Hadir &amp; Non-KBM.
        </template>
      </p>
      <p class="as-closed-wali">
        Ditetapkan oleh {{ sheet.sessionHoliday.createdByName || 'Admin TPQ' }}.
      </p>
      <div class="as-holiday-actions">
        <button v-if="otherSlot" type="button" class="as-jump" @click="setSlot(otherSlot.id)">
          <span>Buka sesi {{ otherSlot.label }}</span>
          <span aria-hidden="true">›</span>
        </button>
        <button v-if="isAdmin" type="button" class="as-holiday-cancel" :disabled="holidayBusy" @click="cancelCurrentHoliday">
          {{ holidayBusy ? 'Membatalkan…' : 'Batalkan libur sesi' }}
        </button>
      </div>
    </div>

    <!-- the sesi has not started: nothing is recorded yet (a child is not "alfa" for a lesson still to come) -->
    <div v-else-if="sheet && sheet.notOpenYet" class="as-closed" role="status">
      <span class="as-closed-icon" aria-hidden="true">🕒</span>
      <p class="as-closed-title">Sesi {{ slotLabel }} belum dimulai</p>
      <p class="as-closed-text">
        Absen dibuka pukul <strong>{{ String(sheet.opensAt || '').replace(':', '.') }}</strong>, saat ngaji dimulai. Halaman ini terbuka
        sendiri pada jamnya.
      </p>
      <div v-if="fromWali.length" class="as-closed-wali-box">
        <p class="as-closed-wali-title">
          {{ closedWaliTitle }}
        </p>
        <ul class="as-closed-wali-list">
          <li v-for="w in fromWali" :key="w.id" class="as-closed-wali-row">
            <span class="as-closed-wali-name">
              <strong>{{ w.name }}</strong>
              <span v-if="w.jilidLabel" class="as-closed-wali-jilid">{{ w.jilidLabel }}</span>
            </span>
            <span class="as-wali-pill" :class="`is-${w.status}`">{{ w.status === 'sakit' ? 'Sakit' : 'Izin' }}</span>
          </li>
        </ul>
      </div>
      <button v-if="otherSlot && sheetOf(otherSlot.id)?.canEdit" type="button" class="as-jump" @click="setSlot(otherSlot.id)">
        <span>Buka absen sesi {{ otherSlot.label }}</span>
        <span aria-hidden="true">›</span>
      </button>
      <router-link to="/dashboard/izin-santri" class="as-jump">
        <span>Catat izin / sakit santri</span>
        <span aria-hidden="true">›</span>
      </router-link>
    </div>

    <template v-else-if="sheet">
      <p v-if="sheet.lateEdit && sheet.canEdit" class="as-note is-warn" role="status">
        Absen kemarin masih bisa diubah sampai pukul 12.00 hari ini, dengan konfirmasi. Setiap perubahan dikabarkan ke guru koordinator.
      </p>
      <p v-else-if="sheet.pastDay && sheet.canEdit" class="as-note is-warn" role="status">
        Ini absen hari yang sudah lewat. Setiap perubahan diminta konfirmasi dulu dan dicatat atas nama Antum.
      </p>
      <p v-if="!sheet.canEdit" class="as-note is-warn" role="status">
        {{ sheet.reason }}
        <router-link v-if="/absen kehadiran/.test(sheet.reason)" to="/dashboard/attendance" class="as-inline-link">Buka Absensi</router-link>
      </p>

      <!-- the parents told the TPQ ahead through the portal: compact disclosure so mobile stays scannable -->
      <section v-if="shownFromWali.length" class="as-wali-card" aria-label="Izin dan sakit dari wali">
        <button
          type="button"
          class="as-wali-head"
          :aria-expanded="waliListOpen"
          aria-controls="as-wali-panel"
          @click="waliListOpen = !waliListOpen"
        >
          <span class="as-wali-ico" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
          <span class="as-wali-summary">
            <strong class="as-wali-title">{{ waliSummary.title }}</strong>
            <span class="as-wali-meta">{{ waliSummary.meta }}</span>
          </span>
          <span class="as-wali-toggle">
            <span>{{ waliListOpen ? 'Tutup' : 'Lihat' }}</span>
            <svg class="as-wali-chev" :class="{ 'is-open': waliListOpen }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        <div v-if="waliListOpen" id="as-wali-panel" class="as-wali-panel">
          <ul class="as-wali-list">
            <li v-for="w in shownFromWali" :key="w.id" class="as-wali-li">
              <button
                type="button"
                class="as-wali-item"
                :aria-label="`Lihat baris ${w.name}`"
                @click="jumpToSantri(w)"
              >
                <span class="as-wali-person">
                  <span class="as-wali-name-line">
                    <strong class="as-wali-name">{{ w.name }}</strong>
                    <span v-if="w.jilidLabel && !myJilidFilterActive" class="as-wali-jilid">{{ w.jilidLabel }}</span>
                  </span>
                  <span v-if="w.reason" class="as-wali-reason">"{{ w.reason }}"</span>
                </span>
                <span class="as-wali-right">
                  <span class="as-wali-pill" :class="`is-${w.status}`">{{ w.status === 'sakit' ? 'Sakit' : 'Izin' }}</span>
                  <svg class="as-wali-go" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </button>
            </li>
          </ul>
          <p class="as-wali-foot">
            <template v-if="sheet.canEdit">
              Baris terkunci otomatis. Ketuk nama untuk lompat ke barisnya, lalu pilih "Ubah status" bila perlu mengganti.
            </template>
            <template v-else>
              Baris tercatat dan terkunci otomatis dari laporan wali.
            </template>
          </p>
        </div>
      </section>

      <!-- why something was not saved (the server refused it, or the session ended) -->
      <p v-if="saveNote" class="as-note is-warn as-save-note" role="alert">{{ saveNote }}</p>

      <div class="as-filter-row">
        <label class="sr-only" for="as-search">Cari nama santri</label>
        <input
          id="as-search"
          ref="listTop"
          v-model="search"
          class="as-input as-search"
          :placeholder="myJilidFilterActive && myJilidLabel ? `Cari nama atau panggilan (${myJilidLabel})` : 'Cari nama atau panggilan (semua jilid)'"
        />
        <label v-if="!isAdmin && mySlotClassIds.length" class="as-my-toggle" :class="{ 'is-active': onlyMyJilid }">
          <input v-model="onlyMyJilid" type="checkbox" />
          <span>Hanya jilid saya <strong>({{ myJilidLabel }})</strong></span>
        </label>
      </div>

      <template v-for="g in shownGroups" :key="g.classId">
        <!-- each sesi keeps its own attendance: the other sesi's jilid are said to be so -->
        <p v-if="g === firstOther && !search" class="as-others-note">
          Di bawah ini jilid yang jadwalnya <strong>sesi {{ otherSlot.label }}</strong>. Yang tercatat di sini hanya santrinya yang
          ikut sesi {{ slotLabel }}. Absen sesi {{ otherSlot.label }} ada di tab <strong>{{ otherSlot.label }}</strong>.
        </p>
        <section class="as-group" :class="{ 'is-other': !g.own }" :aria-labelledby="`as-g-${g.classId}`" :data-class="g.classId">
          <div class="as-group-head">
            <button type="button" class="as-group-toggle" :aria-expanded="isOpen(g)" @click="toggle(g.classId)">
              <span :id="`as-g-${g.classId}`" class="as-group-name">{{ g.titip ? 'Titipan' : levelName(g.classId) }}</span>
              <span class="as-group-count">{{ groupCountText(g) }}</span>
              <span class="as-chevron" aria-hidden="true">{{ isOpen(g) ? '▾' : '▸' }}</span>
            </button>
            <button v-if="sheet.canEdit && isOpen(g) && g.own && g.recorded < g.items.length" type="button" class="as-all" @click="markRest(g)">
              Tandai sisanya hadir
            </button>
            <button v-if="!g.own && otherSheetHas(g.classId)" type="button" class="as-jump" @click="jumpTo(g.classId)">
              Lihat di sesi {{ otherSlot.label }} · {{ otherRecordedOf(g.classId) }}/{{ g.items.length }} dicatat ›
            </button>
          </div>
        <p v-if="!search && awayOf(g.classId).length" class="as-away">
          Dititipkan ke sesi lain: {{ awayOf(g.classId).map((x) => `${x.name} (${slotName(x.titip.slot)}, ${x.titip.hostGuruName})`).join(', ') }}
        </p>
        <ul v-if="isOpen(g)" class="as-list">
          <li v-for="s in g.items" :key="s.id" class="as-row" :class="{ 'is-locked': isLocked(s.id), 'is-highlighted': highlightedId === s.id }" :data-santri="s.id">
            <div class="as-name">
              <strong>{{ s.name }}</strong>
              <span v-if="s.nickname" class="as-nickname">Panggilan: <em>{{ s.nickname }}</em></span>
              <span v-if="s.titip" class="as-titip">{{ titipNote(s) }}</span>
              <span v-if="recordOf(s.id)?.source === 'wali'" class="as-by is-wali">
                {{ recordOf(s.id).status === 'sakit' ? 'Sakit' : 'Izin' }} dari {{ recordOf(s.id).byName }}<template v-if="recordOf(s.id).reason">: "{{ recordOf(s.id).reason }}"</template>
              </span>
              <span v-else-if="recordOf(s.id)?.byName" class="as-by">
                {{ recordOf(s.id).source === 'kbm' ? 'dari KBM' : 'oleh' }} {{ recordOf(s.id).byName }}<template v-if="recordOf(s.id).changedFrom">
                  · menggantikan {{ recordOf(s.id).changedFrom.status }} dari wali</template>
              </span>
              <button v-if="sheet.canEdit && isLocked(s.id)" type="button" class="as-unlock" :aria-label="`Ubah status ${s.name}`" @click="unlock(s)">
                🔒 Ubah status
              </button>
            </div>
            <div class="as-choices" role="group" :aria-label="`Status ${s.name}`">
              <button v-for="st in STATUSES" :key="st.key" type="button" class="as-choice" :class="`is-${st.key}`"
                :aria-pressed="statusOf(s.id) === st.key" :disabled="!sheet.canEdit || isLocked(s.id)" @click="choose(s.id, st.key)">
                {{ st.label }}
              </button>
            </div>
          </li>
        </ul>
        </section>
      </template>
      <p v-if="!shownGroups.length" class="as-empty">Tidak ada santri yang cocok.</p>

      <button v-if="!search && !myJilidFilterActive && otherGroups.length" type="button" class="as-more" @click="showOthers = !showOthers">
        {{ showOthers ? 'Sembunyikan jilid lain' : `Ada santri jilid lain yang ikut sesi ${slotLabel}? Tampilkan jilid lain (${otherCount} santri)` }}
      </button>
      <p class="as-foot">Ketuk status yang sama sekali lagi untuk menghapusnya. Santri yang tidak dicatat tidak dianggap alfa. Baris izin/sakit dari wali terkunci.</p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import AbsenReports from '@/components/absen/AbsenReports.vue'
import EarlyAudit from '@/components/absen/EarlyAudit.vue'
import TitipSheet from '@/components/absen/TitipSheet.vue'
import SessionHolidaySheet from '@/components/absen/SessionHolidaySheet.vue'
import { useAuthStore } from '@/stores/auth'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const { ask } = useDialog()
const { success, error: showError } = useToast()
const isAdmin = computed(() => authStore.user?.role === 'admin')

const SLOTS = [
  { id: 'wave_1', label: 'Sore' },
  { id: 'wave_2', label: 'Malam' },
]
const STATUSES = [
  { key: 'hadir', label: 'Hadir' },
  { key: 'izin', label: 'Izin' },
  { key: 'sakit', label: 'Sakit' },
  { key: 'alfa', label: 'Alfa' },
]
const TALLY = STATUSES.map((s) => ({ key: s.key, label: s.label.toLowerCase() }))
const SAVE_TEXT = { idle: '', saving: 'Menyimpan…', saved: 'Tersimpan ✓', error: 'Belum tersimpan', refused: 'Sebagian tidak tersimpan' }

const wibNow = () => new Date(Date.now() + 7 * 3600 * 1000)
const today = wibNow().toISOString().slice(0, 10)
const defaultMin = new Date(Date.now() + 7 * 3600 * 1000 - 2 * 86400000).toISOString().slice(0, 10)
// the admin (or a guru given "Absen Santri tanpa batas hari") may open any past day; on a weekend/holiday, always allow jumping to lastActiveDay
const minDate = computed(() => {
  if (sheet.value && sheet.value.daysBack === null) return undefined
  const last = sheet.value?.dayOff?.lastActiveDay
  return last && last < defaultMin ? last : defaultMin
})
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Belum ada jilid')
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const shortDayLabel = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  return `${DAYS_ID[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}

const date = ref(today)
// from 18:00 WIB (when it opens) the malam sesi
const slot = ref(wibNow().toISOString().slice(11, 16) >= '18:00' ? 'wave_2' : 'wave_1')
const sheet = ref(null)
const records = ref({})
const loading = ref(false)
const loadError = ref('')
const search = ref('')
const showOthers = ref(false)
// Guru quick-focus filter: defaults to all jilids (false); only applies to the guru's jilid(s) scheduled in THIS sesi
const myClassIds = ref([])
const onlyMyJilid = ref(false)
const myUid = computed(() => authStore.user?.id || authStore.user?.uid || '')
const mySlotClassIds = computed(() => myClassIds.value.filter((id) => (sheet.value?.defaultClassIds || []).includes(id)))
const myJilidFilterActive = computed(() => onlyMyJilid.value && mySlotClassIds.value.length > 0)
const myJilidLabel = computed(() => mySlotClassIds.value.map((id) => levelName(id)).join(', '))
const isMySlotClass = (classId) => mySlotClassIds.value.includes(String(classId || ''))
const isMyTitip = (s) => titipHere(s) && (isMySlotClass(s.classId) || (!!myUid.value && s.titip?.hostGuruId === myUid.value))
const isMyTitipId = (id) => {
  const s = sheet.value?.santri?.find((x) => x.id === id)
  return !!s && isMyTitip(s)
}
const opened = ref({})
const saveState = ref('idle')
const saveNote = ref('')
const unlocked = ref({}) // santri whose parent's izin the person confirmed to change
const titipOpen = ref(false)
const holidayOpen = ref(false)
const holidayBusy = ref(false)
const confirmed = ref({}) // `${date}|${slot}` (a past day) or `${date}|${slot}|${santriId}` (a kabar alfa sent): asked once
const reportsBox = ref(null)
const auditBox = ref(null)
const pendingCount = ref(0)
// the other sesi of the same day (its jilid and how many are recorded there), for the tabs and the other jilid
const otherSheet = ref(null)
const bar = ref(null)
const listTop = ref(null)
const hintWrap = ref(null)
const hintOpen = ref(false)
const waliListOpen = ref(false)
const highlightedId = ref('')
let highlightTimer = null
let jumpClass = '' // after switching sesi from "Lihat di sesi …": the jilid to open and show

const recordOf = (id) => records.value[id] || null
// izin / sakit the parents sent from the wali portal
const fromWali = computed(() =>
  Object.entries(records.value)
    .filter(([, r]) => r?.source === 'wali')
    .map(([id, r]) => {
      const s = sheet.value?.santri.find((x) => x.id === id)
      const isTitip = !!s && titipHere(s)
      return {
        id,
        status: r.status,
        name: s?.name || '',
        nickname: s?.nickname || '',
        classId: s?.classId || '',
        groupKey: isTitip ? 'titip' : (s?.classId || ''),
        jilidLabel: s ? (isTitip ? `Titipan · ${levelName(s.classId)}` : levelName(s.classId)) : '',
        reason: (r.reason || '').trim(),
      }
    })
    .filter((x) => x.name)
    .sort((a, b) => String(a.classId).localeCompare(String(b.classId), undefined, { numeric: true }) || a.name.localeCompare(b.name, 'id')),
)
const shownFromWali = computed(() => (myJilidFilterActive.value ? fromWali.value.filter((x) => isMySlotClass(x.classId) || isMyTitipId(x.id)) : fromWali.value))
const waliKindLabel = (items) => {
  const izin = items.filter((x) => x.status === 'izin').length
  const sakit = items.filter((x) => x.status === 'sakit').length
  return { izin, sakit, kind: izin && sakit ? 'izin & sakit' : sakit ? 'sakit' : 'izin' }
}
const closedWaliTitle = computed(() => {
  const { kind } = waliKindLabel(fromWali.value)
  return `${fromWali.value.length} ${kind} dari wali sudah masuk`
})
const waliSummary = computed(() => {
  const items = shownFromWali.value
  const { izin, sakit, kind } = waliKindLabel(items)
  const scope = myJilidFilterActive.value && myJilidLabel.value ? ` · ${myJilidLabel.value}` : ''
  const title = `${items.length} ${kind} dari wali${scope}`
  const parts = []
  if (izin && sakit) parts.push(`${izin} izin`, `${sakit} sakit`)
  parts.push('tercatat & terkunci')
  return { title, meta: parts.join(' · ') }
})
const statusOf = (id) => records.value[id]?.status || null

// Titip santri (services/santri_titip_service.js): a child who goes to THIS sesi that day is in the "Titipan" group
// on top; a child who goes to the other sesi is left out of their jilid here (named under it, never "belum dicatat")
const titipHere = (s) => !!s.titip && s.titip.slot === sheet.value?.slot
const titipAway = (s) => !!s.titip && s.titip.slot !== sheet.value?.slot
const slotName = (id) => (id === 'wave_2' ? 'Malam' : 'Sore')
const titipNote = (s) => (titipHere(s)
  ? `${levelName(s.classId)} · dititipkan ke ${s.titip.hostGuruName}`
  : `dititipkan ke sesi ${slotName(s.titip.slot)} (${s.titip.hostGuruName})`)
const awayOf = (classId) => (sheet.value?.santri || []).filter((s) => s.classId === classId && titipAway(s))
const groupOf = (classId, items, extra = {}) => ({
  classId,
  items,
  recorded: items.filter((s) => statusOf(s.id)).length,
  own: (sheet.value?.defaultClassIds || []).includes(classId),
  ...extra,
})
const groups = computed(() => {
  const map = new Map()
  for (const s of sheet.value?.santri || []) {
    if (s.titip) continue
    if (!map.has(s.classId)) map.set(s.classId, [])
    map.get(s.classId).push(s)
  }
  const titipan = (sheet.value?.santri || []).filter(titipHere)
  return [
    ...(titipan.length ? [groupOf('titip', titipan, { own: true, titip: true })] : []),
    ...[...map.entries()].map(([classId, items]) => groupOf(classId, items)),
  ]
})
const otherGroups = computed(() => groups.value.filter((g) => !g.own))
const slotLabel = computed(() => SLOTS.find((x) => x.id === slot.value)?.label || '')
const otherSlot = computed(() => SLOTS.find((x) => x.id !== slot.value))
const recordedIn = (sh) => Object.values(sh?.records || {}).filter((r) => r?.status).length
// "Jilid 1–4", "Jilid 5, 6, Marhalah"
function jilidRange(ids) {
  const nums = ids.filter((i) => String(i) !== '7')
  const parts = []
  if (nums.length > 2) parts.push(`Jilid ${nums[0]}–${nums[nums.length - 1]}`)
  else if (nums.length) parts.push(`Jilid ${nums.join(', ')}`)
  if (ids.some((i) => String(i) === '7')) parts.push('Marhalah')
  return parts.join(', ')
}
// each sesi tab: "Sore  38 dicatat" over "Jilid 1–4"
const sheetOf = (id) => (id === slot.value ? sheet.value : otherSheet.value?.slot === id ? otherSheet.value : null)
const slotJilid = (id) => jilidRange(sheetOf(id)?.defaultClassIds || [])
function slotCount(id) {
  const sh = sheetOf(id)
  if (!sh) return null
  return id === slot.value ? Object.values(records.value).filter((r) => r?.status).length : recordedIn(sh)
}
const otherSheetHas = (classId) => (otherSheet.value?.defaultClassIds || []).includes(classId)
function otherRecordedOf(classId) {
  const sh = otherSheet.value
  if (!sh) return 0
  const ids = new Set((sh.santri || []).filter((s) => s.classId === classId).map((s) => s.id))
  return Object.entries(sh.records || {}).filter(([id, r]) => ids.has(id) && r?.status).length
}
// own jilid: "8/8 dicatat"; another sesi's jilid: only who came to this sesi
const groupCountText = (g) => (g.own || g.searching
  ? `${g.recorded}/${g.items.length} dicatat`
  : g.recorded ? `${g.recorded} ikut sesi ${slotLabel.value}` : `belum ada yang ikut sesi ${slotLabel.value}`)
const otherCount = computed(() => otherGroups.value.reduce((n, g) => n + g.items.length, 0))
const matchesSantri = (s, q) => (s.name || '').toLowerCase().includes(q) || (s.nickname || '').toLowerCase().includes(q)
const baseGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (q) {
    // a search finds every child, also one dititipkan to the other sesi (shown in their jilid, with the note)
    const away = (sheet.value?.santri || []).filter(titipAway)
    return groups.value
      .map((g) => ({ ...g, items: [...g.items, ...(g.titip ? [] : away.filter((s) => s.classId === g.classId))] }))
      .map((g) => ({ ...g, items: g.items.filter((s) => matchesSantri(s, q)), searching: true }))
      .filter((g) => g.items.length)
  }
  // the sesi's own jilid first, then (on request, or when someone of another jilid is already recorded) the others
  return [...groups.value.filter((g) => g.own), ...groups.value.filter((g) => !g.own && (showOthers.value || g.recorded > 0))]
})
const shownGroups = computed(() => {
  if (!myJilidFilterActive.value) return baseGroups.value
  const q = search.value.trim().toLowerCase()
  const mine = groups.value
    .filter((g) => g.own)
    .map((g) => {
      if (g.titip) {
        const items = g.items.filter(isMyTitip)
        return items.length ? { ...g, items, recorded: items.filter((s) => statusOf(s.id)).length } : null
      }
      return isMySlotClass(g.classId) ? g : null
    })
    .filter(Boolean)
  if (!q) return mine
  const away = (sheet.value?.santri || []).filter((s) => titipAway(s) && isMySlotClass(s.classId))
  return mine
    .map((g) => ({ ...g, items: [...g.items, ...(g.titip ? [] : away.filter((s) => s.classId === g.classId))] }))
    .map((g) => ({ ...g, items: g.items.filter((s) => matchesSantri(s, q)), searching: true }))
    .filter((g) => g.items.length)
})
const firstOther = computed(() => shownGroups.value.find((g) => !g.own) || null)
const isOpen = (g) => g.searching || (opened.value[g.classId] ?? g.own)
const toggle = (classId) => {
  const g = groups.value.find((x) => x.classId === classId)
  opened.value = { ...opened.value, [classId]: !isOpen(g) }
}
const counts = computed(() => {
  const c = { hadir: 0, izin: 0, sakit: 0, alfa: 0, none: 0 }
  const filterMine = myJilidFilterActive.value
  for (const s of sheet.value?.santri || []) {
    if (filterMine && !isMySlotClass(s.classId) && !isMyTitip(s)) continue
    const st = statusOf(s.id)
    if (st) c[st] += 1
    else if (s.titip ? titipHere(s) : (sheet.value?.defaultClassIds || []).includes(s.classId)) c.none += 1
  }
  return c
})

// A row the parent's izin/sakit holds: its buttons are off until the person says "Ubah status" and confirms
const isLocked = (id) => records.value[id]?.locked === true && !unlocked.value[id]

// ---------------------------------------------------------------------------------------------------------------
// Loading. A late answer to an old question is dropped (loadSeq), and a refresh in the background never replaces
// what the person is in the middle of saving.
let loadSeq = 0
async function load({ silent = false } = {}) {
  const mine = ++loadSeq
  const d = date.value
  const sl = slot.value
  if (!silent) {
    loading.value = true
    loadError.value = ''
  }
  try {
    const { data } = await api.get('/santri-presence', { params: { date: d, slot: sl }, cache: false })
    if (mine !== loadSeq) return
    if (silent && (pending.size || sending > 0)) return // taps are on their way: they show the newest state
    sheet.value = data
    records.value = withPending(data.records, d, sl)
    loadOther(d, sl, mine)
    if (!silent) {
      opened.value = {}
      unlocked.value = {}
      if (!pending.size) saveState.value = 'idle'
      afterSwitch()
    }
  } catch (err) {
    if (mine === loadSeq && !silent) {
      sheet.value = null
      loadError.value = err.response?.data?.error || 'Daftar santri belum bisa dimuat.'
    }
  } finally {
    if (mine === loadSeq) loading.value = false
  }
}

// the other sesi of the same day, for its tab and "Lihat di sesi …" (never blocks the page; a failure shows nothing)
async function loadOther(d, sl, seq) {
  const other = SLOTS.find((x) => x.id !== sl)?.id
  if (!other) return
  try {
    const { data } = await api.get('/santri-presence', { params: { date: d, slot: other }, cache: false })
    if (seq === loadSeq) otherSheet.value = data
  } catch {
    if (seq === loadSeq) otherSheet.value = null
  }
}

// After switching sesi (or day) while scrolled down: back to the top of the list, under the bar; from "Lihat di sesi
// …" straight to that jilid, opened.
let scrollAfterLoad = false
function stickyBottom() {
  const el = bar.value
  if (!el) return 0
  return (parseFloat(getComputedStyle(el).top) || 0) + el.offsetHeight + 8
}
function afterSwitch() {
  const target = jumpClass
  const wanted = scrollAfterLoad
  jumpClass = ''
  scrollAfterLoad = false
  if (!target && !wanted) return
  nextTick(() => {
    const el = target ? document.querySelector(`.as-group[data-class="${target}"]`) : listTop.value
    if (!el) return
    if (target) opened.value = { ...opened.value, [target]: true }
    const below = stickyBottom()
    // only when it is hidden under the bar (scrolled past); a page already at the top stays where it is
    if (!target && el.getBoundingClientRect().top >= below) return
    el.style.scrollMarginTop = `${below}px`
    el.scrollIntoView({ block: 'start', behavior: 'smooth' })
  })
}
function jumpTo(classId) {
  const other = otherSlot.value?.id
  if (!other) return
  jumpClass = classId
  setSlot(other)
}
function jumpToSantri(item) {
  if (!item?.id) return
  waliListOpen.value = false
  const g = groups.value.find((x) => x.classId === item.groupKey)
  if (g && !g.own) showOthers.value = true
  if (item.groupKey) opened.value = { ...opened.value, [item.groupKey]: true }
  if (search.value.trim() && !matchesSantri(item, search.value.trim().toLowerCase())) {
    search.value = ''
  }
  nextTick(() => {
    const safeId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(item.id) : item.id
    const el = document.querySelector(`.as-row[data-santri="${safeId}"]`)
    if (!el) return
    el.style.scrollMarginTop = `${stickyBottom()}px`
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
    highlightedId.value = item.id
    clearTimeout(highlightTimer)
    highlightTimer = setTimeout(() => {
      if (highlightedId.value === item.id) highlightedId.value = ''
    }, 2000)
  })
}

// ---------------------------------------------------------------------------------------------------------------
// Autosave. Every tap is shown at once and sent shortly after, several taps in one request.
//  - a tap remembers the day and sesi it was made on, so it can never land on another day
//  - requests go one after another (a slower earlier answer cannot overwrite a newer one)
//  - a network failure keeps the taps and tries again by itself; the server refusing is told to the person
//  - leaving the page (route, tab, browser) with something unsent is stopped or flushed
const pending = new Map() // `${date}|${slot}|${santriId}` -> { date, slot, santriId, status, override }
const keyOf = (d, sl, id) => `${d}|${sl}|${id}`
const touch = () => { pendingCount.value = pending.size }
let timer = null
let retryTimer = null
let retries = 0
let sending = 0
let alive = true
let chain = Promise.resolve()
let lastTap = { id: '', status: '', at: 0 }
const RETRY_AFTER = [4000, 10000, 25000]

const saveLabel = computed(() => (saveState.value === 'error' && pendingCount.value ? `${SAVE_TEXT.error} (${pendingCount.value})` : SAVE_TEXT[saveState.value]))

// the server's records for this view, with the taps that are still waiting laid over them
function withPending(serverRecords, d, sl) {
  const out = { ...(serverRecords || {}) }
  for (const m of pending.values()) {
    if (m.date !== d || m.slot !== sl) continue
    if (m.status) out[m.santriId] = { status: m.status, byName: 'Antum', source: 'absen' }
    else delete out[m.santriId]
  }
  return out
}

function queue(santriId, status) {
  const d = date.value
  const sl = slot.value
  // a row still holding the parent's izin: this change needs the confirmation the person gave
  const override = records.value[santriId]?.locked === true
  const next = { ...records.value }
  if (status) next[santriId] = { status, byName: 'Antum', source: 'absen' }
  else delete next[santriId]
  records.value = next
  pending.set(keyOf(d, sl, santriId), { date: d, slot: sl, santriId, status, override })
  touch()
  saveNote.value = ''
  saveState.value = 'saving'
  clearTimeout(timer)
  timer = setTimeout(flush, 600)
}

// A past day (the admin, or a guru with the access): asked once per day and sesi
async function pastDayOk() {
  const sh = sheet.value
  if (!sh?.pastDay) return true
  const key = `${sh.date}|${sh.slot}`
  if (confirmed.value[key]) return true
  const ok = await ask({
    title: sh.lateEdit ? 'Ubah absen kemarin?' : 'Ubah absen hari yang sudah lewat?',
    message: sh.lateEdit
      ? `Absen ${sh.date.split('-').reverse().join('/')} sesi ${slotLabel.value} masih bisa diubah sampai pukul 12.00. Setiap perubahan dikabarkan ke guru koordinator, dan bila kabar alfa sudah terkirim, wali otomatis mendapat pesan koreksi.`
      : `Absen ${sh.date.split('-').reverse().join('/')} sesi ${slotLabel.value} sudah ditutup untuk guru. Perubahan tercatat atas nama Antum, dan bila kabar alfa sudah terkirim, wali otomatis mendapat pesan koreksi.`,
    confirmText: 'Ya, ubah',
    cancelText: 'Batal',
  })
  if (ok) confirmed.value = { ...confirmed.value, [key]: true }
  return ok
}

// The wali was already told "alfa": a change sends them a correction with an apology. Asked once per child.
async function alfaToldOk(santriId, status) {
  const sh = sheet.value
  if (!(sh?.alfaSent || []).includes(santriId) || statusOf(santriId) !== 'alfa' || status === 'alfa') return true
  const key = `${sh.date}|${sh.slot}|${santriId}`
  if (confirmed.value[key]) return true
  const name = sh.santri.find((s) => s.id === santriId)?.name || 'santri ini'
  const ok = await ask({
    title: `Kabar alfa ${name} sudah terkirim`,
    message: `Wali ${name} sudah menerima kabar alfa lewat WhatsApp. Bila diubah, wali otomatis mendapat pesan koreksi dengan permintaan maaf. Ubah hanya bila memang keliru.`,
    confirmText: 'Ya, ubah',
    cancelText: 'Biarkan alfa',
    tone: 'danger',
  })
  if (ok) confirmed.value = { ...confirmed.value, [key]: true }
  return ok
}

// Recording a santri whose scheduled jilid belongs to the OTHER sesi (and not formally titipan here) asks first
// so a stray tap can never accidentally place a Malam child into Sore (or vice versa). Clearing an existing record never blocks.
async function otherSlotOk(santriId, nextStatus) {
  if (!nextStatus) return true
  const sh = sheet.value
  const s = sh?.santri?.find((x) => x.id === santriId)
  if (!s) return true
  if (titipHere(s) || (sh.defaultClassIds || []).includes(s.classId)) return true
  const key = `other|${sh.date}|${sh.slot}|${santriId}`
  if (confirmed.value[key]) return true
  const stLabel = STATUSES.find((x) => x.key === nextStatus)?.label?.toLowerCase() || nextStatus
  const ok = await ask({
    title: `Catat ${s.name} di sesi ${slotLabel.value}?`,
    message: `${s.name} terdaftar di ${levelName(s.classId)} (jadwal sesi ${otherSlot.value?.label || 'lain'}). Yakin ingin mencatat ${stLabel} di sesi ${slotLabel.value}? Bila rutin pindah sesi, gunakan menu "Titip santri".`,
    confirmText: `Ya, catat di sesi ${slotLabel.value}`,
    cancelText: 'Batal',
  })
  if (ok) confirmed.value = { ...confirmed.value, [key]: true }
  return ok
}

async function choose(santriId, status) {
  if (isLocked(santriId)) return
  const same = statusOf(santriId) === status
  const now = Date.now()
  // a second tap right after the first (a double tap) must not undo it
  if (same && lastTap.id === santriId && lastTap.status === status && now - lastTap.at < 450) return
  lastTap = { id: santriId, status, at: now }
  // the parent's own status is not cleared by tapping it again
  if (same && records.value[santriId]?.locked) return
  const view = `${date.value}|${slot.value}`
  if (!(await pastDayOk()) || !(await alfaToldOk(santriId, same ? null : status))) return
  if (!(await otherSlotOk(santriId, same ? null : status))) return
  if (view !== `${date.value}|${slot.value}`) return // switched while the question was open
  queue(santriId, same ? null : status)
}

async function markRest(g) {
  if (!(await pastDayOk())) return
  g.items.filter((s) => !statusOf(s.id)).forEach((s) => queue(s.id, 'hadir'))
}

// a titip set or ended: the groups of this sheet (and the other sesi's count) change
function onTitipChanged() {
  if (!pending.size) load({ silent: true })
}

// a session holiday was set or cancelled: reload both sesi of this day
function onHolidayChanged() {
  if (!pending.size) load({ silent: true })
}

async function cancelCurrentHoliday() {
  const h = sheet.value?.sessionHoliday
  if (!h || holidayBusy.value) return
  const ok = await ask({
    title: `Batalkan libur ${h.slotLabel || `Sesi ${slotLabel.value}`}?`,
    message: `Libur sesi (${h.reason}) akan dibatalkan beserta dispensasi Hadir & Non-KBM otomatis untuk guru sesi ini.`,
    confirmText: 'Ya, batalkan',
    cancelText: 'Tutup',
    tone: 'danger',
  })
  if (!ok) return
  holidayBusy.value = true
  try {
    await api.delete(`/santri-presence/session-holidays/${encodeURIComponent(h.id)}`)
    success(`Libur ${h.slotLabel || `Sesi ${slotLabel.value}`} dibatalkan.`)
    await load()
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal membatalkan libur sesi.')
  } finally {
    holidayBusy.value = false
  }
}

// a report answered or an early record cleared: the sheet on screen may show it
function onOutsideChange({ date: d, slot: sl } = {}) {
  if (d !== date.value || pending.size) return
  if (!sl || sl === slot.value) load({ silent: true })
  else loadOther(date.value, slot.value, loadSeq)
}

async function unlock(s) {
  const r = recordOf(s.id)
  if (!r || !sheet.value?.canEdit) return
  const ok = await ask({
    title: `Ubah status ${s.name}?`,
    message: `${r.status === 'sakit' ? 'Sakit' : 'Izin'} ini dikirim oleh ${r.byName || 'wali'}${r.reason ? `: "${r.reason}"` : ''}. Jika diubah, izin dari wali itu diganti dengan catatan Antum. Ubah hanya bila santri memang datang atau keadaannya berbeda.`,
    confirmText: 'Ya, ubah',
    cancelText: 'Biarkan',
    tone: 'danger',
  })
  if (ok) unlocked.value = { ...unlocked.value, [s.id]: true }
}

// a failure that may pass by itself (no connection, a busy server) keeps the taps; the rest is a "no" from the server
const retriable = (err) => !err.response || err.response.status >= 500 || [408, 429].includes(err.response.status)

function scheduleRetry() {
  clearTimeout(retryTimer)
  if (!alive || !pending.size) return
  const wait = RETRY_AFTER[Math.min(retries, RETRY_AFTER.length - 1)]
  retries += 1
  retryTimer = setTimeout(flush, wait)
}

function flush() {
  clearTimeout(timer)
  // one request at a time, in the order the taps were made
  chain = chain.then(sendAll, sendAll)
  return chain
}

function retryNow() {
  retries = 0
  return flush()
}

async function sendAll() {
  clearTimeout(timer)
  clearTimeout(retryTimer)
  let failed = false
  let refusal = ''
  while (pending.size) {
    const first = pending.values().next().value
    const ctx = { date: first.date, slot: first.slot }
    const batch = [...pending.entries()].filter(([, m]) => m.date === ctx.date && m.slot === ctx.slot)
    batch.forEach(([k]) => pending.delete(k))
    touch()
    saveState.value = 'saving'
    sending += 1
    try {
      const marks = batch.map(([, m]) => ({ santriId: m.santriId, status: m.status, ...(m.override ? { override: true } : {}) }))
      // a past day: the person confirmed before the tap was queued (pastDayOk)
      const { data } = await api.put('/santri-presence', { ...ctx, marks, ...(ctx.date < today ? { confirmLate: true } : {}) })
      const stillHere = ctx.date === date.value && ctx.slot === slot.value
      if (stillHere) records.value = withPending(data.records, ctx.date, ctx.slot)
      if (data.locked?.length) {
        refusal = `${data.locked.map((x) => x.name).join(', ')}: izin dari wali tidak diubah.`
      }
      retries = 0
    } catch (err) {
      const status = err.response?.status
      const data = err.response?.data
      if (status === 409 && data?.code === 'WALI_IZIN_LOCKED') {
        // somebody (the parent) recorded it while this page was open: show what is there now
        if (ctx.date === date.value && ctx.slot === slot.value && data.records) records.value = withPending(data.records, ctx.date, ctx.slot)
        refusal = `${(data.locked || []).map((x) => x.name).join(', ') || 'Santri'}: sudah ada izin dari wali, tidak diubah.`
      } else if (status === 401) {
        // the login ended: keep the taps; they cannot be sent until the person signs in again
        batch.forEach(([k, m]) => { if (!pending.has(k)) pending.set(k, m) })
        touch()
        refusal = 'Sesi masuk berakhir. Masuk lagi, lalu ulangi catatan yang belum tersimpan.'
        failed = true
        break
      } else if (retriable(err)) {
        batch.forEach(([k, m]) => { if (!pending.has(k)) pending.set(k, m) })
        touch()
        failed = true
        scheduleRetry()
        break
      } else {
        // 4xx: the server will not take it (e.g. the day is closed to this teacher): say so, and show the true state
        refusal = data?.error || 'Perubahan ditolak server.'
        if (ctx.date === date.value && ctx.slot === slot.value) load({ silent: true })
      }
    } finally {
      sending -= 1
    }
  }
  touch()
  if (failed) saveState.value = 'error'
  else if (refusal) saveState.value = 'refused'
  else saveState.value = pending.size ? 'saving' : 'saved'
  if (refusal) saveNote.value = refusal
}

function resetView() {
  sheet.value = null // the old day's rows are never tapped on a new day
  records.value = {}
  otherSheet.value = null
  showOthers.value = false
  onlyMyJilid.value = false
  waliListOpen.value = false
  highlightedId.value = ''
  saveNote.value = ''
  scrollAfterLoad = true
  load()
}
function setSlot(id) {
  if (id === slot.value) return
  flush() // unsent taps keep their own day and sesi; they are sent (or retried) on their own
  slot.value = id
  resetView()
}
function setDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > today) return
  if (d === date.value) return
  flush()
  date.value = d
  resetView()
}

// ---------------------------------------------------------------------------------------------------------------
// Leaving, coming back
const onHide = () => {
  if (document.visibilityState === 'hidden') flush()
  // back on the tab: the sheet may have changed meanwhile (a parent's izin, another teacher)
  else if (!pending.size && sheet.value) load({ silent: true })
}
const onOnline = () => { if (pending.size) retryNow() }
const onBeforeUnload = (e) => {
  if (!pending.size) return
  e.preventDefault()
  e.returnValue = ''
}
let poll = null
onBeforeRouteLeave(async () => {
  await flush()
  if (!pending.size) return true
  return ask({
    title: 'Ada yang belum tersimpan',
    message: `${pending.size} catatan absen belum terkirim ke server. Jika keluar sekarang, catatan itu hilang.`,
    confirmText: 'Keluar',
    cancelText: 'Tetap di sini',
    tone: 'danger',
  })
})
async function loadMyClasses() {
  if (isAdmin.value) {
    myClassIds.value = []
    return
  }
  try {
    // /santri-changes/me always returns the guru's own taught jilid(s), even if they have the "all-jilid" view feature
    const { data } = await api.get('/santri-changes/me', { cache: false })
    myClassIds.value = Array.isArray(data?.taughtClassIds) ? data.taughtClassIds.map(String).filter(Boolean) : []
  } catch {
    myClassIds.value = []
  }
}

const onDocClick = (e) => {
  if (hintOpen.value && hintWrap.value && !hintWrap.value.contains(e.target)) hintOpen.value = false
}
const onDocKey = (e) => {
  if (hintOpen.value && e.key === 'Escape') hintOpen.value = false
}
onMounted(() => {
  loadMyClasses()
  load()
  document.addEventListener('visibilitychange', onHide)
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onDocKey)
  window.addEventListener('online', onOnline)
  window.addEventListener('beforeunload', onBeforeUnload)
  // a parent's izin may arrive while the page is open
  poll = setInterval(() => {
    if (document.visibilityState === 'visible' && sheet.value && !pending.size && !sending) load({ silent: true })
  }, 60000)
})
onBeforeUnmount(() => {
  alive = false
  document.removeEventListener('visibilitychange', onHide)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onDocKey)
  window.removeEventListener('online', onOnline)
  window.removeEventListener('beforeunload', onBeforeUnload)
  clearInterval(poll)
  clearTimeout(retryTimer)
  clearTimeout(highlightTimer)
  flush()
})
</script>

<style scoped>
.as {
  --ink: #0b3b2a;
  --body: #475a50;
  --muted: #5b6b62;
  --emerald: #0a5c40;
  --line: rgba(11, 59, 42, 0.12);
  color: var(--ink);
}

.as-head h1 {
  margin: 0 0 4px;
  font-size: 1.6rem;
  font-weight: 800;
}

.as-head p {
  margin: 0 0 14px;
  color: var(--body);
  line-height: 1.5;
}

.as-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.as-slots {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
}

.as-slot {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 1px;
  min-height: 48px;
  padding: 4px 8px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  font: inherit;
  color: #3b4a42;
  cursor: pointer;
}

.as-slot-top {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: baseline;
  gap: 2px 8px;
}

.as-slot-name {
  font-weight: 800;
}

.as-slot-count {
  font-size: 0.78rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.as-slot-meta {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.as-slot[aria-pressed="true"] {
  background: var(--emerald);
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.as-slot[aria-pressed="true"] .as-slot-meta {
  color: rgba(255, 255, 255, 0.85);
}

/* the other sesi's jilid: said plainly, a step back from this sesi's own */
.as-others-note {
  margin: 18px 0 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.05);
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--body);
}

.as-group.is-other .as-group-count {
  font-style: italic;
}

.as-jump {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid rgba(10, 92, 64, 0.35);
  background: #fff;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--emerald);
  text-decoration: none;
  box-sizing: border-box;
  max-width: 100%;
  cursor: pointer;
}

.as-jump:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.as-input {
  width: 100%;
  min-height: 46px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  font: inherit;
  color: var(--ink);
  box-sizing: border-box;
}

.as-date {
  flex: 1 1 180px;
}

@media (max-width: 520px) {
  .as-date {
    flex: 1 1 100%;
  }
  .as-controls .as-titip-btn {
    flex: 1 1 calc(50% - 5px);
    padding: 0 10px;
    font-size: 0.84rem;
  }
  .as-controls .as-holiday-btn {
    flex: 1 1 100%;
  }
}

.as-holiday-btn {
  border-color: rgba(3, 105, 161, 0.35);
  color: #0369a1;
  background: #f0f9ff;
}

.as-holiday-card {
  display: grid;
  justify-items: center;
  gap: 8px;
  margin: 12px 0;
  padding: 24px 16px;
  border-radius: 16px;
  border: 1px solid #bae6fd;
  background: #f0f9ff;
  text-align: center;
}

.as-holiday-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #e0f2fe;
  color: #0369a1;
}

.as-dayoff-card {
  display: grid;
  justify-items: center;
  gap: 8px;
  margin: 12px 0;
  padding: 26px 16px;
  border-radius: 16px;
  border: 1px solid rgba(11, 59, 42, 0.14);
  background: #fff;
  text-align: center;
}

.as-dayoff-card.is-holiday {
  background: #fffdf5;
  border-color: #f3d58b;
}

.as-dayoff-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #f1f5f3;
  color: #0b3b2a;
}

.as-dayoff-card.is-holiday .as-dayoff-icon {
  background: #fef3c7;
  color: #b45309;
}

.as-summary .is-dayoff-bar {
  color: #475a50;
}

.as-summary .is-dayoff-bar strong {
  color: var(--ink);
}

.as-holiday-reason {
  margin: 0;
  padding: 4px 12px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #075985;
  font-size: 0.88rem;
  font-weight: 700;
}

.as-holiday-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 6px;
  width: 100%;
}

.as-holiday-cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid rgba(180, 35, 24, 0.35);
  background: #fff;
  color: #b42318;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.as-holiday-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* the sesi has not started yet */
.as-closed {
  display: grid;
  justify-items: center;
  gap: 6px;
  margin: 12px 0;
  padding: 24px 16px;
  border-radius: 16px;
  border: 1px dashed rgba(11, 59, 42, 0.25);
  background: rgba(11, 59, 42, 0.03);
  text-align: center;
}

.as-closed-icon {
  font-size: 1.8rem;
}

.as-closed-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
}

.as-closed-text,
.as-closed-wali {
  max-width: 34rem;
  margin: 0;
  color: var(--body);
  line-height: 1.5;
}

.as-closed-wali {
  font-size: 0.86rem;
}

.as-closed-wali-box {
  width: 100%;
  max-width: 28rem;
  margin-top: 8px;
  border-radius: 12px;
  border: 1px solid #c2d9f2;
  background: #eef5fc;
  text-align: left;
  overflow: hidden;
}

.as-closed-wali-title {
  margin: 0;
  padding: 9px 12px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #13345b;
  border-bottom: 1px solid #cde0f5;
}

.as-closed-wali-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: #f8fbff;
}

.as-closed-wali-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid rgba(29, 79, 138, 0.12);
}

.as-closed-wali-row:first-child {
  border-top: 0;
}

.as-closed-wali-name {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 6px;
  min-width: 0;
  font-size: 0.85rem;
  color: #0f2c4f;
}

.as-closed-wali-jilid {
  font-size: 0.74rem;
  font-weight: 600;
  color: #2f547e;
}

.as-closed .as-jump {
  margin-top: 6px;
  min-height: 42px;
  padding: 8px 16px;
  white-space: nowrap;
}

.as-titip-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(10, 92, 64, 0.35);
  background: #fff;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--emerald);
  text-decoration: none;
  white-space: nowrap;
  box-sizing: border-box;
  cursor: pointer;
}

.as-titip-btn:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.as-titip {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #fff3d6;
  color: #7a4b06;
  font-size: 0.74rem;
  font-weight: 700;
}

.as-away {
  margin: 0;
  padding: 8px 16px 10px;
  font-size: 0.8rem;
  line-height: 1.45;
  color: #6b4a12;
}

.as-hint-wrap {
  position: relative;
  margin: -4px 0 12px;
}

.as-hint {
  margin: 0;
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.5;
}

.as-hint-mobile {
  display: none;
  position: relative;
}

.as-hint-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  background: #f5f9f6;
  color: var(--body);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.as-hint-trigger[aria-expanded="true"] {
  border-color: var(--emerald);
  background: #e9f5ef;
  color: var(--emerald);
}

.as-hint-trigger:focus-visible,
.as-hint-close:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.as-hint-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 15;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 12px 12px 14px;
  border-radius: 14px;
  background: #0b3b2a;
  color: #ecfdf5;
  font-size: 0.82rem;
  line-height: 1.5;
  box-shadow: 0 14px 30px -10px rgba(3, 41, 29, 0.45);
}

.as-hint-popover::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 22px;
  width: 12px;
  height: 12px;
  background: #0b3b2a;
  transform: rotate(45deg);
}

.as-hint-popover p {
  margin: 0;
  flex: 1;
}

.as-hint-close {
  flex: none;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 639px) {
  .as-hint-wrap {
    margin: 0 0 10px;
  }
  .as-hint-desktop {
    display: none;
  }
  .as-hint-mobile {
    display: block;
  }
}

.as-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  margin: 10px 0 12px;
}

.as-search {
  flex: 1 1 220px;
  min-width: 0;
  margin: 0;
}

.as-my-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(11, 59, 42, 0.22);
  background: #fff;
  color: var(--ink);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.as-my-toggle input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--emerald);
  cursor: pointer;
}

.as-my-toggle strong {
  color: var(--emerald);
  font-weight: 800;
}

.as-my-toggle.is-active {
  background: #edf7f2;
  border-color: var(--emerald);
  color: var(--ink);
}

.as-my-toggle:has(input:focus-visible) {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.as-scope-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e3f1ea;
  color: var(--emerald);
  font-size: 0.76rem;
  font-weight: 800;
}

@media (max-width: 560px) {
  .as-my-toggle {
    width: 100%;
  }
}

.as-note {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.as-note.is-warn {
  background: #fffbeb;
  color: #5b3a06;
  border: 1px solid #f3d58b;
}

.as-note.is-danger {
  background: #fdecea;
  color: #7a1810;
}

.as-inline-link {
  margin-left: 6px;
  color: var(--emerald);
  font-weight: 700;
}

/* the sesi switch and the tally stay in view while scrolling a long list */
.as-bar {
  position: sticky;
  top: calc(var(--appbar-h, 0px) + 8px); /* under the phone top bar */
  z-index: 5;
  display: grid;
  gap: 8px;
  margin-bottom: 4px;
  padding: 8px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 8px 18px -14px rgba(3, 41, 29, 0.4);
}

@media (min-width: 1024px) {
  .as-bar {
    top: 8px;
  }
}

.as-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  padding: 0 6px 2px;
  font-size: 0.88rem;
  color: var(--body);
}

.as-summary strong {
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.as-summary .is-hadir strong { color: #0a5c40; }
.as-summary .is-izin strong { color: #1d4f8a; }
.as-summary .is-sakit strong { color: #7c3a0d; }
.as-summary .is-alfa strong { color: #8e1b12; }
.as-summary .is-holiday-bar { color: #075985; }
.as-summary .is-holiday-bar strong { color: #0369a1; }

.as-save {
  margin-left: auto;
  font-weight: 700;
}

.as-save.is-saved { color: #0a5c40; }
.as-save.is-saving { color: var(--muted); }
.as-save.is-error { color: #b42318; }
.as-save.is-refused { color: #b45309; }

.as-save-note {
  margin: 8px 0 0;
}

.as-retry {
  min-height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid rgba(180, 35, 24, 0.4);
  background: #fff;
  color: #b42318;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.as-group {
  margin-bottom: 10px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid var(--line);
  overflow: hidden;
}

.as-group-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px 8px 4px;
  background: #f7faf8;
}

.as-group-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 10px;
  border: 0;
  background: none;
  font: inherit;
  color: var(--ink);
  cursor: pointer;
}

.as-group-name {
  font-weight: 800;
}

.as-group-count {
  font-size: 0.82rem;
  color: var(--muted);
}

.as-chevron {
  color: var(--muted);
}

.as-all {
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1.5px solid rgba(10, 92, 64, 0.35);
  background: #fff;
  color: var(--emerald);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.as-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.as-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  padding: 10px 12px;
  border-top: 1px solid var(--line);
}

.as-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 180px;
}

.as-name strong {
  overflow-wrap: anywhere;
}

.as-nickname {
  align-self: flex-start;
  margin-top: 3px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #eef6f1;
  border: 1px solid #cce3d6;
  font-size: 0.78rem;
  font-weight: 500;
  color: #35584a;
  line-height: 1.4;
}

.as-nickname em {
  font-style: normal;
  font-weight: 700;
  color: var(--emerald);
}

.as-by {
  font-size: 0.75rem;
  color: var(--muted);
}

.as-by.is-wali {
  color: #1d4f8a;
  font-weight: 600;
}

/* Collapsible, mobile-first disclosure for parent-submitted izin/sakit */
.as-wali-card {
  margin: 10px 0 2px;
  border-radius: 14px;
  border: 1px solid #c2d9f2;
  background: #eef5fc;
  overflow: hidden;
}

.as-wali-head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: #13345b;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.as-wali-head:hover {
  background: #e3effb;
}

.as-wali-head:active,
.as-wali-item:active {
  background: #d8e9fb;
}

.as-wali-head:focus-visible,
.as-wali-item:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: -3px;
}

.as-wali-ico {
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #d8e8fa;
  color: #1d4f8a;
}

.as-wali-summary {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.as-wali-title {
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.25;
  color: #13345b;
}

.as-wali-meta {
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.3;
  color: #2f547e;
  font-variant-numeric: tabular-nums;
}

.as-wali-toggle {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(29, 79, 138, 0.11);
  color: #163e72;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.as-wali-chev {
  transition: transform 0.18s ease;
}

.as-wali-chev.is-open {
  transform: rotate(180deg);
}

.as-wali-panel {
  border-top: 1px solid #cde0f5;
  background: #f8fbff;
}

.as-wali-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.as-wali-li {
  border-top: 1px solid rgba(29, 79, 138, 0.12);
}

.as-wali-li:first-child {
  border-top: 0;
}

.as-wali-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.as-wali-item:hover {
  background: #edf5fe;
}

.as-wali-person {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.as-wali-name-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 6px;
}

.as-wali-name {
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.3;
  color: #0f2c4f;
  overflow-wrap: anywhere;
}

.as-wali-jilid {
  font-size: 0.74rem;
  font-weight: 700;
  color: #2f547e;
  white-space: nowrap;
}

.as-wali-reason {
  font-size: 0.78rem;
  line-height: 1.35;
  color: #2f547e;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.as-wali-right {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.as-wali-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1.5;
  white-space: nowrap;
}

.as-wali-pill.is-izin {
  background: #dbeafe;
  color: #163e72;
  border: 1px solid rgba(29, 79, 138, 0.2);
}

.as-wali-pill.is-sakit {
  background: #fef3c7;
  color: #7c3409;
  border: 1px solid rgba(180, 83, 9, 0.24);
}

.as-wali-go {
  color: #2f547e;
}

.as-wali-foot {
  margin: 0;
  padding: 8px 12px 10px;
  border-top: 1px solid rgba(29, 79, 138, 0.12);
  background: #eef5fc;
  font-size: 0.76rem;
  line-height: 1.4;
  color: #2f547e;
}

.as-row.is-highlighted {
  background: #dbeafe;
  box-shadow: inset 0 0 0 2px #1d4f8a;
  transition: background-color 0.25s ease, box-shadow 0.25s ease;
}

@media (prefers-reduced-motion: reduce) {
  .as-wali-chev,
  .as-wali-head,
  .as-wali-item,
  .as-row.is-highlighted {
    transition: none;
  }
}

.as-choices {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  flex: 1 1 280px;
}

.as-choice {
  min-height: 44px;
  border-radius: 10px;
  border: 1.5px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--body);
  cursor: pointer;
}

.as-choice:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* the parent's izin/sakit: the row is held, the status it holds stays clear */
.as-row.is-locked {
  background: #f3f8fd;
}

.as-row.is-locked .as-choice:disabled {
  opacity: 0.4;
}

.as-row.is-locked .as-choice[aria-pressed="true"]:disabled {
  opacity: 1;
  cursor: default;
}

.as-unlock {
  align-self: flex-start;
  min-height: 36px;
  margin-top: 4px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1.5px solid rgba(29, 79, 138, 0.35);
  background: #fff;
  color: #1d4f8a;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.as-unlock:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.as-choice[aria-pressed="true"].is-hadir { background: #0a5c40; border-color: #0a5c40; color: #fff; }
.as-choice[aria-pressed="true"].is-izin { background: #1d4f8a; border-color: #1d4f8a; color: #fff; }
.as-choice[aria-pressed="true"].is-sakit { background: #b45309; border-color: #b45309; color: #fff; }
.as-choice[aria-pressed="true"].is-alfa { background: #b42318; border-color: #b42318; color: #fff; }

.as-slot:focus-visible,
.as-choice:focus-visible,
.as-all:focus-visible,
.as-group-toggle:focus-visible,
.as-more:focus-visible,
.as-input:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}

.as-more {
  width: 100%;
  min-height: 46px;
  margin-top: 4px;
  border-radius: 12px;
  border: 1px dashed rgba(11, 59, 42, 0.3);
  background: transparent;
  font: inherit;
  font-weight: 700;
  color: var(--emerald);
  cursor: pointer;
}

.as-empty,
.as-foot {
  margin: 12px 0 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--muted);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
