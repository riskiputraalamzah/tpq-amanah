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
        Kembali
      </button>
      <div class="flex w-full">
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
          <div
            class="sum-icon"
            style="background: linear-gradient(135deg, #11998e, #38ef7d)"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div class="sum-info">
            <span class="sum-val">{{ summary.length }}</span
            ><span class="sum-label">Anggota</span>
          </div>
        </div>
        <div class="sum-card glass-card">
          <div
            class="sum-icon"
            style="background: linear-gradient(135deg, #4facfe, #00f2fe)"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
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
            <span class="sum-val">{{ transactions.length }}</span
            ><span class="sum-label">Transaksi</span>
          </div>
        </div>
        <div class="sum-card glass-card">
          <div
            class="sum-icon"
            style="background: linear-gradient(135deg, #ff6a6a, #ff9a76)"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <path d="M19 12H5" />
              <path d="M18 6l4 6-4 6" />
            </svg>
          </div>
          <div class="sum-info">
            <span class="sum-val">Rp {{ formatCurrency(totalExpense) }}</span
            ><span class="sum-label">Pengeluaran</span>
          </div>
        </div>
        <div class="sum-card glass-card">
          <div
            class="sum-icon"
            style="background: linear-gradient(135deg, #f6d365, #fda085)"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div class="sum-info">
            <span class="sum-val">{{ formatLedgerCurrency(totalBalance) }}</span
            ><span class="sum-label">Saldo Buku</span>
          </div>
        </div>
      </div>

      <!-- Add Transaction (only if active) -->
      <div v-if="book?.status === 'active'" class="add-section glass-card">
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
          Catat Transaksi Baru
        </h2>
        <div class="transaction-type-tabs">
          <button
            type="button"
            class="type-tab income"
            :class="{ active: newTx.type === 'income' }"
            @click="setTransactionType('income')"
          >
            Pemasukan
          </button>
          <button
            type="button"
            class="type-tab expense"
            :class="{ active: newTx.type === 'expense' }"
            @click="setTransactionType('expense')"
          >
            Pengeluaran
          </button>
        </div>
        <div class="add-form">
          <!-- Santri Select Mode -->
          <div
            v-if="newTx.type === 'income'"
            class="form-group"
            style="position: relative"
          >
            <label class="form-label">Nama Anggota *</label>

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
                Pilih dari Riwayat
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
                Input Data Baru
              </button>
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
          <div class="form-group">
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
            @click="addTransaction"
            :disabled="submitting"
          >
            {{
              submitting
                ? "Menyimpan..."
                : newTx.type === "expense"
                  ? "Simpan Pengeluaran"
                  : "Simpan Pemasukan"
            }}
          </button>
        </div>
      </div>

      <div v-else class="closed-notice glass-card">
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
        Buku tabungan ini sudah ditutup. Tidak ada transaksi baru yang dapat
        ditambahkan.
      </div>

      <!-- Per-Santri Summary -->
      <div class="section glass-card">
        <h2>Ringkasan per Anggota</h2>
        <div v-if="summary.length === 0" class="empty-text">
          Belum ada data anggota
        </div>
        <div v-else class="santri-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Transaksi</th>
                <th>Total Tabungan</th>
                <th>Terakhir Setor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in summary" :key="s.santriId">
                <td>
                  <span class="santri-name">{{ s.santriName }}</span>
                </td>
                <td>{{ s.transactionCount }}x</td>
                <td class="amount-cell">Rp {{ formatCurrency(s.balance) }}</td>
                <td class="muted">{{ formatDateTime(s.lastTransaction) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Transaction History -->
      <div class="section glass-card">
        <div class="section-header">
          <h2>Riwayat Transaksi</h2>
          <input
            v-model="searchTx"
            type="text"
            class="search-input"
            placeholder="Cari transaksi..."
          />
        </div>
        <div v-if="filteredTx.length === 0" class="empty-text">
          Belum ada transaksi
        </div>
        <div v-else class="tx-list">
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
const filteredTx = computed(() => {
  if (!searchTx.value.trim()) return transactions.value;
  const q = searchTx.value.toLowerCase();
  return transactions.value.filter((t) => {
    return [t.santriName, t.description, t.notes, t.recordedByName]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(q));
  });
});

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
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--primary);
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: var(--space-lg);
  padding: var(--space-sm) 0;
  transition: gap 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  gap: var(--space-md);
}

.header-info {
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: auto;
}

.print-trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  min-height: 38px;
  padding: 0 var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--primary);
  color: white;
  font-size: 0.82rem;
  font-weight: 700;
  box-shadow: 0 8px 22px rgba(27, 94, 32, 0.22);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  white-space: nowrap;
}

.print-trigger-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(27, 94, 32, 0.28);
}

.title-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
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

/* Book action dots */
.book-action-wrap {
  position: relative;
  flex-shrink: 0;
}

.book-action-dots {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  transition: all 0.2s;
  background: var(--gray-50);
  border: 1.5px solid var(--gray-200);
}

.book-action-dots:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}

.book-action-dropdown {
  position: absolute;
  right: 0;
  top: 42px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.14),
    0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--gray-100);
  min-width: 200px;
  z-index: 200;
  padding: 6px 0;
  overflow: hidden;
}

.bad-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  font-size: 0.82rem;
  color: var(--gray-700);
  text-align: left;
  transition: background 0.15s;
}

.bad-item:hover {
  background: var(--gray-50);
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
  background: rgba(244, 67, 54, 0.06);
}

.bad-divider {
  height: 1px;
  background: var(--gray-100);
  margin: 4px 0;
}

.header-info h1 {
  font-size: 1.75rem;
  color: var(--primary-dark);
}

.header-info p {
  color: var(--gray-600);
  margin-top: 2px;

  font-size: 0.9rem;
}

.book-meta {
  color: var(--gray-400) !important;
  font-size: 0.8rem !important;
  margin-top: 4px;
}

.book-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
}

.book-badge.active {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}

.book-badge.closed {
  background: rgba(158, 158, 158, 0.15);
  color: var(--gray-500);
}

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

/* Summary */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
    margin-left: 0;
  }

  .print-trigger-btn {
    flex: 1;
  }

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

.sum-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
}

.sum-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.sum-info {
  display: flex;
  flex-direction: column;
}

.sum-val {
  font-weight: 700;
  color: var(--primary-dark);
  font-size: 1rem;
}

.sum-label {
  font-size: 0.72rem;
  color: var(--gray-500);
  margin-top: 2px;
}

/* Add Section */
.add-section {
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.add-section h2 {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 1.05rem;
  color: var(--primary-dark);
  margin-bottom: var(--space-xl);
}

.transaction-type-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
}

.type-tab {
  min-height: 44px;
  padding: 0 var(--space-lg);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--gray-200);
  background: white;
  color: var(--gray-600);
  font-size: 0.85rem;
  font-weight: 800;
  transition: all 0.2s;
}

.type-tab.active.income {
  border-color: transparent;
  background: var(--primary);
  color: white;
  box-shadow: 0 8px 22px rgba(27, 94, 32, 0.18);
}

.type-tab.active.expense {
  border-color: transparent;
  background: #d32f2f;
  color: white;
  box-shadow: 0 8px 22px rgba(211, 47, 47, 0.18);
}

.add-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

@media (max-width: 600px) {
  .add-form {
    grid-template-columns: 1fr;
  }
}

.add-form .form-group:last-of-type {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--space-xs);
}

.form-input {
  padding: var(--space-md) var(--space-lg);
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--primary);
}

.mt-2 {
  margin-top: 8px;
}

/* Input Modes */
.santri-input-modes {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.mode-btn {
  flex: 1;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--gray-100);
  color: var(--gray-600);
  border: 1px solid var(--gray-200);
  transition: all 0.2s;
}

.mode-btn.active {
  background: var(--primary-gradient);
  color: white;
  border-color: transparent;
}

.mode-btn:hover:not(.active) {
  background: var(--gray-200);
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: var(--space-md) var(--space-lg);
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.15s;
}

.suggestion-item:hover {
  background: var(--gray-50);
  color: var(--primary);
}

.btn-add {
  grid-column: 1 / -1;
  padding: var(--space-md) var(--space-xl);
  background: var(--primary-gradient);
  color: white;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(27, 94, 32, 0.3);
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(27, 94, 32, 0.4);
}

.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.closed-notice {
  padding: var(--space-xl);
  text-align: center;
  color: var(--gray-500);
  font-size: 0.9rem;
  margin-bottom: var(--space-xl);
}

/* Sections */
.section {
  padding: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.section h2,
.section-header h2 {
  font-size: 1.05rem;
  color: var(--primary-dark);
  margin-bottom: var(--space-lg);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.search-input {
  padding: var(--space-sm) var(--space-md);
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.8rem;
  outline: none;
  width: 200px;
}

.search-input:focus {
  border-color: var(--primary);
}

.empty-text {
  text-align: center;
  color: var(--gray-400);
  padding: var(--space-xl) 0;
  font-size: 0.9rem;
}

/* Table */
.santri-table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  text-align: left;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gray-500);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--gray-100);
}

.data-table td {
  padding: var(--space-md);
  border-bottom: 1px solid var(--gray-50);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.santri-name {
  font-weight: 600;
  color: var(--primary-dark);
}

.center {
  text-align: center !important;
}

.amount-cell {
  font-weight: 700;
  color: var(--success);
}

.muted {
  color: var(--gray-400);
  font-size: 0.8rem;
}

/* Transactions */
.tx-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.tx-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--gray-50);
  transition: background 0.2s;
}

.tx-item:hover {
  background: rgba(27, 94, 32, 0.05);
}

.tx-item.expense:hover {
  background: rgba(211, 47, 47, 0.05);
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
  font-weight: 600;
  color: var(--primary-dark);
  font-size: 0.875rem;
}

.tx-notes {
  color: var(--gray-500);
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  font-size: 0.9rem;
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
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
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
