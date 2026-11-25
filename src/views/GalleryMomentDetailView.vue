<template>
  <div class="min-h-screen font-sans lp flex flex-col !bg-[#03291d]">
    <NavbarComponent />

    <!-- Emerald Hero Band -->
    <section class="relative overflow-hidden lp-emerald lp-on-dark pt-28 pb-16 sm:pt-32 sm:pb-20">
      <div class="lp-wrap lp-page-rise">
        <!-- Breadcrumb -->
        <nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-1.5 mb-5 text-xs sm:text-sm font-medium text-emerald-100/80">
          <router-link to="/" class="transition-colors hover:text-amber-300">
            Beranda
          </router-link>
          <span aria-hidden="true" class="text-amber-300/60">/</span>
          <router-link to="/dokumentasi" class="transition-colors hover:text-amber-300">
            Dokumentasi
          </router-link>
          <template v-if="moment">
            <span aria-hidden="true" class="text-amber-300/60">/</span>
            <router-link
              :to="{ path: '/dokumentasi', query: { kategori: moment.categoryId } }"
              class="font-semibold transition-colors text-amber-300 hover:underline underline-offset-4"
            >
              {{ moment.categoryLabel }}
            </router-link>
          </template>
        </nav>

        <!-- Loading Header Skeleton -->
        <div v-if="loading" class="max-w-3xl space-y-4 animate-pulse" aria-busy="true">
          <div class="w-40 h-6 rounded-full bg-white/15"></div>
          <div class="w-4/5 h-10 rounded-xl bg-white/15"></div>
          <div class="w-2/3 h-5 rounded-lg bg-white/10"></div>
        </div>

        <!-- Loaded Moment Header -->
        <div v-else-if="moment" class="max-w-4xl">
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span class="px-3 py-1 text-xs font-bold rounded-full bg-amber-300 text-slate-950">
              {{ moment.categoryLabel }}
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-white/10 text-emerald-50 border border-amber-200/20">
              {{ formatMomentDate(moment.momentDate) }}
            </span>
            <span
              v-if="mediaSummaryText"
              class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-white/10 text-emerald-100 border border-white/10"
            >
              {{ mediaSummaryText }}
            </span>
          </div>

          <h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] leading-tight text-balance">
            {{ moment.title }}
          </h1>

          <p
            v-if="moment.caption"
            class="max-w-3xl mt-4 text-sm leading-relaxed whitespace-pre-line sm:text-base text-emerald-100/90"
          >
            {{ moment.caption }}
          </p>

          <!-- Action Bar: Like toggle + Share (clean mobile ergonomics) -->
          <div class="flex flex-col gap-2.5 mt-7 sm:flex-row sm:flex-wrap sm:items-center">
            <div class="flex items-center gap-2 sm:contents">
              <button
                type="button"
                :aria-pressed="isLiked(moment)"
                :aria-label="isLiked(moment) ? 'Batal sukai momen ini' : 'Sukai momen ini'"
                :disabled="isPending(moment)"
                class="inline-flex items-center justify-center gap-2 min-h-[46px] px-4 sm:px-5 rounded-xl text-sm font-bold border transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:opacity-75"
                :class="
                  isLiked(moment)
                    ? 'bg-rose-500/20 border-rose-300/70 text-rose-100 hover:bg-rose-500/30 shadow-sm'
                    : 'bg-white/10 border-amber-200/35 text-white hover:bg-white/20'
                "
                @click="onToggleLike(moment)"
              >
                <svg
                  class="w-[18px] h-[18px] shrink-0 transition-transform"
                  :class="[
                    isLiked(moment) ? 'text-rose-400' : 'text-amber-200',
                    isPopped(moment) ? 'lp-heart-pop' : '',
                  ]"
                  :fill="isLiked(moment) ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="2.1"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
                <span>{{ isLiked(moment) ? 'Disukai' : 'Suka' }}</span>
                <span
                  v-if="likeCountOf(moment) > 0"
                  class="px-2 py-0.5 text-xs font-extrabold rounded-full tabular-nums"
                  :class="isLiked(moment) ? 'bg-rose-400/25 text-rose-100' : 'bg-white/15 text-amber-200'"
                >
                  {{ likeCountOf(moment) }}
                </span>
              </button>

              <a
                :href="whatsappShareHref"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 min-h-[46px] px-4 sm:px-5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 shadow-md transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
              >
                <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Bagikan via WA</span>
              </a>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-bold border border-amber-200/35 bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
                @click="copyShareLink"
              >
                <svg v-if="!copied" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <svg v-else class="w-4 h-4 text-emerald-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{{ copied ? 'Link Tersalin' : 'Salin Link' }}</span>
              </button>

              <button
                v-if="canNativeShare"
                type="button"
                class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-bold border border-white/20 bg-white/5 hover:bg-white/15 text-emerald-50 transition-colors"
                @click="triggerNativeShare"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
                </svg>
                <span>Bagikan</span>
              </button>
            </div>
          </div>
          <p v-if="likeFeedback" class="mt-2.5 text-xs font-semibold text-amber-200" role="status">
            {{ likeFeedback }}
          </p>
        </div>

        <!-- Not Found Header -->
        <div v-else class="max-w-2xl">
          <h1 class="text-2xl font-extrabold text-white sm:text-3xl">
            Dokumentasi Tidak Ditemukan
          </h1>
          <p class="mt-2 text-sm text-emerald-100/80">
            Momen dokumentasi ini mungkin sudah dihapus atau disembunyikan oleh pengelola TPQ Amanah.
          </p>
        </div>
      </div>

      <span class="lp-fringe-bottom" aria-hidden="true"></span>
    </section>

    <!-- Main Ivory Detail Body -->
    <main class="relative flex-1 py-10 lp-ivory sm:py-14">
      <div class="lp-wrap space-y-12">
        <!-- Loading Content Skeleton -->
        <div v-if="loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 animate-pulse">
          <div v-for="n in 6" :key="n" class="aspect-[4/3] rounded-2xl bg-emerald-950/10"></div>
        </div>

        <!-- Error / 404 Card -->
        <div v-else-if="!moment" class="max-w-lg p-8 mx-auto text-center lp-card">
          <p class="text-base font-bold lp-ink">
            {{ loadError || 'Momen tidak tersedia.' }}
          </p>
          <p class="mt-2 text-sm lp-body">
            Silakan jelajahi momen dokumentasi kegiatan TPQ Amanah lainnya.
          </p>
          <div class="flex flex-wrap justify-center gap-3 mt-6">
            <router-link to="/dokumentasi" class="lp-btn-gold">
              Lihat Semua Dokumentasi
            </router-link>
            <router-link to="/" class="lp-btn-line">
              Kembali ke Beranda
            </router-link>
          </div>
        </div>

        <template v-else>
          <!-- Section 1: Photos Grid (click any photo to open Zoomable Lightbox) -->
          <section v-if="moment.photos?.length" aria-labelledby="detail-photos-heading">
            <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <h2 id="detail-photos-heading" class="text-xl font-extrabold sm:text-2xl lp-ink">
                  Galeri Foto ({{ moment.photos.length }})
                </h2>
                <p class="mt-1 text-xs sm:text-sm lp-body">
                  Ketuk foto mana saja untuk melihat layar penuh &amp; zoom in / zoom out.
                </p>
              </div>
              <button
                type="button"
                class="hidden sm:inline-flex lp-btn-line !min-h-[40px] !text-sm"
                @click="openLightboxAt(0)"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path stroke-linecap="round" d="m20 20-3.5-3.5M11 8v6M8 11h6" />
                </svg>
                <span>Mode Layar Penuh</span>
              </button>
            </div>

            <!-- Single Photo Spacious Layout -->
            <div v-if="moment.photos.length === 1" class="max-w-3xl mx-auto">
              <button
                type="button"
                class="relative block w-full overflow-hidden border shadow-md rounded-2xl bg-emerald-950/5 border-amber-700/15 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                @click="openLightboxAt(0)"
              >
                <img
                  :src="galleryPhotoCardSrc(moment.photos[0])"
                  :alt="moment.title"
                  loading="eager"
                  decoding="async"
                  referrerpolicy="no-referrer"
                  class="object-cover w-full max-h-[560px] transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-full absolute bottom-3 right-3 bg-slate-950/75 backdrop-blur-sm">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path stroke-linecap="round" d="m20 20-3.5-3.5M11 8v6M8 11h6" />
                  </svg>
                  Perbesar
                </span>
              </button>
            </div>

            <!-- Multi-Photo Responsive Grid -->
            <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
              <button
                v-for="(photo, idx) in moment.photos"
                :key="photo.id || idx"
                type="button"
                :aria-label="`Perbesar foto ${idx + 1} dari ${moment.photos.length}`"
                class="relative overflow-hidden border rounded-2xl aspect-[4/3] bg-emerald-950/5 border-amber-700/15 shadow-sm group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                @click="openLightboxAt(idx)"
              >
                <img
                  :src="galleryPhotoCardSrc(photo)"
                  :alt="`${moment.title} - foto ${idx + 1}`"
                  width="800"
                  height="600"
                  :loading="idx < 3 ? 'eager' : 'lazy'"
                  decoding="async"
                  referrerpolicy="no-referrer"
                  class="object-cover object-[50%_25%] w-full h-full transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span
                  class="absolute inline-flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:gap-1 sm:px-2.5 sm:py-1 text-[11px] font-bold text-white transition-opacity rounded-full bottom-2 right-2 bg-slate-950/65 backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100"
                  aria-hidden="true"
                >
                  <svg class="w-3.5 h-3.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" />
                    <path stroke-linecap="round" d="m20 20-3.5-3.5M11 8v6M8 11h6" />
                  </svg>
                  <span class="hidden sm:inline">Zoom</span>
                </span>
              </button>
            </div>
          </section>

          <!-- Section 2: Inline Video Player (Google Drive / YouTube / Instagram, multi-video switcher, NO external Drive button) -->
          <section v-if="videos.length && activeVideo" aria-labelledby="detail-video-heading">
            <div class="flex flex-wrap items-end justify-between gap-2 mb-5">
              <div>
                <h2 id="detail-video-heading" class="text-xl font-extrabold sm:text-2xl lp-ink">
                  Video Dokumentasi{{ videos.length > 1 ? ` (${videos.length})` : '' }}
                </h2>
                <p class="mt-1 text-xs sm:text-sm lp-body">
                  {{ videoPlatformLabel(activeVideo) }} &middot; Diputar langsung di website
                </p>
              </div>
              <span
                v-if="videos.length > 1"
                class="px-3 py-1 text-xs font-bold rounded-full tabular-nums bg-emerald-950/10 lp-ink"
              >
                Video {{ activeVideoIdx + 1 }} / {{ videos.length }}
              </span>
            </div>

            <!-- Adaptive Player Container -->
            <div class="p-3 sm:p-4 lp-card">
              <!-- Google Drive adaptive theater height (fits both 9:16 vertical & 16:9 horizontal without cropping) -->
              <div
                v-if="activeVideo.platform === 'gdrive'"
                :key="activeVideo.embedUrl"
                class="w-full h-[min(66dvh,600px)] sm:h-[min(74dvh,660px)] max-w-4xl mx-auto overflow-hidden bg-black rounded-xl"
              >
                <iframe
                  :src="activeVideo.embedUrl"
                  :title="`${moment.title} - Video ${activeVideoIdx + 1}`"
                  class="w-full h-full border-0"
                  allow="autoplay; fullscreen"
                  allowfullscreen
                  referrerpolicy="strict-origin-when-cross-origin"
                ></iframe>
              </div>

              <!-- YouTube (Shorts portrait or standard landscape) -->
              <div
                v-else-if="activeVideo.platform === 'youtube'"
                :key="activeVideo.embedUrl"
                class="mx-auto overflow-hidden bg-black rounded-xl"
                :class="
                  activeVideo.aspect === 'portrait'
                    ? 'w-full max-w-[380px] aspect-[9/16] max-h-[min(74dvh,680px)]'
                    : 'w-full max-w-4xl aspect-video'
                "
              >
                <iframe
                  :src="activeVideo.embedUrl"
                  :title="`${moment.title} - Video ${activeVideoIdx + 1}`"
                  class="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                  allowfullscreen
                  referrerpolicy="strict-origin-when-cross-origin"
                ></iframe>
              </div>

              <!-- Instagram Embed -->
              <div
                v-else
                :key="activeVideo.embedUrl"
                class="flex flex-col items-center max-w-[420px] gap-3 mx-auto"
              >
                <div class="w-full h-[min(68dvh,560px)] overflow-hidden bg-white rounded-xl border border-amber-700/15">
                  <iframe
                    :src="activeVideo.embedUrl"
                    :title="`${moment.title} - Video ${activeVideoIdx + 1}`"
                    class="w-full h-full border-0"
                    scrolling="no"
                    allowtransparency="true"
                    allowfullscreen
                    referrerpolicy="strict-origin-when-cross-origin"
                  ></iframe>
                </div>
                <p class="text-xs text-center lp-body">
                  Jika pratinjau Instagram terbatas oleh browser,
                  <a
                    :href="activeVideo.canonicalUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-bold underline text-emerald-800 underline-offset-4"
                  >
                    buka langsung di Instagram &#8599;
                  </a>
                </p>
              </div>

              <!-- Multi-Video Selector Strip -->
              <div
                v-if="videos.length > 1"
                class="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-amber-700/15"
              >
                <button
                  type="button"
                  aria-label="Video sebelumnya"
                  class="grid w-9 h-9 transition-colors border rounded-full shrink-0 place-items-center border-amber-700/25 hover:bg-amber-50 lp-ink"
                  @click="stepVideo(-1)"
                >
                  &lsaquo;
                </button>
                <div
                  ref="videoStripRef"
                  class="flex items-center max-w-full gap-2 py-0.5 overflow-x-auto scroll-smooth"
                  style="scrollbar-width: none"
                >
                  <button
                    v-for="(v, idx) in videos"
                    :key="`${v.platform}-${v.id}-${idx}`"
                    type="button"
                    :data-video-idx="idx"
                    class="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-full text-xs sm:text-sm font-bold shrink-0 transition-colors"
                    :class="
                      idx === activeVideoIdx
                        ? 'bg-emerald-900 text-amber-200 shadow-sm'
                        : 'bg-emerald-950/5 lp-ink hover:bg-emerald-950/10'
                    "
                    @click="activeVideoIdx = idx"
                  >
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <polygon points="6 4 20 12 6 20 6 4" />
                    </svg>
                    Video {{ idx + 1 }}
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Video berikutnya"
                  class="grid w-9 h-9 transition-colors border rounded-full shrink-0 place-items-center border-amber-700/25 hover:bg-amber-50 lp-ink"
                  @click="stepVideo(1)"
                >
                  &rsaquo;
                </button>
              </div>
            </div>
          </section>

          <!-- Section 3: Related Moments ("Dokumentasi Lainnya") -->
          <section v-if="related.length" aria-labelledby="related-moments-heading" class="pt-4 border-t border-amber-700/15">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 id="related-moments-heading" class="text-xl font-extrabold sm:text-2xl lp-ink">
                Dokumentasi Lainnya
              </h2>
              <router-link
                to="/dokumentasi"
                class="text-sm font-bold text-emerald-800 hover:underline underline-offset-4"
              >
                Lihat Semua Dokumentasi &rarr;
              </router-link>
            </div>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <article
                v-for="r in related"
                :key="r.id"
                class="flex flex-col overflow-hidden lp-card lp-lift group"
              >
                <router-link
                  :to="`/dokumentasi/${encodeURIComponent(r.slug || r.id)}`"
                  class="flex flex-col flex-1 w-full text-left"
                >
                  <div class="relative w-full overflow-hidden aspect-[4/3] bg-emerald-950">
                    <img
                      v-if="coverOf(r)"
                      :src="coverOf(r)"
                      :alt="r.title"
                      width="800"
                      height="600"
                      loading="lazy"
                      decoding="async"
                      referrerpolicy="no-referrer"
                      class="object-cover object-[50%_25%] w-full h-full transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div
                      v-else
                      class="flex items-center justify-center w-full h-full bg-gradient-to-br from-emerald-900 to-slate-950 text-amber-200"
                    >
                      <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <polygon points="6 4 20 12 6 20 6 4" />
                      </svg>
                    </div>
                    <span class="absolute px-2.5 py-1 text-[11px] font-bold rounded-full top-3 left-3 bg-emerald-950/85 text-emerald-50 backdrop-blur-sm">
                      {{ r.categoryLabel }}
                    </span>
                  </div>
                  <div class="flex flex-col flex-1 p-5">
                    <p class="mb-1 text-xs font-semibold text-amber-800">
                      {{ formatMomentDate(r.momentDate) }}
                    </p>
                    <h3 class="text-base font-bold leading-snug lp-ink line-clamp-2">
                      {{ r.title }}
                    </h3>
                    <span class="inline-flex items-center gap-1 pt-3 mt-auto text-sm font-bold text-emerald-800 group-hover:underline underline-offset-4">
                      <span>Lihat momen</span>
                      <span aria-hidden="true">&rarr;</span>
                    </span>
                  </div>
                </router-link>
              </article>
            </div>
          </section>

          <!-- Back Navigation Footer -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-4">
            <router-link to="/dokumentasi" class="lp-btn-line">
              &larr; Kembali ke Semua Dokumentasi
            </router-link>
            <router-link to="/daftar" class="lp-btn-gold">
              Daftar Santri Baru &rarr;
            </router-link>
          </div>
        </template>
      </div>
    </main>

    <FooterComponent />

    <!-- Zoomable Fullscreen Photo Lightbox -->
    <GalleryLightbox
      v-if="moment?.photos?.length"
      :open="lightboxOpen"
      :photos="moment.photos"
      :initial-index="lightboxIndex"
      :title="moment.title"
      :subtitle="`${moment.categoryLabel} · ${formatMomentDate(moment.momentDate)}`"
      :caption="moment.caption"
      @close="lightboxOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import '@/styles/landing.css'
import api from '@/services/api'
import NavbarComponent from '@/components/NavbarComponent.vue'
import FooterComponent from '@/components/FooterComponent.vue'
import GalleryLightbox from '@/components/landing/GalleryLightbox.vue'
import { useLenisScroll } from '@/composables/useLenisScroll'
import { useGalleryLikes } from '@/composables/useGalleryLikes'
import { applyPageSeo, buildCanonicalUrl, SITE_URL } from '@/utils/seoMeta'
import {
  galleryPhotoCardSrc,
  momentVideosOf,
  formatMomentDate,
  videoPlatformLabel,
} from '@/utils/galleryMedia'

const route = useRoute()
const { scrollTo: lenisScrollTo, stop: stopLenis, start: startLenis } = useLenisScroll()
const { isLiked, likeCountOf, isPending, isPopped, toggleLike } = useGalleryLikes()
const likeFeedback = ref('')
let likeFeedbackTimer = null

async function onToggleLike(m) {
  likeFeedback.value = ''
  const res = await toggleLike(m)
  if (!res.ok && res.error) {
    likeFeedback.value = res.error
    clearTimeout(likeFeedbackTimer)
    likeFeedbackTimer = setTimeout(() => {
      likeFeedback.value = ''
    }, 3500)
  }
}

const loading = ref(true)
const loadError = ref('')
const moment = ref(null)
const related = ref([])
const activeVideoIdx = ref(0)
const videoStripRef = ref(null)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const copied = ref(false)
let copyTimer = null
let restoreSeo = null

const canNativeShare = computed(
  () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
)

const videos = computed(() => momentVideosOf(moment.value))
const activeVideo = computed(() => videos.value[activeVideoIdx.value] || null)

const mediaSummaryText = computed(() => {
  if (!moment.value) return ''
  const p = moment.value.photos?.length || 0
  const v = videos.value.length
  const parts = []
  if (p > 0) parts.push(`${p} foto`)
  if (v > 0) parts.push(`${v} video`)
  return parts.join(' · ')
})

const shareUrl = computed(() => {
  const slug = moment.value?.slug || moment.value?.id || route.params.slug || ''
  if (typeof window !== 'undefined' && /^https?:/.test(window.location.origin)) {
    return `${window.location.origin}/dokumentasi/${encodeURIComponent(slug)}`
  }
  return buildCanonicalUrl(`/dokumentasi/${encodeURIComponent(slug)}`)
})

const whatsappShareHref = computed(() => {
  if (!moment.value) return 'https://wa.me/'
  const lines = [
    `*${moment.value.title}*`,
    moment.value.caption ? moment.value.caption : `Dokumentasi kegiatan ${moment.value.categoryLabel} di TPQ Amanah Sawotratap.`,
    '',
    `Lihat foto & videonya di sini:`,
    shareUrl.value,
  ]
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
})

function coverOf(m) {
  if (m?.photos?.length) return galleryPhotoCardSrc(m.photos[0])
  const firstVideo = momentVideosOf(m)[0]
  if (firstVideo?.thumbnailUrl) return galleryPhotoCardSrc({ url: firstVideo.thumbnailUrl })
  return ''
}

function openLightboxAt(idx) {
  lightboxIndex.value = idx
  lightboxOpen.value = true
}

function stepVideo(delta) {
  const total = videos.value.length
  if (total <= 1) return
  activeVideoIdx.value = (activeVideoIdx.value + delta + total) % total
}

watch(activeVideoIdx, async (idx) => {
  await nextTick()
  const btn = videoStripRef.value?.querySelector(`[data-video-idx="${idx}"]`)
  btn?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' })
})

async function copyShareLink() {
  const url = shareUrl.value
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2400)
  } catch {
    // Fallback ignored silently if clipboard blocked
  }
}

async function triggerNativeShare() {
  if (!canNativeShare.value || !moment.value) return
  try {
    await navigator.share({
      title: `${moment.value.title} — TPQ Amanah Sawotratap`,
      text: moment.value.caption || `Dokumentasi kegiatan ${moment.value.title} di TPQ Amanah Sawotratap.`,
      url: shareUrl.value,
    })
  } catch {
    // User cancelled share sheet
  }
}

function applyMomentSeo(m) {
  if (!m) return
  const slug = m.slug || m.id
  const canonicalPath = `/dokumentasi/${encodeURIComponent(slug)}`
  const canonicalUrl = buildCanonicalUrl(canonicalPath)
  const cover = coverOf(m) || `${SITE_URL}/og-image.png`
  const description =
    m.caption ||
    `Dokumentasi kegiatan ${m.title} (${m.categoryLabel}) pada ${formatMomentDate(m.momentDate)} di TPQ Amanah Sawotratap, Sidoarjo.`

  restoreSeo = applyPageSeo({
    title: `${m.title} | Dokumentasi TPQ Amanah`,
    description,
    canonicalPath,
    image: cover,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Dokumentasi', item: `${SITE_URL}/dokumentasi` },
            { '@type': 'ListItem', position: 3, name: m.title, item: canonicalUrl },
          ],
        },
        {
          '@type': 'ImageGallery',
          name: m.title,
          description,
          url: canonicalUrl,
          datePublished: m.momentDate || undefined,
          image: (m.photos || []).slice(0, 6).map((p) => galleryPhotoCardSrc(p)),
          publisher: {
            '@type': 'EducationalOrganization',
            '@id': `${SITE_URL}/#organization`,
            name: 'TPQ Amanah Sawotratap',
          },
        },
      ],
    },
  })
}

async function fetchDetail(slugOrId) {
  if (!slugOrId) return
  loading.value = true
  loadError.value = ''
  lightboxOpen.value = false
  activeVideoIdx.value = 0
  try {
    const { data } = await api.get(`/gallery/public/${encodeURIComponent(slugOrId)}`)
    moment.value = data?.moment || null
    related.value = Array.isArray(data?.related) ? data.related : []
    applyMomentSeo(moment.value)
  } catch (err) {
    moment.value = null
    related.value = []
    loadError.value =
      err.response?.status === 404
        ? 'Dokumentasi ini tidak ditemukan atau sudah tidak tayang.'
        : 'Gagal memuat detail dokumentasi. Periksa koneksi internet Anda.'
  } finally {
    loading.value = false
  }
}

watch(lightboxOpen, (isOpen) => {
  if (isOpen) stopLenis()
  else startLenis()
})

watch(
  () => route.params.slug,
  (nextSlug) => {
    if (nextSlug) {
      fetchDetail(String(nextSlug))
      lenisScrollTo(0, { immediate: true })
    }
  },
)

onMounted(() => {
  fetchDetail(String(route.params.slug || ''))
})

onBeforeUnmount(() => {
  clearTimeout(copyTimer)
  clearTimeout(likeFeedbackTimer)
  restoreSeo?.()
})
</script>
