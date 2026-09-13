<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-primary-500 selection:text-white">
    <NavbarComponent />

    <!-- ================================================================= -->
    <!-- 1. HERO SECTION (MINIMALIST, INSPIRING & VISUALLY STUNNING) -->
    <!-- ================================================================= -->
    <section id="beranda"
      class="relative flex items-center bg-gradient-to-br from-emerald-950 via-primary-900 to-emerald-950 overflow-hidden min-h-[100dvh] pt-28 pb-20 sm:pt-32 sm:pb-24 lg:pt-32 lg:pb-32">
      <!-- Background Ambient Glow & Islamic Star Motif -->
      <div class="absolute inset-0 islamic-pattern opacity-10 pointer-events-none"></div>
      <div
        class="absolute inset-0 bg-gradient-radial from-amber-400/15 via-transparent to-transparent pointer-events-none">
      </div>

      <!-- Golden Radial Halo Behind Right Visual -->
      <div
        class="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none">
      </div>
      <div class="absolute -top-10 left-10 w-72 h-72 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div class="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">

          <!-- Left Column: Concise & Inspiring Copywriting (6 cols) -->
          <div class="lg:col-span-6 text-center lg:text-left flex flex-col justify-center">
            <!-- Bismillah Calligraphy -->
            <p
              class="text-3xl sm:text-4xl lg:text-5xl font-arabic text-accent-300 mb-6 tracking-wider drop-shadow-[0_2px_12px_rgba(255,213,79,0.35)]">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>

            <!-- Main Punchy Headline -->
            <h1
              class="font-jakarta font-extrabold text-white text-4xl sm:text-5xl lg:text-[3.25rem] tracking-tight leading-[1.15] mb-6">
              Mencetak Generasi <span
                class="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 via-amber-200 to-accent-400 drop-shadow-[0_2px_15px_rgba(250,204,21,0.3)]">Qur'ani</span>
              yang Berakhlak Mulia
            </h1>

            <!-- Concise Subtitle (Only 2 Lines!) -->
            <p
              class="text-base sm:text-lg lg:text-xl text-emerald-100/90 leading-relaxed font-inter max-w-xl mx-auto lg:mx-0 mb-10">
              Bimbingan membaca dan menghafal Al-Qur'an metode <strong>At-Tartil</strong> terstandar dengan asatidz yang
              sabar, ramah anak, dan barakah di Sawotratap, Sidoarjo.
            </p>

            <!-- High-Impact Dual CTAs -->
            <div
              class="flex flex-row items-center gap-3 sm:gap-3.5 justify-center lg:justify-start mb-7">
              <!-- Primary: Google Form Registration -->
              <a :href="googleFormUrl" target="_blank" rel="noopener noreferrer"
                class="group relative px-4 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm lg:text-base font-bold text-slate-950 bg-gradient-to-r from-accent-400 via-amber-300 to-accent-400 hover:from-accent-300 hover:to-amber-200 rounded-2xl shadow-[0_10px_25px_-5px_rgba(251,191,36,0.45)] hover:shadow-[0_15px_30px_-5px_rgba(251,191,36,0.6)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0">
                <span class="whitespace-nowrap">Daftar Santri Baru (Google Form)</span>
                <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 shrink-0" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <!-- Secondary: WhatsApp Contact -->
              <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer"
                class="px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm lg:text-base font-semibold bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-md text-white rounded-2xl shadow-sm hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0">
                <svg class="w-4 sm:w-5 h-4 sm:h-5 text-accent-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span class="whitespace-nowrap">Konsultasi WhatsApp</span>
              </a>
            </div>

            <!-- Single Line Trust Badges -->
            <div
              class="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-emerald-100/80 pt-1">
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-accent-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd" />
                </svg>
                <span>Metode At-Tartil</span>
              </span>
              <span class="hidden sm:inline text-white/30">•</span>
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-accent-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd" />
                </svg>
                <span>Ramah Anak & Sabar</span>
              </span>
              <span class="hidden sm:inline text-white/30">•</span>
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-accent-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd" />
                </svg>
                <span>10+ Th Mengabdi</span>
              </span>
            </div>
          </div>

          <!-- Right Column: Seamless Glowing Artwork with Floating Glass Tags (6 cols) -->
          <div class="lg:col-span-6 flex items-center justify-center relative">
            <div class="relative w-full max-w-lg mx-auto flex items-center justify-center">

              <!-- Ambient Glow & Arch Aura -->
              <div
                class="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-800/20 to-amber-400/20 rounded-full blur-2xl pointer-events-none">
              </div>

              <!-- Main Hero Artwork (Seamless & Organic) -->
              <img src="/hero-blended-1.webp" alt="Santri mengaji riang bersama ustadzah di TPQ Amanah" width="560"
                height="420" fetchpriority="high"
                class="relative z-10 w-full h-auto max-h-[460px] object-contain mx-auto drop-shadow-2xl animate-float pointer-events-none" />

              <!-- Floating Glass Badge 1: Top Right (Methodology Status) -->
              <div
                class="absolute top-2 right-2 sm:-right-2 z-20 bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl px-4 py-2 text-white shadow-xl flex items-center gap-2.5 animate-bounce-slow">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <div class="text-left">
                  <p class="text-[10px] text-accent-300 font-bold uppercase tracking-wider">Metode At-Tartil</p>
                  <p class="text-xs font-bold text-white">Bimbingan Terstandar</p>
                </div>
              </div>

              <!-- Floating Glass Badge 2: Bottom Left (Hadits Quote) -->
              <div
                class="absolute bottom-2 left-2 sm:-left-2 z-20 bg-slate-950/50 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-2.5 text-white shadow-2xl text-left max-w-[240px]">
                <p class="text-[11px] font-semibold text-accent-200 italic font-inter leading-snug">
                  "Bersama Al-Qur'an, Membentuk Generasi Berakhlak Mulia"
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      <!-- Wave Transition Separator -->
      <div class="absolute bottom-0 left-0 right-0 leading-[0] z-20 pointer-events-none">
        <svg viewBox="0 0 1440 80" class="block w-full h-10 md:h-16 lg:h-20 fill-slate-50" preserveAspectRatio="none">
          <path
            d="M0,30L80,35C160,40,320,50,480,45C640,40,800,25,960,25C1120,25,1280,40,1360,50L1440,60L1440,80L1360,80C1280,80,1120,80,960,80C800,80,640,80,480,80C320,80,160,80,80,80L0,80Z" />
        </svg>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 2. SECTION KHUSUS: PENDAFTARAN SANTRI BARU -->
    <!-- ================================================================= -->
    <section id="pendaftaran" class="py-20 lg:py-28 bg-slate-50 scroll-mt-32 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <span
            class="inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-wider text-emerald-800 uppercase bg-emerald-50/90 px-4 py-1.5 rounded-full border border-emerald-200/80 shadow-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Penerimaan Santri Baru
          </span>
          <h2
            class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-jakarta text-slate-900 mt-4 mb-4 tracking-tight">
            Pendaftaran Calon Santri &amp; Santriwati Baru
          </h2>
          <p class="text-slate-600 font-inter text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Bergabunglah bersama keluarga besar TPQ AMANAH Sawotratap. Pendaftaran dapat dilakukan langsung melalui
            <strong class="text-slate-900 font-semibold">Formulir Google Docs / Forms Online</strong> atau berkonsultasi
            via WhatsApp bersama asatidz pembimbing.
          </p>
        </div>

        <div class="grid lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <!-- Left: 3-Step Simple Flow (7 cols) -->
          <div
            class="lg:col-span-7 bg-white rounded-3xl p-7 sm:p-10 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div class="flex items-center gap-3">
                  <span
                    class="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-extrabold font-jakarta tracking-wide">
                    3 Langkah
                  </span>
                  <h3 class="font-jakarta font-bold text-xl sm:text-2xl text-slate-900">
                    Alur Mudah Pendaftaran Santri
                  </h3>
                </div>
                <span
                  class="hidden sm:inline-flex text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  Proses Cepat
                </span>
              </div>

              <!-- Symmetrically Centered Stepper -->
              <div class="space-y-7 sm:space-y-8">
                <!-- Step 1 -->
                <div class="flex items-start gap-4 sm:gap-5 relative group">
                  <div class="flex flex-col items-center flex-shrink-0 relative">
                    <div
                      class="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-600 to-emerald-700 text-white flex items-center justify-center text-sm font-black shadow-md shadow-primary-600/20 z-10 ring-4 ring-white">
                      1
                    </div>
                    <div
                      class="w-0.5 bg-gradient-to-b from-primary-400 to-amber-300 absolute top-11 bottom-[-1.75rem] sm:bottom-[-2rem]">
                    </div>
                  </div>
                  <div class="flex-1 pt-0.5">
                    <div class="flex items-center gap-2 mb-1">
                      <span
                        class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        Langkah 1 • Est. 3 Menit
                      </span>
                    </div>
                    <h4 class="font-bold text-slate-900 text-base sm:text-lg font-jakarta mb-1.5">
                      Mengisi Formulir Online (Google Form)
                    </h4>
                    <p class="text-slate-600 text-sm leading-relaxed font-inter mb-2.5">
                      Lengkapi identitas calon santri dan orang tua/wali melalui formulir Google Form pendaftaran
                      resmi TPQ Amanah. Praktis dan dapat diakses dari smartphone maupun laptop kapan saja.
                    </p>
                    <a :href="googleFormUrl" target="_blank" rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4 decoration-primary-300 hover:decoration-primary-600 transition-colors">
                      <span>Buka Formulir Google Form Pendaftaran ↗</span>
                    </a>
                  </div>
                </div>

                <!-- Step 2 -->
                <div class="flex items-start gap-4 sm:gap-5 relative group">
                  <div class="flex flex-col items-center flex-shrink-0 relative">
                    <div
                      class="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center text-sm font-black shadow-md shadow-amber-500/20 z-10 ring-4 ring-white">
                      2
                    </div>
                    <div
                      class="w-0.5 bg-gradient-to-b from-amber-300 to-slate-400 absolute top-11 bottom-[-1.75rem] sm:bottom-[-2rem]">
                    </div>
                  </div>
                  <div class="flex-1 pt-0.5">
                    <div class="flex items-center gap-2 mb-1">
                      <span
                        class="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        Langkah 2 • Verifikasi Cepat
                      </span>
                    </div>
                    <h4 class="font-bold text-slate-900 text-base sm:text-lg font-jakarta mb-1.5">
                      Konfirmasi via WhatsApp Asatidz
                    </h4>
                    <p class="text-slate-600 text-sm leading-relaxed font-inter mb-2">
                      Setelah mengirim formulir, konfirmasikan nama santri Anda ke salah satu asatidz kami (Ustadzah
                      Ella atau Ustadz Riski) agar data segera diverifikasi dan dicatat dalam kuota kelas.
                    </p>
                    <div class="flex flex-wrap gap-2 pt-1">
                      <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-colors">
                        <span>WA Ustadzah Ella ({{ contactElla.phone }}) ↗</span>
                      </a>
                      <a :href="contactRiski.waLink" target="_blank" rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-colors">
                        <span>WA Ustadz Riski ({{ contactRiski.phone }}) ↗</span>
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Step 3 -->
                <div class="flex items-start gap-4 sm:gap-5 relative group">
                  <div class="flex flex-col items-center flex-shrink-0 relative">
                    <div
                      class="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 text-white flex items-center justify-center text-sm font-black shadow-md shadow-slate-700/20 z-10 ring-4 ring-white">
                      3
                    </div>
                  </div>
                  <div class="flex-1 pt-0.5">
                    <div class="flex items-center gap-2 mb-1">
                      <span
                        class="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        Langkah 3 • Siap Mengaji
                      </span>
                    </div>
                    <h4 class="font-bold text-slate-900 text-base sm:text-lg font-jakarta mb-1.5">
                      Pemetaan Jilid &amp; Mulai Mengaji
                    </h4>
                    <p class="text-slate-600 text-sm leading-relaxed font-inter mb-2">
                      Santri baru akan diajak observasi santai untuk penentuan jilid At-Tartil (Jilid 1-6) yang sesuai
                      dan pemilihan
                      sesi belajar (Sesi Sore pukul 15:30 atau Sesi Malam pukul 18:00).
                    </p>
                    <span
                      class="inline-block text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      Metode At-Tartil 6 Jilid • Ramah Anak &amp; Barakah
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Button Strip -->
            <div
              class="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
              <a :href="googleFormUrl" target="_blank" rel="noopener noreferrer"
                class="flex-1 py-3.5 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm text-center shadow-md shadow-primary-600/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group whitespace-nowrap">
                <span class="whitespace-nowrap">Isi Formulir Google Form Sekarang</span>
                <svg class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 shrink-0" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer"
                class="py-3.5 px-5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-sm text-center transition flex items-center justify-center gap-2 whitespace-nowrap">
                <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span class="whitespace-nowrap">Chat Ustadzah Ella</span>
              </a>
            </div>
          </div>

          <!-- Right: Digital Registration Gateway (5 cols) -->
          <div
            class="lg:col-span-5 bg-gradient-to-br from-emerald-900 via-primary-950 to-emerald-950 rounded-3xl p-7 sm:p-9 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden border border-emerald-700/50 group">
            <!-- Ambient Islamic Background & Golden Glow -->
            <div class="absolute inset-0 islamic-pattern opacity-10 pointer-events-none"></div>
            <div class="absolute -top-24 -right-24 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none">
            </div>
            <div
              class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none">
            </div>

            <div class="relative z-10">
              <!-- Top Live Status Row -->
              <div class="flex items-center justify-between gap-2 mb-6">
                <span
                  class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-300 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Pendaftaran Dibuka
                </span>
                <span class="text-xs font-medium text-emerald-200/80">Sawotratap, Sidoarjo</span>
              </div>

              <!-- Headline & Hook -->
              <h4 class="font-jakarta font-bold text-2xl sm:text-[1.7rem] text-white leading-tight mb-3">
                Daftar Santri Baru via <span
                  class="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 via-amber-200 to-accent-400">Google
                  Form</span>
              </h4>
              <p class="text-sm text-emerald-100/90 leading-relaxed font-inter mb-6">
                Daftarkan putra-putri Anda secara langsung, cepat, dan aman melalui dokumen formulir resmi Google Docs /
                Form TPQ Amanah.
              </p>

              <!-- 4 Key Value Prop Cards -->
              <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
                  <div
                    class="w-8 h-8 rounded-xl bg-amber-400/20 text-accent-300 flex items-center justify-center mb-2 text-base font-bold">
                    📝
                  </div>
                  <p class="text-xs font-bold text-white font-jakarta">100% Online</p>
                  <p class="text-[11px] text-emerald-200/80 font-inter">Cukup isi form 3 menit</p>
                </div>

                <div class="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
                  <div
                    class="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center mb-2 text-base font-bold">
                    📖
                  </div>
                  <p class="text-xs font-bold text-white font-jakarta">Metode At-Tartil</p>
                  <p class="text-[11px] text-emerald-200/80 font-inter">Sistematis 6 Jilid</p>
                </div>

                <div class="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
                  <div
                    class="w-8 h-8 rounded-xl bg-sky-400/20 text-sky-300 flex items-center justify-center mb-2 text-base font-bold">
                    🕒
                  </div>
                  <p class="text-xs font-bold text-white font-jakarta">2 Pilihan Sesi</p>
                  <p class="text-[11px] text-emerald-200/80 font-inter">Sore &amp; Malam</p>
                </div>

                <div class="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
                  <div
                    class="w-8 h-8 rounded-xl bg-rose-400/20 text-rose-300 flex items-center justify-center mb-2 text-base font-bold">
                    ✨
                  </div>
                  <p class="text-xs font-bold text-white font-jakarta">Bebas Biaya Form</p>
                  <p class="text-[11px] text-emerald-200/80 font-inter">Gratis pendaftaran awal</p>
                </div>
              </div>
            </div>

            <!-- Main Gateway CTA Button & Contacts -->
            <div class="relative z-10 mt-2 space-y-4 pt-4 border-t border-white/15">
              <a :href="googleFormUrl" target="_blank" rel="noopener noreferrer"
                class="group w-full py-4 px-5 bg-gradient-to-r from-accent-400 via-amber-300 to-accent-400 hover:from-accent-300 hover:to-amber-200 text-slate-950 rounded-2xl font-black text-center transition-all duration-300 shadow-[0_10px_25px_-5px_rgba(251,191,36,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(251,191,36,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2.5 text-sm sm:text-base font-jakarta whitespace-nowrap">
                <svg class="w-5 h-5 text-slate-950 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="whitespace-nowrap">Buka Formulir Google Form ↗</span>
              </a>

              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-xs text-white/90">
                <div class="flex items-center justify-between text-[11px] sm:text-xs mb-1.5">
                  <span class="text-white/70">Butuh bantuan pendaftaran?</span>
                  <span class="text-accent-300 font-bold">Asatidz Pembimbing</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-center">
                  <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer"
                    class="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-emerald-500/30 text-white font-bold text-[11px] border border-white/15 transition-colors flex items-center justify-center gap-1">
                    <span>Ustadzah Ella</span>
                  </a>
                  <a :href="contactRiski.waLink" target="_blank" rel="noopener noreferrer"
                    class="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-emerald-500/30 text-white font-bold text-[11px] border border-white/15 transition-colors flex items-center justify-center gap-1">
                    <span>Ustadz Riski</span>
                  </a>
                </div>
              </div>

              <p class="text-center text-[11px] text-emerald-200/70 font-inter">
                ✓ Tanpa antre • Akses 24 jam via Google Docs Form resmi
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 3. KEUNGGULAN SECTION (4 PILAR PEMBELAJARAN) -->
    <!-- ================================================================= -->
    <section id="keunggulan"
      class="py-20 lg:py-28 bg-white scroll-mt-32 border-y border-slate-200/60 relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <span
            class="text-xs sm:text-sm font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100">
            Keunggulan Lembaga
          </span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-jakarta text-slate-900 mt-4 mb-4">
            Mengapa Mempercayakan Buah Hati di TPQ AMANAH?
          </h2>
          <p class="text-slate-600 font-inter text-base sm:text-lg leading-relaxed">
            Kami memadukan ketulusan dakwah, metode pengajaran yang teruji, dan keteladanan akhlak untuk menghasilkan
            santri yang berprestasi dan berkarakter.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
          <!-- Pilar 1 -->
          <div
            class="bg-slate-50/90 rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div
                class="w-14 h-14 rounded-2xl bg-emerald-100 text-primary-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 class="font-jakarta font-bold text-xl text-slate-900 mb-2.5">Metode At-Tartil Teruji</h3>
              <p class="text-slate-600 text-sm leading-relaxed font-inter">
                Sistematis dari jilid 1 sampai 6 dengan kaidah makhraj dan tajwid praktis yang mudah dicerna dan
                menyenangkan bagi anak.
              </p>
            </div>
            <div
              class="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-primary-700 flex items-center gap-1">
              <span>Kurikulum Terstandar</span> &rarr;
            </div>
          </div>

          <!-- Pilar 2 -->
          <div
            class="bg-slate-50/90 rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div
                class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 class="font-jakarta font-bold text-xl text-slate-900 mb-2.5">Pengajar Penuh Kasih</h3>
              <p class="text-slate-600 text-sm leading-relaxed font-inter">
                Asatidz berpengalaman yang telaten dan sabar, mengedepankan pendekatan personal serta metode <em>fun
                  learning</em> tanpa paksaan.
              </p>
            </div>
            <div
              class="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-amber-700 flex items-center gap-1">
              <span>Bimbingan Hati ke Hati</span> &rarr;
            </div>
          </div>

          <!-- Pilar 3 -->
          <div
            class="bg-slate-50/90 rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div
                class="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 class="font-jakarta font-bold text-xl text-slate-900 mb-2.5">Pembinaan Adab & Doa</h3>
              <p class="text-slate-600 text-sm leading-relaxed font-inter">
                Santri dibiasakan berwudhu benar, shalat tertib, adab santun kepada orang tua, serta menghafal doa-doa
                penting harian.
              </p>
            </div>
            <div
              class="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-rose-700 flex items-center gap-1">
              <span>Akhlakul Karimah</span> &rarr;
            </div>
          </div>

          <!-- Pilar 4 -->
          <div
            class="bg-slate-50/90 rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div
                class="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="font-jakarta font-bold text-xl text-slate-900 mb-2.5">Sistem Transparan & Rapi</h3>
              <p class="text-slate-600 text-sm leading-relaxed font-inter">
                Didukung E-Kitab At-Tartil yang bisa dibaca di HP serta pencatatan presensi dan tabungan santri yang
                amanah dan transparan.
              </p>
            </div>
            <div
              class="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-sky-700 flex items-center gap-1">
              <span>Terintegrasi & Amanah</span> &rarr;
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 4. TENTANG KAMI (SEJARAH, VISI & MISI) -->
    <!-- ================================================================= -->
    <section id="tentang" class="py-20 lg:py-28 bg-slate-50 scroll-mt-32 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <span
            class="text-xs sm:text-sm font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100">
            Profil Lembaga
          </span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-jakarta text-slate-900 mt-4 mb-4">
            Mengenal Lebih Dekat TPQ AMANAH
          </h2>
          <p class="text-slate-600 font-inter text-base sm:text-lg leading-relaxed">
            Berawal dari niat tulus menyebarkan kalam ilahi di Dusun Tratap, Sawotratap, kami terus berikhtiar mencetak
            generasi yang mencintai Al-Qur'an lahir dan batin.
          </p>
        </div>

        <div class="grid lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <!-- Sejarah Card (7 cols) -->
          <div
            class="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-4 mb-8">
                <div
                  class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white flex items-center justify-center shadow-md shadow-primary-600/20 flex-shrink-0">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl sm:text-2xl font-bold font-jakarta text-slate-900">Sejarah Singkat & Dedikasi</h3>
                  <p class="text-xs sm:text-sm text-slate-500 font-inter">Perjalanan mengabdi di jalan Al-Qur'an</p>
                </div>
              </div>

              <!-- Symmetrically Aligned Timeline -->
              <div class="space-y-6 sm:space-y-8 relative">
                <!-- Milestone 1 -->
                <div class="flex items-start gap-4 sm:gap-5 relative group">
                  <div class="flex flex-col items-center flex-shrink-0 relative">
                    <div
                      class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-sm z-10">
                      <svg class="w-4 h-4 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div
                      class="w-0.5 bg-gradient-to-b from-emerald-300 to-amber-300 absolute top-8 bottom-[-1.5rem] sm:bottom-[-2rem]">
                    </div>
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-bold text-slate-900 text-base sm:text-lg font-jakarta mb-1">Awal Mula Pendirian</h4>
                    <p class="text-slate-600 text-sm leading-relaxed font-inter">
                      {{ aboutContent.history || defaultAbout }}
                    </p>
                  </div>
                </div>

                <!-- Milestone 2 -->
                <div class="flex items-start gap-4 sm:gap-5 relative group">
                  <div class="flex flex-col items-center flex-shrink-0 relative">
                    <div
                      class="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-sm z-10">
                      <svg class="w-4 h-4 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div
                      class="w-0.5 bg-gradient-to-b from-amber-300 to-primary-300 absolute top-8 bottom-[-1.5rem] sm:bottom-[-2rem]">
                    </div>
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-bold text-slate-900 text-base sm:text-lg font-jakarta mb-1">Kurikulum At-Tartil
                      Terstandar</h4>
                    <p class="text-slate-600 text-sm leading-relaxed font-inter">
                      Menerapkan metode berjenjang 6 Jilid yang teruji, memadukan kefasihan makharijul huruf, tajwid
                      praktis, dan adab islami.
                    </p>
                  </div>
                </div>

                <!-- Milestone 3 -->
                <div class="flex items-start gap-4 sm:gap-5 relative group">
                  <div class="flex flex-col items-center flex-shrink-0 relative">
                    <div
                      class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-sm z-10">
                      <svg class="w-4 h-4 text-primary-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1 pt-0.5">
                    <h4 class="font-bold text-slate-900 text-base sm:text-lg font-jakarta mb-1">Pusat Belajar yang
                      Nyaman & Strategis</h4>
                    <p class="text-slate-600 text-sm leading-relaxed font-inter">
                      Berlokasi di Jl. Kertanegara No. 20, Dusun Tratap, Sawotratap, Gedangan, Sidoarjo. Suasana belajar
                      bersih, ramah anak, dan barakah.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Trust Highlights Footer -->
            <div
              class="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 font-inter">
              <span class="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                10+ Tahun Mengabdi
              </span>
              <span class="text-slate-600 font-medium">Sawotratap, Sidoarjo</span>
            </div>
          </div>

          <!-- Visi & Misi Cards (5 cols) -->
          <div class="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <!-- Visi Card -->
            <div
              class="bg-gradient-to-br from-emerald-900 to-primary-950 text-white rounded-3xl p-7 sm:p-8 shadow-md relative overflow-hidden flex-1 border border-emerald-800/40">
              <div class="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none">
              </div>

              <div class="relative z-10 flex items-start gap-4 mb-4">
                <div
                  class="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md text-accent-300 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <span
                    class="text-[11px] font-bold uppercase tracking-wider text-accent-300 bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block">
                    Visi Utama
                  </span>
                  <h4 class="text-xl font-bold font-jakarta text-white mt-1.5">Visi Lembaga</h4>
                </div>
              </div>

              <p class="relative z-10 text-emerald-100/90 text-sm sm:text-base leading-relaxed font-inter italic pt-1">
                "{{ aboutContent.vision }}"
              </p>
            </div>

            <!-- Misi Card -->
            <div
              class="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <div class="flex items-start gap-4 mb-4">
                  <div
                    class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span
                      class="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 inline-block">
                      Misi Pendidikan
                    </span>
                    <h4 class="text-xl font-bold font-jakarta text-slate-900 mt-1.5">Misi TPQ Amanah</h4>
                  </div>
                </div>

                <ul class="text-slate-600 text-sm space-y-3 font-inter">
                  <li v-for="(item, idx) in missionList" :key="idx" class="flex items-start gap-3">
                    <span
                      class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">&check;</span>
                    <span class="leading-relaxed">{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 5. STATISTIK CAPAIAN SECTION -->
    <!-- ================================================================= -->
    <section ref="statsRef" class="py-14 bg-gradient-primary relative overflow-hidden text-white">
      <div class="absolute inset-0 islamic-pattern opacity-5 pointer-events-none"></div>

      <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white/95 backdrop-blur-xl border border-white/90 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div
            class="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            <div v-for="stat in stats" :key="stat.label" class="text-center pt-4 lg:pt-0 group">
              <div
                class="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-br from-primary-600 to-primary-900 bg-clip-text text-transparent mb-1 font-jakarta group-hover:scale-105 transition-transform duration-300"
                :data-target="stat.rawValue">
                {{ stat.displayValue }}
              </div>
              <div
                class="w-12 h-1 bg-accent-400 mx-auto mb-2 rounded-full group-hover:w-20 transition-all duration-300">
              </div>
              <div class="text-slate-600 text-xs sm:text-sm font-semibold font-inter">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 6. PROGRAM UNGGULAN -->
    <!-- ================================================================= -->
    <section id="program" class="py-20 lg:py-28 bg-white scroll-mt-32 border-b border-slate-200/60">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <span
            class="text-xs sm:text-sm font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100">
            Kurikulum Terpadu
          </span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-jakarta text-slate-900 mt-4 mb-4">
            Program Pembelajaran Unggulan
          </h2>
          <p class="text-slate-600 font-inter text-base sm:text-lg leading-relaxed">
            Materi komprehensif dirancang agar santri tidak hanya fasih membaca, tetapi juga memahami esensi ibadah dan
            akhlak islami.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
          <!-- Card 1 -->
          <div
            class="bg-slate-50/90 rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div
                class="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Tahap Dasar - Lanjut</span>
              <h3 class="text-xl font-bold text-slate-900 mt-1.5 mb-2.5 font-jakarta">Tahsin & Tajwid Praktis</h3>
              <p class="text-slate-600 text-sm leading-relaxed font-inter">
                Bimbingan melafalkan makharijul huruf dengan fasih, hukum tajwid terpadu, serta lagu tartil yang indah
                dan mudah ditirukan.
              </p>
            </div>
            <div
              class="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 font-inter">
              <span>Metode: At-Tartil 1-6</span>
              <span class="text-primary-600 font-bold">&check; Tiap Hari</span>
            </div>
          </div>

          <!-- Card 2 -->
          <div
            class="bg-slate-50/90 rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div
                class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span class="text-xs font-bold text-amber-700 uppercase tracking-wider">Hafalan Qur'an</span>
              <h3 class="text-xl font-bold text-slate-900 mt-1.5 mb-2.5 font-jakarta">Tahfidzul Qur'an</h3>
              <p class="text-slate-600 text-sm leading-relaxed font-inter">
                Bimbingan menghafal surat-surat pendek (Juz 30) dan ayat pilihan dengan metode sima'i serta muraja'ah
                rutin berjenjang.
              </p>
            </div>
            <div
              class="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 font-inter">
              <span>Target: Juz 'Amma</span>
              <span class="text-amber-600 font-bold">&check; Bertahap</span>
            </div>
          </div>

          <!-- Card 3 -->
          <div
            class="bg-slate-50/90 rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div
                class="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span class="text-xs font-bold text-rose-700 uppercase tracking-wider">Ibadah Praktis</span>
              <h3 class="text-xl font-bold text-slate-900 mt-1.5 mb-2.5 font-jakarta">Praktik Shalat & Doa</h3>
              <p class="text-slate-600 text-sm leading-relaxed font-inter">
                Pembiasaan tata cara berwudhu sempurna, gerakan dan bacaan shalat fardhu, serta hafalan doa keseharian
                anak muslim.
              </p>
            </div>
            <div
              class="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 font-inter">
              <span>Praktik Langsung</span>
              <span class="text-rose-600 font-bold">&check; Berjamaah</span>
            </div>
          </div>

          <!-- Card 4 -->
          <div
            class="bg-slate-50/90 rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div
                class="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <span class="text-xs font-bold text-sky-700 uppercase tracking-wider">Budi Pekerti</span>
              <h3 class="text-xl font-bold text-slate-900 mt-1.5 mb-2.5 font-jakarta">Adab & Sirah Nabawiyah</h3>
              <p class="text-slate-600 text-sm leading-relaxed font-inter">
                Penanaman karakter mulia melalui teladan Rasulullah SAW dan para sahabat, membentuk pribadi santun,
                jujur, dan berbakti.
              </p>
            </div>
            <div
              class="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 font-inter">
              <span>Karakter Islami</span>
              <span class="text-sky-600 font-bold">&check; Teladan</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 7. E-KITAB DIGITAL AT-TARTIL (LUXURY 3D BOOK COVERS) -->
    <!-- ================================================================= -->
    <section id="at-tartil" class="py-20 lg:py-28 bg-slate-50 scroll-mt-32 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <span
            class="text-xs sm:text-sm font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100">
            Inovasi Pembelajaran
          </span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-jakarta text-slate-900 mt-4 mb-4">
            E-Kitab Digital At-Tartil
          </h2>
          <p class="text-slate-600 font-inter text-base sm:text-lg leading-relaxed">
            Materi buku pegangan At-Tartil Jilid 1 sampai 6 dapat diakses secara digital. Memudahkan santri dan orang
            tua menyimak dan mengulang pelajaran di rumah kapan saja.
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 sm:gap-6">
          <div v-for="(book, idx) in tartilBooks" :key="book.jilid"
            class="group bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-primary-400 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-center flex flex-col justify-between">
            <div>
              <!-- 3D Book Visual Element with Real Cover Art -->
              <div class="at-tartil-book mx-auto mb-4 max-w-[135px]">
                <div class="at-tartil-spine" :style="{ background: book.spineBg }"></div>
                <div class="at-tartil-cover bg-slate-100">
                  <img :src="book.coverImage" :alt="'Cover Buku At-Tartil Jilid ' + book.jilid" width="135" height="190"
                    loading="lazy" class="w-full h-full object-cover rounded-r-md select-none" />
                </div>
              </div>

              <h4 class="font-jakarta font-bold text-base text-slate-900 mb-0.5">Jilid {{ book.jilid }}</h4>
              <p class="text-xs text-slate-500 font-inter">{{ book.desc }}</p>
            </div>

            <a href="https://at-tartil.riskiputraalamzah.my.id/" target="_blank" rel="noopener noreferrer"
              class="mt-4 py-2 px-3 bg-slate-50 group-hover:bg-primary-600 group-hover:text-white text-primary-700 text-xs font-bold rounded-xl border border-slate-200 group-hover:border-primary-600 transition-all flex items-center justify-center gap-1 shadow-sm">
              <span>Buka E-Kitab</span> &rarr;
            </a>
          </div>
        </div>

        <div class="mt-12 text-center">
          <a href="https://at-tartil.riskiputraalamzah.my.id/" target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-primary-50 text-primary-800 border border-primary-200 rounded-2xl font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-lg">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Buka Platform E-Kitab At-Tartil ↗</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 8. JADWAL / JAM MENGAJI -->
    <!-- ================================================================= -->
    <section id="jadwal" class="py-20 lg:py-28 bg-white scroll-mt-32 border-b border-slate-200/60">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <span
            class="text-xs sm:text-sm font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100">
            Waktu Belajar
          </span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-jakarta text-slate-900 mt-4 mb-4">
            Jadwal & Sesi Mengaji Santri
          </h2>
          <p class="text-slate-600 font-inter text-base sm:text-lg leading-relaxed">
            Pilihan waktu belajar fleksibel yang dapat disesuaikan dengan agenda sekolah formal putra-putri Anda.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Sesi Sore -->
          <div
            class="bg-gradient-to-br from-amber-50/70 to-white rounded-3xl p-8 sm:p-10 border border-amber-200/80 shadow-md hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-4 mb-6">
                <div
                  class="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span class="text-xs font-bold text-amber-800 bg-amber-100/80 px-3.5 py-1.5 rounded-full">Sesi 1 &bull;
                  Ba'da Ashar</span>
              </div>

              <h3 class="text-2xl font-bold font-jakarta text-slate-900 mb-2">Sesi Sore</h3>
              <p class="text-sm text-slate-600 font-inter mb-6">Cocok untuk santri usia dini (PAUD/TK) & siswa SD</p>

              <div class="space-y-3.5 font-inter">
                <div class="flex items-center gap-3 bg-white p-4 rounded-2xl border border-amber-100">
                  <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-bold text-slate-900 font-jakarta text-lg">15:30 - 17:00 WIB</span>
                </div>
                <div class="flex items-center gap-3 text-slate-600 px-2 text-sm">
                  <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Senin sampai Jumat (5 hari)</span>
                </div>
              </div>
            </div>

            <div class="mt-8 pt-4 border-t border-amber-100 text-xs text-amber-800 font-medium">
              &star; Suasana belajar ceria dan penuh semangat sebelum petang.
            </div>
          </div>

          <!-- Sesi Malam -->
          <div
            class="bg-gradient-to-br from-indigo-50/70 to-white rounded-3xl p-8 sm:p-10 border border-indigo-200/80 shadow-md hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-4 mb-6">
                <div
                  class="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <span class="text-xs font-bold text-indigo-800 bg-indigo-100/80 px-3.5 py-1.5 rounded-full">Sesi 2
                  &bull; Ba'da Maghrib</span>
              </div>

              <h3 class="text-2xl font-bold font-jakarta text-slate-900 mb-2">Sesi Malam</h3>
              <p class="text-sm text-slate-600 font-inter mb-6">Ideal untuk santri yang sekolah full-day atau kelas
                lanjutan</p>

              <div class="space-y-3.5 font-inter">
                <div class="flex items-center gap-3 bg-white p-4 rounded-2xl border border-indigo-100">
                  <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-bold text-slate-900 font-jakarta text-lg">18:00 - 19:30 WIB</span>
                </div>
                <div class="flex items-center gap-3 text-slate-600 px-2 text-sm">
                  <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Senin sampai Jumat (5 hari)</span>
                </div>
              </div>
            </div>

            <div class="mt-8 pt-4 border-t border-indigo-100 text-xs text-indigo-800 font-medium">
              &star; Suasana lebih hening, khusyuk, dan fokus untuk pendalaman ayat.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 9. DEWAN PENGAJAR (ASATIDZ) -->
    <!-- ================================================================= -->
    <section id="pengajar" class="py-20 lg:py-28 bg-slate-50 scroll-mt-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <span
            class="text-xs sm:text-sm font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100">
            Dewan Pengajar
          </span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-jakarta text-slate-900 mt-4 mb-4">
            Ustadz & Ustadzah Pembimbing
          </h2>
          <p class="text-slate-600 font-inter text-base sm:text-lg leading-relaxed">
            Guru-guru yang amanah, berakhlak mulia, dan mendedikasikan ilmunya untuk membentuk generasi Qur'ani yang
            berkarakter.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="teacher in teachers" :key="teacher.id"
            class="bg-white rounded-3xl p-7 text-center border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between">
            <div>
              <!-- Avatar with Ring & WebP Image (Ultra-light ~12KB) -->
              <div class="relative w-28 h-28 mx-auto mb-5">
                <div
                  class="w-full h-full rounded-full overflow-hidden ring-4 ring-emerald-100 group-hover:ring-primary-500 transition-all duration-300 shadow-md">
                  <img v-if="teacher.photoURL" :src="teacher.photoURL" :alt="teacher.name" width="112" height="112"
                    loading="lazy" decoding="async"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div v-else
                    class="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl font-jakarta">
                    {{ getInitials(teacher.name) }}
                  </div>
                </div>
                <div
                  class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent-400 text-slate-950 flex items-center justify-center shadow-sm">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd" />
                  </svg>
                </div>
              </div>

              <span
                class="inline-block text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-100 mb-2.5">
                {{ teacher.badge }}
              </span>

              <h3 class="font-jakarta font-bold text-xl text-slate-900 mb-1">
                {{ teacher.name }}
              </h3>
              <p class="text-xs font-semibold text-accent-700 mb-3.5 font-inter">
                {{ teacher.position }}
              </p>
              <p class="text-slate-600 text-sm font-inter leading-relaxed">
                {{ teacher.bio }}
              </p>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-inter">
              Dedikasi Mengajar Al-Qur'an
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 10. TESTIMONI WALI SANTRI (SOCIAL PROOF) -->
    <!-- ================================================================= -->
    <section class="py-20 lg:py-28 bg-white scroll-mt-32 border-y border-slate-200/60">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <span
            class="text-xs sm:text-sm font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100">
            Amanah & Kepercayaan
          </span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-jakarta text-slate-900 mt-4 mb-4">
            Suara Hati Orang Tua Santri
          </h2>
          <p class="text-slate-600 font-inter text-base sm:text-lg leading-relaxed">
            Pengalaman nyata wali santri mendampingi putra-putrinya berproses bersama TPQ Amanah.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="(testi, idx) in testimonials" :key="idx"
            class="bg-slate-50/90 rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-1 text-amber-400 mb-4">
                <span v-for="s in 5" :key="s">★</span>
              </div>
              <p class="text-slate-700 text-sm sm:text-base leading-relaxed font-inter italic mb-6">
                "{{ testi.comment }}"
              </p>
            </div>
            <div class="pt-5 border-t border-slate-200/60 flex items-center gap-3.5">
              <div
                class="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center font-jakarta text-sm">
                {{ getInitials(testi.name) }}
              </div>
              <div>
                <h4 class="font-bold text-slate-900 text-base font-jakarta">{{ testi.name }}</h4>
                <p class="text-slate-500 text-xs font-inter">{{ testi.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 11. FAQ SECTION (PERTANYAAN UMUM) -->
    <!-- ================================================================= -->
    <section class="py-20 lg:py-28 bg-slate-50 scroll-mt-32">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <span
            class="text-xs sm:text-sm font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100">
            Tanya Jawab
          </span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-jakarta text-slate-900 mt-4 mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p class="text-slate-600 font-inter text-base sm:text-lg">
            Informasi penting seputar pendaftaran santri baru dan sistem belajar di TPQ Amanah.
          </p>
        </div>

        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index"
            class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all">
            <button type="button"
              class="w-full text-left p-6 flex items-center justify-between gap-4 font-jakarta font-bold text-slate-900 text-base hover:text-primary-600 transition-colors"
              @click="toggleFaq(index)">
              <span>{{ faq.q }}</span>
              <span
                class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 shadow-sm transition-transform duration-200"
                :class="{ 'rotate-180 bg-primary-100 text-primary-700': activeFaq === index }">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            <div v-show="activeFaq === index"
              class="px-6 pb-6 text-slate-600 font-inter text-sm leading-relaxed border-t border-slate-100 pt-4">
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 12. KONTAK & LOKASI PETA -->
    <!-- ================================================================= -->
    <section id="kontak" class="py-20 lg:py-28 bg-white scroll-mt-32 border-t border-slate-200/60">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <span
            class="text-xs sm:text-sm font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100">
            Hubungi Kami
          </span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-jakarta text-slate-900 mt-4 mb-4">
            Mari Bersilaturahmi
          </h2>
          <p class="text-slate-600 font-inter text-base sm:text-lg leading-relaxed">
            Pintu kami selalu terbuka untuk konsultasi pendaftaran santri baru atau silaturahmi seputar kegiatan
            belajar.
          </p>
        </div>

        <div class="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <!-- Left: Information Cards & WhatsApp Direct Form (6 cols) -->
          <div class="lg:col-span-6 space-y-6">
            <!-- Contact Details Grid (Matching Poster Contacts) -->
            <div class="grid sm:grid-cols-2 gap-4">
              <!-- Ustadzah Ella -->
              <div class="bg-slate-50/90 rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <div
                  class="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3.5">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <h4 class="font-bold font-jakarta text-slate-900 text-base mb-1">Ustadzah Ella</h4>
                <p class="text-slate-600 text-sm font-inter mb-3">
                  {{ contactElla.phone }}
                </p>
                <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline">
                  <span>Chat WhatsApp</span> &rarr;
                </a>
              </div>

              <!-- Ustadz Riski -->
              <div class="bg-slate-50/90 rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <div
                  class="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3.5">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <h4 class="font-bold font-jakarta text-slate-900 text-base mb-1">Ustadz Riski</h4>
                <p class="text-slate-600 text-sm font-inter mb-3">
                  {{ contactRiski.phone }}
                </p>
                <a :href="contactRiski.waLink" target="_blank" rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline">
                  <span>Chat WhatsApp</span> &rarr;
                </a>
              </div>
            </div>

            <!-- Address Card -->
            <div class="bg-slate-50/90 rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-start gap-4">
              <div
                class="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 class="font-bold font-jakarta text-slate-900 text-base mb-1">Alamat Lembaga</h4>
                <p class="text-slate-600 text-sm leading-relaxed font-inter">
                  Jl. Kertanegara No. 20, Dusun Tratap, Sawotratap, Kec. Gedangan, Kabupaten Sidoarjo, Jawa Timur 61256
                </p>
              </div>
            </div>

            <!-- Direct Google Form Card -->
            <div
              class="bg-gradient-to-r from-emerald-600 to-primary-700 rounded-3xl p-6 sm:p-7 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-5">
              <div>
                <h4 class="font-bold text-base font-jakarta">Formulir Pendaftaran Online</h4>
                <p class="text-xs sm:text-sm text-white/80 font-inter">Isi formulir pendaftaran santri baru kapan saja
                  dari rumah</p>
              </div>
              <a :href="googleFormUrl" target="_blank" rel="noopener noreferrer"
                class="px-5 py-2.5 bg-accent-400 hover:bg-accent-300 text-slate-950 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap shadow transition">
                Isi Google Form ↗
              </a>
            </div>
          </div>

          <!-- Right: Google Maps (Lazy Loaded) (6 cols) -->
          <div ref="mapRef"
            class="lg:col-span-6 bg-slate-50 rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-sm overflow-hidden min-h-[420px] lg:min-h-[500px] flex flex-col">
            <iframe v-if="isMapVisible" :src="mapSrc"
              class="w-full h-full min-h-[400px] lg:min-h-[480px] rounded-2xl border-0" allowfullscreen loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"></iframe>
            <div v-else
              class="w-full h-full min-h-[400px] lg:min-h-[480px] rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <div class="text-center">
                <svg class="w-10 h-10 mx-auto mb-2 text-slate-400 animate-bounce" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p class="text-sm font-medium">Memuat peta lokasi TPQ...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- FLOATING REGISTRATION BUTTON (MOBILE ONLY) -->
    <!-- ================================================================= -->
    <aside aria-label="Aksi Cepat Pendaftaran"
      class="fixed bottom-5 right-5 z-40 lg:hidden flex flex-col gap-2.5 items-end">
      <!-- Floating Google Form CTA -->
      <a :href="googleFormUrl" target="_blank" rel="noopener noreferrer"
        class="flex items-center gap-2 px-4 py-2.5 bg-accent-400 hover:bg-accent-300 text-slate-950 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all text-xs font-bold font-jakarta border border-white/60"
        title="Daftar via Google Form">
        <svg class="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Daftar Google Form</span>
      </a>

      <!-- Floating WhatsApp CTA -->
      <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer"
        class="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl shadow-emerald-600/50 hover:scale-105 active:scale-95 transition-all text-xs font-bold font-jakarta border-2 border-white/40"
        title="Tanya Pendaftaran via WhatsApp">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span>Tanya WA</span>
      </a>
    </aside>

    <FooterComponent />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Lenis from 'lenis'
import NavbarComponent from '@/components/NavbarComponent.vue'
import FooterComponent from '@/components/FooterComponent.vue'
import api from '@/services/api'

// Google Form Official Registration Link
const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeWnJ4biVA-l842Xk21cChVIEGzdB65XiH27w2wtm8Z-ynT6g/viewform?usp=send_form'

// Official Asatidz Contacts (From Registration Poster)
const contactElla = {
  name: 'Ustadzah Ella',
  phone: '0895-3039-7058',
  waLink: 'https://wa.me/6289530397058?text=Assalamu%27alaikum%20Ustadzah%20Ella%2C%20saya%20ingin%20bertanya%20informasi%20pendaftaran%20santri%20baru%20TPQ%20Amanah'
}

const contactRiski = {
  name: 'Ustadz Riski',
  phone: '0822-3336-1877',
  waLink: 'https://wa.me/6282233361877?text=Assalamu%27alaikum%20Ustadz%20Riski%2C%20saya%20ingin%20bertanya%20informasi%20pendaftaran%20santri%20baru%20TPQ%20Amanah'
}

// Google Maps URL
const mapSrc = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d699.4818002710372!2d112.73616627742456!3d-7.368846491983087!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7e4957994e827%3A0x930e5eb7e09fb557!2sJl.%20Kertanegara%20No.20%2C%20Dusun%20Tratap%2C%20Sawotratap%2C%20Kec.%20Gedangan%2C%20Kabupaten%20Sidoarjo%2C%20Jawa%20Timur%2061256%2C%20Indonesia!5e0!3m2!1sid!2sus!4v1770188895319!5m2!1sid!2sus'

// Lazy loading for Google Maps
const mapRef = ref(null)
const isMapVisible = ref(false)
let mapObserver = null

const defaultAbout = 'TPQ AMANAH didirikan dengan tekad suci untuk mencetak generasi Qurani yang tartil membaca, memahami makna dasar, dan mengamalkan akhlak mulia dalam kehidupan sehari-hari.'

const teachers = ref([])
const aboutContent = ref({
  history: '',
  vision: 'Menjadi lembaga pendidikan Al-Qur\'an terdepan yang menghasilkan generasi Qur\'ani berakhlakul karimah, berilmu, dan mandiri.',
  mission: ''
})

const missionList = computed(() => {
  if (aboutContent.value.mission) {
    return aboutContent.value.mission.split('\n').filter(m => m.trim())
  }
  return [
    'Menyelenggarakan pembelajaran membaca Al-Qur\'an metode At-Tartil yang tartil dan menyenangkan.',
    'Menanamkan nilai akidah, akhlak mulia, dan praktik ibadah sejak usia dini.',
    'Membangun lingkungan belajar yang islami, ramah anak, dan penuh kasih sayang.'
  ]
})

// Authentic At-Tartil 3D Books Config matching at-tartil.riskiputraalamzah.my.id
const tartilBooks = [
  {
    jilid: 1,
    desc: 'Huruf Tunggal Hijaiyah & Fathah',
    coverImage: '/tartil/cover1.webp',
    spineBg: 'linear-gradient(to right, #854d0e, #ca8a04)'
  },
  {
    jilid: 2,
    desc: 'Huruf Sambung & Harakat Kasrah/Dhammah',
    coverImage: '/tartil/cover2.webp',
    spineBg: 'linear-gradient(to right, #0369a1, #38bdf8)'
  },
  {
    jilid: 3,
    desc: 'Mad Thobi\'i & Bacaan Panjang',
    coverImage: '/tartil/cover3.webp',
    spineBg: 'linear-gradient(to right, #15803d, #4ade80)'
  },
  {
    jilid: 4,
    desc: 'Tanwin, Sukun & Qolqolah',
    coverImage: '/tartil/cover4.webp',
    spineBg: 'linear-gradient(to right, #be185d, #f472b6)'
  },
  {
    jilid: 5,
    desc: 'Tasydid, Idgham & Ikhfa\'',
    coverImage: '/tartil/cover5.webp',
    spineBg: 'linear-gradient(to right, #c2410c, #fb923c)'
  },
  {
    jilid: 6,
    desc: 'Waqaf, Ayat Gharibah & Tajwid Terpadu',
    coverImage: '/tartil/cover6.webp',
    spineBg: 'linear-gradient(to right, #6b21a8, #c084fc)'
  }
]

// Stats Section with Counter Animation
const statsRef = ref(null)
const hasAnimated = ref(false)

const stats = ref([
  { rawValue: 80, displayValue: '0+', label: 'Santri Aktif' },
  { rawValue: 6, displayValue: '0+', label: 'Ustadz & Ustadzah' },
  { rawValue: 10, displayValue: '0+', label: 'Tahun Pengabdian' },
  { rawValue: 100, displayValue: '0+', label: 'Alumni Khatam' }
])

// Testimoni Data
const testimonials = [
  {
    name: 'Ibu Siti Rahmawati',
    role: 'Wali dari Faiz (Santri Jilid 4)',
    comment: 'Alhamdulillah, perkembangan mengaji Faiz pesat sekali sejak di TPQ Amanah. Sekarang bacaan tajwidnya tertata rapi dan dia selalu bersemangat tiap jam berangkat mengaji. Guru-gurunya sangat sabar.',
  },
  {
    name: 'Bapak Ahmad Fauzi',
    role: 'Wali dari Aisyah (Santri Al-Qur\'an & Tahfidz)',
    comment: 'Ustadz dan ustadzahnya mendidik dengan hati. Aisyah tidak hanya lancar membaca, tapi juga terbiasa shalat tepat waktu dan hafal doa harian di rumah. Kami sangat bersyukur.',
  },
  {
    name: 'Ibu Nurul Hidayati',
    role: 'Wali dari Rayhan (Santri Jilid 2)',
    comment: 'Metode At-Tartil sangat pas untuk anak saya yang awalnya pemalu. Ditambah ada E-Kitab digital di HP, kami di rumah bisa mudah menyimak dan mendampingi belajarnya tanpa bingung.',
  }
]

// FAQ Data & State
const activeFaq = ref(0)
const toggleFaq = (index) => {
  activeFaq.value = activeFaq.value === index ? null : index
}

const faqs = [
  {
    q: 'Berapa usia minimal anak untuk mendaftar di TPQ Amanah?',
    a: 'Pendaftaran terbuka mulai usia 4 tahun (jenjang PAUD/TK) hingga tingkat SD/MI dan SMP. Santri baru akan dikelompokkan sesuai usia dan kemampuan membaca awal.',
  },
  {
    q: 'Bagaimana jika anak belum mengenal huruf hijaiyah sama sekali?',
    a: 'Jangan khawatir, asatidz kami akan membimbing dengan sabar dari tingkat paling dasar (Jilid 1) menggunakan metode At-Tartil yang ramah anak dan tanpa tekanan.',
  },
  {
    q: 'Apakah ada tes seleksi masuk?',
    a: 'Tidak ada tes seleksi gugur. Kami hanya melakukan asesmen penempatan (placement) santai dan bersahabat agar santri ditempatkan pada jilid yang sesuai dengan kemampuannya.',
  },
  {
    q: 'Berapa pilihan waktu mengaji yang tersedia?',
    a: 'Tersedia dua sesi belajar setiap hari Senin hingga Jumat: Sesi Sore (15:30 - 17:00 WIB, Ba\'da Ashar) dan Sesi Malam (18:00 - 19:30 WIB, Ba\'da Maghrib).',
  },
  {
    q: 'Bagaimana cara mendaftar calon santri baru?',
    a: 'Orang tua dapat langsung mengisi Formulir Pendaftaran Google Form melalui tombol di website ini, atau menghubungi Ustadzah Ella (0895-3039-7058) dan Ustadz Riski (0822-3336-1877).',
  }
]

const getInitials = (name) => {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'TP'
}

// Enhanced Scroll with 120px Offset to Never Obscure Section Headers
const scrollTo = (event, selector) => {
  event.preventDefault()
  const element = document.querySelector(selector)
  if (element) {
    const offset = 120 // Header + top margin
    const top = element.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

// 6 Guru with lightweight WebP photos (<15KB each)
const fetchTeachers = async () => {
  teachers.value = [
    {
      id: 1,
      name: 'Ustadz Riski',
      position: 'Kepala Lembaga TPQ',
      bio: 'Berpengalaman membina pendidikan Al-Qur\'an dan tahsin bersanad lebih dari 10 tahun.',
      photoURL: '/guru/riski.webp',
      badge: 'Kepala TPQ'
    },
    {
      id: 2,
      name: 'Ustadzah Aini',
      position: 'Guru Jilid Dasar',
      bio: 'Penuh kesabaran mendampingi santri usia dini dengan metode bermain dan bernyanyi islami.',
      photoURL: '/guru/aini.webp',
      badge: 'Usia Dini'
    },
    {
      id: 3,
      name: 'Ustadzah Ella',
      position: 'Guru Tajwid & Tahsin',
      bio: 'Ahli kaidah tajwid praktis, membimbing pelafalan makharijul huruf santri agar fasih.',
      photoURL: '/guru/ella.webp',
      badge: 'Tajwid & Tahsin'
    },
    {
      id: 4,
      name: 'Ustadzah Annifa',
      position: 'Guru Tahfidz',
      bio: 'Membimbing setoran hafalan Juz 30 dengan teknik mutqin dan muraja\'ah teratur.',
      photoURL: '/guru/annifa.webp',
      badge: 'Tahfidzul Qur\'an'
    },
    {
      id: 5,
      name: 'Ustadzah Febi',
      position: 'Guru Al-Qur\'an Lanjutan',
      bio: 'Mendampingi santri Al-Qur\'an besar agar lancar, tartil, dan memahami tanda waqaf.',
      photoURL: '/guru/febi.webp',
      badge: 'Tartil Lanjutan'
    },
    {
      id: 6,
      name: 'Ustadz Nurul',
      position: 'Pembina Adab & Ibadah',
      bio: 'Membina pembiasaan wudhu, shalat berjamaah, dan akhlakul karimah santri sehari-hari.',
      photoURL: '/guru/nurul.webp',
      badge: 'Adab & Ibadah'
    }
  ]
}

const fetchContent = async () => {
  try {
    const { data } = await api.get('/content/about')
    if (data) {
      aboutContent.value = { ...aboutContent.value, ...data }
    }
  } catch {
    // Fallback to defaultAbout
  }
}

let lenis = null

onMounted(() => {
  // Initialize Lenis Smooth Scroll
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  })

  function raf(time) {
    if (lenis) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
  }

  requestAnimationFrame(raf)

  fetchTeachers()
  fetchContent()

  // Setup IntersectionObserver for lazy loading Google Maps
  if (mapRef.value) {
    mapObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isMapVisible.value = true
          mapObserver?.disconnect()
        }
      })
    }, { rootMargin: '250px' })

    mapObserver.observe(mapRef.value)
  }

  // Setup IntersectionObserver for Stats Counter Animation
  if (statsRef.value) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated.value) {
          hasAnimated.value = true
          animateCounters()
          statsObserver.disconnect()
        }
      })
    }, { threshold: 0.25 })

    statsObserver.observe(statsRef.value)
  }
})

// Counter Animation Function
const animateCounters = () => {
  stats.value.forEach((stat, index) => {
    let current = 0
    const target = stat.rawValue
    const duration = 1800
    const increment = target / (duration / 16)

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        stats.value[index].displayValue = `${target}+`
        clearInterval(timer)
      } else {
        stats.value[index].displayValue = `${Math.floor(current)}+`
      }
    }, 16)
  })
}

onUnmounted(() => {
  if (lenis) {
    lenis.destroy()
    lenis = null
  }
  mapObserver?.disconnect()
})
</script>

<style>
html.lenis,
html.lenis body {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}

.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}

.lenis.lenis-stopped {
  overflow: hidden;
}

.lenis.lenis-scrolling iframe {
  pointer-events: none;
}
</style>

<style scoped>
/* At-Tartil 3D Book Styles */
.at-tartil-book {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4.2;
  perspective: 600px;
  transform-style: preserve-3d;
  transition: transform 0.4s ease;
  will-change: transform;
}

.at-tartil-book:hover {
  transform: rotateY(-10deg) scale(1.05);
}

.at-tartil-spine {
  position: absolute;
  left: 0;
  top: 0;
  width: 8px;
  height: 100%;
  border-radius: 4px 0 0 4px;
  box-shadow: -2px 0 6px rgba(0, 0, 0, 0.3);
}

.at-tartil-cover {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 0 6px 6px 0;
  overflow: hidden;
  box-shadow: 4px 4px 14px rgba(0, 0, 0, 0.25);
  transition: box-shadow 0.3s ease;
}

.at-tartil-book:hover .at-tartil-cover {
  box-shadow: 6px 8px 24px rgba(0, 0, 0, 0.35), 0 0 25px rgba(250, 204, 21, 0.25);
}
</style>
