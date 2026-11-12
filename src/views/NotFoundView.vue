<template>
  <main class="not-found lp">
    <section class="not-found-card">
      <p class="not-found-code" aria-hidden="true">404</p>
      <OrnamentRule class="not-found-rule" />
      <h1>Halaman tidak ditemukan</h1>
      <p class="not-found-text">
        Alamat yang Anda buka tidak ada atau sudah dipindahkan. Silakan kembali ke beranda.
      </p>
      <router-link to="/" class="not-found-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Kembali ke Beranda
      </router-link>
    </section>
  </main>
</template>

<script setup>
import OrnamentRule from "@/components/landing/OrnamentRule.vue";
import "@/styles/landing.css";
</script>

<style scoped>
/* Same mihrab language as login: emerald ground, ivory arch card, gold hairline */
.not-found {
  position: relative;
  isolation: isolate;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(120% 90% at 50% 0%, var(--lp-emerald-1) 0%, var(--lp-emerald-0) 60%, var(--lp-emerald-2) 100%);
}

.not-found::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: var(--lp-khatam-gold);
  background-size: 64px 64px;
  background-position: center top;
  opacity: 0.07;
  -webkit-mask-image: linear-gradient(180deg, #000, transparent 70%);
  mask-image: linear-gradient(180deg, #000, transparent 70%);
}

.not-found-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: min(100%, 440px);
  padding: 3.25rem 2rem 2.25rem;
  border-radius: 10rem 10rem 1.5rem 1.5rem;
  border: 1px solid rgba(252, 211, 77, 0.5);
  background: var(--lp-ivory);
  box-shadow: 0 40px 70px -30px rgba(0, 0, 0, 0.65), 0 0 0 6px rgba(252, 211, 77, 0.06);
  text-align: center;
}

.not-found-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: var(--lp-khatam-brown);
  background-size: 64px 64px;
  background-position: center top;
  opacity: 0.06;
  -webkit-mask-image: linear-gradient(180deg, #000, transparent 50%);
  mask-image: linear-gradient(180deg, #000, transparent 50%);
}

.not-found-card::after {
  content: "";
  position: absolute;
  inset: 7px;
  border-radius: 9.6rem 9.6rem 1.15rem 1.15rem;
  border: 1px solid rgba(180, 83, 9, 0.16);
  pointer-events: none;
}

.not-found-code {
  margin: 0;
  font-size: 5.5rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--lp-ink);
}

.not-found-rule {
  margin: 1rem auto 1.25rem;
}

.not-found h1 {
  margin: 0 0 0.6rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--lp-ink);
}

.not-found-text {
  margin: 0 auto 1.75rem;
  max-width: 28ch;
  color: var(--lp-body);
  line-height: 1.55;
}

.not-found-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 3rem;
  padding: 0 1.5rem;
  border-radius: 9999px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #0a5c40, #053d2c);
  box-shadow: 0 1px 2px rgba(3, 41, 29, 0.2), 0 8px 18px -8px rgba(3, 41, 29, 0.55);
  text-decoration: none;
  transition: filter 0.18s ease;
}

.not-found-btn:hover {
  filter: brightness(1.12);
}

.not-found-btn:focus-visible {
  outline: 3px solid #b45309;
  outline-offset: 2px;
}
</style>
