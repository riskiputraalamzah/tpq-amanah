<template>
  <div
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
    :class="isScrolled ? 'px-4 md:px-8 pt-3' : 'px-0 pt-0'"
  >
    <header
      class="transition-all duration-500"
      :class="
        isScrolled
          ? 'bg-[#03291d]/90 backdrop-blur-xl shadow-[0_14px_36px_-10px_rgba(0,0,0,0.45)] rounded-2xl py-3 navbar-floating'
          : 'bg-transparent py-4 rounded-none'
      "
    >
      <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <router-link to="/" class="flex items-center gap-3 group">
            <img
              :src="logoUrl"
              alt="TPQ AMANAH"
              class="w-12 h-12 transition-transform duration-300 group-hover:scale-110"
            />
            <span class="hidden text-lg font-bold text-white sm:block">
              TPQ AMANAH
            </span>
          </router-link>

          <!-- Desktop Navigation -->
          <nav class="items-center hidden gap-3 lg:flex xl:gap-4">
            <template v-for="link in navLinks" :key="link.href || link.to">
              <router-link
                v-if="link.to"
                :to="link.to"
                @mouseenter="prefetchGalleryArchive"
                @touchstart.passive="prefetchGalleryArchive"
                @click="onRouteLinkClick(link.to)"
                class="flex items-center gap-1 text-[13px] xl:text-sm font-medium transition-colors duration-300 nav-link whitespace-nowrap rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80"
                :class="[
                  isLinkActive(link)
                    ? 'text-accent-300 font-semibold'
                    : 'text-white/85 hover:text-accent-300',
                ]"
              >
                {{ link.label }}
              </router-link>
              <a
                v-else
                :href="link.href"
                :target="link.external ? '_blank' : undefined"
                :rel="link.external ? 'noopener noreferrer' : undefined"
                @click="link.external ? null : scrollToSection($event, link.href)"
                class="flex items-center gap-1 text-[13px] xl:text-sm font-medium transition-colors duration-300 nav-link whitespace-nowrap rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80"
                :class="[
                  isLinkActive(link)
                    ? 'text-accent-300 font-semibold'
                    : 'text-white/85 hover:text-accent-300',
                ]"
              >
                <svg
                  v-if="link.external"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                {{ link.label }}
              </a>
            </template>

            <div
              class="flex items-center gap-2 pl-2 border-l border-amber-200/20"
            >
              <router-link
                to="/wali"
                class="px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold whitespace-nowrap border border-amber-200/40 bg-white/10 text-amber-100 hover:bg-white/20 hover:border-amber-200/70 transition-colors"
              >
                Portal Wali
              </router-link>
              <router-link
                v-if="isAuthenticated"
                to="/dashboard"
                class="px-4 py-2 text-xs btn-accent xl:text-sm whitespace-nowrap"
              >
                Dashboard
              </router-link>
              <router-link
                v-else
                to="/login"
                class="px-4 py-2 text-xs btn-accent xl:text-sm whitespace-nowrap"
              >
                Login Asatidz/ah
              </router-link>
            </div>
          </nav>

          <!-- Mobile Actions: Quick Portal Wali + Hamburger -->
          <div class="flex items-center gap-2 lg:hidden">
            <router-link
              to="/wali"
              class="inline-flex items-center min-h-[40px] px-3 rounded-xl text-xs font-bold whitespace-nowrap border border-amber-200/45 bg-white/10 text-amber-100 hover:bg-white/20 transition-colors"
            >
              Portal Wali
            </router-link>
            <button
              type="button"
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              :aria-expanded="isMobileMenuOpen"
              aria-label="Menu navigasi"
              class="p-2.5 rounded-xl transition-all duration-300"
              :class="
                isScrolled ? 'bg-white/10 text-white' : 'bg-white/20 text-white'
              "
            >
              <svg
                v-if="!isMobileMenuOpen"
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                v-else
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-4 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-4 opacity-0"
      >
        <div
          v-if="isMobileMenuOpen"
          class="lg:hidden mt-3 bg-[#03291d]/95 backdrop-blur-xl shadow-xl border border-amber-200/20 max-h-[calc(100dvh-6.5rem)] overflow-y-auto overscroll-contain"
          :class="isScrolled ? 'rounded-xl mx-2' : 'rounded-b-2xl'"
        >
          <nav class="px-4 py-6 space-y-2">
            <template v-for="link in navLinks" :key="link.href || link.to">
              <router-link
                v-if="link.to"
                :to="link.to"
                @touchstart.passive="prefetchGalleryArchive"
                @click="onRouteLinkClick(link.to)"
                class="flex items-center gap-2 px-4 py-3 font-medium transition-colors rounded-xl"
                :class="
                  isLinkActive(link)
                    ? 'bg-white/10 text-accent-300'
                    : 'text-white/85 hover:bg-white/10 hover:text-accent-300'
                "
              >
                {{ link.label }}
              </router-link>
              <a
                v-else
                :href="link.href"
                :target="link.external ? '_blank' : undefined"
                :rel="link.external ? 'noopener noreferrer' : undefined"
                @click="
                  link.external
                    ? (isMobileMenuOpen = false)
                    : scrollToSection($event, link.href)
                "
                class="flex items-center gap-2 px-4 py-3 font-medium transition-colors rounded-xl"
                :class="
                  isLinkActive(link)
                    ? 'bg-white/10 text-accent-300'
                    : 'text-white/85 hover:bg-white/10 hover:text-accent-300'
                "
              >
                <svg
                  v-if="link.external"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                {{ link.label }}
              </a>
            </template>
            <div
              class="pt-4 border-t border-amber-200/15 grid grid-cols-2 gap-2.5"
            >
              <router-link
                to="/wali"
                @click="isMobileMenuOpen = false"
                class="inline-flex items-center justify-center px-3 py-3 text-sm font-bold text-center border rounded-xl border-amber-200/40 bg-white/10 text-amber-100 hover:bg-white/20"
              >
                Portal Wali
              </router-link>
              <router-link
                v-if="isAuthenticated"
                to="/dashboard"
                @click="isMobileMenuOpen = false"
                class="block w-full py-3 text-sm text-center btn-accent"
              >
                Dashboard
              </router-link>
              <router-link
                v-else
                to="/login"
                @click="isMobileMenuOpen = false"
                class="block w-full py-3 text-sm text-center btn-accent"
              >
                Login Asatidz/ah
              </router-link>
            </div>
          </nav>
        </div>
      </Transition>
    </header>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);

const logoUrl = new URL("@/assets/logo-sm.png", import.meta.url).href;

const isScrolled = ref(false);
const isMobileMenuOpen = ref(false);
const activeSection = ref(route.path === "/" ? "beranda" : "");

const navLinks = [
  { href: "#beranda", label: "Beranda", section: "beranda" },
  { href: "#pendaftaran", label: "Pendaftaran", section: "pendaftaran" },
  { href: "#keunggulan", label: "Keunggulan", section: "keunggulan" },
  { href: "#program", label: "Program", section: "program" },
  { href: "#at-tartil", label: "E-Kitab", section: "at-tartil" },
  { href: "#jadwal", label: "Jadwal", section: "jadwal" },
  { to: "/dokumentasi", label: "Dokumentasi", section: "dokumentasi" },
  { href: "#kontak", label: "Kontak", section: "kontak" },
];

let archivePrefetched = false;
const prefetchGalleryArchive = () => {
  if (archivePrefetched) return;
  archivePrefetched = true;
  import("@/views/GalleryArchiveView.vue").catch(() => {});
};

const isLinkActive = (link) => {
  if (link.to === "/dokumentasi") {
    return (
      route.path === "/dokumentasi" ||
      route.path.startsWith("/dokumentasi/") ||
      (route.path === "/" && activeSection.value === "dokumentasi")
    );
  }
  return route.path === "/" && activeSection.value === link.section;
};

const onRouteLinkClick = (to) => {
  isMobileMenuOpen.value = false;
  if (route.path === to) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

let observer = null;

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

const scrollToSection = (event, href) => {
  event.preventDefault();
  isMobileMenuOpen.value = false;

  if (route.path !== "/") {
    router.push(href === "#beranda" ? "/" : { path: "/", hash: href });
    return;
  }

  if (href === "#beranda") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const element = document.querySelector(href);
  if (element) {
    const offset = 120; // Generous offset to ensure title is fully below floating navbar
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
};

const setupScrollSpy = () => {
  if (route.path !== "/") return;
  const selectors = [...navLinks.map((l) => l.href).filter(Boolean), "#dokumentasi"];
  const sections = selectors
    .map((sel) => document.querySelector(sel))
    .filter(Boolean);

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      });
    },
    {
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    },
  );

  sections.forEach((section) => observer.observe(section));
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  // Small delay to ensure DOM is ready
  setTimeout(setupScrollSpy, 100);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.navbar-floating {
  position: relative;
}

.navbar-floating::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  padding: 1.5px;
  background: linear-gradient(
    135deg,
    rgba(252, 211, 77, 0.55),
    rgba(252, 211, 77, 0.12),
    rgba(255, 255, 255, 0.14),
    rgba(252, 211, 77, 0.12),
    rgba(252, 211, 77, 0.55)
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
</style>
