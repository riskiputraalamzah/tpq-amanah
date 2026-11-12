<template>
  <footer class="lp-footer text-white">
    <span class="lp-fringe-top" aria-hidden="true"></span>

    <div class="relative px-4 pt-20 pb-10 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <!-- Brand, on the centre axis -->
      <div class="flex flex-col items-center max-w-2xl mx-auto text-center">
        <img
          :src="logoUrl"
          alt="TPQ AMANAH"
          class="w-16 h-16 rounded-full shadow-lg ring-1 ring-amber-200/40"
        />
        <p class="mt-4 text-2xl font-bold tracking-tight text-white">TPQ AMANAH</p>
        <p class="text-xs font-semibold text-amber-300">
          Sawotratap, Gedangan, Sidoarjo
        </p>
        <OrnamentRule class="w-full mt-5 !text-amber-300" />
        <p class="mt-5 text-sm leading-relaxed text-emerald-100/80 text-pretty">
          Taman Pendidikan Al-Qur'an (TPQ) AMANAH membimbing generasi Qur'ani
          yang tartil membaca, cerdas memahami, dan berakhlakul karimah dengan
          kurikulum terpadu Metode At-Tartil 6 Jilid.
        </p>
      </div>

      <div
        class="grid gap-10 mt-14 md:grid-cols-3 md:gap-0 md:divide-x md:divide-amber-200/15"
      >
        <!-- Address & registration -->
        <div class="md:pr-10">
          <h4 class="mb-4 text-base font-bold text-white">Alamat &amp; Legalitas</h4>
          <div class="space-y-3 text-sm text-emerald-100/75">
            <p class="flex items-start gap-2.5">
              <svg
                class="w-4 h-4 mt-0.5 text-amber-300 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
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
              <span
                >Jl. Kertanegara No. 20, Dusun Tratap, Sawotratap, Kec.
                Gedangan, Kab. Sidoarjo 61256</span
              >
            </p>
            <p class="flex items-start gap-2.5">
              <svg
                class="w-4 h-4 mt-0.5 text-amber-300 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span
                >Terdaftar di Kementerian Agama Kabupaten Sidoarjo &middot; NSPQ
                411235151939</span
              >
            </p>
          </div>
        </div>

        <!-- Links -->
        <div class="md:px-10">
          <h4 class="mb-4 text-base font-bold text-white">Navigasi Utama</h4>
          <ul class="text-sm">
            <li v-for="link in links" :key="link.href">
              <a
                :href="link.href"
                class="inline-flex items-center min-h-11 lg:min-h-0 lg:py-1.5 text-emerald-100/80 hover:text-amber-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                >{{ link.label }}</a
              >
            </li>
          </ul>
        </div>

        <!-- Schedule & contacts -->
        <div class="md:pl-10">
          <h4 class="mb-4 text-base font-bold text-white">Jadwal Sesi Mengaji</h4>
          <div class="space-y-3 text-sm text-emerald-100/80">
            <p class="font-medium text-white/90">Hari Aktif: Senin s/d Jumat</p>
            <div class="space-y-2">
              <div class="p-3 border rounded-xl border-amber-200/20 bg-white/5">
                <div
                  class="flex items-center justify-between mb-0.5 text-xs font-semibold text-amber-300"
                >
                  <span>Sesi 1 (Ba'da Ashar)</span>
                  <span>Usia Dini &amp; SD</span>
                </div>
                <p class="text-base font-bold text-white">15:30 - 17:00 WIB</p>
              </div>
              <div class="p-3 border rounded-xl border-amber-200/20 bg-white/5">
                <div
                  class="flex items-center justify-between mb-0.5 text-xs font-semibold text-emerald-300"
                >
                  <span>Sesi 2 (Ba'da Maghrib)</span>
                  <span>Kelas Lanjutan</span>
                </div>
                <p class="text-base font-bold text-white">18:00 - 19:30 WIB</p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 pt-2 text-xs">
              <a
                href="https://wa.me/6289530397058"
                target="_blank"
                rel="noopener noreferrer"
                class="lp-btn-ghost !justify-start"
              >
                <span>WA Ustadzah Ella (0895-3039-7058)</span>
              </a>
              <a
                href="https://wa.me/6282233361877"
                target="_blank"
                rel="noopener noreferrer"
                class="lp-btn-ghost !justify-start"
              >
                <span>WA Ustadz Riski (0822-3336-1877)</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom -->
      <div
        class="flex flex-col items-center justify-between gap-4 pt-8 mt-14 text-xs border-t border-amber-200/15 sm:flex-row text-emerald-100/60"
      >
        <p>
          &copy; {{ new Date().getFullYear() }} TPQ AMANAH Sawotratap, Gedangan,
          Sidoarjo. Seluruh hak cipta dilindungi.
        </p>
        <p>Membimbing dengan Hati • Metode At-Tartil 6 Jilid</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import OrnamentRule from "@/components/landing/OrnamentRule.vue";

const logoUrl = new URL("@/assets/logo-sm.png", import.meta.url).href;

const links = [
  { href: "#beranda", label: "Beranda" },
  { href: "#pendaftaran", label: "Pendaftaran Santri Baru" },
  { href: "#keunggulan", label: "Keunggulan Lembaga" },
  { href: "#program", label: "Kurikulum 6 Jilid" },
  { href: "#at-tartil", label: "E-Kitab Digital At-Tartil" },
  { href: "#jadwal", label: "Jadwal Sesi Mengaji" },
  { href: "#pengajar", label: "Dewan Asatidz" },
  { href: "#kontak", label: "Kontak & Lokasi" },
];
</script>
