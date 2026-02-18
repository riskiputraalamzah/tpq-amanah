<template>
  <div class="min-h-screen">
    <NavbarComponent />

    <!-- Hero Section -->
    <section id="beranda" class="relative min-h-screen flex items-center bg-gradient-primary overflow-hidden">
      <!-- Background Effects -->
      <div class="absolute inset-0 islamic-pattern opacity-5"></div>
      <div class="absolute inset-0 bg-gradient-radial from-accent-400/10 via-transparent to-transparent"></div>

      <!-- Floating Decorative Elements -->
      <div class="absolute top-20 left-10 w-24 h-24 bg-accent-400/10 rounded-full blur-2xl animate-pulse-slow"></div>
      <div class="absolute bottom-40 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-xl animate-float"></div>
      <div class="absolute top-1/3 right-10 w-20 h-20 bg-accent-300/15 rounded-full blur-2xl animate-bounce-slow"></div>
      <div class="absolute bottom-1/4 right-1/3 w-12 h-12 bg-white/5 rounded-full blur-lg animate-float"></div>

      <!-- Geometric Decorative Lines -->
      <div class="absolute top-1/2 left-0 w-32 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent">
      </div>
      <div
        class="absolute top-1/3 right-0 w-40 h-px bg-gradient-to-l from-transparent via-accent-400/30 to-transparent">
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">

        <!-- Split Layout Grid -->
        <div class="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[65vh]">

          <!-- Left Side: Content -->
          <div class="text-center  ">

            <!-- Bismillah - Top Tagline -->
            <p
              class="text-xl md:text-2xl lg:text-3xl font-arabic text-accent-300/90 mb-6 animate-slide-up tracking-wider drop-shadow-lg">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>

            <!-- Badge/Chip -->
            <div
              class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-sm font-medium mb-6 animate-slide-up">
              <span class="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></span>
              Taman Pendidikan Al-Quran
            </div>

            <!-- Main Headline -->
            <h1 class="font-jakarta font-bold mb-6 text-white leading-tight animate-slide-up">
              <span class="block text-lg sm:text-xl md:text-2xl font-medium mb-2 text-white/80">Selamat Datang di</span>
              <span class="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
                <span class="text-white">TPQ </span>
                <span class="text-accent-300 drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]">AMANAH</span>
              </span>
            </h1>

            <!-- Description -->
            <p
              class="text-base sm:text-lg md:text-xl text-white/85 mb-6 leading-relaxed font-inter max-w-xl mx-auto lg:mx-0 animate-slide-up">
              Membentuk generasi Qurani yang <span class="text-accent-300 font-semibold">berakhlak mulia</span>,
              <span class="text-accent-300 font-semibold">cerdas</span>, dan
              <span class="text-accent-300 font-semibold">bertaqwa</span> kepada Allah SWT
            </p>

            <!-- Location -->
            <div
              class="flex items-center justify-center  gap-2 text-white/70 text-sm md:text-base mb-8 animate-slide-up">
              <div class="p-1.5 bg-white/10 rounded-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span class="font-inter">Sawotratap, Gedangan, Sidoarjo</span>
            </div>

            <!-- CTA Buttons -->
            <div class="flex flex-row gap-3 md:gap-4 justify-center items-center animate-slide-up">
              <a href="#kontak" @click="scrollTo($event, '#kontak')"
                class="group relative px-4 py-3 md:px-8 md:py-4 text-sm md:text-lg font-bold text-primary-900 bg-accent-400 rounded-xl md:rounded-2xl shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 hover:-translate-y-1 hover:bg-accent-300 transition-all duration-300 flex items-center gap-2 md:gap-3 overflow-hidden">
                <!-- Shine Effect -->
                <div
                  class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700">
                </div>
                <svg class="w-4 h-4 md:w-5 md:h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span class="relative z-10">Daftar Sekarang</span>
              </a>
              <a href="#program" @click="scrollTo($event, '#program')"
                class="px-4 py-3 md:px-8 md:py-4 text-sm md:text-lg font-semibold bg-white/5 backdrop-blur-md border-2 border-white/30 text-white rounded-xl md:rounded-2xl hover:bg-white/15 hover:border-white/50 shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 md:gap-3">
                <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Lihat Program
              </a>
            </div>
          </div>

          <!-- Right Side: Illustration -->
          <div class="order-1 lg:order-2 flex items-center justify-center">
            <div class="relative w-full max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg">

              <!-- Decorative Floating Stars/Sparkles -->
              <div class="absolute -top-6 -left-4 w-4 h-4 text-accent-300 animate-pulse">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                </svg>
              </div>
              <div class="absolute top-1/4 -right-6 w-3 h-3 text-white/60 animate-bounce-slow">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                </svg>
              </div>
              <div class="absolute bottom-1/3 -left-8 w-2 h-2 text-accent-400/80 animate-float">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                </svg>
              </div>
              <div class="absolute -top-2 right-1/4 w-2 h-2 text-white/40 animate-pulse-slow">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                </svg>
              </div>

              <!-- Decorative Circles -->
              <div
                class="absolute -top-4 right-0 w-8 h-8 border-2 border-accent-400/30 rounded-full animate-spin-veryslow">
              </div>
              <div class="absolute bottom-1/4 -right-4 w-6 h-6 border border-white/20 rounded-full animate-float"></div>
              <div class="absolute top-1/2 -left-6 w-4 h-4 bg-accent-400/20 rounded-full blur-sm animate-pulse"></div>

              <!-- Decorative Dots -->
              <div class="absolute top-8 -right-2 w-2 h-2 bg-accent-300 rounded-full animate-bounce-slow"></div>
              <div class="absolute bottom-1/2 -left-3 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse"></div>

              <!-- Decorative Glow Behind -->
              <div class="absolute inset-0 -m-4 lg:-m-8">
                <div
                  class="absolute inset-0 bg-gradient-to-b from-accent-400/25 via-accent-400/15 to-transparent rounded-full blur-3xl animate-pulse-slow">
                </div>
              </div>

              <!-- Ground Shadow -->
              <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-black/20 blur-2xl rounded-full">
              </div>

              <!-- Illustration -->
              <img src="/hero-blended-1.png" alt="Anak-anak belajar mengaji bersama ustadzah"
                class="relative z-10 w-full h-auto drop-shadow-2xl animate-float" />
            </div>
          </div>

        </div>

      </div>

      <!-- Wave Transition -->
      <div class="absolute bottom-0 left-0 right-0 leading-[0] z-20">
        <svg viewBox="0 0 1440 120" class="block w-full h-16 md:h-24 lg:h-32 fill-primary-50"
          preserveAspectRatio="none">
          <path
            d="M0,64L60,58.7C120,53,240,43,360,48C480,53,600,75,720,80C840,85,960,75,1080,64C1200,53,1320,43,1380,37.3L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z" />
        </svg>
      </div>
    </section>

    <!-- About Section -->
    <section id="tentang" class="py-20 lg:py-28 bg-gradient-to-b from-primary-50 to-white -mt-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="section-title font-jakarta">Tentang Kami</h2>
          <p class="text-gray-500 mt-6 max-w-2xl mx-auto font-inter">Mengenal lebih dekat TPQ AMANAH Sawotratap</p>
        </div>

        <div class="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <!-- Sejarah - Vertical Timeline -->
          <div class="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-8 shadow-xl">
            <div class="flex items-center gap-3 mb-6">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-primary-700 font-jakarta">Sejarah TPQ AMANAH</h3>
            </div>

            <!-- Timeline Items -->
            <div class="relative pl-8 border-l-2 border-primary-300">
              <div class="mb-8 relative timeline-items">
                <div
                  class="absolute -left-[2.15rem] top-0 w-5 h-5 rounded-full bg-primary-500 border-4 border-white shadow-md">
                </div>
                <p class="text-gray-700 leading-loose font-inter">
                  {{ aboutContent.history || defaultAbout }}
                </p>
              </div>
              <div class="relative timeline-items">
                <div
                  class="absolute -left-[2.15rem] top-0 w-5 h-5 rounded-full bg-accent-400 border-4 border-white shadow-md">
                </div>
                <p class="text-gray-700 leading-loose font-inter">
                  Berlokasi di Sawotratap, Gedangan, Sidoarjo, kami telah melayani masyarakat dalam pendidikan Al-Quran
                  dengan penuh dedikasi dan keikhlasan.
                </p>
              </div>
            </div>
          </div>

          <!-- Info Cards - Glassmorphism -->
          <div class="space-y-4">
            <!-- Visi -->
            <div
              class="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div class="flex gap-5 items-start">
                <div
                  class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/30">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h4 class="text-lg font-bold text-primary-700 mb-2 font-jakarta">Visi</h4>
                  <p class="text-gray-700 text-sm leading-loose font-inter">{{ aboutContent.vision }}</p>
                </div>
              </div>
            </div>

            <!-- Misi -->
            <div
              class="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div class="flex gap-5 items-start">
                <div
                  class="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent-500/30">
                  <svg class="w-7 h-7 text-primary-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h4 class="text-lg font-bold text-primary-700 mb-2 font-jakarta">Misi</h4>
                  <ul class="text-gray-700 text-sm space-y-2 font-inter">
                    <li v-for="(item, idx) in missionList" :key="idx" class="flex items-start gap-2 leading-loose">
                      <span class="text-accent-500 font-bold mt-0.5">•</span>
                      <span class="flex-1">{{ item }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Lokasi -->
            <div
              class="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div class="flex gap-5 items-start">
                <div
                  class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h4 class="text-lg font-bold text-primary-700 mb-2 font-jakarta">Lokasi</h4>
                  <p class="text-gray-700 text-sm leading-loose font-inter">JL. Kertanegara Nomor 20, Sawotratap,
                    Gedangan, Sidoarjo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section ref="statsRef" class="py-20 bg-gradient-primary relative overflow-hidden">
      <!-- Decorative Elements -->
      <div class="absolute inset-0 islamic-pattern opacity-5"></div>

      <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Floating Stats Bar -->
        <div
          class="backdrop-blur-xl bg-white/95 border border-white rounded-3xl p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.2)] transition-shadow duration-500">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div v-for="stat in stats" :key="stat.label" class="text-center group">
              <div class="relative">
                <!-- Counter Number -->
                <div
                  class="text-5xl md:text-6xl font-extrabold bg-gradient-to-br from-primary-600 to-primary-800 bg-clip-text text-transparent mb-3 font-jakarta transition-transform group-hover:scale-110 duration-300"
                  :data-target="stat.rawValue" ref="statsNumbers">
                  {{ stat.displayValue }}
                </div>
                <!-- Accent Line -->
                <div
                  class="w-16 h-1 bg-gradient-to-r from-accent-400 to-accent-500 mx-auto mb-3 rounded-full group-hover:w-24 transition-all duration-300">
                </div>
                <!-- Label -->
                <div class="text-gray-600 text-sm md:text-base font-medium font-inter">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Program Unggulan Section (NEW) -->
    <section id="program" class="py-20 lg:py-28 bg-gradient-to-b from-white to-primary-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="section-title font-jakarta">Program Unggulan</h2>
          <p class="text-gray-500 mt-6 max-w-2xl mx-auto font-inter">Kurikulum komprehensif untuk membentuk generasi
            Qurani</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Card 1: Tahsin & Tajwid -->
          <div
            class="group backdrop-blur-xl bg-gradient-to-br from-emerald-50/80 to-white/40 border border-white/60 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
            <div
              class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-primary-800 mb-3 text-center font-jakarta">Tahsin & Tajwid</h3>
            <p class="text-gray-600 text-sm text-center leading-relaxed font-inter">Memperbaiki bacaan Al-Quran dengan
              kaidah tajwid yang benar</p>
          </div>

          <!-- Card 2: Tahfidzul Quran -->
          <div
            class="group backdrop-blur-xl bg-gradient-to-br from-amber-50/80 to-white/40 border border-white/60 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
            <div
              class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-lg shadow-accent-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg class="w-9 h-9 text-primary-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-primary-800 mb-3 text-center font-jakarta">Tahfidzul Quran</h3>
            <p class="text-gray-600 text-sm text-center leading-relaxed font-inter">Program menghafal Al-Quran dengan
              metode yang mudah dan menyenangkan</p>
          </div>

          <!-- Card 3: Adab & Akhlak -->
          <div
            class="group backdrop-blur-xl bg-gradient-to-br from-rose-50/80 to-white/40 border border-white/60 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
            <div
              class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-primary-800 mb-3 text-center font-jakarta">Adab & Akhlak</h3>
            <p class="text-gray-600 text-sm text-center leading-relaxed font-inter">Pembinaan karakter dan akhlak mulia
              sesuai tuntunan Rasulullah SAW</p>
          </div>

          <!-- Card 4: Kajian Islam Dasar -->
          <div
            class="group backdrop-blur-xl bg-gradient-to-br from-blue-50/80 to-white/40 border border-white/60 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
            <div
              class="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-primary-800 mb-3 text-center font-jakarta">Kajian Islam Dasar</h3>
            <p class="text-gray-600 text-sm text-center leading-relaxed font-inter">Pemahaman Islam yang komprehensif
              meliputi aqidah, ibadah, dan muamalah</p>
          </div>
        </div>
      </div>
    </section>

    <!-- E-Kitab At-Tartil Section -->
    <section id="at-tartil" class="py-20 lg:py-28 bg-gradient-primary relative overflow-hidden">
      <!-- Background Decorations -->
      <div class="absolute inset-0 islamic-pattern opacity-5"></div>
      <div class="absolute inset-0 bg-gradient-radial from-accent-400/8 via-transparent to-transparent"></div>
      <div class="absolute top-10 right-10 w-32 h-32 bg-accent-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div class="absolute bottom-20 left-10 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-float"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <!-- Left: 3D Book Display -->
          <div class="flex justify-center order-2 lg:order-1 w-full">
            <div class="relative w-full max-w-xl lg:max-w-none px-4 sm:px-8 lg:px-4">
              <!-- Glow Behind Books -->
              <div
                class="absolute inset-0 -m-8 bg-gradient-to-b from-accent-400/20 via-accent-400/10 to-transparent rounded-full blur-3xl">
              </div>

              <!-- Book Grid -->
              <div class="relative z-10 grid grid-cols-3 gap-5 sm:gap-6 lg:gap-8 w-full">
                <div v-for="jilid in 6" :key="jilid" class="group cursor-pointer">
                  <div class="at-tartil-book" :style="{ animationDelay: (jilid * 0.15) + 's' }">
                    <div class="at-tartil-spine"></div>
                    <div class="at-tartil-cover">
                      <!-- Skeleton Loader -->
                      <div v-if="!bookImagesLoaded[jilid]" class="book-skeleton"></div>

                      <img :src="`https://at-tartil.riskiputraalamzah.my.id/img/tartil${jilid}/cover.webp`"
                        :alt="`At-Tartil Jilid ${jilid}`" loading="lazy" decoding="async"
                        class="w-full h-full object-cover rounded-r-md transition-opacity duration-500"
                        :class="{ 'opacity-0': !bookImagesLoaded[jilid], 'opacity-100': bookImagesLoaded[jilid] }"
                        @load="handleImageLoad(jilid)" />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <!-- Right: Content -->
          <div class="order-1 lg:order-2 text-center lg:text-left">
            <!-- Badge -->
            <div
              class="inline-flex items-center gap-2 px-4 py-2 bg-accent-400/15 backdrop-blur-sm border border-accent-400/30 rounded-full text-accent-300 text-sm font-semibold mb-6">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
              </svg>
              Inovasi Digital TPQ AMANAH
            </div>

            <!-- Heading -->
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 font-jakarta leading-tight">
              E-Kitab<br />
              <span class="text-accent-300 drop-shadow-[0_0_20px_rgba(255,213,79,0.3)]">At-Tartil</span>
            </h2>

            <!-- Description -->
            <p class="text-base sm:text-lg text-white/80 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 font-inter">
              Kini belajar mengaji semakin mudah! TPQ AMANAH menghadirkan
              <span class="text-accent-300 font-semibold">E-Kitab At-Tartil</span> dalam format digital
              yang bisa diakses kapan saja dan di mana saja. Tampilan flipbook interaktif yang mirip dengan buku asli!
            </p>

            <!-- Features -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div class="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <div class="w-10 h-10 rounded-lg bg-accent-400/20 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p class="text-white font-semibold text-sm">6 Jilid</p>
                  <p class="text-white/60 text-xs">Lengkap</p>
                </div>
              </div>

              <div class="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <div class="w-10 h-10 rounded-lg bg-accent-400/20 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p class="text-white font-semibold text-sm">Mobile</p>
                  <p class="text-white/60 text-xs">Friendly</p>
                </div>
              </div>

              <div class="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <div class="w-10 h-10 rounded-lg bg-accent-400/20 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-accent-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-white font-semibold text-sm">Gratis</p>
                  <p class="text-white/60 text-xs">100% Free</p>
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <a href="https://at-tartil.riskiputraalamzah.my.id/" target="_blank" rel="noopener noreferrer"
              class="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-bold text-primary-900 bg-accent-400 rounded-2xl shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 hover:-translate-y-1 hover:bg-accent-300 transition-all duration-300 overflow-hidden">
              <!-- Shine Effect -->
              <div
                class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700">
              </div>
              <svg class="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span class="relative z-10">Buka E-Kitab At-Tartil</span>
              <svg class="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>

        </div>
      </div>
    </section>

    <!-- Schedule Section (NEW) -->
    <section id="jadwal"
      class="py-20 lg:py-28 bg-gradient-to-br from-primary-50 via-white to-primary-50 relative overflow-hidden">
      <!-- Decorative Background -->
      <div class="absolute inset-0 islamic-pattern opacity-5"></div>
      <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent">
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="section-title font-jakarta">Jam Mengaji</h2>
          <p class="text-gray-500 mt-6 max-w-2xl mx-auto font-inter">Pilih waktu belajar yang sesuai dengan kenyamanan
            putra-putri Anda</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
          <!-- Sesi Sore -->
          <div class="group relative">
            <div
              class="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-50 rounded-3xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300">
            </div>
            <div
              class="relative backdrop-blur-xl bg-white/80 border border-orange-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div class="flex items-center gap-4 mb-6">
                <div
                  class="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-500">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-primary-800 font-jakarta">Sesi Sore</h3>
                  <p class="text-orange-500 font-medium font-inter">Waktu Belajar Efektif</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center gap-3 text-gray-700 bg-orange-50/50 p-3 rounded-xl">
                  <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-bold text-lg font-jakarta">15:30 - 17:00 WIB</span>
                </div>
                <div class="flex items-center gap-3 text-gray-600 px-3">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="font-inter">Senin - Jumat</span>
                </div>
              </div>

              <!-- Shine effect -->
              <div
                class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-700">
              </div>
            </div>
          </div>

          <!-- Sesi Malam -->
          <div class="group relative">
            <div
              class="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-50 rounded-3xl transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300">
            </div>
            <div
              class="relative backdrop-blur-xl bg-white/80 border border-indigo-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div class="flex items-center gap-4 mb-6">
                <div
                  class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-500">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-primary-800 font-jakarta">Sesi Malam</h3>
                  <p class="text-indigo-500 font-medium font-inter">Suasana Lebih Tenang</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center gap-3 text-gray-700 bg-indigo-50/50 p-3 rounded-xl">
                  <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-bold text-lg font-jakarta">18:00 - 19:30 WIB</span>
                </div>
                <div class="flex items-center gap-3 text-gray-600 px-3">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="font-inter">Senin - Jumat</span>
                </div>
              </div>

              <!-- Shine effect -->
              <div
                class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-700">
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Teachers Section -->
    <section id="pengajar" class="py-20 lg:py-28 bg-gradient-to-b from-primary-50 to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="section-title font-jakarta">Para Pengajar</h2>
          <p class="text-gray-500 mt-6 max-w-2xl mx-auto font-inter">Guru-guru kami yang berdedikasi tinggi dalam
            mengajarkan Al-Quran</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="teacher in teachers" :key="teacher.id"
            class="group backdrop-blur-xl bg-white/60 border border-white rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
            <div
              class="w-32 h-32 mx-auto mb-5 rounded-full overflow-hidden ring-4 ring-primary-200 group-hover:ring-accent-400 transition-all duration-300 shadow-lg">
              <img v-if="teacher.photoURL" :src="teacher.photoURL" :alt="teacher.name"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              <div v-else
                class="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
                {{ getInitials(teacher.name) }}
              </div>
            </div>
            <h4 class="text-xl font-bold text-primary-800 mb-2 font-jakarta">{{ teacher.name }}</h4>
            <p class="text-accent-600 text-sm font-semibold mb-3 font-inter">{{ teacher.position }}</p>
            <p class="text-gray-600 text-sm leading-relaxed font-inter">{{ teacher.bio }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="kontak" class="py-20 lg:py-28 bg-gradient-to-b from-white to-primary-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="section-title font-jakarta">Hubungi Kami</h2>
          <p class="text-gray-500 mt-6 max-w-2xl mx-auto font-inter">Jangan ragu untuk menghubungi kami untuk informasi
            lebih lanjut</p>
        </div>

        <div class="grid lg:grid-cols-2 gap-8">
          <!-- Contact Info & WhatsApp Form -->
          <div class="space-y-6">
            <!-- Contact Info Cards -->
            <div class="backdrop-blur-xl bg-white/60 border border-white rounded-2xl p-8 shadow-lg">
              <h3 class="text-xl font-bold text-primary-700 mb-6 font-jakarta">Informasi Kontak</h3>
              <div class="space-y-5">
                <div v-for="contact in contacts" :key="contact.title" class="flex gap-4 items-start">
                  <div
                    class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
                    <component :is="contact.icon" class="w-6 h-6 text-white" />
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-primary-700 mb-1 font-inter">{{ contact.title }}</h4>
                    <p class="text-gray-600 text-sm leading-relaxed font-inter">{{ contact.value }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- WhatsApp Form -->
            <div
              class="backdrop-blur-xl bg-gradient-to-br from-green-50/80 to-white/60 border border-white rounded-2xl p-8 shadow-lg">
              <h3 class="text-xl font-bold text-primary-700 mb-2 font-jakarta">Kirim Pesan via WhatsApp</h3>
              <p class="text-sm text-gray-600 mb-6 font-inter">Isi form di bawah untuk menghubungi kami langsung</p>
              <form @submit.prevent="sendWhatsApp" class="space-y-4">
                <div>
                  <label for="nama" class="block text-sm font-semibold text-gray-700 mb-2 font-inter">Nama Anda</label>
                  <input type="text" id="nama" v-model="whatsappForm.nama" required placeholder="Masukkan nama Anda"
                    class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-200 font-inter" />
                </div>
                <div>
                  <label for="pesan" class="block text-sm font-semibold text-gray-700 mb-2 font-inter">Pesan</label>
                  <textarea id="pesan" v-model="whatsappForm.pesan" required rows="4"
                    placeholder="Tuliskan pesan Anda di sini..."
                    class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all duration-200 resize-none font-inter"></textarea>
                </div>
                <button type="submit"
                  class="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Kirim via WhatsApp
                </button>
              </form>
            </div>
          </div>

          <!-- Google Maps - Larger Card -->
          <div ref="mapRef"
            class="backdrop-blur-xl bg-white/60 border border-white rounded-2xl p-4 shadow-lg lg:row-span-2">
            <!-- Lazy load Google Maps iframe for better performance -->
            <iframe v-if="isMapVisible" :src="mapSrc" class="w-full h-full min-h-[500px] rounded-xl" style="border:0;"
              allowfullscreen loading="lazy"></iframe>
            <!-- Placeholder while map is loading -->
            <div v-else class="w-full h-full min-h-[500px] rounded-xl bg-gray-100 flex items-center justify-center">
              <div class="text-center text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>Memuat peta...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <FooterComponent />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h, nextTick } from 'vue'
import Lenis from 'lenis'
import NavbarComponent from '@/components/NavbarComponent.vue'
import FooterComponent from '@/components/FooterComponent.vue'
import api from '@/services/api'

// Google Maps URL
const mapSrc = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d699.4818002710372!2d112.73616627742456!3d-7.368846491983087!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7e4957994e827%3A0x930e5eb7e09fb557!2sJl.%20Kertanegara%20No.20%2C%20Dusun%20Tratap%2C%20Sawotratap%2C%20Kec.%20Gedangan%2C%20Kabupaten%20Sidoarjo%2C%20Jawa%20Timur%2061256%2C%20Indonesia!5e0!3m2!1sid!2sus!4v1770188895319!5m2!1sid!2sus"'

// Lazy loading for Google Maps
const mapRef = ref(null)
const isMapVisible = ref(false)
let mapObserver = null

const defaultAbout = 'TPQ AMANAH didirikan dengan tekad untuk mencetak generasi Qurani yang mampu membaca, memahami, dan mengamalkan Al-Quran dalam kehidupan sehari-hari'

const logoUrl = new URL('@/assets/logo.png', import.meta.url).href

const teachers = ref([])
const aboutContent = ref({
  history: '',
  vision: 'Menjadi lembaga pendidikan Al-Quran terdepan yang menghasilkan generasi Qurani berakhlak mulia',
  mission: ''
})

// Computed for mission list (split by newline)
const missionList = computed(() => {
  if (aboutContent.value.mission) {
    return aboutContent.value.mission.split('\n').filter(m => m.trim())
  }
  return [
    'Menyelenggarakan pembelajaran Al-Quran berkualitas',
    'Membentuk karakter berakhlakul karimah',
    'Mengembangkan potensi santri optimal'
  ]
})

// Stats Section with Counter Animation
const statsRef = ref(null)
const statsNumbers = ref([])
const hasAnimated = ref(false)

const stats = ref([
  { rawValue: 80, displayValue: '0+', label: 'Santri Aktif' },
  { rawValue: 6, displayValue: '0+', label: 'Guru Berpengalaman' },
  { rawValue: 10, displayValue: '0+', label: 'Tahun Pengalaman' },
  { rawValue: 100, displayValue: '0+', label: 'Alumni' }
])

// Contact info with inline SVG icons
const LocationIcon = h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' }),
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z' })
])

const PhoneIcon = h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' })
])

const MailIcon = h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' })
])

const ClockIcon = h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const contacts = [
  { title: 'Alamat', value: 'JL. Kertanegara No. 20, Sawotratap, Gedangan, Sidoarjo', icon: LocationIcon },
  { title: 'Telepon', value: '+62822 3336 1877', icon: PhoneIcon },
  { title: 'Email', value: 'tpqamanah@gmail.com', icon: MailIcon },
  { title: 'Jam Mengaji', value: 'Sesi 1: 15:30-17:00 | Sesi 2: 18:00-19:30 WIB', icon: ClockIcon }
]

// WhatsApp Form
const whatsappForm = ref({
  nama: '',
  pesan: ''
})

const sendWhatsApp = () => {
  const phoneNumber = '6287733361877' // WhatsApp number (remove + and spaces)
  const message = `Halo, nama saya ${whatsappForm.value.nama}. ${whatsappForm.value.pesan}`
  const encodedMessage = encodeURIComponent(message)
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

  // Open WhatsApp in new tab
  window.open(whatsappURL, '_blank')

  // Reset form
  whatsappForm.value.nama = ''
  whatsappForm.value.pesan = ''
}

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const scrollTo = (event, selector) => {
  event.preventDefault()
  const element = document.querySelector(selector)
  if (element) {
    const offset = 80
    const top = element.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

const fetchTeachers = async () => {
  // Use local photos from /public/guru folder
  teachers.value = [
    {
      id: 1,
      name: 'Ustadz Riski',
      position: 'Kepala TPQ',
      bio: 'Berpengalaman mengajar Al-Quran lebih dari 10 tahun',
      photoURL: '/guru/riski.jpeg'
    },
    {
      id: 2,
      name: 'Ustadzah Aini',
      position: 'Guru Iqro',
      bio: 'Spesialis santri pemula dengan metode fun learning',
      photoURL: '/guru/aini.jpeg'
    },
    {
      id: 3,
      name: 'Ustadzah Ella',
      position: 'Guru Tajwid',
      bio: 'Ahli ilmu tajwid dan tahsin Al-Quran',
      photoURL: '/guru/ella.jpeg'
    },
    {
      id: 4,
      name: 'Ustadzah Annifa',
      position: 'Guru Hafalan',
      bio: 'Pembimbing Tahfidz Al-Quran',
      photoURL: '/guru/annifa.jpeg'
    },
    {
      id: 5,
      name: 'Ustadzah Febi',
      position: 'Guru Al-Quran',
      bio: 'Mengajarkan Al-Quran dengan penuh kasih sayang',
      photoURL: '/guru/febi.jpeg'
    },
    {
      id: 6,
      name: 'Ustadz Nurul',
      position: 'Guru Adab',
      bio: 'Pembina akhlak dan adab santri',
      photoURL: '/guru/nurul.jpeg'
    }
  ]
}

// Track book image loading
const bookImagesLoaded = ref({})
const handleImageLoad = (index) => {
  bookImagesLoaded.value[index] = true
}

const fetchContent = async () => {
  try {
    const { data } = await api.get('/content/about')
    if (data) {
      aboutContent.value = { ...aboutContent.value, ...data }
    }
  } catch (e) {
    console.log('Using default about content')
  }
}


let lenis = null

onMounted(() => {
  // Initialize Lenis
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
    lenis.raf(time)
    requestAnimationFrame(raf)
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
    }, { rootMargin: '200px' })

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
    }, { threshold: 0.3 })

    statsObserver.observe(statsRef.value)
  }
})

// Counter Animation Function
const animateCounters = () => {
  stats.value.forEach((stat, index) => {
    let current = 0
    const target = stat.rawValue
    const duration = 2000 // 2 seconds
    const increment = target / (duration / 16) // 60fps

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

// Cleanup observer on unmount
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
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin-veryslow {
  animation: spin 20s linear infinite;
}

.animate-spin-reverse-veryslow {
  animation: spin 25s linear infinite reverse;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-20px);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes bounce-slow {

  0%,
  100% {
    transform: translateY(-10%);
  }

  50% {
    transform: translateY(10%);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 3s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: .5;
  }
}

#tentang .timeline-items {
  transform: translateX(-8px);
}

/* At-Tartil 3D Book Styles */
.at-tartil-book {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4.2;
  perspective: 600px;
  transform-style: preserve-3d;
  transition: transform 0.4s ease;
  will-change: transform;
  /* OPTIMIZATION: Promotes to a new layer */
}

.at-tartil-book:hover {
  transform: rotateY(-8deg) scale(1.05);
}

.at-tartil-spine {
  position: absolute;
  left: 0;
  top: 0;
  width: 10px;
  height: 100%;
  background: linear-gradient(to right, #0d3d13, #1b5e20);
  transform: rotateY(0deg) translateZ(0px);
  border-radius: 4px 0 0 4px;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
}

.at-tartil-cover {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 0 6px 6px 0;
  overflow: hidden;
  box-shadow:
    4px 4px 12px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(27, 94, 32, 0.15);
  transition: box-shadow 0.3s ease;
}

.at-tartil-book:hover .at-tartil-cover {
  box-shadow:
    6px 6px 20px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(255, 202, 40, 0.2);
}

@keyframes bookFloat {

  0%,
  100% {
    transform: translateY(0) rotateY(-3deg);
  }

  50% {
    transform: translateY(-8px) rotateY(-3deg);
  }
}

/* Skeleton Loading Animation */
.book-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite linear;
  border-radius: 0 6px 6px 0;
  z-index: 5;
  /* Ensure it covers the spine area if needed */
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>
