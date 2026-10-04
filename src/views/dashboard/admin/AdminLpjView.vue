<template>
  <div class="admin-lpj-view space-y-6">
    <!-- Header with Integrated Period Picker & View Selector -->
    <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold font-jakarta text-slate-900 tracking-tight">LPJ Guru</h1>
        <p class="text-sm text-slate-500 font-inter mt-1">
          Pantau kelengkapan & verifikasi laporan kinerja pengajar (dikelompokkan per bulan)
        </p>
      </div>

      <!-- Quick Toolbar: View Mode, Jump to Month & Documents Link -->
      <div class="flex flex-wrap items-center gap-2.5 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm self-start lg:self-auto">
        <!-- View Mode Dropdown -->
        <div class="flex items-center gap-1.5 pl-2">
          <label for="admin-lpj-view-select" class="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Tampilan:</label>
          <select
            id="admin-lpj-view-select"
            v-model="selectedViewPeriod"
            class="form-input text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:bg-white transition-all cursor-pointer"
          >
            <option value="all">🌐 Semua Bulan (Group by Bulan)</option>
            <option v-for="p in allKnownPeriods" :key="'view-opt-' + p" :value="p">
              {{ periodLabel(p) }} {{ p === activePeriod ? '(Aktif)' : '' }}
            </option>
          </select>
        </div>

        <!-- Classic Month Input for Quick Selection & Test Compatibility -->
        <div class="flex items-center gap-2 border-l border-slate-200 pl-2.5">
          <input
            id="admin-lpj-period"
            v-model="selectedMonth"
            type="month"
            class="form-input text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:bg-white transition-all"
          />
          <button
            type="button"
            class="btn btn-primary px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-primary-600/20 hover:-translate-y-0.5 transition-all"
            :disabled="loading"
            @click="applyPeriod"
          >
            {{ loading ? "Memuat..." : "Tampilkan" }}
          </button>
        </div>

        <router-link
          to="/dashboard/admin-documents"
          class="btn btn-secondary px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition-all text-slate-700 shrink-0"
        >
          <span>📄</span>
          <span>Dokumen LPJ</span>
        </router-link>
      </div>
    </header>

    <!-- Month Quick Pills Navigation -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
      <button
        type="button"
        class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border"
        :class="selectedViewPeriod === 'all' ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
        @click="selectedViewPeriod = 'all'"
      >
        🌐 Semua Bulan (Group by Bulan)
      </button>
      <button
        v-for="p in allKnownPeriods"
        :key="'tab-' + p"
        type="button"
        class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border flex items-center gap-1.5"
        :class="selectedViewPeriod === p ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm font-bold' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
        @click="selectedViewPeriod = p"
      >
        <span>{{ periodLabel(p) }}</span>
        <span
          v-if="monthStatsSummary[p]?.submittedCount > 0"
          class="w-2 h-2 rounded-full bg-sky-400"
          title="Ada laporan menunggu review"
        ></span>
      </button>
    </div>

    <!-- KPI Summary Cards (Overview Across Periods or Selected Period) -->
    <div v-if="!loading && !loadError" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Card 1: Wajib LPJ -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-500 font-inter">
            {{ selectedViewPeriod === 'all' ? 'Total Penugasan' : 'Peserta Wajib LPJ' }}
          </p>
          <p class="text-xl sm:text-2xl font-black font-jakarta text-slate-900">
            {{ summaryStats.totalEligible }} <span class="text-xs font-medium text-slate-400">Guru</span>
          </p>
        </div>
      </div>

      <!-- Card 2: Menunggu Review -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-500 font-inter">Menunggu Review</p>
          <p class="text-xl sm:text-2xl font-black font-jakarta text-sky-700">
            {{ summaryStats.submittedCount }} <span class="text-xs font-medium text-slate-400">Laporan</span>
          </p>
        </div>
      </div>

      <!-- Card 3: Disetujui -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-500 font-inter">Telah Disetujui</p>
          <p class="text-xl sm:text-2xl font-black font-jakarta text-emerald-700">
            {{ summaryStats.approvedCount }} <span class="text-xs font-medium text-slate-400">Laporan</span>
          </p>
        </div>
      </div>

      <!-- Card 4: Draft & Belum Mengisi -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-500 font-inter">Belum Selesai</p>
          <p class="text-xl sm:text-2xl font-black font-jakarta text-amber-700">
            {{ summaryStats.draftCount + summaryStats.notStartedCount }} 
            <span class="text-xs font-medium text-slate-400">
              ({{ summaryStats.draftCount }} Draft, {{ summaryStats.notStartedCount }} Belum Isi)
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Section: Atur Peserta LPJ (Collapsible Panel) -->
    <section id="assign-participants-section" v-if="!loading && !loadError" class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h2 class="text-lg sm:text-xl font-bold font-jakarta text-slate-900">
              Peserta LPJ {{ periodLabel(selectedAssignPeriod) }}
            </h2>
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {{ eligibleIds.length }} Terpilih
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 font-inter mt-0.5">
            Tentukan guru yang wajib menyusun LPJ pada periode ini. Pengajar yang dipilih otomatis masuk ke daftar pantauan.
          </p>
        </div>

        <!-- Controls: Periode Selector & Batch Actions -->
        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <label for="assign-period-select" class="text-xs font-bold text-slate-500 uppercase">Periode:</label>
            <select
              id="assign-period-select"
              v-model="selectedAssignPeriod"
              class="bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
              @change="syncAssignPeriodEligibleIds"
            >
              <option v-for="p in allKnownPeriods" :key="'assign-opt-' + p" :value="p">
                {{ periodLabel(p) }} {{ p === activePeriod ? '(Aktif)' : '' }}
              </option>
            </select>
          </div>

          <button
            type="button"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
            @click="selectAllEligible"
          >
            Pilih Semua
          </button>
          <button
            type="button"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
            @click="clearAllEligible"
          >
            Kosongkan
          </button>
        </div>
      </div>

      <!-- Loading or Teacher Chips Grid -->
      <div v-if="eligLoading" class="py-8 text-center text-sm text-slate-400 font-inter">
        <svg class="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        Memuat peserta...
      </div>

      <div v-else class="mt-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 elig-list">
          <label
            v-for="t in teachers"
            :key="t.id"
            class="elig-item flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none"
            :class="eligibleIds.includes(t.id) ? 'bg-emerald-50/60 border-emerald-300 shadow-sm' : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80'"
          >
            <input
              type="checkbox"
              :value="t.id"
              v-model="eligibleIds"
              class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <div
              class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
              :class="eligibleIds.includes(t.id) ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'"
            >
              {{ getTeacherInitials(t.displayName || t.name) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate" :class="eligibleIds.includes(t.id) ? 'text-emerald-950 font-bold' : 'text-slate-700'">
                {{ t.displayName || t.name || t.id }}
              </p>
              <p class="text-[11px] text-slate-400 truncate">
                {{ t.email || 'Pengajar TPQ' }}
              </p>
            </div>
            <span v-if="eligibleIds.includes(t.id)" class="text-emerald-600 text-xs font-bold shrink-0">
              ✓
            </span>
          </label>
        </div>

        <div class="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            class="btn btn-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-700/20 hover:-translate-y-0.5 transition flex items-center gap-2"
            :disabled="eligSaving"
            @click="saveEligibility"
          >
            <svg v-if="!eligSaving" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ eligSaving ? "Menyimpan..." : "Simpan Peserta" }}</span>
          </button>

          <div
            v-if="eligMessage"
            class="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl border flex items-center gap-2"
            :class="eligOk ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'"
          >
            <span>{{ eligOk ? '✓' : '⚠️' }}</span>
            <span>{{ eligMessage }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-4">
      <SkeletonLoader type="title" />
      <SkeletonLoader type="paragraph" />
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
      <div class="alert alert-error max-w-md mx-auto mb-4">{{ loadError }}</div>
      <button type="button" class="btn btn-secondary" @click="fetchData">
        Coba Lagi
      </button>
    </div>

    <!-- Section: Roster Laporan LPJ Dikelompokkan per Bulan (Group by Month) -->
    <section v-else class="space-y-6">
      <!-- Search & Status Filter Toolbar -->
      <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama pengajar..."
            class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Status Filter Pills -->
        <div class="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0"
            :class="statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
            @click="statusFilter = 'all'"
          >
            Semua
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0"
            :class="statusFilter === 'submitted' ? 'bg-sky-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
            @click="statusFilter === 'submitted'"
          >
            Menunggu ({{ summaryStats.submittedCount }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0"
            :class="statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
            @click="statusFilter === 'approved'"
          >
            Disetujui ({{ summaryStats.approvedCount }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0"
            :class="statusFilter === 'draft' ? 'bg-amber-500 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
            @click="statusFilter === 'draft'"
          >
            Draft ({{ summaryStats.draftCount }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0"
            :class="statusFilter === 'not_started' ? 'bg-slate-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'"
            @click="statusFilter === 'not_started'"
          >
            Belum Mengisi ({{ summaryStats.notStartedCount }})
          </button>
        </div>
      </div>

      <!-- Global Action Toast -->
      <div
        v-if="actionMessage"
        class="p-3.5 rounded-2xl border text-sm font-semibold flex items-center gap-2 shadow-xs transition-all"
        :class="actionOk ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'"
      >
        <span>{{ actionOk ? '✓' : '⚠️' }}</span>
        <span>{{ actionMessage }}</span>
      </div>

      <!-- Empty State if no cohorts found -->
      <div v-if="allCohortsEmpty" class="empty-state py-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8">
        <div class="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800 font-jakarta">Belum ada laporan</h3>
        <p class="text-sm text-slate-500 font-inter max-w-sm mx-auto mt-1">
          Belum ada data laporan atau penugasan peserta pada periode ini.
        </p>
      </div>

      <!-- Month Groups Cards (Group by Month) -->
      <div v-else class="space-y-5">
        <div
          v-for="cohort in visibleCohorts"
          :key="'cohort-' + cohort.period"
          class="month-group-card bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
        >
          <!-- Month Header Card -->
          <div
            class="month-group-header p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3.5 cursor-pointer bg-slate-50/70 border-b border-slate-100 select-none hover:bg-slate-100/60 transition-colors"
            @click="toggleMonthCollapse(cohort.period)"
          >
            <div class="flex items-center gap-3.5">
              <div
                class="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 shadow-sm"
                :class="cohort.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'"
              >
                📅
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-base sm:text-lg font-bold font-jakarta text-slate-900">
                    {{ cohort.label }}
                  </h3>
                  <span
                    v-if="cohort.isActive"
                    class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"
                  >
                    Periode Aktif
                  </span>
                  <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    {{ cohort.totalAssigned }} Guru Wajib LPJ
                  </span>
                </div>
                <p class="text-xs text-slate-500 font-inter mt-0.5">
                  {{ cohort.submittedCount }} Menunggu Review • {{ cohort.approvedCount }} Disetujui • {{ cohort.draftCount }} Draft • {{ cohort.notStartedCount }} Belum Mengisi
                </p>
              </div>
            </div>

            <!-- Month Quick Actions & Expand/Collapse Toggle -->
            <div class="flex items-center gap-2.5 self-end md:self-center" @click.stop>
              <button
                type="button"
                class="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs transition"
                @click="openAssignForPeriod(cohort.period)"
                title="Atur peserta untuk bulan ini"
              >
                <span>⚙️</span>
                <span>Atur Peserta</span>
              </button>

              <button
                type="button"
                class="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                @click="toggleMonthCollapse(cohort.period)"
                :title="isMonthExpanded(cohort.period) ? 'Ciutkan' : 'Bentangkan'"
              >
                <svg
                  class="w-4 h-4 transform transition-transform duration-200"
                  :class="{ 'rotate-180': isMonthExpanded(cohort.period) }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Month Content: Desktop Table & Mobile Cards -->
          <div v-show="isMonthExpanded(cohort.period)" class="p-4 sm:p-6">
            <!-- Empty state for this month -->
            <div v-if="cohort.items.length === 0" class="py-8 text-center">
              <p v-if="cohort.rawItemsCount === 0" class="text-sm text-slate-500">
                Belum ada guru yang ditetapkan sebagai peserta LPJ untuk periode {{ cohort.label }}.
              </p>
              <p v-else class="text-sm text-slate-500">
                Tidak ada guru yang cocok dengan filter status "{{ statusFilter }}" atau pencarian.
              </p>
              <button
                v-if="cohort.rawItemsCount === 0"
                type="button"
                class="btn btn-secondary text-xs font-bold mt-2"
                @click="openAssignForPeriod(cohort.period)"
              >
                + Tetapkan Peserta Sekarang
              </button>
            </div>

            <div v-else>
              <!-- Desktop Table View -->
              <div class="table-responsive hidden md:block">
                <table class="data-table w-full">
                  <thead>
                    <tr class="border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th class="py-3 px-4">Guru</th>
                      <th class="py-3 px-4">Status LPJ</th>
                      <th class="py-3 px-4">Kelengkapan</th>
                      <th class="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr
                      v-for="item in cohort.items"
                      :key="'row-' + cohort.period + '-' + item.guruId"
                      class="hover:bg-slate-50/70 transition-colors group"
                    >
                      <!-- Column Guru -->
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                            :class="item.status === 'not_started' ? 'bg-slate-200 text-slate-600' : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'"
                          >
                            {{ getTeacherInitials(item.teacher.displayName || item.teacher.name || item.guruId) }}
                          </div>
                          <div>
                            <p class="text-sm font-bold text-slate-900 font-jakarta group-hover:text-emerald-700 transition-colors">
                              {{ item.teacher.displayName || item.teacher.name || item.guruId }}
                            </p>
                            <p class="text-xs text-slate-400 font-inter">
                              {{ item.teacher.email || `ID: ${item.guruId.slice(0, 8)}...` }}
                            </p>
                          </div>
                        </div>
                      </td>

                      <!-- Column Status -->
                      <td class="py-3.5 px-4">
                        <span
                          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs"
                          :class="statusBadgeClasses(item.status)"
                        >
                          <span
                            class="w-2 h-2 rounded-full"
                            :class="statusDotClasses(item.status)"
                          ></span>
                          <span>{{ formatItemStatus(item.status) }}</span>
                        </span>
                      </td>

                      <!-- Column Kelengkapan -->
                      <td class="py-3.5 px-4">
                        <div class="cell-progress max-w-[180px]">
                          <span class="text-xs font-bold text-slate-700 w-12">
                            {{ item.status === 'not_started' ? '0%' : (item.report ? completenessText(item.report.id) : '-') }}
                          </span>
                          <div class="progress-track progress-track-sm h-2 rounded-full bg-slate-100 overflow-hidden flex-1">
                            <div
                              class="progress-fill h-full rounded-full transition-all duration-500"
                              :class="item.percentage === 100 ? 'bg-emerald-600' : (item.status === 'not_started' ? 'bg-slate-300' : 'bg-emerald-500')"
                              :style="{ width: item.percentage + '%' }"
                            />
                          </div>
                        </div>
                      </td>

                      <!-- Column Aksi -->
                      <td class="py-3.5 px-4 text-right">
                        <div class="row-actions inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            class="action-link px-3 py-1.5 text-xs font-bold rounded-lg transition"
                            :class="item.report ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'"
                            @click="openOrCreateReport(item, cohort.period)"
                          >
                            {{ item.report ? 'Detail' : 'Buka LPJ' }}
                          </button>
                          <button
                            v-if="item.report && item.report.status === 'submitted'"
                            type="button"
                            class="action-link px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition disabled:opacity-50"
                            :disabled="actingId === item.report.id"
                            @click="approve(item.report)"
                          >
                            {{ actingId === item.report.id ? "Memproses..." : "Setujui" }}
                          </button>
                          <button
                            v-if="item.report && item.report.status === 'approved'"
                            type="button"
                            class="action-link px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition disabled:opacity-50"
                            :disabled="actingId === item.report.id"
                            @click="reopen(item.report)"
                          >
                            {{ actingId === item.report.id ? "Memproses..." : "Reopen" }}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Mobile Card View -->
              <div class="report-cards md:hidden space-y-3 mt-1">
                <article
                  v-for="item in cohort.items"
                  :key="'card-' + cohort.period + '-' + item.guruId"
                  class="report-card p-4 rounded-2xl border shadow-xs space-y-3"
                  :class="item.status === 'not_started' ? 'bg-slate-50/70 border-slate-200' : 'bg-white border-slate-200/80'"
                >
                  <div class="report-head flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                        :class="item.status === 'not_started' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 text-white'"
                      >
                        {{ getTeacherInitials(item.teacher.displayName || item.teacher.name || item.guruId) }}
                      </div>
                      <div>
                        <h4 class="font-bold text-slate-900 text-sm font-jakarta">
                          {{ item.teacher.displayName || item.teacher.name || item.guruId }}
                        </h4>
                        <p class="text-[11px] text-slate-400">
                          {{ item.teacher.email || `ID: ${item.guruId.slice(0, 8)}...` }}
                        </p>
                      </div>
                    </div>
                    <span
                      class="badge text-xs font-bold px-2.5 py-0.5 rounded-full border"
                      :class="statusBadgeClasses(item.status)"
                    >
                      {{ formatItemStatus(item.status) }}
                    </span>
                  </div>

                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs text-slate-500">
                      <span>Kelengkapan</span>
                      <span class="font-bold text-slate-800">
                        {{ item.status === 'not_started' ? '0% (Belum ada berkas)' : (item.report ? completenessText(item.report.id) : '-') }}
                      </span>
                    </div>
                    <div class="progress-track h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        class="progress-fill h-full rounded-full transition-all duration-500"
                        :class="item.percentage === 100 ? 'bg-emerald-600' : (item.status === 'not_started' ? 'bg-slate-300' : 'bg-emerald-600')"
                        :style="{ width: item.percentage + '%' }"
                      />
                    </div>
                  </div>

                  <div class="report-actions flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      class="btn btn-secondary flex-1 py-2 text-xs font-bold rounded-xl"
                      @click="openOrCreateReport(item, cohort.period)"
                    >
                      {{ item.report ? 'Detail' : 'Buka LPJ' }}
                    </button>
                    <button
                      v-if="item.report && item.report.status === 'submitted'"
                      type="button"
                      class="btn btn-primary flex-1 py-2 text-xs font-bold rounded-xl"
                      :disabled="actingId === item.report.id"
                      @click="approve(item.report)"
                    >
                      {{ actingId === item.report.id ? "Memproses..." : "Setujui" }}
                    </button>
                    <button
                      v-if="item.report && item.report.status === 'approved'"
                      type="button"
                      class="btn btn-secondary flex-1 py-2 text-xs font-bold rounded-xl"
                      :disabled="actingId === item.report.id"
                      @click="reopen(item.report)"
                    >
                      {{ actingId === item.report.id ? "Memproses..." : "Reopen" }}
                    </button>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import SkeletonLoader from "@/components/SkeletonLoader.vue";
import { currentPeriod, periodLabel, statusLabel } from "@/utils/lpjState";

const router = useRouter();

// State
const activePeriod = ref(currentPeriod());
const period = ref(currentPeriod());
const selectedMonth = ref(currentPeriod());
const selectedViewPeriod = ref("all"); // 'all' (Group by Bulan) or specific YYYY-MM
const selectedAssignPeriod = ref(currentPeriod());

const loading = ref(true);
const loadError = ref("");
const reports = ref([]);
const teachers = ref([]);
const completenessMap = ref({});
const eligibilityMap = ref({}); // { [period]: string[] }

const actingId = ref("");
const actionMessage = ref("");
const actionOk = ref(false);

const eligibleIds = ref([]);
const eligLoading = ref(false);
const eligSaving = ref(false);
const eligMessage = ref("");
const eligOk = ref(false);

const statusFilter = ref("all");
const searchQuery = ref("");
const collapsedMonths = ref(new Set());
const periodTouched = ref(false);

// Discover all known periods
const allKnownPeriods = computed(() => {
  const set = new Set();
  
  if (activePeriod.value) set.add(activePeriod.value);
  set.add(currentPeriod());
  
  Object.keys(eligibilityMap.value || {}).forEach((p) => {
    if (/^\d{4}-\d{2}$/.test(p)) set.add(p);
  });
  
  reports.value.forEach((r) => {
    if (r.period && /^\d{4}-\d{2}$/.test(r.period)) set.add(r.period);
  });

  // Recent 6 months for quick access (e.g. July - Dec of academic year)
  const [curY, curM] = (activePeriod.value || currentPeriod()).split("-").map(Number);
  for (let offset = 0; offset < 6; offset++) {
    const d = new Date(curY, curM - 1 - offset, 1);
    const pStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    set.add(pStr);
  }

  return Array.from(set).sort((a, b) => b.localeCompare(a));
});

// Build Month Cohorts
const monthCohorts = computed(() => {
  return allKnownPeriods.value.map((p) => {
    const assignedGuruIds = new Set(eligibilityMap.value[p] || []);
    const periodReports = reports.value.filter((r) => r.period === p);
    
    // Also include any teacher who has a report for this period
    periodReports.forEach((r) => {
      if (r.guruId) assignedGuruIds.add(r.guruId);
    });

    const items = Array.from(assignedGuruIds).map((gId) => {
      const teacherObj = teachers.value.find((t) => t.id === gId) || {
        id: gId,
        displayName: `Guru (${gId.slice(0, 6)})`,
      };
      const rep = periodReports.find((r) => r.guruId === gId) || null;

      let status = "not_started";
      let percentage = 0;
      let missingDays = null;

      if (rep) {
        status = rep.status || "draft";
        const c = completenessMap.value[rep.id] || rep.completeness;
        if (c) {
          percentage = c.percentage ?? 0;
          missingDays = c.missingDays;
        }
      }

      return {
        guruId: gId,
        teacher: teacherObj,
        report: rep,
        status,
        percentage,
        missingDays,
        isEligible: (eligibilityMap.value[p] || []).includes(gId),
      };
    });

    // Stats for this month
    const totalAssigned = assignedGuruIds.size;
    let submittedCount = 0;
    let approvedCount = 0;
    let draftCount = 0;
    let notStartedCount = 0;

    items.forEach((i) => {
      if (i.status === "submitted") submittedCount++;
      else if (i.status === "approved") approvedCount++;
      else if (i.status === "draft") draftCount++;
      else notStartedCount++;
    });

    // Apply status filter and search query
    let filteredItems = items;
    if (statusFilter.value !== "all") {
      filteredItems = filteredItems.filter((i) => i.status === statusFilter.value);
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      filteredItems = filteredItems.filter((i) => {
        const name = (i.teacher.displayName || i.teacher.name || i.guruId).toLowerCase();
        return name.includes(q);
      });
    }

    // Sort items: submitted first (needs attention), then draft, then approved, then not_started
    const statusWeight = { submitted: 1, draft: 2, approved: 3, not_started: 4 };
    filteredItems.sort((a, b) => (statusWeight[a.status] || 5) - (statusWeight[b.status] || 5));

    return {
      period: p,
      label: periodLabel(p),
      isActive: p === activePeriod.value,
      totalAssigned,
      submittedCount,
      approvedCount,
      draftCount,
      notStartedCount,
      items: filteredItems,
      rawItemsCount: items.length,
    };
  });
});

// Month summary map for badges
const monthStatsSummary = computed(() => {
  const map = {};
  monthCohorts.value.forEach((c) => {
    map[c.period] = c;
  });
  return map;
});

// Filtered Cohorts based on View Mode
const visibleCohorts = computed(() => {
  if (selectedViewPeriod.value === "all") {
    return monthCohorts.value;
  }
  return monthCohorts.value.filter((c) => c.period === selectedViewPeriod.value);
});

const allCohortsEmpty = computed(() => {
  if (visibleCohorts.value.length === 0) return true;
  return visibleCohorts.value.every((c) => c.items.length === 0 && c.rawItemsCount === 0);
});

// Backward-compatible computed property for test assertion
const filteredReports = computed(() => {
  if (statusFilter.value === "all") return reports.value;
  return reports.value.filter((r) => r.status === statusFilter.value);
});

const summaryStats = computed(() => {
  let totalEligible = 0;
  let submittedCount = 0;
  let approvedCount = 0;
  let draftCount = 0;
  let notStartedCount = 0;

  visibleCohorts.value.forEach((c) => {
    totalEligible += c.totalAssigned;
    submittedCount += c.submittedCount;
    approvedCount += c.approvedCount;
    draftCount += c.draftCount;
    notStartedCount += c.notStartedCount;
  });

  return {
    totalEligible,
    submittedCount,
    approvedCount,
    draftCount,
    notStartedCount,
  };
});

// Expand / Collapse Handlers
const toggleMonthCollapse = (p) => {
  if (collapsedMonths.value.has(p)) {
    collapsedMonths.value.delete(p);
  } else {
    collapsedMonths.value.add(p);
  }
};

const isMonthExpanded = (p) => !collapsedMonths.value.has(p);

// Participant assignment synchronization
const syncAssignPeriodEligibleIds = () => {
  const p = selectedAssignPeriod.value;
  if (eligibilityMap.value[p]) {
    eligibleIds.value = [...eligibilityMap.value[p]];
  } else {
    eligibleIds.value = [];
  }
};

const openAssignForPeriod = (p) => {
  selectedAssignPeriod.value = p;
  syncAssignPeriodEligibleIds();
  const el = document.getElementById("assign-participants-section");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const selectAllEligible = () => {
  eligibleIds.value = teachers.value.map((t) => t.id);
};

const clearAllEligible = () => {
  eligibleIds.value = [];
};

const getTeacherInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatItemStatus = (status) => {
  if (status === "not_started") return "Belum Mengisi";
  if (status === "approved") return "Disetujui";
  if (status === "submitted") return "Menunggu Review";
  if (status === "draft") return "Draft / Proses";
  return statusLabel(status);
};

const statusBadgeClasses = (status) => {
  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  }
  if (status === "submitted") {
    return "bg-sky-50 text-sky-700 border-sky-200/80";
  }
  if (status === "draft") {
    return "bg-amber-50 text-amber-700 border-amber-200/80";
  }
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const statusDotClasses = (status) => {
  if (status === "approved") return "bg-emerald-500";
  if (status === "submitted") return "bg-sky-500";
  if (status === "draft") return "bg-amber-500";
  return "bg-slate-400";
};

const teacherName = (report) => {
  const found = teachers.value.find((t) => t.id === report.guruId);
  return found
    ? found.displayName || found.name || report.guruId
    : report.guruId;
};

const progressValue = (id) => completenessMap.value[id]?.percentage ?? 0;

const completenessText = (id) => {
  const c = completenessMap.value[id];
  if (c === undefined) return "menghitung...";
  if (!c) return "-";
  return `${c.percentage}%`;
};

const applyPeriod = () => {
  periodTouched.value = true;
  if (selectedMonth.value) {
    period.value = selectedMonth.value;
    selectedViewPeriod.value = selectedMonth.value;
    selectedAssignPeriod.value = selectedMonth.value;
    syncAssignPeriodEligibleIds();
  }
};

// Open existing report or initialize draft if teacher has not started
const openOrCreateReport = async (item, periodStr) => {
  if (item.report?.id) {
    router.push(`/dashboard/lpj/${item.report.id}`);
    return;
  }
  try {
    const res = await api.post("/ljp/reports", {
      period: periodStr,
      guruId: item.guruId,
    });
    if (res.data?.id) {
      router.push(`/dashboard/lpj/${res.data.id}`);
    }
  } catch (err) {
    console.error("Failed to open draft report:", err);
    actionOk.value = false;
    actionMessage.value = err.response?.data?.error || "Gagal membuka draft LPJ untuk guru ini.";
  }
};

// Main Data Fetch
const fetchData = async () => {
  loading.value = true;
  loadError.value = "";
  actionMessage.value = "";
  try {
    try {
      const profileRes = await api.get("/settings/tpq-profile");
      if (profileRes.data?.activeOperationalPeriod) {
        activePeriod.value = profileRes.data.activeOperationalPeriod;
        if (!periodTouched.value) {
          period.value = profileRes.data.activeOperationalPeriod;
          selectedMonth.value = profileRes.data.activeOperationalPeriod;
          selectedAssignPeriod.value = profileRes.data.activeOperationalPeriod;
        }
      }
    } catch {
      // Fallback to current period
    }

    const [reportsRes, teachersRes, eligRes] = await Promise.all([
      api.get("/ljp/reports", { params: { period: "all" } }),
      api.get("/users", { params: { role: "guru" } }).catch(() => ({ data: [] })),
      api.get("/ljp/eligibility").catch(() => ({ data: [] })),
    ]);

    reports.value = Array.isArray(reportsRes.data) ? reportsRes.data : [];
    const teacherList = Array.isArray(teachersRes.data)
      ? teachersRes.data
      : teachersRes.data?.users;
    teachers.value = Array.isArray(teacherList) ? teacherList : [];

    // Parse eligibility documents into map
    const map = {};
    if (Array.isArray(eligRes.data)) {
      eligRes.data.forEach((item) => {
        if (item.period) {
          map[item.period] = Array.isArray(item.guruIds) ? item.guruIds : [];
        }
      });
    } else if (eligRes.data?.period && eligRes.data?.guruIds) {
      map[eligRes.data.period] = eligRes.data.guruIds;
    }
    eligibilityMap.value = map;
    syncAssignPeriodEligibleIds();

    // Map cached completeness
    const newCompletenessMap = {};
    const reportsNeedingCompleteness = [];

    reports.value.forEach((report) => {
      if (
        (report.status === "submitted" ||
          report.status === "approved" ||
          (report.status === "draft" && !report.isCompletenessStale)) &&
        report.completeness
      ) {
        newCompletenessMap[report.id] = report.completeness;
      } else {
        reportsNeedingCompleteness.push(report);
      }
    });
    completenessMap.value = newCompletenessMap;

    // Fetch completeness for reports needing it in background
    if (reportsNeedingCompleteness.length > 0) {
      Promise.all(
        reportsNeedingCompleteness.map(async (report) => {
          try {
            const res = await api.get(`/ljp/reports/${report.id}/completeness`);
            completenessMap.value = {
              ...completenessMap.value,
              [report.id]: res.data,
            };
          } catch {
            completenessMap.value = {
              ...completenessMap.value,
              [report.id]: null,
            };
          }
        })
      );
    }
  } catch (error) {
    console.error("Fetch admin LPJ data error:", error);
    loadError.value = error.response?.data?.error || "Gagal memuat laporan LPJ.";
  } finally {
    loading.value = false;
  }
};

// Fetch single period eligibility helper
const fetchEligibility = async () => {
  eligLoading.value = true;
  eligMessage.value = "";
  try {
    const res = await api.get("/ljp/eligibility", { params: { period: selectedAssignPeriod.value } });
    eligibleIds.value = res.data?.guruIds || [];
    eligibilityMap.value = {
      ...eligibilityMap.value,
      [selectedAssignPeriod.value]: eligibleIds.value,
    };
  } catch {
    eligibleIds.value = [];
  } finally {
    eligLoading.value = false;
  }
};

// Save eligibility for current assign period
const saveEligibility = async () => {
  eligSaving.value = true;
  eligMessage.value = "";
  try {
    const targetPeriod = selectedAssignPeriod.value || period.value;
    await api.put("/ljp/eligibility", { period: targetPeriod, guruIds: eligibleIds.value });
    eligOk.value = true;
    eligMessage.value = `Daftar peserta untuk ${periodLabel(targetPeriod)} tersimpan.`;
    eligibilityMap.value = {
      ...eligibilityMap.value,
      [targetPeriod]: [...eligibleIds.value],
    };
  } catch (error) {
    eligOk.value = false;
    eligMessage.value = error.response?.data?.error || "Gagal menyimpan peserta.";
  } finally {
    eligSaving.value = false;
  }
};

const approve = async (report) => {
  actingId.value = report.id;
  actionMessage.value = "";
  try {
    await api.post(`/ljp/reports/${report.id}/approve`);
    actionOk.value = true;
    actionMessage.value = `Laporan ${teacherName(report)} (${periodLabel(report.period)}) disetujui.`;
    await fetchData();
  } catch (error) {
    actionOk.value = false;
    actionMessage.value = error.response?.data?.error || "Gagal menyetujui laporan.";
  } finally {
    actingId.value = "";
  }
};

const reopen = async (report) => {
  actingId.value = report.id;
  actionMessage.value = "";
  try {
    await api.post(`/ljp/reports/${report.id}/reopen`);
    actionOk.value = true;
    actionMessage.value = `Laporan ${teacherName(report)} (${periodLabel(report.period)}) dikembalikan ke draft.`;
    await fetchData();
  } catch (error) {
    actionOk.value = false;
    actionMessage.value = error.response?.data?.error || "Gagal mengembalikan laporan.";
  } finally {
    actingId.value = "";
  }
};

onMounted(fetchData);
</script>

<style scoped>
.admin-lpj-view {
  padding-top: 60px;
}
@media (min-width: 1024px) {
  .admin-lpj-view {
    padding-top: 0;
  }
}
.table-responsive {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
}
.data-table th {
  font-weight: 700;
  color: #64748b;
  background: #f8fafc;
}
.data-table tbody tr:hover {
  background: #f8fafc;
}
.cell-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}
.progress-track-sm {
  height: 6px;
}
.action-link {
  font-weight: 700;
  cursor: pointer;
}
.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary {
  background: var(--primary, #059669);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark, #047857);
}
.btn-secondary {
  background: #f1f5f9;
  color: #334155;
}
.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.alert {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
}
.alert-error {
  background: rgba(244, 67, 54, 0.1);
  color: #c62828;
  border: 1px solid rgba(244, 67, 54, 0.2);
}
.badge {
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}
.month-group-card {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
}
</style>
