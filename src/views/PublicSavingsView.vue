<template>
  <div class="public-savings-page min-h-screen bg-[#fafaf9] text-slate-800 font-sans selection:bg-emerald-600 selection:text-white">
    <!-- Top Bar Navigation (Public Header) -->
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-900/10 shadow-sm transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <!-- Logo & Branding -->
        <router-link to="/" class="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg">
          <img :src="logoUrl" alt="TPQ AMANAH" class="w-10 h-10 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
          <div class="flex flex-col">
            <span class="font-bold text-base sm:text-lg text-emerald-900 tracking-tight leading-tight">
              TPQ AMANAH
            </span>
            <span class="text-[11px] font-medium text-emerald-700 hidden xs:inline-block">
              Portal Transparansi Kas & Tabungan
            </span>
          </div>
        </router-link>

        <!-- Right Header Actions -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Refresh Button -->
          <button
            type="button"
            @click="refreshData"
            :disabled="loading"
            class="p-2 sm:px-3 sm:py-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Muat ulang data terbaru"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              :class="{ 'animate-spin': loading }"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span class="hidden sm:inline">Segarkan</span>
          </button>

          <!-- Share Button (Quick) -->
          <button
            v-if="book"
            type="button"
            @click="openShareModal"
            class="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Bagikan</span>
          </button>

          <!-- Print / PDF Button -->
          <button
            v-if="book"
            type="button"
            @click="openPrintModal"
            class="px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-all text-xs font-semibold hidden md:flex items-center gap-1.5 shadow-sm"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Cetak PDF</span>
          </button>

          <!-- If authenticated: Shortcut to Dashboard -->
          <router-link
            v-if="authStore.isAuthenticated"
            :to="`/dashboard/savings/${bookId}`"
            class="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
            title="Kelola buku ini di Dashboard"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span class="hidden sm:inline">Mode Kelola</span>
          </router-link>

          <!-- If guest: Link to Login / Home -->
          <router-link
            v-else
            to="/login"
            class="px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-all text-xs font-semibold"
          >
            Login Guru
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- 1. LOADING SKELETON -->
      <div v-if="loading && !book" class="space-y-6 animate-pulse">
        <div class="h-44 bg-slate-200/80 rounded-3xl"></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="h-28 bg-slate-200/80 rounded-2xl"></div>
          <div class="h-28 bg-slate-200/80 rounded-2xl"></div>
          <div class="h-28 bg-slate-200/80 rounded-2xl"></div>
          <div class="h-28 bg-slate-200/80 rounded-2xl"></div>
        </div>
        <div class="h-96 bg-slate-200/80 rounded-2xl"></div>
      </div>

      <!-- 2. ERROR STATE: BUKU PRIVAT (403) -->
      <div v-else-if="bookAccessError && bookAccessError.code === 'SAVINGS_BOOK_PRIVATE'" class="max-w-xl mx-auto my-12 text-center p-8 bg-white border border-amber-200 rounded-3xl shadow-xl shadow-amber-900/5">
        <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 text-3xl shadow-inner">
          🔒
        </div>
        <span class="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-3">
          Akses Terbatas
        </span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
          Buku Tabungan Bersifat Pribadi
        </h1>
        <p class="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
          Buku catatan keuangan ini diatur ke mode <strong>Pribadi</strong> oleh pengelolanya dan belum dibuka untuk akses publik atau wali santri.
        </p>
        <div v-if="bookAccessError.ownerName" class="p-3.5 mb-6 bg-slate-50 rounded-xl border border-slate-200/80 text-xs sm:text-sm text-slate-700">
          <span class="text-slate-500">Pengelola Buku:</span>
          <strong class="ml-1.5 text-slate-900">{{ bookAccessError.ownerName }}</strong>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <router-link
            to="/"
            class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold transition-all text-center"
          >
            ← Kembali ke Beranda
          </router-link>
          <router-link
            v-if="!authStore.isAuthenticated"
            to="/login"
            class="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold transition-all shadow-md shadow-emerald-700/20 text-center"
          >
            Login Guru / Pengurus
          </router-link>
          <router-link
            v-else
            to="/dashboard/savings"
            class="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold transition-all shadow-md shadow-emerald-700/20 text-center"
          >
            Buka Tabungan Saya
          </router-link>
        </div>
      </div>

      <!-- 3. ERROR STATE: BUKU TIDAK DITEMUKAN (404 / OTHER) -->
      <div v-else-if="bookAccessError" class="max-w-xl mx-auto my-12 text-center p-8 bg-white border border-rose-200 rounded-3xl shadow-xl shadow-rose-900/5">
        <div class="w-20 h-20 mx-auto mb-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 text-3xl shadow-inner">
          🔍
        </div>
        <span class="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3">
          Tidak Ditemukan
        </span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
          {{ bookAccessError.title || 'Buku Tabungan Tidak Ditemukan' }}
        </h1>
        <p class="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
          {{ bookAccessError.message || 'Pastikan tautan yang Anda buka sudah tepat atau hubungi pengurus TPQ Amanah.' }}
        </p>
        <div class="flex gap-3 justify-center">
          <router-link
            to="/"
            class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold transition-all shadow-md text-center"
          >
            Kembali ke Beranda
          </router-link>
        </div>
      </div>

      <!-- 4. ACTIVE PUBLIC CONTENT -->
      <div v-else-if="book" class="space-y-6">
        <!-- Toast Feedback -->
        <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
          <div v-if="toastMessage" class="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white text-xs sm:text-sm font-medium rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700">
            <span class="text-emerald-400">✓</span>
            <span>{{ toastMessage }}</span>
          </div>
        </Transition>

        <!-- A. HERO BOOK HEADER CARD -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#043324] via-[#064e3b] to-[#022c1f] text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/20 border border-emerald-600/20">
          <!-- Background Geometric Ambient Glow -->
          <div class="absolute -top-16 -right-16 w-64 h-64 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-3 max-w-3xl">
              <!-- Badges Row -->
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm"
                  :class="book.status === 'active' ? 'bg-emerald-400/20 border border-emerald-400/40 text-emerald-200' : 'bg-slate-500/20 border border-slate-400/40 text-slate-300'">
                  <span class="w-2 h-2 rounded-full" :class="book.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'"></span>
                  <span>{{ book.status === 'active' ? 'Buku Aktif' : 'Buku Ditutup (Arsip)' }}</span>
                </span>

                <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-200 text-xs font-bold tracking-wide">
                  🌐 Publik & Transparan
                </span>
              </div>

              <!-- Book Title -->
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {{ book.title }}
              </h1>

              <!-- Description -->
              <p v-if="book.description" class="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
                {{ book.description }}
              </p>

              <!-- Meta Info -->
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-emerald-200/80 pt-1">
                <div class="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Dikelola oleh <strong class="text-white">{{ book.createdByName }}</strong></span>
                </div>
                <span>&bull;</span>
                <div class="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Dibuat: {{ formatDate(book.createdAt) }}</span>
                </div>
                <span>&bull;</span>
                <span class="text-emerald-300 font-medium">Terverifikasi TPQ Amanah</span>
              </div>
            </div>

            <!-- Quick Action CTA Group -->
            <div class="flex flex-wrap sm:flex-nowrap md:flex-col gap-2 shrink-0">
              <button
                type="button"
                @click="openShareModal"
                class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-950/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Bagikan Tautan</span>
              </button>

              <button
                type="button"
                @click="openPrintModal"
                class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>
        </div>

        <!-- B. METRIC STATS ROW (5 RESPONSIVE CARDS) -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          <!-- 1. Saldo Terhimpun (Full width on 2-col mobile) -->
          <div class="col-span-2 sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-900/10 flex flex-col justify-between relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-xs sm:text-sm font-semibold text-emerald-100 flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
                Saldo Bersih Terhimpun
              </span>
              <span class="px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[10px] font-bold uppercase">
                Kas Saat Ini
              </span>
            </div>
            <div class="mt-1">
              <div class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {{ formatLedgerCurrency(book.totalBalance) }}
              </div>
              <p class="text-[11px] text-emerald-200/90 mt-1">
                Total akumulasi kas aktif dan saldo per hari ini
              </p>
            </div>
          </div>

          <!-- 2. Total Pemasukan -->
          <div class="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold text-slate-600">Total Pemasukan</span>
              <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                ↓
              </div>
            </div>
            <div>
              <div class="text-lg sm:text-xl font-bold text-emerald-700 tracking-tight">
                +Rp {{ formatCurrency(book.totalIncome) }}
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">Seluruh uang masuk</p>
            </div>
          </div>

          <!-- 3. Total Pengeluaran -->
          <div class="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold text-slate-600">Total Pengeluaran</span>
              <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                ↑
              </div>
            </div>
            <div>
              <div class="text-lg sm:text-xl font-bold text-rose-600 tracking-tight">
                -Rp {{ formatCurrency(book.totalExpense) }}
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">Biaya & operasional</p>
            </div>
          </div>

          <!-- 4. Anggota & Transaksi (Combined or Individual) -->
          <div class="col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex lg:flex-col justify-around lg:justify-between">
            <div>
              <div class="text-xs font-semibold text-slate-500 mb-1">Total Anggota</div>
              <div class="text-lg sm:text-xl font-bold text-slate-800">
                {{ summary.length }} <span class="text-xs font-normal text-slate-500">Santri</span>
              </div>
            </div>
            <div class="border-l lg:border-l-0 lg:border-t border-slate-100 pl-4 lg:pl-0 lg:pt-2">
              <div class="text-xs font-semibold text-slate-500 mb-1">Total Transaksi</div>
              <div class="text-lg sm:text-xl font-bold text-slate-800">
                {{ transactions.length }} <span class="text-xs font-normal text-slate-500">Catatan</span>
              </div>
            </div>
          </div>
        </div>

        <!-- C. NAVIGATION TABS (SEGMENTED CONTROL) -->
        <div class="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-sm flex items-center gap-1 sticky top-16 z-30 backdrop-blur-md bg-white/95">
          <button
            type="button"
            @click="activeTab = 'transactions'"
            class="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200"
            :class="activeTab === 'transactions' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="2" width="6" height="4" rx="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="15" y2="16" />
            </svg>
            <span>Riwayat Transaksi</span>
            <span class="px-1.5 py-0.5 rounded-full text-[11px]" :class="activeTab === 'transactions' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'">
              {{ filteredTransactions.length }}
            </span>
          </button>

          <button
            type="button"
            @click="activeTab = 'members'"
            class="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200"
            :class="activeTab === 'members' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Rekap Santri</span>
            <span class="px-1.5 py-0.5 rounded-full text-[11px]" :class="activeTab === 'members' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'">
              {{ filteredSummary.length }}
            </span>
          </button>

          <button
            type="button"
            @click="activeTab = 'info'"
            class="py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200"
            :class="activeTab === 'info' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span class="hidden sm:inline">Info & Panduan</span>
          </button>
        </div>

        <!-- D. TAB CONTENT: TRANSACTIONS -->
        <div v-if="activeTab === 'transactions'" class="space-y-4">
          <!-- Active Filter Banner (When clicked from santri tab) -->
          <div v-if="selectedSantriFilter" class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-sm">
            <div class="flex items-center gap-2 text-emerald-900 font-medium">
              <span class="text-base">👤</span>
              <span>Menampilkan transaksi khusus santri: <strong class="font-bold underline">{{ selectedSantriFilter }}</strong></span>
            </div>
            <button
              type="button"
              @click="clearSantriFilter"
              class="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
            >
              ✕ Tampilkan Semua
            </button>
          </div>

          <!-- Filter & Search Controls -->
          <div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <!-- Search Field -->
            <div class="relative flex-1">
              <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                placeholder="Cari nama santri, keterangan, atau catatan..."
              />
              <button
                v-if="searchQuery"
                type="button"
                @click="searchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <!-- Segmented Type Filter -->
            <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                @click="filterType = 'all'"
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                :class="filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              >
                Semua
              </button>
              <button
                type="button"
                @click="filterType = 'income'"
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                :class="filterType === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'"
              >
                <span>+</span> Pemasukan
              </button>
              <button
                type="button"
                @click="filterType = 'expense'"
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                :class="filterType === 'expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'"
              >
                <span>-</span> Pengeluaran
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredTransactions.length === 0" class="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm">
            <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 text-2xl">
              📂
            </div>
            <h3 class="text-base font-bold text-slate-800 mb-1">Tidak Ada Transaksi</h3>
            <p class="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {{ searchQuery || filterType !== 'all' || selectedSantriFilter ? 'Tidak ada transaksi yang cocok dengan filter atau kata kunci Anda.' : 'Belum ada catatan transaksi pada buku tabungan ini.' }}
            </p>
            <button
              v-if="searchQuery || filterType !== 'all' || selectedSantriFilter"
              type="button"
              @click="resetAllFilters"
              class="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
            >
              Reset Filter
            </button>
          </div>

          <!-- MOBILE LIST VIEW (Cards on small screens) -->
          <div v-else class="space-y-2.5 sm:hidden">
            <div
              v-for="tx in paginatedTransactions"
              :key="tx.id"
              class="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-3"
            >
              <div class="flex items-start gap-3 min-w-0">
                <div
                  class="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm"
                  :class="isIncome(tx) ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'"
                >
                  {{ isIncome(tx) ? '↓' : '↑' }}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-slate-900 text-sm truncate">
                      {{ tx.santriName || tx.description || 'Tanpa Keterangan' }}
                    </h4>
                  </div>
                  <p v-if="tx.notes" class="text-xs text-slate-500 italic mt-0.5 line-clamp-2">
                    "{{ tx.notes }}"
                  </p>
                  <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>{{ formatDate(tx.date || tx.createdAt) }}</span>
                    <span>&bull;</span>
                    <span class="capitalize font-medium" :class="isIncome(tx) ? 'text-emerald-700' : 'text-rose-600'">
                      {{ isIncome(tx) ? 'Pemasukan' : 'Pengeluaran' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Amount -->
              <div class="text-right shrink-0">
                <span
                  class="font-extrabold text-sm block"
                  :class="isIncome(tx) ? 'text-emerald-700' : 'text-rose-600'"
                >
                  {{ isIncome(tx) ? '+' : '-' }}Rp {{ formatCurrency(tx.amount) }}
                </span>
              </div>
            </div>
          </div>

          <!-- DESKTOP TABLE VIEW (Screens >= 640px) -->
          <div class="hidden sm:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th class="py-3 px-4 w-28">Tanggal</th>
                    <th class="py-3 px-4 w-24">Jenis</th>
                    <th class="py-3 px-4">Santri / Keterangan</th>
                    <th class="py-3 px-4">Catatan</th>
                    <th class="py-3 px-4 text-right w-36">Nominal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-normal">
                  <tr
                    v-for="tx in paginatedTransactions"
                    :key="tx.id"
                    class="hover:bg-slate-50/80 transition-colors"
                  >
                    <td class="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {{ formatDate(tx.date || tx.createdAt) }}
                    </td>
                    <td class="py-3 px-4 whitespace-nowrap">
                      <span
                        class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold"
                        :class="isIncome(tx) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                      >
                        {{ isIncome(tx) ? 'Pemasukan' : 'Pengeluaran' }}
                      </span>
                    </td>
                    <td class="py-3 px-4 font-semibold text-slate-800">
                      {{ tx.santriName || tx.description || '-' }}
                    </td>
                    <td class="py-3 px-4 text-xs text-slate-500">
                      {{ tx.notes || '-' }}
                    </td>
                    <td class="py-3 px-4 text-right font-bold whitespace-nowrap" :class="isIncome(tx) ? 'text-emerald-700' : 'text-rose-600'">
                      {{ isIncome(tx) ? '+' : '-' }}Rp {{ formatCurrency(tx.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pagination Bar -->
          <div v-if="totalPages > 1" class="flex items-center justify-between pt-2">
            <span class="text-xs text-slate-500">
              Menampilkan {{ pageStart + 1 }}-{{ Math.min(pageEnd, filteredTransactions.length) }} dari {{ filteredTransactions.length }} transaksi
            </span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Sebelumnya
              </button>
              <span class="px-2 text-xs font-bold text-slate-700">
                Hal {{ currentPage }} / {{ totalPages }}
              </span>
              <button
                type="button"
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        </div>

        <!-- E. TAB CONTENT: MEMBERS REKAP -->
        <div v-else-if="activeTab === 'members'" class="space-y-4">
          <!-- Member Search & Sort -->
          <div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div class="relative flex-1">
              <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                v-model="memberSearchQuery"
                type="text"
                class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                placeholder="Cari nama santri..."
              />
            </div>

            <div class="flex items-center gap-2 text-xs">
              <span class="text-slate-500 font-medium">Urutkan:</span>
              <select
                v-model="memberSortOrder"
                class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="name_asc">Nama (A - Z)</option>
                <option value="balance_desc">Saldo Terbanyak</option>
                <option value="count_desc">Paling Sering Setor</option>
              </select>
            </div>
          </div>

          <!-- Empty Members -->
          <div v-if="filteredSummary.length === 0" class="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm">
            <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 text-2xl">
              👥
            </div>
            <h3 class="text-base font-bold text-slate-800 mb-1">Tidak Ada Data Santri</h3>
            <p class="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {{ memberSearchQuery ? 'Nama santri tidak ditemukan dengan kata kunci tersebut.' : 'Belum ada anggota santri yang mencatat setoran tabungan di buku ini.' }}
            </p>
          </div>

          <!-- Members Grid (Card per Santri) -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div
              v-for="santri in filteredSummary"
              :key="santri.santriId"
              class="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div class="flex items-start gap-3 mb-3">
                <div class="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                  {{ getInitials(santri.santriName) }}
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="font-bold text-slate-900 text-sm leading-tight truncate">
                    {{ santri.santriName }}
                  </h4>
                  <p class="text-xs text-slate-400 mt-0.5">
                    {{ santri.transactionCount }}x setoran tercatat
                  </p>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <span class="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Total Tabungan</span>
                  <span class="text-base font-extrabold text-emerald-700">
                    Rp {{ formatCurrency(santri.balance) }}
                  </span>
                </div>
                <button
                  type="button"
                  @click="filterTransactionsBySantri(santri.santriName)"
                  class="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1"
                  title="Lihat riwayat transaksi santri ini"
                >
                  <span>Riwayat</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- F. TAB CONTENT: INFO & TRANSPARANSI -->
        <div v-else-if="activeTab === 'info'" class="space-y-4">
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                Tentang Buku Ini
              </span>
              <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                {{ book.title }}
              </h2>
              <p class="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
                {{ book.description || 'Buku ini digunakan sebagai sarana transparansi pencatatan kas, iuran, dan tabungan santri TPQ AMANAH.' }}
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div class="text-2xl mb-2">🕌</div>
                <h4 class="font-bold text-slate-900 text-sm">Prinsip Amanah</h4>
                <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                  Setiap rupiah yang masuk dan keluar dicatat secara jujur dan transparan untuk menjaga kepercayaan wali santri dan masyarakat.
                </p>
              </div>

              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div class="text-2xl mb-2">⚡</div>
                <h4 class="font-bold text-slate-900 text-sm">Real-time & Akurat</h4>
                <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                  Data yang tampil pada halaman publik ini bersumber langsung dari sistem pembukuan resmi guru dan pengurus TPQ Amanah.
                </p>
              </div>

              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div class="text-2xl mb-2">📞</div>
                <h4 class="font-bold text-slate-900 text-sm">Pusat Bantuan</h4>
                <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                  Jika terdapat kekeliruan nominal atau pertanyaan terkait tabungan ananda, silakan hubungi pengurus atau guru kelas.
                </p>
              </div>
            </div>

            <!-- WhatsApp Help Center -->
            <div class="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/60 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  💬
                </div>
                <div>
                  <h4 class="font-bold text-emerald-950 text-sm">Perlu konfirmasi atau bantuan tabungan?</h4>
                  <p class="text-xs text-emerald-800">Hubungi layanan pengurus TPQ Amanah via WhatsApp.</p>
                </div>
              </div>
              <a
                href="https://wa.me/6281234567890?text=Assalamu%27alaikum%20Admin%20TPQ%20Amanah%2C%20saya%20ingin%20bertanya%20mengenai%20tabungan."
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap"
              >
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- SHARE MODAL -->
    <div v-if="showShareModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" @click.self="showShareModal = false">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              🌐
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-base">Bagikan Tautan Publik</h3>
              <p class="text-xs text-slate-500">Siapa saja bisa membuka tanpa perlu login</p>
            </div>
          </div>
          <button @click="showShareModal = false" class="text-slate-400 hover:text-slate-600 p-1 text-lg">✕</button>
        </div>

        <!-- URL Box -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">Tautan Web</label>
          <div class="flex items-center gap-2">
            <input
              type="text"
              readonly
              :value="publicShareUrl"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 select-all font-mono"
            />
            <button
              type="button"
              @click="copyShareLink"
              class="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 transition-all shadow-sm"
            >
              {{ copiedLink ? '✓ Tersalin' : 'Salin' }}
            </button>
          </div>
        </div>

        <!-- WhatsApp Quick Share -->
        <div class="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <a
            :href="whatsappShareUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>Kirim Pesan ke WhatsApp</span>
          </a>

          <button
            v-if="canUseNativeShare"
            type="button"
            @click="triggerNativeShare"
            class="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Buka Lembar Berbagi Sistem</span>
          </button>
        </div>
      </div>
    </div>

    <!-- PRINT / EXPORT PDF MODAL -->
    <div v-if="showPrintModal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" @click.self="showPrintModal = false">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              📄
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-base">Unduh Laporan PDF</h3>
              <p class="text-xs text-slate-500">Pilih rentang data laporan yang ingin dicetak</p>
            </div>
          </div>
          <button @click="showPrintModal = false" class="text-slate-400 hover:text-slate-600 p-1 text-lg">✕</button>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            @click="printMode = 'month'"
            class="p-2.5 rounded-xl border text-xs font-bold text-center transition-all"
            :class="printMode === 'month' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'"
          >
            Bulan Ini
          </button>
          <button
            type="button"
            @click="printMode = 'range'"
            class="p-2.5 rounded-xl border text-xs font-bold text-center transition-all"
            :class="printMode === 'range' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'"
          >
            Rentang
          </button>
          <button
            type="button"
            @click="printMode = 'all'"
            class="p-2.5 rounded-xl border text-xs font-bold text-center transition-all"
            :class="printMode === 'all' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'"
          >
            Semua
          </button>
        </div>

        <!-- Month Picker -->
        <div v-if="printMode === 'month'" class="space-y-1.5">
          <label class="text-xs font-bold text-slate-600 uppercase tracking-wider">Pilih Bulan</label>
          <input
            v-model="printMonth"
            type="month"
            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <!-- Range Pickers -->
        <div v-else-if="printMode === 'range'" class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-600">Dari Tanggal</label>
            <input
              v-model="printStartDate"
              type="date"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-600">Sampai Tanggal</label>
            <input
              v-model="printEndDate"
              type="date"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            @click="showPrintModal = false"
            class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            @click="generatePdf"
            :disabled="generatingPdf"
            class="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50"
          >
            {{ generatingPdf ? 'Membuat PDF...' : 'Unduh Dokumen PDF' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api, { clearApiCache } from '@/services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoUrl from '@/assets/logo.png';

const route = useRoute();
const authStore = useAuthStore();
const bookId = computed(() => route.params.bookId);

// State
const loading = ref(true);
const book = ref(null);
const transactions = ref([]);
const summary = ref([]);
const bookAccessError = ref(null);

// UI Filters & Tabs
const activeTab = ref('transactions'); // 'transactions' | 'members' | 'info'
const searchQuery = ref('');
const filterType = ref('all'); // 'all' | 'income' | 'expense'
const selectedSantriFilter = ref('');
const memberSearchQuery = ref('');
const memberSortOrder = ref('name_asc');

// Pagination
const currentPage = ref(1);
const itemsPerPage = 20;

// Share & Modal state
const showShareModal = ref(false);
const showPrintModal = ref(false);
const copiedLink = ref(false);
const toastMessage = ref('');
const generatingPdf = ref(false);

// Print Options
const printMode = ref('month');
const printMonth = ref(new Date().toISOString().slice(0, 7));
const printStartDate = ref('');
const printEndDate = ref('');

// Computed Share Links
const publicShareUrl = computed(() => {
  return `${window.location.origin}/tabungan/${bookId.value}`;
});

const whatsappShareUrl = computed(() => {
  const title = book.value?.title || 'Buku Tabungan';
  const balance = formatLedgerCurrency(book.value?.totalBalance || 0);
  const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nBerikut tautan transparansi pembukuan & tabungan TPQ AMANAH:\n📖 *${title}*\n💰 Saldo Saat Ini: *${balance}*\n\nSilakan pantau riwayat dan rincian transaksi selengkapnya pada tautan resmi berikut:\n👉 ${publicShareUrl.value}\n\nJazakumullah khairan katsiran.`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
});

const canUseNativeShare = computed(() => {
  return typeof navigator !== 'undefined' && !!navigator.share;
});

// Formatters
const isIncome = (tx) => {
  return tx.type === 'income' || (Number(tx.amount) > 0 && tx.type !== 'expense');
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Math.abs(Math.round(Number(val))).toLocaleString('id-ID');
};

const formatLedgerCurrency = (val) => {
  const num = Math.round(Number(val) || 0);
  if (num < 0) return `-Rp ${Math.abs(num).toLocaleString('id-ID')}`;
  return `Rp ${num.toLocaleString('id-ID')}`;
};

const formatDate = (val) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getInitials = (name) => {
  if (!name) return 'S';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Data Fetching
const fetchBookData = async (isManualRefresh = false) => {
  if (!bookId.value) return;
  loading.value = true;
  bookAccessError.value = null;

  if (isManualRefresh) {
    clearApiCache('/savings');
  }

  try {
    // Gunakan endpoint overview efisien
    const res = await api.get(`/savings/public/books/${bookId.value}/overview`, {
      headers: isManualRefresh ? { 'Cache-Control': 'no-cache' } : {},
    });

    book.value = res.data.book;
    transactions.value = res.data.transactions || [];
    summary.value = res.data.summary || [];

    if (isManualRefresh) {
      showToast('Data berhasil disegarkan!');
    }
  } catch (error) {
    console.error('Fetch public savings overview error:', error);
    const status = error.response?.status;
    const errData = error.response?.data || {};

    if (status === 403 || errData.code === 'SAVINGS_BOOK_PRIVATE') {
      bookAccessError.value = {
        code: 'SAVINGS_BOOK_PRIVATE',
        title: errData.title || 'Buku Tabungan Bersifat Pribadi',
        message: errData.error || 'Buku ini tidak tersedia untuk publik.',
        ownerName: errData.ownerName || null,
      };
    } else if (status === 404) {
      bookAccessError.value = {
        code: 'NOT_FOUND',
        title: 'Buku Tabungan Tidak Ditemukan',
        message: 'Tautan mungkin sudah tidak aktif atau salah ketik.',
      };
    } else {
      bookAccessError.value = {
        code: 'SERVER_ERROR',
        title: 'Gagal Memuat Data',
        message: 'Terjadi gangguan jaringan atau server. Silakan coba kembali sesaat lagi.',
      };
    }
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  fetchBookData(true);
};

// Filtering & Search
const filterTransactionsBySantri = (santriName) => {
  selectedSantriFilter.value = santriName;
  activeTab.value = 'transactions';
  currentPage.value = 1;
};

const clearSantriFilter = () => {
  selectedSantriFilter.value = '';
};

const resetAllFilters = () => {
  searchQuery.value = '';
  filterType.value = 'all';
  selectedSantriFilter.value = '';
  currentPage.value = 1;
};

const filteredTransactions = computed(() => {
  return transactions.value.filter((tx) => {
    // Filter Santri
    if (selectedSantriFilter.value) {
      if ((tx.santriName || '') !== selectedSantriFilter.value) return false;
    }

    // Filter Tipe
    if (filterType.value === 'income' && !isIncome(tx)) return false;
    if (filterType.value === 'expense' && isIncome(tx)) return false;

    // Search Query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      const name = (tx.santriName || '').toLowerCase();
      const desc = (tx.description || '').toLowerCase();
      const notes = (tx.notes || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || notes.includes(q);
    }

    return true;
  });
});

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage) || 1;
});

const pageStart = computed(() => {
  return (currentPage.value - 1) * itemsPerPage;
});

const pageEnd = computed(() => {
  return pageStart.value + itemsPerPage;
});

const paginatedTransactions = computed(() => {
  return filteredTransactions.value.slice(pageStart.value, pageEnd.value);
});

// Member Filtering & Sorting
const filteredSummary = computed(() => {
  let list = [...summary.value];

  if (memberSearchQuery.value.trim()) {
    const q = memberSearchQuery.value.toLowerCase();
    list = list.filter((s) => (s.santriName || '').toLowerCase().includes(q));
  }

  if (memberSortOrder.value === 'balance_desc') {
    list.sort((a, b) => (b.balance || 0) - (a.balance || 0));
  } else if (memberSortOrder.value === 'count_desc') {
    list.sort((a, b) => (b.transactionCount || 0) - (a.transactionCount || 0));
  } else {
    list.sort((a, b) => (a.santriName || '').localeCompare(b.santriName || ''));
  }

  return list;
});

// Share Actions
const openShareModal = () => {
  copiedLink.value = false;
  showShareModal.value = true;
};

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(publicShareUrl.value);
    copiedLink.value = true;
    showToast('Tautan publik berhasil disalin!');
    setTimeout(() => {
      copiedLink.value = false;
    }, 2500);
  } catch (err) {
    console.error('Copy failed:', err);
  }
};

const triggerNativeShare = async () => {
  if (!navigator.share) return;
  try {
    await navigator.share({
      title: book.value?.title || 'Buku Tabungan TPQ Amanah',
      text: `Pantau pembukuan dan tabungan santri ${book.value?.title} di TPQ Amanah:`,
      url: publicShareUrl.value,
    });
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Share error:', err);
    }
  }
};

const showToast = (msg) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
};

// PDF Generation
const openPrintModal = () => {
  showPrintModal.value = true;
};

const generatePdf = () => {
  if (generatingPdf.value || !book.value) return;
  generatingPdf.value = true;

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;

    // Filter transactions according to printMode
    let txList = [...transactions.value];
    let rangeLabel = 'Semua Waktu';

    if (printMode.value === 'month' && printMonth.value) {
      const [year, month] = printMonth.value.split('-').map(Number);
      const monthDate = new Date(year, month - 1, 1);
      rangeLabel = monthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      txList = txList.filter((tx) => {
        const d = new Date(tx.date || tx.createdAt);
        return d.getFullYear() === year && d.getMonth() === month - 1;
      });
    } else if (printMode.value === 'range' && printStartDate.value && printEndDate.value) {
      const start = new Date(printStartDate.value);
      const end = new Date(printEndDate.value);
      end.setHours(23, 59, 59, 999);
      rangeLabel = `${formatDate(start)} - ${formatDate(end)}`;
      txList = txList.filter((tx) => {
        const d = new Date(tx.date || tx.createdAt);
        return d >= start && d <= end;
      });
    }

    // Sort ascending for ledger statement
    txList.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));

    // Header Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 51, 36);
    doc.text('LAPORAN TABUNGAN & KAS (PUBLIK)', pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('TPQ AMANAH - PORTAL TRANSPARANSI', pageWidth / 2, 23, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, 29, { align: 'center' });

    // Green Divider Line
    doc.setDrawColor(4, 51, 36);
    doc.setLineWidth(0.5);
    doc.line(marginX, 33, pageWidth - marginX, 33);

    // Meta Table
    autoTable(doc, {
      startY: 37,
      body: [
        ['Judul Buku', book.value.title || '-', 'Periode', rangeLabel],
        ['Pengelola', book.value.createdByName || 'Pengurus TPQ', 'Status Buku', book.value.status === 'active' ? 'Aktif' : 'Ditutup'],
        ['Saldo Saat Ini', formatLedgerCurrency(book.value.totalBalance), 'Total Transaksi', `${txList.length} data`],
      ],
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold', fillColor: [248, 250, 252] },
        1: { cellWidth: 64 },
        2: { cellWidth: 26, fontStyle: 'bold', fillColor: [248, 250, 252] },
        3: { cellWidth: 64 },
      },
    });

    // Ledger Rows
    const tableBody = txList.map((tx, idx) => {
      const isInc = isIncome(tx);
      return [
        idx + 1,
        formatDate(tx.date || tx.createdAt),
        isInc ? 'Pemasukan' : 'Pengeluaran',
        tx.santriName || tx.description || '-',
        tx.notes || '-',
        (isInc ? '+Rp ' : '-Rp ') + formatCurrency(tx.amount),
      ];
    });

    if (tableBody.length === 0) {
      tableBody.push([
        {
          content: 'Tidak ada transaksi pada periode yang dipilih.',
          colSpan: 6,
          styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 116, 139] },
        },
      ]);
    }

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      head: [['No', 'Tanggal', 'Jenis', 'Santri / Keterangan', 'Catatan', 'Nominal']],
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: [4, 51, 36],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      styles: { fontSize: 8, cellPadding: 2.2 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 24 },
        2: { cellWidth: 24 },
        3: { cellWidth: 50 },
        4: { cellWidth: 42 },
        5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
    });

    // Page Numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(120);
      doc.text(
        `Dokumen Transparansi TPQ Amanah • Halaman ${i} dari ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    // Save File
    const filename = `tabungan-${book.value.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
    doc.save(filename);
    showToast('Laporan PDF berhasil diunduh!');
    showPrintModal.value = false;
  } catch (err) {
    console.error('PDF error:', err);
    showToast('Gagal membuat PDF. Coba kembali.');
  } finally {
    generatingPdf.value = false;
  }
};

onMounted(() => {
  fetchBookData();
});
</script>

<style scoped>
.public-savings-page {
  -webkit-font-smoothing: antialiased;
}
</style>

