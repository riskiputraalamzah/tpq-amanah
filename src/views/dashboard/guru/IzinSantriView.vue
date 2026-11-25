<template>
  <div class="iz">
    <header class="iz-head">
      <div class="iz-head-text">
        <h1>Izin &amp; Sakit Santri</h1>
        <p>
          <template v-if="isAllJilidView">Akses pantau <strong>semua jilid</strong> · </template>
          <template v-else-if="!isAdmin && scopeLabel">Jilid Antum: <strong>{{ scopeLabel }}</strong> · </template>
          Pantau jadwal izin per tanggal di kalender dan catat izin satu atau beberapa hari.
        </p>
      </div>
      <div class="iz-head-actions">
        <button
          v-if="canCreate"
          type="button"
          class="iz-btn iz-btn-primary"
          @click="openComposer()"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Catat Izin / Sakit</span>
        </button>
        <router-link to="/dashboard/absen-santri" class="iz-btn iz-btn-ghost">
          ← Absen Santri
        </router-link>
      </div>
    </header>

    <PageSkeleton v-if="loading" :rows="5" label="Memuat data izin santri" />
    <p v-else-if="loadError" class="iz-note is-danger" role="alert">{{ loadError }}</p>

    <template v-else>
      <AbsenReports @changed="load({ quiet: true })" />

      <p v-if="isAllJilidView" class="iz-note" role="status">
        Antum diberi akses memantau <strong>semua jilid</strong> oleh admin.
        <template v-if="actScopeLabel"> Mencatat &amp; membatalkan izin tetap khusus jilid Antum (<strong>{{ actScopeLabel }}</strong>).</template>
        <template v-else> Jilid yang Antum ampu belum diatur admin, jadi tampilan ini hanya untuk memantau.</template>
      </p>
      <p v-else-if="!isAdmin && classIds && !classIds.length" class="iz-note is-warn" role="status">
        Jilid yang Antum ampu belum diatur admin dan belum ada riwayat KBM. Minta admin mengaturnya di menu Kelola Pengajar.
      </p>

      <!-- 1. PRIMARY: Kalender Izin Dinamis + Detail Tanggal Terpilih (Desktop: panel samping | Mobile: bottom drawer) -->
      <section class="iz-board" aria-label="Kalender dan rincian izin santri">
        <!-- Mobile-only compact Hari Ini strip (tapping slides up the bottom drawer for Today) -->
        <button
          type="button"
          class="iz-today-strip"
          :class="{ 'has-items': todayItems.length > 0 }"
          @click="openTodayDrawer"
        >
          <div class="iz-today-strip-text">
            <strong>Hari ini · {{ longDayLabel(today) }}</strong>
            <span v-if="todayIsWeekend">Akhir pekan · ketuk tanggal aktif di kalender</span>
            <span v-else-if="todayItems.length">{{ todayUniqueSantriCount }} santri {{ activeScopeText }} · ketuk untuk rincian</span>
            <span v-else>Tidak ada yang izin/sakit · semua terjadwal masuk</span>
          </div>
          <div class="iz-today-strip-right">
            <template v-if="!todayIsWeekend && todayItems.length">
              <span v-if="todayIzinCount" class="iz-pill is-info">{{ todayIzinCount }} Izin</span>
              <span v-if="todaySakitCount" class="iz-pill is-warn">{{ todaySakitCount }} Sakit</span>
            </template>
            <span v-else-if="!todayIsWeekend" class="iz-pill is-ok">0 izin</span>
            <svg class="iz-strip-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </button>

        <!-- Left: Interactive Monthly Calendar -->
        <div class="iz-cal-card">
          <div class="iz-cal-top">
            <div class="iz-cal-nav">
              <button type="button" class="iz-cal-arrow" aria-label="Bulan sebelumnya" @click="shiftMonth(-1)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <h2 class="iz-cal-month">{{ monthTitle }}</h2>
              <button type="button" class="iz-cal-arrow" aria-label="Bulan berikutnya" @click="shiftMonth(1)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            <div class="iz-cal-tools">
              <button
                v-if="selectedDate !== today || calMonthKey !== today.slice(0, 7)"
                type="button"
                class="iz-cal-today-btn"
                @click="jumpToday"
              >
                Hari ini
              </button>
              <select
                v-if="classOptions.length > 1"
                v-model="listClassFilter"
                class="iz-cal-select"
                aria-label="Saring jilid di kalender"
              >
                <option value="">{{ isAdmin || classIds === null ? 'Semua jilid' : 'Semua jilid saya' }}</option>
                <option v-for="c in classOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
          </div>

          <!-- Weekday headers (Min..Sab) -->
          <div class="iz-cal-weekdays" aria-hidden="true">
            <span v-for="d in DAYS_SHORT" :key="d" :class="{ 'is-wknd': d === 'Min' || d === 'Sab' }">{{ d }}</span>
          </div>

          <!-- Calendar grid -->
          <div class="iz-cal-grid" role="grid" :aria-label="`Kalender izin ${monthTitle}`">
            <button
              v-for="cell in calendarCells"
              :key="cell.iso"
              type="button"
              class="iz-cal-cell"
              :class="{
                'is-out': !cell.inMonth,
                'is-wknd': cell.isWeekend,
                'is-today': cell.iso === today,
                'is-selected': cell.iso === selectedDate,
                'has-izin': cell.izinCount > 0,
                'has-sakit-only': cell.izinCount === 0 && cell.sakitCount > 0,
                'is-span-hi': highlightedDates.has(cell.iso),
              }"
              :aria-pressed="cell.iso === selectedDate"
              :aria-label="cellAriaLabel(cell)"
              @click="selectCalendarDate(cell)"
            >
              <span class="iz-cal-num">{{ cell.day }}</span>
              <span v-if="cell.total > 0" class="iz-cal-marks">
                <span v-if="cell.izinCount" class="iz-dot is-izin" aria-hidden="true"></span>
                <span v-if="cell.sakitCount" class="iz-dot is-sakit" aria-hidden="true"></span>
                <span class="iz-cal-cnt">{{ cell.total }}</span>
              </span>
            </button>
          </div>

          <div class="iz-cal-legend">
            <span><i class="iz-dot is-izin"></i> Izin</span>
            <span><i class="iz-dot is-sakit"></i> Sakit</span>
            <span><i class="iz-legend-ring"></i> Hari ini</span>
            <span v-if="highlightedId" class="iz-legend-span">
              <i class="iz-legend-hi"></i> Rentang dipilih
              <button type="button" class="iz-legend-clear" @click="highlightedId = ''">Tutup</button>
            </span>
          </div>
          <p class="iz-cal-tap-hint">Ketuk tanggal di kalender untuk membuka rincian izin.</p>
        </div>

        <!-- Right: Selected Date Detail Panel (auto-defaults to Hari Ini) -->
        <div class="iz-day-panel" :class="{ 'has-items': selectedDayItems.length > 0 }">
          <div class="iz-day-head">
            <div class="iz-day-title-wrap">
              <div class="iz-day-title-row">
                <h2>{{ longDayLabel(selectedDate) }}</h2>
                <span v-if="selectedDate === today" class="iz-pill is-today">Hari ini</span>
                <span v-else-if="selectedIsWeekend" class="iz-pill is-idle">Akhir pekan</span>
              </div>
              <p v-if="selectedIsWeekend" class="iz-day-sub">
                TPQ aktif Senin–Jumat. Ketuk tanggal hari aktif di kalender untuk melihat atau mencatat izin.
              </p>
              <p v-else-if="selectedDayItems.length" class="iz-day-sub">
                <strong>{{ selectedUniqueSantriCount }} santri</strong>
                {{ activeScopeText }} tercatat izin/sakit pada tanggal ini.
              </p>
              <p v-else class="iz-day-sub">
                Tidak ada santri {{ activeScopeText }} yang izin atau sakit pada tanggal ini.
              </p>
            </div>

            <div v-if="!selectedIsWeekend && selectedDayItems.length" class="iz-today-badges">
              <span v-if="selectedIzinCount" class="iz-pill is-info">{{ selectedIzinCount }} Izin</span>
              <span v-if="selectedSakitCount" class="iz-pill is-warn">{{ selectedSakitCount }} Sakit</span>
            </div>
            <span v-else-if="!selectedIsWeekend" class="iz-pill is-ok">Semua terjadwal masuk</span>
          </div>

          <ul v-if="selectedDayItems.length" class="iz-day-list">
            <li
              v-for="item in selectedDayItems"
              :key="`sel-${item.id}`"
              class="iz-day-row"
              :class="{ 'is-highlighted': highlightedId === item.id, 'is-multi': (item.dates || []).length > 1 }"
              @click="toggleHighlight(item)"
            >
              <div class="iz-item-main">
                <div class="iz-item-top">
                  <strong>{{ item.santriName }}</strong>
                  <span class="iz-pill" :class="item.type === 'sakit' ? 'is-warn' : 'is-info'">
                    {{ item.type === 'sakit' ? 'Sakit' : 'Izin' }}
                  </span>
                  <span class="iz-meta-tag">{{ levelName(item.classId) }} · {{ slotLabel(item.slot) }}</span>
                </div>

                <!-- Dynamic duration / range chip ("Sampai Rab 25 Nov · 3 hari") -->
                <span class="iz-span-pill" :class="{ 'is-multi': (item.dates || []).length > 1 }">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{{ spanText(item.dates) }}</span>
                </span>

                <p v-if="item.reason" class="iz-reason">"{{ item.reason }}"</p>
                <span class="iz-sub">
                  Dicatat {{ item.byName || 'Wali' }}<template v-if="item.createdAt"> · <time :title="fullDateTime(item.createdAt)">{{ timeAgo(item.createdAt, now) }}</time></template>
                </span>
              </div>
              <div v-if="item.cancellable" class="iz-item-side" @click.stop>
                <button
                  type="button"
                  class="iz-btn iz-btn-ghost iz-btn-sm is-danger"
                  :disabled="cancellingId === item.id"
                  @click="cancelIzin(item)"
                >
                  {{ cancellingId === item.id ? 'Membatalkan…' : 'Batalkan' }}
                </button>
              </div>
            </li>
          </ul>

          <!-- Quick CTA for selected date -->
          <div v-if="canCreate" class="iz-day-foot">
            <button
              v-if="canCreateOnSelectedDate"
              type="button"
              class="iz-btn iz-btn-ghost iz-btn-sm"
              @click="openComposer({ date: selectedDate })"
            >
              + Catat izin untuk {{ selectedDate === today ? 'hari ini' : shortDayFull(selectedDate) }}
            </button>
            <button
              v-else
              type="button"
              class="iz-btn iz-btn-ghost iz-btn-sm"
              @click="openComposer()"
            >
              + Catat izin / sakit santri
            </button>
            <span v-if="selectedDayItems.some((x) => (x.dates || []).length > 1)" class="iz-sub iz-tap-tip">
              Ketuk kartu izin multi-hari untuk menyorot rentangnya di kalender.
            </span>
          </div>
        </div>
      </section>

      <!-- 2. SECONDARY: Semua & Riwayat Izin (pencarian lintas tanggal) -->
      <section class="iz-history" aria-labelledby="iz-list-title">
        <div class="iz-list-head">
          <h2 id="iz-list-title" class="iz-section-title">Semua &amp; Riwayat Izin ({{ visibleList.length }})</h2>
          <div class="iz-seg" role="group" aria-label="Saring status izin">
            <button
              v-for="f in LIST_FILTERS"
              :key="f.value"
              type="button"
              class="iz-seg-btn"
              :aria-pressed="listStatusFilter === f.value"
              @click="listStatusFilter = f.value"
            >
              {{ f.label }} <span>{{ countListFor(f.value) }}</span>
            </button>
          </div>
        </div>

        <div class="iz-list-bar">
          <div class="iz-search-wrap">
            <svg class="iz-search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="listSearch"
              type="search"
              class="iz-input iz-search-input"
              placeholder="Cari nama santri atau alasan…"
              aria-label="Cari riwayat izin"
            />
          </div>
          <select
            v-if="classOptions.length > 1"
            v-model="listClassFilter"
            class="iz-input iz-jilid-select"
            aria-label="Saring jilid daftar izin"
          >
            <option value="">{{ isAdmin || classIds === null ? 'Semua jilid' : 'Semua jilid saya' }}</option>
            <option v-for="c in classOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>

        <div v-if="!visibleList.length" class="iz-empty">
          <p class="iz-empty-title">Belum ada data izin atau sakit yang cocok.</p>
          <p class="iz-sub">Izin yang dicatat pengajar/admin maupun dari portal wali muncul di sini, urut dari yang terbaru.</p>
        </div>

        <ul v-else class="iz-list">
          <li v-for="item in visibleList" :key="item.id" class="iz-item">
            <div class="iz-item-main">
              <div class="iz-item-top">
                <strong>{{ item.santriName }}</strong>
                <span class="iz-pill" :class="item.type === 'sakit' ? 'is-warn' : 'is-info'">
                  {{ item.type === 'sakit' ? 'Sakit' : 'Izin' }}
                </span>
                <span v-if="item.status === 'active' && (item.dates || []).includes(today)" class="iz-pill is-today">
                  Hari ini
                </span>
                <span v-if="item.status !== 'active'" class="iz-pill is-idle">
                  {{ item.status === 'cancelled' ? 'Dibatalkan' : 'Sebagian dibatalkan' }}
                </span>
              </div>
              <span class="iz-sub">
                {{ levelName(item.classId) }} · {{ slotLabel(item.slot) }} · {{ spanText(item.dates) }}
              </span>
              <p v-if="item.reason" class="iz-reason">"{{ item.reason }}"</p>
              <span class="iz-sub">
                Dicatat oleh {{ item.byName || 'Wali' }}
                <template v-if="item.createdAt">
                  · <time :title="fullDateTime(item.createdAt)">{{ timeAgo(item.createdAt, now) }}</time>
                </template>
              </span>
            </div>

            <div class="iz-item-side">
              <button
                v-if="item.status === 'active' && (item.dates || []).length"
                type="button"
                class="iz-btn iz-btn-ghost iz-btn-sm"
                @click="focusOnCalendar(item)"
              >
                Lihat di kalender
              </button>
              <button
                v-if="item.cancellable"
                type="button"
                class="iz-btn iz-btn-ghost iz-btn-sm is-danger"
                :disabled="cancellingId === item.id"
                @click="cancelIzin(item)"
              >
                {{ cancellingId === item.id ? 'Membatalkan…' : 'Batalkan' }}
              </button>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <!-- Mobile Bottom Drawer: Rincian Tanggal Kalender (< 960px, teleported to body, z-index 9985) -->
    <Teleport to="body">
      <Transition name="iz-drawer">
        <div
          v-if="dayDrawerOpen"
          class="iz-drawer-overlay"
          @click.self="closeDayDrawer"
          @keydown.esc="closeDayDrawer"
        >
          <section
            class="iz-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="iz-drawer-title"
          >
            <div class="iz-drawer-handle-wrap" aria-hidden="true">
              <span class="iz-drawer-handle"></span>
            </div>

            <header class="iz-drawer-head">
              <div class="iz-day-title-wrap">
                <div class="iz-day-title-row">
                  <h2 id="iz-drawer-title">{{ longDayLabel(selectedDate) }}</h2>
                  <span v-if="selectedDate === today" class="iz-pill is-today">Hari ini</span>
                  <span v-else-if="selectedIsWeekend" class="iz-pill is-idle">Akhir pekan</span>
                </div>
                <div v-if="!selectedIsWeekend && selectedDayItems.length" class="iz-today-badges">
                  <span v-if="selectedIzinCount" class="iz-pill is-info">{{ selectedIzinCount }} Izin</span>
                  <span v-if="selectedSakitCount" class="iz-pill is-warn">{{ selectedSakitCount }} Sakit</span>
                </div>
                <span v-else-if="!selectedIsWeekend" class="iz-pill is-ok">Semua terjadwal masuk</span>
              </div>
              <button type="button" class="iz-close" aria-label="Tutup rincian tanggal" @click="closeDayDrawer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div class="iz-drawer-body">
              <p v-if="selectedIsWeekend" class="iz-day-sub">
                TPQ aktif Senin–Jumat. Pilih tanggal hari aktif di kalender untuk melihat atau mencatat izin.
              </p>
              <p v-else-if="selectedDayItems.length" class="iz-day-sub">
                <strong>{{ selectedUniqueSantriCount }} santri</strong>
                {{ activeScopeText }} tercatat izin/sakit pada tanggal ini.
              </p>
              <p v-else class="iz-day-sub">
                Tidak ada santri {{ activeScopeText }} yang izin atau sakit pada tanggal ini.
              </p>

              <ul v-if="selectedDayItems.length" class="iz-day-list">
                <li
                  v-for="item in selectedDayItems"
                  :key="`drw-${item.id}`"
                  class="iz-day-row"
                  :class="{ 'is-highlighted': highlightedId === item.id }"
                >
                  <div class="iz-item-main">
                    <div class="iz-item-top">
                      <strong>{{ item.santriName }}</strong>
                      <span class="iz-pill" :class="item.type === 'sakit' ? 'is-warn' : 'is-info'">
                        {{ item.type === 'sakit' ? 'Sakit' : 'Izin' }}
                      </span>
                      <span class="iz-meta-tag">{{ levelName(item.classId) }} · {{ slotLabel(item.slot) }}</span>
                    </div>

                    <span class="iz-span-pill" :class="{ 'is-multi': (item.dates || []).length > 1 }">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>{{ spanText(item.dates) }}</span>
                    </span>

                    <p v-if="item.reason" class="iz-reason">"{{ item.reason }}"</p>
                    <span class="iz-sub">
                      Dicatat {{ item.byName || 'Wali' }}<template v-if="item.createdAt"> · <time :title="fullDateTime(item.createdAt)">{{ timeAgo(item.createdAt, now) }}</time></template>
                    </span>
                  </div>

                  <div v-if="item.cancellable || (item.dates || []).length > 1" class="iz-item-side">
                    <button
                      v-if="(item.dates || []).length > 1"
                      type="button"
                      class="iz-btn iz-btn-ghost iz-btn-sm"
                      @click="highlightFromDrawer(item)"
                    >
                      Sorot di kalender
                    </button>
                    <button
                      v-if="item.cancellable"
                      type="button"
                      class="iz-btn iz-btn-ghost iz-btn-sm is-danger"
                      :disabled="cancellingId === item.id"
                      @click="cancelIzin(item)"
                    >
                      {{ cancellingId === item.id ? 'Membatalkan…' : 'Batalkan' }}
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            <footer v-if="canCreate" class="iz-drawer-foot">
              <button
                v-if="canCreateOnSelectedDate"
                type="button"
                class="iz-btn iz-btn-primary iz-btn-full"
                @click="openComposerFromDrawer(selectedDate)"
              >
                + Catat izin untuk {{ selectedDate === today ? 'hari ini' : shortDayFull(selectedDate) }}
              </button>
              <button
                v-else
                type="button"
                class="iz-btn iz-btn-primary iz-btn-full"
                @click="openComposerFromDrawer('')"
              >
                + Catat izin / sakit santri
              </button>
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>

    <!-- Bottom Sheet / Dialog Catat Izin & Sakit (Smart Picker tanpa native <select>) -->
    <Teleport to="body">
      <div v-if="composerOpen" class="iz-overlay" @click.self="closeComposer" @keydown.esc="closeComposer">
        <section class="iz-sheet" role="dialog" aria-modal="true" aria-labelledby="iz-sheet-title">
          <header class="iz-sheet-head">
            <div>
              <h2 id="iz-sheet-title">Catat Izin / Sakit Santri</h2>
              <p class="iz-sub">
                <template v-if="isAllJilidView && actScopeLabel">Khusus {{ actScopeLabel }} · </template>
                Langsung masuk ke Absen Santri &amp; mengabari guru jilidnya.
              </p>
            </div>
            <button type="button" class="iz-close" aria-label="Tutup" @click="closeComposer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          <form class="iz-sheet-body" @submit.prevent="submitIzin">
            <!-- 1. Unified Smart Santri Picker (NO native <select>) -->
            <div class="iz-field">
              <span class="iz-label">Pilih Santri</span>

              <div v-if="selectedSantri && !pickerOpen" class="iz-picked">
                <div class="iz-picked-info">
                  <strong>{{ selectedSantri.name }}</strong>
                  <span>{{ levelName(selectedSantri.classId) }} · {{ slotLabel(form.slot) }}</span>
                </div>
                <button type="button" class="iz-btn iz-btn-ghost iz-btn-sm" @click="reopenPicker">
                  Ganti
                </button>
              </div>

              <div v-else class="iz-picker">
                <div v-if="actClassOptions.length > 1" class="iz-jilid-strip" role="group" aria-label="Filter jilid">
                  <button
                    type="button"
                    class="iz-mini-chip"
                    :aria-pressed="formClassFilter === ''"
                    @click="formClassFilter = ''"
                  >
                    Semua
                  </button>
                  <button
                    v-for="c in actClassOptions"
                    :key="c.value"
                    type="button"
                    class="iz-mini-chip"
                    :aria-pressed="formClassFilter === c.value"
                    @click="formClassFilter = c.value"
                  >
                    {{ c.label }}
                  </button>
                </div>

                <div class="iz-search-wrap">
                  <svg class="iz-search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref="pickerSearchRef"
                    v-model="santriSearch"
                    type="search"
                    class="iz-input iz-search-input"
                    placeholder="Ketik nama santri lalu ketuk namanya…"
                    aria-label="Cari nama santri"
                  />
                </div>

                <ul v-if="filteredSantri.length" class="iz-picker-list" role="listbox" aria-label="Daftar santri">
                  <li v-for="s in filteredSantri" :key="s.id">
                    <button
                      type="button"
                      role="option"
                      class="iz-picker-item"
                      :aria-selected="form.santriId === s.id"
                      @click="pickSantri(s)"
                    >
                      <span class="iz-picker-name">{{ s.name }}</span>
                      <span class="iz-picker-jilid">{{ levelName(s.classId) }}</span>
                    </button>
                  </li>
                </ul>
                <p v-else class="iz-picker-empty">Tidak ada santri dengan nama "{{ santriSearch }}".</p>
              </div>
            </div>

            <!-- 2. Status & Sesi -->
            <div class="iz-grid2">
              <div class="iz-field">
                <span id="iz-type-label" class="iz-label">Status</span>
                <div class="iz-seg is-full" role="radiogroup" aria-labelledby="iz-type-label">
                  <button
                    type="button"
                    role="radio"
                    class="iz-seg-btn"
                    :aria-checked="form.type === 'izin'"
                    @click="selectType('izin')"
                  >
                    Izin
                  </button>
                  <button
                    type="button"
                    role="radio"
                    class="iz-seg-btn"
                    :aria-checked="form.type === 'sakit'"
                    @click="selectType('sakit')"
                  >
                    Sakit
                  </button>
                </div>
              </div>

              <div class="iz-field">
                <span id="iz-slot-label" class="iz-label">Sesi Ngaji</span>
                <div class="iz-seg is-full" role="radiogroup" aria-labelledby="iz-slot-label">
                  <button
                    v-for="s in SLOTS"
                    :key="s.id"
                    type="button"
                    role="radio"
                    class="iz-seg-btn"
                    :aria-checked="form.slot === s.id"
                    @click="form.slot = s.id"
                  >
                    {{ s.short }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. Tanggal (Senin–Jumat) -->
            <div class="iz-field">
              <span id="iz-dur-label" class="iz-label">Tanggal Izin (Senin–Jumat)</span>
              <div class="iz-presets" role="group" aria-labelledby="iz-dur-label">
                <button
                  v-for="p in PRESETS"
                  :key="p.key"
                  type="button"
                  class="iz-chip"
                  :aria-pressed="presetMode === p.key"
                  @click="applyPreset(p.key)"
                >
                  {{ p.label }}
                </button>
              </div>

              <div v-if="presetMode === 'range'" class="iz-grid2 iz-mt">
                <label class="iz-field">
                  <span class="iz-sub">Dari tanggal</span>
                  <input v-model="form.startDate" type="date" class="iz-input" :min="minAllowedDate" :max="maxAllowedDate" />
                </label>
                <label class="iz-field">
                  <span class="iz-sub">Sampai tanggal</span>
                  <input
                    v-model="form.endDate"
                    type="date"
                    class="iz-input"
                    :min="form.startDate || minAllowedDate"
                    :max="maxAllowedDate"
                  />
                </label>
              </div>

              <div v-else-if="presetMode === 'pick'" class="iz-days-grid iz-mt" role="group" aria-label="Pilih tanggal sekolah">
                <button
                  v-for="d in availableDays"
                  :key="d"
                  type="button"
                  class="iz-day-chip"
                  :aria-pressed="form.dates.includes(d)"
                  @click="toggleDate(d)"
                >
                  <strong>{{ shortDayName(d) }}</strong>
                  <span>{{ shortDayNum(d) }}</span>
                </button>
              </div>

              <p class="iz-sub iz-selected-summary">
                <template v-if="effectiveDates.length">
                  <strong>{{ effectiveDates.length }} hari aktif</strong>:
                  {{ effectiveDates.map(shortDayFull).join(', ') }}
                </template>
                <template v-else>Belum ada hari aktif (Senin–Jumat) yang dipilih.</template>
              </p>
            </div>

            <!-- 4. Alasan -->
            <div class="iz-field">
              <span class="iz-label">Alasan / Keterangan</span>
              <div class="iz-quick-reasons">
                <button
                  v-for="r in QUICK_REASONS[form.type]"
                  :key="r"
                  type="button"
                  class="iz-tpl-btn"
                  :class="{ active: form.reason === r }"
                  @click="form.reason = r"
                >
                  {{ r }}
                </button>
              </div>
              <input
                v-model="form.reason"
                type="text"
                class="iz-input"
                maxlength="200"
                :placeholder="form.type === 'sakit' ? 'Contoh: demam, istirahat di rumah' : 'Contoh: acara keluarga / bepergian'"
                required
              />
            </div>

            <!-- Existing active izin warning (prevents accidental duplicates) -->
            <div v-if="composerOverlaps.length && selectedSantri" class="iz-note is-warn iz-dup-warn" role="status">
              <strong>
                {{ selectedSantri.name }} sudah punya catatan {{ composerOverlaps[0].type === 'sakit' ? 'Sakit' : 'Izin' }} pada {{ composerOverlapDaysText }} ({{ slotLabel(form.slot) }})
              </strong>
              <span>
                "{{ composerOverlaps[0].reason }}"<template v-if="composerOverlaps[0].byName"> · dicatat {{ composerOverlaps[0].byName }}</template>.
                Menyimpan akan <strong>memperbarui</strong> catatan izin tersebut agar tidak ganda.
              </span>
              <button type="button" class="iz-btn iz-btn-ghost iz-btn-sm" @click="prefillFromOverlap(composerOverlaps[0])">
                Muat alasan lama untuk diubah
              </button>
            </div>

            <p v-if="formError" class="iz-note is-danger" role="alert">{{ formError }}</p>

            <div class="iz-sheet-foot">
              <button type="button" class="iz-btn iz-btn-ghost" :disabled="saving" @click="closeComposer">Batal</button>
              <button
                type="submit"
                class="iz-btn iz-btn-primary"
                :disabled="saving || !form.santriId || !effectiveDates.length || form.reason.trim().length < 3"
              >
                <template v-if="saving">Menyimpan…</template>
                <template v-else-if="composerOverlaps.length">Perbarui {{ form.type === 'sakit' ? 'Sakit' : 'Izin' }} ({{ effectiveDates.length || 0 }} hari)</template>
                <template v-else>Simpan {{ form.type === 'sakit' ? 'Sakit' : 'Izin' }} ({{ effectiveDates.length || 0 }} hari)</template>
              </button>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import PageSkeleton from '@/components/PageSkeleton.vue'
import AbsenReports from '@/components/absen/AbsenReports.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { timeAgo, fullDateTime, timeOf } from '@/utils/timeAgo'

const authStore = useAuthStore()
const route = useRoute()
const { success: showSuccess, error: showError } = useToast()
const { ask } = useDialog()

const isAdmin = computed(() => authStore.user?.role === 'admin')

const CLASS_OPTIONS = [
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Jilid ${n}` })),
  { value: '7', label: 'Marhalah' },
]

const SLOTS = [
  { id: 'wave_1', label: 'Sesi Sore', short: 'Sore' },
  { id: 'wave_2', label: 'Sesi Malam', short: 'Malam' },
]

const QUICK_REASONS = {
  izin: ['Acara keluarga', 'Pulang kampung / luar kota', 'Kegiatan sekolah', 'Keperluan keluarga'],
  sakit: ['Sakit demam, istirahat di rumah', 'Kurang enak badan', 'Periksa ke dokter / klinik'],
}

const LIST_FILTERS = [
  { value: 'active', label: 'Aktif' },
  { value: 'all', label: 'Semua' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const DAYS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const cancellingId = ref('')
const formError = ref('')

const classIds = ref(null) // view scope: null = admin or guru with "all-jilid", array = guru's jilid
const actClassIds = ref(null) // act scope (create/cancel): null = admin, array = guru's taught jilid
const scopeSource = ref('admin')
const initialToday = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
const today = ref(initialToday)
const availableDays = ref([])
const santriList = ref([])
const izinList = ref([])

// Dynamic Calendar state (defaults to Today)
const selectedDate = ref(initialToday)
const calYear = ref(Number(initialToday.slice(0, 4)))
const calMonth = ref(Number(initialToday.slice(5, 7)) - 1) // 0..11
const highlightedId = ref('')
const isMobile = ref(false)
const dayDrawerOpen = ref(false)

const composerOpen = ref(false)
const pickerOpen = ref(true)
const pickerSearchRef = ref(null)

const formClassFilter = ref('')
const santriSearch = ref('')
const presetMode = ref('1d')
const form = ref({
  santriId: '',
  type: 'izin',
  slot: 'wave_1',
  dates: [],
  startDate: '',
  endDate: '',
  reason: 'Acara keluarga',
})

const listClassFilter = ref('')
const listSearch = ref('')
const listStatusFilter = ref('active')

const now = ref(new Date())
let clockTimer = null

const isAllJilidView = computed(() => !isAdmin.value && scopeSource.value === 'feature' && classIds.value === null)
const canCreate = computed(() => isAdmin.value || (Array.isArray(actClassIds.value) && actClassIds.value.length > 0))
const levelName = (id) => (String(id) === '7' ? 'Marhalah' : id ? `Jilid ${id}` : 'Tanpa jilid')
const slotLabel = (s) => (s === 'wave_2' ? 'Sesi Malam' : 'Sesi Sore')

const classOptions = computed(() => {
  if (isAdmin.value || classIds.value === null) return CLASS_OPTIONS
  return CLASS_OPTIONS.filter((c) => (classIds.value || []).includes(c.value))
})
const actClassOptions = computed(() => {
  if (isAdmin.value || actClassIds.value === null) return CLASS_OPTIONS
  return CLASS_OPTIONS.filter((c) => (actClassIds.value || []).includes(c.value))
})
const scopeLabel = computed(() => classOptions.value.map((c) => c.label).join(', '))
const actScopeLabel = computed(() => actClassOptions.value.map((c) => c.label).join(', '))
const activeScopeText = computed(() => {
  if (listClassFilter.value) return `di ${levelName(listClassFilter.value)}`
  return isAdmin.value || classIds.value === null ? 'di semua jilid' : `di ${scopeLabel.value || 'jilid Antum'}`
})

const addDaysIso = (iso, n) => new Date(new Date(`${iso}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10)
const weekdayOf = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay()
const isWeekendIso = (iso) => {
  const wd = weekdayOf(iso)
  return wd === 0 || wd === 6
}
const minAllowedDate = computed(() => addDaysIso(today.value, -7))
const maxAllowedDate = computed(() => addDaysIso(today.value, 14))

const longDayLabel = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  return `${DAYS_FULL[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}
const shortDayName = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return iso === today.value ? 'Hari ini' : DAYS_SHORT[d.getUTCDay()]
}
const shortDayNum = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}
const shortDayFull = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00Z`)
  return `${DAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}

// Human-friendly duration label:
// - 1 day: "Sen 23 Nov (1 hari)"
// - Contiguous school days (Mon-Fri): "Sen 23 Nov s.d. Rab 25 Nov (3 hari)"
// - Non-contiguous dates: "Sen 23 Nov, Kam 26 Nov (2 hari)"
function isContiguousSchoolSpan(sortedDates) {
  if (sortedDates.length < 2) return true
  const expected = []
  let cur = sortedDates[0]
  const end = sortedDates[sortedDates.length - 1]
  let guard = 0
  while (cur <= end && guard <= 60) {
    if (!isWeekendIso(cur)) expected.push(cur)
    cur = addDaysIso(cur, 1)
    guard += 1
  }
  return expected.length === sortedDates.length && expected.every((d, i) => d === sortedDates[i])
}

function spanText(dates) {
  const arr = [...new Set(Array.isArray(dates) ? dates : [])].sort()
  if (!arr.length) return '-'
  if (arr.length === 1) return `${shortDayFull(arr[0])} (1 hari)`
  if (isContiguousSchoolSpan(arr)) {
    return `${shortDayFull(arr[0])} s.d. ${shortDayFull(arr[arr.length - 1])} (${arr.length} hari)`
  }
  if (arr.length <= 3) {
    return `${arr.map(shortDayFull).join(', ')} (${arr.length} hari)`
  }
  return `${shortDayFull(arr[0])}, ${shortDayFull(arr[1])} … ${shortDayFull(arr[arr.length - 1])} (${arr.length} hari)`
}

function selectType(nextType) {
  const prevType = form.value.type
  form.value.type = nextType
  const curReason = form.value.reason.trim()
  if (!curReason || (QUICK_REASONS[prevType] || []).includes(curReason)) {
    form.value.reason = QUICK_REASONS[nextType][0]
  }
}

const PRESETS = computed(() => {
  const first = availableDays.value[0]
  const oneDayLabel = first && first !== today.value ? `1 hari (${shortDayFull(first)})` : 'Hari ini'
  return [
    { key: '1d', label: oneDayLabel },
    { key: '2d', label: '2 hari' },
    { key: '3d', label: '3 hari' },
    { key: '5d', label: '5 hari' },
    { key: 'pick', label: 'Pilih hari' },
    { key: 'range', label: 'Rentang' },
  ]
})

// Active izin list filtered by Jilid selector (shared between Calendar & History)
const filteredListByClass = computed(() =>
  izinList.value.filter((x) => !listClassFilter.value || String(x.classId) === listClassFilter.value),
)

const activeByDate = computed(() => {
  const map = new Map()
  for (const item of filteredListByClass.value) {
    if (item.status !== 'active') continue
    for (const d of item.dates || []) {
      if (!map.has(d)) map.set(d, [])
      map.get(d).push(item)
    }
  }
  for (const [, arr] of map) {
    arr.sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt))
  }
  return map
})

const todayItems = computed(() => activeByDate.value.get(today.value) || [])
const todayUniqueSantriCount = computed(() => new Set(todayItems.value.map((x) => x.santriId)).size)
const todayIsWeekend = computed(() => isWeekendIso(today.value))
const todayIzinCount = computed(() => todayItems.value.filter((x) => x.type !== 'sakit').length)
const todaySakitCount = computed(() => todayItems.value.filter((x) => x.type === 'sakit').length)
const selectedDayItems = computed(() => activeByDate.value.get(selectedDate.value) || [])
const selectedUniqueSantriCount = computed(() => new Set(selectedDayItems.value.map((x) => x.santriId)).size)
const selectedIsWeekend = computed(() => isWeekendIso(selectedDate.value))
const selectedIzinCount = computed(() => selectedDayItems.value.filter((x) => x.type !== 'sakit').length)
const selectedSakitCount = computed(() => selectedDayItems.value.filter((x) => x.type === 'sakit').length)
const canCreateOnSelectedDate = computed(
  () => !selectedIsWeekend.value && selectedDate.value >= minAllowedDate.value && selectedDate.value <= maxAllowedDate.value,
)

const highlightedDates = computed(() => {
  if (!highlightedId.value) return new Set()
  const item = izinList.value.find((x) => x.id === highlightedId.value)
  return new Set(item?.dates || [])
})

function toggleHighlight(item) {
  if ((item.dates || []).length <= 1) return
  highlightedId.value = highlightedId.value === item.id ? '' : item.id
}

// Monthly Calendar Grid (Sun..Sat)
const calMonthKey = computed(() => `${calYear.value}-${String(calMonth.value + 1).padStart(2, '0')}`)
const monthTitle = computed(() => `${MONTHS_FULL[calMonth.value]} ${calYear.value}`)

const calendarCells = computed(() => {
  const y = calYear.value
  const m = calMonth.value
  const first = new Date(Date.UTC(y, m, 1, 12, 0, 0))
  const startOffset = first.getUTCDay() // 0 = Sun
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0, 12, 0, 0)).getUTCDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
  const startDate = new Date(Date.UTC(y, m, 1 - startOffset, 12, 0, 0))
  const out = []
  for (let i = 0; i < totalCells; i += 1) {
    const dt = new Date(startDate.getTime() + i * 86400000)
    const iso = dt.toISOString().slice(0, 10)
    const wd = dt.getUTCDay()
    const items = activeByDate.value.get(iso) || []
    const izinCount = items.filter((x) => x.type !== 'sakit').length
    const sakitCount = items.filter((x) => x.type === 'sakit').length
    out.push({
      iso,
      day: dt.getUTCDate(),
      inMonth: dt.getUTCMonth() === m,
      isWeekend: wd === 0 || wd === 6,
      izinCount,
      sakitCount,
      total: items.length,
    })
  }
  return out
})

function cellAriaLabel(cell) {
  const base = longDayLabel(cell.iso)
  if (!cell.total) return `${base}, tidak ada izin`
  return `${base}, ${cell.total} santri izin atau sakit`
}

function shiftMonth(delta) {
  const next = new Date(Date.UTC(calYear.value, calMonth.value + delta, 1, 12, 0, 0))
  calYear.value = next.getUTCFullYear()
  calMonth.value = next.getUTCMonth()
}

function selectCalendarDate(cell) {
  selectedDate.value = cell.iso
  if (highlightedId.value && !highlightedDates.value.has(cell.iso)) {
    highlightedId.value = ''
  }
  if (!cell.inMonth) {
    calYear.value = Number(cell.iso.slice(0, 4))
    calMonth.value = Number(cell.iso.slice(5, 7)) - 1
  }
  if (isMobile.value) {
    dayDrawerOpen.value = true
  }
}

function openTodayDrawer() {
  selectedDate.value = today.value
  calYear.value = Number(today.value.slice(0, 4))
  calMonth.value = Number(today.value.slice(5, 7)) - 1
  highlightedId.value = ''
  dayDrawerOpen.value = true
}

function closeDayDrawer() {
  dayDrawerOpen.value = false
}

function highlightFromDrawer(item) {
  highlightedId.value = item.id
  dayDrawerOpen.value = false
}

function openComposerFromDrawer(date) {
  dayDrawerOpen.value = false
  openComposer(date ? { date } : {})
}

function jumpToday() {
  selectedDate.value = today.value
  calYear.value = Number(today.value.slice(0, 4))
  calMonth.value = Number(today.value.slice(5, 7)) - 1
  highlightedId.value = ''
}

function focusOnCalendar(item) {
  const firstDate = [...(item.dates || [])].sort()[0]
  if (!firstDate) return
  selectedDate.value = firstDate
  calYear.value = Number(firstDate.slice(0, 4))
  calMonth.value = Number(firstDate.slice(5, 7)) - 1
  highlightedId.value = (item.dates || []).length > 1 ? item.id : ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Smart Santri Picker (search + tap, zero native <select>)
const selectedSantri = computed(() => santriList.value.find((s) => s.id === form.value.santriId) || null)

const filteredSantri = computed(() => {
  const q = santriSearch.value.trim().toLowerCase()
  return santriList.value.filter((s) => {
    if (formClassFilter.value && String(s.classId) !== formClassFilter.value) return false
    if (q && !s.name.toLowerCase().includes(q)) return false
    return true
  })
})

function pickSantri(s) {
  form.value.santriId = s.id
  if (s.defaultSlot) form.value.slot = s.defaultSlot
  santriSearch.value = ''
  pickerOpen.value = false
  formError.value = ''
}

function reopenPicker() {
  pickerOpen.value = true
  santriSearch.value = ''
  nextTick(() => pickerSearchRef.value?.focus())
}

function openComposer({ santriId = '', date = '' } = {}) {
  formError.value = ''
  if (santriId) {
    const found = santriList.value.find((s) => s.id === santriId)
    if (found) {
      form.value.santriId = found.id
      if (found.defaultSlot) form.value.slot = found.defaultSlot
      pickerOpen.value = false
    }
  } else {
    form.value.santriId = ''
    santriSearch.value = ''
    formClassFilter.value = actClassOptions.value.some((c) => c.value === listClassFilter.value) ? listClassFilter.value : ''
    pickerOpen.value = true
  }

  if (date && !isWeekendIso(date)) {
    if (availableDays.value.includes(date)) {
      presetMode.value = 'pick'
      form.value.dates = [date]
    } else {
      presetMode.value = 'range'
      form.value.startDate = date
      form.value.endDate = date
    }
  } else if (!form.value.dates.length && availableDays.value.length) {
    applyPreset('1d')
  }
  composerOpen.value = true
}

function closeComposer() {
  if (saving.value) return
  composerOpen.value = false
}

const effectiveDates = computed(() => {
  if (presetMode.value === 'range') {
    const start = form.value.startDate
    const end = form.value.endDate
    if (!start || !end || end < start) return []
    const out = []
    let cur = start
    let steps = 0
    while (cur <= end && steps <= 31) {
      const wd = new Date(`${cur}T12:00:00Z`).getUTCDay()
      if (wd !== 0 && wd !== 6) out.push(cur)
      cur = addDaysIso(cur, 1)
      steps += 1
    }
    return out
  }
  return [...form.value.dates].sort()
})

const composerOverlaps = computed(() => {
  if (!form.value.santriId || !effectiveDates.value.length) return []
  const wantedSet = new Set(effectiveDates.value)
  return izinList.value.filter((x) =>
    x.status === 'active'
    && x.santriId === form.value.santriId
    && x.slot === form.value.slot
    && (x.dates || []).some((d) => wantedSet.has(d) && x.applied?.[d] !== 'teacher'),
  )
})

const composerOverlapDaysText = computed(() => {
  const wantedSet = new Set(effectiveDates.value)
  const hitDates = [...new Set(composerOverlaps.value.flatMap((x) => (x.dates || []).filter((d) => wantedSet.has(d))))].sort()
  return hitDates.map(shortDayFull).join(', ')
})

function prefillFromOverlap(existing) {
  if (!existing) return
  form.value.type = existing.type === 'sakit' ? 'sakit' : 'izin'
  form.value.reason = existing.reason || ''
}

function applyPreset(key) {
  presetMode.value = key
  const days = availableDays.value
  if (key === '1d') form.value.dates = days.slice(0, 1)
  else if (key === '2d') form.value.dates = days.slice(0, 2)
  else if (key === '3d') form.value.dates = days.slice(0, 3)
  else if (key === '5d') form.value.dates = days.slice(0, 5)
  else if (key === 'range') {
    form.value.startDate = days[0] || today.value
    form.value.endDate = days[Math.min(2, days.length - 1)] || today.value
  }
}

function toggleDate(d) {
  const cur = form.value.dates
  form.value.dates = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()
}

// History / full list filtering
const matchListStatus = (item, f) => {
  if (f === 'all') return true
  if (f === 'active') return item.status === 'active'
  return item.status !== 'active'
}
const countListFor = (f) => filteredListByClass.value.filter((x) => matchListStatus(x, f)).length

const visibleList = computed(() => {
  const q = listSearch.value.trim().toLowerCase()
  return filteredListByClass.value
    .filter((x) => {
      if (!matchListStatus(x, listStatusFilter.value)) return false
      if (!q) return true
      return (
        String(x.santriName || '').toLowerCase().includes(q) ||
        String(x.reason || '').toLowerCase().includes(q) ||
        String(x.byName || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt))
})

async function load({ quiet = false } = {}) {
  if (!quiet) loading.value = true
  loadError.value = ''
  try {
    const { data } = await api.get('/santri-presence/izin', { cache: false })
    classIds.value = data.classIds === null ? null : data.classIds || []
    actClassIds.value = data.actClassIds === undefined ? classIds.value : data.actClassIds === null ? null : data.actClassIds || []
    scopeSource.value = data.scopeSource || 'admin'
    if (data.today) {
      const wasInitial = selectedDate.value === today.value
      today.value = data.today
      if (wasInitial) {
        selectedDate.value = data.today
        calYear.value = Number(data.today.slice(0, 4))
        calMonth.value = Number(data.today.slice(5, 7)) - 1
      }
    }
    availableDays.value = Array.isArray(data.days) ? data.days : []
    santriList.value = Array.isArray(data.santri) ? data.santri : []
    izinList.value = Array.isArray(data.list) ? data.list : []

    if (!form.value.dates.length && availableDays.value.length) {
      applyPreset(presetMode.value)
    }
    const querySantri = typeof route.query.santri === 'string' ? route.query.santri : ''
    if (!quiet && querySantri && santriList.value.some((s) => s.id === querySantri)) {
      openComposer({ santriId: querySantri })
    }
  } catch (err) {
    loadError.value = err.response?.data?.error || 'Data izin santri belum bisa dimuat.'
  } finally {
    loading.value = false
  }
}

async function submitIzin(forceReplace = false) {
  formError.value = ''
  if (!form.value.santriId) {
    formError.value = 'Pilih santri terlebih dahulu.'
    return
  }
  if (!effectiveDates.value.length) {
    formError.value = 'Pilih minimal 1 hari sekolah (Senin–Jumat).'
    return
  }
  let replace = forceReplace === true
  if (!replace && composerOverlaps.value.length) {
    const existing = composerOverlaps.value[0]
    const ok = await ask({
      title: 'Perbarui izin yang sudah ada?',
      message: `${selectedSantri.value?.name || 'Santri ini'} sudah memiliki catatan ${existing.type === 'sakit' ? 'sakit' : 'izin'} pada ${composerOverlapDaysText.value} ("${existing.reason}"). Catatan lama akan diganti dengan data baru ini agar tidak ganda.`,
      confirmText: 'Ya, perbarui',
      cancelText: 'Batal',
    })
    if (!ok) return
    replace = true
  }

  saving.value = true
  try {
    const payload = {
      santriId: form.value.santriId,
      type: form.value.type,
      slot: form.value.slot,
      dates: effectiveDates.value,
      reason: form.value.reason.trim(),
      replace,
    }
    const { data } = await api.post('/santri-presence/izin', payload)
    if (data?.izin) {
      await load({ quiet: true })
      const firstDate = [...(data.izin.dates || effectiveDates.value)].sort()[0]
      if (firstDate) {
        selectedDate.value = firstDate
        calYear.value = Number(firstDate.slice(0, 4))
        calMonth.value = Number(firstDate.slice(5, 7)) - 1
        highlightedId.value = (data.izin.dates || []).length > 1 ? data.izin.id : ''
      }
    } else {
      await load({ quiet: true })
    }
    showSuccess(
      data?.replaced
        ? `${form.value.type === 'sakit' ? 'Sakit' : 'Izin'} diperbarui untuk ${(data?.recorded || effectiveDates.value).length} hari`
        : `${form.value.type === 'sakit' ? 'Sakit' : 'Izin'} disimpan untuk ${(data?.recorded || effectiveDates.value).length} hari & tercatat di Absen Santri`,
    )
    composerOpen.value = false
  } catch (err) {
    const resp = err.response?.data || {}
    if (err.response?.status === 409 && resp.code === 'DUPLICATE_IZIN' && !replace) {
      await load({ quiet: true })
      const ok = await ask({
        title: 'Sudah ada izin pada tanggal ini',
        message: `${resp.error || 'Sudah ada catatan izin aktif.'} Ingin memperbarui catatan yang ada dengan data baru ini?`,
        confirmText: 'Perbarui izin',
        cancelText: 'Batal',
      })
      if (ok) {
        saving.value = false
        return submitIzin(true)
      }
      return
    }
    formError.value = resp.error || 'Gagal menyimpan izin santri.'
  } finally {
    saving.value = false
  }
}

async function cancelIzin(item) {
  const ok = await ask({
    title: `Batalkan ${item.type === 'sakit' ? 'sakit' : 'izin'} ${item.santriName}?`,
    message: `Status ${item.type} untuk tanggal yang belum lewat akan dihapus dari Absen Santri sehingga santri bisa diabsen hadir seperti biasa.`,
    tone: 'danger',
    confirmText: 'Ya, batalkan',
    cancelText: 'Biarkan',
  })
  if (!ok) return
  cancellingId.value = item.id
  try {
    await api.delete(`/santri-presence/izin/${encodeURIComponent(item.id)}`)
    if (highlightedId.value === item.id) highlightedId.value = ''
    showSuccess(`Izin ${item.santriName} dibatalkan`)
    await load({ quiet: true })
  } catch (err) {
    showError(err.response?.data?.error || 'Gagal membatalkan izin')
  } finally {
    cancellingId.value = ''
  }
}

let mobileMq = null
function syncMobileViewport(e) {
  isMobile.value = !!e.matches
  if (!isMobile.value) dayDrawerOpen.value = false
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    mobileMq = window.matchMedia('(max-width: 959px)')
    syncMobileViewport(mobileMq)
    if (mobileMq.addEventListener) mobileMq.addEventListener('change', syncMobileViewport)
    else if (mobileMq.addListener) mobileMq.addListener(syncMobileViewport)
  }
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 30000)
  load()
})

onBeforeUnmount(() => {
  if (mobileMq) {
    if (mobileMq.removeEventListener) mobileMq.removeEventListener('change', syncMobileViewport)
    else if (mobileMq.removeListener) mobileMq.removeListener(syncMobileViewport)
  }
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
.iz {
  color: #0b3b2a;
}

.iz-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.iz-head-text {
  min-width: 0;
  flex: 1 1 240px;
}

.iz-head h1 {
  margin: 0 0 4px;
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--lp-ink, #0b3b2a);
}

.iz-head p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--lp-body, #475a50);
}

.iz-head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 640px) {
  .iz-head-actions {
    width: 100%;
  }
  .iz-head-actions .iz-btn {
    flex: 1 1 auto;
  }
}

.iz-note {
  margin: 0 0 12px;
  padding: 11px 14px;
  border-radius: 14px;
  font-size: 0.88rem;
  line-height: 1.5;
  background: #eef6f1;
  color: #0b3b2a;
}

.iz-note.is-warn {
  background: #fffbeb;
  border: 1px solid #f3d58b;
  color: #7c3a0d;
}

.iz-note.is-danger {
  background: #fdecea;
  border: 1px solid #f5b5ad;
  color: #7a1810;
}

/* Mobile-only Hari Ini compact strip */
.iz-today-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(11, 59, 42, 0.14);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.iz-today-strip.has-items {
  background: #f5fbf7;
  border-color: rgba(10, 92, 64, 0.28);
}

.iz-today-strip-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.iz-today-strip-text strong {
  font-size: 0.92rem;
  font-weight: 800;
  color: #0b3b2a;
}

.iz-today-strip-text span {
  font-size: 0.78rem;
  color: #475a50;
}

.iz-today-strip-right {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex-shrink: 0;
}

.iz-strip-chev {
  color: #5b6b62;
  flex: none;
}

.iz-cal-tap-hint {
  margin: 8px 0 0;
  font-size: 0.76rem;
  color: #5b6b62;
  text-align: center;
}

/* 1. PRIMARY: Interactive Calendar + Selected Day Detail Split */
.iz-board {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  margin-bottom: 24px;
}

@media (max-width: 959px) {
  /* Mobile uses the bottom drawer instead of a stacked list below the calendar */
  .iz-day-panel {
    display: none;
  }
}

@media (min-width: 960px) {
  .iz-today-strip,
  .iz-cal-tap-hint {
    display: none;
  }

  .iz-board {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    gap: 16px;
  }

  .iz-cal-card {
    position: sticky;
    top: calc(var(--appbar-h, 0px) + 16px);
    max-height: calc(100dvh - var(--appbar-h, 0px) - 32px);
    overflow-y: auto;
    z-index: 2;
  }
}

.iz-cal-card {
  padding: 14px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
}

.iz-cal-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.iz-cal-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.iz-cal-month {
  margin: 0;
  min-width: 136px;
  text-align: center;
  font-size: 1rem;
  font-weight: 800;
  color: #0b3b2a;
}

.iz-cal-arrow {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  color: #0b3b2a;
  cursor: pointer;
}

.iz-cal-arrow:hover {
  background: #eef6f1;
}

.iz-cal-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.iz-cal-today-btn {
  min-height: 38px;
  padding: 0 11px;
  border-radius: 10px;
  border: 1px solid rgba(10, 92, 64, 0.28);
  background: #eef6f1;
  color: #0a5c40;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.iz-cal-select {
  min-height: 38px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
}

@media (max-width: 520px) {
  .iz-cal-month {
    min-width: 0;
    font-size: 0.94rem;
  }

  .iz-cal-arrow {
    width: 36px;
    height: 36px;
  }

  .iz-cal-select {
    max-width: 132px;
  }
}

.iz-cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 4px;
  text-align: center;
}

.iz-cal-weekdays span {
  font-size: 0.74rem;
  font-weight: 700;
  color: #5b6b62;
  padding: 4px 0;
}

.iz-cal-weekdays span.is-wknd {
  color: #9ca3af;
}

.iz-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.iz-cal-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 3px;
  min-height: 50px;
  padding: 6px 2px 5px;
  border-radius: 11px;
  border: 1.5px solid transparent;
  background: #fbfcf9;
  color: #0b3b2a;
  font: inherit;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}

@media (max-width: 420px) {
  .iz-cal-cell {
    min-height: 46px;
    padding: 5px 1px 4px;
    border-radius: 9px;
  }
}

.iz-cal-cell:hover {
  background: #eef6f1;
}

.iz-cal-cell.is-out {
  opacity: 0.36;
}

.iz-cal-cell.is-wknd {
  background: #f5f6f5;
  color: #8a968f;
}

.iz-cal-cell.has-izin {
  background: #f0f9ff;
  border-color: rgba(2, 132, 199, 0.22);
}

.iz-cal-cell.has-sakit-only {
  background: #fffbeb;
  border-color: rgba(217, 119, 6, 0.28);
}

.iz-cal-cell.has-sakit-only .iz-cal-cnt {
  color: #92400e;
}

.iz-cal-cell.is-span-hi {
  background: #dcfce7;
  border-color: #0a5c40;
}

.iz-cal-cell.is-today {
  border-color: rgba(10, 92, 64, 0.55);
}

.iz-cal-cell.is-selected {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.iz-cal-num {
  font-size: 0.86rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.iz-cal-marks {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  line-height: 1;
}

.iz-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.iz-dot.is-izin { background: #0284c7; }
.iz-dot.is-sakit { background: #d97706; }

.iz-cal-cell.is-selected .iz-dot.is-izin { background: #bae6fd; }
.iz-cal-cell.is-selected .iz-dot.is-sakit { background: #fde68a; }

.iz-cal-cnt {
  font-size: 0.68rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #075985;
}

.iz-cal-cell.is-selected .iz-cal-cnt {
  color: #e3f1ea;
}

.iz-cal-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
  font-size: 0.76rem;
  font-weight: 600;
  color: #5b6b62;
}

.iz-cal-legend > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.iz-legend-ring {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 4px;
  border: 1.5px solid #0a5c40;
}

.iz-legend-hi {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 4px;
  background: #dcfce7;
  border: 1.5px solid #0a5c40;
}

.iz-legend-span {
  margin-left: auto;
  color: #0a5c40;
}

.iz-legend-clear {
  border: 0;
  background: transparent;
  color: #0a5c40;
  font: inherit;
  font-weight: 800;
  text-decoration: underline;
  cursor: pointer;
}

/* Selected Day Detail Panel */
.iz-day-panel {
  padding: 16px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.12);
}

.iz-day-panel.has-items {
  background: #f8fcf9;
  border-color: rgba(10, 92, 64, 0.22);
}

.iz-day-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.iz-day-title-wrap {
  min-width: 0;
  flex: 1 1 200px;
}

.iz-day-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 3px;
}

.iz-day-head h2 {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: #0b3b2a;
}

.iz-day-sub {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: #475a50;
}

.iz-today-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.iz-day-list {
  display: grid;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.iz-day-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 13px;
  border-radius: 14px;
  background: #fff;
  border: 1.5px solid rgba(11, 59, 42, 0.1);
}

.iz-day-row.is-multi {
  cursor: pointer;
}

.iz-day-row.is-highlighted {
  border-color: #0a5c40;
  background: #f0fdf4;
}

.iz-span-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  margin-top: 2px;
  padding: 2px 9px;
  border-radius: 8px;
  background: #f1f5f3;
  color: #2f4339;
  font-size: 0.76rem;
  font-weight: 700;
}

.iz-span-pill.is-multi {
  background: #e0f2fe;
  color: #075985;
}

.iz-day-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-top: 12px;
}

.iz-tap-tip {
  font-size: 0.76rem;
}

.iz-meta-tag {
  font-size: 0.78rem;
  font-weight: 600;
  color: #5b6b62;
}

/* 2. Secondary History Section */
.iz-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.iz-section-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: #0b3b2a;
}

.iz-seg {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 4px;
  padding: 3px;
  border-radius: 12px;
  background: rgba(11, 59, 42, 0.06);
}

.iz-seg.is-full {
  display: grid;
  width: 100%;
}

.iz-seg-btn {
  min-height: 38px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #3b4a42;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.iz-seg-btn span {
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
  margin-left: 3px;
}

.iz-seg-btn[aria-pressed='true'],
.iz-seg-btn[aria-checked='true'] {
  background: #fff;
  color: #0a5c40;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.iz-list-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  margin-bottom: 12px;
}

@media (max-width: 640px) {
  .iz-list-head .iz-seg {
    width: 100%;
  }
  .iz-list-bar {
    grid-template-columns: 1fr;
  }
}

.iz-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.iz-search-ico {
  position: absolute;
  left: 12px;
  color: #5b6b62;
  pointer-events: none;
}

.iz-input {
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.2);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  box-sizing: border-box;
}

.iz-input.iz-search-input {
  padding-left: 38px;
}

.iz-jilid-select {
  min-width: 155px;
}

.iz-empty {
  padding: 24px 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px dashed rgba(11, 59, 42, 0.2);
  text-align: center;
}

.iz-empty-title {
  margin: 0 0 4px;
  font-weight: 700;
  color: #0b3b2a;
}

.iz-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.iz-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 13px 15px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.1);
}

.iz-item-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1 1 200px;
}

.iz-item-side {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.iz-item-top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.iz-item-top strong {
  font-size: 0.98rem;
  color: #0b3b2a;
}

.iz-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
}

.iz-pill.is-ok { background: #e3f1ea; color: #0a5c40; }
.iz-pill.is-info { background: #e0f2fe; color: #075985; }
.iz-pill.is-warn { background: #fef3c7; color: #92400e; }
.iz-pill.is-today { background: #dcfce7; color: #166534; }
.iz-pill.is-idle { background: #f3f4f6; color: #4b5563; }

.iz-reason {
  margin: 2px 0;
  font-size: 0.9rem;
  color: #0b3b2a;
  overflow-wrap: anywhere;
}

.iz-sub {
  font-size: 0.81rem;
  color: #5b6b62;
}

/* Buttons */
.iz-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid transparent;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}

.iz-btn-sm {
  min-height: 38px;
  padding: 0 12px;
  font-size: 0.82rem;
}

.iz-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.iz-btn-primary {
  background: #0a5c40;
  color: #fff;
}

.iz-btn-ghost {
  background: #fff;
  border-color: rgba(11, 59, 42, 0.2);
  color: #0b3b2a;
}

.iz-btn-ghost.is-danger {
  color: #991b1b;
  border-color: rgba(153, 27, 27, 0.25);
}

.iz-btn-full {
  width: 100%;
}

/* Mobile Day Bottom Drawer (teleported to body, z-index 9985 < composer 9990 < DialogHost 100000) */
.iz-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 9985;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 25, 17, 0.45);
}

.iz-drawer {
  width: 100%;
  max-width: 560px;
  max-height: 82dvh;
  display: flex;
  flex-direction: column;
  border-radius: 22px 22px 0 0;
  background: #fbf9f3;
  color: #0b3b2a;
  box-shadow: 0 -14px 36px rgba(3, 25, 17, 0.22);
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
}

.iz-drawer-handle-wrap {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
  background: #fff;
}

.iz-drawer-handle {
  width: 38px;
  height: 4px;
  border-radius: 999px;
  background: rgba(11, 59, 42, 0.2);
}

.iz-drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 16px 12px;
  background: #fff;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.iz-drawer-head h2 {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: #0b3b2a;
}

.iz-drawer-body {
  padding: 14px 16px 16px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.iz-drawer-foot {
  padding: 10px 16px 14px;
  background: #fff;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.iz-drawer-enter-active,
.iz-drawer-leave-active {
  transition: opacity 0.2s ease;
}

.iz-drawer-enter-active .iz-drawer,
.iz-drawer-leave-active .iz-drawer {
  transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.iz-drawer-enter-from,
.iz-drawer-leave-to {
  opacity: 0;
}

.iz-drawer-enter-from .iz-drawer,
.iz-drawer-leave-to .iz-drawer {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .iz-drawer-enter-active,
  .iz-drawer-leave-active,
  .iz-drawer-enter-active .iz-drawer,
  .iz-drawer-leave-active .iz-drawer {
    transition: none;
  }
}

/* Composer Sheet (teleported to body, z-index 9990 < DialogHost 100000) */
.iz-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(3, 25, 17, 0.45);
}

@media (min-width: 640px) {
  .iz-overlay {
    align-items: center;
    padding: 20px;
  }
}

.iz-sheet {
  width: 100%;
  max-width: 560px;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  background: #fbf9f3;
  color: #0b3b2a;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 640px) {
  .iz-sheet {
    border-radius: 20px;
  }
}

.iz-sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  background: #fff;
  border-bottom: 1px solid rgba(11, 59, 42, 0.08);
}

.iz-sheet-head h2 {
  margin: 0 0 2px;
  font-size: 1.15rem;
  font-weight: 800;
}

.iz-close {
  flex: none;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  border: 1px solid rgba(11, 59, 42, 0.14);
  background: #fff;
  color: #0b3b2a;
  cursor: pointer;
}

.iz-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 18px 18px;
  overflow-y: auto;
}

.iz-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.iz-label {
  font-size: 0.84rem;
  font-weight: 700;
  color: #0b3b2a;
}

.iz-grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

/* Unified Smart Santri Picker */
.iz-picked {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 14px;
  background: #e9f5ef;
  border: 1.5px solid rgba(10, 92, 64, 0.3);
}

.iz-picked-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.iz-picked-info strong {
  font-size: 0.96rem;
  color: #0b3b2a;
}

.iz-picked-info span {
  font-size: 0.8rem;
  color: #2f5c48;
  font-weight: 600;
}

.iz-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(11, 59, 42, 0.14);
}

.iz-jilid-strip {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.iz-jilid-strip::-webkit-scrollbar {
  display: none;
}

.iz-mini-chip {
  flex: none;
  min-height: 34px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid rgba(11, 59, 42, 0.18);
  background: #fbf9f3;
  color: #2f4339;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.iz-mini-chip[aria-pressed='true'] {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.iz-picker-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 210px;
  overflow-y: auto;
  border-top: 1px solid rgba(11, 59, 42, 0.08);
}

.iz-picker-item {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 6px;
  border: 0;
  border-bottom: 1px solid rgba(11, 59, 42, 0.06);
  background: transparent;
  color: #0b3b2a;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.iz-picker-item:hover,
.iz-picker-item[aria-selected='true'] {
  background: #eef6f1;
}

.iz-picker-name {
  font-size: 0.92rem;
  font-weight: 700;
  min-width: 0;
  overflow-wrap: anywhere;
}

.iz-picker-jilid {
  flex: none;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(11, 59, 42, 0.07);
  color: #3b4a42;
  font-size: 0.74rem;
  font-weight: 700;
}

.iz-picker-empty {
  margin: 4px 0;
  text-align: center;
  font-size: 0.84rem;
  color: #5b6b62;
}

/* Date presets & chips */
.iz-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.iz-chip {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1.5px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.iz-chip[aria-pressed='true'] {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.iz-days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 6px;
}

.iz-day-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-height: 46px;
  padding: 6px 4px;
  border-radius: 11px;
  border: 1.5px solid rgba(11, 59, 42, 0.16);
  background: #fff;
  color: #0b3b2a;
  font: inherit;
  cursor: pointer;
}

.iz-day-chip strong {
  font-size: 0.78rem;
  font-weight: 800;
}

.iz-day-chip span {
  font-size: 0.72rem;
  color: #5b6b62;
}

.iz-day-chip[aria-pressed='true'] {
  background: #e3f1ea;
  border-color: #0a5c40;
  color: #0a5c40;
}

.iz-mt {
  margin-top: 4px;
}

.iz-selected-summary {
  margin: 0;
}

.iz-quick-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.iz-tpl-btn {
  min-height: 34px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid rgba(10, 92, 64, 0.22);
  background: #eef6f1;
  color: #0a5c40;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.iz-tpl-btn.active {
  background: #0a5c40;
  border-color: #0a5c40;
  color: #fff;
}

.iz-dup-warn {
  display: grid;
  gap: 6px;
  justify-items: start;
}

.iz-sheet-foot {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  padding-top: 4px;
}

.iz-btn:focus-visible,
.iz-close:focus-visible,
.iz-today-strip:focus-visible,
.iz-cal-arrow:focus-visible,
.iz-cal-cell:focus-visible,
.iz-cal-today-btn:focus-visible,
.iz-cal-select:focus-visible,
.iz-picker-item:focus-visible,
.iz-chip:focus-visible,
.iz-mini-chip:focus-visible,
.iz-seg-btn:focus-visible,
.iz-input:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}
</style>
