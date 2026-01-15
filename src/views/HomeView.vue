<template>
  <div class="min-h-screen">
    <NavbarComponent />
    
    <!-- Hero Section -->
    <section id="beranda" class="relative min-h-screen flex items-center bg-gradient-primary overflow-hidden">
      <!-- Background Effects -->
      <div class="absolute inset-0 islamic-pattern opacity-30"></div>
      <div class="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent"></div>
      
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-56 min-h-screen flex flex-col items-center justify-center text-center">
        
        <!-- Decoration / Mandala Background (Centered behind text) -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" style="-webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%); mask-image: linear-gradient(to bottom, black 70%, transparent 100%);">
          <!-- Main Glowing Aura -->
          <div class="absolute inset-0 bg-accent-400/20 rounded-full blur-[120px] animate-pulse-slow"></div>

          <div class="relative w-[350px] h-[350px] md:w-[600px] md:h-[600px] lg:w-[800px] lg:h-[800px] flex items-center justify-center opacity-100">
            
            <!-- Rub el Hizb (Islamic Star) SVG - Large Background (Wireframe) -->
            <svg class="absolute w-full h-full text-white/10 animate-spin-veryslow" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="0.5">
               <path d="M100 0 L122.5 77.5 L200 100 L122.5 122.5 L100 200 L77.5 122.5 L0 100 L77.5 77.5 Z" />
               <rect x="29" y="29" width="142" height="142" transform="rotate(45 100 100)" />
            </svg>

            <!-- Concentric Rings (Mernik-Mernik) -->
            <!-- Ring 1: Outer Dashed - Rotating -->
            <div class="absolute inset-0 border-2 border-dashed border-white/20 rounded-full animate-spin-veryslow"></div>
            
            <!-- Ring 2: Dotted - Rotating Reverse -->
            <div class="absolute inset-8 sm:inset-16 border-[3px] border-dotted border-white/30 rounded-full animate-spin-reverse-veryslow"></div>

            <!-- Ring 3: Solid Thin with Ornaments -->
            <div class="absolute inset-20 sm:inset-32 border border-white/20 rounded-full flex items-center justify-center animate-spin-veryslow" style="animation-duration: 40s;">
              <div class="absolute w-3 h-3 bg-accent-300 rounded-full top-0 -translate-y-1/2 shadow-[0_0_15px_rgba(253,224,71,0.8)]"></div>
              <div class="absolute w-3 h-3 bg-accent-300 rounded-full bottom-0 translate-y-1/2 shadow-[0_0_15px_rgba(253,224,71,0.8)]"></div>
              <div class="absolute w-3 h-3 bg-accent-300 rounded-full left-0 -translate-x-1/2 shadow-[0_0_15px_rgba(253,224,71,0.8)]"></div>
              <div class="absolute w-3 h-3 bg-accent-300 rounded-full right-0 translate-x-1/2 shadow-[0_0_15px_rgba(253,224,71,0.8)]"></div>
            </div>

            <!-- Inner Geometric Shape (Rotate 45deg) - Outline Only -->
            <div class="absolute w-48 h-48 sm:w-72 sm:h-72 border-2 border-white/5 rotate-45 animate-float">
               <div class="absolute inset-2 border border-white/10"></div>
            </div>
            
            <!-- Decorative Particles -->
            <div class="absolute top-10 right-20 w-3 h-3 bg-accent-300 rounded-full blur-[2px] animate-bounce-slow"></div>
            <div class="absolute bottom-20 left-20 w-4 h-4 border-2 border-accent-300 rounded-full animate-bounce-slow" style="animation-delay: 1.5s;"></div>

          </div>
        </div>

        <!-- Content (Foreground) -->
        <div class="relative z-10 max-w-4xl mx-auto animate-slide-up">
          <p class="text-xl md:text-3xl font-arabic text-accent-300 mb-6 text-shadow-lg tracking-wider">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <h1 class="font-bold mb-8 text-white leading-none">
            <span class="block text-2xl md:text-4xl lg:text-5xl font-medium mb-4 opacity-90">Selamat Datang di</span>
            <span class="block text-5xl md:text-7xl lg:text-8xl font-bold text-accent-300 drop-shadow-xl tracking-tight">
              TPQ AMANAH
            </span>
          </h1>
          <p class="text-lg md:text-2xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed font-light drop-shadow-md">
            Taman Pendidikan Al-Quran untuk membentuk generasi Qurani yang berakhlak mulia, cerdas, dan bertaqwa kepada Allah SWT
          </p>
          <div class="flex flex-wrap gap-5 justify-center items-center">
            <a href="#tentang" @click="scrollTo($event, '#tentang')" class="btn-primary px-8 py-4 text-lg shadow-xl shadow-green-900/30 hover:shadow-green-900/50 hover:-translate-y-1 transition-all rounded-full">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Pelajari Lebih Lanjut
            </a>
            <router-link to="/dashboard" class="btn-secondary px-8 py-4 text-lg bg-white/20 backdrop-blur-md border-white/50 text-white hover:bg-white hover:text-primary-700 shadow-xl hover:shadow-white/30 hover:-translate-y-1 transition-all rounded-full">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
              </svg>
              Login Dashboard
            </router-link>
          </div>
        </div>

      </div>

      <!-- Wave -->
      <div class="absolute bottom-0 left-0 right-0 leading-[0] z-20">
        <svg viewBox="0 0 1440 120" class="block w-full h-20 md:h-32 fill-primary-50" preserveAspectRatio="none">
          <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,42.7C672,32,768,32,864,42.7C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"/>
        </svg>
      </div>
    </section>

    <!-- About Section -->
    <section id="tentang" class="py-20 lg:py-28 bg-gradient-to-b from-primary-50 to-white -mt-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="section-title">Tentang Kami</h2>
          <p class="text-gray-500 mt-6 max-w-2xl mx-auto">Mengenal lebih dekat TPQ AMANAH Sawotratap</p>
        </div>

        <div class="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <!-- Sejarah -->
          <div class="glass-card p-8">
            <h3 class="text-xl font-bold text-primary-700 mb-4">Sejarah TPQ AMANAH</h3>
            <p class="text-gray-600 leading-relaxed mb-4">
              {{ aboutContent.history || 'TPQ AMANAH didirikan dengan tekad untuk mencetak generasi Qurani yang mampu membaca, memahami, dan mengamalkan Al-Quran dalam kehidupan sehari-hari.' }}
            </p>
            <p class="text-gray-600 leading-relaxed">
              Berlokasi di Sawotratap, Gedangan, Sidoarjo, kami telah melayani masyarakat dalam pendidikan Al-Quran dengan penuh dedikasi dan keikhlasan.
            </p>
          </div>

          <!-- Info Cards -->
          <div class="space-y-4">
            <div class="glass-card p-6 flex gap-5">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/30">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <div>
                <h4 class="font-semibold text-primary-700 mb-1">Visi</h4>
                <p class="text-gray-600 text-sm">{{ aboutContent.vision || 'Menjadi lembaga pendidikan Al-Quran terdepan yang menghasilkan generasi Qurani berakhlak mulia' }}</p>
              </div>
            </div>

            <div class="glass-card p-6 flex gap-5">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent-500/30">
                <svg class="w-7 h-7 text-primary-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
              </div>
              <div>
                <h4 class="font-semibold text-primary-700 mb-1">Misi</h4>
                <ul class="text-gray-600 text-sm space-y-1">
                  <li v-for="(item, idx) in missionList" :key="idx">• {{ item }}</li>
                </ul>
              </div>
            </div>

            <div class="glass-card p-6 flex gap-5">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h4 class="font-semibold text-primary-700 mb-1">Lokasi</h4>
                <p class="text-gray-600 text-sm">JL. Kertanegara Nomor 20, Sawotratap, Gedangan, Sidoarjo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-16 bg-gradient-primary">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="stat in stats" :key="stat.label" class="glass-card bg-white/90 p-6 text-center">
            <div class="text-4xl font-bold text-primary-600 mb-1">{{ stat.value }}</div>
            <div class="text-gray-500 text-sm">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Teachers Section -->
    <section id="pengajar" class="py-20 lg:py-28 bg-gradient-to-b from-white to-primary-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="section-title">Para Pengajar</h2>
          <p class="text-gray-500 mt-6 max-w-2xl mx-auto">Guru-guru kami yang berdedikasi tinggi dalam mengajarkan Al-Quran</p>
        </div>

        <div class="flex flex-wrap justify-center gap-6">
          <div v-for="teacher in teachers" :key="teacher.id" class="glass-card p-6 text-center group w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]">
            <div class="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-primary-100 group-hover:ring-primary-300 transition-all duration-300">
              <img 
                v-if="teacher.photoURL" 
                :src="teacher.photoURL" 
                :alt="teacher.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                {{ getInitials(teacher.name) }}
              </div>
            </div>
            <h4 class="font-semibold text-primary-800">{{ teacher.name }}</h4>
            <p class="text-accent-600 text-sm font-medium mb-2">{{ teacher.position }}</p>
            <p class="text-gray-500 text-sm">{{ teacher.bio }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="kontak" class="py-20 lg:py-28 bg-gradient-to-b from-primary-50 to-primary-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="section-title">Hubungi Kami</h2>
          <p class="text-gray-500 mt-6 max-w-2xl mx-auto">Jangan ragu untuk menghubungi kami untuk informasi lebih lanjut</p>
        </div>

        <div class="grid lg:grid-cols-2 gap-8">
          <div class="glass-card p-8 space-y-6">
            <div v-for="contact in contacts" :key="contact.title" class="flex gap-5">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
                <component :is="contact.icon" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 class="font-semibold text-primary-700">{{ contact.title }}</h4>
                <p class="text-gray-600 text-sm">{{ contact.value }}</p>
              </div>
            </div>
          </div>

          <div ref="mapRef" class="glass-card p-4 overflow-hidden">
            <!-- Lazy load Google Maps iframe for better performance -->
            <iframe
              v-if="isMapVisible"
              :src="mapSrc"
              class="w-full h-80 rounded-xl"
              style="border:0;"
              allowfullscreen
              loading="lazy"
            ></iframe>
            <!-- Placeholder while map is loading -->
            <div v-else class="w-full h-80 rounded-xl bg-gray-100 flex items-center justify-center">
              <div class="text-center text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
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
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import FooterComponent from '@/components/FooterComponent.vue'
import api from '@/services/api'

// Google Maps URL
const mapSrc = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.5!2d112.7!3d-7.38!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwMjMnMDAuMCJTIDExMsKwNDInMDAuMCJF!5e0!3m2!1sid!2sid!4v1700000000000'

// Lazy loading for Google Maps
const mapRef = ref(null)
const isMapVisible = ref(false)
let mapObserver = null

const logoUrl = new URL('@/assets/logo.png', import.meta.url).href

const teachers = ref([])
const aboutContent = ref({
  history: '',
  vision: '',
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

const stats = [
  { value: '50+', label: 'Santri Aktif' },
  { value: '6+', label: 'Guru Berpengalaman' },
  { value: '10+', label: 'Tahun Pengalaman' },
  { value: '100+', label: 'Alumni' }
]

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
  { title: 'Telepon', value: '+62 812 3456 7890', icon: PhoneIcon },
  { title: 'Email', value: 'tpqamanah@gmail.com', icon: MailIcon },
  { title: 'Jam Mengaji', value: 'Sesi 1: 15:30-17:00 | Sesi 2: 18:00-19:30 WIB', icon: ClockIcon }
]

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
  try {
    // Try to fetch from guru users endpoint first
    const { data } = await api.get('/content/guru/list')
    if (data?.length > 0) {
      teachers.value = data
      return
    }
  } catch (e) {
    console.log('Guru endpoint failed, trying teachers collection...')
  }
  
  try {
    // Fallback to teachers collection
    const { data } = await api.get('/content/teachers/list')
    if (data?.length > 0) {
      teachers.value = data
      return
    }
  } catch (e) {
    console.log('Teachers endpoint failed, using fallback data...')
  }
  
  // Final fallback with static data
  teachers.value = [
    { id: 1, name: 'Ustadz Riski', position: 'Kepala TPQ', bio: 'Berpengalaman mengajar Al-Quran', photoURL: 'https://ui-avatars.com/api/?name=Riski&background=1B5E20&color=fff&size=200' },
    { id: 2, name: 'Ustadzah Aini', position: 'Guru Iqro', bio: 'Spesialis santri pemula', photoURL: 'https://ui-avatars.com/api/?name=Aini&background=2E7D32&color=fff&size=200' },
    { id: 3, name: 'Ustadzah Ella', position: 'Guru Tajwid', bio: 'Ahli ilmu tajwid', photoURL: 'https://ui-avatars.com/api/?name=Ella&background=388E3C&color=fff&size=200' },
    { id: 4, name: 'Ustadzah Annifa', position: 'Guru Hafalan', bio: 'Pembimbing tahfidz', photoURL: 'https://ui-avatars.com/api/?name=Annifa&background=43A047&color=fff&size=200' },
    { id: 5, name: 'Ustadz Ahmad', position: 'Guru Tahsin', bio: 'Ahli perbaikan bacaan', photoURL: 'https://ui-avatars.com/api/?name=Ahmad&background=4CAF50&color=fff&size=200' },
    { id: 6, name: 'Ustadzah Fatimah', position: 'Guru Adab', bio: 'Pembina akhlak santri', photoURL: 'https://ui-avatars.com/api/?name=Fatimah&background=66BB6A&color=fff&size=200' }
  ]
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

onMounted(() => {
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
})

// Cleanup observer on unmount
onUnmounted(() => {
  mapObserver?.disconnect()
})
</script>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-veryslow {
  animation: spin 20s linear infinite;
}

.animate-spin-reverse-veryslow {
  animation: spin 25s linear infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(-10%); }
  50% { transform: translateY(10%); }
}

.animate-bounce-slow {
  animation: bounce-slow 3s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
</style>
