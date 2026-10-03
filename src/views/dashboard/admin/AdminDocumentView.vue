<template>
  <div class="admin-document-view space-y-6">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
      <div>
        <div class="flex items-center gap-2">
          <router-link
            to="/dashboard/admin-lpj"
            class="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
          >
            ← Kembali ke LPJ Guru
          </router-link>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold font-jakarta text-slate-900 tracking-tight mt-1">
          Dokumen LPJ / Administrasi
        </h1>
        <p class="text-sm text-slate-500 font-inter mt-1">
          Cetak dokumen resmi bulanan (Jurnal Mengajar, Absensi Santri, Daftar Hadir Guru) format Native PDF A4.
        </p>
      </div>

      <div class="flex items-center gap-2 self-start md:self-auto">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Native PDF Engine (v2026.1)
        </span>
      </div>
    </header>

    <!-- Main Configuration Card -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
      <div class="border-b border-slate-100 pb-4">
        <h2 class="text-lg font-bold font-jakarta text-slate-900">Pengaturan Dokumen</h2>
        <p class="text-xs sm:text-sm text-slate-500 font-inter mt-0.5">
          Pilih periode, cakupan guru, dan jenis dokumen yang ingin dicetak.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Periode Selector -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Periode Laporan
          </label>
          <div class="relative">
            <input
              v-model="selectedPeriod"
              type="month"
              class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
            />
          </div>
          <p class="text-xs text-slate-400 mt-1.5">Format bulan & tahun (contoh: September 2026).</p>
        </div>

        <!-- Guru Selector -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Cakupan Guru
          </label>
          <select
            v-model="selectedGuruId"
            :disabled="selectedDocType === 'TEACHER_ATTENDANCE'"
            class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="all">Semua Guru (Seluruh Pengajar)</option>
            <option v-for="t in teachers" :key="t.uid" :value="t.uid">
              {{ t.displayName }}
            </option>
          </select>
          <p v-if="selectedDocType === 'TEACHER_ATTENDANCE'" class="text-xs text-amber-600 mt-1.5 font-medium">
            * Daftar Hadir Guru mencakup seluruh ustadz/ustadzah secara otomatis.
          </p>
          <p v-else class="text-xs text-slate-400 mt-1.5">
            Pilih guru tertentu atau semua guru untuk dicetak sekaligus.
          </p>
        </div>
      </div>

      <!-- Jenis Dokumen Cards -->
      <div class="pt-2">
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Pilih Jenis Dokumen
        </label>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Dokumen 1: Jurnal Mengajar -->
          <button
            type="button"
            class="text-left p-5 rounded-2xl border-2 transition-all cursor-pointer relative"
            :class="selectedDocType === 'JOURNAL' ? 'border-primary-600 bg-primary-50/30 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'"
            @click="selectDocType('JOURNAL')"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-2xl">📖</span>
              <span v-if="selectedDocType === 'JOURNAL'" class="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs">✓</span>
            </div>
            <h3 class="text-sm font-bold text-slate-900 font-jakarta">Jurnal Mengajar</h3>
            <p class="text-xs text-slate-500 font-inter mt-1 leading-relaxed">
              Buku Jurnal & Berita Acara KBM harian (1 hari per halaman, materi RPP, santri hadir/absen).
            </p>
          </button>

          <!-- Dokumen 2: Absensi Santri -->
          <button
            type="button"
            class="text-left p-5 rounded-2xl border-2 transition-all cursor-pointer relative"
            :class="selectedDocType === 'STUDENT_ATTENDANCE' ? 'border-primary-600 bg-primary-50/30 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'"
            @click="selectDocType('STUDENT_ATTENDANCE')"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-2xl">👥</span>
              <span v-if="selectedDocType === 'STUDENT_ATTENDANCE'" class="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs">✓</span>
            </div>
            <h3 class="text-sm font-bold text-slate-900 font-jakarta">Absensi & Nilai Santri</h3>
            <p class="text-xs text-slate-500 font-inter mt-1 leading-relaxed">
              Daftar hadir santri per guru & jilid materi dengan rekapitulasi tanggal 01-31 dan persentase.
            </p>
          </button>

          <!-- Dokumen 3: Daftar Hadir Guru -->
          <button
            type="button"
            class="text-left p-5 rounded-2xl border-2 transition-all cursor-pointer relative"
            :class="selectedDocType === 'TEACHER_ATTENDANCE' ? 'border-primary-600 bg-primary-50/30 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'"
            @click="selectDocType('TEACHER_ATTENDANCE')"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-2xl">📋</span>
              <span v-if="selectedDocType === 'TEACHER_ATTENDANCE'" class="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs">✓</span>
            </div>
            <h3 class="text-sm font-bold text-slate-900 font-jakarta">Daftar Hadir Guru</h3>
            <p class="text-xs text-slate-500 font-inter mt-1 leading-relaxed">
              Daftar Hadir Ustadz/Ustadzah bulanan admin-level (Landscape A4, arsip kehadiran seluruh pengajar).
            </p>
          </button>
        </div>
      </div>

      <!-- Action Button -->
      <div class="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
        <p class="text-xs text-slate-500 font-inter">
          * Dokumen langsung disusun dari data absensi dan KBM riil yang tersimpan.
        </p>

        <button
          type="button"
          class="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-primary-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="generating || !selectedPeriod"
          @click="generateDocument"
        >
          <svg v-if="generating" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="generating">Menyusun Dokumen PDF...</span>
          <span v-else>GENERATE PDF</span>
        </button>
      </div>
    </div>

    <!-- Generated Document Result Card -->
    <div v-if="generatedResult" class="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-sm space-y-5 animate-slide-up">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0">
            ✓
          </div>
          <div>
            <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider">PDF Berhasil Dibuat</span>
            <h3 class="text-lg font-bold font-jakarta text-slate-900 mt-0.5">{{ generatedResult.filename }}</h3>
            <p class="text-xs text-slate-500 font-inter">
              Periode {{ generatedResult.periodLabel }} • {{ getDocTypeTitle(generatedResult.documentType) }}
            </p>
          </div>
        </div>

        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          Ready
        </span>
      </div>

      <!-- Quick Summary Stats of the Generated Document -->
      <div v-if="generatedResult.stats" class="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 border border-slate-100 text-xs">
        <div v-if="generatedResult.stats.totalDays !== undefined">
          <span class="text-slate-400 block font-medium">Hari Kegiatan:</span>
          <span class="font-bold text-slate-800 text-sm">{{ generatedResult.stats.totalDays }} Hari</span>
        </div>
        <div v-if="generatedResult.stats.totalSessions !== undefined">
          <span class="text-slate-400 block font-medium">Total Sesi KBM:</span>
          <span class="font-bold text-slate-800 text-sm">{{ generatedResult.stats.totalSessions }} Sesi</span>
        </div>
        <div v-if="generatedResult.stats.totalTeachers !== undefined">
          <span class="text-slate-400 block font-medium">Jumlah Guru:</span>
          <span class="font-bold text-slate-800 text-sm">{{ generatedResult.stats.totalTeachers }} Pengajar</span>
        </div>
        <div v-if="generatedResult.stats.totalSections !== undefined">
          <span class="text-slate-400 block font-medium">Kelas / Jilid:</span>
          <span class="font-bold text-slate-800 text-sm">{{ generatedResult.stats.totalSections }} Rombel</span>
        </div>
        <div v-if="generatedResult.stats.totalStudents !== undefined">
          <span class="text-slate-400 block font-medium">Jumlah Santri:</span>
          <span class="font-bold text-slate-800 text-sm">{{ generatedResult.stats.totalStudents }} Santri</span>
        </div>
        <div v-if="generatedResult.stats.totalOperationalDays !== undefined">
          <span class="text-slate-400 block font-medium">Hari Kerja Efektif:</span>
          <span class="font-bold text-slate-800 text-sm">{{ generatedResult.stats.totalOperationalDays }} Hari</span>
        </div>
      </div>

      <!-- Action Buttons: Open & Download -->
      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          class="btn btn-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-primary-600/20 flex items-center gap-2 cursor-pointer"
          @click="openPdfPreview"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Buka PDF (Preview)
        </button>

        <button
          type="button"
          class="btn btn-secondary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
          @click="downloadPdfFile"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>
      </div>
    </div>

    <!-- Section 2: PAKET LPJ BERKALA (3 BULAN / 6 BULAN) -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
      <div class="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-800">
              Arsip Kolektif
            </span>
            <h2 class="text-lg font-bold font-jakarta text-slate-900">Paket LPJ Berkala</h2>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 font-inter mt-1">
            Unduh seluruh berkas administrasi LPJ (3 bulan / 6 bulan) dalam satu paket arsip ZIP siap pakai.
          </p>
        </div>

        <!-- Mode Toggle: 3 Bulan vs 6 Bulan -->
        <div class="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="packageMode === 3 ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            @click="setPackageMode(3)"
          >
            Paket 3 Bulan
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="packageMode === 6 ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
            @click="setPackageMode(6)"
          >
            Paket 6 Bulan
          </button>
        </div>
      </div>

      <!-- Package Period and Scope Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Periode Awal -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Periode Awal
          </label>
          <input
            v-model="packageStartPeriod"
            type="month"
            class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
            @change="syncPackageEndPeriod"
          />
          <p class="text-xs text-slate-400 mt-1.5">Bulan awal periode (contoh: Juli 2026).</p>
        </div>

        <!-- Periode Akhir -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Periode Akhir (Otomatis {{ packageMode }} Bulan)
          </label>
          <div class="relative">
            <input
              v-model="packageEndPeriod"
              type="month"
              class="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 cursor-not-allowed"
              readonly
            />
            <span class="absolute right-3.5 top-3.5 text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
              Locked
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1.5">Dihitung otomatis berurutan tanpa gap bulan.</p>
        </div>

        <!-- Cakupan Guru -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Cakupan Guru
          </label>
          <select
            v-model="packageGuruId"
            class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
          >
            <option value="all">Semua Guru (Seluruh Pengajar)</option>
            <option v-for="t in teachers" :key="t.uid" :value="t.uid">
              {{ t.displayName }}
            </option>
          </select>
          <p class="text-xs text-slate-400 mt-1.5">
            Daftar Hadir Guru selalu memuat seluruh pengajar.
          </p>
        </div>
      </div>

      <!-- Checklist Dokumen -->
      <div class="pt-2">
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Dokumen Termasuk Dalam Paket
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label
            class="flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none"
            :class="packageDocs.journal ? 'border-primary-500 bg-primary-50/20' : 'border-slate-200 bg-slate-50/50'"
          >
            <input
              v-model="packageDocs.journal"
              type="checkbox"
              class="w-5 h-5 mt-0.5 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
            <div>
              <span class="text-sm font-bold text-slate-900 block font-jakarta">Jurnal Mengajar</span>
              <span class="text-xs text-slate-500">Folder: 01_JURNAL_MENGAJAR</span>
            </div>
          </label>

          <label
            class="flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none"
            :class="packageDocs.studentAttendance ? 'border-primary-500 bg-primary-50/20' : 'border-slate-200 bg-slate-50/50'"
          >
            <input
              v-model="packageDocs.studentAttendance"
              type="checkbox"
              class="w-5 h-5 mt-0.5 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
            <div>
              <span class="text-sm font-bold text-slate-900 block font-jakarta">Absensi Santri</span>
              <span class="text-xs text-slate-500">Folder: 02_ABSENSI_SANTRI</span>
            </div>
          </label>

          <label
            class="flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none"
            :class="packageDocs.teacherAttendance ? 'border-primary-500 bg-primary-50/20' : 'border-slate-200 bg-slate-50/50'"
          >
            <input
              v-model="packageDocs.teacherAttendance"
              type="checkbox"
              class="w-5 h-5 mt-0.5 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
            <div>
              <span class="text-sm font-bold text-slate-900 block font-jakarta">Daftar Hadir Guru</span>
              <span class="text-xs text-slate-500">Folder: 03_ABSENSI_GURU</span>
            </div>
          </label>
        </div>
        <p v-if="!hasAnyPackageDocSelected" class="text-xs font-semibold text-rose-600 mt-2">
          * Minimal pilih satu jenis dokumen untuk menyusun paket LPJ.
        </p>
      </div>

      <!-- Action Button for Package -->
      <div class="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
        <div class="text-xs text-slate-500 font-inter">
          <span>Struktur arsip: </span>
          <code class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-2xs">01_JURNAL_MENGAJAR/</code>,
          <code class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-2xs">02_ABSENSI_SANTRI/</code>,
          <code class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-2xs">03_ABSENSI_GURU/</code>,
          <code class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-2xs">README.txt</code>
        </div>

        <button
          type="button"
          class="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="generatingPackage || !packageStartPeriod || !hasAnyPackageDocSelected"
          @click="generatePackage"
        >
          <svg v-if="generatingPackage" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="generatingPackage">Menyusun Arsip ZIP Paket...</span>
          <span v-else>GENERATE PAKET</span>
        </button>
      </div>
    </div>

    <!-- Generated Package Result Card -->
    <div v-if="packageResult" class="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-sm space-y-5 animate-slide-up">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0">
            📦
          </div>
          <div>
            <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Paket LPJ Siap Diunduh</span>
            <h3 class="text-lg font-bold font-jakarta text-slate-900 mt-0.5">{{ packageResult.filename }}</h3>
            <p class="text-xs text-slate-500 font-inter">
              Periode {{ packageResult.periodStart }} s/d {{ packageResult.periodEnd }} ({{ packageResult.monthCount }} Bulan) • {{ formatBytes(packageResult.fileSizeBytes) }}
            </p>
          </div>
        </div>

        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Ready (ZIP)
        </span>
      </div>

      <!-- Month Summary Pills -->
      <div v-if="packageResult.periods" class="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
        <div class="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Rincian Dokumen Per Bulan:
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div
            v-for="p in packageResult.periods"
            :key="p"
            class="bg-white rounded-xl p-3 border border-slate-200 text-xs shadow-2xs"
          >
            <div class="font-bold text-slate-800">{{ p }}</div>
            <div v-if="packageResult.periodStats && packageResult.periodStats[p]" class="text-2xs text-slate-500 mt-1 space-y-0.5">
              <div v-if="packageResult.periodStats[p].journalDays !== undefined">
                Jurnal: {{ packageResult.periodStats[p].journalDays }} hari KBM
              </div>
              <div v-if="packageResult.periodStats[p].teacherOperationalDays !== undefined">
                Kehadiran Guru: {{ packageResult.periodStats[p].teacherOperationalDays }} hari
              </div>
              <div v-if="packageResult.periodStats[p].studentSections !== undefined">
                Absensi Santri: {{ packageResult.periodStats[p].studentSections }} rombel
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Download Button for Package -->
      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          class="btn btn-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-primary-600/20 flex items-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
          @click="downloadPackageFile"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Paket ZIP
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";
import { useToast } from "@/composables/useToast";
import { useAuthStore } from "@/stores/auth";

const { success, error: showError, warning } = useToast();
const authStore = useAuthStore();

// Multi-Month Package State
const packageMode = ref(3);
const packageStartPeriod = ref("2026-07");
const packageEndPeriod = ref("2026-09");
const packageGuruId = ref("all");
const packageDocs = ref({
  journal: true,
  studentAttendance: true,
  teacherAttendance: true
});
const generatingPackage = ref(false);
const packageResult = ref(null);

const hasAnyPackageDocSelected = computed(() => {
  return packageDocs.value.journal || packageDocs.value.studentAttendance || packageDocs.value.teacherAttendance;
});

// Form State
const selectedPeriod = ref("2026-09");
const selectedGuruId = ref("all");
const selectedDocType = ref("JOURNAL");

// Metadata
const teachers = ref([]);
const periods = ref([]);
const generating = ref(false);
const generatedResult = ref(null);

function selectDocType(type) {
  selectedDocType.value = type;
  if (type === "TEACHER_ATTENDANCE") {
    selectedGuruId.value = "all";
  }
}

function getDocTypeTitle(type) {
  if (type === "JOURNAL") return "Buku Jurnal & Berita Acara";
  if (type === "TEACHER_ATTENDANCE") return "Daftar Hadir Ustadz/Ustadzah";
  if (type === "STUDENT_ATTENDANCE") return "Daftar Nilai & Absensi Santri";
  return "Dokumen Administrasi";
}

async function loadMeta() {
  try {
    const { data } = await api.get("/admin/documents/meta");
    teachers.value = data.teachers || [];
    periods.value = data.periods || [];

    if (!selectedPeriod.value && periods.value.length > 0) {
      selectedPeriod.value = periods.value[0].value;
    }
  } catch (err) {
    console.error("Failed to load metadata:", err);
  }
}

async function generateDocument() {
  if (!selectedPeriod.value) {
    warning("Silakan tentukan periode laporan terlebih dahulu.");
    return;
  }

  generating.value = true;
  generatedResult.value = null;

  try {
    const payload = {
      period: selectedPeriod.value,
      documentType: selectedDocType.value,
      guruId: selectedGuruId.value
    };

    const { data } = await api.post("/admin/documents/generate", payload);
    generatedResult.value = data;
    success("Dokumen PDF berhasil dibuat.");
  } catch (err) {
    console.error("Generate document error:", err);
    showError(err.response?.data?.error || "Gagal menghasilkan dokumen PDF.");
  } finally {
    generating.value = false;
  }
}

function getAuthTokenParam() {
  return authStore.token ? `&token=${encodeURIComponent(authStore.token)}` : "";
}

function stripApiPrefix(url) {
  if (!url) return "";
  return url.replace(/^\/?api\/?/, "/");
}

const downloadingPdf = ref(false);

async function openPdfPreview() {
  if (!generatedResult.value?.previewUrl) return;
  try {
    downloadingPdf.value = true;
    const cleanUrl = stripApiPrefix(generatedResult.value.previewUrl);
    const response = await api.get(cleanUrl, {
      responseType: "blob"
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const objectUrl = window.URL.createObjectURL(blob);
    window.open(objectUrl, "_blank");
  } catch (err) {
    console.error("Open PDF preview error:", err);
    showError("Gagal membuka pratinjau PDF.");
  } finally {
    downloadingPdf.value = false;
  }
}

async function downloadPdfFile() {
  if (!generatedResult.value?.downloadUrl) return;
  try {
    downloadingPdf.value = true;
    const cleanUrl = stripApiPrefix(generatedResult.value.downloadUrl);
    const response = await api.get(cleanUrl, {
      responseType: "blob"
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = generatedResult.value.filename || "Dokumen.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    success("Dokumen PDF berhasil diunduh.");
  } catch (err) {
    console.error("Download PDF error:", err);
    showError("Gagal mengunduh dokumen PDF.");
  } finally {
    downloadingPdf.value = false;
  }
}

// =========================================================================
// MULTI-MONTH PACKAGE LOGIC
// =========================================================================
function calculateEndPeriod(start, count) {
  if (!start || !/^\d{4}-\d{2}$/.test(start)) return start;
  const [yearStr, monthStr] = start.split("-");
  let y = parseInt(yearStr, 10);
  let m = parseInt(monthStr, 10) + (count - 1);
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

function syncPackageEndPeriod() {
  packageEndPeriod.value = calculateEndPeriod(packageStartPeriod.value, packageMode.value);
}

function setPackageMode(mode) {
  packageMode.value = mode;
  syncPackageEndPeriod();
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

async function generatePackage() {
  if (!packageStartPeriod.value) {
    warning("Silakan tentukan periode awal terlebih dahulu.");
    return;
  }

  if (!hasAnyPackageDocSelected.value) {
    warning("Pilih minimal satu jenis dokumen untuk menyusun paket LPJ.");
    return;
  }

  syncPackageEndPeriod();
  generatingPackage.value = true;
  packageResult.value = null;

  try {
    const selectedGuruObj = teachers.value.find(t => t.uid === packageGuruId.value);
    const guruName = selectedGuruObj ? selectedGuruObj.displayName : (packageGuruId.value === "all" ? "Semua Guru" : null);

    const payload = {
      mode: packageMode.value,
      startPeriod: packageStartPeriod.value,
      endPeriod: packageEndPeriod.value,
      guruId: packageGuruId.value,
      guruName,
      documents: {
        journal: packageDocs.value.journal,
        studentAttendance: packageDocs.value.studentAttendance,
        teacherAttendance: packageDocs.value.teacherAttendance
      }
    };

    const { data } = await api.post("/admin/documents/package", payload);
    packageResult.value = data;
    success(`Paket LPJ ${packageMode.value} bulan berhasil dibuat!`);
  } catch (err) {
    console.error("Generate package error:", err);
    showError(err.response?.data?.error || "Gagal menyusun paket LPJ.");
  } finally {
    generatingPackage.value = false;
  }
}

const downloadingPackage = ref(false);

async function downloadPackageFile() {
  if (!packageResult.value?.downloadUrl) return;
  try {
    downloadingPackage.value = true;
    const cleanUrl = stripApiPrefix(packageResult.value.downloadUrl);
    const response = await api.get(cleanUrl, {
      responseType: "blob"
    });
    const blob = new Blob([response.data], { type: "application/zip" });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = packageResult.value.filename || "Paket_LPJ.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    success("Paket LPJ ZIP berhasil diunduh.");
  } catch (err) {
    console.error("Download package error:", err);
    showError("Gagal mengunduh paket LPJ ZIP.");
  } finally {
    downloadingPackage.value = false;
  }
}

onMounted(() => {
  loadMeta();
  syncPackageEndPeriod();
});
</script>

<style scoped>
.admin-document-view {
  min-height: 80vh;
}
</style>
