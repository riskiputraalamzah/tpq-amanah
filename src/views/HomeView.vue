<template>
  <div class="min-h-screen bg-[#fafaf9] text-slate-800 font-sans selection:bg-emerald-600 selection:text-white">
    <NavbarComponent />

    <!-- ================================================================= -->
    <!-- 1. HERO SECTION (MAJESTIC, PROPORTIONAL & BALANCED)               -->
    <!-- ================================================================= -->
    <!-- ================================================================= -->
    <!-- 1. HERO SECTION (MAJESTIC, LUMINOUS & ORGANIC)                    -->
    <!-- ================================================================= -->
    <section id="beranda"
      class="relative bg-gradient-to-b from-[#03291d] via-[#053d2c] to-[#03261a] text-white pt-32 pb-20 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28 overflow-hidden">
      <!-- Islamic Arabesque Geometric Texture -->
      <div class="absolute inset-0 islamic-pattern opacity-[0.05] pointer-events-none"></div>

      <!-- Golden & Emerald Ambient Lighting -->
      <div class="absolute -top-20 left-10 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">

          <!-- Left Column: Copywriting & High-Trust Credibility (7 cols) -->
          <div class="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
            
            <!-- Sacred Pill Badge -->
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-100 text-xs sm:text-sm font-medium mb-5 backdrop-blur-md shadow-sm">
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Penerimaan Santri Baru • TPQ Amanah</span>
            </div>

            <!-- Bismillah Calligraphy -->
            <p class="font-arabic text-2xl sm:text-3xl lg:text-4xl text-amber-300 mb-3 select-none tracking-wide drop-shadow-sm">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>

            <!-- Main Proportional Headline -->
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.2] mb-5">
              Mencetak Generasi Qur'ani <br class="hidden sm:inline" />
              <span class="text-amber-300">yang Berakhlak Mulia</span>
            </h1>

            <!-- Balanced Subtitle -->
            <p class="text-sm sm:text-base lg:text-lg text-emerald-100/90 leading-relaxed max-w-xl mb-8 font-normal">
              Bimbingan membaca dan menghafal Al-Qur'an terpadu kurikulum <strong class="text-white font-semibold">Metode At-Tartil 6 Jilid</strong>. Diasuh oleh asatidz bersanad yang telaten, sabar, dan ramah anak di Sawotratap, Sidoarjo.
            </p>

            <!-- Dual Action CTAs -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto mb-10">
              <!-- Primary: Google Form Registration -->
              <a :href="googleFormUrl" target="_blank" rel="noopener noreferrer"
                class="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(251,191,36,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(251,191,36,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
                <span>Daftar Santri Baru (Google Form)</span>
                <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 shrink-0" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <!-- Secondary: WhatsApp Consultation -->
              <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 text-sm sm:text-base font-semibold bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
                <svg class="w-5 h-5 text-emerald-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                <span>Konsultasi WhatsApp</span>
              </a>
            </div>

            <!-- 3 Grounded High-Trust Stat Indicators (Symmetric & Proportional) -->
            <div class="w-full max-w-lg pt-6 border-t border-white/15 grid grid-cols-3 gap-3 sm:gap-6 text-center lg:text-left">
              <div>
                <div class="text-xl sm:text-2xl font-extrabold text-amber-300 tracking-tight">6 Jilid</div>
                <div class="text-xs text-emerald-200/85 font-medium mt-0.5">At-Tartil Terstandar</div>
              </div>
              <div class="border-x border-white/15 px-2 sm:px-4">
                <div class="text-xl sm:text-2xl font-extrabold text-amber-300 tracking-tight">2 Sesi</div>
                <div class="text-xs text-emerald-200/85 font-medium mt-0.5">Sore &amp; Ba'da Maghrib</div>
              </div>
              <div>
                <div class="text-xl sm:text-2xl font-extrabold text-amber-300 tracking-tight">10+ Th</div>
                <div class="text-xs text-emerald-200/85 font-medium mt-0.5">Amanah Membina</div>
              </div>
            </div>

          </div>

          <!-- Right Column: Pure Organic Artwork with Luminous Radiance (5 cols) -->
          <div class="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div class="relative w-full max-w-lg mx-auto flex flex-col items-center">
              
              <!-- Radiant Warm Light Behind Illustration -->
              <div class="absolute inset-0 bg-gradient-to-t from-amber-400/25 via-emerald-400/20 to-transparent rounded-full blur-3xl pointer-events-none scale-105"></div>

              <!-- Main Hero Artwork (Free, Organic, Seamless) -->
              <img src="/hero-blended-1.webp" alt="Santri mengaji riang bersama ustadzah di TPQ Amanah"
                width="480" height="420" fetchpriority="high"
                class="relative z-10 w-full h-auto max-h-[420px] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] select-none pointer-events-none" />

              <!-- Refined Centered Hadits Ribbon Below Artwork -->
              <div class="relative z-10 mt-3 px-5 py-2.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/15 text-center shadow-lg max-w-sm">
                <p class="text-xs text-amber-200/95 font-medium italic leading-snug">
                  "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya."
                </p>
                <p class="text-[10px] text-emerald-300/80 mt-0.5 font-normal">(HR. Bukhari No. 5027)</p>
              </div>

            </div>
          </div>

        </div>
      </div>

      <!-- Subtle Wave Transition into Content -->
      <div class="absolute bottom-0 left-0 right-0 leading-[0] z-10 pointer-events-none">
        <svg viewBox="0 0 1440 48" class="block w-full h-6 sm:h-8 lg:h-10 fill-[#fafaf9]" preserveAspectRatio="none">
          <path d="M0,20 C360,40 1080,0 1440,24 L1440,48 L0,48 Z" />
        </svg>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 2. EEAT TRUST HIGHLIGHT BAR (INSTITUTIONAL INTEGRITY)             -->
    <!-- ================================================================= -->
    <section id="keunggulan" class="bg-white border-b border-slate-200/80 py-8 sm:py-10 shadow-xs relative z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-slate-900 leading-snug">Metode 6 Jilid Terpadu</h3>
              <p class="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">Tahap belajar makhraj &amp; tajwid terstruktur rapi.</p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100 shadow-xs">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-slate-900 leading-snug">Asatidz Telaten &amp; Ramah</h3>
              <p class="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">Pendekatan ramah anak tanpa kekerasan verbal.</p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100 shadow-xs">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-slate-900 leading-snug">Buku Prestasi &amp; E-Kitab</h3>
              <p class="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">Capaian santri tercatat dan terpantau orang tua.</p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-slate-900 leading-snug">Pusat Belajar Kondusif</h3>
              <p class="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">Jl. Kertanegara 20, Sawotratap, Gedangan.</p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 3. SECTION PENDAFTARAN SANTRI BARU (CLEAN, FRICTIONLESS)          -->
    <!-- ================================================================= -->
    <section id="pendaftaran" class="py-20 lg:py-28 bg-[#fafaf9] scroll-mt-28 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Section Header -->
        <div class="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100/70 px-4 py-1.5 rounded-full border border-emerald-200/80 mb-4">
            <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
            Penerimaan Santri Baru (PSB)
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Alur Pendaftaran Calon Santri &amp; Santriwati
          </h2>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed">
            Pendaftaran santri baru dapat diselesaikan secara mudah dari rumah melalui <strong class="text-slate-900 font-semibold">Formulir Google Form Resmi</strong> atau berkonsultasi langsung via WhatsApp dengan asatidz koordinator.
          </p>
        </div>

        <div class="grid lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          <!-- Left: 3-Step Clear Journey (Col 7) -->
          <div class="lg:col-span-7 bg-white rounded-3xl p-7 sm:p-10 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-6 mb-7 border-b border-slate-100">
                <div>
                  <h3 class="font-bold text-xl sm:text-2xl text-slate-900">3 Langkah Mudah Mendaftar</h3>
                  <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Panduan pendaftaran santri baru TPQ Amanah</p>
                </div>
                <span class="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  Estimasi 3 Menit
                </span>
              </div>

              <!-- Steps List -->
              <div class="space-y-7">
                <!-- Step 1 -->
                <div class="flex items-start gap-4 sm:gap-5 relative">
                  <div class="flex flex-col items-center shrink-0">
                    <div class="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-700/20 ring-4 ring-emerald-50">
                      1
                    </div>
                    <div class="w-0.5 bg-slate-200 h-14 mt-2"></div>
                  </div>
                  <div class="flex-1 pt-0.5">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        Langkah Pertama
                      </span>
                    </div>
                    <h4 class="font-bold text-slate-900 text-base sm:text-lg mb-1">
                      Mengisi Formulir Online (Google Form)
                    </h4>
                    <p class="text-slate-600 text-sm leading-relaxed mb-2.5">
                      Lengkapi data identitas calon santri dan orang tua/wali melalui formulir resmi Google Form TPQ Amanah. Praktis dan dapat diakses dari smartphone.
                    </p>
                    <a :href="googleFormUrl" target="_blank" rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-4 decoration-emerald-300 hover:decoration-emerald-700 transition-colors">
                      <span>Buka Formulir Google Form Pendaftaran ↗</span>
                    </a>
                  </div>
                </div>

                <!-- Step 2 -->
                <div class="flex items-start gap-4 sm:gap-5 relative">
                  <div class="flex flex-col items-center shrink-0">
                    <div class="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-md shadow-amber-500/20 ring-4 ring-amber-50">
                      2
                    </div>
                    <div class="w-0.5 bg-slate-200 h-14 mt-2"></div>
                  </div>
                  <div class="flex-1 pt-0.5">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                        Langkah Kedua
                      </span>
                    </div>
                    <h4 class="font-bold text-slate-900 text-base sm:text-lg mb-1">
                      Konfirmasi WhatsApp &amp; Pemilihan Sesi
                    </h4>
                    <p class="text-slate-600 text-sm leading-relaxed mb-2.5">
                      Kirimkan konfirmasi nama santri via WhatsApp ke koordinator kami untuk pencatatan kuota kelas dan penyesuaian jadwal (Sesi Sore 15:30 atau Sesi Malam 18:00).
                    </p>
                    <div class="flex flex-wrap gap-2">
                      <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors">
                        <span>WA Ustadzah Ella ({{ contactElla.phone }}) ↗</span>
                      </a>
                      <a :href="contactRiski.waLink" target="_blank" rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors">
                        <span>WA Ustadz Riski ({{ contactRiski.phone }}) ↗</span>
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Step 3 -->
                <div class="flex items-start gap-4 sm:gap-5">
                  <div class="flex flex-col items-center shrink-0">
                    <div class="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-slate-100">
                      3
                    </div>
                  </div>
                  <div class="flex-1 pt-0.5">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Langkah Ketiga
                      </span>
                    </div>
                    <h4 class="font-bold text-slate-900 text-base sm:text-lg mb-1">
                      Pemetaan Jilid Ramah Anak &amp; Masuk Kelas
                    </h4>
                    <p class="text-slate-600 text-sm leading-relaxed">
                      Calon santri diajak berbincang santai untuk penempatan jilid At-Tartil yang tepat (Jilid 1-6). Tanpa tes yang menegangkan, suasana dibuat nyaman dan ceria sejak hari pertama.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Note -->
            <div class="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span class="font-medium text-emerald-800 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                Penerimaan Terbuka untuk Usia 4 Tahun s/d SMP
              </span>
              <span>Terbuka Setiap Hari Kerja</span>
            </div>
          </div>

          <!-- Right: Registration Hub Card (Col 5) -->
          <div class="lg:col-span-5 bg-gradient-to-br from-[#063f2e] via-[#094d39] to-[#042d21] text-white rounded-3xl p-7 sm:p-9 shadow-xl border border-emerald-700/60 flex flex-col justify-between relative overflow-hidden">
            <!-- Subtle Arabesque Texture -->
            <div class="absolute inset-0 islamic-pattern opacity-[0.08] pointer-events-none"></div>

            <div class="relative z-10">
              <div class="flex items-center justify-between gap-2 mb-5">
                <span class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-3.5 py-1 rounded-full border border-white/15">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Pendaftaran Dibuka
                </span>
                <span class="text-xs text-emerald-200/80 font-medium">Sawotratap, Sidoarjo</span>
              </div>

              <h3 class="text-2xl sm:text-[1.65rem] font-bold text-white tracking-tight leading-tight mb-3">
                Daftar Mandiri via Formulir Online Resmi
              </h3>
              <p class="text-emerald-100/85 text-sm leading-relaxed mb-6 font-normal">
                Daftarkan putra-putri Anda tanpa antre secara aman melalui lembar formulir Google Form pendaftaran TPQ Amanah.
              </p>

              <!-- 4 Feature Badges -->
              <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-white/10 rounded-2xl p-3.5 border border-white/10">
                  <p class="text-xs font-bold text-white mb-0.5">100% Praktis</p>
                  <p class="text-[11px] text-emerald-200/80">Cukup isi 3 menit dari HP</p>
                </div>
                <div class="bg-white/10 rounded-2xl p-3.5 border border-white/10">
                  <p class="text-xs font-bold text-white mb-0.5">Metode At-Tartil</p>
                  <p class="text-[11px] text-emerald-200/80">Kurikulum 6 Jilid terarah</p>
                </div>
                <div class="bg-white/10 rounded-2xl p-3.5 border border-white/10">
                  <p class="text-xs font-bold text-white mb-0.5">2 Pilihan Sesi</p>
                  <p class="text-[11px] text-emerald-200/80">Sore (15:30) &amp; Malam (18:00)</p>
                </div>
                <div class="bg-white/10 rounded-2xl p-3.5 border border-white/10">
                  <p class="text-xs font-bold text-white mb-0.5">Bebas Biaya Form</p>
                  <p class="text-[11px] text-emerald-200/80">Tanpa pungutan formulir awal</p>
                </div>
              </div>
            </div>

            <!-- Launcher Button & Fast Contact -->
            <div class="relative z-10 pt-5 border-t border-white/15 space-y-3.5">
              <a :href="googleFormUrl" target="_blank" rel="noopener noreferrer"
                class="w-full py-3.5 px-5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 rounded-xl font-extrabold text-sm text-center shadow-lg shadow-amber-400/20 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap">
                <svg class="w-4 h-4 text-slate-950 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Buka Formulir Google Form ↗</span>
              </a>

              <div class="bg-white/10 rounded-xl p-3 border border-white/15">
                <div class="flex items-center justify-between text-xs mb-2">
                  <span class="text-white/80">Butuh bantuan pendaftaran?</span>
                  <span class="text-amber-300 font-bold">Asatidz Pendamping</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-center">
                  <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer"
                    class="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-emerald-500/30 text-white font-bold text-xs border border-white/15 transition-colors">
                    WA Ustadzah Ella
                  </a>
                  <a :href="contactRiski.waLink" target="_blank" rel="noopener noreferrer"
                    class="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-emerald-500/30 text-white font-bold text-xs border border-white/15 transition-colors">
                    WA Ustadz Riski
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 4. KEUNGGULAN LEMBAGA (WHY TPQ AMANAH - EEAT EXPERTISE & TRUST)    -->
    <!-- ================================================================= -->
    <section id="keunggulan" class="py-20 lg:py-28 bg-white border-y border-slate-200/80 scroll-mt-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 mb-4">
            Komitmen Pendidikan
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Mengapa Mempercayakan Buah Hati di TPQ AMANAH?
          </h2>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed">
            Kami mengintegrasikan kurikulum teruji, keteladanan akhlak para asatidz, dan lingkungan ramah anak agar setiap santri bertumbuh mencintai kalamullah secara alami.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
          
          <!-- Pilar 1 -->
          <div class="bg-[#fafaf9] rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5 font-bold">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 class="font-bold text-lg text-slate-900 mb-2">Metode At-Tartil 6 Jilid</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Pembelajaran berjenjang dari makharijul huruf dasar, tajwid aplikatif, hingga bacaan tartil Al-Qur'an secara sistematis dan mudah dicerna anak.
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-slate-200/80 text-xs font-semibold text-emerald-800 flex items-center gap-1">
              <span>Kurikulum Terstandar</span> &rarr;
            </div>
          </div>

          <!-- Pilar 2 -->
          <div class="bg-[#fafaf9] rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-5 font-bold">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="font-bold text-lg text-slate-900 mb-2">Pendidik Sabar &amp; Penuh Kasih</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Asatidz berpengalaman yang telaten mendampingi tiap santri sesuai karakternya, menggunakan pendekatan positif tanpa bentakan.
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-slate-200/80 text-xs font-semibold text-amber-800 flex items-center gap-1">
              <span>Bimbingan Hati ke Hati</span> &rarr;
            </div>
          </div>

          <!-- Pilar 3 -->
          <div class="bg-[#fafaf9] rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mb-5 font-bold">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 class="font-bold text-lg text-slate-900 mb-2">Adab &amp; Praktik Ibadah</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Pembiasaan tata cara wudhu yang sah, gerakan shalat tertib, hafalan doa harian, serta adab santun kepada orang tua dan guru.
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-slate-200/80 text-xs font-semibold text-rose-800 flex items-center gap-1">
              <span>Akhlakul Karimah</span> &rarr;
            </div>
          </div>

          <!-- Pilar 4 -->
          <div class="bg-[#fafaf9] rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center mb-5 font-bold">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 class="font-bold text-lg text-slate-900 mb-2">Transparan &amp; Digital Terpadu</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Kemajuan bacaan dicatat di Buku Prestasi Santri, didukung akses E-Kitab digital resmi yang dapat dibaca di rumah kapan saja.
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-slate-200/80 text-xs font-semibold text-sky-800 flex items-center gap-1">
              <span>Amanah &amp; Terukur</span> &rarr;
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 5. KURIKULUM BERJENJANG AT-TARTIL (PEDAGOGICAL JOURNEY - EEAT)    -->
    <!-- ================================================================= -->
    <section id="program" class="py-20 lg:py-28 bg-[#fafaf9] scroll-mt-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100/70 px-4 py-1.5 rounded-full border border-emerald-200/80 mb-4">
            Program Unggulan TPQ Amanah
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Tahapan Kurikulum 6 Jilid At-Tartil
          </h2>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed">
            Metode pembelajaran Al-Qur'an teruji yang disusun secara berjenjang dari pengenalan abjad hijaiyah hingga fasih membaca Al-Qur'an 30 Juz.
          </p>
        </div>

        <!-- 6 Jilid Curriculum Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          <!-- Jilid 1 -->
          <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-4">
                <span class="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-extrabold">
                  Jilid 1
                </span>
                <span class="text-xs text-slate-600">Dasar Hijaiyah</span>
              </div>
              <h3 class="font-bold text-slate-900 text-lg mb-2">Huruf Tunggal Hijaiyah &amp; Fathah</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Mengenal dan melafalkan huruf hijaiyah alif sampai ya' dengan tepat sesuai makharijul huruf serta pelafalan harakat fathah secara tegas dan tidak tergesa-gesa.
              </p>
            </div>
            <div class="mt-5 pt-3.5 border-t border-slate-100 text-xs text-slate-500 font-medium">
              Target: Fasih membedakan bentuk &amp; bunyi huruf tunggal
            </div>
          </div>

          <!-- Jilid 2 -->
          <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-4">
                <span class="px-3 py-1 rounded-xl bg-sky-100 text-sky-900 text-xs font-extrabold">
                  Jilid 2
                </span>
                <span class="text-xs text-slate-600">Rangkaian Huruf</span>
              </div>
              <h3 class="font-bold text-slate-900 text-lg mb-2">Huruf Sambung &amp; Kasrah/Dhammah</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Memahami perubahan bentuk huruf saat berada di awal, tengah, dan akhir kata serta melafalkan harakat kasrah (-i) dan dhammah (-u) secara presisi.
              </p>
            </div>
            <div class="mt-5 pt-3.5 border-t border-slate-100 text-xs text-slate-500 font-medium">
              Target: Lancar membaca 3-4 huruf yang bersambung
            </div>
          </div>

          <!-- Jilid 3 -->
          <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-4">
                <span class="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-extrabold">
                  Jilid 3
                </span>
                <span class="text-xs text-slate-600">Mad Thabi'i</span>
              </div>
              <h3 class="font-bold text-slate-900 text-lg mb-2">Kaidah Mad &amp; Bacaan Panjang</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Menanamkan kepekaan ritme panjang-pendek bacaan (2 harakat) dengan bantuan alif, ya' sukun, dan wawu sukun, menghindari kesalahan memanjangkan bacaan pendek.
              </p>
            </div>
            <div class="mt-5 pt-3.5 border-t border-slate-100 text-xs text-slate-500 font-medium">
              Target: Konsistensi ayunan ketukan 2 harakat
            </div>
          </div>

          <!-- Jilid 4 -->
          <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-4">
                <span class="px-3 py-1 rounded-xl bg-rose-100 text-rose-900 text-xs font-extrabold">
                  Jilid 4
                </span>
                <span class="text-xs text-slate-600">Tanwin &amp; Sukun</span>
              </div>
              <h3 class="font-bold text-slate-900 text-lg mb-2">Tanwin, Sukun, &amp; Kaidah Qolqolah</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Membaca tanda tanwin (an, in, un), mematikan huruf (sukun), serta memantulkan 5 huruf qolqolah (ba, jim, dal, tha, qaf) dengan pantulan jernih.
              </p>
            </div>
            <div class="mt-5 pt-3.5 border-t border-slate-100 text-xs text-slate-500 font-medium">
              Target: Penguasaan huruf mati &amp; qolqolah sempurna
            </div>
          </div>

          <!-- Jilid 5 -->
          <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-4">
                <span class="px-3 py-1 rounded-xl bg-orange-100 text-orange-900 text-xs font-extrabold">
                  Jilid 5
                </span>
                <span class="text-xs text-slate-600">Tajwid Aplikatif</span>
              </div>
              <h3 class="font-bold text-slate-900 text-lg mb-2">Tasydid, Idgham, &amp; Dengung (Ghunnah)</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Menerapkan hukum bacaan tasydid, idgham bighunnah/bilaghunnah, ikhfa', dan iqlab secara alami melalui ketukan lagu tartil tanpa beban hafalan rumus rumit.
              </p>
            </div>
            <div class="mt-5 pt-3.5 border-t border-slate-100 text-xs text-slate-500 font-medium">
              Target: Kesempurnaan dengung (ghunnah) 2 harakat
            </div>
          </div>

          <!-- Jilid 6 -->
          <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-4">
                <span class="px-3 py-1 rounded-xl bg-purple-100 text-purple-900 text-xs font-extrabold">
                  Jilid 6
                </span>
                <span class="text-xs text-slate-600">Al-Qur'an Ready</span>
              </div>
              <h3 class="font-bold text-slate-900 text-lg mb-2">Tanda Waqaf &amp; Ayat Gharibah</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Mengenal cara berhenti (waqaf), hukum mad wajib/jaiz, bacaan khusus (gharib), dan transisi membaca Al-Qur'an mushaf standar dengan tartil.
              </p>
            </div>
            <div class="mt-5 pt-3.5 border-t border-slate-100 text-xs text-slate-500 font-medium">
              Target: Siap masuk Al-Qur'an besar &amp; tahfidz
            </div>
          </div>

        </div>

        <!-- Additional Complementary Programs -->
        <div class="bg-gradient-to-br from-[#063f2e] via-[#094d39] to-[#042d21] text-white rounded-3xl p-8 sm:p-10 border border-emerald-700/60 shadow-md">
          <div class="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div>
              <div class="w-10 h-10 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h3 class="font-bold text-lg text-white mb-1.5">Al-Qur'an &amp; Tahsin Lanjutan</h3>
              <p class="text-sm text-emerald-100/80 leading-relaxed font-normal">
                Bimbingan membaca mushaf Al-Qur'an besar secara individual (sorogan) dengan pendalaman makhraj dan tartil bersanad.
              </p>
            </div>

            <div>
              <div class="w-10 h-10 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h3 class="font-bold text-lg text-white mb-1.5">Tahfidzul Qur'an (Juz 'Amma)</h3>
              <p class="text-sm text-emerald-100/80 leading-relaxed font-normal">
                Hafalan surat-surat pendek Juz 30 dan ayat pilihan melalui metode sima'i dan muraja'ah rutin berjenjang.
              </p>
            </div>

            <div>
              <div class="w-10 h-10 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h3 class="font-bold text-lg text-white mb-1.5">Praktik Shalat &amp; Doa Harian</h3>
              <p class="text-sm text-emerald-100/80 leading-relaxed font-normal">
                Praktik langsung wudhu sempurna, shalat berjamaah, hafalan doa keseharian anak muslim, dan sirah keteladanan Nabi.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 6. E-KITAB DIGITAL AT-TARTIL SHOWCASE                             -->
    <!-- ================================================================= -->
    <section id="at-tartil" class="py-20 lg:py-28 bg-white border-b border-slate-200/80 scroll-mt-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 mb-4">
            Inovasi Digital TPQ Amanah
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            E-Kitab Digital At-Tartil 6 Jilid
          </h2>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed">
            Materi buku pegangan At-Tartil Jilid 1 sampai 6 dapat diakses secara digital. Memudahkan orang tua mendampingi ananda mengulang bacaan di rumah kapan saja.
          </p>
        </div>

        <!-- 3D Luxury Bookshelf -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 sm:gap-6">
          <div v-for="book in tartilBooks" :key="book.jilid"
            class="group bg-[#fafaf9] rounded-3xl p-5 border border-slate-200/90 hover:border-emerald-500 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center flex flex-col justify-between">
            <div>
              <!-- 3D Book Cover -->
              <div class="at-tartil-book mx-auto mb-4 max-w-[130px]">
                <div class="at-tartil-spine" :style="{ background: book.spineBg }"></div>
                <div class="at-tartil-cover bg-slate-100">
                  <img :src="book.coverImage" :alt="'Cover Buku At-Tartil Jilid ' + book.jilid" width="130" height="185"
                    loading="lazy" class="w-full h-full object-cover rounded-r-md select-none" />
                </div>
              </div>

              <h3 class="font-bold text-base text-slate-900 mb-0.5">Jilid {{ book.jilid }}</h3>
              <p class="text-xs text-slate-500 leading-snug">{{ book.desc }}</p>
            </div>

            <a href="https://at-tartil.tpqamanahsawotratap.com/" target="_blank" rel="noopener noreferrer"
              class="mt-4 py-2 px-3 bg-white group-hover:bg-emerald-700 group-hover:text-white text-emerald-800 text-xs font-bold rounded-xl border border-slate-200 group-hover:border-emerald-700 transition-all flex items-center justify-center gap-1 shadow-xs">
              <span>Buka E-Kitab</span> &rarr;
            </a>
          </div>
        </div>

        <div class="mt-12 text-center">
          <a href="https://at-tartil.tpqamanahsawotratap.com/" target="_blank" rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl font-bold text-sm sm:text-base transition-all shadow-xs hover:shadow-md">
            <svg class="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Buka Web Reader At-Tartil (Digital Platform) ↗</span>
          </a>
        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 7. RUTINITAS 90 MENIT (EXPERIENCE: "A DAY IN THE LIFE OF A SANTRI")-->
    <!-- ================================================================= -->
    <section class="py-20 lg:py-28 bg-[#fafaf9] scroll-mt-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100/70 px-4 py-1.5 rounded-full border border-emerald-200/80 mb-4">
            Pengalaman Belajar Santri
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Rutinitas 90 Menit Sesi Belajar yang Terarah
          </h2>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed">
            Setiap pertemuan berdurasi 90 menit disusun secara terstruktur sehingga anak tidak hanya belajar membaca, tetapi juga melatih hafalan, konsentrasi, dan adab.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Phase 1 -->
          <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs relative">
            <span class="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 inline-block mb-4">
              Menit 00 - 15
            </span>
            <h3 class="font-bold text-slate-900 text-lg mb-2">Pembukaan &amp; Doa Klasikal</h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              Membuka sesi dengan ikrar santri, membaca Asmaul Husna, membaca surat Al-Fatihah, dan pembacaan bersama surat pendek pilihan.
            </p>
          </div>

          <!-- Phase 2 -->
          <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs relative">
            <span class="text-xs font-extrabold text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 inline-block mb-4">
              Menit 15 - 60
            </span>
            <h3 class="font-bold text-slate-900 text-lg mb-2">Bimbingan Privat (Sorogan)</h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              Setiap santri maju secara individual ke hadapan ustadz/ustadzah untuk membaca jilid atau Al-Qur'an dengan evaluasi tajwid dan makhraj perorangan.
            </p>
          </div>

          <!-- Phase 3 -->
          <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs relative">
            <span class="text-xs font-extrabold text-sky-900 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200 inline-block mb-4">
              Menit 60 - 80
            </span>
            <h3 class="font-bold text-slate-900 text-lg mb-2">Hafalan &amp; Praktik Ibadah</h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              Setoran surat pendek Juz 'Amma, mengulang doa-doa harian, bimbingan gerakan shalat fardhu, dan pembacaan kisah teladan nabi.
            </p>
          </div>

          <!-- Phase 4 -->
          <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs relative">
            <span class="text-xs font-extrabold text-purple-900 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 inline-block mb-4">
              Menit 80 - 90
            </span>
            <h3 class="font-bold text-slate-900 text-lg mb-2">Buku Prestasi &amp; Penutup</h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              Pencatatan halaman capaian di Buku Prestasi Santri, pesan motivasi akhlak mulia oleh guru, dan doa kafaratul majlis bersama.
            </p>
          </div>

        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 8. TENTANG KAMI & STATISTIK CAPAIAN (AUTHORITATIVENESS & HISTORY) -->
    <!-- ================================================================= -->
    <section id="tentang" class="py-20 lg:py-28 bg-white border-y border-slate-200/80 scroll-mt-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 mb-4">
            Profil Lembaga
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Dedikasi Dakwah &amp; Pendidikan di Sawotratap
          </h2>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed">
            Berawal dari cita-cita luhur menyebarkan syiar kalam ilahi di Dusun Tratap, TPQ AMANAH terus istiqamah membina tunas bangsa agar kokoh dalam iman dan berakhlak mulia.
          </p>
        </div>

        <div class="grid lg:grid-cols-12 gap-8 lg:gap-10 items-stretch mb-16">
          
          <!-- History Card (Col 7) -->
          <div class="lg:col-span-7 bg-[#fafaf9] rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-4 mb-7">
                <div class="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-700/20">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-900">Sejarah &amp; Komitmen Pengabdian</h3>
                  <p class="text-xs sm:text-sm text-slate-500">Perjalanan khidmat dakwah Al-Qur'an di Sawotratap</p>
                </div>
              </div>

              <div class="space-y-6 text-slate-600 text-sm sm:text-base leading-relaxed">
                <p>
                  {{ aboutContent.history || defaultAbout }}
                </p>
                <p>
                  Dengan bimbingan asatidz yang bersertifikat dan berakhlakul karimah, TPQ Amanah Sawotratap tidak hanya berfokus pada ketepatan pelafalan huruf (fashahah), namun juga menanamkan kecintaan mendalam terhadap nilai-nilai Al-Qur'an ke dalam sanubari santri sejak usia dini.
                </p>
              </div>
            </div>

            <div class="mt-8 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium">
              <span class="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
                10+ Tahun Mengabdi di Sawotratap
              </span>
              <span>Dusun Tratap, Kec. Gedangan, Kab. Sidoarjo</span>
            </div>
          </div>

          <!-- Visi & Misi (Col 5) -->
          <div class="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <!-- Visi Card -->
            <div class="bg-gradient-to-br from-[#063f2e] via-[#094d39] to-[#042d21] text-white rounded-3xl p-7 sm:p-8 shadow-md border border-emerald-700/60 relative overflow-hidden flex-1">
              <div class="relative z-10 flex items-start gap-4 mb-3.5">
                <div class="w-10 h-10 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                    Visi Lembaga
                  </span>
                  <h3 class="text-lg font-bold text-white mt-1">Cita-Cita Utama</h3>
                </div>
              </div>
              <p class="relative z-10 text-emerald-100/90 text-sm leading-relaxed italic">
                "{{ aboutContent.vision }}"
              </p>
            </div>

            <!-- Misi Card -->
            <div class="bg-[#fafaf9] rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-xs flex-1">
              <div class="flex items-start gap-4 mb-4">
                <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                    Misi Pendidikan
                  </span>
                  <h3 class="text-lg font-bold text-slate-900 mt-1">Misi TPQ Amanah</h3>
                </div>
              </div>

              <ul class="text-slate-600 text-sm space-y-2.5">
                <li v-for="(item, idx) in missionList" :key="idx" class="flex items-start gap-2.5">
                  <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">&check;</span>
                  <span class="leading-relaxed">{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

        <!-- Dynamic Animated Stats Counter Strip -->
        <div ref="statsRef" class="bg-[#fafaf9] rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xs">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div v-for="stat in stats" :key="stat.label" class="text-center pt-4 lg:pt-0">
              <div class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-emerald-800 mb-1"
                :data-target="stat.rawValue">
                {{ stat.displayValue }}
              </div>
              <div class="w-10 h-1 bg-amber-400 mx-auto mb-2 rounded-full"></div>
              <div class="text-slate-600 text-xs sm:text-sm font-semibold">{{ stat.label }}</div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 9. JADWAL & SESI MENGAJI (CLEAR DUAL SESSION COMPARISON)          -->
    <!-- ================================================================= -->
    <section id="jadwal" class="py-20 lg:py-28 bg-[#fafaf9] scroll-mt-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100/70 px-4 py-1.5 rounded-full border border-emerald-200/80 mb-4">
            Waktu Belajar
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Jadwal & Sesi Mengaji Santri
          </h2>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed">
            Dua pilihan waktu belajar fleksibel setiap hari Senin hingga Jumat, dapat disesuaikan dengan ritme sekolah formal putra-putri Anda.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          <!-- Sesi Sore -->
          <div class="bg-white rounded-3xl p-8 sm:p-10 border border-amber-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-4 mb-6">
                <div class="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span class="text-xs font-bold text-amber-900 bg-amber-100/80 px-3.5 py-1 rounded-full border border-amber-200">
                  Sesi 1 • Ba'da Ashar
                </span>
              </div>

              <h3 class="text-2xl font-bold text-slate-900 mb-1.5">Sesi Sore</h3>
              <p class="text-xs text-slate-500 mb-6">Direkomendasikan untuk santri usia dini (PAUD/TK) &amp; siswa SD Kelas 1-4</p>

              <div class="space-y-3.5 mb-6">
                <div class="flex items-center gap-3 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/60">
                  <svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-extrabold text-slate-900 text-lg">15:30 - 17:00 WIB</span>
                </div>
                <div class="flex items-center gap-3 text-slate-600 px-1 text-sm">
                  <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Senin s/d Jumat (5 Hari Aktif)</span>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 text-xs text-amber-900 font-medium">
              Suasana ceria, segar, dan bersahabat sebelum waktu maghrib tiba.
            </div>
          </div>

          <!-- Sesi Malam -->
          <div class="bg-white rounded-3xl p-8 sm:p-10 border border-emerald-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-4 mb-6">
                <div class="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-700/20">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <span class="text-xs font-bold text-emerald-900 bg-emerald-100/80 px-3.5 py-1 rounded-full border border-emerald-200">
                  Sesi 2 • Ba'da Maghrib
                </span>
              </div>

              <h3 class="text-2xl font-bold text-slate-900 mb-1.5">Sesi Malam</h3>
              <p class="text-xs text-slate-500 mb-6">Ideal untuk santri yang sekolah full-day, kelas lanjutan &amp; tahfidz</p>

              <div class="space-y-3.5 mb-6">
                <div class="flex items-center gap-3 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/60">
                  <svg class="w-5 h-5 text-emerald-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-extrabold text-slate-900 text-lg">18:00 - 19:30 WIB</span>
                </div>
                <div class="flex items-center gap-3 text-slate-600 px-1 text-sm">
                  <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Senin s/d Jumat (5 Hari Aktif)</span>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 text-xs text-emerald-900 font-medium">
              Suasana lebih hening, khusyuk, dan fokus untuk pendalaman ayat Al-Qur'an.
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 10. DEWAN ASATIDZ PEMBIMBING (EEAT EXPERTISE & PROFILE)           -->
    <!-- ================================================================= -->
    <section id="pengajar" class="py-20 lg:py-28 bg-white border-y border-slate-200/80 scroll-mt-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 mb-4">
            Dewan Pengajar
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Ustadz &amp; Ustadzah Pembimbing
          </h2>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed">
            Guru-guru yang amanah, berakhlak mulia, dan mendedikasikan ilmu serta perhatian penuh untuk membimbing santri dengan keteladanan.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="teacher in teachers" :key="teacher.id"
            class="bg-[#fafaf9] rounded-3xl p-7 text-center border border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
            <div>
              <!-- Avatar -->
              <div class="relative w-24 h-24 mx-auto mb-4">
                <div class="w-full h-full rounded-full overflow-hidden ring-4 ring-emerald-100 shadow-sm">
                  <img v-if="teacher.photoURL" :src="teacher.photoURL" :alt="teacher.name" width="96" height="96"
                    loading="lazy" decoding="async" class="w-full h-full object-cover" />
                  <div v-else
                    class="w-full h-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xl">
                    {{ getInitials(teacher.name) }}
                  </div>
                </div>
              </div>

              <!-- Badge Role -->
              <span class="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200 mb-2">
                {{ teacher.badge }}
              </span>

              <h3 class="font-bold text-lg text-slate-900 mb-0.5">
                {{ teacher.name }}
              </h3>
              <p class="text-xs font-semibold text-amber-700 mb-3">
                {{ teacher.position }}
              </p>
              <p class="text-slate-600 text-sm leading-relaxed">
                {{ teacher.bio }}
              </p>
            </div>

            <div class="mt-6 pt-3.5 border-t border-slate-200 text-xs text-slate-500 font-medium">
              Dedikasi Mengajar Al-Qur'an
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 11. TESTIMONI WALI SANTRI (REAL SOCIAL PROOF & TRUST)             -->
    <!-- ================================================================= -->
    <section class="py-20 lg:py-28 bg-[#fafaf9] scroll-mt-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100/70 px-4 py-1.5 rounded-full border border-emerald-200/80 mb-4">
            Kepercayaan Orang Tua
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Pengalaman Wali Santri TPQ Amanah
          </h2>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed">
            Kesan dan ungkapan tulus orang tua santri yang mempercayakan pendidikan Al-Qur'an putra-putrinya di TPQ Amanah.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="(testi, idx) in testimonials" :key="idx"
            class="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-1 text-amber-400 mb-3.5">
                <span v-for="s in 5" :key="s">★</span>
              </div>
              <p class="text-slate-700 text-sm sm:text-base leading-relaxed italic mb-6">
                "{{ testi.comment }}"
              </p>
            </div>

            <div class="pt-4 border-t border-slate-100 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                {{ getInitials(testi.name) }}
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">{{ testi.name }}</h3>
                <p class="text-slate-500 text-xs">{{ testi.role }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 12. FAQ SECTION (PERTANYAAN UMUM & TRANSPARANSI)                 -->
    <!-- ================================================================= -->
    <section class="py-20 lg:py-28 bg-white border-y border-slate-200/80 scroll-mt-28">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center mb-14">
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 mb-4">
            Tanya Jawab
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p class="text-slate-600 text-base sm:text-lg">
            Jawaban jelas dan transparan mengenai sistem belajar dan penerimaan santri baru di TPQ Amanah.
          </p>
        </div>

        <div class="space-y-3.5">
          <div v-for="(faq, index) in faqs" :key="index"
            class="bg-[#fafaf9] rounded-2xl border border-slate-200/80 overflow-hidden transition-all">
            <button type="button"
              class="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-slate-900 text-base hover:text-emerald-700 transition-colors"
              @click="toggleFaq(index)">
              <span>{{ faq.q }}</span>
              <span
                class="w-7 h-7 rounded-full bg-slate-200/70 flex items-center justify-center shrink-0 text-slate-600 transition-transform duration-200"
                :class="{ 'rotate-180 bg-emerald-100 text-emerald-800': activeFaq === index }">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            <div v-show="activeFaq === index"
              class="px-5 sm:px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-200/70 pt-4">
              {{ faq.a }}
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 13. KONTAK & LOKASI PETA (PHYSICAL GROUNDING & ACCESSIBILITY)      -->
    <!-- ================================================================= -->
    <section id="kontak" class="py-20 lg:py-28 bg-[#fafaf9] scroll-mt-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100/70 px-4 py-1.5 rounded-full border border-emerald-200/80 mb-4">
            Hubungi Kami
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Lokasi &amp; Kontak Resmi Lembaga
          </h2>
          <p class="text-slate-600 text-base sm:text-lg leading-relaxed">
            Pintu silaturahmi kami selalu terbuka untuk konsultasi pendaftaran santri baru atau kunjungan langsung ke lokasi TPQ Amanah.
          </p>
        </div>

        <div class="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          <!-- Left: Information Cards (Col 6) -->
          <div class="lg:col-span-6 space-y-5">
            <!-- Contact Cards -->
            <div class="grid sm:grid-cols-2 gap-4">
              <!-- Ustadzah Ella -->
              <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <h3 class="font-bold text-slate-900 text-base mb-0.5">Ustadzah Ella</h3>
                <p class="text-xs text-slate-500 mb-2">Koordinator Pendaftaran</p>
                <p class="text-slate-700 text-xs font-semibold mb-3">
                  {{ contactElla.phone }}
                </p>
                <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline">
                  <span>Chat WhatsApp</span> &rarr;
                </a>
              </div>

              <!-- Ustadz Riski -->
              <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <h3 class="font-bold text-slate-900 text-base mb-0.5">Ustadz Riski</h3>
                <p class="text-xs text-slate-500 mb-2">Kepala Lembaga TPQ</p>
                <p class="text-slate-700 text-xs font-semibold mb-3">
                  {{ contactRiski.phone }}
                </p>
                <a :href="contactRiski.waLink" target="_blank" rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline">
                  <span>Chat WhatsApp</span> &rarr;
                </a>
              </div>
            </div>

            <!-- Address Card -->
            <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-base mb-1">Alamat Lembaga</h3>
                <p class="text-slate-600 text-sm leading-relaxed">
                  Jl. Kertanegara No. 20, Dusun Tratap, Sawotratap, Kec. Gedangan, Kabupaten Sidoarjo, Jawa Timur 61256
                </p>
                <p class="text-xs text-slate-500 mt-2 font-medium">
                  Patokan: Dekat perbatasan Waru - Sawotratap, akses mudah dan lingkungan aman untuk anak.
                </p>
              </div>
            </div>

            <!-- Google Form Quick Card -->
            <div class="bg-gradient-to-br from-[#063f2e] via-[#094d39] to-[#042d21] rounded-2xl p-5 sm:p-6 text-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 class="font-bold text-base text-white">Formulir Pendaftaran Online</h3>
                <p class="text-xs text-emerald-100/80 mt-0.5">Daftarkan santri baru kapan saja melalui Google Form</p>
              </div>
              <a :href="googleFormUrl" target="_blank" rel="noopener noreferrer"
                class="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs whitespace-nowrap shadow-sm transition">
                Buka Form ↗
              </a>
            </div>
          </div>

          <!-- Right: Google Maps (Lazy Loaded) (Col 6) -->
          <div ref="mapRef"
            class="lg:col-span-6 bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-xs overflow-hidden min-h-[420px] lg:min-h-[480px] flex flex-col">
            <iframe v-if="isMapVisible" :src="mapSrc"
              class="w-full h-full min-h-[400px] lg:min-h-[460px] rounded-2xl border-0" allowfullscreen loading="lazy"
              referrerpolicy="no-referrer-when-downgrade" title="Peta Lokasi TPQ Amanah Sawotratap Sidoarjo"></iframe>
            <div v-else
              class="w-full h-full min-h-[400px] lg:min-h-[460px] rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <div class="text-center p-6">
                <svg class="w-10 h-10 mx-auto mb-2 text-slate-400 animate-bounce" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p class="text-sm font-medium">Memuat peta lokasi TPQ Amanah...</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- ================================================================= -->
    <!-- FLOATING REGISTRATION ACTION (MOBILE ONLY)                        -->
    <!-- ================================================================= -->
    <aside aria-label="Aksi Cepat Pendaftaran"
      class="fixed bottom-5 right-5 z-40 lg:hidden flex flex-col gap-2 items-end">
      <!-- Floating Google Form CTA -->
      <a :href="googleFormUrl" target="_blank" rel="noopener noreferrer"
        class="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-xs font-bold border border-white/60"
        title="Daftar via Google Form">
        <svg class="w-4 h-4 text-slate-950 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Daftar Google Form</span>
      </a>

      <!-- Floating WhatsApp CTA -->
      <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer"
        class="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-lg shadow-emerald-700/30 hover:scale-105 active:scale-95 transition-all text-xs font-bold border border-white/30"
        title="Tanya Pendaftaran via WhatsApp">
        <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
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

// Official Asatidz Contacts
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

const defaultAbout = 'TPQ AMANAH didirikan dengan tekad suci untuk membimbing generasi Qur\'ani yang tartil membaca, memahami makna dasar kalamullah, dan mengamalkan akhlak mulia dalam kehidupan bermasyarakat di Sawotratap, Gedangan, Sidoarjo.'

const teachers = ref([])
const aboutContent = ref({
  history: '',
  vision: 'Menjadi lembaga pendidikan Al-Qur\'an terdepan yang menghasilkan generasi Qur\'ani berakhlakul karimah, berilmu, mandiri, dan berbakti kepada orang tua.',
  mission: ''
})

const missionList = computed(() => {
  if (aboutContent.value.mission) {
    return aboutContent.value.mission.split('\n').filter(m => m.trim())
  }
  return [
    'Menyelenggarakan pembelajaran membaca Al-Qur\'an metode At-Tartil 6 Jilid yang tartil, sistematis, dan menyenangkan.',
    'Menanamkan nilai akidah, akhlakul karimah, dan pembiasaan ibadah praktis sejak usia dini.',
    'Membangun lingkungan belajar yang islami, ramah anak, berkarakter, dan penuh kasih sayang.'
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
    desc: 'Huruf Sambung & Kasrah/Dhammah',
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
    desc: 'Waqaf, Ayat Gharibah & Tajwid',
    coverImage: '/tartil/cover6.webp',
    spineBg: 'linear-gradient(to right, #6b21a8, #c084fc)'
  }
]

// Stats Section with Counter Animation
const statsRef = ref(null)
const hasAnimated = ref(false)

const stats = ref([
  { rawValue: 80, displayValue: '0+', label: 'Santri Aktif' },
  { rawValue: 6, displayValue: '0+', label: 'Asatidz Bersertifikat' },
  { rawValue: 10, displayValue: '0+', label: 'Tahun Pengabdian' },
  { rawValue: 100, displayValue: '0+', label: 'Alumni Khatam Al-Qur\'an' }
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
    a: 'Tidak perlu khawatir, asatidz kami akan membimbing dengan sabar dari tingkat paling dasar (Jilid 1) menggunakan metode At-Tartil yang ramah anak dan tanpa tekanan.',
  },
  {
    q: 'Apakah ada tes seleksi yang menggugurkan calon santri?',
    a: 'Tidak ada tes seleksi gugur. Kami hanya melakukan asesmen penempatan (placement) santai dan bersahabat agar santri ditempatkan pada jilid yang sesuai dengan kesiapan membacanya.',
  },
  {
    q: 'Berapa pilihan waktu mengaji yang tersedia?',
    a: 'Tersedia dua sesi belajar setiap hari Senin hingga Jumat: Sesi Sore (15:30 - 17:00 WIB, Ba\'da Ashar) dan Sesi Malam (18:00 - 19:30 WIB, Ba\'da Maghrib).',
  },
  {
    q: 'Bagaimana cara orang tua memantau perkembangan mengaji ananda?',
    a: 'Setiap santri dibekali Buku Prestasi Santri yang diparaf oleh asatidz setiap selesai sesi mengaji. Selain itu, orang tua dapat menyimak materi melalui E-Kitab digital resmi.',
  },
  {
    q: 'Bagaimana cara mendaftar calon santri baru?',
    a: 'Orang tua dapat langsung mengisi Formulir Pendaftaran Google Form melalui tombol di website ini, atau menghubungi Ustadzah Ella (0895-3039-7058) dan Ustadz Riski (0822-3336-1877).',
  }
]

const getInitials = (name) => {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'TP'
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
  transition: transform 0.35s ease;
  will-change: transform;
}

.at-tartil-book:hover {
  transform: rotateY(-8deg) scale(1.03);
}

.at-tartil-spine {
  position: absolute;
  left: 0;
  top: 0;
  width: 7px;
  height: 100%;
  border-radius: 4px 0 0 4px;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.25);
}

.at-tartil-cover {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 0 6px 6px 0;
  overflow: hidden;
  box-shadow: 2px 4px 12px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.3s ease;
}

.at-tartil-book:hover .at-tartil-cover {
  box-shadow: 4px 8px 20px rgba(0, 0, 0, 0.22);
}
</style>
