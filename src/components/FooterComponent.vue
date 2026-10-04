<template>
  <footer class="bg-[#04241a] text-white border-t border-emerald-950/80">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid md:grid-cols-2 lg:grid-cols-12 gap-10">
        
        <!-- Logo & Description (5 cols) -->
        <div class="lg:col-span-5 space-y-4">
          <div class="flex items-center gap-3">
            <img :src="logoUrl" alt="TPQ AMANAH" class="w-12 h-12 rounded-full border border-white/20 shadow-md" />
            <div>
              <span class="text-xl font-bold text-white tracking-tight">TPQ AMANAH</span>
              <p class="text-xs text-amber-300 font-medium">Sawotratap, Gedangan, Sidoarjo</p>
            </div>
          </div>
          <p class="text-emerald-100/80 text-sm leading-relaxed max-w-md font-normal">
            Taman Pendidikan Al-Qur'an (TPQ) AMANAH membimbing generasi Qur'ani yang tartil membaca, cerdas memahami, dan berakhlakul karimah dengan kurikulum terpadu Metode At-Tartil 6 Jilid.
          </p>
          <div class="pt-2 text-xs text-emerald-100/70 space-y-1.5">
            <p class="flex items-start gap-2">
              <svg class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Jl. Kertanegara No. 20, Dusun Tratap, Sawotratap, Kec. Gedangan, Kab. Sidoarjo 61256</span>
            </p>
          </div>
        </div>

        <!-- Links (3 cols) -->
        <div class="lg:col-span-3">
          <h4 class="font-bold text-base mb-4 text-white">Navigasi Utama</h4>
          <ul class="space-y-2.5 text-sm">
            <li><a href="#beranda" class="text-emerald-100/80 hover:text-amber-300 transition-colors">Beranda</a></li>
            <li><a href="#pendaftaran" class="text-emerald-100/80 hover:text-amber-300 transition-colors">Pendaftaran Santri Baru</a></li>
            <li><a href="#keunggulan" class="text-emerald-100/80 hover:text-amber-300 transition-colors">Keunggulan Lembaga</a></li>
            <li><a href="#program" class="text-emerald-100/80 hover:text-amber-300 transition-colors">Kurikulum 6 Jilid</a></li>
            <li><a href="#at-tartil" class="text-emerald-100/80 hover:text-amber-300 transition-colors">E-Kitab Digital At-Tartil</a></li>
            <li><a href="#jadwal" class="text-emerald-100/80 hover:text-amber-300 transition-colors">Jadwal Sesi Mengaji</a></li>
            <li><a href="#pengajar" class="text-emerald-100/80 hover:text-amber-300 transition-colors">Dewan Asatidz</a></li>
            <li><a href="#kontak" class="text-emerald-100/80 hover:text-amber-300 transition-colors">Kontak &amp; Lokasi</a></li>
          </ul>
        </div>

        <!-- Jadwal Mengaji & Layanan (4 cols) -->
        <div class="lg:col-span-4">
          <h4 class="font-bold text-base mb-4 text-white">Jadwal Sesi Mengaji</h4>
          <div class="space-y-3 text-sm text-emerald-100/80">
            <p class="font-medium text-white/90">Hari Aktif: Senin s/d Jumat</p>
            <div class="space-y-2">
              <div class="bg-white/5 rounded-xl p-3 border border-white/10">
                <div class="flex items-center justify-between text-xs text-amber-300 font-semibold mb-0.5">
                  <span>Sesi 1 (Ba'da Ashar)</span>
                  <span>Usia Dini &amp; SD</span>
                </div>
                <p class="text-white font-bold text-base">15:30 - 17:00 WIB</p>
              </div>
              <div class="bg-white/5 rounded-xl p-3 border border-white/10">
                <div class="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-0.5">
                  <span>Sesi 2 (Ba'da Maghrib)</span>
                  <span>Kelas Lanjutan</span>
                </div>
                <p class="text-white font-bold text-base">18:00 - 19:30 WIB</p>
              </div>
            </div>
            
            <div class="pt-2 flex flex-wrap gap-2 text-xs">
              <a href="https://wa.me/6289530397058" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-white font-medium border border-emerald-600/60 transition-colors">
                <span>WA Ustadzah Ella (0895-3039-7058)</span>
              </a>
              <a href="https://wa.me/6282233361877" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-white font-medium border border-emerald-600/60 transition-colors">
                <span>WA Ustadz Riski (0822-3336-1877)</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom -->
      <div class="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-100/60">
        <p>
          &copy; {{ new Date().getFullYear() }} TPQ AMANAH Sawotratap, Gedangan, Sidoarjo. Seluruh hak cipta dilindungi.
        </p>
        <p>
          Membimbing dengan Hati • Metode At-Tartil 6 Jilid
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
const logoUrl = new URL('@/assets/logo.png', import.meta.url).href
</script>
