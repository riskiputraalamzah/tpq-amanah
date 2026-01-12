<template>
  <header 
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg py-3' : 'bg-transparent py-4'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3 group">
          <img 
            :src="logoUrl" 
            alt="TPQ AMANAH" 
            class="w-12 h-12 transition-transform duration-300 group-hover:scale-110"
          />
          <span 
            class="hidden sm:block font-bold text-lg transition-colors duration-200"
            :class="isScrolled ? 'text-primary-700' : 'text-white'"
          >
            TPQ AMANAH
          </span>
        </router-link>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center gap-8">
          <a 
            v-for="link in navLinks" 
            :key="link.href"
            :href="link.href" 
            @click="scrollToSection($event, link.href)"
            class="nav-link"
            :class="[
              isScrolled ? 'text-gray-700 hover:text-primary-500' : 'text-white/90 hover:text-accent-300',
              activeSection === link.section ? (isScrolled ? 'active' : '') : ''
            ]"
          >
            {{ link.label }}
          </a>
          
          <router-link 
            v-if="isAuthenticated" 
            to="/dashboard" 
            class="btn-primary px-5 py-2.5 text-sm"
          >
            Dashboard
          </router-link>
          <router-link 
            v-else 
            to="/login" 
            class="btn-primary px-5 py-2.5 text-sm"
          >
            Login
          </router-link>
        </nav>

        <!-- Mobile Menu Button -->
        <button 
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="lg:hidden p-2 rounded-xl transition-all duration-200"
          :class="isScrolled ? 'bg-primary-100 text-primary-600' : 'bg-white/20 text-white'"
        >
          <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div 
        v-if="isMobileMenuOpen" 
        class="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl shadow-xl border-t border-gray-100"
      >
        <nav class="max-w-7xl mx-auto px-4 py-6 space-y-2">
          <a 
            v-for="link in navLinks" 
            :key="link.href"
            :href="link.href" 
            @click="scrollToSection($event, link.href)"
            class="block px-4 py-3 rounded-xl font-medium transition-colors"
            :class="activeSection === link.section ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'"
          >
            {{ link.label }}
          </a>
          <div class="pt-4 border-t border-gray-100">
            <router-link 
              v-if="isAuthenticated" 
              to="/dashboard" 
              @click="isMobileMenuOpen = false"
              class="block w-full btn-primary py-3 text-center"
            >
              Dashboard
            </router-link>
            <router-link 
              v-else 
              to="/login" 
              @click="isMobileMenuOpen = false"
              class="block w-full btn-primary py-3 text-center"
            >
              Login
            </router-link>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
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
  { href: '#kontak', label: 'Kontak', section: 'kontak' }
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
