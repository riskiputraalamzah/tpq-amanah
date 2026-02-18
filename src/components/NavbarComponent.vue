<template>
  <div class="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
    :class="isScrolled ? 'px-4 md:px-8 pt-3' : 'px-0 pt-0'">
    <header class="transition-all duration-500" :class="isScrolled
      ? 'bg-white/85 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-2xl py-3 navbar-floating'
      : 'bg-transparent py-4 rounded-none'">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <router-link to="/" class="flex items-center gap-3 group">
            <img :src="logoUrl" alt="TPQ AMANAH"
              class="w-12 h-12 transition-transform duration-300 group-hover:scale-110" />
            <span class="hidden sm:block font-bold text-lg transition-colors duration-300"
              :class="isScrolled ? 'text-primary-700' : 'text-white'">
              TPQ AMANAH
            </span>
          </router-link>

          <!-- Desktop Navigation -->
          <nav class="hidden lg:flex items-center gap-8">
            <a v-for="link in navLinks" :key="link.href" :href="link.href"
              :target="link.external ? '_blank' : undefined" :rel="link.external ? 'noopener noreferrer' : undefined"
              @click="link.external ? null : scrollToSection($event, link.href)"
              class="nav-link flex items-center gap-1.5 transition-colors duration-300 font-medium" :class="[
                isScrolled
                  ? (activeSection === link.section ? 'text-primary-600 font-semibold' : 'text-gray-600 hover:text-primary-500')
                  : (activeSection === link.section ? 'text-accent-300 font-semibold' : 'text-white/90 hover:text-accent-300')
              ]">
              <svg v-if="link.external" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {{ link.label }}
            </a>

            <router-link v-if="isAuthenticated" to="/dashboard" class="btn-accent px-5 py-2.5 text-sm">
              Dashboard
            </router-link>
            <router-link v-else to="/login" class="btn-accent px-5 py-2.5 text-sm">
              Login
            </router-link>
          </nav>

          <!-- Mobile Menu Button -->
          <button @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="lg:hidden p-2 rounded-xl transition-all duration-300"
            :class="isScrolled ? 'bg-primary-50 text-primary-600' : 'bg-white/20 text-white'">
            <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-4">
        <div v-if="isMobileMenuOpen"
          class="lg:hidden mt-3 bg-white/95 backdrop-blur-xl shadow-xl border-t border-gray-100"
          :class="isScrolled ? 'rounded-xl mx-2' : 'rounded-b-2xl'">
          <nav class="px-4 py-6 space-y-2">
            <a v-for="link in navLinks" :key="link.href" :href="link.href"
              :target="link.external ? '_blank' : undefined" :rel="link.external ? 'noopener noreferrer' : undefined"
              @click="link.external ? (isMobileMenuOpen = false) : scrollToSection($event, link.href)"
              class="flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors"
              :class="activeSection === link.section ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'">
              <svg v-if="link.external" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {{ link.label }}
            </a>
            <div class="pt-4 border-t border-gray-100">
              <router-link v-if="isAuthenticated" to="/dashboard" @click="isMobileMenuOpen = false"
                class="block w-full btn-accent py-3 text-center">
                Dashboard
              </router-link>
              <router-link v-else to="/login" @click="isMobileMenuOpen = false"
                class="block w-full btn-accent py-3 text-center">
                Login
              </router-link>
            </div>
          </nav>
        </div>
      </Transition>
    </header>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

const logoUrl = new URL('@/assets/logo.png', import.meta.url).href

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const activeSection = ref('beranda')

const navLinks = [
  { href: '#beranda', label: 'Beranda', section: 'beranda' },
  { href: '#tentang', label: 'Tentang Kami', section: 'tentang' },
  { href: '#pengajar', label: 'Pengajar', section: 'pengajar' },
  { href: '#kontak', label: 'Kontak', section: 'kontak' },
  { href: '#at-tartil', label: 'At-Tartil', section: 'at-tartil' }
]

let observer = null

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

const scrollToSection = (event, href) => {
  event.preventDefault()
  isMobileMenuOpen.value = false

  if (href === '#beranda') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  const element = document.querySelector(href)
  if (element) {
    const offset = 80 // Navbar height
    const top = element.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

const setupScrollSpy = () => {
  const sections = document.querySelectorAll('section[id]')

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeSection.value = entry.target.id
      }
    })
  }, {
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  })

  sections.forEach(section => observer.observe(section))
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  // Small delay to ensure DOM is ready
  setTimeout(setupScrollSpy, 100)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.navbar-floating {
  position: relative;
}

.navbar-floating::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  padding: 1.5px;
  background: linear-gradient(135deg,
      rgba(16, 185, 129, 0.6),
      rgba(5, 150, 105, 0.3),
      rgba(255, 255, 255, 0.2),
      rgba(5, 150, 105, 0.3),
      rgba(16, 185, 129, 0.6));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
</style>
