<template>
  <div class="savings-detail">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        <span>Kembali</span>
      </button>
      <div class="header-main-row">
        <div class="header-info" v-if="book">
          <div class="title-row">
            <h1>{{ book.title }}</h1>
            <span class="book-badge" :class="book.status">{{
              book.status === "active" ? "Aktif" : "Ditutup"
            }}</span>
            <span v-if="book.isPublished" class="badge-shared">🌐 Bersama</span>
          </div>
          <p v-if="book.description">{{ book.description }}</p>
          <p class="book-meta">
            Dibuat oleh {{ book.createdByName }} &middot;
            {{ formatDate(book.createdAt) }}
          </p>
        </div>
        <div v-if="book" class="header-actions">
          <button
            class="print-trigger-btn"
            type="button"
            @click="openPrintModal"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path
                d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
              />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Cetak PDF
          </button>
          <!-- Book action menu: hanya owner atau admin -->
          <div v-if="canManageBook" class="book-action-wrap" @click.stop>
            <button
              class="book-action-dots"
              @click="showBookMenu = !showBookMenu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            <div v-if="showBookMenu" class="book-action-dropdown">
              <button
                v-if="!authStore.isAdmin"
                class="bad-item"
                :class="{ active: book.isPublished }"
                @click="
                  toggleBookPublish();
                  showBookMenu = false;
                "
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                {{
                  book.isPublished ? "Jadikan Pribadi" : "Publish ke Guru Lain"
                }}
              </button>
              <button
                class="bad-item"
                @click="
                  openBookEdit();
                  showBookMenu = false;
                "
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  />
                </svg>
                Edit Buku
              </button>
              <button
                v-if="book.status === 'active'"
                class="bad-item warning"
                @click="
                  confirmBookClose();
                  showBookMenu = false;
                "
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                Tutup Buku
              </button>
              <button
                v-else
                class="bad-item success"
                @click="
                  reopenThisBook();
                  showBookMenu = false;
                "
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
                </svg>
                Buka Kembali
              </button>
              <div class="bad-divider"></div>
              <button
                class="bad-item danger"
                @click="
                  confirmBookDelete();
                  showBookMenu = false;
                "
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                Hapus Buku
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <template v-else-if="bookAccessError">
      <section class="book-unavailable glass-card">
        <div class="unavailable-icon">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V8a5 5 0 0 1 9.8-1.4" />
            <path d="M18 2l4 4-4 4" />
          </svg>
        </div>
        <div class="unavailable-content">
          <span class="unavailable-eyebrow">Buku tidak tersedia</span>
          <h1>{{ bookAccessError.title }}</h1>
          <p>{{ bookAccessError.message }}</p>
          <div v-if="bookAccessError.ownerName" class="unavailable-owner">
            <span>Pemilik buku</span>
            <strong>{{ bookAccessError.ownerName }}</strong>
          </div>
        </div>
        <div class="unavailable-actions">
          <button class="btn-save" @click="goToSavingsList">
            Kembali ke Tabungan
          </button>
          <button class="btn-cancel" @click="router.back()">Kembali</button>
        </div>
      </section>
    </template>

    <template v-else>
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="sum-card glass-card">
          <div class="sum-icon icon-members">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div class="sum-info">
            <span class="sum-val">{{ summary.length }}</span>
            <span class="sum-label">Anggota</span>
          </div>
        </div>

        <div class="sum-card glass-card">
          <div class="sum-icon icon-tx">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="9" y="2" width="6" height="4" rx="1" />
              <path
                d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
              />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="15" y2="16" />
            </svg>
          </div>
          <div class="sum-info">
            <span class="sum-val">{{ transactions.length }}</span>
            <span class="sum-label">Transaksi</span>
          </div>
        </div>

        <div class="sum-card glass-card">
          <div class="sum-icon icon-expense">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <path d="M19 12H5" />
              <path d="M18 6l4 6-4 6" />
            </svg>
          </div>
          <div class="sum-info">
            <span class="sum-val text-expense">Rp {{ formatCurrency(totalExpense) }}</span>
            <span class="sum-label">Pengeluaran</span>
          </div>
        </div>

        <div class="sum-card glass-card sum-card-balance">
          <div class="sum-icon icon-balance">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
          </div>
          <div class="sum-info">
            <span class="sum-val text-balance">{{ formatLedgerCurrency(totalBalance) }}</span>
            <span class="sum-label">Saldo Buku</span>
          </div>
        </div>
      </div>

      <!-- Mobile Segmented View Tabs (< 1024px) -->
      <div class="mobile-view-tabs mobile-only">
        <button
          v-if="book?.status === 'active'"
          type="button"
          class="mobile-tab-btn"
          :class="{ active: mobileView === 'form' }"
          @click="setMobileView('form')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Catat</span>
        </button>
        <button
          type="button"
          class="mobile-tab-btn"
          :class="{ active: mobileView === 'history' }"
          @click="setMobileView('history')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="2" width="6" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="15" y2="16" />
          </svg>
          <span>Riwayat</span>
          <span class="mobile-tab-count">{{ transactions.length }}</span>
        </button>
        <button
          type="button"
          class="mobile-tab-btn"
          :class="{ active: mobileView === 'members' }"
          @click="setMobileView('members')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Anggota</span>
          <span class="mobile-tab-count">{{ summary.length }}</span>
        </button>
      </div>

      <!-- Main Layout: 2 Kolom di Desktop (>= 1024px), Tampilan Dinamis di Mobile (< 1024px) -->
      <div
        class="detail-main-layout"
        :class="{ 'form-collapsed': isFormCollapsed || book?.status !== 'active' }"
      >
        <!-- Side Column: Form Catat Transaksi (only if active) -->
        <aside
          v-if="book?.status === 'active'"
          class="layout-side-col"
          :class="{ 'mobile-visible': mobileView === 'form' }"
        >
          <!-- Collapsed State on Desktop -->
          <div
            v-if="isFormCollapsed"
            class="collapsed-form-card glass-card desktop-only"
            @click="isFormCollapsed = false"
            title="Klik untuk membuka form pencatatan"
          >
            <div class="collapsed-content">
              <div class="collapsed-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span class="collapsed-label">Buka Form Catat</span>
            </div>
          </div>

          <!-- Active Form Card -->
          <div v-show="!isFormCollapsed" class="add-section glass-card sticky-card">
            <div class="side-col-header">
              <h2>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Catat Transaksi Baru</span>
              </h2>
              <button
                type="button"
                class="collapse-toggle-btn desktop-only"
                @click="isFormCollapsed = true"
                title="Sembunyikan Form untuk memperluas tabel"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>

            <!-- Segmented Type Tabs: Pemasukan / Pengeluaran -->
            <div class="transaction-type-tabs">
              <button
                type="button"
                class="type-tab income"
                :class="{ active: newTx.type === 'income' }"
                @click="setTransactionType('income')"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Pemasukan</span>
              </button>
              <button
                type="button"
                class="type-tab expense"
                :class="{ active: newTx.type === 'expense' }"
                @click="setTransactionType('expense')"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Pengeluaran</span>
              </button>
            </div>

            <div class="add-form side-form">
              <!-- Santri Select Mode -->
              <div
                v-if="newTx.type === 'income'"
                class="form-group"
                style="position: relative"
              >
                <div class="form-label-row">
                  <label class="form-label mb-0">Nama Anggota *</label>
                  <div class="santri-input-modes">
                    <button
                      class="mode-btn"
                      :class="{ active: inputMode === 'select' }"
                      @click="
                        inputMode = 'select';
                        resetSantriInput();
                      "
                      type="button"
                    >
                      Riwayat
                    </button>
                    <button
                      class="mode-btn"
                      :class="{ active: inputMode === 'search' }"
                      @click="
                        inputMode = 'search';
                        resetSantriInput();
                      "
                      type="button"
                    >
                      Input Baru
                    </button>
                  </div>
                </div>

                <select
                  v-if="inputMode === 'select'"
                  v-model="selectedExistingSantri"
                  class="mt-2 form-input"
                  @change="onSelectExisting"
                >
                  <option value="">-- Pilih Anggota --</option>
                  <option
                    v-for="s in summary"
                    :key="s.santriId"
                    :value="s.santriId"
                  >
                    {{ s.santriName }}
                  </option>
                </select>

                <div v-else class="mt-2" style="position: relative">
                  <input
                    v-model="newTx.santriName"
                    type="text"
                    class="form-input"
                    placeholder="Ketik nama anggota..."
                    @input="searchSantri"
                    @focus="showSuggestions = true"
                    autocomplete="off"
                  />
                  <div
                    v-if="showSuggestions && suggestions.length"
                    class="suggestions-dropdown"
                  >
                    <div
                      v-for="s in suggestions"
                      :key="s.id"
                      class="suggestion-item"
                      @mousedown.prevent="selectSantri(s)"
                    >
                      {{ s.name }}
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="form-group">
                <label class="form-label">Keterangan Pengeluaran *</label>
                <input
                  v-model="newTx.description"
                  type="text"
                  class="form-input"
                  placeholder="cth: Bisyarah guru, sampah, perlengkapan"
                />
              </div>

              <!-- Amount -->
              <div class="form-group">
                <label class="form-label">{{
                  newTx.type === "expense"
                    ? "Jumlah Pengeluaran (Rp) *"
                    : "Jumlah Pemasukan (Rp) *"
                }}</label>
                <input
                  v-model="newTx.amount"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  class="form-input"
                  placeholder="cth: 5000"
                />
              </div>

              <!-- Date -->
              <div class="form-group">
                <label class="form-label">Waktu Transaksi (Jam & Menit) *</label>
                <input
                  v-model="newTx.date"
                  type="datetime-local"
                  class="form-input"
                  :max="nowStr"
                />
              </div>

              <!-- Notes -->
              <div class="form-group form-group-notes">
                <label class="form-label">Catatan (Opsional)</label>
                <input
                  v-model="newTx.notes"
                  type="text"
                  class="form-input"
                  :placeholder="
                    newTx.type === 'expense'
                      ? 'cth: Dibayar tunai oleh bendahara'
                      : 'cth: Uang jajan hari ini'
                  "
                />
              </div>

              <button
                class="btn-add"
                :class="{ 'btn-expense': newTx.type === 'expense' }"
                @click="addTransaction"
                :disabled="submitting"
              >
                <svg v-if="!submitting" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line v-if="newTx.type === 'income'" x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>
                  {{
                    submitting
                      ? "Menyimpan..."
                      : newTx.type === "expense"
                        ? "Simpan Pengeluaran"
                        : "Simpan Pemasukan"
                  }}
                </span>
              </button>

              <!-- Mobile Quick Switch to History -->
              <div class="mobile-only quick-history-link" v-if="transactions.length > 0">
                <button type="button" class="btn-text-link" @click="setMobileView('history')">
                  Lihat riwayat transaksi ({{ transactions.length }}) &rarr;
                </button>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Column: Data Workspace (Riwayat & Ringkasan Anggota) -->
        <main
          class="layout-main-col"
          :class="{ 'mobile-visible': mobileView !== 'form' }"
        >
          <div v-if="book?.status !== 'active'" class="closed-notice glass-card">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              style="vertical-align: middle; margin-right: 6px"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Buku tabungan ini sudah ditutup. Tidak ada transaksi baru yang dapat ditambahkan.
          </div>

          <div class="data-workspace-card glass-card">
            <!-- Workspace Tabs Bar (Riwayat & Anggota) -->
            <div class="ws-tabs-bar">
              <div class="ws-tabs-left">
                <button
                  type="button"
                  class="ws-tab-btn"
                  :class="{ active: activeDataTab === 'history' }"
                  @click="setActiveDataTab('history')"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="2" width="6" height="4" rx="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <line x1="9" y1="12" x2="15" y2="12" />
                    <line x1="9" y1="16" x2="15" y2="16" />
                  </svg>
                  <span>Riwayat Transaksi</span>
                  <span class="tab-count-badge">{{ transactions.length }}</span>
                </button>

                <button
                  type="button"
                  class="ws-tab-btn"
                  :class="{ active: activeDataTab === 'members' }"
                  @click="setActiveDataTab('members')"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Ringkasan Anggota</span>
                  <span class="tab-count-badge">{{ summary.length }}</span>
                </button>
              </div>

              <!-- Quick uncollapse button on desktop if form is collapsed -->
              <div v-if="isFormCollapsed && book?.status === 'active'" class="ws-tabs-right desktop-only">
                <button class="uncollapse-btn" @click="isFormCollapsed = false">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Buka Form Catat</span>
                </button>
              </div>
            </div>

            <!-- Tab Panel 1: Riwayat Transaksi -->
            <div v-if="activeDataTab === 'history'" class="tab-panel">
              <div class="history-controls-row">
                <div class="tx-filter-chips">
                  <button
                    type="button"
                    class="filter-chip"
                    :class="{ active: txFilterType === 'all' }"
                    @click="txFilterType = 'all'"
                  >
                    Semua ({{ transactions.length }})
                  </button>
                  <button
                    type="button"
                    class="filter-chip income-chip"
                    :class="{ active: txFilterType === 'income' }"
                    @click="txFilterType = 'income'"
                  >
                    Pemasukan ({{ incomeTxCount }})
                  </button>
                  <button
                    type="button"
                    class="filter-chip expense-chip"
                    :class="{ active: txFilterType === 'expense' }"
                    @click="txFilterType = 'expense'"
                  >
                    Pengeluaran ({{ expenseTxCount }})
                  </button>
                </div>

                <div class="tx-search-wrap">
                  <svg
                    class="search-icon"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    v-model="searchTx"
                    type="text"
                    class="search-input"
                    placeholder="Cari transaksi..."
                  />
                  <button
                    v-if="searchTx"
                    type="button"
                    class="clear-search-btn"
                    @click="searchTx = ''"
                    title="Hapus pencarian"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <div v-if="filteredTx.length === 0" class="empty-text">
                <div class="empty-icon-wrap">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <p>{{ searchTx ? "Tidak ada transaksi yang cocok dengan pencarian" : "Belum ada riwayat transaksi" }}</p>
              </div>

              <div v-else class="tx-list scrollable-tx-list">
                <div
                  v-for="tx in filteredTx"
                  :key="tx.id"
                  class="tx-item"
                  :class="{ expense: isExpenseTransaction(tx) }"
                >
                  <div
                    class="tx-avatar"
                    :class="{ expense: isExpenseTransaction(tx) }"
                  >
                    {{ getTransactionInitial(tx) }}
                  </div>
                  <div class="tx-info">
                    <span class="tx-santri">{{ getTransactionTitle(tx) }}</span>
                    <span class="tx-notes">{{ getTransactionSubtitle(tx) }}</span>
                    <span class="tx-meta"
                      >{{ formatDateTime(tx.date) }} &middot; dicatat oleh
                      {{ tx.recordedByName }}</span
                    >
                  </div>

                  <div class="tx-right">
                    <span
                      class="tx-amount"
                      :class="{ expense: isExpenseTransaction(tx) }"
                    >
                      {{ formatTransactionAmount(tx) }}
                    </span>
                    <div class="tx-actions">
                      <button
                        class="icon-btn edit"
                        @click="openEditTx(tx)"
                        title="Edit"
                        v-if="book?.status === 'active'"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                          />
                        </svg>
                      </button>
                      <button
                        class="icon-btn delete"
                        @click="confirmDeleteTx(tx)"
                        title="Hapus"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab Panel 2: Ringkasan per Anggota -->
            <div v-else-if="activeDataTab === 'members'" class="tab-panel">
              <div class="members-controls-row">
                <div class="members-summary-badge">
                  Total Anggota: <strong>{{ summary.length }} orang</strong>
                </div>

                <div class="tx-search-wrap">
                  <svg
                    class="search-icon"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    v-model="searchMember"
                    type="text"
                    class="search-input"
                    placeholder="Cari nama anggota..."
                  />
                  <button
                    v-if="searchMember"
                    type="button"
                    class="clear-search-btn"
                    @click="searchMember = ''"
                    title="Hapus pencarian"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <div v-if="filteredSummary.length === 0" class="empty-text">
                <div class="empty-icon-wrap">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <p>{{ searchMember ? "Anggota tidak ditemukan" : "Belum ada data anggota" }}</p>
              </div>

              <div v-else class="santri-table-wrap scrollable-table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Nama Anggota</th>
                      <th>Transaksi</th>
                      <th>Total Tabungan</th>
                      <th>Terakhir Setor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in filteredSummary" :key="s.santriId">
                      <td>
                        <div class="member-name-cell">
                          <div class="member-avatar">
                            {{ s.santriName ? s.santriName.charAt(0).toUpperCase() : 'A' }}
                          </div>
                          <span class="santri-name">{{ s.santriName }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="tx-count-pill">{{ s.transactionCount }}x</span>
                      </td>
                      <td class="amount-cell">Rp {{ formatCurrency(s.balance) }}</td>
                      <td class="muted">{{ formatDateTime(s.lastTransaction) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </template>

    <!-- Edit Tx Modal -->
    <div v-if="editingTx" class="modal-overlay" @click.self="editingTx = null">
      <div class="modal glass-card">
        <div class="modal-header">
          <h3>Edit {{ isEditingExpense ? "Pengeluaran" : "Pemasukan" }}</h3>
          <button class="close-btn" @click="editingTx = null">&times;</button>
        </div>
        <div v-if="isEditingExpense" class="form-group">
          <label class="form-label">Keterangan Pengeluaran</label>
          <input
            v-model="editForm.description"
            type="text"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label class="form-label">{{
            isEditingExpense
              ? "Jumlah Pengeluaran (Rp)"
              : "Jumlah Pemasukan (Rp)"
          }}</label>
          <input
            v-model="editForm.amount"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Waktu Transaksi</label>
          <input
            v-model="editForm.date"
            type="datetime-local"
            class="form-input"
            :max="nowStr"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Catatan</label>
          <input v-model="editForm.notes" type="text" class="form-input" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="editingTx = null">Batal</button>
          <button class="btn-save" @click="saveEditTx" :disabled="saving">
            {{ saving ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Tx Confirm -->
    <div
      v-if="deletingTx"
      class="modal-overlay"
      @click.self="deletingTx = null"
    >
      <div class="modal glass-card confirm-modal">
        <div class="confirm-icon danger-icon">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>
        <h3>Hapus Transaksi?</h3>
        <p>
          <strong>{{ getTransactionTitle(deletingTx) }}</strong> sebesar
          <strong>{{
            formatLedgerCurrency(Math.abs(getTxAmount(deletingTx)))
          }}</strong>
          akan dihapus.
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="deletingTx = null">Batal</button>
          <button class="btn-delete" @click="deleteTx" :disabled="saving">
            {{ saving ? "Menghapus..." : "Ya, Hapus" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Book Edit Modal -->
    <div
      v-if="showBookEditModal"
      class="modal-overlay"
      @click.self="showBookEditModal = false"
    >
      <div class="modal glass-card">
        <div class="modal-header">
          <h3>Edit Buku</h3>
          <button class="close-btn" @click="showBookEditModal = false">
            &times;
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">Judul *</label>
          <input
            v-model="bookEditForm.title"
            type="text"
            class="form-input"
            maxlength="100"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Deskripsi</label>
          <textarea
            v-model="bookEditForm.description"
            class="form-input"
            rows="2"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showBookEditModal = false">
            Batal
          </button>
          <button class="btn-save" @click="saveBookEdit" :disabled="saving">
            {{ saving ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Book Close Confirm -->
    <div
      v-if="showBookCloseModal"
      class="modal-overlay"
      @click.self="showBookCloseModal = false"
    >
      <div class="modal glass-card confirm-modal">
        <div class="confirm-icon warning-icon">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3>Tutup Buku?</h3>
        <p>
          Buku "<strong>{{ book?.title }}</strong
          >" akan ditutup. Tidak ada transaksi baru yang bisa ditambahkan, namun
          riwayat tetap tersimpan.
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showBookCloseModal = false">
            Batal
          </button>
          <button
            class="btn-close-book"
            @click="closeThisBook"
            :disabled="saving"
          >
            {{ saving ? "Menutup..." : "Ya,Tutup" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Book Delete Confirm -->
    <div
      v-if="showBookDeleteModal"
      class="modal-overlay"
      @click.self="showBookDeleteModal = false"
    >
      <div class="modal glass-card confirm-modal">
        <div class="confirm-icon danger-icon">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>
        <h3>Hapus Buku?</h3>
        <p>
          Buku "<strong>{{ book?.title }}</strong
          >" akan dihapus permanen. Hanya buku tanpa transaksi yang bisa
          dihapus.
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showBookDeleteModal = false">
            Batal
          </button>
          <button class="btn-delete" @click="deleteThisBook" :disabled="saving">
            {{ saving ? "Menghapus..." : "Ya, Hapus" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Print Period Modal -->
    <div
      v-if="showPrintModal"
      class="modal-overlay"
      @click.self="showPrintModal = false"
    >
      <div class="modal glass-card print-modal">
        <div class="modal-header">
          <h3>Cetak Pembukuan</h3>
          <button class="close-btn" @click="showPrintModal = false">
            &times;
          </button>
        </div>

        <div class="form-group">
          <label class="form-label">Periode Laporan</label>
          <div class="print-option-grid">
            <button
              type="button"
              class="print-option"
              :class="{ active: printForm.mode === 'month' }"
              @click="printForm.mode = 'month'"
            >
              Per Bulan
            </button>
            <button
              type="button"
              class="print-option"
              :class="{ active: printForm.mode === 'range' }"
              @click="printForm.mode = 'range'"
            >
              Rentang
            </button>
            <button
              type="button"
              class="print-option"
              :class="{ active: printForm.mode === 'all' }"
              @click="printForm.mode = 'all'"
            >
              Semua
            </button>
          </div>
        </div>

        <div v-if="printForm.mode === 'month'" class="form-group">
          <label class="form-label">Bulan</label>
          <input v-model="printForm.month" type="month" class="form-input" />
        </div>

        <div v-else-if="printForm.mode === 'range'" class="print-range-grid">
          <div class="form-group">
            <label class="form-label">Dari Tanggal</label>
            <input
              v-model="printForm.startDate"
              type="date"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Sampai Tanggal</label>
            <input v-model="printForm.endDate" type="date" class="form-input" />
          </div>
        </div>

        <p v-if="!printRange.isValid" class="print-warning">
          Lengkapi periode laporan dengan tanggal yang benar.
        </p>

        <div class="print-summary-box">
          <div>
            <span>Periode</span>
            <strong>{{ printRange.label }}</strong>
          </div>
          <div>
            <span>Saldo Awal</span>
            <strong>{{ formatLedgerCurrency(printOpeningBalance) }}</strong>
          </div>
          <div>
            <span>Transaksi</span>
            <strong>{{ selectedPrintTransactions.length }} data</strong>
          </div>
          <div>
            <span>Saldo Akhir</span>
            <strong>{{ formatLedgerCurrency(printEndingBalance) }}</strong>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showPrintModal = false">
            Batal
          </button>
          <button
            class="btn-save"
            @click="printLedger"
            :disabled="!canPrintLedger || generatingPdf"
          >
            {{ generatingPdf ? "Membuat PDF..." : "Unduh PDF" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";
import { useAuthStore } from "@/stores/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const route = useRoute();
const router = useRouter();
const { success, error: showError } = useToast();
const authStore = useAuthStore();
const bookId = route.params.bookId;

const book = ref(null);
const bookAccessError = ref(null);
const summary = ref([]);
const transactions = ref([]);
const loading = ref(true);
const submitting = ref(false);
const saving = ref(false);
const searchTx = ref("");
const suggestions = ref([]);
const showSuggestions = ref(false);
const editingTx = ref(null);
const deletingTx = ref(null);
const editForm = ref({
  amount: 0,
  date: "",
  notes: "",
  description: "",
  type: "income",
});

// Book management state
const showBookMenu = ref(false);
const showBookEditModal = ref(false);
const showBookCloseModal = ref(false);
const showBookDeleteModal = ref(false);
const bookEditForm = ref({ title: "", description: "" });
const showPrintModal = ref(false);
const printGeneratedAt = ref(new Date());
const generatingPdf = ref(false);

const canManageBook = computed(() => {
  if (!book.value) return false;
  return authStore.isAdmin || book.value.createdBy === authStore.user?.id;
});

const getNowStr = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const nowStr = ref(getNowStr());
const inputMode = ref("select"); // 'select' or 'search'
const selectedExistingSantri = ref("");

// Workspace Tabs & Layout state
const activeDataTab = ref("history"); // 'history' | 'members'
const mobileView = ref("history"); // 'form' | 'history' | 'members'
const isFormCollapsed = ref(false);
const txFilterType = ref("all"); // 'all' | 'income' | 'expense'
const searchMember = ref("");

const setMobileView = (tab) => {
  mobileView.value = tab;
  if (tab === "history" || tab === "members") {
    activeDataTab.value = tab;
  }
};

const setActiveDataTab = (tab) => {
  activeDataTab.value = tab;
  mobileView.value = tab;
};

const filteredSummary = computed(() => {
  if (!searchMember.value.trim()) return summary.value;
  const q = searchMember.value.toLowerCase();
  return summary.value.filter((s) =>
    (s.santriName || "").toLowerCase().includes(q),
  );
});

const newTx = ref({
  type: "income",
  santriId: "",
  santriName: "",
  description: "",
  amount: "",
  date: nowStr.value,
  notes: "",
});
const getMonthInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};
const getDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const printForm = ref({
  mode: "month",
  month: getMonthInputValue(),
  startDate: getDateInputValue(new Date()),
  endDate: getDateInputValue(new Date()),
});

const transactionAmountTotal = (predicate) => {
  return transactions.value.reduce((total, tx) => {
    const amount = getTxAmount(tx);
    return predicate(amount) ? total + Math.abs(amount) : total;
  }, 0);
};
const totalIncome = computed(
  () =>
    book.value?.totalIncome ?? transactionAmountTotal((amount) => amount > 0),
);
const totalExpense = computed(
  () =>
    book.value?.totalExpense ?? transactionAmountTotal((amount) => amount < 0),
);
const totalBalance = computed(
  () => book.value?.totalBalance ?? totalIncome.value - totalExpense.value,
);

const formatCurrency = (n) => (n || 0).toLocaleString("id-ID");
const formatDate = (d) => {
  if (!d) return "-";
  const dt = d?.seconds ? new Date(d.seconds * 1000) : new Date(d);
  return isNaN(dt)
    ? "-"
    : dt.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};
const formatDateTime = (d) => {
  if (!d) return "-";
  const dt = d?.seconds ? new Date(d.seconds * 1000) : new Date(d);
  return isNaN(dt)
    ? "-"
    : dt.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};
const formatDateShort = (d) => {
  const dt = parseDateValue(d);
  return !dt
    ? "-"
    : dt.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};
const formatMonthYear = (d) => {
  const dt = parseDateValue(d);
  return !dt
    ? "-"
    : dt.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};
const formatLedgerCurrency = (n) => {
  const amount = Math.round(Number(n) || 0);
  return `${amount < 0 ? "-Rp " : "Rp "}${formatCurrency(Math.abs(amount))}`;
};

const parseDateValue = (value) => {
  if (!value) return null;
  const dt = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  return isNaN(dt) ? null : dt;
};

const getTxDate = (tx) => parseDateValue(tx.date || tx.createdAt);
const getTxAmount = (tx) => {
  const raw = Math.round(Number(tx.amount) || 0);
  if (tx.type === "expense" || tx.type === "withdrawal") return -Math.abs(raw);
  return raw;
};
const isExpenseTransaction = (tx) => getTxAmount(tx) < 0;

const incomeTxCount = computed(
  () => transactions.value.filter((t) => !isExpenseTransaction(t)).length,
);
const expenseTxCount = computed(
  () => transactions.value.filter((t) => isExpenseTransaction(t)).length,
);

const filteredTx = computed(() => {
  let list = transactions.value;
  if (txFilterType.value === "income") {
    list = list.filter((t) => !isExpenseTransaction(t));
  } else if (txFilterType.value === "expense") {
    list = list.filter((t) => isExpenseTransaction(t));
  }
  if (!searchTx.value.trim()) return list;
  const q = searchTx.value.toLowerCase();
  return list.filter((t) => {
    return [t.santriName, t.description, t.notes, t.recordedByName]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(q));
  });
});
const getTransactionTitle = (tx) => {
  if (!tx) return "-";
  if (isExpenseTransaction(tx))
    return tx.description || tx.santriName || "Pengeluaran";
  return tx.santriName || tx.description || "Pemasukan";
};
const getTransactionSubtitle = (tx) => {
  if (!tx) return "-";
  if (tx.notes?.trim()) return tx.notes.trim();
  return isExpenseTransaction(tx) ? "Pengeluaran kas" : "Pemasukan kas";
};
const getTransactionInitial = (tx) => {
  if (isExpenseTransaction(tx)) return "-";
  return getTransactionTitle(tx)?.charAt(0)?.toUpperCase() || "+";
};
const formatTransactionAmount = (tx) => {
  const amount = getTxAmount(tx);
  const prefix = amount < 0 ? "-Rp " : "+Rp ";
  return `${prefix}${formatCurrency(Math.abs(amount))}`;
};
const buildTxDescription = (tx) => {
  const title = getTransactionTitle(tx);
  if (isExpenseTransaction(tx)) {
    return tx.notes?.trim() ? `${title} - ${tx.notes.trim()}` : title;
  }
  return tx.notes?.trim()
    ? `${tx.notes.trim()} - ${title}`
    : `Pemasukan - ${title}`;
};
const isEditingExpense = computed(() =>
  editingTx.value ? isExpenseTransaction(editingTx.value) : false,
);

const printRange = computed(() => {
  const mode = printForm.value.mode;
  if (mode === "all") {
    return { start: null, end: null, label: "Semua Transaksi", isValid: true };
  }

  if (mode === "month") {
    const [year, month] = String(printForm.value.month || "")
      .split("-")
      .map(Number);
    if (!year || !month)
      return { start: null, end: null, label: "-", isValid: false };

    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end, label: formatMonthYear(start), isValid: true };
  }

  const start = printForm.value.startDate
    ? new Date(`${printForm.value.startDate}T00:00:00`)
    : null;
  const end = printForm.value.endDate
    ? new Date(`${printForm.value.endDate}T23:59:59.999`)
    : null;
  if (!start || !end || isNaN(start) || isNaN(end) || start > end) {
    return { start, end, label: "-", isValid: false };
  }

  return {
    start,
    end,
    label: `${formatDateShort(start)} - ${formatDateShort(end)}`,
    isValid: true,
  };
});

const chronologicalTransactions = computed(() => {
  return transactions.value
    .map((tx) => ({
      ...tx,
      _printDate: getTxDate(tx),
      _printAmount: getTxAmount(tx),
    }))
    .filter((tx) => tx._printDate)
    .sort((a, b) => a._printDate - b._printDate);
});

const selectedPrintTransactions = computed(() => {
  const range = printRange.value;
  if (!range.isValid) return [];

  return chronologicalTransactions.value.filter((tx) => {
    if (range.start && tx._printDate < range.start) return false;
    if (range.end && tx._printDate > range.end) return false;
    return true;
  });
});

const printOpeningBalance = computed(() => {
  const range = printRange.value;
  if (!range.isValid || !range.start) return 0;

  return chronologicalTransactions.value.reduce((total, tx) => {
    return tx._printDate < range.start ? total + tx._printAmount : total;
  }, 0);
});

const printLedgerRows = computed(() => {
  let balance = printOpeningBalance.value;
  let lastMonthKey = "";

  return selectedPrintTransactions.value.map((tx) => {
    const amount = tx._printAmount;
    const monthKey = getMonthInputValue(tx._printDate);
    const showMonth = monthKey !== lastMonthKey;
    lastMonthKey = monthKey;
    balance += amount;

    return {
      id: tx.id,
      dateLabel: formatDateShort(tx._printDate),
      monthLabel: formatMonthYear(tx._printDate),
      showMonth,
      description: buildTxDescription(tx),
      recordedByName: tx.recordedByName,
      debit: amount > 0 ? amount : 0,
      credit: amount < 0 ? Math.abs(amount) : 0,
      balance,
    };
  });
});

const printTotalDebit = computed(() => {
  return selectedPrintTransactions.value.reduce((total, tx) => {
    return tx._printAmount > 0 ? total + tx._printAmount : total;
  }, 0);
});
const printTotalCredit = computed(() => {
  return selectedPrintTransactions.value.reduce((total, tx) => {
    return tx._printAmount < 0 ? total + Math.abs(tx._printAmount) : total;
  }, 0);
});
const printEndingBalance = computed(
  () =>
    printOpeningBalance.value + printTotalDebit.value - printTotalCredit.value,
);
const printMonthSummaries = computed(() => {
  let runningBalance = printOpeningBalance.value;
  const summaries = new Map();

  selectedPrintTransactions.value.forEach((tx) => {
    const key = getMonthInputValue(tx._printDate);
    if (!summaries.has(key)) {
      summaries.set(key, {
        key,
        label: formatMonthYear(tx._printDate),
        debit: 0,
        credit: 0,
        closingBalance: runningBalance,
      });
    }

    const item = summaries.get(key);
    if (tx._printAmount >= 0) item.debit += tx._printAmount;
    else item.credit += Math.abs(tx._printAmount);
    runningBalance += tx._printAmount;
    item.closingBalance = runningBalance;
  });

  return Array.from(summaries.values());
});
const canPrintLedger = computed(() =>
  Boolean(book.value && printRange.value.isValid),
);
const printDocumentNumber = computed(() => {
  const idPart = String(bookId || "BUKU")
    .slice(0, 6)
    .toUpperCase();
  const datePart = getDateInputValue(printGeneratedAt.value).replace(/-/g, "");
  return `PBK-${idPart}-${datePart}`;
});

const buildBookAccessError = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data || {};

  if (status === 403) {
    return {
      title: "Buku ini sudah tidak tersedia untuk Anda",
      message:
        "Buku yang Anda buka kemungkinan sudah dijadikan pribadi oleh pemiliknya. Isi buku tidak ditampilkan agar data tetap aman.",
      ownerName: data.ownerName || null,
    };
  }

  if (status === 404) {
    return {
      title: "Buku tabungan tidak ditemukan",
      message:
        "Link buku ini tidak valid, buku sudah dihapus, atau Anda membuka tautan lama.",
      ownerName: null,
    };
  }

  return {
    title: "Gagal memuat buku tabungan",
    message:
      data.error ||
      "Terjadi kendala saat memuat buku ini. Silakan kembali ke daftar tabungan dan coba lagi.",
    ownerName: null,
  };
};

const fetchAll = async () => {
  loading.value = true;
  bookAccessError.value = null;
  try {
    const bookRes = await api.get(`/savings/books/${bookId}`);
    book.value = bookRes.data;

    const [txRes, sumRes] = await Promise.all([
      api.get(`/savings/books/${bookId}/transactions`),
      api.get(`/savings/books/${bookId}/summary`),
    ]);
    transactions.value = txRes.data;
    summary.value = sumRes.data;

    // Default to search if no summary
    if (summary.value.length === 0) {
      inputMode.value = "search";
    }
  } catch (e) {
    book.value = null;
    transactions.value = [];
    summary.value = [];
    bookAccessError.value = buildBookAccessError(e);

    if (![403, 404].includes(e?.response?.status)) {
      showError(e.response?.data?.error || "Gagal memuat data buku tabungan");
    }
  } finally {
    loading.value = false;
  }
};

const goToSavingsList = () => {
  router.push(
    authStore.isAdmin ? "/dashboard/admin-savings" : "/dashboard/savings",
  );
};

const sanitizeAmount = (e) => {
  // Hapus karakter bukan digit, lalu parse integer
  const raw = String(e.target.value).replace(/[^0-9]/g, "");
  newTx.value.amount = raw ? parseInt(raw, 10) : "";
};

const setTransactionType = (type) => {
  if (newTx.value.type === type) return;
  newTx.value.type = type;
  resetSantriInput();
  newTx.value.description = "";
  suggestions.value = [];
  showSuggestions.value = false;
  inputMode.value =
    type === "income" && summary.value.length > 0 ? "select" : "search";
};

const resetSantriInput = () => {
  selectedExistingSantri.value = "";
  newTx.value.santriId = "";
  newTx.value.santriName = "";
};

const onSelectExisting = () => {
  const selectedId = selectedExistingSantri.value;
  if (!selectedId) {
    newTx.value.santriId = "";
    newTx.value.santriName = "";
    return;
  }
  const s = summary.value.find((x) => x.santriId === selectedId);
  if (s) {
    newTx.value.santriId = s.santriId;
    newTx.value.santriName = s.santriName;
  }
};

let searchTimer = null;
const searchSantri = () => {
  clearTimeout(searchTimer);
  newTx.value.santriId = "";
  if (!newTx.value.santriName.trim() || newTx.value.santriName.length < 2) {
    suggestions.value = [];
    return;
  }
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await api.get("/santri/search", {
        params: { q: newTx.value.santriName },
      });
      suggestions.value = data.slice(0, 6);
    } catch {
      suggestions.value = [];
    }
  }, 300);
};

const selectSantri = (s) => {
  newTx.value.santriId = s.id;
  newTx.value.santriName = s.name;
  suggestions.value = [];
  showSuggestions.value = false;
};

const addTransaction = async () => {
  const isExpense = newTx.value.type === "expense";
  if (!isExpense && !newTx.value.santriName.trim()) {
    showError("Nama anggota wajib diisi");
    return;
  }
  if (!isExpense && !newTx.value.santriId) {
    // Allow manual name entry - generate temp id from name
    newTx.value.santriId =
      "manual_" + newTx.value.santriName.toLowerCase().replace(/\s+/g, "_");
  }
  if (isExpense && !newTx.value.description.trim()) {
    showError("Keterangan pengeluaran wajib diisi");
    return;
  }
  if (
    !newTx.value.amount ||
    parseInt(String(newTx.value.amount).replace(/[^0-9]/g, ""), 10) <= 0
  ) {
    showError(
      isExpense
        ? "Jumlah pengeluaran harus lebih dari 0"
        : "Jumlah pemasukan harus lebih dari 0",
    );
    return;
  }
  submitting.value = true;
  try {
    // Generate ISO string from local datetime
    let finalDate;
    if (newTx.value.date) {
      finalDate = new Date(newTx.value.date).toISOString();
    } else {
      finalDate = new Date().toISOString();
    }

    await api.post(`/savings/books/${bookId}/transactions`, {
      type: newTx.value.type,
      santriId: isExpense ? null : newTx.value.santriId,
      santriName: isExpense
        ? newTx.value.description.trim()
        : newTx.value.santriName.trim(),
      description: isExpense ? newTx.value.description.trim() : "",
      amount: Math.round(
        Number(String(newTx.value.amount).replace(/[^0-9]/g, "")),
      ),
      notes: newTx.value.notes,
      date: finalDate,
    });
    success(
      isExpense ? "Pengeluaran berhasil dicatat" : "Pemasukan berhasil dicatat",
    );

    resetSantriInput();
    newTx.value.description = "";
    newTx.value.amount = "";
    newTx.value.notes = "";
    nowStr.value = getNowStr();
    newTx.value.date = nowStr.value;

    await fetchAll();
  } catch (e) {
    showError(e.response?.data?.error || "Gagal mencatat transaksi");
  } finally {
    submitting.value = false;
  }
};

const openEditTx = (tx) => {
  editingTx.value = tx;
  const d = tx.date?.seconds
    ? new Date(tx.date.seconds * 1000)
    : new Date(tx.date);

  editForm.value = {
    amount: Math.abs(getTxAmount(tx)),
    date: isNaN(d)
      ? getNowStr()
      : new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16),
    notes: tx.notes || "",
    description: tx.description || tx.santriName || "",
    type: isExpenseTransaction(tx) ? "expense" : "income",
  };
};

const saveEditTx = async () => {
  const isExpense = editForm.value.type === "expense";
  if (isExpense && !editForm.value.description.trim()) {
    showError("Keterangan pengeluaran wajib diisi");
    return;
  }
  if (
    !editForm.value.amount ||
    parseInt(String(editForm.value.amount), 10) <= 0
  ) {
    showError(
      isExpense
        ? "Jumlah pengeluaran harus lebih dari 0"
        : "Jumlah pemasukan harus lebih dari 0",
    );
    return;
  }
  saving.value = true;
  try {
    let finalDate = editForm.value.date
      ? new Date(editForm.value.date).toISOString()
      : new Date().toISOString();
    await api.put(`/savings/transactions/${editingTx.value.id}`, {
      type: editForm.value.type,
      amount: Math.round(
        Number(String(editForm.value.amount).replace(/[^0-9]/g, "")),
      ),
      date: finalDate,
      notes: editForm.value.notes,
      description: isExpense ? editForm.value.description.trim() : "",
    });
    success("Transaksi berhasil diperbarui");
    editingTx.value = null;
    await fetchAll();
  } catch (e) {
    showError(e.response?.data?.error || "Gagal memperbarui transaksi");
  } finally {
    saving.value = false;
  }
};

const confirmDeleteTx = (tx) => {
  deletingTx.value = tx;
};

const deleteTx = async () => {
  saving.value = true;
  try {
    await api.delete(`/savings/transactions/${deletingTx.value.id}`);
    success("Transaksi berhasil dihapus");
    deletingTx.value = null;
    await fetchAll();
  } catch (e) {
    showError(e.response?.data?.error || "Gagal menghapus transaksi");
  } finally {
    saving.value = false;
  }
};

// Book management functions
const toggleBookPublish = async () => {
  const newState = !book.value.isPublished;
  try {
    await api.put(`/savings/books/${bookId}`, { isPublished: newState });
    book.value = { ...book.value, isPublished: newState };
    success(
      newState
        ? "Buku berhasil dipublish ke semua guru"
        : "Buku dijadikan pribadi",
    );
  } catch (e) {
    showError(e.response?.data?.error || "Gagal mengubah status publish");
  }
};

const openBookEdit = () => {
  bookEditForm.value = {
    title: book.value.title,
    description: book.value.description || "",
  };
  showBookEditModal.value = true;
};

const saveBookEdit = async () => {
  if (!bookEditForm.value.title.trim()) {
    showError("Judul buku wajib diisi");
    return;
  }
  saving.value = true;
  try {
    await api.put(`/savings/books/${bookId}`, bookEditForm.value);
    book.value = {
      ...book.value,
      title: bookEditForm.value.title,
      description: bookEditForm.value.description,
    };
    showBookEditModal.value = false;
    success("Buku berhasil diperbarui");
  } catch (e) {
    showError(e.response?.data?.error || "Gagal memperbarui buku");
  } finally {
    saving.value = false;
  }
};

const confirmBookClose = () => {
  showBookCloseModal.value = true;
};

const closeThisBook = async () => {
  saving.value = true;
  try {
    await api.put(`/savings/books/${bookId}`, { status: "closed" });
    book.value = { ...book.value, status: "closed" };
    showBookCloseModal.value = false;
    success("Buku berhasil ditutup");
  } catch (e) {
    showError(e.response?.data?.error || "Gagal menutup buku");
  } finally {
    saving.value = false;
  }
};

const reopenThisBook = async () => {
  try {
    await api.put(`/savings/books/${bookId}`, { status: "active" });
    book.value = { ...book.value, status: "active" };
    success("Buku berhasil dibuka kembali");
  } catch (e) {
    showError(e.response?.data?.error || "Gagal membuka buku");
  }
};

const confirmBookDelete = () => {
  showBookDeleteModal.value = true;
};

const deleteThisBook = async () => {
  saving.value = true;
  try {
    await api.delete(`/savings/books/${bookId}`);
    success("Buku berhasil dihapus");
    router.push(
      authStore.isAdmin ? "/dashboard/admin-savings" : "/dashboard/savings",
    );
  } catch (e) {
    showError(e.response?.data?.error || "Gagal menghapus buku");
  } finally {
    saving.value = false;
  }
};

const openPrintModal = () => {
  if (!printForm.value.month) printForm.value.month = getMonthInputValue();
  if (!printForm.value.startDate)
    printForm.value.startDate = getDateInputValue();
  if (!printForm.value.endDate) printForm.value.endDate = getDateInputValue();
  printGeneratedAt.value = new Date();
  showPrintModal.value = true;
};

const sanitizeFilenamePart = (value, fallback = "laporan") => {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
};

const ensurePdfSpace = (doc, currentY, neededHeight = 42) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededHeight <= pageHeight - 16) return currentY;
  doc.addPage();
  return 18;
};

const addPdfPageNumbers = (doc) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Halaman ${page}/${pageCount}`, pageWidth - 14, pageHeight - 8, {
      align: "right",
    });
  }
};

const printLedger = () => {
  if (!canPrintLedger.value) {
    showError("Periode laporan belum valid");
    return;
  }
  if (generatingPdf.value) return;

  generatingPdf.value = true;
  try {
    printGeneratedAt.value = new Date();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const printedBy =
      authStore.user?.displayName || authStore.user?.name || "-";

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text("LAPORAN PEMBUKUAN", pageWidth / 2, 18, { align: "center" });

    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.text("TPQ AMANAH", pageWidth / 2, 26, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Dicetak pada: ${formatDateTime(printGeneratedAt.value)}`,
      pageWidth / 2,
      33,
      { align: "center" },
    );

    doc.setDrawColor(15, 61, 28);
    doc.setLineWidth(0.5);
    doc.line(marginX, 39, pageWidth - marginX, 39);

    autoTable(doc, {
      startY: 44,
      body: [
        [
          "Nama Buku",
          book.value?.title || "-",
          "Periode",
          printRange.value.label,
        ],
        [
          "Dibuat Oleh",
          book.value?.createdByName || "-",
          "Dicetak Oleh",
          printedBy,
        ],
        [
          "No. Dokumen",
          printDocumentNumber.value,
          "Status Buku",
          book.value?.status === "closed" ? "Ditutup" : "Aktif",
        ],
      ],
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2.5,
        lineColor: [209, 213, 219],
        lineWidth: 0.2,
        textColor: [17, 24, 39],
      },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: "bold", fillColor: [249, 250, 251] },
        1: { cellWidth: 64 },
        2: { cellWidth: 28, fontStyle: "bold", fillColor: [249, 250, 251] },
        3: { cellWidth: 62 },
      },
    });

    const ledgerBody = [
      [
        "-",
        "Saldo awal periode",
        "-",
        "-",
        formatLedgerCurrency(printOpeningBalance.value),
      ],
    ];

    if (printLedgerRows.value.length === 0) {
      ledgerBody.push([
        {
          content: "Tidak ada transaksi pada periode ini.",
          colSpan: 5,
          styles: {
            halign: "center",
            fontStyle: "italic",
            textColor: [107, 114, 128],
            minCellHeight: 12,
          },
        },
      ]);
    } else {
      printLedgerRows.value.forEach((row) => {
        if (row.showMonth) {
          ledgerBody.push([
            {
              content: row.monthLabel.toUpperCase(),
              colSpan: 5,
              styles: {
                fillColor: [243, 244, 246],
                textColor: [15, 61, 28],
                fontStyle: "bold",
                halign: "center",
                valign: "middle",
              },
            },
          ]);
        }

        ledgerBody.push([
          row.dateLabel,
          `${row.description}${row.recordedByName ? `\nDicatat oleh ${row.recordedByName}` : ""}`,
          row.debit ? formatLedgerCurrency(row.debit) : "-",
          row.credit ? formatLedgerCurrency(row.credit) : "-",
          formatLedgerCurrency(row.balance),
        ]);
      });
    }

    ledgerBody.push([
      {
        content: "Total Periode",
        colSpan: 2,
        styles: { fontStyle: "bold", fillColor: [249, 250, 251] },
      },
      {
        content: formatLedgerCurrency(printTotalDebit.value),
        styles: {
          fontStyle: "bold",
          fillColor: [249, 250, 251],
          halign: "right",
        },
      },
      {
        content: formatLedgerCurrency(printTotalCredit.value),
        styles: {
          fontStyle: "bold",
          fillColor: [249, 250, 251],
          halign: "right",
        },
      },
      {
        content: formatLedgerCurrency(printEndingBalance.value),
        styles: {
          fontStyle: "bold",
          fillColor: [249, 250, 251],
          halign: "right",
        },
      },
    ]);

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 68) + 6,
      head: [["Tanggal", "Keterangan", "Debet", "Kredit", "Saldo"]],
      body: ledgerBody,
      theme: "grid",
      headStyles: {
        fillColor: [27, 94, 32],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.2,
        lineColor: [156, 163, 175],
        lineWidth: 0.18,
        valign: "middle",
        textColor: [17, 24, 39],
      },
      columnStyles: {
        0: { cellWidth: 21, halign: "center" },
        1: { cellWidth: 65 },
        2: { cellWidth: 32, halign: "right" },
        3: { cellWidth: 32, halign: "right" },
        4: { cellWidth: 32, halign: "right" },
      },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      didParseCell: (data) => {
        if (data.section === "head") {
          data.cell.styles.halign = data.column.index > 1 ? "right" : "center";
        }
      },
    });

    let nextY = (doc.lastAutoTable?.finalY || 120) + 9;

    if (printMonthSummaries.value.length > 1) {
      nextY = ensurePdfSpace(doc, nextY, 44);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("Rekap Per Bulan", marginX, nextY);

      autoTable(doc, {
        startY: nextY + 4,
        head: [["Bulan", "Debet", "Kredit", "Saldo Akhir"]],
        body: printMonthSummaries.value.map((month) => [
          month.label,
          formatLedgerCurrency(month.debit),
          formatLedgerCurrency(month.credit),
          formatLedgerCurrency(month.closingBalance),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [27, 94, 32],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 2.2,
          lineColor: [156, 163, 175],
          lineWidth: 0.18,
        },
        columnStyles: {
          0: { cellWidth: 62, halign: "left" },
          1: { cellWidth: 40, halign: "right" },
          2: { cellWidth: 40, halign: "right" },
          3: { cellWidth: 40, halign: "right" },
        },
        didParseCell: (data) => {
          if (data.section === "head") {
            data.cell.styles.halign =
              data.column.index === 0 ? "left" : "right";
          }
        },
      });

      nextY = (doc.lastAutoTable?.finalY || nextY + 30) + 14;
    }

    // saya sengaja matikan , jangan di hidupkan dan jangan di hapus ya
    // nextY = ensurePdfSpace(doc, nextY, 54);
    // doc.setFontSize(10);
    // doc.setFont("helvetica", "normal");
    // doc.setTextColor(17, 24, 39);
    // doc.text("Mengetahui,", 52, nextY, { align: "center" });
    // doc.text("Admin / Bendahara", 52, nextY + 6, { align: "center" });
    // doc.text("Dicetak oleh,", 156, nextY, { align: "center" });
    // doc.text(printedBy, 156, nextY + 6, { align: "center" });
    // doc.line(30, nextY + 38, 74, nextY + 38);
    // doc.line(134, nextY + 38, 178, nextY + 38);

    addPdfPageNumbers(doc);

    const filename = `pembukuan-${sanitizeFilenamePart(book.value?.title, "buku")}-${sanitizeFilenamePart(printRange.value.label, "periode")}.pdf`;
    doc.save(filename);
    showPrintModal.value = false;
    success(`Berhasil mengunduh ${filename}`);
  } catch (error) {
    console.error("Generate savings ledger PDF error:", error);
    showError("Gagal membuat PDF pembukuan");
  } finally {
    generatingPdf.value = false;
  }
};

const closeBookMenu = () => {
  showBookMenu.value = false;
};

onMounted(() => {
  fetchAll();
  document.addEventListener("click", closeBookMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeBookMenu);
});
</script>

<style scoped>
.savings-detail {
  padding-top: 60px;
}

@media (min-width: 1024px) {
  .savings-detail {
    padding-top: 0;
  }
}

.page-header {
  margin-bottom: var(--space-xl);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-md);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--primary);
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: var(--space-md);
  padding: 6px 14px;
  border-radius: var(--radius-md);
  background: rgba(27, 94, 32, 0.06);
  border: 1px solid rgba(27, 94, 32, 0.12);
  transition: all 0.2s ease;
  cursor: pointer;
}

.back-btn:hover {
  background: rgba(27, 94, 32, 0.12);
  transform: translateX(-2px);
}

.header-main-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  width: 100%;
  flex-wrap: wrap;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.title-row h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin: 0;
  line-height: 1.25;
}

.header-info p {
  color: var(--gray-600);
  margin-top: 4px;
  font-size: 0.92rem;
  line-height: 1.45;
}

.book-meta {
  color: var(--gray-500) !important;
  font-size: 0.8rem !important;
  margin-top: 4px;
}

.book-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.book-badge.active {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}

.book-badge.closed {
  background: rgba(158, 158, 158, 0.15);
  color: var(--gray-500);
}

.badge-shared {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: rgba(33, 150, 243, 0.12);
  color: #1565c0;
  white-space: nowrap;
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.print-trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  min-height: 40px;
  padding: 0 var(--space-lg);
  border-radius: var(--radius-lg);
  background: var(--primary-gradient);
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(27, 94, 32, 0.25);
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.print-trigger-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(27, 94, 32, 0.35);
}

.book-action-wrap {
  position: relative;
  flex-shrink: 0;
}

.book-action-dots {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  transition: all 0.2s;
  background: var(--gray-50);
  border: 1.5px solid var(--gray-200);
  cursor: pointer;
}

.book-action-dots:hover {
  background: var(--gray-100);
  color: var(--gray-800);
}

.book-action-dropdown {
  position: absolute;
  right: 0;
  top: 46px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--gray-200);
  min-width: 200px;
  z-index: 200;
  padding: 6px;
  overflow: hidden;
}

.bad-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.84rem;
  color: var(--gray-700);
  text-align: left;
  transition: background 0.15s;
  background: transparent;
  border: none;
  cursor: pointer;
}

.bad-item:hover {
  background: var(--gray-100);
}

.bad-item.active {
  color: #1565c0;
  font-weight: 600;
}

.bad-item.warning {
  color: var(--warning);
}

.bad-item.success {
  color: var(--success);
}

.bad-item.danger {
  color: var(--error);
}

.bad-item.danger:hover {
  background: rgba(244, 67, 54, 0.08);
}

.bad-divider {
  height: 1px;
  background: var(--gray-200);
  margin: 4px 0;
}

/* Loading & Unavailable States */
.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--space-3xl);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.book-unavailable {
  max-width: 760px;
  margin: var(--space-3xl) auto;
  padding: var(--space-3xl);
  text-align: center;
}

.unavailable-icon {
  width: 78px;
  height: 78px;
  margin: 0 auto var(--space-xl);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 152, 0, 0.12);
  color: #e65100;
}

.unavailable-content {
  max-width: 560px;
  margin: 0 auto;
}

.unavailable-eyebrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 var(--space-md);
  border-radius: var(--radius-full);
  background: rgba(27, 94, 32, 0.08);
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.unavailable-content h1 {
  margin-top: var(--space-md);
  color: var(--primary-dark);
  font-size: 1.55rem;
  line-height: 1.25;
}

.unavailable-content p {
  margin-top: var(--space-sm);
  color: var(--gray-600);
  font-size: 0.95rem;
  line-height: 1.7;
}

.unavailable-owner {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-xl);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-lg);
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
}

.unavailable-owner span {
  color: var(--gray-500);
  font-size: 0.78rem;
  font-weight: 600;
}

.unavailable-owner strong {
  color: var(--primary-dark);
  font-size: 0.88rem;
}

.unavailable-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  flex-wrap: wrap;
  margin-top: var(--space-2xl);
}

/* ── Summary Cards Grid ── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.sum-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.sum-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sum-icon.icon-members {
  background: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
}

.sum-icon.icon-tx {
  background: rgba(2, 132, 199, 0.12);
  color: #0284c7;
}

.sum-icon.icon-expense {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.sum-icon.icon-balance {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.sum-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sum-val {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--primary-dark);
  line-height: 1.2;
}

.sum-val.text-expense {
  color: #dc2626;
}

.sum-val.text-balance {
  color: #b45309;
  font-size: clamp(1rem, 2.3vw, 1.25rem);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sum-label {
  font-size: 0.72rem;
  color: var(--gray-500);
  margin-top: 2px;
}

/* ── Add Transaction & Side Column ── */
.add-section {
  padding: var(--space-xl);
  border-radius: var(--radius-xl);
}

.side-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.side-col-header h2 {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary-dark);
  margin: 0;
}

.collapse-toggle-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
  background: var(--gray-50);
  color: var(--gray-500);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.collapse-toggle-btn:hover {
  background: var(--gray-100);
  color: var(--gray-800);
}

.collapsed-form-card {
  cursor: pointer;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-xl);
  border: 1.5px dashed rgba(27, 94, 32, 0.3);
  background: rgba(27, 94, 32, 0.04);
  transition: all 0.2s;
}

.collapsed-form-card:hover {
  background: rgba(27, 94, 32, 0.08);
  border-color: var(--primary);
}

.collapsed-content {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--primary-dark);
  font-weight: 700;
  font-size: 0.88rem;
}

.collapsed-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transaction-type-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  background: var(--gray-100);
  padding: 5px;
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-xl);
}

.type-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  border-radius: var(--radius-lg);
  border: none;
  background: transparent;
  color: var(--gray-600);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-tab:hover:not(.active) {
  background: rgba(255, 255, 255, 0.5);
  color: var(--gray-800);
}

.type-tab.active.income {
  background: var(--primary-gradient);
  color: white;
  box-shadow: 0 4px 14px rgba(27, 94, 32, 0.25);
}

.type-tab.active.expense {
  background: linear-gradient(135deg, #d32f2f, #b71c1c);
  color: white;
  box-shadow: 0 4px 14px rgba(211, 47, 47, 0.25);
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
  flex-wrap: wrap;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--space-xs);
}

.mb-0 {
  margin-bottom: 0 !important;
}

.santri-input-modes {
  display: flex;
  gap: 4px;
  background: var(--gray-100);
  padding: 3px;
  border-radius: var(--radius-md);
}

.mode-btn {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.72rem;
  font-weight: 700;
  background: transparent;
  color: var(--gray-600);
  border: none;
  cursor: pointer;
  transition: all 0.18s;
}

.mode-btn.active {
  background: white;
  color: var(--primary-dark);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.form-input {
  padding: 10px 14px;
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.88rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
}

.form-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.1);
}

.mt-2 {
  margin-top: 8px;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
  z-index: 50;
  max-height: 220px;
  overflow-y: auto;
  margin-top: 4px;
}

.suggestion-item {
  padding: 10px 14px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.15s;
}

.suggestion-item:hover {
  background: var(--gray-50);
  color: var(--primary);
}

.btn-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  min-height: 46px;
  padding: 0 var(--space-xl);
  background: var(--primary-gradient);
  color: white;
  border-radius: var(--radius-lg);
  font-weight: 700;
  font-size: 0.92rem;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(27, 94, 32, 0.28);
  border: none;
  cursor: pointer;
  margin-top: var(--space-xs);
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(27, 94, 32, 0.38);
}

.btn-add.btn-expense {
  background: linear-gradient(135deg, #d32f2f, #b71c1c);
  box-shadow: 0 4px 15px rgba(211, 47, 47, 0.28);
}

.btn-add.btn-expense:hover {
  box-shadow: 0 8px 24px rgba(211, 47, 47, 0.38);
}

.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.quick-history-link {
  text-align: center;
  margin-top: var(--space-sm);
}

.btn-text-link {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 700;
  font-size: 0.84rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 4px 8px;
}

.closed-notice {
  padding: var(--space-xl);
  text-align: center;
  color: var(--gray-600);
  font-size: 0.9rem;
  margin-bottom: var(--space-xl);
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: var(--radius-xl);
}

/* ── Mobile Segmented View Tabs (< 1024px) ── */
.mobile-view-tabs {
  display: flex;
  gap: 6px;
  background: var(--gray-100);
  padding: 5px;
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-xl);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03);
}

.mobile-tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 8px;
  border-radius: var(--radius-lg);
  border: none;
  background: transparent;
  color: var(--gray-600);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-tab-btn.active {
  background: white;
  color: var(--primary-dark);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.mobile-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 800;
  background: var(--gray-200);
  color: var(--gray-700);
}

.mobile-tab-btn.active .mobile-tab-count {
  background: rgba(27, 94, 32, 0.15);
  color: var(--primary-dark);
}

/* ── Main Layout Architecture (Split Grid on Desktop) ── */
.detail-main-layout {
  display: grid;
  grid-template-columns: 390px 1fr;
  gap: var(--space-xl);
  align-items: start;
  margin-bottom: var(--space-2xl);
}

.detail-main-layout.form-collapsed {
  grid-template-columns: 1fr;
}

.layout-side-col {
  min-width: 0;
}

.sticky-card {
  position: sticky;
  top: 20px;
  z-index: 10;
}

.layout-main-col {
  min-width: 0;
}

/* ── Data Workspace Card ── */
.data-workspace-card {
  padding: var(--space-xl);
  border-radius: var(--radius-xl);
}

.ws-tabs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1.5px solid var(--gray-200);
  padding-bottom: var(--space-md);
  margin-bottom: var(--space-lg);
  gap: var(--space-md);
  flex-wrap: wrap;
}

.ws-tabs-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ws-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--gray-600);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.ws-tab-btn:hover:not(.active) {
  background: var(--gray-100);
  color: var(--gray-800);
}

.ws-tab-btn.active {
  background: rgba(27, 94, 32, 0.1);
  color: var(--primary-dark);
}

.tab-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 800;
  background: var(--gray-200);
  color: var(--gray-700);
}

.ws-tab-btn.active .tab-count-badge {
  background: var(--primary);
  color: white;
}

.uncollapse-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba(27, 94, 32, 0.08);
  color: var(--primary);
  border: 1px solid rgba(27, 94, 32, 0.18);
  cursor: pointer;
  transition: all 0.18s;
}

.uncollapse-btn:hover {
  background: rgba(27, 94, 32, 0.15);
}

/* ── History & Member Controls ── */
.history-controls-row,
.members-controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.tx-filter-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid var(--gray-200);
  background: white;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover:not(.active) {
  background: var(--gray-50);
  border-color: var(--gray-300);
}

.filter-chip.active {
  background: var(--primary-gradient);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(27, 94, 32, 0.2);
}

.filter-chip.expense-chip.active {
  background: linear-gradient(135deg, #d32f2f, #b71c1c);
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.2);
}

.members-summary-badge {
  font-size: 0.88rem;
  color: var(--gray-600);
  font-weight: 500;
}

.members-summary-badge strong {
  color: var(--primary-dark);
  font-weight: 700;
}

.tx-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.tx-search-wrap .search-icon {
  position: absolute;
  left: 12px;
  color: var(--gray-400);
  pointer-events: none;
}

.tx-search-wrap .search-input {
  padding: 8px 32px 8px 36px;
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.85rem;
  width: 220px;
  outline: none;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.tx-search-wrap .search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  font-size: 1.15rem;
  color: var(--gray-400);
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.clear-search-btn:hover {
  color: var(--gray-700);
}

.empty-text {
  text-align: center;
  color: var(--gray-500);
  padding: var(--space-2xl) var(--space-lg);
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon-wrap {
  color: var(--gray-300);
  margin-bottom: var(--space-xs);
}

/* ── Scrollable Containers ── */
.scrollable-tx-list {
  max-height: 640px;
  overflow-y: auto;
  padding-right: 4px;
}

.scrollable-tx-list::-webkit-scrollbar,
.scrollable-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollable-tx-list::-webkit-scrollbar-track,
.scrollable-table-wrap::-webkit-scrollbar-track {
  background: var(--gray-50);
  border-radius: 4px;
}

.scrollable-tx-list::-webkit-scrollbar-thumb,
.scrollable-table-wrap::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: 4px;
}

.scrollable-tx-list::-webkit-scrollbar-thumb:hover,
.scrollable-table-wrap::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

.scrollable-table-wrap {
  max-height: 640px;
  overflow-y: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-100);
}

/* ── Table ── */
.santri-table-wrap {
  margin-top: var(--space-xs);
}

.data-table {
  width: 100%;
  min-width: 480px;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gray-500);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 2px solid var(--gray-200);
  position: sticky;
  top: 0;
  background: #fbfdfa;
  z-index: 5;
}

.data-table td {
  padding: var(--space-md);
  border-bottom: 1px solid var(--gray-100);
  vertical-align: middle;
}

.data-table tr:hover td {
  background: rgba(27, 94, 32, 0.02);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.member-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(27, 94, 32, 0.09);
  color: var(--primary-dark);
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.santri-name {
  font-weight: 600;
  color: var(--primary-dark);
}

.tx-count-pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: var(--gray-100);
  color: var(--gray-700);
  font-weight: 700;
  font-size: 0.75rem;
}

.amount-cell {
  font-weight: 700;
  color: var(--success);
}

.muted {
  color: var(--gray-400);
  font-size: 0.8rem;
}

/* ── Transactions List ── */
.tx-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.tx-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--gray-50);
  border: 1px solid var(--gray-100);
  transition: all 0.2s;
}

.tx-item:hover {
  background: rgba(27, 94, 32, 0.04);
  border-color: rgba(27, 94, 32, 0.15);
}

.tx-item.expense:hover {
  background: rgba(211, 47, 47, 0.04);
  border-color: rgba(211, 47, 47, 0.15);
}

.tx-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: white;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.tx-avatar.expense {
  background: linear-gradient(135deg, #c62828, #ff7043);
}

.tx-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tx-santri {
  font-weight: 700;
  color: var(--primary-dark);
  font-size: 0.875rem;
}

.tx-notes {
  color: var(--gray-600);
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.tx-meta {
  color: var(--gray-400);
  font-size: 0.72rem;
  margin-top: 2px;
}

.tx-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.tx-amount {
  font-weight: 700;
  color: var(--success);
  font-size: 0.92rem;
  white-space: nowrap;
}

.tx-amount.expense {
  color: #d32f2f;
}

.tx-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.icon-btn.edit {
  color: var(--info);
  background: rgba(33, 150, 243, 0.1);
}

.icon-btn.edit:hover {
  background: rgba(33, 150, 243, 0.2);
}

.icon-btn.delete {
  color: var(--error);
  background: rgba(244, 67, 54, 0.1);
}

.icon-btn.delete:hover {
  background: rgba(244, 67, 54, 0.2);
}

/* ── Mobile & Responsive Breakpoints ── */
@media (min-width: 1024px) {
  .mobile-only {
    display: none !important;
  }
}

@media (max-width: 1023px) {
  .desktop-only {
    display: none !important;
  }

  .detail-main-layout {
    display: block;
  }

  .layout-side-col {
    display: none;
  }

  .layout-side-col.mobile-visible {
    display: block;
  }

  .layout-main-col {
    display: none;
  }

  .layout-main-col.mobile-visible {
    display: block;
  }

  .scrollable-tx-list,
  .scrollable-table-wrap {
    max-height: none;
  }
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .header-main-row {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-md);
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
    margin-left: 0;
  }

  .print-trigger-btn {
    flex: 1;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }

  .sum-card-balance {
    grid-column: 1 / -1;
  }

  .sum-card {
    padding: var(--space-md) !important;
    gap: var(--space-sm) !important;
  }

  .sum-icon {
    width: 38px !important;
    height: 38px !important;
  }

  .sum-val {
    font-size: clamp(0.95rem, 2.2vw, 1.15rem) !important;
  }

  .add-section {
    padding: var(--space-lg);
  }

  .data-workspace-card {
    padding: var(--space-lg);
  }

  .history-controls-row,
  .members-controls-row {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .tx-search-wrap {
    width: 100%;
  }

  .tx-search-wrap .search-input {
    width: 100%;
  }

  .tx-item {
    padding: var(--space-sm) var(--space-md);
    gap: var(--space-sm);
  }

  .tx-avatar {
    width: 36px;
    height: 36px;
    font-size: 0.85rem;
  }

  .tx-santri {
    font-size: 0.82rem;
  }

  .tx-notes {
    font-size: 0.74rem;
  }

  .tx-amount {
    font-size: 0.84rem;
  }
}

@media (max-width: 480px) {
  .book-unavailable {
    margin: var(--space-xl) auto;
    padding: var(--space-2xl) var(--space-xl);
  }

  .unavailable-content h1 {
    font-size: 1.25rem;
  }

  .unavailable-owner {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }
}

@media (max-width: 360px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 440px;
  padding: var(--space-2xl);
}

.print-modal {
  max-width: 560px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.modal-header h3 {
  font-size: 1.1rem;
  color: var(--primary-dark);
}

.close-btn {
  font-size: 1.5rem;
  color: var(--gray-400);
  line-height: 1;
  padding: 0 4px;
}

.modal-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  margin-top: var(--space-xl);
}

.btn-cancel {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  color: var(--gray-600);
  background: var(--gray-100);
  font-weight: 600;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: var(--gray-200);
}

.btn-save {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  background: var(--primary-gradient);
  color: white;
  font-weight: 600;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.print-option-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}

.print-option {
  min-height: 42px;
  padding: 0 var(--space-sm);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--gray-200);
  background: var(--gray-50);
  color: var(--gray-700);
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.2s;
}

.print-option.active {
  border-color: transparent;
  background: var(--primary);
  color: white;
  box-shadow: 0 8px 18px rgba(27, 94, 32, 0.18);
}

.print-range-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

.print-warning {
  margin-top: var(--space-sm);
  color: var(--error);
  font-size: 0.8rem;
  font-weight: 600;
}

.print-summary-box {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-sm);
  margin-top: var(--space-lg);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--gray-50);
}

.print-summary-box div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.print-summary-box span {
  color: var(--gray-500);
  font-size: 0.72rem;
  font-weight: 600;
}

.print-summary-box strong {
  color: var(--primary-dark);
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}

@media (max-width: 520px) {
  .print-range-grid,
  .print-summary-box {
    grid-template-columns: 1fr;
  }
}

.confirm-modal {
  text-align: center;
  max-width: 380px;
}

.confirm-modal h3 {
  color: var(--primary-dark);
  margin-bottom: var(--space-sm);
}

.confirm-modal p {
  color: var(--gray-600);
  font-size: 0.875rem;
  line-height: 1.6;
}

.btn-delete {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #c62828, #f44336);
  color: white;
  font-weight: 600;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-close-book {
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #e65100, #ff9800);
  color: white;
  font-weight: 600;
}

.btn-close-book:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Confirm icon variants */
.confirm-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-md);
}

.confirm-icon.danger-icon {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.confirm-icon.warning-icon {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

/* Sum icon SVG fix */
.sum-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
