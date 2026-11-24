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
        <p class="mt-4 text-2xl font-bold tracking-tight text-white">
          TPQ AMANAH
        </p>
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
        class="grid mt-14 divide-y divide-amber-200/15 md:grid-cols-3 md:divide-y-0 md:divide-x"
      >
        <!-- Address & registration -->
        <div class="pb-8 md:pb-0 md:pr-10">
          <h4 class="mb-4 text-base font-bold text-white">
            Alamat &amp; Legalitas
          </h4>
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

        <!-- Links + Layanan Online -->
        <div class="py-8 md:py-0 md:px-10">
          <h4 class="mb-4 text-base font-bold text-white">Navigasi Utama</h4>
          <ul class="grid grid-cols-2 text-sm gap-x-4 gap-y-0.5 md:block">
            <li v-for="link in links" :key="link.href">
              <a
                :href="link.href"
                class="inline-flex items-center min-h-11 lg:min-h-0 lg:py-1.5 text-emerald-100/80 hover:text-amber-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                >{{ link.label }}</a
              >
            </li>
          </ul>

          <div class="pt-5 mt-5 border-t border-amber-200/15">
            <h4
              class="mb-3 text-xs font-bold tracking-wider uppercase text-amber-300"
            >
              Layanan Online
            </h4>
            <div class="flex flex-col gap-2">
              <router-link
                to="/daftar"
                class="w-full lp-btn-gold !min-h-[44px] !text-sm"
              >
                Daftar Santri Baru
              </router-link>
              <div class="grid grid-cols-2 gap-2">
                <router-link to="/wali" class="lp-btn-ghost !text-xs">
                  Portal Wali
                </router-link>
                <router-link
                  :to="isAuthenticated ? '/dashboard' : '/login'"
                  class="lp-btn-ghost !text-xs"
                >
                  {{ isAuthenticated ? "Dashboard" : "Login Asatidz/ah" }}
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule & contacts -->
        <div class="pt-8 md:pt-0 md:pl-10">
          <h4 class="mb-4 text-base font-bold text-white">
            Jadwal Sesi Mengaji
          </h4>
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

            <div class="grid grid-cols-1 gap-2 pt-2 text-xs sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
              <a
                href="https://wa.me/6289530397058"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full lp-btn-ghost !text-xs !px-3"
              >
                <span>WA Ustadzah Ella (0895-3039-7058)</span>
              </a>
              <a
                href="https://wa.me/6282233361877"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full lp-btn-ghost !text-xs !px-3"
              >
                <span>WA Ustadz Riski (0822-3336-1877)</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom -->
      <div
        class="flex flex-col items-center justify-between gap-2.5 pt-8 mt-14 text-xs text-center border-t border-amber-200/15 sm:flex-row sm:gap-4 sm:text-left text-emerald-100/60"
      >
        <p class="leading-relaxed text-balance">
          &copy; {{ new Date().getFullYear() }} TPQ AMANAH Sawotratap, Gedangan,
          Sidoarjo. Seluruh hak cipta dilindungi.
        </p>
        <p class="text-amber-200/70 sm:text-right shrink-0">
          Membimbing dengan Hati &bull; Metode At-Tartil 6 Jilid
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import OrnamentRule from "@/components/landing/OrnamentRule.vue";

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
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
