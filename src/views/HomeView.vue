<template>
  <div
    class="lp min-h-screen font-sans"
  >
    <NavbarComponent />

    <!-- ================================================================= -->
    <!-- 1. HERO: one centre axis, bismillah to seal. The artwork sits in a  -->
    <!-- mihrab niche (gold arch) under a slowly turning star halo.          -->
    <!-- ================================================================= -->
    <section
      id="beranda"
      ref="heroRef"
      class="hero relative isolate overflow-hidden text-white pt-28 sm:pt-32 lg:pt-36"
    >
      <div class="hero-ground absolute inset-0 -z-10" aria-hidden="true"></div>
      <div class="hero-khatam absolute inset-0 -z-10" aria-hidden="true"></div>

      <!-- Headline block -->
      <div
        class="relative flex flex-col items-center max-w-6xl px-4 mx-auto text-center sm:px-6 lg:px-8"
      >
        <p
          lang="ar"
          dir="rtl"
          class="hero-rise font-arabic text-[2rem] leading-[1.5] sm:text-4xl lg:text-5xl text-amber-300 select-none"
          style="--d: 0ms"
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>

        <!-- Ornamental rule: line, eight-point star, line -->
        <svg
          class="hero-rise w-56 h-4 mt-3 text-amber-300"
          style="--d: 80ms"
          viewBox="0 0 224 16"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hero-rule-l" x1="0" y1="0" x2="92" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#fcd34d" stop-opacity="0" />
              <stop offset="1" stop-color="#fcd34d" stop-opacity="0.9" />
            </linearGradient>
            <linearGradient id="hero-rule-r" x1="132" y1="0" x2="224" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#fcd34d" stop-opacity="0.9" />
              <stop offset="1" stop-color="#fcd34d" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 8H92" stroke="url(#hero-rule-l)" stroke-width="1" />
          <path d="M132 8H224" stroke="url(#hero-rule-r)" stroke-width="1" />
          <path d="M119.00 8.00 L112.00 15.00 L105.00 8.00 L112.00 1.00 Z" fill="currentColor" />
          <path d="M116.95 12.95 L107.05 12.95 L107.05 3.05 L116.95 3.05 Z" fill="currentColor" />
        </svg>

        <h1
          class="hero-rise mt-6 font-extrabold tracking-tight text-balance leading-[1.08] text-[clamp(2.1rem,1.1rem+4.4vw,4rem)]"
          style="--d: 140ms"
        >
          Belajar Al-Qur'an dengan Tartil
          <span class="block text-amber-300">di TPQ Amanah Sawotratap</span>
        </h1>

        <p
          class="hero-rise mt-6 max-w-[42rem] text-base leading-relaxed text-balance sm:text-lg text-emerald-100/90"
          style="--d: 220ms"
        >
          Anak usia 4 tahun sampai SMP belajar membaca Al-Qur'an dengan
          <strong class="font-semibold text-white whitespace-nowrap">Metode At-Tartil 6 Jilid</strong>.
          Bacaan setiap anak disimak satu per satu oleh ustadz dan ustadzah yang
          sabar. Kelas Senin sampai Jumat, pilih sesi sore atau ba'da Maghrib.
        </p>

        <!-- Actions -->
        <div
          class="hero-rise mt-8 flex w-full max-w-sm flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center"
          style="--d: 300ms"
        >
          <a
            :href="googleFormUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="hero-cta group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 rounded-xl shadow-[0_14px_30px_-10px_rgba(251,191,36,0.6)] hover:shadow-[0_18px_34px_-10px_rgba(251,191,36,0.75)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
          >
            <span>Daftar Santri Baru</span>
            <svg
              class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>

          <a
            :href="contactElla.waLink"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-base font-semibold text-white rounded-xl border border-amber-200/40 bg-white/5 hover:bg-white/10 hover:border-amber-200/70 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
          >
            <svg class="w-5 h-5 text-emerald-300 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>Tanya via WhatsApp</span>
          </a>
        </div>

        <p
          class="hero-rise mt-5 flex flex-col items-center gap-0.5 text-sm text-emerald-200/90"
          style="--d: 360ms"
        >
          <span class="inline-flex items-center gap-2 font-medium text-white/95">
            <span class="w-2 h-2 rounded-full bg-amber-400 motion-safe:animate-pulse" aria-hidden="true"></span>
            Penerimaan Santri Baru &middot; Sawotratap, Sidoarjo
          </span>
          <span>Isi formulir sekitar 3 menit dari HP. Tanpa biaya formulir.</span>
        </p>
      </div>

      <!-- Mihrab: the artwork in its niche -->
      <figure class="hero-mihrab relative mx-auto mt-10 w-[min(86vw,27rem)]">
        <!-- star halo -->
        <div
          class="hero-halo-wrap pointer-events-none"
          aria-hidden="true"
        >
          <svg class="hero-halo block w-full h-auto" viewBox="-100 -100 200 200" fill="none" stroke="#fcd34d" stroke-width="0.5" stroke-opacity="0.38">
            <circle r="97" />
            <circle r="93" stroke-dasharray="0.6 4" stroke-linecap="round" stroke-opacity="0.55" />
            <path d="M86.00 0.00 L0.00 86.00 L-86.00 0.00 L-0.00 -86.00 Z"/><path d="M60.81 60.81 L-60.81 60.81 L-60.81 -60.81 L60.81 -60.81 Z"/><path d="M59.13 24.49 L-24.49 59.13 L-59.13 -24.49 L24.49 -59.13 Z"/><path d="M24.49 59.13 L-59.13 24.49 L-24.49 -59.13 L59.13 -24.49 Z"/><path d="M44.00 0.00 L0.00 44.00 L-44.00 0.00 L-0.00 -44.00 Z"/><path d="M31.11 31.11 L-31.11 31.11 L-31.11 -31.11 L31.11 -31.11 Z"/>
          </svg>
        </div>

        <!-- arch -->
        <svg
          class="relative block w-full h-auto"
          viewBox="0 -16 480 592"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hero-arch-stroke" x1="0" y1="0" x2="0" y2="576" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#fde68a" stop-opacity="0.95" />
              <stop offset="0.7" stop-color="#fcd34d" stop-opacity="0.55" />
              <stop offset="1" stop-color="#fcd34d" stop-opacity="0" />
            </linearGradient>
            <radialGradient id="hero-niche-fill" cx="240" cy="330" r="300" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#fbbf24" stop-opacity="0.26" />
              <stop offset="0.55" stop-color="#10b981" stop-opacity="0.12" />
              <stop offset="1" stop-color="#022c1e" stop-opacity="0.35" />
            </radialGradient>
          </defs>
          <path class="hero-niche-in" d="M36 576 V266 C36 144 128 70 240 28 C352 70 444 144 444 266 V576 Z" fill="url(#hero-niche-fill)" />
          <path class="hero-draw" pathLength="1" d="M18 576 V262 C18 132 118 52 240 8 C362 52 462 132 462 262 V576" stroke="url(#hero-arch-stroke)" stroke-width="2" />
          <path class="hero-draw hero-draw-2" pathLength="1" d="M36 576 V266 C36 144 128 70 240 28 C352 70 444 144 444 266 V576" stroke="url(#hero-arch-stroke)" stroke-width="1" />
          <path class="hero-niche-in" d="M240 -12 L247 -4 L240 4 L233 -4 Z" fill="#fde68a" />
        </svg>

        <img
          src="/hero-blended-1.webp"
          alt="Santri mengaji riang bersama ustadzah di TPQ Amanah"
          width="480"
          height="480"
          fetchpriority="high"
          class="hero-img-in absolute bottom-0 left-0 w-full h-auto select-none pointer-events-none drop-shadow-[0_22px_34px_rgba(0,0,0,0.45)]"
        />
        <div class="hero-threshold" aria-hidden="true"></div>
      </figure>

      <!-- Below the niche: hadith, facts, registration seal -->
      <div
        class="relative flex flex-col items-center max-w-3xl px-4 pb-20 mx-auto mt-12 text-center sm:px-6 sm:pb-24 lg:pb-28"
      >
        <blockquote class="max-w-xl">
          <p class="text-lg italic leading-snug sm:text-xl text-amber-100">
            &ldquo;Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan
            mengajarkannya.&rdquo;
          </p>
          <footer class="mt-2 text-sm text-emerald-200/85">
            (HR. Bukhari No. 5027)
          </footer>
        </blockquote>

        <ul
          class="flex flex-col items-center justify-center mt-8 text-sm font-medium gap-y-1.5 sm:flex-row sm:flex-wrap sm:gap-x-4 text-emerald-100/90"
        >
          <li>6 Jilid Metode At-Tartil</li>
          <li class="hidden text-amber-300 sm:block" aria-hidden="true">
            <svg class="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0 L16 8 L8 16 L0 8 Z" /></svg>
          </li>
          <li>2 Sesi: Sore &amp; Ba'da Maghrib</li>
          <li class="hidden text-amber-300 sm:block" aria-hidden="true">
            <svg class="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0 L16 8 L8 16 L0 8 Z" /></svg>
          </li>
          <li>10+ Tahun Amanah Membina</li>
        </ul>

        <!-- Official registration: the number comes from the Tanda Daftar LPQ issued by Kemenag Sidoarjo -->
        <p class="flex items-center justify-center max-w-2xl gap-2 mt-5 text-sm text-emerald-100/90">
          <svg class="w-5 h-5 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span
            >Terdaftar resmi di Kementerian Agama Kabupaten Sidoarjo &middot;
            <span class="font-semibold text-white whitespace-nowrap">NSPQ 411235151939</span></span
          >
        </p>
      </div>

      <div class="lp-fringe-bottom" aria-hidden="true"></div>
    </section>

    <!-- ================================================================= -->
    <!-- 2. TRUST STRIP: four facts on one line, divided by gold hairlines  -->
    <!-- ================================================================= -->
    <section
      aria-labelledby="ringkasan-keunggulan"
      class="lp-section lp-ivory relative z-20 !pt-10 !pb-12 lg:!pt-14 lg:!pb-16"
    >
      <h2 id="ringkasan-keunggulan" class="sr-only">
        Ringkasan keunggulan TPQ Amanah
      </h2>
      <div class="lp-wrap">
        <ul
          class="grid max-w-6xl mx-auto gap-y-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-amber-700/15"
        >
          <li class="flex flex-col items-center px-6 text-center">
            <StarBadge><svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
               aria-hidden="true">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg></StarBadge>
            <h3 class="mt-4 text-base font-bold leading-snug lp-ink">
              Belajar Bertahap, 6 Jilid
            </h3>
            <p class="mt-1.5 text-sm leading-relaxed lp-body">
              Dari mengenal huruf hijaiyah sampai siap membaca mushaf, satu
              jilid demi satu jilid.
            </p>
          </li>
          <li class="flex flex-col items-center px-6 text-center">
            <StarBadge><svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
               aria-hidden="true">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg></StarBadge>
            <h3 class="mt-4 text-base font-bold leading-snug lp-ink">
              Guru yang Sabar
            </h3>
            <p class="mt-1.5 text-sm leading-relaxed lp-body">
              Anak dibimbing tanpa bentakan dan tanpa tes yang menegangkan.
            </p>
          </li>
          <li class="flex flex-col items-center px-6 text-center">
            <StarBadge><svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
               aria-hidden="true">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg></StarBadge>
            <h3 class="mt-4 text-base font-bold leading-snug lp-ink">
              Perkembangan Bisa Dipantau
            </h3>
            <p class="mt-1.5 text-sm leading-relaxed lp-body">
              Capaian bacaan dicatat di Buku Prestasi, dan E-Kitab bisa dibuka
              di rumah.
            </p>
          </li>
          <li class="flex flex-col items-center px-6 text-center">
            <StarBadge><svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
               aria-hidden="true">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg></StarBadge>
            <h3 class="mt-4 text-base font-bold leading-snug lp-ink">
              Mudah Dikunjungi
            </h3>
            <p class="mt-1.5 text-sm leading-relaxed lp-body">
              Jl. Kertanegara No. 20, Sawotratap, Gedangan, Sidoarjo.
            </p>
          </li>
        </ul>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 3. PENDAFTARAN: timeline on the left, a mihrab-topped hub on the right -->
    <!-- ================================================================= -->
    <section
      id="pendaftaran"
      ref="registrationRef"
      class="lp-section lp-ivory scroll-mt-28 !pt-12 lg:!pt-16"
    >
      <div class="lp-wrap">
        <SectionHeading title="Alur Pendaftaran Calon Santri &amp; Santriwati">
          Pendaftaran bisa diselesaikan dari rumah lewat
          <strong class="font-semibold lp-ink">Formulir Google Form resmi</strong>,
          lalu dikonfirmasi lewat WhatsApp. Tidak ada tes yang menggugurkan:
          calon santri hanya ditempatkan di jilid yang sesuai dengan
          kesiapannya.
        </SectionHeading>

        <div class="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          <!-- Steps -->
          <div class="flex flex-col justify-between p-7 lp-card sm:p-10 lg:col-span-7">
            <div>
              <div
                class="flex flex-col gap-3 pb-6 mb-8 border-b sm:flex-row sm:items-center sm:justify-between border-amber-700/15"
              >
                <div>
                  <h3 class="text-xl font-bold sm:text-2xl lp-ink">
                    3 Langkah Mudah Mendaftar
                  </h3>
                  <p class="text-sm lp-body mt-0.5">Dari rumah, tanpa antre</p>
                </div>
                <span
                  class="self-start px-3.5 py-1.5 text-xs font-bold whitespace-nowrap border rounded-full sm:self-auto border-amber-700/35 text-amber-800 bg-amber-50"
                >
                  Estimasi 3 menit
                </span>
              </div>

              <ol class="space-y-9">
                <li class="relative pl-[4.5rem]">
                  <StarBadge class="!absolute left-0 top-0">1</StarBadge>
                  <span
                    class="absolute left-[1.625rem] top-[3.5rem] -bottom-9 w-px bg-gradient-to-b from-amber-700/50 to-amber-700/10"
                    aria-hidden="true"
                  ></span>
                  <h4 class="mb-1 text-base font-bold sm:text-lg lp-ink">
                    Isi formulir online
                  </h4>
                  <p class="mb-1 text-sm leading-relaxed lp-body">
                    Lengkapi data calon santri dan orang tua/wali di Google Form
                    resmi TPQ Amanah. Bisa dibuka langsung dari HP.
                  </p>
                  <a
                    :href="googleFormUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center text-sm font-bold underline transition-colors min-h-11 text-emerald-700 hover:text-emerald-900 underline-offset-4"
                  >
                    Buka formulir pendaftaran ↗
                  </a>
                </li>

                <li class="relative pl-[4.5rem]">
                  <StarBadge class="!absolute left-0 top-0">2</StarBadge>
                  <span
                    class="absolute left-[1.625rem] top-[3.5rem] -bottom-9 w-px bg-gradient-to-b from-amber-700/50 to-amber-700/10"
                    aria-hidden="true"
                  ></span>
                  <h4 class="mb-1 text-base font-bold sm:text-lg lp-ink">
                    Konfirmasi lewat WhatsApp &amp; pilih sesi
                  </h4>
                  <p class="mb-3 text-sm leading-relaxed lp-body">
                    Kirim nama santri ke koordinator agar kuota kelas dan jadwal
                    tercatat. Pilihan sesi: Sesi Sore pukul 15:30 atau Sesi
                    Malam pukul 18:00.
                  </p>
                  <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <a
                      :href="contactElla.waLink"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="lp-btn-line"
                    >
                      <span
                        >WA Ustadzah Ella
                        <span class="whitespace-nowrap"
                          >({{ contactElla.phone }}) ↗</span
                        ></span
                      >
                    </a>
                    <a
                      :href="contactRiski.waLink"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="lp-btn-line"
                    >
                      <span
                        >WA Ustadz Riski
                        <span class="whitespace-nowrap"
                          >({{ contactRiski.phone }}) ↗</span
                        ></span
                      >
                    </a>
                  </div>
                </li>

                <li class="relative pl-[4.5rem]">
                  <StarBadge class="!absolute left-0 top-0">3</StarBadge>
                  <h4 class="mb-1 text-base font-bold sm:text-lg lp-ink">
                    Penempatan jilid yang santai, lalu mulai belajar
                  </h4>
                  <p class="text-sm leading-relaxed lp-body">
                    Calon santri diajak berbincang santai untuk menentukan jilid
                    At-Tartil yang tepat (Jilid 1 sampai 6). Tidak ada tes yang
                    menegangkan, suasana dibuat nyaman dan ceria sejak hari
                    pertama.
                  </p>
                </li>
              </ol>
            </div>

            <div
              class="flex flex-wrap items-center justify-between pt-6 mt-9 text-sm border-t gap-x-4 gap-y-2 border-amber-700/15 lp-body"
            >
              <span class="inline-flex items-center gap-2 font-semibold text-emerald-800">
                <i class="lp-diamond text-amber-600"></i>
                Terbuka untuk usia 4 tahun sampai SMP
              </span>
              <span>Kelas berjalan Senin sampai Jumat</span>
            </div>
          </div>

          <!-- Hub: mihrab-topped panel -->
          <div
            class="flex flex-col justify-between px-6 pt-24 pb-7 lp-dark-panel rounded-t-[14rem] sm:px-9 sm:pb-9 lg:col-span-5"
          >
            <div class="text-center">
              <span
                class="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold border rounded-full whitespace-nowrap border-amber-200/40 text-amber-100 bg-white/5"
              >
                <span class="w-2 h-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" aria-hidden="true"></span>
                Pendaftaran Dibuka
              </span>
              <p class="mt-2 text-xs font-medium text-emerald-200/80">Sawotratap, Sidoarjo</p>

              <h3 class="mt-5 mb-3 text-2xl font-bold leading-tight tracking-tight text-white sm:text-[1.7rem] text-balance">
                Daftar Mandiri via Formulir Online Resmi
              </h3>
              <p class="mb-7 text-sm leading-relaxed text-emerald-100/85">
                Daftarkan putra-putri Anda dari rumah, tanpa antre, lewat
                Formulir Google Form resmi TPQ Amanah.
              </p>
            </div>

            <ul class="mb-8 text-sm lp-check is-dark">
              <li>
                <i class="lp-diamond"></i>
                <span><strong class="block font-bold text-white">100% Praktis</strong>
                  <span class="text-emerald-200/80">Cukup isi 3 menit dari HP</span></span>
              </li>
              <li>
                <i class="lp-diamond"></i>
                <span><strong class="block font-bold text-white">Metode At-Tartil</strong>
                  <span class="text-emerald-200/80">Kurikulum 6 Jilid terarah</span></span>
              </li>
              <li>
                <i class="lp-diamond"></i>
                <span><strong class="block font-bold text-white">2 Pilihan Sesi</strong>
                  <span class="text-emerald-200/80">Sore (15:30) &amp; Malam (18:00)</span></span>
              </li>
              <li>
                <i class="lp-diamond"></i>
                <span><strong class="block font-bold text-white">Bebas Biaya Form</strong>
                  <span class="text-emerald-200/80">Tanpa pungutan formulir awal</span></span>
              </li>
            </ul>

            <div class="pt-6 space-y-4 border-t border-amber-200/20">
              <a
                :href="googleFormUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full lp-btn-gold"
              >
                <span>Buka Formulir Google Form ↗</span>
              </a>

              <div>
                <div class="flex flex-wrap items-center justify-between mb-2.5 text-xs gap-x-3 gap-y-0.5">
                  <span class="text-white/80">Butuh bantuan pendaftaran?</span>
                  <span class="font-bold text-amber-300">Asatidz Pendamping</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <a :href="contactElla.waLink" target="_blank" rel="noopener noreferrer" class="lp-btn-ghost">
                    WA Ustadzah Ella
                  </a>
                  <a :href="contactRiski.waLink" target="_blank" rel="noopener noreferrer" class="lp-btn-ghost">
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
    <!-- 4. KEUNGGULAN: an arcade of four niches on an emerald band         -->
    <!-- ================================================================= -->
    <section
      id="keunggulan"
      class="lp-section lp-emerald lp-on-dark scroll-mt-28"
    >
      <span class="lp-fringe-top" aria-hidden="true"></span>
      <div class="lp-wrap">
        <SectionHeading dark title="Mengapa Mempercayakan Buah Hati di TPQ AMANAH?">
          Orang tua biasanya ingin tahu tiga hal: bagaimana anak belajar,
          siapa yang membimbing, dan bagaimana perkembangannya bisa dipantau.
          Inilah yang kami kerjakan di setiap pertemuan.
        </SectionHeading>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5 pb-6">
          <article class="lp-niche">
            <StarBadge gold class="mb-5"><svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                 aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg></StarBadge>
            <h3 class="mb-2 text-lg font-bold text-white">Metode At-Tartil 6 Jilid</h3>
            <p class="text-sm leading-relaxed text-emerald-100/80">
              Anak belajar bertahap: mulai dari huruf hijaiyah dan makhraj,
              kaidah tajwid, sampai membaca Al-Qur'an dengan tartil. Santri
              ditempatkan sesuai kesiapan membaca, bukan hanya usia.
            </p>
            <span class="inline-flex items-center gap-2 pt-5 mt-auto text-xs font-bold text-amber-300">
              <i class="lp-diamond"></i>Kurikulum At-Tartil
            </span>
          </article>

          <article class="lp-niche">
            <StarBadge gold class="mb-5"><svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                 aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg></StarBadge>
            <h3 class="mb-2 text-lg font-bold text-white">Pendidik Sabar &amp; Penuh Kasih</h3>
            <p class="text-sm leading-relaxed text-emerald-100/80">
              Ustadz dan ustadzah mendampingi tiap santri sesuai karakternya
              dengan pendekatan positif, tanpa bentakan.
            </p>
            <span class="inline-flex items-center gap-2 pt-5 mt-auto text-xs font-bold text-amber-300">
              <i class="lp-diamond"></i>Bimbingan Hati ke Hati
            </span>
          </article>

          <article class="lp-niche">
            <StarBadge gold class="mb-5"><svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                 aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg></StarBadge>
            <h3 class="mb-2 text-lg font-bold text-white">Adab &amp; Praktik Ibadah</h3>
            <p class="text-sm leading-relaxed text-emerald-100/80">
              Santri dibiasakan berwudhu dan shalat dengan tertib, menghafal
              doa harian, serta bersikap santun kepada orang tua dan guru.
            </p>
            <span class="inline-flex items-center gap-2 pt-5 mt-auto text-xs font-bold text-amber-300">
              <i class="lp-diamond"></i>Akhlakul Karimah
            </span>
          </article>

          <article class="lp-niche">
            <StarBadge gold class="mb-5"><svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                 aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg></StarBadge>
            <h3 class="mb-2 text-lg font-bold text-white">Transparan &amp; Digital Terpadu</h3>
            <p class="text-sm leading-relaxed text-emerald-100/80">
              Setiap selesai sesi, capaian bacaan dicatat di Buku Prestasi
              Santri. Di rumah, orang tua bisa menyimak materi lewat E-Kitab
              digital.
            </p>
            <span class="inline-flex items-center gap-2 pt-5 mt-auto text-xs font-bold text-amber-300">
              <i class="lp-diamond"></i>Amanah &amp; Terukur
            </span>
          </article>
        </div>
      </div>
      <span class="lp-fringe-bottom" aria-hidden="true"></span>
    </section>

    <!-- ================================================================= -->
    <!-- 5. PROGRAM: six jilid as one path, zig-zagging around the centre   -->
    <!-- ================================================================= -->
    <section
      id="program"
      aria-label="Program Unggulan TPQ Amanah"
      class="lp-section lp-ivory scroll-mt-28"
    >
      <div class="lp-wrap">
        <SectionHeading title="Tahapan Kurikulum 6 Jilid At-Tartil">
          Enam jilid disusun berjenjang: dari mengenal huruf hijaiyah sampai
          siap membaca mushaf Al-Qur'an dengan tartil. Tiap jilid punya target
          yang jelas, jadi orang tua tahu apa yang sedang dipelajari anak.
        </SectionHeading>

        <ol class="mb-16 lp-journey">
          <li class="lp-reveal">
            <StarBadge class="lp-node">1</StarBadge>
            <article class="p-6 lp-card lp-lift sm:p-7">
              <div class="flex items-baseline justify-between gap-3 mb-3">
                <span class="text-sm font-extrabold lp-ink">Jilid 1</span>
                <span class="text-xs font-semibold text-amber-800">Dasar Hijaiyah</span>
              </div>
              <h3 class="mb-2 text-lg font-bold lp-ink">Huruf Tunggal Hijaiyah &amp; Fathah</h3>
              <p class="text-sm leading-relaxed lp-body">
                Mengenal dan melafalkan huruf hijaiyah alif sampai ya' dengan
                tepat sesuai makharijul huruf serta pelafalan harakat fathah
                secara tegas dan tidak tergesa-gesa.
              </p>
              <p class="flex items-start gap-2 pt-3.5 mt-5 text-sm font-semibold border-t border-amber-700/15 text-emerald-800">
                <i class="lp-diamond mt-1.5 text-amber-600"></i>
                Target: Fasih membedakan bentuk &amp; bunyi huruf tunggal
              </p>
            </article>
          </li>

          <li class="lp-reveal">
            <StarBadge class="lp-node">2</StarBadge>
            <article class="p-6 lp-card lp-lift sm:p-7">
              <div class="flex items-baseline justify-between gap-3 mb-3">
                <span class="text-sm font-extrabold lp-ink">Jilid 2</span>
                <span class="text-xs font-semibold text-amber-800">Rangkaian Huruf</span>
              </div>
              <h3 class="mb-2 text-lg font-bold lp-ink">Huruf Sambung &amp; Kasrah/Dhammah</h3>
              <p class="text-sm leading-relaxed lp-body">
                Memahami perubahan bentuk huruf saat berada di awal, tengah, dan
                akhir kata serta melafalkan harakat kasrah (-i) dan dhammah (-u)
                secara presisi.
              </p>
              <p class="flex items-start gap-2 pt-3.5 mt-5 text-sm font-semibold border-t border-amber-700/15 text-emerald-800">
                <i class="lp-diamond mt-1.5 text-amber-600"></i>
                Target: Lancar membaca 3-4 huruf yang bersambung
              </p>
            </article>
          </li>

          <li class="lp-reveal">
            <StarBadge class="lp-node">3</StarBadge>
            <article class="p-6 lp-card lp-lift sm:p-7">
              <div class="flex items-baseline justify-between gap-3 mb-3">
                <span class="text-sm font-extrabold lp-ink">Jilid 3</span>
                <span class="text-xs font-semibold text-amber-800">Mad Thabi'i</span>
              </div>
              <h3 class="mb-2 text-lg font-bold lp-ink">Kaidah Mad &amp; Bacaan Panjang</h3>
              <p class="text-sm leading-relaxed lp-body">
                Menanamkan kepekaan ritme panjang-pendek bacaan (2 harakat)
                dengan bantuan alif, ya' sukun, dan wawu sukun, menghindari
                kesalahan memanjangkan bacaan pendek.
              </p>
              <p class="flex items-start gap-2 pt-3.5 mt-5 text-sm font-semibold border-t border-amber-700/15 text-emerald-800">
                <i class="lp-diamond mt-1.5 text-amber-600"></i>
                Target: Konsistensi ayunan ketukan 2 harakat
              </p>
            </article>
          </li>

          <li class="lp-reveal">
            <StarBadge class="lp-node">4</StarBadge>
            <article class="p-6 lp-card lp-lift sm:p-7">
              <div class="flex items-baseline justify-between gap-3 mb-3">
                <span class="text-sm font-extrabold lp-ink">Jilid 4</span>
                <span class="text-xs font-semibold text-amber-800">Tanwin &amp; Sukun</span>
              </div>
              <h3 class="mb-2 text-lg font-bold lp-ink">Tanwin, Sukun, &amp; Kaidah Qolqolah</h3>
              <p class="text-sm leading-relaxed lp-body">
                Membaca tanda tanwin (an, in, un), mematikan huruf (sukun),
                serta memantulkan 5 huruf qolqolah (ba, jim, dal, tha, qaf)
                dengan pantulan jernih.
              </p>
              <p class="flex items-start gap-2 pt-3.5 mt-5 text-sm font-semibold border-t border-amber-700/15 text-emerald-800">
                <i class="lp-diamond mt-1.5 text-amber-600"></i>
                Target: Penguasaan huruf mati &amp; qolqolah sempurna
              </p>
            </article>
          </li>

          <li class="lp-reveal">
            <StarBadge class="lp-node">5</StarBadge>
            <article class="p-6 lp-card lp-lift sm:p-7">
              <div class="flex items-baseline justify-between gap-3 mb-3">
                <span class="text-sm font-extrabold lp-ink">Jilid 5</span>
                <span class="text-xs font-semibold text-amber-800">Tajwid Aplikatif</span>
              </div>
              <h3 class="mb-2 text-lg font-bold lp-ink">Tasydid, Idgham, &amp; Dengung (Ghunnah)</h3>
              <p class="text-sm leading-relaxed lp-body">
                Menerapkan hukum bacaan tasydid, idgham bighunnah/bilaghunnah,
                ikhfa', dan iqlab secara alami melalui ketukan lagu tartil tanpa
                beban hafalan rumus rumit.
              </p>
              <p class="flex items-start gap-2 pt-3.5 mt-5 text-sm font-semibold border-t border-amber-700/15 text-emerald-800">
                <i class="lp-diamond mt-1.5 text-amber-600"></i>
                Target: Kesempurnaan dengung (ghunnah) 2 harakat
              </p>
            </article>
          </li>

          <li class="lp-reveal">
            <StarBadge class="lp-node">6</StarBadge>
            <article class="p-6 lp-card lp-lift sm:p-7">
              <div class="flex items-baseline justify-between gap-3 mb-3">
                <span class="text-sm font-extrabold lp-ink">Jilid 6</span>
                <span class="text-xs font-semibold text-amber-800">Menuju Mushaf</span>
              </div>
              <h3 class="mb-2 text-lg font-bold lp-ink">Tanda Waqaf &amp; Ayat Gharibah</h3>
              <p class="text-sm leading-relaxed lp-body">
                Mengenal cara berhenti (waqaf), hukum mad wajib/jaiz, bacaan
                khusus (gharib), dan transisi membaca Al-Qur'an mushaf standar
                dengan tartil.
              </p>
              <p class="flex items-start gap-2 pt-3.5 mt-5 text-sm font-semibold border-t border-amber-700/15 text-emerald-800">
                <i class="lp-diamond mt-1.5 text-amber-600"></i>
                Target: Siap masuk Al-Qur'an besar &amp; tahfidz
              </p>
            </article>
          </li>
        </ol>

        <!-- Complementary programs -->
        <div class="p-8 lp-dark-panel sm:p-10 lg:p-12">
          <div class="grid gap-9 md:grid-cols-3 md:gap-0 md:divide-x md:divide-amber-200/15">
            <div class="md:px-8 md:first:pl-0 md:last:pr-0">
              <StarBadge gold class="mb-4">1</StarBadge>
              <h3 class="mb-1.5 text-lg font-bold text-white">Al-Qur'an &amp; Tahsin Lanjutan</h3>
              <p class="text-sm leading-relaxed text-emerald-100/80">
                Bimbingan membaca mushaf Al-Qur'an besar secara individual
                (sorogan) dengan pendalaman makhraj dan tartil bersanad.
              </p>
            </div>
            <div class="md:px-8">
              <StarBadge gold class="mb-4">2</StarBadge>
              <h3 class="mb-1.5 text-lg font-bold text-white">Tahfidzul Qur'an (Juz 'Amma)</h3>
              <p class="text-sm leading-relaxed text-emerald-100/80">
                Hafalan surat-surat pendek Juz 30 dan ayat pilihan melalui
                metode sima'i dan muraja'ah rutin berjenjang.
              </p>
            </div>
            <div class="md:px-8 md:last:pr-0">
              <StarBadge gold class="mb-4">3</StarBadge>
              <h3 class="mb-1.5 text-lg font-bold text-white">Praktik Shalat &amp; Doa Harian</h3>
              <p class="text-sm leading-relaxed text-emerald-100/80">
                Praktik langsung wudhu sempurna, shalat berjamaah, hafalan doa
                keseharian anak muslim, dan sirah keteladanan Nabi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 6. E-KITAB: books standing on a shelf                              -->
    <!-- ================================================================= -->
    <section id="at-tartil" class="lp-section lp-paper scroll-mt-28">
      <div class="lp-wrap">
        <SectionHeading title="E-Kitab Digital At-Tartil 6 Jilid">
          Buku At-Tartil Jilid 1 sampai 6 bisa dibuka lewat HP atau komputer.
          Orang tua dapat membuka halaman yang sama dengan yang dipelajari
          anak di TPQ, lalu mengulang bacaan bersama di rumah. Halamannya
          dibalik seperti buku sungguhan dan bisa diperbesar.
        </SectionHeading>

        <div class="grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3 lg:grid-cols-6">
          <div
            v-for="book in tartilBooks"
            :key="book.jilid"
            class="flex flex-col items-center text-center group"
          >
            <div class="at-tartil-book mx-auto max-w-[130px] w-full">
              <div class="at-tartil-spine" :style="{ background: book.spineBg }"></div>
              <div class="at-tartil-cover bg-slate-100">
                <img
                  :src="book.coverImage"
                  :alt="'Cover Buku At-Tartil Jilid ' + book.jilid"
                  width="130"
                  height="185"
                  loading="lazy"
                  class="object-cover w-full h-full select-none rounded-r-md"
                />
              </div>
            </div>
            <div class="w-full max-w-[170px] mt-3 lp-board" aria-hidden="true"></div>

            <h3 class="text-base font-bold lp-ink mb-0.5">Jilid {{ book.jilid }}</h3>
            <p class="flex-1 text-sm leading-snug lp-body">{{ book.desc }}</p>

            <a
              :href="`https://at-tartil.tpqamanahsawotratap.com/?jilid=${book.jilid}`"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Buka E-Kitab At-Tartil Jilid ${book.jilid}`"
              class="w-full max-w-[170px] mt-4 lp-btn-line"
            >
              <span>Baca Jilid {{ book.jilid }}</span> &rarr;
            </a>
          </div>
        </div>

        <div class="mt-14 text-center">
          <a
            href="https://at-tartil.tpqamanahsawotratap.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="px-7 lp-btn-gold"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
             aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>Buka Semua Kitab At-Tartil ↗</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 7. RUTINITAS 90 MENIT: the session as a proportional bar          -->
    <!-- ================================================================= -->
    <section
      aria-labelledby="rutinitas-title"
      class="lp-section lp-emerald lp-on-dark scroll-mt-28"
    >
      <span class="lp-fringe-top" aria-hidden="true"></span>
      <div class="lp-wrap">
        <SectionHeading dark heading-id="rutinitas-title" title="Rutinitas 90 Menit Sesi Belajar yang Terarah">
          Setiap pertemuan berdurasi 90 menit disusun secara terstruktur
          sehingga anak tidak hanya belajar membaca, tetapi juga melatih
          hafalan, konsentrasi, dan adab.
        </SectionHeading>

        <div class="max-w-6xl pb-6 mx-auto">
          <div
            class="lp-bar"
            role="img"
            aria-label="Pembagian 90 menit: 15 menit pembukaan, 45 menit bimbingan privat, 20 menit hafalan dan praktik ibadah, 10 menit penutup"
          >
            <span style="flex: 15; background: #6ee7b7">15</span>
            <span style="flex: 45; background: #fcd34d">45</span>
            <span style="flex: 20; background: #34d399">20</span>
            <span style="flex: 10; background: #fde68a">10</span>
          </div>
          <p class="mt-2 text-xs text-center text-emerald-200/70">menit</p>

          <div class="grid gap-9 mt-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-amber-200/15">
            <div class="lg:px-7 lg:first:pl-0 lg:last:pr-0">
              <p class="inline-flex items-center gap-2 mb-3 text-sm font-bold text-amber-300">
                <i class="lp-diamond" style="color: #6ee7b7"></i>Menit 00 - 15
              </p>
              <h3 class="mb-2 text-lg font-bold text-white">Pembukaan &amp; Doa Klasikal</h3>
              <p class="text-sm leading-relaxed text-emerald-100/80">
                Membuka sesi dengan ikrar santri, membaca Asmaul Husna, membaca
                surat Al-Fatihah, dan pembacaan bersama surat pendek pilihan.
              </p>
            </div>
            <div class="lg:px-7">
              <p class="inline-flex items-center gap-2 mb-3 text-sm font-bold text-amber-300">
                <i class="lp-diamond" style="color: #fcd34d"></i>Menit 15 - 60
              </p>
              <h3 class="mb-2 text-lg font-bold text-white">Bimbingan Privat (Sorogan)</h3>
              <p class="text-sm leading-relaxed text-emerald-100/80">
                Setiap santri maju secara individual ke hadapan ustadz/ustadzah
                untuk membaca jilid atau Al-Qur'an dengan evaluasi tajwid dan
                makhraj perorangan.
              </p>
            </div>
            <div class="lg:px-7">
              <p class="inline-flex items-center gap-2 mb-3 text-sm font-bold text-amber-300">
                <i class="lp-diamond" style="color: #34d399"></i>Menit 60 - 80
              </p>
              <h3 class="mb-2 text-lg font-bold text-white">Hafalan &amp; Praktik Ibadah</h3>
              <p class="text-sm leading-relaxed text-emerald-100/80">
                Setoran surat pendek Juz 'Amma, mengulang doa-doa harian,
                bimbingan gerakan shalat fardhu, dan pembacaan kisah teladan nabi.
              </p>
            </div>
            <div class="lg:px-7 lg:last:pr-0">
              <p class="inline-flex items-center gap-2 mb-3 text-sm font-bold text-amber-300">
                <i class="lp-diamond" style="color: #fde68a"></i>Menit 80 - 90
              </p>
              <h3 class="mb-2 text-lg font-bold text-white">Buku Prestasi &amp; Penutup</h3>
              <p class="text-sm leading-relaxed text-emerald-100/80">
                Pencatatan halaman capaian di Buku Prestasi Santri, pesan motivasi
                akhlak mulia oleh guru, dan doa kafaratul majlis bersama.
              </p>
            </div>
          </div>
        </div>
      </div>
      <span class="lp-fringe-bottom" aria-hidden="true"></span>
    </section>

    <!-- ================================================================= -->
    <!-- 8. TENTANG KAMI & STATISTIK                                        -->
    <!-- ================================================================= -->
    <section id="tentang" class="lp-section lp-ivory scroll-mt-28">
      <div class="lp-wrap">
        <SectionHeading title="Dedikasi Dakwah &amp; Pendidikan di Sawotratap">
          TPQ Amanah berdiri di Dusun Tratap, Sawotratap, dengan satu tujuan:
          membantu anak-anak belajar membaca Al-Qur'an dengan benar dan tumbuh
          berakhlak mulia.
        </SectionHeading>

        <div class="grid items-stretch gap-8 mb-14 lg:grid-cols-12 lg:gap-10">
          <!-- History -->
          <div class="flex flex-col justify-between p-8 lp-card sm:p-10 lg:col-span-7">
            <div>
              <div class="flex items-center gap-4 mb-7">
                <StarBadge><svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                   aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg></StarBadge>
                <div>
                  <h3 class="text-xl font-bold lp-ink">Sejarah &amp; Komitmen Pengabdian</h3>
                  <p class="text-xs sm:text-sm lp-body">
                    Perjalanan khidmat dakwah Al-Qur'an di Sawotratap
                  </p>
                </div>
              </div>

              <div class="space-y-6 text-sm leading-relaxed lp-body sm:text-base">
                <p>
                  {{ aboutContent.history || defaultAbout }}
                </p>
                <p>
                  Di TPQ Amanah, ketepatan pelafalan huruf (fashahah) dan
                  makhraj dilatih di setiap pertemuan. Di samping itu, santri
                  dikenalkan pada adab, doa harian, dan rasa cinta kepada
                  Al-Qur'an sejak usia dini.
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between pt-5 mt-8 text-sm border-t gap-x-4 gap-y-2 border-amber-700/15 lp-body">
              <span class="inline-flex items-center gap-2 font-semibold text-emerald-800">
                <i class="lp-diamond text-amber-600"></i>
                10+ Tahun Mengabdi di Sawotratap
              </span>
              <span>Dusun Tratap, Kec. Gedangan, Kab. Sidoarjo</span>
            </div>
          </div>

          <!-- Visi & Misi -->
          <div class="flex flex-col gap-6 lg:col-span-5">
            <div class="p-7 lp-dark-panel sm:p-8">
              <div class="flex items-center gap-4 mb-4">
                <StarBadge gold><svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                   aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg></StarBadge>
                <div>
                  <h3 class="text-lg font-bold text-white">Visi Lembaga</h3>
                  <p class="text-xs text-amber-300">Cita-Cita Utama</p>
                </div>
              </div>
              <p class="text-sm italic leading-relaxed sm:text-base text-emerald-50">
                &ldquo;{{ aboutContent.vision }}&rdquo;
              </p>
            </div>

            <div class="flex-1 p-7 lp-card sm:p-8">
              <div class="flex items-center gap-4 mb-5">
                <StarBadge><svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                   aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg></StarBadge>
                <div>
                  <h3 class="text-lg font-bold lp-ink">Misi TPQ Amanah</h3>
                  <p class="text-xs lp-body">Misi Pendidikan</p>
                </div>
              </div>

              <ul class="text-sm lp-check lp-body">
                <li v-for="(item, idx) in missionList" :key="idx">
                  <i class="lp-diamond"></i>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Counters -->
        <div ref="statsRef" class="p-8 lp-card sm:p-10">
          <div class="grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:divide-x lg:divide-amber-700/15">
            <div v-for="stat in stats" :key="stat.label" class="px-3 text-center">
              <div
                class="mb-1 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl lp-ink"
                :data-target="stat.rawValue"
              >
                {{ stat.displayValue }}
              </div>
              <div class="flex items-center justify-center gap-2 mb-2 text-amber-600" aria-hidden="true">
                <i class="w-6 h-px bg-current"></i><i class="lp-diamond !w-1.5 !h-1.5"></i><i class="w-6 h-px bg-current"></i>
              </div>
              <div class="text-xs font-semibold lp-body sm:text-sm">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 8b. LEGALITAS (HIDDEN UNLESS ADMIN ENABLES IT)                    -->
    <!-- ================================================================= -->
    <LegalDocuments />

    <!-- ================================================================= -->
    <!-- 9. JADWAL: afternoon and night as a symmetrical pair               -->
    <!-- ================================================================= -->
    <section id="jadwal" class="lp-section lp-paper scroll-mt-28">
      <div class="lp-wrap">
        <SectionHeading title="Jadwal & Sesi Mengaji Santri">
          Dua pilihan waktu belajar fleksibel setiap hari Senin hingga Jumat,
          dapat disesuaikan dengan ritme sekolah formal putra-putri Anda.
        </SectionHeading>

        <div class="relative grid max-w-5xl gap-6 mx-auto md:grid-cols-2 md:gap-14">
          <!-- centre axis between the two sessions -->
          <div class="absolute inset-y-8 left-1/2 hidden w-px -ml-px md:block bg-gradient-to-b from-transparent via-amber-700/40 to-transparent" aria-hidden="true"></div>
          <div class="absolute left-1/2 top-1/2 hidden w-3 h-3 -ml-1.5 -mt-1.5 rotate-45 md:block bg-amber-600 ring-4 ring-white" aria-hidden="true"></div>

          <!-- Sore -->
          <div class="flex flex-col justify-between p-8 lp-card lp-lift bg-gradient-to-b from-[#fff7e3] to-white">
            <div>
              <div class="flex items-center justify-between gap-4 mb-6">
                <StarBadge><svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                   aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg></StarBadge>
                <span class="px-3.5 py-1.5 text-xs font-bold border rounded-full border-amber-700/35 text-amber-900 bg-amber-100/70">
                  Sesi 1 • Ba'da Ashar
                </span>
              </div>

              <h3 class="mb-1.5 text-2xl font-bold lp-ink">Sesi Sore</h3>
              <p class="mb-6 text-sm lp-body">
                Direkomendasikan untuk santri usia dini (PAUD/TK) &amp; siswa SD
                Kelas 1-4
              </p>

              <div class="mb-6 space-y-3.5">
                <div class="flex items-center gap-3 py-3.5 border-y border-amber-700/20 text-amber-800">
                  <svg
                    class="w-6 h-6 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                   aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="text-xl font-extrabold lp-ink">15:30 - 17:00 WIB</span>
                </div>
                <div class="flex items-center gap-3 px-1 text-sm lp-body">
                  <svg
                    class="w-5 h-5 shrink-0 text-amber-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                   aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Senin s/d Jumat (5 Hari Aktif)</span>
                </div>
              </div>
            </div>

            <p class="pt-4 text-sm font-medium border-t border-amber-700/15 text-amber-900">
              Suasana ceria, segar, dan bersahabat sebelum waktu maghrib tiba.
            </p>
          </div>

          <!-- Malam -->
          <div class="flex flex-col justify-between p-8 lp-dark-panel">
            <div>
              <div class="flex items-center justify-between gap-4 mb-6">
                <StarBadge gold><svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                   aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg></StarBadge>
                <span class="px-3.5 py-1.5 text-xs font-bold border rounded-full border-amber-200/40 text-amber-100 bg-white/5">
                  Sesi 2 • Ba'da Maghrib
                </span>
              </div>

              <h3 class="mb-1.5 text-2xl font-bold text-white">Sesi Malam</h3>
              <p class="mb-6 text-sm text-emerald-100/80">
                Ideal untuk santri yang sekolah full-day, kelas lanjutan &amp;
                tahfidz
              </p>

              <div class="mb-6 space-y-3.5">
                <div class="flex items-center gap-3 py-3.5 border-y border-amber-200/20 text-amber-300">
                  <svg
                    class="w-6 h-6 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                   aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="text-xl font-extrabold text-white">18:00 - 19:30 WIB</span>
                </div>
                <div class="flex items-center gap-3 px-1 text-sm text-emerald-100/80">
                  <svg
                    class="w-5 h-5 shrink-0 text-amber-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                   aria-hidden="true">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Senin s/d Jumat (5 Hari Aktif)</span>
                </div>
              </div>
            </div>

            <p class="pt-4 text-sm font-medium border-t border-amber-200/20 text-emerald-100">
              Suasana lebih hening, khusyuk, dan fokus untuk pendalaman ayat
              Al-Qur'an.
            </p>
          </div>
        </div>

        <p class="mt-10 text-sm text-center sm:text-base lp-body">
          Belum yakin memilih sesi?
          <a
            :href="contactElla.waLink"
            target="_blank"
            rel="noopener noreferrer"
            class="font-bold underline text-emerald-700 underline-offset-4 decoration-amber-500 hover:text-emerald-900"
            >Tanyakan ke koordinator</a
          >, kami bantu menyesuaikan dengan jadwal sekolah anak.
        </p>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 10. DEWAN ASATIDZ: portraits in arch frames                        -->
    <!-- ================================================================= -->
    <section
      id="pengajar"
      aria-label="Dewan Pengajar"
      class="lp-section lp-ivory scroll-mt-28"
    >
      <div class="lp-wrap">
        <SectionHeading title="Ustadz &amp; Ustadzah Pembimbing">
          Kenali siapa yang mendampingi anak Anda di kelas. Setiap ustadz dan
          ustadzah memegang peran sesuai tingkat belajar santri.
          <template #after>
            <p class="mt-3 text-sm sm:text-base lp-body">
              Ingin tahu latar belakang atau pengalaman pengajar lebih jauh?
              <a
                :href="contactElla.waLink"
                target="_blank"
                rel="noopener noreferrer"
                class="font-bold underline text-emerald-700 underline-offset-4 decoration-amber-500 hover:text-emerald-900"
                >Tanyakan langsung lewat WhatsApp</a
              >.
            </p>
          </template>
        </SectionHeading>

        <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="teacher in teachers"
            :key="teacher.id"
            class="p-7 pt-9 text-center lp-card lp-lift"
          >
            <div class="lp-portrait">
              <img
                v-if="teacher.photoURL"
                :src="teacher.photoURL"
                :alt="teacher.name"
                width="144"
                height="176"
                loading="lazy"
                decoding="async"
                class="object-cover w-full h-full"
              />
              <div
                v-else
                class="flex items-center justify-center w-full h-full text-3xl font-bold text-amber-200"
              >
                {{ getInitials(teacher.name) }}
              </div>
            </div>

            <span
              class="inline-block px-3 py-1 mb-3 text-[11px] font-bold border rounded-full border-amber-700/30 text-amber-900 bg-amber-50"
            >
              {{ teacher.badge }}
            </span>

            <h3 class="text-lg font-bold lp-ink mb-0.5">{{ teacher.name }}</h3>
            <p class="mb-3 text-xs font-semibold text-amber-800">{{ teacher.position }}</p>
            <p class="text-sm leading-relaxed lp-body">{{ teacher.bio }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 11. TESTIMONI WALI SANTRI                                          -->
    <!-- ================================================================= -->
    <section aria-labelledby="testimoni-title" class="lp-section lp-paper scroll-mt-28">
      <div class="lp-wrap">
        <SectionHeading heading-id="testimoni-title" title="Pengalaman Wali Santri TPQ Amanah">
          Kesan dan ungkapan tulus orang tua santri yang mempercayakan
          pendidikan Al-Qur'an putra-putrinya di TPQ Amanah.
        </SectionHeading>

        <div class="grid gap-8 md:grid-cols-3">
          <figure
            v-for="(testi, idx) in testimonials"
            :key="idx"
            class="flex flex-col justify-between p-7 lp-card sm:p-8"
          >
            <div>
              <div class="lp-quote-mark" aria-hidden="true">&ldquo;</div>
              <div class="flex items-center gap-1 mb-4 text-amber-500" role="img" aria-label="Bintang lima">
                <svg v-for="s in 5" :key="s" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7L10 1.5z" />
                </svg>
              </div>
              <blockquote class="mb-6 text-sm italic leading-relaxed sm:text-base lp-body">
                {{ testi.comment }}
              </blockquote>
            </div>

            <figcaption class="flex items-center gap-3 pt-4 border-t border-amber-700/15">
              <StarBadge class="!w-10 !h-10 text-xs"><span class="text-[11px]">{{ getInitials(testi.name) }}</span></StarBadge>
              <div>
                <p class="text-sm font-bold lp-ink">{{ testi.name }}</p>
                <p class="text-xs lp-body">{{ testi.role }}</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 12. FAQ                                                            -->
    <!-- ================================================================= -->
    <section id="faq" class="lp-section lp-ivory scroll-mt-28">
      <div class="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
        <SectionHeading title="Pertanyaan yang Sering Diajukan">
          Jawaban jelas dan transparan mengenai sistem belajar dan penerimaan
          santri baru di TPQ Amanah.
        </SectionHeading>

        <div>
          <div v-for="(faq, index) in faqs" :key="index" class="lp-faq-item">
            <button
              type="button"
              class="flex items-center justify-between w-full gap-5 py-5 text-left transition-colors rounded-lg sm:py-6 lp-ink hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              :aria-expanded="activeFaq === index"
              :aria-controls="'faq-panel-' + index"
              @click="toggleFaq(index)"
            >
              <span class="text-base font-bold sm:text-lg">{{ faq.q }}</span>
              <StarBadge class="!w-9 !h-9">
                <svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M1.5 7h11" />
                  <path v-show="activeFaq !== index" d="M7 1.5v11" />
                </svg>
              </StarBadge>
            </button>

            <div
              v-show="activeFaq === index"
              :id="'faq-panel-' + index"
              role="region"
              class="pb-6 pr-12 text-[15px] leading-relaxed lp-body"
            >
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================================= -->
    <!-- 13. KONTAK & LOKASI                                                -->
    <!-- ================================================================= -->
    <section
      id="kontak"
      ref="contactRef"
      class="lp-section lp-paper scroll-mt-28"
    >
      <div class="lp-wrap">
        <SectionHeading title="Lokasi &amp; Kontak Resmi Lembaga">
          Pintu silaturahmi kami selalu terbuka untuk konsultasi pendaftaran
          santri baru atau kunjungan langsung ke lokasi TPQ Amanah.
        </SectionHeading>

        <div class="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          <div class="space-y-5 lg:col-span-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="p-5 text-center lp-card sm:p-6">
                <StarBadge class="mb-3"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                    />
                  </svg></StarBadge>
                <h3 class="mb-0.5 text-base font-bold lp-ink">Ustadzah Ella</h3>
                <p class="mb-2 text-xs lp-body">Koordinator Pendaftaran</p>
                <p class="mb-1">
                  <a
                    :href="'tel:' + contactElla.tel"
                    class="inline-flex items-center text-sm font-semibold min-h-11 text-emerald-800 hover:text-emerald-950"
                    >{{ contactElla.phone }}</a
                  >
                </p>
                <a
                  :href="contactElla.waLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 min-h-11 text-sm font-bold text-amber-800 hover:text-amber-950"
                >
                  <span>Chat WhatsApp</span> &rarr;
                </a>
              </div>

              <div class="p-5 text-center lp-card sm:p-6">
                <StarBadge class="mb-3"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                    />
                  </svg></StarBadge>
                <h3 class="mb-0.5 text-base font-bold lp-ink">Ustadz Riski</h3>
                <p class="mb-2 text-xs lp-body">Kepala Lembaga TPQ</p>
                <p class="mb-1">
                  <a
                    :href="'tel:' + contactRiski.tel"
                    class="inline-flex items-center text-sm font-semibold min-h-11 text-emerald-800 hover:text-emerald-950"
                    >{{ contactRiski.phone }}</a
                  >
                </p>
                <a
                  :href="contactRiski.waLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 min-h-11 text-sm font-bold text-amber-800 hover:text-amber-950"
                >
                  <span>Chat WhatsApp</span> &rarr;
                </a>
              </div>
            </div>

            <div class="flex items-start gap-4 p-5 lp-card sm:p-6">
              <StarBadge><svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                 aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg></StarBadge>
              <div>
                <h3 class="mb-1 text-base font-bold lp-ink">Alamat Lembaga</h3>
                <p class="text-sm leading-relaxed lp-body">
                  Jl. Kertanegara No. 20, Dusun Tratap, Sawotratap, Kec.
                  Gedangan, Kabupaten Sidoarjo, Jawa Timur 61256
                </p>
                <p class="mt-2 text-sm font-medium text-stone-500">
                  Patokan: Dekat perbatasan Waru - Sawotratap, akses mudah dan
                  lingkungan aman untuk anak.
                </p>
                <a
                  href="https://www.google.com/maps/dir/?api=1&amp;destination=-7.3688465,112.7361663"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-3 lp-btn-line"
                >
                  <span>Petunjuk Arah di Google Maps ↗</span>
                </a>
              </div>
            </div>

            <div class="flex flex-col gap-4 p-6 lp-dark-panel sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-base font-bold text-white">Formulir Pendaftaran Online</h3>
                <p class="text-xs text-emerald-100/80 mt-0.5">
                  Daftarkan santri baru kapan saja melalui Google Form
                </p>
              </div>
              <a
                :href="googleFormUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="px-6 lp-btn-gold"
              >
                Buka Form ↗
              </a>
            </div>
          </div>

          <!-- Map (lazy loaded) -->
          <div ref="mapRef" class="flex p-3 lp-card lg:col-span-6 sm:p-4">
            <iframe
              v-if="isMapVisible"
              :src="mapSrc"
              class="flex-1 w-full h-full min-h-[400px] lg:min-h-[460px] rounded-2xl border-0"
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              title="Peta Lokasi TPQ Amanah Sawotratap Sidoarjo"
            ></iframe>
            <div
              v-else
              class="flex items-center justify-center flex-1 w-full h-full min-h-[400px] lg:min-h-[460px] rounded-2xl bg-stone-50 text-stone-500"
            >
              <div class="p-6 text-center">
                <svg
                  class="w-9 h-9 mx-auto mb-3 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                 aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
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
    <aside
      aria-label="Aksi Cepat Pendaftaran"
      class="fixed z-40 flex flex-row items-center gap-2 transition-all duration-300 bottom-5 right-5 lg:hidden"
      :class="
        showFloatingCta
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 invisible'
      "
    >
      <!-- Floating Google Form CTA -->
      <a
        :href="googleFormUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 px-4 text-sm font-bold transition-all border rounded-full shadow-lg min-h-11 bg-amber-400 hover:bg-amber-300 text-slate-950 hover:scale-105 active:scale-95 border-white/60"
        title="Daftar via Google Form"
      >
        <svg
          class="w-4 h-4 text-slate-950 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>Daftar Santri Baru</span>
      </a>

      <!-- Floating WhatsApp CTA -->
      <a
        :href="contactElla.waLink"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center justify-center text-white transition-all border rounded-full shadow-lg w-11 min-h-11 bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/30 hover:scale-105 active:scale-95 border-white/30"
        title="Tanya Pendaftaran via WhatsApp"
      >
        <svg
          class="w-5 h-5 shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
          />
        </svg>
        <span class="sr-only">Tanya pendaftaran via WhatsApp</span>
      </a>
    </aside>

    <div ref="footerRef">
      <FooterComponent />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import Lenis from "lenis";
import NavbarComponent from "@/components/NavbarComponent.vue";
import FooterComponent from "@/components/FooterComponent.vue";
import LegalDocuments from "@/components/LegalDocuments.vue";
import SectionHeading from "@/components/landing/SectionHeading.vue";
import StarBadge from "@/components/landing/StarBadge.vue";
import "@/styles/landing.css";
import api from "@/services/api";

// Google Form Official Registration Link
const googleFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWnJ4biVA-l842Xk21cChVIEGzdB65XiH27w2wtm8Z-ynT6g/viewform?usp=send_form";

// Official Asatidz Contacts
const contactElla = {
  name: "Ustadzah Ella",
  phone: "0895-3039-7058",
  tel: "+6289530397058",
  waLink:
    "https://wa.me/6289530397058?text=Assalamu%27alaikum%20Ustadzah%20Ella%2C%20saya%20ingin%20bertanya%20informasi%20pendaftaran%20santri%20baru%20TPQ%20Amanah",
};

const contactRiski = {
  name: "Ustadz Riski",
  phone: "0822-3336-1877",
  tel: "+6282233361877",
  waLink:
    "https://wa.me/6282233361877?text=Assalamu%27alaikum%20Ustadz%20Riski%2C%20saya%20ingin%20bertanya%20informasi%20pendaftaran%20santri%20baru%20TPQ%20Amanah",
};

// Google Maps URL
const mapSrc =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d699.4818002710372!2d112.73616627742456!3d-7.368846491983087!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7e4957994e827%3A0x930e5eb7e09fb557!2sJl.%20Kertanegara%20No.20%2C%20Dusun%20Tratap%2C%20Sawotratap%2C%20Kec.%20Gedangan%2C%20Kabupaten%20Sidoarjo%2C%20Jawa%20Timur%2061256%2C%20Indonesia!5e0!3m2!1sid!2sus!4v1770188895319!5m2!1sid!2sus";

// Lazy loading for Google Maps
const mapRef = ref(null);

// The floating buttons only appear where the same actions are not already on screen.
const heroRef = ref(null);
const registrationRef = ref(null);
const contactRef = ref(null);
const footerRef = ref(null);
const showFloatingCta = ref(false);
const ctaTargetsInView = new Set();
let ctaObserver = null;
const isMapVisible = ref(false);
let mapObserver = null;

const defaultAbout =
  "TPQ AMANAH didirikan dengan tekad suci untuk membimbing generasi Qur'ani yang tartil membaca, memahami makna dasar kalamullah, dan mengamalkan akhlak mulia dalam kehidupan bermasyarakat di Sawotratap, Gedangan, Sidoarjo.";

const teachers = ref([]);
const aboutContent = ref({
  history: "",
  vision:
    "Menjadi lembaga pendidikan Al-Qur'an terdepan yang menghasilkan generasi Qur'ani berakhlakul karimah, berilmu, mandiri, dan berbakti kepada orang tua.",
  mission: "",
});

const missionList = computed(() => {
  if (aboutContent.value.mission) {
    return aboutContent.value.mission.split("\n").filter((m) => m.trim());
  }
  return [
    "Menyelenggarakan pembelajaran membaca Al-Qur'an metode At-Tartil 6 Jilid yang tartil, sistematis, dan menyenangkan.",
    "Menanamkan nilai akidah, akhlakul karimah, dan pembiasaan ibadah praktis sejak usia dini.",
    "Membangun lingkungan belajar yang islami, ramah anak, berkarakter, dan penuh kasih sayang.",
  ];
});

// Authentic At-Tartil 3D Books Config matching at-tartil.riskiputraalamzah.my.id
const tartilBooks = [
  {
    jilid: 1,
    desc: "Huruf Tunggal Hijaiyah & Fathah",
    coverImage: "/tartil/cover1.webp",
    spineBg: "linear-gradient(to right, #854d0e, #ca8a04)",
  },
  {
    jilid: 2,
    desc: "Huruf Sambung & Kasrah/Dhammah",
    coverImage: "/tartil/cover2.webp",
    spineBg: "linear-gradient(to right, #0369a1, #38bdf8)",
  },
  {
    jilid: 3,
    desc: "Mad Thobi'i & Bacaan Panjang",
    coverImage: "/tartil/cover3.webp",
    spineBg: "linear-gradient(to right, #15803d, #4ade80)",
  },
  {
    jilid: 4,
    desc: "Tanwin, Sukun & Qolqolah",
    coverImage: "/tartil/cover4.webp",
    spineBg: "linear-gradient(to right, #be185d, #f472b6)",
  },
  {
    jilid: 5,
    desc: "Tasydid, Idgham & Ikhfa'",
    coverImage: "/tartil/cover5.webp",
    spineBg: "linear-gradient(to right, #c2410c, #fb923c)",
  },
  {
    jilid: 6,
    desc: "Waqaf, Ayat Gharibah & Tajwid",
    coverImage: "/tartil/cover6.webp",
    spineBg: "linear-gradient(to right, #6b21a8, #c084fc)",
  },
];

// Stats Section with Counter Animation
const statsRef = ref(null);
const hasAnimated = ref(false);

const stats = ref([
  { rawValue: 80, displayValue: "0+", label: "Santri Aktif" },
  { rawValue: 6, displayValue: "0+", label: "Asatidz Bersertifikat" },
  { rawValue: 10, displayValue: "0+", label: "Tahun Pengabdian" },
  { rawValue: 100, displayValue: "0+", label: "Alumni Khatam Al-Qur'an" },
]);

// Testimoni Data
const testimonials = [
  {
    name: "Ibu Siti Rahmawati",
    role: "Wali dari Faiz (Santri Jilid 4)",
    comment:
      "Alhamdulillah, perkembangan mengaji Faiz pesat sekali sejak di TPQ Amanah. Sekarang bacaan tajwidnya tertata rapi dan dia selalu bersemangat tiap jam berangkat mengaji. Guru-gurunya sangat sabar.",
  },
  {
    name: "Bapak Ahmad Fauzi",
    role: "Wali dari Aisyah (Santri Al-Qur'an & Tahfidz)",
    comment:
      "Ustadz dan ustadzahnya mendidik dengan hati. Aisyah tidak hanya lancar membaca, tapi juga terbiasa shalat tepat waktu dan hafal doa harian di rumah. Kami sangat bersyukur.",
  },
  {
    name: "Ibu Nurul Hidayati",
    role: "Wali dari Rayhan (Santri Jilid 2)",
    comment:
      "Metode At-Tartil sangat pas untuk anak saya yang awalnya pemalu. Ditambah ada E-Kitab digital di HP, kami di rumah bisa mudah menyimak dan mendampingi belajarnya tanpa bingung.",
  },
];

// FAQ Data & State
const activeFaq = ref(0);
const toggleFaq = (index) => {
  activeFaq.value = activeFaq.value === index ? null : index;
};

const faqs = [
  {
    q: "Berapa usia minimal anak untuk mendaftar di TPQ Amanah?",
    a: "Mulai usia 4 tahun (jenjang PAUD/TK) sampai tingkat SD/MI dan SMP. Santri baru dikelompokkan sesuai usia dan kemampuan membaca awalnya.",
  },
  {
    q: "Anak saya belum mengenal huruf hijaiyah. Apakah bisa mendaftar?",
    a: "Bisa. Anak mulai dari Jilid 1 dan dibimbing pelan-pelan dengan metode At-Tartil, tanpa tekanan.",
  },
  {
    q: "Apakah ada tes seleksi yang menggugurkan calon santri?",
    a: "Tidak ada. Kami hanya melakukan penempatan jilid secara santai dan bersahabat, supaya anak belajar di jilid yang sesuai dengan kesiapan membacanya.",
  },
  {
    q: "Kapan jadwal mengaji, dan sesi mana yang cocok untuk anak saya?",
    a: "Kelas berjalan Senin sampai Jumat dalam dua sesi: Sesi Sore pukul 15:30 - 17:00 WIB (ba'da Ashar) dan Sesi Malam pukul 18:00 - 19:30 WIB (ba'da Maghrib). Sesi Sore direkomendasikan untuk usia dini dan SD kelas 1-4. Sesi Malam cocok untuk anak yang sekolah seharian, kelas lanjutan, dan tahfidz.",
  },
  {
    q: "Bagaimana orang tua memantau perkembangan mengaji anak?",
    a: "Setiap santri memiliki Buku Prestasi Santri yang diparaf ustadz atau ustadzah setiap selesai sesi, sehingga orang tua bisa melihat halaman capaian anak. Materi juga dapat disimak ulang di rumah lewat E-Kitab digital.",
  },
  {
    q: "Bagaimana cara mendaftar?",
    a: 'Isi Formulir Pendaftaran Google Form lewat tombol "Daftar Santri Baru" di halaman ini, lalu konfirmasi nama santri ke Ustadzah Ella (0895-3039-7058) atau Ustadz Riski (0822-3336-1877) lewat WhatsApp.',
  },
  {
    q: "Bolehkah saya melihat lokasi TPQ dulu sebelum mendaftar?",
    a: "Boleh. Hubungi koordinator lewat WhatsApp untuk mengatur kunjungan. Alamat lengkap dan peta ada di bagian Kontak & Lokasi.",
  },
];

const getInitials = (name) => {
  return name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TP";
};

// 6 Guru with lightweight WebP photos (<15KB each)
const fetchTeachers = async () => {
  teachers.value = [
    {
      id: 1,
      name: "Ustadz Riski",
      position: "Kepala Lembaga TPQ",
      bio: "Berpengalaman membina pendidikan Al-Qur'an dan tahsin bersanad lebih dari 10 tahun.",
      photoURL: "/guru/riski.webp",
      badge: "Kepala TPQ",
    },
    {
      id: 2,
      name: "Ustadzah Aini",
      position: "Guru Jilid Dasar",
      bio: "Penuh kesabaran mendampingi santri usia dini dengan metode bermain dan bernyanyi islami.",
      photoURL: "/guru/aini.webp",
      badge: "Usia Dini",
    },
    {
      id: 3,
      name: "Ustadzah Ella",
      position: "Guru Tajwid & Tahsin",
      bio: "Ahli kaidah tajwid praktis, membimbing pelafalan makharijul huruf santri agar fasih.",
      photoURL: "/guru/ella.webp",
      badge: "Tajwid & Tahsin",
    },
    {
      id: 4,
      name: "Ustadzah Annifa",
      position: "Guru Tahfidz",
      bio: "Membimbing setoran hafalan Juz 30 dengan teknik mutqin dan muraja'ah teratur.",
      photoURL: "/guru/annifa.webp",
      badge: "Tahfidzul Qur'an",
    },
    {
      id: 5,
      name: "Ustadzah Febi",
      position: "Guru Al-Qur'an Lanjutan",
      bio: "Mendampingi santri Al-Qur'an besar agar lancar, tartil, dan memahami tanda waqaf.",
      photoURL: "/guru/febi.webp",
      badge: "Tartil Lanjutan",
    },
    {
      id: 6,
      name: "Ustadz Nurul",
      position: "Pembina Adab & Ibadah",
      bio: "Membina pembiasaan wudhu, shalat berjamaah, dan akhlakul karimah santri sehari-hari.",
      photoURL: "/guru/nurul.webp",
      badge: "Adab & Ibadah",
    },
  ];
};

const fetchContent = async () => {
  try {
    // One request serves every landing page section, and it does not 404 before the first save.
    const { data } = await api.get("/content");
    if (data?.about) {
      aboutContent.value = { ...aboutContent.value, ...data.about };
    }
  } catch {
    // Fallback to defaultAbout
  }
};

let lenis = null;

onMounted(() => {
  // Initialize Lenis Smooth Scroll
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  });

  function raf(time) {
    if (lenis) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
  }

  requestAnimationFrame(raf);

  fetchTeachers();
  fetchContent();

  ctaObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) ctaTargetsInView.add(entry.target);
      else ctaTargetsInView.delete(entry.target);
    });
    showFloatingCta.value = ctaTargetsInView.size === 0;
  });
  [heroRef, registrationRef, contactRef, footerRef].forEach((target) => {
    if (target.value) ctaObserver.observe(target.value);
  });

  // Setup IntersectionObserver for lazy loading Google Maps
  if (mapRef.value) {
    mapObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isMapVisible.value = true;
            mapObserver?.disconnect();
          }
        });
      },
      { rootMargin: "250px" },
    );

    mapObserver.observe(mapRef.value);
  }

  // Setup IntersectionObserver for Stats Counter Animation
  if (statsRef.value) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.value) {
            hasAnimated.value = true;
            animateCounters();
            statsObserver.disconnect();
          }
        });
      },
      { threshold: 0.25 },
    );

    statsObserver.observe(statsRef.value);
  }
});

// Counter Animation Function
const animateCounters = () => {
  stats.value.forEach((stat, index) => {
    let current = 0;
    const target = stat.rawValue;
    const duration = 1800;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        stats.value[index].displayValue = `${target}+`;
        clearInterval(timer);
      } else {
        stats.value[index].displayValue = `${Math.floor(current)}+`;
      }
    }, 16);
  });
};

onUnmounted(() => {
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
  mapObserver?.disconnect();
  ctaObserver?.disconnect();
});
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

/* Hero: ground light, khatam pattern, mihrab and the one authored entrance */
.hero-ground {
  background:
    radial-gradient(60rem 38rem at 50% 6%, rgba(251, 191, 36, 0.2), transparent 62%),
    radial-gradient(48rem 34rem at 50% 64%, rgba(16, 185, 129, 0.16), transparent 66%),
    linear-gradient(180deg, #03291d 0%, #053d2c 46%, #03261a 100%);
}

.hero-khatam {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23fcd34d' stroke-width='1' stroke-opacity='0.9'%3E%3Cpath d='M54.00 32.00 L32.00 54.00 L10.00 32.00 L32.00 10.00 Z'/%3E%3Cpath d='M47.56 47.56 L16.44 47.56 L16.44 16.44 L47.56 16.44 Z'/%3E%3C/g%3E%3Cg fill='%23fcd34d' fill-opacity='0.9'%3E%3Cpath d='M0 0 L4 0 L0 4Z'/%3E%3Cpath d='M64 0 L60 0 L64 4Z'/%3E%3Cpath d='M0 64 L4 64 L0 60Z'/%3E%3Cpath d='M64 64 L60 64 L64 60Z'/%3E%3C/g%3E%3C/svg%3E");
  background-size: 64px 64px;
  background-position: center top;
  opacity: 0.14;
  -webkit-mask-image: radial-gradient(ellipse 60% 52% at 50% 24%, #000 0%, transparent 76%);
  mask-image: radial-gradient(ellipse 60% 52% at 50% 24%, #000 0%, transparent 76%);
}

.hero-halo-wrap {
  position: absolute;
  left: 50%;
  top: 52%;
  width: 128%;
  transform: translate(-50%, -50%);
}

.hero-threshold {
  position: absolute;
  left: -6%;
  right: -6%;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(252, 211, 77, 0.75) 22%, rgba(252, 211, 77, 0.75) 78%, transparent);
  box-shadow: 0 8px 26px 2px rgba(251, 191, 36, 0.28);
}

.hero ::selection {
  background: #fcd34d;
  color: #03291d;
}

@media (prefers-reduced-motion: no-preference) {
  .hero-rise {
    animation: hero-rise 0.95s cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: var(--d, 0ms);
  }

  .hero-draw {
    stroke-dasharray: 1;
    animation: hero-draw 1.9s cubic-bezier(0.33, 1, 0.68, 1) 0.35s both;
  }

  .hero-draw-2 {
    animation-delay: 0.6s;
  }

  .hero-niche-in {
    animation: hero-fade 1.6s ease-out 0.7s both;
  }

  .hero-img-in {
    animation: hero-img 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.75s both;
  }

  .hero-halo {
    animation: hero-spin 140s linear infinite;
  }
}

@keyframes hero-rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes hero-draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}

@keyframes hero-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes hero-img {
  from { opacity: 0; transform: translateY(26px); filter: blur(6px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}

@keyframes hero-spin {
  to { transform: rotate(360deg); }
}
</style>
